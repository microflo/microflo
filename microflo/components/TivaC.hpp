#ifdef STELLARIS
class TivaC : public Component {
public:
    TivaC() : Component(outPorts, TivaCPorts::OutPorts::pf7+1) {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace TivaCPorts;
        if (in.isSetup()) {
            for (int outPort=0; outPort < TivaCPorts::OutPorts::pf7; outPort++) {
                const long val = outPort;
                send(Packet(val), outPort);
            }
        }
    }
private:
    Connection outPorts[TivaCPorts::OutPorts::pf7+1];
};

#else
class TivaC : public DummyComponent { };
#endif
