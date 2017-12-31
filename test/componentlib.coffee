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

describe 'ComponentLibrary', ->
  componentLib = null

  beforeEach ->
    componentLib = new componentlib.ComponentLibrary

  testComponents = ['DigitalWrite', 'Forward', 'Split', 'Timer', 'ToggleBoolean' ]

  describe 'passing directory', ->

    it 'loads all components in directory', (done) ->
      paths = ['test/components']
      componentLib.loadPaths paths, {}, (err) ->
        return done err if err
        c = componentLib.listComponents()
        chai.expect(c).to.include.members testComponents
        chai.expect(c).to.have.length testComponents.length
        return done()

  describe 'passing non-existent directory', ->
    it 'should error', (done) ->
      paths = ['test/components/bogus22', 'examples/embedding.cpp']
      componentLib.loadPaths paths, {}, (err) ->
        chai.expect(err).to.exist
        chai.expect(err.message).to.include 'ENOENT'
        chai.expect(err.message).to.include 'bogus22'
        return done()

  describe 'passing dir and files', ->
    it 'loads both', (done) ->
      paths = ['test/components', 'examples/embedding.cpp']
      componentLib.loadPaths paths, {}, (err) ->
        return done err if err
        c = componentLib.listComponents()
        chai.expect(c).to.include.members testComponents
        chai.expect(c).to.include.members ['PlusOne', 'PrintInteger']
        return done()

  describe 'passing ignoreFiles and ignoreComponents', ->
    it 'loads everything but listed', (done) ->
      paths = ['test/components', 'examples/embedding.cpp']
      options =
        ignoreFiles: ['test/components/Split.hpp']
        ignoreComponents: ['ToggleBoolean']
      componentLib.loadPaths paths, options, (err) ->
        return done err if err
        c = componentLib.listComponents()
        chai.expect(c).to.include.members ['PlusOne', 'Forward']
        chai.expect(c).to.not.include.members ['Split', 'ToggleBoolean']
        return done()

describe 'ComponentLibrary.loadSetFile', ->

  normal = []
  all = []
  skipped = []

  componentLib = new componentlib.ComponentLibrary

  before (done) ->
    library = './test/components/components.json'

    componentLib.loadSetFile library, (err) ->
      chai.expect(err).to.be.a 'null'
      normal = componentLib.listComponents(false, true)
      all = componentLib.listComponents(true, true)
      skipped = all.filter (n) -> normal.indexOf(n) == -1
      done()
  after (done) ->
    done()

  describe 'listing all components', ->

    it 'should give above 5 components', ->
      chai.expect(normal.length).to.be.above 4
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

