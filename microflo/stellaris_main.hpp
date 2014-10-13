/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#include "microflo.hpp"
#include "stellaris.hpp"
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

StellarisIO io;
const int serialPort = 0;
const int serialBaudrate = 9600;
Network network(&io);
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
