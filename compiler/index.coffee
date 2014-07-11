express = require 'express'
busboy = require 'connect-busboy'
chance = require 'chance'

child_process = require 'child_process'
fs = require 'fs'
path = require 'path'

class CompileJob
    constructor: (workdir) ->
        @workdir = workdir
        @files = {}
        @fields = {}
        @status = 'new'

        @output = null
        @progress = 0

    build: () ->
        if @status != 'new'
            return

        command = 'make'
        options =
            cwd: './'
            timeout: 60*10e3
        child_process.exec command, (error, stdout, stderr) =>
            @state = if error then 'build-error' else 'build-completed'

    receiveFile: (fieldname, file, filename) ->
        @files[filename] = filename
        p = path.join @workdir, filename
        stream = fs.createWriteStream p
        file.pipe stream

    receiveField: (fieldname, value) ->
        @fields[fieldname] = value

    getState: () ->
        s =
            status: @status
            files: @files
            attributes: @fields
            progress: @progress
            output: @output
        return s

getApp = () ->
    app = express()
    app.use busboy()

    app.workdir = './tempp'
    app.jobs = {} # TODO: use database, or re-populate from disk on startup

    app.post '/job', (req, res) ->
        jobId = (new chance()).string()
        job = new CompileJob path.join app.workdir, jobId
        app.jobs[jobId] = job

        req.pipe(req.busboy)
        req.busboy.on 'file', (fieldname, file, filename) ->
            job.receiveFile fieldname, file, filename
        req.busboy.on 'field', (key, value) ->
            job.receiveField key, value
        req.on 'end', ->
            job.build() # Fire away, app should poll later to
            res.status 201
            res.location "/job/#{jobId}"
            res.end()

    # TODO: disable for production, so people cannot sniff other peoples jobs
    app.get '/job', (req, res) ->
        jobs = Object.keys app.jobs
        res.json { jobs: jobs }

    app.get '/job/:id', (req, res) ->
        job = app.jobs[req.params.id]
        if !job?
            res.status 404
            return res.end()
        res.json job.getState()
        

    return app

main = () ->
    app = getApp()
    app.listen 8080

exports.main = main
exports.getApp = getApp
