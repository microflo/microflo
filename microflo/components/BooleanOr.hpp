class BooleanOr : public SingleOutputComponent {
public:
    BooleanOr() {
        lastState[0] = false;
        lastState[1] = false;
    }

    virtual void process(Packet in, MicroFlo::PortId port) {
        if (in.isData() && port <= 1) {
            lastState[port] = in.asBool();
            send((lastState[0] || lastState[1]) ? Packet((bool)true) : Packet((bool)false));
        }
    }
private:
    bool lastState[2];
};
