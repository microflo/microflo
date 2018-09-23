# MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2014 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license

commandstream = require './commandstream'
util = require './util'
EventEmitter = util.EventEmitter;
bluebird = require 'bluebird'

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
        super()
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


# Send/receive data from the MicroFlo runtime on-device
# Takes Buffers filled with with FBCS/commandstream commands and returns the same
# Any parsing/interpretation of these commands must be done on a higher level
class DeviceCommunication extends EventEmitter

    constructor: (@transport, @options={}) ->
        super()
        @accumulator = new CommandAccumulator commandstream.cmdFormat.commandSize
        @options.timeout = 500 if not @options.timeout? 

        @requestNo = 1 
        @requests = [] # queue
        @current = null # in-flight

        @transport.on 'data', (buf) =>
            @accumulator.onData buf
        @accumulator.on 'command', (buf) =>
            try
                @_onCommandReceived buf
            catch e
                console.error 'MICROFLO RECV ERROR', e

    open: () ->
        buffer = commandstream.Buffer commandstream.cmdFormat.commandSize
        commandstream.writeString(buffer, 0, commandstream.cmdFormat.magicString);
        # requestId is at the end in this message
        requestId = @_makeRequestId()
        buffer.writeUInt8 requestId, commandstream.cmdFormat.commandSize-1
        return new Promise (resolve, reject) =>
            @_sendRequest buffer, requestId, (err, res) ->
                return reject err if err?
                return resolve res
            return null

    # High-level API
    ping: () ->
        buffer = commandstream.Buffer commandstream.cmdFormat.commandSize
        commandstream.commands.microflo.ping {}, buffer, 0
        return @request buffer

    _makeRequestId: () ->
        # Issue new ID
        if @requestNo > 100
            @requestNo = 1
        requestId = @requestNo++

        # It should not happen that this requestId still has operations pending
        # but check just in case
        old = @requests.findIndex (r) -> r.id == requestId
        if old >= 0
            request = @requests.remove old
            request.finish new Error("Not completed before new request")

        return requestId

    _sendNextRequest: () ->
        if @current
            throw new Error("Cannot send next request, @current still pending")
        if @requests.length == 0
            return

        @current = @requests.shift()
        requestId = @current.command.readUInt8 0
        requestType = @current.command.readUInt8 1
        console.log 'MICROFLO SEND:', requestId, requestType, @current.command if debug_comms
        @transport.write @current.command, (err) ->
            if err
                @current.finish err

    request: (command, callback) ->
        # Stamp the command with the requestId
        requestId = @_makeRequestId()
        command.writeUInt8 requestId, 0
        return new Promise (resolve, reject) =>
            @_sendRequest command, requestId, (err, res) ->
                return reject err if err
                return resolve res

    _sendRequest: (command, requestId, callback) ->
        if command.length != commandstream.cmdFormat.commandSize
            return callback new Error "request was not a single command. Length: #{command.length}"

        # Complete request
        callbackAndNext = (err, res) =>
            return if callback == null # already returned once
            @current = null
            @_sendNextRequest()
            setTimeout () ->
                return if callback == null # already returned once
                callback err, res
                callback = null
            , 0

        # Handle timeout
        timeout = @options.timeout
        setTimeout () ->
            callbackAndNext new Error("Device did not respond within #{timeout}ms")
        , timeout

        @requests.push
            id: requestId
            command: command
            finish: callbackAndNext
        @_sendNextRequest() if not @current

    # Send batched
    sendCommands: (buffer, callback) ->
        @sendMany(buffer).then ((r) -> callback(null, r)), callback
        return undefined

    sendMany: (buffer, callback) ->
        cmdSize = commandstream.cmdFormat.commandSize
        nCommands = Math.floor(buffer.length / cmdSize)

        requests = []
        for i in [0...nCommands]
            command = Buffer.from buffer.slice(i*cmdSize, (i+1)*cmdSize)
            requests.push @request(command)
        
        return Promise.all(requests)

    # Low-level
    _onCommandReceived: (cmd) ->
        responseTo = cmd.readUInt8 0
        type = keyFromId commandstream.cmdFormat.commands, cmd.readUInt8 1

        console.log 'MICROFLO RECV:', responseTo, type, cmd.length, cmd if debug_comms

        # Events are commands that are initiated by the runtime
        eventTypes = [ 'IoValueChange' , 'DebugMessage', 'PacketSent']
        isEvent = responseTo == 0
        if isEvent and type not in eventTypes
            throw new Error("Event of unexpected type #{type}: #{cmd}" )

        if isEvent
            @emit 'event', cmd
            return

        # Else it is a response, to a request sent by client
        if @current.id != responseTo
            throw new Error("responseId #{responseTo} does not match current request #{@current.id}")

        @current.finish null, cmd

        # Make sure to emit after finish current request
        @emit 'response', cmd # XXX: should go away, each request handler should take care of own response


keyFromId = (map, wantedId) ->
    for name, val of map
        #console.log name, val
        id = if val.id? then  val.id else val
        return name if  id == wantedId

# Handles host part of I/O mocking/control/introspection. Mostly used for testing
class RemoteIo extends EventEmitter
    constructor: (comm) ->
        super()
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
        commandstream.writeCmd buffer, 0, 0, c.commands.SetIoValue.id, c.ioTypes.TimeMs.id
        newTime = @latestState.timeMs+increment
        buffer.writeInt32LE newTime, 2
        # FIXME: assumtes it was set correctly
        @latestState.timeMs = newTime
        @comm.sendCommands buffer, cb



exports.DeviceTransport = DeviceTransport
exports.DeviceCommunication = DeviceCommunication
exports.RemoteIo = RemoteIo
exports.DeviceCommunicationError = DeviceCommunicationError




