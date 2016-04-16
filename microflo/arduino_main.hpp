/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#include "arduino.hpp"

#ifdef AVR
#include <avr/pgmspace.h>
void loadFromProgMem(HostCommunication *controller) {
    for (unsigned int i=0; i<sizeof(graph); i++) {
        unsigned char c = pgm_read_byte_near(graph+i);
        controller->parseByte(c);
    }
}
#else
void loadFromProgMem(HostCommunication *controller) {
        for (unsigned int i=0; i<sizeof(graph); i++) {
        unsigned char c = graph[i];
        controller->parseByte(c);
    }
}
#endif

extern "C"
{
    void *__dso_handle = NULL;
    void __cxa_atexit() {
        ;
    }
}

// I/O backend to use
ArduinoIO io;
const int serialPort = 0;
const int serialBaudrate = 9600;
FixedMessageQueue queue;
Network network(&io, &queue);
HostCommunication controller;
SerialHostTransport transport(serialPort, serialBaudrate);

void setup()
{
    transport.setup(&io, &controller);
    controller.setup(&network, &transport);
#ifdef MICROFLO_EMBED_GRAPH
    loadFromProgMem(&controller);
#endif
}

void loop()
{
    transport.runTick();
    network.runTick();
}

#include "microflo.hpp"
