/* microflo_component yaml
name: ToggleBoolean
description: Invert output packet everytime an input packet arrives. Output defaults to false
inports:
  in:
    type: all
    description: ""
  reset:
    type: all
    description: ""
outports:
  out:
    type: all
    description: ""
microflo_component */
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
