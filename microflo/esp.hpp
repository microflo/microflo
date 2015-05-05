

/* FIXME: unglobal */
static os_timer_t tick_timer;
static unsigned long g_time_ms = 0;
static const int TICK_INTERVAL_MS = 100;
void tick_timerfunc(void *arg) {
    g_time_ms += TICK_INTERVAL_MS;
}

class Esp8266IO : public IO {
public:


private:

public:
    Esp8266IO()
    {
        os_timer_disarm(&tick_timer);
        os_timer_setfn(&tick_timer, (os_timer_func_t *)tick_timerfunc, NULL);
        os_timer_arm(&tick_timer, TICK_INTERVAL_MS, 1);
    }

    // Serial
    virtual void SerialBegin(uint8_t serialDevice, int baudrate) {

    }
    virtual long SerialDataAvailable(uint8_t serialDevice) {
        return 0;
    }
    virtual unsigned char SerialRead(uint8_t serialDevice) {
        return '\0';
    }
    virtual void SerialWrite(uint8_t serialDevice, unsigned char b) {
        //
    }

    // Pin config
    virtual void PinSetMode(MicroFlo::PinId pin, IO::PinMode mode) {
        if (mode == IO::InputPin) {

        } else if (mode == IO::OutputPin) {

        } else {
            MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        }
    }
    virtual void PinSetPullup(MicroFlo::PinId pin, IO::PullupMode mode) {

        if (mode == IO::PullNone) {

        } else if (mode == IO::PullUp) {

        } else {
            MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        }
    }

    // Digital
    virtual void DigitalWrite(MicroFlo::PinId pin, bool val) {
        // FIXME: ignores pin value
        if (val) {
            gpio_output_set(BIT1, 0, BIT1, 0);
        } else {
            gpio_output_set(0, BIT1, BIT1, 0);
        }
    }
    virtual bool DigitalRead(MicroFlo::PinId pin) {
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
        return g_time_ms;
    }

    virtual void AttachExternalInterrupt(uint8_t interrupt, IO::Interrupt::Mode mode,
                                         IOInterruptFunction func, void *user) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
};

