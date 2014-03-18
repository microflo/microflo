/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

var assert = require("assert")
var microflo = require("../lib/microflo");
var websocket = require("websocket");

var componentLib = new microflo.componentlib.ComponentLibrary();

describe('WebSocket API', function(){
    before(function () {
        microflo.runtime.setupRuntime(undefined, 9600, 3888);
    });

    after(function () {
        // FIXME: allow teardown
    });
    describe('sending component list command', function(){
        it('should return all available components', function(done){

            var client = new websocket.client();

            client.on('connectFailed', function(error) {
                assert.fail("connect success", "connect failed", error.toString());
            });

            var expectedComponents = componentLib.listComponents();
            var receivedComponent = [];

            client.on('connect', function(connection) {
                connection.on('error', function(error) {
                    assert.fail("connect OK", "connect error", error.toString());
                });
                connection.on('message', function(message) {
                    if (message.type === 'utf8') {
                        var response = JSON.parse(message.utf8Data);
                        assert.equal(response.protocol, "component");
                        assert.equal(response.command, "component");
                        receivedComponent.push(response.payload);

                        if (receivedComponent.length === Object.keys(expectedComponents).length) {
                            // TODO: verify value of component
                            done();
                        }
                    }
                });
                var m = {"protocol": "component", "command": "list"};
                connection.sendUTF(JSON.stringify(m));
            });

            client.connect('ws://localhost:3888/', "noflo");
    })
  })
})
