/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var cmdFormat = require("./microflo/commandformat.json");
var components = require("./microflo/components.json");
var c = require("./lib/componentlib");
var componentLib = new c.ComponentLibrary(components, "./microflo");

if (process.argv[2] == "update-defs") {
    // Special, runs before dependencies has been installed and thus cannot import any of them.
    require("./lib/generate").updateDefinitions(componentLib, "./microflo");
    process.exit(0);
}

var microflo = require("./lib/microflo");
var commander = require("commander");
var pkginfo = require('pkginfo')(module);

var setupRuntimeCommand = function(env) {
    var serialPortToUse = env.parent.serial || "auto";
    var port = env.parent.port || 3569;
    var debugLevel = env.parent.debug || "Error";
    var ip = env.parent.ip || "127.0.0.1"

    microflo.runtime.setupRuntime(serialPortToUse, port, debugLevel, ip);
}

var uploadGraphCommand = function(graphPath, env) {
    var serialPortName = env.parent.serial || "auto";
    var debugLevel = env.parent.debug

    microflo.runtime.uploadGraphFromFile(graphPath, serialPortName, debugLevel);
}

var generateFwCommand = function(env) {
    var inputFile = process.argv[3];
    var outputFile = process.argv[4] || inputFile.replace(path.extname(inputFile), "");
    var target = process.argv[5] || 'arduino'

    microflo.runtime.generateOutput(componentLib, inputFile, outputFile, target);
}

var main = function() {
    componentLib.load();

    commander
        .version(module.exports.version)
        .option('-s, --serial <PORT>', 'which serial port to use')
        .option('-d, --debug <LEVEL>', 'set debug level')
        .option('-p, --port <PORT>', 'which port to use for WebSocket')
        .option('-i, --ip <IP>', 'which IP to use for WebSocket')

    commander
        .command('generate')
        .description('Generate MicroFlo firmware code, with embedded graph.')
        .action(generateFwCommand);

    commander
        .command('upload')
        .description('Upload a new graph to a device running MicroFlo firmware')
        .action(uploadGraphCommand);

    commander
        .command('runtime')
        .description('Run as a server, for use with the NoFlo UI.')
        .action(setupRuntimeCommand)

    commander.parse(process.argv)
    if (process.argv.length <= 2) {
        commander.help()
    }
}

main();


