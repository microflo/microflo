### MicroFlo - Flow-Based Programming for microcontrollers
# Copyright (c) 2014 Jon Nordby <jononor@gmail.com>
# MicroFlo may be freely distributed under the MIT license
###

util = require './util'
if util.isBrowser()
  # Requires Chrome APIs and permissions
  if 'chrome' in window and 'serial' in window.chrome
    serial = window.chrome.serial
else
  SerialPort = require 'serialport'

isLikelyArduinoSerial = (e) ->
  e.comName.indexOf('usbserial') != -1 or e.comName.indexOf('usbmodem') != -1

guessSerialPort = (wantedPortName, callback) ->
  SerialPort.list (err, ports) ->
    if err
      callback err
      return
    else
      if ports.length == 0
        callback 'No serial port found', undefined, undefined
        return
      p = undefined
      ports.forEach (port) ->
        if wantedPortName and wantedPortName != 'auto' and wantedPortName == port.comName
          p = port.comName
        return
      if p
        callback err, p, ports
        return
      else if wantedPortName and wantedPortName != 'auto'
        console.log 'WARN: unable to find serial port: ', wantedPortName
      preferred = ports.filter(isLikelyArduinoSerial)
      p = if preferred.length > 0 then preferred[0].comName else ports[0].comName
      callback err, p, ports
      return
  return

getSerial = (serialPortToUse, baudRate, cb) ->
  `var serial`
  console.log 'Using serial baudrate with ' + serialPortToUse, baudRate
  serial = undefined
  guessSerialPort serialPortToUse, (err, portName, ports) ->

    if serialPortToUse.indexOf('.microflo') != -1
      portName = serialPortToUse

    if err
      console.log 'No serial port found!: ', err
      if cb
        cb err, undefined
    else
      ports = ports.map((item) ->
        item.comName
      )
      console.log 'Available serial ports: ', ports
      console.log 'Using serial port: ' + portName
      serial = new SerialPort portName, { baudrate: baudRate }, (err) ->
        if cb
          cb err, serial
        return

      serial.getTransportType = ->
        'Serial'

    return
  ->
    serial

listChromeSerial = (callback) ->

  f = (ports) ->
    devices = []
    i = 0
    while i < ports.length
      port = ports[i]
      if port.path.search('/dev/ttyS') != -1
                i++
        continue
      devices.push port.path
      i++
    callback devices

  chrome.serial.getDevices f
  return

listNodeSerial = (callback) ->
  throw new Error('listNodeSerial: Not implemented')
  return

getChromeSerial = (serialPortToUse, baudRate, readyCallback) ->
  # Hacky API compat with node-serialport subset that we use
  transport = {}
  transport.connectionId = null
  transport.listeners = 'data': null

  transport.write = (data, callback) ->
    #console.log("Trying to send: ", data);
    data = util.bufferToArrayBuffer(data)
    #console.log("Sending", util.arrayBufferToString(data));
    chrome.serial.send transport.connectionId, data, (sendinfo, error) ->
      #console.log("Attempted send: ", sendinfo, error);
      if typeof callback != 'undefined'
        callback error, sendinfo
      return
    return

  transport.close = (callback) ->
    if !transport.connectionId
      return
    chrome.serial.disconnect transport.connectionId, callback
    return

  transport.removeAllListeners = (event) ->
    transport.listeners[event] = null
    return

  transport.on = (event, callback) ->
    transport.listeners[event] = callback
    return

  transport.emit = (event, arg) ->
    cb = transport.listeners[event]
    if cb
      cb arg
    return

  transport.getTransportType = ->
    'Serial'

  onConnect = (connectionInfo) ->
    if connectionInfo
      transport.connectionId = connectionInfo.connectionId
      readyCallback null, transport
    else
      e = new Error('Could not connect to serialport')
      readyCallback e, null

  onReceiveCallback = (info) ->
    if info.connectionId == connectionId and info.data
      data = util.arrayBufferToBuffer(info.data)
      #console.log("received", data);
      transport.emit 'data', data
    return

  chrome.serial.onReceive.addListener onReceiveCallback
  chrome.serial.connect serialPortToUse, { 'bitrate': baudRate }, onConnect
  ->
    transport

isSupported = ->
  util.isBrowser() and 'chrome' in window and 'serial' in window.chrome or !util.isBrowser()

if util.isBrowser()
  module.exports.listDevices = listChromeSerial
  module.exports.openTransport = getChromeSerial
else
  module.exports.listDevices = listNodeSerial
  module.exports.openTransport = getSerial
module.exports.isSupported = isSupported
