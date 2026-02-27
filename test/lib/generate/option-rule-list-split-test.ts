import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

describe('generate (--rule-list-split)', function () {
  describe('by type', function () {
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
                  'no-baz': { meta: { type: 'suggestion' }, create(context) {} },
                  'no-biz': { meta: { /* no type */ }, create(context) {} },
                },
              };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
          'docs/rules/no-baz.md': '',
          'docs/rules/no-biz.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('splits the list', async function () {
      await generate(fixture.path, {
        ruleListSplit: 'meta.type',
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('by nested property meta.docs.category', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { category: 'fruits' } }, create(context) {} },
                  'no-bar': { meta: { docs: { category: 'candy' } }, create(context) {} },
                  'no-baz': { meta: { /* no nested object */ }, create(context) {} },
                },
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

    it('splits the list', async function () {
      await generate(fixture.path, { ruleListSplit: 'meta.docs.category' });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('by property that no rules have', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: {  }, create(context) {} },
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
        generate(fixture.path, { ruleListSplit: 'non-existent-property' }),
      ).rejects.toThrow(
        'No rules found with --rule-list-split property "non-existent-property".',
      );
    });
  });

  describe('with boolean (camelCase)', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { hasSuggestions: true }, create(context) {} },
              'no-bar': { meta: {  }, create(context) {} },
              'no-baz': { meta: { hasSuggestions: false }, create(context) {} },
            },
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

    it('splits the list with the right header', async function () {
      await generate(fixture.path, {
        ruleListSplit: 'meta.hasSuggestions',
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('with boolean (snake_case)', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { hello_world: true }, create(context) {} },
              'no-bar': { meta: {  }, create(context) {} },
              'no-baz': { meta: { hello_world: false }, create(context) {} },
            },
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

    it('splits the list with the right header', async function () {
      await generate(fixture.path, {
        ruleListSplit: 'meta.hello_world',
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('with boolean (PascalCase)', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { HelloWorld: true }, create(context) {} },
              'no-bar': { meta: {  }, create(context) {} },
              'no-baz': { meta: { HelloWorld: false }, create(context) {} },
            },
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

    it('splits the list with the right header', async function () {
      await generate(fixture.path, {
        ruleListSplit: 'meta.HelloWorld',
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('with boolean (CONSTANT_CASE)', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { HELLO_WORLD: true }, create(context) {} },
              'no-bar': { meta: {  }, create(context) {} },
              'no-baz': { meta: { HELLO_WORLD: false }, create(context) {} },
            },
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

    it('splits the list with the right header', async function () {
      await generate(fixture.path, {
        ruleListSplit: 'meta.HELLO_WORLD',
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('with boolean (unknown variable type)', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { 'foo_barBIZ-baz3bOz': false, meta: { }, create(context) {} },
              'no-bar': { 'foo_barBIZ-baz3bOz': true, meta: { }, create(context) {} },
            },
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

    it('splits the list and does the best it can with the header', async function () {
      await generate(fixture.path, {
        ruleListSplit: 'foo_barBIZ-baz3bOz',
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('with boolean (various boolean equivalent values)', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              // true
              'noOn': { meta: { foo: 'on' }, create(context) {} },
              'noYes': { meta: { foo: 'yes' }, create(context) {} },
              'noTrueString': { meta: { foo: 'true' }, create(context) {} },
              'noTrue': { meta: { foo: true }, create(context) {} },

              // false
              'no': { meta: {  }, create(context) {} },
              'noUndefined': { meta: { foo: undefined }, create(context) {} },
              'noOff': { meta: { foo: 'off' }, create(context) {} },
              'noNo': { meta: { foo: 'no' }, create(context) {} },
              'noFalseString': { meta: { foo: 'false' }, create(context) {} },
              'noFalse': { meta: { foo: false }, create(context) {} },
              'noNull': { meta: { foo: null }, create(context) {} },
              'noEmptyString': { meta: { foo: '' }, create(context) {} },
            },
          };`,
          'README.md': '## Rules\n',
          // true
          'docs/rules/noOn.md': '',
          'docs/rules/noYes.md': '',
          'docs/rules/noTrueString.md': '',
          'docs/rules/noTrue.md': '',
          // false
          'docs/rules/no.md': '',
          'docs/rules/noUndefined.md': '',
          'docs/rules/noOff.md': '',
          'docs/rules/noNo.md': '',
          'docs/rules/noFalseString.md': '',
          'docs/rules/noFalse.md': '',
          'docs/rules/noNull.md': '',
          'docs/rules/noEmptyString.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('splits the list', async function () {
      await generate(fixture.path, {
        ruleListSplit: 'meta.foo',
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('with no existing headers in file', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { category: 'fruits' } }, create(context) {} },
                  'no-bar': { meta: { docs: { category: 'candy' } }, create(context) {} },
                  'no-baz': { meta: { /* no nested object */ }, create(context) {} },
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

    it('uses the proper sub-list header level', async function () {
      await generate(fixture.path, { ruleListSplit: 'meta.docs.category' });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('with only a title in the rules file', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { category: 'fruits' } }, create(context) {} },
                  'no-bar': { meta: { docs: { category: 'candy' } }, create(context) {} },
                  'no-baz': { meta: { /* no nested object */ }, create(context) {} },
                },
              };`,
          'README.md':
            '# Rules\n<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
          'docs/rules/no-baz.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('uses the proper sub-list header level', async function () {
      await generate(fixture.path, { ruleListSplit: 'meta.docs.category' });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('ignores case when sorting headers', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { foo: 'c' }, create(context) {} },
                  'no-bar': { meta: { foo: 'a' }, create(context) {} },
                  'no-baz': { meta: { foo: 'B' }, create(context) {} },
                },
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

    it('splits the list', async function () {
      await generate(fixture.path, {
        ruleListSplit: 'meta.foo',
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('with one sub-list having no rules enabled by the config', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
              export default {
                rules: {
                  'no-foo': { 'type': 'foo', meta: { }, create(context) {} },
                  'no-bar': { 'type': 'bar', meta: { }, create(context) {} },
                },
                configs: {
                  recommended: { rules: { 'test/no-foo': 'error' } },
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

    it('splits the list and still uses recommended config emoji in both lists', async function () {
      await generate(fixture.path, {
        ruleListSplit: 'type',
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('multiple properties', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { deprecated: false, docs: { category: 'Hello' } }, create(context) {} },
              'no-bar': { meta: { deprecated: true, docs: { category: 'Should Not Show Since Deprecated' } }, create(context) {} },
              'no-baz': { meta: { deprecated: true, docs: { category: 'Should Not Show Since Deprecated' } }, create(context) {} },
              'no-biz': { meta: { deprecated: false, docs: { category: 'World' } }, create(context) {} },
            },
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
          'docs/rules/no-baz.md': '',
          'docs/rules/no-biz.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('splits the list by multiple properties', async function () {
      await generate(fixture.path, {
        ruleListSplit: ['meta.deprecated', 'meta.docs.category'],
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('multiple properties and no rules left for second property (already shown for first property)', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { deprecated: true, docs: { category: 'Apples' } }, create(context) {} },
              'no-bar': { meta: { deprecated: true, docs: { category: 'Bananas' } }, create(context) {} },
            },
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

    it('does not show the property with no rules left and does not throw', async function () {
      await generate(fixture.path, {
        ruleListSplit: ['meta.deprecated', 'meta.docs.category'],
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('multiple properties and no rules could exist for second property', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { deprecated: true, }, create(context) {} },
              'no-bar': { meta: { deprecated: true, }, create(context) {} },
            },
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

    it('throws an error', async function () {
      await expect(
        generate(fixture.path, {
          ruleListSplit: ['meta.deprecated', 'non-existent-property'],
        }),
      ).rejects.toThrow(
        'No rules found with --rule-list-split property "non-existent-property".',
      );
    });
  });

  describe('as a function', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { deprecated: true, }, create(context) {} },
              'no-bar': { meta: { deprecated: false, }, create(context) {} },
              'no-baz': { meta: { deprecated: false, }, create(context) {} },
              'no-biz': { meta: { type: 'suggestion' }, create(context) {} },
            },
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '',
          'docs/rules/no-bar.md': '',
          'docs/rules/no-baz.md': '',
          'docs/rules/no-biz.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      await generate(fixture.path, {
        ruleListSplit: (rules) => {
          const list1 = {
            rules: rules.filter(([, rule]) => rule.meta.type === 'suggestion'),
          };
          const list2 = {
            title: 'Not Deprecated',
            rules: rules.filter(([, rule]) => !rule.meta.deprecated),
          };
          const list3 = {
            title: 'Deprecated',
            rules: rules.filter(([, rule]) => rule.meta.deprecated),
          };
          const list4 = {
            title: 'Name = "no-baz"',
            rules: rules.filter(([name]) => name === 'no-baz'),
          };
          return [list1, list2, list3, list4];
        },
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('as a function but invalid return value', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { deprecated: true, }, create(context) {} },
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

    it('throws an error when no return value', async function () {
      await expect(
        generate(fixture.path, {
          // @ts-expect-error -- intentionally invalid return value
          ruleListSplit: () => {
            return null; // eslint-disable-line unicorn/no-null -- intentionally invalid return value
          },
        }),
      ).rejects.toThrow('ruleListSplit return value must be array');
    });

    it('throws an error when returning an empty array', async function () {
      await expect(
        generate(fixture.path, {
          ruleListSplit: () => {
            return [];
          },
        }),
      ).rejects.toThrow(
        'ruleListSplit return value must NOT have fewer than 1 items',
      );
    });

    it('throws an error when a sub-list has wrong type for rules', async function () {
      await expect(
        generate(fixture.path, {
          // @ts-expect-error -- intentionally invalid return value
          ruleListSplit: () => {
            return [{ title: 'Foo', rules: null }]; // eslint-disable-line unicorn/no-null -- intentionally invalid return value
          },
        }),
      ).rejects.toThrow('ruleListSplit return value/0/rules must be array');
    });

    it('throws an error when a sub-list has no rules', async function () {
      await expect(
        generate(fixture.path, {
          ruleListSplit: () => {
            return [{ title: 'Foo', rules: [] }];
          },
        }),
      ).rejects.toThrow(
        'ruleListSplit return value/0/rules must NOT have fewer than 1 items',
      );
    });

    it('throws an error when a sub-list has a non-string title', async function () {
      await expect(
        generate(fixture.path, {
          // @ts-expect-error -- intentionally invalid type
          ruleListSplit: (rules) => {
            return [{ title: 123, rules }];
          },
        }),
      ).rejects.toThrow('ruleListSplit return value/0/title must be string');
    });

    it('throws an error when same rule in list twice', async function () {
      await expect(
        generate(fixture.path, {
          ruleListSplit: (rules) => {
            const [firstRule] = rules;
            if (!firstRule) {
              throw new Error('Expected at least one rule');
            }
            return [{ title: 'Foo', rules: [firstRule, firstRule] }];
          },
        }),
      ).rejects.toThrow(
        'ruleListSplit return value/0/rules must NOT have duplicate items (items ## 0 and 1 are identical)',
      );
    });
  });
});
