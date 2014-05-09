class ATUSBKEY : public Component {
public:
    ATUSBKEY() : Component(outPorts, ATUSBKEYPorts::OutPorts::portf7) {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        // FIXME: separate between analog/digital capable ports (also PWM etc)
        if (in.isSetup()) {
            for (int outPort=0; outPort < ATUSBKEYPorts::OutPorts::portf7; outPort++) {
                const long val = outPort;
                send(Packet(val), outPort);
            }
        }
    }
private:
    Connection outPorts[ATUSBKEYPorts::OutPorts::portf7];
};
