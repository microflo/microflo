/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var util = require('./util');
var Module = null;
if (util.isBrowser()) {
    var EventEmitter = require('emitter');
} else {
    var EventEmitter = require('events').EventEmitter;
    var fbp = require("fbp");
    var fs = require("fs");
    try {
        Module = require("../build/emscripten/microflo-runtime.js");
    } catch (err) {
        console.log("WARN: Unable to load Emscripen runtime");
    }
}

var commandstream = require("./commandstream");
var runtime = require("./runtime");
var componentLib = new (require("./componentlib").ComponentLibrary)

function Transport(runtime) {
    var self = this;
    EventEmitter.call(this);

    this.runtime = runtime;
    this.outbound_queue = [];

    this.getTransportType = function () { return "HostJavaScript"; }

    this.write = function (buffer, callback) {
        this.outbound_queue.push(buffer);
        if (callback)
            callback();
    }

    var onPull = function() {
        //console.log('pulling', self.outbound_queue.length);
        for (var i=0; i<self.outbound_queue.length; i++) {
            var buffer = self.outbound_queue[i];
            for (var j=0; j<buffer.length; j++) {
                var byte = buffer.readUInt8(j);
                Module['_emscripten_runtime_send'](self.runtime, byte);
            }
        }
        self.outbound_queue = [];
    };

   var onReceive = function () {
        //console.log("_receive", arguments.length);
        for (var i=0; i<arguments.length; i++) {
            self.emit("data", new Buffer([arguments[i]]));
        }
    };

    this.pullFuncPtr = Module.Runtime.addFunction(onPull);
    this.receiveFuncPtr = Module.Runtime.addFunction(onReceive);
    Module['_emscripten_runtime_setup'](this.runtime, this.receiveFuncPtr, this.pullFuncPtr);
}
util.inherits(Transport, EventEmitter);



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
    
    this.runtime = Module['_emscripten_runtime_new']();
    this.transport = new Transport(this.runtime);

    // Convenience. Not sim specific, should be moved somewhere general?
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
    this.runTick = function(tickIntervalMs) {
        tickIntervalMs |= 0;
        Module['_emscripten_runtime_run'](this.runtime, tickIntervalMs);
    }

    // Free-running mode
    this.start = function() {
        var intervalMs = 10;
        this.tickInterval = setInterval(function() {
            self.runTick(intervalMs);
        }, intervalMs);
    };
    this.stop = function() {
        clearInterval(this.tickInterval);
    };
}
util.inherits(RuntimeSimulator, EventEmitter);

module.exports = {
    Transport: Transport
}

if (Module) {
    module.exports.RuntimeSimulator = RuntimeSimulator
}
