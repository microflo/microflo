### MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license
###

chai = require('chai')
microflo = require('../lib/microflo')
if microflo.simulator.RuntimeSimulator
  describeIfHasSimulator = describe
else
  describeIfHasSimulator = describe.skip
fbp = require('fbp')

describeIfHasSimulator 'Network', ->
  describe.skip 'sending packets into graph of Forward components', ->
    it 'should give the same packets out on other side', ->
      componentLib = new (microflo.componentlib.ComponentLibrary)
      compare = microflo.simulator.createCompare()
      # Host runtime impl.
      s = new (microflo.simulator.RuntimeSimulator)
      net = s.network
      nodes = 7
      messages = []
      i = 0
      while i < 10
        messages[i] = i
        i++
      firstNode = -1
      i = 0
      while i < nodes
        node = net.addNode(componentLib.getComponent('Forward').id)
        if firstNode < 0
          firstNode = node
        i++
      i = firstNode
      while i < nodes
        net.connect i, 0, i + 1, 0
        i++
      compare.expected = messages
      net.connect nodes - 1, 0, net.addNode(compare), 0
      i = 0
      while i < messages.length
        net.sendMessage 1, 0, messages[i]
        i++
      deadline = (new Date).getTime() + 1 * 1000
      # ms
      net.start()
      while compare.expectingMore()
        net.runTick()
        if (new Date).getTime() > deadline
          chai.expect(compare.actual.length).to.equal compare.expected.length, 'Did not get expected packages within deadline'
          break
      chai.expect compare.actual.length, 10
      chai.expect(compare.actual).to.deep.equal compare.expected
      return
    return
  describe.skip 'sending packets through subgraph', ->
    it 'should give the same packets out on other side', ->
      messages = [
        0
        1
        2
        3
      ]
      compare = microflo.simulator.createCompare(messages)
      s = new (microflo.simulator.RuntimeSimulator)
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
      s = new (microflo.simulator.RuntimeSimulator)
      s.library.addComponent 'Forward', {}, 'Forward.hpp'
      graph = fbp.parse('a(Forward) OUT -> IN b(Forward) OUT -> IN c(Forward)')
      cmdstream = microflo.commandstream.cmdStreamFromGraph(s.library, graph)
      expectedResponses = 9
      actualResponses = 0
      # TODO: API should allow to get callback when everything is completed

      handleFunc = ->
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
