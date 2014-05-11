class DigitalRead : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        // Note: have to match components.json
        const int triggerPort = 0;
        const int pinConfigPort = 1;
        const int pullupConfigPort = 2;
        if (in.isSetup()) {
            setPinAndPullup(12, true); // defaults
        } else if (port == triggerPort && in.isData()) {
            bool isHigh = io->DigitalRead(pin);
            send(Packet(isHigh));
        } else if (port == pinConfigPort && in.isNumber()) {
            setPinAndPullup(in.asInteger(), pullup);
        } else if (port == pullupConfigPort && in.isBool()) {
            setPinAndPullup(pin, in.asBool());
        }
    }
private:
    void setPinAndPullup(int newPin, bool newPullup) {
        pin = newPin;
        pullup = newPullup;
        io->PinSetMode(pin, IO::InputPin);
        io->PinSetPullup(pin, pullup ? IO::PullUp : IO::PullNone);
    }
    MicroFlo::PortId pin;
    bool pullup;
};
