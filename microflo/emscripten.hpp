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
    void emscripten_main();
}

class EmscriptenIO : public IO {



public:
    long timeMs;

    EmscriptenIO() {
        timeMs = 0;
    }
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
        printf("%s: timeMs=%ld, pin=%d, mode=%s\n",
                __PRETTY_FUNCTION__, TimerCurrentMs(), pin, (mode == IO::InputPin) ? "INPUT" : "OUTPUT");
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
    virtual void PinSetPullup(int pin, IO::PullupMode mode) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

    // Digital
    virtual void DigitalWrite(int pin, bool val) {
        printf("%s: timeMs=%ld, pin=%d, value=%s\n",
                __PRETTY_FUNCTION__, TimerCurrentMs(), pin, val ? "ON" : "OFF");
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
	    return timeMs;
    }

    virtual void AttachExternalInterrupt(int interrupt, IO::Interrupt::Mode mode,
                                        IOInterruptFunction func, void *user) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
};


void emscripten_main() {

    EmscriptenIO io;
    Network network(&io);
    HostCommunication controller;
    NullHostTransport transport;

    transport.setup(&io, &controller);
    network.emitDebug(DebugLevelInfo, DebugProgramStart);
    controller.setup(&network, &transport);
    loadFromEEPROM(&controller);

    for (int i=0; i<50; i++) {
        transport.runTick();
        network.runTick();
        io.timeMs += 100; // Fast-forward time
    }
}

int main(void) {
    emscripten_main();
    return 0;
}
