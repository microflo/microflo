/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#ifndef MICROFLO_CPP
#define MICROFLO_CPP

#include "microflo.h"


#define MICROFLO_VALID_NODEID(id) \
   (id >= Network::firstNodeId && id <= lastAddedNodeIndex)

#ifdef HOST_BUILD
#include <cstring>
#else
#include "string.h"
#endif



bool Packet::asBool() const {
    if (msg == MsgVoid) {
        return true;
    } else {
        return data.boolean;
    }
}
long Packet::asInteger() const {
    if (msg == MsgVoid) {
        return 0;
    } else {
        return data.lng;
    }
}
float Packet::asFloat() const {
    if (msg == MsgVoid) {
        return 0.0;
    } else {
        return data.flt;
    }
}

unsigned char Packet::asByte() const {
    if (msg == MsgVoid) {
        return 0;
    } else {
        return data.byte;
    }
}
void *
Packet::asPointer(MicroFlo::PointerType desired) const {
    const MicroFlo::PointerType actual = msg - MsgPointerFirst;
    if (msg >= MsgPointerFirst && actual == desired) {
        return data.ptr;
    } else {
        return NULL;
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
    , debugLevel(DebugLevelError)
{}

void HostCommunication::setup(Network *net, HostTransport *t) {
    network = net;
    transport = t;

    MICROFLO_DEBUG(this, DebugLevelInfo, DebugProgramStart);
    network->setNotificationHandler(this);
}

bool HostCommunication::checkRespondMagic() {

    const bool matches = memcmp(buffer, MICROFLO_GRAPH_MAGIC, sizeof(MICROFLO_GRAPH_MAGIC)) == 0;
    const uint8_t requestId = buffer[MICROFLO_CMD_SIZE-1];
    if (matches) {
        MICROFLO_DEBUG(this, DebugLevelDetailed, DebugMagicMatched);
        const uint8_t cmd[] = { requestId, GraphCmdCommunicationOpen };
        transport->sendCommand(cmd, sizeof(cmd));
    }
    return matches;
}

void HostCommunication::parseByte(char b) {

    buffer[currentByte++] = b;

    if (state == ParseHeader) {
        MICROFLO_DEBUG(this, DebugLevelVeryDetailed, DebugParseHeader);
        if (currentByte == MICROFLO_CMD_SIZE) {
            if (checkRespondMagic()) {
                state = ParseCmd;
            } else {
                MICROFLO_DEBUG(this, DebugLevelError, DebugMagicMismatch);
                state = Invalid;
            }
            currentByte = 0;
        }
    } else if (state == ParseCmd) {
        MICROFLO_DEBUG(this, DebugLevelVeryDetailed, DebugParseCommand);
        if (currentByte == MICROFLO_CMD_SIZE) {
            if (checkRespondMagic()) {
                // already in ParseCmd state
            } else {
                parseCmd();
            }
            currentByte = 0;
        }
    } else if (state == LookForHeader) {
        MICROFLO_DEBUG(this, DebugLevelVeryDetailed, DebugParseLookForHeader);
        if (b == MICROFLO_GRAPH_MAGIC[0]) {
            state = ParseHeader;
            buffer[0] = b;
            currentByte = 1;
        } else {
            currentByte = 0;
        }

    } else if (state == Invalid) {
        MICROFLO_DEBUG(this, DebugLevelError, DebugParserInvalidState);
        // try to recover
        currentByte = 0;
        state = LookForHeader;
    } else {
        MICROFLO_DEBUG(this, DebugLevelError,DebugParserUnknownState);
        // try to recover
        currentByte = 0;
        state = LookForHeader;
    }
}

void HostCommunication::respondStartStop(uint8_t requestId) {
    const Network::State state = network->currentState();
    uint8_t status;
    if (state == Network::Running) {
        status = GraphCmdNetworkStarted;
    } else if (state == Network::Stopped) {
        status = GraphCmdNetworkStopped;
    }
    uint8_t cmd[] = { requestId, status };
    transport->sendCommand(cmd, sizeof(cmd));
}


int32_t readInt32(const uint8_t data[4]) {
    // FIXME: take endianness into account
    return data[0] + ((int32_t)(data[1])<<8) + ((int32_t)(data[2])<<16) + ((int32_t)(data[3])<<24);
}

Packet parsePacket(const uint8_t *data) {
    Packet p;
    const Msg packetType = (Msg)data[0];

    if (packetType == MsgBracketStart || packetType == MsgBracketEnd || packetType == MsgVoid) {
        p = Packet(packetType);
    } else if (packetType == MsgInteger) {
        p = Packet((long)readInt32(data+1));
    } else if (packetType == MsgByte) {
        p = Packet(data[1]);
    } else if (packetType == MsgBoolean) {
        p = Packet(!(data[1] == 0));
    } else if (packetType == MsgError) {
        p = Packet((Error)(data[1]));
    }
    return p;
}

#define CHECK_ERROR(expr) \
do { \
    const MicroFlo::Error e = (expr);\
    if (e != 0) { \
        const uint8_t err[] = { requestId, GraphCmdError, (uint8_t)e }; \
        transport->sendCommand(err, sizeof(err)); \
        return; \
    } \
} while(0)

void HostCommunication::parseCmd() {

    const uint8_t requestId = buffer[0];
    const GraphCmd cmd = (GraphCmd)buffer[1];
    const unsigned char *args = buffer+2;

    if (cmd == GraphCmdEnd) {
        MICROFLO_DEBUG(this, DebugLevelDetailed, DebugEndOfTransmission);
        const uint8_t response[] = { requestId, GraphCmdTransmissionEnded };
        transport->sendCommand(response, sizeof(response));
        state = LookForHeader;

    } else if (cmd == GraphCmdClearNodes) {
        CHECK_ERROR(network->clearNodes());
        const uint8_t response[] = { requestId, GraphCmdNodesCleared };
        transport->sendCommand(response, sizeof(response));

    } else if (cmd == GraphCmdStopNetwork) {
        CHECK_ERROR(network->stop());
        respondStartStop(requestId);

    } else if (cmd == GraphCmdStartNetwork) {
        CHECK_ERROR(network->start());
        respondStartStop(requestId);

    } else if (cmd == GraphCmdGetNetworkStatus) {
        const uint8_t running = network->currentState() == Network::Running ? 1 : 0;
        const uint8_t response[] = { requestId, GraphCmdNetworkStatus, running };
        transport->sendCommand(response, sizeof(response));

    } else if (cmd == GraphCmdCreateComponent) {
        const MicroFlo::ComponentId componentId = (MicroFlo::ComponentId)args[0];
        const MicroFlo::NodeId parentId = args[1];

        MICROFLO_DEBUG(this, DebugLevelDetailed, DebugComponentCreateStart);
        Component *c = createComponent(componentId);
        MICROFLO_DEBUG(this, DebugLevelDetailed, DebugComponentCreateEnd);

        CHECK_ERROR(network->addNode(c, parentId, NULL));
        const uint8_t response[] = { requestId, GraphCmdNodeAdded, c->component(), c->id(), parentId };
        transport->sendCommand(response, sizeof(response));

    } else if (cmd == GraphCmdRemoveNode) {
        const MicroFlo::NodeId nodeId = args[0];
        CHECK_ERROR(network->removeNode(nodeId));
        const uint8_t response[] = { requestId, GraphCmdNodeRemoved, nodeId };
        transport->sendCommand(response, sizeof(response));

    } else if (cmd == GraphCmdConnectNodes) {
        const MicroFlo::NodeId srcId = args[0];
        const MicroFlo::NodeId targetId = args[1];
        const MicroFlo::PortId srcPort = args[2];
        const MicroFlo::PortId targetPort = args[3];
        MICROFLO_DEBUG(this, DebugLevelDetailed, DebugConnectNodesStart);
        CHECK_ERROR(network->connect(srcId, srcPort, targetId, targetPort));
        const uint8_t response[] = { requestId, GraphCmdNodesConnected,
                                     srcId, (uint8_t)srcPort, targetId, (uint8_t)targetPort };
        transport->sendCommand(response, sizeof(response));

    } else if (cmd == GraphCmdDisconnectNodes) {
        const MicroFlo::NodeId srcId = args[0];
        const MicroFlo::NodeId targetId = args[1];
        const MicroFlo::PortId srcPort = args[2];
        const MicroFlo::PortId targetPort = args[3];
        CHECK_ERROR(network->disconnect(srcId, srcPort, targetId, targetPort));
        const uint8_t response[] = { requestId, GraphCmdNodesDisconnected,
                                    srcId, (uint8_t)srcPort, targetId, (uint8_t)targetPort };
        transport->sendCommand(response, sizeof(response));

    } else if (cmd == GraphCmdSendPacket) {
        const MicroFlo::NodeId node = args[0];
        const MicroFlo::PortId port = args[1];
        const Packet pkg = parsePacket(args+2);
        CHECK_ERROR(network->sendMessageTo(node, port, pkg));
        const uint8_t response[] = { requestId, GraphCmdSendPacketDone, node, (uint8_t)port, (uint8_t)pkg.type() };
        transport->sendCommand(response, sizeof(response));

    } else if (cmd == GraphCmdConfigureDebug) {
        debugLevel = (DebugLevel)args[0];
        const uint8_t response[] = { requestId, GraphCmdDebugChanged, (uint8_t)debugLevel};
        transport->sendCommand(response, sizeof(response));

    } else if (cmd == GraphCmdSubscribeToPort) {
        const MicroFlo::NodeId nodeId = args[0];
        const MicroFlo::PortId portId = args[1];
        const bool enable = (bool)args[2];
        CHECK_ERROR(network->subscribeToPort(nodeId, portId, enable));
        const uint8_t response[] = { requestId, GraphCmdPortSubscriptionChanged, nodeId, (uint8_t)portId, enable};
        transport->sendCommand(response, sizeof(response));

    } else if (cmd == GraphCmdConnectSubgraphPort) {
#ifdef MICROFLO_ENABLE_SUBGRAPHS
        // FIXME: validate
        const bool isOutput = (unsigned int)args[0];
        const MicroFlo::NodeId subgraphNode = (unsigned int)args[1];
        const MicroFlo::PortId subgraphPort = (unsigned int)args[2];
        const MicroFlo::NodeId childNode = (unsigned int)args[3];
        const MicroFlo:: PortId childPort = (unsigned int)args[4];
        CHECK_ERROR(network->connectSubgraph(isOutput, subgraphNode, subgraphPort, childNode, childPort));
        const uint8_t response[] = { requestId, GraphCmdSubgraphPortConnected,
                isOutput, subgraphNode, (uint8_t)subgraphPort, childNode, (uint8_t)childPort };
        transport->sendCommand(response, sizeof(response));
#else
        MICROFLO_DEBUG(this, DebugLevelError, DebugNotSupported);
#endif

    } else if (cmd == GraphCmdPing) {
        const uint8_t response[] = { requestId, GraphCmdPong,
                    args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7] };
        transport->sendCommand(response, sizeof(response));

    } else if (cmd == GraphCmdSetIoValue) {
        network->setIoValue(args, MICROFLO_CMD_SIZE-2);

    } else if (cmd >= GraphCmdInvalid) {
        MICROFLO_ASSERT(memcmp(buffer, MICROFLO_GRAPH_MAGIC, sizeof(MICROFLO_GRAPH_MAGIC)) == 0,
                        this, DebugLevelError, DebugParserInvalidCommand);

    } else {
        MICROFLO_DEBUG(this, DebugLevelError, DebugParserUnknownCommand);
    }
}

#undef CHECK_ERROR

void Component::setComponentId(MicroFlo::ComponentId id) {
    componentId = id;
}

void Component::send(Packet out, MicroFlo::PortId port) {
    MICROFLO_ASSERT(port < nPorts,
                    network->notificationHandler, DebugLevelError, DebugComponentSendInvalidPort);

    network->sendMessageFrom(this, port, out);
}

void Component::connect(MicroFlo::PortId outPort, Component *target, MicroFlo::PortId targetPort) {
    connections[outPort].target = target;
    connections[outPort].targetPort = targetPort;
}

void Component::disconnect(MicroFlo::PortId outPort, Component *target, MicroFlo::PortId targetPort) {
    connections[outPort].target = NULL;
    connections[outPort].targetPort = -2;
    connections[outPort].subscribed = false;
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

Network::Network(IO *io, MessageQueue *m)
    : lastAddedNodeIndex(Network::firstNodeId)
    , messageQueue(m)
    , notificationHandler(0)
    , io(io)
    , state(Reset)
{
    for (int i=0; i<MICROFLO_MAX_NODES; i++) {
        nodes[i] = 0;
    }
}

void Network::setNotificationHandler(NetworkNotificationHandler *handler) {
    notificationHandler = handler;
    io->debug = handler;
}

void Network::processMessages() {
    Message msg;
    messageQueue->newTick();

    while (messageQueue->pop(msg)) {
        Component *sender = 0;
        MicroFlo::PortId senderPort = resolveMessageTarget(msg, &sender);

        // send notification first, so we can listen also to ports for which there is no connections. For testing/MQTT etc
        const bool sendNotification = sender ? sender->connections[senderPort].subscribed : false;
        if (sendNotification && notificationHandler) {
            notificationHandler->packetSent(msg, sender, senderPort);
        }

        if (!msg.targetReferred) {
            continue; // could not resolve target, no-one connected on this port
        }
        Component *target = nodes[msg.node];
        if (!target) {
            continue; // FIXME: this should not happen
        }

        target->process(msg.pkg, msg.port);
    }
}

void Network::resolveMessageSubgraph(Message &msg, const Component *sender)
{
#ifdef MICROFLO_ENABLE_SUBGRAPHS
    // Note: Assumes msg is target referred
    Component *target = nodes[msg.node];
    MicroFlo::PortId targetPort = msg.port;
    const bool senderIsChild = sender && sender->parentNodeId >= Network::firstNodeId;
    if (senderIsChild) {
        SubGraph *parent = (SubGraph *)nodes[sender->parentNodeId];
        if (target == parent) {
            // Redirect output message from child outport, emit message on the parent outport
            // FIXME: should we change @sender / @senderPort, for debugging?
            msg.node = parent->outputConnections[targetPort].target->id();
            msg.port = parent->outputConnections[targetPort].targetPort;
        }
    }

    const bool targetIsSubGraph = target->componentId == MicroFlo::IdSubGraph;
    if (targetIsSubGraph) {
        SubGraph *targetSubGraph = (SubGraph *)target;
        // Redirect input message from, send to desired port on child
        // FIXME: should we change @sender / @senderPort, for debugging?
        msg.node = targetSubGraph->inputConnections[targetPort].target->id();
        msg.port = targetSubGraph->inputConnections[targetPort].targetPort;
    }
#endif
}

MicroFlo::PortId
Network::resolveMessageTarget(Message &msg, Component **out_sender)
{
    MicroFlo::PortId senderPort = -1;
    if (!msg.targetReferred) {
        *out_sender = nodes[msg.node];
        senderPort = msg.port;
        Connection &conn = (*out_sender)->connections[msg.port];
        if (conn.target) {
            msg.node = conn.target->id();
            msg.port = conn.targetPort;
            msg.targetReferred = true;
        }
    }
    if (msg.targetReferred) {
        resolveMessageSubgraph(msg, *out_sender);
    }
    return senderPort;
}

/* Note: must be interrupt-safe */
MicroFlo::Error Network::sendMessageFrom(Component *sender, MicroFlo::PortId senderPort, const Packet &pkg) {
    MICROFLO_RETURN_VAL_IF_FAIL(sender, DebugSendMessageInvalidNode);

    Message msg;
    msg.pkg = pkg;
    msg.targetReferred = false;
    msg.node = sender->id();
    msg.port = senderPort;
    messageQueue->push(msg);

    return MICROFLO_OK;
}

MicroFlo::Error Network::sendMessageTo(MicroFlo::NodeId targetId, MicroFlo::PortId targetPort, const Packet &pkg) {
    MICROFLO_RETURN_VAL_IF_FAIL(MICROFLO_VALID_NODEID(targetId), DebugSendMessageInvalidNode);
    MICROFLO_RETURN_VAL_IF_FAIL(pkg.isValid(), DebugParserUnknownPacketType);

    Message msg;
    msg.pkg = pkg;
    msg.targetReferred = true;
    msg.node = targetId;
    msg.port = targetPort;
    messageQueue->push(msg);

    return MICROFLO_OK;
}

void Network::distributePacket(const Packet &packet, MicroFlo::PortId port) {

    for (MicroFlo::NodeId i=0; i<MICROFLO_MAX_NODES; i++) {
        if (nodes[i]) {
            nodes[i]->process(packet, port);
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
    distributePacket(Packet(MsgTick), -1);
}

MicroFlo::Error Network::connect(MicroFlo::NodeId srcId, MicroFlo::PortId srcPort,
                      MicroFlo::NodeId targetId,MicroFlo::PortId targetPort) {
    MICROFLO_RETURN_VAL_IF_FAIL(MICROFLO_VALID_NODEID(srcId) && MICROFLO_VALID_NODEID(targetId),
                                DebugNetworkConnectInvalidNodes);

    return connect(nodes[srcId], srcPort, nodes[targetId], targetPort);
}

MicroFlo::Error Network::connect(Component *src, MicroFlo::PortId srcPort,
                      Component *target, MicroFlo::PortId targetPort) {
    src->connect(srcPort, target, targetPort);
    return MICROFLO_OK;
}

MicroFlo::Error Network::disconnect(MicroFlo::NodeId srcId, MicroFlo::PortId srcPort,
                      MicroFlo::NodeId targetId,MicroFlo::PortId targetPort) {
    MICROFLO_RETURN_VAL_IF_FAIL(MICROFLO_VALID_NODEID(srcId) && MICROFLO_VALID_NODEID(targetId),
                            DebugNetworkConnectInvalidNodes);

    return disconnect(nodes[srcId], srcPort, nodes[targetId], targetPort);
}

MicroFlo::Error Network::disconnect(Component *src, MicroFlo::PortId srcPort,
                      Component *target, MicroFlo::PortId targetPort) {
    src->disconnect(srcPort, target, targetPort);
    return MICROFLO_OK;
}

MicroFlo::Error Network::addNode(Component *node, MicroFlo::NodeId parentId, MicroFlo::NodeId *out_id) {
    MICROFLO_RETURN_VAL_IF_FAIL(node, DebugAddNodeInvalidInstance);
    MICROFLO_RETURN_VAL_IF_FAIL(parentId <= lastAddedNodeIndex, DebugAddNodeInvalidParent);

    const int nodeId = lastAddedNodeIndex;
    nodes[nodeId] = node;
    node->setNetwork(this, nodeId, this->io);
    if (parentId > 0) {
        node->setParent(parentId);
    }

    lastAddedNodeIndex++;
    if (out_id) {
        *out_id = nodeId;
    }
    return MICROFLO_OK;
}

MicroFlo::Error Network::removeNode(MicroFlo::NodeId nodeId) {
    MICROFLO_RETURN_VAL_IF_FAIL(nodeId <= lastAddedNodeIndex, DebugRemoveNodeInvalidInstance);
    Component *node = nodes[nodeId];
    MICROFLO_RETURN_VAL_IF_FAIL(node, DebugRemoveNodeInvalidInstance);

    delete node;
    nodes[nodeId] = 0;

    return MICROFLO_OK;
}

MicroFlo::Error Network::clearNodes() {

    for (int i=0; i<MICROFLO_MAX_NODES; i++) {
        if (nodes[i]) {
            delete nodes[i];
            nodes[i] = 0;
        }
    }
    lastAddedNodeIndex = Network::firstNodeId;
    messageQueue->clear();
    return MICROFLO_OK;
}

MicroFlo::Error Network::start() {
    state = Running;
    return MICROFLO_OK;
}

MicroFlo::Error Network::stop() {
    state = Stopped;
    return MICROFLO_OK;
}

MicroFlo::Error Network::setIoValue(const uint8_t *args, uint8_t len) {
    io->setIoValue(args, len);
    return MICROFLO_OK;
}

MicroFlo::Error Network::subscribeToPort(MicroFlo::NodeId nodeId, MicroFlo::PortId portId, bool enable) {
    MICROFLO_RETURN_VAL_IF_FAIL(MICROFLO_VALID_NODEID(nodeId),
                                DebugSubscribePortInvalidNode);
    Component *c = nodes[nodeId];
    MICROFLO_RETURN_VAL_IF_FAIL(c,
                            DebugSubscribePortInvalidNode);
    MICROFLO_RETURN_VAL_IF_FAIL(portId >= 0 && portId < c->nPorts,
                            DebugSubscribePortInvalidPort);

    c->connections[portId].subscribed = enable;
    return MICROFLO_OK;
}

MicroFlo::Error Network::connectSubgraph(bool isOutput,
                              MicroFlo::NodeId subgraphNode, MicroFlo::PortId subgraphPort,
                              MicroFlo::NodeId childNode, MicroFlo::PortId childPort) {
#ifdef MICROFLO_ENABLE_SUBGRAPHS

    MICROFLO_RETURN_VAL_IF_FAIL(MICROFLO_VALID_NODEID(subgraphNode) && MICROFLO_VALID_NODEID(childNode),
                                DebugSubGraphConnectInvalidNodes);

    Component *comp = nodes[subgraphNode];
    Component *child = nodes[childNode];
    MICROFLO_RETURN_VAL_IF_FAIL(comp->component() == MicroFlo::IdSubGraph && child->parentNodeId >= Network::firstNodeId,                       
                                DebugSubGraphConnectNotASubgraph);

    SubGraph *subgraph = (SubGraph *)comp;
    if (isOutput) {
        subgraph->connectOutport(subgraphPort, child, childPort);
    } else {
        subgraph->connectInport(subgraphPort, child, childPort);
    }
#else
    MICROFLO_DEBUG(this, DebugLevelError, DebugNotSupported);
#endif
    return MICROFLO_OK;
}


void HostCommunication::packetSent(const Message &m, const Component *src, MicroFlo::PortId srcPort) {
    if (!src) {
        return;
    }

    uint8_t cmd[MICROFLO_CMD_SIZE] = {
        0, GraphCmdPacketSent,
        src->id(), (uint8_t)srcPort, (uint8_t)(m.targetReferred ? 1 : 0),
        (uint8_t)m.pkg.type(),
        0, 0, 0, 0 // data, 4 bytes
    };
    uint8_t *data = cmd + 6;

    if (m.pkg.isData()) {
        if (m.pkg.isBool()) {
            data[0] = m.pkg.asBool();
        } else if (m.pkg.isNumber()){
            // TODO: move into writeInt32 function, take endianness into account
            const int i = m.pkg.asInteger();
            data[0] = i>>0;
            data[1] = i>>8;
            data[2] = i>>16;
            data[3] = i>>24;
        } else if (m.pkg.isError()) {
            data[0] = (uint8_t)m.pkg.asError();
        } else if (m.pkg.isVoid() || m.pkg.isStartBracket() || m.pkg.isEndBracket()) {
            // Nothing needs doing
        } else {
            // FIXME: support all types
            MICROFLO_DEBUG(this, DebugLevelError, DebugNotImplemented);
        }
    }
    transport->sendCommand(cmd, sizeof(cmd));
}

void HostCommunication::emitDebug(DebugLevel level, DebugId id) {
#ifdef MICROFLO_ENABLE_DEBUG
    if (level <= debugLevel) {
        const uint8_t cmd[] = { 0, GraphCmdDebugMessage, (uint8_t)level, (uint8_t)id };
        transport->sendCommand(cmd, sizeof(cmd));
    }
#endif
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

void SerialHostTransport::sendCommand(const uint8_t *b, uint8_t len) {
    // Make sure to pad to the cmd size
    for (uint8_t i=0; i<MICROFLO_CMD_SIZE; i++) {
        io->SerialWrite(serialPort, (i < len) ?  b[i] : 0x00);
    }
}

#ifdef MICROFLO_ENABLE_SUBGRAPHS
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
    MICROFLO_ASSERT(port < 0,
                    network->notificationHandler,DebugLevelError, DebugSubGraphReceivedNormalMessage);
}
#endif

void FixedMessageQueue::newTick()
{
    // Messages may be emitted during delivery, so copy the range we intend to deliver
    previous = current;
}

void FixedMessageQueue::clear()
{
    previous = MessageRange();
    current = MessageRange();
}

bool FixedMessageQueue::push(const Message &msg)
{
    if (current.write >= maxMessages-1) {
        current.write = 0;
    }
    const MessageId msgIndex = current.write++;
    // FIXME: prevent overwriting
    messages[msgIndex] = msg;
    return true;
}

bool FixedMessageQueue::pop(Message &msg)
{
    if (previous.read == previous.write) {
        // no messages left
        current.read = previous.write;
        return false;
    }
    if (previous.read >= maxMessages-1) {
        previous.read = 0;
    }
    const MessageId msgIndex = previous.read++;
    msg = messages[msgIndex];
    return true;
}

#endif // MICROFLO_CPP
