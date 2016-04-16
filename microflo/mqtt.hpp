/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2016 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

// MQTT and MsgFlo.org support, at least for embedded Linux

#include "mosquitto.h"

#include <string>
#include <vector>

#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <assert.h>
#include <err.h>

#ifdef DEBUG
#define LOG(...) do { printf(__VA_ARGS__); } while (0)
#else
#define LOG(...)
#endif

class MqttMount;

struct Port {
    MicroFlo::NodeId node;
    MicroFlo::PortId port;
    std::string topic;

    Port(std::string t, MicroFlo::NodeId n, MicroFlo::PortId p)
        : node(n)
        , port(p)
        , topic(t)
    {

    }
};

std::string
toTopic(std::string role, std::string portName) {
    return "/" + role + "/" + portName;
}

struct ParticipantInfo {
    std::vector<Port> inports;
    std::vector<Port> outports;
    std::string role;

    ParticipantInfo *addInport(std::string name, MicroFlo::NodeId n, MicroFlo::PortId p) {
        Port port(toTopic(role, name), n, p);
        inports.push_back(port);
        return this;
    }
    ParticipantInfo *addOutport(std::string name, MicroFlo::NodeId n, MicroFlo::PortId p) {
        Port port(toTopic(role, name), n, p);
        outports.push_back(port);
        return this;
    }
};


struct MqttOptions {
    int brokerPort;
    char * brokerHostname;
    int keepaliveSeconds;
    char * clientId;
    ParticipantInfo info;
};


const Port *
findPortByTopic(const std::vector<Port> &ports, char *topic) {
    for (std::vector<Port>::const_iterator it = ports.begin() ; it != ports.end(); ++it) {
        const Port *port = &(*it);
        if (port->topic == std::string(topic)) {
            return port;
        }
    }
    return NULL;
}

const Port *
findPortByEdge(const std::vector<Port> &ports, MicroFlo::NodeId node, MicroFlo::PortId portId) {
    for (std::vector<Port>::const_iterator it = ports.begin() ; it != ports.end(); ++it) {
        const Port *port = &(*it);
        if (port->node == node && port->port == portId) {
            return port;
        }
    }
    return NULL;
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
    MqttMount(Network *net, const MqttOptions &o)
        : network(net)
        , options(o)
        , connection(NULL)
    {
        network->setNotificationHandler(this);
    }

    ~MqttMount() {
        mosquitto_destroy(this->connection);
        this->connection = NULL;
        (void)mosquitto_lib_cleanup();
    }

    bool connect() {
        struct mosquitto *m = mosquitto_new(options.clientId, true, this);
        this->connection = m;

        mosquitto_connect_callback_set(m, on_connect);
        mosquitto_publish_callback_set(m, on_publish);
        mosquitto_subscribe_callback_set(m, on_subscribe);
        mosquitto_message_callback_set(m, on_message);

        const int res = mosquitto_connect(m, options.brokerHostname, options.brokerPort,
                                          options.keepaliveSeconds);
        return res == MOSQ_ERR_SUCCESS;
    }
    void disconnect() {} // FIXME: not implemented

public:
    // Not really public, used by C trampolines
    void onConnect(int status) {
        const bool connected = status == 0;
        if (connected) {
            subscribePorts();
        }
    }

    void onMessage(const struct mosquitto_message *msg) {

        const Port *port = findPortByTopic(options.info.inports, msg->topic);
        if (port) {
            LOG("processing, sending to %d %d \n", port->node, port->port);

            // FIXME: parse out data from input message
            // FIXME: determine proper target node/port
            Packet pkg = Packet((long)msg->payloadlen);
            network->sendMessageTo(port->node, port->port, pkg);

            // TODO: introduce a way to know when network is done processing, use here
            // Maybe check if there are packets for delivery
            // runTick() could return the number remaining
            // Generators should then continously send something, possibly on a hidden port
            for (int i=0; i<20; i++) {
                network->runTick();
            } // XXX: HAAACK

            LOG("processing done\n");
        } else {
            LOG("Failed to find port for MQTT topic: %s", msg->topic);
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

    virtual void packetSent(const Message &m, const Component *sender, MicroFlo::PortId senderPort) {
        const MicroFlo::NodeId senderId = sender->id();
        LOG("packet sent %d\n", senderId);

        const Port * port = findPortByEdge(options.info.outports, senderId, senderPort);
        if (port) {
            const char *outTopic = port->topic.c_str();
            LOG("sending on MQTT topic %s\n", outTopic);

            // FIXME: determine sane serialization
            size_t payload_sz = 32;
            char payload[payload_sz];
            size_t payloadlen = 0;
            payloadlen = snprintf(payload, payload_sz, "tock %d", (int)m.pkg.asInteger());
            if (payload_sz < payloadlen) {
                //die("snprintf\n");
            }

            const int res = mosquitto_publish(this->connection, NULL, outTopic, payloadlen, payload, 0, false);
            if (res != MOSQ_ERR_SUCCESS) {
                //die("publish\n");
            }
        } else {
            LOG("no MQTT topic associated\n");
        }
    }

private:
    void subscribePorts() {
        for (std::vector<Port>::iterator it = options.info.inports.begin() ; it != options.info.inports.end(); ++it) {
            const Port &port = *it;
            const char *pattern = port.topic.c_str();
            mosquitto_subscribe(this->connection, NULL, pattern, 0);
            LOG("subscribed inport to MQTT topic: %s\n", pattern);
        }
        for (std::vector<Port>::iterator it = options.info.outports.begin() ; it != options.info.outports.end(); ++it) {
            const Port &port = *it;
            network->subscribeToPort(port.node, port.port, true);
            LOG("setup outport to MQTT topic: %s\n", port.topic.c_str());
        }
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
    MqttOptions options;
    struct mosquitto *connection;
};

bool parse_brokerurl(MqttOptions *options, const char *url) {
    if (!url) {
        return true;
    }

    int *ip = &options->brokerPort;
    char *host = options->brokerHostname;
    if (sscanf(url, "mqtt://%99[^:]:%i[^\n]", host, ip) == 2) {
        return true;
    } else if (sscanf(url, "mqtt://%99[^\n]", host) == 1) {
        return true;
    } else {
        return false;
    }
}

// FIXME: allow participant name to be configured on commandline
bool mqttParseOptions(MqttOptions *options, int argc, char **argv) {

    // defaults
    options->brokerHostname = strndup("localhost", 99);
    options->brokerPort = 1883;
    options->keepaliveSeconds = 60;
    options->clientId = NULL; // MQTT will autogenerate
    options->info.role = "micro";

    if (argc > 1) {
        options->info.role = std::string(argv[1]);
    }

    char* broker = getenv("MSGFLO_BROKER");
    return parse_brokerurl(options, broker);
}
