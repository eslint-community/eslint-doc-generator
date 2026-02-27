/**
 * Const object version of this union type: TSESLint.RuleMetaData<''>['type'];
 */
export const RULE_TYPE = {
  problem: 'problem',
  suggestion: 'suggestion',
  layout: 'layout',
} as const;
export type RULE_TYPE = (typeof RULE_TYPE)[keyof typeof RULE_TYPE];

export const RULE_TYPES = ['problem', 'suggestion', 'layout'] as const;

export const EMOJIS_TYPE: { [key in RULE_TYPE]: string } = {
  [RULE_TYPE.problem]: '❗',
  [RULE_TYPE.suggestion]: '📖',
  [RULE_TYPE.layout]: '📏',
};

export const RULE_TYPE_MESSAGES_LEGEND: { [key in RULE_TYPE]: string } = {
  [RULE_TYPE.problem]: `${
    EMOJIS_TYPE[RULE_TYPE.problem]
  } Identifies problems that could cause errors or unexpected behavior.`,
  [RULE_TYPE.suggestion]: `${
    EMOJIS_TYPE[RULE_TYPE.suggestion]
  } Identifies potential improvements.`,
  [RULE_TYPE.layout]: `${
    EMOJIS_TYPE[RULE_TYPE.layout]
  } Focuses on code formatting.`,
};

export const RULE_TYPE_MESSAGES_NOTICES: { [key in RULE_TYPE]: string } = {
  [RULE_TYPE.problem]: `${
    EMOJIS_TYPE[RULE_TYPE.problem]
  } This rule identifies problems that could cause errors or unexpected behavior.`,
  [RULE_TYPE.suggestion]: `${
    EMOJIS_TYPE[RULE_TYPE.suggestion]
  } This rule identifies potential improvements.`,
  [RULE_TYPE.layout]: `${
    EMOJIS_TYPE[RULE_TYPE.layout]
  } This rule focuses on code formatting.`,
};
