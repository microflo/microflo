/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var fs = require("fs");
var cmdFormat = require("./microflo/commandformat.json");
var microflo = require("./lib/microflo");
var commander = require("commander");
var pkginfo = require('pkginfo')(module);

var componentLib = null;

var setupRuntimeCommand = function(env) {
    var serialPortToUse = env.serial || "auto";
    var port = env.port || 3569;
    var debugLevel = env.debug || "Error";
    var ip = env.ip || "127.0.0.1"
    var baud = parseInt(env.baudrate) || 9600

    microflo.runtime.setupRuntime(serialPortToUse, baud, port, debugLevel, ip);
}

var uploadGraphCommand = function(graphPath, env) {
    var serialPortName = env.serial || "auto";
    var debugLevel = env.debug
    var baud = parseInt(env.baudrate) || 9600

    microflo.runtime.uploadGraphFromFile(graphPath, serialPortName, baud, debugLevel);
}

var generateFwCommand = function(env) {
    var inputFile = process.argv[3];
    var outputFile = process.argv[4] || inputFile.replace(path.extname(inputFile), "");
    var target = process.argv[5] || 'arduino'

    microflo.runtime.generateOutput(componentLib, inputFile, outputFile, target);
}

var registerRuntimeCommand = function(user, env) {
    var ip = env.ip || 'auto';
    var port = parseInt(env.port) || 3569;
    var label = env.label || "MicroFlo"

    console.log(env.ip);

    var rt = microflo.runtime.createFlowhubRuntime(user, ip, port, label);
    microflo.runtime.registerFlowhubRuntime(rt, function(err, ok) {
        if (err) {
            console.log("Could not register runtime with Flowhub", err);
            process.exit(1);
        } else {
            console.log("Runtime registered with id:", rt.runtime.id);
        }
    });
}

var updateDefsCommand = function(env) {
    // FIXME: move this code somewhere else, make more general
    // For now, default to all components (like before)
    if (typeof env.library !== 'undefined') {
        var included = JSON.parse(fs.readFileSync(env.library)).components;
        var filtered = {};
        included.forEach(function(name){
            filtered[name] = componentLib.definition.components[name];
        });
        componentLib.definition.components = filtered;
    }

    microflo.generate.updateDefinitions(componentLib, "./microflo");
}

var main = function() {

    componentLib = new microflo.componentlib.ComponentLibrary(null, "./microflo");
    componentLib.load();

    commander
        .version(module.exports.version)

    commander
        .command('update-defs')
        .description('(internal use) Update the generated C++ headers from .json definitions.')
        .option('-l, --library <FILE>', 'which component library to use')
        .action(updateDefsCommand);

    commander
        .command('generate')
        .description('Generate MicroFlo firmware code, with embedded graph.')
        .action(generateFwCommand);

    commander
        .command('upload')
        .option('-s, --serial <PORT>', 'which serial port to use')
        .option('-b, --baudrate <RATE>', 'baudrate for serialport')
        .option('-d, --debug <LEVEL>', 'set debug level')
        .description('Upload a new graph to a device running MicroFlo firmware')
        .action(uploadGraphCommand);

    commander
        .command('runtime')
        .description('Run as a server, for use with the NoFlo UI.')
        .option('-s, --serial <PORT>', 'which serial port to use')
        .option('-b, --baudrate <RATE>', 'baudrate for serialport')
        .option('-d, --debug <LEVEL>', 'set debug level')
        .option('-p, --port <PORT>', 'which port to use for WebSocket')
        .option('-i, --ip <IP>', 'which IP to use for WebSocket')
        .action(setupRuntimeCommand)

    commander
        .command('register <USER>')
        .description('Register the runtime with Flowhub registry')
        .option('-p, --port <PORT>', 'WebSocket port')
        .option('-i, --ip <IP>', 'WebSocket IP')
        .option('-l, --label <PORT>', 'Label to show in UI for this runtime')
        .action(registerRuntimeCommand)

    commander.parse(process.argv)
    if (process.argv.length <= 2) {
        commander.help()
    }
}

main();


