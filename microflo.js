/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var fs = require("fs");
var path = require("path");

// Will not be built/available when generating definitions
if (require.main === module) {
    var addon = undefined;
    var noflo = undefined;
    var fbp = undefined;
    var serialport = undefined;
} else {
    var noflo = require("noflo");
    var fbp = require("fbp");
    var serialport = require("serialport");
}

var cmdFormat = require("./microflo/commandformat.json");
var componentLib = undefined;

function ComponentLibrary(definition) {
    this.definition = definition;

    this.listComponents = function(includingSkipped) {
        return Object.keys(this.getComponents(includingSkipped));
    }

    this.getComponents = function(includingSkipped) {
        if (includingSkipped) {
            return this.definition.components;
        }

        var components = {};
        for (var name in this.definition.components) {
            var comp = componentLib.getComponent(name);
            if (!(comp[".skip"] || false)) {
                components[name] = comp;
            }
        }
        return components;
    }
    this.getComponent = function(componentName) {
        return this.definition.components[componentName];
    }
    this.getComponentById = function(componentId) {
        for (name in this.getComponents()) {
            var comp = this.getComponent(name);
            if (comp.id == componentId) {
                comp.name = name;
                return comp;
            }
        }
    }

    this.outputPortsFor = function(componentName) {
        return this.getComponent(componentName).outPorts || this.definition.defaultOutPorts;
    }
    this.inputPortsFor = function(componentName) {
        return this.getComponent(componentName).inPorts || this.definition.defaultInPorts;
    }

    this.inputPort = function(componentName, portName) {
        return this.inputPortsFor(componentName)[portName];
    }
    this.inputPortById = function(componentName, portId) {
        var ports = this.inputPortsFor(componentName);
        for (name in ports) {
            var port = ports[name];
            if (port.id == portId) {
                port.name = name;
                return port;
            }
        }
    }

    this.outputPort = function(componentName, portName) {
        return this.outputPortsFor(componentName)[portName];
    }
    this.outputPortById = function(componentName, portId) {
        var ports = this.outputPortsFor(componentName);
        for (name in ports) {
            var port = ports[name];
            if (port.id == portId) {
                port.name = name;
                return port;
            }
        }
    }
}

componentLib = new ComponentLibrary(require("./microflo/components.json"));

var writeCmd = function() {
    var buf = arguments[0];
    var offset = arguments[1];
    var data = arguments[2];
    if (data.hasOwnProperty("length")) {
        // Buffer
        data.copy(buf, offset);
        return data.length;
    } else {
        data = Array.prototype.slice.call(arguments, 2);
    }

    for (var i = 0; i < cmdFormat.commandSize; i++) {
        if (i < data.length) {
            buf.writeUInt8(data[i], offset+i);
        } else {
            buf.writeUInt8(0, offset+i);
        }
    }
    return cmdFormat.commandSize;
}

var writeString = function(buf, offset, string) {
    for (var i = 0; i < string.length ; i++) {
        buf[offset+i] = string.charCodeAt(i);
    }
    return string.length;
}

var dataLiteralToCommand = function(literal, tgt, tgtPort) {
    literal = literal.replace("^\"|\"$", "");

    // Integer
    var value = parseInt(literal);
    if (typeof value === 'number' && value % 1 == 0) {
        var b = new Buffer(cmdFormat.commandSize);
        b.fill(0);
        b.writeUInt8(cmdFormat.commands.SendPacket.id, 0);
        b.writeUInt8(tgt, 1);
        b.writeUInt8(tgtPort, 2);
        b.writeInt8(cmdFormat.packetTypes.Integer.id, 3);
        b.writeInt32LE(value, 4);
        return b;
    }

    // Boolean
    var isBool = literal === "true" || literal === "false";
    value = literal === "true";
    if (isBool) {
        var b = new Buffer(cmdFormat.commandSize);
        b.fill(0);
        b.writeUInt8(cmdFormat.commands.SendPacket.id, 0);
        b.writeUInt8(tgt, 1);
        b.writeUInt8(tgtPort, 2);
        b.writeInt8(cmdFormat.packetTypes.Boolean.id, 3);
        b.writeInt8(value ? 1 : 0, 4);
        return b;
    }

    try {
        value = JSON.parse(literal);
    } catch(err) {
        throw "Unknown IIP data type for literal '" + literal + "' :" + err;
    }

    // Array of bytes
    if (true) {
        var b = new Buffer(cmdFormat.commandSize*(value.length+2));
        var offset = 0;
        b.fill(0, offset, offset+cmdFormat.commandSize);
        b.writeUInt8(cmdFormat.commands.SendPacket.id, offset+0);
        b.writeUInt8(tgt, offset+1);
        b.writeUInt8(tgtPort, offset+2);
        b.writeInt8(cmdFormat.packetTypes.BracketStart.id, offset+3)
        offset += cmdFormat.commandSize;

        for (var i=0; i<value.length; i++) {
            b.fill(0, offset, offset+cmdFormat.commandSize);
            b.writeUInt8(cmdFormat.commands.SendPacket.id, offset+0);
            b.writeUInt8(tgt, offset+1);
            b.writeUInt8(tgtPort, offset+2);
            b.writeInt8(cmdFormat.packetTypes.Byte.id, offset+3)
            var v = parseInt(value[i]);
            b.writeUInt8(v, offset+4);
            offset += cmdFormat.commandSize;
        }
        b.fill(0, offset, offset+cmdFormat.commandSize);
        b.writeUInt8(cmdFormat.commands.SendPacket.id, offset+0);
        b.writeUInt8(tgt, offset+1);
        b.writeUInt8(tgtPort, offset+2);
        b.writeInt8(cmdFormat.packetTypes.BracketEnd.id, offset+3)
        offset += cmdFormat.commandSize;
        return b;
    }
    throw "Unknown IIP data type for literal '" + literal + "'";
    // TODO: handle floats, strings
}

// TODO: actually add observers to graph, and emit a command stream for the changes
var cmdStreamFromGraph = function(componentLib, graph, debugLevel) {
    debugLevel = debugLevel || "Error";
    var buffer = new Buffer(1024); // FIXME: unhardcode
    var index = 0;
    var nodeMap = {}; // nodeName->numericNodeId

    // Header
    index += writeString(buffer, index, cmdFormat.magicString);
    index += writeCmd(buffer, index, cmdFormat.commands.Reset.id);

    // Config
    index += writeCmd(buffer, index, cmdFormat.commands.ConfigureDebug.id,
                      cmdFormat.debugLevels[debugLevel].id);

    // Create components
    var currentNodeId = 0;
    for (var nodeName in graph.processes) {
        if (!graph.processes.hasOwnProperty(nodeName)) {
            continue;
        }
        var process = graph.processes[nodeName];
        var componentId = componentLib.getComponent(process.component).id;
        index += writeCmd(buffer, index, cmdFormat.commands.CreateComponent.id,
                          componentId);
        nodeMap[nodeName] = currentNodeId++;
    }

    // Connect nodes
    graph.connections.forEach(function(connection) {
        if (connection.src !== undefined) {
            var srcNode = connection.src.process;
            var tgtNode = connection.tgt.process;
            var srcPort = undefined;
            var tgtPort = undefined;
            try {
                srcPort = componentLib.outputPort(graph.processes[srcNode].component,
                                                  connection.src.port).id;
                tgtPort = componentLib.inputPort(graph.processes[tgtNode].component,
                                                 connection.tgt.port).id;
            } catch (err) {
                throw "Could not connect: " + srcNode + " " + connection.src.port +
                        " -> " + connection.tgt.port + " "+ tgtNode;
            }

            if (tgtPort !== undefined && srcPort !== undefined) {
                index += writeCmd(buffer, index, cmdFormat.commands.ConnectNodes.id,
                                  nodeMap[srcNode], nodeMap[tgtNode], srcPort, tgtPort);
            }
        }
    });

    // Send IIPs
    graph.connections.forEach(function(connection) {
        if (connection.data !== undefined) {
            var tgtNode = connection.tgt.process;
            var tgtPort = undefined;
            try {
                tgtPort = componentLib.inputPort(graph.processes[tgtNode].component, connection.tgt.port).id;
            } catch (err) {
                throw "Could not attach IIP: '" + connection.data.toString() + "' -> "
                        + tgtPort + " " + tgtNode;
            }

            index += writeCmd(buffer, index, dataLiteralToCommand(connection.data, nodeMap[tgtNode], tgtPort));
        }
    });

    // HACK: can be used to observe data flowing along edges
    // index += writeCmd(buffer, index, cmdFormat.commands.SubscribeToPort.id, 1, 1, 1);

    // Mark end of commands
    index += writeCmd(buffer, index, cmdFormat.commands.End.id);

    // Attach the mapping so others can use it later
    graph.nodeMap = nodeMap;

    buffer = buffer.slice(0, index);
    return buffer;
}

var cmdStreamToCDefinition = function(cmdStream, annotation) {
    var arduinoCode = "#ifdef ARDUINO\n#include <avr/pgmspace.h>\n";
    arduinoCode += "#endif\n"

    arduinoCode += cmdStreamToC(cmdStream, "PROGMEM");

    return arduinoCode;
}

var cmdStreamToC = function(cmdStream, annotation) {
    if (!annotation) {
        annotation = ""
    }

    var variableName = "graph";
    var values = [];
    for (var i=0; i<cmdStream.length; i++) {
        values[i] = "0x" + cmdStream.readUInt8(i).toString(16);
    }

    values = values.join(",");
    var prettyValues = "";
    var commas = 0;
    for (var i=0; i<values.length; i++) {
        if (values[i] === ",") {
            commas += 1;
        }
        prettyValues = prettyValues.concat(values[i]);
        if (commas && (commas % cmdFormat.commandSize) == 0) {
            prettyValues = prettyValues.concat("\n")
            commas = 0;
        }
    }

    var cCode = "const unsigned char " + variableName + "[] " + annotation + " = {\n" + prettyValues + "\n};"
    return cCode;
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
        data = cmdStreamFromGraph(componentLib, def);
        fs.writeFile(outputBase + ".fbcs", data, function(err) {
            if (err) throw err;
        });
        fs.writeFile(outputBase + ".h", cmdStreamToCDefinition(data), function(err) {
            if (err) throw err;
        });
        fs.writeFile(outputFile, cmdStreamToCDefinition(data) + "\n"
                     + "#define MICROFLO_EMBED_GRAPH\n"
                     + '#include "microflo.h"' + '\n#include "main.hpp"',
                     function(err) {
            if (err) throw err;
        });

    });

}

var generateEnum = function(name, prefix, enums) {
    if (Object.keys(enums).length === 0) {
        return ""
    }
    var indent = "\n    ";

    var out = "enum " + name + " {";
    var a = [];
    for (var e in enums) {
        if (!enums.hasOwnProperty(e)) {
            continue;
        }
        a.push((indent + prefix + e + ((enums[e].id !== undefined) ? " = " + enums[e].id : "")));
    }
    out += a.join(",");
    out += "\n};\n";

    return out;
}

var generateComponentPortDefinitions = function(componentLib) {
    var out = "\n";
    for (var name in componentLib.getComponents()) {
        out += "\n" + "namespace " + name + "Ports {\n";
        out += "struct InPorts {\n"
        out += generateEnum("Ports", "", componentLib.inputPortsFor(name));
        out += "};\n"

        out += "struct OutPorts {\n"
        out += generateEnum("Ports", "", componentLib.outputPortsFor(name));
        out += "};"
        out += "\n}\n";
    }
    return out;
}

var generateComponentFactory = function(componentLib) {
    var out = "Component *Component::create(ComponentId id) {"
    var indent = "\n    ";
    out += indent + "Component *c;";
    out += indent + "switch (id) {";
    for (var name in componentLib.getComponents()) {
        out += indent + "case Id" + name + ": c = new " + name + "; c->componentId=id; return c;"
    }
    out += indent + "default: return NULL;"
    out += indent + "}"
    out += "}"
    return out;
}

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
    if (ws.from.port) {
        return {
            src: { port: ws.from.port, process: ws.from.node },
            tgt: { port: ws.to.port, process: ws.to.node }
        }
    } else {
        // IIP
        return {
            data: ws.from.data,
            tgt: { port: ws.to.port, process: ws.to.node }
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

var parseReceivedCmd = function(cmdData, graph) {
    var cmd = cmdData.readUInt8(0);
    if (cmd == cmdFormat.commands.NetworkStopped.id) {
        console.log("Network stopped");
    } else if (cmd == cmdFormat.commands.NetworkStarted.id) {
        console.log("Network started");
    } else if (cmd == cmdFormat.commands.NodeAdded.id) {
        var component = componentLib.getComponentById(cmdData.readUInt8(1)).name
        var nodeName = nodeNameById(graph.nodeMap, cmdData.readUInt8(2))
        console.log("ADD: ", nodeName, "(", component, ")");
    } else if (cmd == cmdFormat.commands.NodesConnected.id) {
        var srcNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(1))
        var srcPort = componentLib.outputPortById(graph.processes[srcNode].component, cmdData.readUInt8(2)).name
        var targetNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(3))
        var targetPort = componentLib.inputPortById(graph.processes[targetNode].component, cmdData.readUInt8(4)).name
        console.log("CONNECT: ", srcNode, srcPort, "->", targetNode, targetPort);
    } else if (cmd === cmdFormat.commands.DebugChanged.id) {
        var level = nodeNameById(cmdFormat.debugLevels, cmdData.readUInt8(1));
        console.log("DEBUGLEVEL: ", level);
    } else if (cmd === cmdFormat.commands.DebugMessage.id) {
        var point = nodeNameById(cmdFormat.debugPoints, cmdData.readUInt8(1))
        console.log("DEBUG: ", point);
    } else if (cmd === cmdFormat.commands.PortSubscriptionChanged.id) {
        var node = nodeNameById(graph.nodeMap, cmdData.readUInt8(1))
        var port = componentLib.outputPortById(graph.processes[node].component, cmdData.readUInt8(2)).name
        var enable = cmdData.readUInt8(3) ? "true" : "false";
        console.log("SUBSCRIBE: ", node, "->", port, enable);
    } else if (cmd === cmdFormat.commands.PacketSent.id) {
        var srcNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(1))
        var srcPort = componentLib.outputPortById(graph.processes[srcNode].component, cmdData.readUInt8(2)).name
        var targetNode = nodeNameById(graph.nodeMap, cmdData.readUInt8(3))
        var targetPort = componentLib.inputPortById(graph.processes[targetNode].component, cmdData.readUInt8(4)).name
        var type = nodeNameById(cmdFormat.packetTypes, cmdData.readUInt8(5));
        var data = "unknown";
        if (type == "Boolean") {
            data = cmdData.readUInt8(6) ? "true": "false";
        }
        console.log("SEND: ", srcNode, srcPort, "->", "(", type, ":", data, ")", "->", targetNode, targetPort);
    } else {
        console.log("Unknown command: " + cmd.toString(16), cmdData.slice(0, 8));
    }
}

var uploadGraph = function(serial, data, graph, callback) {

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
            parseReceivedCmd(b, graph);
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
    if (contents.protocol == "component" && contents.command == "list") {

        for (var name in componentLib.getComponents()) {
            var comp = componentLib.getComponent(name);

            var resp = {protocol: "component", command: "component",
                payload: {name: name, description: comp.description || "",
                    inPorts: portDefAsArray(componentLib.inputPortsFor(name)),
                    outPorts: portDefAsArray(componentLib.outputPortsFor(name))
                }
            };
            connection.sendUTF(JSON.stringify(resp));
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
        }
    } else if (contents.protocol == "network") {
        if (contents.command == "start") {
            var data = cmdStreamFromGraph(componentLib, graph, debugLevel);
            uploadGraph(getSerial(), data, graph);
        }
    } else {
        console.log("Unknown WS message:", contents);
    }
  }
};

var updateDefinitions = function() {
    fs.writeFile("microflo/components-gen.h", generateEnum("ComponentId", "Id", componentLib.getComponents(true)),
                 function(err) { if (err) throw err });
    fs.writeFile("microflo/components-gen-bottom.hpp", generateComponentFactory(componentLib),
                 function(err) { if (err) throw err });
    fs.writeFile("microflo/components-gen-top.hpp", generateComponentPortDefinitions(componentLib),
                 function(err) { if (err) throw err });
    fs.writeFile("microflo/commandformat-gen.h",
                 generateEnum("GraphCmd", "GraphCmd", cmdFormat.commands) +
                 "\n" + generateEnum("Msg", "Msg", cmdFormat.packetTypes) +
                 "\n" + generateEnum("DebugLevel", "DebugLevel", cmdFormat.debugLevels) +
                 "\n" + generateEnum("DebugId", "Debug", cmdFormat.debugPoints),
                 function(err) { if (err) throw err });
}

var setupRuntime = function(env) {
    var http = require('http');
    var websocket = require('websocket');
    var url = require("url");

    var serialPortToUse = env.parent.serial || "auto";
    var port = env.parent.port || 3569;
    var debugLevel = env.parent.debug || "Error";
    var ip = env.parent.ip || "127.0.0.1"

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

var uploadGraphCommand = function(graphPath, env) {
    var serialPortName = env.parent.serial || "auto";
    var debugLevel = env.parent.debug

    guessSerialPort(serialPortName, function(err, portName) {
        if (err) {
            throw err;
        }
        console.log("Using serial port: " + portName);
        var serial = new serialport.SerialPort(portName, {baudrate: 9600}, false);
        loadFile(graphPath, function(err, graph) {
            var data = cmdStreamFromGraph(componentLib, graph, debugLevel);
            serial.open(function() {
                uploadGraph(serial, data, graph);
            });
        });
    });
}

var generateFwCommand = function(env) {
    var inputFile = process.argv[3];
    var outputFile = process.argv[4] || inputFile.replace(path.extname(inputFile), "");
    generateOutput(componentLib, inputFile, outputFile);
}

// Main
if (require.main === module) {

    if (process.argv[2] == "update-defs") {
        // Special, runs before dependencies has been installed and thus
        // cannot import any of them.
        updateDefinitions();
        return;
    }

    var commander = require("commander");
    var pkginfo = require('pkginfo')(module);
    fbp = require("fbp");
    noflo = require("noflo");
    serialport = require("serialport");

    commander
        .version(module.exports.version)
        .option('-s, --serial <PORT>', 'which serial port to use')
        .option('-d, --debug <LEVEL>', 'set debug level')
        .option('-p, --port <PORT>', 'which port to use for WebSocket')
        .option('-i, --ip <IP>', 'which IP to use for WebSocket')

    commander
        .command('generate')
        .description('Generate MicroFlo firmware code, with embedded graph.')
        .action(generateFwCommand);

    commander
        .command('upload')
        .description('Upload a new graph to a device running MicroFlo firmware')
        .action(uploadGraphCommand);

    commander
        .command('runtime')
        .description('Run as a server, for use with the NoFlo UI.')
        .action(setupRuntime)

    commander.parse(process.argv)
    if (process.argv.length <= 2) {
        commander.help()
    }

} else {

    module.exports = {
        loadFile: loadFile,
        ComponentLibrary: ComponentLibrary,
        componentLib: componentLib,
        cmdStreamFromGraph: cmdStreamFromGraph,
        generateOutput: generateOutput,
        setupRuntime: setupRuntime
    }
}
