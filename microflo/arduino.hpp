/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 *
 * Note: Arduino is under the LGPL license.
 */

#include "microflo.h"

static const int MAX_EXTERNAL_INTERRUPTS = 3;

struct InterruptHandler {
    IOInterruptFunction func;
    void *user;
};

static InterruptHandler externalInterruptHandlers[MAX_EXTERNAL_INTERRUPTS];

static uint8_t InterruptModeToArduino(IO::Interrupt::Mode mode) {
    switch (mode) {
        case IO::Interrupt::OnChange: return CHANGE;
        case IO::Interrupt::OnLow: return LOW;
        case IO::Interrupt::OnHigh: return HIGH;
        case IO::Interrupt::OnRisingEdge: return RISING;
        case IO::Interrupt::OnFallingEdge: return FALLING;
    }
}

class ArduinoIO : public IO {
public:

    // ... Arduino interrupt API is stupid and does not provide the callback with context
    static void externalInterrupt0() {
        IOInterruptFunction f = externalInterruptHandlers[0].func;
        if (f) {
            f(externalInterruptHandlers[0].user);
        }
    }
    static void externalInterrupt1() {
        IOInterruptFunction f = externalInterruptHandlers[1].func;
        if (f) {
            f(externalInterruptHandlers[1].user);
        }
    }
    static void externalInterrupt2() {
        IOInterruptFunction f = externalInterruptHandlers[2].func;
        if (f) {
            f(externalInterruptHandlers[2].user);
        }
    }

public:
    ArduinoIO() {}
    ~ArduinoIO() {}

    // Serial
    // TODO: support multiple serial devices
    virtual void SerialBegin(int serialDevice, int baudrate) {
        Serial.begin(baudrate);
    }
    virtual long SerialDataAvailable(int serialDevice) {
        return Serial.available();
    }
    virtual unsigned char SerialRead(int serialDevice) {
        return Serial.read();
    }
    virtual void SerialWrite(int serialDevice, unsigned char b) {
        Serial.write(b);
    }

    // Pin config
    virtual void PinSetMode(int pin, IO::PinMode mode) {
        if (mode == IO::InputPin) {
            pinMode(pin, INPUT);
        } else if (mode == IO::OutputPin) {
            pinMode(pin, OUTPUT);
        }
    }
    virtual void PinEnablePullup(int pin, bool enable) {
        digitalWrite(pin, enable ? HIGH : LOW);
    }

    // Digital
    virtual void DigitalWrite(int pin, bool val) {
        digitalWrite(pin, val);
    }
    virtual bool DigitalRead(int pin) {
        return digitalRead(pin);
    }

    // Analog
    virtual long AnalogRead(int pin) {
        return analogRead(pin);
    }
    virtual void PwmWrite(int pin, long dutyPercent) {
        analogWrite(pin, (dutyPercent*255)/100); // normalize to [0..255]
    }

    // Timer
    virtual long TimerCurrentMs() {
        return millis();
    }

    virtual void AttachExternalInterrupt(int interrupt, IO::Interrupt::Mode mode, IOInterruptFunction func, void *user) {
        externalInterruptHandlers[interrupt].func = func;
        externalInterruptHandlers[interrupt].user = user;
        uint8_t m = InterruptModeToArduino(mode);
        if (interrupt == 0) {
            attachInterrupt(interrupt, externalInterrupt0, m);
        } else if (interrupt == 1) {
            attachInterrupt(interrupt, externalInterrupt1, m);
        } else if (interrupt == 2) {
            attachInterrupt(interrupt, externalInterrupt2, m);
        }
    }
};

#ifdef DEBUG
class Debugger {
public:
    static void setup(Network *network);
    static void printPacket(Packet *p);
    static void printSend(int index, Message m, Component *sender, int senderPort);
    static void printDeliver(int index, Message m);
    static void printAdd(Component *c);
    static void printConnect(Component *src, int srcPort, Component *target, int targetPort);
};

void Debugger::setup(Network *network) {
    Serial.begin(9600);
    network->setNotifications(&Debugger::printSend, &Debugger::printDeliver,
                              &Debugger::printConnect, &Debugger::printAdd);
}

// FIXME: print async, currently output gets truncated on networks with > 3 edges
void Debugger::printPacket(Packet *p) {
    Serial.print("IP(");
    Serial.print(p->type());
    Serial.print(":");
    if (p->isByte()) {
        Serial.print(p->asByte(), HEX);
    } else if (p->isAscii()) {
        Serial.print(p->asAscii());
    } else {
        // FIXME:
    }
    Serial.print(")");
}

void Debugger::printSend(int index, Message m, Component *sender, int senderPort) {
    Serial.print("SEND: ");
    Serial.print("i=");
    Serial.print(index);
    Serial.print(",");
    Serial.print("from=");
    Serial.print(sender->nodeId);
    Serial.print(",");
    Serial.print("to=");
    Serial.print(m.target->nodeId);
    Serial.print(" ");
    printPacket(&m.pkg);
    Serial.println();
}

void Debugger::printDeliver(int index, Message m) {
    Serial.print("DELIVER: ");
    Serial.print("i=");
    Serial.print(index);
    Serial.print(",");
    Serial.print("to=");
    Serial.print(m.target->nodeId);
    Serial.print(" ");
    printPacket(&m.pkg);
    Serial.println();
}

void Debugger::printAdd(Component *c) {
    Serial.print("ADD: ");
    Serial.print(c->componentId);
    Serial.print(",");
    Serial.print(c->nodeId);
    Serial.println();
}

void Debugger::printConnect(Component *src, int srcPort, Component *target, int targetPort) {
    Serial.print("CONNECT: ");
    Serial.print("src=");
    Serial.print(src->nodeId);
    Serial.print(",sPort=");
    Serial.print(srcPort);
    Serial.print(",tgt=");
    Serial.print(target->nodeId);
    Serial.print(",tPort=");
    Serial.print(targetPort);
    Serial.println();
}
#endif
