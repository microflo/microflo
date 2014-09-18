/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2014 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */


// TODO: implement avrdude-like flasher for Arduino
// http://jeelabs.org/2013/03/27/avrdude-in-coffeescript/

var util = require("./util");
if (util.isBrowser()) {
    // Requires Chrome APIs and permissions
    if ('chrome' in window && 'serial' in window.chrome) {
      var serial = window.chrome.serial;
    }
} else {
    var serialport = require("serialport");
}

var isLikelyArduinoSerial = function (e) {
    return e.comName.indexOf("usbserial") !== -1 || e.comName.indexOf("usbmodem") !== -1
}

var guessSerialPort = function(wantedPortName, callback) {
    serialport.list(function (err, ports) {
        if (err) {
            callback(err);
            return;
        } else {
            if (ports.length === 0) {
                callback("No serial port found", undefined, undefined);
                return;
            }

            var p = undefined;
            ports.forEach(function(port) {
                if (wantedPortName && wantedPortName !== "auto"
                        && wantedPortName === port.comName) {
                    p = port.comName;
                }
            });
            if (p) {
                callback(err, p, ports);
                return;
            } else if (wantedPortName && wantedPortName !== "auto") {
                console.log("WARN: unable to find serial port: ", wantedPortName);
            }

            var preferred = ports.filter(isLikelyArduinoSerial)
            p = preferred.length > 0 ? preferred[0].comName : ports[0].comName;
            callback(err, p, ports);
            return;
        }
    });
}


var getSerial = function(serialPortToUse, baudRate, cb) {
    console.log("Using serial baudrate with " + serialPortToUse, baudRate);
    var serial = undefined;
    guessSerialPort(serialPortToUse, function(err, portName, ports) {
        if (err) {
            console.log("No serial port found!: ", err);
            if (cb) {
                cb(err, undefined);
            }
        } else {
            ports = ports.map(function(item) { return item.comName; });
            console.log("Available serial ports: ", ports);
            console.log("Using serial port: " + portName);
            serial = new serialport.SerialPort(portName, {baudrate: baudRate}, false);
            serial.open(function() {
                if (cb) {
                    cb(undefined, serial)
                }
            });
            serial.getTransportType = function () { return "Serial"; }
        }
    });
    return function() { return serial };
}

var listChromeSerial = function(callback) {
    var f = function(ports) {
      var devices = []
      for (var i=0; i<ports.length; i++) {
        var port = ports[i];
        if (port.path.search("/dev/ttyS") !== -1) {
            continue;
        }
        devices.push(port.path);
      }
      return callback(devices);
    }
    chrome.serial.getDevices(f);
}

var listNodeSerial = function(callback) {
    throw new Error('listNodeSerial: Not implemented');
}

var getChromeSerial = function(serialPortToUse, baudRate, readyCallback) {

    // Hacky API compat with node-serialport subset that we use
    var transport = {};
    transport.connectionId = null;
    transport.listeners = { 'data': null };
    transport.write = function(data, callback) {
        //console.log("Trying to send: ", data);
        data = util.bufferToArrayBuffer(data);
        //console.log("Sending", util.arrayBufferToString(data));
        chrome.serial.send(transport.connectionId, data, function(sendinfo, error) {
            //console.log("Attempted send: ", sendinfo, error);
            if (typeof callback !== "undefined") {
                callback(error, sendinfo);
            }
        });
    }
    transport.removeAllListeners = function(event) {
        transport.listeners[event] = null;
    }
    transport.on = function(event, callback) {
        transport.listeners[event] = callback;
    }
    transport.emit = function(event, arg) {
        var cb = transport.listeners[event];
        if (cb) {
            cb(arg);
        }
    }
    transport.getTransportType = function () { return "Serial"; }

    var onConnect = function(connectionInfo) {
        if (connectionInfo) {
            transport.connectionId = connectionInfo.connectionId;
            return readyCallback(null, transport);
        } else {
            var e = new Error("Could not connect to serialport");
            return readyCallback(e, null);
        }
    }

    var onReceiveCallback = function(info) {
        if (info.connectionId === connectionId && info.data) {
          var data = util.arrayBufferToBuffer(info.data);
          //console.log("received", data);
          transport.emit("data", data);
        }
    }
    chrome.serial.onReceive.addListener(onReceiveCallback);
    chrome.serial.connect(serialPortToUse, {'bitrate': baudRate}, onConnect);
    return function() { return transport };
};

var isSupported = function() {
    return (util.isBrowser() && 'chrome' in window && 'serial' in window.chrome) || !util.isBrowser();
}

if (util.isBrowser()) {
    module.exports.listDevices = listChromeSerial;
    module.exports.openTransport = getChromeSerial;
} else {
    module.exports.listDevices = listNodeSerial;
    module.exports.openTransport = getSerial;
}
module.exports.isSupported = isSupported;


