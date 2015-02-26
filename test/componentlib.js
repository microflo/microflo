/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */


if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
    var chai = require('chai');
    var componentlib = require("../lib/componentlib");
} else {
    var componentlib = require("microflo/lib/componentlib");
}

var componentLib = new componentlib.ComponentLibrary()

describe('ComponentLibrary', function(){
    describe('listing all components', function(){
        var normal = componentLib.listComponents(false, true);
        var all = componentLib.listComponents(true, true);
        var skipped = all.filter(function(n) { return normal.indexOf(n) === -1 });

        it('should give above 20 normal', function(){
            chai.expect(normal.length > 20, "normal.length "+normal.length);
        })
        it("Max,Invalid should be skipped", function() {
            chai.expect(normal.indexOf("_Max") === -1);
            chai.expect(normal.indexOf("Invalid") === -1);
            chai.expect(skipped.indexOf("_Max") !== -1);
            chai.expect(skipped.indexOf("Invalid") !== -1);
        })
        it("Split,Forward should be available", function() {
            chai.expect(skipped.indexOf("Split") === -1);
            chai.expect(skipped.indexOf("Forward") === -1);
            chai.expect(normal.indexOf("Split") !== -1);
            chai.expect(normal.indexOf("Forward") !== -1);
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
                    chai.expect(defs[I].id !== defs[J].id, I+" has same ID as "+J + " : " + defs[I].id);
                }
            }
        })
    })
})

