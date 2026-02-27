import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';
import { NOTICE_TYPE } from '../../../lib/types.js';

describe('generate (--rule-doc-notices)', function () {
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
                  type: 'problem'
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

    it('shows description before other notices when using default notice ordering', async function () {
      await generate(fixture.path);
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });

    it('shows the right rule doc notices', async function () {
      await generate(fixture.path, {
        ruleDocNotices: [
          NOTICE_TYPE.HAS_SUGGESTIONS,
          NOTICE_TYPE.FIXABLE,
          NOTICE_TYPE.DEPRECATED,
          NOTICE_TYPE.DESCRIPTION,
          NOTICE_TYPE.TYPE,
        ], // Random values including all the optional notices.
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('non-existent notice', function () {
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
          // @ts-expect-error -- testing non-existent notice type
          ruleDocNotices: [NOTICE_TYPE.FIXABLE, 'non-existent'],
        }),
      ).rejects.toThrow('Invalid ruleDocNotices option: non-existent');
    });
  });

  describe('duplicate notice', function () {
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
          ruleDocNotices: [NOTICE_TYPE.FIXABLE, NOTICE_TYPE.FIXABLE],
        }),
      ).rejects.toThrow('Duplicate value detected in ruleDocNotices option.');
    });
  });

  describe('hasSuggestions only (without fixable) using fixableAndHasSuggestions notice', function () {
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

    it('shows only hasSuggestions notice', async function () {
      await generate(fixture.path, {
        ruleDocNotices: [NOTICE_TYPE.FIXABLE_AND_HAS_SUGGESTIONS],
      });
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('passing string instead of enum to simulate real-world usage where enum type is not available', function () {
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
          'docs/rules/no-foo.md': '## Examples\n',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('has no issues', async function () {
      await expect(
        generate(fixture.path, {
          ruleDocNotices: ['type'],
          ruleListColumns: ['name'],
        }),
      ).resolves.toBeUndefined();
    });
  });
});
