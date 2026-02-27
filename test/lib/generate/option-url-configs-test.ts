import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

describe('generate (--url-configs)', function () {
  describe('basic', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { description: 'Description for no-foo.'} }, create(context) {} },
                  'no-bar': { meta: { docs: { description: 'Description for no-bar.'} }, create(context) {} },
                },
                configs: {
                  recommended: {
                    rules: {
                      'test/no-foo': 'error',
                    }
                  },
                  customConfig: {
                    rules: {
                      'test/no-bar': 'error',
                    }
                  },
                }
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

    it('includes the config link', async function () {
      await generate(fixture.path, {
        urlConfigs: 'https://example.com/configs',
        configEmoji: [
          ['recommended', '🔥'],
          ['customConfig', '⭐'],
        ],
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bar.md')).toMatchSnapshot();
    });
  });

  describe('with only recommended config', function () {
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
                configs: {
                  recommended: {
                    rules: {
                      'test/no-foo': 'error',
                    }
                  },
                }
              };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('includes the config link', async function () {
      await generate(fixture.path, {
        urlConfigs: 'https://example.com/configs',
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });
});
