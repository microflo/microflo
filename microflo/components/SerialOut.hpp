class SerialOut : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        // FIXME: make device and baudrate configurable
        const int8_t serialDevice = -1;

        if (in.isSetup()) {
            io->SerialBegin(serialDevice, 9600);
        } else if (in.isByte()) {
            io->SerialWrite(serialDevice, in.asByte());
        }
    }
};
