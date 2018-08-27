### MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2018 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license
###

chai = require('chai')

devicecommunication = require('../lib/devicecommunication')
{ DeviceTransport, DeviceCommunication } = devicecommunication
commandstream = require('../lib/commandstream')
cmdFormat = commandstream.cmdFormat

class FakeTransport extends DeviceTransport
    constructor: () ->
        super()
        @requests = []
        @responses = []
        @onRequest = null

    getTransportType: () ->
        return 'fake'

    write: (buffer, callback) ->
        @requests.push buffer
        @onRequest buffer if @onRequest
        return callback null

    fromDevice: (buffer) ->
        @emit 'data', buffer
    
openResp = (request) ->
  magic = request.slice(0, -1).toString('utf-8')
  if magic == cmdFormat.magicString
    requestId = request.readUInt8 cmdFormat.commandSize-1
    response = Buffer.alloc(cmdFormat.commandSize)
    response.fill 0
    response.writeUInt8 requestId, 0
    response.writeUInt8 cmdFormat.commands.CommunicationOpen.id, 1
    return response

pingResponse = (request) ->
  requestId = request.readUInt8 0
  type = request.readUInt8 1
  response = Buffer.from request
  if type == cmdFormat.commands.Ping.id
    response.writeUInt8 cmdFormat.commands.Pong.id, 1
    return response

clearResponse = (request) ->
  requestId = request.readUInt8 0
  type = request.readUInt8 1
  response = Buffer.from request
  if type == cmdFormat.commands.ClearNodes.id
    #response.fill 0
    response.writeUInt8 requestId, 0
    response.writeUInt8 cmdFormat.commands.NodesCleared.id, 1
    return response

describe 'DeviceCommunication', ->
  
  transport = null
  device = null

  beforeEach ->
    transport = new FakeTransport
    device = new DeviceCommunication transport, { timeout: 50 }
    transport.onRequest = null
    return

  afterEach ->
    return

  describe 'open()', ->
    describe 'without response', ->
      it 'should give timeout', (done) ->
        device.open (err, res) ->
          chai.expect(err.message).to.contain 'did not respond'
          return done()

    describe 'with success', ->
      it 'should return response', (done) ->
        transport.onRequest = (request) ->
          r = openResp request
          transport.fromDevice r

        device.open (err, res) ->
          chai.expect(err).to.be.null
          return done()

  describe 'ping()', ->
    it 'should return pong', (done) ->
        transport.onRequest = (request) ->
          r = openResp request
          r = pingResponse(request) if not r
          transport.fromDevice r

        device.open (err, res) ->
          chai.expect(err).to.be.null
          device.ping().then(((r) -> done(null)), done)

  describe 'sendCommands', ->
    describe 'with one command', ->
      it 'should return responses', (done) ->
        transport.onRequest = (request) ->
          r = openResp request
          r = clearResponse(request) if not r
          transport.fromDevice r

        req = Buffer.alloc cmdFormat.commandSize
        commandstream.commands.graph.clear {}, req, 0
        device.open (err, res) ->
          chai.expect(err).to.be.null
          device.sendCommands req, (err, res) ->
            chai.expect(err).to.be.null
            chai.expect(res).to.have.length 1
            return done()

    describe 'with multiple commands', ->
      it 'should return responses', (done) ->
        transport.onRequest = (request) ->
          r = openResp request
          r = clearResponse(request) if not r
          r = pingResponse(request) if not r
          chai.expect(r).to.exist
          transport.fromDevice r

        messages = [
          { protocol: 'graph', command: 'clear', payload: {} }
          { protocol: 'microflo', command: 'ping', payload: {} }
          { protocol: 'graph', command: 'clear', payload: {} }
          { protocol: 'microflo', command: 'ping', payload: {} }
        ]
        buffer = Buffer.alloc cmdFormat.commandSize*messages.length
        index = 0
        for m in messages
          index = commandstream.toCommandStreamBuffer m, null, {}, {}, buffer, index

        device.open (err, res) ->
          chai.expect(err).to.be.null
          device.sendCommands buffer, (err, res) ->
            chai.expect(err).to.be.null
            return done()

    describe 'with timeout', ->
      it 'should return error', (done) ->
        transport.onRequest = (request) ->
          r = openResp request
          if r
            transport.fromDevice r
          r = clearResponse(request) if not r
          r = pingResponse(request) if not r
          chai.expect(r).to.exist
          #transport.fromDevice r # cause timeout

        messages = [
          { protocol: 'graph', command: 'clear', payload: {} }
          { protocol: 'microflo', command: 'ping', payload: {} }
          { protocol: 'graph', command: 'clear', payload: {} }
          { protocol: 'microflo', command: 'ping', payload: {} }
        ]
        buffer = Buffer.alloc cmdFormat.commandSize*messages.length
        index = 0
        for m in messages
          index = commandstream.toCommandStreamBuffer m, null, {}, {}, buffer, index

        device.open (err, res) ->
          chai.expect(err).to.be.null
          device.sendCommands buffer, (err, res) ->
            chai.expect(err).to.exist
            chai.expect(err.message).to.include 'did not respond'
            return done()

    describe 'with error', ->
      it 'should return error'
