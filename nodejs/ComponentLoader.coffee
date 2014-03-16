noflo = require 'noflo'
MicroFloComponent = require './MicroFloComponent'
path = require 'path'
fs = require 'fs'

registerComponent (loader, name, path) ->
  bound = MicroFloComponent.getComponentForGraph path
  loader.registerComponent 'microflo', name, bound

module.exports = (loader) ->
  # Read MicroFlo graph definitions from package.json
  packageFile = path.resolve loader.baseDir, 'package.json'
  fs.readFile packageFile, (err, def) ->
    return if err
    try
      packageDef = JSON.parse def
    catch e
      return
    return unless packageDef.microflo
    return unless packageDef.microflo.graphs

    for name, path of packageDef.microflo.graphs
      registerComponent loader, name, path
