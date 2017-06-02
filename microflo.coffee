# MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license

require "coffee-script/register"
fs = require("fs")
path = require("path")
cmdFormat = require("./microflo/commandformat.json")
microflo = require("./lib/microflo")
commander = require("commander")
pkginfo = require("pkginfo")(module)
uuid = require('uuid')

defaultLibrary = 'microflo-core/components/arduino-standard.json'

setupRuntimeCommand = (env) ->
    serialPortToUse = env.serial or "auto"
    port = env.port or 3569
    debugLevel = env.debug or "Error"
    ip = env.ip or "127.0.0.1"
    baud = parseInt(env.baudrate) or 9600
    componentMap = env.componentmap
    if not env.id
      env.id = uuid.v4()
      console.log 'INFO: No runtime id set, generated one:', env.id

    setupRuntime = (callback) ->
        if env.file
            file = path.resolve env.file
            microflo.runtime.setupSimulator file, baud, port, debugLevel, ip, (err, runtime) ->
                return callback err, runtime
        else
            options = env
            options.host = ip
            microflo.runtime.setupRuntime serialPortToUse, baud, componentMap, options, (err, runtime) ->
                return callback err, runtime

    sendGraph = (runtime, callback) ->
        if not env.graph
            return callback null
        microflo.definition.loadFile env.graph, (err, graph) ->
            return callback err if err
            return runtime.uploadGraph graph, callback

    callback = (err, runtime) ->
        if err
            console.error err
            process.exit 2
        else
            console.log 'Open in Flowhub:\n', runtime.liveUrl()
    setupRuntime (err, runtime) ->
        return callback err if err
        console.log "MicroFlo runtime listening at", ip + ":" + port
        sendGraph runtime, (err) ->
            return callback err if err
            return callback err, runtime

uploadGraphCommand = (graphPath, env) ->
  microflo.runtime.uploadGraphFromFile graphPath, env, (err) ->
    if err
      console.error err
      console.error err.stack if err.stack
      process.exit 1
    console.log 'Graph uploaded and running'
    process.exit 0

generateFwCommand = (inputFile, output, env) ->

    target = env.target or "arduino"
    if output[output.length-1] == '/'
      output += 'main.cpp'
    outputDir = path.dirname output
    library = env.library or defaultLibrary
    componentLib = new microflo.componentlib.ComponentLibrary()
    componentLib.loadSetFile library, (err) ->
        throw err  if err
        componentLib.loadFile inputFile
        microflo.generate.updateComponentLibDefinitions componentLib, outputDir, "createComponent"
        microflo.generate.generateOutput componentLib, inputFile, output, target

updateDefsCommand = (directory) ->
    microflo.generate.updateDefinitions directory

generateFactory = (componentLib, name) ->
    instantiator = "new #{name}()"
    comp = componentLib.getComponent name
    if comp.type is "pure2"
      # XXX: can we get rid of this??
      t0 = componentLib.inputPortById(name, 0).ctype
      t1 = componentLib.inputPortById(name, 0).ctype
      instantiator = "new PureFunctionComponent2<" + name + "," + t0 + "," + t1 + ">"
    return """static Component *create() { return #{instantiator}; }
    static const char * const name = "#{name}";
    static const MicroFlo::ComponentId id = ComponentLibrary::get()->add(create, name);
    """

generateComponent = (lib, name, sourceFile) ->
    ports = microflo.generate.componentPorts lib, name
    factory = generateFactory lib, name
    return """namespace #{name} {
    #{ports}
    #include "#{sourceFile}"

    #{factory}
    } // end namespace #{name}"""

componentDefsCommand = (sourceFile, env) ->
    lib = new microflo.componentlib.ComponentLibrary()
    lib.loadFile sourceFile

    components = Object.keys lib.getComponents()
    if not components.length
        console.error "Could not find any MicroFlo components in #{sourceFile}"
        process.exit 1
    name = components[0]

    componentFile = sourceFile.replace(path.extname(sourceFile), ".component")
    includePath = "./" + path.basename sourceFile
    componentWrapper = generateComponent lib, name, includePath
    fs.writeFileSync componentFile, componentWrapper

graphCommand = (graphFile, env) ->
    lib = new microflo.componentlib.ComponentLibrary()
    lib.loadFile graphFile

    microflo.definition.loadFile graphFile, (err, graph) ->
        throw err if err
        graph = microflo.generate.initialCmdStream lib, graph
        fs.writeFileSync graphFile+".graph.h", graph

mainCommand = (inputFile, env) ->
    library = env.library or defaultLibrary
    componentLib = new microflo.componentlib.ComponentLibrary()
    componentLib.loadSetFile library, (err) ->
        throw err if err

        microflo.generate.generateMain componentLib, inputFile, env

main = ->
    commander.version module.exports.version
    commander.command("update-defs")
        .description("Update internal generated definitions")
        .action updateDefsCommand

    commander.command("component <COMPONENT.hpp>")
        .description("Update generated definitions for component")
        .action componentDefsCommand
    commander.command("graph <COMPONENT.hpp>")
        .description("Update generated definitions for component")
        .option("-t, --target <platform>", "Target platform: arduino|linux|avr8")
        .action graphCommand
    commander.command("main <GRAPH>")
        .description("Generate an entrypoint file")
        .option("-t, --target <platform>", "Target platform: arduino|linux|avr8")
        .option("-m, --mainfile <FILE.hpp>", "File to include for providing main()")
        .option("-o, --output <FILE>", "File to output to. Defaults to $graphname.cpp")
        .option("-l, --library <FILE.json>", "Component library file") # WARN: to be deprecated
        .option("-d, --debug <level>", "Debug level to configure the runtime with. Default: Error")
        .option("--enable-maps", "Enable graph info maps")
        .action mainCommand

    commander.command("generate <INPUT> <OUTPUT>")
        .description("Generate MicroFlo firmware code, with embedded graph.")
        .option("-l, --library <FILE.json>", "Component library file")
        .option("-t, --target <platform>", "Target platform: arduino|linux|avr8")
        .action generateFwCommand
    commander.command("upload <GRAPH>")
        .option("-s, --serial <PORT>", "which serial port to use", String, 'auto')
        .option("-b, --baudrate <RATE>", "baudrate for serialport", Number, 9600)
        .option("-d, --debug <LEVEL>", "set debug level", String, 'Error')
        .option("-m, --componentmap <.json>", "Component mapping definition")
        .description("Upload a new graph to a device running MicroFlo firmware")
        .action uploadGraphCommand
    commander.command("runtime")
        .description("Run as a server, for use with the NoFlo UI.")
        .option("-s, --serial <PORT>", "which serial port to use", String, '')
        .option("-b, --baudrate <RATE>", "baudrate for serialport", Number, 9600)
        .option("-d, --debug <LEVEL>", "set debug level", String, 'Error')
        .option("-p, --port <PORT>", "which port to use for WebSocket", Number, 3569)
        .option("-i, --ip <IP>", "which IP to use for WebSocket", String, 'localhost')
        .option("-f, --file <FILE>", "Firmware file to run (.js or binary)")
        .option("-g, --graph <initial.fbp|json>", "Initial graph to load")
        .option("-m, --componentmap <.json>", "Component mapping definition")
        .option("--ide <URL>", "FBP IDE which can open live url", String, "http://app.flowhub.io")
        .option("--id <RUNTIME-ID>", "UUID for the runtime", String, process.env["MICROFLO_RUNTIME_ID"])
        .option('--ping-url <URL>', 'An URL that will be pinged periodically',
                String, 'https://api.flowhub.io/runtimes/$RUNTIME_ID')
        .option('--ping-method <GET|POST>', 'HTTP method to hit ping URL with', String, 'POST')
        .option('--ping-interval <seconds>', 'How often to hit the ping URL, 0=never', Number, 0)
        .action setupRuntimeCommand
    commander.parse process.argv
    commander.help()  if process.argv.length <= 2

exports.main = main
