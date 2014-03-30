/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var util = require("./util");
if (util.isBrowser()) {
    var http = window.http;
    var uuid = window.uuid;
} else {
    var http = require('http');
    var websocket = require('websocket');
    var url = require("url");
    var fbp = require("fbp");
    var fs = require("fs");
    var path = require("path");
    var uuid = require("node-uuid");
}

var flowhub = require("flowhub-registry");

var commandstream = require("./commandstream")
var generate = require("./generate")
var c = require("./componentlib");
var componentLib = new c.ComponentLibrary(c.defaultComponents, "./microflo");
var cmdFormat = require("./commandformat");
var serial = require("./serial");

var generateOutput = function(componentLib, inputFile, outputFile, target) {
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
        var data = commandstream.cmdStreamFromGraph(componentLib, def);
        fs.writeFile(outputBase + ".fbcs", data, function(err) {
            if (err) throw err;
        });
        fs.writeFile(outputBase + ".h", generate.cmdStreamToCDefinition(data, target), function(err) {
            if (err) throw err;
        });
        fs.writeFile(outputFile, generate.cmdStreamToCDefinition(data, target) + "\n"
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
    if (ws.src && ws.src.port) {
        return {
            src: { port: ws.src.port, process: ws.src.node },
            tgt: { port: ws.tgt.port, process: ws.tgt.node }
        }
    } else {
        // IIP
        var out = {}
        out.tgt = { port: ws.tgt.port, process: ws.tgt.node }
        if (ws.src) {
            out.data = ws.src.data
        }
        return out;
    }
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
        var lvl = cmdData.readUInt8(1);
        var point = nodeNameById(cmdFormat.debugPoints, cmdData.readUInt8(2))
        handler("DEBUG", lvl, point);
    } else if (cmd === cmdFormat.commands.PortSubscriptionChanged.id) {
        var node = nodeNameById(graph.nodeMap, cmdData.readUInt8(1))
        var port = componentLib.outputPortById(graph.processes[node].component, cmdData.readUInt8(2)).name
        var enable = cmdData.readUInt8(3) ? "true" : "false";
        handler("SUBSCRIBE", node, "->", port, enable);
    } else if (cmd === cmdFormat.commands.PacketSent.id) {
        var srcNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(1))
        var srcPort = componentLib.outputPortById(nodeLookup(graph, srcNode).component, cmdData.readUInt8(2)).name
        var targetNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(3))
        var targetPort = componentLib.inputPortById(nodeLookup(graph, targetNode).component, cmdData.readUInt8(4)).name
        var type = nodeNameById(cmdFormat.packetTypes, cmdData.readUInt8(5));
        var data = undefined;
        if (type == "Boolean") {
            data = cmdData.readUInt8(6) ? true: false;
        } else if (type == "Void") {
            data = null;
        } else if (type === "Integer" || type === "Float") {
            data = cmdData.readInt16LE(6);
        } else {
            console.log("Unknown data type in PacketSent: ", type);
        }

        handler("SEND", srcNode, srcPort, type, data, targetNode, targetPort);
    } else if (cmd === cmdFormat.commands.SubgraphPortConnected.id) {
        var direction = cmdData.readUInt8(1) ? "output" : "input";
        var portById = direction === "output" ? componentLib.outputPortById : componentLib.inputPortById
        var subgraphNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(2))
        var subgraphPort = portById(nodeLookup(graph, subgraphNode).component, cmdData.readUInt8(3)).name
        var childNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(4))
        var childPort = portById(nodeLookup(graph, childNode).component, cmdData.readUInt8(5)).name
        handler("SUBGRAPH-CONNECT", direction, subgraphNode, subgraphPort, childNode, childPort);
    } else {
        handler("UNKNOWN" + cmd.toString(16), cmdData.slice(0, 8));
    }
}

var uploadGraph = function(transport, data, graph, receiveHandler, onlyRegisterHandler) {

    var cmdSize = cmdFormat.commandSize;
    var buf = new commandstream.Buffer(cmdSize*100);
    var offset = 0;

    var onData = function(da) {
        // console.log("buf= ", buf.slice(0, offset));
        // console.log("data= ", da);
        da.copy(buf, offset, 0, da.length);
        offset += da.length;

        if (offset > buf.length) {
            console.log("ERROR: receive buffer overflow");
        }

        for (var startIdx=0; startIdx < Math.floor(offset/cmdSize)*cmdSize; startIdx+=cmdSize) {
            var b = buf.slice(startIdx, startIdx+cmdSize);
            // console.log("b= ", b);
            parseReceivedCmd(b, graph, receiveHandler ? receiveHandler : printReceived);
        }
        var slush = offset % cmdSize;
        buf.copy(buf, 0, offset-slush, offset);
        offset = slush;
    };

    transport.removeAllListeners("data");
    transport.on("data", onData);

    if (onlyRegisterHandler) {
        // HACK: because the onData handling is not resable outside
        return;
    }

    if (graph.uploadInProgress) {
        // avoid multiple uploads happening at same time
        // FIXME: should give user feedback on upload process
        console.log("WARN: Graph upload in progress, ignored second attempt");
        return;
    }

    graph.uploadInProgress = true;
    var initialWait = transport.getTransportType() === "HostJavaScript" ? 10 : 500;
    setTimeout(function() {
        // XXX: for some reason when writing without this delay,
        // the first bytes ends up corrupted on microcontroller side
        // FIXME: wait for response from one command before sending next
        // FIXME: remove delays
        var sendCmd = function(dataBuf, index) {
            transport.write(dataBuf.slice(index, index+cmdSize), function() {
                //console.log("wrote", dataBuf.slice(index, index+cmdSize));
                //console.log("wrote graph");
                if (index < dataBuf.length) {
                    if (transport.getTransportType() === "HostJavaScript") {
                        sendCmd(dataBuf, index+=cmdSize);
                    } else {
                        setTimeout(function() {
                            sendCmd(dataBuf, index+=cmdSize);
                        }, 100);
                    }
                } else {
                    graph.uploadInProgress = false;
                }
           });
        }

        sendCmd(data, 0);
     }, initialWait);
}

var listComponents = function(connection) {
    for (var name in componentLib.getComponents()) {
        var comp = componentLib.getComponent(name);

        // TODO: also allow to send icon definitions
        var resp = {protocol: "component", command: "component",
            payload: {name: name, description: comp.description || "",
                inPorts: portDefAsArray(componentLib.inputPortsFor(name)),
                outPorts: portDefAsArray(componentLib.outputPortsFor(name))
            }
        };
        connection.send(resp);
    }
}

var handleComponentCommand = function(command, payload, connection) {
    if (command == "list") {
        listComponents(connection);
    } else {
        console.log("Unknown NoFlo UI command on 'component' protocol:", comand, payload);
    }
}

var handleGraphCommand = function(command, payload, connection, graph) {
    if (command == "clear") {
        graph.processes = {};
        graph.connections = [];
    } else if (command == "addnode") {
        graph.processes[payload.id] = payload;
    } else if (command == "removenode") {
        delete graph.processes[payload.id];
    } else if (command == "addedge") {
        graph.connections.push(wsConnectionFormatToFbp(payload));
    } else if (command == "removeedge") {
        graph.connections = connectionsWithoutEdge(graph.connections, wsConnectionFormatToFbp(payload));
    } else if (command == "addinitial") {
        graph.connections.push(wsConnectionFormatToFbp(payload));
    } else if (command == "removeinitial") {
        graph.connections = connectionsWithoutEdge(graph.connections, wsConnectionFormatToFbp(payload));
    } else {
        console.log("Unknown NoFlo UI command on protocol 'graph':", command, payload);
    }
}

var handleNetworkStartStop = function (graph, connection, transport, debugLevel) {

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
            connection.send(msg);

        } else if (args[0] == "NETSTOP") {
            var m = {protocol: "network", command: "stopped"};
            connection.send(m);
        } else if (args[0] == "NETSTART") {
            var m = {protocol: "network", command: "started"};
            connection.send(m);
        } else {
            var string = args.join(", ");
            string = string.replace(/\n$/, '');
            var msg = {protocol: 'network', command: 'output', payload: {message: string}};
            connection.send(msg);
        }
    }

    var data = commandstream.cmdStreamFromGraph(componentLib, graph, debugLevel);
    uploadGraph(transport, data, graph, wsSendOutput);

}

var handleNetworkEdges = function (graph, connection, transport, edges) {

    // Loop over all edges, unsubscribe
    graph.connections.forEach(function(edge) {
        if (edge.src) {
            var srcId = graph.nodeMap[edge.src.process].id;
            var srcComp = graph.processes[edge.src.process].component;
            var srcPort = componentLib.outputPort(srcComp, edge.src.port).id;
            var buffer = new commandstream.Buffer(16);
            commandstream.writeString(buffer, 0, cmdFormat.magicString);
            commandstream.writeCmd(buffer, 8, cmdFormat.commands.SubscribeToPort.id, srcId, srcPort, 0);
            transport.write(buffer);
        }
    });

    // Subscribe to enabled edges
    edges.forEach(function (edge) {
        var srcId = graph.nodeMap[edge.src.process].id;
        var srcComp = graph.processes[edge.src.process].component;
        var srcPort = componentLib.outputPort(srcComp, edge.src.port).id;
        var buffer = new commandstream.Buffer(16);
        commandstream.writeString(buffer, 0, cmdFormat.magicString);
        commandstream.writeCmd(buffer, 8, cmdFormat.commands.SubscribeToPort.id, srcId, srcPort, 1);
        transport.write(buffer);
    });
}

var handleNetworkCommand = function(command, payload, connection, graph, transport, debugLevel) {
    if (command == "start" || command == "stop") {
        // TODO: handle stop command separately, actually pause the graph
        handleNetworkStartStop(graph, connection, transport, debugLevel)
    } else if (command == "edges"){
        // FIXME: should not need to use transport directly here
        handleNetworkEdges(graph, connection, transport, payload.edges)
    } else {
        console.log("Unknown NoFlo UI command on protocol 'network':", command, payload);
    }
}

var handleMessage = function (contents, connection, graph, getTransport, debugLevel) {
    console.log(contents.protocol, contents.command, contents.payload);

    var transport = getTransport();

    if (contents.protocol == "component") {
        handleComponentCommand(contents.command, contents.payload, connection);
    } else if (contents.protocol == "graph") {
        handleGraphCommand(contents.command, contents.payload, connection,
                                graph);
    } else if (contents.protocol == "network") {
        handleNetworkCommand(contents.command, contents.payload, connection,
                                graph, transport, debugLevel);
    } else {
        console.log("Unknown NoFlo UI protocol:", contents);
    }
};



var createFlowhubRuntime = function(user, ip, port, label, id, apihost) {

    // Unique identifier of the runtime instance
    id = id || uuid.v4();
    label = label || "MicroFlo"

    var rtinfo = {
        label: label,
        id: id,
        user: user,
        protocol: 'websocket',
        type: 'microflo',
        // Secret string for simple auth
        secret: '19osdf3034s'
    };

    if (ip !== 'auto') {
        rtinfo.address =  'ws://'+ip+':'+port;
    } else {
        rtinfo.address = 'auto'
    }

    var regoptions = {};
    if (typeof apihost !== 'undefined') {
        regoptions.host = apihost;
    }

    var rt = new flowhub.Runtime(rtinfo, regoptions);
    return rt;
}

var setupFlowhubRuntimePing = function(rt) {
    var rtPingInterval = setInterval(function () {
        rt.ping(function(err) {
            if (err) {
                console.log("Warning: failed to ping Flowhub registry");
                // TODO: handle more sanely
            }
        });
    }, 5 * 60 * 1000);
    return rtPingInterval;
}

var registerFlowhubRuntime = function(rt, callback) {
    rt.register(callback);
}


var setupRuntime = function(serialPortToUse, baudRate, port, debugLevel, ip) {

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

    // FIXME: nasty and racy, should pass callback and only then continue
    var getSerial = serial.openTransport(serialPortToUse, baudRate);

    var graph = {};
    wsServer.on('request', function (request) {
        var connection = request.accept('noflo', request.origin);
        connection.on('message', function (message) {
            if (message.type == 'utf8') {
              try {
                var contents = JSON.parse(message.utf8Data);
              } catch (e) {
                  console.log("WS parser error: ", e);
                  return;
              }
              // Only expose a narrow API for communicating back to UI
              var sendFunc = function(response) { connection.sendUTF(JSON.stringify(response)) };
              var conn = { send: sendFunc };
              handleMessage(contents, conn, graph, getSerial, debugLevel);
            }
        });
    });

    httpServer.listen(port, ip, function (err) {
      if (err) {
        error(err);
      }

      console.log("MicroFlo runtime listening at", ip+":"+port);
    });
}


var setupRuntimeChrome = function(serialPortToUse, baudRate, port, debugLevel, ip) {
    if (!(http.Server && http.WebSocketServer)) {
        throw new Error("Cannot load Chrome HTTP/WebSockets API");
    }
    // Listen for HTTP connections.
    var server = new http.Server();
    var wsServer = new http.WebSocketServer(server);
    server.listen(port);

    console.log("WebSocket server running on: ", port);

    // FIXME: nasty and racy, should pass callback and only then continue
    var getSerial = serial.openTransport(serialPortToUse, baudRate);
    var graph = {};

    server.addEventListener('request', function(req) {
        console.log("Got request: ", req);
        var url = req.headers.url;
        if (url == '/') {
            url = '/index.html';
        }
        // Serve the pages of this chrome application.
        req.serveUrl(url);
        return true;
    });

    wsServer.addEventListener('request', function(req) {
        console.log('Client connected');
        var socket = req.accept();

        socket.addEventListener('message', function(e) {
            console.log("message:", e.data);
            var contents = JSON.parse(e.data);
            // Method to communicate back
            var sendFunc = function(response) {
                socket.send(JSON.stringify(response));
            };
            var conn = { send: sendFunc };

            try {
                handleMessage(contents, conn, graph, getSerial, debugLevel);
            } catch (e) {
                console.log(e.stack);
                console.log(e);
            }
        });

        socket.addEventListener('close', function() {
          console.log('Client disconnected');
        });
    });

}

var uploadGraphFromFile = function(graphPath, serialPortName, baudRate, debugLevel) {

    serial.openTransport(serialPortName, baudRate, function (err, transport) {
        loadFile(graphPath, function(err, graph) {
            var data = commandstream.cmdStreamFromGraph(componentLib, graph, debugLevel);
            uploadGraph(transport, data, graph);
        });
    });
}

module.exports = {
    loadFile: loadFile,
    generateOutput: generateOutput,
    setupRuntime: setupRuntime,
    uploadGraphFromFile: uploadGraphFromFile,
    uploadGraph: uploadGraph,
    createFlowhubRuntime: createFlowhubRuntime,
    registerFlowhubRuntime: registerFlowhubRuntime,
}
if (util.isBrowser()) {
    module.exports.setupRuntime = setupRuntimeChrome;
}

