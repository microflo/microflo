/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#include "microflo.h"
#include "linux.hpp"
#include <unistd.h>
#include <uv.h>

// microflo runtime base class declarations and generated component id's (derived from components.json)
// #include "components.h"

LinuxIO io;
// TODO: add IP-based host transport
NullHostTransport transport;
Network network(&io);
HostCommunication controller;

void
idle_run_tick(uv_idle_t* handle) {
    transport.runTick();
    network.runTick();
}

int
main(void) {
    transport.setup(&io, &controller);
    controller.setup(&network, &transport);
    MICROFLO_LOAD_STATIC_GRAPH((&controller), graph);

    uv_idle_t idler;
    uv_idle_init(uv_default_loop(), &idler);
    uv_idle_start(&idler, idle_run_tick);
    uv_run(uv_default_loop(), UV_RUN_DEFAULT);
}
