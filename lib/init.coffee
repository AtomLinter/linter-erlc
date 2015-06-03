module.exports =
  config:
    erlcExecutablePath:
      type: 'string'
      default: ''
    includeDirs:
      type: 'string'
      default: ''
    pa:
      type: 'string'
      default: ''


  activate: ->
    console.log 'activate linter-erlc'
