/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 *
 * Note: Arduino is under the LGPL license.
 */

#include "microflo.h"

class EmscriptenIO : public IO {

public:
    EmscriptenIO() {}
    ~EmscriptenIO() {}

    // Serial
    virtual void SerialBegin(int serialDevice, int baudrate) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
    virtual long SerialDataAvailable(int serialDevice) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return 0;
    }
    virtual unsigned char SerialRead(int serialDevice) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return '\0';
    }
    virtual void SerialWrite(int serialDevice, unsigned char b) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

    // Pin config
    virtual void PinSetMode(int pin, IO::PinMode mode) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
    virtual void PinSetPullup(int pin, IO::PullupMode mode) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

    // Digital
    virtual void DigitalWrite(int pin, bool val) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
    virtual bool DigitalRead(int pin) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
	return false;
    }

    // Analog
    virtual long AnalogRead(int pin) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return 0;
    }
    virtual void PwmWrite(int pin, long dutyPercent) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

    // Timer
    virtual long TimerCurrentMs() {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
	return 0;
    }

    virtual void AttachExternalInterrupt(int interrupt, IO::Interrupt::Mode mode,
                                        IOInterruptFunction func, void *user) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
};
