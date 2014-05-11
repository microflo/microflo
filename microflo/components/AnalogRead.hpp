class AnalogRead : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace AnalogReadPorts;
        if (in.isSetup()) {
            // no defaults
        } else if (port == InPorts::trigger && in.isData()) {
            const long val = io->AnalogRead(pin);
            send(Packet(val));
        } else if (port == InPorts::pin && in.isNumber()) {
            pin = in.asInteger();
            io->PinSetMode(pin, IO::InputPin);
        }
    }
private:
    MicroFlo::PortId pin;
};
