import type { Context } from './context.js';
import { EMOJI_CONFIGS, RESERVED_EMOJIS } from './emojis.js';
import * as nodeEmoji from 'node-emoji';

const DEFAULT_LLM_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_LLM_MODEL = 'gpt-4o-mini';

const RESERVED_EMOJI_SET = new Set(RESERVED_EMOJIS);

const FALLBACK_EMOJIS = [
  '🔴',
  '🟠',
  '🟡',
  '🟢',
  '🔵',
  '🟣',
  '🟤',
  '⚫',
  '⚪',
  '🟥',
  '🟧',
  '🟨',
  '🟩',
  '🟦',
  '🟪',
  '🟫',
  '⬛',
  '⬜',
] as const;

const KEYWORD_EMOJIS: Readonly<Record<string, string>> = {
  base: '🧱',
  browser: '🌐',
  documentation: '📚',
  docs: '📚',
  electron: '⚛️',
  error: '❗',
  errors: '❗',
  node: '🟢',
  performance: '⚡',
  react: '⚛️',
  strict: '🔒',
  style: '🎨',
  test: '🧪',
  testing: '🧪',
  typescript: '⌨️',
  warning: '🚸',
  warnings: '🚸',
};

interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface FetchResponseLike {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  json: () => Promise<unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFetchResponseLike(value: unknown): value is FetchResponseLike {
  return (
    isRecord(value) &&
    typeof value['ok'] === 'boolean' &&
    typeof value['status'] === 'number' &&
    typeof value['statusText'] === 'string' &&
    typeof value['json'] === 'function'
  );
}

function sortCaseInsensitive(values: readonly string[]): readonly string[] {
  return values.toSorted((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  );
}

function tokenizeConfigName(configName: string): readonly string[] {
  const normalized = configName
    .replaceAll(/([a-z])([A-Z])/gu, '$1 $2')
    .replaceAll(/[^a-zA-Z0-9]+/gu, ' ')
    .toLowerCase()
    .trim();
  if (!normalized) {
    return [];
  }
  return normalized.split(/\s+/u);
}

function normalizeEmojiCandidate(candidate: string): string | undefined {
  const trimmed = candidate.trim().replaceAll(/^["'`]+|["'`]+$/gu, '');
  if (!trimmed) {
    return undefined;
  }

  const aliasMatch = trimmed.match(/^:([a-zA-Z0-9_+-]+):$/u);
  if (aliasMatch?.[1]) {
    const fromAlias = nodeEmoji.get(aliasMatch[1]);
    if (fromAlias) {
      return fromAlias;
    }
  }

  const fromName = nodeEmoji.get(trimmed);
  if (fromName) {
    return fromName;
  }

  const maybeEmojiToken = trimmed
    .split(/\s+/u)
    .find((part) =>
      /[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u.test(part),
    );
  if (maybeEmojiToken) {
    return maybeEmojiToken;
  }

  if (!/[a-zA-Z0-9]/u.test(trimmed)) {
    return trimmed;
  }

  return undefined;
}

function canUseEmoji(
  candidate: string,
  usedEmojis: ReadonlySet<string>,
): boolean {
  return !RESERVED_EMOJI_SET.has(candidate) && !usedEmojis.has(candidate);
}

function tryUseEmoji(
  candidate: string | undefined,
  usedEmojis: ReadonlySet<string>,
): string | undefined {
  return candidate && canUseEmoji(candidate, usedEmojis)
    ? candidate
    : undefined;
}

function getDefaultEmojiForConfig(configNameLower: string): string | undefined {
  if (!(configNameLower in EMOJI_CONFIGS)) {
    return undefined;
  }
  return EMOJI_CONFIGS[configNameLower as keyof typeof EMOJI_CONFIGS];
}

function suggestEmojiLocally(
  configName: string,
  usedEmojis: ReadonlySet<string>,
): string {
  const configNameLower = configName.toLowerCase();
  const tokens = tokenizeConfigName(configName);

  const exactDefault = tryUseEmoji(
    getDefaultEmojiForConfig(configNameLower),
    usedEmojis,
  );
  if (exactDefault) {
    return exactDefault;
  }

  for (const token of tokens) {
    const tokenKeywordEmoji = tryUseEmoji(KEYWORD_EMOJIS[token], usedEmojis);
    if (tokenKeywordEmoji) {
      return tokenKeywordEmoji;
    }
  }

  for (const term of [configNameLower, ...tokens]) {
    const matches = nodeEmoji.search(term);
    for (const match of matches) {
      const fromSearch = tryUseEmoji(
        normalizeEmojiCandidate(match.emoji),
        usedEmojis,
      );
      if (fromSearch) {
        return fromSearch;
      }
    }
  }

  const fallback =
    FALLBACK_EMOJIS.find((emoji) => canUseEmoji(emoji, usedEmojis)) ??
    FALLBACK_EMOJIS[0];
  return fallback;
}

function escapeSingleQuotedString(value: string): string {
  const backslash = String.fromCodePoint(92);
  return value
    .replaceAll(backslash, `${backslash}${backslash}`)
    .replaceAll("'", `${backslash}'`);
}

function formatConfigEmojiTuples(
  configNames: readonly string[],
  emojiByConfig: ReadonlyMap<string, string>,
): string {
  const lines = ['configEmoji: ['];
  for (const configName of configNames) {
    const emoji = emojiByConfig.get(configName);
    /* istanbul ignore next -- all config names are populated before formatting */
    if (!emoji) {
      continue;
    }
    lines.push(
      `  ['${escapeSingleQuotedString(configName)}', '${escapeSingleQuotedString(emoji)}'],`,
    );
  }
  lines.push('],');
  return lines.join('\n');
}

function getOptionalEnvVar(
  name: 'LLM_API_KEY' | 'LLM_BASE_URL' | 'LLM_MODEL',
): string | undefined {
  const value = process.env[name];
  if (!value || value === 'undefined') {
    return undefined;
  }
  return value;
}

function getLlmConfig(): LlmConfig | undefined {
  const apiKey = getOptionalEnvVar('LLM_API_KEY');
  if (!apiKey) {
    return undefined;
  }

  const baseUrl = (
    getOptionalEnvVar('LLM_BASE_URL') ?? DEFAULT_LLM_BASE_URL
  ).replace(/\/+$/u, '');
  const model = getOptionalEnvVar('LLM_MODEL') ?? DEFAULT_LLM_MODEL;

  return { apiKey, baseUrl, model };
}

function getContentFromLlmPayload(payload: unknown): string | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }
  const choicesUnknown = payload['choices'];
  if (!Array.isArray(choicesUnknown) || choicesUnknown.length === 0) {
    return undefined;
  }

  const [firstChoice] = choicesUnknown as unknown[];
  if (!isRecord(firstChoice)) {
    return undefined;
  }
  const message = firstChoice['message'];
  if (!isRecord(message)) {
    return undefined;
  }

  const content = message['content'];
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return undefined;
  }

  const textParts = content.flatMap((part) => {
    if (!isRecord(part)) {
      return [];
    }
    const text = part['text'];
    return typeof text === 'string' ? [text] : [];
  });
  return textParts.length > 0 ? textParts.join('') : undefined;
}

function parseLlmResponseObject(
  content: string,
): Record<string, unknown> | undefined {
  const trimmed = content.trim();
  if (!trimmed) {
    return undefined;
  }

  const withoutFences = trimmed
    .replaceAll(/^```(?:json)?\s*/giu, '')
    .replaceAll(/\s*```$/gu, '');
  const firstBrace = withoutFences.indexOf('{');
  const lastBrace = withoutFences.lastIndexOf('}');
  const jsonLike =
    firstBrace !== -1 && lastBrace > firstBrace
      ? withoutFences.slice(firstBrace, lastBrace + 1)
      : withoutFences;

  try {
    const parsed = JSON.parse(jsonLike) as unknown;
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

async function requestLlmContent(
  llmConfig: LlmConfig,
  configNamesToEnhance: readonly string[],
): Promise<{ content?: string; warning?: string }> {
  const url = `${llmConfig.baseUrl}/chat/completions`;

  let responseUnknown: unknown;
  try {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    responseUnknown = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${llmConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: llmConfig.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Return a JSON object mapping each config name to exactly one emoji character. No markdown.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              configs: configNamesToEnhance,
              forbiddenEmojis: RESERVED_EMOJIS,
            }),
          },
        ],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      warning: `LLM enhancement failed (${message}). Using local suggestions only.`,
    };
  }

  if (!isFetchResponseLike(responseUnknown)) {
    return {
      warning:
        'LLM enhancement failed (unexpected HTTP response type). Using local suggestions only.',
    };
  }
  if (!responseUnknown.ok) {
    return {
      warning: `LLM enhancement failed (${String(responseUnknown.status)} ${responseUnknown.statusText}). Using local suggestions only.`,
    };
  }

  let payload: unknown;
  try {
    payload = await responseUnknown.json();
  } catch {
    return {
      warning:
        'LLM enhancement failed (invalid JSON response). Using local suggestions only.',
    };
  }

  const content = getContentFromLlmPayload(payload);
  if (content === undefined) {
    return {
      warning:
        'LLM enhancement failed (missing message content). Using local suggestions only.',
    };
  }

  return { content };
}

function applyLlmSuggestions(
  configNamesToEnhance: readonly string[],
  emojiByConfig: Map<string, string>,
  llmSuggestions: Readonly<Record<string, unknown>>,
): void {
  const configNameLookup = new Map<string, string>(
    configNamesToEnhance.map((configName) => [
      configName.toLowerCase(),
      configName,
    ]),
  );
  const usedEmojis = new Set(emojiByConfig.values());

  for (const [nameFromLlm, suggestion] of Object.entries(llmSuggestions)) {
    if (typeof suggestion !== 'string') {
      continue;
    }

    const normalizedName = configNameLookup.get(nameFromLlm.toLowerCase());
    if (!normalizedName) {
      continue;
    }

    const normalizedSuggestion = normalizeEmojiCandidate(suggestion);
    if (!normalizedSuggestion || RESERVED_EMOJI_SET.has(normalizedSuggestion)) {
      continue;
    }

    const current = emojiByConfig.get(normalizedName);
    /* istanbul ignore next -- config names to enhance are always present in emojiByConfig */
    if (!current) {
      continue;
    }
    if (current === normalizedSuggestion) {
      continue;
    }
    if (usedEmojis.has(normalizedSuggestion)) {
      continue;
    }

    usedEmojis.delete(current);
    usedEmojis.add(normalizedSuggestion);
    emojiByConfig.set(normalizedName, normalizedSuggestion);
  }
}

async function enhanceSuggestionsWithLlm(
  configNamesToEnhance: readonly string[],
  emojiByConfig: Map<string, string>,
): Promise<{ warning?: string }> {
  if (configNamesToEnhance.length === 0) {
    return {};
  }

  const llmConfig = getLlmConfig();
  if (!llmConfig) {
    return {
      warning:
        'LLM enhancement skipped: set LLM_API_KEY to enable provider-based emoji suggestions.',
    };
  }

  const llmResponse = await requestLlmContent(llmConfig, configNamesToEnhance);
  if (llmResponse.warning) {
    return llmResponse;
  }
  if (!llmResponse.content) {
    return {
      warning:
        'LLM enhancement failed (empty response content). Using local suggestions only.',
    };
  }

  const parsedContent = parseLlmResponseObject(llmResponse.content);
  if (!parsedContent) {
    return {
      warning:
        'LLM enhancement failed (response was not a JSON object). Using local suggestions only.',
    };
  }

  applyLlmSuggestions(configNamesToEnhance, emojiByConfig, parsedContent);
  return {};
}

export async function generateInitEmojis(context: Context): Promise<void> {
  const configNames = sortCaseInsensitive(
    Object.keys(context.plugin.configs ?? {}),
  );
  if (configNames.length === 0) {
    throw new Error(
      'Could not find exported `configs` object in ESLint plugin to suggest emojis for.',
    );
  }

  const emojiByConfig = new Map<string, string>();
  for (const configName of configNames) {
    const existingEmoji = context.options.configEmojis.find(
      (configEmoji) => configEmoji.config === configName,
    )?.emoji;
    if (existingEmoji) {
      emojiByConfig.set(configName, existingEmoji);
    }
  }

  const generatedConfigNames: string[] = [];
  const usedEmojis = new Set(emojiByConfig.values());
  for (const configName of configNames) {
    if (emojiByConfig.has(configName)) {
      continue;
    }

    const localSuggestion = suggestEmojiLocally(configName, usedEmojis);
    emojiByConfig.set(configName, localSuggestion);
    usedEmojis.add(localSuggestion);
    generatedConfigNames.push(configName);
  }

  const llmResult = await enhanceSuggestionsWithLlm(
    generatedConfigNames,
    emojiByConfig,
  );
  if (llmResult.warning) {
    console.error(llmResult.warning);
  }

  console.log(formatConfigEmojiTuples(configNames, emojiByConfig));
}
