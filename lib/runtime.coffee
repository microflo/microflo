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
    websocket = require("websocket")
    url = require("url")
    uuid = require("node-uuid")

EventEmitter = util.EventEmitter
try
  flowhub = require("flowhub-registry")
catch e
  #

commandstream = require("./commandstream")
generate = require("./generate")
c = require("./componentlib")
cmdFormat = require("./commandformat")
serial = require("./serial")
devicecommunication = require("./devicecommunication")
definition = require './definition'

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
        JSON.stringify a == JSON.stringify b
    newList = []
    connections.forEach (conn) ->
        if conn.src and edgeEq conn.src, findConn.src and edgeEq conn.tgt, findConn.tgt
            # Connection
        else if conn.data and edgeEq conn.tgt, findConn.tgt
            # IIP
        else
            newList.push conn
    return newList

wsConnectionFormatToFbp = (ws) ->
    if ws.src and ws.src.port
        src:
            port: ws.src.port
            process: ws.src.node
        tgt:
            port: ws.tgt.port
            process: ws.tgt.node
    else
        # IIP
        out = {}
        out.tgt =
            port: ws.tgt.port
            process: ws.tgt.node

        out.data = ws.src.data if ws.src
        out

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

sendPackets = (runtime, mapping, callback) ->
    buffers = []
    for port, val of mapping
        buffers.push sendPacketCmd runtime, port, 'data', val
    buffer = commandstream.Buffer.concat buffers
    runtime.device.sendCommands buffer, callback


handleRuntimeCommand = (command, payload, connection, runtime) ->
    if command is "getruntime"
        caps = [
            "protocol:graph"
            "protocol:network"
            "protocol:component"
            "protocol:runtime"
        ]
        r =
            type: "microflo"
            version: "0.4"
            capabilities: caps
        connection.send
            protocol: "runtime"
            command: "runtime"
            payload: r
        sendExportedPorts connection, runtime
    else if command is 'packet'
        sendPacket runtime, payload.port, payload.event, payload.payload
    else
        console.log "Unknown NoFlo UI command on 'runtime' protocol:", command, payload
    return

handleComponentCommand = (command, payload, connection, runtime) ->
    if command is "list"
        listComponents runtime, connection
    else if command is "getsource"
        runtime.library.getComponentSource payload.name, (err, source) ->
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
        graph.name = payload.name or ''
        graph.nodeMap = {} # nodeName->numericNodeId
        # FIXME: should be on the graph!
        runtime.exportedEdges = []
        runtime.edgesForInspection = []
        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else if command is "addnode"
        graph.processes[payload.id] = payload
        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else if command is "removenode"
        delete graph.processes[payload.id]
        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else if command is "renamenode"
        node = graph.processes[payload.from]
        graph.processes[payload.to] = node
        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else if command is "changenode"
        # FIXME: ignored
        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else if command is "addedge"
        graph.connections.push wsConnectionFormatToFbp(payload)
        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else if command is "removeedge"
        graph.connections = connectionsWithoutEdge(graph.connections, wsConnectionFormatToFbp(payload))
        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else if command is "addinitial"
        graph.connections.push wsConnectionFormatToFbp(payload)
        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else if command is "removeinitial"
        graph.connections = connectionsWithoutEdge(graph.connections, wsConnectionFormatToFbp(payload))
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
                process: payload.node
                port: payload.port
        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else if command is "removeoutport"
        delete graph.outports[payload.public]
        sendExportedPorts connection, runtime
        sendAck connection, { protocol: 'graph', command: command, payload: payload }
    else
        console.log "Unknown NoFlo UI command on protocol 'graph':", command, payload
    return

deviceResponseToFbpProtocol = (runtime, send, args)->
    if args[0] is "SEND"
        data = `undefined`
        if args[3] is "Void"
            data = "!"
        else
            data = args[4]
        src =
            node: args[1]
            port: args[2]
        tgt =
            node: args[5]
            port: args[6]
        send
            protocol: "network"
            command: "data"
            payload:
                src: src
                tgt: tgt
                data: data

        # Check if exported outport
        if runtime.graph.outports
            found = null
            for pub, internal of runtime.graph.outports
                match = internal.process == src.node and internal.port == src.port
                found = pub if match
            m =
                protocol: "runtime"
                command: "packet"
                payload:
                    port: found
                    event: 'data'
                    payload: data
                    index: null
            send m if found

    else if args[0] is "NETSTOP"
        m =
            protocol: "network"
            command: "stopped"
            payload:
                running: false
                started: false
        send m
    else if args[0] is "NETSTART"
        m =
            protocol: "network"
            command: "started"
            payload:
                running: true
                started: true
        send m
    else
        string = args.join(", ")
        string = string.replace(/\n$/, "")
        msg =
            protocol: "network"
            command: "output"
            payload:
                message: string
        # send msg
        # Should only be used for "output" from program in the runtime itself


handleNetworkStartStop = (runtime, connection, transport, debugLevel) ->
    # FIXME: also do error handling, and send that across
    # https://github.com/noflo/noflo-runtime-websocket/blob/master/runtime/network.js
    # TODO: handle start/stop messages, send this to the UI
    graph = runtime.graph

    if runtime.uploadInProgress
        console.log 'Ignoring multiple attempts of graph upload'
        return
    runtime.uploadInProgress = true

    data = commandstream.cmdStreamFromGraph runtime.library, graph, debugLevel
    send = () ->
        runtime.device.sendCommands data, (err) ->
            # Subscribe to change notifications
            # TODO: use a dedicated mechanism for this based on subgraphs
            edges = runtime.exportedEdges.concat runtime.edgesForInspection
            handleNetworkEdges runtime, connection, edges, (err) ->
                runtime.uploadInProgress = false
    setTimeout () ->
        runtime.device.open () ->
            send()
    , 2000 # HACK: wait for Arduino reset

subscribeEdges = (runtime, edges, callback) ->
    graph = runtime.graph
    maxCommands = graph.connections.length+edges.length
    buffer = new commandstream.Buffer 8*maxCommands
    offset = 0

    # Loop over all edges, unsubscribe
    graph.connections.forEach (edge) ->
        if edge.src
            srcId = graph.nodeMap[edge.src.process].id
            srcComp = graph.processes[edge.src.process].component
            srcPort = runtime.library.outputPort(srcComp, edge.src.port).id
            offset += commandstream.writeCmd buffer, offset,
                        cmdFormat.commands.SubscribeToPort.id, srcId, srcPort, 0
        return
    # Subscribe to enabled edges
    edges.forEach (edge) ->
        srcId = graph.nodeMap[edge.src.process].id
        srcComp = graph.processes[edge.src.process].component
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

handleNetworkCommand = (command, payload, connection, runtime, transport, debugLevel) ->
    if command is "start" or command is "stop"
        # TODO: handle stop command separately, actually pause the graph
        handleNetworkStartStop runtime, connection, debugLevel
    else if command is "edges"
        # TOD: merge with those of exported outports
        runtime.edgesForInspection = payload.edges
        edges = runtime.edgesForInspection.concat runtime.exportedEdges
        handleNetworkEdges runtime, connection, edges
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

createFlowhubRuntime = (user, ip, port, label, id, apihost) ->
    return null if not flowhub

    # Unique identifier of the runtime instance
    id = id or uuid.v4()
    label = label or "MicroFlo"
    rtinfo =
        label: label
        id: id
        user: user
        protocol: "websocket"
        type: "microflo"
        # Secret string for simple auth
        secret: "19osdf3034s"
    if ip isnt "auto"
        rtinfo.address = "ws://" + ip + ":" + port
    else
        rtinfo.address = "auto"
    regoptions = {}
    regoptions.host = apihost if typeof apihost isnt "undefined"
    rt = new flowhub.Runtime(rtinfo, regoptions)
    return rt

setupFlowhubRuntimePing = (rt) ->
    return if not rt

    # TODO: handle more sanely
    rtPingInterval = setInterval(->
        rt.ping (err) ->
            console.log "Warning: failed to ping Flowhub registry"    if err
    , 5 * 60 * 1000)
    return rtPingInterval

registerFlowhubRuntime = (rt, callback) ->
    return if not rt

    rt.register callback
    return

setupWebsocket = (runtime, ip, port, callback) ->
    httpServer = http.createServer (request, response) ->
        path = url.parse(request.url).pathname
        if path is "/"
            response.writeHead 200, "Content-Type": "text/plain"
            response.write "NoFlo UI WebSocket API at: " + "ws://" + request.headers.host
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

    httpServer.listen port, ip, (err) ->
        return callback err, null if err
        console.log "MicroFlo runtime listening at", ip + ":" + port
        return callback null, httpServer

setupRuntime = (serialPortToUse, baudRate, port, debugLevel, ip, callback) ->

    serial.openTransport serialPortToUse, baudRate, (err, transport) ->
        return callback err, null if err
        runtime = new Runtime transport
        setupWebsocket runtime, ip, port, (err, server) ->
            # FIXME: ping Flowhub
            return callback null, runtime

setupSimulator = (file, baudRate, port, debugLevel, ip, callback) ->
    simulator = require './simulator'

    build = require file
    runtime = new simulator.RuntimeSimulator build
    runtime.start 1.0

    # HACK: library should come from runtime itself!
    libraryPath = file.replace 'microflo-runtime.js', 'componentlib-map.json'
    try
        runtime.library.definition = require libraryPath
    catch e
        console.log 'WARN: could not load simulator lib', e

    # Runtime expects device communication to already be open
    runtime.device.open (err) ->
        setupWebsocket runtime, ip, port, (err, server) ->
            # FIXME: ping Flowhub
            return callback null, runtime


uploadGraphFromFile = (graphPath, serialPortName, baudRate, debugLevel) ->
    serial.openTransport serialPortName, baudRate, (err, transport) ->
        definition.loadFile graphPath, (err, graph) ->
            data = commandstream.cmdStreamFromGraph(runtime.library, graph, debugLevel)
            # FIXME: reimplement using devicecomm directly
            uploadGraph transport, data, graph

class Runtime extends EventEmitter
    constructor: (transport, options) ->
        # FIXME: should support multiple graphs+networks
        @graph = {}
        @transport = transport
        @debugLevel = options?.debug or 'Error'
        @library = new c.ComponentLibrary
        @device = new devicecommunication.DeviceCommunication @transport, @graph, @library
        @io = new devicecommunication.RemoteIo @device
        @conn =
            send: (response) =>
                console.log 'FBP MICROFLO SEND:', response if util.debug_protocol
                @emit 'message', response

        received = {}
        bracketed = null
        @device.on 'response', () =>
            args = Array.prototype.slice.call arguments
            event = args[0]
            if event == 'SEND'
                [event, node, port, type, data] = args
                console.log event, node, port, type, data
                if bracketed? and type != 'BracketEnd'
                    bracketed.push data
                    return
                if type == 'BracketStart'
                    bracketed = []
                    return
                if type == 'BracketEnd'
                    data = bracketed.slice()
                    bracketed = null
                args = [event, node, port, type, data]
                deviceResponseToFbpProtocol @, @conn.send, args
            else
                deviceResponseToFbpProtocol @, @conn.send, args

    handleMessage: (msg) ->
        console.log 'FBP MICROFLO RECV:', msg if util.debug_protocol
        handleMessage @, msg

    uploadGraph: (graph, callback) ->
        @graph = graph
        @device.graph = graph # XXX: not so nice

        checkUploadDone = (m) =>
            if m.protocol == 'network' and m.command == 'started'
                @removeListener 'message', checkUploadDone
                return callback()

        @on 'message', checkUploadDone
        try
            @handleMessage { protocol: 'network', command: 'start' }
        catch e
            return callback e

    uploadFBP: (prog, callback) ->
        try
            graph = require('fbp').parse(prog)
        catch e
            return callback e
        @uploadGraph graph, callback

module.exports =
    setupRuntime: setupRuntime
    setupWebsocket: setupWebsocket
    setupSimulator: setupSimulator
    Runtime: Runtime
    uploadGraphFromFile: uploadGraphFromFile
    createFlowhubRuntime: createFlowhubRuntime
    registerFlowhubRuntime: registerFlowhubRuntime
