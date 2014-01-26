/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var assert = require("assert")
var microflo = require("../lib/microflo");

// TODO: get rid of boilerplate. Use noflo-test + should,
// instantiate simulator, load graph automatically?
describe('a Blink program', function(){
    var simulator = new microflo.simulator.RuntimeSimulator();
    var prog = "\
            timer(Timer) OUT -> IN toggle(ToggleBoolean) \
            toggle() OUT -> IN led(DigitalWrite) \
            '300' -> INTERVAL timer() \
            '13' -> PIN led()";
    simulator.start();

    it('should load', function(finish){
        simulator.uploadFBP(prog, function () {
            var nodes = simulator.network.getNodes();
            assert.equal(nodes.length, 3);
            finish();
        });
    })
})
