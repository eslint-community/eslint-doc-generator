import { join, sep, relative, dirname } from 'node:path';
import { RULE_SOURCE } from './types.js';
import type { PathRuleDocFunction } from './types.js';
import { getPluginRoot } from './package-json.js';
import type { Context } from './context.js';

export function replaceRulePlaceholder(
  pathOrPathFunc: string | PathRuleDocFunction,
  ruleName: string,
) {
  return typeof pathOrPathFunc === 'function'
    ? pathOrPathFunc(ruleName)
    : pathOrPathFunc.replaceAll('{name}', ruleName);
}

/**
 * Encode a URL path segment for markdown link destinations.
 * `encodeURIComponent` leaves `()`, `!` unencoded; CommonMark treats
 * parentheses as link destination terminators, so encode those too.
 */
function encodeUrlPathSegment(segment: string): string {
  return encodeURIComponent(segment)
    .replaceAll('(', '%28')
    .replaceAll(')', '%29')
    .replaceAll('!', '%21');
}

/**
 * Encode each `/`-separated segment of a URL path.
 */
function encodeUrlPath(urlPath: string): string {
  return urlPath
    .split('/')
    .map((segment) => encodeUrlPathSegment(segment))
    .join('/');
}

/**
 * Account for how Windows paths use backslashes instead of the forward slashes that URLs require.
 * Also URL-encodes each path segment so spaces, parentheses, etc. are safe in markdown links.
 */
function pathToUrl(path: string): string {
  return path
    .split(sep)
    .map((segment) => encodeUrlPathSegment(segment))
    .join('/');
}

/**
 * Encode a relative URL path. Absolute URLs (with a scheme) are left as-is so
 * user-provided `urlRuleDoc` function return values are not corrupted.
 */
function encodeUrlIfRelative(url: string): string {
  return url.includes('://') ? url : encodeUrlPath(url);
}

/**
 * Get the link to a rule's documentation page.
 * Will be relative to the current page.
 */
export function getUrlToRule(
  context: Context,
  ruleName: string,
  ruleSource: RULE_SOURCE,
  pathToFile: string,
) {
  const { options, path, pluginPrefix } = context;
  const { pathRuleDoc, urlRuleDoc } = options;

  switch (ruleSource) {
    case RULE_SOURCE.eslintCore: {
      return `https://eslint.org/docs/latest/rules/${ruleName}`;
    }
    case RULE_SOURCE.thirdPartyPlugin: {
      // We don't know the documentation URL to third-party plugins.
      return undefined;
    }
    default: {
      // Fallthrough to remaining logic in function.
      break;
    }
  }

  // Ignore plugin prefix if it's included in rule name.
  // While we could display the prefix if we wanted, it definitely cannot be part of the link.
  const ruleNameWithoutPluginPrefix = ruleName.startsWith(`${pluginPrefix}/`)
    ? ruleName.slice(pluginPrefix.length + 1)
    : ruleName;

  // If the URL is a function, evaluate it.
  const urlRuleDocFunctionEvaluated =
    typeof urlRuleDoc === 'function'
      ? urlRuleDoc(ruleName, pathToUrl(relative(path, pathToFile)))
      : undefined;

  const pathRuleDocEvaluated = join(
    getPluginRoot(path),
    replaceRulePlaceholder(pathRuleDoc, ruleNameWithoutPluginPrefix),
  );

  // If the function returned a URL, use it (encode relative returns only).
  if (urlRuleDocFunctionEvaluated !== undefined) {
    return encodeUrlIfRelative(urlRuleDocFunctionEvaluated);
  }

  // Otherwise, use the URL if it's a string (encode only the substituted name).
  if (typeof urlRuleDoc === 'string') {
    return replaceRulePlaceholder(
      urlRuleDoc,
      encodeUrlPath(ruleNameWithoutPluginPrefix),
    );
  }

  // Finally, fallback to the relative path.
  return pathToUrl(relative(dirname(pathToFile), pathRuleDocEvaluated));
}

export function getMarkdownLink(
  text: string,
  includeBackticks: boolean,
  url?: string,
) {
  const displayedText = includeBackticks ? `\`${text}\`` : text;

  return url ? `[${displayedText}](${url})` : displayedText;
}

/**
 * Get the markdown link (title and URL) to the rule's documentation.
 */
export function getLinkToRule(
  context: Context,
  ruleName: string,
  pathToFile: string,
  includeBackticks: boolean,
  includePrefix: boolean,
) {
  const { plugin, pluginPrefix } = context;

  const ruleNameWithoutPluginPrefix = ruleName.startsWith(`${pluginPrefix}/`)
    ? ruleName.slice(pluginPrefix.length + 1)
    : ruleName;

  // Determine what plugin this rule comes from.
  let ruleSource: RULE_SOURCE;
  if (plugin.rules?.[ruleNameWithoutPluginPrefix]) {
    ruleSource = RULE_SOURCE.self;
  } else if (ruleName.includes('/')) {
    // Assume a slash is for the plugin prefix (ESLint core doesn't have any nested rules).
    ruleSource = RULE_SOURCE.thirdPartyPlugin;
  } else {
    ruleSource = RULE_SOURCE.eslintCore;
  }

  const ruleNameWithPluginPrefix = ruleName.startsWith(`${pluginPrefix}/`)
    ? ruleName
    : ruleSource === RULE_SOURCE.self
      ? `${pluginPrefix}/${ruleName}`
      : undefined;

  const urlToRule = getUrlToRule(context, ruleName, ruleSource, pathToFile);

  const ruleString =
    includePrefix && ruleNameWithPluginPrefix
      ? ruleNameWithPluginPrefix
      : ruleNameWithoutPluginPrefix;

  return getMarkdownLink(ruleString, includeBackticks, urlToRule);
}
