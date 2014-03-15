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

static const char * const gMagic = "MAGIC!012";

class StellarisIO : public IO {
public:

public:
    StellarisIO()
        : magic(gMagic)
    {
        MAP_FPULazyStackingEnable();

        /* Set clock to PLL at 50MHz */
        MAP_SysCtlClockSet(SYSCTL_SYSDIV_4 | SYSCTL_USE_PLL | SYSCTL_OSC_MAIN | SYSCTL_XTAL_16MHZ);

        // Enable port F
        MAP_SysCtlPeripheralEnable(SYSCTL_PERIPH_GPIOF);

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
    virtual void PinSetMode(MicroFlo::PinId pin, IO::PinMode mode) {
        // FIXME: support other ports than F!
        if (mode == IO::InputPin) {
            MAP_GPIOPinTypeGPIOInput(GPIO_PORTF_BASE, pin);
        } else if (mode == IO::OutputPin) {
            MAP_GPIOPinTypeGPIOOutput(GPIO_PORTF_BASE, pin);
        } else {
            MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        }
    }
    virtual void PinSetPullup(MicroFlo::PinId pin, IO::PullupMode mode) {
        if (mode == IO::PullNone) {

        } else {
            MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        }
    }

    // Digital
    virtual void DigitalWrite(MicroFlo::PinId pin, bool val) {
        // FIXME: support other ports than F!
        GPIOPinWrite(GPIO_PORTF_BASE, pin, val ? pin : 0x00);
    }
    virtual bool DigitalRead(MicroFlo::PinId pin) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return false;
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
        return g_ulSysTickCount;
    }

    virtual void AttachExternalInterrupt(int interrupt, IO::Interrupt::Mode mode,
                                         IOInterruptFunction func, void *user) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

private:
    const char *magic;
};

