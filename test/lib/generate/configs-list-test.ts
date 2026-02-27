import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

describe('generate (configs list)', function () {
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
                meta: { docs: { description: 'Description of no-foo.' }, },
                create(context) {}
              },
            },
            configs: {
              recommended: {},
            }
          };`,
          'README.md': `## Rules
## Configs
<!-- begin auto-generated configs list -->
<!-- end auto-generated configs list -->`,
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
    });
  });

  describe('with --ignore-config', function () {
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
            },
            configs: {
              foo: {},
              recommended: {},
            }
          };`,
          'README.md': `## Rules
## Configs
<!-- begin auto-generated configs list -->
<!-- end auto-generated configs list -->`,
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      await generate(fixture.path, { ignoreConfig: ['foo'] });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('with --config-format', function () {
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
            },
            configs: {
              recommended: {},
            }
          };`,
          'README.md': `## Rules
## Configs
<!-- begin auto-generated configs list -->
<!-- end auto-generated configs list -->`,
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      await generate(fixture.path, { configFormat: 'prefix-name' });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('with configs not defined in alphabetical order', function () {
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
            },
            configs: {
              recommended: {},
              foo: {},
            }
          };`,
          'README.md': `## Rules
## Configs
<!-- begin auto-generated configs list -->
<!-- end auto-generated configs list -->`,
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
    });
  });

  describe('when a config exports a description', function () {
    describe('property=description', function () {
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
              },
              configs: {
                foo: {},
                recommended: { description: 'This config has the recommended rules...' },
              }
            };`,
            'README.md': `## Rules
  ## Configs
  <!-- begin auto-generated configs list -->
  <!-- end auto-generated configs list -->`,
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
      });
    });

    describe('property=meta.description', function () {
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
              },
              configs: {
                foo: {},
                recommended: { meta: { description: 'This config has the recommended rules...' } },
              }
            };`,
            'README.md': `## Rules
  ## Configs
  <!-- begin auto-generated configs list -->
  <!-- end auto-generated configs list -->`,
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
      });
    });

    describe('property=meta.docs.description', function () {
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
              },
              configs: {
                foo: {},
                recommended: { meta: { docs: { description: 'This config has the recommended rules...' } } },
              }
            };`,
            'README.md': `## Rules
  ## Configs
  <!-- begin auto-generated configs list -->
  <!-- end auto-generated configs list -->`,
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
      });
    });
  });

  describe('when a config description needs to be escaped in table', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { docs: { description: 'Description no-foo.' }, },
                create(context) {}
              },
            },
            configs: {
              recommended: { description: 'Foo|Bar' },
            }
          };`,
          'README.md': `## Rules
## Configs
<!-- begin auto-generated configs list -->
<!-- end auto-generated configs list -->`,
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
    });
  });

  describe('when there are no configs', function () {
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
            },
         };`,
          'README.md': `## Rules
## Configs
<!-- begin auto-generated configs list -->
<!-- end auto-generated configs list -->`,
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
    });
  });

  describe('when all configs are ignored', function () {
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
            },
            configs: {
              recommended: {},
            }
         };`,
          'README.md': `## Rules
## Configs
<!-- begin auto-generated configs list -->
<!-- end auto-generated configs list -->`,
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      await generate(fixture.path, { ignoreConfig: ['recommended'] });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });
});
