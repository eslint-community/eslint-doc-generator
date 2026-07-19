import { generate } from '../../../lib/generator.js';
import { restoreBom, stripBom } from '../../../lib/eol.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

const BOM = '\uFEFF';

function countBom(contents: string): number {
  return contents.split(BOM).length - 1;
}

function countFrontmatterFences(contents: string): number {
  return stripBom(contents)
    .contents.split('\n')
    .filter((line) => line === '---').length;
}

describe('stripBom / restoreBom', function () {
  it('detects and strips a leading UTF-8 BOM', function () {
    expect(stripBom(`${BOM}# Title\n`)).toStrictEqual({
      hasBom: true,
      contents: '# Title\n',
    });
  });

  it('leaves BOM-free contents unchanged', function () {
    expect(stripBom('# Title\n')).toStrictEqual({
      hasBom: false,
      contents: '# Title\n',
    });
  });

  it('restores a BOM only when requested', function () {
    expect(restoreBom('# Title\n', true)).toStrictEqual(`${BOM}# Title\n`);
    expect(restoreBom('# Title\n', false)).toStrictEqual('# Title\n');
  });
});

describe('generate (UTF-8 BOM)', function () {
  describe('BOM + title', function () {
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
          'docs/rules/no-foo.md': `${BOM}# stale title
<!-- end auto-generated rule header -->
## Rule details
Details.
`,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('preserves the BOM and regenerates a single header', async function () {
      await generate(fixture.path, { ruleDocTitleFormat: 'name' });

      const ruleDoc = await fixture.readFile('docs/rules/no-foo.md');
      expect(ruleDoc.startsWith(BOM)).toBe(true);
      expect(countBom(ruleDoc)).toBe(1);
      const ruleDocWithoutBom = stripBom(ruleDoc).contents;
      expect(ruleDocWithoutBom).toContain('# no-foo');
      expect(ruleDocWithoutBom).not.toContain('stale title');
      expect(ruleDocWithoutBom.match(/^# /gmu)?.length).toBe(1);
    });
  });

  describe('BOM + frontmatter + title', function () {
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
          'docs/rules/no-foo.md': `${BOM}---
title: No Foo
description: Description for no-foo.
---
# stale title
<!-- end auto-generated rule header -->
## Rule details
Details.
`,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('preserves BOM and existing frontmatter with a single header', async function () {
      await generate(fixture.path, {
        framework: 'none',
        ruleDocTitleFormat: 'name',
      });

      const ruleDoc = await fixture.readFile('docs/rules/no-foo.md');
      expect(ruleDoc.startsWith(BOM)).toBe(true);
      expect(countBom(ruleDoc)).toBe(1);
      expect(countFrontmatterFences(ruleDoc)).toBe(2);
      expect(ruleDoc).toContain('title: No Foo');
      expect(ruleDoc).toContain('# no-foo');
      expect(ruleDoc).not.toContain('stale title');
    });
  });

  describe('BOM + framework frontmatter', function () {
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
          // starlight generates/updates frontmatter; without BOM stripping, line 0 is
          // "\uFEFF---" so existing frontmatter is missed and a duplicate block is prepended.
          'docs/rules/no-foo.md': `${BOM}---
title: "stale"
description: "stale description"
---
## Rule details
Details.
`,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('updates existing frontmatter without duplicating it', async function () {
      await generate(fixture.path, {
        framework: 'starlight',
        ruleDocTitleFormat: 'name',
      });

      const ruleDoc = await fixture.readFile('docs/rules/no-foo.md');
      expect(ruleDoc.startsWith(BOM)).toBe(true);
      expect(countBom(ruleDoc)).toBe(1);
      expect(countFrontmatterFences(ruleDoc)).toBe(2);
      expect(ruleDoc).toContain('title: "no-foo"');
      expect(ruleDoc).toContain('description: "Description for no-foo."');
      expect(ruleDoc).not.toContain('stale');
    });
  });

  describe('BOM in README rules-list file', function () {
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
          'README.md': `${BOM}## Rules
`,
          'docs/rules/no-foo.md': '# no-foo\n',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('preserves the README BOM when updating the rules list', async function () {
      await generate(fixture.path, { ruleDocTitleFormat: 'name' });

      const readme = await fixture.readFile('README.md');
      expect(readme.startsWith(BOM)).toBe(true);
      expect(countBom(readme)).toBe(1);
      expect(readme).toContain('begin auto-generated rules list');
      expect(readme).toContain('no-foo');
    });
  });

  describe('--check with up-to-date BOM files', function () {
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
          'README.md': `${BOM}## Rules
`,
          'docs/rules/no-foo.md': `${BOM}# stale
`,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('passes when BOM-prefixed files are already up-to-date', async function () {
      await generate(fixture.path, { ruleDocTitleFormat: 'name' });

      const ruleDoc = await fixture.readFile('docs/rules/no-foo.md');
      const readme = await fixture.readFile('README.md');
      expect(ruleDoc.startsWith(BOM)).toBe(true);
      expect(readme.startsWith(BOM)).toBe(true);

      process.exitCode = undefined;
      await generate(fixture.path, {
        check: true,
        ruleDocTitleFormat: 'name',
      });
      expect(process.exitCode).toBeUndefined();
    });
  });
});
