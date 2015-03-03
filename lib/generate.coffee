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

cmdStreamToC = (cmdStream, annotation) ->
  annotation = ""  unless annotation
  variableName = "graph"
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
  cCode = "const unsigned char " + variableName + "[] " + annotation + " = {\n" + prettyValues + "\n};"
  cCode

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

generateComponentPortDefinitions = (componentLib) ->
  out = "#ifndef COMPONENTLIB_PORTS_H\n#define COMPONENTLIB_PORTS_H\n\n"
  for name of componentLib.getComponents()
    out += "\n" + "namespace " + name + "Ports {\n"
    out += "struct InPorts {\n"
    out += generateEnum("Ports", "", componentLib.inputPortsFor(name))
    out += "};\n"
    out += "struct OutPorts {\n"
    out += generateEnum("Ports", "", componentLib.outputPortsFor(name))
    out += "};"
    out += "\n}\n"
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

updateDefinitions = (baseDir) ->
  fs.writeFileSync baseDir + "/commandformat-gen.h", "// !! WARNING: This file is generated from commandformat.json !!" + "\n" + generateEnum("GraphCmd", "GraphCmd", cmdFormat.commands) + "\n" + generateEnum("Msg", "Msg", cmdFormat.packetTypes) + "\n" + generateEnum("DebugLevel", "DebugLevel", cmdFormat.debugLevels) + "\n" + generateEnum("DebugId", "Debug", cmdFormat.debugPoints) + "\n" + generateEnum("IoType", "IoType", cmdFormat.ioTypes)

generateOutput = (componentLib, inputFile, outputFile, target) ->
  outputBase = undefined
  outputDir = undefined
  outputBase = outputFile.replace(path.extname(outputFile), "")
  outputFile = outputFile + ".pde"  unless path.extname(outputFile)
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

    fs.writeFile outputBase + "_maps.h", declarec.generateStringMap("graph_nodeMap", def.nodeMap, extractId), (err) ->
      throw err  if err

    fs.writeFile outputFile, cmdStreamToCDefinition(data, target) + "\n#define MICROFLO_EMBED_GRAPH" + "\n#include \"microflo.h\"" + "\n#include \"main.hpp\"" + "\n#include \"componentlib.hpp\"", (err) ->
      throw err  if err

module.exports =
  updateDefinitions: updateDefinitions
  updateComponentLibDefinitions: updateComponentLibDefinitions
  cmdStreamToCDefinition: cmdStreamToCDefinition
  generateEnum: generateEnum
  generateOutput: generateOutput
