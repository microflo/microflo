/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#ifndef MICROFLO_H
#define MICROFLO_H

#include <stdint.h>

#ifdef ARDUINO
#include <Arduino.h>
#endif

#include "components.h"
#include "commandformat.h"

const int MICROFLO_MAX_PORTS = 255;

#ifdef MICROFLO_NODE_LIMIT
const int MICROFLO_MAX_NODES = MICROFLO_NODE_LIMIT;
#else
const int MICROFLO_MAX_NODES = 50;
#endif



#ifdef MICROFLO_MESSAGE_LIMIT
const int MICROFLO_MAX_MESSAGES = MICROFLO_MESSAGE_LIMIT;
#else
const int MICROFLO_MAX_MESSAGES = 50;
#endif


namespace MicroFlo {
    typedef uint8_t NodeId;

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

    Msg type() const { return msg; }
    bool isValid() const { return msg > MsgInvalid && msg < MsgMaxDefined; }

    bool isSetup() const { return msg == MsgSetup; }
    bool isTick() const { return msg == MsgTick; }
    bool isSpecial() const { return isSetup() || isTick(); }

    bool isVoid() const { return msg == MsgVoid; }
    bool isStartBracket() const { return msg == MsgBracketStart; }
    bool isEndBracket() const { return msg == MsgBracketEnd; }

    bool isData() const { return isValid() && !isSpecial(); }
    bool isBool() const { return msg == MsgBoolean; }
    bool isByte() const { return msg == MsgByte; }
    bool isAscii() const { return msg == MsgAscii; }
    bool isInteger() const { return msg == MsgInteger; } // TODO: make into a long or long long
    bool isFloat() const { return msg == MsgFloat; }
    bool isNumber() const { return isInteger() || isFloat(); }

    bool asBool() const ;
    float asFloat() const ;
    long asInteger() const ;
    char asAscii() const ;
    unsigned char asByte() const ;

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

class Component;

struct Message {
    Component *target;
    char targetPort;
    Packet pkg;
};

class NetworkNotificationHandler;
class IO;

class Network {
#ifdef HOST_BUILD
    friend class JavaScriptNetwork;
#endif

public:
    enum State {
        Invalid = -1,
        Stopped,
        Running
    };
public:
    Network(IO *io);

    void reset();
    void start();

    int addNode(Component *node, MicroFlo::NodeId parentId);
    void connect(Component *src, int srcPort, Component *target, int targetPort);
    void connect(MicroFlo::NodeId srcId, int srcPort, MicroFlo::NodeId targetId, int targetPort);
    void connectSubgraph(bool isOutput, MicroFlo::NodeId subgraphNode, int subgraphPort,
                         MicroFlo::NodeId childNode, int childPort);

    void sendMessage(Component *target, int targetPort, const Packet &pkg,
                     Component *sender=0, int senderPort=-1);
    void sendMessage(MicroFlo::NodeId targetId, int targetPort, const Packet &pkg);

    void subscribeToPort(MicroFlo::NodeId nodeId, int portId, bool enable);

    void setNotificationHandler(NetworkNotificationHandler *handler) { notificationHandler = handler; }

    void runTick();

    void emitDebug(DebugLevel level, DebugId id);
    void setDebugLevel(DebugLevel level);

private:
    void runSetup();
    void deliverMessages(int firstIndex, int lastIndex);
    void processMessages();

private:
    Component *nodes[MICROFLO_MAX_NODES];
    MicroFlo::NodeId lastAddedNodeIndex;
    Message messages[MICROFLO_MAX_MESSAGES];
    int messageWriteIndex;
    int messageReadIndex;
    NetworkNotificationHandler *notificationHandler;
    IO *io;
    State state;
    DebugLevel debugLevel;
};

class NetworkNotificationHandler {
public:
    virtual void packetSent(int index, Message m, Component *sender, int senderPort) = 0;
    virtual void packetDelivered(int index, Message m) = 0;

    virtual void nodeAdded(Component *c, int parentId) = 0;
    virtual void nodesConnected(Component *src, int srcPort, Component *target, int targetPort) = 0;
    virtual void networkStateChanged(Network::State s) = 0;
    virtual void subgraphConnected(bool isOutput, MicroFlo::NodeId subgraphNode, int subgraphPort,
                                   MicroFlo::NodeId childNode, int childPort);


    virtual void emitDebug(DebugLevel level, DebugId id) = 0;
    virtual void debugChanged(DebugLevel level) = 0;
    virtual void portSubscriptionChanged(MicroFlo::NodeId nodeId, int portId, bool enable);
};

struct Connection {
    Component *target;
    char targetPort;
    bool subscribed;
};


// IO interface for components
// Used to move the sideeffects of I/O components out of the component,
// to allow different target implementations, and to let tests inject mocks

typedef void (*IOInterruptFunction)(void *user);

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

    // Analog
    // Values should be [0..1023], for now
    virtual long AnalogRead(int pin) = 0;

    // Pwm
    // [0..100]
    virtual void PwmWrite(int pin, long dutyPercent) = 0;

    // Timer
    virtual long TimerCurrentMs() = 0;

    // Interrupts
    struct Interrupt {
        enum Mode {
            OnLow,
            OnHigh,
            OnChange,
            OnRisingEdge,
            OnFallingEdge
        };
    };

    // XXX: user responsible for mapping pin number to interrupt number
    virtual void AttachExternalInterrupt(int interrupt, IO::Interrupt::Mode mode,
                                         IOInterruptFunction func, void *user) = 0;
};

// Component
// TODO: add a way of doing subgraphs as components, both programatically and using .fbp format
// IDEA: a decentral way of declaring component introspection data. JSON embedded in comment?
class Component {
    friend class Network;
    friend class SubGraph;
public:
    static Component *create(ComponentId id);

    Component(Connection *outPorts, int ports) : connections(outPorts), nPorts(ports) {}
    virtual ~Component() {}
    virtual void process(Packet in, int port) = 0;

    MicroFlo::NodeId id() const { return nodeId; }
    int component() const { return componentId; }

protected:
    void send(Packet out, int port=0);
    IO *io;
private:
    void setParent(int parentId) { parentNodeId = parentId; }
    void connect(int outPort, Component *target, int targetPort);
    void setNetwork(Network *net, int n, IO *io);
private:
    Connection *connections; // one per output port
    int nPorts;

    Network *network;
    MicroFlo::NodeId nodeId; // identifier in the network
    int componentId; // what type of component this is
    MicroFlo::NodeId parentNodeId; // if <0, a top-level component, else subcomponent
};

#define MICROFLO_SUBGRAPH_MAXPORTS 10

class SubGraph : public Component {
    friend class Network;
public:
    SubGraph();
    virtual ~SubGraph() {}

    // Implements Component
    virtual void process(Packet in, int port);

    void connectInport(int inPort, Component *child, int childInPort);
    void connectOutport(int outPort, Component *child, int childOutPort);
private:
    Connection inputConnections[MICROFLO_SUBGRAPH_MAXPORTS];
    Connection outputConnections[MICROFLO_SUBGRAPH_MAXPORTS];
};

// Graph format
#include <stddef.h>

const size_t MICROFLO_CMD_SIZE = 1 + 7; // cmd + payload

class HostTransport;

class HostCommunication : public NetworkNotificationHandler {
public:
    HostCommunication();
    void setup(Network *net, HostTransport *t);

    void parseByte(char b);

    // Implements NetworkNotificationHandler
    virtual void packetSent(int index, Message m, Component *sender, int senderPort);
    virtual void packetDelivered(int index, Message m);
    virtual void nodeAdded(Component *c, int parentId);
    virtual void nodesConnected(Component *src, int srcPort, Component *target, int targetPort);
    virtual void networkStateChanged(Network::State s);
    virtual void emitDebug(DebugLevel level, DebugId id);
    virtual void debugChanged(DebugLevel level);
    virtual void portSubscriptionChanged(MicroFlo::NodeId nodeId, int portId, bool enable);
    virtual void subgraphConnected(bool isOutput, MicroFlo::NodeId subgraphNode,
                                   int subgraphPort, MicroFlo::NodeId childNode, int childPort);

private:
    void parseCmd();
private:
    enum State {
        Invalid = -1,
        ParseHeader,
        ParseCmd,
        LookForHeader
    };

    Network *network;
    HostTransport *transport;
    uint8_t currentByte;
    unsigned char buffer[MICROFLO_CMD_SIZE];
    enum State state;
};


class HostTransport {
public:
    virtual void setup(IO *i, HostCommunication *c) = 0;
    virtual void runTick() = 0;

    virtual void sendCommandByte(uint8_t b) = 0;
    void padCommandWithNArguments(int arguments);
};

class SerialHostTransport : public HostTransport {
public:
    SerialHostTransport(int serialPort, int baudRate);

    // implements HostTransport
    virtual void setup(IO *i, HostCommunication *c);
    virtual void runTick();
    virtual void sendCommandByte(uint8_t b);

private:
    IO *io;
    HostCommunication *controller;
    int8_t serialPort;
    int serialBaudrate;
};

#endif // MICROFLO_H
