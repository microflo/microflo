#define MICROFLO_EMBED_GRAPH
#include "microflo.h"
#include "linux.hpp"
#include <unistd.h>

#include "componentlib-ids.h"
#include "componentlib-ports.h"

/* microflo_component yaml
    name: PlusOne
    description: Count upwards from 0, with step 1
microflo_component */
struct PlusOne : public SingleOutputComponent {
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace PlusOnePorts;
        if (!in.isData()) {
            return;
        }
        send(Packet(in.asInteger()+1), OutPorts::out);
    }
};

/* microflo_component yaml
    name: PrintInteger
    description: "Print integer to stdout"
    inports:
        in:
            type: integer
    outports: {}
microflo_component */
struct PrintInteger : public SingleOutputComponent {
    virtual void process(Packet in, MicroFlo::PortId port) {
        if (in.isData()) {
            fprintf(stdout, "%ld\n", in.asInteger());
            fflush(stdout);
        }
    }
};

/* microflo_graph fbp
    plusOne(PlusOne) OUT -> IN forward(Forward) OUT -> IN out(PrintInteger)
    '13' -> IN plusOne
microflo_graph */

#include "microflo.hpp"
#include "componentlib-source.hpp"
#include "main.h" // generated graph definition

int main(void) {
    LinuxIO io;
    NullHostTransport transport;
    FixedMessageQueue queue;
    Network network(&io, &queue);
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
