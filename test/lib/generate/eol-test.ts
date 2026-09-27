import { generate } from '../../../lib/generator.js';
import {
  applyInsertFinalNewline,
  createEndOfLineResolver,
  detectEndOfLine,
  getFallbackEndOfLine,
  normalizeEndOfLine,
} from '../../../lib/eol.js';
import { EOL } from 'node:os';
import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

function assertUniformEndOfLine(contents: string, endOfLine: '\n' | '\r\n') {
  if (endOfLine === '\r\n') {
    expect(contents.includes('\r\n')).toBe(true);
    expect(contents.replaceAll('\r\n', '').includes('\n')).toBe(false);
    expect(contents.replaceAll('\r\n', '').includes('\r')).toBe(false);
  } else {
    expect(contents.includes('\r')).toBe(false);
  }
}

function endsWithEndOfLine(contents: string, endOfLine: '\n' | '\r\n') {
  return contents.endsWith(endOfLine);
}

function stripTrailingEndOfLines(contents: string, endOfLine: '\n' | '\r\n') {
  let result = contents;
  while (result.endsWith(endOfLine)) {
    result = result.slice(0, -endOfLine.length);
  }
  return result;
}

describe('detectEndOfLine', function () {
  it('returns undefined for contents without line breaks', function () {
    expect(detectEndOfLine('')).toBeUndefined();
    expect(detectEndOfLine('no line breaks')).toBeUndefined();
  });

  it('detects lf', function () {
    expect(detectEndOfLine('a\nb\nc\n')).toStrictEqual('\n');
  });

  it('detects crlf', function () {
    expect(detectEndOfLine('a\r\nb\r\nc\r\n')).toStrictEqual('\r\n');
  });

  it('detects the predominant end of line in contents with mixed line endings', function () {
    expect(detectEndOfLine('a\r\nb\r\nc\n')).toStrictEqual('\r\n');
    expect(detectEndOfLine('a\nb\nc\r\n')).toStrictEqual('\n');
  });

  it('prefers lf when CRLF and LF counts are equal', function () {
    expect(detectEndOfLine('a\r\nb\n')).toStrictEqual('\n');
  });
});

describe('normalizeEndOfLine', function () {
  it('converts mixed line endings to the given end of line', function () {
    expect(normalizeEndOfLine('a\r\nb\nc\r\n', '\n')).toStrictEqual(
      'a\nb\nc\n',
    );
    expect(normalizeEndOfLine('a\r\nb\nc\r\n', '\r\n')).toStrictEqual(
      'a\r\nb\r\nc\r\n',
    );
  });

  it('converts lone CR to the given end of line', function () {
    expect(normalizeEndOfLine('a\rb\nc\r\n', '\n')).toStrictEqual('a\nb\nc\n');
    expect(normalizeEndOfLine('a\rb\nc\r\n', '\r\n')).toStrictEqual(
      'a\r\nb\r\nc\r\n',
    );
  });
});

describe('applyInsertFinalNewline', function () {
  it('returns contents unchanged when insert_final_newline is unset', function () {
    expect(applyInsertFinalNewline('a\n', '\n', undefined)).toStrictEqual(
      'a\n',
    );
    expect(applyInsertFinalNewline('a', '\n', undefined)).toStrictEqual('a');
  });

  it('appends one trailing EOL when true and absent', function () {
    expect(applyInsertFinalNewline('a', '\n', true)).toStrictEqual('a\n');
    expect(applyInsertFinalNewline('a', '\r\n', true)).toStrictEqual('a\r\n');
  });

  it('leaves a single trailing EOL alone when true', function () {
    expect(applyInsertFinalNewline('a\n', '\n', true)).toStrictEqual('a\n');
    expect(applyInsertFinalNewline('a\r\n', '\r\n', true)).toStrictEqual(
      'a\r\n',
    );
  });

  it('never trims existing trailing blank lines when true', function () {
    expect(applyInsertFinalNewline('a\n\n', '\n', true)).toStrictEqual('a\n\n');
    expect(applyInsertFinalNewline('a\r\n\r\n', '\r\n', true)).toStrictEqual(
      'a\r\n\r\n',
    );
  });

  it('strips all trailing EOLs when false', function () {
    expect(applyInsertFinalNewline('a\n', '\n', false)).toStrictEqual('a');
    expect(applyInsertFinalNewline('a\n\n', '\n', false)).toStrictEqual('a');
    expect(applyInsertFinalNewline('a\r\n\r\n', '\r\n', false)).toStrictEqual(
      'a',
    );
    expect(applyInsertFinalNewline('a', '\n', false)).toStrictEqual('a');
  });
});

describe('createEndOfLineResolver', function () {
  describe('with a ".editorconfig" file', function () {
    let fixture: FixtureContext;

    afterEach(async function () {
      await fixture.cleanup();
    });

    it('returns lf when ".editorconfig" is configured with lf', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          '.editorconfig': `
                  root = true

                  [*]
                  end_of_line = lf`,
        },
      });

      const eol = createEndOfLineResolver();
      expect(
        await eol.getExplicitEndOfLine(join(fixture.path, 'README.md')),
      ).toStrictEqual('\n');
    });

    it('returns crlf when ".editorconfig" is configured with crlf', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          '.editorconfig': `
                root = true

                [*]
                end_of_line = crlf`,
        },
      });

      const eol = createEndOfLineResolver();
      expect(
        await eol.getExplicitEndOfLine(join(fixture.path, 'README.md')),
      ).toStrictEqual('\r\n');
    });

    it('treats unsupported values like "cr" as unset', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          '.editorconfig': `
                root = true

                [*]
                end_of_line = cr`,
        },
      });

      const eol = createEndOfLineResolver();
      expect(
        await eol.getExplicitEndOfLine(join(fixture.path, 'README.md')),
      ).toBeUndefined();
    });

    it('respects the .md specific end of line settings when ".editorconfig" is configured', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          '.editorconfig': `
                  root = true

                  [*]
                  end_of_line = lf

                  [*.md]
                  end_of_line = crlf`,
        },
      });

      const eol = createEndOfLineResolver();
      expect(
        await eol.getExplicitEndOfLine(join(fixture.path, 'README.md')),
      ).toStrictEqual('\r\n');
    });

    it('resolves per-file globs so README and rule docs can differ', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          '.editorconfig': `
                  root = true

                  [*]
                  end_of_line = lf

                  [docs/rules/*.md]
                  end_of_line = crlf`,
        },
      });

      const eol = createEndOfLineResolver();
      expect(
        await eol.getExplicitEndOfLine(join(fixture.path, 'README.md')),
      ).toStrictEqual('\n');
      expect(
        await eol.getExplicitEndOfLine(
          join(fixture.path, 'docs/rules/no-foo.md'),
        ),
      ).toStrictEqual('\r\n');
    });

    it('resolves sibling .md and .mdx files independently (cache keyed by path)', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          '.editorconfig': `
                  root = true

                  [*.md]
                  end_of_line = lf

                  [*.mdx]
                  end_of_line = crlf`,
        },
      });

      const eol = createEndOfLineResolver();
      expect(
        await eol.getExplicitEndOfLine(
          join(fixture.path, 'docs/rules/no-foo.md'),
        ),
      ).toStrictEqual('\n');
      expect(
        await eol.getExplicitEndOfLine(
          join(fixture.path, 'docs/rules/no-bar.mdx'),
        ),
      ).toStrictEqual('\r\n');
    });

    it('treats EditorConfig end_of_line = cr as unset', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          '.editorconfig': `
                  root = true

                  [*]
                  end_of_line = cr`,
        },
      });

      const eol = createEndOfLineResolver();
      expect(
        await eol.getExplicitEndOfLine(join(fixture.path, 'README.md')),
      ).toBeUndefined();
    });

    it('returns true when ".editorconfig" sets insert_final_newline = true', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          '.editorconfig': `
                  root = true

                  [*]
                  insert_final_newline = true`,
        },
      });

      const eol = createEndOfLineResolver();
      expect(
        await eol.getInsertFinalNewline(join(fixture.path, 'README.md')),
      ).toBe(true);
    });

    it('returns false when ".editorconfig" sets insert_final_newline = false', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          '.editorconfig': `
                  root = true

                  [*]
                  insert_final_newline = false`,
        },
      });

      const eol = createEndOfLineResolver();
      expect(
        await eol.getInsertFinalNewline(join(fixture.path, 'README.md')),
      ).toBe(false);
    });

    it('returns undefined when insert_final_newline is unset', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          '.editorconfig': `
                  root = true

                  [*]
                  end_of_line = lf`,
        },
      });

      const eol = createEndOfLineResolver();
      expect(
        await eol.getInsertFinalNewline(join(fixture.path, 'README.md')),
      ).toBeUndefined();
    });

    it('parses end_of_line and insert_final_newline from one EditorConfig read', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          '.editorconfig': `
                  root = true

                  [*]
                  end_of_line = crlf
                  insert_final_newline = true`,
        },
      });

      const eol = createEndOfLineResolver();
      const readmePath = join(fixture.path, 'README.md');
      expect(await eol.getExplicitEndOfLine(readmePath)).toStrictEqual('\r\n');
      expect(await eol.getInsertFinalNewline(readmePath)).toBe(true);
    });
  });

  describe('with a Prettier config', function () {
    let fixture: FixtureContext;

    afterEach(async function () {
      await fixture.cleanup();
    });

    it('does not consult Prettier config for end of line', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          '.prettierrc.json': `
                  {
                    "$schema": "https://json.schemastore.org/prettierrc",
                    "endOfLine": "crlf"
                  }`,
        },
      });

      const eol = createEndOfLineResolver();
      expect(
        await eol.getExplicitEndOfLine(join(fixture.path, 'README.md')),
      ).toBeUndefined();
    });
  });

  describe('fallback', function () {
    let fixture: FixtureContext;

    afterEach(async function () {
      await fixture.cleanup();
    });

    it('returns undefined when config files do not exist', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
      });

      const eol = createEndOfLineResolver();
      expect(
        await eol.getExplicitEndOfLine(join(fixture.path, 'README.md')),
      ).toBeUndefined();
      expect(getFallbackEndOfLine()).toStrictEqual(EOL);
    });
  });
});

describe('generate with end of line', function () {
  describe('with a ".editorconfig" file', function () {
    let fixture: FixtureContext;

    afterEach(async function () {
      await fixture.cleanup();
    });

    it('generates using lf end of line from ".editorconfig"', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'c': { meta: { docs: {} }, create(context) {} },
              'a': { meta: { docs: {} }, create(context) {} },
              'B': { meta: { docs: {} }, create(context) {} },
            },
            configs: {
              'c': { rules: { 'test/a': 'error', } },
              'a': { rules: { 'test/a': 'error', } },
              'B': { rules: { 'test/a': 'error', } },
            }
          };`,
          'docs/rules/a.md': '',
          'docs/rules/B.md': '',
          'docs/rules/c.md': '',
          'README.md':
            '## Rules\n<!-- begin auto-generated rules list -->\n<!-- end auto-generated rules list -->',
          '.editorconfig': `
                  root = true

                  [*]
                  end_of_line = lf`,
        },
      });

      await generate(fixture.path, {
        configEmoji: [
          ['a', '🅰️'],
          ['B', '🅱️'],
          ['c', '🌊'],
        ],
      });
      assertUniformEndOfLine(await fixture.readFile('README.md'), '\n');
      assertUniformEndOfLine(await fixture.readFile('docs/rules/a.md'), '\n');

      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/a.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/B.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/c.md')).toMatchSnapshot();
    });

    it('generates using crlf end of line from ".editorconfig"', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'c': { meta: { docs: {} }, create(context) {} },
              'a': { meta: { docs: {} }, create(context) {} },
              'B': { meta: { docs: {} }, create(context) {} },
            },
            configs: {
              'c': { rules: { 'test/a': 'error', } },
              'a': { rules: { 'test/a': 'error', } },
              'B': { rules: { 'test/a': 'error', } },
            }
          };`,
          'docs/rules/a.md': '',
          'docs/rules/B.md': '',
          'docs/rules/c.md': '',
          'README.md':
            '## Rules\r\n<!-- begin auto-generated rules list -->\r\n<!-- end auto-generated rules list -->',
          '.editorconfig': `
                  root = true

                  [*]
                  end_of_line = crlf`,
        },
      });

      await generate(fixture.path, {
        configEmoji: [
          ['a', '🅰️'],
          ['B', '🅱️'],
          ['c', '🌊'],
        ],
      });
      assertUniformEndOfLine(await fixture.readFile('README.md'), '\r\n');
      assertUniformEndOfLine(await fixture.readFile('docs/rules/a.md'), '\r\n');

      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/a.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/B.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/c.md')).toMatchSnapshot();
    });

    it('generates using the end of line from ".editorconfig" while respecting the .md specific end of line setting', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'c': { meta: { docs: {} }, create(context) {} },
              'a': { meta: { docs: {} }, create(context) {} },
              'B': { meta: { docs: {} }, create(context) {} },
            },
            configs: {
              'c': { rules: { 'test/a': 'error', } },
              'a': { rules: { 'test/a': 'error', } },
              'B': { rules: { 'test/a': 'error', } },
            }
          };`,
          'docs/rules/a.md': '',
          'docs/rules/B.md': '',
          'docs/rules/c.md': '',
          'README.md':
            '## Rules\r\n<!-- begin auto-generated rules list -->\r\n<!-- end auto-generated rules list -->',
          '.editorconfig': `
                  root = true

                  [*]
                  end_of_line = lf

                  [*.md]
                  end_of_line = crlf`,
        },
      });

      await generate(fixture.path, {
        configEmoji: [
          ['a', '🅰️'],
          ['B', '🅱️'],
          ['c', '🌊'],
        ],
      });
      assertUniformEndOfLine(await fixture.readFile('README.md'), '\r\n');
      assertUniformEndOfLine(await fixture.readFile('docs/rules/a.md'), '\r\n');

      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/a.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/B.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/c.md')).toMatchSnapshot();
    });

    // eslint-disable-next-line vitest/expect-expect -- assertions via assertUniformEndOfLine
    it('applies per-glob editorconfig end_of_line to README vs rule docs', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md': '',
          'README.md':
            '## Rules\r\n\r\n<!-- begin auto-generated rules list -->\r\n<!-- end auto-generated rules list -->\r\n',
          '.editorconfig': `
                  root = true

                  [*]
                  end_of_line = lf

                  [docs/rules/*.md]
                  end_of_line = crlf`,
        },
      });

      await generate(fixture.path);

      assertUniformEndOfLine(await fixture.readFile('README.md'), '\n');
      assertUniformEndOfLine(
        await fixture.readFile('docs/rules/no-foo.md'),
        '\r\n',
      );
    });

    // eslint-disable-next-line vitest/expect-expect -- assertions via assertUniformEndOfLine
    it('writes sibling .md and .mdx docs with their own editorconfig end_of_line', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { docs: { description: 'Description of no-foo.' } }, create(context) {} },
              'no-bar': { meta: { docs: { description: 'Description of no-bar.' } }, create(context) {} },
            },
          };`,
          'docs/rules/no-foo.md': '',
          // Only the .mdx file exists; resolveDocPath falls back from .md → .mdx.
          'docs/rules/no-bar.mdx': '',
          'README.md':
            '## Rules\n\n<!-- begin auto-generated rules list -->\n<!-- end auto-generated rules list -->\n',
          '.editorconfig': `
                  root = true

                  [*.md]
                  end_of_line = lf

                  [*.mdx]
                  end_of_line = crlf`,
        },
      });

      await generate(fixture.path);

      assertUniformEndOfLine(
        await fixture.readFile('docs/rules/no-foo.md'),
        '\n',
      );
      assertUniformEndOfLine(
        await fixture.readFile('docs/rules/no-bar.mdx'),
        '\r\n',
      );
    });
  });

  describe('explicit config precedence', function () {
    let fixture: FixtureContext;

    afterEach(async function () {
      await fixture.cleanup();
    });

    it('converts an LF rule doc to CRLF when editorconfig sets end_of_line = crlf, preserving content (#725)', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md':
            '# Description of no-foo (`test/no-foo`)\n\n<!-- end auto-generated rule header -->\n\nSome description.\n\n## Further Reading\n\n- [link](https://example.com/)\n',
          'README.md':
            '## Rules\n\n<!-- begin auto-generated rules list -->\n<!-- end auto-generated rules list -->\n',
          '.editorconfig': `
                root = true

                [*]
                end_of_line = crlf`,
        },
      });

      await generate(fixture.path);

      const ruleDoc = await fixture.readFile('docs/rules/no-foo.md');
      expect(ruleDoc).toContain('## Further Reading');
      expect(ruleDoc).toContain('Some description.');
      assertUniformEndOfLine(ruleDoc, '\r\n');
    });

    it('converts a CRLF rule doc to LF when editorconfig sets end_of_line = lf, preserving content', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md':
            '# Description of no-foo (`test/no-foo`)\r\n\r\n<!-- end auto-generated rule header -->\r\n\r\nSome description.\r\n\r\n## Further Reading\r\n\r\n- [link](https://example.com/)\r\n',
          'README.md':
            '## Rules\r\n\r\n<!-- begin auto-generated rules list -->\r\n<!-- end auto-generated rules list -->\r\n',
          '.editorconfig': `
                root = true

                [*]
                end_of_line = lf`,
        },
      });

      await generate(fixture.path);

      const ruleDoc = await fixture.readFile('docs/rules/no-foo.md');
      expect(ruleDoc).toContain('## Further Reading');
      expect(ruleDoc).toContain('Some description.');
      assertUniformEndOfLine(ruleDoc, '\n');
    });

    // eslint-disable-next-line vitest/expect-expect -- assertions via assertUniformEndOfLine
    it('preserves LF when prettier sets endOfLine: crlf (Prettier is not consulted)', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md': '',
          'README.md':
            '## Rules\n\n<!-- begin auto-generated rules list -->\n<!-- end auto-generated rules list -->\n',
          '.prettierrc.json': `
                  {
                    "$schema": "https://json.schemastore.org/prettierrc",
                    "endOfLine": "crlf"
                  }`,
        },
      });

      await generate(fixture.path);

      assertUniformEndOfLine(await fixture.readFile('README.md'), '\n');
    });

    // eslint-disable-next-line vitest/expect-expect -- assertions via assertUniformEndOfLine
    it('preserves CRLF when prettier config exists but does not set endOfLine (eslint-plugin-cypress / #726)', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md': '',
          'README.md':
            '## Rules\r\n\r\n<!-- begin auto-generated rules list -->\r\n<!-- end auto-generated rules list -->\r\n',
          '.prettierrc.json': `
                  {
                    "$schema": "https://json.schemastore.org/prettierrc"
                  }`,
        },
      });

      await generate(fixture.path);

      assertUniformEndOfLine(await fixture.readFile('README.md'), '\r\n');
    });

    // eslint-disable-next-line vitest/expect-expect -- assertions via assertUniformEndOfLine
    it('uses os.EOL for new/empty docs even when prettier sets endOfLine: crlf', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md': '',
          'README.md':
            '## Rules\n\n<!-- begin auto-generated rules list -->\n<!-- end auto-generated rules list -->\n',
          '.prettierrc.json': `
                  {
                    "$schema": "https://json.schemastore.org/prettierrc",
                    "endOfLine": "crlf"
                  }`,
        },
      });

      await generate(fixture.path);

      assertUniformEndOfLine(
        await fixture.readFile('docs/rules/no-foo.md'),
        getFallbackEndOfLine(),
      );
    });

    it('fails --check when an existing file violates an explicit end_of_line config', async function () {
      const ruleDocCrlf =
        '# Description of no-foo (`test/no-foo`)\r\n\r\n<!-- end auto-generated rule header -->\r\n\r\nSome description.\r\n';
      const readmeCrlf =
        '## Rules\r\n\r\n<!-- begin auto-generated rules list -->\r\n<!-- end auto-generated rules list -->\r\n';
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md': ruleDocCrlf,
          'README.md': readmeCrlf,
          '.editorconfig': `
                root = true

                [*]
                end_of_line = lf`,
        },
      });

      // Bring content up-to-date while converting to LF from the config.
      await generate(fixture.path);
      assertUniformEndOfLine(await fixture.readFile('README.md'), '\n');

      // Rewrite the README with CRLF so it again violates the explicit config.
      const { writeFile } = await import('node:fs/promises');
      await writeFile(
        join(fixture.path, 'README.md'),
        normalizeEndOfLine(await fixture.readFile('README.md'), '\r\n'),
      );

      process.exitCode = undefined;
      await generate(fixture.path, { check: true });
      expect(process.exitCode).toBe(1);
      process.exitCode = undefined;
    });
  });

  describe('end-of-line detection from existing files', function () {
    let fixture: FixtureContext;

    afterEach(async function () {
      await fixture.cleanup();
    });

    // eslint-disable-next-line vitest/expect-expect -- assertions via assertUniformEndOfLine
    it('inserts the rules list using the line endings of the existing file when there is no explicit config (#726)', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md': '',
          'README.md':
            '## Rules\r\n\r\n<!-- begin auto-generated rules list -->\r\n<!-- end auto-generated rules list -->\r\n',
        },
      });

      await generate(fixture.path);

      assertUniformEndOfLine(await fixture.readFile('README.md'), '\r\n');
    });

    // eslint-disable-next-line vitest/expect-expect -- assertions via assertUniformEndOfLine
    it('unifies mixed line endings to the predominant one when there is no explicit config', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md': '',
          // README has mostly-CRLF but mixed line endings (as could be produced by older versions of this tool).
          'README.md':
            '# eslint-plugin-test\n\r\n## Rules\r\n\r\n<!-- begin auto-generated rules list -->\r\n<!-- end auto-generated rules list -->\r\n',
        },
      });

      await generate(fixture.path);

      assertUniformEndOfLine(await fixture.readFile('README.md'), '\r\n');
    });

    it('passes in --check mode when up-to-date files match detected endings and there is no explicit config', async function () {
      const ruleDocCrlf =
        '# Description of no-foo (`test/no-foo`)\r\n\r\n<!-- end auto-generated rule header -->\r\n\r\nSome description.\r\n';
      const readmeCrlf =
        '## Rules\r\n\r\n<!-- begin auto-generated rules list -->\r\n<!-- end auto-generated rules list -->\r\n';
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md': ruleDocCrlf,
          'README.md': readmeCrlf,
        },
      });

      await generate(fixture.path);

      process.exitCode = undefined;
      await generate(fixture.path, { check: true });
      expect(process.exitCode).toBeUndefined();
    });

    // eslint-disable-next-line vitest/expect-expect -- assertions via assertUniformEndOfLine
    it('unifies stray lone CR when updating an existing file', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md': '',
          // Mostly LF with a stray classic Mac CR so normalization must clear it.
          'README.md':
            '## Rules\n\n<!-- begin auto-generated rules list -->\r<!-- end auto-generated rules list -->\n',
        },
      });

      await generate(fixture.path);

      assertUniformEndOfLine(await fixture.readFile('README.md'), '\n');
    });
  });

  describe('--init-rule-docs', function () {
    let fixture: FixtureContext;

    afterEach(async function () {
      await fixture.cleanup();
    });

    // eslint-disable-next-line vitest/expect-expect -- assertions via assertUniformEndOfLine
    it('creates new rule docs using editorconfig end_of_line', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-new': {
                meta: { docs: { description: 'Description of no-new.' } },
                create(context) {}
              },
            },
          };`,
          'README.md':
            '## Rules\n\n<!-- begin auto-generated rules list -->\n<!-- end auto-generated rules list -->\n',
          '.editorconfig': `
                root = true

                [*]
                end_of_line = crlf`,
        },
      });

      await generate(fixture.path, { initRuleDocs: true });

      assertUniformEndOfLine(
        await fixture.readFile('docs/rules/no-new.md'),
        '\r\n',
      );
    });
  });

  describe('postprocess', function () {
    let fixture: FixtureContext;

    afterEach(async function () {
      await fixture.cleanup();
    });

    // eslint-disable-next-line vitest/expect-expect -- assertions via assertUniformEndOfLine
    it('writes postprocess output endings verbatim', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md': '',
          'README.md':
            '## Rules\n\n<!-- begin auto-generated rules list -->\n<!-- end auto-generated rules list -->\n',
        },
      });

      await generate(fixture.path, {
        postprocess: (content) => content.replaceAll('\n', '\r\n'),
      });

      assertUniformEndOfLine(await fixture.readFile('README.md'), '\r\n');
      assertUniformEndOfLine(
        await fixture.readFile('docs/rules/no-foo.md'),
        '\r\n',
      );
    });
  });

  describe('insert_final_newline', function () {
    let fixture: FixtureContext;

    afterEach(async function () {
      await fixture.cleanup();
    });

    const endOfLineCases = [
      { label: 'lf', endOfLine: '\n' as const, editorConfigValue: 'lf' },
      { label: 'crlf', endOfLine: '\r\n' as const, editorConfigValue: 'crlf' },
    ];
    const insertFinalNewlineCases: Array<{
      label: string;
      value: boolean | undefined;
      editorConfigLine: string;
    }> = [
      {
        label: 'true',
        value: true,
        editorConfigLine: 'insert_final_newline = true',
      },
      {
        label: 'false',
        value: false,
        editorConfigLine: 'insert_final_newline = false',
      },
      {
        label: 'unset',
        value: undefined,
        editorConfigLine: '',
      },
    ];
    const trailingNewlineCases = [true, false];

    for (const {
      label: eolLabel,
      endOfLine,
      editorConfigValue,
    } of endOfLineCases) {
      for (const {
        label: insertLabel,
        value: insertFinalNewline,
        editorConfigLine,
      } of insertFinalNewlineCases) {
        for (const hasTrailingNewline of trailingNewlineCases) {
          it(`honors insert_final_newline=${insertLabel} with ${eolLabel} when file ${hasTrailingNewline ? 'has' : 'lacks'} a trailing newline`, async function () {
            // Body content controls the natural trailing-newline state for rule
            // docs (empty body always ends with a header newline).
            const ruleDocBody = hasTrailingNewline
              ? 'Some description.\n'
              : 'Some description.';
            const ruleDoc = normalizeEndOfLine(
              `# test/no-foo\n\n<!-- end auto-generated rule header -->\n\n${ruleDocBody}`,
              endOfLine,
            );
            const editorConfigWithoutInsert = [
              'root = true',
              '',
              '[*]',
              `end_of_line = ${editorConfigValue}`,
            ].join('\n');
            const editorConfig = [
              editorConfigWithoutInsert,
              ...(editorConfigLine === '' ? [] : [editorConfigLine]),
            ].join('\n');

            fixture = await setupFixture({
              fixture: 'esm-base',
              overrides: {
                'docs/rules/no-foo.md': ruleDoc,
                'README.md': normalizeEndOfLine(
                  '## Rules\n\n<!-- begin auto-generated rules list -->\n<!-- end auto-generated rules list -->\n',
                  endOfLine,
                ),
                '.editorconfig': editorConfigWithoutInsert,
              },
            });

            // Baseline without insert_final_newline for the snapshot guard.
            await generate(fixture.path);
            const baselineWithoutTrailing = stripTrailingEndOfLines(
              await fixture.readFile('docs/rules/no-foo.md'),
              endOfLine,
            );

            // Restore the body's trailing-newline state, then apply policy.
            await writeFile(
              join(fixture.path, 'docs/rules/no-foo.md'),
              hasTrailingNewline
                ? baselineWithoutTrailing + endOfLine
                : baselineWithoutTrailing,
            );
            await writeFile(join(fixture.path, '.editorconfig'), editorConfig);
            await generate(fixture.path);

            const ruleDocAfter = await fixture.readFile('docs/rules/no-foo.md');
            assertUniformEndOfLine(ruleDocAfter, endOfLine);

            const expectedTrailingNewline =
              insertFinalNewline === undefined
                ? hasTrailingNewline
                : insertFinalNewline;
            expect(endsWithEndOfLine(ruleDocAfter, endOfLine)).toBe(
              expectedTrailingNewline,
            );

            // Snapshot guard: policy must not change non-trailing content.
            expect(ruleDocAfter).toContain('Some description.');
            expect(
              stripTrailingEndOfLines(ruleDocAfter, endOfLine),
            ).toStrictEqual(baselineWithoutTrailing);
          });
        }
      }
    }

    it('fails --check when insert_final_newline = true and the file lacks a trailing newline', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md': '',
          'README.md':
            '## Rules\n\n<!-- begin auto-generated rules list -->\n<!-- end auto-generated rules list -->\n',
          '.editorconfig': `
                root = true

                [*]
                end_of_line = lf
                insert_final_newline = true`,
        },
      });

      await generate(fixture.path);
      const readme = await fixture.readFile('README.md');
      expect(endsWithEndOfLine(readme, '\n')).toBe(true);

      // Remove the trailing newline so --check should fail.
      await writeFile(
        join(fixture.path, 'README.md'),
        stripTrailingEndOfLines(readme, '\n'),
      );

      process.exitCode = undefined;
      await generate(fixture.path, { check: true });
      expect(process.exitCode).toBe(1);
      process.exitCode = undefined;
    });

    it('does not trim existing trailing blank lines when insert_final_newline = true', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md':
            '# Description of no-foo (`test/no-foo`)\n\n<!-- end auto-generated rule header -->\n\nSome description.\n\n',
          'README.md':
            '## Rules\n\n<!-- begin auto-generated rules list -->\n<!-- end auto-generated rules list -->\n',
          '.editorconfig': `
                root = true

                [*]
                end_of_line = lf
                insert_final_newline = true`,
        },
      });

      await generate(fixture.path);

      const ruleDoc = await fixture.readFile('docs/rules/no-foo.md');
      expect(ruleDoc.endsWith('\n\n')).toBe(true);
      expect(ruleDoc).toContain('Some description.');
    });
  });
});
