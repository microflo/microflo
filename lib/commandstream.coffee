### MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license
###

cmdFormat = require('./commandformat')
util = require('./util')
Buffer = util.Buffer
fbp = require('fbp')

writeCmd = ->
  buf = arguments[0]
  offset = arguments[1]
  data = arguments[2]
  if typeof data == 'object' and data.length?
    # Buffer
    data.copy buf, offset
    return data.length
  else
    data = Array::slice.call(arguments, 2)
  i = 0
  while i < cmdFormat.commandSize
    # console.log(offset, data);
    if i < data.length
      buf.writeUInt8 data[i], offset + i
    else
      buf.writeUInt8 0, offset + i
    i++
  cmdFormat.commandSize

writeString = (buf, offset, string) ->
  i = 0
  while i < string.length
    buf[offset + i] = string.charCodeAt(i)
    i++
  string.length

dataLiteralToCommand = (literal, tgt, tgtPort) ->
  b = null
  literal = literal.replace('^"|"$', '')
  # Integer
  value = parseInt(literal)
  if typeof value == 'number' and value % 1 == 0
    b = new Buffer(cmdFormat.commandSize)
    b.fill 0
    b.writeUInt8 cmdFormat.commands.SendPacket.id, 0
    b.writeUInt8 tgt, 1
    b.writeUInt8 tgtPort, 2
    b.writeInt8 cmdFormat.packetTypes.Integer.id, 3
    b.writeInt32LE value, 4
    return b
  # Boolean
  isBool = literal == 'true' or literal == 'false'
  value = literal == 'true'
  if isBool
    b = new Buffer(cmdFormat.commandSize)
    b.fill 0
    b.writeUInt8 cmdFormat.commands.SendPacket.id, 0
    b.writeUInt8 tgt, 1
    b.writeUInt8 tgtPort, 2
    b.writeInt8 cmdFormat.packetTypes.Boolean.id, 3
    val = if value then 1 else 0
    b.writeInt8 val, 4
    return b
  try
    value = JSON.parse(literal)
  catch err
    throw 'Unknown IIP data type for literal \'' + literal + '\' :' + err
  # Array of bytes/integers
  isByteArray = typeof value[0] == 'string'
  if true
    b = new Buffer(cmdFormat.commandSize * (value.length + 2))
    offset = 0
    b.fill 0, offset, offset + cmdFormat.commandSize
    b.writeUInt8 cmdFormat.commands.SendPacket.id, offset + 0
    b.writeUInt8 tgt, offset + 1
    b.writeUInt8 tgtPort, offset + 2
    b.writeInt8 cmdFormat.packetTypes.BracketStart.id, offset + 3
    offset += cmdFormat.commandSize
    i = 0
    while i < value.length
      b.fill 0, offset, offset + cmdFormat.commandSize
      b.writeUInt8 cmdFormat.commands.SendPacket.id, offset + 0
      b.writeUInt8 tgt, offset + 1
      b.writeUInt8 tgtPort, offset + 2
      v = parseInt(value[i])
      if isByteArray
        b.writeInt8 cmdFormat.packetTypes.Byte.id, offset + 3
        b.writeUInt8 v, offset + 4
      else
        b.writeInt8 cmdFormat.packetTypes.Integer.id, offset + 3
        b.writeInt32LE v, offset + 4
      offset += cmdFormat.commandSize
      i++
    b.fill 0, offset, offset + cmdFormat.commandSize
    b.writeUInt8 cmdFormat.commands.SendPacket.id, offset + 0
    b.writeUInt8 tgt, offset + 1
    b.writeUInt8 tgtPort, offset + 2
    b.writeInt8 cmdFormat.packetTypes.BracketEnd.id, offset + 3
    offset += cmdFormat.commandSize
    return b
  throw 'Unknown IIP data type for literal \'' + literal + '\''
  # TODO: handle floats, strings
  return

findPort = (componentLib, graph, nodeName, portName) ->
  isOutput = false
  port = componentLib.inputPort(graph.processes[nodeName].component, portName)
  if !port
    port = componentLib.outputPort(graph.processes[nodeName].component, portName)
    isOutput = true
  {
    isOutput: isOutput
    port: port
  }

cmdStreamBuildSubGraph = (currentNodeId, buffer, index, componentLib, graph, nodeName, comp) ->
  index += writeCmd(buffer, index, cmdFormat.commands.CreateComponent.id, componentLib.getComponent('SubGraph').id)
  graph.nodeMap[nodeName] = id: currentNodeId++
  subgraph = comp.graph
  subgraph.nodeMap = graph.nodeMap
  graph.processes[nodeName].graph = subgraph
  r = cmdStreamBuildGraph(currentNodeId, buffer, index, componentLib, subgraph, nodeName)
  index += r.index
  currentNodeId = r.nodeId
  i = 0
  while i < subgraph.exports.length
    c = subgraph.exports[i]
    tok = c['private'].split('.')
    if tok.length != 2
      throw 'Invalid export definition'
    childNode = graph.nodeMap[tok[0]]
    childPort = findPort(componentLib, subgraph, tok[0], tok[1])
    subgraphNode = graph.nodeMap[nodeName]
    subgraphPort = componentLib.inputPort(graph.processes[nodeName].component, c['public'])
    value = if childPort.isOutput then 1 else 0
    index += writeCmd buffer, index, cmdFormat.commands.ConnectSubgraphPort.id, value,
                      subgraphNode.id, subgraphPort.id, childNode.id, childPort.port.id
    i++
  {
    index: index
    nodeId: currentNodeId
  }

cmdStreamBuildGraph = (currentNodeId, buffer, index, componentLib, graph, parent) ->
  nodeMap = graph.nodeMap
  startIndex = index
  # Create components
  for nodeName of graph.processes
    if !graph.processes.hasOwnProperty(nodeName)
      i++
      continue
    process = graph.processes[nodeName]
    comp = componentLib.getComponent(process.component)
    if typeof comp == 'undefined'
      throw new Error('Cannot find component: ' + process.component)
    if comp.graph or comp.graphFile
      # Inject subgraph
      r = cmdStreamBuildSubGraph(currentNodeId, buffer, index, componentLib, graph, nodeName, comp)
      index = r.index
      currentNodeId = r.nodeId
    else
      # Add normal component
      parentId = if parent then nodeMap[parent].id else undefined
      if parentId
        graph.processes[nodeName].parent = parentId
      index += writeCmd(buffer, index, cmdFormat.commands.CreateComponent.id, comp.id, parentId or 0)
      nodeMap[nodeName] =
        id: currentNodeId++
        parent: parentId
  # Connect nodes
  graph.connections.forEach (connection) ->
    if connection.src != undefined
      srcNode = connection.src.process
      tgtNode = connection.tgt.process
      srcPort = undefined
      tgtPort = undefined
      try
        srcPort = componentLib.outputPort(graph.processes[srcNode].component, connection.src.port).id
        tgtPort = componentLib.inputPort(graph.processes[tgtNode].component, connection.tgt.port).id
      catch err
        throw 'Could not connect: ' + srcNode + ' ' + connection.src.port + ' -> ' + connection.tgt.port + ' ' + tgtNode + ' : ' + err.toString()
      if tgtPort != undefined and srcPort != undefined
        index += writeCmd(buffer, index, cmdFormat.commands.ConnectNodes.id, nodeMap[srcNode].id, nodeMap[tgtNode].id, srcPort, tgtPort)
    return
  # Send IIPs
  graph.connections.forEach (connection) ->
    if connection.data != undefined
      tgtNode = connection.tgt.process
      tgtPort = undefined
      try
        component = graph.processes[tgtNode].component
        tgtPort = componentLib.inputPort(component, connection.tgt.port).id
      catch err
        throw 'Could not attach IIP: \'' + connection.data.toString() + '\' -> ' + tgtPort + ' ' + tgtNode + ' : ' + err
      cmdBuf = dataLiteralToCommand(connection.data, nodeMap[tgtNode].id, tgtPort)
      index += writeCmd buffer, index, cmdBuf
    return
  {
    index: index - startIndex
    nodeId: currentNodeId
  }

# TODO: actually add observers to graph, and emit a command stream for the changes

cmdStreamFromGraph = (componentLib, graph, debugLevel, openclose) ->
  debugLevel = debugLevel or 'Error'
  buffer = new Buffer(1024)
  # FIXME: unhardcode
  index = 0
  currentNodeId = 1
  if !graph.nodeMap
    graph.nodeMap = {}
  # Start comm
  if openclose
    index += writeString(buffer, index, cmdFormat.magicString)
  # Clear existing graph
  index += writeCmd(buffer, index, cmdFormat.commands.Reset.id)
  # Config
  index += writeCmd(buffer, index, cmdFormat.commands.ConfigureDebug.id, cmdFormat.debugLevels[debugLevel].id)
  # Actual graph
  r = cmdStreamBuildGraph(currentNodeId, buffer, index, componentLib, graph)
  index += r.index
  currentNodeId = r.nodeId
  # Start the network
  index += writeCmd(buffer, index, cmdFormat.commands.StartNetwork.id)
  if openclose
    index += writeCmd(buffer, index, cmdFormat.commands.End.id)
  buffer = buffer.slice(0, index)
  buffer

nodeNameById = (nodeMap, wantedId) ->
  for name of nodeMap
    `name = name`
    id = if nodeMap[name].id != undefined then nodeMap[name].id else nodeMap[name]
    if id == wantedId
      return name
  return

nodeLookup = (graph, nodeName) ->
  parent = graph.nodeMap[nodeName].parent
  r = if parent != undefined then graph.processes[nodeNameById(graph.nodeMap, parent)].graph.processes else graph.processes
  r[nodeName]

parseReceivedCmd = (componentLib, graph, cmdData, handler) ->
  `var targetPort`
  `var targetNode`
  `var srcPort`
  `var srcNode`
  if !componentLib
    throw new Error('Missing component library')
  cmd = cmdData.readUInt8(0)
  if cmd == cmdFormat.commands.NetworkStopped.id
    handler 'NETSTOP'
  else if cmd == cmdFormat.commands.NetworkStarted.id
    handler 'NETSTART'
  else if cmd == cmdFormat.commands.NodeAdded.id
    component = componentLib.getComponentById(cmdData.readUInt8(1)).name
    nodeName = nodeNameById(graph.nodeMap, cmdData.readUInt8(2))
    handler 'ADD', nodeName, '(', component, ')'
  else if cmd == cmdFormat.commands.NodesConnected.id
    srcNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(1))
    return if not srcNode # can happen for internal connection
    srcComponent = nodeLookup(graph, srcNode).component
    srcPort = componentLib.outputPortById(srcComponent, cmdData.readUInt8(2)).name
    targetNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(3))
    return if not targetNode # can happen for internal connection
    targetComponent = nodeLookup(graph, targetNode).component
    targetPort = componentLib.inputPortById(targetComponent, cmdData.readUInt8(4)).name
    handler 'CONNECT', srcNode, srcPort, '->', targetPort, targetNode
  else if cmd == cmdFormat.commands.DebugChanged.id
    level = nodeNameById(cmdFormat.debugLevels, cmdData.readUInt8(1))
    handler 'DEBUGLEVEL', level
  else if cmd == cmdFormat.commands.DebugMessage.id
    lvl = cmdData.readUInt8(1)
    point = nodeNameById(cmdFormat.debugPoints, cmdData.readUInt8(2))
    handler 'DEBUG', lvl, point
  else if cmd == cmdFormat.commands.PortSubscriptionChanged.id
    node = nodeNameById(graph.nodeMap, cmdData.readUInt8(1))
    port = componentLib.outputPortById(graph.processes[node].component, cmdData.readUInt8(2)).name
    enable = if cmdData.readUInt8(3) then 'true' else 'false'
    handler 'SUBSCRIBE', node, '->', port, enable
  else if cmd == cmdFormat.commands.PacketSent.id
    srcNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(1))
    srcPort = componentLib.outputPortById(nodeLookup(graph, srcNode).component, cmdData.readUInt8(2)).name
    targetNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(3))
    targetPort = componentLib.inputPortById(nodeLookup(graph, targetNode).component, cmdData.readUInt8(4)).name
    type = nodeNameById(cmdFormat.packetTypes, cmdData.readUInt8(5))
    data = undefined
    if type == 'Boolean'
      data = if cmdData.readUInt8(6) then true else false
    else if type == 'Void'
      data = null
    else if type == 'Integer' or type == 'Float'
      data = cmdData.readInt16LE(6)
    else
      console.log 'Unknown data type in PacketSent: ', type
    handler 'SEND', srcNode, srcPort, type, data, targetNode, targetPort
  else if cmd == cmdFormat.commands.SubgraphPortConnected.id
    direction = if cmdData.readUInt8(1) then 'output' else 'input'
    portById = if direction == 'output' then componentLib.outputPortById else componentLib.inputPortById
    subgraphNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(2))
    subgraphPort = portById(nodeLookup(graph, subgraphNode).component, cmdData.readUInt8(3)).name
    childNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(4))
    childPort = portById(nodeLookup(graph, childNode).component, cmdData.readUInt8(5)).name
    handler 'SUBGRAPH-CONNECT', direction, subgraphNode, subgraphPort, childNode, childPort
  else if cmd == cmdFormat.commands.CommunicationOpen.id
    handler 'OPEN'
  else if cmd == cmdFormat.commands.Pong.id
    handler 'PONG', cmdData.slice(1, 8)
  else if cmd == cmdFormat.commands.TransmissionEnded.id
    handler 'EOT'
  else if cmd == cmdFormat.commands.IoValueChanged.id
    handler 'IOCHANGE', cmdData.slice(0, 7)
  else if cmd == cmdFormat.commands.SetIoValueCompleted.id
    handler 'IOACK', cmdData.slice(0, 7)
  else if cmd == cmdFormat.commands.SendPacketDone.id
    handler 'SENDACK'
  else
    handler 'UNKNOWN' + cmd.toString(16), cmdData.slice(0, 8)
  return

module.exports =
  cmdStreamFromGraph: cmdStreamFromGraph
  dataLiteralToCommand: dataLiteralToCommand
  writeCmd: writeCmd
  writeString: writeString
  cmdFormat: cmdFormat
  format: cmdFormat
  parseReceivedCmd: parseReceivedCmd
  Buffer: Buffer
