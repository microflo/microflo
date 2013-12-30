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
void loadFromEEPROM(HostCommunication *controller) {
    // no-op
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

#ifdef ARDUINO

#else
#include "microflo.hpp"
#include <stddef.h>
#include <stdlib.h>

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

int main(void) {
    setup();
    while(1) {
        loop();
    }
}
#endif

