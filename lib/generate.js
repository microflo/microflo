/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var util = require("./util");
var cmdFormat = require("./commandformat");
var commandstream = require("./commandstream");

if (util.isBrowser()) {

} else {
    var fs = require("fs");
    var path = require("path");
    var declarec = require("declarec"); // FIXME: make work in browser
}

var cmdStreamToCDefinition = function(cmdStream, target) {
    var out = "";
    if (target === 'arduino' || target === 'avr') {
        out += "#include <avr/pgmspace.h>\n"
        out += cmdStreamToC(cmdStream, "PROGMEM");
    } else {
        out += cmdStreamToC(cmdStream);
    }

    return out;
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

var generateConstInt = function(prefix, iconsts) {
    if (Object.keys(iconsts).length === 0) {
        return ""
    }
    var indent = "\n const MicroFlo::ComponentId ";
    
    var out = "// Component Id constants\n";
    out += "namespace {";
    
    var a = [];
    for (var e in iconsts) {
        if (!iconsts.hasOwnProperty(e)) {
            continue;
        }
        a.push((indent + prefix + e + ((iconsts[e].id !== undefined) ? " = " + iconsts[e].id : "")));
    }
    out += a.join(";");
    out += ";\n};\n";
    
    return out;
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
    var out = "Component *Component::create(MicroFlo::ComponentId id) {"
    var indent = "\n    ";
    out += indent + "Component *c;";
    out += indent + "switch (id) {";
    for (var name in componentLib.getComponents()) {
        var comp = componentLib.getComponent(name);
        var instantiator = "new " + "::" + name;
        if (typeof comp.type !== 'undefined' && comp.type === 'pure2') {
            var t0 = componentLib.inputPortById(name, 0).ctype;
            var t1 = componentLib.inputPortById(name, 0).ctype;
            instantiator = "new PureFunctionComponent2<"+name+","+t0+","+t1+">";
        }
        out += indent + "case Id" + name + ": c = " + instantiator + "; c->componentId=id; return c;"
    }
    out += indent + "default: return NULL;"
    out += indent + "}"
    out += "}"
    return out;
}

var generateComponentIncludes = function(componentLib) {
    var out = ""
    for (var name in componentLib.getComponents()) {
        out += '#include "components/'+ name+'.hpp"\n';
    }
    return out;
}

var extractId = function(map,key) { return map[key].id };


var updateDefinitions = function(componentLib, baseDir) {
    fs.writeFileSync(baseDir + "/components-gen.h",
                     generateConstInt("Id",componentLib.getComponents(true, true)));
    fs.writeFileSync(baseDir + "/components-gen-names.h",
                     declarec.generateStringMap("component_names", componentLib.getComponents(true, true), extractId));    
    fs.writeFileSync(baseDir + "/components-gen-lib.hpp",
                     generateComponentIncludes(componentLib));
    fs.writeFileSync(baseDir + "/components-gen-bottom.hpp",
                     generateComponentFactory(componentLib));
    fs.writeFileSync(baseDir + "/components-gen-top.hpp",
                     generateComponentPortDefinitions(componentLib));
    fs.writeFileSync(baseDir + "/commandformat-gen.h",
                 generateEnum("GraphCmd", "GraphCmd", cmdFormat.commands) +
                 "\n" + generateEnum("Msg", "Msg", cmdFormat.packetTypes) +
                 "\n" + generateEnum("DebugLevel", "DebugLevel", cmdFormat.debugLevels) +
                 "\n" + generateEnum("DebugId", "Debug", cmdFormat.debugPoints));
    fs.writeFileSync(baseDir + "/io-gen.h",
                 "\n" + generateEnum("IoType", "IoType", cmdFormat.ioTypes));
}

var generateOutput = function(componentLib, inputFile, outputFile, target) {
    var outputBase, outputDir;
    outputBase = outputFile.replace(path.extname(outputFile), "");
    if (!path.extname(outputFile)) {
      outputFile = outputFile + ".pde";
    }
    outputDir = path.dirname(outputBase);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    var runtime = require("./runtime"); // FIXME: circular deps
    return runtime.loadFile(inputFile, function(err, def) {
      var data;
      if (err) {
        throw err;
      }
      fs.writeFile(outputBase + ".json", JSON.stringify(def), function(err) {
        if (err) {
          throw err;
        }
      });
      data = commandstream.cmdStreamFromGraph(componentLib, def, null, true);
      fs.writeFile(outputBase + ".fbcs", data, function(err) {
        if (err) {
          throw err;
        }
      });
      fs.writeFile(outputBase + ".h", cmdStreamToCDefinition(data, target), function(err) {
        if (err) {
          throw err;
        }
      });
      fs.writeFile(outputBase + "_maps.h", declarec.generateStringMap("graph_nodeMap", def.nodeMap, extractId), function(err) {
        if (err) {
          throw err;
        }
      });
      return fs.writeFile(outputFile, cmdStreamToCDefinition(data, target) + "\n" + "#define MICROFLO_EMBED_GRAPH\n" + "#include \"microflo.h\"" + "\n#include \"main.hpp\"", function(err) {
        if (err) {
          throw err;
        }
      });
    });
  };

module.exports = {
    updateDefinitions: updateDefinitions,
    cmdStreamToCDefinition: cmdStreamToCDefinition,
    generateEnum: generateEnum,
    generateOutput: generateOutput
}

