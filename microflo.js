var noflo = require("noflo");
var fbp = require("fbp");
var fs = require("fs");
var path = require("path");

var cmdFormat = require("./microflo/commandformat.json");
var componentDefs = require("./microflo/components.json");

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

var lookupOutputPortId = function(componentName, portName) {
    var portsDef = componentDefs.components[componentName].outPorts || componentDefs.defaultOutPorts;
    return portsDef[portName].id;
}

var lookupInputPortId = function(componentName, portName) {
    var portsDef = componentDefs.components[componentName].inPorts || componentDefs.defaultInPorts;
    return portsDef[portName].id;
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
var cmdStreamFromGraph = function(graph) {
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
        var componentId = componentDefs.components[process.component].id;
        index += writeCmd(buffer, index, cmdFormat.commands.CreateComponent.id, componentId);
        nodeMap[nodeName] = currentNodeId++;
    }

    // Connect nodes
    graph.connections.forEach(function(connection) {
        if (connection.src !== undefined) {
            var srcNode = connection.src.process;
            var tgtNode = connection.tgt.process;
            var srcPort = lookupOutputPortId(graph.processes[srcNode].component, connection.src.port);
            var tgtPort = lookupInputPortId(graph.processes[tgtNode].component, connection.tgt.port);
            index += writeCmd(buffer, index, cmdFormat.commands.ConnectNodes.id, nodeMap[srcNode], nodeMap[tgtNode], srcPort, tgtPort);
        }
    });

    // Send IIPs
    graph.connections.forEach(function(connection) {
        if (connection.data !== undefined) {
            var tgtNode = connection.tgt.process;
            var tgtPort = lookupInputPortId(graph.processes[tgtNode].component, connection.tgt.port);
            index += writeCmd(buffer, index, dataLiteralToCommand(connection.data, nodeMap[tgtNode], tgtPort));
        }
    });

    buffer = buffer.slice(0, index);
    return buffer;
}

var cmdStreamToCDefinition = function(cmdStream, annotation) {
    var hostCode = "#ifdef HOST_BUILD\n";
    hostCode += cmdStreamToC(cmdStream);
    hostCode += "\n#endif\n"

    var arduinoCode = "#ifdef ARDUINO\n#include <avr/pgmspace.h>\n";
    arduinoCode += cmdStreamToC(cmdStream, "PROGMEM");
    arduinoCode += "\n#endif\n"
    return hostCode + arduinoCode;
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

    var cCode = "const unsigned char " + variableName + "[] " + annotation + " = {" + values.join(",") + "};"
    return cCode;
}


var generateOutput = function(inputFile, outputFile) {
    var outputBase = outputFile.replace(path.extname(outputFile), "")
    var outputDir = path.dirname(outputBase);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // TODO: Use noflo.graph.loadFile() instead
    fs.readFile(inputFile, {encoding: "utf8"}, function(err, data) {
        if (err) throw err;

        var def;
        if (path.extname(inputFile) == ".fbp") {
            def = fbp.parse(data);
        } else {
            def = JSON.parse(data);
        }

        // TODO: allow to generate just one of these
        fs.writeFile(outputBase + ".json", JSON.stringify(def), function(err) {
            if (err) throw err;
        });
        var data = cmdStreamFromGraph(def);
        fs.writeFile(outputBase + ".fbcs", data, function(err) {
            if (err) throw err;
        });
        fs.writeFile(outputBase + ".h", cmdStreamToCDefinition(data), function(err) {
            if (err) throw err;
        });
        fs.writeFile(outputBase + ".cpp", cmdStreamToCDefinition(data) + "\n" + '#include "microflo.hpp"', function(err) {
            if (err) throw err;
        });
        fs.writeFile(outputBase + ".ino", cmdStreamToCDefinition(data) + '\n#include "microflo.hpp"', function(err) {
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

var generateComponentPortDefinitions = function(components) {
    var out = "\n";
    for (var name in components) {
        if (!components.hasOwnProperty(name)) {
            continue;
        }
        out += "\n" + "namespace " + name + "Ports {\n";
        out += "struct InPorts {\n"
        out += generateEnum("Ports", "", components[name].inPorts || componentDefs.defaultInPorts);
        out += "};\n"

        out += "struct OutPorts {\n"
        out += generateEnum("Ports", "", components[name].outPorts || componentDefs.defaultOutPorts);
        out += "};"
        out += "\n}\n";
    }
    return out;
}

var generateComponentFactory = function(components) {
    var out = "Component *Component::create(ComponentId id) {"
    var indent = "\n    ";
    out += indent + "Component *c;";
    out += indent + "switch (id) {";
    for (var name in components) {
        if (!components.hasOwnProperty(name)) {
            continue;
        }
        out += indent + "case Id" + name + ": c = new " + name + "; c->componentId=id; return c;"
    }
    out += indent + "default: return NULL;"
    out += indent + "}"
    out += "}"
    return out;
}

// Main
var cmd = process.argv[2];
if (cmd == "generate") {
    var inputFile = process.argv[3];
    var outputFile = process.argv[4] || inputFile
    generateOutput(inputFile, outputFile);
} else if (cmd == "update-defs") {
    fs.writeFile("microflo/components-gen.h", generateEnum("ComponentId", "Id", componentDefs.components),
                 function(err) { if (err) throw err });
    fs.writeFile("microflo/components-gen-bottom.hpp", generateComponentFactory(componentDefs.components),
                 function(err) { if (err) throw err });
    fs.writeFile("microflo/components-gen-top.hpp", generateComponentPortDefinitions(componentDefs.components),
                 function(err) { if (err) throw err });
    fs.writeFile("microflo/commandformat-gen.h", generateEnum("GraphCmd", "GraphCmd", cmdFormat.commands) +
                 "\n" + generateEnum("Msg", "Msg", cmdFormat.packetTypes),
                 function(err) { if (err) throw err });
} else {
    throw "Invalid commandline arguments. Usage: node microflo.js generate INPUT [OUTPUT]"
}


