'use babel';

import {
  // eslint-disable-next-line no-unused-vars
  it, fit, wait, beforeEach, afterEach,
} from 'jasmine-fix';
import * as path from 'path';
import linter from '../lib/init';

const goodPath = path.join(__dirname, 'fixtures', 'good.erl');
const badPath = path.join(__dirname, 'fixtures', 'bad.erl');
const emptyPath = path.join(__dirname, 'fixtures', 'empty.erl');

describe('The ERLC provider for Linter', () => {
  const { lint } = linter.provideLinter();

  beforeEach(async () => {
    await atom.packages.activatePackage('linter-erlc');
  });

  it('should be in the packages list', () => (
    expect(atom.packages.isPackageLoaded('linter-erlc')).toBe(true)
  ));

  it('should be an active package', () => (
    expect(atom.packages.isPackageActive('linter-erlc')).toBe(true)
  ));

  it('finds nothing wrong with a valid file', async () => {
    const editor = await atom.workspace.open(goodPath);
    const messages = await lint(editor);
    expect(messages.length).toBe(0);
  });

  it('shows errors in an a file with issues', async () => {
    const editor = await atom.workspace.open(badPath);
    const expected = 'function unknown/0 undefined';
    const messages = await lint(editor);

    expect(messages[0].severity).toBe('error');
    expect(messages[0].excerpt).toBe(expected);
    expect(messages[0].location.file).toBe(badPath);
    expect(messages[0].location.position).toEqual([[1, 0], [1, 21]]);
  });

  it('shows errors in an empty file', async () => {
    const editor = await atom.workspace.open(emptyPath);
    const expected = 'no module definition';
    const messages = await lint(editor);

    expect(messages[0].severity).toBe('error');
    expect(messages[0].excerpt).toBe(expected);
    expect(messages[0].location.file).toBe(emptyPath);
    expect(messages[0].location.position).toEqual([[0, 0], [0, 0]]);
  });
});
