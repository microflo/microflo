/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#ifdef ARDUINO
#include <avr/pgmspace.h>
#include "arduino.hpp"

GraphStreamer parser;
ArduinoIO io;
Network network(&io);
void setup()
{
    // HACK: use the IO abstaction instead
    Serial.begin(9600);

#ifdef DEBUG
    // TODO: allow to enable/disable at runtime
    Debugger::setup(&network);
#endif
    parser.setNetwork(&network);

#ifdef MICROFLO_EMBED_GRAPH
    for (int i=0; i<sizeof(graph); i++) {
        unsigned char c = pgm_read_byte_near(graph+i);
        parser.parseByte(c);
    }
#endif
}

void loop()
{
    // HACK: use the IO abstraction instead
    if (Serial.available() > 0) {
        unsigned char c = Serial.read();
        parser.parseByte(c);
        Serial.println(c, HEX);
    }

    network.runTick();
}
#endif // ARDUINO

