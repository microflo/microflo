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

describe 'ComponentLibrary', ->
  describe 'listing all components', ->

    normal = componentLib.listComponents(false, true)
    all = componentLib.listComponents(true, true)
    skipped = all.filter (n) -> normal.indexOf(n) == -1

    it 'should give above 20 normal', ->
      chai.expect normal.length > 20, 'normal.length ' + normal.length
    it 'Max,Invalid should be skipped', ->
      chai.expect normal.indexOf('_Max') == -1
      chai.expect normal.indexOf('Invalid') == -1
      chai.expect skipped.indexOf('_Max') != -1
      chai.expect skipped.indexOf('Invalid') != -1
    it 'Split,Forward should be available', ->
      chai.expect skipped.indexOf('Split') == -1
      chai.expect skipped.indexOf('Forward') == -1
      chai.expect normal.indexOf('Split') != -1
      chai.expect normal.indexOf('Forward') != -1
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
          chai.expect defs[I].id != defs[J].id, I + ' has same ID as ' + J + ' : ' + defs[I].id
          j++
        i++

