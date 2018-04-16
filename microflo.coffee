# MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license

require "coffeescript/register"

fs = require("fs")
path = require("path")
cmdFormat = require("./microflo/commandformat.json")
microflo = require("./lib/microflo")
commander = require("commander")
pkginfo = require("pkginfo")(module)
uuid = require('uuid')
bluebird = require('bluebird')

setupRuntimeCommand = (env) ->
    serialPortToUse = env.serial or "auto"
    port = env.port or 3569
    debugLevel = env.debug or "Error"
    ip = env.ip or "127.0.0.1"
    baud = parseInt(env.baudrate) or 115200
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


writeFile = (path, data) ->
  return new Promise((resolve, reject) ->
    fs.writeFile path, data, (err) ->
      return reject if err
      return resolve()
  )

generateFwCommand = (inputFile, output, env) ->

    callback = (err) ->
        throw err if err

    target = env.target or "arduino"
    if output[output.length-1] == '/'
      output += 'main.cpp'

    if env.library
        console.error('REMOVED. --library has been removed. Use --components SOMEDIR --components ANOTHER instead')

    componentLib = new microflo.componentlib.ComponentLibrary()    
    options =
        ignoreComponents: env.ignoreComponent
        ignoreFiles: env.ignoreComponentFile
    componentLib.loadPaths env.components, options, (err) ->
        return callback err if err

        componentLib.loadFile inputFile # might have components inline

        microflo.definition.loadFile inputFile, (err, graph) ->
            return callback err if err

            prepends = env.prependFile.map (p) -> return [p, fs.readFileSync(p)]
            gen = microflo.generate.generateOutput componentLib, graph, output, target, env.mainfile, env.enableMaps, prepends
            fs.mkdirSync gen.directory unless fs.existsSync(gen.directory)

            bluebird.map(Object.keys(gen.files), (path) -> writeFile(path, gen.files[path]))
            .asCallback(callback)

updateDefsCommand = (directory) ->
    contents = microflo.generate.getDefinitions()
    fs.writeFileSync directory + "/commandformat-gen.h", contents

collectMultiple = (n, old) ->
    return old.concat([n])

main = ->
    commander.version module.exports.version
    commander.command("update-defs")
        .description("Update internal generated definitions")
        .action updateDefsCommand

    commander.command("generate <INPUT> <OUTPUT>")
        .description("Generate MicroFlo firmware code, with embedded graph.")
        .option("-m, --mainfile <FILE.hpp>", "File to include for providing main()")
        .option("-l, --library <FILE.json>", "DEPRECATED, use --components instead") # TODO: remove
        .option("-t, --target <platform>", "Target platform: (arduino|linux|etc)")
        .option("--enable-maps", "Enable graph info maps")
        .option("--components <FILE|DIR>", "Add this to component search path", collectMultiple, ['components'])
        .option("--ignore-component <NAME>", "Ignore component with name", collectMultiple, [])
        .option("--ignore-component-file <FILE>", "Ignore component file", collectMultiple, [])
        .option("--prepend-file <FILE>", "Prepend contents of file to generated output", collectMultiple, [])
        .action generateFwCommand

    commander.command("runtime")
        .description("Run as a server supporting FBP runtime protocl, for use Flowhub etc")
        .option("-s, --serial <PORT>", "which serial port to use", String, '')
        .option("-b, --baudrate <RATE>", "baudrate for serialport", Number, 115200)
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
        .option('--wait-connect <seconds>', 'How long to wait before connecting to serial. Useful for Arduino Uno', Number, 0)
        .option("--secret <MYSECRET>", "Authentication token for FBP protocol", String, null)
        .action setupRuntimeCommand
    commander.parse process.argv
    commander.help()  if process.argv.length <= 2

exports.main = main
