/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#ifdef ARDUINO
#include <avr/pgmspace.h>
#include "arduino.hpp"

ArduinoIO io;
Network network(&io);
GraphStreamer parser;
const int serialPort = 0;
const int serialBaudrate = 9600;

void loadFromEEPROM(GraphStreamer *parser) {
    for (int i=0; i<sizeof(graph); i++) {
        unsigned char c = pgm_read_byte_near(graph+i);
        parser->parseByte(c);
    }
}

void setup()
{
    io.SerialBegin(serialPort, serialBaudrate);
    parser.setNetwork(&network);

#ifdef MICROFLO_EMBED_GRAPH
    loadFromEEPROM(&parser);
#endif
}

void loop()
{
    if (io.SerialDataAvailable(serialPort) > 0) {
        unsigned char c = io.SerialRead(serialPort);
        parser.parseByte(c);
    }

    network.runTick();
}
#endif // ARDUINO

