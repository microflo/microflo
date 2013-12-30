/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#include "microflo.h"

// Datasheets
// atmega328: http://www.atmel.com/Images/Atmel-8271-8-bit-AVR-Microcontroller-ATmega48A-48PA-88A-88PA-168A-168PA-328-328P_datasheet.pdf
// at90usb1287: http://www.atmel.com/Images/doc7593.pdf

// Those not familiar with bitmasking and register twiddling should see
// http://www.avrfreaks.net/index.php?name=PNphpBB2&file=printview&t=37871

#define avrPinSet(REG, pinNumber) *ports[pinNumber/8].REG |= _BV(pinNumber % 8)
#define avrPinClear(REG, pinNumber) *ports[pinNumber/8].REG &= ~_BV(pinNumber % 8)
#define avrPinGet(REG, pinNumber) *ports[pinNumber/8].REG & _BV(pinNumber % 8)

struct AvrPort {
    volatile uint8_t * DDR;
    volatile uint8_t * PIN;
    volatile uint8_t * PORT;
};

// PERFORMANCE: use a C++ const-expression for the pin to register mapping?

static const AvrPort ports[6] = {
    {&DDRA, &PINA, &PORTA},
    {&DDRB, &PINB, &PORTB},
    {&DDRC, &PINC, &PORTC},
    {&DDRD, &PIND, &PORTD},
    {&DDRE, &PINE, &PORTE},
    {&DDRF, &PINF, &PORTF},
};

class Avr8IO : public IO {
public:


public:
    Avr8IO() {}
    ~Avr8IO() {}

    // Serial
    // FIXME: implement
    virtual void SerialBegin(int serialDevice, int baudrate) {

    }
    virtual long SerialDataAvailable(int serialDevice) {
        return false;
    }
    virtual unsigned char SerialRead(int serialDevice) {
        return 0;
    }
    virtual void SerialWrite(int serialDevice, unsigned char b) {

    }

    // Pin config
    virtual void PinSetMode(int pin, IO::PinMode mode) {
        if (mode == IO::InputPin) {
            avrPinSet(DDR, pin);
        } else if (mode == IO::OutputPin) {
            avrPinClear(DDR, pin);
        }
    }
    virtual void PinEnablePullup(int pin, bool enable) {
        // assumes pin has been configured as input
        enable ? avrPinSet(PORT, pin) : avrPinClear(PORT, pin);
    }

    // Digital
    virtual void DigitalWrite(int pin, bool val) {
        val ? avrPinSet(PORT, pin) : avrPinClear(PORT, pin);
    }
    virtual bool DigitalRead(int pin) {
        return avrPinGet(PIN, pin);
    }

    // Analog
    // FIXME: implement
    virtual long AnalogRead(int pin) {
        return 0;
    }
    virtual void PwmWrite(int pin, long dutyPercent) {

    }

    // Timer
    // FIXME: implement
    virtual long TimerCurrentMs() {
        return 0;
    }

    virtual void AttachExternalInterrupt(int interrupt, IO::Interrupt::Mode mode, IOInterruptFunction func, void *user) {

    }
};

