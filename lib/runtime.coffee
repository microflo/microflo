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
    fbp = require("fbp")
    fs = require("fs")
    path = require("path")
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

# TODO: Use noflo.graph.loadFile() instead?
loadFile = (filename, callback) ->
    fs.readFile filename, { encoding: "utf8" }, (err, data) ->
        console.log filename
        console.log data
        return callback err if err
        def = null
        if (path.extname filename) is ".fbp"
            def = fbp.parse data
        else
            def = JSON.parse data
        return callback null, def


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

uploadGraph = (transport, data, graph, receiveHandler, onlyRegisterHandler) ->
    throw new Error("Use the DeviceCommunication API instead!") if onlyRegisterHandler
    handler = (if receiveHandler then receiveHandler else printReceived)

    if graph.uploadInProgress
        # avoid multiple uploads happening at same time
        # FIXME: should give user feedback on upload process
        console.log "WARN: Graph upload in progress, ignored second attempt"

    comm = new devicecommunication.DeviceCommunication(transport, graph, componentLib)
    comm.on "response", ->
        handler.apply this, arguments

    comm.open ->
        comm.sendCommands data, (err) ->
            comm.close (err) ->
                graph.uploadInProgress = false

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

handleRuntimeCommand = (command, payload, connection) ->
    if command is "getruntime"
        caps = [
            "protocol:graph"
            "protocol:network"
            "protocol:component"
        ]
        r =
            type: "microflo"
            version: "0.4"
            capabilities: caps
        connection.send
            protocol: "runtime"
            command: "runtime"
            payload: r
    else
        console.log "Unknown NoFlo UI command on 'runtime' protocol:", command, payload
    return

handleComponentCommand = (command, payload, connection) ->
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

handleGraphCommand = (command, payload, connection, graph) ->
    if command is "clear"
        graph.processes = {}
        graph.connections = []
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
    else
        console.log "Unknown NoFlo UI command on protocol 'graph':", command, payload
    return

handleNetworkStartStop = (graph, connection, transport, debugLevel) ->
    # FIXME: also do error handling, and send that across
    # https://github.com/noflo/noflo-runtime-websocket/blob/master/runtime/network.js
    # TODO: handle start/stop messages, send this to the UI
    wsSendOutput = ->
        args = []
        i = 0

        while i < arguments.length
            args.push arguments[i]
            i++
        if args[0] is "SEND"
            data = `undefined`
            if args[3] is "Void"
                data = "!"
            else
                data = args[4]
            msg =
                protocol: "network"
                command: "data"
                payload:
                    src:
                        node: args[1]
                        port: args[2]
                    tgt:
                        node: args[5]
                        port: args[6]
                    data: data
            connection.send msg
        else if args[0] is "NETSTOP"
            m =
                protocol: "network"
                command: "stopped"
            connection.send m
        else if args[0] is "NETSTART"
            m =
                protocol: "network"
                command: "started"
            connection.send m
        else
            string = args.join(", ")
            string = string.replace(/\n$/, "")
            msg =
                protocol: "network"
                command: "output"
                payload:
                    message: string
            connection.send msg

    data = commandstream.cmdStreamFromGraph componentLib, graph, debugLevel
    # FIXME: should use DeviceCommunication instead of uploadGraph
    ###
    if graph.uploadInProgress
        console.log 'Ignoring multiple attempts of graph upload'
    graph.uploadInProgress = true
    device.sendCommands data, (err) ->
        graph.uploadInProgress = false
    ###
    uploadGraph transport, data, graph, wsSendOutput

handleNetworkEdges = (graph, connection, transport, edges) ->
    # Loop over all edges, unsubscribe
    graph.connections.forEach (edge) ->
        if edge.src
            srcId = graph.nodeMap[edge.src.process].id
            srcComp = graph.processes[edge.src.process].component
            srcPort = componentLib.outputPort(srcComp, edge.src.port).id
            buffer = new commandstream.Buffer(16)
            commandstream.writeCmd buffer, 8, cmdFormat.commands.SubscribeToPort.id, srcId, srcPort, 0
            transport.write buffer
        return

    # Subscribe to enabled edges
    edges.forEach (edge) ->
        srcId = graph.nodeMap[edge.src.process].id
        srcComp = graph.processes[edge.src.process].component
        srcPort = componentLib.outputPort(srcComp, edge.src.port).id
        buffer = new commandstream.Buffer 16
        commandstream.writeCmd buffer, 8, cmdFormat.commands.SubscribeToPort.id, srcId, srcPort, 1
        transport.write buffer
        return

handleNetworkCommand = (command, payload, connection, graph, transport, debugLevel) ->
    if command is "start" or command is "stop"
        # TODO: handle stop command separately, actually pause the graph
        handleNetworkStartStop graph, connection, transport, debugLevel
    else if command is "edges"
        # FIXME: should not need to use transport directly here
        handleNetworkEdges graph, connection, transport, payload.edges
    else
        console.log "Unknown NoFlo UI command on protocol 'network':", command, payload
    return

handleMessage = (contents, connection, graph, transport, debugLevel) ->
    console.log contents.protocol, contents.command, contents.payload
    if contents.protocol is "component"
        handleComponentCommand contents.command, contents.payload, connection
    else if contents.protocol is "graph"
        handleGraphCommand contents.command, contents.payload, connection, graph
    else if contents.protocol is "runtime"
        handleRuntimeCommand contents.command, contents.payload, connection
    else if contents.protocol is "network"
        handleNetworkCommand contents.command, contents.payload, connection, graph, transport, debugLevel
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
        loadFile graphPath, (err, graph) ->
            data = commandstream.cmdStreamFromGraph(componentLib, graph, debugLevel)
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
                @emit 'message', response

    handleMessage: (msg) ->
        handleMessage msg, @conn, @graph, @transport, @debugLevel

module.exports =
    loadFile: loadFile
    setupRuntime: setupRuntime
    setupWebsocket: setupWebsocket
    Runtime: Runtime
    uploadGraphFromFile: uploadGraphFromFile
    uploadGraph: uploadGraph
    createFlowhubRuntime: createFlowhubRuntime
    registerFlowhubRuntime: registerFlowhubRuntime
    handleMessage: handleMessage
