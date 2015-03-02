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
#include "driverlib/pin_map.h"

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

static const unsigned long g_ulUARTBase[3] =
{
    UART0_BASE, UART1_BASE, UART2_BASE
};
static const unsigned long g_ulUARTPeriph[3] =
{
    SYSCTL_PERIPH_UART0, SYSCTL_PERIPH_UART1, SYSCTL_PERIPH_UART2
};

volatile unsigned long g_ulSysTickCount = 0;
static const char * const gMagic = "MAGIC!012";
static unsigned long g_ulBase = 0;

extern "C" {
    __attribute__((weak)) void GPIOAIntHandler(void) {}
    __attribute__((weak)) void GPIOBIntHandler(void) {}
    __attribute__((weak)) void GPIOCIntHandler(void) {}
    __attribute__((weak)) void GPIODIntHandler(void) {}
    __attribute__((weak)) void GPIOEIntHandler(void) {}
    __attribute__((weak)) void GPIOFIntHandler(void) {}
    __attribute__((weak)) void GPIOGIntHandler(void) {}
    __attribute__((weak)) void GPIOHIntHandler(void) {}
    __attribute__((weak)) void GPIOIIntHandler(void) {}
    __attribute__((weak)) void GPIOJIntHandler(void) {}
    __attribute__((weak)) void GPIOKIntHandler(void) {}
    __attribute__((weak)) void GPIOLIntHandler(void) {}
    __attribute__((weak)) void GPIONIntHandler(void) {}
    __attribute__((weak)) void GPIOMIntHandler(void) {}
    __attribute__((weak)) void GPIOPIntHandler(void) {}
    __attribute__((weak)) void GPIOQIntHandler(void) {}
    void SysTickIntHandler(void) {
        g_ulSysTickCount++;
    }
}



void
UARTStdioConfig(unsigned long ulPortNum, unsigned long ulBaud,
                unsigned long ulSrcClock)
{
    ASSERT((ulPortNum == 0) || (ulPortNum == 1) ||
           (ulPortNum == 2));

    // FIXME: used UART_BUFFERED mode?

    // Check to make sure the UART peripheral is present.
    if(!MAP_SysCtlPeripheralPresent(g_ulUARTPeriph[ulPortNum])) {
        return;
    }

    // Select the base address of the UART.
    g_ulBase = g_ulUARTBase[ulPortNum];

    // Enable the UART peripheral for use.
    MAP_SysCtlPeripheralEnable(g_ulUARTPeriph[ulPortNum]);

    // Configure the UART for 115200, n, 8, 1
    MAP_UARTConfigSetExpClk(g_ulBase, ulSrcClock, ulBaud,
                            (UART_CONFIG_PAR_NONE | UART_CONFIG_STOP_ONE |
                             UART_CONFIG_WLEN_8));

    UARTEnable(g_ulBase);
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

            UARTStdioConfig(serialDevice, 115200, MAP_SysCtlClockGet());
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

