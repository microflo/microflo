
#define MICROFLO_EMBED_GRAPH

// FIXME: allow to receive PacketSent node/port without target

/* microflo_graph fbp
     INPORT=first.IN:INPUT
     OUTPORT=third.OUT:OUTPUT

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
#include "main_maps.h" // generated graph metadata
#include "microflo.hpp"
#include "linux.hpp"

/* Fail with an error message. */
static void die(const char *msg) {
    fprintf(stderr, "%s", msg);
    exit(1);
}

// TODO: introspect from Network/cmdstream instead of graph metadata
bool findPorts(ParticipantInfo *info) {
    // FIXME: don't assume graph data is in 'graph_*'

    // Exported ports
    for (size_t i=0; i<graph_inports_length; i++) {
        const char *name = graph_inports_name[i];
        MicroFlo::PortId portId = graph_inports_port[i];
        MicroFlo::NodeId nodeId = graph_inports_node[i];
        info->addInport(name, nodeId, portId);
    }
    for (size_t i=0; i<graph_outports_length; i++) {
        const char *name = graph_outports_name[i];
        MicroFlo::PortId portId = graph_outports_port[i];
        MicroFlo::NodeId nodeId = graph_outports_node[i];
        info->addOutport(name, nodeId, portId);
    }

    // Graph name
    // TODO: replace with command stream command for graph name
    info->component = graph_name;

    return true;
}

// TODO: move all this into linux_mqtt_main, and add a build target for that
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
