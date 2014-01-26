/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var addon = undefined;
try {
    addon = require("../build/Release/MicroFloCc.node");
} catch (err) {
    console.log("Warning: could not load addon: ", err);
}
var commandstream = require("./commandstream");
var runtime = require("./runtime");
var componentLib = new (require("./componentlib").ComponentLibrary)(require("../microflo/components.json"), "./microflo")

var fbp = require("fbp");

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

var util = require('util');
var events = require('events');

function JsTransport(network) {
    var self = this;
    events.EventEmitter.call(this);

    this.outbound_queue = [];
    this.write = function (buffer, callback) {
        //console.log("this.write", buffer);
        this.outbound_queue.push(buffer);
        if (callback)
            callback();
    }

    this.runTick = function() {
        self.hosttransport.runTick()
    }

    // XXX: this could instead be done at Network construct time?
    this.hosttransport = new addon.HostTransport();
    network.setTransport(this.hosttransport);

    this.hosttransport.on("_pull", function(j) {
        for (var i=0; i<self.outbound_queue.length; i++) {
            var buffer = self.outbound_queue[i];
            for (var j=0; j<buffer.length; j++) {
                var byte = buffer.readUInt8(j);
                self.hosttransport.send(byte);
            }
        }
        self.outbound_queue = [];
    });
    this.hosttransport.on("_receive", function (byte) {
        //console.log("_receive", byte);
        self.emit("data", new Buffer([byte]))
    });
    this.getTransportType = function () { return "HostJavaScript"; }
}
util.inherits(JsTransport, events.EventEmitter);


var checkStarted = function(callback) {
    return function() {
        if (arguments[0] === "NETSTART") {
            callback();
        }
    }
}

var upload = function (simulator, graph, callback) {
    var cmdstream = commandstream.cmdStreamFromGraph(componentLib, graph);
    runtime.uploadGraph(simulator.transport, cmdstream, graph, checkStarted(function () {
        callback();
    }));
}

function RuntimeSimulator() {
    var self = this;

    this.io = new addon.IO();
    this.network = new addon.Network(this.io);
    this.transport = new JsTransport(this.network);

    this.uploadGraph = function(graph, callback) {
        upload(this, graph, callback);
    }
    this.uploadFBP = function(prog, callback) {
        this.uploadGraph(fbp.parse(prog), callback);
    }

    // Blocking iteration
    this.runTick = function() {
        self.emit("beforeTick");
        self.transport.runTick();
        self.network.runTick();
        self.emit("afterTick");
    }

    // Free-running mode
    this.start = function() {
        this.tickInterval = setInterval(function() {
            self.runTick();
        }, 10);
    };
    this.stop = function() {
        clearInterval(this.tickInterval);
    };
}
util.inherits(RuntimeSimulator, events.EventEmitter);

module.exports = {
    JsTransport: JsTransport,
    createCompare: createCompare,
    RuntimeSimulator: RuntimeSimulator
}
