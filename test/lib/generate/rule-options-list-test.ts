import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';
import * as sinon from 'sinon';

describe('generate (rule options list)', function () {
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
                  schema: [{
                    type: "object",
                    properties: {
                        foo: {
                            type: "boolean",
                            description: "Enable some kind of behavior.",
                            deprecated: true,
                            default: false
                        },
                        bar: {
                            description: "Choose how to use the rule.",
                            type: "string",
                            enum: ["always", "never"],
                            default: "always"
                        },
                        baz: {
                            default: true,
                            required: true,
                        },
                        biz: {},
                        arr1: {
                          type: "array",
                        },
                        arrWithArrType: {
                          type: ["string", "boolean"],
                        },
                        arrWithArrTypeSingleItem: {
                          type: ["string"],
                        },
                        arrWithItemsType: {
                          type: "array",
                          items: {
                            type: "string"
                          }
                        },
                        arrWithItemsArrayType: {
                          type: "array",
                          items: {
                            type: ["string", "boolean"]
                          }
                        },
                        arrWithDefaultEmpty: {
                          type: "array",
                          default: [],
                        },
                        arrWithDefault: {
                          type: "array",
                          default: ['hello world', 1, 2, 3, true],
                        },
                    },
                    required: ["bar"],
                    additionalProperties: false
                 }],
                },
                create(context) {}
              },
            },
            configs: {
              recommended: {},
            }
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': `## Options
<!-- begin auto-generated rule options list -->
<!-- end auto-generated rule options list -->`,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      const consoleErrorStub = sinon.stub(console, 'error');
      await generate(fixture.path);
      expect(consoleErrorStub.callCount).toBe(0);
      consoleErrorStub.restore();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('displays default column even when only falsy value, hiding deprecated/required cols with only falsy value', function () {
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
                  schema: [{
                    type: "object",
                    properties: {
                        foo: {
                            default: false,
                            required: false,
                            deprecated: false,
                        },
                    },
                 }],
                },
                create(context) {}
              },
            },
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': `## Options
<!-- begin auto-generated rule options list -->
<!-- end auto-generated rule options list -->`,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      const consoleErrorStub = sinon.stub(console, 'error');
      await generate(fixture.path);
      expect(consoleErrorStub.callCount).toBe(0);
      consoleErrorStub.restore();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('with no options', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: {},
                create(context) {}
              },
            },
            configs: {
              recommended: {},
            }
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': `
<!-- begin auto-generated rule options list -->
<!-- end auto-generated rule options list -->`,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      const consoleErrorStub = sinon.stub(console, 'error');
      await generate(fixture.path);
      expect(consoleErrorStub.callCount).toBe(0);
      consoleErrorStub.restore();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('prefers meta.defaultOptions over schema defaults', function () {
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
                  schema: [{
                    type: "object",
                    properties: {
                        foo: {
                            type: "boolean",
                            default: false,
                        },
                    },
                 }],
                  defaultOptions: [{
                    foo: true,
                  }],
                },
                create(context) {}
              },
            },
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': `## Options
<!-- begin auto-generated rule options list -->
<!-- end auto-generated rule options list -->`,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation with defaults from meta.defaultOptions', async function () {
      const consoleErrorStub = sinon.stub(console, 'error');
      await generate(fixture.path);
      expect(consoleErrorStub.callCount).toBe(0);
      consoleErrorStub.restore();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toContain(
        '`true`',
      );
      expect(await fixture.readFile('docs/rules/no-foo.md')).not.toContain(
        '`false`',
      );
    });
  });

  describe('with no marker comments', function () {
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
                  schema: [{ type: "object", properties: { foo: { description: 'some desc' } } }]
                },
                create(context) {}
              },
            },
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '## Options\nfoo',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      const consoleErrorStub = sinon.stub(console, 'error');
      await generate(fixture.path);
      expect(consoleErrorStub.callCount).toBe(0);
      consoleErrorStub.restore();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('with string that needs to be escaped in table', function () {
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
                  schema: [{ type: "object", properties: { foo: { description: \`test
                  desc\`, type: 'string|number' } } }]
                },
                create(context) {}
              },
            },
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': `## Options
<!-- begin auto-generated rule options list -->
<!-- end auto-generated rule options list -->`,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      const consoleErrorStub = sinon.stub(console, 'error');
      await generate(fixture.path);
      expect(consoleErrorStub.callCount).toBe(0);
      consoleErrorStub.restore();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });
});
