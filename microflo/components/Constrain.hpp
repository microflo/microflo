// FIXME: implement Min, Max, Constrain as generics operating on Packet
class Constrain : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace ConstrainPorts;
        if (in.isSetup()) {
            // no defaults
            lower = 0;
            upper = 0;
            input = 0;
        } else if (port == InPorts::lower && in.isData()) {
            lower = in.asInteger();
        } else if (port == InPorts::upper && in.isData()) {
            upper = in.asInteger();
        } else if (port == InPorts::in && in.isNumber()) {
            input = in.asInteger();
            send(Packet(this->_constrain()));
        }
    }
private:
    long _constrain() {
        if (input > upper)
            return upper;
        else if (input < lower)
            return lower;
        else
            return input;
    }
    long lower;
    long upper;
    long input;
};
