/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#include "microflo.h"
#include "linux.hpp"
#include <unistd.h>

int main(int argc, char *argv[]) {
    LinuxIO io;
    FixedMessageQueue queue;
    Network network(&io, &queue);
    HostCommunication controller;
    HostTransport *transport;

    NullHostTransport null;
    LinuxSerialTransport serial("default.microflo");

    if (argc >= 1) {
        const std::string path = argv[1];
        serial = LinuxSerialTransport(path);
        transport = &serial;
    } else {
        transport = &null;
    }

    transport->setup(&io, &controller);
    controller.setup(&network, transport);
    MICROFLO_LOAD_STATIC_GRAPH((&controller), graph);
    while (1) {
        transport->runTick();
        network.runTick();
        // HACK: do some sane scheduling instead
        usleep(1);
    }
}

#include "microflo.hpp"
