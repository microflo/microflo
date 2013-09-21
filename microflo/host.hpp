#include "microflo.h"

// TODO: implement, not just have stubs
class HostIO : public IO {
public:
    HostIO() {}
    ~HostIO() {}

    // Serial
    virtual void SerialBegin(int serialDevice, int baudrate) {

    }
    virtual long SerialDataAvailable(int serialDevice) {
        return 0;
    }
    virtual unsigned char SerialRead(int serialDevice) {
        return '\0';
    }
    virtual void SerialWrite(int serialDevice, unsigned char b) {

    }

    // Pin config
    virtual void PinSetMode(int pin, PinMode mode) {

    }
    virtual void PinEnablePullup(int pin, bool enable) {

    }

    // Digital
    virtual void DigitalWrite(int pin, bool val) {

    }
    virtual bool DigitalRead(int pin) {
        return false;
    }

    // Timer
    virtual long TimerCurrentMs() {
        return 0;
    }
};

