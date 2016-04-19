### MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license
###

chai = require('chai')
microflo = require('../lib/microflo')
fbp = require('fbp')

try
  build = require '../build/emscripten/microflo-runtime.js'
catch e
  console.log 'WARN: could not load Emscripten build', e.toString()
describeIfSimulator = if build? then describe else describe.skip

describeIfSimulator 'Network', ->
  describe.skip 'sending packets through subgraph', ->
    it 'should give the same packets out on other side', ->
      messages = [
        0
        1
        2
        3
      ]
      compare = microflo.simulator.createCompare(messages)
      s = new microflo.simulator.RuntimeSimulator build
      net = s.network
      inputNode = net.addNode(s.library.getComponent('Forward').id)
      subgraphNode = net.addNode(s.library.getComponent('SubGraph').id)
      innerNode = net.addNode(s.library.getComponent('Forward').id, subgraphNode)
      outputNode = net.addNode(s.library.getComponent('Forward').id)
      compareNode = net.addNode(compare)
      net.connect inputNode, 0, subgraphNode, 0
      net.connectSubgraph false, subgraphNode, 0, innerNode, 0
      #in
      net.connectSubgraph true, subgraphNode, 0, innerNode, 0
      #ou
      net.connect innerNode, 0, outputNode, 0
      net.connect outputNode, 0, compareNode, 0
      i = 0
      while i < messages.length
        net.sendMessage inputNode, 0, messages[i]
        i++
      deadline = (new Date).getTime() + 1 * 1000
      # ms
      net.start()
      while compare.expectingMore()
        net.runTick()
        if (new Date).getTime() > deadline
          chai.expect(compare.actual.length).to.equal compare.expected.length, 'Did not get expected packages within deadline'
          break
      chai.expect(compare.actual.length).to.equal messages.length
      chai.expect(compare.actual).to.equal compare.expected
      return
    return
  describe 'Uploading a graph via commandstream', ->
    it 'gives one response per command', (finish) ->
      s = new microflo.simulator.RuntimeSimulator build
      s.library.addComponent 'Forward', {}, 'Forward.hpp'
      graph = fbp.parse('a(Forward) OUT -> IN b(Forward) OUT -> IN c(Forward)')
      cmdstream = microflo.commandstream.cmdStreamFromGraph(s.library, graph)
      expectedResponses = 10
      actualResponses = 0
      # TODO: API should allow to get callback when everything is completed

      handleFunc = ->
        if arguments[0] == 'ERROR'
          return finish new Error arguments[1]
        if arguments[0] != 'IOCHANGE'
          actualResponses++
        if arguments[0] == 'NETSTART'
          chai.expect(actualResponses).to.equal expectedResponses
          finish()
        return

      s.start()
      s.device.on 'response', handleFunc
      s.device.open ->
        s.uploadGraph graph, ->
          s.device.close ->
            return
