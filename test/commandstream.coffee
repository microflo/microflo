### MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license
###

componentlib = null
commandstream = null
if typeof process != 'undefined' and process.execPath and process.execPath.indexOf('node') != -1
  chai = require('chai')
  commandstream = require('../lib/commandstream')
  componentlib = require('../lib/componentlib')
else
  commandstream = require('microflo/lib/commandstream')
  componentlib = require('microflo/lib/componentlib')
  microflo = require('microflo/lib/microflo')
fbp = require('fbp')

assertStreamsEqual = (actual, expected) ->
  chai.expect(actual.length).to.equal expected.length
  chai.expect(actual.length % 8).to.equal 0
  i = 0
  while i < actual.length
    a = actual.slice(i, i + 8).toJSON().toString()
    e = expected.slice(i, i + 8).toJSON().toString()
    chai.expect(a).to.equal e, 'Command ' + i / 8 + ' : ' + a + ' != ' + e
    i += 8
  return

describe 'Commandstream generation', ->
  describe 'from a simple input FBP', ->
    componentLib = new (componentlib.ComponentLibrary)
    componentLib.addComponent 'SerialIn', {}, 'SerialIn.hpp'
    componentLib.addComponent 'Forward', {}, 'Components.hpp'
    componentLib.addComponent 'SerialOut', {}, 'Components.hpp'
    input = 'in(SerialIn) OUT -> IN f(Forward) OUT -> IN out(SerialOut)'
    expect = commandstream.Buffer([
                       10,0,0,0,0,0,0,0,
                       15,1,0,0,0,0,0,0,
                       11,1,0,0,0,0,0,0,
                       11,2,0,0,0,0,0,0, 11,3,0,0,0,0,0,0,
                       12,1,2,0,0,0,0,0, 12,2,3,0,0,0,0,0,
                       20,0,0,0,0,0,0,0 ])
    it 'parsing should give known valid output', ->
      out = commandstream.cmdStreamFromGraph(componentLib, fbp.parse(input))
      assertStreamsEqual out, expect
