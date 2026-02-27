import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';
import { COLUMN_TYPE } from '../../../lib/types.js';

describe('generate (--rule-list-columns)', function () {
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
                      hasSuggestions: true,
                      fixable: 'code',
                      deprecated: true,
                    },
                    create(context) {}
                  },
                },
              };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('shows the right columns and legend', async function () {
      await generate(fixture.path, {
        ruleListColumns: [
          COLUMN_TYPE.HAS_SUGGESTIONS,
          COLUMN_TYPE.FIXABLE,
          COLUMN_TYPE.NAME,
        ],
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('consolidated fixableAndHasSuggestions column', function () {
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
                      hasSuggestions: true,
                      fixable: 'code',
                    },
                    create(context) {}
                  },
                  'no-bar': {
                    meta: {
                      docs: { description: 'Description for no-bar.' },
                      fixable: 'code',
                    },
                    create(context) {}
                  },
                  'no-baz': {
                    meta: {
                      docs: { description: 'Description for no-baz.' },
                    },
                    create(context) {}
                  },
                  'no-qux': {
                    meta: {
                      docs: { description: 'Description for no-qux.' },
                      hasSuggestions: true,
                    },
                    create(context) {}
                  },
                },
              };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
          'docs/rules/no-baz.md': '',
          'docs/rules/no-qux.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('shows the right columns and legend', async function () {
      await generate(fixture.path, {
        ruleListColumns: [
          COLUMN_TYPE.NAME,
          COLUMN_TYPE.FIXABLE_AND_HAS_SUGGESTIONS,
        ],
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('non-existent column', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { description: 'Description for no-foo.'} }, create(context) {} },
                },
              };`,
          'README.md': '## Rules\n',
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
          // @ts-expect-error -- testing non-existent column type
          ruleListColumns: [COLUMN_TYPE.NAME, 'non-existent'],
        }),
      ).rejects.toThrow('Invalid ruleListColumns option: non-existent');
    });
  });

  describe('duplicate column', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { description: 'Description for no-foo.'} }, create(context) {} },
                },
              };`,
          'README.md': '## Rules\n',
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
          ruleListColumns: [COLUMN_TYPE.NAME, COLUMN_TYPE.NAME],
        }),
      ).rejects.toThrow('Duplicate value detected in ruleListColumns option.');
    });
  });

  describe('shows column and notice for requiresTypeChecking', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { docs: { description: 'Description of no-foo.' }, },
                create(context) {}
              },
              'no-bar': {
                meta: { docs: { description: 'Description of no-bar.', requiresTypeChecking: true }, },
                create(context) {}
              },
            },
            configs: {
              all: {
                rules: {
                  'test/no-foo': 'error',
                }
              },
            }
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('updates the documentation', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bar.md')).toMatchSnapshot();
    });
  });
});
