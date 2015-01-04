# MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2014 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license

commandstream = require './commandstream'
util = require './util'
EventEmitter = util.EventEmitter;

contains = (str, substr) ->  return str? and str.indexOf substr != -1

debug_comms = false
if not util.isBrowser()
    debug_comms = contains process.env.MICROFLO_DEBUG, 'communication'

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


# Rate-limited writing
# XXX: for some reason when writing without this delay,
# the first bytes ends up corrupted on microcontroller side
# FIXME: replace with batching up to N commands, and then wait
# TODO: Limits should be based on: baudrate + expected receive buffer size
class SendQueue extends EventEmitter
    constructor: (commandSize, options) ->
        @commandSize = commandSize
        @queue = []
        @current = null
        @sending = false

        @options = options || {}
        @options.wait = 10 if not @options.wait


    write: (chunk, callback) ->
        throw new Error 'SendQueue.write must be implemented by consumer'

    push: (buffer, callback) ->
        # console.log 'queuing buf', buffer, @sending
        @queue.push
            data: buffer
            callback: callback
            responses: 0
        return if @sending

        @sending = true
        @next()

    next: () ->
        # console.log 'checking queue for next item', @queue.length
        if not @queue.length
            @sending = false
            return

        # console.log 'popping buff off queue'
        @current = @queue.shift()
        chunkSize = commandstream.cmdFormat.commandSize

        sendCmd = (dataBuf, index) =>
            chunk = dataBuf.slice index, index+chunkSize
            # console.log 'sendbuf, sending a chunk', chunk
            if not chunk.length
                # Done sending, now waiting for response
                # FIXME: error if this times out
                return
            @write chunk, () =>
                console.log 'MICROFLO SEND:', chunkSize, chunk if debug_comms
                if index < dataBuf.length
                    setTimeout () =>
                        sendCmd dataBuf, index+=chunkSize
                    , @options.wait

        setTimeout () =>
            sendCmd @current.data, 0
        , @options.wait

    onResponse: (type) ->
        return if not @sending
        return if type in ['IOCHANGE', 'DEBUG', 'UNKNOWN']

        numberOfCommands = @current.data.length/commandstream.cmdFormat.commandSize
        @current.responses++
        # console.log 'checking if enough responses have been made', @current.responses, numberOfCommands
        if @current.responses == numberOfCommands
            # console.log 'running sendCommand callback'
            @current.callback null
            @current = null
            @next()


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
        @sender = new SendQueue commandstream.cmdFormat.commandSize

        return if not @transport
        @transport.on 'data', (buf) =>
            @accumulator.onData buf
        @accumulator.on 'command', (buf) =>
            @_onCommandReceived buf

        @sender.write = (chunk, cb) =>
            @transport.write chunk, cb

    open: (cb) ->
        # FIXME: move these details into commandstream
        buffer = commandstream.Buffer commandstream.cmdFormat.commandSize
        commandstream.writeString(buffer, 0, commandstream.cmdFormat.magicString);
        @sendCommands buffer, cb
    close: (cb) ->
        buffer = commandstream.Buffer commandstream.cmdFormat.commandSize
        commandstream.writeCmd buffer, 0, commandstream.cmdFormat.commands.End.id
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
        @sender.push buffer, callback

    # Low-level
    _onCommandReceived: (buf) ->
        commandstream.parseReceivedCmd @componentLib, @graph, buf, () =>
            console.log 'MICROFLO RECV:', buf.length, buf, Array.prototype.slice.call(arguments) if debug_comms
            @_handleCommandReceived.apply this, arguments

    _handleCommandReceived: (type) ->
        @sender.onResponse type

        # Just emit without change atm
        @emit.apply this, arguments
        args = new Array arguments.length
        for i in [0...arguments.length]
            args[i] = arguments[i]
        args.unshift 'response'
        @emit.apply this, args


keyFromId = (map, wantedId) ->
    for name, val of map
        #console.log name, val
        id = if val.id? then  val.id else val
        return name if  id == wantedId

# Handles host part of I/O mocking/control/introspection. Mostly used for testing
class RemoteIo extends EventEmitter
    constructor: (comm) ->
        @comm = comm
        @latestState =
            digitalOutputs: []
            timeMs: 0

        @comm.on 'IOCHANGE', (buf) => @onIoChange buf

    onIoChange: (buf) ->
        type = keyFromId commandstream.cmdFormat.ioTypes, buf.readUInt8 1
        if type == 'Digital'
            pin = buf.readUInt8 2
            val = (buf.readUInt8 3) != 0
            @latestState.digitalOutputs[pin] = val
            @emit 'digital', @latestState.digitalOutputs

        @emit 'change', @latestState

    forwardTime: (increment, cb) ->
        c = commandstream.cmdFormat
        buffer = commandstream.Buffer c.commandSize
        # FIXME: effective time change dependent on latency
        commandstream.writeCmd buffer, 0, c.commands.SetIoValue.id, c.ioTypes.TimeMs.id
        newTime = @latestState.timeMs+increment
        buffer.writeInt32LE newTime, 2
        # FIXME: assumtes it was set correctly
        @latestState.timeMs = newTime
        @comm.sendCommands buffer, cb



exports.DeviceTransport = DeviceTransport
exports.DeviceCommunication = DeviceCommunication
exports.RemoteIo = RemoteIo
exports.DeviceCommunicationError = DeviceCommunicationError




