import { generate } from '../../../lib/generator.js';
import { outdent } from 'outdent';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

describe('generate (general)', function () {
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
                    docs: { description: 'Description of no-foo.' },
                    fixable: 'code',
                    hasSuggestions: true,
                    schema: [
                      {
                        type: 'object',
                        properties: {
                          optionToDoSomething1: {
                            type: 'boolean',
                            default: false,
                          },
                        },
                        additionalProperties: false,
                      },
                      {
                        type: 'array',
                        minItems: 1,
                        maxItems: 1,
                        items: [
                          {
                            type: 'object',
                            properties: {
                              optionToDoSomething2: {
                                type: 'boolean',
                                default: false,
                              },
                            },
                            additionalProperties: false,
                          },
                        ],
                      },
                      {
                        type: 'array',
                      },
                    ]
                  },
                  create(context) {}
                },
                'no-bar': {
                  meta: {
                    docs: { description: 'Description of no-bar.' },
                    fixable: 'code',
                    schema: [],
                  },
                  create(context) {},
                },
                'no-baz': {
                  meta: { docs: { description: 'Description of no-boz.' }, },
                  create(context) {}
                },
              },
              configs: {
                all: {
                  rules: {
                    'test/no-foo': 'error',
                    'test/no-bar': 'error',
                    // test/no-baz rule intentionally not in any config.
                  }
                },
                recommended: {
                  rules: {
                    'test/no-foo': 'error',
                  }
                },
                style: {
                  rules: {
                    'test/no-bar': 'error',
                  }
                }
              }
            };`,
          'README.md': outdent`
            # eslint-plugin-test
            Description.
            ## Rules
            <!-- begin auto-generated rules list -->
            ...
            <!-- end auto-generated rules list -->
            more content.
          `,
          'docs/rules/no-foo.md': outdent`
            # title (rule-name)
            description
            <!-- end auto-generated rule header -->
            ## Rule details
            details
            ## Options
            optionToDoSomething1 - explanation
            optionToDoSomething2 - explanation
          `,
          'docs/rules/no-bar.md': outdent`
            <!-- end auto-generated rule header -->
            ## Rule details
            details
          `,
          'docs/rules/no-baz.md': outdent`
            ## Rule details
            details
          `,
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
      expect(await fixture.readFile('docs/rules/no-baz.md')).toMatchSnapshot();
    });
  });

  describe('plugin prefix', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
            export default {
              meta: {
                name: 'custom',
              },
              rules: {
                'no-foo': {
                  meta: {
                    docs: { description: 'Description of no-foo.' },
                    fixable: 'code',
                    hasSuggestions: true,
                    schema: [
                      {
                        type: 'object',
                        properties: {
                          optionToDoSomething1: {
                            type: 'boolean',
                            default: false,
                          },
                        },
                        additionalProperties: false,
                      },
                      {
                        type: 'array',
                        minItems: 1,
                        maxItems: 1,
                        items: [
                          {
                            type: 'object',
                            properties: {
                              optionToDoSomething2: {
                                type: 'boolean',
                                default: false,
                              },
                            },
                            additionalProperties: false,
                          },
                        ],
                      },
                      {
                        type: 'array',
                      },
                    ]
                  },
                  create(context) {}
                },
                'no-bar': {
                  meta: {
                    docs: { description: 'Description of no-bar.' },
                    fixable: 'code',
                    schema: [],
                  },
                  create(context) {},
                },
                'no-baz': {
                  meta: { docs: { description: 'Description of no-boz.' }, },
                  create(context) {}
                },
              },
              configs: {
                all: {
                  rules: {
                    'test/no-foo': 'error',
                    'test/no-bar': 'error',
                    // test/no-baz rule intentionally not in any config.
                  }
                },
                recommended: {
                  rules: {
                    'test/no-foo': 'error',
                  }
                },
                style: {
                  rules: {
                    'test/no-bar': 'error',
                  }
                }
              }
            };`,
          'README.md': outdent`
            # eslint-plugin-test
            Description.
            ## Rules
            <!-- begin auto-generated rules list -->
            ...
            <!-- end auto-generated rules list -->
            more content.
          `,
          'docs/rules/no-foo.md': outdent`
            # title (rule-name)
            description
            <!-- end auto-generated rule header -->
            ## Rule details
            details
            ## Options
            optionToDoSomething1 - explanation
            optionToDoSomething2 - explanation
          `,
          'docs/rules/no-bar.md': outdent`
            <!-- end auto-generated rule header -->
            ## Rule details
            details
          `,
          'docs/rules/no-baz.md': outdent`
            ## Rule details
            details
          `,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('uses `plugin.meta.name` as source for rule prefix', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bar.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-baz.md')).toMatchSnapshot();
    });
  });
});
