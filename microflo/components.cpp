
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

#include <OneWire.h>
#include <DallasTemperature.h>

class ReadDallasTemperature : public Component {
public:
    ReadDallasTemperature()
        : pin(3) // default
        , oneWire(pin)
        , sensors(&oneWire)
    {}

    virtual void process(Packet in, int port) {
        const int triggerPort = 0;
        const int pinConfigPort = 1;

        if (in.msg == MsgSetup) {
            // FIXME: support bracketed IPs so this can be configured
            DeviceAddress a = { 0x28, 0xAF, 0x1C, 0xB2, 0x04, 0x00, 0x00, 0x33 };
            // defaults
            updateConfig(pin, a, 10);
        } else if (port == pinConfigPort && in.msg == MsgCharacter) {
            updateConfig(in.buf, address, sensors.getResolution());
        } else if (port == triggerPort && in.msg == MsgEvent) {
            sensors.requestTemperatures();
            const float tempC = sensors.getTempC(address);
            char t = tempC; // FIXME: support floats IPs
            send(Packet(t));
        }
    }
private:
    void updateConfig(int newPin, DeviceAddress &newAddress, int newResolution) {
        memcpy(address, newAddress, sizeof(DeviceAddress));
        if (newPin != pin)  {
            oneWire = OneWire(pin);
            sensors = DallasTemperature(&oneWire);
        }
        sensors.setResolution(newResolution);
    }

    int pin;
    DeviceAddress address;
    OneWire oneWire;
    DallasTemperature sensors;
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
            for (int outPort=0; outPort < digitalPins+analogPins; outPort++) {
                // Emit 0 for A0, 1 for A1, and so on
                char val = (outPort < digitalPins) ? outPort : outPort - digitalPins;
                send(Packet(val), outPort);
            }
        }
    }
};

class HysteresisLatch : public Component
{
public:
    virtual void process(Packet in, int port) {
        const int inputPort = 0;
        const int lowThresholdPort = 1;
        const int highThresholdPort = 2;

        if (in.msg == MsgSetup) {
            // defaults
            mHighThreshold = 30;
            mLowThreshold = 24;
            mCurrentState = true; // TODO: make tristate or configurable?
        } else if (port == lowThresholdPort && in.msg == MsgCharacter) {
            mLowThreshold = in.buf;
        } else if (port == highThresholdPort && in.msg == MsgCharacter) {
            mHighThreshold = in.buf;
        } else if (port == inputPort && in.msg == MsgCharacter) {
            updateValue(in.buf);
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

#ifdef HOST_BUILD
#include <stdio.h>
#include <unistd.h>
#include <time.h>
#include <stdlib.h>
#include <string.h>

#include <string>
#include <sstream>
#endif

class ToString : public Component
{
public:
    virtual void process(Packet in, int port) {

    // XXX: probably too generic a name for this component?
        if (in.msg == MsgCharacter) {
#ifdef ARDUINO
            String s(in.buf, DEC);
            for (int i=0; i<s.length(); i++) {
                send(Packet(s.charAt(i)));
            }
#endif
#ifdef HOST_BUILD
            std::stringstream ss;
            ss << in.buf;
            std::string s = ss.str();
            for (int i=0; i<s.size(); i++) {
                send(Packet(s[i]));
            }
#endif
        } else if (in.msg == MsgBoolean) {
            const char *s = in.boolean ? "true" : "false";
            const int l = in.boolean ? 4 : 5;
            for (int i=0; i<l; i++) {
                send(Packet(s[i]));
            }
        }
    }
};



#ifdef HOST_BUILD
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
    RETURN_NEW_COMPONENT(HysteresisLatch)
    RETURN_NEW_COMPONENT(ToString)
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
    RETURN_NEW_COMPONENT(ReadDallasTemperature)
#endif
        default:
        return NULL;
    }
}
