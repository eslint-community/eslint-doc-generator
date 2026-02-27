import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

describe('generate (deprecated rules)', function () {
  describe('several deprecated rules', function () {
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
                          docs: { description: 'Description.' },
                          deprecated: true,
                          replacedBy: ['no-bar'],
                        },
                        create(context) {}
                      },
                      'no-bar': {
                        meta: {
                          docs: { description: 'Description.' },
                          deprecated: true, // No replacement specified.
                        },
                        create(context) {}
                      },
                      'no-baz': {
                        meta: {
                          docs: { description: 'Description.' },
                          deprecated: true,
                          replacedBy: [], // Empty array.
                        },
                        create(context) {}
                      },
                      'no-biz': {
                        // One rule that isn't deprecated.
                        meta: {
                          docs: { description: 'Description.' },
                        },
                        create(context) {}
                      },
                      'no-boz': {
                        meta: {
                          docs: { description: 'Description.' },
                          deprecated: true,
                          replacedBy: ['no-baz', 'no-biz'], // Multiple replacements.
                        },
                        create(context) {}
                      },
                      'prefer-foo': {
                        // With the object type 'DeprecatedInfo'
                        meta: {
                          docs: { description: 'Description.' },
                          deprecated: {
                            message: 'Custom message about overall deprecation.',
                            deprecatedSince: '1.0.0',
                            availableUntil: '2.0.0',
                            url: 'https://example.org/blog/non-existant',
                          },
                        },
                        create(context) {}
                      },
                      'prefer-bar': {
                        // With the object type 'DeprecatedInfo'
                        meta: {
                          docs: { description: 'Description.' },
                          deprecated: {
                            replacedBy: [
                              {
                                // should not be present
                                rule: {}
                              },
                              {
                                rule: {
                                  name: 'no-bar',
                                }
                              },
                              {
                                message: 'Custom message',
                                url: 'https://example.org/an-external-url',
                                rule: {
                                  name: 'no-baz',
                                  url: 'https://example.org/rules/no-baz.md'
                                }
                              },
                            ]
                          },
                        },
                        create(context) {}
                      },
                    },
                    configs: {}
                  };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
          'docs/rules/no-baz.md': '',
          'docs/rules/no-biz.md': '',
          'docs/rules/no-boz.md': '',
          'docs/rules/prefer-foo.md': '',
          'docs/rules/prefer-bar.md': '',
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
      expect(await fixture.readFile('docs/rules/no-biz.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-boz.md')).toMatchSnapshot();
      expect(
        await fixture.readFile('docs/rules/prefer-foo.md'),
      ).toMatchSnapshot();
      expect(
        await fixture.readFile('docs/rules/prefer-bar.md'),
      ).toMatchSnapshot();
    });
  });

  describe('with nested rule names', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'category/no-foo': {
                    meta: {
                      docs: { description: 'Description.' },
                      deprecated: true,
                      replacedBy: ['category/no-bar'], // without plugin prefix
                    },
                    create(context) {}
                  },
                  'category/no-bar': {
                    meta: {
                      docs: { description: 'Description.' },
                      deprecated: true,
                      replacedBy: ['test/category/no-foo'], // with plugin prefix
                    },
                    create(context) {}
                  },
                  'category/prefer-foo': {
                    meta: {
                      docs: { description: 'Description.' },
                      deprecated: {
                        replacedBy: [
                          {
                            rule: {
                              name: 'category/no-bar', // without plugin prefix
                            }
                          },
                        ]
                      },
                    },
                    create(context) {}
                  },
                  'category/prefer-bar': {
                    meta: {
                      docs: { description: 'Description.' },
                      deprecated: {
                        replacedBy: [
                          {
                            rule: {
                              name: 'test/category/no-foo', // with plugin prefix
                            }
                          },
                        ]
                      },
                    },
                    create(context) {}
                  },
                },
                configs: {}
              };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/category/no-foo.md': '',
          'docs/rules/category/no-bar.md': '',
          'docs/rules/category/prefer-foo.md': '',
          'docs/rules/category/prefer-bar.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('has the correct links, especially replacement rule link', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();

      expect(
        await fixture.readFile('docs/rules/category/no-foo.md'),
      ).toMatchSnapshot();
      expect(
        await fixture.readFile('docs/rules/category/no-bar.md'),
      ).toMatchSnapshot();
      expect(
        await fixture.readFile('docs/rules/category/prefer-foo.md'),
      ).toMatchSnapshot();
      expect(
        await fixture.readFile('docs/rules/category/prefer-bar.md'),
      ).toMatchSnapshot();
    });
  });

  describe('with --path-rule-doc', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'category/no-foo': {
                meta: {
                  docs: { description: 'Description.' },
                  deprecated: true,
                  replacedBy: ['category/no-bar'], // without plugin prefix
                },
                create(context) {}
              },
              'category/no-bar': {
                meta: {
                  docs: { description: 'Description.' },
                  deprecated: true,
                  replacedBy: ['test/category/no-foo'], // with plugin prefix
                },
                create(context) {}
              },
              'category/prefer-foo': {
                meta: {
                  docs: { description: 'Description.' },
                  deprecated: {
                    replacedBy: [
                      {
                        rule: {
                          name: 'category/prefer-bar', // without plugin prefix
                        },
                      },
                    ],
                  },
                },
              },
              'category/prefer-bar': {
                meta: {
                  docs: { description: 'Description.' },
                  deprecated: {
                    replacedBy: [
                      {
                        rule: {
                          name: 'test/category/prefer-foo', // with plugin prefix
                        },
                      },
                    ],
                  },
                },
                create(context) {}
              },
            },
            configs: {}
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/category/no-foo/README.md': '',
          'docs/category/no-bar/README.md': '',
          'docs/category/prefer-foo/README.md': '',
          'docs/category/prefer-bar/README.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('has the correct links, especially replacement rule link', async function () {
      await generate(fixture.path, { pathRuleDoc: 'docs/{name}/README.md' });

      expect(await fixture.readFile('README.md')).toMatchSnapshot();

      expect(
        await fixture.readFile('docs/category/no-foo/README.md'),
      ).toMatchSnapshot();
      expect(
        await fixture.readFile('docs/category/no-bar/README.md'),
      ).toMatchSnapshot();
      expect(
        await fixture.readFile('docs/category/prefer-foo/README.md'),
      ).toMatchSnapshot();
      expect(
        await fixture.readFile('docs/category/prefer-bar/README.md'),
      ).toMatchSnapshot();
    });
  });

  describe('using prefix ahead of replacement rule name', function () {
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
                  docs: { description: 'Description.' },
                  deprecated: true,
                  replacedBy: ['test/no-bar'],
                },
                create(context) {}
              },
              'no-bar': {
                meta: { docs: { description: 'Description.' }, },
                create(context) {}
              },
              'prefer-foo': {
                meta: {
                  docs: { description: 'Description.' },
                  deprecated: {
                    replacedBy: [
                      {
                        rule: {
                          name: 'test/no-bar',
                        },
                      },
                    ],
                  },
                },
                create(context) {}
              },
            },
            configs: {}
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
          'docs/rules/prefer-foo.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('uses correct replacement rule link', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bar.md')).toMatchSnapshot();
      expect(
        await fixture.readFile('docs/rules/prefer-foo.md'),
      ).toMatchSnapshot();
    });
  });

  describe('with no rule doc but --ignore-deprecated-rules', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': {
                    meta: { deprecated: true, },
                    create(context) {}
                  },
                  'no-bar': {
                    meta: {
                      deprecated: {
                        message: 'Custom message about overall deprecation.',
                      },
                    },
                    create(context) {}
                  },
                },
                configs: {}
              };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('omits the rule from the README and does not try to update its non-existent rule doc', async function () {
      await generate(fixture.path, { ignoreDeprecatedRules: true });

      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('replaced by ESLint core rule', function () {
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
                  docs: { description: 'Description.' },
                  deprecated: true,
                  replacedBy: ['no-unused-vars'],
                },
                create(context) {}
              },
              'prefer-foo': {
                meta: {
                  docs: { description: 'Description.' },
                  deprecated: {
                    replacedBy: [
                      {
                        rule: {
                          name: 'no-unused-vars',
                        },
                      },
                    ],
                  },
                },
                create(context) {}
              },
              'prefer-bar': {
                meta: {
                  docs: { description: 'Description.' },
                  deprecated: {
                    replacedBy: [
                      {
                        rule: {
                          name: 'no-unused-vars',
                        },
                        plugin: {
                          name: 'eslint',
                        },
                      },
                    ],
                  },
                },
                create(context) {}
              },
            },
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '',
          'docs/rules/prefer-foo.md': '',
          'docs/rules/prefer-bar.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('uses correct replacement rule link', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(
        await fixture.readFile('docs/rules/prefer-foo.md'),
      ).toMatchSnapshot();
      expect(
        await fixture.readFile('docs/rules/prefer-bar.md'),
      ).toMatchSnapshot();
    });
  });

  describe('replaced by third-party plugin rule', function () {
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
                  docs: { description: 'Description.' },
                  deprecated: true,
                  replacedBy: ['other-plugin/no-unused-vars'],
                },
                create(context) {}
              },
              'prefer-foo': {
                meta: {
                  docs: { description: 'Description.' },
                  deprecated: {
                    replacedBy: [
                      {
                        rule: {
                          name: 'other-plugin/no-unused-vars'
                        }
                      },
                    ],
                  },
                },
                create(context) {}
              },
              'prefer-bar': {
                meta: {
                  docs: { description: 'Description.' },
                  deprecated: {
                    replacedBy: [
                      {
                        rule: {
                          name: 'other-plugin/no-unused-vars'
                        },
                        plugin: {
                          name: 'eslint-plugin-other-plugin',
                          url: 'https://example.org/other-plugin'
                        }
                      },
                    ],
                  },
                },
                create(context) {}
              },
            },
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '',
          'docs/rules/prefer-foo.md': '',
          'docs/rules/prefer-bar.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('uses correct replacement rule link', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(
        await fixture.readFile('docs/rules/prefer-foo.md'),
      ).toMatchSnapshot();
      expect(
        await fixture.readFile('docs/rules/prefer-bar.md'),
      ).toMatchSnapshot();
    });
  });

  describe('replaced by third-party plugin rule with same rule name as one of our rules', function () {
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
                  docs: { description: 'Description.' },
                  deprecated: true,
                  replacedBy: ['other-plugin/no-foo'],
                },
                create(context) {}
              },
              'prefer-foo': {
                meta: {
                  docs: { description: 'Description.' },
                  deprecated: {
                    replacedBy: [
                      {
                        rule: {
                          name: 'other-plugin/prefer-foo' 
                        },
                      },
                    ],
                  },
                },
                create(context) {}
              },
            },
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '',
          'docs/rules/prefer-foo.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('uses correct replacement rule link', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(
        await fixture.readFile('docs/rules/prefer-foo.md'),
      ).toMatchSnapshot();
    });
  });

  describe('DeprecatedInfo with only invalid replacedBy entries preceding a valid one', function () {
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
                  docs: { description: 'Description.' },
                  deprecated: {
                    replacedBy: [
                      { rule: {} },
                      { rule: { name: 'no-bar' } },
                    ]
                  },
                },
                create(context) {}
              },
              'no-bar': {
                meta: {
                  docs: { description: 'Description.' },
                },
                create(context) {}
              },
            },
            configs: {}
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

    it('does not produce an erroneous "and" prefix when only one valid replacement remains', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('DeprecatedInfo with only deprecatedSince (no availableUntil)', function () {
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
                  docs: { description: 'Description.' },
                  deprecated: {
                    deprecatedSince: '3.0.0',
                  },
                },
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

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('displays deprecatedSince without availableUntil', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('DeprecatedInfo with v-prefixed version strings', function () {
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
                  docs: { description: 'Description.' },
                  deprecated: {
                    deprecatedSince: 'v7.0.0',
                    availableUntil: 'v13.0.0',
                  },
                },
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

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('does not double the v prefix', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('with the object type `DeprecatedInfo`', function () {
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
                  docs: { description: 'Description.' },
                  deprecated: {
                    message: 'Custom message about overall deprecation.',
                    deprecatedSince: '1.0.0',
                    availableUntil: '2.0.0',
                    url: 'https://example.org/blog/non-existant',
                  },
                },
                create(context) {}
              },
              'no-bar': {
                meta: {
                  docs: { description: 'Description.' },
                  deprecated: {
                    message: 'Custom message about overall deprecation.',
                    availableUntil: '2.0.0',
                  }
                },
                create(context) {}
              },
              'no-baz': {
                meta: {
                  docs: { description: 'Description.' },
                  deprecated: {
                    replacedBy: [
                      {
                        // should not be present
                        rule: {}
                      },
                      {
                        rule: {
                          name: 'no-bar',
                        }
                      },
                      {
                        rule: {
                          name: 'no-baz',
                          url: 'https://example.org/rules/no-baz.md'
                        }
                      },
                      {
                        message: 'Custom message',
                        url: 'https://example.org/changelog.md',
                        rule: {
                          name: 'test/no-baz',
                        }
                      },
                      {
                        rule: {
                          name: '@stylistic/indent',
                          url: 'https://eslint.style/rules/indent',
                        },
                        plugin: {
                          name: '@sytlistic/eslint-plugin',
                          url: 'https://eslint.style/',
                        }
                      },
                    ]
                  }
                },
                create(context) {}
              },
            },
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
          'docs/rules/no-baz.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('displays correct information', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bar.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-baz.md')).toMatchSnapshot();
    });
  });
});
