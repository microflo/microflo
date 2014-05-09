class Gate : public SingleOutputComponent {
public:
    Gate() : enabled(false), lastInput(MsgInvalid) {}

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace GatePorts;
        if (port == InPorts::in) {
            lastInput = in;
            sendIfEnabled();
        } else if (port == InPorts::enable) {
            enabled = in.asBool();
            sendIfEnabled();
        }
    }
private:
    void sendIfEnabled() {
        if (enabled && lastInput.isValid()) {
            send(lastInput);
        }
    }

    bool enabled;
    Packet lastInput;
};
