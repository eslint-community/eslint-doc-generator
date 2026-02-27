import { generate } from '../../../lib/generator.js';
import { type FixtureContext, setupFixture } from '../../helpers/fixture.js';

describe('generate (configs)', () => {
  describe('config with overrides', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
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
                  recommended: {
                    overrides: [{
                      files: ['**/foo.js'],
                      rules: {
                        'test/no-foo': 'error',
                      }
                    }]
                  },
                }
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

  describe('rule config with options', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': {
                    meta: { docs: { description: 'Description of no-foo.' }, },
                    create(context) {},
                    schema: [{ /* some options */ }]
                  },
                },
                configs: {
                  recommended: {
                    rules: {
                      'test/no-foo': ['error', { /* some options */ }],
                    }
                  },
                }
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

  describe('rules that are disabled or set to warn', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': {
                    meta: { docs: { description: 'Description of no-foo.' }, },
                    create(context) {},
                  },
                  'no-bar': {
                    meta: { docs: { description: 'Description of no-bar.' }, },
                    create(context) {},
                  },
                  'no-baz': {
                    meta: { docs: { description: 'Description of no-baz.' }, },
                    create(context) {},
                  },
                  'no-biz': {
                    meta: { docs: { description: 'Description of no-biz.' }, },
                    create(context) {},
                  },
                  'no-boz': {
                    meta: { docs: { description: 'Description of no-boz.' }, },
                    create(context) {},
                  },
                  'no-buz': {
                    meta: { docs: { description: 'Description of no-buz.' }, },
                    create(context) {},
                  },
                  'no-bez': {
                    meta: { docs: { description: 'Description of no-bez.' }, },
                    create(context) {},
                  },
                },
                configs: {
                  recommended: {
                    rules: {
                      'test/no-foo': 'off',
                      'test/no-bar': 0,
                      'test/no-baz': 'error',
                      'test/no-boz': 'warn',
                      'test/no-buz': 1,
                    }
                  },
                  other: {
                    rules: {
                      'test/no-bar': 0,
                      'test/no-baz': 'off',
                      'test/no-biz': 'off',
                      'test/no-buz': 'warn',
                      'test/no-bez': 'warn',
                    }
                  },
                }
              };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
          'docs/rules/no-baz.md': '',
          'docs/rules/no-biz.md': '',
          'docs/rules/no-boz.md': '',
          'docs/rules/no-buz.md': '',
          'docs/rules/no-bez.md': '',
        },
      });
    });

    afterAll(async () => {
      await fixture.cleanup();
    });

    it('generates the documentation', async () => {
      await generate(fixture.path, {
        configEmoji: [
          ['recommended', '🔥'],
          ['other', '🌟'],
        ],
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bar.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-baz.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-biz.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-boz.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-buz.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bez.md')).toMatchSnapshot();
    });
  });

  describe('rules that are disabled or set to warn, only one config present', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': {
                    meta: { docs: { description: 'Description of no-foo.' }, },
                    create(context) {},
                  },
                  'no-bar': {
                    meta: { docs: { description: 'Description of no-bar.' }, },
                    create(context) {},
                  },
                },
                configs: {
                  recommended: {
                    rules: {
                      'test/no-foo': 1,
                      'test/no-bar': 0,
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

  describe('rules that are disabled or set to warn, two configs present', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': {
                    meta: { docs: { description: 'Description of no-foo.' }, },
                    create(context) {},
                  },
                },
                configs: {
                  recommended: {
                    rules: {
                      'test/no-foo': 1,
                    }
                  },
                  typescript: {
                    rules: {
                      'test/no-foo': 0,
                    }
                  },
                }
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

  describe('with config that does not have any rules', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
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
              configWithoutRules: { rules: {  } },
            }
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async () => {
      await fixture.cleanup();
    });

    it('uses recommended config emoji since it is the only relevant config', async () => {
      await generate(fixture.path);
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('with external rules in config', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
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
                plugins: ['external', 'test'],
                rules: {
                  'test/no-foo': 'error',
                  'external/no-bar': 'error',
                }
              },
            }
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async () => {
      await fixture.cleanup();
    });

    it('ignores external rules', async () => {
      await generate(fixture.path);
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('only a `recommended` config', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: { 'no-foo': { meta: { docs: { description: 'Description.' }, }, create(context) {} }, },
            configs: {
              recommended: {
                rules: {
                  'test/no-foo': 'error',
                }
              }
            }
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

    it('updates the documentation', async () => {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('with --ignore-config', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
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
              },
              configToIgnore: {
                rules: { 'test/no-foo': 'error' },
              }
            }
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async () => {
      await fixture.cleanup();
    });

    it('hides the ignored config', async () => {
      await generate(fixture.path, {
        ignoreConfig: ['configToIgnore'],
        configEmoji: [['configToIgnore', '😋']], // Ensure this config has an emoji that would normally display in the legend.
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('config as flat config', () => {
    let fixture: FixtureContext;

    beforeAll(async () => {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { docs: { description: 'Description of no-foo.' }, },
                create(context) {},
              },
              'no-bar': {
                meta: { docs: { description: 'Description of no-bar.' }, },
                create(context) {},
              },
            },
            configs: {
              recommended: [
                {
                  rules: {
                    'test/no-foo': 'error',
                  }
                },
                {
                  rules: {
                    'test/no-bar': 'error',
                  }
                }
              ]
            }
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
        },
      });
    });

    afterAll(async () => {
      await fixture.cleanup();
    });

    it('updates the documentation', async () => {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bar.md')).toMatchSnapshot();
    });
  });
});
