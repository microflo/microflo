/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#include "arduino.hpp"

#ifndef MICROFLO_ARDUINO_BAUDRATE
#define MICROFLO_ARDUINO_BAUDRATE 115200
#endif

#ifdef MICROFLO_GRAPH_PROGMEM
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

// I/O backend to use
ArduinoIO io;
const int serialPort = 0;
const int serialBaudrate = MICROFLO_ARDUINO_BAUDRATE;
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
