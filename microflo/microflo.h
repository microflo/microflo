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
const int MAX_NODES = 20;
const int MAX_MESSAGES = 50;
const int MAX_PORTS = 20;

class Component;

struct Message {
    Component *target;
    char targetPort;
    Packet pkg;
};

class NetworkNotificationHandler;
class IO;

class Network {
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

    int addNode(Component *node);
    void connect(Component *src, int srcPort, Component *target, int targetPort);
    void connect(int srcId, int srcPort, int targetId, int targetPort);

    void sendMessage(Component *target, int targetPort, const Packet &pkg,
                     Component *sender=0, int senderPort=-1);
    void sendMessage(int targetId, int targetPort, const Packet &pkg);

    void setNotificationHandler(NetworkNotificationHandler *handler) { notificationHandler = handler; }

    void runTick();

    void emitDebug(DebugId id);

private:
    void runSetup();
    void deliverMessages(int firstIndex, int lastIndex);
    void processMessages();

private:
    Component *nodes[MAX_NODES];
    int lastAddedNodeIndex;
    Message messages[MAX_MESSAGES];
    int messageWriteIndex;
    int messageReadIndex;
    NetworkNotificationHandler *notificationHandler;
    IO *io;
    State state;
};

// TODO: add a configuration option to Network, allowing to control detail level on reporting
// normal = state changes + graph (node/edge) changes?
// message send / recieve only for debugging. Possibly it should even be configured per edge or node
class NetworkNotificationHandler {
public:
    virtual void packetSent(int index, Message m, Component *sender, int senderPort) = 0;
    virtual void packetDelivered(int index, Message m) = 0;

    virtual void nodeAdded(Component *c) = 0;
    virtual void nodesConnected(Component *src, int srcPort, Component *target, int targetPort) = 0;
    virtual void networkStateChanged(Network::State s) = 0;

    virtual void emitDebug(DebugId id) = 0;
};

struct Connection {
    Component *target;
    char targetPort;
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
public:
    static Component *create(ComponentId id);

    virtual ~Component() {}
    virtual void process(Packet in, int port) = 0;

    int id() { return nodeId; }
    int component() { return componentId; }

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
    void parseCmd();
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

class HostCommunication : public NetworkNotificationHandler {
public:
    HostCommunication(int serialPort, int baudRate);
    void setup(GraphStreamer *p, Network *n, IO *i);
    void runTick();

    void padCommandWithNArguments(int arguments);
    void sendCommandByte(uint8_t b);

    // Implements NetworkNotificationHandler
    virtual void packetSent(int index, Message m, Component *sender, int senderPort);
    virtual void packetDelivered(int index, Message m);
    virtual void nodeAdded(Component *c);
    virtual void nodesConnected(Component *src, int srcPort, Component *target, int targetPort);
    virtual void networkStateChanged(Network::State s);
    virtual void emitDebug(DebugId id);

private:
    int serialPort;
    int serialBaudrate;
    GraphStreamer *parser;
    Network *network;
    IO *io;
};

#endif // MICROFLO_H
