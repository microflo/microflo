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

serializeData = (literal) ->
  # Integer
  value = parseInt(literal)
  if typeof value == 'number' and value % 1 == 0
    b = new Buffer(cmdFormat.commandSize-4)
    b.fill(0)
    b.writeInt32LE value, 0
    return { type: 'Integer', data: b }
  # Boolean
  isBool = literal == 'true' or literal == 'false'
  value = literal == 'true'
  if isBool
    b = new Buffer(cmdFormat.commandSize-4)
    b.fill(0)
    val = if value then 1 else 0
    b.writeInt8 val, 0
    return { type: 'Boolean', data: b }

  return null # not a plain value
  # TODO: handle floats

deserializeData = (buf, offset) ->
    type = nodeNameById cmdFormat.packetTypes, buf.readUInt8(offset)
    data = undefined
    if type == 'Boolean'
      data = if buf.readUInt8(offset+1) then true else false
    else if type == 'Void'
      data = null
    else if type == 'Integer' or type == 'Float'
      data = buf.readInt16LE(offset+1) # FIXME: not enough space in PacketSent
    else if type == 'Byte'
      data = buf.readUInt8(offset+1)
    else if type == 'BracketStart' or type == 'BracketEnd'
      data = type
    else
      console.log 'Unknown data type in PacketSent: ', type
    return { type: type, data: data }


dataToCommandDescriptions = (data) ->
    # XXX: wrong way around, literal should call this, not
    if Array.isArray data
        literal = JSON.stringify data
#    else if typeof data == 'string'
#        literal = "\"#{data}\""
    else
        literal = data+''
    return dataLiteralToCommandDescriptions literal

# literal is a string, typically from a .FBP graph
dataLiteralToCommandDescriptions = (literal) ->
  commands = [] # [ { type: '', data: ?Buffer } ]
  literal = literal.replace('^"|"$', '')

  basic = serializeData literal
  if basic
    return [ basic ]

  # compound type / stream
  try
    value = JSON.parse(literal)
  catch err
    throw 'Unknown IIP data type for literal \'' + literal + '\' :' + err

  if Array.isArray value
    commands.push { type: "BracketStart" }
    for val in value
        subs = dataToCommandDescriptions val
        commands = commands.concat subs
    commands.push { type: "BracketEnd" }
    return commands

  throw 'Unknown IIP data type for literal \'' + literal + '\''

serializeCommands = (commands, tgt, tgtPort) ->
  buffers = []
  for cmd in commands
    type = cmdFormat.packetTypes[cmd.type].id
    header = new Buffer 4
    header.writeInt8 cmdFormat.commands.SendPacket.id, 0
    header.writeUInt8 tgt, 1
    header.writeUInt8 tgtPort, 2
    header.writeUInt8 type, 3
    data = cmd.data
    if not data
        data = new Buffer cmdFormat.commandSize-4
        data.fill 0
    buffers.push header
    buffers.push data

  r = Buffer.concat buffers
  return r

dataLiteralToCommand = (literal, tgt, tgtPort) ->
  commands = dataLiteralToCommandDescriptions literal
  return serializeCommands commands, tgt, tgtPort

dataToCommand = (data, tgt, tgtPort) ->
  commands = dataToCommandDescriptions data
  return serializeCommands commands, tgt, tgtPort

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

# TODO: move all these down into "protocol", along with the inverse functions
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
  if not tgtPort?
    throw new Error "Could not find target port #{tgtNode}(#{tgtComponent}) #{payload.tgt.port}"
  if not srcPort?
    throw new Error "Could not find source port #{srcNode}#{srcComponent} #{payload.src.port}"

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

clearGraph = (payload, buffer, index) ->
  # Clear existing graph
  index += writeCmd(buffer, index, cmdFormat.commands.Reset.id)
  return index

startNetwork = (payload, buffer, index) ->
  index += writeCmd(buffer, index, cmdFormat.commands.StartNetwork.id)
  return index

# The following are MicroFlo specific, not part of FBP runtime protocol
configureDebug = (payload, buffer, index) ->
  debugLevel = payload.level
  index += writeCmd(buffer, index, cmdFormat.commands.ConfigureDebug.id, cmdFormat.debugLevels[debugLevel].id)
  return index

openCommunication = (payload, buffer, index) ->
  index += writeString(buffer, index, cmdFormat.magicString)
  return index

closeCommunication = (payload, buffer, index) ->
  index += writeCmd(buffer, index, cmdFormat.commands.End.id)
  return index

# TODO: implement the inverse, getting a FBP protocol message from CS
toCommandStreamBuffer = (message, componentLib, nodeMap, componentMap, buffer, index) ->
  if message.protocol == 'graph'
    # TODO: also support removenode/removeedge/removeinitial
    if message.command == 'clear'
      index = clearGraph message.payload, buffer, index
    else if message.command == 'addnode'
      index = addNode message.payload, componentLib, buffer, index
    else if message.command == 'addedge'
      index = addEdge message.payload, componentLib, nodeMap, componentMap, buffer, index
    else if message.command == 'addinitial'
      index = addInitial message.payload, componentLib, nodeMap, componentMap, buffer, index
    else
      throw new Error "Unknown FBP runtime graph command #{message.command}" 

  else if message.protocol == 'network'
    if message.command == 'start'
      index = startNetwork message.payload, buffer, index
    else
      throw new Error "Unknown FBP runtime network command #{message.command}"

  else if message.protocol == 'microflo'
    if message.command == 'opencommunication'
      index = openCommunication message.payload, buffer, index
    else if message.command == 'closecommunication'
      index = closeCommunication message.payload, buffer, index
    else if message.command == 'configuredebug'
      index = configureDebug message.payload, buffer, index
    else
      throw new Error "Unknown FBP runtime microflo command #{message.command}"
  else    
      throw new Error "Unknown FBP runtime sub-protocol #{message.protocol}"

  return index

# As a list of FBP runtime messages
initialGraphMessages = (graph, graphName, debugLevel, openclose) ->
  messages = []

  # Start comm
  if openclose
    messages.push
      protocol: 'microflo'
      command: 'opencommunication'
      payload: null

  # Clear graph
  messages.push
    protocol: 'graph'
    command: 'clear'
    payload:
      id: graphName

  # Config
  messages.push
    protocol: 'microflo'
    command: 'configuredebug'
    payload:
      level: debugLevel

  # Actual graph
  graphMessages = protocol.graphToFbpMessages graph, 'default'
  messages = messages.concat graphMessages

  # Start the network
  messages.push
    protocol: 'network'
    command: 'start'
    payload: null

  # Stop comm
  if openclose
    messages.push
      protocol: 'microflo'
      command: 'closecommunication'
      payload: null

  return messages

# Build component/node mapping
buildMappings = (messages) ->
  nodeMap = {}
  componentMap = {}
  currentNodeId = 1
  for message in messages
    if message.command == 'addnode'
      name = message.payload.id
      # Assign node names in consecutive order. Note: assumes runtime commandstream parsing does the same
      nodeMap[name] =
        id: currentNodeId++
      componentMap[name] = message.payload.component
  r =
    nodes: nodeMap
    components: componentMap
  return r

cmdStreamFromGraph = (componentLib, graph, debugLevel, openclose) ->
  debugLevel = debugLevel or 'Error'
  buffer = new Buffer(10*1024) # FIXME: unhardcode
  index = 0
  graphName = 'default'

  messages = initialGraphMessages graph, graphName, debugLevel, openclose
  mapping = buildMappings messages
  for message in messages
    index = toCommandStreamBuffer message, componentLib, mapping.nodes, mapping.components, buffer, index

  graph.nodeMap = mapping.nodes # HACK
  buffer = buffer.slice(0, index)
  return buffer

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

# TODO: move each parsing into individual function and merge logic deviceResponseToFbpProtocol
# to return a FBP runtime message directly. Should then be the inverse of toCommandStreamBuffer/addNode/addInitial etc.
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
    dataOffset = 5
    { data, type } = deserializeData cmdData, dataOffset
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
  dataLiteralToCommandDescriptions: dataLiteralToCommandDescriptions
  writeCmd: writeCmd
  writeString: writeString
  cmdFormat: cmdFormat
  format: cmdFormat
  parseReceivedCmd: parseReceivedCmd
  Buffer: Buffer
  buildMappings: buildMappings
  initialGraphMessages: initialGraphMessages
  toCommandStreamBuffer: toCommandStreamBuffer
