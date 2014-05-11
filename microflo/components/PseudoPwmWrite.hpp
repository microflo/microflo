class PseudoPwmWrite : public SingleOutputComponent {
public:
    PseudoPwmWrite()
        : pin(-1)
        , period(-1)
        , ontime(-1)
        , currentPeriodStart(0)
        , currentState(true)
    {}

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace PseudoPwmWritePorts;

        if (port == InPorts::period) {
            period = in.asInteger();
        } else if (port == InPorts::pin) {
            pin = in.asInteger();
            io->PinSetMode(pin, IO::OutputPin);
        } else if (port == InPorts::dutycycle) {
            ontime = (period*100)/in.asInteger();
        } else if (port == InPorts::ontime) {
            ontime = in.asInteger();
        }
        if (in.isTick()) {
            runTick(io->TimerCurrentMicros()/100);
        }
    }
private:
    void runTick(unsigned long timeMicro) {
        if (pin < 0 || period < 0 || ontime < 0) {
            return;
        }

        bool newState = currentState;
        if (currentState) {
            if (timeMicro > currentPeriodStart+ontime) {
                newState = false;
            }
        }
        if (timeMicro >= currentPeriodStart+period) {
            currentPeriodStart = timeMicro;
            newState = true;
        }

        if (ontime < 5) {
            newState = false;
        }
        if (period-ontime < 10) {
            newState = true;
        }

        if (newState != currentState) {
            io->DigitalWrite(pin, newState);
            send(newState);
            currentState = newState;
        }
    }

private:
    MicroFlo::PortId pin;
    int period; // milliseconds
    int ontime;

    unsigned long currentPeriodStart;
    bool currentState;
};
