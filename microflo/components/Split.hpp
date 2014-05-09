class Split : public Component {
public:
    Split() : Component(outPorts, SplitPorts::OutPorts::out9+1) {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace SplitPorts;
        if (in.isData()) {
            const int first = (int)OutPorts::out1;
            const int last = (int)OutPorts::out9;
            for (MicroFlo::PortId port=first; port<=last; port++) {
                send(in, port);
            }
        }
    }
private:
    Connection outPorts[SplitPorts::OutPorts::out9+1];
};
