/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#include "microflo.h"

#include "inc/hw_ints.h"
#include "inc/hw_memmap.h"
#include "inc/hw_types.h"
#include "inc/hw_ssi.h"
#include "driverlib/debug.h"
#include "driverlib/fpu.h"
#include "driverlib/gpio.h"
#include "driverlib/interrupt.h"
#include "driverlib/pin_map.h"
#include "driverlib/systick.h"
#include "driverlib/sysctl.h"
#include "driverlib/timer.h"
#include "driverlib/uart.h"
#include "driverlib/rom.h"
#include "driverlib/rom_map.h"
#include "driverlib/udma.h"
#include "driverlib/ssi.h"

volatile unsigned long g_ulSysTickCount = 0;

extern "C" {
    void SysTickIntHandler(void) {
        g_ulSysTickCount++;
    }
}

class StellarisIO : public IO {
public:

public:
    StellarisIO()
    {
        MAP_SysTickPeriodSet(MAP_SysCtlClockGet() / 1000); // 1ms
        MAP_SysTickIntEnable();
        MAP_SysTickEnable();
    }

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
    virtual void PinSetMode(int pin, IO::PinMode mode) {
        if (mode == IO::InputPin) {

        } else if (mode == IO::OutputPin) {

        } else {
            MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        }
    }
    virtual void PinSetPullup(int pin, IO::PullupMode mode) {

        if (mode == IO::PullNone) {

        } else if (mode == IO::PullUp) {

        } else {
            MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        }
    }

    // Digital
    virtual void DigitalWrite(int pin, bool val) {

    }
    virtual bool DigitalRead(int pin) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return false;
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
        return g_ulSysTickCount;
    }

    virtual void AttachExternalInterrupt(int interrupt, IO::Interrupt::Mode mode,
                                         IOInterruptFunction func, void *user) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
};

