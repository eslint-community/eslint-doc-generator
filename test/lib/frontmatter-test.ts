import { outdent } from 'outdent';
import { generateFrontmatterLines } from '../../lib/frontmatter.js';
import { getContext, type Context } from '../../lib/context.js';

const cwd = process.cwd();

const name = 'no-foo';
const description = 'Description for no-foo.';

describe('frontmatter', function () {
  describe('generateFrontmatterLines', function () {
    let context: Context;

    describe('default (framework=none)', function () {
      beforeEach(async () => {
        context = await getContext(cwd, undefined, true);
      });

      it('should return nothing if no old frontmatter existed', function () {
        expect(
          generateFrontmatterLines(context, name, description, undefined),
        ).toBe('');
      });

      it('should return old frontmatter if it exists', function () {
        const frontmatter = outdent`
          ---
          title: no-foo
          description: Description for no-foo.
          ---
        `;
        expect(
          generateFrontmatterLines(context, name, description, frontmatter),
        ).toBe(frontmatter);
      });
    });

    describe('framework=starlight', function () {
      beforeEach(async () => {
        context = await getContext(cwd, { framework: 'starlight' }, true);
      });

      it('should create new frontmatter if no old frontmatter existed', function () {
        const expected = outdent`
          ---
          title: "eslint-doc-generator/no-foo"
          description: "Description for no-foo."
          ---
        `;
        expect(
          generateFrontmatterLines(context, name, description, undefined),
        ).toBe(expected);
      });

      it('should add title and description to old frontmatter', function () {
        const oldFrontmatter = outdent`
          ---
          tableOfContents:
            minHeadingLevel: 2
            maxHeadingLevel: 2
          ---
        `;

        const expected = outdent`
          ---
          title: "eslint-doc-generator/no-foo"
          description: "Description for no-foo."
          tableOfContents:
            minHeadingLevel: 2
            maxHeadingLevel: 2
          ---
        `;
        expect(
          generateFrontmatterLines(context, name, description, oldFrontmatter),
        ).toBe(expected);
      });

      it('should add title to old frontmatter and replace description', function () {
        const oldFrontmatter = outdent`
          ---
          tableOfContents:
            minHeadingLevel: 2
            maxHeadingLevel: 2
          description: "Description for no-bar."
          ---
        `;

        const expected = outdent`
          ---
          title: "eslint-doc-generator/no-foo"
          tableOfContents:
            minHeadingLevel: 2
            maxHeadingLevel: 2
          description: "Description for no-foo."
          ---
        `;
        expect(
          generateFrontmatterLines(context, name, description, oldFrontmatter),
        ).toBe(expected);
      });

      it('should add description to old frontmatter and replace title', function () {
        const oldFrontmatter = outdent`
          ---
          tableOfContents:
            minHeadingLevel: 2
            maxHeadingLevel: 2
          title: "eslint-doc-generator/no-bar"
          ---
        `;

        const expected = outdent`
          ---
          tableOfContents:
            minHeadingLevel: 2
            maxHeadingLevel: 2
          title: "eslint-doc-generator/no-foo"
          description: "Description for no-foo."
          ---
        `;
        expect(
          generateFrontmatterLines(context, name, description, oldFrontmatter),
        ).toBe(expected);
      });

      it('should should replace title and description in old frontmatter', function () {
        const oldFrontmatter = outdent`
          ---
          tableOfContents:
            minHeadingLevel: 2
            maxHeadingLevel: 2
          title: "eslint-doc-generator/no-bar"
          description: "Description for no-bar."
          ---
        `;

        const expected = outdent`
          ---
          tableOfContents:
            minHeadingLevel: 2
            maxHeadingLevel: 2
          title: "eslint-doc-generator/no-foo"
          description: "Description for no-foo."
          ---
        `;
        expect(
          generateFrontmatterLines(context, name, description, oldFrontmatter),
        ).toBe(expected);
      });

      it('should properly escape values', function () {
        const descriptionSpecial = 'Description of my "special" rule.';

        const oldFrontmatter = outdent`
          ---
          tableOfContents:
            minHeadingLevel: 2
            maxHeadingLevel: 2
          title: "eslint-doc-generator/no-bar"
          description: "Description for no-bar."
          ---
        `;

        const expected = outdent`
          ---
          tableOfContents:
            minHeadingLevel: 2
            maxHeadingLevel: 2
          title: "eslint-doc-generator/no-foo"
          description: "Description of my \\"special\\" rule."
          ---
        `;
        expect(
          generateFrontmatterLines(
            context,
            name,
            descriptionSpecial,
            oldFrontmatter,
          ),
        ).toBe(expected);
      });

      it('should replace a block scalar title', function () {
        const oldFrontmatter = outdent`
          ---
          title: |
            old
            multiline
          foo: bar
          ---
        `;

        const expected = outdent`
          ---
          title: "eslint-doc-generator/no-foo"
          description: "Description for no-foo."
          foo: bar
          ---
        `;
        expect(
          generateFrontmatterLines(context, name, description, oldFrontmatter),
        ).toBe(expected);
      });

      it('should escape quotes and newlines in description', function () {
        const descriptionSpecial = 'Say "hi"\nand bye.';

        const oldFrontmatter = outdent`
          ---
          title: "eslint-doc-generator/no-bar"
          ---
        `;

        const expected = outdent`
          ---
          title: "eslint-doc-generator/no-foo"
          description: "Say \\"hi\\"\\nand bye."
          ---
        `;
        expect(
          generateFrontmatterLines(
            context,
            name,
            descriptionSpecial,
            oldFrontmatter,
          ),
        ).toBe(expected);
      });

      it('should preserve comments and unrelated keys when updating', function () {
        const oldFrontmatter = outdent`
          ---
          # keep this comment
          foo: bar
          # title comment stays above title
          title: "eslint-doc-generator/no-bar"
          ---
        `;

        const expected = outdent`
          ---
          # keep this comment
          foo: bar
          # title comment stays above title
          title: "eslint-doc-generator/no-foo"
          description: "Description for no-foo."
          ---
        `;
        expect(
          generateFrontmatterLines(context, name, description, oldFrontmatter),
        ).toBe(expected);
      });

      it('should accept opening fence with trailing space and ... terminator', function () {
        const oldFrontmatter = [
          '--- ',
          'foo: bar',
          'title: "eslint-doc-generator/no-bar"',
          '...',
        ].join('\n');

        const expected = [
          '--- ',
          'foo: bar',
          'title: "eslint-doc-generator/no-foo"',
          'description: "Description for no-foo."',
          '...',
        ].join('\n');
        expect(
          generateFrontmatterLines(context, name, description, oldFrontmatter),
        ).toBe(expected);
      });
    });
  });
});
