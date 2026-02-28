import {
  requestAiText,
  resolveAiProviderConfig,
  type AiRequestOptions,
} from './ai.js';
import {
  END_RULE_HEADER_MARKER,
  BEGIN_RULE_OPTIONS_LIST_MARKER,
  END_RULE_OPTIONS_LIST_MARKER,
} from './comment-markers.js';
import type { Context } from './context.js';
import { getConfigsForRule } from './plugin-configs.js';
import { getAllNamedOptions, hasOptions } from './rule-options.js';
import type { RuleModule, SEVERITY_TYPE } from './types.js';
import { SEVERITY_TYPE as ST } from './types.js';

function getRuleCreateSource(rule: RuleModule): string | undefined {
  try {
    const src = rule.create.toString();
    // Skip unhelpful minified or native code.
    if (src.length < 30 || src.includes('[native code]')) {
      return undefined;
    }
    // Cap length to avoid blowing up the prompt.
    const MAX_SOURCE_LENGTH = 8000;
    if (src.length > MAX_SOURCE_LENGTH) {
      return `${src.slice(0, MAX_SOURCE_LENGTH)}\n// ... (truncated)`;
    }
    return src;
  } catch {
    return undefined;
  }
}

function getConfigSummary(
  context: Context,
  ruleName: string,
): string | undefined {
  const severities: SEVERITY_TYPE[] = [ST.error, ST.warn, ST.off];
  const parts: string[] = [];
  for (const severity of severities) {
    const configs = getConfigsForRule(context, ruleName, severity);
    if (configs.length > 0) {
      parts.push(`${severity}: ${configs.join(', ')}`);
    }
  }
  return parts.length > 0 ? parts.join('; ') : undefined;
}

function buildSystemPrompt(): string {
  return [
    'You are an expert ESLint rule documentation writer.',
    'Generate clear, concise Markdown documentation for ESLint rules.',
    '',
    'Guidelines:',
    '- Write in a clear, direct, technical style.',
    '- Include examples of both incorrect and correct code using fenced ```js code blocks.',
    '- Incorrect examples should begin with a /* eslint rule-name: "error" */ comment.',
    '- Do NOT include a top-level heading (# ...). The title is auto-generated.',
    '- Do NOT include notice/badge lines. Those are auto-generated.',
    '- Do NOT output an auto-generated options table between markers.',
    '- Use ## for section headings.',
    '- Standard sections (in order): a brief introductory paragraph, ## Examples, ## Options (only if the rule has options), ## When Not To Use It.',
    '- Inside ## Examples, use ### Incorrect and ### Correct sub-sections.',
    '- If the rule has options, the ## Options section should give a narrative explanation of each option with examples. An auto-generated table will be inserted separately.',
    '- Output only the Markdown body. No surrounding code fences.',
  ].join('\n');
}

function buildUserPrompt(
  context: Context,
  ruleName: string,
  rule: RuleModule,
  existingDocBody: string | undefined,
): string {
  const schema = rule.meta?.schema;
  const namedOptions = getAllNamedOptions(schema, rule.meta?.defaultOptions);
  const ruleHasOptions = hasOptions(schema);
  const createSource = getRuleCreateSource(rule);
  const configSummary = getConfigSummary(context, ruleName);

  const sections: string[] = [`Rule: ${context.pluginPrefix}/${ruleName}`];

  if (rule.meta?.docs?.description) {
    sections.push(`Description: ${rule.meta.docs.description}`);
  }
  if (rule.meta?.type) {
    sections.push(`Type: ${rule.meta.type}`);
  }
  if (rule.meta?.fixable) {
    sections.push(`Fixable: ${rule.meta.fixable}`);
  }
  if (rule.meta?.hasSuggestions) {
    sections.push('Has suggestions: true');
  }
  if (configSummary) {
    sections.push(`Configs: ${configSummary}`);
  }
  if (ruleHasOptions && namedOptions.length > 0) {
    sections.push(
      `Options schema:\n${JSON.stringify(namedOptions, undefined, 2)}`,
    );
  }
  if (createSource) {
    sections.push(`Rule implementation:\n${createSource}`);
  }

  if (existingDocBody && existingDocBody.trim()) {
    sections.push(
      `Existing documentation (improve this):\n${existingDocBody.trim()}`,
    );
  } else {
    sections.push(
      'There is no existing documentation. Generate a complete rule doc from scratch.',
    );
  }

  sections.push(
    `Generate the Markdown documentation body for this rule. Include ## Examples with ### Incorrect and ### Correct sub-sections.${ruleHasOptions ? ' Include a ## Options section explaining each option.' : ''} Include a ## When Not To Use It section.`,
  );

  return sections.join('\n\n');
}

function sanitizeAiResponse(
  content: string,
  endOfLine: string,
): string | undefined {
  let result = content.trim();
  if (!result) {
    return undefined;
  }

  // Strip leading title if the AI included one despite instructions.
  const lines = result.split(/\r?\n/u);
  if (lines[0] && /^#\s+/u.test(lines[0])) {
    lines.shift();
    result = lines.join(endOfLine).trimStart();
  }

  // Strip auto-generated options markers if the AI included them.
  result = result
    .replaceAll(BEGIN_RULE_OPTIONS_LIST_MARKER, '')
    .replaceAll(END_RULE_OPTIONS_LIST_MARKER, '');

  // Strip wrapping code fences if the entire response is fenced.
  if (/^```(?:markdown|md)?\s*\n/iu.test(result) && result.endsWith('```')) {
    result = result
      .replace(/^```(?:markdown|md)?\s*\n/iu, '')
      .replace(/\n```$/u, '');
  }

  return result.trim() || undefined;
}

/**
 * Extract the body from a rule doc (everything after the header marker).
 * If the marker is not present (e.g. freshly-created skeleton), returns the entire content.
 */
export function extractDocBody(docContents: string): string {
  const markerIndex = docContents.indexOf(END_RULE_HEADER_MARKER);
  if (markerIndex === -1) {
    return docContents;
  }
  return docContents.slice(markerIndex + END_RULE_HEADER_MARKER.length);
}

/**
 * Extract the options list section (markers and content between them) from a doc body.
 * Returns undefined if the markers are not present.
 */
function extractOptionsListSection(body: string): string | undefined {
  const beginIndex = body.indexOf(BEGIN_RULE_OPTIONS_LIST_MARKER);
  const endIndex = body.indexOf(END_RULE_OPTIONS_LIST_MARKER);
  if (beginIndex === -1 || endIndex === -1) {
    return undefined;
  }
  return body.slice(beginIndex, endIndex + END_RULE_OPTIONS_LIST_MARKER.length);
}

/**
 * Strip the options list section from a body so the AI doesn't see auto-generated content.
 */
function stripOptionsListSection(body: string): string {
  const beginIndex = body.indexOf(BEGIN_RULE_OPTIONS_LIST_MARKER);
  const endIndex = body.indexOf(END_RULE_OPTIONS_LIST_MARKER);
  if (beginIndex === -1 || endIndex === -1) {
    return body;
  }
  const before = body.slice(0, beginIndex);
  const after = body.slice(endIndex + END_RULE_OPTIONS_LIST_MARKER.length);
  return before + after;
}

/**
 * Replace the body in a rule doc (everything after the header marker) with new content.
 * If the marker is not present (e.g. freshly-created skeleton), replaces the entire content.
 */
export function replaceDocBody(docContents: string, newBody: string): string {
  const markerIndex = docContents.indexOf(END_RULE_HEADER_MARKER);
  if (markerIndex === -1) {
    return `${newBody}\n`;
  }
  const header = docContents.slice(
    0,
    markerIndex + END_RULE_HEADER_MARKER.length,
  );
  return `${header}\n\n${newBody}\n`;
}

/**
 * Re-insert the options list markers into the AI-generated body.
 * Places them after the ## Options heading if present, otherwise appends.
 */
function reinsertOptionsListSection(
  body: string,
  optionsSection: string,
  endOfLine: string,
): string {
  const optionsHeadingMatch = body.match(/^(##\s+Options\s*)$/mu);
  if (optionsHeadingMatch?.index !== undefined) {
    const insertPos = optionsHeadingMatch.index + optionsHeadingMatch[0].length;
    const before = body.slice(0, insertPos);
    const after = body.slice(insertPos);
    return `${before}${endOfLine}${endOfLine}${optionsSection}${after}`;
  }
  return `${body}${endOfLine}${endOfLine}## Options${endOfLine}${endOfLine}${optionsSection}${endOfLine}`;
}

export async function enhanceRuleDocWithAi(
  context: Context,
  ruleName: string,
  rule: RuleModule,
  docContents: string,
  aiRequestOptions: AiRequestOptions,
): Promise<string> {
  const existingBody = extractDocBody(docContents);

  // Preserve the options list section so the AI doesn't touch auto-generated content.
  const optionsListSection = extractOptionsListSection(existingBody);
  const bodyForAi = stripOptionsListSection(existingBody);

  const providerConfig = resolveAiProviderConfig(aiRequestOptions);
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(context, ruleName, rule, bodyForAi);

  const response = await requestAiText(providerConfig, {
    systemPrompt,
    userPrompt,
  });

  let sanitized = sanitizeAiResponse(response, context.endOfLine);
  if (!sanitized) {
    console.warn(
      `AI returned empty content for rule "${ruleName}". Keeping existing doc.`,
    );
    return docContents;
  }

  // Re-insert the original options list markers into the AI output.
  if (optionsListSection) {
    sanitized = reinsertOptionsListSection(
      sanitized,
      optionsListSection,
      context.endOfLine,
    );
  }

  return replaceDocBody(docContents, sanitized);
}
