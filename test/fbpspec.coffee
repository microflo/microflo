fbpspec = require 'fbp-spec'
rt = require './runtimes/linux.json'

fbpspec.mocha.run(rt, './test', { starttimeout: 20*1000 });
