#include "microflo.h"

class ArduinoIO : public IO {
public:
    ArduinoIO() {}
    ~ArduinoIO() {}

    // Serial
    // TODO: support multiple serial devices
    virtual void SerialBegin(int serialDevice, int baudrate) {
        Serial.begin(baudrate);
    }
    virtual long SerialDataAvailable(int serialDevice) {
        return Serial.available();
    }
    virtual unsigned char SerialRead(int serialDevice) {
        return Serial.read();
    }
    virtual void SerialWrite(int serialDevice, unsigned char b) {
        Serial.write(b);
    }

    // Pin config
    virtual void PinSetMode(int pin, IO::PinMode mode) {
        if (mode == IO::InputPin) {
            pinMode(pin, INPUT);
        } else if (mode == IO::OutputPin) {
            pinMode(pin, OUTPUT);
        }
    }
    virtual void PinEnablePullup(int pin, bool enable) {
        digitalWrite(pin, enable ? HIGH : LOW);
    }

    // Digital
    virtual void DigitalWrite(int pin, bool val) {
        digitalWrite(pin, val);
    }
    virtual bool DigitalRead(int pin) {
        return digitalRead(pin);
    }

    // Timer
    virtual long TimerCurrentMs() {
        return millis();
    }
};


