# MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2014 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license

commandstream = require './commandstream'
runtime = require './runtime'

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

        maxIdx = Math.floor (@offset/@commandSize)*@commandSize
        for startIdx in [0..maxIdx] by @commandSize
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
    constructor: (transport, graph) ->
        @graph = graph
        @transport = transport
        @accumulator = new CommandAccumulator (commandstream.cmdFormat.commandSize)

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
        # TODO: implement
        return cb null

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
        numberOfCommands = buffer.length/commandstream.cmdFormat.commandSize
        responsesReceived = 0
        @transport.write buffer, () ->
            # console.log 'wrote', arguments[0], arguments[1]
        listenResponse = () ->
            console.log 'response', arguments
            responsesReceived++
            if responsesReceived == numberOfCommands
                @removeListener 'response', listenResponse
                return callback null
        listener = @on 'response', listenResponse


    # Low-level
    _sendCommand: (buf, callback) ->
        @transport.write buf, callback

    _onCommandReceived: (buf) ->
        runtime.parseReceivedCmd buf, @graph, () =>
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



