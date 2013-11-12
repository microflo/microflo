/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#ifdef ARDUINO
#include "arduino.hpp"

const int serialPort = 0;
const int serialBaudrate = 9600;

ArduinoIO io;
Network network(&io);
GraphStreamer parser;
HostCommunication endpoint(serialPort, serialBaudrate);

void setup()
{
    endpoint.setup(&parser, &network, &io);
    network.emitDebug(DebugProgramStart);
    parser.setNetwork(&network);

#ifdef MICROFLO_EMBED_GRAPH
    parser.loadEmbeddedGraph(&graph);
#endif
    parser.tryLoadSavedGraph();
}

void loop()
{
    endpoint.runTick();
    network.runTick();
}
#endif // ARDUINO

