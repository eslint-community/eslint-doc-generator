import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

describe('generate (sorting)', function () {
  describe('sorting rules and configs case-insensitive', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: {
              'c': { meta: { docs: {} }, create(context) {} },
              'a': { meta: { docs: {} }, create(context) {} },
              'B': { meta: { docs: {} }, create(context) {} },
            },
            configs: {
              'c': { rules: { 'test/a': 'error', } },
              'a': { rules: { 'test/a': 'error', } },
              'B': { rules: { 'test/a': 'error', } },
            }
          };`,
          'README.md': '## Rules\n',
          'docs/rules/a.md': '',
          'docs/rules/B.md': '',
          'docs/rules/c.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('sorts correctly', async function () {
      await generate(fixture.path, {
        configEmoji: [
          ['a', '🅰️'],
          ['B', '🅱️'],
          ['c', '🌊'],
        ],
      });
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/a.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/B.md')).toMatchSnapshot();
      expect(await fixture.readFile('docs/rules/c.md')).toMatchSnapshot();
    });
  });
});
