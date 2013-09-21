
#include "microflo.h"
#include "components.h"

#include "components-gen-top.hpp"

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
class SerialIn : public Component {
public:
    virtual void process(Packet in, int port) {
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

class SerialOut : public Component {
public:
    virtual void process(Packet in, int port) {
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

class DigitalWrite : public Component {
public:
    virtual void process(Packet in, int port) {
        using namespace DigitalWritePorts;
        if (in.isSetup()) {
            outPin = 13; // default
            io->PinSetMode(outPin, IO::OutputPin);
        } else if (port == InPorts::in && in.isBool()) {
            io->DigitalWrite(outPin, in.asBool());
            send(in, OutPorts::out);
        } else if (port == InPorts::pin && in.isNumber()) {
            outPin = in.asInteger();
            io->PinSetMode(outPin, IO::OutputPin);
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
        io->PinEnablePullup(pin, pullup);
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
            unsigned long currentMillis = io->TimerCurrentMs();
            if (currentMillis - previousMillis > interval) {
                previousMillis = currentMillis;
                send(Packet());
            }
        } else if (port == intervalConfigPort && in.isData()) {
            previousMillis = io->TimerCurrentMs();
            interval = in.asInteger();
        }
    }
private:
    unsigned long previousMillis;
    unsigned long interval;
};

#ifdef ARDUINO
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
        const int addressConfigPort = 2;

        if (in.isSetup()) {
            // defaults
            addressIndex = 0;
            updateConfig(pin, 10);
        } else if (port == pinConfigPort && in.isNumber()) {
            updateConfig(in.asInteger(), sensors.getResolution());
        } else if (port == addressConfigPort) {
            if (in.isStartBracket()) {
                addressIndex = 0;
            } else if (in.isData()) {
                if (addressIndex < sizeof(address)) {
                    address[addressIndex++] = in.asByte();
                }
            } else if (in.isEndBracket()) {
                // ASSERT(addressIndex == sizeof(DeviceAddress));
            }

        } else if (port == triggerPort && in.isData()) {
            if (addressIndex == sizeof(DeviceAddress)) {
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
        if (newPin != pin)  {
            oneWire = OneWire(pin);
            sensors = DallasTemperature(&oneWire);
        }
        sensors.setResolution(newResolution);
    }

    int pin;
    int addressIndex;
    DeviceAddress address;
    OneWire oneWire;
    DallasTemperature sensors;
};
#else
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

// IDEA: ability to express components as finite state machines using a DSL and/or GUI
class BreakBeforeMake : public Component
{
public:
    BreakBeforeMake() : state(Init) {}
    virtual void process(Packet in, int port) {
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


class Count : public Component {
public:
    virtual void process(Packet in, int port) {
        using namespace CountPorts;
        if (port == InPorts::in) {
            current += 1;
            send(Packet(current));
        } else if (port == InPorts::reset) {
            current = 0;
            send(Packet(current));
        }

    }
private:
    long current;
};

#include "components-gen-bottom.hpp"
