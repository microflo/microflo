class Min : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace MinPorts;
        if (in.isSetup()) {
            threshold = 0;
        } else if (port == InPorts::threshold && in.isData()) {
            threshold = in.asInteger();
        } else if (port == InPorts::in && in.isNumber()) {
            input = in.asInteger();
            send(Packet(this->_min()));
        }
    }
private:
    long _min() {
        if (input >= threshold)
            return threshold;
        else
            return input;
    }
    long threshold;
    long input;
};
