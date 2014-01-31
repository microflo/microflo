/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var path = require("path");
var fs = require("fs");

function ComponentLibrary(definition, basedir) {
    this.definition = definition;
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
}


module.exports = {
    ComponentLibrary: ComponentLibrary
}
