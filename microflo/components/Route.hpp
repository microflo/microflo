class Route : public SingleOutputComponent {

public:
    Route() : activePort(0) {
        for (MicroFlo::PortId i=0; i<RoutePorts::InPorts::in9; i++) {
            lastPackets[i] = Packet(MsgInvalid);
        }
    }

    virtual void process(Packet in, MicroFlo::PortId port) {
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
    MicroFlo::PortId activePort;
};
