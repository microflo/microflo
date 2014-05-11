class MonitorPin : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace MonitorPinPorts;
        if (port == InPorts::pin) {
            pin = in.asInteger();
            // FIXME: report error when attempting to use pin without interrupt
            // TODO: support pin mappings for other devices than than Uno/Micro
            uint8_t intr = 0;
            if (pin == 2) {
                intr = 0;
            } else if (pin == 3) {
                intr = 1;
            }
            io->PinSetPullup(pin, IO::PullUp);
            io->AttachExternalInterrupt(intr, IO::Interrupt::OnChange, interrupt, this);
            send(Packet(io->DigitalRead(pin)));
        }
    }
private:
    static void interrupt(void *user) {
        MonitorPin *thisptr = static_cast<MonitorPin *>(user);
        thisptr->send(Packet(thisptr->io->DigitalRead(thisptr->pin)));
    }
    MicroFlo::PortId pin;
};
