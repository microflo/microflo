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
    fbp = require("fbp")
    fs = require("fs")
    path = require("path")
    uuid = require("node-uuid")

flowhub = require("flowhub-registry")
commandstream = require("./commandstream")
generate = require("./generate")
c = require("./componentlib")
componentLib = new c.ComponentLibrary(c.defaultComponents, "./microflo")
cmdFormat = require("./commandformat")
serial = require("./serial")
devicecommunication = require("./devicecommunication")

generateOutput = (componentLib, inputFile, outputFile, target) ->
    outputBase = outputFile.replace(path.extname(outputFile), "")
    outputFile = outputFile + ".pde"    unless path.extname(outputFile)
    outputDir = path.dirname(outputBase)
    fs.mkdirSync outputDir    unless fs.existsSync(outputDir)
    loadFile inputFile, (err, def) ->
        throw err if err
        
        # TODO: allow to generate just one of these
        fs.writeFile outputBase + ".json", JSON.stringify(def), (err) ->
            throw err if err
            return
        data = commandstream.cmdStreamFromGraph(componentLib, def)
        fs.writeFile outputBase + ".fbcs", data, (err) ->
            throw err if err
            return
        fs.writeFile outputBase + ".h", generate.cmdStreamToCDefinition(data, target), (err) ->
            throw err if err
            return
        fs.writeFile outputFile, generate.cmdStreamToCDefinition(data, target) + "\n" + "#define MICROFLO_EMBED_GRAPH\n" + "#include \"microflo.h\"" + "\n#include \"main.hpp\"", (err) ->
            throw err if err
            return


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

handleMessage = (contents, connection, graph, getTransport, debugLevel) ->
    console.log contents.protocol, contents.command, contents.payload
    transport = getTransport()
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

setupRuntime = (serialPortToUse, baudRate, port, debugLevel, ip) ->
    httpServer = http.createServer (request, response) ->
        path = url.parse(request.url).pathname
        if path is "/"
            response.writeHead 200,
                "Content-Type": "text/plain"
            response.write "NoFlo UI WebSocket API at: " + "ws://" + request.headers.host
        else
            response.writeHead 404
        response.end()
    wsServer = new websocket.server(httpServer: httpServer)
    
    # FIXME: nasty and racy, should pass callback and only then continue
    getSerial = serial.openTransport(serialPortToUse, baudRate)
    graph = {}
    wsServer.on "request", (request) ->
        subProtocol = (if (request.requestedProtocols.indexOf("noflo") isnt -1) then "noflo" else null)
        connection = request.accept(subProtocol, request.origin)
        connection.on "message", (message) ->
            if message.type is "utf8"
                try
                    contents = JSON.parse(message.utf8Data)
                catch e
                    console.log "WS parser error: ", e
                
                # Only expose a narrow API for communicating back to UI
                sendFunc = (response) ->
                    connection.sendUTF JSON.stringify(response)
                conn = send: sendFunc
                handleMessage contents, conn, graph, getSerial, debugLevel

    httpServer.listen port, ip, (err) ->
        error err if err
        console.log "MicroFlo runtime listening at", ip + ":" + port

setupRuntimeChrome = (serialPortToUse, baudRate, port, debugLevel, ip) ->
    throw new Error("Cannot load Chrome HTTP/WebSockets API")    unless http.Server and http.WebSocketServer
    
    # Listen for HTTP connections.
    server = new http.Server()
    wsServer = new http.WebSocketServer(server)
    server.listen port
    console.log "WebSocket server running on: ", port
    
    # FIXME: nasty and racy, should pass callback and only then continue
    getSerial = serial.openTransport(serialPortToUse, baudRate)
    graph = {}
    server.addEventListener "request", (req) ->
        console.log "Got request: ", req
        url = req.headers.url
        url = "/index.html"    if url is "/"
        
        # Serve the pages of this chrome application.
        req.serveUrl url
        true

    wsServer.addEventListener "request", (req) ->
        console.log "Client connected"
        socket = req.accept()
        socket.addEventListener "message", (e) ->
            console.log "message:", e.data
            contents = JSON.parse(e.data)
            # Method to communicate back
            sendFunc = (response) ->
                socket.send JSON.stringify(response)
                return
            conn = send: sendFunc
            try
                handleMessage contents, conn, graph, getSerial, debugLevel
            catch e
                console.log e.stack
                console.log e
            return

        socket.addEventListener "close", ->
            console.log "Client disconnected"

uploadGraphFromFile = (graphPath, serialPortName, baudRate, debugLevel) ->
    serial.openTransport serialPortName, baudRate, (err, transport) ->
        loadFile graphPath, (err, graph) ->
            data = commandstream.cmdStreamFromGraph(componentLib, graph, debugLevel)
            uploadGraph transport, data, graph

module.exports =
    loadFile: loadFile
    generateOutput: generateOutput
    setupRuntime: setupRuntime
    uploadGraphFromFile: uploadGraphFromFile
    uploadGraph: uploadGraph
    createFlowhubRuntime: createFlowhubRuntime
    registerFlowhubRuntime: registerFlowhubRuntime
    handleMessage: handleMessage

module.exports.setupRuntime = setupRuntimeChrome if util.isBrowser()
