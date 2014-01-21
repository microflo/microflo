/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var http = require('http');
var websocket = require('websocket');
var url = require("url");
var fbp = require("fbp");
var fs = require("fs");
var path = require("path");
var serialport = require("serialport");

var commandstream = require("./commandstream")
var generate = require("./generate")
var componentLib = new (require("./componentlib")).ComponentLibrary(require("../microflo/components.json"), "./microflo")
var cmdFormat = require("../microflo/commandformat.json");

var findPort = function(componentLib, graph, nodeName, portName) {
    var isOutput = false;
    var port = componentLib.inputPort(graph.processes[nodeName].component, portName);
    if (!port) {
        port =  componentLib.outputPort(graph.processes[nodeName].component, portName);
        isOutput = true;
    }
    return { isOutput: isOutput, port: port};
}



var generateOutput = function(componentLib, inputFile, outputFile) {
    var outputBase = outputFile.replace(path.extname(outputFile), "")
    if (!path.extname(outputFile)) {
        outputFile = outputFile + ".pde";
    }
    var outputDir = path.dirname(outputBase);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    loadFile(inputFile, function(err, def) {
        if (err) throw err;

        // TODO: allow to generate just one of these
        fs.writeFile(outputBase + ".json", JSON.stringify(def), function(err) {
            if (err) throw err;
        });
        data = commandstream.cmdStreamFromGraph(componentLib, def);
        fs.writeFile(outputBase + ".fbcs", data, function(err) {
            if (err) throw err;
        });
        fs.writeFile(outputBase + ".h", generate.cmdStreamToCDefinition(data), function(err) {
            if (err) throw err;
        });
        fs.writeFile(outputFile, generate.cmdStreamToCDefinition(data) + "\n"
                     + "#define MICROFLO_EMBED_GRAPH\n"
                     + '#include "microflo.h"' + '\n#include "main.hpp"',
                     function(err) {
            if (err) throw err;
        });

    });

}

// TODO: Use noflo.graph.loadFile() instead?
var loadFile = function(filename, callback) {
    fs.readFile(filename, {encoding: "utf8"}, function(err, data) {
        if (err) callback(err);

        var def;
        if (path.extname(filename) == ".fbp") {
            def = fbp.parse(data);
        } else {
            def = JSON.parse(data);
        }
        callback(undefined, def);
    });
}



// TODO: allow port types to be declared in component metadata,
// and send the appropriate types instead of just "all"
// https://github.com/noflo/noflo/issues/51
var portDefAsArray = function(port) {
    var a = [];
    for (var name in port) {
        a.push({id: name, type: "all"});
    }
    return a;
}

var connectionsWithoutEdge = function(connections, findConn) {
    var newList = [];
    connections.forEach(function(conn) {
        if (conn.src && JSON.stringify(conn.src) === JSON.stringify(findConn.src)
                     && JSON.stringify(conn.tgt) === JSON.stringify(findConn.tgt)) {
        } else if (conn.data && JSON.stringify(conn.tgt) === JSON.stringify(findConn.tgt)) {
            // IIP
        } else {
            newList.push(conn);
        }
    });
    return newList;
}

var wsConnectionFormatToFbp = function(ws) {
    if (ws.src.port) {
        return {
            src: { port: ws.src.port, process: ws.src.node },
            tgt: { port: ws.tgt.port, process: ws.tgt.node }
        }
    } else {
        // IIP
        return {
            data: ws.src.data,
            tgt: { port: ws.tgt.port, process: ws.tgt.node }
        }
    }
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

var nodeNameById = function(nodeMap, wantedId) {
    for (name in nodeMap) {
        var id = nodeMap[name].id !== undefined ? nodeMap[name].id : nodeMap[name];
        if (id === wantedId) {
            return name;
        }
    }
}

var nodeLookup = function(graph, nodeName) {
    var parent = graph.nodeMap[nodeName].parent;
    var r = parent !== undefined ? graph.processes[nodeNameById(graph.nodeMap, parent)].graph.processes: graph.processes;
    return r[nodeName];
}

var printReceived = function() {
    var args = [];
    for (var i=0; i<arguments.length; i++) {
        args.push(arguments[i]);
    }
    console.log(args.join(", "));
}

var parseReceivedCmd = function(cmdData, graph, handler) {
    var cmd = cmdData.readUInt8(0);
    if (cmd == cmdFormat.commands.NetworkStopped.id) {
        handler("NETSTOP");
    } else if (cmd == cmdFormat.commands.NetworkStarted.id) {
        handler("NETSTART");
    } else if (cmd == cmdFormat.commands.NodeAdded.id) {
        var component = componentLib.getComponentById(cmdData.readUInt8(1)).name
        var nodeName = nodeNameById(graph.nodeMap, cmdData.readUInt8(2))
        handler("ADD", nodeName, "(", component, ")");
    } else if (cmd == cmdFormat.commands.NodesConnected.id) {
        var srcNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(1))
        var srcPort = componentLib.outputPortById(nodeLookup(graph, srcNode).component, cmdData.readUInt8(2)).name
        var targetNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(3))
        var targetPort = componentLib.inputPortById(nodeLookup(graph,targetNode).component, cmdData.readUInt8(4)).name
        handler("CONNECT", srcNode, srcPort, "->", targetPort, targetNode);
    } else if (cmd === cmdFormat.commands.DebugChanged.id) {
        var level = nodeNameById(cmdFormat.debugLevels, cmdData.readUInt8(1));
        handler("DEBUGLEVEL", level);
    } else if (cmd === cmdFormat.commands.DebugMessage.id) {
        var point = nodeNameById(cmdFormat.debugPoints, cmdData.readUInt8(1))
        handler("DEBUG", point);
    } else if (cmd === cmdFormat.commands.PortSubscriptionChanged.id) {
        var node = nodeNameById(graph.nodeMap, cmdData.readUInt8(1))
        var port = componentLib.outputPortById(graph.processes[node].component, cmdData.readUInt8(2)).name
        var enable = cmdData.readUInt8(3) ? "true" : "false";
        handler("SUBSCRIBE", node, "->", port, enable);
    } else if (cmd === cmdFormat.commands.PacketSent.id) {
        var srcNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(1))
        var srcPort = componentLib.outputPortById(graph.processes[srcNode].component, cmdData.readUInt8(2)).name
        var targetNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(3))
        var targetPort = componentLib.inputPortById(graph.processes[targetNode].component, cmdData.readUInt8(4)).name
        var type = nodeNameById(cmdFormat.packetTypes, cmdData.readUInt8(5));
        var data = undefined;
        if (type == "Boolean") {
            data = cmdData.readUInt8(6) ? true: false;
        } else if (type == "Void") {
            data = null;
        }
        handler("SEND", srcNode, srcPort, type, data, targetNode, targetPort);
    } else {
        handler("UNKNOWN" + cmd.toString(16), cmdData.slice(0, 8));
    }
}

var uploadGraph = function(serial, data, graph, receiveHandler) {

    var cmdSize = cmdFormat.commandSize;
    var buf = new Buffer(cmdSize*10);
    var offset = 0;

    var onSerialData = function(da) {
        // console.log("buf= ", buf.slice(0, offset));
        // console.log("data= ", da);
        da.copy(buf, offset, 0, da.length);
        offset += da.length;

        for (var startIdx=0; startIdx < Math.floor(offset/cmdSize)*cmdSize; startIdx+=cmdSize) {
            var b = buf.slice(startIdx, startIdx+cmdSize);
            // console.log("b= ", b);
            parseReceivedCmd(b, graph, receiveHandler ? receiveHandler : printReceived);
        }
        var slush = offset % cmdSize;
        buf.copy(buf, 0, offset-slush, offset);
        offset = slush;
    };

    serial.removeAllListeners("data");
    serial.on("data", onSerialData);

    if (graph.uploadInProgress) {
        // avoid multiple uploads happening at same time
        // FIXME: should give user feedback on upload process
        console.log("WARN: Graph upload in progress, ignored second attempt");
        return;
    }

    graph.uploadInProgress = true;
    setTimeout(function() {
        // XXX: for some reason when writing without this delay,
        // the first bytes ends up corrupted on microcontroller side
        // FIXME: wait for response from one command before sending next
        var sendCmd = function(dataBuf, index) {
            serial.write(dataBuf.slice(index, index+cmdSize), function() {
                //console.log("wrote", dataBuf.slice(index, index+cmdSize));
                //console.log("wrote graph");
                if (index < dataBuf.length) {
                    setTimeout(function() {
                        sendCmd(dataBuf, index+=cmdSize);
                    }, 100);
                } else {
                    graph.uploadInProgress = false;
                }
           });
        }

        sendCmd(data, 0);
     }, 500);
}


var handleMessage = function (message, connection, graph, getSerial, debugLevel) {
  if (message.type == 'utf8') {
    try {
      var contents = JSON.parse(message.utf8Data);
    } catch (e) {
        console.log("WS parser error: ", e);
        return;
    }
    console.log(contents.protocol, contents.command, contents.payload);
    if (contents.protocol == "component") {

        if (contents.command == "list") {
            for (var name in componentLib.getComponents()) {
                var comp = componentLib.getComponent(name);

                // TODO: also allow to send icon definitions
                var resp = {protocol: "component", command: "component",
                    payload: {name: name, description: comp.description || "",
                        inPorts: portDefAsArray(componentLib.inputPortsFor(name)),
                        outPorts: portDefAsArray(componentLib.outputPortsFor(name))
                    }
                };
                connection.sendUTF(JSON.stringify(resp));
            }
        } else {
            console.log("Unknown WS command:", contents);
        }

    } else if (contents.protocol == "graph") {
        if (contents.command == "clear") {
            graph.processes = {};
            graph.connections = [];
        } else if (contents.command == "addnode") {
            graph.processes[contents.payload.id] = contents.payload;
        } else if (contents.command == "removenode") {
            delete graph.processes[contents.payload.id];
        } else if (contents.command == "addedge") {
            graph.connections.push(wsConnectionFormatToFbp(contents.payload));
        } else if (contents.command == "removeedge") {
            graph.connections = connectionsWithoutEdge(graph.connections, wsConnectionFormatToFbp(contents.payload));
        } else if (contents.command == "addinitial") {
            graph.connections.push(wsConnectionFormatToFbp(contents.payload));
        } else if (contents.command == "removeinitial") {
            graph.connections = connectionsWithoutEdge(graph.connections, wsConnectionFormatToFbp(contents.payload));
        } else {
            console.log("Unknown WS command:", contents);
        }
    } else if (contents.protocol == "network") {
        if (contents.command == "start" || contents.command == "stop") {
            // TODO: handle stop command separately, actually pause the graph

            // FIXME: also do error handling, and send that across
            // https://github.com/noflo/noflo-runtime-websocket/blob/master/runtime/network.js
            // TODO: handle start/stop messages, send this to the UI
            var wsSendOutput = function() {
                var args = [];
                for (var i=0; i<arguments.length; i++) {
                    args.push(arguments[i]);
                }
                if (args[0] == "SEND") {
                    var data = undefined;
                    if (args[3] == "Void") {
                        data = "!";
                    } else {
                        data = args[4];
                    }
                    var msg = {protocol: "network", command: "data", payload: {
                            src: {node: args[1], port: args[2]},
                            tgt: {node: args[5], port: args[6]},
                            data: data
                        }
                    }
                    connection.sendUTF(JSON.stringify(msg));

                } else if (args[0] == "NETSTOP") {
                    var m = {protocol: "network", command: "stopped"};
                    connection.sendUTF(JSON.stringify(m));
                } else if (args[0] == "NETSTART") {
                    var m = {protocol: "network", command: "started"};
                    connection.sendUTF(JSON.stringify(m));
                } else {
                    var string = args.join(", ");
                    string = string.replace(/\n$/, '');
                    var msg = {protocol: 'network', command: 'output', payload: {message: string}};
                    connection.sendUTF(JSON.stringify(msg));
                }
            }

            var data = commandstream.cmdStreamFromGraph(componentLib, graph, debugLevel);
            uploadGraph(getSerial(), data, graph, wsSendOutput);

        } else if (contents.command == "edges"){
            // FIXME: should not need to use serial directly here
            var serial = getSerial();
            var edges = contents.payload.edges;

            // FIXME: loop over all edges, unsubscribe

            // Subscribe to enabled edges
            edges.forEach(function (edge) {
                var buffer = new Buffer(16);
                var srcId = graph.nodeMap[edge.src.process].id;
                var srcComp = graph.processes[edge.src.process].component;
                var srcPort = componentLib.outputPort(srcComp, edge.src.port).id;
                commandstream.writeString(buffer, 0, cmdFormat.magicString);
                commandstream.writeCmd(buffer, 8, cmdFormat.commands.SubscribeToPort.id, srcId, srcPort, 1);
                serial.write(buffer);
            });
        } else {
            console.log("Unknown WS command:", contents);
        }
    } else {
        console.log("Unknown WS protocol:", contents);
    }
  }
};



var setupRuntime = function(serialPortToUse, port, debugLevel, ip) {

    var httpServer = http.createServer(function(request, response) {
        var path = url.parse(request.url).pathname
        if (path == "/") {
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write("NoFlo UI WebSocket API at: " + "ws://"+request.headers.host);
        } else {
            response.writeHead(404);
        }
        response.end();
    });
    var wsServer = new websocket.server({
         httpServer: httpServer
    });

    // FIXME: nasty and racy
    var serial = undefined;
    guessSerialPort(serialPortToUse, function(err, portName, ports) {
        if (err) {
            console.log("No serial port found!: ", err);
        } else {
            ports = ports.map(function(item) { return item.comName; });
            console.log("Available serial ports: ", ports);
            console.log("Using serial port: " + portName);
            serial = new serialport.SerialPort(portName, {baudrate: 9600}, false);
            serial.open(function() {

            });
        }
    });
    var getSerial = function() { return serial };

    var graph = {};
    wsServer.on('request', function (request) {
        var connection = request.accept('noflo', request.origin);
        connection.on('message', function (message) {
            handleMessage(message, connection, graph, getSerial, debugLevel);
        });
    });

    httpServer.listen(port, ip, function (err) {
      if (err) {
        error(err);
      }

      console.log("MicroFlo runtime listening at", ip+":"+port);
    });
}

var uploadGraphFromFile = function(graphPath, serialPortName, debugLevel) {

    guessSerialPort(serialPortName, function(err, portName) {
        if (err) {
            throw err;
        }
        console.log("Using serial port: " + portName);
        var serial = new serialport.SerialPort(portName, {baudrate: 9600}, false);
        loadFile(graphPath, function(err, graph) {
            var data = commandstream.cmdStreamFromGraph(componentLib, graph, debugLevel);
            serial.open(function() {
                uploadGraph(serial, data, graph);
            });
        });
    });

}

module.exports = {
    loadFile: loadFile,
    generateOutput: generateOutput,
    setupRuntime: setupRuntime,
    uploadGraphFromFile: uploadGraphFromFile,
}

