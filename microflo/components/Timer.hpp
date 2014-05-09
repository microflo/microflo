class Timer : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace TimerPorts;
        if (in.isSetup()) {
            // defaults
            previousMillis = 0;
            interval = 1000;
        } else if (in.isTick()) {
            unsigned long currentMillis = io->TimerCurrentMs();
            if (currentMillis - previousMillis >= interval) {
                previousMillis = currentMillis;
                send(Packet());
            }
        } else if (port == InPorts::interval && in.isData()) {
            interval = in.asInteger();
        } else if (port == InPorts::reset && in.isData()) {
            previousMillis = io->TimerCurrentMs();
        }
    }
private:
    unsigned long previousMillis;
    unsigned long interval;
};
