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

#ifdef AVR
#include <avr/pgmspace.h>

void loadFromEEPROM(HostCommunication *controller) {
    for (unsigned int i=0; i<sizeof(graph); i++) {
        unsigned char c = pgm_read_byte_near(graph+i);
        controller->parseByte(c);
    }
}
#else
const unsigned char graph[] = {
    0x75,0x43,0x2f,0x46,0x6c,0x6f,0x30,0x31,
    0xa,0x0,0x0,0x0,0x0,0x0,0x0,0x0,
    0xf,0x1,0x0,0x0,0x0,0x0,0x0,0x0,
    0xb,0x7,0x0,0x0,0x0,0x0,0x0,0x0,
    0xb,0xb,0x0,0x0,0x0,0x0,0x0,0x0,
    0xb,0x5,0x0,0x0,0x0,0x0,0x0,0x0,
    0xb,0x34,0x0,0x0,0x0,0x0,0x0,0x0,
    0xc,0x1,0x2,0x0,0x0,0x0,0x0,0x0,
    0xc,0x2,0x3,0x0,0x0,0x0,0x0,0x0,
    0xc,0x4,0x3,0x0,0x1,0x0,0x0,0x0,
    0xd,0x1,0x0,0x7,0x2c,0x1,0x0,0x0,
    0xe,0x0,0x0,0x0,0x0,0x0,0x0,0x0
};
#define MICROFLO_EMBED_GRAPH

void loadFromEEPROM(HostCommunication *controller) {
        for (unsigned int i=0; i<sizeof(graph); i++) {
        unsigned char c = graph[i];
        controller->parseByte(c);
    }
}
#endif

const int serialPort = 0;
const int serialBaudrate = 9600;

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

Network network(&io);
HostCommunication controller;
SerialHostTransport transport(serialPort, serialBaudrate);

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
    transport.runTick();
    network.runTick();
}

#ifndef ARDUINO
#ifndef TARGET_LPC1768
#include "microflo.hpp"
#include <stddef.h>
#include <stdlib.h>
#endif
#endif

#ifndef ARDUINO
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

#ifndef TOOLCHAIN_GCC_ARM
#ifndef ARDUINO
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


#ifndef ARDUINO
int main(void) {
    setup();
    while(1) {
        loop();
    }
}
#endif

