os = require 'os'
{exec, child} = require 'child_process'
{Range, Point, BufferedProcess} = require 'atom'
linterPath = atom.packages.getLoadedPackage("linter").path
Linter = require "#{linterPath}/lib/linter"

class LinterErlc extends Linter
  @syntax: 'source.erlang'
  defaultLevel: 'error'
  cmd: ['erlc', "-Wall",  "-v", "-I", "./include", "-o", os.tmpDir()]
  linterName: 'erlc'
  cwd: atom.project.path
  regex: '.*(?<file>.*):(?<line>\\d+):\\s*(?<warning>[Ww]arning:)?\\s*(?<message>.+)[\\n\\r]'

  constructor: (editor) ->
    super(editor)
    @configSubscription = atom.config.observe 'linter-erlc.erlcExecutablePath', =>
      @executablePath = atom.config.get 'linter-erlc.erlcExecutablePath'

  destroy: ->
    super
    @configSubscription.dispose()

  lintFile: (filePath, callback) ->
    @cwd = atom.project.path
    {command, args} = @getCmdAndArgs(filePath)

    pa = atom.config.get 'linter-erlc.pa'
    for path in pa.split(",").map((x) -> x.trim()).filter((x) -> x)
      args.push("-pa")
      args.push(path)

    includeDirs = atom.config.get 'linter-erlc.includeDirs'
    for path in includeDirs.split(",").map((x) -> x.trim()).filter((x) -> x)
      args.push("-I")
      args.push(path)

    build_env = process.env["MIX_ENV"] || "dev"
    process.env["ERL_LIBS"] = atom.project.path+"/deps"

    # options for BufferedProcess, same syntax with child_process.spawn
    options = { cwd: @cwd }

    # We need to redefine this as warns come on stderr but errs on stdout
    dataStdAll = []
    stdout = (output) ->
      if atom.config.get 'linter.lintDebug'
        console.log("stdout "+output)
      dataStdAll += output

    stderr = (output) ->
      if atom.config.get 'linter.lintDebug'
        console.log("stderr "+output)
      dataStdAll += output

    exit = =>
      @processMessage dataStdAll, callback

    proc = new BufferedProcess({command, args, options,
                                  stdout, stderr, exit})

    # Don't block UI more than 5seconds, it's really annoying on big files
    timeout_s = 5
    setTimeout ->
      proc.kill()
    , timeout_s * 1000

module.exports = LinterErlc
