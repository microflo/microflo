/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var assert = require("assert")
var microflo = require("../lib/microflo");
var addon = undefined;
try {
    addon = require("../build/Release/MicroFloCc.node");
} catch (err) {
    console.log("Warning: could not load addon: ", err);
}
var componentLib = new microflo.componentlib.ComponentLibrary(require("../microflo/components.json"), "./microflo")

var createCompare = function(expected) {
    var compare = new addon.Component();
    compare.expected = expected
    compare.actual = []
    compare.expectingMore = function() {
        return compare.actual.length == 0 || (compare.actual.length < compare.expected.length);
    }
    compare.on("process", function(packet, port) {
        //console.log("process", packet, port);
        if (port >= 0) {
            compare.actual.push(packet.value);
        }
    });
    return compare;
}

describe('Network', function(){
  describe('sending packets into graph of Forward components', function(){
    it('should give the same packets out on other side', function(){

        var compare = createCompare()

        // Host runtime impl.
        var net = new addon.Network();
        var nodes = 7;
        var messages = [];
        for (var i=0; i<10; i++) {
            messages[i] = i;
        }

        for (i=0; i<nodes; i++) {
            net.addNode(componentLib.getComponent("Forward").id);
        }

        for (i=0; i<nodes-1; i++) {
            net.connect(i, 0, i+1, 0);
        }

        compare.expected = messages;
        net.connect(nodes-1, 0, net.addNode(compare), 0);
        for (i=0; i<messages.length; i++) {
            net.sendMessage(0, 0, messages[i]);
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
})


describe('Network', function(){
  describe('sending packets through subgraph', function(){
    it('should give the same packets out on other side', function(){

        var messages = [0,1,2,3];
        var compare = createCompare(messages);

        var net = new addon.Network();
        var inputNode = net.addNode(componentLib.getComponent("Forward").id);
        var subgraphNode = net.addNode(componentLib.getComponent("SubGraph").id);
        var innerNode = net.addNode(componentLib.getComponent("Forward").id, subgraphNode);
        var outputNode = net.addNode(componentLib.getComponent("Forward").id);
        var compareNode = net.addNode(compare);

        console.log("subgraphNode: ", subgraphNode);
        console.log("subgraphNode: ", subgraphNode);
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
})
