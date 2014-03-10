/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
  var chai = require('chai');
  var generate = require('../lib/generate.js')
} else {
  var generate = require('microflo/lib/generate.js')
}

describe('C++ header file generation', function(){
  describe('enumeration without values', function(){
      
    var out = generate.generateEnum("MyEnum", "My", { "Foo": {}, "Bar": {} });
    it('should become a C++ enum', function(){
      chai.expect(out).to.equal("enum MyEnum {\n    MyFoo,\n    MyBar\n};\n");
    })
  })
})
