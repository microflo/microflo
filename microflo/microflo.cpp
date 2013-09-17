#include "microflo.h"

#ifdef HOST_BUILD
#include <cstring>
#endif

bool Packet::asBool() {
    if (msg == MsgBoolean){
        return data.boolean;
    } else if (msg == MsgByte) {
        return data.byte;
    } else if (msg == MsgInteger) {
        return data.lng;
    } else if (msg == MsgFloat) {
        return data.flt;
    } else if (msg == MsgAscii) {
        return data.ch;
    } else {
        return false;
    }
}
long Packet::asInteger() {
    if (msg == MsgBoolean){
        return data.boolean;
    } else if (msg == MsgByte) {
        return data.byte;
    } else if (msg == MsgInteger) {
        return data.lng;
    } else if (msg == MsgFloat) {
        return data.flt;
    } else if (msg == MsgAscii) {
        return data.ch;
    } else {
        return -33;
    }
}
float Packet::asFloat() {
    if (msg == MsgBoolean){
        return data.boolean;
    } else if (msg == MsgByte) {
        return data.byte;
    } else if (msg == MsgInteger) {
        return data.lng;
    } else if (msg == MsgFloat) {
        return data.flt;
    } else if (msg == MsgAscii) {
        return data.ch;
    } else if (msg == MsgVoid) {
        return 0.0;
    } else {
        return -44.0;
    }
}
char Packet::asAscii() {
    if (msg == MsgBoolean){
        return data.boolean;
    } else if (msg == MsgByte) {
        return data.byte;
    } else if (msg == MsgInteger) {
        return data.lng;
    } else if (msg == MsgFloat) {
        return data.flt;
    } else if (msg == MsgAscii) {
        return data.ch;
    } else {
        return '\0';
    }
}
unsigned char Packet::asByte() {
    if (msg == MsgBoolean){
        return data.boolean;
    } else if (msg == MsgByte) {
        return data.byte;
    } else if (msg == MsgInteger) {
        return data.lng;
    } else if (msg == MsgFloat) {
        return data.flt;
    } else if (msg == MsgAscii) {
        return data.ch;
    } else {
        return 0;
    }
}

GraphStreamer::GraphStreamer()
    : network(0)
    , currentByte(0)
    , state(ParseHeader)
{}

void GraphStreamer::parseByte(char b) {

    buffer[currentByte++] = b;

    if (state == ParseHeader) {
        if (currentByte == GRAPH_MAGIC_SIZE) {
            static const char magic[GRAPH_MAGIC_SIZE] = { GRAPH_MAGIC };
            if (memcmp(buffer, magic, GRAPH_MAGIC_SIZE) == 0) {
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
#ifdef DEBUG
                    Serial.println("Component create start");
#endif
                    Component *c = Component::create(id);
#ifdef DEBUG
                    Serial.println("Component create done");
#endif
                    network->addNode(c);
                } else if (cmd == GraphCmdConnectNodes) {
                    // FIXME: validate
                    const int src = (unsigned int)buffer[1];
                    const int target = (unsigned int)buffer[2];
                    const int srcPort = (unsigned int)buffer[3];
                    const int targetPort = (unsigned int)buffer[4];
                    network->connect(src, srcPort, target, targetPort);
                } else if (cmd == GraphCmdSendPacket) {
                    // FIXME: validate
                    const int target = (unsigned int)buffer[1];
                    const int targetPort = (unsigned int)buffer[2];
                    const Msg packetType = (Msg)buffer[3];
                    if (packetType == MsgInteger) {
                        const long val = buffer[4] + 256*buffer[5] + 256*256*buffer[6] + 256*256*256*buffer[7];
                        network->sendMessage(target, targetPort, Packet(val));
                    }

                }
            }
            currentByte = 0;
        }

    } else if (state == Invalid) {
#ifdef DEBUG
       Serial.println("Parser in invalid state");
#endif
        currentByte = 0; // avoid overflow
    } else {
#ifdef DEBUG
       Serial.println("Parser in unknown state");
#endif
    }
}

void Component::send(Packet out, int port) {
    if (connections[port].target && connections[port].targetPort >= 0) {
        network->sendMessage(connections[port].target, connections[port].targetPort, out,
                             this, port);
    }
}

void Component::connect(int outPort, Component *target, int targetPort) {
    connections[outPort].target = target;
    connections[outPort].targetPort = targetPort;
}

void Component::setNetwork(Network *net, int n) {
    network = net;
    nodeId = n;
    for(int i=0; i<MAX_PORTS; i++) {
        connections[i].target = 0;
        connections[i].targetPort = -1;
    }
}

#ifdef ARDUINO
void Debugger::setup(Network *network) {
    Serial.begin(9600);
    network->setNotifications(&Debugger::printSend, &Debugger::printDeliver,
                              &Debugger::printConnect, &Debugger::printAdd);
}

// FIXME: print async, currently output gets truncated on networks with > 3 edges
void Debugger::printPacket(Packet *p) {
    Serial.print("IP(");
    Serial.print(p->type());
    Serial.print(":");
    if (p->isByte()) {
        Serial.print(p->asByte(), HEX);
    } else if (p->isAscii()) {
        Serial.print(p->asAscii());
    } else {
        // FIXME:
    }
    Serial.print(")");
}

void Debugger::printSend(int index, Message m, Component *sender, int senderPort) {
    Serial.print("SEND: ");
    Serial.print("i=");
    Serial.print(index);
    Serial.print(",");
    Serial.print("from=");
    Serial.print(sender->nodeId);
    Serial.print(",");
    Serial.print("to=");
    Serial.print(m.target->nodeId);
    Serial.print(" ");
    printPacket(&m.pkg);
    Serial.println();
}

void Debugger::printDeliver(int index, Message m) {
    Serial.print("DELIVER: ");
    Serial.print("i=");
    Serial.print(index);
    Serial.print(",");
    Serial.print("to=");
    Serial.print(m.target->nodeId);
    Serial.print(" ");
    printPacket(&m.pkg);
    Serial.println();
}

void Debugger::printAdd(Component *c) {
    Serial.print("ADD: ");
    Serial.print(c->componentId);
    Serial.print(",");
    Serial.print(c->nodeId);
    Serial.println();
}

void Debugger::printConnect(Component *src, int srcPort, Component *target, int targetPort) {
    Serial.print("CONNECT: ");
    Serial.print("src=");
    Serial.print(src->nodeId);
    Serial.print(",sPort=");
    Serial.print(srcPort);
    Serial.print(",tgt=");
    Serial.print(target->nodeId);
    Serial.print(",tPort=");
    Serial.print(targetPort);
    Serial.println();
}
#endif

Network::Network()
    : lastAddedNodeIndex(0)
    , messageWriteIndex(0)
    , messageReadIndex(0)
    , messageSentNotify(0)
    , messageDeliveredNotify(0)
    , addNodeNotify(0)
    , nodeConnectNotify(0)
{
    for (int i=0; i<MAX_NODES; i++) {
        nodes[i] = 0;
    }
}

void Network::setNotifications(MessageSendNotification send,
                               MessageDeliveryNotification deliver,
                               NodeConnectNotification nodeConnect,
                               AddNodeNotification addNode)
{
    messageSentNotify = send;
    messageDeliveredNotify = deliver;
    nodeConnectNotify = nodeConnect;
    addNodeNotify = addNode;
}

void Network::deliverMessages(int firstIndex, int lastIndex) {
        if (firstIndex > lastIndex || lastIndex > MAX_MESSAGES-1 || firstIndex < 0) {
            return;
        }

        for (int i=firstIndex; i<=lastIndex; i++) {
            Component *target = messages[i].target;
            if (!target) {
                // FIXME: this should not happen
                continue;
            }
            target->process(messages[i].pkg, messages[i].targetPort);
            if (messageDeliveredNotify) {
                messageDeliveredNotify(i, messages[i]);
            }
        }
}

void Network::processMessages() {
    // Messages may be emitted during delivery, so copy the range we intend to deliver
    const int readIndex = messageReadIndex;
    const int writeIndex = messageWriteIndex;
    if (readIndex > writeIndex) {
        deliverMessages(readIndex, MAX_MESSAGES-1);
        deliverMessages(0, writeIndex);
    } else if (readIndex < writeIndex) {
        deliverMessages(readIndex, writeIndex);
    } else {
        // no messages
    }
    messageReadIndex = writeIndex;
}

void Network::sendMessage(Component *target, int targetPort, const Packet &pkg, Component *sender, int senderPort) {

    if (messageWriteIndex > MAX_MESSAGES-1) {
        messageWriteIndex = 0;
    }
    Message &msg = messages[messageWriteIndex++];
    msg.target = target;
    msg.targetPort = targetPort;
    msg.pkg = pkg;
    if (messageSentNotify) {
        messageSentNotify(messageWriteIndex-1, msg, sender, senderPort);
    }
}

void Network::sendMessage(int targetId, int targetPort, const Packet &pkg) {
    sendMessage(nodes[targetId], targetPort, pkg);
}

void Network::runSetup() {
    for (int i=0; i<MAX_NODES; i++) {
        if (nodes[i]) {
            nodes[i]->process(Packet(MsgSetup), -1);
        }
    }
}

void Network::runTick() {

    // TODO: consider the balance between scheduling and messaging (bounded-buffer problem)

    // Deliver messages
    processMessages();

    // Schedule
    for (int i=0; i<MAX_NODES; i++) {
        Component *t = nodes[i];
        if (t) {
            t->process(Packet(MsgTick), -1);
        }
    }
}

void Network::connect(int srcId, int srcPort, int targetId, int targetPort) {
    if (srcId < 0 || srcId > lastAddedNodeIndex ||
        targetId < 0 || targetId > lastAddedNodeIndex) {
        return;
    }

    connect(nodes[srcId], srcPort, nodes[targetId], targetPort);
}

void Network::connect(Component *src, int srcPort, Component *target, int targetPort) {
    src->connect(srcPort, target, targetPort);
    if (nodeConnectNotify) {
        nodeConnectNotify(src, srcPort, target, targetPort);
    }
}

int Network::addNode(Component *node) {
    const int nodeId = lastAddedNodeIndex;
    nodes[nodeId] = node;
    node->setNetwork(this, nodeId);
    if (addNodeNotify) {
        addNodeNotify(node);
    }
    lastAddedNodeIndex++;
    return nodeId;
}

