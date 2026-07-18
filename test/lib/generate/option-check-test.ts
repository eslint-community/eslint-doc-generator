import { generate } from '../../../lib/generator.js';
import { join } from 'node:path';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

describe('generate (--check)', function () {
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
            },
          };`,
          'README.md': '## Rules\n',
          'docs/rules/no-foo.md': '# test/no-foo',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('prints the issues, exits with failure, and does not write changes', async function () {
      const consoleErrorStub = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      await generate(fixture.path, { check: true });
      expect(consoleErrorStub.mock.calls.length).toBe(4);
      // Use join to handle both Windows and Unix paths.
      expect(consoleErrorStub.mock.calls[0]).toStrictEqual([
        `Please run eslint-doc-generator. A rule doc is out-of-date: ${join(
          'docs',
          'rules',
          'no-foo.md',
        )}`,
      ]);
      expect(consoleErrorStub.mock.calls[1]).toMatchSnapshot(); // Diff
      expect(consoleErrorStub.mock.calls[2]).toStrictEqual([
        'Please run eslint-doc-generator. The rules table in README.md is out-of-date.',
      ]);
      expect(consoleErrorStub.mock.calls[3]).toMatchSnapshot(); // Diff
      consoleErrorStub.mockRestore();

      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });
});
