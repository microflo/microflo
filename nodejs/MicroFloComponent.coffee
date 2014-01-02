noflo = require 'noflo'
microflo = require '../microflo.js'

# FIXME: should be shielded inside microflo.js
serialport = require 'serialport'

# IDEA: implement the subscribeSubgraph protocol that NoFlo uses,
# to allow introspecting the MicroFlo subgraph

class MicroFloComponent extends noflo.Component
    constructor: ->
        @devname = null
        @graphPath = null
        @isConnected = false;
        @serial = undefined;
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
                microflo.writeString(buffer, 0, microflo.cmdFormat.magicString);
                b = (microflo.dataLiteralToCommand obj.toString(), 1, 0)
                microflo.writeCmd buffer, 8, b
                #microflo.writeCmd buffer, 16, microflo.cmdFormat.commands.End.id
                console.log "Sending", obj, buffer
                @serial.write(buffer);

    checkAndRunUpload: ->
        console.log "checkAndRun", @devName, @graphPath
        if @devName and @graphPath
            @serial = new serialport.SerialPort @devName, {baudrate: 9600}, false
            microflo.loadFile @graphPath, (err, graph) =>
                debugLevel = 'Detailed'
                data = microflo.cmdStreamFromGraph microflo.componentLib, graph, debugLevel
                @serial.open =>
                    microflo.uploadGraph @serial, data, graph, @handleRecv
                    @isConnected = true

    handleRecv: (args...) =>
        if args[0] == "SEND"
            @outPorts.out.send(args[4]);
            #console.log args[3], args[4]
        else
            console.log args

    shutdown: ->
        console.log "custom comp shutdown"
        @outPorts.forEach (outport) =>
            @outPorts[outport].disconnect()

exports.getComponent = -> new MicroFloComponent

