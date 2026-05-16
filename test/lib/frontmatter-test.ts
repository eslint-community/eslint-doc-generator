import { outdent } from 'outdent';
import { generateFrontmatterLines } from '../../lib/frontmatter.js';
import { getContext, type Context } from '../../lib/context.js';

const cwd = process.cwd();

function normalize(context: Context, markdown: string) {
  return markdown.split('\n').join(context.endOfLine);
}

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
        const frontmatter = normalize(
          context,
          outdent`
            ---
            title: no-foo
            description: Description for no-foo.
            ---
          `,
        );
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
        const expected = normalize(
          context,
          outdent`
            ---
            title: "eslint-doc-generator/no-foo"
            description: "Description for no-foo."
            ---
          `,
        );
        expect(
          generateFrontmatterLines(context, name, description, undefined),
        ).toBe(expected);
      });

      it('should add title and description to old frontmatter', function () {
        const oldFrontmatter = normalize(
          context,
          outdent`
            ---
            tableOfContents:
              minHeadingLevel: 2
              maxHeadingLevel: 2
            ---
          `,
        );

        const expected = normalize(
          context,
          outdent`
            ---
            title: "eslint-doc-generator/no-foo"
            description: "Description for no-foo."
            tableOfContents:
              minHeadingLevel: 2
              maxHeadingLevel: 2
            ---
          `,
        );
        expect(
          generateFrontmatterLines(context, name, description, oldFrontmatter),
        ).toBe(expected);
      });

      it('should add title to old frontmatter and replace description', function () {
        const oldFrontmatter = normalize(
          context,
          outdent`
            ---
            tableOfContents:
              minHeadingLevel: 2
              maxHeadingLevel: 2
            description: "Description for no-bar."
            ---
          `,
        );

        const expected = normalize(
          context,
          outdent`
            ---
            title: "eslint-doc-generator/no-foo"
            tableOfContents:
              minHeadingLevel: 2
              maxHeadingLevel: 2
            description: "Description for no-foo."
            ---
          `,
        );
        expect(
          generateFrontmatterLines(context, name, description, oldFrontmatter),
        ).toBe(expected);
      });

      it('should add description to old frontmatter and replace title', function () {
        const oldFrontmatter = normalize(
          context,
          outdent`
            ---
            tableOfContents:
              minHeadingLevel: 2
              maxHeadingLevel: 2
            title: "eslint-doc-generator/no-bar"
            ---
          `,
        );

        const expected = normalize(
          context,
          outdent`
            ---
            tableOfContents:
              minHeadingLevel: 2
              maxHeadingLevel: 2
            title: "eslint-doc-generator/no-foo"
            description: "Description for no-foo."
            ---
          `,
        );
        expect(
          generateFrontmatterLines(context, name, description, oldFrontmatter),
        ).toBe(expected);
      });

      it('should should replace title and description in old frontmatter', function () {
        const oldFrontmatter = normalize(
          context,
          outdent`
            ---
            tableOfContents:
              minHeadingLevel: 2
              maxHeadingLevel: 2
            title: "eslint-doc-generator/no-bar"
            description: "Description for no-bar."
            ---
          `,
        );

        const expected = normalize(
          context,
          outdent`
            ---
            tableOfContents:
              minHeadingLevel: 2
              maxHeadingLevel: 2
            title: "eslint-doc-generator/no-foo"
            description: "Description for no-foo."
            ---
          `,
        );
        expect(
          generateFrontmatterLines(context, name, description, oldFrontmatter),
        ).toBe(expected);
      });

      it('should properly escape values', function () {
        const descriptionSpecial = 'Description of my "special" rule.';

        const oldFrontmatter = normalize(
          context,
          outdent`
            ---
            tableOfContents:
              minHeadingLevel: 2
              maxHeadingLevel: 2
            title: "eslint-doc-generator/no-bar"
            description: "Description for no-bar."
            ---
          `,
        );

        const expected = normalize(
          context,
          outdent`
            ---
            tableOfContents:
              minHeadingLevel: 2
              maxHeadingLevel: 2
            title: "eslint-doc-generator/no-foo"
            description: "Description of my \\"special\\" rule."
            ---
          `,
        );
        expect(
          generateFrontmatterLines(
            context,
            name,
            descriptionSpecial,
            oldFrontmatter,
          ),
        ).toBe(expected);
      });
    });
  });
});
