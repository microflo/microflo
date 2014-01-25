/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2014 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var serialport = require("serialport");

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


var getSerial = function(serialPortToUse, cb) {
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
            serial = new serialport.SerialPort(portName, {baudrate: 9600}, false);
            serial.open(function() {
                if (cb) {
                    cb(undefined, serial)
                }
            });
        }
    });
    return function() { return serial };
}


module.exports.openTransport = getSerial
