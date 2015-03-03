### MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license
###

generate = null
if typeof process != 'undefined' and process.execPath and process.execPath.indexOf('node') != -1
  chai = require('chai')
  generate = require('../lib/generate')
else
  generate = require('microflo/lib/generate')

describe 'C++ header file generation', ->
  describe 'enumeration without values', ->
    out = generate.generateEnum 'MyEnum', 'My',
      Foo: {}
      Bar: {}
    it 'should become a C++ enum', ->
      chai.expect(out).to.equal 'enum MyEnum {\n    MyFoo,\n    MyBar\n};\n'
