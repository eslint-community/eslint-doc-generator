import * as nodeEmoji from 'node-emoji';
import { RESERVED_EMOJIS } from './emojis.js';
import { AI_PROVIDER } from './types.js';
import type { AI_PROVIDER as AiProviderType } from './types.js';

const PROVIDER_API_KEY_ENV: Record<AiProviderType, string> = {
  [AI_PROVIDER.OPENAI]: 'OPENAI_API_KEY',
  [AI_PROVIDER.ANTHROPIC]: 'ANTHROPIC_API_KEY',
};

const PROVIDER_DEFAULT_MODEL: Record<AiProviderType, string> = {
  [AI_PROVIDER.OPENAI]: 'gpt-4o-mini',
  [AI_PROVIDER.ANTHROPIC]: 'claude-3-5-haiku-latest',
};

const RESERVED_EMOJI_SET = new Set(RESERVED_EMOJIS);

interface ProviderConfig {
  provider: AiProviderType;
  apiKey: string;
  model: string;
}

interface FetchResponseLike {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  json: () => Promise<unknown>;
}

interface AiRequestOptions {
  aiProvider: AiProviderType | undefined;
  aiModel: string | undefined;
}

interface ProviderWithApiKey {
  provider: AiProviderType;
  apiKey: string;
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

function getOptionalEnvVar(name: string): string | undefined {
  const value = process.env[name];
  if (!value || value === 'undefined') {
    return undefined;
  }
  return value;
}

function resolveProviderConfig({
  aiProvider,
  aiModel,
}: AiRequestOptions): ProviderConfig {
  if (aiProvider) {
    const envVar = PROVIDER_API_KEY_ENV[aiProvider];
    const apiKey = getOptionalEnvVar(envVar);
    if (!apiKey) {
      throw new Error(`Provider "${aiProvider}" requires ${envVar} to be set.`);
    }
    return {
      provider: aiProvider,
      apiKey,
      model: aiModel ?? PROVIDER_DEFAULT_MODEL[aiProvider],
    };
  }

  const providers: readonly AiProviderType[] = [
    AI_PROVIDER.OPENAI,
    AI_PROVIDER.ANTHROPIC,
  ];
  const providersWithApiKey: ProviderWithApiKey[] = providers.flatMap(
    (provider) => {
      const envVar = PROVIDER_API_KEY_ENV[provider];
      const apiKey = getOptionalEnvVar(envVar);
      return apiKey ? [{ provider, apiKey }] : [];
    },
  );

  if (providersWithApiKey.length === 0) {
    throw new Error(
      `No AI provider API key found. Set one of: ${Object.values(
        PROVIDER_API_KEY_ENV,
      ).join(', ')}.`,
    );
  }
  if (providersWithApiKey.length > 1) {
    throw new Error(
      `Multiple AI provider API keys found (${providersWithApiKey
        .map(({ provider }) => PROVIDER_API_KEY_ENV[provider])
        .join(', ')}). Use --ai-provider to specify one.`,
    );
  }

  const { provider, apiKey } = providersWithApiKey[0] as ProviderWithApiKey;
  return {
    provider,
    apiKey,
    model: aiModel ?? PROVIDER_DEFAULT_MODEL[provider],
  };
}

function getOpenAiContent(payload: unknown): string | undefined {
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

function getAnthropicContent(payload: unknown): string | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }
  const content = payload['content'];
  if (!Array.isArray(content)) {
    return undefined;
  }
  const textParts = content.flatMap((part) => {
    if (!isRecord(part)) {
      return [];
    }
    if (part['type'] !== 'text') {
      return [];
    }
    const text = part['text'];
    return typeof text === 'string' ? [text] : [];
  });
  return textParts.length > 0 ? textParts.join('') : undefined;
}

function parseLlmResponseObject(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('AI response was empty.');
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

  const parsed = JSON.parse(jsonLike) as unknown;
  if (!isRecord(parsed)) {
    throw new Error('AI response was not a JSON object.');
  }
  return parsed;
}

async function requestOpenAiSuggestions(
  providerConfig: ProviderConfig,
  configNames: readonly string[],
): Promise<Record<string, unknown>> {
  let responseUnknown: unknown;
  try {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    responseUnknown = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${providerConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: providerConfig.model,
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
                configs: configNames,
                forbiddenEmojis: RESERVED_EMOJIS,
              }),
            },
          ],
        }),
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenAI request failed: ${message}`, { cause: error });
  }

  if (!isFetchResponseLike(responseUnknown)) {
    throw new Error('OpenAI request failed: unexpected HTTP response type.');
  }
  if (!responseUnknown.ok) {
    throw new Error(
      `OpenAI request failed (${String(responseUnknown.status)} ${responseUnknown.statusText}).`,
    );
  }

  const payload = await responseUnknown.json();
  const content = getOpenAiContent(payload);
  if (content === undefined) {
    throw new Error('OpenAI response did not include assistant text content.');
  }
  return parseLlmResponseObject(content);
}

async function requestAnthropicSuggestions(
  providerConfig: ProviderConfig,
  configNames: readonly string[],
): Promise<Record<string, unknown>> {
  let responseUnknown: unknown;
  try {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    responseUnknown = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': providerConfig.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: providerConfig.model,
        max_tokens: 512,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: JSON.stringify({
              instruction:
                'Return a JSON object mapping each config name to exactly one emoji character. No markdown.',
              configs: configNames,
              forbiddenEmojis: RESERVED_EMOJIS,
            }),
          },
        ],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Anthropic request failed: ${message}`, { cause: error });
  }

  if (!isFetchResponseLike(responseUnknown)) {
    throw new Error('Anthropic request failed: unexpected HTTP response type.');
  }
  if (!responseUnknown.ok) {
    throw new Error(
      `Anthropic request failed (${String(responseUnknown.status)} ${responseUnknown.statusText}).`,
    );
  }

  const payload = await responseUnknown.json();
  const content = getAnthropicContent(payload);
  if (content === undefined) {
    throw new Error(
      'Anthropic response did not include assistant text content.',
    );
  }
  return parseLlmResponseObject(content);
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

  const providerConfig = resolveProviderConfig(aiRequestOptions);
  const suggestions =
    providerConfig.provider === AI_PROVIDER.OPENAI
      ? await requestOpenAiSuggestions(providerConfig, configNamesToEnhance)
      : await requestAnthropicSuggestions(providerConfig, configNamesToEnhance);
  applyAiSuggestions(configNamesToEnhance, suggestions, emojiByConfig);
}
