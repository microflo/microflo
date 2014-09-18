microflo = require '../lib/microflo'
chai = require 'chai'

describeIfSimulator = if microflo.simulator.RuntimeSimulator then describe else describe.skip

describeIfSimulator 'Device communication', ->
  runtime = new microflo.simulator.RuntimeSimulator
  transport = runtime.transport
  graph = null
  comm = new microflo.devicecommunication.DeviceCommunication transport, graph

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

