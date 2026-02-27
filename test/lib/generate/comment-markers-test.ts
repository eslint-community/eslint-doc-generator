import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';
import { outdent } from 'outdent';

describe('generate (comment markers)', function () {
  describe('with one blank line around comment markers', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
                      export default {
                        rules: {
                          'no-foo': {
                            meta: { docs: { description: 'Description of no-foo.' }, fixable: 'code' },
                            create(context) {}
                          },
                        },
                      };`,
          'README.md': outdent`
            # Rules

            One blank line after this.

            <!-- begin auto-generated rules list -->


            <!-- end auto-generated rules list -->

            One blank line before this.
          `,
          'docs/rules/no-foo.md': outdent`
            <!-- end auto-generated rule header -->

            One blank line before this.
          `,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('with no blank lines around comment markers', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
                      export default {
                        rules: {
                          'no-foo': {
                            meta: { docs: { description: 'Description of no-foo.' }, fixable: 'code' },
                            create(context) {}
                          },
                        },
                      };`,
          'README.md': outdent`
            # Rules

            No blank line after this.
            <!-- begin auto-generated rules list -->
            <!-- end auto-generated rules list -->
            No blank line before this.
          `,
          'docs/rules/no-foo.md': outdent`
            <!-- end auto-generated rule header -->
            No blank line before this.
          `,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('no existing comment markers - with no blank lines in existing content', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
                      export default {
                        rules: {
                          'no-foo': {
                            meta: { docs: { description: 'Description of no-foo.' }, fixable: 'code' },
                            create(context) {}
                          },
                        },
                      };`,
          'README.md': outdent`
            ## Rules
            Existing rules section content.
          `,
          'docs/rules/no-foo.md': outdent`
            # no-foo
            Existing rule doc content.
          `,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('no existing comment markers - with one blank line around existing content', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
                      export default {
                        rules: {
                          'no-foo': {
                            meta: { docs: { description: 'Description of no-foo.' }, fixable: 'code' },
                            create(context) {}
                          },
                        },
                      };`,
          'README.md': outdent`
            ## Rules

            Existing rules section content.
          `,
          'docs/rules/no-foo.md': outdent`
            # no-foo

            Existing rule doc content.
          `,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('generates the documentation', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('no existing comment markers - minimal doc content', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
                      export default {
                        rules: {
                          'no-foo': {
                            meta: { docs: { description: 'Description of no-foo.' }, fixable: 'code' },
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

    it('generates the documentation', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('README.md')).toMatchSnapshot();

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('no existing comment markers - rule doc with YAML-formatted metadata (front matter) above title', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: { 'no-foo': { meta: { docs: { description: 'Description.' }, }, create(context) {} }, },
            configs: { recommended: { rules: { 'test/no-foo': 'error', } } }
          };`,
          'README.md': '## Rules\n',
          // YAML-formatted metadata (front matter) content above title.
          'docs/rules/no-foo.md': outdent`
            ---
            pageClass: "rule-details"
            sidebarDepth: 0
            title: "plugin/rule-name"
            description: "disallow foo"
            since: "v0.12.0"
            ---
            # Some pre-existing title.
            Pre-existing notice about the rule being recommended.
            ## Rule details
            Details.
          `,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('updates the documentation', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('README missing rule list markers but with rules section', function () {
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
            configs: {}
          };`,
          'README.md': outdent`
            # eslint-plugin-test

            Foo.

            ## Rules

            Old rules list.

            ## Other

            Bar.
          `,
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('adds rule list markers to rule section', async function () {
      await generate(fixture.path);
      expect(await fixture.readFile('README.md')).toMatchSnapshot();
    });
  });

  describe('README missing rule list markers and no rules section', function () {
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
          };`,
          'README.md': '# eslint-plugin-test',
          'docs/rules/no-foo.md': '',
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('throws an error', async function () {
      await expect(
        generate(fixture.path),
      ).rejects.toThrowErrorMatchingSnapshot();
    });
  });

  describe('rule doc without header marker but pre-existing header', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: { 'no-foo': { meta: { docs: { description: 'Description.' }, }, create(context) {} }, },
            configs: { recommended: { rules: { 'test/no-foo': 'error', } } }
          };`,
          'README.md':
            '<!-- begin auto-generated rules list --><!-- end auto-generated rules list -->',
          'docs/rules/no-foo.md': outdent`
            # Some pre-existing title.
            Pre-existing notice about the rule being recommended.
            ## Rule details
            Details.
          `,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('updates the documentation', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('rule doc with YAML-formatted metadata (front matter) above title and comment marker', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: { 'no-foo': { meta: { docs: { description: 'Description.' }, }, create(context) {} }, },
            configs: { recommended: { rules: { 'test/no-foo': 'error', } } }
          };`,
          'README.md': '## Rules\n',
          // YAML-formatted metadata (front matter) above title.
          'docs/rules/no-foo.md': outdent`
            ---
            pageClass: "rule-details"
            sidebarDepth: 0
            title: "plugin/rule-name"
            description: "disallow foo"
            since: "v0.12.0"
            ---
            # Outdated title.
            Outdated content.
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

    it('updates the documentation', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });

  describe('rule doc with YAML-formatted metadata (front matter) and nothing else', function () {
    let fixture: FixtureContext;

    beforeAll(async function () {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'index.js': `
          export default {
            rules: { 'no-foo': { meta: { docs: { description: 'Description.' }, }, create(context) {} }, },
            configs: { recommended: { rules: { 'test/no-foo': 'error', } } }
          };`,
          'README.md': '## Rules\n',
          // YAML-formatted metadata (front matter) only.
          'docs/rules/no-foo.md': outdent`
            ---
            pageClass: "rule-details"
            sidebarDepth: 0
            title: "plugin/rule-name"
            description: "disallow foo"
            since: "v0.12.0"
            ---
          `,
        },
      });
    });

    afterAll(async function () {
      await fixture.cleanup();
    });

    it('updates the documentation', async function () {
      await generate(fixture.path);

      expect(await fixture.readFile('docs/rules/no-foo.md')).toMatchSnapshot();
    });
  });
});
