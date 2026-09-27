import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

describe('generate (--url-rule-doc)', function () {
  describe('basic', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: {
                  docs: { description: 'Description for no-foo.' },
                  deprecated: true,
                  replacedBy: ['no-bar']
                },
                create(context) {}
              },
              'no-bar': {
                meta: {
                  docs: { description: 'Description for no-bar.' }
                },
                create(context) {}
              },
            },
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('uses the right URLs', async function () {
      await generate(fixture.path, {
        urlRuleDoc: 'https://example.com/rule-docs/{name}/',
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bar.md')).toMatchSnapshot();
    });
  });

  describe('function', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: {
                  docs: { description: 'Description for no-foo.' },
                  deprecated: true,
                  replacedBy: ['no-bar']
                },
                create(context) {}
              },
              'no-bar': {
                meta: {
                  docs: { description: 'Description for no-bar.' }
                },
                create(context) {}
              },
            },
          };`,
          'README.md': '## Rules\n',
          'nested/README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('uses the custom URL', async function () {
      await generate(fixture.path, {
        pathRuleList: ['README.md', 'nested/README.md'],
        urlRuleDoc(name, path) {
          return `https://example.com/rule-docs/name:${name}/path:${path}`;
        },
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('nested/README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bar.md')).toMatchSnapshot();
    });
  });

  describe('rule names with URL-unsafe characters', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no foo (bar)': {
                meta: {
                  docs: { description: 'Description for no foo (bar).' }
                },
                create(context) {}
              },
            },
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no foo (bar).md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('URL-encodes the substituted rule name in string templates', async function () {
      await generate(fixture.path, {
        urlRuleDoc: 'https://example.com/rule-docs/{name}/',
      });
      const readme = await fixture.readFile('README.md');
      expect(readme).toContain(
        '[no foo (bar)](https://example.com/rule-docs/no%20foo%20%28bar%29/)',
      );
      // Template prefix/suffix must remain unencoded.
      expect(readme).toContain('https://example.com/rule-docs/');
      expect(readme).toMatchSnapshot();
    });

    it('URL-encodes relative function return values', async function () {
      await generate(fixture.path, {
        urlRuleDoc() {
          return 'docs/rules/no foo (bar).md';
        },
      });
      const readme = await fixture.readFile('README.md');
      expect(readme).toContain(
        '[no foo (bar)](docs/rules/no%20foo%20%28bar%29.md)',
      );
      expect(readme).not.toContain('(docs/rules/no foo (bar).md)');
      expect(readme).toMatchSnapshot();
    });

    it('leaves absolute function return values unencoded', async function () {
      await generate(fixture.path, {
        urlRuleDoc() {
          // Caller owns encoding for absolute URLs.
          return 'https://example.com/rules/no%20foo%20%28bar%29.html';
        },
      });
      const readme = await fixture.readFile('README.md');
      expect(readme).toContain(
        '[no foo (bar)](https://example.com/rules/no%20foo%20%28bar%29.html)',
      );
      expect(readme).not.toContain('no%2520foo');
      expect(readme).toMatchSnapshot();
    });
  });

  describe('function returns undefined', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: {
                  docs: { description: 'Description for no-foo.' },
                  deprecated: true,
                  replacedBy: ['no-bar']
                },
                create(context) {}
              },
              'no-bar': {
                meta: {
                  docs: { description: 'Description for no-bar.' }
                },
                create(context) {}
              },
            },
          };`,
          'README.md': '## Rules\n',
          'nested/README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('should fallback to the normal URL', async function () {
      await generate(fixture.path, {
        pathRuleList: ['README.md', 'nested/README.md'],
        urlRuleDoc() {
          return undefined;
        },
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('nested/README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bar.md')).toMatchSnapshot();
    });
  });
});
