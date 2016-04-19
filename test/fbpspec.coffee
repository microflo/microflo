fbpspec = require 'fbp-spec'
rt = require './runtimes/simulator.json'

fbpspec.mocha.run(rt, './test', { starttimeout: null });
