### MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2018 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license
###

chai = require('chai')
fbpClient = require 'fbp-client'

address = 'ws://localhost:3334'

describe 'FBP runtime protocol', ->
  client = null

  # FIXME: setup own runtime, instead of relying on fbp-spec
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

  describe 'network:edges', ->
    describe 'with empty edges', ->
      it 'should succeed', ->
        edges = []
        client.protocol.graph.clear({id: 'main'})
        .then () ->
          client.protocol.network.edges({graph: 'main', edges: edges})
        .then (response) ->
          chai.expect(response.edges).to.have.length edges.length

    describe 'with non-exitsting node', ->
      it 'should error', ->
        edges = [
          { src: { node: 'fofo',  port: 'out' }, tgt: { node: 'barb', port: 'in'} }
        ]
        client.protocol.network.edges({graph: 'main', edges: edges})
        .then (r) ->
          chai.expect(r).to.not.exist
        .catch (err) ->
          chai.expect(err.message).to.contain 'No node'
          chai.expect(err.message).to.contain 'fofo'

