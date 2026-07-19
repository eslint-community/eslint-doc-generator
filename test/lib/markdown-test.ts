import { outdent } from 'outdent';
import {
  extractFrontmatter,
  findFinalHeaderLevel,
  findSectionHeader,
  replaceOrCreateFrontmatter,
  replaceOrCreateHeader,
} from '../../lib/markdown.js';
import { getContext, type Context } from '../../lib/context.js';

const cwd = process.cwd();

describe('markdown', function () {
  let context: Context;

  beforeEach(async function () {
    context = await getContext(cwd, undefined, true);
  });

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
      expect(extractFrontmatter(markdown)).toBe(outdent`
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
      expect(extractFrontmatter(markdown)).toBeUndefined();
    });

    it('should return undefined if there is only one frontmatter delimiter', function () {
      const markdown = outdent`
        ---
        # Test Rule
        This is the content of the rule doc.
      `;

      expect(context).toBeDefined();
      expect(extractFrontmatter(markdown)).toBeUndefined();
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
      expect(extractFrontmatter(markdown)).toBeUndefined();
    });
  });

  describe('findFinalHeaderLevel', function () {
    describe("framework='none'", () => {
      it('should detect top header', function () {
        const markdown = outdent`
          # Header
          Some description
        `;
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
            outdent`
              # eslint-plugin-test
              Description.
              ## Configs
              Configs
              ### Some config
              Description
              ## Rules
              Rules
            `,
          ),
        ).toBe(2);
      });

      it('should return undefined when no header found', function () {
        expect(findFinalHeaderLevel(context, 'Description')).toBeUndefined();
      });

      it('should detect closed ATX heading level', function () {
        const markdown = outdent`
          # Header
          Some description
          ## Rules ##
        `;
        expect(findFinalHeaderLevel(context, markdown)).toBe(2);
      });

      it('should detect closed ATX heading with tabs after opening hashes', function () {
        expect(findFinalHeaderLevel(context, '##\tRules\t##')).toBe(2);
      });

      it('should ignore frontmatter', function () {
        expect(
          findFinalHeaderLevel(
            context,
            outdent`
              ---
              title: Test Rule
              description: This is a test rule.
              ---
              Rules
            `,
          ),
        ).toBeUndefined();
      });
    });

    describe("framework='starlight'", () => {
      beforeEach(async function () {
        context = await getContext(cwd, { framework: 'starlight' }, true);
      });

      it('should detect top header', function () {
        const markdown = outdent`
          # Header
          Some description
        `;
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
            outdent`
              # eslint-plugin-test
              Description.
              ## Configs
              Configs
              ### Some config
              Description
              ## Rules
              Rules
            `,
          ),
        ).toBe(2);
      });

      it('should return undefined when no header found', function () {
        expect(findFinalHeaderLevel(context, 'Description')).toBeUndefined();
      });

      it('should treat frontmatter as H1 when no other header found', function () {
        expect(
          findFinalHeaderLevel(
            context,
            outdent`
              ---
              title: Test Rule
              description: This is a test rule.
              ---
              Rules
            `,
          ),
        ).toBe(1);
      });

      it('should still return last header even when frontmatter is present', function () {
        expect(
          findFinalHeaderLevel(
            context,
            outdent`
              ---
              title: Test Rule
              description: This is a test rule.
              ---
              ## Rules
            `,
          ),
        ).toBe(2);
      });
    });
  });

  describe('findSectionHeader', function () {
    it('handles standard section title', function () {
      const title = '## Rules\n';
      expect(findSectionHeader(title, 'rules')).toBe(title);
    });

    it('handles section title with leading emoji', function () {
      const title = '## 🍟 Rules\n';
      expect(findSectionHeader(title, 'rules')).toBe(title);
    });

    it('handles section title with html', function () {
      const title = "## <a name='Rules'></a>Rules\n";
      expect(findSectionHeader(title, 'rules')).toBe(title);
    });

    it('handles sentential section title', function () {
      const title = '## List of supported rules\n';
      expect(findSectionHeader(title, 'rules')).toBe(title);
    });

    it('handles doc with multiple sections', function () {
      expect(
        findSectionHeader(
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

    it('treats character class metacharacters as literal', function () {
      const title = '## Options [x\n';
      expect(findSectionHeader(title, 'Options [x')).toBe(title);
    });

    it('treats parentheses as literal', function () {
      const markdown = outdent`
        ## Options advanced
        Not this one.
        ## Options (advanced)
        This one.
      `;
      expect(findSectionHeader(markdown, 'Options (advanced)')).toBe(
        '## Options (advanced)\n',
      );
    });

    it('treats plus signs as literal', function () {
      const title = '## C++\n';
      expect(findSectionHeader(title, 'C++')).toBe(title);
    });

    it('treats dots as literal', function () {
      const markdown = outdent`
        ## Options X
        Not this one.
        ## Options .
        This one.
      `;
      expect(findSectionHeader(markdown, 'Options .')).toBe('## Options .\n');
    });

    it('handles closed ATX headings', function () {
      const title = '## Options ##\n';
      expect(findSectionHeader(title, 'Options')).toBe(title);
    });

    it('finds level-3 headings when no level-2 match exists', function () {
      const markdown = outdent`
        # Rule
        ### Examples
        Examples here.
      `;
      expect(findSectionHeader(markdown, 'Examples')).toBe('### Examples\n');
    });

    it('prefers level-2 over other heading levels', function () {
      const markdown = outdent`
        # Examples overview
        ### Examples details
        ## Examples
        Body.
      `;
      expect(findSectionHeader(markdown, 'Examples')).toBe('## Examples\n');
    });

    it('handles heading as the last line without a trailing newline', function () {
      expect(findSectionHeader('## Options', 'Options')).toBe('## Options');
    });

    it('handles closed ATX heading as the last line without a trailing newline', function () {
      expect(findSectionHeader('## Options ##', 'Options')).toBe(
        '## Options ##',
      );
    });
  });

  describe('replaceOrCreateFrontmatter', function () {
    it('should leave everything as it was when no frontmatter was passed in (none existing)', function () {
      const markdown = outdent`
        # Rule
        Intro sentence.
        <!-- end auto-generated rule header -->
        Rule description.
      `;

      expect(replaceOrCreateFrontmatter(markdown, undefined)).toBe(markdown);
    });

    it('should leave everything as it was when no frontmatter was passed in (existing frontmatter)', function () {
      const markdown = outdent`
        ---
        name: no-foo
        description: Some description
        ---
        # Rule
        Intro sentence.
        <!-- end auto-generated rule header -->
        Rule description.
      `;

      expect(replaceOrCreateFrontmatter(markdown, undefined)).toBe(markdown);
    });

    it('should create new frontmatter when no existing frontmatter exists', function () {
      const markdown = outdent`
        Rule description.
      `;
      const newFrontmatter = outdent`
        ---
        title: New Rule
        ---
      `;

      expect(replaceOrCreateFrontmatter(markdown, newFrontmatter)).toBe(
        `${newFrontmatter}\n${markdown}`,
      );
    });

    it('should replace existing frontmatter with the specified new frontmatter', function () {
      const markdown = outdent`
        ---
        title: Old Rule
        ---
        Rule description.
      `;
      const newFrontmatter = outdent`
        ---
        title: New Rule
        ---
      `;

      expect(replaceOrCreateFrontmatter(markdown, newFrontmatter)).toBe(
        `${newFrontmatter}\nRule description.`,
      );
    });
  });

  describe('replaceOrCreateHeader', function () {
    describe('for md files', function () {
      it('should create a new header when no existing header or marker exists', function () {
        const markdown = outdent`
          This is the content of the rule doc.
        `;
        const newHeader = outdent`
          # New Rule
          <!-- end auto-generated rule header -->
        `;

        expect(replaceOrCreateHeader(markdown, newHeader, false)).toBe(
          `${newHeader}\n${markdown}`,
        );
      });

      it('should replace an existing title header and preserve the original body', function () {
        const markdown = outdent`
          # Old Rule
          Rule description.
        `;
        const newHeader = outdent`
          # New Rule
          <!-- end auto-generated rule header -->
        `;

        expect(replaceOrCreateHeader(markdown, newHeader, false)).toBe(
          `${newHeader}\nRule description.`,
        );
      });

      it('should replace everything up to the marker and keep content after the marker', function () {
        const markdown = outdent`
          # Old Rule
          Intro sentence.
          <!-- end auto-generated rule header -->
          Rule description.
        `;
        const newHeader = outdent`
          # New Rule
          <!-- end auto-generated rule header -->
        `;

        expect(replaceOrCreateHeader(markdown, newHeader, false)).toBe(
          `${newHeader}\nRule description.`,
        );
      });

      it('should preserve frontmatter and doc body when replacing header', function () {
        const frontmatter = outdent`
          ---
          title: Old Rule
          ---
        `;
        const markdown = outdent`
          ${frontmatter}
          # Old Rule
          Rule description.
        `;
        const newHeader = outdent`
          # New Rule
          <!-- end auto-generated rule header -->
        `;

        expect(replaceOrCreateHeader(markdown, newHeader, false)).toBe(
          `${frontmatter}\n${newHeader}\nRule description.`,
        );
      });

      it('should should preserve additional content between frontmatter and header', function () {
        const frontmatter = outdent`
          ---
          title: Old Rule
          ---
        `;
        const markdown = outdent`
          ${frontmatter}
          > 📌 A blockquote that should be preserved.
          # Old Rule
          Rule description.
        `;
        const newHeader = outdent`
          # New Rule
          <!-- end auto-generated rule header -->
        `;

        expect(replaceOrCreateHeader(markdown, newHeader, false)).toBe(
          `${frontmatter}\n> 📌 A blockquote that should be preserved.\n${newHeader}\nRule description.`,
        );
      });

      it('should should preserve additional content above header when no frontmatter exists', function () {
        const markdown = outdent`
          > 📌 A blockquote that should be preserved.
          # Old Rule
          Rule description.
        `;
        const newHeader = outdent`
          # New Rule
          <!-- end auto-generated rule header -->
        `;

        expect(replaceOrCreateHeader(markdown, newHeader, false)).toBe(
          `> 📌 A blockquote that should be preserved.\n${newHeader}\nRule description.`,
        );
      });
    });

    describe('for mdx files', function () {
      it('should create a new header when no existing header or marker exists', function () {
        const markdown = outdent`
          This is the content of the rule doc.
        `;
        const newHeader = outdent`
          # New Rule
          {/* end auto-generated rule header */}
        `;

        expect(replaceOrCreateHeader(markdown, newHeader, true)).toBe(
          `${newHeader}\n${markdown}`,
        );
      });

      it('should replace an existing title header and preserve the original body', function () {
        const markdown = outdent`
          # Old Rule
          Rule description.
        `;
        const newHeader = outdent`
          # New Rule
          {/* end auto-generated rule header */}
        `;

        expect(replaceOrCreateHeader(markdown, newHeader, true)).toBe(
          `${newHeader}\nRule description.`,
        );
      });

      it('should replace everything up to the marker and keep content after the marker', function () {
        const markdown = outdent`
          # Old Rule
          Intro sentence.
          {/* end auto-generated rule header */}
          Rule description.
        `;
        const newHeader = outdent`
          # New Rule
          {/* end auto-generated rule header */}
        `;

        expect(replaceOrCreateHeader(markdown, newHeader, true)).toBe(
          `${newHeader}\nRule description.`,
        );
      });

      it('should preserve frontmatter and doc body when replacing header', function () {
        const frontmatter = outdent`
          ---
          title: Old Rule
          ---
        `;
        const markdown = outdent`
          ${frontmatter}
          # Old Rule
          Rule description.
        `;
        const newHeader = outdent`
          # New Rule
          {/* end auto-generated rule header */}
        `;

        expect(replaceOrCreateHeader(markdown, newHeader, true)).toBe(
          `${frontmatter}\n${newHeader}\nRule description.`,
        );
      });

      it('should should preserve additional content between frontmatter and header', function () {
        const frontmatter = outdent`
          ---
          title: Old Rule
          ---
        `;
        const markdown = outdent`
          ${frontmatter}
          > 📌 A blockquote that should be preserved.
          # Old Rule
          Rule description.
        `;
        const newHeader = outdent`
          # New Rule
          {/* end auto-generated rule header */}
        `;

        expect(replaceOrCreateHeader(markdown, newHeader, true)).toBe(
          `${frontmatter}\n> 📌 A blockquote that should be preserved.\n${newHeader}\nRule description.`,
        );
      });

      it('should should preserve additional content above header when no frontmatter exists', function () {
        const markdown = outdent`
          > 📌 A blockquote that should be preserved.
          # Old Rule
          Rule description.
        `;
        const newHeader = outdent`
          # New Rule
          {/* end auto-generated rule header */}
        `;

        expect(replaceOrCreateHeader(markdown, newHeader, true)).toBe(
          `> 📌 A blockquote that should be preserved.\n${newHeader}\nRule description.`,
        );
      });
    });
  });
});
