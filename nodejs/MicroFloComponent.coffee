noflo = require 'noflo'
microflo = require '../microflo.js'

# FIXME: should be shielded inside microflo.js
serialport = require 'serialport'

# IDEA: implement the subscribeSubgraph protocol that NoFlo uses,
# to allow introspecting the MicroFlo subgraph

class MicroFloComponent extends noflo.Component
    constructor: ->
        console.log "custom component instantiated"
        @devname = null
        @graphPath = null
        @inPorts =
            devicename: new noflo.Port 'string'
            graph: new noflo.Port 'object'
        @outPorts =
            error: new noflo.Port 'object'
            out: new noflo.Port 'object'

        @inPorts.devicename.on 'data', (devname) =>
            @devName = devname
            @checkAndRunUpload()
        @inPorts.graph.on 'data', (graph) =>
            @graphPath = graph
            @checkAndRunUpload()

    checkAndRunUpload: ->
        console.log "checkAndRun", @devName, @graphPath
        if @devName and @graphPath
            serial = new serialport.SerialPort @devName, {baudrate: 9600}, false
            microflo.loadFile @graphPath, (err, graph) =>
                debugLevel = 'Error'
                data = microflo.cmdStreamFromGraph microflo.componentLib, graph, debugLevel
                serial.open =>
                    console.log "SERIAL OPEN", graph, data, @handleRecv
                    microflo.uploadGraph serial, data, graph, @handleRecv

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

