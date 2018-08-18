### MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2018 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license
###

chai = require('chai')
fbpClient = require 'fbp-client'

address = 'ws://localhost:3334'

describe 'FBP runtime protocol', ->
  client = null

  before ->
    fbpClient({address:address}).then (c) ->
      client = c
      return client.connect()

  after ->
    return

  describe 'network:getstatus', ->
    it 'should give started', ->
      client.protocol.network.start({graph: 'main'})
      .then (response) ->
        chai.expect(response.started).to.equal true
        

