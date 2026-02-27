import { generate } from '../../../lib/generator.js';
import { join } from 'node:path';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

describe('generate (file paths)', function () {
  describe('missing rule doc', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { },
                create(context) {}
              },
              'no-bar': {
                meta: { schema: [{ type: 'object', properties: { option1: {} } }] },
                create(context) {}
              },
            },
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    describe('when initRuleDocs is false', () => {
      it('throws an error', async function () {
        // Use join to handle both Windows and Unix paths.
        await expect(generate(fixture.path)).rejects.toThrow(
          `Could not find rule doc (run with --init-rule-docs to create): ${join(
            'docs',
            'rules',
            'no-bar.md',
          )}`,
        );
      });
    });
  });

  describe('missing rule doc with initRuleDocs', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { },
                create(context) {}
              },
              'no-bar': {
                meta: { schema: [{ type: 'object', properties: { option1: {} } }] },
                create(context) {}
              },
            },
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    describe('when initRuleDocs is true', () => {
      it('creates the rule doc', async function () {
        await generate(fixture.path, { initRuleDocs: true });
        expect(
          await fixture.readFile('docs/rules/no-foo.md'),
        ).toMatchSnapshot();
        expect(
          await fixture.readFile('docs/rules/no-bar.md'),
        ).toMatchSnapshot(); // Should add options section.
      });
    });
  });

  describe('missing rule doc, initRuleDocs is true, and with ruleDocSectionInclude', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { },
                create(context) {}
              },
              'no-bar': {
                meta: { schema: [{ type: 'object', properties: { option1: {} } }] },
                create(context) {}
              },
            },
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('creates the rule doc including the mandatory section', async function () {
      await generate(fixture.path, {
        initRuleDocs: true,
        ruleDocSectionInclude: ['Examples'],
      });
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bar.md')).toMatchSnapshot(); // Should add options section.
    });
  });

  describe('no missing rule doc but --init-rule-docs enabled', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'docs/rules/no-foo.md': '',
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { },
                create(context) {}
              },
            },
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('throws an error', async function () {
      await expect(
        generate(fixture.path, { initRuleDocs: true }),
      ).rejects.toThrow(
        '--init-rule-docs was enabled, but no rule doc file needed to be created.',
      );
    });
  });

  describe('missing README', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': {
                    meta: { },
                    create(context) {}
                  },
                },
              };`,
          'docs/rules/no-foo.md': '',
        },
      });
      // Remove README.md by overwriting with undefined doesn't work, so we need to use a different approach
      // Actually, we can't delete files with setupFixture, so let's create a fixture without README
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('throws an error', async function () {
      // Need to manually delete the README for this test
      const { rm } = await import('node:fs/promises');
      await rm(join(fixture.path, 'README.md'));

      await expect(generate(fixture.path)).rejects.toThrow(
        'Could not find README.md in ESLint plugin.',
      );
    });
  });

  describe('lowercase README file', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { }, create(context) {} },
                },
              };`,
          'docs/rules/no-foo.md': '',
        },
      });
      // Rename README.md to readme.md (handles case-insensitive filesystems)
      const { rename } = await import('node:fs/promises');
      await rename(
        join(fixture.path, 'README.md'),
        join(fixture.path, 'readme.md'),
      );
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      await generate(fixture.path);
      expect(await fixture.readFile('readme.md')).toMatchSnapshot();
    });
  });

  describe('custom path to rule docs and rules list', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { }, create(context) {} },
                },
              };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'rules/list.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'rules/no-foo/no-foo.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      await generate(fixture.path, {
        pathRuleDoc: join('rules', '{name}', '{name}.md'),
        pathRuleList: join('rules', 'list.md'),
      });
      expect(await fixture.readFile('rules/list.md')).toMatchSnapshot();
      expect(
        await fixture.readFile('rules/no-foo/no-foo.md'),
      ).toMatchSnapshot();
    });
  });

  describe('custom path to rule docs using function', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { }, create(context) {} },
                },
              };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'rules/no-foo/no-foo.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation using a function for pathRuleDoc', async function () {
      await generate(fixture.path, {
        pathRuleDoc: (ruleName) => join('rules', ruleName, `${ruleName}.md`),
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(
        await fixture.readFile('rules/no-foo/no-foo.md'),
      ).toMatchSnapshot();
    });
  });

  describe('multiple rules lists', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { }, create(context) {} },
            },
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'rules/list.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/index.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      await generate(fixture.path, {
        pathRuleList: [
          'README.md',
          join('rules', 'list.md'),
          join('docs', 'rules', 'index.md'),
        ],
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('rules/list.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/index.md')).toMatchSnapshot();
    });
  });

  describe('multiple rules lists but incorrectly using CSV string for option', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { }, create(context) {} },
            },
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'rules/list.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('throws an error', async function () {
      await expect(
        generate(fixture.path, {
          pathRuleList: `README.md,${join('rules', 'list.md')}`,
        }),
      ).rejects.toThrow(
        `Provide property as array, not a CSV string: README.md,${join(
          'rules',
          'list.md',
        )}`,
      );

      await expect(
        generate(fixture.path, {
          pathRuleList: [`README.md,${join('rules', 'list.md')}`],
        }),
      ).rejects.toThrow(
        `Provide property as array, not a CSV string: README.md,${join(
          'rules',
          'list.md',
        )}`,
      );
    });
  });

  describe('empty array of rule lists (happens when CLI option is not passed)', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { }, create(context) {} },
            },
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('falls back to default rules list', async function () {
      await generate(fixture.path, {
        pathRuleList: [],
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });
});
