import type { Context } from './context.js';
import { removeTrailingPeriod, toSentenceCase } from './string.js';

export const RULE_DOC_TITLE_FORMATS = [
  'desc',
  'desc-parens-name',
  'desc-parens-prefix-name',
  'name',
  'prefix-name',
] as const;

export type RuleDocTitleFormat = (typeof RULE_DOC_TITLE_FORMATS)[number];

export function makeRuleDocTitle(
  context: Context,
  name: string,
  description: string | undefined,
) {
  const { options, pluginPrefix } = context;
  const { ruleDocTitleFormat } = options;

  const descriptionFormatted = description
    ? removeTrailingPeriod(toSentenceCase(description))
    : undefined;

  let ruleDocTitleFormatWithFallback: RuleDocTitleFormat = ruleDocTitleFormat;

  if (ruleDocTitleFormatWithFallback.includes('desc') && !description) {
    // If format includes the description but the rule is missing a description,
    // fallback to the corresponding format without the description.
    switch (ruleDocTitleFormatWithFallback) {
      case 'desc':
      case 'desc-parens-prefix-name': {
        ruleDocTitleFormatWithFallback = 'prefix-name';
        break;
      }

      case 'desc-parens-name': {
        ruleDocTitleFormatWithFallback = 'name';
        break;
      }

      /* istanbul ignore next -- this shouldn't happen */
      default: {
        throw new Error(
          `Unhandled rule doc title format fallback: ${
            ruleDocTitleFormatWithFallback
          }`,
        );
      }
    }
  }

  switch (ruleDocTitleFormatWithFallback) {
    // Backticks (code-style) only used around rule name to differentiate it when the rule description is also present.
    case 'desc': {
      /* istanbul ignore next -- this shouldn't happen */
      if (!descriptionFormatted) {
        throw new Error(
          'Attempting to display non-existent description in rule doc title.',
        );
      }
      return descriptionFormatted;
    }

    case 'desc-parens-name': {
      /* istanbul ignore next -- this shouldn't happen */
      if (!descriptionFormatted) {
        throw new Error(
          'Attempting to display non-existent description in rule doc title.',
        );
      }
      return `${descriptionFormatted} (\`${name}\`)`;
    }

    case 'desc-parens-prefix-name': {
      /* istanbul ignore next -- this shouldn't happen */
      if (!descriptionFormatted) {
        throw new Error(
          'Attempting to display non-existent description in rule doc title.',
        );
      }
      return `${descriptionFormatted} (\`${pluginPrefix}/${name}\`)`;
    }

    case 'name': {
      return name;
    }

    case 'prefix-name': {
      return `${pluginPrefix}/${name}`;
    }

    /* istanbul ignore next -- this shouldn't happen */
    default: {
      throw new Error(
        `Unhandled rule doc title format: ${String(
          ruleDocTitleFormatWithFallback,
        )}`,
      );
    }
  }
}
