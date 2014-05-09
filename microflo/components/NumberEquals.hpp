class NumberEquals : public SingleOutputComponent {
public:
    NumberEquals() {
        lastA = -1;
        lastB = -1;
    }

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace NumberEqualsPorts;

        if (port == InPorts::a) {
            lastA = in.asInteger();
            checkEquals();
        } else if (port == InPorts::b) {
            lastB = in.asInteger();
            checkEquals();
        }
    }
private:
    void checkEquals() {
        send((lastA == lastB) ? Packet((bool)true) : Packet((bool)false));
    }

private:
    long lastA;
    long lastB;
};
