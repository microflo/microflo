# MicroFlo - Flow-Based Programming for microcontrollers
# * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# * MicroFlo may be freely distributed under the MIT license
# 
util = require("./util")
if util.isBrowser()
    http = window.http
    uuid = window.uuid
    EventEmitter = require('emitter');
else
    http = require("http")
    websocket = require("websocket")
    url = require("url")
    uuid = require("node-uuid")
    EventEmitter = require('events').EventEmitter;

flowhub = require("flowhub-registry")
commandstream = require("./commandstream")
generate = require("./generate")
c = require("./componentlib")
componentLib = new c.ComponentLibrary(c.defaultComponents, "./microflo")
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
    edgeEq (a, b) ->
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

listComponents = (connection) ->
    for name of componentLib.getComponents()
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
    return

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

sendPacket = (runtime, port, event, payload) ->
    return console.log "WARN: sendPacket, unknown event #{event}" if event is not 'data'
    return console.log 'WARN: ignoring sendPacket during graph upload' if runtime.uploadInProgress

    internal = runtime.graph.inports[port]
    componentName = runtime.graph.processes[internal.process].component
    nodeId = runtime.graph.nodeMap[internal.process].id
    portId = componentLib.inputPort(componentName, internal.port).id

    buffer = commandstream.dataLiteralToCommand '' + payload, nodeId, portId
    runtime.device.sendCommands buffer, () ->
        # done

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
        listComponents connection
    else if command is "getsource"
        componentLib.getComponentSource payload.name, (err, source) ->
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

handleGraphCommand = (command, payload, connection, runtime) ->
    graph = runtime.graph
    if command is "clear"
        graph.processes = {}
        graph.connections = []
        graph.nodeMap = {} # nodeName->numericNodeId
    else if command is "addnode"
        graph.processes[payload.id] = payload
    else if command is "removenode"
        delete graph.processes[payload.id]
    else if command is "addedge"
        graph.connections.push wsConnectionFormatToFbp(payload)
    else if command is "removeedge"
        graph.connections = connectionsWithoutEdge(graph.connections, wsConnectionFormatToFbp(payload))
    else if command is "addinitial"
        graph.connections.push wsConnectionFormatToFbp(payload)
    else if command is "removeinitial"
        graph.connections = connectionsWithoutEdge(graph.connections, wsConnectionFormatToFbp(payload))
    else if command is "addinport"
        graph.inports = {} if not graph.inports?
        graph.inports[payload.public] =
            process: payload.node
            port: payload.port
        sendExportedPorts connection, runtime
    else if command is "addoutport"
        graph.outports = {} if not graph.outports?
        graph.outports[payload.public] =
            process: payload.node
            port: payload.port
        sendExportedPorts connection, runtime
        # For subscribing to output packets
        runtime.exportedEdges = [] if not runtime.exportedEdges?
        runtime.exportedEdges.push
            src:
                process: payload.node
                port: payload.port
    # TODO: implement removein/outport
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
        send msg


handleNetworkStartStop = (runtime, connection, transport, debugLevel) ->
    # FIXME: also do error handling, and send that across
    # https://github.com/noflo/noflo-runtime-websocket/blob/master/runtime/network.js
    # TODO: handle start/stop messages, send this to the UI
    graph = runtime.graph

    data = commandstream.cmdStreamFromGraph componentLib, graph, debugLevel
    if runtime.uploadInProgress
        console.log 'Ignoring multiple attempts of graph upload'
    runtime.uploadInProgress = true

    runtime.device.sendCommands data, (err) ->
        # Subscribe to change notifications
        # TODO: use a dedicated mechanism for this based on subgraphs
        runtime.exportedEdges = [] if not runtime.exportedEdges?
        edges = runtime.exportedEdges.concat runtime.edgesForInspection or []
        handleNetworkEdges runtime, connection, edges, (err) ->
            runtime.uploadInProgress = false

handleNetworkEdges = (runtime, connection, edges, callback) ->
    graph = runtime.graph
    maxCommands = graph.connections.length+edges.length
    buffer = new commandstream.Buffer 8*maxCommands
    offset = 0

    # Loop over all edges, unsubscribe
    graph.connections.forEach (edge) ->
        if edge.src
            srcId = graph.nodeMap[edge.src.process].id
            srcComp = graph.processes[edge.src.process].component
            srcPort = componentLib.outputPort(srcComp, edge.src.port).id
            offset += commandstream.writeCmd buffer, offset,
                        cmdFormat.commands.SubscribeToPort.id, srcId, srcPort, 0
        return
    # Subscribe to enabled edges
    edges.forEach (edge) ->
        srcId = graph.nodeMap[edge.src.process].id
        srcComp = graph.processes[edge.src.process].component
        srcPort = componentLib.outputPort(srcComp, edge.src.port).id
        offset += commandstream.writeCmd buffer, offset,
                    cmdFormat.commands.SubscribeToPort.id, srcId, srcPort, 1
        return

    # Send commands
    sendBuf = buffer.slice 0, offset # chop off invalid data
    if sendBuf.length
        runtime.device.sendCommands sendBuf, callback
    else
        return callback null

handleNetworkCommand = (command, payload, connection, runtime, transport, debugLevel) ->
    if command is "start" or command is "stop"
        # TODO: handle stop command separately, actually pause the graph
        handleNetworkStartStop runtime, connection, debugLevel
    else if command is "edges"
        # TOD: merge with those of exported outports
        runtime.edgesForInspection = payload.edges
        runtime.exportedEdges = [] if not runtime.exportedEdges?
        edges = runtime.edgesForInspection.concat runtime.exportedEdges
        handleNetworkEdges runtime, connection, edges
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
    # TODO: handle more sanely
    rtPingInterval = setInterval(->
        rt.ping (err) ->
            console.log "Warning: failed to ping Flowhub registry"    if err
    , 5 * 60 * 1000)
    return rtPingInterval

registerFlowhubRuntime = (rt, callback) ->
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


uploadGraphFromFile = (graphPath, serialPortName, baudRate, debugLevel) ->
    serial.openTransport serialPortName, baudRate, (err, transport) ->
        definition.loadFile graphPath, (err, graph) ->
            data = commandstream.cmdStreamFromGraph(componentLib, graph, debugLevel)
            # FIXME: reimplement using devicecomm directly
            uploadGraph transport, data, graph

class Runtime extends EventEmitter
    constructor: (transport, options) ->
        # FIXME: should support multiple graphs+networks
        @graph = {}
        @transport = transport
        @debugLevel = options?.debug or 'Error'
        @device = new devicecommunication.DeviceCommunication @transport, @graph, componentLib
        @conn =
            send: (response) =>
                console.log 'FBP MICROFLO SEND:', response if util.debug_protocol
                @emit 'message', response

        @device.on 'response', () =>
            args = []
            i = 0
            while i < arguments.length
                args.push arguments[i]
                i++
            deviceResponseToFbpProtocol @, @conn.send, args

    handleMessage: (msg) ->
        console.log 'FBP MICROFLO RECV:', msg if util.debug_protocol
        handleMessage @, msg

module.exports =
    setupRuntime: setupRuntime
    setupWebsocket: setupWebsocket
    Runtime: Runtime
    uploadGraphFromFile: uploadGraphFromFile
    createFlowhubRuntime: createFlowhubRuntime
    registerFlowhubRuntime: registerFlowhubRuntime
    handleMessage: handleMessage
    deviceResponseToFbpProtocol: deviceResponseToFbpProtocol # XXX: should be encapsulated
