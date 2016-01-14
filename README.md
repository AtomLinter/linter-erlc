# linter-erlc

This linter plugin for [Linter](https://github.com/AtomLinter/Linter) provides an interface to erlc. It will be used with files that have the "source.erlang" syntax.


## Installation
Linter package must be installed in order to use this plugin. If Linter is not installed, please follow the instructions [here](https://github.com/AtomLinter/Linter).

### Plugin installation
```
$ apm install linter-erlc
```

## Settings
All of linter-erlc's settings are available from within Atom's settings menu.
If you prefer to manually edit the configuration file the following settings
are available:

*   `executablePath`: Defaults to `erlc`, allowing the `$PATH` to resolve the
    correct location. If you need to override this specify the full path to
    `erlc`.

*   `includeDirs`: You can add a comma separated list of paths that need to be included by `erlc`. You can add relative paths to the project root directory. The project must be in OTP style for it to resolve the project root. For example: `includes, other/paths`.

*   `pa`: A comma separated list of paths added with the -pa flag. For example `~/.ebin, /opt/ebins`
