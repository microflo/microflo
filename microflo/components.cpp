/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 *
 * Note: Some libraries used in components may be of different license.
 */

#include "microflo.h"
#include "components.h"

#include "components-gen-top.hpp"

// FIXME: using any of these should result in error
class DummyComponent : public Component {
public:
    DummyComponent() : Component(0, 0) {}
    virtual void process(Packet in, int port) {
        // NOOP
    }
};
class Invalid : public DummyComponent {};
class Max : public DummyComponent {};

class SingleOutputComponent : public Component {
public:
    SingleOutputComponent() : Component(connections, 1) {}
private:
    Connection connections[1];
};

// Generic
class Forward : public SingleOutputComponent {
public:
    virtual void process(Packet in, int port) {
        if (in.isData()) {
            send(in, port);
        }
    }
};

class Split : public Component {
public:
    Split() : Component(outPorts, SplitPorts::OutPorts::out9+1) {}
    virtual void process(Packet in, int port) {
        using namespace SplitPorts;
        if (in.isData()) {
            const int first = (int)OutPorts::out1;
            const int last = (int)OutPorts::out9;
            for (int port=first; port<=last; port++) {
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

class SerialOut : public SingleOutputComponent {
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

class DigitalWrite : public SingleOutputComponent {
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

class DigitalRead : public SingleOutputComponent {
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


class MonitorPin : public SingleOutputComponent {
public:
    virtual void process(Packet in, int port) {
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
            io->PinEnablePullup(pin, true);
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
    virtual void process(Packet in, int port) {
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
    virtual void process(Packet in, int port) {
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
    virtual void process(Packet in, int port) {
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

class Timer : public SingleOutputComponent {
public:
    virtual void process(Packet in, int port) {
        using namespace TimerPorts;
        if (in.isSetup()) {
            // defaults
            previousMillis = 0;
            interval = 1000;
            enabled = false;
        } else if (in.isTick()) {
            unsigned long currentMillis = io->TimerCurrentMs();
            if (currentMillis - previousMillis > interval) {
                previousMillis = currentMillis;
                if (enabled) {
                    send(Packet());
                }
            }
        } else if (port == InPorts::interval && in.isData()) {
            previousMillis = io->TimerCurrentMs();
            interval = in.asInteger();
        } else if (port == InPorts::enable && in.isData()) {
            enabled = in.asBool();
        } else if (port == InPorts::reset && in.isData()) {
            previousMillis = io->TimerCurrentMs();
        }
    }
private:
    bool enabled;
    unsigned long previousMillis;
    unsigned long interval;
};

#ifdef HAVE_DALLAS_TEMPERATURE
#include <OneWire.h>
#include <DallasTemperature.h>

class ReadDallasTemperature : public SingleOutputComponent {
public:
    ReadDallasTemperature()
        : pin(-1) // default
        , addressIndex(0)
    {}

    virtual void process(Packet in, int port) {
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
    DeviceAddress address;
    OneWire oneWire;
    DallasTemperature sensors;
};
#else
class ReadDallasTemperature : public DummyComponent {};
#endif

class ToggleBoolean : public SingleOutputComponent {
public:
    virtual void process(Packet in, int port) {
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
    virtual void process(Packet in, int port) {
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

    virtual void process(Packet in, int port) {
        if (in.isData() && port <= 1) {
            lastState[port] = in.asBool();
            send((lastState[0] || lastState[1]) ? Packet((bool)true) : Packet((bool)false));
        }
    }
private:
    bool lastState[2];
};

class ArduinoUno : public Component {
public:
    ArduinoUno() : Component(outPorts, ArduinoUnoPorts::OutPorts::pina5+1) {}
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
private:
    Connection outPorts[ArduinoUnoPorts::OutPorts::pina5+1];
};

class HysteresisLatch : public SingleOutputComponent
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
#include <time.h>
#include <stdlib.h>
#include <string.h>

#include <string>
#include <sstream>
#endif

// IDEA: ability to express components as finite state machines using a DSL and/or GUI
class BreakBeforeMake : public Component
{
public:
    BreakBeforeMake()
        : Component(outPorts, BreakBeforeMakePorts::OutPorts::out2+1)
        , state(Init)
        {}
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
    Connection outPorts[BreakBeforeMakePorts::OutPorts::out2+1];
};

class Delimit : public SingleOutputComponent {
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


class Count : public SingleOutputComponent {
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

class Gate : public SingleOutputComponent {
public:
    Gate() : enabled(false), lastInput(MsgInvalid) {}

    virtual void process(Packet in, int port) {
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

    Packet lastInput;
    bool enabled;
};

class Route : public SingleOutputComponent {

public:
    Route() : activePort(0) {
        for (int i=0; i<RoutePorts::InPorts::in9; i++) {
            lastPackets[i] = Packet(MsgInvalid);
        }
    }

    virtual void process(Packet in, int port) {
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

#include "components-gen-bottom.hpp"
