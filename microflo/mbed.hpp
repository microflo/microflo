/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#include "microflo.h"

#include <mbed.h>


class MbedIO : public IO {
public:


private:
    Timer timer;
    Serial usbSerial;
public:
    MbedIO()
        : usbSerial(USBTX, USBRX)
    {
        timer.start();
    }

    // Serial
    virtual void SerialBegin(uint8_t serialDevice, int baudrate) {
        usbSerial.baud(baudrate);
    }
    virtual long SerialDataAvailable(uint8_t serialDevice) {
        return usbSerial.readable();
    }
    virtual unsigned char SerialRead(uint8_t serialDevice) {
        return usbSerial.getc();
    }
    virtual void SerialWrite(uint8_t serialDevice, unsigned char b) {
        usbSerial.putc(b);
    }

    // Pin config
    virtual void PinSetMode(MicroFlo::PinId pin, IO::PinMode mode) {
        if (mode == IO::InputPin) {
            DigitalInOut((PinName)pin).input();
        } else if (mode == IO::OutputPin) {
            DigitalInOut((PinName)pin).output();
        } else {
            MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        }
    }
    virtual void PinSetPullup(MicroFlo::PinId pin, IO::PullupMode mode) {
        DigitalIn in((PinName)pin);
        if (mode == IO::PullNone) {
            in.mode(::PullNone);
        } else if (mode == IO::PullUp) {
            in.mode(::PullUp);
        } else {
            MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        }
    }

    // Digital
    virtual void DigitalWrite(MicroFlo::PinId pin, bool val) {
        DigitalOut((PinName)pin).write(val);
    }
    virtual bool DigitalRead(MicroFlo::PinId pin) {
        return DigitalIn((PinName)pin).read();
    }

    // Analog
    // FIXME: implement
    virtual long AnalogRead(MicroFlo::PinId pin) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return 0;
    }
    virtual void PwmWrite(MicroFlo::PinId pin, long dutyPercent) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

    // Timer
    virtual long TimerCurrentMs() {
        return timer.read_ms();
    }

    virtual void AttachExternalInterrupt(uint8_t interrupt, IO::Interrupt::Mode mode,
                                         IOInterruptFunction func, void *user) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
};

