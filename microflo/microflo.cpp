/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#include "microflo.h"


#define MICROFLO_VALID_NODEID(id) \
   (id >= Network::firstNodeId && id <= lastAddedNodeIndex)

#ifdef HOST_BUILD
#include <cstring>
#else
#include "string.h"
#endif





static const char MICROFLO_GRAPH_MAGIC[] = { 'u','C','/','F','l','o', '0', '1' };

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
        if (currentByte == sizeof(MICROFLO_GRAPH_MAGIC)) {

            if (memcmp(buffer, MICROFLO_GRAPH_MAGIC, sizeof(MICROFLO_GRAPH_MAGIC)) == 0) {
                state = ParseCmd;
            } else {
                MICROFLO_DEBUG(network, DebugLevelError, DebugMagicMismatch);
                state = Invalid;
            }
            currentByte = 0;
        }
    } else if (state == ParseCmd) {
        MICROFLO_DEBUG(network, DebugLevelVeryDetailed, DebugParseCommand);
        if (currentByte == MICROFLO_CMD_SIZE) {
            parseCmd();
            currentByte = 0;
        }
    } else if (state == LookForHeader) {
        MICROFLO_DEBUG(network, DebugLevelVeryDetailed, DebugParseLookForHeader);
        if (b == MICROFLO_GRAPH_MAGIC[0]) {
            state = ParseHeader;
            buffer[0] = b;
            currentByte = 1;
        } else {
            currentByte = 0;
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
        const ComponentId id = (ComponentId)buffer[1];
        const int parentId = (int)buffer[2];
        // FIXME: validate
        MICROFLO_DEBUG(network, DebugLevelDetailed, DebugComponentCreateStart);
        Component *c = Component::create(id);
        MICROFLO_DEBUG(network, DebugLevelDetailed, DebugComponentCreateEnd);
        network->addNode(c, parentId);
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

    } else if (cmd == GraphCmdSubscribeToPort) {
        const int nodeId = (unsigned int)buffer[1];
        const int portId = (unsigned int)buffer[2];
        const bool enable = (bool)buffer[3];
        network->subscribeToPort(nodeId, portId, enable);

    } else if (cmd == GraphCmdConnectSubgraphPort) {
        // FIXME: validate
        const bool isOutput = (unsigned int)buffer[1];
        const int subgraphNode = (unsigned int)buffer[2];
        const int subgraphPort = (unsigned int)buffer[3];
        const int childNode = (unsigned int)buffer[4];
        const int childPort = (unsigned int)buffer[5];
        network->connectSubgraph(isOutput, subgraphNode, subgraphPort, childNode, childPort);

    } else if (cmd >= GraphCmdInvalid) {
        if (memcmp(buffer, MICROFLO_GRAPH_MAGIC, sizeof(MICROFLO_GRAPH_MAGIC)) != 0) {
            MICROFLO_DEBUG(network, DebugLevelError, DebugParserInvalidCommand);
        }
    } else {
        MICROFLO_DEBUG(network, DebugLevelError, DebugParserUnknownCommand);
    }
}

void Component::send(Packet out, MicroFlo::PortId port) {
    if (port >= nPorts) {
        MICROFLO_DEBUG(network, DebugLevelError, DebugComponentSendInvalidPort);
        return;
    }

    if (connections[port].target && connections[port].targetPort >= 0) {
        network->sendMessage(connections[port].target, connections[port].targetPort, out,
                             this, port);
    }
}

void Component::connect(MicroFlo::PortId outPort, Component *target, MicroFlo::PortId targetPort) {
    connections[outPort].target = target;
    connections[outPort].targetPort = targetPort;
}

void Component::setNetwork(Network *net, int n, IO *i) {
    parentNodeId = 0; // no parent
    network = net;
    nodeId = n;
    io = i;
    for(int i=0; i<nPorts; i++) {
        connections[i].target = 0;
        connections[i].targetPort = -1;
        connections[i].subscribed = false;
    }
}

Network::Network(IO *io)
    : lastAddedNodeIndex(Network::firstNodeId)
    , messageWriteIndex(0)
    , messageReadIndex(0)
    , notificationHandler(0)
    , io(io)
    , state(Stopped)
    , debugLevel(DebugLevelError)
{
    for (int i=0; i<MICROFLO_MAX_NODES; i++) {
        nodes[i] = 0;
    }
}

void Network::setNotificationHandler(NetworkNotificationHandler *handler) {
    notificationHandler = handler;
    io->debug = handler;
}

void Network::deliverMessages(int firstIndex, int lastIndex) {
        if (firstIndex > lastIndex || lastIndex > MICROFLO_MAX_MESSAGES-1 || firstIndex < 0) {
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
        deliverMessages(readIndex, MICROFLO_MAX_MESSAGES-1);
        deliverMessages(0, writeIndex-1);
    } else if (readIndex < writeIndex) {
        deliverMessages(readIndex, writeIndex-1);
    } else {
        // no messages
    }
    messageReadIndex = writeIndex;
}

void Network::sendMessage(Component *target, MicroFlo::PortId targetPort, const Packet &pkg,
                          Component *sender, MicroFlo::PortId senderPort) {
    if (!target) {
        return;
    }

    if (messageWriteIndex > MICROFLO_MAX_MESSAGES-1) {
        messageWriteIndex = 0;
    }
    const int msgIndex = messageWriteIndex++;

    const bool senderIsChild = sender && sender->parentNodeId >= Network::firstNodeId;
    if (senderIsChild) {
        Components::SubGraph *parent = (Components::SubGraph *)nodes[sender->parentNodeId];
        if (target == parent) {
            // Redirect output message from child outport, emit message on the parent outport
            // FIXME: should we change @sender / @senderPort, for debugging?
            target = parent->outputConnections[targetPort].target;
            targetPort = parent->outputConnections[targetPort].targetPort;
        }
    }

    const bool targetIsSubGraph = target->componentId == IdSubGraph;
    if (targetIsSubGraph) {
        Components::SubGraph *targetSubGraph = (Components::SubGraph *)target;
        // Redirect input message from, send to desired port on child
        // FIXME: should we change @sender / @senderPort, for debugging?
        target = targetSubGraph->inputConnections[targetPort].target;
        targetPort = targetSubGraph->inputConnections[targetPort].targetPort;
    }

    Message &msg = messages[msgIndex];
    msg.target = target;
    msg.targetPort = targetPort;
    msg.pkg = pkg;

    const bool sendNotification = sender ? sender->connections[senderPort].subscribed : false;
    if (sendNotification && notificationHandler) {
        notificationHandler->packetSent(msgIndex, msg, sender, senderPort);
    }
}

void Network::sendMessage(MicroFlo::NodeId targetId, MicroFlo::PortId targetPort, const Packet &pkg) {
    if (!MICROFLO_VALID_NODEID(targetId)) {
        MICROFLO_DEBUG(this, DebugLevelError, DebugSendMessageInvalidNode);
        return;
    }

    sendMessage(nodes[targetId], targetPort, pkg);
}

void Network::runSetup() {
    if (state != Running) {
        return;
    }

    for (int i=0; i<MICROFLO_MAX_NODES; i++) {
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
    for (int i=0; i<MICROFLO_MAX_NODES; i++) {
        Component *t = nodes[i];
        if (t) {
            t->process(Packet(MsgTick), -1);
        }
    }
}

void Network::connect(MicroFlo::NodeId srcId, MicroFlo::PortId srcPort,
                      MicroFlo::NodeId targetId,MicroFlo::PortId targetPort) {
    if (!MICROFLO_VALID_NODEID(srcId) || !MICROFLO_VALID_NODEID(targetId)) {
        MICROFLO_DEBUG(this, DebugLevelError, DebugNetworkConnectInvalidNodes);
        return;
    }

    connect(nodes[srcId], srcPort, nodes[targetId], targetPort);
}

void Network::connect(Component *src, MicroFlo::PortId srcPort,
                      Component *target, MicroFlo::PortId targetPort) {
    src->connect(srcPort, target, targetPort);
    if (notificationHandler) {
        notificationHandler->nodesConnected(src, srcPort, target, targetPort);
    }
}

MicroFlo::NodeId Network::addNode(Component *node, MicroFlo::NodeId parentId) {
    if (!node) {
        MICROFLO_DEBUG(this, DebugLevelError, DebugAddNodeInvalidInstance);
        return 0;
    }
    if (parentId > lastAddedNodeIndex) {
        MICROFLO_DEBUG(this, DebugLevelError, DebugAddNodeInvalidParent);
        return 0;
    }

    const int nodeId = lastAddedNodeIndex;
    nodes[nodeId] = node;
    node->setNetwork(this, nodeId, this->io);
    if (parentId > 0) {
        node->setParent(parentId);
    }
    if (notificationHandler) {
        notificationHandler->nodeAdded(node, parentId);
    }
    lastAddedNodeIndex++;
    return nodeId;
}

void Network::reset() {
    state = Stopped;
    if (notificationHandler) {
        notificationHandler->networkStateChanged(state);
    }

    for (int i=0; i<MICROFLO_MAX_NODES; i++) {
        if (nodes[i]) {
            delete nodes[i];
            nodes[i] = 0;
        }
    }
    lastAddedNodeIndex = Network::firstNodeId;
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
            notificationHandler->emitDebug(level, id);
        }
    }
}

void Network::setDebugLevel(DebugLevel level) {
    debugLevel = level;
    if (notificationHandler) {
        notificationHandler->debugChanged(debugLevel);
    }
}

void Network::subscribeToPort(MicroFlo::NodeId nodeId, MicroFlo::PortId portId, bool enable) {
    if (!MICROFLO_VALID_NODEID(nodeId)) {
        MICROFLO_DEBUG(this, DebugLevelError, DebugSubscribePortInvalidNode);
        return;
    }

    Component *c = nodes[nodeId];
    if (portId >= c->nPorts) {
        return;
    }

    c->connections[portId].subscribed = enable;

    if (notificationHandler) {
        notificationHandler->portSubscriptionChanged(nodeId, portId, enable);
    }
}

void Network::connectSubgraph(bool isOutput,
                              MicroFlo::NodeId subgraphNode, MicroFlo::PortId subgraphPort,
                              MicroFlo::NodeId childNode, MicroFlo::PortId childPort) {

    if (!MICROFLO_VALID_NODEID(subgraphNode) || !MICROFLO_VALID_NODEID(childNode)) {
        MICROFLO_DEBUG(this, DebugLevelError, DebugSubGraphConnectInvalidNodes);
        return;
    }

    Component *comp = nodes[subgraphNode];
    Component *child = nodes[childNode];
    if (comp->component() != IdSubGraph || child->parentNodeId < Network::firstNodeId) {
        MICROFLO_DEBUG(this, DebugLevelError, DebugSubGraphConnectNotASubgraph);
        return;
    }

    Components::SubGraph *subgraph = (Components::SubGraph *)comp;
    if (isOutput) {
        subgraph->connectOutport(subgraphPort, child, childPort);
    } else {
        subgraph->connectInport(subgraphPort, child, childPort);
    }
    if (notificationHandler) {
        notificationHandler->subgraphConnected(isOutput, subgraphNode, subgraphPort, childNode, childPort);
    }
}

void HostCommunication::nodeAdded(Component *c, MicroFlo::NodeId parentId) {
    transport->sendCommandByte(GraphCmdNodeAdded);
    transport->sendCommandByte(c->component());
    transport->sendCommandByte(c->id());
    transport->sendCommandByte(parentId);
    transport->padCommandWithNArguments(3);
}

void HostCommunication::nodesConnected(Component *src, MicroFlo::PortId srcPort,
                                       Component *target, MicroFlo::PortId targetPort) {
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

void HostCommunication::packetSent(int index, Message m, Component *src, MicroFlo::PortId srcPort) {
    if (!src ) {
        return;
    }

    transport->sendCommandByte(GraphCmdPacketSent);
    transport->sendCommandByte(src->id());
    transport->sendCommandByte(srcPort);
    transport->sendCommandByte(m.target->id());
    transport->sendCommandByte(m.targetPort);
    transport->sendCommandByte(m.pkg.type());

    if (m.pkg.isData()) {
        if (m.pkg.isBool()) {
            transport->sendCommandByte(m.pkg.asBool());
            transport->padCommandWithNArguments(6);
        } else if (m.pkg.isVoid()) {
            transport->padCommandWithNArguments(5);
        } else if (m.pkg.isNumber()){
            // FIXME: truncates
            const int i = m.pkg.asInteger();
            transport->sendCommandByte(i>>0);
            transport->sendCommandByte(i>>8);
            transport->padCommandWithNArguments(8);
        } else {
            // FIXME: support all types
            transport->padCommandWithNArguments(5); // finish command before sending debug
            MICROFLO_DEBUG(network, DebugLevelError, DebugNotImplemented);
        }
    } else {
        transport->padCommandWithNArguments(5);
    }
}

// FIXME: implement
void HostCommunication::packetDelivered(int index, Message m) {
    /*Serial.print(index);
    Serial.print(m.target->nodeId);
    printPacket(&m.pkg);*/
}

void HostCommunication::emitDebug(DebugLevel level, DebugId id) {
    transport->sendCommandByte(GraphCmdDebugMessage);
    transport->sendCommandByte(level);
    transport->sendCommandByte(id);
    transport->padCommandWithNArguments(2);
}

void HostCommunication::debugChanged(DebugLevel level) {
    transport->sendCommandByte(GraphCmdDebugChanged);
    transport->sendCommandByte(level);
    transport->padCommandWithNArguments(1);
}

void HostCommunication::portSubscriptionChanged(MicroFlo::NodeId nodeId, MicroFlo::PortId portId, bool enable) {
    transport->sendCommandByte(GraphCmdPortSubscriptionChanged);
    transport->sendCommandByte(nodeId);
    transport->sendCommandByte(portId);
    transport->sendCommandByte(enable);
    transport->padCommandWithNArguments(3);
}

void HostCommunication::subgraphConnected(bool isOutput,
                                      MicroFlo::NodeId subgraphNode, MicroFlo::PortId subgraphPort,
                                      MicroFlo::NodeId childNode, MicroFlo::PortId childPort) {
    transport->sendCommandByte(GraphCmdSubgraphPortConnected);
    transport->sendCommandByte(isOutput);
    transport->sendCommandByte(subgraphNode);
    transport->sendCommandByte(subgraphPort);
    transport->sendCommandByte(childNode);
    transport->sendCommandByte(childPort);
    transport->padCommandWithNArguments(5);
}

void HostTransport::padCommandWithNArguments(int arguments) {
    const int padding = MICROFLO_CMD_SIZE - (arguments+1);
    for (int i=0; i<padding; i++) {
        sendCommandByte(0x00);
    }
}

SerialHostTransport::SerialHostTransport(uint8_t port, int baudRate)
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


namespace Components {

SubGraph::SubGraph()
    : Component(outputConnections, MICROFLO_SUBGRAPH_MAXPORTS)
{
}

void SubGraph::connectInport(MicroFlo::PortId inPort, Component *child, MicroFlo::PortId childInPort) {
    if (inPort < 0 || inPort >= MICROFLO_SUBGRAPH_MAXPORTS) {
        return;
    }
    inputConnections[inPort].target = child;
    inputConnections[inPort].targetPort = childInPort;
}

void SubGraph::connectOutport(MicroFlo::PortId outPort, Component *child, MicroFlo::PortId childOutPort) {
    if (outPort < 0 || outPort >= MICROFLO_SUBGRAPH_MAXPORTS) {
        return;
    }
    outputConnections[outPort].target = child;
    outputConnections[outPort].targetPort = childOutPort;
}

void SubGraph::process(Packet in, MicroFlo::PortId port) {
    if (port >= 0) {
        MICROFLO_DEBUG(network, DebugLevelError, DebugSubGraphReceivedNormalMessage);
    }
}

}
