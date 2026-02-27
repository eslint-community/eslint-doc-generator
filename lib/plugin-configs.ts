import type { Context } from './context.js';
import { SEVERITY_TYPE_TO_SET } from './types.js';
import type { SEVERITY_TYPE } from './types.js';

export function getConfigsThatSetARule(
  context: Context,
  severityType?: SEVERITY_TYPE,
) {
  const { configsToRules, options, plugin } = context;
  const { ignoreConfig } = options;

  /* istanbul ignore next -- this shouldn't happen */
  if (!plugin.rules) {
    throw new Error('Missing rules in plugin.');
  }
  const ruleNames = Object.keys(plugin.rules);
  return (
    Object.entries(configsToRules)
      .filter(([configName]) =>
        // Only consider configs that configure at least one of the plugin's rules.
        ruleNames.some((ruleName) =>
          getConfigsForRule(context, ruleName, severityType).includes(
            configName,
          ),
        ),
      )
      // Filter out ignored configs.
      .filter(([configName]) => !ignoreConfig.includes(configName))
      .map(([configName]) => configName)
      .toSorted((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
  );
}

/**
 * Get config names that a given rule belongs to.
 * @param severityType - Include configs that set the rule to this severity. Omit to allow any severity.
 */
export function getConfigsForRule(
  context: Context,
  ruleName: string,
  severityType?: SEVERITY_TYPE,
) {
  const { configsToRules, options, pluginPrefix } = context;
  const { ignoreConfig } = options;

  const configsToRulesWithoutIgnored = Object.fromEntries(
    Object.entries(configsToRules).filter(
      ([configName]) => !ignoreConfig.includes(configName),
    ),
  );

  const severity = severityType
    ? SEVERITY_TYPE_TO_SET[severityType]
    : undefined;
  const configNames: Array<keyof typeof configsToRules> = [];

  for (const configName in configsToRulesWithoutIgnored) {
    const rules = configsToRules[configName];
    if (!rules) {
      continue;
    }
    const value = rules[`${pluginPrefix}/${ruleName}`];
    const isSet =
      ((typeof value === 'string' || typeof value === 'number') &&
        (!severity || severity.has(value))) ||
      (typeof value === 'object' &&
        Array.isArray(value) &&
        value.length > 0 &&
        (!severity || severity.has(value[0])));

    if (isSet) {
      configNames.push(configName);
    }
  }

  return configNames.toSorted((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  );
}

/**
 * Find the representation of a config to display.
 * @param context - the context object
 * @param configName - name of the config to find an emoji for
 * @returns the emoji string to display for the config, or undefined if not found
 */
export function findConfigEmoji(
  context: Context,
  configName: string,
): string | undefined {
  const { options } = context;
  const { configEmojis } = options;

  return configEmojis.find((configEmoji) => configEmoji.config === configName)
    ?.emoji;
}

/**
 * Get the emojis for the configs that set a rule to a certain severity.
 * Throws an error if a config is missing an emoji.
 */
export function getEmojisForConfigsSettingRuleToSeverity(
  context: Context,
  ruleName: string,
  severityType: SEVERITY_TYPE,
) {
  const configsOfThisSeverity = getConfigsForRule(
    context,
    ruleName,
    severityType,
  );

  const emojis: string[] = [];
  for (const configName of configsOfThisSeverity) {
    const emoji = findConfigEmoji(context, configName);
    if (!emoji) {
      throw new Error(
        `Config "${configName}" does not have an emoji. Please provide one using the --config-emoji option or ignore the config using --ignore-config.`,
      );
    }
    emojis.push(emoji);
  }

  return emojis;
}
