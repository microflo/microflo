#ifndef MICROFLO_H
#define MICROFLO_H

#include <stdint.h>

#ifdef ARDUINO
#include <Arduino.h>
#endif

#include "components.h"
#include "commandformat.h"

// TODO: add embedding API for use in existing Arduino sketches?
class MicroFlo {
public:
    void doNothing() {;}
};

// Packet
// TODO: implement a proper variant type, or type erasure
// XXX: should setup & ticks really be IPs??
enum Msg {
    MsgInvalid = 0,
    MsgSetup,
    MsgTick,

    MsgVoid, // no data payload, can be used like a "bang" in other flow-based systems
    MsgByte,
    MsgAscii,
    MsgBoolean,
    MsgInteger,
    MsgFloat,
    MsgBracketStart,
    MsgBracketEnd,

    MsgMaxDefined,
    MsgMax = 255
};

class Packet {

public:
    Packet(): msg(MsgVoid) {}
    Packet(bool b): msg(MsgBoolean) { data.boolean = b; }
    Packet(char c): msg(MsgAscii) { data.ch = c; }
    Packet(unsigned char by): msg(MsgByte) { data.byte = by; }
    Packet(long l): msg(MsgInteger) { data.lng = l; }
    Packet(float f): msg(MsgFloat) { data.flt = f; }
    Packet(Msg m): msg(m) {}

    Msg type() { return msg; }
    bool isValid() { return msg > MsgInvalid && msg < MsgMaxDefined; }

    bool isSetup() { return msg == MsgSetup; }
    bool isTick() { return msg == MsgTick; }
    bool isSpecial() { return isSetup() || isTick(); }

    bool isStartBracket() { return msg == MsgBracketStart; }
    bool isEndBracket() { return msg == MsgBracketEnd; }

    bool isData() { return isValid() && !isSpecial(); }
    bool isBool() { return msg == MsgBoolean; }
    bool isByte() { return msg == MsgByte; }
    bool isAscii() { return msg == MsgAscii; }
    bool isInteger() { return msg == MsgInteger; } // TODO: make into a long or long long
    bool isFloat() { return msg == MsgFloat; }
    bool isNumber() { return isInteger() || isFloat(); }

    bool asBool();
    float asFloat();
    long asInteger();
    char asAscii();
    unsigned char asByte();

private:
    union PacketData {
        bool boolean;
        char ch;
        unsigned char byte;
        long lng;
        float flt;
    } data;
    enum Msg msg;
};

// Network
const int MAX_NODES = 10;
const int MAX_MESSAGES = 50;
const int MAX_PORTS = 20;

class Component;

struct Message {
    Component *target;
    char targetPort;
    Packet pkg;
};


typedef void (*AddNodeNotification)(Component *);
typedef void (*NodeConnectNotification)(Component *src, int srcPort, Component *target, int targetPort);
typedef void (*MessageSendNotification)(int, Message, Component *, int);
typedef void (*MessageDeliveryNotification)(int, Message);


class Network {
public:
    Network();

    int addNode(Component *node);
    void connect(Component *src, int srcPort, Component *target, int targetPort);
    void connect(int srcId, int srcPort, int targetId, int targetPort);

    void sendMessage(Component *target, int targetPort, const Packet &pkg,
                     Component *sender=0, int senderPort=-1);
    void sendMessage(int targetId, int targetPort, const Packet &pkg);

    void setNotifications(MessageSendNotification send,
                          MessageDeliveryNotification deliver,
                          NodeConnectNotification nodeConnect,
                          AddNodeNotification addNode);

    void runSetup();
    void runTick();
private:
    void deliverMessages(int firstIndex, int lastIndex);
    void processMessages();

private:
    Component *nodes[MAX_NODES];
    int lastAddedNodeIndex;
    Message messages[MAX_MESSAGES];
    int messageWriteIndex;
    int messageReadIndex;
    MessageSendNotification messageSentNotify;
    MessageDeliveryNotification messageDeliveredNotify;
    AddNodeNotification addNodeNotify;
    NodeConnectNotification nodeConnectNotify;
};

struct Connection {
    Component *target;
    char targetPort;
};

class Debugger;

// Component
// TODO: add a way of doing subgraphs as components, both programatically and using .fbp format
// TODO: a way of declaring component introspection data. JSON embedded in comment?
class Component {
    friend class Network;
    friend class Debugger;
public:
    static Component *create(ComponentId id);
    virtual void process(Packet in, int port) = 0;
protected:
    void send(Packet out, int port=0);
private:
    void connect(int outPort, Component *target, int targetPort);
    void setNetwork(Network *net, int n);
private:
    Connection connections[MAX_PORTS]; // one per output port
    Network *network;
    int nodeId; // identifier in the network
    int componentId; // what type of component this is
};



// Graph format
// TODO: defined commands for observing graph changes
#include <stddef.h>

#define GRAPH_MAGIC 'u','C','/','F','l','o', '0', '1'
const size_t GRAPH_MAGIC_SIZE = 8;
const size_t GRAPH_CMD_SIZE = 1 + 7; // cmd + payload

class GraphStreamer {
public:
    GraphStreamer();
    void setNetwork(Network *net) { network = net; }
    void parseByte(char b);
private:
    enum State {
        Invalid = -1,
        ParseHeader,
        ParseCmd
    };

    Network *network;
    int currentByte;
    unsigned char buffer[GRAPH_CMD_SIZE];
    enum State state;
};

#ifdef ARDUINO
class Debugger {
public:
    static void setup(Network *network);
    static void printPacket(Packet *p);
    static void printSend(int index, Message m, Component *sender, int senderPort);
    static void printDeliver(int index, Message m);
    static void printAdd(Component *c);
    static void printConnect(Component *src, int srcPort, Component *target, int targetPort);
};
#endif // ARDUINO

#endif // MICROFLO_H
