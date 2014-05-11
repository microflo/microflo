class ArduinoUno : public Component {
public:
    ArduinoUno() : Component(outPorts, ArduinoUnoPorts::OutPorts::pina5+1) {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        const MicroFlo::PortId digitalPins = 14;
        const MicroFlo::PortId analogPins = 6;
        if (in.isSetup()) {
            for (MicroFlo::PortId outPort=0; outPort < digitalPins+analogPins; outPort++) {
                // Emit 0 for A0, 1 for A1, and so on
                const long val = (outPort < digitalPins) ? outPort : outPort - digitalPins;
                send(Packet(val), outPort);
            }
        }
    }
private:
    Connection outPorts[ArduinoUnoPorts::OutPorts::pina5+1];
};
