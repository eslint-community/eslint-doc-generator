import { generate } from '../../../lib/generator.js';
import { relative } from 'node:path';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

describe('generate (postprocess option)', function () {
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
                    meta: {},
                    create(context) {}
                  },
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

    it('calls the postprocessor', async function () {
      await generate(fixture.path, {
        postprocess: (content, path) =>
          [
            content,
            '',
            `Located at ${relative(fixture.path, path).replaceAll('\\', '/')}`, // Always use forward slashes in the path so the snapshot is right even when testing on Windows.
          ].join('\n'),
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });
});
