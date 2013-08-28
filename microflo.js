var noflo = require("noflo");
var fbp = require("fbp");
var fs = require("fs");
var path = require("path");

// TODO: remove duplication, have a canonical definition used both sides
var cmdFormat = {
    magicString: "uC/Flo",
    cmdSize: 6,
    CmdReset: 10,
    CmdCreate: 11,
    CmdConnect: 12,
    components: {
        'Forward': { id: 1 },
        'ReadStdIn': { id: 2 },
        'PrintStdOut': { id: 3 },
        'RandomChar': { id: 4 }
    }
}

var writeCmd = function() {
    buf = arguments[0];
    offset = arguments[1];
    data = Array.prototype.slice.call(arguments, 2);

    for (var i = 0; i < cmdFormat.cmdSize; i++) {
        if (i < data.length) {
            buf.writeUInt8(data[i], offset+i);
        } else {
            buf.writeUInt8(0, offset+i);
        }
    }
    return cmdFormat.cmdSize;
}

var writeString = function(buf, offset, string) {
    for (var i = 0; i < string.length ; i++) {
        buf[offset+i] = string.charCodeAt(i);
    }
    return string.length;
}

// TODO: actually add observers to graph, and emit a command stream for the changes
var cmdStreamFromGraph = function(graph) {
    var buffer = new Buffer(1024); // FIXME: unhardcode
    var index = 0;
    var nodeMap = {}; // nodeName->numericNodeId

    // Header
    index += writeString(buffer, index, cmdFormat.magicString);
    index += writeCmd(buffer, index, cmdFormat.CmdReset);

    // console.log(graph);

    // Create components
    var currentNodeId = 0;
    for (var nodeName in graph.processes) {
        if (!graph.processes.hasOwnProperty(nodeName)) {
            continue;
        }
        var process = graph.processes[nodeName];
        var componentId = cmdFormat.components[process.component].id;
        index += writeCmd(buffer, index, cmdFormat.CmdCreate, componentId);
        nodeMap[nodeName] = currentNodeId++;
    }

    // Connect nodes
    graph.connections.forEach(function(connection) {
        // TODO: support multiple ports
        var srcId = nodeMap[connection.src.process];
        var targetId = nodeMap[connection.tgt.process];
        index += writeCmd(buffer, index, cmdFormat.CmdConnect, srcId, targetId);
    });

    buf = buf.slice(0, index);
    return buf;
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
        var data = cmdStreamFromGraph(def);

        // TODO: allow to generate just one of these
        fs.writeFile(outputBase + ".fbcs", data, function(err) {
            if (err) throw err;
        });
        fs.writeFile(outputBase + ".h", cmdStreamToCDefinition(data), function(err) {
            if (err) throw err;
        });
        fs.writeFile(outputBase + ".cpp", cmdStreamToCDefinition(data) + "\n" + '#include "microflo.hpp"', function(err) {
            if (err) throw err;
        });

    });

}

// Main
var cmd = process.argv[2];
if (cmd == "generate" || process.argv[3] == undefined) {
    var inputFile = process.argv[3];
    var outputFile = process.argv[4] || inputFile
    generateOutput(inputFile, outputFile);
} else {
    throw "Invalid commandline arguments. Usage: node microflo.js generate INPUT [OUTPUT]"
}


