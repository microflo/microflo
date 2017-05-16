
util = require './util'
fbp = require 'fbp'

fs = require 'fs'
path = require 'path'
declarec = require 'declarec'

trim = (str) -> str.replace /^\s+|\s+$/g, ""

loadString = (data, type) ->
    def = null
    if type is ".fbp"
        #data = (trim d for d in data.split '\n').join '\n'
        def = fbp.parse data
    else if type in ['.cpp', '.c', '.h', '.hpp']
        raw = declarec.extractDefinition data, 'microflo_graph', 'c'
        # TODO: use higher level interface, .loadDefinitionsFromString()
        return console.log 'ERROR: only main graph supported when embedded in cpp' if raw.length != 1
        def = loadString raw[0].content, '.fbp' if raw[0].format == 'fbp'
        def = loadString raw[0].content, '.json' if raw[0].format == 'json'
    else
        def = JSON.parse data
    return def

loadFile = (filename, callback) ->
    fs.readFile filename, { encoding: "utf8" }, (err, data) ->
        return callback err if err
        type = path.extname filename
        def = loadString data, type
        def.properties = {} if not def.properties
        basename = path.basename(filename, path.extname(filename))
        def.properties.name = basename if not def.properties.name
        return callback null, def

exports.loadFile = loadFile
exports.loadString = loadString

