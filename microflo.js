var noflo = require("noflo");
var fbp = require("fbp");
var fs = require("fs");
var path = require("path");

var cmdFormat = require("./microflo/commandformat.json");
var components = require("./microflo/components.json");

var writeCmd = function() {
    var buf = arguments[0];
    var offset = arguments[1];
    var data = arguments[2];
    if (data.hasOwnProperty("length")) {
        // Buffer
        data.copy(buf, offset);
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
    var portsDef = components.components[componentName].outPorts || components.defaultOutPorts;
    return portsDef[portName].id;
}

var lookupInputPortId = function(componentName, portName) {
    var portsDef = components.components[componentName].inPorts || components.defaultInPorts;
    return portsDef[portName].id;
}

var dataLiteralToCommand = function(literal, tgt, tgtPort) {
    // FIXME: verify definition of data literals in NoFlo JSON/FBP format
    literal = literal.replace("^\"|\"$", "");
    var value = parseInt(literal);
    console.log(value);
    if (typeof value === 'number' && value % 1 == 0) {
        var b = new Buffer(cmdFormat.commandSize);
        b.fill(0);
        b.writeUInt8(cmdFormat.commands.SendPacket.id, 0);
        b.writeUInt8(tgt, 1);
        b.writeUInt8(tgtPort, 2);
        b.writeInt8(cmdFormat.packetTypes.Integer.id, 3);
        b.writeInt32LE(value, 4);
        return b;
    } else {
        throw "Unknown IIP data type";
       // TODO: handle other type of values
    }
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
        var componentId = components.components[process.component].id;
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

var cmdStreamToCDefinition = function(cmdStream) {

    var variableName = "graph";
    var values = [];
    for (var i=0; i<cmdStream.length; i++) {
        values[i] = "0x" + cmdStream.readUInt8(i).toString(16);
    }
    var cCode = "const unsigned char " + variableName + "[] = {" + values.join(",") + "};"
    return cCode;
}


var generateOutput = function(inputFile, outputFile) {
    var outputBase = outputFile.replace(path.extname(outputFile), "")
    var outputDir = path.dirname(outputBase);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // XXX: NoFlo tries to create instantiate the a network when creating a graph..
    // This prevents us from using just noflo.loadFile()
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
    fs.writeFile("microflo/components-gen.h", generateEnum("ComponentId", "Id", components.components),
                 function(err) { if (err) throw err });
    fs.writeFile("microflo/components-gen.hpp", generateComponentFactory(components.components),
                 function(err) { if (err) throw err });
    fs.writeFile("microflo/commandformat-gen.h", generateEnum("GraphCmd", "GraphCmd", cmdFormat.commands) +
                 "\n" + generateEnum("Msg", "Msg", cmdFormat.packetTypes),
                 function(err) { if (err) throw err });
} else {
    throw "Invalid commandline arguments. Usage: node microflo.js generate INPUT [OUTPUT]"
}


