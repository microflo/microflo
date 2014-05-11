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
#include "utils/uartstdio.h"
#include "utils/ustdlib.h"

static const unsigned long ports[6] = {
    GPIO_PORTA_BASE,
    GPIO_PORTB_BASE,
    GPIO_PORTC_BASE,
    GPIO_PORTD_BASE,
    GPIO_PORTE_BASE,
    GPIO_PORTF_BASE
};

static const unsigned long portPeripherals[6] = {
    SYSCTL_PERIPH_GPIOA,
    SYSCTL_PERIPH_GPIOB,
    SYSCTL_PERIPH_GPIOC,
    SYSCTL_PERIPH_GPIOD,
    SYSCTL_PERIPH_GPIOE,
    SYSCTL_PERIPH_GPIOF,
};

#define peripheral(pinNumber) portPeripherals[pinNumber/8]
#define portBase(pinNumber) ports[pinNumber/8]
#define pinMask(pinNumber) 0x01 << (pinNumber%8)

volatile unsigned long g_ulSysTickCount = 0;
static const char * const gMagic = "MAGIC!012";

extern "C" {
    void SysTickIntHandler(void) {
        g_ulSysTickCount++;
    }
}

class StellarisIO : public IO {
public:

public:
    StellarisIO()
        : magic(gMagic)
    {
        MAP_FPULazyStackingEnable();

        /* Set clock to PLL at 50MHz */
        MAP_SysCtlClockSet(SYSCTL_SYSDIV_4 | SYSCTL_USE_PLL | SYSCTL_OSC_MAIN | SYSCTL_XTAL_16MHZ);

        MAP_SysTickPeriodSet(MAP_SysCtlClockGet() / (1000*10)); // 1us
        MAP_SysTickIntEnable();
        MAP_SysTickEnable();
    }

    // Serial
    virtual void SerialBegin(uint8_t serialDevice, int baudrate) {
        if (serialDevice == 0) {
            MAP_SysCtlPeripheralEnable(SYSCTL_PERIPH_GPIOA);
            MAP_GPIOPinConfigure(GPIO_PA0_U0RX);
            MAP_GPIOPinConfigure(GPIO_PA1_U0TX);
            MAP_GPIOPinTypeUART(GPIO_PORTA_BASE, GPIO_PIN_0 | GPIO_PIN_1);
            UARTStdioInit(0);
            UARTEnable(UART0_BASE);
        }
    }
    virtual long SerialDataAvailable(uint8_t serialDevice) {
        if (serialDevice == 0) {
            return UARTCharsAvail(UART0_BASE);
        } else {
            return 0;
        }

    }
    virtual unsigned char SerialRead(uint8_t serialDevice) {
        if (serialDevice == 0) {
            return UARTCharGetNonBlocking(UART0_BASE);
        } else {
            return '\0';
        }

    }
    virtual void SerialWrite(uint8_t serialDevice, unsigned char b) {
        if (serialDevice == 0) {
            UARTCharPut(UART0_BASE, b);
        }

    }

    // Pin config
    virtual void PinSetMode(MicroFlo::PinId pin, IO::PinMode mode) {

        MAP_SysCtlPeripheralEnable(peripheral(pin));
        if (mode == IO::InputPin) {
            MAP_GPIOPinTypeGPIOInput(portBase(pin), pinMask(pin));
        } else if (mode == IO::OutputPin) {
            MAP_GPIOPinTypeGPIOOutput(portBase(pin), pinMask(pin));
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
    virtual void DigitalWrite(MicroFlo::PinId pin, bool val) {;
        GPIOPinWrite(portBase(pin), pinMask(pin), val ? pinMask(pin) : 0x00);
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
        return g_ulSysTickCount/10;
    }

    virtual long TimerCurrentMicros() {
        return g_ulSysTickCount*100;
    }

    virtual void AttachExternalInterrupt(uint8_t interrupt, IO::Interrupt::Mode mode,
                                         IOInterruptFunction func, void *user) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

private:
    const char *magic;
};

