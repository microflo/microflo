/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2016 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

// MQTT/MsgFlo support, target-independent

#include <string>
#include <vector>

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
    // MAYBE: handle hex and octal integers?
    // TODO: handle (byte) streams sent as a single string
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
    } else if (str == "[") {
        return Packet(MsgBracketStart);
    } else if (str == "]") {
        return Packet(MsgBracketEnd);

    } else {
        return Packet(MsgInvalid);
    }
}

#ifdef ARDUINO
#define MICROFLO_TO_STRING(v) std::string(String(v).c_str())
#else
#define MICROFLO_TO_STRING(v) std::to_string(v)
#endif

std::string encodePacket(const Packet &pkg) {
    switch (pkg.type()) {
    case MsgVoid:
        return "null";
    case MsgBoolean:
        return pkg.asBool() ? "true" : "false";
    case MsgInteger:
        return MICROFLO_TO_STRING(pkg.asInteger());
    case MsgByte:
        return MICROFLO_TO_STRING(pkg.asByte());
    case MsgFloat:
        return MICROFLO_TO_STRING(pkg.asFloat());
    case MsgError:
        if (Error_names[pkg.asError()]) {
            return std::string("Error: ") + Error_names[pkg.asError()];
        } else {
            return "Error: Invalid error";
        }

    // TOOD: handle brackets properly
    case MsgBracketStart:
        return "[";
    case MsgBracketEnd:
        return "]";

    // internal types
    case MsgMax:
    case MsgMaxDefined:
    case MsgSetup:
    case MsgTick:
    case MsgInvalid:
        return "Invalid MicroFlo::Packet";
    default:
        return "Error: Unknown MicroFlo::Packet type";
    }

    return ""; // above should be exclusive but compiler complains...
}



