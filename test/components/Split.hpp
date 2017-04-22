/* microflo_component yaml
name: Split
description: Emit incoming packets on all output ports
inports:
  in:
    type: all
    description: ""
outports:
  out1:
    type: all
    description: ""
  out2:
    type: all
    description: ""
  out3:
    type: all
    description: ""
  out4:
    type: all
    description: ""
  out5:
    type: all
    description: ""
  out6:
    type: all
    description: ""
  out7:
    type: all
    description: ""
  out8:
    type: all
    description: ""
  out9:
    type: all
    description: ""
microflo_component */
class Split : public Component {
public:
    Split() : Component(outPorts, SplitPorts::OutPorts::out9+1) {}
    virtual void process(Packet in, MicroFlo::PortId inport) {
        using namespace SplitPorts;
        if (in.isData()) {
            const MicroFlo::PortId first = OutPorts::out1;
            const MicroFlo::PortId last = OutPorts::out9;
            for (MicroFlo::PortId port=first; port<=last; port++) {
                send(in, port);
            }
        }
    }
private:
    Connection outPorts[SplitPorts::OutPorts::out9+1];
};
