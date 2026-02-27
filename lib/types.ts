import type { RuleDocTitleFormat } from './rule-doc-title-format.js';
import type { TSESLint } from '@typescript-eslint/utils';
import type { ConfigFormat } from './config-format.js';

// Standard ESLint types.

export type RuleModule = TSESLint.RuleModule<string, readonly unknown[]>;

export type Rules = TSESLint.Linter.RulesRecord;

export type RuleSeverity = TSESLint.Linter.RuleLevel;

export type DeprecatedInfo = TSESLint.DeprecatedInfo;

export type ReplacedByInfo = TSESLint.ReplacedByInfo;

// eslint-disable-next-line @typescript-eslint/no-deprecated
export type Config = TSESLint.Linter.Config;

export type Plugin = TSESLint.Linter.Plugin;

// Custom types.

/**
 * Where a rule comes from (where it's defined).
 */
export const RULE_SOURCE = {
  self: 'self', // From this plugin.
  eslintCore: 'eslintCore',
  thirdPartyPlugin: 'thirdPartyPlugin',
} as const;
export type RULE_SOURCE = (typeof RULE_SOURCE)[keyof typeof RULE_SOURCE];

export const SEVERITY_ERROR = new Set<RuleSeverity>([2, 'error']);
export const SEVERITY_WARN = new Set<RuleSeverity>([1, 'warn']);
export const SEVERITY_OFF = new Set<RuleSeverity>([0, 'off']);

export const SEVERITY_TYPE = {
  error: 'error',
  warn: 'warn',
  off: 'off',
} as const;
export type SEVERITY_TYPE = (typeof SEVERITY_TYPE)[keyof typeof SEVERITY_TYPE];

export const SEVERITY_TYPE_TO_SET: {
  [key in SEVERITY_TYPE]: Set<TSESLint.Linter.RuleLevel>;
} = {
  [SEVERITY_TYPE.error]: SEVERITY_ERROR,
  [SEVERITY_TYPE.warn]: SEVERITY_WARN,
  [SEVERITY_TYPE.off]: SEVERITY_OFF,
};

export type ConfigsToRules = Record<string, Rules>;

/**
 * List of rules in the form of tuples (rule name and the actual rule).
 */
export type RuleNamesAndRules = readonly (readonly [
  name: string,
  rule: RuleModule,
])[];

/**
 * The emoji for each config that has one after option parsing and defaults have been applied.
 */
export type ConfigEmojis = readonly { config: string; emoji: string }[];

export const AI_PROVIDER = {
  ANTHROPIC: 'anthropic',
  GROQ: 'groq',
  OPENAI: 'openai',
  OPENROUTER: 'openrouter',
  TOGETHER: 'together',
  VERCEL_AI_GATEWAY: 'vercelaigateway',
  XAI: 'xai',
} as const;
export type AI_PROVIDER = (typeof AI_PROVIDER)[keyof typeof AI_PROVIDER];

/**
 * Rule doc notices.
 */
export const NOTICE_TYPE = {
  CONFIGS: 'configs',
  DEPRECATED: 'deprecated',
  DESCRIPTION: 'description',
  FIXABLE: 'fixable',
  FIXABLE_AND_HAS_SUGGESTIONS: 'fixableAndHasSuggestions', // Consolidated notice for space-saving.
  HAS_SUGGESTIONS: 'hasSuggestions',
  OPTIONS: 'options',
  REQUIRES_TYPE_CHECKING: 'requiresTypeChecking',
  TYPE: 'type',
} as const;
export type NOTICE_TYPE = (typeof NOTICE_TYPE)[keyof typeof NOTICE_TYPE];

/**
 * Rule list columns.
 */
export const COLUMN_TYPE = {
  CONFIGS_ERROR: 'configsError',
  CONFIGS_OFF: 'configsOff',
  CONFIGS_WARN: 'configsWarn',
  DEPRECATED: 'deprecated',
  DESCRIPTION: 'description',
  FIXABLE: 'fixable',
  FIXABLE_AND_HAS_SUGGESTIONS: 'fixableAndHasSuggestions', // Consolidated column for space-saving.
  HAS_SUGGESTIONS: 'hasSuggestions',
  NAME: 'name',
  OPTIONS: 'options',
  REQUIRES_TYPE_CHECKING: 'requiresTypeChecking',
  TYPE: 'type',
} as const;
export type COLUMN_TYPE = (typeof COLUMN_TYPE)[keyof typeof COLUMN_TYPE];

/**
 * CLI/config file options.
 */
export const OPTION_TYPE = {
  AI: 'ai',
  AI_MODEL: 'aiModel',
  AI_PROVIDER: 'aiProvider',
  CHECK: 'check',
  CONFIG_EMOJI: 'configEmoji',
  CONFIG_FORMAT: 'configFormat',
  IGNORE_CONFIG: 'ignoreConfig',
  IGNORE_DEPRECATED_RULES: 'ignoreDeprecatedRules',
  INIT_RULE_DOCS: 'initRuleDocs',
  PATH_RULE_DOC: 'pathRuleDoc',
  PATH_RULE_LIST: 'pathRuleList',
  POSTPROCESS: 'postprocess',
  RULE_DOC_NOTICES: 'ruleDocNotices',
  RULE_DOC_SECTION_EXCLUDE: 'ruleDocSectionExclude',
  RULE_DOC_SECTION_INCLUDE: 'ruleDocSectionInclude',
  RULE_DOC_SECTION_OPTIONS: 'ruleDocSectionOptions',
  RULE_DOC_TITLE_FORMAT: 'ruleDocTitleFormat',
  RULE_LIST_COLUMNS: 'ruleListColumns',
  RULE_LIST_SPLIT: 'ruleListSplit',
  SUGGEST_EMOJIS: 'suggestEmojis',
  URL_CONFIGS: 'urlConfigs',
  URL_RULE_DOC: 'urlRuleDoc',
} as const;
export type OPTION_TYPE = (typeof OPTION_TYPE)[keyof typeof OPTION_TYPE];

/**
 * Function for splitting the rule list into multiple sections.
 * Can be provided via a JavaScript-based config file using the `ruleListSplit` option.
 * @param rules - all rules from the plugin
 * @returns an array of sections, each with a title (optional) and list of rules
 */
export type RuleListSplitFunction = (rules: RuleNamesAndRules) => readonly {
  title?: string;
  rules: RuleNamesAndRules;
}[];

/**
 * Function for generating the URL to a rule doc.
 * Can be provided via a JavaScript-based config file using the `urlRuleDoc` option.
 * @param name - the name of the rule
 * @param path - the file path to the current page displaying the link, relative to the project root
 * @returns the URL to the rule doc, or `undefined` to fallback to the default logic (relative URL)
 */
export type UrlRuleDocFunction = (
  name: string,
  path: string,
) => string | undefined;

/**
 * Function for generating the path to markdown file for each rule doc.
 * Can be provided via a JavaScript-based config file using the `pathRuleDoc` option.
 * @param name - the name of the rule
 * @returns the path to the rule doc
 */
export type PathRuleDocFunction = (name: string) => string;

// JSDocs for options should be kept in sync with README.md and the CLI runner in cli.ts.
/** The type for the config file (e.g. `.eslint-doc-generatorrc.js`) and internal `generate()` function. */
export type GenerateOptions = {
  /**
   * Whether to use AI for AI-capable features.
   * For example with `suggestEmojis`, enables provider-backed suggestions.
   * Default: `false`.
   */
  readonly ai?: boolean;

  /** Optional model override used by any AI-enabled feature. If omitted, the provider default model is used. */
  readonly aiModel?: string;

  /** AI provider used by any AI-enabled feature. Required if multiple provider API keys are present in the environment. */
  readonly aiProvider?: AI_PROVIDER;

  /**
   * Whether to check for and fail if there is a diff.
   * Any diff will be displayed but no output will be written to files.
   * Typically used during CI.
   * Default: `false`.
   */
  readonly check?: boolean;

  /**
   * List of configs and their associated emojis.
   * Array of `[configName, emoji]`.
   * Default emojis are provided for common configs.
   * To use a text/image/icon badge instead of an emoji, supply the corresponding markdown as the emoji.
   */
  readonly configEmoji?: readonly (
    | [configName: string, emoji: string]
    | [configName: string]
  )[];

  /** The format to use for config names. Default: `name`. */
  readonly configFormat?: ConfigFormat;

  /** Configs to ignore from being displayed. Often used for an `all` config. */
  readonly ignoreConfig?: readonly string[];

  /** Whether to ignore deprecated rules from being checked, displayed, or updated. Default: `false`. */
  readonly ignoreDeprecatedRules?: boolean;

  /** Whether to create rule doc files if they don't yet exist. Default: `false`. */
  readonly initRuleDocs?: boolean;

  /**
   * Path (or function to generate a path) to to markdown file for each rule doc.
   * For the string version, use `{name}` placeholder for the rule name.
   * Default: `docs/rules/{name}.md`.
   */
  readonly pathRuleDoc?: string | PathRuleDocFunction;

  /** Path to markdown file(s) where the rules table list should live. Default: `README.md`. */
  readonly pathRuleList?: string | readonly string[];

  /**
   * Function to be called with the generated content and file path for each processed file.
   * Useful for applying custom transformations such as formatting with tools like prettier.
   * Only available via a JavaScript-based config file.
   */
  readonly postprocess?: (
    content: string,
    pathToFile: string,
  ) => string | Promise<string>;

  /**
   * Ordered list of notices to display in rule doc.
   * Non-applicable notices will be hidden.
   * Choices: `configs`, `deprecated`, `description` (off by default), `fixable` (off by default), `fixableAndHasSuggestions`, `hasSuggestions` (off by default), `options` (off by default), `requiresTypeChecking`, `type` (off by default).
   * Default: `['deprecated', 'configs', 'fixableAndHasSuggestions', 'requiresTypeChecking']`.
   */
  readonly ruleDocNotices?: readonly NOTICE_TYPE[];

  /** Disallowed sections in each rule doc. Exit with failure if present. */
  readonly ruleDocSectionExclude?: readonly string[];

  /** Required sections in each rule doc. Exit with failure if missing. */
  readonly ruleDocSectionInclude?: readonly string[];

  /** Whether to require an "Options" or "Config" rule doc section and mention of any named options for rules with options. Default: `true`. */
  readonly ruleDocSectionOptions?: boolean;

  /** The format to use for rule doc titles. Default: `prefix-name`. */
  readonly ruleDocTitleFormat?: RuleDocTitleFormat;

  /**
   * Ordered list of columns to display in rule list.
   * Empty columns will be hidden.
   * Choices: `configsError`, `configsOff`, `configsWarn`, `deprecated`, `description`, `fixable`, `fixableAndHasSuggestions` (off by default), `hasSuggestions`, `name`, `options` (off by default), `requiresTypeChecking`, `type` (off by default).
   * Default: `['name', 'description', 'configsError', 'configsWarn', 'configsOff', 'fixable', 'hasSuggestions', 'requiresTypeChecking', 'deprecated']`.
   */
  readonly ruleListColumns?: readonly COLUMN_TYPE[];

  /**
   * Rule property(s) or function to split the rules list by.
   * A separate list and header will be created for each value.
   * Example: `meta.type`.
   */
  readonly ruleListSplit?: string | readonly string[] | RuleListSplitFunction;

  /** Whether to suggest emojis for configs and print a table of suggestions. Can be paired with `--ai`. Default: `false`. */
  readonly suggestEmojis?: boolean;

  /** Link to documentation about the ESLint configurations exported by the plugin. */
  readonly urlConfigs?: string;

  /**
   * Link (or function to generate a link) to documentation for each rule.
   * Useful when it differs from the rule doc path on disk (e.g. custom documentation site in use).
   * For the string version, use `{name}` placeholder for the rule name.
   */
  readonly urlRuleDoc?: string | UrlRuleDocFunction;
};
