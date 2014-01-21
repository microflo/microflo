/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var assert = require("assert")
var microflo = require("../lib/microflo");
var componentLib = new microflo.componentlib.ComponentLibrary(require("../microflo/components.json"), "./microflo")

describe('ComponentLibrary', function(){
    describe('listing all components', function(){
        var normal = componentLib.listComponents(false, true);
        var all = componentLib.listComponents(true, true);
        var skipped = all.filter(function(n) { return normal.indexOf(n) === -1 });

        it('should give above 20 normal', function(){
            assert.ok(normal.length > 20, "normal.length "+normal.length);
        })
        it('and 3 skipped', function(){
            assert.equal(skipped.length, 3);
        })
        it("Max,Invalid should be skipped", function() {
            assert.ok(normal.indexOf("_Max") === -1);
            assert.ok(normal.indexOf("Invalid") === -1);
            assert.ok(skipped.indexOf("_Max") !== -1);
            assert.ok(skipped.indexOf("Invalid") !== -1);
        })
        it("Split,Forward should be available", function() {
            assert.ok(skipped.indexOf("Split") === -1);
            assert.ok(skipped.indexOf("Forward") === -1);
            assert.ok(normal.indexOf("Split") !== -1);
            assert.ok(normal.indexOf("Forward") !== -1);
        })
        it("no components have same id", function() {
            var defs = componentLib.getComponents(true);
            for (var i=0; i<all.length; i++) {
                for (var j=0; j<all.length; j++) {
                    var I = all[i];
                    var J = all[j];
                    if (I === J) {
                        continue;
                    }
                    assert.ok(defs[I].id !== defs[J].id, I+" has same ID as "+J + " : " + defs[I].id);
                }
            }
        })
    })
})

