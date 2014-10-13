/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#include "avr.hpp"
#include <stdlib.h>
#include <stddef.h>

#include <avr/pgmspace.h>
void loadFromProgMem(HostCommunication *controller) {
    for (unsigned int i=0; i<sizeof(graph); i++) {
        unsigned char c = pgm_read_byte_near(graph+i);
        controller->parseByte(c);
    }
}

void *operator new(size_t n)
{
  void * const p = malloc(n);
  return p;
}
void operator delete(void * p)
{
  free(p);
}

extern "C"
{
    void __cxa_pure_virtual() {
        while (1);
    }
    void *__dso_handle = NULL;
    void __cxa_atexit() {
        ;
    }
}

Avr8IO io;
const int serialPort = 0;
const int serialBaudrate = 9600;
Network network(&io);
HostCommunication controller;
SerialHostTransport transport(serialPort, serialBaudrate);

int main(void) {
    transport.setup(&io, &controller);
    controller.setup(&network, &transport);
#ifdef MICROFLO_EMBED_GRAPH
    loadFromProgMem(&controller);
#endif
    while(1) {
        transport.runTick();
        network.runTick();
    }
}

#include "microflo.hpp"
