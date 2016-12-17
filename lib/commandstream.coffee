### MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license
###

cmdFormat = require('./commandformat')
protocol = require './protocol'
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

writeNewCmd = () ->
  b = new Buffer cmdFormat.commandSize
  b.fill 0, 0, cmdFormat.commandSize
  args = Array.prototype.slice.call arguments
  args.unshift b, 0
  writeCmd.apply this, args
  return b

dataToCommand = (data, tgt, tgtPort) ->
    # XXX: wrong way around, literal should call this, not
    if Array.isArray data
        literal = JSON.stringify data
#    else if typeof data == 'string'
#        literal = "\"#{data}\""
    else
        literal = data+''
    return dataLiteralToCommand literal, tgt, tgtPort

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

  # TODO: handle floats

  try
    value = JSON.parse(literal)
  catch err
    throw 'Unknown IIP data type for literal \'' + literal + '\' :' + err

  if Array.isArray value
    buffers = []
    # start bracket
    b = writeNewCmd cmdFormat.commands.SendPacket.id,
            tgt, tgtPort, cmdFormat.packetTypes.BracketStart.id,
    buffers.push b
    # values
    for val in value
        b = dataToCommand val, tgt, tgtPort
        buffers.push b
    # end bracket
    b = writeNewCmd cmdFormat.commands.SendPacket.id,
            tgt, tgtPort, cmdFormat.packetTypes.BracketEnd.id,
    buffers.push b

    return Buffer.concat buffers

  throw 'Unknown IIP data type for literal \'' + literal + '\''


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

addNode = (payload, componentLib, buffer, index) ->
  nodeName = payload.id
  componentName = payload.component
  comp = componentLib.getComponent(componentName)
  if typeof comp == 'undefined'
    throw new Error('Cannot find component: ' + componentName)

  # Add normal component
  parentId = undefined # subgraph not supported yet
  index += writeCmd(buffer, index, cmdFormat.commands.CreateComponent.id, comp.id, parentId or 0)
  return index

addEdge = (payload, componentLib, nodeMap, componentMap, buffer, index) ->
  srcNode = payload.src.node
  tgtNode = payload.tgt.node
  srcPort = undefined
  tgtPort = undefined
  try
    srcComponent = componentMap[srcNode]
    tgtComponent = componentMap[tgtNode]
    srcPort = componentLib.outputPort(srcComponent, payload.src.port).id
    tgtPort = componentLib.inputPort(tgtComponent, payload.tgt.port).id
  catch err
    throw new Error "Could not connect: #{srcNode} #{payload.src.port} -> #{payload.tgt.port} #{tgtNode} : #{err}"
  if tgtPort and srcPort
    index += writeCmd(buffer, index, cmdFormat.commands.ConnectNodes.id, nodeMap[srcNode].id, nodeMap[tgtNode].id, srcPort, tgtPort)

  return index

addInitial = (payload, componentLib, nodeMap, componentMap, buffer, index) ->
  tgtNode = payload.tgt.node
  tgtPort = undefined
  data = payload.src.data
  try
    tgtComponent = componentMap[tgtNode]
    tgtPort = componentLib.inputPort(tgtComponent, payload.tgt.port).id
  catch err
    throw new Error "Could not attach IIP: '#{data} -> #{tgtPort} #{tgtNode} : #{err}"
  cmdBuf = dataLiteralToCommand(data, nodeMap[tgtNode].id, tgtPort)
  index += writeCmd buffer, index, cmdBuf
  return index

cmdStreamBuildGraph = (currentNodeId, buffer, index, componentLib, graph) ->
  messages = protocol.graphToFbpMessages graph, 'default'

  nodeMap = graph.nodeMap
  startIndex = index

  componentMap = {}
  for message in messages
    if message.command == 'addnode'
      name = message.payload.id
      # Assign node names in consecutive order. Note: assumes runtime commandstream parsing does the same
      nodeMap[name] =
        id: currentNodeId++
      componentMap[name] = message.payload.component

  for message in messages
    if message.protocol != 'graph'
      throw new Error "Unknown FBP runtime sub-protocol #{message.protocol}"
    else if message.command == 'addnode'
      index = addNode message.payload, componentLib, buffer, index
    else if message.command == 'addedge'
      index = addEdge message.payload, componentLib, nodeMap, componentMap, buffer, index
    else if message.command == 'addinitial'
      index = addInitial message.payload, componentLib, nodeMap, componentMap, buffer, index
    else
      throw new Error "Unknown FBP runtime graph command #{message.command}" 

  r =
    index: index - startIndex
    nodeId: currentNodeId
  return r

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
    # TODO: move next to dataLiteralToCommand, for symmetry
    if type == 'Boolean'
      data = if cmdData.readUInt8(6) then true else false
    else if type == 'Void'
      data = null
    else if type == 'Integer' or type == 'Float'
      data = cmdData.readInt16LE(6)
    else if type == 'Byte'
      data = cmdData.readUInt8(6)
    else if type == 'BracketStart' or type == 'BracketEnd'
      data = type
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
    handler 'PONG', cmdData.slice(1, cmdFormat.commandSize)
  else if cmd == cmdFormat.commands.TransmissionEnded.id
    handler 'EOT'
  else if cmd == cmdFormat.commands.IoValueChanged.id
    handler 'IOCHANGE', cmdData.slice(0, cmdFormat.commandSize-1)
  else if cmd == cmdFormat.commands.SetIoValueCompleted.id
    handler 'IOACK', cmdData.slice(0, cmdFormat.commandSize-1)
  else if cmd == cmdFormat.commands.SendPacketDone.id
    handler 'SENDACK'
  else
    handler 'UNKNOWN' + cmd.toString(16), cmdData.slice(0, cmdFormat.commandSize-1)
  return

module.exports =
  cmdStreamFromGraph: cmdStreamFromGraph
  dataLiteralToCommand: dataLiteralToCommand
  dataToCommand: dataToCommand
  writeCmd: writeCmd
  writeString: writeString
  cmdFormat: cmdFormat
  format: cmdFormat
  parseReceivedCmd: parseReceivedCmd
  Buffer: Buffer
