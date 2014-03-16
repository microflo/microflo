noflo = require 'noflo'
MicroFloComponent = require './MicroFloComponent'
path = require 'path'
fs = require 'fs'

registerComponent = (loader, prefix, name, path) ->
  bound = MicroFloComponent.getComponentForGraph path
  loader.registerComponent prefix, name, bound

module.exports = (loader, done) ->
  # Read MicroFlo graph definitions from package.json
  packageFile = path.resolve loader.baseDir, 'package.json'
  fs.readFile packageFile, 'utf-8', (err, def) ->
    return done() if err
    try
      packageDef = JSON.parse def
    catch e
      return
    return done() unless packageDef.microflo
    return done() unless packageDef.microflo.graphs

    prefix = loader.getModulePrefix packageDef.name

    for name, path of packageDef.microflo.graphs
      registerComponent loader, prefix, name, path
    done()
