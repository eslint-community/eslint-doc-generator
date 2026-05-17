import { outdent } from 'outdent';
import {
  extractFrontmatter,
  findFinalHeaderLevel,
  findSectionHeader,
  replaceOrCreateFrontmatter,
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
    it('should extract frontmatter when it is present at the beginning of the file', function () {
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

    it('should return undefined if there is no frontmatter', function () {
      const markdown = outdent`
        # Test Rule
        This is the content of the rule doc.
      `;

      expect(context).toBeDefined();
      expect(extractFrontmatter(context, markdown)).toBeUndefined();
    });

    it('should return undefined if there is only one frontmatter delimiter', function () {
      const markdown = outdent`
        ---
        # Test Rule
        This is the content of the rule doc.
      `;

      expect(context).toBeDefined();
      expect(extractFrontmatter(context, markdown)).toBeUndefined();
    });

    it('should return undefined if there is a frontmatter-like section that does not start at the beginning of the file', function () {
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

  describe('findFinalHeaderLevel', function () {
    describe("framework='none'", () => {
      it('should detect top header', function () {
        const markdown = normalize(outdent`
          # Header
          Some description
        `);
        expect(findFinalHeaderLevel(context, markdown)).toBe(1);
      });

      it('should detect sub-header', function () {
        const markdown = outdent`
          # Header
          Some description
          ## Rules
        `;
        expect(findFinalHeaderLevel(context, markdown)).toBe(2);
      });

      it('should detect last sub-header', function () {
        expect(
          findFinalHeaderLevel(
            context,
            normalize(outdent`
              # eslint-plugin-test
              Description.
              ## Configs
              Configs
              ### Some config
              Description
              ## Rules
              Rules
            `),
          ),
        ).toBe(2);
      });

      it('should return undefined when no header found', function () {
        expect(findFinalHeaderLevel(context, 'Description')).toBeUndefined();
      });

      it('should ignore frontmatter', function () {
        expect(
          findFinalHeaderLevel(
            context,
            normalize(outdent`
              ---
              title: Test Rule
              description: This is a test rule.
              ---
              Rules
            `),
          ),
        ).toBeUndefined();
      });
    });

    describe("framework='starlight'", () => {
      it('should detect top header', function () {
        const markdown = normalize(outdent`
          # Header
          Some description
        `);
        expect(findFinalHeaderLevel(context, markdown, 'starlight')).toBe(1);
      });

      it('should detect sub-header', function () {
        const markdown = normalize(outdent`
          # Header
          Some description
          ## Rules
        `);
        expect(findFinalHeaderLevel(context, markdown, 'starlight')).toBe(2);
      });

      it('should detect last sub-header', function () {
        expect(
          findFinalHeaderLevel(
            context,
            normalize(outdent`
              # eslint-plugin-test
              Description.
              ## Configs
              Configs
              ### Some config
              Description
              ## Rules
              Rules
            `),
            'starlight',
          ),
        ).toBe(2);
      });

      it('should return undefined when no header found', function () {
        expect(
          findFinalHeaderLevel(context, 'Description', 'starlight'),
        ).toBeUndefined();
      });

      it('should treat frontmatter as H1 when no other header found', function () {
        expect(
          findFinalHeaderLevel(
            context,
            normalize(outdent`
              ---
              title: Test Rule
              description: This is a test rule.
              ---
              Rules
            `),
            'starlight',
          ),
        ).toBe(1);
      });

      it('should still return last header even when frontmatter is present', function () {
        expect(
          findFinalHeaderLevel(
            context,
            normalize(outdent`
              ---
              title: Test Rule
              description: This is a test rule.
              ---
              ## Rules
            `),
            'starlight',
          ),
        ).toBe(2);
      });
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

  describe('replaceOrCreateFrontmatter', function () {
    it('should leave everything as it was when no frontmatter was passed in (none existing)', function () {
      const markdown = normalize(
        outdent`
          # Rule
          Intro sentence.
          <!-- end auto-generated rule header -->
          Rule description.
        `,
      );

      expect(replaceOrCreateFrontmatter(context, markdown, undefined)).toBe(
        markdown,
      );
    });

    it('should leave everything as it was when no frontmatter was passed in (existing frontmatter)', function () {
      const markdown = normalize(
        outdent`
          ---
          name: no-foo
          description: Some description
          ---
          # Rule
          Intro sentence.
          <!-- end auto-generated rule header -->
          Rule description.
        `,
      );

      expect(replaceOrCreateFrontmatter(context, markdown, undefined)).toBe(
        markdown,
      );
    });

    it('should create new frontmatter when no existing frontmatter exists', function () {
      const markdown = normalize(
        outdent`
          Rule description.
        `,
      );
      const newFrontmatter = normalize(
        outdent`
          ---
          title: New Rule
          ---
        `,
      );

      expect(
        replaceOrCreateFrontmatter(context, markdown, newFrontmatter),
      ).toBe(`${newFrontmatter}${context.endOfLine}${markdown}`);
    });

    it('should replace existing frontmatter with the specified new frontmatter', function () {
      const markdown = normalize(
        outdent`
          ---
          title: Old Rule
          ---
          Rule description.
        `,
      );
      const newFrontmatter = normalize(
        outdent`
          ---
          title: New Rule
          ---
        `,
      );

      expect(
        replaceOrCreateFrontmatter(context, markdown, newFrontmatter),
      ).toBe(`${newFrontmatter}${context.endOfLine}Rule description.`);
    });
  });

  describe('replaceOrCreateHeader', function () {
    describe('for md files', function () {
      it('should create a new header when no existing header or marker exists', function () {
        const markdown = normalize(
          outdent`
            This is the content of the rule doc.
          `,
        );
        const newHeader = normalize(
          outdent`
            # New Rule
            <!-- end auto-generated rule header -->
          `,
        );

        expect(replaceOrCreateHeader(context, markdown, newHeader, false)).toBe(
          `${newHeader}${context.endOfLine}${markdown}`,
        );
      });

      it('should replace an existing title header and preserve the original body', function () {
        const markdown = normalize(
          outdent`
            # Old Rule
            Rule description.
          `,
        );
        const newHeader = normalize(
          outdent`
            # New Rule
            <!-- end auto-generated rule header -->
          `,
        );

        expect(replaceOrCreateHeader(context, markdown, newHeader, false)).toBe(
          `${newHeader}${context.endOfLine}Rule description.`,
        );
      });

      it('should replace everything up to the marker and keep content after the marker', function () {
        const markdown = normalize(
          outdent`
            # Old Rule
            Intro sentence.
            <!-- end auto-generated rule header -->
            Rule description.
          `,
        );
        const newHeader = normalize(
          outdent`
            # New Rule
            <!-- end auto-generated rule header -->
          `,
        );

        expect(replaceOrCreateHeader(context, markdown, newHeader, false)).toBe(
          `${newHeader}${context.endOfLine}Rule description.`,
        );
      });

      it('should preserve frontmatter and doc body when replacing header', function () {
        const frontmatter = normalize(
          outdent`
            ---
            title: Old Rule
            ---
          `,
        );
        const markdown = normalize(
          outdent`
            ${frontmatter}
            # Old Rule
            Rule description.
          `,
        );
        const newHeader = normalize(
          outdent`
            # New Rule
            <!-- end auto-generated rule header -->
          `,
        );

        expect(replaceOrCreateHeader(context, markdown, newHeader, false)).toBe(
          `${frontmatter}${context.endOfLine}${newHeader}${context.endOfLine}Rule description.`,
        );
      });

      it('should should preserve additional content between frontmatter and header', function () {
        const frontmatter = normalize(
          outdent`
            ---
            title: Old Rule
            ---
          `,
        );
        const markdown = normalize(
          outdent`
            ${frontmatter}
            > 📌 A blockquote that should be preserved.
            # Old Rule
            Rule description.
          `,
        );
        const newHeader = normalize(
          outdent`
            # New Rule
            <!-- end auto-generated rule header -->
          `,
        );

        expect(replaceOrCreateHeader(context, markdown, newHeader, false)).toBe(
          `${frontmatter}${context.endOfLine}> 📌 A blockquote that should be preserved.${context.endOfLine}${newHeader}${context.endOfLine}Rule description.`,
        );
      });

      it('should should preserve additional content above header when no frontmatter exists', function () {
        const markdown = normalize(
          outdent`
            > 📌 A blockquote that should be preserved.
            # Old Rule
            Rule description.
          `,
        );
        const newHeader = normalize(
          outdent`
            # New Rule
            <!-- end auto-generated rule header -->
          `,
        );

        expect(replaceOrCreateHeader(context, markdown, newHeader, false)).toBe(
          `> 📌 A blockquote that should be preserved.${context.endOfLine}${newHeader}${context.endOfLine}Rule description.`,
        );
      });
    });

    describe('for mdx files', function () {
      it('should create a new header when no existing header or marker exists', function () {
        const markdown = normalize(
          outdent`
            This is the content of the rule doc.
          `,
        );
        const newHeader = normalize(
          outdent`
            # New Rule
            {/* end auto-generated rule header */}
          `,
        );

        expect(replaceOrCreateHeader(context, markdown, newHeader, true)).toBe(
          `${newHeader}${context.endOfLine}${markdown}`,
        );
      });

      it('should replace an existing title header and preserve the original body', function () {
        const markdown = normalize(
          outdent`
            # Old Rule
            Rule description.
          `,
        );
        const newHeader = normalize(
          outdent`
            # New Rule
            {/* end auto-generated rule header */}
          `,
        );

        expect(replaceOrCreateHeader(context, markdown, newHeader, true)).toBe(
          `${newHeader}${context.endOfLine}Rule description.`,
        );
      });

      it('should replace everything up to the marker and keep content after the marker', function () {
        const markdown = normalize(
          outdent`
            # Old Rule
            Intro sentence.
            {/* end auto-generated rule header */}
            Rule description.
          `,
        );
        const newHeader = normalize(
          outdent`
            # New Rule
            {/* end auto-generated rule header */}
          `,
        );

        expect(replaceOrCreateHeader(context, markdown, newHeader, true)).toBe(
          `${newHeader}${context.endOfLine}Rule description.`,
        );
      });

      it('should preserve frontmatter and doc body when replacing header', function () {
        const frontmatter = normalize(
          outdent`
            ---
            title: Old Rule
            ---
          `,
        );
        const markdown = normalize(
          outdent`
            ${frontmatter}
            # Old Rule
            Rule description.
          `,
        );
        const newHeader = normalize(
          outdent`
            # New Rule
            {/* end auto-generated rule header */}
          `,
        );

        expect(replaceOrCreateHeader(context, markdown, newHeader, true)).toBe(
          `${frontmatter}${context.endOfLine}${newHeader}${context.endOfLine}Rule description.`,
        );
      });

      it('should should preserve additional content between frontmatter and header', function () {
        const frontmatter = normalize(
          outdent`
            ---
            title: Old Rule
            ---
          `,
        );
        const markdown = normalize(
          outdent`
            ${frontmatter}
            > 📌 A blockquote that should be preserved.
            # Old Rule
            Rule description.
          `,
        );
        const newHeader = normalize(
          outdent`
            # New Rule
            {/* end auto-generated rule header */}
          `,
        );

        expect(replaceOrCreateHeader(context, markdown, newHeader, true)).toBe(
          `${frontmatter}${context.endOfLine}> 📌 A blockquote that should be preserved.${context.endOfLine}${newHeader}${context.endOfLine}Rule description.`,
        );
      });

      it('should should preserve additional content above header when no frontmatter exists', function () {
        const markdown = normalize(
          outdent`
            > 📌 A blockquote that should be preserved.
            # Old Rule
            Rule description.
          `,
        );
        const newHeader = normalize(
          outdent`
            # New Rule
            {/* end auto-generated rule header */}
          `,
        );

        expect(replaceOrCreateHeader(context, markdown, newHeader, true)).toBe(
          `> 📌 A blockquote that should be preserved.${context.endOfLine}${newHeader}${context.endOfLine}Rule description.`,
        );
      });
    });
  });
});
