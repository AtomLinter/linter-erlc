os = require 'os'
path = require 'path'
{CompositeDisposable} = require 'atom'


module.exports =
  config:
    executablePath:
      type: 'string'
      default: ''
    includeDirs:
      type: 'string'
      default: ''
    pa:
      type: 'string'
      default: ''

  activate: ->
    @subscriptions = new CompositeDisposable
    @subscriptions.add atom.config.observe 'linter-erlc.executablePath',
    (executablePath) =>
      @executablePath = executablePath
  deactivate: ->
    @subscriptions.dispose()
  provideLinter: ->
    helpers = require('atom-linter')
    provider =
      name: 'Erlc'
      grammarScopes: ['source.erlang']
      scope: 'file'
      lintOnFly: false
      lint: (textEditor) =>
        filePath = textEditor.getPath()
        args = ["-Wall", "-v", "-o", os.tmpDir()]

        pa = atom.config.get 'linter-erlc.pa'
        for path in pa.split(",").map((x) -> x.trim()).filter((x) -> x)
          args.push("-pa")
          args.push(path)

        projectPath = null
        if path.basename(path.dirname(filePath)) == 'src'
          projectPath = path.dirname(path.dirname(filePath))

        includeDirs = atom.config.get 'linter-erlc.includeDirs'
        for includePath in includeDirs.split(",").map((x) -> x.trim()).filter((x) -> x)
          args.push("-I")
          if projectPath && !includePath.match(/^\//)
            args.push(path.join(projectPath, includePath))
          else
            args.push(includePath)

        args.push(filePath)


        return helpers.exec(@executablePath, args).then (result) ->
          toReturn = []
          patterns = [
            {regex: /(.+):(\d+):\s(.+)/, cb: (m) -> {lineNo: m[2], text: m[3]}},
            {regex: /(.+): (.+)/, cb: (m) -> {lineNo: 1, text: m[2]}}
          ]
          lines = result.split('\n')
          sourceLines = textEditor.getText().split("\n")
          for line in lines
            if not line
              continue

            matches = (x.cb(line.match(x.regex)) for x in patterns when line.match(x.regex))
            match = matches[0]
            lineNo = parseInt(match.lineNo) - 1
            message = match.text
            if message.match(/Warning:/)
              message = message.replace(/Warning: (.+)/, "$1")
              type = "Warning"
            else
              type = "Error"

            beforeMatch = message.match(/before: '?(.+?)'?/)
            unUsedMatch = message.match(/variable '(.+)' is unused/)
            sourceLine = sourceLines[lineNo]
            column1 = 0
            column2 = sourceLine.length
            if beforeMatch
              column2 = sourceLine.indexOf(beforeMatch[1])
            else if unUsedMatch
              column1 = sourceLine.indexOf(unUsedMatch[1])
              column2 = column1 + unUsedMatch[1].length

            toReturn.push({
              type: type
              text: message
              range: [[lineNo, column1], [lineNo, column2]]
              filePath: textEditor.getPath()
              })
          console.log toReturn
          return toReturn
