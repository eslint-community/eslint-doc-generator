import { generate } from '../../../lib/generator.js';
import {
  detectEndOfLine,
  getEndOfLine,
  normalizeEndOfLine,
} from '../../../lib/eol.js';
import { EOL } from 'node:os';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

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
});

describe('getEndOfLine', function () {
  describe('with a ".editorconfig" file', function () {
    describe('returns the correct end of line when ".editorconfig" exists', function () {
      let fixture: FixtureContext;
      let originalCwd: string;

      beforeEach(function () {
        originalCwd = process.cwd();
      });

      afterEach(async function () {
        process.chdir(originalCwd);
        await fixture.cleanup();
      });

      it('returns lf end of line when ".editorconfig" is configured with lf', async function () {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            '.editorconfig': `
                  root = true

                  [*]
                  end_of_line = lf`,
          },
        });
        process.chdir(fixture.path);

        expect(await getEndOfLine()).toStrictEqual('\n');
      });

      it('returns crlf end of line when ".editorconfig" is configured with crlf', async function () {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            '.editorconfig': `
                root = true

                [*]
                end_of_line = crlf`,
          },
        });
        process.chdir(fixture.path);

        expect(await getEndOfLine()).toStrictEqual('\r\n');
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
        process.chdir(fixture.path);

        expect(await getEndOfLine()).toStrictEqual('\r\n');
      });
    });

    describe('generates using the correct end of line when ".editorconfig" exists', function () {
      let fixture: FixtureContext;
      let originalCwd: string;

      beforeEach(function () {
        originalCwd = process.cwd();
      });

      afterEach(async function () {
        process.chdir(originalCwd);
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
        process.chdir(fixture.path);

        await generate(fixture.path, {
          configEmoji: [
            ['a', '🅰️'],
            ['B', '🅱️'],
            ['c', '🌊'],
          ],
        });
        // Explicit line ending assertions since snapshots normalize CRLF to LF.
        expect(await fixture.readFile('README.md')).not.toContain('\r');
        expect(await fixture.readFile('docs/rules/a.md')).not.toContain('\r');

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
        process.chdir(fixture.path);

        await generate(fixture.path, {
          configEmoji: [
            ['a', '🅰️'],
            ['B', '🅱️'],
            ['c', '🌊'],
          ],
        });
        // Explicit line ending assertions since snapshots normalize CRLF to LF.
        // The README already used CRLF, and the empty rule docs use CRLF from the config.
        const readme = await fixture.readFile('README.md');
        expect(readme).toContain('\r\n');
        expect(readme.replaceAll('\r\n', '')).not.toContain('\n');
        const docA = await fixture.readFile('docs/rules/a.md');
        expect(docA).toContain('\r\n');
        expect(docA.replaceAll('\r\n', '')).not.toContain('\n');

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
        process.chdir(fixture.path);

        await generate(fixture.path, {
          configEmoji: [
            ['a', '🅰️'],
            ['B', '🅱️'],
            ['c', '🌊'],
          ],
        });
        // Explicit line ending assertions since snapshots normalize CRLF to LF.
        // The README already used CRLF, and the empty rule docs use CRLF from the `*.md` config.
        const readme = await fixture.readFile('README.md');
        expect(readme).toContain('\r\n');
        expect(readme.replaceAll('\r\n', '')).not.toContain('\n');
        const docA = await fixture.readFile('docs/rules/a.md');
        expect(docA).toContain('\r\n');
        expect(docA.replaceAll('\r\n', '')).not.toContain('\n');

        expect(await fixture.readFile('README.md')).toMatchSnapshot();
        expect(await fixture.readFile('docs/rules/a.md')).toMatchSnapshot();
        expect(await fixture.readFile('docs/rules/B.md')).toMatchSnapshot();
        expect(await fixture.readFile('docs/rules/c.md')).toMatchSnapshot();
      });
    });
  });

  describe('with a Prettier config', function () {
    let fixture: FixtureContext;
    let originalCwd: string;

    beforeEach(function () {
      originalCwd = process.cwd();
    });

    afterEach(async function () {
      process.chdir(originalCwd);
      await fixture.cleanup();
    });

    it('returns lf end of line when ".prettierrc.json" is configured with lf', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          '.prettierrc.json': `
                  {
                    "$schema": "https://json.schemastore.org/prettierrc",
                    "endOfLine": "lf"
                  }`,
        },
      });
      process.chdir(fixture.path);

      expect(await getEndOfLine()).toStrictEqual('\n');
    });

    it('returns crlf end of line when ".prettierrc.json" is configured with crlf', async function () {
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
      process.chdir(fixture.path);

      expect(await getEndOfLine()).toStrictEqual('\r\n');
    });

    it('returns lf when ".prettierrc.json" is not configured with the "endOfLine" option', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          '.prettierrc.json': `
                  {
                    "$schema": "https://json.schemastore.org/prettierrc"
                  }`,
        },
      });
      process.chdir(fixture.path);

      expect(await getEndOfLine()).toStrictEqual('\n');
    });
  });

  describe('end-of-line detection from existing files', function () {
    let fixture: FixtureContext;
    let originalCwd: string;

    beforeEach(function () {
      originalCwd = process.cwd();
    });

    afterEach(async function () {
      process.chdir(originalCwd);
      await fixture.cleanup();
    });

    it('preserves content after the rule header marker when the rule doc uses different line endings than the configured end of line (#725)', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          // Rule doc uses LF line endings.
          'docs/rules/no-foo.md':
            '# Description of no-foo (`test/no-foo`)\n\n<!-- end auto-generated rule header -->\n\nSome description.\n\n## Further Reading\n\n- [link](https://example.com/)\n',
          'README.md':
            '## Rules\n\n<!-- begin auto-generated rules list -->\n<!-- end auto-generated rules list -->\n',
          // But the configured end of line is CRLF (same situation as the `os.EOL` fallback on Windows).
          '.editorconfig': `
                root = true

                [*]
                end_of_line = crlf`,
        },
      });
      process.chdir(fixture.path);

      await generate(fixture.path);

      const ruleDoc = await fixture.readFile('docs/rules/no-foo.md');
      expect(ruleDoc).toContain('## Further Reading');
      expect(ruleDoc).not.toContain('\r'); // Keeps its existing LF line endings.
    });

    it('inserts the rules list using the line endings of the existing file (#726)', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md': '',
          // README uses CRLF line endings but the configured end of line is LF.
          'README.md':
            '## Rules\r\n\r\n<!-- begin auto-generated rules list -->\r\n<!-- end auto-generated rules list -->\r\n',
          '.editorconfig': `
                root = true

                [*]
                end_of_line = lf`,
        },
      });
      process.chdir(fixture.path);

      await generate(fixture.path);

      const readme = await fixture.readFile('README.md');
      expect(readme).toContain('\r\n');
      // No mixed line endings: every LF should be part of a CRLF.
      expect(readme.replaceAll('\r\n', '')).not.toContain('\n');
    });

    it('unifies mixed line endings to the predominant one in the file', async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md': '',
          // README has mostly-CRLF but mixed line endings (as could be produced by older versions of this tool).
          'README.md':
            '# eslint-plugin-test\n\r\n## Rules\r\n\r\n<!-- begin auto-generated rules list -->\r\n<!-- end auto-generated rules list -->\r\n',
          '.editorconfig': `
                root = true

                [*]
                end_of_line = lf`,
        },
      });
      process.chdir(fixture.path);

      await generate(fixture.path);

      const readme = await fixture.readFile('README.md');
      expect(readme).toContain('\r\n');
      // No mixed line endings: every LF should be part of a CRLF.
      expect(readme.replaceAll('\r\n', '')).not.toContain('\n');
    });

    it('passes in --check mode when up-to-date files use different line endings than the configured end of line', async function () {
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
      process.chdir(fixture.path);

      // First, bring the CRLF docs up-to-date.
      await generate(fixture.path);

      // Then, --check should pass since nothing needs to change.
      await generate(fixture.path, { check: true });
      expect(process.exitCode).toBeUndefined();
    });
  });

  describe('fallback', function () {
    let fixture: FixtureContext;
    let originalCwd: string;

    beforeEach(function () {
      originalCwd = process.cwd();
    });

    afterEach(async function () {
      process.chdir(originalCwd);
      await fixture.cleanup();
    });

    it('handles fallback to to `EOL` from `node:os` when config files do not exist', async function () {
      // Run from a fixture directory that has no editorconfig or prettier config
      fixture = await setupFixture({
        fixture: 'esm-base',
        // No config files - just the base fixture
      });
      process.chdir(fixture.path);

      expect(await getEndOfLine()).toStrictEqual(EOL);
    });
  });
});
