/* microflo_component yaml
name: ToggleBoolean
description: Invert output packet everytime an input packet arrives. First output will be false
inports:
  in:
    type: bang
    description: ""
    triggering: true
  reset:
    type: bang
    description: ""
    triggering: true
outports:
  out:
    type: all
    description: ""
microflo_component */
class ToggleBoolean : public SingleOutputComponent {
public:
    ToggleBoolean()
        : currentState(true)
    {}

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace ToggleBooleanPorts;

        if (port == InPorts::in) {
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
