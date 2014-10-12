/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
    var chai = require('chai');
    var microflo = require("../lib/microflo");
} else {
    var microflo = require("microflo");
}

describeIfSimulator = (typeof microflo.simulator.RuntimeSimulator !== 'undefined') ? describe : describe.skip;

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
        simulator.device.open(function() {
            done();
        });
    })
    after(function (done) {
        simulator.device.close(function() {
            simulator.stop();
            done();
        });
    })

    it('should load 3 nodes', function(finish){
        //simulator.io.state.digitalOutputs[13] = true;
        simulator.uploadFBP(prog, function (err) {
            // var nodes = simulator.network.getNodes();
            console.log('finish?', err);
            // chai.expect(nodes.length).to.equal(3);
            finish();
        });
    })
    it.skip('and set initial output LOW', function(){
        chai.expect(simulator.io.state.digitalOutputs[13]).to.equal(false);
    })
    it('should go HIGH when timer expires', function(finish){
        this.timeout(5000);
        simulator.io.once('digital', function (digitalOutputs) {
            chai.expect(digitalOutputs[13]).to.equal(true);
            finish();
        });
        simulator.io.forwardTime(300, function() { });
    })
    it('and then toggle LOW when timer expires again', function(finish){
        this.timeout(5000);
        simulator.io.once('digital', function (digitalOutputs) {
            chai.expect(digitalOutputs[13]).to.equal(false);
            finish();
        });
        simulator.io.forwardTime(300, function() { });
    })
})
