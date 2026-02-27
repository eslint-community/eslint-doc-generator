import * as nodeEmoji from 'node-emoji';
import { RESERVED_EMOJIS, RESERVED_EMOJI_SET } from './emojis.js';
import {
  requestAiJsonObject,
  resolveAiProviderConfig,
  type AiRequestOptions,
} from './ai.js';

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

function applyAiSuggestions(
  configNames: readonly string[],
  llmSuggestions: Readonly<Record<string, unknown>>,
  emojiByConfig: Map<string, string>,
): void {
  const configNameLookup = new Map<string, string>(
    configNames.map((configName) => [configName.toLowerCase(), configName]),
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
    if (!normalizedSuggestion) {
      continue;
    }
    if (RESERVED_EMOJI_SET.has(normalizedSuggestion)) {
      continue;
    }

    const current = emojiByConfig.get(normalizedName) as string;
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

export async function applyAiEmojiSuggestions(
  configNamesToEnhance: readonly string[],
  emojiByConfig: Map<string, string>,
  aiRequestOptions: AiRequestOptions,
): Promise<void> {
  if (configNamesToEnhance.length === 0) {
    return;
  }

  const providerConfig = resolveAiProviderConfig(aiRequestOptions);
  const suggestions = await requestAiJsonObject(providerConfig, {
    systemPrompt:
      'Return a JSON object mapping each config name to exactly one emoji character. No markdown.',
    userPrompt: JSON.stringify({
      configs: configNamesToEnhance,
      forbiddenEmojis: RESERVED_EMOJIS,
    }),
  });
  applyAiSuggestions(configNamesToEnhance, suggestions, emojiByConfig);
}
