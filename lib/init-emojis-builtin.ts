import * as nodeEmoji from 'node-emoji';
import type { Context } from './context.js';
import { EMOJI_CONFIGS, RESERVED_EMOJIS } from './emojis.js';

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

export interface BuiltinEmojiSuggestions {
  configNames: readonly string[];
  emojiByConfig: Map<string, string>;
  generatedConfigNames: readonly string[];
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
      const fromSearch = tryUseEmoji(match.emoji, usedEmojis);
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

function sortCaseInsensitive(values: readonly string[]): readonly string[] {
  return values.toSorted((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  );
}

export function getBuiltinEmojiSuggestions(
  context: Context,
): BuiltinEmojiSuggestions {
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

  return { configNames, emojiByConfig, generatedConfigNames };
}
