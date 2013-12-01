/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#include "microflo.h"

#define MICROFLO_DEBUG(net, level, code) \
do { \
    net->emitDebug(level, code); \
} while(0)

#ifdef HOST_BUILD
#include <cstring>
#endif

bool Packet::asBool() const {
    if (msg == MsgBoolean) {
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
long Packet::asInteger() const {
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
float Packet::asFloat() const {
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
char Packet::asAscii() const {
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
unsigned char Packet::asByte() const {
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

bool Packet::operator==(const Packet& rhs) const {
    return msg == rhs.msg && memcmp(&data, &rhs.data, sizeof(PacketData)) == 0;
}

HostCommunication::HostCommunication()
    : network(0)
    , transport(0)
    , currentByte(0)
    , state(LookForHeader)
{}

void HostCommunication::setup(Network *net, HostTransport *t) {
    network = net;
    transport = t;
    network->setNotificationHandler(this);
}


void HostCommunication::parseByte(char b) {

    buffer[currentByte++] = b;

    if (state == ParseHeader) {
        MICROFLO_DEBUG(network, DebugLevelVeryDetailed, DebugParseHeader);
        if (currentByte == GRAPH_MAGIC_SIZE) {
            static const char magic[GRAPH_MAGIC_SIZE] = { GRAPH_MAGIC };
            if (memcmp(buffer, magic, GRAPH_MAGIC_SIZE) == 0) {
                state = ParseCmd;
            } else {
                MICROFLO_DEBUG(network, DebugLevelError, DebugMagicMismatch);
                state = Invalid;
            }
            currentByte = 0;
        }
    } else if (state == ParseCmd) {
        MICROFLO_DEBUG(network, DebugLevelVeryDetailed, DebugParseCommand);
        if (currentByte == GRAPH_CMD_SIZE) {
            parseCmd();
            currentByte = 0;
        }
    } else if (state == LookForHeader) {
        MICROFLO_DEBUG(network, DebugLevelVeryDetailed, DebugParseLookForHeader);
        if (b == 'u') {
            state = ParseHeader;
            buffer[0] = b;
            currentByte = 1;
        }

    } else if (state == Invalid) {
        MICROFLO_DEBUG(network, DebugLevelError, DebugParserInvalidState);
        // try to recover
        currentByte = 0;
        state = LookForHeader;
    } else {
        MICROFLO_DEBUG(network, DebugLevelError,DebugParserUnknownState);
        // try to recover
        currentByte = 0;
        state = LookForHeader;
    }
}

void HostCommunication::parseCmd() {

    GraphCmd cmd = (GraphCmd)buffer[0];
    if (cmd == GraphCmdEnd) {
        network->start();
        state = LookForHeader;
    } else if (cmd == GraphCmdReset) {
        network->reset();
    } else if (cmd == GraphCmdCreateComponent) {
        ComponentId id = (ComponentId)buffer[1];
        // FIXME: validate
        MICROFLO_DEBUG(network, DebugLevelDetailed, DebugComponentCreateStart);
        Component *c = Component::create(id);
        MICROFLO_DEBUG(network, DebugLevelDetailed, DebugComponentCreateEnd);
        network->addNode(c);
    } else if (cmd == GraphCmdConnectNodes) {
        // FIXME: validate
        MICROFLO_DEBUG(network, DebugLevelDetailed, DebugConnectNodesStart);
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
        if (packetType == MsgBracketStart || packetType == MsgBracketEnd
                || packetType == MsgVoid) {
            network->sendMessage(target, targetPort, Packet(packetType));
        } else if (packetType == MsgInteger) {
            const long val = buffer[4] + 256*buffer[5] + 256*256*buffer[6] + 256*256*256*buffer[7];
            network->sendMessage(target, targetPort, Packet(val));
        } else if (packetType == MsgByte) {
            const unsigned char b = buffer[4];
            network->sendMessage(target, targetPort, Packet(b));
        } else if (packetType == MsgBoolean) {
            const bool b = !(buffer[4] == 0);
            network->sendMessage(target, targetPort, Packet(b));
        } else {
            MICROFLO_DEBUG(network, DebugLevelError, DebugParserUnknownPacketType);
        }

    } else if (cmd == GraphCmdConfigureDebug) {
        const DebugLevel l = (DebugLevel)buffer[1];
        network->setDebugLevel(l);
    } else if (cmd >= GraphCmdInvalid) {
        MICROFLO_DEBUG(network, DebugLevelError, DebugParserInvalidCommand);
        // state = Invalid; // XXX: or maybe just ignore?
    } else {
        MICROFLO_DEBUG(network, DebugLevelError, DebugParserUnknownCommand);
    }
}

void Component::send(Packet out, int port) {
    if (port >= nPorts) {
        MICROFLO_DEBUG(network, DebugLevelError, DebugComponentSendInvalidPort);
        return;
    }

    if (connections[port].target && connections[port].targetPort >= 0) {
        network->sendMessage(connections[port].target, connections[port].targetPort, out,
                             this, port);
    }
}

void Component::connect(int outPort, Component *target, int targetPort) {
    connections[outPort].target = target;
    connections[outPort].targetPort = targetPort;
}

void Component::setNetwork(Network *net, int n, IO *i) {
    network = net;
    nodeId = n;
    io = i;
    for(int i=0; i<nPorts; i++) {
        connections[i].target = 0;
        connections[i].targetPort = -1;
    }
}

Network::Network(IO *io)
    : lastAddedNodeIndex(0)
    , messageWriteIndex(0)
    , messageReadIndex(0)
    , notificationHandler(0)
    , io(io)
    , state(Stopped)
    , debugLevel(DebugLevelError)
{
    for (int i=0; i<MAX_NODES; i++) {
        nodes[i] = 0;
    }
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
            if (notificationHandler) {
                notificationHandler->packetDelivered(i, messages[i]);
            }
        }
}

void Network::processMessages() {
    // Messages may be emitted during delivery, so copy the range we intend to deliver
    const int readIndex = messageReadIndex;
    const int writeIndex = messageWriteIndex;
    if (readIndex > writeIndex) {
        deliverMessages(readIndex, MAX_MESSAGES-1);
        deliverMessages(0, writeIndex-1);
    } else if (readIndex < writeIndex) {
        deliverMessages(readIndex, writeIndex-1);
    } else {
        // no messages
    }
    messageReadIndex = writeIndex;
}

void Network::sendMessage(Component *target, int targetPort, const Packet &pkg,
                          Component *sender, int senderPort) {

    if (messageWriteIndex > MAX_MESSAGES-1) {
        messageWriteIndex = 0;
    }
    Message &msg = messages[messageWriteIndex++];
    msg.target = target;
    msg.targetPort = targetPort;
    msg.pkg = pkg;
    if (notificationHandler) {
        notificationHandler->packetSent(messageWriteIndex-1, msg, sender, senderPort);
    }
}

void Network::sendMessage(int targetId, int targetPort, const Packet &pkg) {
    sendMessage(nodes[targetId], targetPort, pkg);
}

void Network::runSetup() {
    if (state != Running) {
        return;
    }

    for (int i=0; i<MAX_NODES; i++) {
        if (nodes[i]) {
            nodes[i]->process(Packet(MsgSetup), -1);
        }
    }
}

void Network::runTick() {
    if (state != Running) {
        return;
    }

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
        MICROFLO_DEBUG(this, DebugLevelError, DebugNetworkConnectInvalidNodes);
        return;
    }

    connect(nodes[srcId], srcPort, nodes[targetId], targetPort);
}

void Network::connect(Component *src, int srcPort, Component *target, int targetPort) {
    src->connect(srcPort, target, targetPort);
    if (notificationHandler) {
        notificationHandler->nodesConnected(src, srcPort, target, targetPort);
    }
}

int Network::addNode(Component *node) {
    if (!node) {
        MICROFLO_DEBUG(this, DebugLevelError, DebugAddNodeInvalidInstance);
        return -1;
    }

    const int nodeId = lastAddedNodeIndex;
    nodes[nodeId] = node;
    node->setNetwork(this, nodeId, this->io);
    if (notificationHandler) {
        notificationHandler->nodeAdded(node);
    }
    lastAddedNodeIndex++;
    return nodeId;
}

void Network::reset() {
    state = Stopped;
    if (notificationHandler) {
        notificationHandler->networkStateChanged(state);
    }

    for (int i=0; i<MAX_NODES; i++) {
        if (nodes[i]) {
            delete nodes[i];
            nodes[i] = 0;
        }
    }
    lastAddedNodeIndex = 0;
    messageWriteIndex = 0;
    messageReadIndex = 0;
}

void Network::start() {
    state = Running;
    if (notificationHandler) {
        notificationHandler->networkStateChanged(state);
    }

    runSetup();
}

void Network::emitDebug(DebugLevel level, DebugId id) {
    if (level <= debugLevel) {
        if (notificationHandler) {
            notificationHandler->emitDebug(id);
        }
    }
}

void Network::setDebugLevel(DebugLevel level) {
    debugLevel = level;
    if (notificationHandler) {
        notificationHandler->debugChanged(debugLevel);
    }
}

void HostCommunication::nodeAdded(Component *c) {
    transport->sendCommandByte(GraphCmdNodeAdded);
    transport->sendCommandByte(c->component());
    transport->sendCommandByte(c->id());
    transport->padCommandWithNArguments(2);
}

void HostCommunication::nodesConnected(Component *src, int srcPort, Component *target, int targetPort) {
    transport->sendCommandByte(GraphCmdNodesConnected);
    transport->sendCommandByte(src->id());
    transport->sendCommandByte(srcPort);
    transport->sendCommandByte(target->id());
    transport->sendCommandByte(targetPort);
    transport->padCommandWithNArguments(4);
}

void HostCommunication::networkStateChanged(Network::State s) {
    GraphCmd cmd = GraphCmdInvalid;
    if (s == Network::Running) {
        cmd = GraphCmdNetworkStarted;
    } else if (s == Network::Stopped) {
        cmd = GraphCmdNetworkStopped;
    }
    transport->sendCommandByte(cmd);
    transport->padCommandWithNArguments(0);
}

void HostCommunication::packetSent(int index, Message m, Component *src, int srcPort) {
    /*
    transport->sendCommandByte(GraphCmdPacketSent);
    transport->sendCommandByte(src->id());
    transport->sendCommandByte(srcPort);
    transport->sendCommandByte(m.target->id());
    transport->sendCommandByte(m.targetPort);
    transport->sendCommandByte(m.pkg.type());
    transport->padCommandWithNArguments(5);
    */
}

// FIXME: implement
void HostCommunication::packetDelivered(int index, Message m) {
    /*Serial.print(index);
    Serial.print(m.target->nodeId);
    printPacket(&m.pkg);*/
}

void HostCommunication::emitDebug(DebugId id) {
    transport->sendCommandByte(GraphCmdDebugMessage);
    transport->sendCommandByte(id);
    transport->padCommandWithNArguments(1);
}

void HostCommunication::debugChanged(DebugLevel level) {
    transport->sendCommandByte(GraphCmdDebugChanged);
    transport->sendCommandByte(level);
    transport->padCommandWithNArguments(1);
}


void HostTransport::padCommandWithNArguments(int arguments) {
    const int padding = GRAPH_CMD_SIZE - (arguments+1);
    for (int i=0; i<padding; i++) {
        sendCommandByte(0x00);
    }
}


SerialHostTransport::SerialHostTransport(int port, int baudRate)
    : serialPort(port)
    , serialBaudrate(baudRate)
{

}

void SerialHostTransport::setup(IO *i, HostCommunication *c) {
    io = i;
    controller = c;

    io->SerialBegin(serialPort, serialBaudrate);
}


void SerialHostTransport::runTick() {
    if (io->SerialDataAvailable(serialPort) > 0) {
        unsigned char c = io->SerialRead(serialPort);
        controller->parseByte(c);
    }
}

void SerialHostTransport::sendCommandByte(uint8_t b) {
    io->SerialWrite(serialPort, b);
}

