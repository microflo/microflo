/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#ifdef ARDUINO
#include <avr/pgmspace.h>
#include "arduino.hpp"

const int serialPort = 0;
const int serialBaudrate = 9600;

ArduinoIO io;
Network network(&io);
GraphStreamer parser;
HostCommunication endpoint(serialPort, serialBaudrate);

void loadFromEEPROM(GraphStreamer *parser) {
    for (int i=0; i<sizeof(graph); i++) {
        unsigned char c = pgm_read_byte_near(graph+i);
        parser->parseByte(c);
    }
}

void setup()
{
    endpoint.setup(&parser, &network, &io);
    parser.setNetwork(&network);

#ifdef MICROFLO_EMBED_GRAPH
    loadFromEEPROM(&parser);
#endif
}

void loop()
{
    endpoint.runTick();
    network.runTick();
}
#endif // ARDUINO

