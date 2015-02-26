/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var util = require('./util');
if (util.isBrowser()) {
    var build = require("../build/emscripten/microflo-runtime.js");
    if (typeof window.Module !== 'undefined') {
        console.log("WARN: Unable to load Emscripen runtime using component.io: ");
        build = window.Module;
    }
} else {
    var fs = require("fs");
    try {
        var build = require("../build/emscripten/microflo-runtime.js");
    } catch (err) {
        console.log("WARN: Unable to load Emscripen runtime");
    }
}

var EventEmitter = util.EventEmitter;
var fbp = require("fbp");

var commandstream = require("./commandstream");
var devicecommunication = require("./devicecommunication");
var runtime = require("./runtime");
var ComponentLibrary = require("./componentlib").ComponentLibrary;

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
                build['_emscripten_runtime_send'](self.runtime, byte);
            }
        }
        self.outbound_queue = [];
    };

   var onReceive = function () {
        // console.log("_receive", arguments.length);
        for (var i=0; i<arguments.length; i++) {
            self.emit("data", new util.Buffer([arguments[i]]));
        }
    };

    this.pullFuncPtr = build.Runtime.addFunction(onPull);
    this.receiveFuncPtr = build.Runtime.addFunction(onReceive);
    build['_emscripten_runtime_setup'](this.runtime, this.receiveFuncPtr, this.pullFuncPtr);
}
util.inherits(Transport, EventEmitter);


function RuntimeSimulator() {
    var self = this;
    
    this.runtime = build['_emscripten_runtime_new']();
    this.transport = new Transport(this.runtime);
    this.graph = {};
    this.library = new ComponentLibrary();
    this.device = new devicecommunication.DeviceCommunication(this.transport, this.graph, this.library)
    this.io = new devicecommunication.RemoteIo(this.device);
    this.debugLevel = 'Error';

    this.conn = {}
    this.conn.send = function(response) {
        if (util.debug_protocol) {
            console.log('FBP MICROFLO SEND:', response);
        }
        self.emit('message', response);
    };
    this.handleMessage = function(msg) {
        if (util.debug_protocol) {
            console.log('FBP MICROFLO RECV:', msg);
        }
        runtime.handleMessage(this, msg);
    };
    this.device.on('response', function() {
        var args = []
        var i = 0
        while (i < arguments.length) {
            args.push(arguments[i]);
            i++;
        }
        runtime.deviceResponseToFbpProtocol(self, self.conn.send, args);
    });

    // Assumes comm is open
    this.uploadGraph = function(graph, callback) {
        this.graph = graph;
        this.device.graph = graph; // XXX: not so nice
        var checkUploadDone = function(m) {
            if (m.protocol === 'network' && m.command === 'started') {
                self.removeListener('message', checkUploadDone);
                return callback();
            }
        };
        self.on('message', checkUploadDone);
        self.handleMessage({"protocol": "network", "command": "start"});
    }
    this.uploadFBP = function(prog, callback) {
        this.uploadGraph(fbp.parse(prog), callback);
    }

    // Blocking iteration
    this.runTick = function(tickIntervalMs) {
        tickIntervalMs |= 0;
        build['_emscripten_runtime_run'](this.runtime, tickIntervalMs);
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
if (build) {
    module.exports.RuntimeSimulator = RuntimeSimulator
}
