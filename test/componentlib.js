/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var assert = require("assert")
var microflo = require("../microflo");

describe('ComponentLibrary', function(){
    describe('listing all components', function(){
        var normal = microflo.componentLib.listComponents();
        var all = microflo.componentLib.listComponents(true);
        var skipped = all.filter(function(n) { return normal.indexOf(n) === -1 });

        it('should give above 20 normal', function(){
            assert.ok(normal.length > 20, "normal.length "+normal.length);
        })
        it('and 4 skipped', function(){
            assert.equal(skipped.length, 4);
        })
        it("Max,Invalid should be skipped", function() {
            assert.ok(normal.indexOf("Max") === -1);
            assert.ok(normal.indexOf("Invalid") === -1);
            assert.ok(skipped.indexOf("Max") !== -1);
            assert.ok(skipped.indexOf("Invalid") !== -1);
        })
        it("Split,Forward should be available", function() {
            assert.ok(skipped.indexOf("Split") === -1);
            assert.ok(skipped.indexOf("Forward") === -1);
            assert.ok(normal.indexOf("Split") !== -1);
            assert.ok(normal.indexOf("Forward") !== -1);
        })
    })
})

