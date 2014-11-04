# linter-erlc

This linter plugin for [Linter](https://github.com/AtomLinter/Linter) provides an interface to erlc. It will be used with files that have the "source.erlang" syntax.


## Installation
Linter package must be installed in order to use this plugin. If Linter is not installed, please follow the instructions [here](https://github.com/AtomLinter/Linter).

### Plugin installation
```
$ apm install linter-erlc
```

## Settings
You can configure linter-elixirc by editing ~/.atom/config.cson (choose Open Your Config in Atom menu):

```
'linter-elixirc':
  'erlcExecutablePath': null #erlc path. run 'which erlc' to find the path
  'includeDirs': 'includes,other/paths' #comma seperated list of paths added with the -I flag
	'pa': '~/.ebin' #comma seperated list of paths added with the -pa flag.
```
