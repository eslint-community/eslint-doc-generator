import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

describe('generate (--framework)', function () {
  describe('none', function () {
    describe('no existing frontmatter', function () {
      let fixture: FixtureContext;

      beforeAll(async function () {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { description: 'Description for no-foo.'} }, create(context) {} },
                  'no-bar': { meta: { docs: {} }, create(context) {} }, // No description.
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

      it('creates the right title, when framework is none', async function () {
        await generate(fixture.path, {
          framework: 'none',
          ruleDocTitleFormat: 'name',
        });
        expect(
          await fixture.readFile('docs/rules/no-foo.md'),
        ).toMatchSnapshot();
        expect(
          await fixture.readFile('docs/rules/no-bar.md'),
        ).toMatchSnapshot();
      });
    });

    describe('with existing frontmatter', function () {
      let fixture: FixtureContext;

      beforeAll(async function () {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { description: 'Description for no-foo.'} }, create(context) {} },
                  'no-bar': { meta: { docs: {} }, create(context) {} }, // No description.
                },
              };`,
            'README.md': '## Rules\n',
            'docs/rules/no-foo.md': `---
title: No Foo
description: Description for no-foo.
---
`,
            'docs/rules/no-bar.md': `---
title: No Bar
description: Description for no-bar.
---
`,
          },
        });
      });

      afterAll(async function () {
        await fixture.cleanup();
      });

      it('ignores existing frontmatter, when framework is none', async function () {
        await generate(fixture.path, {
          framework: 'none',
          ruleDocTitleFormat: 'name',
        });
        expect(
          await fixture.readFile('docs/rules/no-foo.md'),
        ).toMatchSnapshot();
        expect(
          await fixture.readFile('docs/rules/no-bar.md'),
        ).toMatchSnapshot();
      });
    });

    describe('with additional content above the header', function () {
      let fixture: FixtureContext;

      beforeAll(async function () {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { description: 'Description for no-foo.'} }, create(context) {} },
                  'no-bar': { meta: { docs: {} }, create(context) {} }, // No description.
                },
              };`,
            'README.md': '## Rules\n',
            'docs/rules/no-foo.md': `<!-- editor banner that should be preserved -->
# Some pre-existing title.
## Rule details
Details.
`,
            'docs/rules/no-bar.md': `---
title: No Bar
description: Description for no-bar.
---
> 📌 A blockquote that should be preserved.
# Some pre-existing title.
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

      it('preserves additional content above the header, when framework is none', async function () {
        await generate(fixture.path, {
          framework: 'none',
          ruleDocTitleFormat: 'name',
        });
        expect(
          await fixture.readFile('docs/rules/no-foo.md'),
        ).toMatchSnapshot();
        expect(
          await fixture.readFile('docs/rules/no-bar.md'),
        ).toMatchSnapshot();
      });
    });
  });

  describe('starlight', function () {
    describe('no existing frontmatter', function () {
      let fixture: FixtureContext;

      beforeAll(async function () {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { description: 'Description for no-foo.'} }, create(context) {} },
                  'no-bar': { meta: { docs: {} }, create(context) {} }, // No description.
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

      it('creates frontmatter, when framework is starlight', async function () {
        await generate(fixture.path, {
          framework: 'starlight',
          ruleDocTitleFormat: 'name',
        });
        expect(
          await fixture.readFile('docs/rules/no-foo.md'),
        ).toMatchSnapshot();
        expect(
          await fixture.readFile('docs/rules/no-bar.md'),
        ).toMatchSnapshot();
      });
    });

    describe('with existing frontmatter', function () {
      let fixture: FixtureContext;

      afterAll(async function () {
        await fixture.cleanup();
      });

      it('updates existing frontmatter, when both title and description are present', async function () {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { description: 'Description for no-foo.'} }, create(context) {} },
                  'no-bar': { meta: { docs: {} }, create(context) {} }, // No description.
                },
              };`,
            'README.md': '## Rules\n',
            'docs/rules/no-foo.md': `---
title: No Foo
description: Description for no-foo.
---
`,
            'docs/rules/no-bar.md': `---
title: No Bar
description: Description for no-bar.
---
`,
          },
        });
        await generate(fixture.path, {
          framework: 'starlight',
          ruleDocTitleFormat: 'name',
        });
        expect(
          await fixture.readFile('docs/rules/no-foo.md'),
        ).toMatchSnapshot();
        expect(
          await fixture.readFile('docs/rules/no-bar.md'),
        ).toMatchSnapshot();
      });

      it('updates existing frontmatter, when neither title nor description is present', async function () {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { description: 'Description for no-foo.'} }, create(context) {} },
                  'no-bar': { meta: { docs: {} }, create(context) {} }, // No description.
                },
              };`,
            'README.md': '## Rules\n',
            'docs/rules/no-foo.md': `---
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 2
---
`,
            'docs/rules/no-bar.md': `---
template: splash
editUrl: false
hero:
  title: '404'
  tagline: Page not found. Check the URL or try using the search bar.
---
`,
          },
        });
        await generate(fixture.path, {
          framework: 'starlight',
          ruleDocTitleFormat: 'name',
        });
        expect(
          await fixture.readFile('docs/rules/no-foo.md'),
        ).toMatchSnapshot();
        expect(
          await fixture.readFile('docs/rules/no-bar.md'),
        ).toMatchSnapshot();
      });

      it('updates existing frontmatter, when only title is present', async function () {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { description: 'Description for no-foo.'} }, create(context) {} },
                  'no-bar': { meta: { docs: {} }, create(context) {} }, // No description.
                },
              };`,
            'README.md': '## Rules\n',
            'docs/rules/no-foo.md': `---
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 2
title: No Foo
---
`,
            'docs/rules/no-bar.md': `---
template: splash
editUrl: false
hero:
  title: '404'
  tagline: Page not found. Check the URL or try using the search bar.
title: No Bar
---
`,
          },
        });
        await generate(fixture.path, {
          framework: 'starlight',
          ruleDocTitleFormat: 'name',
        });
        expect(
          await fixture.readFile('docs/rules/no-foo.md'),
        ).toMatchSnapshot();
        expect(
          await fixture.readFile('docs/rules/no-bar.md'),
        ).toMatchSnapshot();
      });

      it('updates existing frontmatter, when only description is present', async function () {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { description: 'Description for no-foo.'} }, create(context) {} },
                  'no-bar': { meta: { docs: {} }, create(context) {} }, // No description.
                },
              };`,
            'README.md': '## Rules\n',
            'docs/rules/no-foo.md': `---
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 2
description: A description for no-foo that will be ignored, because the rule has a new description in its meta.docs.description field.
---
`,
            'docs/rules/no-bar.md': `---
template: splash
editUrl: false
hero:
  title: '404'
  tagline: Page not found. Check the URL or try using the search bar.
description: A description for no-bar that will not be ignored, because the rule doesn't have a description of its own.
---
`,
          },
        });
        await generate(fixture.path, {
          framework: 'starlight',
          ruleDocTitleFormat: 'name',
        });
        expect(
          await fixture.readFile('docs/rules/no-foo.md'),
        ).toMatchSnapshot();
        expect(
          await fixture.readFile('docs/rules/no-bar.md'),
        ).toMatchSnapshot();
      });
    });

    describe('with additional content above the header', function () {
      let fixture: FixtureContext;

      beforeAll(async function () {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            'index.js': `
              export default {
                rules: {
                  'no-foo': { meta: { docs: { description: 'Description for no-foo.'} }, create(context) {} },
                  'no-bar': { meta: { docs: {} }, create(context) {} }, // No description.
                },
              };`,
            'README.md': '## Rules\n',
            'docs/rules/no-foo.md': `<!-- editor banner that should be preserved -->
# Some pre-existing title.
<!-- end auto-generated rule header -->
## Rule details
Details.
`,
            'docs/rules/no-bar.md': `---
title: No Bar
description: Description for no-bar.
---
> 📌 A blockquote that should be preserved.
# Some pre-existing title.
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

      it('preserves additional content above the header, when framework is none', async function () {
        await generate(fixture.path, {
          framework: 'starlight',
          ruleDocTitleFormat: 'name',
        });
        expect(
          await fixture.readFile('docs/rules/no-foo.md'),
        ).toMatchSnapshot();
        expect(
          await fixture.readFile('docs/rules/no-bar.md'),
        ).toMatchSnapshot();
      });
    });
  });
});
