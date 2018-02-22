
EventEmitter = require('./util').EventEmitter

mqtt = require 'mqtt'
url = require 'url'

class MqttTransport extends EventEmitter
  constructor: (fullUrl) ->
    super()

    @client = null

    u = url.parse fullUrl
    @brokerUrl = u.protocol + '//' + u.host
    @topicBase = u.path.substring(1) # remove leading /

  getTransportType: ->
    return 'MQTT'

  connect: (callback) -> 
    @client  = mqtt.connect @brokerUrl

    @client.on 'message', (topic, message) =>
      @emit 'data', message

    @client.on 'connect', () =>
      @client.subscribe @topicBase+'send'
      return callback null

  write: (data, callback) ->
    @client.publish @topicBase+'receive', data
    return callback null

  close: (callback) ->
    @client.end()
    return callback null


openTransport = (fullUrl, callback) ->
  transport = new MqttTransport fullUrl
  transport.connect (err) ->
    return callback err, transport

module.exports =
    openTransport: openTransport
