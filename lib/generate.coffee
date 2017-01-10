# MicroFlo - Flow-Based Programming for microcontrollers
# * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# * MicroFlo may be freely distributed under the MIT license
#
util = require("./util")
cmdFormat = require("./commandformat")
commandstream = require("./commandstream")
definition = require("./definition")
unless util.isBrowser()
  fs = require("fs")
  path = require("path")
  declarec = require("declarec") # FIXME: make work in browser

cmdStreamToCDefinition = (cmdStream, target) ->
  out = ""
  if target is "arduino" or target is "avr"
    out += "#include <avr/pgmspace.h>\n"
    out += cmdStreamToC(cmdStream, "PROGMEM")
  else
    out += cmdStreamToC(cmdStream)
  out

cmdStreamValuesToC = (cmdStream) ->
  values = []
  i = 0

  while i < cmdStream.length
    values[i] = "0x" + cmdStream.readUInt8(i).toString(16)
    i++
  values = values.join(",")
  prettyValues = ""
  commas = 0
  i = 0

  while i < values.length
    commas += 1  if values[i] is ","
    prettyValues = prettyValues.concat(values[i])
    if commas and (commas % cmdFormat.commandSize) is 0
      prettyValues = prettyValues.concat("\n")
      commas = 0
    i++
  return prettyValues

cmdStreamToC = (cmdStream, annotation) ->
  annotation = ""  unless annotation
  variableName = "graph"

  prettyValues = cmdStreamValuesToC cmdStream  
  cCode = "const unsigned char " + variableName + "[] " + annotation + " = {\n" + prettyValues + "\n};"
  cCode

toSymbolicCommandStr = (message, componentLib, mapping) -> 
  nodeId = (name) ->
    return mapping.nodes[name].id
  componentId = (name) ->
    return "#{name}::id"
  portId = (node, port, out) ->
    component = mapping.components[node]
    ports = if out then "OutPorts" else "InPorts"
    return "#{component}::#{component}Ports::#{ports}::#{port}"

  # Overrides
  if message.protocol == 'graph' and message.command == 'addnode'
    id = componentId message.payload.component 
    cmd = ["GraphCmdCreateComponent", id, "0x00", "0x00", "0x00", "0x00", "0x00", "0x00" ]
    return cmd.join ', '
  else if message.protocol == 'graph' and message.command == 'addedge'
    p = message.payload
    srcPort = portId p.src.node, p.src.port, true
    tgtPort = portId p.tgt.node, p.tgt.port, false
    cmd = ["GraphCmdConnectNodes", nodeId(p.src.node), nodeId(p.tgt.node), srcPort, tgtPort, "0x00", "0x00" ]
    return cmd.join ', '
  else if message.protocol == 'graph' and message.command == 'addinitial'
    p = message.payload
    commands = commandstream.dataLiteralToCommandDescriptions p.src.data
    tgtPort = portId p.tgt.node, p.tgt.port, false
    cmd = []
    for command in commands
        type = "Msg#{command.type}"
        cmd = cmd.concat ["GraphCmdSendPacket", nodeId(p.tgt.node), tgtPort, type]
        data = command.data
        if data
            d = []
            for i in [0...data.length]
                d[i] = "0x" + data.readUInt8(i).toString(16)
            data = d
        else
            data = ['0x00', '0x00', '0x00', '0x00'] if not data
        cmd = cmd.concat data

    return cmd.join ', '

  else
    buffer = new Buffer(1024)
    start = 0
    index = commandstream.toCommandStreamBuffer message, componentLib, mapping.nodes, mapping.components, buffer, start
    buffer = buffer.slice start, index
    pretty = cmdStreamValuesToC buffer
    return pretty

initialCmdStreamSymbolic = (componentLib, graph, debugLevel) ->
  debugLevel = debugLevel or 'Error'
  buffer = new Buffer(10*1024) # FIXME: unhardcode
  graphName = 'default'
  openclose = true

  strings = []
  messages = commandstream.initialGraphMessages graph, graphName, debugLevel, openclose
  mapping = commandstream.buildMappings messages
  for message in messages
    strings.push toSymbolicCommandStr message, componentLib, mapping

  graph.nodeMap = mapping.nodes # HACK
  variableName = 'graph'
  annotation = ''
  lines = strings.join ',\n'
  cCode = "const unsigned char " + variableName + "[] " + annotation + " = {\n" + lines + "\n};"

  return cCode


generateConstInt = (prefix, iconsts) ->
  return ""  if Object.keys(iconsts).length is 0
  indent = "\n const MicroFlo::ComponentId "
  out = "#ifndef COMPONENTLIB_IDS_H\n#define COMPONENTLIB_IDS_H\n\n"
  out += "// Component Id constants\n"
  out += "namespace {"
  a = []
  for e of iconsts
    continue  unless iconsts.hasOwnProperty(e)
    a.push (indent + prefix + e + ((if (iconsts[e].id isnt `undefined`) then " = " + iconsts[e].id else "")))
  out += a.join(";")
  out += ";\n};\n\n"
  out += "#endif // COMPONENTLIB_IDS_H\n"
  out

generateEnum = (name, prefix, enums) ->
  return ""  if Object.keys(enums).length is 0
  indent = "\n    "
  out = "enum " + name + " {"
  a = []
  for e of enums
    continue  unless enums.hasOwnProperty(e)
    a.push (indent + prefix + e + ((if (enums[e].id isnt `undefined`) then " = " + enums[e].id else "")))
  out += a.join(",")
  out += "\n};\n"
  out

componentPortDefinition = (componentLib, name) ->
    out = ""
    out += "\n" + "namespace " + name + "Ports {\n"
    out += "struct InPorts {\n"
    out += generateEnum("Ports", "", componentLib.inputPortsFor(name))
    out += "};\n"
    out += "struct OutPorts {\n"
    out += generateEnum("Ports", "", componentLib.outputPortsFor(name))
    out += "};"
    out += "\n}\n"
    return out

generateComponentPortDefinitions = (componentLib) ->
  out = "#ifndef COMPONENTLIB_PORTS_H\n#define COMPONENTLIB_PORTS_H\n\n"
  for name of componentLib.getComponents()
    out += componentPortDefinition componentLib, name
  out += "\n#endif // COMPONENTLIB_PORTS_H\n"
  out

generateComponentFactory = (componentLib, methodName) ->
  out = "// Component factory functionality\nComponent *" + methodName + "(MicroFlo::ComponentId id) {"
  indent = "\n    "
  out += indent + "Component *c;"
  out += indent + "switch (id) {"
  for name of componentLib.getComponents()
    comp = componentLib.getComponent(name)
    instantiator = "new " + "::" + name
    if typeof comp.type isnt "undefined" and comp.type is "pure2"
      t0 = componentLib.inputPortById(name, 0).ctype
      t1 = componentLib.inputPortById(name, 0).ctype
      instantiator = "new PureFunctionComponent2<" + name + "," + t0 + "," + t1 + ">"
    out += indent + "case Id" + name + ": c = " + instantiator + "; c->setComponentId(id); return c;"
  out += indent + "default: return NULL;"
  out += indent + "}"
  out += "}"
  out

endsWith = (str, suffix) ->
  str.indexOf(suffix) is str.length - suffix.length

generateComponentIncludes = (componentLib) ->
  out = ""
  for name of componentLib.getComponents()
    comp = componentLib.getComponent(name)

    # TODO: build up list of files, eliminate duplicates
    out += "#include \"" + comp.filename + "\"\n"  if comp.filename and not endsWith(comp.filename, ".cpp")
  out

generateComponentMap = (componentLib) ->
  # TODO: store more efficiently, so can be embedded in uC?
  # TODO: store hash/versioning, so can be found by embedding just ID in uC?
  out = JSON.stringify componentLib.definition
  return out

macroSafeName = (str) ->
  str.split(".").join("_").split("-").join "_"

guardHead = (filename) ->
  guardname = "_" + macroSafeName(filename)
  "#ifndef " + guardname + "\n" + "#define " + guardname + "\n"

guardTail = (filename) ->
  guardname = "_" + macroSafeName(filename)
  "#endif //" + guardname + "\n"

extractId = (map, key) ->
  map[key].id

updateComponentLibDefinitions = (componentLib, baseDir, factoryMethodName) ->
  sourceOutput = ""
  ids = generateConstInt("Id", componentLib.getComponents(true, true))
  ports = generateComponentPortDefinitions(componentLib)
  fs.writeFileSync baseDir + "/componentlib-ids.h", ids
  fs.writeFileSync baseDir + "/componentlib-ports.h", ports
  sourceOutput += generateComponentIncludes(componentLib)
  sourceOutput += "\n\n"
  sourceOutput += generateComponentFactory(componentLib, factoryMethodName)
  fs.writeFileSync baseDir + "/componentlib-source.hpp", sourceOutput
  all = "\n#include \"microflo.h\"\n" + ids + ports + sourceOutput
  fs.writeFileSync baseDir + "/componentlib.hpp", all
  fs.writeFileSync baseDir + "/componentlib-map.json", generateComponentMap componentLib

updateDefinitions = (baseDir) ->
  contents = "// !! WARNING: This file is generated from commandformat.json !!" +
        "\n" + generateEnum("GraphCmd", "GraphCmd", cmdFormat.commands) +
        "\n" + declarec.generateStringMap('GraphCmd_names', cmdFormat.commands, extractId) +
        "\n" + generateEnum("Msg", "Msg", cmdFormat.packetTypes) +
        "\n" + declarec.generateStringMap('Msg_names', cmdFormat.packetTypes, extractId) +
        "\n" + generateEnum("DebugLevel", "DebugLevel", cmdFormat.debugLevels) +
        "\n" + declarec.generateStringMap('DebugLevel_names', cmdFormat.debugLevels, extractId) +
        "\n" + generateEnum("DebugId", "Debug", cmdFormat.debugPoints) +
        "\n" + declarec.generateStringMap('DebugId_names', cmdFormat.debugPoints, extractId) +
        "\n" + generateEnum("IoType", "IoType", cmdFormat.ioTypes) +
        "\n" + declarec.generateStringMap('IoType_names', cmdFormat.ioTypes, extractId)
  fs.writeFileSync baseDir + "/commandformat-gen.h", contents

declareSize = (name, value) ->
    return "const size_t #{name} = #{value};"

declareArray = (name, type, array) ->
    str = "const #{type} #{name}[] = {\n"
    for v in array
        str += "    #{v}\n"
    str += "};\n"
    return str

generateExported = (prefix, def, componentLib, type) ->
    getPorts = if type == 'inport' then 'inputPortsFor' else 'outputPortsFor'

    portNo = 0
    portIds = []
    nodeIds = []
    names = {}
    for exported, internal of def[type+'s']
        exportId = portNo++
        names[exported] = exportId
        nodeIds.push def.nodeMap[internal.process].id

        # resolve port id
        c = def.processes[internal.process].component
        ports = componentLib[getPorts] c
        p = ports[internal.port]
        portIds.push p.id

    cname = prefix+"#{type}s_"
    str = declareSize(cname+"length", portNo) +
        '\n' + declarec.generateStringMap(cname+"name", names) +
        '\n' + declareArray(cname+'node', 'MicroFlo::NodeId', nodeIds) +
        '\n' + declareArray(cname+'port', 'MicroFlo::PortId', portIds)

exportedPorts = (prefix, def, componentLib) ->

    str = '// Top-level exported ports\n' +
        generateExported(prefix, def, componentLib, 'inport') + '\n' +
        generateExported(prefix, def, componentLib, 'outport')

    return str

exportGraphName = (variable, graph) ->
  graphName = graph.properties.name or "unknown"
  return "static const char *const #{variable} = \"#{graphName}\";"

generateComponentIncludesNew = (componentLib) ->
  lines = []
  componentNames = componentLib.listComponents()
  for name in componentNames
    data = componentLib.getComponent name
    #console.log 'n', name, data
    componentFile = path.basename(data.filename).replace('.hpp', '.component')
    lines.push "#include \"#{componentFile}\"" 

  return lines

include = (file) ->
  return "#include \"#{file}\""
define = (symbol, val) ->
  return "#define #{symbol} #{val}"

extension = (target) ->
  ext = '.cpp'
  ext = '.ino' if target == 'arduino'
  return ext

generateGraphMaps = (componentLib, def) ->
  maps = declarec.generateStringMap("graph_nodeMap", def.nodeMap, extractId) +
      '\n' + exportedPorts('graph_', def, componentLib) +
      '\n' + exportGraphName('graph_name', def) +
      '\n'
  return maps

generateMain = (componentLib, inputFile, options) ->
  options.target = 'arduino' if not options.target
  # TODO: use platform-specific mainfile based on .target
  options.mainfile = 'microflo/main.hpp' if not options.mainfile
  preferredExtension = extension options.target
  if not options.output
    options.output = inputFile.replace(path.extname(inputFile), preferredExtension)
  if not path.extname options.output
    options.output += preferredExtension
  options.enableMaps = false if not options.enableMaps?

  outputDir = path.dirname options.output
  fs.mkdirSync outputDir unless fs.existsSync outputDir

  # XXX: some duplicaion with 'graph' command here
  definition.loadFile inputFile, (err, graph) ->
    throw err if err

    graphStream = initialCmdStreamSymbolic componentLib, graph, options.debug
    components = generateComponentIncludesNew componentLib
    maps = generateGraphMaps componentLib, graph

    lines = []
    lines.push "// !!! generated by: microflo main #{inputFile}"
    lines.push define 'MICROFLO_EMBED_GRAPH', '1' # FIXME: should be able to be after .h include
    lines.push include "microflo.h"
    #lines.push include "microflo.hpp" if options.target != 'arduino'
    # FIXME: the mainfiles should not include MicroFlo themselves

    lines.push "\n// Components"
    lines.push "static ComponentLibrary defaultComponentLibrary;"
    #lines.push "ComponentLibrary::set(&defaultComponentLibrary);"
    lines = lines.concat components

    lines.push "\n// Graph"
    lines.push graphStream

    if options.enableMaps
      lines.push "\n// Graph mapping"
      lines.push maps

    lines.push "\n// Main"
    lines.push include options.mainfile

    out = lines.join '\n'
    fs.writeFileSync options.output, out

generateOutput = (componentLib, inputFile, outputFile, target) ->
  outputBase = undefined
  outputDir = undefined
  outputBase = outputFile.replace(path.extname(outputFile), "")
  outputFile = outputFile + ".ino"  unless path.extname(outputFile)
  outputDir = path.dirname(outputBase)
  fs.mkdirSync outputDir  unless fs.existsSync(outputDir)
  definition.loadFile inputFile, (err, def) ->
    data = undefined
    throw err  if err
    fs.writeFile outputBase + ".json", JSON.stringify(def), (err) ->
      throw err  if err

    data = commandstream.cmdStreamFromGraph(componentLib, def, null, true)
    fs.writeFile outputBase + ".fbcs", data, (err) ->
      throw err  if err

    fs.writeFile outputBase + ".h", cmdStreamToCDefinition(data, target), (err) ->
      throw err  if err

    maps = generateGraphMaps componentLib, def
    fs.writeFile outputBase + "_maps.h", maps, (err) ->
      throw err  if err

    includes = "// !!! generated by: microflo generate\n"

    if target == 'linux-mqtt' # FIXME: generalize, allow specifying explicitly, and have default based on target name
        includes += "#define MICROFLO_MAIN_FILE \"linux_mqtt_main.hpp\"\n"

    includes += """
    #define MICROFLO_EMBED_GRAPH 1
    #include \"microflo.h\"
    #include \"main.hpp\"
    #include \"componentlib.hpp\"

    """

    fs.writeFile outputFile, cmdStreamToCDefinition(data, target) + includes, (err) ->
      throw err  if err

module.exports =
  updateDefinitions: updateDefinitions
  updateComponentLibDefinitions: updateComponentLibDefinitions
  cmdStreamToCDefinition: cmdStreamToCDefinition
  generateEnum: generateEnum
  generateOutput: generateOutput
  componentPorts: componentPortDefinition
  initialCmdStream: initialCmdStreamSymbolic
  generateMain: generateMain
