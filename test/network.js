/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var microflo = require("../microflo");
var addon = require("../build/Release/MicroFlo.node");
var assert = require("assert")

describe('Network', function(){
  describe('sending packets into graph of Forward components', function(){
    it('should give the same packets out on other side', function(){
        var compare = new addon.Component();
        compare.expected = [0, 1, 2]
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

        // Host runtime impl.
        var net = new addon.Network();
        var componentLib = new microflo.ComponentLibrary(require("../microflo/components.json"));
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

        net.runSetup();
        while (compare.expectingMore()) {
            net.runTick();
        }
        assert.equal(compare.actual.length, 10);
        assert.deepEqual(compare.actual, compare.expected);
    })
  })
})

/*
    TODO: implement the following tests

    // Requires build flow programatically, able to subscribe to messages at an output
    Given a graph consisting of only Forward elements
    When I send data in to the first
     and let the runtime run
    Then I get exactly the same data out from the last

    // fridge app example. Requires hostIO JS impl introspectable,
    // requires ability to swap input component (ReadDallasTemperature) for a mock
    Given a fridge flow
     When the temperature goes below low threshold
     Then it switches off

    Given a fridge flow
     When the temperature goes above high threshold
     Then it switches on

    // Parser/builder test
    // Requires nicer API on JS command-generator
    Given flow with unknown component
     When trying to build
     Then get a nice error msg

    Given flow with components and unknown ports
     When trying to build
     Then get a nice error msg

     // Component test
     Given a graph with a Delimit component
      When I send in a single IP
      Then I get the IP
       and then the delimiter

     Given a graph with a Delimit component
      When I send a bracketed IP
      Then I get the packets for the entire bracketed IP
       and then the delimiter

     // Round-trip test
     // Requires JS api for graph
     Given a graph definition as .fbp
      When building into a command stream
       and load that as a graph
      Then the representation of loaded .fbp is same as loaded command stream

      // Command-stream format regression test
      Given an input graph definition
        and a reference command stream output
       When I load the graph
        and compare it to the reference output
       Then they are identical
  */
