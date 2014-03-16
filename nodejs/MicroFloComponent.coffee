noflo = require 'noflo'
microflo = require '../lib/microflo'

# FIXME: should be shielded inside microflo.js
serialport = require 'serialport'

# IDEA: implement the subscribeSubgraph protocol that NoFlo uses,
# to allow introspecting the MicroFlo subgraph

componentLib = new microflo.componentlib.ComponentLibrary(require("../microflo/components.json"), "../microflo")

class MicroFloComponent extends noflo.Component
  icon: 'lightbulb-o'
  description: 'MicroFlo graph running on a microcontroller'
  constructor: (metadata) ->
    @devname = metadata.device or null
    @upload = metadata.upload
    @graph = null
    @isConnected = no
    @transport = null

    @inPorts = new noflo.InPorts
      devicename:
        datatype: 'string'
        description: 'UNIX device path'
        required: yes
      graph:
        datatype: 'string'
        description: 'Path to a JSON or FBP graph definition'
      upload:
        datatype: 'boolean'
        description: 'Whether to flash the microcontroller when connected'
        required: false
    @outPorts = new noflo.OutPorts
      error:
        datatype: 'object'
        required: no

    @inPorts.graph.on 'data', (graph) =>
      @loadGraph graph
      do @checkConnect

    @inPorts.devicename.on 'data', (@devname) =>
      do @checkConnect

    @inPorts.upload.on 'data', (@upload) =>

    # We already got a device name via node metadata, no need to expose port
    @inPorts.remove 'devicename' if @devname

    # Remove upload port if defined via node metadata, otherwise go with default value
    if typeof @upload isnt 'undefined'
      @inPorts.remove 'upload'
    else
      @upload = true

  loadGraph: (path) ->
    microflo.runtime.loadFile path, (err, graph) =>
      return if err
      @graph = graph

      # Expose graph's exported ports as node ports
      if graph.inports
        @prepareInport port, priv for port, priv of graph.inports
      if graph.outports
        @prepareOutport port, priv for port, priv of graph.outports

  prepareInport: (name, priv) ->
    process = (event, packet) ->
      unless @transport
        @outPorts.error.send new Error 'Cannot send to microcontroller, no connection'
        @outPorts.error.disconnect()
        return

      # TODO: Support for the other event types
      return unless event is 'data'

      buffer = new Buffer 16
      microflo.commandstream.writeString buffer, 0, microflo.commandstream.cmdFormat.magicString
      b = (microflo.commandstream.dataLiteralToCommand obj.toString(), 1, 0)
      microflo.commandstream.writeCmd buffer, 8, b
      @transport.write buffer

    # TODO: Detect type information from graph
    @inPorts.add port, {}, process

  prepareOutport: (name, priv) ->
    # TODO: Reading from microcontroller
    @outPorts.add name

  checkConnect: ->
    return unless @graph
    return unless @devname

    microflo.serial.openTransport @devname, (err, transport) =>
      if err
        @outPorts.error.send err
        @outPorts.error.disconnect()
        return
      @transport = transport
      @isConnected = true

      return unless @upload

      debugLevel = 'Detailed'
      data = microflo.commandstream.cmdStreamFromGraph componentLib, @graph, debugLevel
      microflo.runtime.uploadGraph @transport, data, @graph, @handleRecv

  handleRecv: (args...) =>
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
    graph.inPorts.remove 'graph'

    instance
