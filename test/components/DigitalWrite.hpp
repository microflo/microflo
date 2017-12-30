/* microflo_component yaml
name: DigitalWrite
description: Write a boolean value to pin
inports:
  in:
    type: bool
    description: ""
  pin:
    type: integer
    description: ""
outports:
  out:
    type: bool
    description: ""
microflo_component */
class DigitalWrite : public SingleOutputComponent {

public:
    DigitalWrite()
        : outPin(-1)
        , currentState(false)
    {
    }

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace DigitalWritePorts;
        if (port == InPorts::in && in.isBool()) {
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
    MicroFlo::PortId outPin;
    bool currentState;
};
