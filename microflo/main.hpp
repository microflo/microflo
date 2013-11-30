/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#ifdef ARDUINO
#include "arduino.hpp"
#include <avr/pgmspace.h>

void loadFromEEPROM(HostCommunication *controller) {
    for (int i=0; i<sizeof(graph); i++) {
        unsigned char c = pgm_read_byte_near(graph+i);
        controller->parseByte(c);
    }
}

const int serialPort = 0;
const int serialBaudrate = 9600;

ArduinoIO io;
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
#endif // ARDUINO

