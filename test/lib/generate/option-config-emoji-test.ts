import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';
import { EMOJI_CONFIG_ERROR } from '../../../lib/emojis.js';

describe('generate (--config-emoji)', function () {
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
                  'no-baz': { meta: { docs: { description: 'Description for no-boz.'} }, create(context) {} },
                },
                configs: {
                  recommended: {
                    rules: { 'test/no-foo': 'error', 'test/no-bar': 'error' },
                  },
                  stylistic: {
                    rules: { 'test/no-bar': 'error', 'test/no-baz': 'error' },
                  },
                  custom: {
                    rules: { 'test/no-baz': 'error' },
                  }
                }
              };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
          'docs/rules/no-baz.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('shows the correct emojis', async function () {
      await generate(fixture.path, {
        configEmoji: [
          ['recommended', '🔥'],
          ['stylistic', '🎨'],
          ['custom', '🌟'],
        ],
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bar.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-baz.md')).toMatchSnapshot();
    });
  });

  describe('with default emoji for common config', function () {
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
                    rules: { 'test/no-foo': 'error' },
                  }
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

    it('uses the default emoji when no configEmoji option is provided', async function () {
      await generate(fixture.path); // No configEmoji option - should use default ✅ for recommended
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('with manually supplied badge markdown', function () {
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
                  funConfig: {
                    rules: { 'test/no-foo': 'error' },
                  }
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

    it('uses the badge markdown as provided', async function () {
      await generate(fixture.path, {
        configEmoji: [
          [
            'funConfig',
            '![fun config badge](https://img.shields.io/badge/-fun-blue.svg)',
          ],
        ],
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('with missing emoji for a config', function () {
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
              foo: {
                rules: { 'test/no-foo': 'error', },
              },
              bar: {
                rules: { 'test/no-foo': 'error', },
              },
              baz: {
                rules: { 'test/no-foo': 'error', },
              }
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

    it('throws an error for configs without emojis', async function () {
      await expect(
        generate(fixture.path, {
          configEmoji: [
            ['bar', '🎨'],
            // no emoji for baz - should throw error
            ['foo', '🔥'],
          ],
        }),
      ).rejects.toThrow(
        'Config "baz" does not have an emoji. Please provide one using the --config-emoji option or ignore the config using --ignore-config.',
      );
    });
  });

  describe('invalid format', function () {
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
        // @ts-expect-error -- testing invalid input (too many items)
        generate(fixture.path, { configEmoji: [['foo', 'bar', 'baz']] }),
      ).rejects.toThrow(
        'Invalid configEmoji option: foo,bar,baz. Expected format: config,emoji',
      );

      await expect(
        // @ts-expect-error -- testing invalid input (too few items)
        generate(fixture.path, { configEmoji: [[]] }),
      ).rejects.toThrow(
        'Invalid configEmoji option: . Expected format: config,emoji',
      );
    });
  });

  describe('trying to remove a default emoji that does not exist', function () {
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
          configEmoji: [['config-without-default-emoji']],
        }),
      ).rejects.toThrow(
        'Invalid configEmoji option: config-without-default-emoji. Expected format: config,emoji',
      );
    });
  });

  describe('removing default emoji for a config', function () {
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
                  recommended: { rules: { 'test/no-foo': 'error' } },
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

    it('throws an error when no emoji is provided', async function () {
      await expect(
        generate(fixture.path, {
          configEmoji: [['recommended']],
        }),
      ).rejects.toThrow(
        'Config "recommended" does not have an emoji. Please provide one using the --config-emoji option or ignore the config using --ignore-config.',
      );
    });
  });

  describe('non-existent config', function () {
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
                configs: {}
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
          configEmoji: [['config-does-not-exist', '🔥']],
        }),
      ).rejects.toThrow(
        'Invalid configEmoji option: config-does-not-exist config not found.',
      );
    });
  });

  describe('using a reserved emoji', function () {
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
                  recommended: { rules: { 'test/no-foo': 'error' } },
                  style: { rules: { 'test/no-foo': 'error' } },
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

    it('throws an error', async function () {
      await expect(
        generate(fixture.path, {
          configEmoji: [['recommended', EMOJI_CONFIG_ERROR]],
        }),
      ).rejects.toThrow(`Cannot specify reserved emoji ${EMOJI_CONFIG_ERROR}.`);
    });
  });

  describe('duplicate config name', function () {
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
                  recommended: { rules: { 'test/no-foo': 'error' } },
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

    it('throws an error', async function () {
      await expect(
        generate(fixture.path, {
          configEmoji: [
            ['recommended', '🔥'],
            ['recommended', '😋'],
          ],
        }),
      ).rejects.toThrow(
        'Duplicate config name in configEmoji options: recommended',
      );
    });
  });

  describe('with one config that does not have emoji', function () {
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
                  configWithoutEmoji: { rules: { 'test/no-foo': 'error' } },
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

    it('throws an error', async function () {
      await expect(generate(fixture.path)).rejects.toThrow(
        'Config "configWithoutEmoji" does not have an emoji. Please provide one using the --config-emoji option or ignore the config using --ignore-config.',
      );
    });
  });
});
