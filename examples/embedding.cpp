#include "microflo.hpp"
#include "linux.hpp"
#include <unistd.h>

// FIXME: implement extraction, must generate ids and normalize structure to match components.json

/* microflo_component yaml plus_one_gen.h
    name: PlusOne
    description: "Count upwards from 0, with step 1"
microflo_component */
#include "plus_one_gen.h"
struct PlusOne : public SingleOutputComponent {
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace PlusOnePorts;
        if (!in.isData()) {
            return;
        }
        send(Packet(in.asInteger()+1), OutPorts::out);
    }
};

/* microflo_component yaml print_integer_gen.h
    name: PrintInteger
    description: "Print integer to stdout"
    inports:
        in
            type: integer
    outports: []
microflo_component */
#include "print_integer_gen.h"
struct PrintInteger : public SingleOutputComponent {
    virtual void process(Packet in, MicroFlo::PortId port) {
        if (in.isData()) {
            fprintf(stdout, "%d\n", in.asInteger());
        }
    }
};

/* microflo_graph fbp mygraph_gen.h
    plus(PlusOne) OUT -> IN forward(Forward) OUT -> IN out(PrintInteger)
    '13' -> plusOne
microflo_graph */
#include "mygraph_gen.h"

int main(void) {
    LinuxIO io;
    NullHostTransport transport;
    Network network(&io);
    HostCommunication controller;
    transport.setup(&io, &controller);
    controller.setup(&network, &transport);

    MICROFLO_LOAD_STATIC_GRAPH((&controller), mygraph_gen);

    while (1) {
        transport.runTick();
        network.runTick();
        // HACK: do some sane scheduling instead
        usleep(1);
    }
}
