/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
  var chai = require('chai');
  var commandstream = require('../lib/commandstream.js')
  var componentlib = require('../lib/componentlib.js')
} else {
  var commandstream = require('microflo/lib/commandstream.js');
  var componentlib = require('microflo/lib/componentlib.js');
  var microflo = require("microflo/lib/microflo.js");
}

var fbp = require("fbp");

var assertStreamsEqual = function(actual, expected) {
    chai.expect(actual.length).to.equal(expected.length);
    chai.expect(actual.length%8).to.equal(0);
    for (var i=0; i<actual.length; i+=8) {
        var a = actual.slice(i,i+8).toJSON().toString();
        var e = expected.slice(i,i+8).toJSON().toString();
        chai.expect(a).to.equal(e, "Command " + i/8 + " : " + a + " != " + e);
    }
}

describe('Commandstream generation', function(){
  describe('from a simple input FBP', function(){
      var componentLib = new componentlib.ComponentLibrary();
      componentLib.addComponent('SerialIn', { }, 'SerialIn.hpp');
      componentLib.addComponent('Forward', { }, 'Components.hpp');
      componentLib.addComponent('SerialOut', { }, 'Components.hpp');


      var input = "in(SerialIn) OUT -> IN f(Forward) OUT -> IN out(SerialOut)";
      var expect = commandstream.Buffer([
                           10,0,0,0,0,0,0,0,
                           15,1,0,0,0,0,0,0,
                           11,1,0,0,0,0,0,0,
                           11,2,0,0,0,0,0,0, 11,3,0,0,0,0,0,0,
                           12,1,2,0,0,0,0,0, 12,2,3,0,0,0,0,0,
                           20,0,0,0,0,0,0,0 ]);
      it('parsing should give known valid output', function(){
          var out = commandstream.cmdStreamFromGraph(componentLib, fbp.parse(input));
          assertStreamsEqual(out, expect);
      })
  })
})
