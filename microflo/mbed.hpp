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
    virtual void SerialBegin(int serialDevice, int baudrate) {
        usbSerial.baud(baudrate);
    }
    virtual long SerialDataAvailable(int serialDevice) {
        return usbSerial.readable();
    }
    virtual unsigned char SerialRead(int serialDevice) {
        return usbSerial.getc();
    }
    virtual void SerialWrite(int serialDevice, unsigned char b) {
        usbSerial.putc(b);
    }

    // Pin config
    virtual void PinSetMode(int pin, IO::PinMode mode) {
        if (mode == IO::InputPin) {
            DigitalInOut((PinName)pin).input();
        } else if (mode == IO::OutputPin) {
            DigitalInOut((PinName)pin).output();
        } else {
            MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        }
    }
    virtual void PinSetPullup(int pin, IO::PullupMode mode) {
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
    virtual void DigitalWrite(int pin, bool val) {
        DigitalOut((PinName)pin).write(val);
    }
    virtual bool DigitalRead(int pin) {
        return DigitalIn((PinName)pin).read();
    }

    // Analog
    // FIXME: implement
    virtual long AnalogRead(int pin) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return 0;
    }
    virtual void PwmWrite(int pin, long dutyPercent) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

    // Timer
    virtual long TimerCurrentMs() {
        return timer.read_ms();
    }

    virtual void AttachExternalInterrupt(int interrupt, IO::Interrupt::Mode mode,
                                         IOInterruptFunction func, void *user) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
};

