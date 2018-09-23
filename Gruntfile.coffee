path = require 'path'
webpack = require 'webpack'

module.exports = ->
  # Project configuration
  @initConfig
    pkg: @file.readJSON 'package.json'

    # Browser version building
    webpack:
      lib:
        entry: './lib/microflo.coffee'
        output:
          libraryTarget: 'umd'
          library: 'Microflo'
          path: path.join __dirname, 'build/browser/', 'microflo.js'
          filename: 'microflo.js'
        plugins: [
          new webpack.IgnorePlugin(/\/coffee-script\//)
          new webpack.IgnorePlugin(/\/coffeescript\//)
          new webpack.IgnorePlugin(/declarec.coffee/)
        ]
        module:
          rules: [
            include: [ path.resolve(__dirname, 'lib') ]
            test: /\.coffee?$/
            loader: 'coffee-loader'
          ]
        resolve:
          extensions: ['.js', '.json', '.coffee']
        node:
          'fs': 'empty'
          'child_process': 'empty'

    # CoffeeScript build
    coffee:
      lib:
        options:
          bare: true
        expand: true
        cwd: 'lib'
        src: ['**.coffee']
        dest: 'build/lib'
        ext: '.js'
      spec:
        options:
          bare: true
        expand: true
        cwd: 'test'
        src: ['**.coffee']
        dest: 'test'
        ext: '.js'

    coffeelint:
      code:
        files:
          src: ['lib/*.coffee', 'test/*.coffee']
        options:
          max_line_length:
            value: 80
            level: 'warn'
          no_trailing_semicolons:
            level: 'warn'

    # BDD tests on Node.js
    mochaTest:
      nodejs:
        src: ['test/*.coffee']
        options:
          reporter: 'spec'
          require: 'coffeescript/register'
          grep: process.env.TESTS

    # FBP protocol tests
    shell:
      fbp_test:
        command: 'fbp-test --colors'

    # Web server for the browser tests
    connect:
      server:
        options:
          port: 8000

    # BDD tests on browser
    mocha_phantomjs:
      all:
        options:
          output: 'test/result.xml'
          reporter: 'spec'
          urls: ['http://localhost:8000/test/runner.html']

    copy:
      browserdeps:
        flatten: true
        src: ['node_modules/node-uuid/uuid.js']
        dest: 'build/browser/uuid.js'


  # Grunt plugins used for building
  @loadNpmTasks 'grunt-contrib-coffee'
  @loadNpmTasks 'grunt-contrib-copy'
  @loadNpmTasks 'grunt-webpack'

  # Grunt plugins used for testing
  @loadNpmTasks 'grunt-coffeelint'
  @loadNpmTasks 'grunt-contrib-connect'
  @loadNpmTasks 'grunt-mocha-test'
  @loadNpmTasks 'grunt-mocha-phantomjs'

  # Our local tasks
  @registerTask 'build', 'Build MicroFlo for the chosen target platform', (target = 'all') =>
    @task.run 'coffee'
    if target is 'all' or target is 'browser'
      @task.run 'webpack:lib'
      @task.run 'copy'

  @registerTask 'test', 'Build MicroFlo and run automated tests', (target = 'all') =>
    # @task.run 'coffeelint'
    @task.run "build:#{target}"
    if target is 'all' or target is 'nodejs'
      @task.run 'mochaTest'
      # @task.run 'shell:fbp_test'
    if target is 'all' or target is 'browser'
      @task.run 'connect'
      @task.run 'mocha_phantomjs'

  @registerTask 'default', ['test']

