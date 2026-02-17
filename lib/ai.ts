import { AI_PROVIDER } from './types.js';
import type { AI_PROVIDER as AiProviderType } from './types.js';

type REQUEST_PROTOCOL = 'openaiCompatible' | 'anthropic';

interface ProviderMetadata {
  apiKeyEnvVar: string;
  defaultModel: string;
  endpoint: string;
  protocol: REQUEST_PROTOCOL;
}

const PROVIDER_METADATA: Record<AiProviderType, ProviderMetadata> = {
  [AI_PROVIDER.OPENAI]: {
    apiKeyEnvVar: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    protocol: 'openaiCompatible',
  },
  [AI_PROVIDER.ANTHROPIC]: {
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-3-5-haiku-latest',
    endpoint: 'https://api.anthropic.com/v1/messages',
    protocol: 'anthropic',
  },
  [AI_PROVIDER.AI_GATEWAY]: {
    apiKeyEnvVar: 'AI_GATEWAY_API_KEY',
    defaultModel: 'openai/gpt-4o-mini',
    endpoint: 'https://ai-gateway.vercel.sh/v1/chat/completions',
    protocol: 'openaiCompatible',
  },
  [AI_PROVIDER.GROQ]: {
    apiKeyEnvVar: 'GROQ_API_KEY',
    defaultModel: 'llama-3.1-8b-instant',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    protocol: 'openaiCompatible',
  },
  [AI_PROVIDER.OPENROUTER]: {
    apiKeyEnvVar: 'OPENROUTER_API_KEY',
    defaultModel: 'openai/gpt-4o-mini',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    protocol: 'openaiCompatible',
  },
  [AI_PROVIDER.TOGETHER]: {
    apiKeyEnvVar: 'TOGETHER_API_KEY',
    defaultModel: 'meta-llama/Llama-3.1-8B-Instruct-Turbo',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    protocol: 'openaiCompatible',
  },
  [AI_PROVIDER.XAI]: {
    apiKeyEnvVar: 'XAI_API_KEY',
    defaultModel: 'grok-2-latest',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    protocol: 'openaiCompatible',
  },
};

const AI_PROVIDERS: readonly AiProviderType[] = [
  AI_PROVIDER.AI_GATEWAY,
  AI_PROVIDER.ANTHROPIC,
  AI_PROVIDER.GROQ,
  AI_PROVIDER.OPENAI,
  AI_PROVIDER.OPENROUTER,
  AI_PROVIDER.TOGETHER,
  AI_PROVIDER.XAI,
];

export const SUPPORTED_API_KEY_ENV_VARS = [
  ...new Set(
    AI_PROVIDERS.map((provider) => PROVIDER_METADATA[provider].apiKeyEnvVar),
  ),
];

interface FetchResponseLike {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  json: () => Promise<unknown>;
}

interface ProviderWithApiKey {
  provider: AiProviderType;
  apiKey: string;
}

export interface AiRequestOptions {
  aiProvider: AiProviderType | undefined;
  aiModel: string | undefined;
}

export interface AiProviderConfig {
  provider: AiProviderType;
  apiKey: string;
  model: string;
  endpoint: string;
  protocol: REQUEST_PROTOCOL;
}

function getProviderLabel(provider: AiProviderType): string {
  return (
    {
      [AI_PROVIDER.AI_GATEWAY]: 'Vercel AI Gateway',
      [AI_PROVIDER.ANTHROPIC]: 'Anthropic',
      [AI_PROVIDER.GROQ]: 'Groq',
      [AI_PROVIDER.OPENAI]: 'OpenAI',
      [AI_PROVIDER.OPENROUTER]: 'OpenRouter',
      [AI_PROVIDER.TOGETHER]: 'Together',
      [AI_PROVIDER.XAI]: 'xAI',
    } as const
  )[provider];
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

export function resolveAiProviderConfig({
  aiProvider,
  aiModel,
}: AiRequestOptions): AiProviderConfig {
  if (aiProvider) {
    const metadata = PROVIDER_METADATA[aiProvider];
    const apiKey = getOptionalEnvVar(metadata.apiKeyEnvVar);
    if (!apiKey) {
      throw new Error(
        `Provider "${aiProvider}" requires ${metadata.apiKeyEnvVar} to be set.`,
      );
    }
    return {
      provider: aiProvider,
      apiKey,
      model: aiModel ?? metadata.defaultModel,
      endpoint: metadata.endpoint,
      protocol: metadata.protocol,
    };
  }

  const providersWithApiKey: ProviderWithApiKey[] = AI_PROVIDERS.flatMap(
    (provider) => {
      const apiKey = getOptionalEnvVar(
        PROVIDER_METADATA[provider].apiKeyEnvVar,
      );
      return apiKey ? [{ provider, apiKey }] : [];
    },
  );

  if (providersWithApiKey.length === 0) {
    throw new Error(
      `No AI provider API key found. Set one of: ${SUPPORTED_API_KEY_ENV_VARS.join(', ')}.`,
    );
  }
  if (providersWithApiKey.length > 1) {
    throw new Error(
      `Multiple AI provider API keys found (${providersWithApiKey
        .map(({ provider }) => PROVIDER_METADATA[provider].apiKeyEnvVar)
        .join(', ')}). Use --ai-provider to specify one.`,
    );
  }

  const { provider, apiKey } = providersWithApiKey[0] as ProviderWithApiKey;
  const metadata = PROVIDER_METADATA[provider];
  return {
    provider,
    apiKey,
    model: aiModel ?? metadata.defaultModel,
    endpoint: metadata.endpoint,
    protocol: metadata.protocol,
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

async function requestOpenAiCompatibleObject(
  providerConfig: AiProviderConfig,
  userPrompt: string,
): Promise<Record<string, unknown>> {
  let responseUnknown: unknown;
  const providerLabel = getProviderLabel(providerConfig.provider);

  try {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    responseUnknown = await fetch(providerConfig.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${providerConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: providerConfig.model,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content:
              'Return a JSON object mapping each config name to exactly one emoji character. No markdown.',
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${providerLabel} request failed: ${message}`, {
      cause: error,
    });
  }

  if (!isFetchResponseLike(responseUnknown)) {
    throw new Error(
      `${providerLabel} request failed: unexpected HTTP response type.`,
    );
  }
  if (!responseUnknown.ok) {
    throw new Error(
      `${providerLabel} request failed (${String(responseUnknown.status)} ${responseUnknown.statusText}).`,
    );
  }

  const payload = await responseUnknown.json();
  const content = getOpenAiContent(payload);
  if (content === undefined) {
    throw new Error(
      `${providerLabel} response did not include assistant text content.`,
    );
  }
  return parseLlmResponseObject(content);
}

async function requestAnthropicObject(
  providerConfig: AiProviderConfig,
  userPrompt: string,
): Promise<Record<string, unknown>> {
  let responseUnknown: unknown;
  const providerLabel = getProviderLabel(providerConfig.provider);

  try {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    responseUnknown = await fetch(providerConfig.endpoint, {
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
            content: userPrompt,
          },
        ],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${providerLabel} request failed: ${message}`, {
      cause: error,
    });
  }

  if (!isFetchResponseLike(responseUnknown)) {
    throw new Error(
      `${providerLabel} request failed: unexpected HTTP response type.`,
    );
  }
  if (!responseUnknown.ok) {
    throw new Error(
      `${providerLabel} request failed (${String(responseUnknown.status)} ${responseUnknown.statusText}).`,
    );
  }

  const payload = await responseUnknown.json();
  const content = getAnthropicContent(payload);
  if (content === undefined) {
    throw new Error(
      `${providerLabel} response did not include assistant text content.`,
    );
  }
  return parseLlmResponseObject(content);
}

export function requestAiJsonObject(
  providerConfig: AiProviderConfig,
  userPrompt: string,
): Promise<Record<string, unknown>> {
  return providerConfig.protocol === 'openaiCompatible'
    ? requestOpenAiCompatibleObject(providerConfig, userPrompt)
    : requestAnthropicObject(providerConfig, userPrompt);
}
