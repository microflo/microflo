class SerialIn : public SingleOutputComponent {
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        // FIXME: make device and baudrate configurable
        const int8_t serialDevice = -1;

        if (in.isSetup()) {
            // FIXME: do based on input data instead of hardcode
            io->SerialBegin(serialDevice, 9600);
        } else if (in.isTick()) {
            if (io->SerialDataAvailable(serialDevice) > 0) {
                const unsigned char c = io->SerialRead(serialDevice);
                send(Packet(c));
            }
        }
    }
};
