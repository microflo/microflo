/* microflo_component yaml
name: DigitalWrite
description: Write a boolean value to pin
inports:
  in:
    type: all
    description: ""
  pin:
    type: all
    description: ""
outports:
  out:
    type: all
    description: ""
microflo_component */
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
    MicroFlo::PortId outPin;
    bool currentState;
};
