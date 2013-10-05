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
} else {
    var noflo = require("noflo");
    var fbp = require("fbp");
}

var cmdFormat = require("./microflo/commandformat.json");
var componentLib = undefined;

function ComponentLibrary(definition) {
    this.definition = definition;

    this.listComponents = function() {
        return this.definition.components;
    }
    this.getComponent = function(componentName) {
        return this.definition.components[componentName];
    }
    this.getComponentById = function(componentId) {
        for (name in this.listComponents()) {
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
var cmdStreamFromGraph = function(componentLib, graph) {
    var buffer = new Buffer(1024); // FIXME: unhardcode
    var index = 0;
    var nodeMap = {}; // nodeName->numericNodeId

    // Header
    index += writeString(buffer, index, cmdFormat.magicString);
    index += writeCmd(buffer, index, cmdFormat.commands.Reset.id);

    // Create components
    var currentNodeId = 0;
    for (var nodeName in graph.processes) {
        if (!graph.processes.hasOwnProperty(nodeName)) {
            continue;
        }
        var process = graph.processes[nodeName];
        var componentId = componentLib.getComponent(process.component).id;
        index += writeCmd(buffer, index, cmdFormat.commands.CreateComponent.id, componentId);
        nodeMap[nodeName] = currentNodeId++;
    }

    // Connect nodes
    graph.connections.forEach(function(connection) {
        if (connection.src !== undefined) {
            var srcNode = connection.src.process;
            var tgtNode = connection.tgt.process;
            var srcPort = componentLib.outputPort(graph.processes[srcNode].component, connection.src.port).id;
            var tgtPort = componentLib.inputPort(graph.processes[tgtNode].component, connection.tgt.port).id;
            index += writeCmd(buffer, index, cmdFormat.commands.ConnectNodes.id, nodeMap[srcNode], nodeMap[tgtNode], srcPort, tgtPort);
        }
    });

    // Send IIPs
    graph.connections.forEach(function(connection) {
        if (connection.data !== undefined) {
            var tgtNode = connection.tgt.process;
            var tgtPort = componentLib.inputPort(graph.processes[tgtNode].component, connection.tgt.port).id;
            index += writeCmd(buffer, index, dataLiteralToCommand(connection.data, nodeMap[tgtNode], tgtPort));
        }
    });

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
        fs.writeFile(outputBase + ".cpp", cmdStreamToCDefinition(data) + "\n"
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
    for (var name in componentLib.listComponents()) {
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
    for (var name in componentLib.listComponents()) {
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

// Main
var cmd = process.argv[2];
if (cmd == "generate") {
    addon = require("./build/Release/MicroFlo.node");
    fbp = require("fbp");
    noflo = require("noflo");

    var inputFile = process.argv[3];
    var outputFile = process.argv[4] || inputFile
    generateOutput(componentLib, inputFile, outputFile);
} else if (cmd == "update-defs") {
    fs.writeFile("microflo/components-gen.h", generateEnum("ComponentId", "Id", componentLib.listComponents()),
                 function(err) { if (err) throw err });
    fs.writeFile("microflo/components-gen-bottom.hpp", generateComponentFactory(componentLib),
                 function(err) { if (err) throw err });
    fs.writeFile("microflo/components-gen-top.hpp", generateComponentPortDefinitions(componentLib),
                 function(err) { if (err) throw err });
    fs.writeFile("microflo/commandformat-gen.h", generateEnum("GraphCmd", "GraphCmd", cmdFormat.commands) +
                 "\n" + generateEnum("Msg", "Msg", cmdFormat.packetTypes),
                 function(err) { if (err) throw err });
} else if (cmd == "runtime") {
    var http = require('http');
    var websocket = require('websocket');

       var httpServer = http.createServer();
       var wsServer = new websocket.server({
         httpServer: httpServer
       });

      var handleMessage = function (message, connection) {
        if (message.type == 'utf8') {
          try {
            var contents = JSON.parse(message.utf8Data);
          } catch (e) {
            return;
          }
          console.log(contents.protocol, contents.command, contents.payload);
          if (contents.protocol == "component" && contents.command == "list") {

              for (var name in componentLib.listComponents()) {
                  var comp = componentLib.getComponent(name);
                  var resp = {protocol: "component", command: "component",
                      payload: {name: name, description: comp.description || "",
                          inPorts: portDefAsArray(componentLib.inputPortsFor(name)),
                          outPorts: portDefAsArray(componentLib.outputPortsFor(name))
                      }
                  };
                  connection.sendUTF(JSON.stringify(resp));
              }


          }
        }
      };

      wsServer.on('request', function (request) {
        var connection = request.accept('noflo', request.origin);
        connection.on('message', function (message) {
          handleMessage(message, connection);
        });
      });
    var port = 3569;
    httpServer.listen(port, function (err) {
      if (err) {
        error(err);
      }

      console.log("MicroFlo runtime listening at WebSocket port " + port);
    });

} else if (cmd == "debug") {
    var serialport = require("serialport");

    serialport.list(function (err, ports) {
      ports.forEach(function(port) {
        console.log(port.comName);
        console.log(port.pnpId);
        console.log(port.manufacturer);
      });
    });
    var buf = "";
    var parseSerial = function(graph, data) {
        buf += data;
        //process.stdout.write(buf);
        var lines = buf.split("\r\n");
        for (var i=0; i<lines.length-1; i++) {
            var line = lines[i];
            // TEMP: use binary commandstream protocol instead

            var nodeNameById = function(nodeId) {
                for (name in graph.nodeMap) {
                    var id = graph.nodeMap[name];
                    if (id == nodeId) {
                        return name;
                    }
                }
            }
            var portNameFor = function(nodeId, portId, inputOrOutput) {
                var nodeName = nodeNameById(nodeId);
                var componentName = graph.processes[nodeName].component;
                if (inputOrOutput == "input") {
                    return componentLib.inputPortById(componentName, portId).name;
                } else {
                    return componentLib.outputPortById(componentName, portId).name;
                }
            }

            var tokens = "";
            if (line.indexOf("ADD: ") == 0) {
                line = line.replace("ADD: ", "");
                tokens = line.split(",");
                var componentId = parseInt(tokens[0]);
                var nodeId = parseInt(tokens[1]);
                var c = componentLib.getComponentById(componentId);
                console.log("CREATED: " + nodeNameById(nodeId) + "(" + c.name + ")");
            } else if (line.indexOf("CONNECT: ") == 0) {
                line = line.replace("CONNECT: ", "");
                tokens = line.split(",");
                var srcNodeId = parseInt(tokens[0]);
                var srcPortId = parseInt(tokens[1]);
                var targetNodeId = parseInt(tokens[2]);
                var targetPortId = parseInt(tokens[3]);
                console.log("CONNECTED:",
                            nodeNameById(srcNodeId),
                            portNameFor(srcNodeId, srcPortId), "->",
                            portNameFor(targetNodeId, targetPortId, "input"),
                            nodeNameById(targetNodeId)
                );
            } else if (line.indexOf("SEND: ") == 0) {
                line = line.replace("SEND: ", "");
                tokens = line.split(",");
                srcNodeId = parseInt(tokens[1]);
                srcPortId = parseInt(tokens[2]);
                targetNodeId = parseInt(tokens[3]);
                targetPortId = parseInt(tokens[4]);
                var message = tokens[5]; // TODO: decode
                console.log("SENT:",
                            nodeNameById(srcNodeId),
                            portNameFor(srcNodeId, srcPortId), "-> " + message + " ->",
                            portNameFor(targetNodeId, targetPortId, "input"),
                            nodeNameById(targetNodeId)
                );
            } else if (line.indexOf("DELIVER: ") == 0) {

            }
        }
        buf = lines[lines.length-1];
    }
    // FIXME: automatically detect correct port, allow to override
    var serial = new serialport.SerialPort("/dev/ttyUSB1", {baudrate: 9600}, false);
    loadFile(process.argv[3], function(err, graph) {
        // XXX: exploits the sideeffect that the nodeId->nodeName mappping is created
        cmdStreamFromGraph(componentLib, graph);

        serial.open(function(){
            console.log("opened")
            serial.on("data", function(data) {
                parseSerial(graph, data);
            });
        });
    });

} else if (cmd == "simulator") {
    // Host runtime impl.
    fbp = require("fbp");
    noflo = require("noflo");
    var addon = require("./build/Release/MicroFlo.node");
    var io = undefined; // new addon.IO()
    var net = new addon.Network(io);
    loadFile("./examples/monitorPin.fbp", function(err, graph) {
        var stream = cmdStreamFromGraph(componentLib, graph);
        var endpoint = new addon.GraphStreamer(net);
        for (var i=0; i<stream.length; i++) {
            var b = stream.readUInt8(i);
            endpoint.parseByte(b);
        }
        var comp = new addon.Component();
        comp.on("process", function(packet, port) {
            console.log(packet, port);
        });
        net.addNode(comp);

        console.log("Running MicroFlo network in host");
        net.runSetup();
        setInterval(function () { net.runTick(); }, 100);
    });

} else if (require.main === module) {
    throw "Invalid commandline arguments. Usage: node microflo.js generate INPUT [OUTPUT]"
}

module.exports = {
    loadFile: loadFile,
    ComponentLibrary: ComponentLibrary,
    componentLib: componentLib,
    cmdStreamFromGraph: cmdStreamFromGraph,
    generateOutput: generateOutput
}
