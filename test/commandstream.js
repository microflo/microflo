/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var microflo = require("../lib/microflo");
var assert = require("assert");
var fbp = require("fbp");

var componentLib = new microflo.componentlib.ComponentLibrary(require("../microflo/components.json"), "./microflo");
componentLib.load();

var assertStreamsEqual = function(actual, expected) {
    assert.equal(actual.length, expected.length);
    assert(actual.length%8 === 0);
    for (var i=0; i<actual.length; i+=8) {
        var a = actual.slice(i,i+8).toJSON().toString();
        var e = expected.slice(i,i+8).toJSON().toString();
        assert.equal(a, e, "Command " + i/8 + " : " + a + " != " + e);
    }
}

describe('Commandstream generation', function(){
  describe('from a simple input FBP', function(){
      var input = "in(SerialIn) OUT -> IN f(Forward) OUT -> IN out(SerialOut)";
      var expect = Buffer([117,67,47,70,108,111,48,49,
                           10,0,0,0,0,0,0,0,
                           15,1,0,0,0,0,0,0,
                           11,8,0,0,0,0,0,0,
                           11,3,0,0,0,0,0,0, 11,9,0,0,0,0,0,0,
                           12,1,2,0,0,0,0,0, 12,2,3,0,0,0,0,0,
                           14,0,0,0,0,0,0,0 ]);
      it('parsing should give known valid output', function(){
          var out = microflo.commandstream.cmdStreamFromGraph(componentLib, fbp.parse(input));
          assertStreamsEqual(out, expect);
      })
  })
  describe('from a input FBP with subgraph', function(){
          var input = "potmeter(AnalogReadPoller) OUT -> IN map(MapLinear) OUT -> DUTYCYCLE led(PwmWrite)";
          var expect = Buffer([117,67,47,70,108,111,48,49,
                               10,0,0,0,0,0,0,0,
                               15,1,0,0,0,0,0,0,
                               0x0b,0x64,0,0,0,0,0,0,
                               0x0b,7,1,0,0,0,0,0,
                               0x0b,2,1,0,0,0,0,0,
                               0x0c,2,3,0,0,0,0,0,
                               13,2,0,7,0x0a,0,0,0,
                               17,1,1,0,3,0,0,0,
                               17,0,1,1,3,1,0,0,
                               0x0b,17,0,0,0,0,0,0,
                               0x0b,1,0,0,0,0,0,0,
                               0x0c,1,4,0,0,0,0,0,
                               0x0c,4,5,0,0,0,0,0,
                               0x0e,0,0,0,0,0,0,0
                              ]);
        it('parsing should give known valid output', function(){
            var out = microflo.commandstream.cmdStreamFromGraph(componentLib, fbp.parse(input));
            assertStreamsEqual(out, expect);
        })
  })

})
