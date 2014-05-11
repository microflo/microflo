// IDEA: ability to express components as finite state machines using a DSL and/or GUI
class BreakBeforeMake : public Component
{
public:
    BreakBeforeMake()
        : Component(outPorts, BreakBeforeMakePorts::OutPorts::out2+1)
        , state(Init)
        {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace BreakBeforeMakePorts;

        // XXX: inputs are ignored while in transition
        switch (state) {
        case Init:
            state = SettledOff;
            break;
        case WaitFor2Off:
            if (port == InPorts::monitor2 && !in.asBool()) {
                send(Packet((bool)true), OutPorts::out1);
                state = WaitFor1On;
            }
            break;
        case WaitFor1On:
            if (port == InPorts::monitor1 && in.asBool()) {
                state = SettledOff;
            }
            break;
        case SettledOff:
            if (port == InPorts::in && in.asBool()) {
                send(Packet((bool)false), OutPorts::out1);
                state = WaitFor1Off;
            }
            break;
        case WaitFor1Off:
            if (port == InPorts::monitor1 && !in.asBool()) {
                send(Packet((bool)true), OutPorts::out2);
                state = WaitFor2On;
            }
            break;
        case WaitFor2On:
            if (port == InPorts::monitor2 && in.asBool()) {
                state = SettledOn;
            }
            break;
        case SettledOn:
            if (port == InPorts::in && !in.asBool()) {
                send(Packet((bool)false), OutPorts::out2);
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
