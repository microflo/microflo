/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var cmdFormat = require("./commandformat");
var util = require("./util");
if (util.isBrowser()) {
    var Buffer = require('buffer').Buffer
} else {
    var Buffer = require('buffer').Buffer;
}

var fbp = require("fbp");


var writeCmd = function() {
    var buf = arguments[0];
    var offset = arguments[1];
    var data = arguments[2];

    if (typeof data === "object" && "length" in data) {
        // Buffer
        data.copy(buf, offset);
        return data.length;
    } else {
        data = Array.prototype.slice.call(arguments, 2);
    }

    for (var i = 0; i < cmdFormat.commandSize; i++) {
        // console.log(offset, data);
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

    // Array of bytes/integers
    var isByteArray = typeof value[0] === 'string';
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
            var v = parseInt(value[i]);
            if (isByteArray) {
                b.writeInt8(cmdFormat.packetTypes.Byte.id, offset+3);
                b.writeUInt8(v, offset+4);
            } else {
                b.writeInt8(cmdFormat.packetTypes.Integer.id, offset+3);
                b.writeInt32LE(v, offset+4);
            }
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

var findPort = function(componentLib, graph, nodeName, portName) {
    var isOutput = false;
    var port = componentLib.inputPort(graph.processes[nodeName].component, portName);
    if (!port) {
        port =  componentLib.outputPort(graph.processes[nodeName].component, portName);
        isOutput = true;
    }
    return { isOutput: isOutput, port: port};
}

var cmdStreamBuildSubGraph = function(currentNodeId, buffer, index, componentLib, graph, nodeName, comp) {

    index += writeCmd(buffer, index, cmdFormat.commands.CreateComponent.id,
                      componentLib.getComponent("SubGraph").id)
    graph.nodeMap[nodeName] = {id: currentNodeId++};

    var subgraph = comp.graph;
    subgraph.nodeMap = graph.nodeMap;
    graph.processes[nodeName].graph = subgraph;
    var r = cmdStreamBuildGraph(currentNodeId, buffer, index, componentLib, subgraph, nodeName);
    index += r.index;
    currentNodeId = r.nodeId;

    for (var i=0; i<subgraph.exports.length; i++) {
        var c = subgraph.exports[i];
        var tok = c['private'].split(".");
        if (tok.length != 2) {
            throw "Invalid export definition"
        }

        var childNode = graph.nodeMap[tok[0]];
        var childPort = findPort(componentLib, subgraph, tok[0], tok[1]);
        var subgraphNode = graph.nodeMap[nodeName];
        var subgraphPort = componentLib.inputPort(graph.processes[nodeName].component, c['public']);
        index += writeCmd(buffer, index, cmdFormat.commands.ConnectSubgraphPort.id,
                          childPort.isOutput ? 1 : 0,
                          subgraphNode.id, subgraphPort.id,
                          childNode.id, childPort.port.id);
    }
    return { index: index, nodeId: currentNodeId };
}


var cmdStreamBuildGraph = function(currentNodeId, buffer, index, componentLib, graph, parent) {

    var nodeMap = graph.nodeMap;
    var startIndex = index;

    // Create components
    for (var nodeName in graph.processes) {
        if (!graph.processes.hasOwnProperty(nodeName)) {
            continue;
        }

        var process = graph.processes[nodeName];
        var comp = componentLib.getComponent(process.component);
        if (comp.graph || comp.graphFile) {
            // Inject subgraph
            var r = cmdStreamBuildSubGraph(currentNodeId, buffer, index, componentLib, graph, nodeName, comp);
            index = r.index;
            currentNodeId = r.nodeId;

        } else {
            // Add normal component
            var parentId = parent ? nodeMap[parent].id : undefined;
            if (parentId) {
                graph.processes[nodeName].parent = parentId;
            }

            index += writeCmd(buffer, index, cmdFormat.commands.CreateComponent.id,
                              comp.id, parentId||0);
            nodeMap[nodeName] = {id: currentNodeId++, parent: parentId};
        }
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
                                  nodeMap[srcNode].id, nodeMap[tgtNode].id, srcPort, tgtPort);
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

            index += writeCmd(buffer, index, dataLiteralToCommand(connection.data, nodeMap[tgtNode].id, tgtPort));
        }
    });

    return {index: index-startIndex, nodeId: currentNodeId};
}

// TODO: actually add observers to graph, and emit a command stream for the changes
var cmdStreamFromGraph = function(componentLib, graph, debugLevel) {
    debugLevel = debugLevel || "Error";
    var buffer = new Buffer(1024); // FIXME: unhardcode
    var index = 0;
    var nodeMap = {}; // nodeName->numericNodeId
    var currentNodeId = 1;

    // HACK: Attach the mapping so others can use it later
    graph.nodeMap = nodeMap;

    // Header
    index += writeString(buffer, index, cmdFormat.magicString);
    index += writeCmd(buffer, index, cmdFormat.commands.Reset.id);

    // Config
    index += writeCmd(buffer, index, cmdFormat.commands.ConfigureDebug.id,
                      cmdFormat.debugLevels[debugLevel].id);

    // Actual graph
    var r = cmdStreamBuildGraph(currentNodeId, buffer, index, componentLib, graph);
    index += r.index;
    currentNodeId = r.nodeId;

    // Mark end of commands
    index += writeCmd(buffer, index, cmdFormat.commands.End.id);

    buffer = buffer.slice(0, index);
    return buffer;
}

module.exports = {
    cmdStreamFromGraph: cmdStreamFromGraph,
    dataLiteralToCommand: dataLiteralToCommand,
    writeCmd: writeCmd,
    writeString: writeString,
    cmdFormat: cmdFormat, // deprecated
    format: cmdFormat,
    Buffer: Buffer
}

