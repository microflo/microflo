### MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license
###

isBrowser = -> return typeof process != 'undefined' and process.execPath and process.execPath.indexOf('node') != -1
componentlib = null
if isBrowser()
  chai = require 'chai'
  componentlib = require '../lib/componentlib'
else
  componentlib = require 'microflo/lib/componentlib'
componentLib = new componentlib.ComponentLibrary
library = __dirname + '/../microflo/core/components/arduino-standard.json'

describe 'ComponentLibrary', ->
  normal = []
  all = []
  skipped = []

  before (done) ->
    componentLib.loadSetFile library, (err) ->
      chai.expect(err).to.be.a 'null'
      normal = componentLib.listComponents(false, true)
      all = componentLib.listComponents(true, true)
      skipped = all.filter (n) -> normal.indexOf(n) == -1
      done()
  after (done) ->
    done()

  describe 'listing all components', ->

    it 'should give above 20 components', ->
      chai.expect(normal.length).to.be.above 20
    it 'Max,Invalid should be skipped', ->
      chai.expect(normal).to.not.contain '_Max'
      chai.expect(normal).to.not.contain 'Invalid'
    it 'Split,Forward should be available', ->
      chai.expect(normal).to.contain 'Split'
      chai.expect(normal).to.contain 'Forward'
      chai.expect(skipped).to.not.contain 'Split'
      chai.expect(skipped).to.not.contain 'Forward'
    it 'no components have same id', ->
      defs = componentLib.getComponents true
      i = 0
      while i < all.length
        j = 0
        while j < all.length
          I = all[i]
          J = all[j]
          if I == J
            j++
            continue
          msg = I + ' has same ID as ' + J + ' : ' + defs[I].id
          chai.expect(defs[I].id).to.not.equal defs[J].id, msg
          j++
        i++

