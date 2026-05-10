import { outdent } from 'outdent';
import {
  extractFrontmatter,
  findSectionHeader,
  replaceOrCreateHeader,
} from '../../lib/markdown.js';
import { getContext } from '../../lib/context.js';

const cwd = process.cwd();
const context = await getContext(cwd, undefined, true);

function normalize(markdown: string) {
  return markdown.split('\n').join(context.endOfLine);
}

describe('markdown', function () {
  describe('extractFrontmatter', function () {
    it('extracts frontmatter when it is present at the beginning of the file', function () {
      const markdown = outdent`
        ---
        title: Test Rule
        description: This is a test rule.
        ---
        # Test Rule
        This is the content of the rule doc.
      `;

      expect(context).toBeDefined();
      expect(extractFrontmatter(context, markdown)).toBe(outdent`
        ---
        title: Test Rule
        description: This is a test rule.
        ---
      `);
    });

    it('returns undefined if there is no frontmatter', function () {
      const markdown = outdent`
        # Test Rule
        This is the content of the rule doc.
      `;

      expect(context).toBeDefined();
      expect(extractFrontmatter(context, markdown)).toBeUndefined();
    });

    it('returns undefined if there is only one frontmatter delimiter', function () {
      const markdown = outdent`
        ---
        # Test Rule
        This is the content of the rule doc.
      `;

      expect(context).toBeDefined();
      expect(extractFrontmatter(context, markdown)).toBeUndefined();
    });

    it('returns undefined if there is a frontmatter-like section that does not start at the beginning of the file', function () {
      const markdown = outdent`
        # Test Rule
        This is the content of the rule doc.
        ---
        title: Test Rule
        description: This is a test rule.
        ---
      `;

      expect(context).toBeDefined();
      expect(extractFrontmatter(context, markdown)).toBeUndefined();
    });
  });

  describe('findSectionHeader', function () {
    it('handles standard section title', function () {
      const title = '## Rules\n';
      expect(findSectionHeader(context, title, 'rules')).toBe(title);
    });

    it('handles section title with leading emoji', function () {
      const title = '## 🍟 Rules\n';
      expect(findSectionHeader(context, title, 'rules')).toBe(title);
    });

    it('handles section title with html', function () {
      const title = "## <a name='Rules'></a>Rules\n";
      expect(findSectionHeader(context, title, 'rules')).toBe(title);
    });

    it('handles sentential section title', function () {
      const title = '## List of supported rules\n';
      expect(findSectionHeader(context, title, 'rules')).toBe(title);
    });

    it('handles doc with multiple sections', function () {
      expect(
        findSectionHeader(
          context,
          outdent`
            # eslint-plugin-test
            Description.
            ## Rules
            Rules.
            ## Other section
            Foo.
          `,
          'rules',
        ),
      ).toBe('## Rules\n');
    });

    it('handles doc with multiple rules-related sections', function () {
      expect(
        findSectionHeader(
          context,
          outdent`
            # eslint-plugin-test
            Description.
            ## Rules with foo
            Rules with foo.
            ## Rules
            Rules.
            ## More specific section about rules
            Foo.
          `,
          'rules',
        ),
      ).toBe('## Rules\n');
    });
  });

  describe('replaceOrCreateHeader', function () {
    it('creates a new header when no existing header or marker exists', function () {
      const markdown = normalize(
        outdent`
          This is the content of the rule doc.
        `,
      );
      const newHeader = normalize(
        outdent`
          # New Rule
          <!-- marker -->
        `,
      );

      expect(
        replaceOrCreateHeader(context, markdown, newHeader, '<!-- marker -->'),
      ).toBe(`${newHeader}${context.endOfLine}${markdown}`);
    });

    it('replaces an existing title header and preserves the original body', function () {
      const markdown = normalize(
        outdent`
          # Old Rule
          Rule description.
        `,
      );
      const newHeader = normalize(
        outdent`
          # New Rule
          <!-- marker -->
        `,
      );

      expect(
        replaceOrCreateHeader(context, markdown, newHeader, '<!-- marker -->'),
      ).toBe(`${newHeader}${context.endOfLine}Rule description.`);
    });

    it('replaces everything up to the marker and keeps content after the marker', function () {
      const markdown = normalize(
        outdent`
          # Old Rule
          Intro sentence.
          <!-- marker -->
          Rule description.
        `,
      );
      const newHeader = normalize(
        outdent`
          # New Rule
          <!-- marker -->
        `,
      );

      expect(
        replaceOrCreateHeader(context, markdown, newHeader, '<!-- marker -->'),
      ).toBe(`${newHeader}${context.endOfLine}Rule description.`);
    });

    it('replaces YAML frontmatter and title with a new header while preserving the doc body', function () {
      const markdown = normalize(
        outdent`
          ---
          title: Old Rule
          ---
          # Old Rule
          Rule description.
        `,
      );
      const newHeader = normalize(
        outdent`
          # New Rule
          <!-- marker -->
        `,
      );

      expect(
        replaceOrCreateHeader(context, markdown, newHeader, '<!-- marker -->'),
      ).toBe(`${newHeader}${context.endOfLine}Rule description.`);
    });

    it('replace YAML frontmatter when no title exists', function () {
      const markdown = normalize(
        outdent`
          ---
          title: Old Rule
          ---
          Rule description.
        `,
      );
      const newHeader = normalize(
        outdent`
          ---
          title: New Rule
          ---
          <!-- marker -->
        `,
      );

      expect(
        replaceOrCreateHeader(context, markdown, newHeader, '<!-- marker -->'),
      ).toBe(`${newHeader}${context.endOfLine}Rule description.`);
    });
  });
});
