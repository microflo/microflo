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
describe('a Blink program', function(){
    var simulator = new microflo.simulator.RuntimeSimulator();
    var prog = "\
            timer(Timer) OUT -> IN toggle(ToggleBoolean)\
            toggle OUT -> IN led(DigitalWrite)\
            '300' -> INTERVAL timer() \
            '13' -> PIN led()";
    before(function (done) {
        simulator.start(0); // no time increments
        simulator.comm.open(function() {
            done();
        });
    })
    after(function (done) {
        simulator.comm.close(function() {
            simulator.stop();
            done();
        });
    })

    it('should load 3 nodes', function(finish){
        //simulator.io.state.digitalOutputs[13] = true;
        simulator.uploadFBP(prog, function (err) {
            // var nodes = simulator.network.getNodes();
            console.log('finish?', err);
            // assert.equal(nodes.length, 3);
            finish();
        });
    })
    it.skip('and set initial output LOW', function(){
        assert.equal(simulator.io.state.digitalOutputs[13], false);
    })
    it('should go HIGH when timer expires', function(finish){
        this.timeout(5000);
        simulator.io.once('digital', function (digitalOutputs) {
            assert.equal(digitalOutputs[13], true);
            finish();
        });
        simulator.io.forwardTime(300, function() { });
    })
    it('and then toggle LOW when timer expires again', function(finish){
        this.timeout(5000);
        simulator.io.once('digital', function (digitalOutputs) {
            console.log('should be false', digitalOutputs);
            assert.equal(digitalOutputs[13], false);
            finish();
        });
        simulator.io.forwardTime(300, function() { });
    })
})
