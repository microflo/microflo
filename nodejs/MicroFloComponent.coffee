noflo = require 'noflo'
microflo = require '../lib/microflo'
c = require "../lib/componentlib"
componentLib = new c.ComponentLibrary c.defaultComponents, '../microflo'

# FIXME: should be shielded inside microflo.js
serialport = require 'serialport'

# IDEA: implement the subscribeSubgraph protocol that NoFlo uses,
# to allow introspecting the MicroFlo subgraph

componentLib = new microflo.componentlib.ComponentLibrary(require("../microflo/components.json"), "../microflo")

class MicroFloComponent extends noflo.Component
  icon: 'lightbulb-o'
  description: 'MicroFlo graph running on a microcontroller'
  constructor: (metadata) ->
    metadata = {} unless metadata
    @devname = metadata.device or null
    @baudrate = metadata.baudrate or 9600
    @upload = true
    @graph = null
    @isConnected = no
    @transport = null
    @ready = true

    @inPorts = new noflo.InPorts
      devicename:
        datatype: 'string'
        description: 'UNIX device path'
        required: yes
      graph:
        datatype: 'string'
        description: 'Path to a JSON or FBP graph definition'
    @outPorts = new noflo.OutPorts
      error:
        datatype: 'object'
        required: no

    @inPorts.graph.on 'data', (graph) =>
      @loadGraph graph

    @inPorts.devicename.on 'data', (@devname) =>
      do @checkConnect

    # We already got a device name via node metadata, no need to expose port
    @inPorts.remove 'devicename' if @devname

  loadGraph: (path, callback) ->
    @ready = false
    microflo.runtime.loadFile path, (err, graph) =>
      return if err
      @graph = graph

      # Expose graph's exported ports as node ports
      if graph.inports
        @prepareInport port, priv for port, priv of graph.inports
      if graph.outports
        @prepareOutport port, priv for port, priv of graph.outports

      process.nextTick =>
        @ready = true
        @emit 'ready'

      do @checkConnect

  getNodeId: (node) ->
    return null unless @graph.nodeMap
    @graph.nodeMap[node].id

  getPortId: (component, port) ->
    component = componentLib.getComponent component
    return null unless component
    return null unless component.inPorts[port]
    component.inPorts[port].id

  prepareInport: (name, priv) ->
    proc = (event, packet) =>
      unless @transport
        @outPorts.error.send new Error 'Cannot send to microcontroller, no connection'
        @outPorts.error.disconnect()
        return

      nodeId = @getNodeId priv.process
      if nodeId is null
        @outPorts.error.send new Error 'Cannot send to microcontroller, no node ID found'
        @outPorts.error.disconnect()
        return
      portId = @getPortId @graph.processes[priv.process].component, priv.port
      if portId is null
        @outPorts.error.send new Error 'Cannot send to microcontroller, no port ID found'
        @outPorts.error.disconnect()
        return

      # TODO: Support for the other event types
      return unless event is 'data'

      # Assumes microcontroller is ready to accept commands (ie: magic string has been sent)
      b = microflo.commandstream.dataLiteralToCommand packet.toString(), nodeId, portId
      @transport.write b

    # TODO: Detect type information from graph
    @inPorts.add name, {}, proc

  isReady: ->
    @ready

  prepareOutport: (name, priv) ->
    # TODO: Reading from microcontroller
    @outPorts.add name

  checkConnect: ->
    return unless @graph
    return unless @devname

    @ready = false

    microflo.serial.openTransport @devname, @baudrate, (err, transport) =>
      if err
        @outPorts.error.send err
        @outPorts.error.disconnect()
        return
      @transport = transport
      @isConnected = true

      if @upload
        console.error 'Preparing upload', @devname
      else
        console.error 'Opening communication', @devname

      debugLevel = 'VeryDetailed'
      data = microflo.commandstream.cmdStreamFromGraph componentLib, @graph, debugLevel
      microflo.runtime.uploadGraph @transport, data, @graph, @handleRecv, not @upload

      # (Re)open data transmission
      buffer = new Buffer 8
      microflo.commandstream.writeString buffer, 0, microflo.commandstream.cmdFormat.magicString
      @transport.write buffer

      unless @upload
        @ready = true
        @emit 'ready'

  handleRecv: (args...) =>
    console.error args
    if args[0] is 'NETSTART'
      @ready = true
      @emit 'ready'
      console.log args
    return
    if args[0] == "SEND"
      @outPorts.out.send(args[4])
      #console.log args[3], args[4]
    else if args[0] == "NETSTART"
      buffer = new Buffer(16)
      microflo.commandstream.writeString(buffer, 0, microflo.commandstream.cmdFormat.magicString)
      microflo.commandstream.writeCmd(buffer, 8, microflo.commandstream.cmdFormat.commands.SubscribeToPort.id, 1, 0, 1)
      console.log "subscribe", buffer
      @transport.write buffer
    else
      console.log args

  shutdown: ->
    console.log "custom comp shutdown"
    # TODO: Disconnect from microcontroller

exports.getComponent = (metadata) -> new MicroFloComponent metadata

exports.getComponentForGraph = (graph) ->
  return (metadata) ->
    instance = exports.getComponent metadata
    graphSocket = noflo.internalSocket.createSocket()
    instance.inPorts.graph.attach graphSocket
    graphSocket.send graph
    graphSocket.disconnect()
    instance.inPorts.remove 'graph'

    instance
