import { generate } from '../../../lib/generator.js';
import { getEndOfLine } from '../../../lib/eol.js';
import { EOL } from 'node:os';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

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
