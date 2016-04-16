
#define MICROFLO_EMBED_GRAPH

/* microflo_graph fbp
     first(Forward) OUT -> IN second(Forward) OUT -> IN third(Forward)
microflo_graph */

#define DEBUG 1

#include "microflo.h"
#include "mqtt.hpp"

//#include "componentlib-ids.h"
//#include "componentlib-ports.h"
//#include "componentlib-source.hpp"
#include "componentlib.hpp"
#include "main.h" // generated graph definition
#include "microflo.hpp"
#include "linux.hpp"

/* Fail with an error message. */
static void die(const char *msg) {
    fprintf(stderr, "%s", msg);
    exit(1);
}

bool findPorts(ParticipantInfo *info) {
    // FIXME: actually introspect from Network/graph data, instead of hardcode
    // can first be done by looking at static graph data,
    // which requires looking at .inports and .outports of graph

    info->addInport("input", 1, 0);
    info->addOutport("output", 2, 0);
    return true;
}

// TODO: move all this into linux_mqtt_main, and add a compile target for that
int main(int argc, char **argv) {
    LinuxIO io;
    NullHostTransport transport;
    FixedMessageQueue queue;
    Network network(&io, &queue);
    HostCommunication controller;
    MqttOptions options;
    //transport.setup(&io, &controller);
    controller.setup(&network, &transport);

    MICROFLO_LOAD_STATIC_GRAPH((&controller), graph);

    const bool parsed = mqttParseOptions(&options, argc, argv);
    if (!parsed) {
        die("options parsing error\n");
    }

    findPorts(&options.info);

    MqttMount mount(&network, options);
    const bool connected = mount.connect();
    if (connected) {
        printf("Connected to %s:%d\n", options.brokerHostname, options.brokerPort);
    } else {
        die("connect() failure\n");
    }

    const bool success = MqttMount::runForever(&mount);
    return (success) ? 0 : 1;
}
