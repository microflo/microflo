// Functor for PureFunctionComponent1
struct BoolToIntF {
    Packet operator() (Packet in) { return Packet((long)(in.asBool() ? 1 : 0)); }
};

class BoolToInt : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        if (in.isBool()) {
            send(BoolToIntF()(in));
        }
    }
};
