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

const KEYWORD_EMOJIS: Record<string, string> = {
  base: '🧱',
  browser: '🌐',
  documentation: '📚',
  docs: '📚',
  electron: '⚛️',
  errors: '❗',
  node: '🟢',
  performance: '⚡',
  react: '⚛️',
  strict: '🔒',
  style: '🎨',
  test: '🧪',
  testing: '🧪',
  typescript: '⌨️',
  warnings: '🚸',
};

type LocalSuggestionResult = {
  emoji: string;
  source: 'keyword' | 'search' | 'fallback';
};

function sortCaseInsensitive(values: readonly string[]): readonly string[] {
  return values.toSorted((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

function tokenizeConfigName(configName: string): readonly string[] {
  const normalized = configName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll(/[^a-zA-Z0-9]+/g, ' ')
    .toLowerCase()
    .trim();
  if (!normalized) {
    return [];
  }
  return normalized.split(/\s+/);
}

function normalizeEmojiCandidate(candidate: string): string | undefined {
  const trimmed = candidate.trim().replaceAll(/^["'`]+|["'`]+$/g, '');
  if (!trimmed) {
    return undefined;
  }

  const aliasMatch = trimmed.match(/^:([a-zA-Z0-9_+-]+):$/);
  if (aliasMatch?.[1]) {
    const fromAlias = nodeEmoji.get(aliasMatch[1]);
    if (fromAlias !== undefined) {
      return fromAlias;
    }
  }

  const fromName = nodeEmoji.get(trimmed);
  if (fromName !== undefined) {
    return fromName;
  }

  const maybeEmojiToken = trimmed
    .split(/\s+/)
    .find((part) => /[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u.test(part));
  if (maybeEmojiToken) {
    return maybeEmojiToken;
  }

  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return trimmed;
  }

  return undefined;
}

function canUseEmoji(candidate: string, usedEmojis: Set<string>): boolean {
  return !RESERVED_EMOJI_SET.has(candidate) && !usedEmojis.has(candidate);
}

function tryUseEmoji(
  candidate: string | undefined,
  usedEmojis: Set<string>,
): string | undefined {
  if (!candidate) {
    return undefined;
  }
  return canUseEmoji(candidate, usedEmojis) ? candidate : undefined;
}

function suggestEmojiLocally(
  configName: string,
  usedEmojis: Set<string>,
): LocalSuggestionResult {
  const configNameLower = configName.toLowerCase();
  const tokens = tokenizeConfigName(configName);

  const exactDefault = tryUseEmoji(EMOJI_CONFIGS[configNameLower], usedEmojis);
  if (exactDefault) {
    return { emoji: exactDefault, source: 'keyword' };
  }

  for (const token of tokens) {
    const tokenKeywordEmoji = tryUseEmoji(KEYWORD_EMOJIS[token], usedEmojis);
    if (tokenKeywordEmoji) {
      return { emoji: tokenKeywordEmoji, source: 'keyword' };
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
        return { emoji: fromSearch, source: 'search' };
      }
    }
  }

  const fallback =
    FALLBACK_EMOJIS.find((emoji) => canUseEmoji(emoji, usedEmojis)) ??
    FALLBACK_EMOJIS[0];
  return { emoji: fallback, source: 'fallback' };
}

function escapeSingleQuotedString(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}

function formatConfigEmojiTuples(
  configNames: readonly string[],
  emojiByConfig: ReadonlyMap<string, string>,
): string {
  const lines = ['configEmoji: ['];
  for (const configName of configNames) {
    const emoji = emojiByConfig.get(configName);
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

function extractContentAsString(content: unknown): string | undefined {
  if (typeof content === 'string') {
    return content;
  }
  if (!Array.isArray(content)) {
    return undefined;
  }

  const textParts = content.flatMap((part) => {
    if (
      typeof part === 'object' &&
      part !== null &&
      'text' in part &&
      typeof part.text === 'string'
    ) {
      return [part.text];
    }
    return [];
  });
  return textParts.length > 0 ? textParts.join('') : undefined;
}

function parseLlmResponseObject(content: string): Record<string, unknown> | undefined {
  const trimmed = content.trim();
  if (!trimmed) {
    return undefined;
  }

  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const jsonLike = withoutFences.includes('{')
    ? withoutFences.slice(
        withoutFences.indexOf('{'),
        withoutFences.lastIndexOf('}') + 1,
      )
    : withoutFences;

  try {
    const parsed = JSON.parse(jsonLike) as unknown;
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Ignore parse failures and let caller fallback.
  }
  return undefined;
}

async function enhanceSuggestionsWithLlm(
  configNamesToEnhance: readonly string[],
  emojiByConfig: Map<string, string>,
): Promise<{ warning?: string }> {
  if (configNamesToEnhance.length === 0) {
    return {};
  }

  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    return {
      warning:
        'LLM enhancement skipped: set LLM_API_KEY to enable provider-based emoji suggestions.',
    };
  }

  const model = process.env.LLM_MODEL ?? DEFAULT_LLM_MODEL;
  const baseUrl = (process.env.LLM_BASE_URL ?? DEFAULT_LLM_BASE_URL).replace(
    /\/+$/,
    '',
  );
  const url = `${baseUrl}/chat/completions`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
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

  if (!response.ok) {
    return {
      warning: `LLM enhancement failed (${response.status} ${response.statusText}). Using local suggestions only.`,
    };
  }

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    return {
      warning:
        'LLM enhancement failed (invalid JSON response). Using local suggestions only.',
    };
  }

  const responseContent =
    typeof payload === 'object' &&
    payload !== null &&
    'choices' in payload &&
    Array.isArray(payload.choices) &&
    payload.choices.length > 0 &&
    typeof payload.choices[0] === 'object' &&
    payload.choices[0] !== null &&
    'message' in payload.choices[0] &&
    typeof payload.choices[0].message === 'object' &&
    payload.choices[0].message !== null &&
    'content' in payload.choices[0].message
      ? extractContentAsString(payload.choices[0].message.content)
      : undefined;

  if (!responseContent) {
    return {
      warning:
        'LLM enhancement failed (missing message content). Using local suggestions only.',
    };
  }

  const parsedContent = parseLlmResponseObject(responseContent);
  if (!parsedContent) {
    return {
      warning:
        'LLM enhancement failed (response was not a JSON object). Using local suggestions only.',
    };
  }

  const configNameLookup = new Map<string, string>(
    configNamesToEnhance.map((configName) => [configName.toLowerCase(), configName]),
  );
  const usedEmojis = new Set(emojiByConfig.values());

  for (const [nameFromLlm, suggestion] of Object.entries(parsedContent)) {
    const normalizedName = configNameLookup.get(nameFromLlm.toLowerCase());
    if (!normalizedName || typeof suggestion !== 'string') {
      continue;
    }
    const normalizedSuggestion = normalizeEmojiCandidate(suggestion);
    if (!normalizedSuggestion || RESERVED_EMOJI_SET.has(normalizedSuggestion)) {
      continue;
    }

    const current = emojiByConfig.get(normalizedName);
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

  return {};
}

export async function generateInitEmojis(context: Context): Promise<void> {
  const configNames = sortCaseInsensitive(Object.keys(context.plugin.configs ?? {}));
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
    emojiByConfig.set(configName, localSuggestion.emoji);
    usedEmojis.add(localSuggestion.emoji);
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
