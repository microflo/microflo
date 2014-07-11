
compiler = require '../compiler/index'

http = require 'http'
chai = require 'chai'
needle = require 'needle'

describe 'Compiler API', ->
  port = 3333
  base = "http://localhost:#{port}"
  server = null

  before (done) ->
    app = compiler.getApp()
    server = app.listen port, ->
      done()
  after (done) ->
    server.close()
    done()

  describe 'Job', ->
    location = null
    describe 'creating with minimal info', ->
      it 'should result in 201 CREATED', (done) ->
        data =
          target: "arduino-nano328"
        options =
          multipart: true
        needle.post base+'/job', data, options, (err, res, body) ->
          chai.expect(res.statusCode).to.equal 201
          chai.expect(res.headers.location).to.have.string '/job/'
          done()

