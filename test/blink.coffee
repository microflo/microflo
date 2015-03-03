### MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license
###

microflo = null
if typeof process != 'undefined' and process.execPath and process.execPath.indexOf('node') != -1
  chai = require('chai')
  microflo = require('../lib/microflo')
else
  microflo = require('microflo')

describeIfSimulator = if typeof microflo.simulator.RuntimeSimulator != 'undefined' then describe else describe.skip
library = __dirname + '/../microflo/core/components/arduino-standard.json'

# TODO: get rid of boilerplate. Use noflo-test + should,
# instantiate simulator, load graph automatically?
# TODO: also test that there are no side-effects of program,
# and that output does not fire before it's time

describe 'a Blink program', ->
  simulator = new (microflo.simulator.RuntimeSimulator)
  prog = '            timer(Timer) OUT -> IN toggle(ToggleBoolean)            toggle OUT -> IN led(DigitalWrite)            \'300\' -> INTERVAL timer()             \'13\' -> PIN led()'
  before (done) ->
    simulator.library.loadSetFile library, (err) ->
      if err
        throw err
      simulator.start 0
      # no time increments
      simulator.device.open ->
        done()
  after (done) ->
    simulator.device.close ->
      simulator.stop()
      done()

  it 'should load 3 nodes', (finish) ->
    #simulator.io.state.digitalOutputs[13] = true;
    simulator.uploadFBP prog, (err) ->
      # var nodes = simulator.network.getNodes();
      console.log 'finish?', err
      # chai.expect(nodes.length).to.equal(3);
      finish()
  it.skip 'and set initial output LOW', ->
    chai.expect(simulator.io.state.digitalOutputs[13]).to.equal false
  it 'should go HIGH when timer expires', (finish) ->
    @timeout 5000
    simulator.io.once 'digital', (digitalOutputs) ->
      chai.expect(digitalOutputs[13]).to.equal true
      finish()
    simulator.io.forwardTime 300, ->
  it 'and then toggle LOW when timer expires again', (finish) ->
    @timeout 5000
    simulator.io.once 'digital', (digitalOutputs) ->
      chai.expect(digitalOutputs[13]).to.equal false
      finish()
    simulator.io.forwardTime 300, ->
