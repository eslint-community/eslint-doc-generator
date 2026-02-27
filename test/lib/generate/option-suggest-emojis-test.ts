import * as sinon from 'sinon';
import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

const PROVIDER_API_KEY_ENV_VARS = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'TOGETHER_API_KEY',
  'VERCEL_AI_GATEWAY_API_KEY',
  'XAI_API_KEY',
] as const;
type ProviderApiKeyEnvVar = (typeof PROVIDER_API_KEY_ENV_VARS)[number];

function parseSuggestionTable(output: string): Map<string, string> {
  const suggestions = new Map<string, string>();
  for (const line of output.split('\n')) {
    if (!line.includes('│')) {
      continue;
    }
    const rowMatch = line.match(/[║│]\s*(.+?)\s*│\s*(.+?)\s*[║│]/u);
    if (!rowMatch) {
      continue;
    }
    const configName = rowMatch[1];
    const emoji = rowMatch[2];
    if (!configName || !emoji || configName === 'Config' || emoji === 'Emoji') {
      continue;
    }
    suggestions.set(configName, emoji);
  }
  return suggestions;
}

function restoreEnvVar(
  name: ProviderApiKeyEnvVar,
  value: string | undefined,
): void {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, name);
    return;
  }
  process.env[name] = value;
}

interface MockFetchResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  json: () => Promise<unknown>;
}

interface MockFetchResponseInit {
  readonly status?: number;
  readonly statusText?: string;
}

function createJsonFetchResponse(
  payload: unknown,
  init?: MockFetchResponseInit,
): MockFetchResponse {
  return {
    ok: (init?.status ?? 200) < 400,
    status: init?.status ?? 200,
    statusText: init?.statusText ?? 'OK',
    json: () => Promise.resolve(payload),
  };
}

function createTextFetchResponse(
  body: string,
  init?: MockFetchResponseInit,
): MockFetchResponse {
  return {
    ok: (init?.status ?? 200) < 400,
    status: init?.status ?? 200,
    statusText: init?.statusText ?? 'OK',
    json: () => Promise.reject(new SyntaxError(body)),
  };
}

interface FetchStubTarget {
  fetch: (...args: unknown[]) => Promise<MockFetchResponse>;
}

function stubFetch() {
  return sinon.stub(globalThis as unknown as FetchStubTarget, 'fetch');
}

async function withTempFixture(
  indexContent: string,
  run: (fixture: FixtureContext) => Promise<void>,
): Promise<void> {
  const fixture = await setupFixture({
    fixture: 'esm-base',
    overrides: {
      'README.md': '# README fixture',
      'index.js': indexContent,
    },
  });
  try {
    await run(fixture);
  } finally {
    await fixture.cleanup();
  }
}

describe('generate (--suggest-emojis)', function () {
  let fixture: FixtureContext;

  const originalProviderApiKeys = Object.fromEntries(
    PROVIDER_API_KEY_ENV_VARS.map((name) => [name, process.env[name]]),
  ) as Record<ProviderApiKeyEnvVar, string | undefined>;

  function clearProviderApiKeys(): void {
    for (const name of PROVIDER_API_KEY_ENV_VARS) {
      restoreEnvVar(name, undefined);
    }
  }

  function restoreProviderApiKeys(): void {
    for (const name of PROVIDER_API_KEY_ENV_VARS) {
      restoreEnvVar(name, originalProviderApiKeys[name]);
    }
  }

  beforeAll(async function () {
    fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'README.md': '# README before suggest emojis',
        'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { docs: { description: 'no foo' } },
                create(context) {}
              },
            },
            configs: {
              recommended: { rules: { 'test/no-foo': 'error' } },
              'zzzz-one': { rules: { 'test/no-foo': 'error' } },
              'qqqq-two': { rules: { 'test/no-foo': 'warn' } },
              xyzabc: { rules: { 'test/no-foo': 'off' } },
            }
          };
        `,
      },
    });
  });

  beforeEach(function () {
    clearProviderApiKeys();
  });

  afterEach(function () {
    sinon.restore();
    restoreProviderApiKeys();
  });

  afterAll(async function () {
    await fixture.cleanup();
  });

  it('prints a table of suggestions and does not write files in builtin mode', async function () {
    const readmeBefore = await fixture.readFile('README.md');
    const consoleLogStub = sinon.stub(console, 'log');
    const fetchStub = stubFetch();

    restoreEnvVar('OPENAI_API_KEY', undefined);
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    await generate(fixture.path, { suggestEmojis: true });

    const readmeAfter = await fixture.readFile('README.md');
    expect(readmeAfter).toBe(readmeBefore);

    expect(fetchStub.callCount).toBe(0);
    expect(consoleLogStub.callCount).toBe(1);
    const output = String(consoleLogStub.firstCall.args[0]);
    expect(output).toContain('Config');
    expect(output).toContain('Emoji');
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('recommended')).toBe('✅');
    expect(suggestions.has('qqqq-two')).toBe(true);
    expect(suggestions.has('xyzabc')).toBe(true);
    expect(suggestions.has('zzzz-one')).toBe(true);
  });

  it('regenerates suggestions even when configEmoji already includes a config', async function () {
    const consoleLogStub = sinon.stub(console, 'log');

    await generate(fixture.path, {
      suggestEmojis: true,
      configEmoji: [['recommended', '🧪']],
    });

    const output = String(consoleLogStub.firstCall.args[0]);
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('recommended')).toBe('✅');
    expect(suggestions.get('recommended')).not.toBe('🧪');
  });

  it('uses OpenAI in ai mode with provider defaults and applies suggestions', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const fetchStub = stubFetch().resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                xyzabc: '🧠',
              }),
            },
          },
        ],
      }),
    );

    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);

    await generate(fixture.path, {
      suggestEmojis: true,
      ai: true,
      aiProvider: 'openai',
    });

    expect(fetchStub.callCount).toBe(1);
    expect(fetchStub.firstCall.args[0]).toBe(
      'https://api.openai.com/v1/chat/completions',
    );
    const requestInit = fetchStub.firstCall.args[1];
    expect(requestInit).toBeTruthy();
    expect(requestInit).toBeTypeOf('object');
    if (
      !requestInit ||
      typeof requestInit !== 'object' ||
      !('body' in requestInit)
    ) {
      throw new TypeError('Missing request init body in fetch call.');
    }
    expect(requestInit.body).toBeTypeOf('string');
    if (typeof requestInit.body !== 'string') {
      throw new TypeError('Expected fetch request body to be a string.');
    }
    const requestBody = JSON.parse(requestInit.body) as {
      model?: string;
      response_format?: { type?: string };
    };
    expect(requestBody.model).toBe('gpt-5.2');
    expect(requestBody.response_format).toStrictEqual({ type: 'json_object' });

    const output = String(consoleLogStub.firstCall.args[0]);
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('xyzabc')).toBe('🧠');
  });

  it('uses Groq in ai mode with provider defaults and applies suggestions', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const fetchStub = stubFetch().resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                xyzabc: '🛰️',
              }),
            },
          },
        ],
      }),
    );

    process.env['GROQ_API_KEY'] = 'test-groq-key';

    await generate(fixture.path, {
      suggestEmojis: true,
      ai: true,
      aiProvider: 'groq',
    });

    expect(fetchStub.callCount).toBe(1);
    expect(fetchStub.firstCall.args[0]).toBe(
      'https://api.groq.com/openai/v1/chat/completions',
    );
    const requestInit = fetchStub.firstCall.args[1];
    expect(requestInit).toBeTruthy();
    expect(requestInit).toBeTypeOf('object');
    if (
      !requestInit ||
      typeof requestInit !== 'object' ||
      !('body' in requestInit)
    ) {
      throw new TypeError('Missing request init body in fetch call.');
    }
    expect(requestInit.body).toBeTypeOf('string');
    if (typeof requestInit.body !== 'string') {
      throw new TypeError('Expected fetch request body to be a string.');
    }
    const requestBody = JSON.parse(requestInit.body) as {
      model?: string;
      response_format?: unknown;
    };
    expect(requestBody.model).toBe('llama-3.3-70b-versatile');
    expect(requestBody.response_format).toStrictEqual({ type: 'json_object' });

    const output = String(consoleLogStub.firstCall.args[0]);
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('xyzabc')).toBe('🛰️');
  });

  it('uses Vercel AI Gateway in ai mode with provider defaults and applies suggestions', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const fetchStub = stubFetch().resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                xyzabc: '🌐',
              }),
            },
          },
        ],
      }),
    );

    process.env['VERCEL_AI_GATEWAY_API_KEY'] = 'test-ai-gateway-key';

    await generate(fixture.path, {
      suggestEmojis: true,
      ai: true,
      aiProvider: 'vercelaigateway',
    });

    expect(fetchStub.callCount).toBe(1);
    expect(fetchStub.firstCall.args[0]).toBe(
      'https://ai-gateway.vercel.sh/v1/chat/completions',
    );
    const requestInit = fetchStub.firstCall.args[1];
    expect(requestInit).toBeTruthy();
    expect(requestInit).toBeTypeOf('object');
    if (
      !requestInit ||
      typeof requestInit !== 'object' ||
      !('body' in requestInit)
    ) {
      throw new TypeError('Missing request init body in fetch call.');
    }
    expect(requestInit.body).toBeTypeOf('string');
    if (typeof requestInit.body !== 'string') {
      throw new TypeError('Expected fetch request body to be a string.');
    }
    const requestBody = JSON.parse(requestInit.body) as {
      model?: string;
      response_format?: unknown;
    };
    expect(requestBody.model).toBe('openai/gpt-5.2');
    expect(requestBody.response_format).toStrictEqual({ type: 'json' });

    const output = String(consoleLogStub.firstCall.args[0]);
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('xyzabc')).toBe('🌐');
  });

  it('uses OpenRouter in ai mode with provider defaults and applies suggestions', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const fetchStub = stubFetch().resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                xyzabc: '🪐',
              }),
            },
          },
        ],
      }),
    );

    process.env['OPENROUTER_API_KEY'] = 'test-openrouter-key';

    await generate(fixture.path, {
      suggestEmojis: true,
      ai: true,
      aiProvider: 'openrouter',
    });

    expect(fetchStub.callCount).toBe(1);
    expect(fetchStub.firstCall.args[0]).toBe(
      'https://openrouter.ai/api/v1/chat/completions',
    );
    const requestInit = fetchStub.firstCall.args[1];
    expect(requestInit).toBeTruthy();
    expect(requestInit).toBeTypeOf('object');
    if (
      !requestInit ||
      typeof requestInit !== 'object' ||
      !('body' in requestInit)
    ) {
      throw new TypeError('Missing request init body in fetch call.');
    }
    expect(requestInit.body).toBeTypeOf('string');
    if (typeof requestInit.body !== 'string') {
      throw new TypeError('Expected fetch request body to be a string.');
    }
    const requestBody = JSON.parse(requestInit.body) as {
      model?: string;
      response_format?: unknown;
    };
    expect(requestBody.model).toBe('openai/gpt-5.2');
    expect(requestBody.response_format).toStrictEqual({ type: 'json_object' });

    const output = String(consoleLogStub.firstCall.args[0]);
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('xyzabc')).toBe('🪐');
  });

  it('uses Together in ai mode with provider defaults and applies suggestions', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const fetchStub = stubFetch().resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                xyzabc: '🧩',
              }),
            },
          },
        ],
      }),
    );

    process.env['TOGETHER_API_KEY'] = 'test-together-key';

    await generate(fixture.path, {
      suggestEmojis: true,
      ai: true,
      aiProvider: 'together',
    });

    expect(fetchStub.callCount).toBe(1);
    expect(fetchStub.firstCall.args[0]).toBe(
      'https://api.together.xyz/v1/chat/completions',
    );
    const requestInit = fetchStub.firstCall.args[1];
    expect(requestInit).toBeTruthy();
    expect(requestInit).toBeTypeOf('object');
    if (
      !requestInit ||
      typeof requestInit !== 'object' ||
      !('body' in requestInit)
    ) {
      throw new TypeError('Missing request init body in fetch call.');
    }
    expect(requestInit.body).toBeTypeOf('string');
    if (typeof requestInit.body !== 'string') {
      throw new TypeError('Expected fetch request body to be a string.');
    }
    const requestBody = JSON.parse(requestInit.body) as {
      model?: string;
      response_format?: unknown;
    };
    expect(requestBody.model).toBe('openai/gpt-oss-20b');
    expect(requestBody.response_format).toStrictEqual({ type: 'json_object' });

    const output = String(consoleLogStub.firstCall.args[0]);
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('xyzabc')).toBe('🧩');
  });

  it('uses xAI in ai mode with provider defaults and applies suggestions', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const fetchStub = stubFetch().resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                xyzabc: '🛰️',
              }),
            },
          },
        ],
      }),
    );

    process.env['XAI_API_KEY'] = 'test-xai-key';

    await generate(fixture.path, {
      suggestEmojis: true,
      ai: true,
      aiProvider: 'xai',
    });

    expect(fetchStub.callCount).toBe(1);
    expect(fetchStub.firstCall.args[0]).toBe(
      'https://api.x.ai/v1/chat/completions',
    );
    const requestInit = fetchStub.firstCall.args[1];
    expect(requestInit).toBeTruthy();
    expect(requestInit).toBeTypeOf('object');
    if (
      !requestInit ||
      typeof requestInit !== 'object' ||
      !('body' in requestInit)
    ) {
      throw new TypeError('Missing request init body in fetch call.');
    }
    expect(requestInit.body).toBeTypeOf('string');
    if (typeof requestInit.body !== 'string') {
      throw new TypeError('Expected fetch request body to be a string.');
    }
    const requestBody = JSON.parse(requestInit.body) as {
      model?: string;
      response_format?: unknown;
    };
    expect(requestBody.model).toBe('grok-4-1-fast-reasoning');
    expect(requestBody.response_format).toStrictEqual({ type: 'json_object' });

    const output = String(consoleLogStub.firstCall.args[0]);
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('xyzabc')).toBe('🛰️');
  });

  it('uses Anthropic automatically when exactly one provider API key is set', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const fetchStub = stubFetch().resolves(
      createJsonFetchResponse({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              xyzabc: '🦾',
            }),
          },
        ],
      }),
    );

    restoreEnvVar('OPENAI_API_KEY', undefined);
    process.env['ANTHROPIC_API_KEY'] = 'test-anthropic-key';

    await generate(fixture.path, {
      suggestEmojis: true,
      ai: true,
    });

    expect(fetchStub.callCount).toBe(1);
    expect(fetchStub.firstCall.args[0]).toBe(
      'https://api.anthropic.com/v1/messages',
    );
    const requestInit = fetchStub.firstCall.args[1];
    expect(requestInit).toBeTruthy();
    expect(requestInit).toBeTypeOf('object');
    if (
      !requestInit ||
      typeof requestInit !== 'object' ||
      !('body' in requestInit)
    ) {
      throw new TypeError('Missing request init body in fetch call.');
    }
    expect(requestInit.body).toBeTypeOf('string');
    if (typeof requestInit.body !== 'string') {
      throw new TypeError('Expected fetch request body to be a string.');
    }
    const requestBody = JSON.parse(requestInit.body) as { model?: string };
    expect(requestBody.model).toBe('claude-sonnet-4-6');

    const output = String(consoleLogStub.firstCall.args[0]);
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('xyzabc')).toBe('🦾');
  });

  it('throws when multiple provider keys are set and aiProvider is omitted', async function () {
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    process.env['ANTHROPIC_API_KEY'] = 'test-anthropic-key';
    const fetchStub = stubFetch();

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        ai: true,
      }),
    ).rejects.toThrow('Multiple AI provider API keys found');

    expect(fetchStub.callCount).toBe(0);
  });

  it('throws when no provider API key is set for ai mode', async function () {
    const error = await generate(fixture.path, {
      suggestEmojis: true,
      ai: true,
    }).then(
      () => undefined,
      (error_: unknown) => error_ as Error,
    );
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain('No AI provider API key found.');
    for (const envVar of PROVIDER_API_KEY_ENV_VARS) {
      expect(error?.message).toContain(envVar);
    }
  });

  it('throws when aiProvider is set but that provider key is missing', async function () {
    restoreEnvVar('OPENAI_API_KEY', undefined);
    process.env['ANTHROPIC_API_KEY'] = 'test-anthropic-key';

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        ai: true,
        aiProvider: 'openai',
      }),
    ).rejects.toThrow('Provider "openai" requires OPENAI_API_KEY to be set.');
  });

  it('throws when ai request fails', async function () {
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    stubFetch().rejects(new Error('request failed while connecting'));

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        ai: true,
        aiProvider: 'openai',
      }),
    ).rejects.toThrow('OpenAI request failed: request failed while connecting');
  });

  it('throws when ai request times out', async function () {
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    sinon.stub(globalThis, 'setTimeout').callsFake((handler) => {
      if (typeof handler === 'function') {
        handler();
      }
      return 1 as unknown as ReturnType<typeof setTimeout>;
    });
    stubFetch().callsFake((_input, init) => {
      const signal = (
        init as {
          signal?: {
            aborted: boolean;
          };
        }
      ).signal;
      if (!signal) {
        return Promise.reject(new Error('missing abort signal'));
      }
      if (!signal.aborted) {
        return Promise.reject(new Error('expected aborted signal'));
      }

      const abortError = new Error('aborted');
      abortError.name = 'AbortError';
      return Promise.reject(abortError);
    });

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        ai: true,
        aiProvider: 'openai',
      }),
    ).rejects.toThrow('OpenAI request failed: timed out after 30000ms.');
  });

  it('throws when ai response content is malformed JSON', async function () {
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    stubFetch().resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: 'not-json',
            },
          },
        ],
      }),
    );

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        ai: true,
        aiProvider: 'openai',
      }),
    ).rejects.toThrow('Unexpected token');
  });

  it('throws when OpenAI returns a non-OK HTTP status', async function () {
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    stubFetch().resolves(
      createJsonFetchResponse(
        {},
        {
          status: 503,
          statusText: 'Service Unavailable',
        },
      ),
    );

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        ai: true,
        aiProvider: 'openai',
      }),
    ).rejects.toThrow('OpenAI request failed (503 Service Unavailable).');
  });

  it('throws generic HTTP status when non-OK OpenAI error payload is not JSON', async function () {
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    stubFetch().resolves(
      createTextFetchResponse('invalid-json', {
        status: 502,
        statusText: 'Bad Gateway',
      }),
    );

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        ai: true,
        aiProvider: 'openai',
      }),
    ).rejects.toThrow('OpenAI request failed (502 Bad Gateway).');
  });

  it('includes parsed AI Gateway error details on invalid model', async function () {
    process.env['VERCEL_AI_GATEWAY_API_KEY'] = 'test-ai-gateway-key';
    restoreEnvVar('OPENAI_API_KEY', undefined);
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    stubFetch().resolves(
      createJsonFetchResponse(
        {
          error: {
            code: 'model_not_found',
            type: 'invalid_request_error',
            message: 'Model `foo` not found.',
          },
        },
        {
          status: 404,
          statusText: 'Not Found',
        },
      ),
    );

    const error = await generate(fixture.path, {
      suggestEmojis: true,
      ai: true,
      aiModel: 'foo',
      aiProvider: 'vercelaigateway',
    }).then(
      () => undefined,
      (error_: unknown) => error_ as Error,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain(
      'Vercel AI Gateway request failed (404 Not Found).',
    );
    expect(error?.message).toContain('Model `foo` not found.');
    expect(error?.message).toContain('code: model_not_found');
    expect(error?.message).toContain('type: invalid_request_error');
    expect(error?.message).not.toContain('invalid model name');
  });

  it('includes parsed AI Gateway error details for non-model errors', async function () {
    process.env['VERCEL_AI_GATEWAY_API_KEY'] = 'test-ai-gateway-key';
    restoreEnvVar('OPENAI_API_KEY', undefined);
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    stubFetch().resolves(
      createJsonFetchResponse(
        {
          error: {
            code: 'rate_limit_exceeded',
            type: 'rate_limit_error',
            message: 'Model throughput limit reached.',
          },
        },
        {
          status: 429,
          statusText: 'Too Many Requests',
        },
      ),
    );

    const error = await generate(fixture.path, {
      suggestEmojis: true,
      ai: true,
      aiModel: 'foo',
      aiProvider: 'vercelaigateway',
    }).then(
      () => undefined,
      (error_: unknown) => error_ as Error,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain(
      'Vercel AI Gateway request failed (429 Too Many Requests).',
    );
    expect(error?.message).toContain('Model throughput limit reached.');
    expect(error?.message).toContain('code: rate_limit_exceeded');
    expect(error?.message).toContain('type: rate_limit_error');
  });

  it('throws when OpenAI payload shape has no assistant content', async function () {
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    const fetchStub = stubFetch();
    fetchStub.onCall(0).resolves(createJsonFetchResponse([]));
    fetchStub.onCall(1).resolves(createJsonFetchResponse({ choices: [] }));
    fetchStub
      .onCall(2)
      .resolves(createJsonFetchResponse({ choices: [undefined] }));
    fetchStub.onCall(3).resolves(
      createJsonFetchResponse({
        choices: [{ message: undefined }],
      }),
    );
    fetchStub.onCall(4).resolves(
      createJsonFetchResponse({
        choices: [{ message: { content: {} } }],
      }),
    );
    fetchStub.onCall(5).resolves(
      createJsonFetchResponse({
        choices: [{ message: { content: [undefined] } }],
      }),
    );
    fetchStub.onCall(6).resolves(
      createJsonFetchResponse({
        choices: [{ message: { content: [{}] } }],
      }),
    );

    for (let index = 0; index < 7; index += 1) {
      await expect(
        generate(fixture.path, {
          suggestEmojis: true,
          ai: true,
          aiProvider: 'openai',
        }),
      ).rejects.toThrow(
        'OpenAI response did not include assistant text content.',
      );
    }
  });

  it('throws when OpenAI response content is empty or non-object JSON', async function () {
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    const fetchStub = stubFetch();
    fetchStub.onCall(0).resolves(
      createJsonFetchResponse({
        choices: [{ message: { content: '' } }],
      }),
    );
    fetchStub.onCall(1).resolves(
      createJsonFetchResponse({
        choices: [{ message: { content: '[]' } }],
      }),
    );

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        ai: true,
        aiProvider: 'openai',
      }),
    ).rejects.toThrow('AI response was empty.');
    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        ai: true,
        aiProvider: 'openai',
      }),
    ).rejects.toThrow('AI response was not a JSON object.');
  });

  it('throws when Anthropic request fails or payload is invalid', async function () {
    restoreEnvVar('OPENAI_API_KEY', undefined);
    process.env['ANTHROPIC_API_KEY'] = 'test-anthropic-key';
    const fetchStub = stubFetch();
    fetchStub.onCall(0).rejects(new Error('anthropic-network-failure'));
    fetchStub.onCall(1).resolves(
      createJsonFetchResponse(
        {},
        {
          status: 429,
          statusText: 'Too Many Requests',
        },
      ),
    );
    fetchStub.onCall(2).resolves(createJsonFetchResponse([]));
    fetchStub.onCall(3).resolves(
      createJsonFetchResponse({
        content: {},
      }),
    );
    fetchStub.onCall(4).resolves(
      createJsonFetchResponse({
        content: [undefined],
      }),
    );
    fetchStub.onCall(5).resolves(
      createJsonFetchResponse({
        content: [{ type: 'image' }],
      }),
    );
    fetchStub.onCall(6).resolves(
      createJsonFetchResponse({
        content: [{ type: 'text' }],
      }),
    );

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        ai: true,
        aiProvider: 'anthropic',
      }),
    ).rejects.toThrow('Anthropic request failed: anthropic-network-failure');
    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        ai: true,
        aiProvider: 'anthropic',
      }),
    ).rejects.toThrow('Anthropic request failed (429 Too Many Requests).');
    for (let index = 0; index < 4; index += 1) {
      await expect(
        generate(fixture.path, {
          suggestEmojis: true,
          ai: true,
          aiProvider: 'anthropic',
        }),
      ).rejects.toThrow(
        'Anthropic response did not include assistant text content.',
      );
    }
  });

  it('includes parsed Anthropic non-OK payload details', async function () {
    restoreEnvVar('OPENAI_API_KEY', undefined);
    process.env['ANTHROPIC_API_KEY'] = 'test-anthropic-key';
    stubFetch().resolves(
      createJsonFetchResponse(
        {
          error: {
            type: 'invalid_request_error',
            message: 'Model "foo" is not available.',
          },
        },
        {
          status: 400,
          statusText: 'Bad Request',
        },
      ),
    );

    const error = await generate(fixture.path, {
      suggestEmojis: true,
      ai: true,
      aiModel: 'foo',
      aiProvider: 'anthropic',
    }).then(
      () => undefined,
      (error_: unknown) => error_ as Error,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain(
      'Anthropic request failed (400 Bad Request).',
    );
    expect(error?.message).toContain('Model "foo" is not available.');
    expect(error?.message).toContain('type: invalid_request_error');
    expect(error?.message).not.toContain('invalid model name');
  });

  it('rejects reserved emojis and keeps uniqueness when ai suggestions duplicate', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    stubFetch().resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                xyzabc: '💼',
                'zzzz-one': '🧪',
                'qqqq-two': '🧪',
              }),
            },
          },
        ],
      }),
    );

    await generate(fixture.path, {
      suggestEmojis: true,
      ai: true,
      aiProvider: 'openai',
    });

    const output = String(consoleLogStub.firstCall.args[0]);
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('xyzabc')).not.toBe('💼');
    expect(suggestions.get('zzzz-one')).toBeTruthy();
    expect(suggestions.get('qqqq-two')).toBeTruthy();
    expect(suggestions.get('zzzz-one')).not.toBe(suggestions.get('qqqq-two'));
  });

  it('parses array-based OpenAI message content and normalizes alias suggestions', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    stubFetch().resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: [
                {
                  text: '```json\n{"xyzabc":":rocket:","zzzz-one":"rocket","qqqq-two":"!!!","unknown":"🧪"}\n```',
                },
              ],
            },
          },
        ],
      }),
    );

    await generate(fixture.path, {
      suggestEmojis: true,
      ai: true,
      aiProvider: 'openai',
    });

    const output = String(consoleLogStub.firstCall.args[0]);
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('xyzabc')).toBe('🚀');
    expect(suggestions.get('zzzz-one')).toBeTruthy();
    expect(suggestions.get('zzzz-one')).not.toBe('🚀');
    expect(suggestions.get('qqqq-two')).toBe('!!!');
    expect(suggestions.has('unknown')).toBe(false);
  });

  it('calls ai provider for all configs, even when defaults already exist', async function () {
    await withTempFixture(
      `
      export default {
        rules: {
          'no-foo': { meta: {}, create(context) {} },
        },
        configs: {
          recommended: { rules: { 'test/no-foo': 'error' } },
        }
      };
      `,
      async (tempFixture) => {
        const consoleLogStub = sinon.stub(console, 'log');
        const fetchStub = stubFetch().resolves(
          createJsonFetchResponse({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    recommended: '🧠',
                  }),
                },
              },
            ],
          }),
        );
        process.env['OPENAI_API_KEY'] = 'test-openai-key';
        restoreEnvVar('ANTHROPIC_API_KEY', undefined);

        await generate(tempFixture.path, {
          suggestEmojis: true,
          ai: true,
          aiProvider: 'openai',
        });

        expect(fetchStub.callCount).toBe(1);
        expect(consoleLogStub.callCount).toBe(1);
        const output = String(consoleLogStub.firstCall.args[0]);
        const suggestions = parseSuggestionTable(output);
        expect(suggestions.get('recommended')).toBe('🧠');
      },
    );
  });

  it('throws when plugin does not export any configs', async function () {
    await withTempFixture(
      `
      export default {
        rules: {
          'no-foo': { meta: {}, create(context) {} },
        }
      };
      `,
      async (tempFixture) => {
        await expect(
          generate(tempFixture.path, { suggestEmojis: true }),
        ).rejects.toThrow(
          'Could not find exported `configs` object in ESLint plugin to suggest emojis for.',
        );
      },
    );
  });

  it('uses local exact-default, keyword, search, and fallback heuristics', async function () {
    await withTempFixture(
      `
      export default {
        rules: {
          'no-foo': { meta: {}, create(context) {} },
        },
        configs: {
          recommended: { rules: { 'test/no-foo': 'error' } },
          'react-native': { rules: { 'test/no-foo': 'warn' } },
          honey: { rules: { 'test/no-foo': 'warn' } },
          qzxqzx: { rules: { 'test/no-foo': 'off' } },
          '---': { rules: { 'test/no-foo': 'off' } },
        }
      };
      `,
      async (tempFixture) => {
        const consoleLogStub = sinon.stub(console, 'log');
        await generate(tempFixture.path, {
          suggestEmojis: true,
          configEmoji: [['recommended']],
        });

        const output = String(consoleLogStub.firstCall.args[0]);
        const suggestions = parseSuggestionTable(output);
        expect(suggestions.get('recommended')).toBe('✅');
        expect(suggestions.has('react-native')).toBe(true);
        expect(suggestions.has('honey')).toBe(true);
        expect(suggestions.has('qzxqzx')).toBe(true);
        expect(suggestions.has('---')).toBe(true);
      },
    );
  });

  it('ignores non-string and non-emoji ai suggestions', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    stubFetch().resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                xyzabc: 123,
                'zzzz-one': 'abc123',
                'qqqq-two': '   ',
              }),
            },
          },
        ],
      }),
    );

    await generate(fixture.path, {
      suggestEmojis: true,
      ai: true,
      aiProvider: 'openai',
    });

    const output = String(consoleLogStub.firstCall.args[0]);
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('xyzabc')).not.toBe('123');
    expect(suggestions.get('zzzz-one')).not.toBe('abc123');
  });

  it('keeps local emoji when ai suggestion equals the current value', async function () {
    await withTempFixture(
      `
      export default {
        rules: {
          'no-foo': { meta: {}, create(context) {} },
        },
        configs: {
          typescript: { rules: { 'test/no-foo': 'error' } },
        }
      };
      `,
      async (tempFixture) => {
        const consoleLogStub = sinon.stub(console, 'log');
        process.env['OPENAI_API_KEY'] = 'test-openai-key';
        restoreEnvVar('ANTHROPIC_API_KEY', undefined);
        stubFetch().resolves(
          createJsonFetchResponse({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    typescript: '⌨️',
                  }),
                },
              },
            ],
          }),
        );

        await generate(tempFixture.path, {
          suggestEmojis: true,
          ai: true,
          aiProvider: 'openai',
          configEmoji: [['typescript']],
        });

        const output = String(consoleLogStub.firstCall.args[0]);
        const suggestions = parseSuggestionTable(output);
        expect(suggestions.get('typescript')).toBe('⌨️');
      },
    );
  });

  it('uses deterministic fallback reuse after exhausting fallback palette', async function () {
    const configEntries = Array.from({ length: 22 }, (_unused, index) => {
      const name = `qzxqzx-${String(index + 1)}`;
      return `'${name}': { rules: { 'test/no-foo': 'error' } }`;
    }).join(',\n');

    await withTempFixture(
      `
      export default {
        rules: {
          'no-foo': { meta: {}, create(context) {} },
        },
        configs: {
          ${configEntries}
        }
      };
      `,
      async (tempFixture) => {
        const consoleLogStub = sinon.stub(console, 'log');
        await generate(tempFixture.path, { suggestEmojis: true });

        const output = String(consoleLogStub.firstCall.args[0]);
        const suggestions = parseSuggestionTable(output);
        expect(suggestions.has('qzxqzx-1')).toBe(true);
        expect(suggestions.has('qzxqzx-22')).toBe(true);
      },
    );
  });
});
