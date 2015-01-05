# MicroFlo - Flow-Based Programming for microcontrollers
# * Copyright (c) 2014 Jon Nordby <jononor@gmail.com>
# * MicroFlo may be freely distributed under the MIT license
#
exports.isBrowser = isBrowser = ->
  not (typeof (process) isnt "undefined" and process.execPath and process.execPath.indexOf("node") isnt -1)

exports.EventEmitter = (if exports.isBrowser() then require("emitter") else require("events").EventEmitter)
Buffer = require("buffer").Buffer

# From https://github.com/isaacs/inherits, license: ISC
if typeof Object.create is "function"

  # implementation from standard node.js 'util' module
  inherits = (ctor, superCtor) ->
    ctor.super_ = superCtor
    ctor:: = Object.create(superCtor::,
      constructor:
        value: ctor
        enumerable: false
        writable: true
        configurable: true
    )
    return
else
  # old school shim for old browsers
  inherits = (ctor, superCtor) ->
    ctor.super_ = superCtor
    TempCtor = ->

    TempCtor:: = superCtor::
    ctor:: = new TempCtor()
    ctor::constructor = ctor
    return

# From https://github.com/GoogleChrome/chrome-app-samples/, license: BSD
arrayBufferToString = (buffer) ->
  array = new Uint8Array(buffer)
  str = ""
  i = 0

  while i < array.length
    str += String.fromCharCode(array[i])
    ++i
  str

stringToArrayBuffer = (string) ->
  buffer = new ArrayBuffer(string.length)
  bufferView = new Uint8Array(buffer)
  i = 0

  while i < string.length
    bufferView[i] = string.charCodeAt(i)
    i++
  buffer

bufferToArrayBuffer = (buffer) ->
  arrayBuffer = new ArrayBuffer(buffer.length)
  arrayBufferView = new Uint8Array(arrayBuffer)
  i = 0

  while i < buffer.length
    arrayBufferView[i] = buffer[i]
    i++
  arrayBuffer

arrayBufferToBuffer = (arrayBuffer) ->
  view = new Uint8Array(arrayBuffer)
  buffer = new Buffer(view.length)
  i = 0

  while i < view.length
    buffer[i] = view[i]
    i++
  buffer

exports.Buffer = Buffer
if exports.isBrowser()
  exports.inherits = inherits
  exports.stringToArrayBuffer = stringToArrayBuffer
  exports.arrayBufferToString = arrayBufferToString
  exports.arrayBufferToBuffer = arrayBufferToBuffer
  exports.bufferToArrayBuffer = bufferToArrayBuffer
else
  exports.inherits = require("util").inherits
