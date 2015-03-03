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

defaultLibrary = path.join(__dirname, "microflo/core/components/arduino-standard.json")

setupRuntimeCommand = (env) ->
    serialPortToUse = env.serial or "auto"
    port = env.port or 3569
    debugLevel = env.debug or "Error"
    ip = env.ip or "127.0.0.1"
    baud = parseInt(env.baudrate) or 9600
    library = env.library or defaultLibrary
    library = path.resolve(process.cwd(), library)
    microflo.runtime.setupRuntime serialPortToUse, baud, port, debugLevel, ip, library, (err, runtime) ->
        throw err  if err


uploadGraphCommand = (graphPath, env) ->
    serialPortName = env.serial or "auto"
    debugLevel = env.debug
    baud = parseInt(env.baudrate) or 9600
    microflo.runtime.uploadGraphFromFile graphPath, serialPortName, baud, debugLevel

generateFwCommand = (inputFile, outputDir, env) ->

    target = env.target or "arduino"
    outputFile = outputDir + "/main.cpp"
    library = env.library or defaultLibrary
    library = path.resolve(process.cwd(), library)
    componentLib = new microflo.componentlib.ComponentLibrary()
    componentLib.loadSetFile library, (err) ->
        throw err  if err
        componentLib.loadFile inputFile
        microflo.generate.updateComponentLibDefinitions componentLib, outputDir, "createComponent"
        microflo.generate.generateOutput componentLib, inputFile, outputFile, target


registerRuntimeCommand = (user, env) ->
    ip = env.ip or "auto"
    port = parseInt(env.port) or 3569
    label = env.label or "MicroFlo"
    id = env.id or process.env["MICROFLO_RUNTIME_ID"]
    user = process.env["FLOWHUB_USER_ID"]  unless user
    rt = microflo.runtime.createFlowhubRuntime(user, ip, port, label)
    unless id
        microflo.runtime.registerFlowhubRuntime rt, (err, ok) ->
        if err
            console.log "Could not register runtime with Flowhub", err
            process.exit 1
        else
            console.log "Runtime registered with id:", rt.runtime.id


generateComponentLib = (componentlibJsonFile, componentlibOutputPath, factoryMethodName, env) ->
    componentLibraryDefinition = undefined
    componentLibrary = undefined

    # load specified component library Json definition
    componentLibraryDefinition = require(componentlibJsonFile)
    componentLibrary = new microflo.componentlib.ComponentLibrary(componentLibraryDefinition, componentlibOutputPath)
    componentLibrary.load()

    # write component library definitions to external source or inside microflo project
    microflo.generate.updateComponentLibDefinitions componentLibrary, componentlibOutputPath, factoryMethodName

flashCommand = (file, env) ->
    upload = require("./lib/flash.coffee")
    tty = env.serial
    baud = parseInt(env.baudrate) or 115200
    upload.avrUploadHexFile file, tty, baud, (err, written) ->
        console.log err, written

updateDefsCommand = (directory) ->
    microflo.generate.updateDefinitions directory

main = ->
    commander.version module.exports.version
    commander.command("componentlib <JsonFile> <OutputPath> <FactoryMethodName>").description("Generate compilable sources of specified component library from .json definition").action generateComponentLib
    commander.command("update-defs").description("Update internal generated definitions").action updateDefsCommand
    commander.command("generate <INPUT> <OUTPUT>").description("Generate MicroFlo firmware code, with embedded graph.").option("-l, --library <FILE.json>", "Component library file").option("-t, --target <platform>", "Target platform: arduino|linux|avr8").action generateFwCommand
    commander.command("upload").option("-s, --serial <PORT>", "which serial port to use").option("-b, --baudrate <RATE>", "baudrate for serialport").option("-d, --debug <LEVEL>", "set debug level").description("Upload a new graph to a device running MicroFlo firmware").action uploadGraphCommand
    commander.command("runtime").description("Run as a server, for use with the NoFlo UI.").option("-s, --serial <PORT>", "which serial port to use").option("-b, --baudrate <RATE>", "baudrate for serialport").option("-d, --debug <LEVEL>", "set debug level").option("-p, --port <PORT>", "which port to use for WebSocket").option("-i, --ip <IP>", "which IP to use for WebSocket").action setupRuntimeCommand
    commander.command("register [USER]").description("Register the runtime with Flowhub registry").option("-p, --port <PORT>", "WebSocket port").option("-i, --ip <IP>", "WebSocket IP").option("-l, --label <PORT>", "Label to show in UI for this runtime").option("-r, --id <RUNTIME-ID>", "UUID for the runtime").action registerRuntimeCommand
    commander.command("flash <FILE.hex>").description("Flash runtime onto device").option("-s, --serial <PORT>", "which serial port to use").option("-b, --baudrate <RATE>", "baudrate for serialport").action flashCommand
    commander.parse process.argv
    commander.help()  if process.argv.length <= 2

exports.main = main
