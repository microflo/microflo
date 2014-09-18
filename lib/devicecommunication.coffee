# MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2014 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license

commandstream = require './commandstream'

EventEmitter = require('events').EventEmitter

# TODO: implement a echo command, for testing

class DeviceCommunicationError extends Error


# Mirrors HostTransport class found on device side
# Handles transporting bytes between device and host,
# not caring what they mean
class DeviceTransport extends EventEmitter

    getTransportType: () ->
        throw new DeviceCommunicationError 'getTransportType() not implemented'

    write: (buffer, callback) ->
        throw new DeviceCommunicationError 'write() not implemented'

    # Emits 'data' event with a Buffer

class CommandAccumulator extends EventEmitter
    constructor: (commandSize) ->
        @commandSize = commandSize
        @buffer = new commandstream.Buffer(commandstream.cmdFormat.commandSize*100);
        @offset = 0

    onData: (da) ->
        # console.log "@buffer= ", @buffer.slice 0, @offset
        # console.log "data= ", da
        da.copy @buffer, @offset, 0, da.length
        @offset += da.length
        if @offset > @buffer.length
            @emit 'error', new DeviceCommunicationError 'Receive buffer overflow'

        maxIdx = (Math.floor(@offset/@commandSize))*@commandSize
        for startIdx in [0...maxIdx] by @commandSize
            b = @buffer.slice startIdx, startIdx+@commandSize
            @emit 'command', b
        slush = @offset % @commandSize
        @buffer.copy @buffer, 0, @offset-slush, @offset
        @offset = slush

# FIXME: probably need a open/connect and close/disconnect?

# Mirrors the HostCommunication class found on the device side
# Handles converting from JS objects to the FBCS commands and back
class DeviceCommunication extends EventEmitter

    # XXX: not liking the graph access that well
    constructor: (transport, graph, componentLib) ->
        @graph = graph
        @transport = transport
        @componentLib = componentLib
        @accumulator = new CommandAccumulator commandstream.cmdFormat.commandSize
        @sending = false

        return if not @transport
        @transport.on 'data', (buf) =>
            @accumulator.onData buf
        @accumulator.on 'command', (buf) =>
            @_onCommandReceived buf

    open: (cb) ->
        # FIXME: move these details into commandstream
        buffer = commandstream.Buffer commandstream.cmdFormat.commandSize
        commandstream.writeString(buffer, 0, commandstream.cmdFormat.magicString);
        @sendCommands buffer, cb
    close: (cb) ->
        buffer = commandstream.Buffer commandstream.cmdFormat.commandSize
        commandstream.writeString(buffer, 0, commandstream.cmdFormat.commands.End.id);
        @sendCommands buffer, cb

    # High-level API
    ping: (cb) ->
        # FIXME: move these details into commandstream
        buffer = commandstream.Buffer commandstream.cmdFormat.commandSize
        commandstream.writeCmd buffer, 0, commandstream.cmdFormat.commands.Ping.id
        @sendCommands buffer, cb
    # pong


    # Should maybe be separate, to allow batching up commmands into an object,
    # then send all those commands (potentially just 1) as one batch/transaction?
    addNode: (node, component, cb) ->
    removeNode: (node, cb) ->
    # nodeAdded, nodeRemoved

    addEdge: (srcNode, srcPort, tgtNode, tgtPort, cb) ->
    removeEdge: (srcNode, srcPort, tgtNode, tgtPort, cb) ->
    # edgeAdded, edgeRemoved

    addInitial: (tgtNode, tgtPort, data, cb) ->
    removeInitial: (tgtNode, tgtPort, cb) ->
    # iipAdded, iipRemoved

    startNetwork: (cb) ->
    stopNetwork: (cb) ->
    # networkStarted, networkStopped

    subscribePort: () ->
    configureDebug: () ->
    # portSubscribed, debugConfigured

    # Send batched
    sendCommands: (buffer, callback) ->
        @sending = true

        numberOfCommands = buffer.length/commandstream.cmdFormat.commandSize
        responsesReceived = 0
        @transport.write buffer, () ->
            # console.log 'wrote', arguments[0], arguments[1]
        listenResponse = () ->
            # console.log 'response', arguments
            responsesReceived++
            if responsesReceived == numberOfCommands
                @removeListener 'response', listenResponse
                @sending = false
                return callback null
        listener = @on 'response', listenResponse

        # Rate-limited writing
        # XXX: for some reason when writing without this delay,
        # the first bytes ends up corrupted on microcontroller side
        # FIXME: replace with batching up to N commands, and then wait
        # Limits should be based on: baudrate + expected receive buffer size
        initialWait = @transport.getTransportType() == "HostJavaScript" ? 10 : 500
        perCommandWait = @transport.getTransportType() == "HostJavaScript" ? 0 : 100
        chunkSize = commandstream.cmdFormat.commandSize
        sendCmd = (dataBuf, index) =>
            chunk = dataBuf.slice index, index+chunkSize
            if not chunk.length
                # console.log 'finished sending commands, waiting for response'
                return
            @transport.write chunk, () ->
                if index < dataBuf.length
                    setTimeout () =>
                        sendCmd dataBuf, index+=chunkSize
                    , perCommandWait

        setTimeout () =>
            sendCmd buffer, 0
        , initialWait

    # Low-level
    _onCommandReceived: (buf) ->
        return if not @sending
        commandstream.parseReceivedCmd @componentLib, @graph, buf, () =>
            @_handleCommandReceived.apply this, arguments

    _handleCommandReceived: (type) ->
        # Just emit without change atm
        @emit.apply this, arguments
        args = new Array arguments.length
        for i in [0...arguments.length]
            args[i] = arguments[i]
        args.unshift 'response'
        @emit.apply this, args

exports.DeviceTransport = DeviceTransport
exports.DeviceCommunication = DeviceCommunication
exports.DeviceCommunicationError = DeviceCommunicationError



