/* microflo_component yaml
name: Timer
description: "Emit a packet every @interval milliseconds"
inports:
  interval:
    type: integer
    description: ""
    default: 1000
  reset:
    type: bang
    description: ""
outports:
  out:
    type: all
    description: ""
    generating: true
microflo_component */
class Timer : public SingleOutputComponent {
public:
    Timer()
        : previousMillis(0)
        , interval(1000)
    {}

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace TimerPorts;
        if (in.isTick()) {
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
