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


function RuntimeSimulator() {
    var self = this;

    this.io = new addon.IO();
    this.network = new addon.Network(this.io);
    this.transport = new JsTransport(this.network);

    this.start = function() {
        this.tickInterval = setInterval(function() {
            self.network.runTick();
            self.transport.runTick();
        }, 10);
    };
    this.stop = function() {
        clearInterval(this.tickInterval);
    };
}

module.exports = {
    JsTransport: JsTransport,
    createCompare: createCompare,
    RuntimeSimulator: RuntimeSimulator
}
