
#include "microflo.h"
#include "components.h"

// Generic
class Forward : public Component {
public:
    virtual void process(Packet in, int port) {
        if (in.msg != MsgTick && in.msg != MsgSetup) {
            send(in, port);
        }
    }
};

// I/O

#ifdef ARDUINO
class SerialIn : public Component {
public:
    virtual void process(Packet in, int port) {

        if (in.msg == MsgSetup) {
            // FIXME: do based on input data instead of hardcode
            // FIXME: avoid doing setup multiple times
            Serial.begin(9600);
        } else if (in.msg == MsgTick) {
            if (Serial.available() > 0) {
                char c = Serial.read();
                send(Packet(c));
            }
        }
    }
};

class SerialOut : public Component {
public:
    virtual void process(Packet in, int port) {

        if (in.msg == MsgSetup) {
            // FIXME: do based on input data instead of hardcode
            // FIXME: avoid doing multiple times
            Serial.begin(9600);
        } else if (in.msg == MsgCharacter) {
            Serial.write(in.buf);
        }
    }
};

class DigitalWrite : public Component {
public:
    virtual void process(Packet in, int port) {
        // Note: have to match components.json
        const int inPort = 0;
        const int pinConfigPort = 1;
        if (in.msg == MsgSetup) {
            outPin = 13; // default
            pinMode(outPin, OUTPUT);
        } else if (port == inPort && in.msg == MsgBoolean) {
            digitalWrite(outPin, in.boolean);
        } else if (port == pinConfigPort && in.msg == MsgCharacter) {
            outPin = in.buf;
            pinMode(outPin, OUTPUT);
        }
    }
private:
    int outPin;
};

class DigitalRead : public Component {
public:
    virtual void process(Packet in, int port) {
        // Note: have to match components.json
        const int triggerPort = 0;
        const int pinConfigPort = 1;
        const int pullupConfigPort = 2;
        if (in.msg == MsgSetup) {
            setPinAndPullup(12, true); // defaults
        } else if (port == triggerPort && in.msg == MsgEvent) {
            bool isHigh = digitalRead(pin) == HIGH;
            send(Packet(isHigh));
        } else if (port == pinConfigPort && in.msg == MsgCharacter) {
            setPinAndPullup(in.buf, pullup);
        } else if (port == pullupConfigPort && in.msg == MsgBoolean) {
            setPinAndPullup(pin, in.boolean);
        }
    }
private:
    void setPinAndPullup(int newPin, bool newPullup) {
        pin = newPin;
        pullup = newPullup;
        pinMode(pin, INPUT);
        digitalWrite(pin, pullup ? HIGH : LOW);
    }
    int pin;
    bool pullup;
};

class Timer : public Component {
public:
    virtual void process(Packet in, int port) {

        if (in.msg == MsgSetup) {
            previousMillis = 0;
            // FIXME: do based on input data instead of hardcode
            interval = 100;
        } else if (in.msg == MsgTick) {
            unsigned long currentMillis = millis();
            if (currentMillis - previousMillis > interval) {
                previousMillis = currentMillis;
                send(Packet(MsgEvent));
            }
        }
    }
private:
    unsigned long previousMillis;
    unsigned long interval;
};

#endif // ARDUINO

class ToggleBoolean : public Component {
public:
    virtual void process(Packet in, int port) {

        if (in.msg == MsgSetup) {
            // FIXME: do based on input data instead of hardcode
            currentState = false;
        } else if (in.msg == MsgEvent) {
            currentState = !currentState;
            send(Packet(currentState));
        }
    }
private:
    bool currentState;
};

class InvertBoolean : public Component {
public:
    virtual void process(Packet in, int port) {
        if (in.msg == MsgBoolean) {
            Packet p = Packet((bool)!in.boolean);
            send(p);
        }
    }
};

class ArduinoUno : public Component {
public:
    virtual void process(Packet in, int port) {
        const int digitalPins = 14;
        const int analogPins = 6;
        if (in.msg == MsgSetup) {
            Serial.println("Config start");
            for (int outPort=0; outPort < digitalPins+analogPins; outPort++) {
                // Emit 0 for A0, 1 for A1, and so on
                char val = (outPort < digitalPins) ? outPort : outPort - digitalPins;
                send(Packet(val), outPort);
            }
        }
    }
};



#ifdef HOST_BUILD
#include <stdio.h>
#include <unistd.h>
#include <time.h>
#include <stdlib.h>

// TODO: implement host I/O components which can be used for simulation/testing
class ReadStdIn : public Component {
public:
    virtual void process(Packet in, int port) {
        if (in.msg == MsgTick) {
            send(Packet((char)getchar()));
        }
    }
};

class PrintStdOut : public Component {
public:
    virtual void process(Packet in, int port) {
        if (in.msg == MsgCharacter) {
            putchar(in.buf);
        }
    }
};

class RandomChar : public Component {
public:
    virtual void process(Packet in, int port) {
        char c = 255 * (rand()/(RAND_MAX+1.0));
        send(Packet(c));
    }
};

#endif // HOST_BUILD


#define RETURN_NEW_COMPONENT(X) case Id##X: c = new X; c->componentId = id; return c;

Component *Component::create(ComponentId id) {

    Component *c;
    switch (id) {
    RETURN_NEW_COMPONENT(Forward)
    RETURN_NEW_COMPONENT(InvertBoolean)
    RETURN_NEW_COMPONENT(ToggleBoolean)
#ifdef HOST_BUILD
    RETURN_NEW_COMPONENT(PrintStdOut)
    RETURN_NEW_COMPONENT(ReadStdIn)
    RETURN_NEW_COMPONENT(RandomChar)
#endif
#ifdef ARDUINO
    RETURN_NEW_COMPONENT(DigitalWrite)
    RETURN_NEW_COMPONENT(DigitalRead)
    RETURN_NEW_COMPONENT(ArduinoUno)
    RETURN_NEW_COMPONENT(Timer)
    RETURN_NEW_COMPONENT(SerialIn)
    RETURN_NEW_COMPONENT(SerialOut)
#endif
        default:
        return NULL;
    }
}
