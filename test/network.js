/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var assert = require("assert")
var microflo = require("../lib/microflo");

var componentLib = new microflo.componentlib.ComponentLibrary(require("../microflo/components.json"), "./microflo")
var fbp = require("fbp");

describe('Network', function(){
  describe('sending packets into graph of Forward components', function(){
    it('should give the same packets out on other side', function(){

        var compare = microflo.simulator.createCompare()

        // Host runtime impl.
        var s = new microflo.simulator.RuntimeSimulator();
        var net = s.network
        var nodes = 7;
        var messages = [];
        for (var i=0; i<10; i++) {
            messages[i] = i;
        }

        var firstNode = -1;
        for (i=0; i<nodes; i++) {
            var node = net.addNode(componentLib.getComponent("Forward").id);
            if (firstNode < 0) {
                firstNode = node;
            }
        }

        for (i=firstNode; i<nodes; i++) {
            net.connect(i, 0, i+1, 0);
        }

        compare.expected = messages;
        net.connect(nodes-1, 0, net.addNode(compare), 0);
        for (i=0; i<messages.length; i++) {
            net.sendMessage(1, 0, messages[i]);
        }

        var deadline = new Date().getTime() + 1*1000; // ms
        net.start();
        while (compare.expectingMore()) {
            net.runTick();
            if (new Date().getTime() > deadline) {
                assert.fail(compare.actual.length, compare.expected.length,
                            "Did not get expected packages within deadline");
                break;
            }
        }
        assert.equal(compare.actual.length, 10);
        assert.deepEqual(compare.actual, compare.expected);
    })
  })

  describe('sending packets through subgraph', function(){
    it('should give the same packets out on other side', function(){

        var messages = [0,1,2,3];
        var compare = microflo.simulator.createCompare(messages);

        var s = new microflo.simulator.RuntimeSimulator();
        var net = s.network
        var inputNode = net.addNode(componentLib.getComponent("Forward").id);
        var subgraphNode = net.addNode(componentLib.getComponent("SubGraph").id);
        var innerNode = net.addNode(componentLib.getComponent("Forward").id, subgraphNode);
        var outputNode = net.addNode(componentLib.getComponent("Forward").id);
        var compareNode = net.addNode(compare);

        net.connect(inputNode, 0, subgraphNode, 0);
        net.connectSubgraph(false, subgraphNode, 0, innerNode, 0); //in
        net.connectSubgraph(true, subgraphNode, 0, innerNode, 0);  //ou
        net.connect(innerNode, 0, outputNode, 0);
        net.connect(outputNode, 0, compareNode, 0);

        for (i=0; i<messages.length; i++) {
            net.sendMessage(inputNode, 0, messages[i]);
        }

        var deadline = new Date().getTime() + 1*1000; // ms
        net.start();
        while (compare.expectingMore()) {
            net.runTick();
            if (new Date().getTime() > deadline) {
                assert.fail(compare.actual.length, compare.expected.length,
                            "Did not get expected packages within deadline");
                break;
            }
        }
        assert.equal(compare.actual.length, messages.length);
        assert.deepEqual(compare.actual, compare.expected);
    })
  })
  describe('Uploading a graph via commandstream', function(){
    it('gives one response per command', function(finish){

        var s = new microflo.simulator.RuntimeSimulator();

        var graph = fbp.parse("a(Forward) OUT -> IN b(Forward) OUT -> IN c(Forward)");
        var cmdstream = microflo.commandstream.cmdStreamFromGraph(componentLib, graph);

        var expectedResponses = 8;
        var actualResponses = 0;
        // TODO: API should allow to get callback when everything is completed
        var handleFunc = function() {
            actualResponses++;
            if (arguments[0] === "NETSTART") {
                assert.equal(actualResponses, expectedResponses);
                finish();
            }
        }

        s.start();
        microflo.runtime.uploadGraph(s.transport, cmdstream, graph, handleFunc);
    })
  })
})
