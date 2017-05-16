# MicroFlo - Flow-Based Programming for microcontrollers
# * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# * MicroFlo may be freely distributed under the MIT license
#

util = require "./util"
path = require "path"
fs = require "fs"

findHighestId = (components) ->
  highest = 0
  Object.keys(components).forEach (name) ->
    comp = components[name]
    highest = comp.id  if not comp[".skip"] and comp.id > highest
  return highest

extractComponents = (componentLib, inputFile) ->
    declarec = require "declarec"
    yaml = require "js-yaml"

    # TODO: check if C file
    # TODO: use declarec code for parsing
    data = fs.readFileSync inputFile, { encoding: "utf-8" }
    raw = declarec.extractDefinition data, "microflo_component", "c"
    raw.forEach (def) ->
        # HACK: js-yaml fails when document has leading indent and does not start with ---
        needsFix = (str) -> str.indexOf(" ") is 0 and str.substring(0, 3) isnt "---"
        if def.format is "yaml"
            def.content = "---\n" + def.content + "\n"  if needsFix def.content
            d = yaml.safeLoad(def.content)
            componentLib.addComponent d.name, d, inputFile

class ComponentLibrary
    constructor: () ->
        @reset()
    reset: ->
        @definition = components: {}

    loadFile: (filePath) ->
        extractComponents this, filePath

    loadSet: (set, callback) ->
        try
            set.components.forEach (name) =>
                @loadFile set.base + "/" + name + ".hpp"
        catch e
            return callback(e)
        return callback null

    loadSetFile: (filePath, callback) ->
        # FIXME: support loading non-module, relative to CWD
        if filePath.indexOf('.') == 0
          filePath = path.join process.cwd(), filePath

        content = require filePath
        modulePath = require.resolve filePath

        content = content.microflo if typeof content.microflo isnt "undefined" # for package/fbp.json
        content.base = path.dirname modulePath # resolve path relative to file
        @loadSet content, callback

    listComponents: (includingSkipped, includingVirtual) ->
        Object.keys @getComponents includingSkipped, includingVirtual

    getComponents: (includingSkipped, includingVirtual) ->
        return @definition.components  if includingSkipped
        components = {}
        for name of @definition.components
            comp = @getComponent(name)
            skip = comp[".skip"] or false
            virtual = comp["graph"] or comp["graphFile"]
            components[name] = comp  if not skip and (includingVirtual or not virtual)
        return components

    getComponent: (componentName) ->
        throw new Error "getComponent(): component name not specified" if not componentName
        c = @definition.components[componentName]
        return c

    getComponentById: (componentId) ->
        for name of @getComponents()
            comp = @getComponent name
            if comp.id is componentId
                comp.name = name
                return comp
        return null

    getComponentSource: (componentName, callback) ->
        return callback new Error "Getting component source not implemented"

        componentFile = path.join @baseDirectory, "components.cpp"
        startLine = 0
        endLine = 0

        # FIXME: support when running in browser. Probably look up in github?
        fs.readFile componentFile, (err, data) =>
            return callback(err, null)  if err
            data = data.toString()
            lines = data.split("\n")
            i = 0

            while i < lines.length
                line = lines[i].trim()
                startLine = i  if startLine is 0 and line.match("class " + componentName)
                if startLine isnt 0 and line.match("};")
                    endLine = i + 1
                    source = lines.slice(startLine, endLine).join("\n")
                    return callback(null, source)
                i++
            return callback new Error 'Could not find component source'

    outputPortsFor: (componentName) ->
        c = @getComponent(componentName)
        throw new Error "Could not find outports for #{componentName}" if not c
        return c.outPorts
    inputPortsFor: (componentName) ->
        c = @getComponent(componentName)
        throw new Error "Could not find outports for #{componentName}" if not c
        return c.inPorts
    inputPort: (componentName, portName) ->
        @inputPortsFor(componentName)[portName]
    outputPort: (componentName, portName) ->
        @outputPortsFor(componentName)[portName]

    inputPortById: (componentName, portId) ->
        ports = @inputPortsFor componentName
        for name of ports
            port = ports[name]
            if port.id is portId
                port.name = name
                return port
        return null

    outputPortById: (componentName, portId) ->
        ports = @outputPortsFor(componentName)
        for name of ports
            port = ports[name]
            if port.id is portId
                port.name = name
                return port
        return null

    addComponent: (componentName, def, filename) ->
        # Normalization
        def.filename = filename
        def.id = findHighestId(@definition.components) + 1  if typeof def.id is "undefined"
        if typeof def.inports isnt "undefined"
            def.inPorts = def.inports
            def.inports = null
        if typeof def.inPorts is "undefined"
            def.inPorts = { 'in': { id: 0 } }
        if typeof def.outports isnt "undefined"
            def.outPorts = def.outports
            def.outports = null
        if typeof def.outPorts is "undefined"
            def.outPorts = { out: { id: 0 } }

        checkPortIdsAssigned = (ports) ->
            names = Object.keys(ports)
            if names.length > 0 and not ports[names[0]].id?
                names.forEach (name, idx) ->
                    port = ports[name]
                    port.id = idx

        # TODO: normalize port description (default "") and type (default: "all")
        checkPortIdsAssigned def.inPorts
        checkPortIdsAssigned def.outPorts
        @definition.components[componentName] = def

module.exports = ComponentLibrary: ComponentLibrary
