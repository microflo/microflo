/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var chai = require("chai")
var fs = require("fs");
var microflo = require("../lib/microflo");

describe('a LedChain program', function(){
    var runtime = new microflo.simulator.RuntimeSimulator();
    runtime.start();

    it('should load 1 node', function(finish){
        runtime.uploadFile("./examples/ledchain.fbp", function () {
            var nodes = runtime.network.getNodes();
            chai.expect(nodes.length).to.equal(1);
            finish();
        });
    });
    describe('sending pin and number of pixels', function(){

        it('should cause component to emit ready', function(){

        });
    });
    describe('setting the color of a pixel', function(finish){

        it('should emit a matching confirmation packet', function(){

        });
    });
    after(function () {
        runtime.stop();
    });
})
