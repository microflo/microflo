class ToggleBoolean : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace ToggleBooleanPorts;
        if (in.isSetup()) {
            currentState = false;
        } else if (port == InPorts::in && in.isData()) {
            currentState = !currentState;
            send(Packet(currentState));
        } else if (port == InPorts::reset) {
            currentState = false;
            send(Packet(currentState));
        }
    }
private:
    bool currentState;
};
