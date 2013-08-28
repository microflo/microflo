#ifdef ARDUINO
#include <Arduino.h>
void setup();
void loop();
#endif // ARDUINO


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

Packet::Packet()
    : buf('0')
    , msg(MsgInvalid)
{}

Packet::Packet(char c)
    : buf(c)
    , msg(MsgCharacter)
{}

Packet::Packet(Msg _msg)
    : buf('0')
    , msg(_msg)
{}

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

// Implementations

GraphStreamer::GraphStreamer()
    : network(0)
    , currentByte(0)
    , state(ParseHeader)
{}

void GraphStreamer::parseByte(char b) {

    buffer[currentByte++] = b;
    // printf("%s: state=%d, currentByte=%d, input=%d\n", __PRETTY_FUNCTION__, state, currentByte, b);

    if (state == ParseHeader) {
        if (currentByte == GRAPH_MAGIC_SIZE) {    
            // FIXME: duplication of magic definition
            if (buffer[0] == 'u' && buffer[1] == 'C' && buffer[2] == '/', buffer[3] == 'F', buffer[4] == 'l', buffer[5] == 'o') {
                state = ParseCmd;
            } else {
                state = Invalid;
            }
            currentByte = 0;
        }
    } else if (state == ParseCmd) {
        if (currentByte == GRAPH_CMD_SIZE) {    
            GraphCmd cmd = (GraphCmd)buffer[0];
            if (cmd >= GraphCmdInvalid) {
                state = Invalid; // XXX: or maybe just ignore?
            } else {
                if (cmd == GraphCmdReset) {
                    // TODO: implement
                } else if (cmd == GraphCmdCreateComponent) {
                    ComponentId id = (ComponentId)buffer[1];
                    // FIXME: validate
                    network->addNode(Component::create(id));
                } else if (cmd == GraphCmdConnectNodes) {
                    // FIXME: validate
                    int src = (unsigned int)buffer[1];
                    int target = (unsigned int)buffer[2];
                    network->connectTo(src, target);
                }
            }
            currentByte = 0;
        }
        
    } else if (state == Invalid) {
        currentByte = 0; // avoid overflow   
    } else {

    }
}

void Component::send(Packet out) {
    connection.target->process(out);
}

Network::Network()
    : lastAddedNodeIndex(0)
    , messageWriteIndex(0)
    , messageReadIndex(0)
{
    for (int i=0; i<MAX_NODES; i++) {
        nodes[i] = 0;
    }
}

void Network::runSetup() {
    for (int i=0; i<MAX_NODES; i++) {
        if (nodes[i]) {
            nodes[i]->process(Packet(MsgSetup));
        }
    }
}


void Network::deliverMessages(int firstIndex, int lastIndex) {
        if (firstIndex > lastIndex || lastIndex < MAX_MESSAGES || firstIndex < 0) {
            return;
        }

        for (int i=firstIndex; i<=lastIndex; i++) {
            messages[i].target->process(messages[i].pkg);
        }
        messageReadIndex = lastIndex+1;
}

void Network::runTick() {

    // TODO: consider the balance between scheduling and messaging (bounded-buffer problem)

    // Deliver messages
    if (messageReadIndex < messageWriteIndex) {
        deliverMessages(messageReadIndex, MAX_MESSAGES-1);
        deliverMessages(0, messageWriteIndex-1);
    } else {
        deliverMessages(messageReadIndex, messageWriteIndex-1);
    }

    // Schedule
    for (int i=0; i<MAX_NODES; i++) {
        Component *t = nodes[i];
        if (t) {
            t->process(Packet(MsgTick));
        }
    }
}

void Network::connectTo(int srcId, int targetId) {
    if (srcId < 0 || srcId > lastAddedNodeIndex ||
        targetId < 0 || targetId > lastAddedNodeIndex) {
        return;
    }

    connectTo(nodes[srcId], nodes[targetId]);
}

void Network::connectTo(Component *src, Component *target) {
    src->connectTo(target);
}

int Network::addNode(Component *node) {
    nodes[lastAddedNodeIndex++] = node;
    node->setNetwork(this);
    return lastAddedNodeIndex;
}

void Network::sendMessage(Component *target, Packet &pkg) {

    Message &msg = messages[messageWriteIndex++];
    msg.target = target;
    msg.pkg = pkg;
}

#include "components.hpp"


#ifdef ARDUINO
void setup()
{

}

void loop()
{

}
#endif // ARDUINO

#ifdef HOST_BUILD
int main(int argc, char *argv[]) {

    // Setup
    Network network;

    GraphStreamer parser;
    parser.setNetwork(&network);


    for (int i=0; i<sizeof(graph); i++) {
        parser.parseByte(graph[i]);
    }
#ifdef DEBUG
    FILE *f = fopen("reference.fbcs", "w");
    for (int i=0; i<sizeof(graph); i++) {
        fwrite(&graph[i], sizeof(graph[i]), 1, f);
    }
    fflush(f);
#endif // DEBUG

    network.runSetup();

    // Loop
    while (true) {
        network.runTick();
        usleep(1000);
    }

}
#endif // HOST_BUILD
