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
    std::string name;

    Port(std::string t, MicroFlo::NodeId n, MicroFlo::PortId p, std::string na)
        : node(n)
        , port(p)
        , topic(t)
        , name(na)
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
    std::string id;
    std::string component;
    std::string icon;

    ParticipantInfo *addInport(std::string name, MicroFlo::NodeId n, MicroFlo::PortId p) {
        Port port(toTopic(role, name), n, p, name);
        inports.push_back(port);
        return this;
    }
    ParticipantInfo *addOutport(std::string name, MicroFlo::NodeId n, MicroFlo::PortId p) {
        Port port(toTopic(role, name), n, p, name);
        outports.push_back(port);
        return this;
    }
};

#define JSON_ATTR_STRING(name, value) \
    +std::string("    \"") +name+std::string("\": \"") + value + std::string("\",\n")
#define JSON_ATTR_ARRAY(name, value) \
    +std::string("    \"") +name+std::string("\": [") + value + std::string("],\n")
#define JSON_ATTR_RAW(name, value) \
    +std::string("    \"") +name+std::string("\": ") + value + std::string("\n")
#define JSON_ATTR_ENDNULL(name) \
    +std::string("    \"") +name+std::string("\": ") + "null" + std::string("\n")

std::string msgfloPorts(const std::vector<Port> &ports) {
    std::string str;
    // TODO: specify datatype on ports

    for (int i=0; i<(int)ports.size(); i++) {
        const Port &port = ports[i];
        str += "\n    {\n"
            JSON_ATTR_STRING("id", port.name)
            JSON_ATTR_STRING("queue", port.topic)
            JSON_ATTR_STRING("type", "any")
            JSON_ATTR_ENDNULL("_")
        + "    }";
        if (i < (int)ports.size()-1) {
            str =+ ",";
        }
    }
    return str;
}

std::string msgfloParticipantInfo(const ParticipantInfo *info) {
    // TODO: add label
    // TODO: add icon
    std::string inports = msgfloPorts(info->inports);
    std::string outports = msgfloPorts(info->outports);

    std::string msg = "{\n"
        JSON_ATTR_STRING("id", info->id)
        JSON_ATTR_STRING("role", info->role)
        JSON_ATTR_STRING("component", info->component)
        JSON_ATTR_STRING("icon", info->icon)
        JSON_ATTR_ARRAY("inports", inports)
        JSON_ATTR_ARRAY("outports", outports)
        JSON_ATTR_ENDNULL("label")
    + "}";
    return msg;
}

std::string msgfloDiscoveryMessage(const ParticipantInfo *info) {
    const std::string payload = msgfloParticipantInfo(info);

    std::string msg = "{\n"
        JSON_ATTR_STRING("protocol", "discovery")
        JSON_ATTR_STRING("command", "participant")
        JSON_ATTR_RAW("payload", payload)
    + "}";
    return msg;
}

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

// C++ version of the logic in commandstream dataLiteralToCommand etc
Packet decodePacket(const std::string &str) {
    // TODO: handle floats
    // TODO: handle brackets
    // MAYBE: handle hex and octal integers?
    // TODO: handle byte streams
    // TODO: handle brackets
    const long int10 = strtol(str.c_str(), NULL, 10);
    if (str == "null") {
        return Packet(); // void
    } else if (str == "true") {
        return Packet(true);
    } else if (str == "false") {
        return Packet(false);
    } else if (str == "0") {
        return Packet((long)0); // bad strtol error value..
    } else if (int10 != 0) {
        return Packet(int10);
    } else {
        return Packet(MsgInvalid);
    }
}
std::string encodePacket(const Packet &pkg) {
    switch (pkg.type()) {
    case MsgVoid:
        return "null";
    case MsgBoolean:
        return pkg.asBool() ? "true" : "false";
    case MsgInteger:
        return std::to_string(pkg.asInteger());
    case MsgByte:
        return std::to_string(pkg.asByte());
    case MsgFloat:
        return std::to_string(pkg.asFloat());
    case MsgError:
        if (Error_names[pkg.asError()]) {
            return std::string("Error: ") + Error_names[pkg.asError()];
        } else {
            return "Error: Invalid error";
        }

    case MsgBracketStart: // TOOD: handle brackets
    case MsgBracketEnd: // TOOD: handle brackets
        return "";

    // internal types
    case MsgMax:
    case MsgMaxDefined:
    case MsgSetup:
    case MsgTick:
    case MsgInvalid:
        return "";
    default:
        return "Error: Unknown MicroFlo::Packet type";
    }

    return ""; // above should be exclusive but compiler complains...
}


// FIXME: write automated test
class MqttMount : public NetworkNotificationHandler {

public:
    static bool runForever(MqttMount *mount) {
        const int timeoutMs = 10;

        while(1){
            const int status = mosquitto_loop(mount->connection, timeoutMs, 1);
            if (status == MOSQ_ERR_CONN_LOST) {
                mount->connect();
            } else if (status == MOSQ_ERR_SUCCESS) {
                // Run MicroFlo network
                for (int i=0; i<20; i++) {
                    mount->network->runTick();
                }
            } else {
                LOG("mosquitto loop error: %s\n", mosquitto_strerror(status));
                return false;
            }
        }
        return true;
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
    void disconnect() {} // TODO: implement

public:
    // Not really public, used by C trampolines
    void onConnect(int status) {
        const bool connected = status == 0;
        if (connected) {
            subscribePorts();
            sendDiscovery();
        }
    }

    void onMessage(const struct mosquitto_message *msg) {
        char *payloadStr = strndup((const char *)msg->payload, msg->payloadlen);
        const Packet pkg = decodePacket(std::string(payloadStr));
        LOG("got MQTT message on topic %s: %s", msg->topic, payloadStr);
        free(payloadStr);

        const Port *port = findPortByTopic(options.info.inports, msg->topic);
        if (port) {
            LOG("sending to %d %d \n", port->node, port->port);
            network->sendMessageTo(port->node, port->port, pkg);
        } else {
            LOG("Failed to find port for MQTT topic: %s", msg->topic);
        }
    }

    // implements NetworkNotificationHandler
    virtual void nodeAdded(Component *c, MicroFlo::NodeId parentId) {}
    virtual void nodeRemoved(Component *c, MicroFlo::NodeId parentId) {}

    virtual void nodesConnected(Component *src, MicroFlo::PortId srcPort,
                                Component *target, MicroFlo::PortId targetPort) {}
    virtual void nodesDisconnected(Component *src, MicroFlo::PortId srcPort,
                                Component *target, MicroFlo::PortId targetPort) {}

    virtual void networkStateChanged(Network::State s) {}
    virtual void emitDebug(DebugLevel level, DebugId id) {
        const char *levelStr = DebugLevel_names[level];
        const char *message = DebugId_names[id];
        LOG("%s: %s\n", levelStr, message);
    }
    virtual void debugChanged(DebugLevel level) { }
    virtual void portSubscriptionChanged(MicroFlo::NodeId nodeId, MicroFlo::PortId portId, bool enable) {}
    virtual void subgraphConnected(bool isOutput, MicroFlo::NodeId subgraphNode,
                                   MicroFlo::PortId subgraphPort, MicroFlo::NodeId childNode, MicroFlo::PortId childPort) {}

    virtual void packetSent(const Message &m, const Component *sender, MicroFlo::PortId senderPort) {
        const MicroFlo::NodeId senderId = sender->id();
        //LOG("packet sent %d\n", senderId);

        const Port * port = findPortByEdge(options.info.outports, senderId, senderPort);
        if (port) {
            const char *outTopic = port->topic.c_str();

            const std::string data = encodePacket(m.pkg);
            const int res = mosquitto_publish(this->connection, NULL, outTopic,
                                              data.size(), data.c_str(), 0, false);
            LOG("sending on MQTT topic %s: %s\n", outTopic, data.c_str());

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

    void sendDiscovery() {
        const std::string msgfloDiscoveryTopic = "fbp";
        publish(msgfloDiscoveryTopic, msgfloDiscoveryMessage(&options.info));
        LOG("sent MsgFlo discovery message\n");
    }

    void publish(std::string topic, std::string payload) {
        const int res = mosquitto_publish(this->connection, NULL,
                                          topic.c_str(), payload.size(), payload.c_str(), 0, false);
        if (res != MOSQ_ERR_SUCCESS) {
            //die("publish\n");
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

bool mqttParseOptions(MqttOptions *options, int argc, char **argv) {

    // defaults
    options->brokerHostname = strndup("localhost", 99);
    options->brokerPort = 1883;
    options->keepaliveSeconds = 60;
    options->clientId = NULL; // MQTT will autogenerate
    options->info.role = "micro";
    options->info.component = "MicroFloDevice";
    options->info.icon = "lightbulb-o";

    if (argc > 1) {
        options->info.role = std::string(argv[1]);
    }

    options->info.id = options->info.role + std::to_string(rand());

    char* broker = getenv("MSGFLO_BROKER");
    return parse_brokerurl(options, broker);
}
