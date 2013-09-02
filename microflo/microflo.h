#ifndef MICROFLO_H
#define MICROFLO_H

class MicroFlo {
public:
    void doNothing() {;}
};

// Packet
// TODO: implement a proper variant type, or type erasure
enum Msg {
    MsgInvalid = -1,
    MsgSetup,
    MsgTick,
    MsgCharacter
};

class Packet {

public:
    Packet();
    Packet(char c);
    Packet(Msg m);

public:
    char buf;
    enum Msg msg;
};

// Network
const int MAX_NODES = 10;
const int MAX_MESSAGES = 100;


class Component;

struct Message {
    Component *target;
    Packet pkg;
};


struct Connection {
    Component *target;
};

class Network {
public:
    Network();

    int addNode(Component *node);
    void connectTo(Component *src, Component *target);
    void connectTo(int srcId, int targetId);

    void sendMessage(Component *target, Packet &pkg);

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
};


// TODO: some sort of namespacing scheme
enum ComponentId {
    IdInvalid = 0,
    IdForward,
    IdReadStdIn,
    IdPrintStdOut,
    IdRandomChar,
    IdMax = 255
};

// Component
// TODO: multiple ports
// TODO: a way of declaring component introspection data. JSON embedded in comment?
class Component {
    friend class Network;
public:
    static Component *create(ComponentId id);
    virtual void process(Packet in) = 0;
protected:
    void send(Packet out);
private:
    void connectTo(Component *target) { connection.target = target; }
    void setNetwork(Network *net) { network = net; }
private:
    Connection connection;
    Network *network;
};



// Graph format
// TODO: defined commands for observing graph changes
#include <stddef.h>

#define GRAPH_MAGIC 'u','C','/','F','l','o',
const size_t GRAPH_MAGIC_SIZE = 6;
const size_t GRAPH_CMD_SIZE = 1 + 5; // cmd + payload

// XXX: cannot rely on this being unsigned
enum GraphCmd {
    GraphCmdReset = 10,
    GraphCmdCreateComponent,
    GraphCmdConnectNodes,
    // add here
    GraphCmdInvalid,
    GraphCmdMax = 255
};

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
    char buffer[GRAPH_CMD_SIZE];
    enum State state;
};

#endif // MICROFLO_H
