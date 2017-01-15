/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#include <mbed.h>
#include "mbed.hpp"

#include <stddef.h>
#include <stdlib.h>

void *operator new(size_t n)
{
  void * const p = malloc(n);
  // TODO: handle p == 0 ?
  return p;
}
void operator delete(void * p)
{
  free(p);
}
void operator delete(void * p, size_t n)
{
  free(p);
}

extern "C"
{
    void __cxa_pure_virtual() {
        while (1);
    }
    void __cxa_atexit() {
        ;
    }
}

MbedIO io;
const int serialPort = 0;
const int serialBaudrate = 9600;
FixedMessageQueue queue;
Network network(&io, &queue);
HostCommunication controller;
SerialHostTransport transport(serialPort, serialBaudrate);

int main(void) {
    transport.setup(&io, &controller);
    controller.setup(&network, &transport);
    MICROFLO_LOAD_STATIC_GRAPH((&controller), graph);
    while (1) {
        transport.runTick();
        network.runTick();
    }
}

// FIXME: Causes conflict with Timer if up top
#include "microflo.hpp"
