import * as sinon from 'sinon';
import { run } from '../../lib/cli.js';
import { OPTION_TYPE } from '../../lib/types.js';
import { type FixtureContext, setupFixture } from '../helpers/fixture.js';

const configFileOptionsAll: { [key in OPTION_TYPE]: unknown } = {
  ai: true,
  aiModel: 'gpt-4o-mini',
  aiProvider: 'openai',
  check: true,
  configEmoji: [['recommended-from-config-file', '🚲']],
  configFormat: 'name',
  ignoreConfig: [
    'ignoredConfigFromConfigFile1',
    'ignoredConfigFromConfigFile2',
  ],
  ignoreDeprecatedRules: true,
  initRuleDocs: true,
  pathRuleDoc: 'www.example.com/rule-doc-from-config-file',
  pathRuleList: 'www.example.com/rule-list-from-config-file',
  postprocess: (content: string) => content,
  ruleDocNotices: ['fixable'],
  ruleDocSectionExclude: [
    'excludedSectionFromConfigFile1',
    'excludedSectionFromConfigFile2',
  ],
  ruleDocSectionInclude: [
    'includedSectionFromConfigFile1',
    'includedSectionFromConfigFile2',
  ],
  ruleDocSectionOptions: false,
  ruleDocTitleFormat: 'desc',
  ruleListColumns: ['fixable', 'hasSuggestions'],
  ruleListSplit: 'meta.docs.foo-from-config-file',
  suggestEmojis: true,
  urlConfigs: 'https://example.com/configs-url-from-config-file',
  urlRuleDoc: 'https://example.com/rule-doc-url-from-config-file',
};

const cliOptionsAll: { [key in OPTION_TYPE]: readonly string[] } = {
  [OPTION_TYPE.AI]: ['--ai', 'false'],

  [OPTION_TYPE.AI_MODEL]: ['--ai-model', 'claude-3-5-haiku-latest'],

  [OPTION_TYPE.AI_PROVIDER]: ['--ai-provider', 'anthropic'],

  [OPTION_TYPE.CHECK]: ['--check'],

  [OPTION_TYPE.CONFIG_EMOJI]: ['--config-emoji', 'recommended-from-cli,🚲'],

  [OPTION_TYPE.CONFIG_FORMAT]: ['--config-format', 'plugin-colon-prefix-name'],

  [OPTION_TYPE.IGNORE_CONFIG]: [
    '--ignore-config',
    'ignoredConfigFromCli1',
    '--ignore-config',
    'ignoredConfigFromCli2',
  ],

  [OPTION_TYPE.IGNORE_DEPRECATED_RULES]: ['--ignore-deprecated-rules', 'true'],

  [OPTION_TYPE.INIT_RULE_DOCS]: ['--init-rule-docs', 'false'],

  [OPTION_TYPE.PATH_RULE_DOC]: [
    '--path-rule-doc',
    'www.example.com/rule-doc-from-cli',
  ],

  [OPTION_TYPE.PATH_RULE_LIST]: [
    '--path-rule-list',
    'www.example.com/rule-list-from-cli',
  ],

  [OPTION_TYPE.POSTPROCESS]: [], // This option is not supported by the CLI.

  [OPTION_TYPE.RULE_DOC_NOTICES]: ['--rule-doc-notices', 'type'],

  [OPTION_TYPE.RULE_DOC_SECTION_EXCLUDE]: [
    '--rule-doc-section-exclude',
    'excludedSectionFromCli1',
    '--rule-doc-section-exclude',
    'excludedSectionFromCli2',
  ],

  [OPTION_TYPE.RULE_DOC_SECTION_INCLUDE]: [
    '--rule-doc-section-include',
    'includedSectionFromCli1',
    '--rule-doc-section-include',
    'includedSectionFromCli2',
  ],

  [OPTION_TYPE.RULE_DOC_SECTION_OPTIONS]: [
    '--rule-doc-section-options',
    'true',
  ],

  [OPTION_TYPE.RULE_DOC_TITLE_FORMAT]: ['--rule-doc-title-format', 'name'],

  [OPTION_TYPE.RULE_LIST_COLUMNS]: ['--rule-list-columns', 'type'],

  [OPTION_TYPE.RULE_LIST_SPLIT]: [
    '--rule-list-split',
    'meta.docs.foo-from-cli',
  ],

  [OPTION_TYPE.SUGGEST_EMOJIS]: ['--suggest-emojis', 'false'],

  [OPTION_TYPE.URL_CONFIGS]: [
    '--url-configs',
    'https://example.com/configs-url-from-cli',
  ],

  [OPTION_TYPE.URL_RULE_DOC]: [
    '--url-rule-doc',
    'https://example.com/rule-doc-url-from-cli',
  ],
};

describe('cli', () => {
  describe('no options', () => {
    it('is called correctly', async () => {
      const stub = sinon.stub().resolves();
      await run(
        [
          'node', // Path to node.
          'eslint-doc-generator.js', // Path to this binary.
        ],
        stub,
      );
      expect(stub.callCount).toBe(1);
      expect(stub.firstCall.args).toMatchSnapshot();
    });
  });

  describe('all CLI options, no config file options', () => {
    it('is called correctly', async () => {
      const stub = sinon.stub().resolves();
      await run(
        [
          'node', // Path to node.
          'eslint-doc-generator.js', // Path to this binary.

          ...Object.values(cliOptionsAll).flat(),
        ],
        stub,
      );
      expect(stub.callCount).toBe(1);
      expect(stub.firstCall.args).toMatchSnapshot();
    });
  });

  describe('all config files options, no CLI options', () => {
    let fixture: FixtureContext;
    let originalCwd: string;

    beforeAll(async () => {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'package.json': {
            name: 'eslint-plugin-test',
            main: 'index.js',
            type: 'module',
            version: '1.0.0',
          },
          '.eslint-doc-generatorrc.json': configFileOptionsAll,
        },
      });
      originalCwd = process.cwd();
      process.chdir(fixture.path);
    });

    afterAll(async () => {
      process.chdir(originalCwd);
      await fixture.cleanup();
    });

    it('is called correctly', async () => {
      const stub = sinon.stub().resolves();
      await run(
        [
          'node', // Path to node.
          'eslint-doc-generator.js', // Path to this binary.
        ],
        stub,
      );
      expect(stub.callCount).toBe(1);
      expect(stub.firstCall.args).toMatchSnapshot();
    });
  });

  describe('all CLI options and all config files options', () => {
    let fixture: FixtureContext;
    let originalCwd: string;

    beforeAll(async () => {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'package.json': {
            name: 'eslint-plugin-test',
            main: 'index.js',
            type: 'module',
            version: '1.0.0',
          },
          '.eslint-doc-generatorrc.json': configFileOptionsAll,
        },
      });
      originalCwd = process.cwd();
      process.chdir(fixture.path);
    });

    afterAll(async () => {
      process.chdir(originalCwd);
      await fixture.cleanup();
    });

    it('merges correctly, with CLI options taking precedence', async () => {
      const stub = sinon.stub().resolves();
      await run(
        [
          'node', // Path to node.
          'eslint-doc-generator.js', // Path to this binary.

          ...Object.values(cliOptionsAll).flat(),
        ],
        stub,
      );
      expect(stub.callCount).toBe(1);
      expect(stub.firstCall.args).toMatchSnapshot();
    });
  });

  describe('pathRuleList as array in config file and CLI', () => {
    let fixture: FixtureContext;
    let originalCwd: string;

    beforeAll(async () => {
      fixture = await setupFixture({
        fixture: 'esm-base',
        overrides: {
          'package.json': {
            name: 'eslint-plugin-test',
            main: 'index.js',
            type: 'module',
            version: '1.0.0',
          },
          '.eslint-doc-generatorrc.json': {
            pathRuleList: ['listFromConfigFile1.md', 'listFromConfigFile2.md'],
          },
        },
      });
      originalCwd = process.cwd();
      process.chdir(fixture.path);
    });

    afterAll(async () => {
      process.chdir(originalCwd);
      await fixture.cleanup();
    });

    it('merges correctly', async () => {
      const stub = sinon.stub().resolves();
      await run(
        [
          'node', // Path to node.
          'eslint-doc-generator.js', // Path to this binary.

          '--path-rule-list',
          'listFromCli1.md',
          '--path-rule-list',
          'listFromCli2.md',
        ],
        stub,
      );
      expect(stub.callCount).toBe(1);
      expect(stub.firstCall.args).toMatchSnapshot();
    });
  });

  describe('boolean option - false (explicit)', () => {
    it('is called correctly', async () => {
      const stub = sinon.stub().resolves();
      await run(
        [
          'node', // Path to node.
          'eslint-doc-generator.js', // Path to this binary.

          '--ignore-deprecated-rules',
          'false',
        ],
        stub,
      );
      expect(stub.callCount).toBe(1);
      expect(stub.firstCall.args).toMatchSnapshot();
    });
  });

  describe('boolean option - true (explicit)', () => {
    it('is called correctly', async () => {
      const stub = sinon.stub().resolves();
      await run(
        [
          'node', // Path to node.
          'eslint-doc-generator.js', // Path to this binary.

          '--ignore-deprecated-rules',
          'true',
        ],
        stub,
      );
      expect(stub.callCount).toBe(1);
      expect(stub.firstCall.args).toMatchSnapshot();
    });
  });

  describe('boolean option - true (implicit)', () => {
    it('is called correctly', async () => {
      const stub = sinon.stub().resolves();
      await run(
        [
          'node', // Path to node.
          'eslint-doc-generator.js', // Path to this binary.

          '--ignore-deprecated-rules',
        ],
        stub,
      );
      expect(stub.callCount).toBe(1);
      expect(stub.firstCall.args).toMatchSnapshot();
    });
  });

  // Note: The test for "missing package.json `version` field" was removed because
  // getCurrentPackageVersion() reads the tool's own package.json via import.meta.url,
  // which cannot be mocked with real filesystem fixtures.;

  describe('invalid config file', () => {
    describe('unknown option', () => {
      let fixture: FixtureContext;
      let originalCwd: string;

      beforeAll(async () => {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            'package.json': {
              name: 'eslint-plugin-test',
              main: 'index.js',
              type: 'module',
              version: '1.0.0',
            },
            '.eslint-doc-generatorrc.json': {
              // Doesn't match schema.
              unknown: true,
            },
          },
        });
        originalCwd = process.cwd();
        process.chdir(fixture.path);
      });

      afterAll(async () => {
        process.chdir(originalCwd);
        await fixture.cleanup();
      });

      it('throws an error', async () => {
        const stub = sinon.stub().resolves();
        await expect(
          run(
            [
              'node', // Path to node.
              'eslint-doc-generator.js', // Path to this binary.
            ],
            stub,
          ),
        ).rejects.toThrow('config file must NOT have additional properties');
      });
    });

    describe('postprocess must be a function', () => {
      let fixture: FixtureContext;
      let originalCwd: string;

      beforeAll(async () => {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            'package.json': {
              name: 'eslint-plugin-test',
              main: 'index.js',
              type: 'module',
              version: '1.0.0',
            },
            '.eslint-doc-generatorrc.json': {
              // Doesn't match schema.
              postprocess: './my-file.js',
            },
          },
        });
        originalCwd = process.cwd();
        process.chdir(fixture.path);
      });

      afterAll(async () => {
        process.chdir(originalCwd);
        await fixture.cleanup();
      });

      it('requires that postprocess be a function', async () => {
        const stub = sinon.stub().resolves();
        await expect(
          run(
            [
              'node', // Path to node.
              'eslint-doc-generator.js', // Path to this binary.
            ],
            stub,
          ),
        ).rejects.toThrow('postprocess must be a function.');
      });
    });

    describe('ruleListSplit is the wrong primitive type', () => {
      let fixture: FixtureContext;
      let originalCwd: string;

      beforeAll(async () => {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            'package.json': {
              name: 'eslint-plugin-test',
              main: 'index.js',
              type: 'module',
              version: '1.0.0',
            },
            '.eslint-doc-generatorrc.json': {
              // Doesn't match schema.
              ruleListSplit: 123,
            },
          },
        });
        originalCwd = process.cwd();
        process.chdir(fixture.path);
      });

      afterAll(async () => {
        process.chdir(originalCwd);
        await fixture.cleanup();
      });

      it('throws an error', async () => {
        const stub = sinon.stub().resolves();
        await expect(
          run(
            [
              'node', // Path to node.
              'eslint-doc-generator.js', // Path to this binary.
            ],
            stub,
          ),
        ).rejects.toThrow(
          'config file/ruleListSplit must be string, config file/ruleListSplit must be array, config file/ruleListSplit must match a schema in anyOf',
        );
      });
    });

    describe('ruleListSplit is the wrong array type', () => {
      let fixture: FixtureContext;
      let originalCwd: string;

      beforeAll(async () => {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            'package.json': {
              name: 'eslint-plugin-test',
              main: 'index.js',
              type: 'module',
              version: '1.0.0',
            },
            '.eslint-doc-generatorrc.json': {
              // Doesn't match schema.
              ruleListSplit: [123],
            },
          },
        });
        originalCwd = process.cwd();
        process.chdir(fixture.path);
      });

      afterAll(async () => {
        process.chdir(originalCwd);
        await fixture.cleanup();
      });

      it('throws an error', async () => {
        const stub = sinon.stub().resolves();
        await expect(
          run(
            [
              'node', // Path to node.
              'eslint-doc-generator.js', // Path to this binary.
            ],
            stub,
          ),
        ).rejects.toThrow(
          'config file/ruleListSplit must be string, config file/ruleListSplit/0 must be string, config file/ruleListSplit must match a schema in anyOf',
        );
      });
    });

    describe('ruleListSplit is an empty array', () => {
      let fixture: FixtureContext;
      let originalCwd: string;

      beforeAll(async () => {
        fixture = await setupFixture({
          fixture: 'esm-base',
          overrides: {
            'package.json': {
              name: 'eslint-plugin-test',
              main: 'index.js',
              type: 'module',
              version: '1.0.0',
            },
            '.eslint-doc-generatorrc.json': {
              // Doesn't match schema.
              ruleListSplit: [],
            },
          },
        });
        originalCwd = process.cwd();
        process.chdir(fixture.path);
      });

      afterAll(async () => {
        process.chdir(originalCwd);
        await fixture.cleanup();
      });

      it('throws an error', async () => {
        const stub = sinon.stub().resolves();
        await expect(
          run(
            [
              'node', // Path to node.
              'eslint-doc-generator.js', // Path to this binary.
            ],
            stub,
          ),
        ).rejects.toThrow(
          'config file/ruleListSplit must be string, config file/ruleListSplit must NOT have fewer than 1 items, config file/ruleListSplit must match a schema in anyOf',
        );
      });
    });
  });
});
