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

    bool isVoid() { return msg == MsgVoid; }
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

    bool operator==(const Packet& rhs) const;

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
const int MAX_NODES = 20;
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

class IO;
class Network {
public:
    Network(IO *io);

    void reset();
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
    IO *io;
};

struct Connection {
    Component *target;
    char targetPort;
};

class Debugger;

// IO interface for components
// Used to move the sideeffects of I/O components out of the component,
// to allow different target implementations, and to let tests inject mocks
class IO {
public:
    virtual ~IO() {}

    // Serial
    virtual void SerialBegin(int serialDevice, int baudrate) = 0;
    virtual long SerialDataAvailable(int serialDevice) = 0;
    virtual unsigned char SerialRead(int serialDevice) = 0;
    virtual void SerialWrite(int serialDevice, unsigned char b) = 0;

    // Pin config
    enum PinMode {
        InputPin,
        OutputPin
    };
    virtual void PinSetMode(int pin, PinMode mode) = 0;
    virtual void PinEnablePullup(int pin, bool enable) = 0;

    // Digital
    virtual void DigitalWrite(int pin, bool val) = 0;
    virtual bool DigitalRead(int pin) = 0;

    // Timer
    virtual long TimerCurrentMs() = 0;
};

// Component
// TODO: add a way of doing subgraphs as components, both programatically and using .fbp format
// IDEA: a decentral way of declaring component introspection data. JSON embedded in comment?
class Component {
    friend class Network;
    friend class Debugger;
public:
    static Component *create(ComponentId id);
    virtual void process(Packet in, int port) = 0;
protected:
    void send(Packet out, int port=0);
    IO *io;
private:
    void connect(int outPort, Component *target, int targetPort);
    void setNetwork(Network *net, int n, IO *io);
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

#endif // MICROFLO_H
