/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#ifndef MICROFLO_H
#define MICROFLO_H

#include <stdint.h>
#include "commandformat.h"

const int MICROFLO_MAX_PORTS = 127;

// Warning: may need to also adjust NodeId type
#ifdef MICROFLO_NODE_LIMIT
const int MICROFLO_MAX_NODES = MICROFLO_NODE_LIMIT;
#else
const int MICROFLO_MAX_NODES = 50;
#endif


// Warning: may need to also adjust MessageId type
#ifdef MICROFLO_MESSAGE_LIMIT
const int MICROFLO_MAX_MESSAGES = MICROFLO_MESSAGE_LIMIT;
#else
const int MICROFLO_MAX_MESSAGES = 50;
#endif

// Default to enabled
#ifdef MICROFLO_DISABLE_SUBGRAPHS
#else
#define MICROFLO_ENABLE_SUBGRAPHS
#endif

#ifdef MICROFLO_DISABLE_DEBUG
#else
#define MICROFLO_ENABLE_DEBUG
#endif


#ifdef MICROFLO_ENABLE_DEBUG

#define MICROFLO_DEBUG(handler, level, code) \
do { \
    microflo_debug(handler, level, code); \
} while(0)

#define MICROFLO_ASSERT(assertion, handler, level, code) \
do { \
    if (!(assertion)) { \
        microflo_debug(handler, level, code); \
    } \
} while(0)

#define MICROFLO_RETURN_IF_FAIL(assertion, handler, level, code) \
do { \
    if (!(assertion)) { \
        microflo_debug(handler, level, code); \
        return; \
    } \
} while(0)

#define MICROFLO_RETURN_VAL_IF_FAIL(assertion, retval, handler, level, code) \
do { \
    if (!(assertion)) { \
        microflo_debug(handler, level, code); \
        return retval; \
    } \
} while(0)

#else
#define MICROFLO_DEBUG(handler, level, code) \

#define MICROFLO_ASSERT(assertion, handler, level, code) \

#define MICROFLO_RETURN_IF_FAIL(assertion, handler, level, code) \

#define MICROFLO_RETURN_VAL_IF_FAIL(assertion, retval, handler, level, code) \

#endif


#ifdef MICROFLO_EMBED_GRAPH

#define MICROFLO_LOAD_STATIC_GRAPH(ctrl_, gr_) \
do { \
    for (unsigned int i=0; i<sizeof(gr_); i++) { \
        unsigned char c = gr_[i]; \
        ctrl_->parseByte(c); \
    } \
} while(0)

#else

#define MICROFLO_LOAD_STATIC_GRAPH(controller, graph) \

#endif


namespace MicroFlo {
    typedef uint8_t NodeId;
    typedef int8_t PortId;
    typedef uint8_t ComponentId;
#ifdef STELLARIS
    typedef long PinId;
#else
    typedef int8_t PinId;
#endif

    // This must match the ID in "microflo/components.json"
    const ComponentId IdSubGraph = 100;
}

namespace Components {
    class SubGraph;
    class DummyComponent;
}

// Packet
// XXX: should setup & ticks really be IPs??
class Packet {

public:
    Packet(): msg(MsgVoid) {}
    Packet(bool b): msg(MsgBoolean) { data.boolean = b; }
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
    bool isInteger() const { return msg == MsgInteger; }
    bool isFloat() const { return msg == MsgFloat; }
    bool isNumber() const { return isInteger() || isFloat(); }

    bool asBool() const ;
    float asFloat() const ;
    long asInteger() const ;
    unsigned char asByte() const ;

    bool operator==(const Packet& rhs) const;

    operator long () { return data.lng; }
    operator bool () { return data.boolean; }

private:
    union PacketData {
        bool boolean;
        unsigned char byte;
        long lng;
        float flt;
    } data;
    enum Msg msg;
};


// Network

class Component;

// We only store payload and sender info, then look up target on delivery from Connection
struct Message {
    Packet pkg;
    MicroFlo::NodeId node;
    MicroFlo::PortId port;
    bool targetReferred; // case for IIPs and messages sent on external ports
};

class NetworkNotificationHandler;
class IO;
class MessageQueue;

class DebugHandler {
public:
    virtual void emitDebug(DebugLevel level, DebugId id) = 0;
    virtual void debugChanged(DebugLevel level) = 0;
};


class Network  {
    // For emitting debug on notificationHandler
    friend class Component;
    friend class DummyComponent;
    friend class SubGraph;
#ifdef HOST_BUILD
    friend class JavaScriptNetwork;
#endif

public:
    static const MicroFlo::NodeId firstNodeId = 1; // 0=reserved: no-parent-node
    enum State {
        Invalid = -1,
        Reset,
        Stopped,
        Running
    };
public:
    Network(IO *io, MessageQueue *m);

    void reset();

    void start();
    void stop();

    MicroFlo::NodeId addNode(Component *node, MicroFlo::NodeId parentId);
    void connect(Component *src, MicroFlo::PortId srcPort,
                 Component *target, MicroFlo::PortId targetPort);
    void connect(MicroFlo::NodeId srcId, MicroFlo::PortId srcPort,
                 MicroFlo::NodeId targetId, MicroFlo::PortId targetPort);
    void connectSubgraph(bool isOutput,
                         MicroFlo::NodeId subgraphNode, MicroFlo::PortId subgraphPort,
                         MicroFlo::NodeId childNode, MicroFlo::PortId childPort);

    void sendMessageFrom(Component *sender, MicroFlo::PortId senderPort, const Packet &pkg);
    void sendMessageTo(MicroFlo::NodeId targetId, MicroFlo::PortId targetPort, const Packet &pkg);

    void subscribeToPort(MicroFlo::NodeId nodeId, MicroFlo::PortId portId, bool enable);

    void setNotificationHandler(NetworkNotificationHandler *handler);

    void runTick();

    void setDebugLevel(DebugLevel level);
    void setIoValue(const uint8_t *buf, uint8_t len);

private:
    void runSetup();
    void distributePacket(const Packet &packet, MicroFlo::PortId port);
    void processMessages();

    MicroFlo::PortId resolveMessageTarget(Message &msg, Component **sender);
    void resolveMessageSubgraph(Message &msg, const Component *out_sender);

private:
    Component *nodes[MICROFLO_MAX_NODES];
    MicroFlo::NodeId lastAddedNodeIndex;

    MessageQueue *messageQueue;
    NetworkNotificationHandler *notificationHandler;
    IO *io;

    State state;
};

class NetworkNotificationHandler : public DebugHandler {
public:
    virtual void packetSent(const Message &m, const Component *sender, MicroFlo::PortId senderPort) = 0;

    virtual void nodeAdded(Component *c, MicroFlo::NodeId parentId) = 0;
    virtual void nodesConnected(Component *src, MicroFlo::PortId srcPort,
                                Component *target, MicroFlo::PortId targetPort) = 0;
    virtual void networkStateChanged(Network::State s) = 0;
    virtual void subgraphConnected(bool isOutput,
                                   MicroFlo::NodeId subgraphNode, MicroFlo::PortId subgraphPort,
                                   MicroFlo::NodeId childNode, MicroFlo::PortId childPort) = 0;

    virtual void portSubscriptionChanged(MicroFlo::NodeId nodeId, MicroFlo::PortId portId, bool enable) = 0;
};

#ifdef MICROFLO_ENABLE_DEBUG
static void microflo_debug(DebugHandler *handler, DebugLevel level, DebugId code) {
    if (handler) {
        handler->emitDebug(level, code);
    }
}
#endif

struct Connection {
    Component *target;
    MicroFlo::PortId targetPort;
    bool subscribed;
};

// Interface for the global message queue
// allowing custom storage
class MessageQueue {
public:
    virtual void newTick() = 0; // indicates that we're now in a new tick
    virtual bool push(const Message &msg) = 0; // true on success. false on capacity exceeded
    virtual bool pop(Message &msg) = 0; // return true on success. false on no more messages *in current tick*
    virtual void clear() = 0; // should clear all messages
};

// Simple statically allocated, fixed size queue
// Configure size using MICROFLO_MESSAGE_LIMIT
class FixedMessageQueue : public MessageQueue {
    typedef uint8_t MessageId;

    struct MessageRange {
        MessageRange()
            : read(0)
            , write(0)
        {
        }
        MessageId read;
        MessageId write;
    };

public:
    FixedMessageQueue()
    {
        maxMessages = MICROFLO_MAX_MESSAGES;
    }

    virtual void newTick();
    virtual bool push(const Message &msg);
    virtual bool pop(Message &msg);
    virtual void clear();
private:
    MessageId maxMessages;
    Message messages[MICROFLO_MAX_MESSAGES];
    MessageRange current;
    MessageRange previous;
};


// IO interface for components
// Used to move the sideeffects of I/O components out of the component,
// to allow different target implementations, and to let tests inject mocks

typedef void (*IOInterruptFunction)(void *user);

class IO {
    friend class Network; // for setting up debug
protected:
    DebugHandler *debug;
public:
    virtual ~IO() {}

    // Testing
    virtual void setIoValue(const uint8_t *, uint8_t ) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

    // Serial
    virtual void SerialBegin(uint8_t serialDevice, int baudrate) = 0;
    virtual long SerialDataAvailable(uint8_t serialDevice) = 0;
    virtual unsigned char SerialRead(uint8_t serialDevice) = 0;
    virtual void SerialWrite(uint8_t serialDevice, unsigned char b) = 0;

    // Pin config
    enum PinMode {
        InputPin,
        OutputPin
    };
    enum PullupMode {
        PullNone,
        PullUp
    };
    virtual void PinSetMode(MicroFlo::PinId pin, PinMode mode) = 0;
    virtual void PinSetPullup(MicroFlo::PinId pin, PullupMode mode) = 0;

    // Digital
    virtual void DigitalWrite(MicroFlo::PinId pin, bool val) = 0;
    virtual bool DigitalRead(MicroFlo::PinId pin) = 0;

    // Analog
    // Values should be [0..1023], for now
    virtual long AnalogRead(MicroFlo::PinId pin) = 0;

    // Pwm
    // [0..100]
    virtual void PwmWrite(MicroFlo::PinId pin, long dutyPercent) = 0;

    // Timer
    virtual long TimerCurrentMs() = 0;
    virtual long TimerCurrentMicros() { return TimerCurrentMs()*1000; }

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
    virtual void AttachExternalInterrupt(uint8_t interrupt, IO::Interrupt::Mode mode,
                                         IOInterruptFunction func, void *user) = 0;
};

// Component
// PERFORMANCE: allow to disable nodeId,componentId, io and network pointers to minimize usage per node
class Component {
    friend class Network;
    friend class DummyComponent;
    friend class SubGraph;
public:
    Component(Connection *outPorts, int ports) : connections(outPorts), nPorts(ports) {}
    virtual ~Component() {}
    virtual void process(Packet in, MicroFlo::PortId port) = 0;

    MicroFlo::NodeId id() const { return nodeId; }
    MicroFlo::ComponentId component() const { return componentId; }
    void setComponentId(MicroFlo::ComponentId id); // not really public API..

protected:
    IO *io;
    Network *network;
protected:
    void send(Packet out, MicroFlo::PortId port=0); // send packet out
private:
    void connect(MicroFlo::PortId outPort, // Use Network.connect()
                 Component *target, MicroFlo::PortId targetPort);
    void setParent(int parentId) { parentNodeId = parentId; }
    void setNetwork(Network *net, int n, IO *io);
private:
    Connection *connections; // one per output port
    MicroFlo::PortId nPorts;

    MicroFlo::NodeId nodeId; // identifier in the network
    MicroFlo::ComponentId componentId; // what type of component this is
    MicroFlo::NodeId parentNodeId; // if <0, a top-level component, else subcomponent
};

class DummyComponent : public Component {
public:
    DummyComponent() : Component(0, 0) {}
    virtual void process(Packet in, MicroFlo::PortId port) {
        MICROFLO_DEBUG(network->notificationHandler, DebugLevelError, DebugInvalidComponentUsed);
    }
};

// Convenience class for component which only have one output.
// Does the output connection allocation for you.
class SingleOutputComponent : public Component {
public:
    SingleOutputComponent() : Component(connections, 1) {}
private:
    Connection connections[1];
};

// components-gen-bottom.cpp
Component *createComponent(MicroFlo::ComponentId id);


#define MICROFLO_SUBGRAPH_MAXPORTS 10

#ifdef MICROFLO_ENABLE_SUBGRAPHS

/* microflo_component yaml
name: SubGraph
description: Not for normal use. Used internally for handling subgraphs
inports: {}
outports: {}
microflo_component */
class SubGraph : public Component {
    friend class ::Network;
public:
    SubGraph();
    virtual ~SubGraph() {}

    // Implements Component
    virtual void process(Packet in, MicroFlo::PortId port);

    void connectInport(MicroFlo::PortId inPort, Component *child, MicroFlo::PortId childInPort);
    void connectOutport(MicroFlo::PortId outPort, Component *child, MicroFlo::PortId childOutPort);
private:
    Connection inputConnections[MICROFLO_SUBGRAPH_MAXPORTS];
    Connection outputConnections[MICROFLO_SUBGRAPH_MAXPORTS];
};
#else
class SubGraph : public DummyComponent {};
#endif

// Convenience class for components whos output is purely
// a function of the current input values
template <typename FUNC, typename T0, typename T1>
class PureFunctionComponent2 : public Component {
public:
    PureFunctionComponent2()
    : Component(connections, 1)
    {
    }

    virtual void process(Packet in, MicroFlo::PortId port) {
        if (in.isData()) {
            if (port == 0) {
                input0 = in;
            } else if (port == 1) {
                input1 = in;
            }
            const Packet ret = function(input0, input1);
            if (ret.isValid()) {
                send(ret);
            }
        }
    }
private:
    Connection connections[1];
    FUNC function;
    T0 input0;
    T1 input1;
};



// PERFORMANCE: allow to disable host communication at build time to reduce progmem?

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
    virtual void packetSent(const Message &m, const Component *src, MicroFlo::PortId senderPort);
    virtual void nodeAdded(Component *c, MicroFlo::NodeId parentId);
    virtual void nodesConnected(Component *src, MicroFlo::PortId srcPort,
                                Component *target, MicroFlo::PortId targetPort);
    virtual void networkStateChanged(Network::State s);
    virtual void emitDebug(DebugLevel level, DebugId id);
    virtual void debugChanged(DebugLevel level);
    virtual void portSubscriptionChanged(MicroFlo::NodeId nodeId, MicroFlo::PortId portId, bool enable);
    virtual void subgraphConnected(bool isOutput, MicroFlo::NodeId subgraphNode,
                                   MicroFlo::PortId subgraphPort, MicroFlo::NodeId childNode, MicroFlo::PortId childPort);

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
    DebugLevel debugLevel;
};


class HostTransport {
public:
    virtual void setup(IO *i, HostCommunication *c) = 0;
    virtual void runTick() = 0;

    virtual void sendCommand(const uint8_t *buf, uint8_t len) = 0;
};

class NullHostTransport : public HostTransport {
public:
    // implements HostTransport
    virtual void setup(IO *i, HostCommunication *c) { ; }
    virtual void runTick() { ; }
    virtual void sendCommand(const uint8_t *buf, uint8_t len) { ; }
private:
};

class SerialHostTransport : public HostTransport {
public:
    SerialHostTransport(uint8_t serialPort, int baudRate);

    // implements HostTransport
    virtual void setup(IO *i, HostCommunication *c);
    virtual void runTick();
    virtual void sendCommand(const uint8_t *buf, uint8_t len);

private:
    IO *io;
    HostCommunication *controller;
    int8_t serialPort;
    int serialBaudrate;
};

#endif // MICROFLO_H
