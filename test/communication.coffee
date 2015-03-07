microflo = require '../lib/microflo'
chai = require 'chai'

try
  build = require '../build/emscripten/microflo-runtime.js'
catch e
  console.log 'WARN: could not load Emscripten build', e.toString()

describeIfSimulator = if build? then describe else describe.skip

describeIfSimulator 'Device communication', ->
  runtime = new microflo.simulator.RuntimeSimulator build
  componentLib = new microflo.componentlib.ComponentLibrary
  transport = runtime.transport
  graph = {}
  comm = new microflo.devicecommunication.DeviceCommunication transport, graph, componentLib

  before (done) ->
    runtime.start()
    comm.open () ->
        done()
  after (done) ->
    comm.close () ->
        runtime.stop()
        done()

  describe 'Sending ping', ->
      it 'should return pong', (done) ->
          comm.ping () ->
            done()

