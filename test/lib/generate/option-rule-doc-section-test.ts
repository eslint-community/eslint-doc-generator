import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';
import * as sinon from 'sinon';

describe('generate (rule doc sections)', function () {
  describe('with `--rule-doc-section-include` and `--rule-doc-section-exclude` and no problems', function () {
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
          'docs/rules/no-foo.md': '## Examples\n',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('has no issues', async function () {
      await expect(
        generate(fixture.path, {
          ruleDocSectionInclude: ['Examples'],
          ruleDocSectionExclude: ['Unwanted Section'],
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('with `--rule-doc-section-include` and `--rule-doc-section-exclude` and problems', function () {
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
          'docs/rules/no-foo.md': '## Unwanted Section\n',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('prints errors', async function () {
      const consoleErrorStub = sinon.stub(console, 'error');
      await generate(fixture.path, {
        ruleDocSectionInclude: ['Examples'],
        ruleDocSectionExclude: ['Unwanted Section'],
      });
      expect(consoleErrorStub.callCount).toBe(2);
      expect(consoleErrorStub.firstCall.args).toStrictEqual([
        '`no-foo` rule doc should have included the header: Examples',
      ]);
      expect(consoleErrorStub.secondCall.args).toStrictEqual([
        '`no-foo` rule doc should not have included the header: Unwanted Section',
      ]);
      consoleErrorStub.restore();
    });
  });
});
