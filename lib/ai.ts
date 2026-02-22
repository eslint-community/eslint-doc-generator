import { AI_PROVIDER } from './types.js';

type REQUEST_PROTOCOL = 'openaiCompatible' | 'anthropic';

interface ProviderMetadata {
  apiKeyEnvVar: string;
  defaultModel: string;
  endpoint: string;
  protocol: REQUEST_PROTOCOL;
}

const PROVIDER_METADATA: Record<AI_PROVIDER, ProviderMetadata> = {
  [AI_PROVIDER.ANTHROPIC]: {
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-sonnet-4-6',
    endpoint: 'https://api.anthropic.com/v1/messages',
    protocol: 'anthropic',
  },
  [AI_PROVIDER.GROQ]: {
    apiKeyEnvVar: 'GROQ_API_KEY',
    defaultModel: 'llama-3.3-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    protocol: 'openaiCompatible',
  },
  [AI_PROVIDER.OPENAI]: {
    apiKeyEnvVar: 'OPENAI_API_KEY',
    defaultModel: 'gpt-5.2',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    protocol: 'openaiCompatible',
  },
  [AI_PROVIDER.OPENROUTER]: {
    apiKeyEnvVar: 'OPENROUTER_API_KEY',
    defaultModel: 'openai/gpt-5.2',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    protocol: 'openaiCompatible',
  },
  [AI_PROVIDER.TOGETHER]: {
    apiKeyEnvVar: 'TOGETHER_API_KEY',
    defaultModel: 'openai/gpt-oss-20b',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    protocol: 'openaiCompatible',
  },
  [AI_PROVIDER.VERCEL_AI_GATEWAY]: {
    apiKeyEnvVar: 'VERCEL_AI_GATEWAY_API_KEY',
    defaultModel: 'openai/gpt-5.2',
    endpoint: 'https://ai-gateway.vercel.sh/v1/chat/completions',
    protocol: 'openaiCompatible',
  },
  [AI_PROVIDER.XAI]: {
    apiKeyEnvVar: 'XAI_API_KEY',
    defaultModel: 'grok-4-1-fast-reasoning',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    protocol: 'openaiCompatible',
  },
};

const AI_PROVIDERS = Object.values(AI_PROVIDER) as readonly AI_PROVIDER[];

export const SUPPORTED_API_KEY_ENV_VARS = [
  ...new Set(
    AI_PROVIDERS.map((provider) => PROVIDER_METADATA[provider].apiKeyEnvVar),
  ),
];

const REQUEST_TIMEOUT_MS = 30_000;

interface FetchResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  json: () => Promise<unknown>;
}

interface ProviderErrorDetails {
  readonly code?: string;
  readonly type?: string;
  readonly message?: string;
}

interface ProviderWithApiKey {
  provider: AI_PROVIDER;
  apiKey: string;
}

interface ProtocolRequestData {
  headers: Record<string, string>;
  body: string;
  getContent: (payload: unknown) => string | undefined;
}

type OpenAiCompatibleResponseFormatType = 'json' | 'json_object';

export interface AiRequestOptions {
  aiProvider: AI_PROVIDER | undefined;
  aiModel: string | undefined;
}

export interface AiProviderConfig {
  provider: AI_PROVIDER;
  apiKey: string;
  model: string;
  endpoint: string;
  protocol: REQUEST_PROTOCOL;
}

export interface AiJsonRequestPrompt {
  readonly systemPrompt?: string;
  readonly userPrompt: string;
}

function getProviderLabel(provider: AI_PROVIDER): string {
  return (
    {
      [AI_PROVIDER.ANTHROPIC]: 'Anthropic',
      [AI_PROVIDER.GROQ]: 'Groq',
      [AI_PROVIDER.OPENAI]: 'OpenAI',
      [AI_PROVIDER.OPENROUTER]: 'OpenRouter',
      [AI_PROVIDER.TOGETHER]: 'Together',
      [AI_PROVIDER.VERCEL_AI_GATEWAY]: 'Vercel AI Gateway',
      [AI_PROVIDER.XAI]: 'xAI',
    } as const
  )[provider];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

function getProviderErrorDetails(
  detailsUnknown: unknown,
): ProviderErrorDetails | undefined {
  if (!isRecord(detailsUnknown)) {
    return undefined;
  }

  const codeUnknown = detailsUnknown['code'];
  const typeUnknown = detailsUnknown['type'];
  const messageUnknown = detailsUnknown['message'];

  const code =
    typeof codeUnknown === 'string'
      ? codeUnknown
      : typeof codeUnknown === 'number'
        ? String(codeUnknown)
        : undefined;
  const type = typeof typeUnknown === 'string' ? typeUnknown : undefined;
  const message =
    typeof messageUnknown === 'string' ? messageUnknown : undefined;

  if (!code && !type && !message) {
    return undefined;
  }

  return {
    ...(code ? { code } : {}),
    ...(type ? { type } : {}),
    ...(message ? { message } : {}),
  };
}

function getProtocolErrorDetails(
  payload: unknown,
): ProviderErrorDetails | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }
  return (
    getProviderErrorDetails(payload['error']) ??
    getProviderErrorDetails(payload)
  );
}

function formatProviderErrorDetails(
  details: ProviderErrorDetails | undefined,
): string | undefined {
  if (!details) {
    return undefined;
  }

  const segments: string[] = [];
  if (details.message) {
    segments.push(details.message);
  }
  if (details.code) {
    segments.push(`code: ${details.code}`);
  }
  if (details.type) {
    segments.push(`type: ${details.type}`);
  }
  return segments.length > 0 ? segments.join('; ') : undefined;
}

async function getHttpErrorDetails(
  response: FetchResponse,
): Promise<ProviderErrorDetails | undefined> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return undefined;
  }

  return getProtocolErrorDetails(payload);
}

async function throwProviderHttpError(
  providerConfig: AiProviderConfig,
  response: FetchResponse,
): Promise<never> {
  const providerLabel = getProviderLabel(providerConfig.provider);
  const details = await getHttpErrorDetails(response);
  const extraText = formatProviderErrorDetails(details);

  throw new Error(
    extraText
      ? `${providerLabel} request failed (${String(response.status)} ${response.statusText}). ${extraText}`
      : `${providerLabel} request failed (${String(response.status)} ${response.statusText}).`,
  );
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

function buildOpenAiCompatibleRequest(
  providerConfig: AiProviderConfig,
  prompt: AiJsonRequestPrompt,
): ProtocolRequestData {
  const responseFormatType: OpenAiCompatibleResponseFormatType =
    providerConfig.provider === AI_PROVIDER.VERCEL_AI_GATEWAY
      ? 'json'
      : 'json_object';
  const requestBody = {
    model: providerConfig.model,
    temperature: 0,
    messages: [
      ...(prompt.systemPrompt
        ? [{ role: 'system' as const, content: prompt.systemPrompt }]
        : []),
      {
        role: 'user' as const,
        content: prompt.userPrompt,
      },
    ],
    response_format: {
      type: responseFormatType,
    },
  };

  return {
    headers: {
      Authorization: `Bearer ${providerConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    getContent: getOpenAiContent,
  };
}

function buildAnthropicRequest(
  providerConfig: AiProviderConfig,
  prompt: AiJsonRequestPrompt,
): ProtocolRequestData {
  const requestBody: {
    model: string;
    max_tokens: number;
    temperature: number;
    messages: readonly { role: 'user'; content: string }[];
    system?: string;
  } = {
    model: providerConfig.model,
    max_tokens: 512,
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: prompt.userPrompt,
      },
    ],
  };
  if (prompt.systemPrompt) {
    requestBody.system = prompt.systemPrompt;
  }

  return {
    headers: {
      'x-api-key': providerConfig.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    getContent: getAnthropicContent,
  };
}

function buildProtocolRequest(
  providerConfig: AiProviderConfig,
  prompt: AiJsonRequestPrompt,
): ProtocolRequestData {
  return providerConfig.protocol === 'openaiCompatible'
    ? buildOpenAiCompatibleRequest(providerConfig, prompt)
    : buildAnthropicRequest(providerConfig, prompt);
}

async function requestProviderObject(
  providerConfig: AiProviderConfig,
  prompt: AiJsonRequestPrompt,
): Promise<Record<string, unknown>> {
  const providerLabel = getProviderLabel(providerConfig.provider);
  const { headers, body, getContent } = buildProtocolRequest(
    providerConfig,
    prompt,
  );

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, REQUEST_TIMEOUT_MS);

  let response: FetchResponse;
  try {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    response = await fetch(providerConfig.endpoint, {
      method: 'POST',
      headers,
      body,
      signal: abortController.signal,
    });
  } catch (error) {
    const isAbortError =
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError');
    if (abortController.signal.aborted || isAbortError) {
      throw new Error(
        `${providerLabel} request failed: timed out after ${String(REQUEST_TIMEOUT_MS)}ms.`,
        { cause: error },
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${providerLabel} request failed: ${message}`, {
      cause: error,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    await throwProviderHttpError(providerConfig, response);
  }

  const payload = await response.json();
  const content = getContent(payload);
  if (content === undefined) {
    throw new Error(
      `${providerLabel} response did not include assistant text content.`,
    );
  }

  return parseLlmResponseObject(content);
}

export function requestAiJsonObject(
  providerConfig: AiProviderConfig,
  prompt: AiJsonRequestPrompt,
): Promise<Record<string, unknown>> {
  return requestProviderObject(providerConfig, prompt);
}
