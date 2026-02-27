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
