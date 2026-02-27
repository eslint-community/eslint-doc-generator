import { generate } from '../../../lib/generator.js';
import { type FixtureContext, setupFixture } from '../../helpers/fixture.js';

describe('generate (rule descriptions)', () => {
  describe('rule with long-enough description to require name column wrapping avoidance', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { description: 'over 60 chars over 60 chars over 60 chars over 60 chars over 60 chars over 60 chars'} }, create(context) {} },
                },
              };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async () => {
      await fixture.cleanup();
    });

    it('adds spaces to the name column', async () => {
      await generate(fixture.path);
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('rule with long-enough description to require name column wrapping avoidance but rule name too short', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'foo': { meta: { docs: { description: 'over 60 chars over 60 chars over 60 chars over 60 chars over 60 chars over 60 chars'} }, create(context) {} },
                },
              };`,
          'README.md': '## Rules\n',
          'docs/rules/foo.md': '',
        },
      });
    });

    afterAll(async () => {
      await fixture.cleanup();
    });

    it('does not add spaces to name column', async () => {
      await generate(fixture.path);
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/foo.md')).toMatchSnapshot();
    });
  });

  describe('Rule description needs to be formatted', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { docs: { description: 'disallow foo.' }, },
                create(context) {}
              },
            },
            configs: {}
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async () => {
      await fixture.cleanup();
    });

    it('capitalizes the first letter and removes the trailing period from the description', async () => {
      await generate(fixture.path);
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('no rules with description', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { },
                create(context) {},
              },
            },
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async () => {
      await fixture.cleanup();
    });

    it('generates the documentation', async () => {
      await generate(fixture.path);
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('one rule missing description', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { docs: { description: 'Description for no-foo.'} },
                create(context) {},
              },
              'no-bar': {
                meta: { },
                create(context) {},
              },
            },
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
        },
      });
    });

    afterAll(async () => {
      await fixture.cleanup();
    });

    it('generates the documentation', async () => {
      await generate(fixture.path);
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bar.md')).toMatchSnapshot();
    });
  });

  describe('with rule description that needs to be escaped in table', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { docs: { description: 'Foo|Bar'} },
                create(context) {},
              },
            },
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async () => {
      await fixture.cleanup();
    });

    it('generates the documentation', async () => {
      await generate(fixture.path);
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });
});
