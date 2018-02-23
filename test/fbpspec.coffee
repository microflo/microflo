fbpspec = require 'fbp-spec'
linux = require './runtimes/linux.json'
linuxMqtt = require './runtimes/linux-mqtt.json'

describe 'fbp-spec: Linux serial', ->
    fbpspec.mocha.run(linux, './test', { starttimeout: 20*1000 });

describe 'fbp-spec: Linux MQTT', ->
    fbpspec.mocha.run(linuxMqtt, './test', { starttimeout: 20*1000 });
