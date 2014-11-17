/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#include "microflo.h"
#include "linux.hpp"
#include <unistd.h>

// microflo runtime base class declarations and generated component id's (derived from components.json)
#include "components.h"

int main(void) {
    LinuxIO io;
    // TODO: add IP-based host transport
    NullHostTransport transport;
    Network network(&io);
    HostCommunication controller;

    transport.setup(&io, &controller);
    controller.setup(&network, &transport);
    MICROFLO_LOAD_STATIC_GRAPH((&controller), graph);
    while (1) {
        transport.runTick();
        network.runTick();
        // HACK: do some sane scheduling instead
        usleep(1);
    }
}
