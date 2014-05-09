class Max : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace MaxPorts;
        if (in.isSetup()) {
            threshold = 0;
        } else if (port == InPorts::threshold && in.isData()) {
            threshold = in.asInteger();
        } else if (port == InPorts::in && in.isNumber()) {
            input = in.asInteger();
            send(Packet(this->_max()));
        }
    }
private:
    long _max() {
        if (input <= threshold)
            return threshold;
        else
            return input;
    }
    long threshold;
    long input;
};
