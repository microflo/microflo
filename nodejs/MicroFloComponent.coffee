noflo = require 'noflo'
microflo = require '../lib/microflo'

# FIXME: should be shielded inside microflo.js
serialport = require 'serialport'

# IDEA: implement the subscribeSubgraph protocol that NoFlo uses,
# to allow introspecting the MicroFlo subgraph

componentLib = new microflo.componentlib.ComponentLibrary(require("../microflo/components.json"), "../microflo")

class MicroFloComponent extends noflo.Component
    constructor: ->
        @devname = null
        @graphPath = null
        @isConnected = false;
        @transport = undefined;
        @inPorts =
            devicename: new noflo.Port 'string'
            graph: new noflo.Port 'object'
            in: new noflo.Port 'object'
        @outPorts =
            error: new noflo.Port 'object'
            out: new noflo.Port 'object'

        @inPorts.devicename.on 'data', (devname) =>
            @devName = devname
            @checkAndRunUpload()
        @inPorts.graph.on 'data', (graph) =>
            @graphPath = graph
            @checkAndRunUpload()
        @inPorts.in.on 'data', (obj) =>
            if @isConnected
                buffer = new Buffer(16);
                microflo.commandstream.writeString(buffer, 0, microflo.commandstream.cmdFormat.magicString);
                b = (microflo.commandstream.dataLiteralToCommand obj.toString(), 1, 0)
                microflo.commandstream.writeCmd buffer, 8, b
                #microflo.writeCmd buffer, 16, microflo.commandstream.cmdFormat.commands.End.id
                #console.log "Sending", obj, buffer
                @transport.write buffer

    checkAndRunUpload: ->
        console.log "checkAndRun", @devName, @graphPath
        if @devName and @graphPath
            microflo.runtime.loadFile @graphPath, (err, graph) =>
                microflo.serial.openTransport @devName, (err, transport) =>
                    @transport = transport
                    @isConnected = true
                    data = microflo.commandstream.cmdStreamFromGraph componentLib, graph, debugLevel
                    microflo.runtime.uploadGraph @transport, data, graph, @handleRecv
                    debugLevel = 'Detailed'


    handleRecv: (args...) =>
        if args[0] == "SEND"
            @outPorts.out.send(args[4]);
            #console.log args[3], args[4]
        else if args[0] == "NETSTART"
            buffer = new Buffer(16);
            microflo.commandstream.writeString(buffer, 0, microflo.commandstream.cmdFormat.magicString);
            microflo.commandstream.writeCmd(buffer, 8, microflo.commandstream.cmdFormat.commands.SubscribeToPort.id, 1, 0, 1);
            console.log "subscribe", buffer
            @transport.write buffer
        else
            console.log args

    shutdown: ->
        console.log "custom comp shutdown"
        @outPorts.forEach (outport) =>
            @outPorts[outport].disconnect()

exports.getComponent = -> new MicroFloComponent

