/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#ifdef ARDUINO
#include "arduino.hpp"
#else
#ifdef AVR
#include "avr.hpp"
#endif
#endif // ARDUINO
#ifdef LINUX
#include "linux.hpp"
#include <unistd.h>
#endif

#ifdef AVR
#include <avr/pgmspace.h>

void loadFromEEPROM(HostCommunication *controller) {
    for (unsigned int i=0; i<sizeof(graph); i++) {
        unsigned char c = pgm_read_byte_near(graph+i);
        controller->parseByte(c);
    }
}
#else
void loadFromEEPROM(HostCommunication *controller) {
        for (unsigned int i=0; i<sizeof(graph); i++) {
        unsigned char c = graph[i];
        controller->parseByte(c);
    }
}
#endif

// I/O backend to use
#ifdef ARDUINO
ArduinoIO io;
#else
#ifdef AVR
Avr8IO io;
#endif
#endif

#ifdef TARGET_LPC1768
#include <mbed.h>
#include "mbed.hpp"
MbedIO io;
#endif

#ifdef LINUX
LinuxIO io;
#endif

#ifdef STELLARIS
#include "stellaris.hpp"
StellarisIO io;
#endif

#ifdef EMSCRIPTEN
#include "emscripten.hpp"
EmscriptenIO io;
#endif

const int serialPort = 0;
const int serialBaudrate = 9600;
Network network(&io);
HostCommunication controller;

#ifdef LINUX
// TODO: add IP-based host transport
NullHostTransport transport;
#else
SerialHostTransport transport(serialPort, serialBaudrate);
#endif

void setup()
{
    transport.setup(&io, &controller);
    network.emitDebug(DebugLevelInfo, DebugProgramStart);
    controller.setup(&network, &transport);

#ifdef MICROFLO_EMBED_GRAPH
    loadFromEEPROM(&controller);
#endif
}

void loop()
{
//    io.DigitalWrite(LED1, true);
    transport.runTick();
    network.runTick();
}

#ifndef ARDUINO
#include "microflo.hpp"
#include <stddef.h>
#include <stdlib.h>
#endif

#ifndef ARDUINO
#ifdef EMSCRIPTEN
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
#else
void * operator new(size_t n)
{
  void * const p = malloc(n);
  // TODO: handle p == 0 ?
  return p;
}

void operator delete(void * p)
{
  free(p);
}
#endif
#endif

// TODO: move into a HAVE_CXX_HANDLERS define
#ifndef TOOLCHAIN_GCC_ARM
#ifndef ARDUINO
#ifndef LINUX
// http://www.avrfreaks.net/index.php?name=PNphpBB2&file=printview&t=59453
extern "C"
{

    void *__dso_handle = NULL;
    void __cxa_pure_virtual() {
        while (1);
    }
    void __cxa_atexit() {
        ;
    }
}
#endif
#endif
#endif

#ifndef ARDUINO
int main(void) {
    setup();
    while(1) {
        loop();
#ifdef LINUX
        // HACK: do some sane scheduling instead
        usleep(1);
#endif
    }
}
#endif

