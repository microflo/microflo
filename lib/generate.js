/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var fs = require("fs");
var path = require("path");
var cmdFormat = require("../microflo/commandformat.json");

var cmdStreamToCDefinition = function(cmdStream, annotation) {
    var arduinoCode = "#include <avr/pgmspace.h>\n";
    arduinoCode += ""

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
        out += indent + "case Id" + name + ": c = new " + "Components::" + name + "; c->componentId=id; return c;"
    }
    out += indent + "default: return NULL;"
    out += indent + "}"
    out += "}"
    return out;
}


var updateDefinitions = function(componentLib, baseDir) {
    fs.writeFileSync(baseDir + "/components-gen.h",
                     generateEnum("ComponentId", "Id", componentLib.getComponents(true, true)));
    fs.writeFileSync(baseDir + "/components-gen-bottom.hpp",
                     generateComponentFactory(componentLib));
    fs.writeFileSync(baseDir + "/components-gen-top.hpp",
                     generateComponentPortDefinitions(componentLib));
    fs.writeFileSync(baseDir + "/commandformat-gen.h",
                 generateEnum("GraphCmd", "GraphCmd", cmdFormat.commands) +
                 "\n" + generateEnum("Msg", "Msg", cmdFormat.packetTypes) +
                 "\n" + generateEnum("DebugLevel", "DebugLevel", cmdFormat.debugLevels) +
                 "\n" + generateEnum("DebugId", "Debug", cmdFormat.debugPoints));
}

module.exports = {
    updateDefinitions: updateDefinitions,
    cmdStreamToCDefinition: cmdStreamToCDefinition
}

