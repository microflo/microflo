/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var assert = require("assert")
var microflo = require("../lib/microflo");

if (!microflo.simulator.RuntimeSimulator) {
    console.log("Skipping tests needing simulator");
    return;
}

// TODO: get rid of boilerplate. Use noflo-test + should,
// instantiate simulator, load graph automatically?
// TODO: also test that there are no side-effects of program,
// and that output does not fire before it's time
describe.skip('a Blink program', function(){
    var simulator = new microflo.simulator.RuntimeSimulator();
    var prog = "\
            timer(Timer) OUT -> IN toggle(ToggleBoolean)\
            toggle OUT -> IN led(DigitalWrite)\
            '300' -> INTERVAL timer() \
            '13' -> PIN led()";
    simulator.start();

    it('should load 3 nodes', function(finish){
        simulator.io.state.digitalOutputs[13] = true;
        simulator.uploadFBP(prog, function () {
            var nodes = simulator.network.getNodes();
            assert.equal(nodes.length, 3);
            finish();
        });
    })
    it('and set initial output LOW', function(){
        assert.equal(simulator.io.state.digitalOutputs[13], false);
    })
    it('should go HIGH when timer expires', function(finish){
        simulator.io.state.currentTimeMs += 300;
        simulator.io.waitForChange(function () {
            assert.equal(simulator.io.state.digitalOutputs[13], true);
            finish();
        });
    })
    it('and then toggle LOW when timer expires again', function(finish){
        simulator.io.state.currentTimeMs += 300;
        simulator.io.waitForChange(function () {
            assert.equal(simulator.io.state.digitalOutputs[13], false);
            finish();
        });
    })
    after(function () {
        simulator.stop();
    })
})
