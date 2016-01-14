'use babel';

import path from 'path';
import os from 'os';
import tmp from 'tmp';
import {CompositeDisposable} from 'atom';

export default {
  config: {
    executablePath: {
      type: 'string',
      default: ''
    },
    includeDirs: {
      type: 'array',
      default: [],
      items: {
        type: 'string'
      }
    },
    pa: {
      type: 'array',
      default: [],
      items: {
        type: 'string'
      }
    }
  },

  activate() {
    require('atom-package-deps').install();
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.config.observe('linter-erlc.executablePath', executablePath => {
        this.executablePath = executablePath;
      })
    );

    this.subscriptions.add(
      atom.config.observe('linter-erlc.pa', pa => {
        this.erlcPa = pa;
      })
    );

    this.subscriptions.add(
      atom.config.observe('linter-erlc.includeDirs', includeDirs => {
        this.erlcIncludeDirs = includeDirs;
      })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  provideLinter() {
    const helpers = require('atom-linter');
    return {
      name: 'erlc',
      grammarScopes: ['source.erlang'],
      scope: 'file',
      lintOnFly: false,
      lint: textEditor => {
        const tmpPathObj = tmp.dirSync({unsafeCleanup: true});
        const filePath = textEditor.getPath();
        const args = ["-Wall", "-v", "-o", tmpPathObj.name];
        var projectPath = null;

        for (let path of this.erlcPa) {
          args.push("-pa");
          args.push(path);
        }

        if (path.basename(path.dirname(filePath)) == 'src') {
          projectPath = path.dirname(path.dirname(filePath));
        }

        for (let includePath of this.erlcIncludeDirs) {
          args.push("-I");
          if (projectPath && !includePath.match(/^\//)) {
            args.push(path.join(projectPath, includePath));
          } else {
            args.push(includePath);
          }
        }

        args.push(filePath);

        return helpers.exec(this.executablePath, args).then(result => {
          const toReturn = [];
          const patterns = [
            {regex: /(.+):(\d+):\s(.+)/, cb: m => {
              return {lineNo: m[2], text: m[3]}
            }},
            {regex: /(.+): (.+)/, cb: m => {
              return {lineNo: 1, text: m[2]}
            }}
          ];
          lines = result.split('\n');
          sourceLines = textEditor.getBuffer().getLines();
          for (let line of lines) {
            if (!line) {
              continue;
            }

            matches = [for (x of patterns) if (line.match(x.regex)) x.cb(line.match(x.regex))];
            match = matches[0];
            lineNo = parseInt(match.lineNo) - 1;
            message = match.text;
            if (message.match(/Warning:/)) {
              message = message.replace(/Warning: (.+)/, "$1")
              type = "Warning"
            } else {
              type = "Error"
            }

            beforeMatch = message.match(/before: '?(.+?)'?/);
            unUsedMatch = message.match(/variable '(.+)' is unused/);
            sourceLine = sourceLines[lineNo];
            column1 = 0;
            column2 = sourceLine.length;
            if (beforeMatch) {
              column2 = sourceLine.indexOf(beforeMatch[1]);
            } else if (unUsedMatch) {
              column1 = sourceLine.indexOf(unUsedMatch[1]);
              column2 = column1 + unUsedMatch[1].length;
            }

            toReturn.push({
              type: type,
              text: message,
              range: [[lineNo, column1], [lineNo, column2]],
              filePath
            });
          }
          tmpPathObj.removeCallback();
          return toReturn;
        });
      }
    };
  }
};
