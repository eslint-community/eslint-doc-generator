import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

describe('generate (package.json)', function () {
  describe('Missing plugin package.json', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': '',
        },
      });
      // Remove package.json
      await rm(join(fixture.path, 'package.json'));
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('throws an error', async function () {
      await expect(
        generate(fixture.path),
      ).rejects.toThrowErrorMatchingSnapshot();
    });
  });

  describe('Missing plugin package.json `name` field', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'package.json': {
            exports: 'index.js',
            type: 'module',
          },
          'index.js': 'export default { rules: {} }',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('throws an error', async function () {
      await expect(
        generate(fixture.path),
      ).rejects.toThrowErrorMatchingSnapshot();
    });
  });

  describe('Scoped plugin name', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'package.json': {
            name: '@my-scope/eslint-plugin',
            exports: 'index.js',
            type: 'module',
          },
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { docs: { description: 'disallow foo.' }, },
                create(context) {}
              },
            },
            configs: {
              'recommended': { rules: { '@my-scope/no-foo': 'error', } }
            }
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

    it('determines the correct plugin prefix', async function () {
      await generate(fixture.path);
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('Scoped plugin with custom plugin name', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'package.json': {
            name: '@my-scope/eslint-plugin-foo',
            exports: 'index.js',
            type: 'module',
          },
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { docs: { description: 'disallow foo.' }, },
                create(context) {}
              },
            },
            configs: {
              'recommended': { rules: { '@my-scope/foo/no-foo': 'error', } }
            }
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

    it('determines the correct plugin prefix', async function () {
      await generate(fixture.path);
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('No configs found', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
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
            }
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

    it('omits the config column', async function () {
      await generate(fixture.path);
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('No exported rules object found', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': 'export default {};',
          'README.md':
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
        generate(fixture.path),
      ).rejects.toThrowErrorMatchingSnapshot();
    });
  });

  describe('package.json using exports, as string', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'package.json': {
            name: 'eslint-plugin-test',
            exports: './index.js',
            type: 'module',
          },
          'index.js': `export default {
          rules: {
            'no-foo': {
              meta: { docs: { description: 'disallow foo.' }, },
              create(context) {}
            },
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

    it('finds the entry point', async function () {
      await expect(generate(fixture.path)).resolves.toBeUndefined();
    });
  });

  describe('package.json using exports, object with dot', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'package.json': {
            name: 'eslint-plugin-test',
            exports: { '.': './index-foo.js' },
            type: 'module',
          },
          'index-foo.js': `export default {
          rules: {
            'no-foo': {
              meta: { docs: { description: 'disallow foo.' }, },
              create(context) {}
            },
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

    it('finds the entry point', async function () {
      await expect(generate(fixture.path)).resolves.toBeUndefined();
    });
  });

  describe('plugin entry point in JSON format', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'package.json': {
            name: 'eslint-plugin-test',
            exports: './index.json',
            type: 'module',
          },
          'index.json': `
          {
            "rules": {
              "no-foo": {
                "meta": {
                  "docs": {
                    "description": "Description for no-foo"
                  }
                }
              }
            },
            "configs": {
              "recommended": {
                "rules": {
                  "test/no-foo": "error"
                }
              }
            }
          }
        `,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('plugin entry point specified but does not exist', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
        },
      });
      // Remove index.js
      await rm(join(fixture.path, 'index.js'));
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('throws an error', async function () {
      await expect(generate(fixture.path)).rejects.toThrow(
        'ESLint plugin entry point does not exist. Tried: index.js',
      );
    });
  });

  describe("plugin entry point with type: 'module' and main field specified", function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'package.json': {
            name: 'eslint-plugin-test',
            main: 'index.js',
            type: 'module',
          },
          'index.js': `export default {
          rules: {
            'no-foo': {
              meta: { docs: { description: 'disallow foo.' }, },
              create(context) {}
            },
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

    it('finds the entry point', async function () {
      await expect(generate(fixture.path)).resolves.toBeUndefined();
    });
  });

  describe('passing absolute path for plugin root', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': 'export default { rules: {}, configs: {} };',
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('finds the entry point', async function () {
      await expect(generate(fixture.path)).resolves.toBeUndefined();
    });
  });
});
