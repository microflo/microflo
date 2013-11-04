/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var microflo = require("../microflo");
var addon = require("../build/Release/MicroFloCc.node");
var assert = require("assert");
var fbp = require("fbp");

describe('Commandstream generation', function(){
  describe('from a simple input FBP', function(){
      var input = "in(SerialIn) OUT -> IN f(Forward) OUT -> IN out(SerialOut)";
      var expect = Buffer([117,67,47,70,108,111,48,49,
                           10,0,0,0,0,0,0,0, 11,8,0,0,0,0,0,0,
                           11,3,0,0,0,0,0,0, 11,9,0,0,0,0,0,0,
                           12,0,1,0,0,0,0,0, 12,1,2,0,0,0,0,0,
                           14,0,0,0,0,0,0,0 ]);
      it('parsing should give known valid output', function(){
          var out = microflo.cmdStreamFromGraph(microflo.componentLib, fbp.parse(input));
          assert.equal(out.toString("hex"), expect.toString("hex"));
    })
  })
})
