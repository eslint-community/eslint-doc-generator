import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';
import * as sinon from 'sinon';
import { COLUMN_TYPE, NOTICE_TYPE } from '../../../lib/types.js';

describe('generate (rule options)', function () {
  describe('Rule doc has options section but rule has no options', function () {
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
                  all: {
                    rules: {
                      'test/no-foo': 'error',
                    }
                  }
                }
              };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '## Options\n', // empty
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('prints an error', async function () {
      const consoleErrorStub = sinon.stub(console, 'error');
      await generate(fixture.path);
      expect(consoleErrorStub.callCount).toBe(1);
      expect(consoleErrorStub.firstCall.args).toStrictEqual([
        '`no-foo` rule doc should not have included any of these headers: Options, Config',
      ]);
      consoleErrorStub.restore();
    });
  });

  describe('Rule doc missing options section', function () {
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
                      docs: { description: 'Description of no-foo.', },
                      schema: [{ type: 'object', },]
                    },
                    create(context) {},
                  },
                },
              };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '', // empty
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('prints an error', async function () {
      const consoleErrorStub = sinon.stub(console, 'error');
      await generate(fixture.path);
      expect(consoleErrorStub.callCount).toBe(1);
      expect(consoleErrorStub.firstCall.args).toStrictEqual([
        '`no-foo` rule doc should have included one of these headers: Options, Config',
      ]);
      consoleErrorStub.restore();
    });
  });

  describe('Rule doc missing options section with --rule-doc-section-options=true', function () {
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
                      docs: { description: 'Description of no-foo.', },
                      schema: [{ type: 'object', },]
                    },
                    create(context) {},
                  },
                },
              };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '', // empty
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('prints an error', async function () {
      const consoleErrorStub = sinon.stub(console, 'error');
      await generate(fixture.path, { ruleDocSectionOptions: true });
      expect(consoleErrorStub.callCount).toBe(1);
      expect(consoleErrorStub.firstCall.args).toStrictEqual([
        '`no-foo` rule doc should have included one of these headers: Options, Config',
      ]);
      consoleErrorStub.restore();
    });
  });

  describe('Rule doc missing options section with --rule-doc-section-options=false', function () {
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
                      docs: { description: 'Description of no-foo.', },
                      schema: [{ type: 'object', },]
                    },
                    create(context) {},
                  },
                },
              };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '', // empty
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('has no error', async function () {
      const consoleErrorStub = sinon.stub(console, 'error');
      await generate(fixture.path, { ruleDocSectionOptions: false });
      expect(consoleErrorStub.callCount).toBe(0);
      consoleErrorStub.restore();
    });
  });

  describe('Rule has options with quotes', function () {
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
                      docs: { description: 'Description of no-foo.', },
                      schema: [
                        {
                          type: 'object',
                          properties: {
                            'input[type="foo"]': {
                              type: 'boolean',
                              default: false,
                            },
                            "input[type='bar']": {
                              type: 'boolean',
                              default: false,
                            },
                          },
                          additionalProperties: false,
                        },
                      ]
                    },
                    create(context) {},
                  },
                },
              };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md':
            '## Options\n input[type=\\"foo\\"] \n input[type=\\\'bar\\\']',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('successfully finds the options mentioned in the rule doc despite quote escaping', async function () {
      const consoleErrorStub = sinon.stub(console, 'error');
      await generate(fixture.path);
      expect(consoleErrorStub.callCount).toBe(0);
      consoleErrorStub.restore();
    });
  });

  describe('Rule doc does not mention an option', function () {
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
                  schema: [
                    {
                      type: 'object',
                      properties: {
                        optionToDoSomething: {
                          type: 'boolean',
                          default: false,
                        },
                      },
                      additionalProperties: false,
                    },
                  ]
                },
                create(context) {}
              },
            },
            configs: {
              all: {
                rules: {
                  'test/no-foo': 'error',
                }
              }
            }
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': '## Options\n', // empty
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('prints an error', async function () {
      const consoleErrorStub = sinon.stub(console, 'error');
      await generate(fixture.path);
      expect(consoleErrorStub.callCount).toBe(1);
      expect(consoleErrorStub.firstCall.args).toStrictEqual([
        '`no-foo` rule doc should have included rule option: optionToDoSomething',
      ]);
      consoleErrorStub.restore();
    });
  });

  describe('rule with options, options column/notice enabled', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'no-foo': { meta: { schema: [{foo:true}] }, create(context) {} },
              'no-bar': { meta: { schema: {foo:true} }, create(context) {} },
              'no-biz': { meta: { schema: [] }, create(context) {} },
              'no-baz': { meta: {  }, create(context) {} },
            },
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '## Options\n',
          'docs/rules/no-bar.md': '## Options\n',
          'docs/rules/no-biz.md': '',
          'docs/rules/no-baz.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('displays the column and notice', async function () {
      await generate(fixture.path, {
        ruleListColumns: [COLUMN_TYPE.NAME, COLUMN_TYPE.OPTIONS],
        ruleDocNotices: [NOTICE_TYPE.OPTIONS],
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-bar.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-biz.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-baz.md')).toMatchSnapshot();
    });
  });
});
