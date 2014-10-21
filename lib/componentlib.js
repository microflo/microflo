/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var util = require("./util");
var defaultComponents = require("../microflo/components.json");
if (util.isBrowser()) {

} else {
    var path = require("path");
    var fs = require("fs");
}


function ComponentLibrary(definition, basedir) {
    this.definition = definition || defaultComponents;
    this.baseDirectory = basedir;

    var self = this;
    this.load = function() {
        var fbp = require("fbp");

        for (var compName in this.definition.components) {
            var comp = this.definition.components[compName];
            if (comp.graph || comp.graphFile) {
                // FIXME: don't read file syncronously
                // FIXME: do not require fbp to instantiate class
                if (fbp) {
                    var graph = comp.graph;
                    if (!graph && comp.graphFile) {
                        var p = path.join(this.baseDirectory, comp.graphFile);
                        console.log(p);
                        graph = fbp.parse(fs.readFileSync(p, {encoding: "utf-8"}));
                        this.definition.components[compName].graph = graph;
                    }
                    console.log(graph);

                    var exports = {};
                    for (var i=0; i<graph.exports.length; i++) {
                        exports[graph.exports[i]['public']] = {id: i};
                    }

                    // FIXME: separate between inport and outports. Requires https://github.com/noflo/noflo/issues/118
                    this.definition.components[compName].inPorts = exports;
                    this.definition.components[compName].outPorts = exports;
                }
            }
        }
    }

    this.listComponents = function(includingSkipped, includingVirtual) {
        return Object.keys(this.getComponents(includingSkipped, includingVirtual));
    }

    this.getComponents = function(includingSkipped, includingVirtual) {
        if (includingSkipped) {
            return this.definition.components;
        }

        var components = {};
        for (var name in this.definition.components) {
            var comp = this.getComponent(name);
            var skip = comp[".skip"] || false;
            var virtual = comp["graph"] || comp["graphFile"];
            if (!skip && (includingVirtual || !virtual)) {
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

    this.getComponentSource = function(componentName, callback) {

        var componentFile = path.join(this.baseDirectory, "components.cpp");
        var startLine = 0;
        var endLine = 0;
        // FIXME: support when running in browser. Probably look up in github?
        fs.readFile(componentFile, function(err, data) {
            if (err) {
                return callback(err, null);
            }
            data = data.toString();
            var lines = data.split("\n");
            for (var i=0; i<lines.length; i++) {
                var line = lines[i].trim();
                if (startLine == 0 && line.match("class "+componentName)) {
                    startLine = i;
                }
                if (startLine != 0 && line.match("};")) {
                    endLine = i+1;
                    var source = lines.slice(startLine, endLine).join("\n");
                    return callback(null, source);
                }
            }
        });

    }

    this.outputPortsFor = function(componentName) {
        return self.getComponent(componentName).outPorts || self.definition.defaultOutPorts;
    }
    this.inputPortsFor = function(componentName) {
        return self.getComponent(componentName).inPorts || self.definition.defaultInPorts;
    }

    this.inputPort = function(componentName, portName) {
        return self.inputPortsFor(componentName)[portName];
    }
    this.inputPortById = function(componentName, portId) {
        var ports = self.inputPortsFor(componentName);
        for (name in ports) {
            var port = ports[name];
            if (port.id == portId) {
                port.name = name;
                return port;
            }
        }
    }

    this.outputPort = function(componentName, portName) {
        return self.outputPortsFor(componentName)[portName];
    }
    this.outputPortById = function(componentName, portId) {
        var ports = self.outputPortsFor(componentName);
        for (name in ports) {
            var port = ports[name];
            if (port.id == portId) {
                port.name = name;
                return port;
            }
        }
    }
    this.addComponent = function(componentName, def) {
        // Normalization. Should be applied to all components eventually
        if (typeof def.id === 'undefined') {
            def.id = findHighestId(self.definition)+1;
        }
        if (typeof def.inports !== 'undefined') {
            def.inPorts = def.inports;
            def.inports = null;
        }
        if (typeof def.inPorts === 'undefined') {
            def.inPorts = { 'in': { id:0 } };
        }
        if (typeof def.outports !== 'undefined') {
            def.outPorts = def.outports;
            def.outports = null;
        }
        if (typeof def.outPorts === 'undefined') {
            def.outPorts = { 'out': { id:0 } };
        }
        var checkPortIdsAssigned = function(ports) {
            if (ports.length > 0 && typeof ports[0].id === 'undefined') {
                ports.forEach(function(port, idx) {
                    ports[idx].id = idx;
                });
            }
        }
        checkPortIdsAssigned(def.inPorts);
        checkPortIdsAssigned(def.outPorts);

        console.log('normalized', componentName, def);
        self.definition[componentName] = def;
    }
}

var findHighestId = function(components) {
    var highest = 0;
    Object.keys(components).forEach(function (name) {
        var comp = components[name];
        if (comp.id > highest) {
            highest = comp.id
        }
    });
    return highest;
};


module.exports = {
    ComponentLibrary: ComponentLibrary,
    defaultComponents: defaultComponents
}
