/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var util = require('./util');
if (util.isBrowser()) {
    var EventEmitter = require('emitter');
} else {
    var addon = undefined;
    try {
        addon = require("../build/Release/MicroFloCc.node");
    } catch (err) {
        console.log("Warning: could not load addon: ", err);
    }

    var EventEmitter = require('events').EventEmitter;
    var fbp = require("fbp");
    var fs = require("fs");
}

var commandstream = require("./commandstream");
var runtime = require("./runtime");
var componentLib = new (require("./componentlib").ComponentLibrary)

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

function JsTransport(network) {
    var self = this;
    EventEmitter.call(this);

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
util.inherits(JsTransport, EventEmitter);

// TODO: allow to take snapshots of current state, compare new state.
// TODO: keep history of value changes, allow to query
// Useful to assure that program has no unintended side-effects
function JsIO() {
    var self = this;
    EventEmitter.call(this);

    this.numberOfPins = 50;
    this.backend = new addon.IO();
    this.state = {
        // inputs
        digitalInputs: [],
        analogInputs: [],
        currentTimeMs: 0,
        // outputs
        digitalOutputs: [],
        analogOutputs: []
    }


    this.waitForChange = function(callback) {
        this.waitForChangeCallback = callback;
    }

    this.getValue = function() {
        var type = arguments[0];
        //console.log("getValue", arguments, type);

        if (type === "digitalInputs" || type === "analogInputs") {
            var pin = arguments[1];
            return self.state[type][pin];
        } else if (type === "currentTimeMs") {
            return self.state[type];
        } else {
            throw "JsIO: unknown value requested";
        }
    }
    this.setValue = function() {
        //console.log("setValue", arguments);
        var type = arguments[0];
        if (type === "digitalOutputs" || "analogOutputs") {
            var pin = arguments[1];
            var value = arguments[2];
            self.state[type][pin] = value;
        } else {
            throw "JsIO: tried to set unknown value";
        }

        if (self.waitForChangeCallback) {
            self.waitForChangeCallback()
            self.waitForChangeCallback = undefined;
        }
    }

    this.backend.on("getValue", this.getValue);
    this.backend.on("setValue", this.setValue);

    var initState = function() {
        for (var i=0; i<self.numberOfPins; i++) {
            self.state.digitalInputs.push(false);
            self.state.analogInputs.push(0);

            self.state.digitalOutputs.push(false);
            self.state.analogOutputs.push(0);
        }
    }
    initState();
}
util.inherits(JsIO, EventEmitter);


var checkStarted = function(callback) {
    return function() {
        var type = arguments[0];
        if (type === "NETSTART") {
            callback();
        } else if (type === "DEBUG") {
            var level = arguments[1];
            if (level <= commandstream.format.debugLevels.Error.id) {
                throw new Error("MicroFlo runtime error: " + arguments[2]);
            }
        } else {
            // console.log(arguments)
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

    this.io = new JsIO();
    this.network = new addon.Network(this.io.backend);
    this.transport = new JsTransport(this.network);

    this.uploadGraph = function(graph, callback) {
        upload(this, graph, callback);
    }
    this.uploadFBP = function(prog, callback) {
        this.uploadGraph(fbp.parse(prog), callback);
    }
    this.uploadFile = function(path, callback) {
        fs.readFile(path, {encoding: "utf-8"}, function (err, contents) {
            if (err) {
                throw err;
            }
            self.uploadFBP(contents, callback);
        });
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
util.inherits(RuntimeSimulator, EventEmitter);

module.exports = {
    JsTransport: JsTransport,
    createCompare: createCompare,
    RuntimeSimulator: RuntimeSimulator
}
