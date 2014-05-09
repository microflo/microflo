#ifdef LINUX
class RaspberryPi : public Component {
public:
    RaspberryPi() : Component(outPorts, RaspberryPiPorts::OutPorts::pin7+1) {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace RaspberryPiPorts;
        if (in.isSetup()) {
            send(Packet((long)2), OutPorts::pin3);
            send(Packet((long)3), OutPorts::pin5);
            send(Packet((long)4), OutPorts::pin7);
        }
    }
private:
    Connection outPorts[RaspberryPiPorts::OutPorts::pin7+1];
};
#else
class RaspberryPi : public DummyComponent {};
#endif
