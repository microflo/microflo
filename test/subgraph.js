/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var assert = require("assert")
var microflo = require("../lib/microflo");

describe('a program using subgraph component', function(){
    var runtime = new microflo.simulator.RuntimeSimulator();
    runtime.start();

    it('should load 3 nodes', function(finish){
        runtime.io.state.digitalOutputs[13] = true;
        runtime.uploadFile("./examples/analogInOut.fbp", function () {
            var nodes = runtime.network.getNodes();
            assert.equal(nodes.length, 3);
            finish();
        });
    })
    it('and set initial output LOW', function(){
        assert.equal(runtime.io.state.digitalOutputs[13], false);
    })
    /*
    it('should go HIGH when timer expires', function(finish){
        runtime.io.state.currentTimeMs += 300;
        runtime.io.waitForChange(function () {
            assert.equal(simulator.io.state.digitalOutputs[13], true);
            finish();
        });
    })
    it('and then toggle LOW when timer expires again', function(finish){
        runtime.io.state.currentTimeMs += 300;
        runtime.io.waitForChange(function () {
            assert.equal(simulator.io.state.digitalOutputs[13], false);
            finish();
        });
    })
    */
    after(function () {
        runtime.stop();
    })
})
