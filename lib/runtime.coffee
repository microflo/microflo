# MicroFlo - Flow-Based Programming for microcontrollers
# * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# * MicroFlo may be freely distributed under the MIT license
# 
util = require("./util")
if util.isBrowser()
    http = window.http
    uuid = window.uuid
else
    http = require("http")
    https = require("https")
    websocket = require("websocket")
    url = require("url")
    uuid = require "uuid"
    fs = require 'fs'
    querystring = require 'querystring'

EventEmitter = util.EventEmitter

commandstream = require("./commandstream")
generate = require("./generate")
{ ComponentLibrary } = require "./componentlib"
cmdFormat = require("./commandformat")
serial = require("./serial")
devicecommunication = require("./devicecommunication")
definition = require './definition'
protocol = require './protocol'

# TODO: allow port types to be declared in component metadata,
# and send the appropriate types instead of just "all"
# https://github.com/noflo/noflo/issues/51
portDefAsArray = (port) ->
    a = []
    for name of port
        a.push
            id: name
            type: "all"
    return a

connectionsWithoutEdge = (connections, findConn) ->
    edgeEq = (a, b) ->
        return a?.port == b?.port and a?.process == b?.process
    newList = []
    for conn in connections
        if conn.src and edgeEq conn.src, findConn.src and edgeEq conn.tgt, findConn.tgt
            # Connection
        else if conn.data and edgeEq conn.tgt, findConn.tgt
            # IIP
        else
            newList.push conn
    return newList

printReceived = ->
    args = []
    i = 0

    while i < arguments.length
        args.push arguments[i]
        i++
    console.log args.join(", ")
    return

listComponents = (runtime, connection) ->
    componentLib = runtime.library
    components = componentLib.getComponents()
    for name of components
        comp = componentLib.getComponent(name)
        # TODO: also allow to send icon definitions
        resp =
            protocol: "component"
            command: "component"
            payload:
                name: name
                description: comp.description or ""
                inPorts: portDefAsArray(componentLib.inputPortsFor(name))
                outPorts: portDefAsArray(componentLib.outputPortsFor(name))

        connection.send resp

    connection.send
        protocol: 'component'
        command: 'componentsready'
        payload: Object.keys(components).length

sendExportedPorts = (connection, runtime) ->
    # go over runtime.graph and expose exported ports
    ports =
        inPorts: []
        outPorts: []
    for pub, port of runtime.graph.inports
        ports.inPorts.push
            id: pub
            type: 'any' # FIXME
            addressable: false # FIXME
            required: false # FIXME
    for pub, port of runtime.graph.outports
        ports.outPorts.push
            id: pub
            type: 'any' # FIXME
            addressable: false # FIXME
            required: false # FIXME
    connection.send
        protocol: 'runtime'
        command: 'ports'
        payload: ports

sendPacketCmd = (runtime, port, event, payload) ->
    return console.log "WARN: sendPacket, unknown event #{event}" if event is not 'data'
    return console.log 'WARN: ignoring sendPacket during graph upload' if runtime.uploadInProgress

    internal = runtime.graph.inports[port]
    componentName = runtime.graph.processes[internal.process].component
    nodeId = runtime.graph.nodeMap[internal.process].id
    portId = runtime.library.inputPort(componentName, internal.port).id

    buffer = commandstream.dataToCommand payload, nodeId, portId

sendPacket = (runtime, port, event, payload) ->
    buffer = sendPacketCmd runtime, port, event, payload
    runtime.device.sendCommands buffer, () ->
        # done

handleRuntimeCommand = (command, payload, connection, runtime) ->
    if command is "getruntime"
        caps = [
            "protocol:graph"
            "protocol:network"
            "protocol:component"
            "protocol:runtime"
            "component:getsource"
        ]
        r =
            type: "microflo"
            version: "0.4"
            capabilities: caps
            namespace: runtime.namespace

        if runtime.graph?.name
          r.graph = runtime.namespace + '/' + runtime.graph.name

        runtime.device.ping (err) ->
          if err
            console.error 'getruntime ping failed', err
            connection.send { protocol: 'runtime', command: 'error', payload: { message: err.message } }
            return
          connection.send
            protocol: "runtime"
            command: "runtime"
            payload: r
          sendExportedPorts connection, runtime       
    else if command is 'packet'
        if payload.event is 'data'
            sendPacket runtime, payload.port, payload.event, payload.payload
    else
        console.log "Unknown NoFlo UI command on 'runtime' protocol:", command, payload
    return

handleComponentCommand = (command, payload, connection, runtime) ->
    if command is "list"
        listComponents runtime, connection
    else if command is "getsource"
        # Main graph, used in live mode
        if payload.name == runtime.namespace + '/' + runtime.graph.name
            graph =
              properties:
                name: runtime.graph.name
                environment:
                  type: 'microflo'
              processes: runtime.graph.processes
              connections: runtime.graph.connections
              inports: []
              outports: []
            resp =
              code: JSON.stringify graph
              name: runtime.graph.name
              library: runtime.namespace
              language: 'json'
            connection.send { protocol: 'component', command: 'source', payload: resp }
        else
            runtime.library.getComponentSource payload.name, (err, source) ->
                if err
                  #connection.send { protocol: 'component', command: 'error', payload: { message: err.message } }
                  source = err.message

                r =
                    name: payload.name
                    language: "c++"
                    code: source
                connection.send
                    protocol: "component"
                    command: "source"
                    payload: r
                return
    else
        console.log "Unknown NoFlo UI command on 'component' protocol:", command, payload
    return

sendAck = (connection, msg) ->
    connection.send msg

handleGraphCommand = (command, payload, connection, runtime) ->
    graph = runtime.graph
    if command is "clear"
        graph.processes = {}
        graph.connections = []
        graph.name = payload.id or 'default/main'
        graph.nodeMap = {}
        graph.componentMap = {}
        graph.currentNodeId = 1
        runtime.exportedEdges = []
        runtime.edgesForInspection = []

        sendMessage runtime, { protocol: 'graph', command: command, payload: payload }
    else if command is "addnode"
        graph.processes[payload.id] = payload
        graph.nodeMap[payload.id] = { id: graph.currentNodeId++ }
        graph.componentMap[payload.id] = payload.component
        # TODO: wait for nodeId from runtime, update nodeMap then
        sendMessage runtime, { protocol: 'graph', command: command, payload: payload }
    else if command is "removenode"
        sendMessage runtime, { protocol: 'graph', command: command, payload: payload }
        delete graph.processes[payload.id]
        delete graph.nodeMap[payload.id]
        delete graph.componentMap[payload.id]
    else if command is "renamenode"
        node = graph.processes[payload.from]
        graph.processes[payload.to] = node
        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else if command is "changenode"
        # FIXME: ignored
        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else if command is "addedge"
        graph.connections.push protocol.wsConnectionFormatToFbp(payload)
        sendMessage runtime, { protocol: 'graph', command: command, payload: payload }
    else if command is "removeedge"
        graph.connections = connectionsWithoutEdge(graph.connections, protocol.wsConnectionFormatToFbp(payload))
        sendMessage runtime, { protocol: 'graph', command: command, payload: payload }
    else if command is "addinitial"
        graph.connections.push protocol.wsConnectionFormatToFbp(payload)
        sendMessage runtime, { protocol: 'graph', command: command, payload: payload }
    else if command is "removeinitial"
        # TODO: send to runtime side, wait for response
        graph.connections = connectionsWithoutEdge(graph.connections, protocol.wsConnectionFormatToFbp(payload))
        sendAck connection, { protocol: 'graph', command: command, payload: payload }

    # PROTOCOL: Inconsistent that these don't ack on same format?
    else if command is "addinport"
        graph.inports = {} if not graph.inports?
        graph.inports[payload.public] =
            process: payload.node
            port: payload.port
        sendExportedPorts connection, runtime
        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else if command is "removeinport"
        delete graph.inports[payload.public]
        sendExportedPorts connection, runtime
        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else if command is "addoutport"
        graph.outports = {} if not graph.outports?
        graph.outports[payload.public] =
            process: payload.node
            port: payload.port
        sendExportedPorts connection, runtime
        # For subscribing to output packets
        runtime.exportedEdges.push
            src:
                node: payload.node
                port: payload.port

        # update subscriptions on device side
        edges = runtime.exportedEdges.concat runtime.edgesForInspection
        handleNetworkEdges runtime, connection, edges, (err) ->
          console.log 'handle network edges error', err if err

        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else if command is "removeoutport"
        delete graph.outports[payload.public]
        sendExportedPorts connection, runtime
        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else
        console.log "Unknown NoFlo UI command on protocol 'graph':", command, payload
    return

packetSent = (graph, collector, payload) ->
    messages = []

    payload.graph = graph.name
    payload.id = "dummy"

    data = collector.pushData payload
    if data?
        payload.data = data
    else
        return [] # in the middle of bracketed data, will send when gets to the end

    # Check if exported outport
    if graph.outports
        found = null
        for pub, internal of graph.outports
            match = internal.process == payload.src.node and internal.port == payload.src.port
            found = pub if match
        m =
            protocol: "runtime"
            command: "packet"
            payload:
                port: found
                event: 'data'
                payload: data
                index: null
        messages.push m

    # Sent network:data for edge introspection
    m =
        protocol: 'network'
        command: 'data'
        payload: payload
    messages.push m

    return messages


mapMessage = (graph, collector, message)->
    if message.protocol == 'microflo'
        if message.command == 'packetsent'
            # TODO: move this down to commandstream?
            messages = packetSent graph, collector, message.payload
            return messages
        else if message.command in ['subscribeedge'] # TODO: make network:edges
          return []
        else if message.command in ['debugchanged','communicationopen', 'sendpacketdone', 'iovaluechanged']
          console.log 'FBP MICROFLO RESPONSE IGNORED:', message.command if util.debug_protocol
          # ignore
          return []
        else if message.command == 'debugmessage'
            p = message.payload
            msg =
                protocol: "network"
                command: "output"
                payload:
                    message: "Debug point triggered: #{p.level} #{p.point}"
            return [ msg ]
        else
            console.log 'FBP MICROFLO RESPONSE sent as network:output', message.command if util.debug_protocol
            string = "#{message.command}: " + JSON.stringify message.payload
            msg =
                protocol: "network"
                command: "output"
                payload:
                    message: string
            return [ msg ]
    else
        # pass-through
        return [ message ]
        

# non-live programming way of uploading
resetAndUploadGraph = (runtime, connection, debugLevel, callback) ->
    # FIXME: also do error handling, and send that across
    # https://github.com/noflo/noflo-runtime-websocket/blob/master/runtime/network.js
    graph = runtime.graph

    if runtime.uploadInProgress
        console.log 'Ignoring multiple attempts of graph upload'
        return
    runtime.uploadInProgress = true

    try
        data = commandstream.cmdStreamFromGraph runtime.library, graph, debugLevel
    catch e
        return callback e
    sendGraph = (cb) ->
        runtime.device.sendCommands data, (err) ->
            return cb err if err
            # Subscribe to change notifications
            # TODO: use a dedicated mechanism for this based on subgraphs
            edges = runtime.exportedEdges.concat runtime.edgesForInspection
            handleNetworkEdges runtime, connection, edges, (err) ->
                runtime.uploadInProgress = false
                return cb err
    setTimeout () ->
        runtime.device.open (err) ->
            return callback err if err
            sendGraph (err) ->
                return callback err
    , 1000 # HACK: wait for Arduino reset

subscribeEdges = (runtime, edges, callback) ->
    graph = runtime.graph
    maxCommands = graph.connections.length+edges.length
    buffer = new commandstream.Buffer cmdFormat.commandSize*maxCommands
    offset = 0

    # Loop over all edges, unsubscribe
    graph.connections.forEach (conn) ->
        node = graph.nodeMap[conn?.src?.process]
        if conn.src and node
            srcId = node.id
            srcComp = graph.processes[conn.src.process].component
            srcPort = runtime.library.outputPort(srcComp, conn.src.port).id
            offset += commandstream.writeCmd buffer, offset,
                        cmdFormat.commands.SubscribeToPort.id, srcId, srcPort, 0
        return
    # Subscribe to enabled edges
    edges.forEach (edge) ->
        srcId = graph.nodeMap[edge.src.node].id
        srcComp = graph.processes[edge.src.node].component
        srcPort = runtime.library.outputPort(srcComp, edge.src.port).id
        offset += commandstream.writeCmd buffer, offset,
                    cmdFormat.commands.SubscribeToPort.id, srcId, srcPort, 1
        return

    # Send commands
    sendBuf = buffer.slice 0, offset # chop off invalid data
    if sendBuf.length
        runtime.device.sendCommands sendBuf, callback
    else
        return callback null

handleNetworkEdges = (runtime, connection, edges, callback) ->
    subscribeEdges runtime, edges, callback

sendMessage = (runtime, message) ->
  temp = new commandstream.Buffer 1024
  g = runtime.graph
  index = commandstream.toCommandStreamBuffer message, runtime.library, g.nodeMap, g.componentMap, temp, 0
  data = temp.slice(0, index)
  runtime.device.sendCommands data, (err) ->
    console.og 'sendMessage error', err if err

handleNetworkCommand = (command, payload, connection, runtime, transport, debugLevel) ->
    if command is "start"
        m = { protocol: 'network', command: command, payload: payload }
        sendMessage runtime, m
    else if command is "stop"
        m = { protocol: 'network', command: command, payload: payload }
        sendMessage runtime, m
    else if command is "edges"
        # TODO: merge with those of exported outports
        runtime.edgesForInspection = payload.edges
        edges = runtime.edgesForInspection.concat runtime.exportedEdges
        handleNetworkEdges runtime, connection, edges, (err) ->
          if err
            return sendAck connection, { protocol: 'network', command: 'error', payload: { message: err.message } }
          sendAck connection, { protocol: 'network', command: command, payload: payload }
    else
        console.log "Unknown NoFlo UI command on protocol 'network':", command, payload
    return

handleMessage = (runtime, contents) ->
    connection = runtime.conn

    if contents.protocol is "component"
        handleComponentCommand contents.command, contents.payload, connection, runtime
    else if contents.protocol is "graph"
        handleGraphCommand contents.command, contents.payload, connection, runtime
    else if contents.protocol is "runtime"
        handleRuntimeCommand contents.command, contents.payload, connection, runtime
    else if contents.protocol is "network"
        handleNetworkCommand contents.command, contents.payload, connection, runtime
    else
        console.log "Unknown NoFlo UI protocol:", contents
    return

class BracketDataCollector
  constructor: () ->
    received = {}
    bracketed = null
  
  # Returns null if there is no (completed bracketed data)
  # or a list of the data contained in bracket if there is
  pushData: (payload) ->
    # FIXME: assumes all data is on a single edge!
    {data, type} = payload
    if not @bracketed? and type != 'BracketStart'
      # return original
      return data
    if @bracketed? and type != 'BracketEnd'
      @bracketed.push data
      return null
    if type == 'BracketStart'
      @bracketed = []
      return null
    if type == 'BracketEnd'
      out = @bracketed.slice() 
      @bracketed = null
      return out

pingUrl = (address, method, callback) ->
  u = url.parse address
  u.port = 80 if u.protocol == 'http' and not u.port
  u.method = method
  u.timeout = 10*1000
  req = https.request u, (res) ->
    status = res.statusCode
    return callback new Error "Ping #{method} #{address} failed with #{status}" if status != 200
    return callback null
  req.on 'error', (err) ->
    return callback err
  req.end()

liveUrl = (options) ->
  address = 'ws://' + options.host + ':' + options.port
  params = 'protocol=websocket&address=' + address
  params += '&id=' + options.id if options.id
  params += '&secret=' + options.secret if options.secret
  u = options.ide + '#runtime/endpoint?' + querystring.escape(params)
  return u

setupWebsocket = (runtime, options, callback) ->
    httpServer = http.createServer (request, response) ->
        path = url.parse(request.url).pathname
        if path is "/"
            response.writeHead 200, "Content-Type": "text/plain"
            response.write "Open in Flowhub: " + liveUrl options
        else
            response.writeHead 404
        response.end()
    wsServer = new websocket.server(httpServer: httpServer)
    wsServer.on "request", (request) ->
        subProtocol = (if (request.requestedProtocols.indexOf("noflo") isnt -1) then "noflo" else null)
        connection = request.accept subProtocol, request.origin
        runtime.on 'message', (response) ->
            connection.sendUTF JSON.stringify(response)
        connection.on "message", (message) ->
            return if message.type is not "utf8"
            try
                contents = JSON.parse(message.utf8Data)
            catch e
                console.log "WS parser error: ", e
            runtime.handleMessage contents

    alivePing = () =>
      return if not options.pingInterval
      realUrl = options.pingUrl.replace '$RUNTIME_ID', options.id
      pingUrl realUrl, options.pingMethod, (err) ->
        console.error "Failed to ping:", err if err
    runtime.alivePingInterval = setInterval alivePing, options.pingInterval*1000
    alivePing()

    httpServer.listen options.port, options.host, (err) ->
        return callback err, null if err
        return callback null, httpServer

setupRuntime = (serialPortToUse, baudRate, componentMap, options, callback) ->
    options.waitConnect = options.waitConnect or 0

    serial.openTransport serialPortToUse, baudRate, (err, transport) ->
        return callback err, null if err
        runtime = new Runtime transport, options

        # TODO: support automatically looking up in runtime
        if componentMap
            try
                runtime.library.definition = JSON.parse(fs.readFileSync(componentMap, 'utf-8'))
            catch e
                console.log 'WARN: could not load component mapping', e

        setTimeout () ->
            runtime.device.open (err) ->
                return callback err if err
                setupWebsocket runtime, options, (err, server) ->
                    return callback null, runtime
        , options.waitConnect*1000

setupSimulator = (file, baudRate, port, debugLevel, ip, callback) ->
    simulator = require './simulator'

    build = require file
    options =
      debug: debugLevel
      host: ip
      port: port

    runtime = new simulator.RuntimeSimulator build, options
    runtime.start 1.0

    # HACK: library should come from runtime itself!
    libraryPath = file.replace 'microflo-runtime.js', 'componentlib-map.json'
    try
        runtime.library.definition = require libraryPath
    catch e
        console.log 'WARN: could not load simulator lib', e

    # Runtime expects device communication to already be open
    runtime.device.open (err) ->
        return callback err if err
        setupWebsocket runtime, ip, port, (err, server) ->
            return callback null, runtime


uploadGraphFromFile = (graphPath, options, callback) ->

  serial.openTransport options.serial, options.baudrate, (err, transport) ->
    return callback err if err
    runtime = new Runtime transport, { debug: options.debug }
    # TODO: support automatically looking up in runtime
    if options.componentmap
      try
        runtime.library.definition = JSON.parse(fs.readFileSync(options.componentmap, 'utf-8'))
      catch e
        return callback e
    definition.loadFile graphPath, (err, graph) ->
      return callback err if err
      runtime.uploadGraph graph, (err) ->
        return callback err if err
        return callback null, err

class Runtime extends EventEmitter
    constructor: (transport, options) ->
        # FIXME: should support multiple graphs+networks
        @graph = {}
        @transport = transport
        @debugLevel = options?.debug or 'Error'
        @library = new ComponentLibrary
        @device = new devicecommunication.DeviceCommunication @transport
        @io = new devicecommunication.RemoteIo @device
        @collector = new BracketDataCollector()
        @exportedEdges = []
        @edgesForInspection = []
        @namespace = 'default'
        @options = options

        # Needed because the runtime on microcontroller only has numerical identifiers
        @graph.nodeMap = {} # "nodeName" -> { id: numericNodeId }
        @graph.componentMap = {} # "nodeName" -> "componentName"
        @graph.currentNodeId = 1

        @conn =
            send: (response) =>
                console.log 'FBP MICROFLO SEND:', response if util.debug_protocol
                @emit 'message', response

        @device.on 'response', (cmd) =>
            messages = commandstream.fromCommand @library, @graph, cmd
            for m in messages
                converted = mapMessage @graph, @collector, m
                for c in converted
                    @conn.send c

    liveUrl: () ->
        return liveUrl @options

    handleMessage: (msg) ->
        console.log 'FBP MICROFLO RECV:', msg if util.debug_protocol
        handleMessage @, msg

    uploadGraph: (graph, callback) ->
        @graph = graph
        @graph.name = graph.properties.name if not @graph.name

        checkUploadDone = (m) =>
            if m.protocol == 'network' and m.command == 'started'
                @removeListener 'message', checkUploadDone
                return callback()

        @on 'message', checkUploadDone
        resetAndUploadGraph this, @conn, @debugLevel, (err) ->
            return callback err if err

module.exports =
    setupRuntime: setupRuntime
    setupWebsocket: setupWebsocket
    setupSimulator: setupSimulator
    Runtime: Runtime
    uploadGraphFromFile: uploadGraphFromFile

