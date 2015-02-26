/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var util = require("./util");
if (util.isBrowser()) {

} else {
    var path = require("path");
    var fs = require("fs");
}

var extractComponents = function(componentLib, inputFile) {
    var declarec = require('declarec');
    var yaml = require('js-yaml');
    var data = fs.readFileSync(inputFile, {encoding: 'utf-8'});
    // TODO: check if C file
    // TODO: use declarec code for parsing
    var raw = declarec.extractDefinition(data, 'microflo_component', 'c');
    raw.forEach(function(def) {
        if (def.format === 'yaml') {
            if (def.content.indexOf(' ') == 0 && def.content.substring(0,3) !== '---') {
                // HACK: js-yaml fails when document has leading indent and does not start with ---
                def.content = '---\n' + def.content + '\n';
            }
            var d = yaml.safeLoad(def.content);
            componentLib.addComponent(d.name, d, inputFile);
        }
    });
};

function ComponentLibrary() {

    this.reset = function() {
        self.definition = {
            components: {}
        };
    }

    var self = this;
    self.reset();

    this.loadFile = function(filePath) {
        extractComponents(self, filePath);
    }

    this.loadSet = function(set, callback) {
        var base = set.base;
        try {
            set.components.forEach(function(name) {
                self.loadFile(base+'/'+name+'.hpp');
            });
        } catch (e) {
            return callback(e);
        }
        return callback(null);
    }

    this.loadSetFile = function(filePath, callback) {
        var content = require(filePath);
        if (typeof content.microflo !== 'undefined') {
            // for package/fbp.json
            content = content.microflo;
        }
        if (typeof content.base == 'undefined') {
            content.base = path.dirname(filePath);
        }
        self.loadSet(content, callback);
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
        return self.getComponent(componentName).outPorts;
    }
    this.inputPortsFor = function(componentName) {
        return self.getComponent(componentName).inPorts;
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
    this.addComponent = function(componentName, def, filename) {
        // Normalization. Should be applied to all components eventually
        def.filename = filename;
        if (typeof def.id === 'undefined') {
            def.id = findHighestId(self.definition.components)+1;
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
            var names = Object.keys(ports);
            if (names.length > 0 && typeof ports[names[0]].id === 'undefined') {
                names.forEach(function(name, idx) {
                    var port = ports[name];
                    port.id = idx;
                });
            }
        }
        // TODO: normalize port description (default "") and type (default: "all")
        checkPortIdsAssigned(def.inPorts);
        checkPortIdsAssigned(def.outPorts);
        self.definition.components[componentName] = def;
    }
}

var findHighestId = function(components) {
    var highest = 0;
    Object.keys(components).forEach(function (name) {
        var comp = components[name];
        if (!comp['.skip'] && comp.id > highest) {
            highest = comp.id
        }
    });
    return highest;
};


module.exports = {
    ComponentLibrary: ComponentLibrary
}
