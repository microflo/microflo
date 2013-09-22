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
#ifdef DEBUG
    // TODO: allow to enable/disable at runtime
    Debugger::setup(&network);
#endif
    parser.setNetwork(&network);
    for (int i=0; i<sizeof(graph); i++) {
        //unsigned char c = graph[i];
        unsigned char c = pgm_read_byte_near(graph+i);
        parser.parseByte(c);
    }
    network.runSetup();
}

void loop()
{
    network.runTick();
}
#endif // ARDUINO

#ifdef HOST_BUILD
#include <unistd.h>
#include "host.hpp"
int main(int argc, char *argv[]) {

    // Setup
    HostIO io;
    Network network(&io);

    GraphStreamer parser;
    parser.setNetwork(&network);

    for (int i=0; i<sizeof(graph); i++) {
        parser.parseByte(graph[i]);
    }
#ifdef DEBUG
    FILE *f = fopen("reference.fbcs", "w");
    for (int i=0; i<sizeof(graph); i++) {
        fwrite(&graph[i], sizeof(graph[i]), 1, f);
    }
    fflush(f);
#endif // DEBUG

    network.runSetup();

    // Loop
    while (true) {
        network.runTick();
        usleep(1000);
    }

}
#endif // HOST_BUILD

