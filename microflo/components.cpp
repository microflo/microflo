
#include "microflo.h"
#include "components.h"

// Generic
class Forward : public Component {
public:
    virtual void process(Packet in, int port) {
        if (in.isData()) {
            send(in, port);
        }
    }
};

// FIXME: using any of these should result in error
typedef Forward DummyComponent;
class Invalid : public DummyComponent {};
class Max : public DummyComponent {};

// I/O

// IDEA: wrap all actual I/O behind an IoMaster class/interface, which can handle multiple access etc.
// This should make it possible for all components to share implementation, and hide platform specifics in master.
// Should also be possible to use as an interception point for testing

#ifdef ARDUINO
class SerialIn : public Component {
public:
    virtual void process(Packet in, int port) {

        if (in.isSetup()) {
            // FIXME: do based on input data instead of hardcode
            // FIXME: avoid doing setup multiple times
            Serial.begin(9600);
        } else if (in.isTick()) {
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

        if (in.isSetup()) {
            // FIXME: do based on input data instead of hardcode
            // FIXME: avoid doing multiple times
            Serial.begin(9600);
        } else if (in.isByte()) {
            Serial.write(in.asByte());
        } else if (in.isAscii()) {
            Serial.write(in.asAscii());
        }
    }
};

class DigitalWrite : public Component {
public:
    virtual void process(Packet in, int port) {
        // Note: have to match components.json
        const int inPort = 0;
        const int pinConfigPort = 1;
        if (in.isSetup()) {
            outPin = 13; // default
            pinMode(outPin, OUTPUT);
        } else if (port == inPort && in.isBool()) {
            digitalWrite(outPin, in.asBool());
        } else if (port == pinConfigPort && in.isNumber()) {
            outPin = in.asInteger();
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
        if (in.isSetup()) {
            setPinAndPullup(12, true); // defaults
        } else if (port == triggerPort && in.isData()) {
            bool isHigh = digitalRead(pin) == HIGH;
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
        pinMode(pin, INPUT);
        digitalWrite(pin, pullup ? HIGH : LOW);
    }
    int pin;
    bool pullup;
};

class Timer : public Component {
public:
    virtual void process(Packet in, int port) {
        const int intervalConfigPort = 0;
        if (in.isSetup()) {
            // defaults
            previousMillis = 0;
            interval = 1000;
        } else if (in.isTick()) {
            unsigned long currentMillis = millis();
            if (currentMillis - previousMillis > interval) {
                previousMillis = currentMillis;
                send(Packet());
            }
        } else if (port == intervalConfigPort && in.isData()) {
            previousMillis = millis();
            interval = in.asInteger();
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

        if (in.isSetup()) {
            // FIXME: support bracketed IPs so this can be configured
            DeviceAddress a = { 0x28, 0xAF, 0x1C, 0xB2, 0x04, 0x00, 0x00, 0x33 };
            // defaults
            updateConfig(pin, a, 10);
        } else if (port == pinConfigPort && in.isNumber()) {
            updateConfig(in.asInteger(), address, sensors.getResolution());
        } else if (port == triggerPort && in.isData()) {
            sensors.requestTemperatures();
            const float tempC = sensors.getTempC(address);
            if (tempC != -127) {
                send(Packet(tempC));
            }
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
#else
// TODO: implement host I/O components which can be used for simulation/testing
class SerialIn : public DummyComponent {};
class SerialOut : public DummyComponent {};
class DigitalWrite : public DummyComponent {};
class DigitalRead : public DummyComponent {};
class Timer : public DummyComponent {};
class ReadDallasTemperature : public DummyComponent {};
#endif // ARDUINO

class ToggleBoolean : public Component {
public:
    virtual void process(Packet in, int port) {

        if (in.isSetup()) {
            // FIXME: do based on input data instead of hardcode
            currentState = false;
        } else if (in.isData()) {
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
        if (in.isData()) {
            Packet p = Packet((bool)!in.asBool());
            send(p);
        }
    }
};

class ArduinoUno : public Component {
public:
    virtual void process(Packet in, int port) {
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
};

class HysteresisLatch : public Component
{
public:
    virtual void process(Packet in, int port) {
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
        if (in.isInteger()) {
#ifdef ARDUINO
            String s(in.asInteger(), DEC);
            send(Packet(MsgBracketStart));
            for (int i=0; i<s.length(); i++) {
                send(Packet(s.charAt(i)));
            }
            send(Packet(MsgBracketEnd));
#endif
#ifdef HOST_BUILD
            std::stringstream ss;
            ss << in.asInteger();
            std::string s = ss.str();
            send(Packet(MsgBracketStart));
            for (int i=0; i<s.size(); i++) {
                send(Packet(s[i]));
            }
            send(Packet(MsgBracketEnd));
#endif
        } else if (in.isBool()) {
            const char *s = in.asBool() ? "true" : "false";
            const int l = in.asBool() ? 4 : 5;
            send(Packet(MsgBracketStart));
            for (int i=0; i<l; i++) {
                send(Packet(s[i]));
            }
            send(Packet(MsgBracketEnd));
        } else if (in.isFloat()) {

            char s[20] = {0,};
            const int precision = 2;
            const int width = 2;
#ifdef ARDUINO
            dtostrf(in.asFloat(), width, precision, s);
#endif
#ifdef HOST_BUILD
            snprintf(s, sizeof(s), "%.2f", in.asFloat());
#endif
            send(Packet(MsgBracketStart));
            for (int i=0; i<strlen(s); i++) {
                send(Packet(s[i]));
            }
            send(Packet(MsgBracketEnd));
        }
    }
};

class Delimit : public Component {
public:
    Delimit(): startBracketRecieved(false) {}
    virtual void process(Packet in, int port) {
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

#ifdef HOST_BUILD
class ReadStdIn : public Component {
public:
    virtual void process(Packet in, int port) {
        if (in.isTick()) {
            send(Packet((char)getchar()));
        }
    }
};

class PrintStdOut : public Component {
public:
    virtual void process(Packet in, int port) {
        if (in.isByte()) {
            putchar(in.asByte());
        } else if (in.isAscii()) {
            putchar(in.asAscii());
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
#else
class ReadStdIn : public DummyComponent {};
class PrintStdOut : public DummyComponent {};
class RandomChar : public DummyComponent {};
#endif // HOST_BUILD


#include "components-gen.hpp"
