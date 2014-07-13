# From http://jeelabs.org/2013/03/27/avrdude-in-coffeescript/

{SerialPort} = require 'serialport'
fs = require 'fs'

pageBytes = 128
 
avrUploader = (bytes, tty, baudrate, cb) ->
  serial = new SerialPort tty, baudrate: baudrate
 
  done = (err) ->
    serial.close ->
      cb err
 
  timer = null
  state = offset = 0
  reply = ''
 
  states = [ # Finite State Machine, one function per state
    ->
      ['0 ']
    ->
      buf = new Buffer(20)
      buf.fill 0
      buf.writeInt16BE pageBytes, 12
      ['B', buf, ' ']
    ->
      ['P ']
    ->
      state += 1  if offset >= bytes.length
      buf = new Buffer(2)
      buf.writeInt16LE offset >> 1, 0
      ['U', buf, ' ']
    ->
      state -= 2
      count = Math.min bytes.length - offset, pageBytes
      buf = new Buffer(2)
      buf.writeInt16BE count, 0
      pos = offset
      offset += count
      ['d', buf, 'F', bytes.slice(pos, offset), ' ']
    ->
      ['Q ']
  ]
 
  next = ->
    if state < states.length
      serial.write x  for x in states[state++]()
      serial.flush()
      reply = ''
      timer = setTimeout (-> done state), 300
    else
      done()
 
  serial.on 'open', next
 
  serial.on 'error', done
 
  serial.on 'data', (data) ->
    reply += data
    if reply.slice(-2) is '\x14\x10'
      clearTimeout timer
      next()

hexToBin = (code) ->
  data = ''
  for line in code.split '\n'
    count = parseInt line.slice(1, 3), 16
    if count and line.slice(7, 9) is '00'
      data += line.slice 9, 9 + 2 * count
  new Buffer(data, 'hex')

avrUploadHexFile = (filename, tty, baud, callback) ->
  fs.readFile filename, 'ascii', (err, hex) ->
    bin = hexToBin(hex)
    console.log hex
    avrUploader bin, tty, baud, (err) ->
      return callback err, bin.length

exports.avrUploader = avrUploader
exports.avrUploadHexFile = avrUploadHexFile


