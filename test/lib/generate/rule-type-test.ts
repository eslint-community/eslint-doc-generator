import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';
import { COLUMN_TYPE } from '../../../lib/types.js';

describe('generate (rule type)', function () {
  describe('rule with type, type column not enabled', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { type: 'problem' }, create(context) {} },
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

    it('hides the type column', async function () {
      await generate(fixture.path);
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('rule with type, type column enabled', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { type: 'problem' }, create(context) {} },
              'no-bar': { meta: { type: 'suggestion' }, create(context) {} },
              'no-biz': { meta: { type: 'layout' }, create(context) {} },
              'no-boz': { meta: { type: 'unknown' }, create(context) {} },
              'no-buz': { meta: { /* no type*/ }, create(context) {} },
            },
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
          'docs/rules/no-biz.md': '',
          'docs/rules/no-boz.md': '',
          'docs/rules/no-buz.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('displays the type', async function () {
      await generate(fixture.path, {
        ruleListColumns: [COLUMN_TYPE.NAME, COLUMN_TYPE.TYPE],
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bar.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-biz.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-boz.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-buz.md')).toMatchSnapshot();
    });
  });

  describe('rule with type, type column enabled, but only an unknown type', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { type: 'unknown' }, create(context) {} },
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

    it('hides the type column and notice', async function () {
      await generate(fixture.path, {
        ruleListColumns: [COLUMN_TYPE.NAME, COLUMN_TYPE.TYPE],
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });
});
