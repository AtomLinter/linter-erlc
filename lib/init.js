'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';
import path from 'path';
import tmp from 'tmp';

export default {
  activate() {
    require('atom-package-deps').install();
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.config.observe('linter-erlc.executablePath', (value) => {
        this.executablePath = value;
      }),
    );

    this.subscriptions.add(
      atom.config.observe('linter-erlc.pa', (value) => {
        this.erlcPa = value;
      }),
    );

    this.subscriptions.add(
      atom.config.observe('linter-erlc.includeDirs', (value) => {
        this.erlcIncludeDirs = value;
      }),
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
      lint: (textEditor) => {
        const filePath = textEditor.getPath();
        if (!filePath.match(/\.erl$/)) {
          return [];
        }
        const fileDir = path.dirname(filePath);

        const tmpPathObj = tmp.dirSync({ unsafeCleanup: true });
        const args = ['-Wall', '-v', '-o', tmpPathObj.name];
        let projectPath;


        this.erlcPa.forEach((paPath) => {
          args.push('-pa');
          args.push(paPath);
        });

        const dirName = path.basename(fileDir);
        if (dirName === 'src' || dirName === 'test') {
          projectPath = path.dirname(fileDir);
        }

        this.erlcIncludeDirs.forEach((includePath) => {
          args.push('-I');
          if (projectPath && !includePath.match(/^\//)) {
            args.push(path.join(projectPath, includePath));
          } else {
            args.push(includePath);
          }
        });

        args.push(filePath);

        return helpers.exec(this.executablePath, args, { ignoreExitCode: true }).then((result) => {
          const sourceLines = textEditor.getBuffer().getLines();
          const patterns = [
            {
              regex: /(.+):(\d+):\s(.+)/,
              cb: m => ({ lineNo: m[2], text: m[3] }),
            },
            {
              regex: /(.+): (.+)/,
              cb: m => ({ lineNo: 1, text: m[2] }),
            },
          ];
          const lines = result.split('\n');
          const matches = lines.map((line) => {
            const lineMatches = patterns.map((x) => {
              const match = line.match(x.regex);
              return match ? x.cb(match) : null;
            });
            if (lineMatches[0] === null && lineMatches[1] !== null) {
              return lineMatches[1];
            }
            return lineMatches[0];
          });
          const toReturn = matches.reduce((results, match) => {
            if (!match) {
              return results;
            }
            const lineNo = Number.parseInt(match.lineNo, 10) - 1;
            let message = match.text;
            let type;
            if (message.match(/Warning:/)) {
              message = message.replace(/Warning: (.+)/, '$1');
              type = 'Warning';
            } else {
              type = 'Error';
            }

            const beforeMatch = message.match(/before: '?(.+?)'?/);
            const unUsedMatch = message.match(/variable '(.+)' is unused/);
            const sourceLine = sourceLines[lineNo];
            let column1 = 0;
            let column2 = sourceLine.length;
            if (beforeMatch) {
              column2 = sourceLine.lastIndexOf(beforeMatch[1]);
            } else if (unUsedMatch) {
              column1 = sourceLine.indexOf(unUsedMatch[1]);
              column2 = column1 + unUsedMatch[1].length;
            }

            results.push({
              type,
              text: message,
              range: [[lineNo, column1], [lineNo, column2]],
              filePath,
            });
            return results;
          }, []);

          tmpPathObj.removeCallback();
          return toReturn;
        });
      },
    };
  },
};
