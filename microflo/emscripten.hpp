/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 *
 * Note: Arduino is under the LGPL license.
 */

#include "microflo.h"

#include <stdio.h>
#include <unistd.h>
#include <stddef.h>
#include <stdlib.h>

#include "microflo.hpp"

void loadFromEEPROM(HostCommunication *controller) {
        for (unsigned int i=0; i<sizeof(graph); i++) {
        unsigned char c = graph[i];
        controller->parseByte(c);
    }
}

#include <new>
void * operator new(size_t n) throw(std::bad_alloc)
{
  void * const p = malloc(n);
  if (!p) {
    throw std::bad_alloc();
  }
  return p;
}

void operator delete(void * p) throw()
{
  free(p);
}

void print_foo(int ignored) {
    printf("FOO\n");
}

extern "C" {

}

class EmscriptenIO : public IO {



public:
    long timeMs;

    EmscriptenIO() {
        timeMs = 0;
    }
    ~EmscriptenIO() {}

    // Serial
    virtual void SerialBegin(uint8_t serialDevice, int baudrate) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
    virtual long SerialDataAvailable(uint8_t serialDevice) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return 0;
    }
    virtual unsigned char SerialRead(uint8_t serialDevice) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return '\0';
    }
    virtual void SerialWrite(uint8_t serialDevice, unsigned char b) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

    // Pin config
    virtual void PinSetMode(MicroFlo::PinId pin, IO::PinMode mode) {
        printf("%s: timeMs=%ld, pin=%d, mode=%s\n",
                __PRETTY_FUNCTION__, TimerCurrentMs(), pin, (mode == IO::InputPin) ? "INPUT" : "OUTPUT");
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
    virtual void PinSetPullup(MicroFlo::PinId pin, IO::PullupMode mode) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

    // Digital
    virtual void DigitalWrite(MicroFlo::PinId pin, bool val) {
        printf("%s: timeMs=%ld, pin=%d, value=%s\n",
                __PRETTY_FUNCTION__, TimerCurrentMs(), pin, val ? "ON" : "OFF");
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
    virtual bool DigitalRead(MicroFlo::PinId pin) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
	return false;
    }

    // Analog
    virtual long AnalogRead(MicroFlo::PinId pin) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return 0;
    }
    virtual void PwmWrite(MicroFlo::PinId pin, long dutyPercent) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

    // Timer
    virtual long TimerCurrentMs() {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
	    return timeMs;
    }

    virtual void AttachExternalInterrupt(uint8_t interrupt, IO::Interrupt::Mode mode,
                                        IOInterruptFunction func, void *user) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
};

class EmscriptenRuntime {

public:
    EmscriptenRuntime()
        : network(&io)
    {
        transport.setup(&io, &controller);
        controller.setup(&network, &transport);

        loadFromEEPROM(&controller); // TEMP
    }

    void runIteration() {
        transport.runTick();
        network.runTick();
        io.timeMs += 100; // Fast-forward time
    }

private:
    EmscriptenIO io;
    Network network;
    HostCommunication controller;
    NullHostTransport transport;
};

extern "C" {

EmscriptenRuntime *emscripten_runtime_new() {
    return new EmscriptenRuntime;
}

void emscripten_runtime_free(EmscriptenRuntime *self) {
    delete self;
}

void emscripten_runtime_run(EmscriptenRuntime *self) {
    self->runIteration();
}

}
