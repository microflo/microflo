/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var util = require('./util');
var Module = null;
if (util.isBrowser()) {
    var EventEmitter = require('emitter');
    try {
        Module = require("../build/emscripten/microflo-runtime.js");
    } catch (err) {
        console.log("WARN: Unable to load Emscripen runtime using component.io: " + err);
        Module = window.Module;
    }
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
var devicecommunication = require("./devicecommunication");
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

    this.close = function (callback) {
        return callback(null);
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
        // console.log("_receive", arguments.length);
        for (var i=0; i<arguments.length; i++) {
            self.emit("data", new Buffer([arguments[i]]));
        }
    };

    this.pullFuncPtr = Module.Runtime.addFunction(onPull);
    this.receiveFuncPtr = Module.Runtime.addFunction(onReceive);
    Module['_emscripten_runtime_setup'](this.runtime, this.receiveFuncPtr, this.pullFuncPtr);
}
util.inherits(Transport, EventEmitter);


function RuntimeSimulator() {
    var self = this;
    
    this.runtime = Module['_emscripten_runtime_new']();
    this.transport = new Transport(this.runtime);
    this.graph = {};
    this.comm = new devicecommunication.DeviceCommunication(this.transport, this.graph, componentLib)
    this.io = new devicecommunication.RemoteIo(this.comm);

    // Assumes comm is open
    this.uploadGraph = function(graph, callback) {
        this.graph = graph;
        this.comm.graph = graph; // XXX: not so nice
        var cmdstream = commandstream.cmdStreamFromGraph(componentLib, this.graph);
        self.comm.sendCommands(cmdstream, function(err) {
            callback(err);
        });
    }
    this.uploadFBP = function(prog, callback) {
        this.uploadGraph(fbp.parse(prog), callback);
    }

    // Blocking iteration
    this.runTick = function(tickIntervalMs) {
        tickIntervalMs |= 0;
        Module['_emscripten_runtime_run'](this.runtime, tickIntervalMs);
    }

    // Free-running mode
    // timeFactor 1.0 = normal time, 0.0 = standstill
    this.start = function(timeFactor) {
        if (typeof timeFactor === 'undefined') {
            timeFactor = 1.0;
        }
        var intervalMs = 100;
        this.tickInterval = setInterval(function() {
            var t = intervalMs*timeFactor;
            self.runTick(t);
        }, intervalMs);
    };
    this.stop = function() {
        clearInterval(this.tickInterval);
    };
}
util.inherits(RuntimeSimulator, EventEmitter);

exports.Transport = Transport
if (Module) {
    module.exports.RuntimeSimulator = RuntimeSimulator
}
