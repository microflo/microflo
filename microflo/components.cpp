/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 *
 * Note: Some libraries used in components may be of different license.
 */

#include "microflo.h"
#include "components.h"

#include "components-gen-top.hpp"


#ifdef HAVE_DALLAS_TEMPERATURE
#include <OneWire.h>
#include <DallasTemperature.h>
#endif

#ifdef HAVE_ADAFRUIT_NEOPIXEL
#include <Adafruit_NeoPixel.h>
#endif
#ifdef HAVE_ADAFRUIT_WS2801
#include <Adafruit_WS2801.h>
#endif

#ifdef HOST_BUILD
#include <stdio.h>
#include <time.h>
#include <stdlib.h>
#include <string.h>
#include <string>
#include <sstream>
#endif

#ifdef TARGET_LPC1768
#include <mbed.h>
#endif

namespace Components {


// FIXME: using any of these should result in error
class DummyComponent : public Component {
public:
    DummyComponent() : Component(0, 0) {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        MICROFLO_DEBUG(network, DebugLevelError, DebugInvalidComponentUsed);
    }
};
class Invalid : public DummyComponent {};
class _Max : public DummyComponent {};

class SingleOutputComponent : public Component {
public:
    SingleOutputComponent() : Component(connections, 1) {}
private:
    Connection connections[1];
};

// Generic
class Forward : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        if (in.isData()) {
            send(in, port);
        }
    }
};

class Split : public Component {
public:
    Split() : Component(outPorts, SplitPorts::OutPorts::out9+1) {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace SplitPorts;
        if (in.isData()) {
            const int first = (int)OutPorts::out1;
            const int last = (int)OutPorts::out9;
            for (MicroFlo::PortId port=first; port<=last; port++) {
                send(in, port);
            }
        }
    }
private:
    Connection outPorts[SplitPorts::OutPorts::out9+1];
};


// I/O
class SerialIn : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        // FIXME: make device and baudrate configurable
        const int serialDevice = -1;

        if (in.isSetup()) {
            // FIXME: do based on input data instead of hardcode
            io->SerialBegin(serialDevice, 9600);
        } else if (in.isTick()) {
            if (io->SerialDataAvailable(serialDevice) > 0) {
                char c = io->SerialRead(serialDevice);
                send(Packet(c));
            }
        }
    }
};

class SerialOut : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        // FIXME: make device and baudrate configurable
        const int serialDevice = -1;

        if (in.isSetup()) {
            io->SerialBegin(serialDevice, 9600);
        } else if (in.isByte()) {
            io->SerialWrite(serialDevice, in.asByte());
        } else if (in.isAscii()) {
            io->SerialWrite(serialDevice, in.asAscii());
        }
    }
};

class DigitalWrite : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace DigitalWritePorts;
        if (in.isSetup()) {
            outPin = -1;
            currentState = false;
        } else if (port == InPorts::in && in.isBool()) {
            currentState = in.asBool();
            if (outPin >= 0) {
                io->DigitalWrite(outPin, currentState);
                send(in, OutPorts::out);
            }
        } else if (port == InPorts::pin && in.isNumber()) {
            outPin = in.asInteger();
            io->PinSetMode(outPin, IO::OutputPin);
            if (outPin >= 0) {
                io->DigitalWrite(outPin, currentState);
                send(in, OutPorts::out);
            }
        }
    }
private:
    int outPin;
    bool currentState;
};

class DigitalRead : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        // Note: have to match components.json
        const int triggerPort = 0;
        const int pinConfigPort = 1;
        const int pullupConfigPort = 2;
        if (in.isSetup()) {
            setPinAndPullup(12, true); // defaults
        } else if (port == triggerPort && in.isData()) {
            bool isHigh = io->DigitalRead(pin);
            send(Packet(isHigh));
        } else if (port == pinConfigPort && in.isNumber()) {
            setPinAndPullup(in.asInteger(), pullup);
        } else if (port == pullupConfigPort && in.isBool()) {
            setPinAndPullup(pin, in.asBool());
        }
    }
private:
    void setPinAndPullup(int newPin, bool newPullup) {
        pin = newPin;
        pullup = newPullup;
        io->PinSetMode(pin, IO::InputPin);
        io->PinSetPullup(pin, pullup ? IO::PullUp : IO::PullNone);
    }
    int pin;
    bool pullup;
};


class MonitorPin : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace MonitorPinPorts;
        if (port == InPorts::pin) {
            pin = in.asInteger();
            // FIXME: report error when attempting to use pin without interrupt
            // TODO: support pin mappings for other devices than than Uno/Micro
            int intr = 0;
            if (pin == 2) {
                intr = 0;
            } else if (pin == 3) {
                intr = 1;
            }
            io->PinSetPullup(pin, IO::PullUp);
            io->AttachExternalInterrupt(intr, IO::Interrupt::OnChange, interrupt, this);
            send(Packet(io->DigitalRead(pin)));
        }
    }
private:
    static void interrupt(void *user) {
        MonitorPin *thisptr = static_cast<MonitorPin *>(user);
        thisptr->send(Packet(thisptr->io->DigitalRead(thisptr->pin)));
    }
    int pin;
};


class PwmWrite : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace PwmWritePorts;
        if (in.isSetup()) {
            // no defaults
        } else if (port == InPorts::dutycycle && in.isData()) {
            io->PwmWrite(outPin, in.asInteger());
            send(in, OutPorts::out);
        } else if (port == InPorts::pin && in.isNumber()) {
            outPin = in.asInteger();
            io->PinSetMode(outPin, IO::OutputPin);
        }
    }
private:
    int outPin;
};

class AnalogRead : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace AnalogReadPorts;
        if (in.isSetup()) {
            // no defaults
        } else if (port == InPorts::trigger && in.isData()) {
            const long val = io->AnalogRead(pin);
            send(Packet(val));
        } else if (port == InPorts::pin && in.isNumber()) {
            pin = in.asInteger();
            io->PinSetMode(pin, IO::InputPin);
        }
    }
private:
    int pin;
};

class MapLinear : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace MapLinearPorts;
        if (in.isSetup()) {
            // no defaults
        } else if (port == InPorts::inmin && in.isData()) {
            inmin = in.asInteger();
        } else if (port == InPorts::inmax && in.isData()) {
            inmax = in.asInteger();
        } else if (port == InPorts::outmin && in.isData()) {
            outmin = in.asInteger();
        } else if (port == InPorts::outmax && in.isData()) {
            outmax = in.asInteger();
        } else if (port == InPorts::in && in.isNumber()) {
            send(Packet(map(in.asInteger())));
        }
    }
private:
    long map(long in) {
        return (in-inmin) * (outmax-outmin) / (inmax-inmin) + outmin;
    }
    long inmin;
    long inmax;
    long outmax;
    long outmin;
};

#ifdef max
#undef max
#endif
#ifdef min
#undef min
#endif
#ifdef constrain
#undef constrain
#endif

// FIXME: implement Min, Max, Constrain as generics operating on Packet
class Constrain : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace ConstrainPorts;
        if (in.isSetup()) {
            // no defaults
            lower = 0;
            upper = 0;
            input = 0;
        } else if (port == InPorts::lower && in.isData()) {
            lower = in.asInteger();
        } else if (port == InPorts::upper && in.isData()) {
            upper = in.asInteger();
        } else if (port == InPorts::in && in.isNumber()) {
            input = in.asInteger();
            send(Packet(constrain()));
        }
    }
private:
    long constrain() {
        if (input > upper)
            return upper;
        else if (input < lower)
            return lower;
        else
            return input;
    }
    long lower;
    long upper;
    long input;
};


class Min : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace MinPorts;
        if (in.isSetup()) {
            threshold = 0;
        } else if (port == InPorts::threshold && in.isData()) {
            threshold = in.asInteger();
        } else if (port == InPorts::in && in.isNumber()) {
            input = in.asInteger();
            send(Packet(min()));
        }
    }
private:
    long min() {
        if (input >= threshold)
            return threshold;
        else
            return input;
    }
    long threshold;
    long input;
};


class Max : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace MaxPorts;
        if (in.isSetup()) {
            threshold = 0;
        } else if (port == InPorts::threshold && in.isData()) {
            threshold = in.asInteger();
        } else if (port == InPorts::in && in.isNumber()) {
            input = in.asInteger();
            send(Packet(max()));
        }
    }
private:
    long max() {
        if (input <= threshold)
            return threshold;
        else
            return input;
    }
    long threshold;
    long input;
};

class Timer : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace TimerPorts;
        if (in.isSetup()) {
            // defaults
            previousMillis = 0;
            interval = 1000;
        } else if (in.isTick()) {
            unsigned long currentMillis = io->TimerCurrentMs();
            if (currentMillis - previousMillis >= interval) {
                previousMillis = currentMillis;
                send(Packet());
            }
        } else if (port == InPorts::interval && in.isData()) {
            interval = in.asInteger();
        } else if (port == InPorts::reset && in.isData()) {
            previousMillis = io->TimerCurrentMs();
        }
    }
private:
    unsigned long previousMillis;
    unsigned long interval;
};

#ifdef HAVE_DALLAS_TEMPERATURE

class ReadDallasTemperature : public SingleOutputComponent {
public:
    ReadDallasTemperature()
        : pin(-1) // default
        , addressIndex(0)
    {}

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace ReadDallasTemperaturePorts;

        if (in.isSetup()) {
            // defaults
        } else if (port == InPorts::pin && in.isNumber()) {
            updateConfig(in.asInteger(), sensors.getResolution());
        } else if (port == InPorts::address) {
            if (in.isStartBracket()) {
                addressIndex = 0;
            } else if (in.isData()) {
                if (addressIndex < sizeof(address)) {
                    address[addressIndex++] = in.asByte();
                }
            } else if (in.isEndBracket()) {
                // ASSERT(addressIndex == sizeof(DeviceAddress));
            }

        } else if (port == InPorts::trigger && in.isData()) {
            if (addressIndex == sizeof(DeviceAddress) && sensors.getWire()) {
                sensors.requestTemperatures();
                const float tempC = sensors.getTempC(address);
                if (tempC != -127) {
                    send(Packet(tempC));
                }
            }
        }
    }
private:
    void updateConfig(int newPin, int newResolution) {
        if (newPin != pin && newPin > -1) {
            oneWire.setPin(newPin);
            sensors.setWire(&oneWire);
        }
        sensors.setResolution(newResolution);
    }

    int pin;
    int addressIndex;
    ::DeviceAddress address;
    ::OneWire oneWire;
    ::DallasTemperature sensors;
};
#else
class ReadDallasTemperature : public DummyComponent {};
#endif


#ifdef ARDUINO

// readCapacitivePin
//  Input: Arduino pin number
//  Output: A number, from 0 to 17 expressing
//          how much capacitance is on the pin
//  When you touch the pin, or whatever you have
//  attached to it, the number will get higher
//  In order for this to work now,
// The pin should have a 1+Megaohm resistor pulling
//  it up to +5v.
uint8_t readCapacitivePin(int pinToMeasure) {
  // This is how you declare a variable which
  //  will hold the PORT, PIN, and DDR registers
  //  on an AVR
  volatile uint8_t* port;
  volatile uint8_t* ddr;
  volatile uint8_t* pin;
  // Here we translate the input pin number from
  //  Arduino pin number to the AVR PORT, PIN, DDR,
  //  and which bit of those registers we care about.
  byte bitmask;
  if ((pinToMeasure >= 0) && (pinToMeasure <= 7)){
    port = &PORTD;
    ddr = &DDRD;
    bitmask = 1 << pinToMeasure;
    pin = &PIND;
  }
  if ((pinToMeasure > 7) && (pinToMeasure <= 13)){
    port = &PORTB;
    ddr = &DDRB;
    bitmask = 1 << (pinToMeasure - 8);
    pin = &PINB;
  }
  if ((pinToMeasure > 13) && (pinToMeasure <= 19)){
    port = &PORTC;
    ddr = &DDRC;
    bitmask = 1 << (pinToMeasure - 13);
    pin = &PINC;
  }
  // Discharge the pin first by setting it low and output
  *port &= ~(bitmask);
  *ddr  |= bitmask;
  delay(1);
  // Make the pin an input WITHOUT the internal pull-up on
  *ddr &= ~(bitmask);
  // Now see how long the pin to get pulled up
  int cycles = 16000;
  for(int i = 0; i < cycles; i++){
    if (*pin & bitmask){
      cycles = i;
      break;
    }
  }
  // Discharge the pin again by setting it low and output
  //  It's important to leave the pins low if you want to
  //  be able to touch more than 1 sensor at a time - if
  //  the sensor is left pulled high, when you touch
  //  two sensors, your body will transfer the charge between
  //  sensors.
  *port &= ~(bitmask);
  *ddr  |= bitmask;

  return cycles;
}

class ReadCapacitivePin : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace ReadCapacitivePinPorts;

        if (in.isSetup()) {
            currentState = false;
            pin = 1;
            touchedThreshold = 60;
        } else if (port == InPorts::trigger) {
            checkPin();
        } else if (port == InPorts::pin && in.isInteger()) {
            pin = in.asInteger();
            checkPin();
        } else if (port == InPorts::threshold && in.isInteger()) {
            touchedThreshold = in.asInteger();
            checkPin();
        }
    }
private:
    void checkPin() {
        currentState = (readCapacitivePin(pin) > touchedThreshold);
        send(Packet(currentState));
    }

private:
    bool currentState;
    int pin;
    int touchedThreshold;
};


#else
class ReadCapacitivePin : public DummyComponent {};
#endif


class ToggleBoolean : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace ToggleBooleanPorts;
        if (in.isSetup()) {
            currentState = false;
        } else if (port == InPorts::in && in.isData()) {
            currentState = !currentState;
            send(Packet(currentState));
        } else if (port == InPorts::reset) {
            currentState = false;
            send(Packet(currentState));
        }
    }
private:
    bool currentState;
};

class InvertBoolean : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        if (in.isData()) {
            Packet p = Packet((bool)!in.asBool());
            send(p);
        }
    }
};

class BooleanOr : public SingleOutputComponent {
public:
    BooleanOr() {
        lastState[0] = false;
        lastState[1] = false;
    }

    virtual void process(Packet in, MicroFlo::PortId port) {
        if (in.isData() && port <= 1) {
            lastState[port] = in.asBool();
            send((lastState[0] || lastState[1]) ? Packet((bool)true) : Packet((bool)false));
        }
    }
private:
    bool lastState[2];
};


class BooleanAnd : public SingleOutputComponent {
public:
    BooleanAnd() {
        lastState[0] = false;
        lastState[1] = false;
    }

    virtual void process(Packet in, MicroFlo::PortId port) {
        if (in.isData() && port <= 1) {
            lastState[port] = in.asBool();
            send((lastState[0] && lastState[1]) ? Packet((bool)true) : Packet((bool)false));
        }
    }
private:
    bool lastState[2];
};

class NumberEquals : public SingleOutputComponent {
public:
    NumberEquals() {
        lastA = -1;
        lastB = -1;
    }

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace NumberEqualsPorts;

        if (port == InPorts::a) {
            lastA = in.asInteger();
            checkEquals();
        } else if (port == InPorts::b) {
            lastB = in.asInteger();
            checkEquals();
        }
    }
private:
    void checkEquals() {
        send((lastA == lastB) ? Packet((bool)true) : Packet((bool)false));
    }

private:
    long lastA;
    long lastB;
};

class ArduinoUno : public Component {
public:
    ArduinoUno() : Component(outPorts, ArduinoUnoPorts::OutPorts::pina5+1) {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        const int digitalPins = 14;
        const int analogPins = 6;
        if (in.isSetup()) {
            for (int outPort=0; outPort < digitalPins+analogPins; outPort++) {
                // Emit 0 for A0, 1 for A1, and so on
                const long val = (outPort < digitalPins) ? outPort : outPort - digitalPins;
                send(Packet(val), outPort);
            }
        }
    }
private:
    Connection outPorts[ArduinoUnoPorts::OutPorts::pina5+1];
};

class HysteresisLatch : public SingleOutputComponent
{
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        const int inputPort = 0;
        const int lowThresholdPort = 1;
        const int highThresholdPort = 2;

        if (in.isSetup()) {
            // defaults
            mHighThreshold = 30;
            mLowThreshold = 24;
            mCurrentState = true; // TODO: make tristate or configurable?
        } else if (port == lowThresholdPort && in.isNumber()) {
            mLowThreshold = in.asFloat();
        } else if (port == highThresholdPort && in.isNumber()) {
            mHighThreshold = in.asFloat();
        } else if (port == inputPort && in.isNumber()) {
            updateValue(in.asFloat());
        }
    }

private:
    void updateValue(float input) {
        if (mCurrentState) {
            if (input <= mLowThreshold) {
                mCurrentState = false;
            }
        } else {
            if (input >= mHighThreshold) {
                mCurrentState = true;
            }
        }
        send(Packet(mCurrentState));
    }

private:
    float mHighThreshold;
    float mLowThreshold;
    bool mCurrentState;
};

// IDEA: ability to express components as finite state machines using a DSL and/or GUI
class BreakBeforeMake : public Component
{
public:
    BreakBeforeMake()
        : Component(outPorts, BreakBeforeMakePorts::OutPorts::out2+1)
        , state(Init)
        {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        const int inPort = 0;
        const int out1MonitorPort = 1;
        const int out2MonitorPort = 2;

        const int out1Port = 0;
        const int out2Port = 1;

        // XXX: inputs are ignored while in transition
        switch (state) {
        case Init:
            state = SettledOff;
            break;
        case WaitFor2Off:
            if (port == out2MonitorPort && !in.asBool()) {
                send(Packet((bool)true), out1Port);
                state = WaitFor1On;
            }
            break;
        case WaitFor1On:
            if (port == out1MonitorPort && in.asBool()) {
                state = SettledOff;
            }
            break;
        case SettledOff:
            if (port == inPort && in.asBool()) {
                send(Packet((bool)false), out1Port);
                state = WaitFor1Off;
            }
            break;
        case WaitFor1Off:
            if (port == out1MonitorPort && !in.asBool()) {
                send(Packet((bool)true), out2Port);
                state = WaitFor2On;
            }
            break;
        case WaitFor2On:
            if (port == out2MonitorPort && in.asBool()) {
                state = SettledOn;
            }
            break;
        case SettledOn:
            if (port == inPort && !in.asBool()) {
                send(Packet((bool)false), out2Port);
                state = WaitFor2Off;
            }
        default:
            break;
        }
    }
private:
    enum State {
        Init,
        WaitFor1On,
        WaitFor1Off,
        WaitFor2On,
        WaitFor2Off,
        SettledOn,
        SettledOff
    };

private:
    enum State state;
    Connection outPorts[BreakBeforeMakePorts::OutPorts::out2+1];
};

class Delimit : public SingleOutputComponent {
public:
    Delimit(): startBracketRecieved(false) {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        if (in.isSetup()) {
            delimiter = '\r';
        }
        if (startBracketRecieved) {
            if (in.isEndBracket()) {
                startBracketRecieved = false;
                send(Packet(delimiter));
            } else {
                send(in);
            }
        } else {
            if (in.isStartBracket()) {
                startBracketRecieved = true;
            } else if (in.isData()) {
                send(in);
                send(Packet(delimiter));
            }
        }
    }
private:
    bool startBracketRecieved;
    char delimiter;
};


class Count : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace CountPorts;
        if (in.isSetup()) {
            current = 0;
            isReset = false;
            send(Packet(current));
        } else if (port == InPorts::in) {
            if (!isReset) {
                current += 1;
                send(Packet(current));
            }
        } else if (port == InPorts::reset) {
            if (in.isBool()) {
                isReset = in.asBool();
            }
            if (isReset || in.isVoid()) {
                current = 0;
                send(Packet(current));
            }
        }
    }
private:
    long current;
    bool isReset;
};

class Gate : public SingleOutputComponent {
public:
    Gate() : enabled(false), lastInput(MsgInvalid) {}

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace GatePorts;
        if (port == InPorts::in) {
            lastInput = in;
            sendIfEnabled();
        } else if (port == InPorts::enable) {
            enabled = in.asBool();
            sendIfEnabled();
        }
    }
private:
    void sendIfEnabled() {
        if (enabled && lastInput.isValid()) {
            send(lastInput);
        }
    }

    bool enabled;
    Packet lastInput;
};

class Route : public SingleOutputComponent {

public:
    Route() : activePort(0) {
        for (int i=0; i<RoutePorts::InPorts::in9; i++) {
            lastPackets[i] = Packet(MsgInvalid);
        }
    }

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace RoutePorts;
        if (port == InPorts::port) {
            activePort = in.asInteger();
            if (activePort > 0 && activePort < InPorts::in9) {
                Packet &p = lastPackets[activePort];
                if (p.type() != MsgInvalid) {
                    send(p);
                }
            }
        } else {
            if (in.isData()) {
                lastPackets[port] = in;
                if (port == activePort) {
                    send(in);
                }
            }
        }
    }
private:
    Packet lastPackets[RoutePorts::InPorts::in9];
    int activePort;
};


class ATUSBKEY : public Component {
public:
    ATUSBKEY() : Component(outPorts, ATUSBKEYPorts::OutPorts::portf7) {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        // FIXME: separate between analog/digital capable ports (also PWM etc)
        if (in.isSetup()) {
            for (int outPort=0; outPort < ATUSBKEYPorts::OutPorts::portf7; outPort++) {
                const long val = outPort;
                send(Packet(val), outPort);
            }
        }
    }
private:
    Connection outPorts[ATUSBKEYPorts::OutPorts::portf7];
};


class RaspberryPi : public Component {
public:
    RaspberryPi() : Component(outPorts, RaspberryPiPorts::OutPorts::pin7+1) {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace RaspberryPiPorts;
        if (in.isSetup()) {
            send(Packet((long)2), OutPorts::pin3);
            send(Packet((long)3), OutPorts::pin5);
            send(Packet((long)4), OutPorts::pin7);
        }
    }
private:
    Connection outPorts[RaspberryPiPorts::OutPorts::pin7+1];
};


#ifdef TARGET_LPC1768

class MbedLPC : public Component {
public:
    MbedLPC() : Component(outPorts, MbedLPCPorts::OutPorts::pin24+1) {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace MbedLPCPorts;
        if (in.isSetup()) {
            send(Packet((long)LED1), OutPorts::led1);
            send(Packet((long)LED2), OutPorts::led2);
            send(Packet((long)LED3), OutPorts::led3);
            send(Packet((long)LED4), OutPorts::led4);
            send(Packet((long)p21), OutPorts::pin21);
            send(Packet((long)p22), OutPorts::pin22);
            send(Packet((long)p23), OutPorts::pin23);
            send(Packet((long)p24), OutPorts::pin24);
        }
    }
private:
    Connection outPorts[MbedLPCPorts::OutPorts::pin24+1];
};

#else
class MbedLPC : public DummyComponent { };
#endif


static const unsigned char max7219_characters[38][8]={
    {0x3C,0x42,0x42,0x42,0x42,0x42,0x42,0x3C},//0
    {0x10,0x18,0x14,0x10,0x10,0x10,0x10,0x10},//1
    {0x7E,0x2,0x2,0x7E,0x40,0x40,0x40,0x7E},//2
    {0x3E,0x2,0x2,0x3E,0x2,0x2,0x3E,0x0},//3
    {0x8,0x18,0x28,0x48,0xFE,0x8,0x8,0x8},//4
    {0x3C,0x20,0x20,0x3C,0x4,0x4,0x3C,0x0},//5
    {0x3C,0x20,0x20,0x3C,0x24,0x24,0x3C,0x0},//6
    {0x3E,0x22,0x4,0x8,0x8,0x8,0x8,0x8},//7
    {0x0,0x3E,0x22,0x22,0x3E,0x22,0x22,0x3E},//8
    {0x3E,0x22,0x22,0x3E,0x2,0x2,0x2,0x3E},//9

    {0x8,0x14,0x22,0x3E,0x22,0x22,0x22,0x22},//A
    {0x3C,0x22,0x22,0x3E,0x22,0x22,0x3C,0x0},//B
    {0x3C,0x40,0x40,0x40,0x40,0x40,0x3C,0x0},//C
    {0x7C,0x42,0x42,0x42,0x42,0x42,0x7C,0x0},//D
    {0x7C,0x40,0x40,0x7C,0x40,0x40,0x40,0x7C},//E
    {0x7C,0x40,0x40,0x7C,0x40,0x40,0x40,0x40},//F
    {0x3C,0x40,0x40,0x40,0x40,0x44,0x44,0x3C},//G
    {0x44,0x44,0x44,0x7C,0x44,0x44,0x44,0x44},//H
    {0x7C,0x10,0x10,0x10,0x10,0x10,0x10,0x7C},//I
    {0x3C,0x8,0x8,0x8,0x8,0x8,0x48,0x30},//J
    {0x0,0x24,0x28,0x30,0x20,0x30,0x28,0x24},//K
    {0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x7C},//L
    {0x81,0xC3,0xA5,0x99,0x81,0x81,0x81,0x81},//M
    {0x0,0x42,0x62,0x52,0x4A,0x46,0x42,0x0},//N
    {0x3C,0x42,0x42,0x42,0x42,0x42,0x42,0x3C},//O
    {0x3C,0x22,0x22,0x22,0x3C,0x20,0x20,0x20},//P
    {0x1C,0x22,0x22,0x22,0x22,0x26,0x22,0x1D},//Q
    {0x3C,0x22,0x22,0x22,0x3C,0x24,0x22,0x21},//R
    {0x0,0x1E,0x20,0x20,0x3E,0x2,0x2,0x3C},//S
    {0x0,0x3E,0x8,0x8,0x8,0x8,0x8,0x8},//T
    {0x42,0x42,0x42,0x42,0x42,0x42,0x22,0x1C},//U
    {0x42,0x42,0x42,0x42,0x42,0x42,0x24,0x18},//V
    {0x0,0x49,0x49,0x49,0x49,0x2A,0x1C,0x0},//W
    {0x0,0x41,0x22,0x14,0x8,0x14,0x22,0x41},//X
    {0x41,0x22,0x14,0x8,0x8,0x8,0x8,0x8},//Y
    {0x0,0x7F,0x2,0x4,0x8,0x10,0x20,0x7F},//Z
};

// TODO: split out some of this into parallel->serial SPI like components?
class LedMatrixMax : public SingleOutputComponent {
public:
    LedMatrixMax()
        : pin_cs(-1)
        , pin_din(-1)
        , pin_clk(-1)
        , initialized(false)
    {}

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace LedMatrixMaxPorts;
        if (port == InPorts::in) {
            if (in.isInteger() && in.asInteger() < 38) {
                charIndex = in.asInteger();
            } else if (in.isAscii()) {
                const unsigned char c = in.asAscii();
                if (c > 'A' && c <= 'Z') {
                    charIndex = 10 + c-'A';
                }
            }
            update();
        } else if (port == InPorts::pinclk) {
            pin_clk = in.asInteger();
            initialized = false;
            update();
        } else if (port == InPorts::pincs) {
            pin_cs = in.asInteger();
            initialized = false;
            update();
        } else if (port == InPorts::pindin) {
            pin_din = in.asInteger();
            initialized = false;
            update();
        }
    }
private:
    void update() {
        if (pin_cs < 0 || pin_din < 0 || pin_clk < 0) {
            return;
        }
        if (!initialized) {
            io->PinSetMode(pin_cs, IO::OutputPin);
            io->PinSetMode(pin_din, IO::OutputPin);
            io->PinSetMode(pin_clk, IO::OutputPin);
            max7219_init();
            initialized = true;
        }
        for (uint8_t i=1; i<9; i++) {
            max7219_write(i, max7219_characters[charIndex][i-1]);
        }
    }

    void max7219_write_byte(unsigned char DATA) {
       for (uint8_t i=8; i>=1; i--) {
            io->DigitalWrite(pin_clk, false);
            io->DigitalWrite(pin_din, DATA&0x80);
            io->DigitalWrite(pin_clk, true);
            DATA = DATA<<1;
       }
    }

    void max7219_write(unsigned char address, unsigned char dat) {
       io->DigitalWrite(pin_cs, false);
       max7219_write_byte(address);
       max7219_write_byte(dat);
       io->DigitalWrite(pin_cs, true);
    }

    void max7219_init() {
        max7219_write(0x09, 0x00);       // decoding: BCD
        max7219_write(0x0a, 0x03);       // brightness
        max7219_write(0x0b, 0x07);       // scanlimit: 8 leds
        max7219_write(0x0c, 0x01);       // 0=power-down,1=normal
        max7219_write(0x0f, 0x00);       // 1=test-display, 0=EOT
    }

private:
    int pin_cs;
    int pin_din;
    int pin_clk;
    bool initialized;
    uint8_t charIndex;
};



class LedChainNeoPixel : public Component {
public:
    LedChainNeoPixel()
        : Component(outPorts, 2)
        , pin(-1)
        , number(-1)
        , initialized(false)
        , currentPixelAddress(-1)
#ifdef HAVE_ADAFRUIT_NEOPIXEL
        , neoPixel(0)
#endif
    {}

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace LedChainNeoPixelPorts;
        if (port == InPorts::in) {
            if (currentPixelAddress == -1 && in.isNumber()) {
                currentPixelAddress = in.asInteger();
            } else if (currentPixelAddress != -1 && in.isInteger()) {
                updateCurrentPixel((uint32_t)in.asInteger());
                currentPixelAddress = -1;
            } else if (in.isEndBracket() || in.isStartBracket()) {
                // To recover in case someone sent us non-grouped
                // data which got us into a bogus state
                currentPixelAddress = -1;
            }
        } else if (port == InPorts::pin) {
            pin = in.asInteger();
            initialized = false;
            send(Packet(initialized), OutPorts::ready);
            tryInitialize();
        } else if (port == InPorts::pixels) {
            number = in.asInteger();
            initialized = false;
            send(Packet(initialized), OutPorts::ready);
            tryInitialize();
        } else if (port == InPorts::show) {
            if (initialized) {
#ifdef HAVE_ADAFRUIT_NEOPIXEL
                neoPixel.show();
#endif
            }
        }
    }
private:
    void tryInitialize() {
        using namespace LedChainNeoPixelPorts;

        if (initialized || number < 0 || pin < 0) {
            return;
        }
#ifdef HAVE_ADAFRUIT_NEOPIXEL
        neoPixel.setNumber(number);
        neoPixel.setPin(pin);
        neoPixel.begin();
#endif
        initialized = true;
        send(Packet(initialized), OutPorts::ready);
    }

    void updateCurrentPixel(uint32_t rgb) {
        using namespace LedChainNeoPixelPorts;
        if (!initialized || currentPixelAddress < 0
                || currentPixelAddress >= number) {
            return;
        }
#ifdef HAVE_ADAFRUIT_NEOPIXEL
        neoPixel.setPixelColor(currentPixelAddress, rgb);
#endif
        const MicroFlo::PortId p = OutPorts::pixelset;
        send(Packet(MsgBracketStart), p);
        send(Packet((long)currentPixelAddress));
        send(Packet((long)rgb));
        send(Packet(MsgBracketEnd), p);
    }

private:
    int8_t pin;
    int8_t number;
    bool initialized;
    int currentPixelAddress; // -1 means waiting for pixel index, else waiting for value
    Connection outPorts[2];
#ifdef HAVE_ADAFRUIT_NEOPIXEL
    Adafruit_NeoPixel neoPixel;
#endif
};




class LedChainWS : public Component {
public:
    LedChainWS()
        : Component(outPorts, 2)
        , pindata(-1)
        , pinclk(-1)
        , useHardwareSpi(false)
        , number(-1)
        , initialized(false)
        , currentPixelAddress(-1)
    {}

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace LedChainWSPorts;
        if (port == InPorts::in) {
            if (currentPixelAddress == -1 && in.isNumber()) {
                currentPixelAddress = in.asInteger();
            } else if (currentPixelAddress != -1 && in.isInteger()) {
                updateCurrentPixel((uint32_t)in.asInteger());
                currentPixelAddress = -1;
            } else if (in.isEndBracket() || in.isStartBracket()) {
                // To recover in case someone sent us non-grouped
                // data which got us into a bogus state
                currentPixelAddress = -1;
            }
        } else if (port == InPorts::pindata) {
            pindata = in.asInteger();
            initialized = false;
            send(Packet(initialized), OutPorts::ready);
            tryInitialize();
        } else if (port == InPorts::pinclk) {
            pinclk = in.asInteger();
            initialized = false;
            send(Packet(initialized), OutPorts::ready);
            tryInitialize();
        } else if (port == InPorts::hwspi) {
            useHardwareSpi = in.asBool();
            initialized = false;
            send(Packet(initialized), OutPorts::ready);
            tryInitialize();
        } else if (port == InPorts::pixels) {
            number = in.asInteger();
            initialized = false;
            send(Packet(initialized), OutPorts::ready);
            tryInitialize();
        } else if (port == InPorts::show) {
            if (initialized) {
#ifdef HAVE_ADAFRUIT_WS2801
                ws.show();
#endif
            }
        }
    }
private:
    void tryInitialize() {
        using namespace LedChainWSPorts;
        const bool pinConfigReady = useHardwareSpi || (pindata >= 0 && pinclk >= 0);
        if (initialized || number < 0 || !pinConfigReady) {
            return;
        }
#ifdef HAVE_ADAFRUIT_WS2801
        ws.updateLength(number);
        if (useHardwareSpi) {
            ws.updatePins();
        } else {
            ws.updatePins(pindata, pinclk);
        }
        ws.begin();
        ws.show();
#endif
        initialized = true;
        send(Packet(initialized), OutPorts::ready);
    }

    void updateCurrentPixel(uint32_t rgb) {
        using namespace LedChainWSPorts;
        if (!initialized || currentPixelAddress < 0
                || currentPixelAddress >= number) {
            return;
        }
#ifdef HAVE_ADAFRUIT_WS2801
        ws.setPixelColor(currentPixelAddress, rgb);
#endif
        const MicroFlo::PortId p = OutPorts::pixelset;
        send(Packet(MsgBracketStart), p);
        send(Packet((long)currentPixelAddress));
        send(Packet((long)rgb));
        send(Packet(MsgBracketEnd), p);
    }

private:
    int8_t pindata;
    int8_t pinclk;
    bool useHardwareSpi;
    int8_t number;
    bool initialized;
    int currentPixelAddress; // -1 means waiting for pixel index, else waiting for value
    Connection outPorts[2];
#ifdef HAVE_ADAFRUIT_WS2801
    Adafruit_WS2801 ws;
#endif
};


#ifdef STELLARIS
class TivaC : public Component {
public:
    TivaC() : Component(outPorts, TivaCPorts::OutPorts::pf7+1) {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace TivaCPorts;
        if (in.isSetup()) {
            for (int outPort=0; outPort < TivaCPorts::OutPorts::pf7; outPort++) {
                const long val = outPort;
                send(Packet(val), outPort);
            }
        }
    }
private:
    Connection outPorts[TivaCPorts::OutPorts::pf7+1];
};

#else
class TivaC : public DummyComponent { };
#endif




class PseudoPwmWrite : public SingleOutputComponent {
public:
    PseudoPwmWrite()
        : pin(-1)
        , period(-1)
        , ontime(-1)
        , currentPeriodStart(0)
        , currentState(true)
    {}

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace PseudoPwmWritePorts;

        if (port == InPorts::period) {
            period = in.asInteger();
        } else if (port == InPorts::pin) {
            pin = in.asInteger();
            io->PinSetMode(pin, IO::OutputPin);
        } else if (port == InPorts::dutycycle) {
            ontime = (period*100)/in.asInteger();
        } else if (port == InPorts::ontime) {
            ontime = in.asInteger();
        }
        if (in.isTick()) {
            runTick(io->TimerCurrentMicros()/100);
        }
    }
private:
    void runTick(unsigned long timeMicro) {
        if (pin < 0 || period < 0 || ontime < 0) {
            return;
        }

        bool newState = currentState;
        if (currentState) {
            if (timeMicro > currentPeriodStart+ontime) {
                newState = false;
            }
        }
        if (timeMicro >= currentPeriodStart+period) {
            currentPeriodStart = timeMicro;
            newState = true;
        }

        if (ontime < 5) {
            newState = false;
        }
        if (period-ontime < 10) {
            newState = true;
        }

        if (newState != currentState) {
            io->DigitalWrite(pin, newState);
            send(newState);
            currentState = newState;
        }
    }

private:
    int pin;
    int period; // milliseconds
    int ontime;

    unsigned long currentPeriodStart;
    bool currentState;
};



} // namespace Components

#include "components-gen-bottom.hpp"
