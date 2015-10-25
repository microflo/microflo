
#define MICROFLO_EMBED_GRAPH

/* microflo_graph fbp
     first(Forward) OUT -> IN second(Forward)
microflo_graph */

#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <assert.h>
#include <err.h>

#include "mosquitto.h"
#include "microflo.h"

#ifdef DEBUG
#define LOG(...) do { printf(__VA_ARGS__); } while (0)
#else
#define LOG(...)
#endif

class MqttMount;

static bool match(const char *topic, const char *key) {
    return 0 == strncmp(topic, key, strlen(key));
}

// TODO: send MsgFlo introspection data
// FIXME: write automated test
class MqttMount : public NetworkNotificationHandler {

public:
    static bool runForever(MqttMount *mount) {
        const int res = mosquitto_loop_forever(mount->connection, 1000, 1000 /* unused */);
        return res == MOSQ_ERR_SUCCESS;
    }

public:
    MqttMount(Network *net)
        : network(net)
        , connection(NULL)
    {
        network->setNotificationHandler(this);
    }

    ~MqttMount() {
        mosquitto_destroy(this->connection);
        this->connection = NULL;
        (void)mosquitto_lib_cleanup();
    }

    bool connect(const char *host, int port, int keepalive, const char *clientName) {
        struct mosquitto *m = mosquitto_new(clientName, true, this);
        this->connection = m;

        mosquitto_connect_callback_set(m, on_connect);
        mosquitto_publish_callback_set(m, on_publish);
        mosquitto_subscribe_callback_set(m, on_subscribe);
        mosquitto_message_callback_set(m, on_message);

        const int res = mosquitto_connect(m, host, port, keepalive);
        return res == MOSQ_ERR_SUCCESS;
    }
    void disconnect() {} // FIXME: not implemented

public:
    // Not really public, used by C trampolines
    void onConnect(int status) {
        const bool connected = status == 0;
        if (connected) {
            subscribeInports();
        }
    }

    void onMessage(const struct mosquitto_message *msg) {

        // TODO: unhardcode matching
        if (match(msg->topic, "tick")) {
            LOG("tick \n");

            // FIXME: parse out data from input message
            // FIXME: determine proper target node/port
            Packet pkg = Packet((long)msg->payloadlen);
            const int targetNodeId = 1;
            const int targetPort = 0;
            network->sendMessageId(targetNodeId, targetPort, pkg);

            // TODO: introduce a way to know when network is done processing, use here
            for (int i=0; i<20; i++) {  network->runTick(); } // HAAACK

            LOG("tick done\n");
        }
    }

    // implements NetworkNotificationHandler
    virtual void nodeAdded(Component *c, MicroFlo::NodeId parentId) {}
    virtual void nodesConnected(Component *src, MicroFlo::PortId srcPort,
                                Component *target, MicroFlo::PortId targetPort) {}
    virtual void networkStateChanged(Network::State s) {}
    virtual void emitDebug(DebugLevel level, DebugId id) {}
    virtual void debugChanged(DebugLevel level) {}
    virtual void portSubscriptionChanged(MicroFlo::NodeId nodeId, MicroFlo::PortId portId, bool enable) {}
    virtual void subgraphConnected(bool isOutput, MicroFlo::NodeId subgraphNode,
                                   MicroFlo::PortId subgraphPort, MicroFlo::NodeId childNode, MicroFlo::PortId childPort) {}

    virtual void packetSent(int index, const Message &m) {
        // FIXME: proper logic from only sending from outport
        LOG("packet sent %d\n", m.sender->id());
        if (m.sender->id() != 1) {
            return;
        }

        // FIXME: determine sane serialization
        size_t payload_sz = 32;
        char payload[payload_sz];
        size_t payloadlen = 0;
        payloadlen = snprintf(payload, payload_sz, "tock %d", (int)m.pkg.asInteger());
        if (payload_sz < payloadlen) {
            //die("snprintf\n");
        }

        // TODO: determine outTopic correctly
        const char *outTopic = "tock";
        int res = mosquitto_publish(this->connection, NULL, outTopic, payloadlen, payload, 0, false);
        if (res != MOSQ_ERR_SUCCESS) {
            //die("publish\n");
        }
    }

private:
    void subscribeInports() {
        // TODO: introspect exported ports to determine topics
        mosquitto_subscribe(this->connection, NULL, "tick", 0);
        network->subscribeToPort(1, 0, true);
    }

private:
    // mosquitto callback trampolines
    static void on_connect(struct mosquitto *m, void *udata, int res) {
        MqttMount *self = (MqttMount *)udata;
        self->onConnect(res);
    }

    static void on_message(struct mosquitto *m, void *udata,
                           const struct mosquitto_message *msg) {
        if (msg == NULL) {
            return;
        }
        LOG("-- got message @ %s: (%d, QoS %d, %s) '%s'\n",
            msg->topic, msg->payloadlen, msg->qos, msg->retain ? "R" : "!r", (char *)msg->payload);
        MqttMount *self = (MqttMount *)udata;
        self->onMessage(msg);
    }

    static void on_subscribe(struct mosquitto *m, void *udata, int mid,
                             int qos_count, const int *granted_qos) {
        LOG("-- subscribed successfully\n");
    }

    static void on_publish(struct mosquitto *m, void *udata, int m_id) {
        LOG("-- published successfully\n");
    }

private:
    Network *network;
    struct mosquitto *connection;
};


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

int main(int argc, char **argv) {
    LinuxIO io;
    NullHostTransport transport;
    Network network(&io);
    HostCommunication controller;
    //transport.setup(&io, &controller);
    controller.setup(&network, &transport);

    MICROFLO_LOAD_STATIC_GRAPH((&controller), graph);

    // FIXME: allow host, port, keepalive, name to be configured on commandline
    static const char *brokerHostname = "localhost";
    static const int brokerPort = 1883;
    static const int keepaliveSeconds = 60;
    static const char *client = "client_1";

    MqttMount mount(&network);
    const bool connected = mount.connect(brokerHostname, brokerPort, keepaliveSeconds, client);
    if (connected) {
        printf("Connected to %s:%d\n", brokerHostname, brokerPort);
    } else {
        die("connect() failure\n");
    }

    const bool success = MqttMount::runForever(&mount);
    return (success) ? 0 : 1;
}
