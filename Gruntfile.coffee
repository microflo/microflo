module.exports = ->
  # Project configuration
  @initConfig
    pkg: @file.readJSON 'package.json'

    unzip:
        chromedeps:
            src: "thirdparty/chrome-app-samples-websocket-server.zip"
            dest: "build/browser"

    # Browser version building
    component:
      install:
        options:
          action: 'install'
    component_build:
      microflo:
        output: './build/browser/'
        config: './component.json'
        scripts: true
        styles: false
        plugins: ['coffee']
        configure: (builder) ->
          # Enable Component plugins
          json = require 'component-json'
          builder.use json()

    # Fix broken Component aliases, as mentioned in
    # https://github.com/anthonyshort/component-coffee/issues/3
    combine:
      browser:
        input: 'build/browser/microflo.js'
        output: 'build/browser/microflo.js'
        tokens: [
          token: '.coffee"'
          string: '.js"'
        ]

    # JavaScript minification for the browser
    uglify:
      options:
        banner: '/* MicroFlo <%= pkg.version %> -
                 Flow-Based Programming runtime for microcontrollers.
                 See http://microflo.org for more information. */'
        report: 'min'
      microflo:
        files:
          './build/browser/microflo.min.js': ['./build/browser/microflo.js']

    # BDD tests on Node.js
    cafemocha:
      nodejs:
        src: ['test/*.js']
        options:
          reporter: 'spec'

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

    clean:
      app:
        src: ['build/microflo']

    copy:
      browserdeps:
        flatten: true
        src: ['node_modules/node-uuid/uuid.js']
        dest: 'build/browser/uuid.js'
      apptop:
        src: ['manifest.json', 'index.html']
        dest: 'build/microflo-app/'
      appdir:
        src: ['app/*']
        dest: 'build/microflo-app/'
      appdeps:
        src: ['build/browser/*']
        dest: 'build/microflo-app/'

    compress:
      app:
        options:
          archive: 'build/microflo-app-<%= pkg.version %>.zip'
        files: [
          expand: true
          cwd: 'build/microflo'
          src: ['**/*']
        ]


  # Grunt plugins used for building
  @loadNpmTasks 'grunt-zip'
  @loadNpmTasks 'grunt-contrib-coffee'
  @loadNpmTasks 'grunt-component'
  @loadNpmTasks 'grunt-component-build'
  @loadNpmTasks 'grunt-contrib-uglify'
  @loadNpmTasks 'grunt-combine'
  @loadNpmTasks 'grunt-contrib-copy'
  @loadNpmTasks 'grunt-contrib-compress'
  @loadNpmTasks 'grunt-contrib-clean'

  # Grunt plugins used for testing
  @loadNpmTasks 'grunt-contrib-connect'
  @loadNpmTasks 'grunt-cafe-mocha'
  @loadNpmTasks 'grunt-mocha-phantomjs'

  @loadNpmTasks 'grunt-exec'

  # Our local tasks
  @registerTask 'build', 'Build MicroFlo for the chosen target platform', (target = 'all') =>
    #@task.run 'coffee'
    if target is 'all' or target is 'browser'
      @task.run 'unzip'
      @task.run 'component'
      @task.run 'component_build'
      @task.run 'combine'
      @task.run 'uglify'
      @task.run 'clean'
      @task.run 'copy'
      @task.run 'compress'

  @registerTask 'test', 'Build MicroFlo and run automated tests', (target = 'all') =>
    if target is 'all' or target is 'nodejs'
      @task.run 'cafemocha'
    if target is 'all' or target is 'browser'
      @task.run 'unzip'
      @task.run 'connect'
      @task.run 'component'
      @task.run 'component_build'
      @task.run 'combine'
      @task.run 'mocha_phantomjs'

  @registerTask 'default', ['test']

