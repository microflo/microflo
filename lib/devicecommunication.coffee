# MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2014 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license

commandstream = require './commandstream'
util = require './util'
EventEmitter = util.EventEmitter;

contains = (str, substr) ->  return str? and str.indexOf(substr) != -1

debug_comms = false
if not util.isBrowser()
    debug_comms = contains process.env.MICROFLO_DEBUG, 'communication'
    debug_send = contains process.env.MICROFLO_DEBUG, 'sending'

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
        @buffer = new commandstream.Buffer(commandstream.cmdFormat.commandSize*100)
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

        @bytesPerSec = 0
        @speedo = setInterval =>
          do @checkBytes
        , 1000
        @previousRun = Date.now()
        @roundTrips = 0
        @latestRoundTrip = null
        @roundTripTotal = 0

        @options = options || {}
        @options.wait = 0 if not @options.wait

    checkBytes: ->
        unless @bytesPerSec
          @previousRun = Date.now()
          return
        elapsed = (Date.now() - @previousRun) / 1000
        return unless elapsed
        perSec = Math.ceil @bytesPerSec / elapsed
        console.log "MICROFLO #{@options.type}: buffered #{@bytesPerSec} at #{perSec}/sec. Time elapsed: #{Math.ceil(elapsed)}s. #{@queue.length} commands in buffer" if debug_send
        @bytesPerSec = 0
        @previousRun = Date.now()
        return unless @roundTrips
        console.log "MICROFLO #{@options.type}: made #{@roundTrips} round-trips at average #{Math.ceil(@roundTripTotal / @roundTrips)}ms each. Latest took #{Math.ceil(@latestRoundTrip)}ms" if debug_send

    write: (chunk, callback) ->
        throw new Error 'SendQueue.write must be implemented by consumer'

    push: (buffer, callback) ->
        console.log 'queuing buf', buffer, @queue.length, buffer.length, @sending if debug_comms

        @bytesPerSec += buffer.length

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
        chunkSize = commandstream.cmdFormat.commandSize*5

        sendCmd = (dataBuf, index) =>
            chunk = dataBuf.slice index, index+chunkSize
            if not chunk.length
                # Done sending, now waiting for response
                # FIXME: error if waiting ofr response times out
                return
            @current.sent = Date.now()
            @write chunk, (err, len) =>
                setTimeout =>
                    errored = err or len == -1
                    if not errored and chunk.length and index < dataBuf.length
                        console.log 'MICROFLO SEND:', chunkSize, chunk, err, len, errored if debug_comms
                        sendCmd dataBuf, index+=chunkSize
                , 0

        sendCmd @current.data, 0 if @current?

    onResponse: (cmd) ->
        return if not @sending
        # FIXME check new type
        type = keyFromId commandstream.cmdFormat.commands, cmd.readUInt8 0
        return if not type
        return if type in [ 'IoValueChange' , 'DebugMessage', 'PacketSent'] # not responses, self-initiated by runtime

        numberOfCommands = @current.data.length/commandstream.cmdFormat.commandSize
        @current.responses++
        # console.log 'checking if enough responses have been made', @current.responses, numberOfCommands
        if @current.responses == numberOfCommands
            # console.log 'running sendCommand callback'
            @current.callback null
            elapsed = Date.now() - @current.sent
            @roundTrips++
            @roundTripTotal += elapsed
            @latestRoundTrip = elapsed
            @current = null
            @next()


# Send/receive data from the MicroFlo runtime on-device
# Takes Buffers filled with with FBCS/commandstream commands and returns the same
# Any parsing/interpretation of these commands must be done on a higher level
class DeviceCommunication extends EventEmitter

    constructor: (transport) ->
        @transport = transport
        @accumulator = new CommandAccumulator commandstream.cmdFormat.commandSize

        return if not @transport
        @sender = new SendQueue commandstream.cmdFormat.commandSize,
          type: @transport.getTransportType()

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

    # Send batched
    sendCommands: (buffer, callback) ->
        @sender.push buffer, callback

    # Low-level
    _onCommandReceived: (buf) ->
        try
            console.log 'MICROFLO RECV:', buf.length, buf if debug_comms
            @_handleCommandReceived null, buf
        catch err
            console.log 'MICROFLO RECV ERROR:', buf.length, buf, err if debug_comms
            @_handleCommandReceived err

    _handleCommandReceived: (err, cmd) ->
        if err
            @emit 'error', err
            return
        @sender.onResponse cmd
        @emit 'response', cmd

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

        @comm.on 'response', (buf) =>
            type = keyFromId commandstream.cmdFormat.commands, buf.readUInt8 0
            if type == 'IoValueChanged'
                @onIoChange buf

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




