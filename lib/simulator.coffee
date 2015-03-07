### MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license
###

util = require('./util')
EventEmitter = util.EventEmitter

fbp = require('fbp')
devicecommunication = require('./devicecommunication')
runtime = require('./runtime')
ComponentLibrary = require('./componentlib').ComponentLibrary

class Transport extends EventEmitter
    constructor: (@runtime, @emscripten) ->
        @outbound_queue = []

        @pullFuncPtr = @emscripten.Runtime.addFunction (vars...) => @onPull vars...
        @receiveFuncPtr = @emscripten.Runtime.addFunction (vars...) => @onReceive vars...

        @emscripten['_emscripten_runtime_setup'] @runtime, @receiveFuncPtr, @pullFuncPtr

    getTransportType: () ->
        'HostJavaScript'

    write: (buffer, callback) ->
        @outbound_queue.push buffer
        return callback() if callback

    close: (callback) ->
        return callback null

    onPull: ->
        #console.log('pulling', @outbound_queue.length);
        i = 0
        while i < @outbound_queue.length
            buffer = @outbound_queue[i]
            j = 0
            while j < buffer.length
                byte = buffer.readUInt8(j)
                @emscripten['_emscripten_runtime_send'] @runtime, byte
                j++
            i++
        @outbound_queue = []

    onReceive: ->
        # console.log("_receive", arguments.length);
        i = 0
        while i < arguments.length
            @emit 'data', new (util.Buffer)([ arguments[i] ])
            i++
        return

class RuntimeSimulator extends EventEmitter
    constructor: (@emscripten) ->
        @runtime = @emscripten['_emscripten_runtime_new']()
        @transport = new Transport @runtime, @emscripten
        @graph = {}
        @library = new ComponentLibrary
        @device = new devicecommunication.DeviceCommunication @transport, @graph, @library
        @io = new devicecommunication.RemoteIo @device
        @debugLevel = 'Error'
        @conn = {}

        @conn.send = (response) =>
            console.log 'FBP MICROFLO SEND:', response if util.debug_protocol
            @emit 'message', response

    handleMessage: (msg) ->
        console.log 'FBP MICROFLO RECV:', msg if util.debug_protocol
        runtime.handleMessage this, msg

        @device.on 'response', =>
            args = []
            i = 0
            while i < arguments.length
                args.push arguments[i]
                i++
            runtime.deviceResponseToFbpProtocol @, @conn.send, args
            # Assumes comm is open

    uploadGraph: (graph, callback) ->
        @graph = graph
        @device.graph = graph # XXX: not so nice

        checkUploadDone = (m) =>
            if m.protocol == 'network' and m.command == 'started'
                @removeListener 'message', checkUploadDone
                return callback()

        @on 'message', checkUploadDone
        @handleMessage
            protocol: 'network'
            command: 'start'

    uploadFBP: (prog, callback) ->
        @uploadGraph fbp.parse(prog), callback

    # Blocking iteration
    runTick: (tickIntervalMs) ->
        tickIntervalMs |= 0
        @emscripten['_emscripten_runtime_run'] @runtime, tickIntervalMs

    # Free-running mode
    # timeFactor 1.0 = normal time, 0.0 = standstill
    start: (timeFactor) ->
        timeFactor = 1.0 if not timeFactor?
        intervalMs = 100
        runTick = () =>
            t = intervalMs * timeFactor
            @runTick t
        @tickInterval = setInterval runTick, intervalMs

    stop: ->
        clearInterval @tickInterval

exports.RuntimeSimulator = RuntimeSimulator
