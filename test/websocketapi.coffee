### MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license
###

assert = require('assert')
microflo = require('../lib/microflo')
websocket = require('websocket')

describe 'WebSocket API', ->
  runtime = null

  before (done) ->
    runtime = new (microflo.runtime.Runtime)(null)
    runtime.library.loadPaths ['./test/components'], {}, (err) ->
      if err
        throw err
      microflo.runtime.setupWebsocket runtime, { host: 'localhost', port: 3888 }, ->
        done()
  after ->
    # FIXME: allow teardown

  describe 'sending component list command', ->
    it 'should return all available components', (done) ->
      client = new (websocket.client)
      client.on 'connectFailed', (error) ->
        assert.fail 'connect success', 'connect failed', error.toString()
      expectedComponents = runtime.library.listComponents()
      receivedComponent = []
      client.on 'connect', (connection) ->
        connection.on 'error', (error) ->
          assert.fail 'connect OK', 'connect error', error.toString()
        onMessage = (message) ->
          if message.type == 'utf8'
            response = JSON.parse(message.utf8Data)
            assert.equal response.protocol, 'component'
            assert.equal response.command, 'component'
            receivedComponent.push response.payload
            if receivedComponent.length == Object.keys(expectedComponents).length
              # TODO: verify value of component
              connection.removeListener 'message', onMessage
              done()

        connection.on 'message', onMessage
        m =
          'protocol': 'component'
          'command': 'list'
        connection.sendUTF JSON.stringify(m)

      client.connect 'ws://localhost:3888/'

