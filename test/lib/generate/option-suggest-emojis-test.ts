import * as sinon from 'sinon';
import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';

const PROVIDER_API_KEY_ENV_VARS = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'TOGETHER_API_KEY',
  'AI_GATEWAY_API_KEY',
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

function createJsonFetchResponse(payload: unknown): MockFetchResponse {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(payload),
  };
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
    const fetchStub = sinon.stub(globalThis, 'fetch');

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

  it('uses OpenAI in ai mode with provider defaults and applies suggestions', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const fetchStub = sinon.stub(globalThis, 'fetch').resolves(
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
      }) as never,
    );

    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);

    await generate(fixture.path, {
      suggestEmojis: true,
      suggestEmojisEngine: 'ai',
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
    const requestBody = JSON.parse(requestInit.body) as { model?: string };
    expect(requestBody.model).toBe('gpt-4o-mini');

    const output = String(consoleLogStub.firstCall.args[0]);
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('xyzabc')).toBe('🧠');
  });

  it('uses Groq in ai mode with provider defaults and applies suggestions', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const fetchStub = sinon.stub(globalThis, 'fetch').resolves(
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
      }) as never,
    );

    process.env['GROQ_API_KEY'] = 'test-groq-key';

    await generate(fixture.path, {
      suggestEmojis: true,
      suggestEmojisEngine: 'ai',
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
    const requestBody = JSON.parse(requestInit.body) as { model?: string };
    expect(requestBody.model).toBe('llama-3.1-8b-instant');

    const output = String(consoleLogStub.firstCall.args[0]);
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('xyzabc')).toBe('🛰️');
  });

  it('uses Vercel AI Gateway in ai mode with provider defaults and applies suggestions', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const fetchStub = sinon.stub(globalThis, 'fetch').resolves(
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
      }) as never,
    );

    process.env['AI_GATEWAY_API_KEY'] = 'test-ai-gateway-key';

    await generate(fixture.path, {
      suggestEmojis: true,
      suggestEmojisEngine: 'ai',
      aiProvider: 'aigateway',
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
    const requestBody = JSON.parse(requestInit.body) as { model?: string };
    expect(requestBody.model).toBe('openai/gpt-4o-mini');

    const output = String(consoleLogStub.firstCall.args[0]);
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('xyzabc')).toBe('🌐');
  });

  it('uses Anthropic automatically when exactly one provider API key is set', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const fetchStub = sinon.stub(globalThis, 'fetch').resolves(
      createJsonFetchResponse({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              xyzabc: '🦾',
            }),
          },
        ],
      }) as never,
    );

    restoreEnvVar('OPENAI_API_KEY', undefined);
    process.env['ANTHROPIC_API_KEY'] = 'test-anthropic-key';

    await generate(fixture.path, {
      suggestEmojis: true,
      suggestEmojisEngine: 'ai',
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
    expect(requestBody.model).toBe('claude-3-5-haiku-latest');

    const output = String(consoleLogStub.firstCall.args[0]);
    const suggestions = parseSuggestionTable(output);
    expect(suggestions.get('xyzabc')).toBe('🦾');
  });

  it('throws when multiple provider keys are set and aiProvider is omitted', async function () {
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    process.env['ANTHROPIC_API_KEY'] = 'test-anthropic-key';
    const fetchStub = sinon.stub(globalThis, 'fetch');

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        suggestEmojisEngine: 'ai',
      }),
    ).rejects.toThrow('Multiple AI provider API keys found');

    expect(fetchStub.callCount).toBe(0);
  });

  it('throws when no provider API key is set for ai mode', async function () {
    const error = await generate(fixture.path, {
      suggestEmojis: true,
      suggestEmojisEngine: 'ai',
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
        suggestEmojisEngine: 'ai',
        aiProvider: 'openai',
      }),
    ).rejects.toThrow('Provider "openai" requires OPENAI_API_KEY to be set.');
  });

  it('throws when ai request fails', async function () {
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    sinon
      .stub(globalThis, 'fetch')
      .rejects(new Error('request failed while connecting'));

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        suggestEmojisEngine: 'ai',
        aiProvider: 'openai',
      }),
    ).rejects.toThrow('OpenAI request failed: request failed while connecting');
  });

  it('throws when ai response content is malformed JSON', async function () {
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    sinon.stub(globalThis, 'fetch').resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: 'not-json',
            },
          },
        ],
      }) as never,
    );

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        suggestEmojisEngine: 'ai',
        aiProvider: 'openai',
      }),
    ).rejects.toThrow('Unexpected token');
  });

  it('throws when OpenAI response is not fetch-like', async function () {
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    sinon.stub(globalThis, 'fetch').resolves({} as never);

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        suggestEmojisEngine: 'ai',
        aiProvider: 'openai',
      }),
    ).rejects.toThrow('OpenAI request failed: unexpected HTTP response type.');
  });

  it('throws when OpenAI returns a non-OK HTTP status', async function () {
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    sinon.stub(globalThis, 'fetch').resolves({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: () => Promise.resolve({}),
    } as never);

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        suggestEmojisEngine: 'ai',
        aiProvider: 'openai',
      }),
    ).rejects.toThrow('OpenAI request failed (503 Service Unavailable).');
  });

  it('throws when OpenAI payload shape has no assistant content', async function () {
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    const fetchStub = sinon.stub(globalThis, 'fetch');
    fetchStub.onCall(0).resolves(createJsonFetchResponse([]) as never);
    fetchStub
      .onCall(1)
      .resolves(createJsonFetchResponse({ choices: [] }) as never);
    fetchStub
      .onCall(2)
      .resolves(createJsonFetchResponse({ choices: [undefined] }) as never);
    fetchStub.onCall(3).resolves(
      createJsonFetchResponse({
        choices: [{ message: undefined }],
      }) as never,
    );
    fetchStub.onCall(4).resolves(
      createJsonFetchResponse({
        choices: [{ message: { content: {} } }],
      }) as never,
    );
    fetchStub.onCall(5).resolves(
      createJsonFetchResponse({
        choices: [{ message: { content: [undefined] } }],
      }) as never,
    );
    fetchStub.onCall(6).resolves(
      createJsonFetchResponse({
        choices: [{ message: { content: [{}] } }],
      }) as never,
    );

    for (let index = 0; index < 7; index += 1) {
      await expect(
        generate(fixture.path, {
          suggestEmojis: true,
          suggestEmojisEngine: 'ai',
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
    const fetchStub = sinon.stub(globalThis, 'fetch');
    fetchStub.onCall(0).resolves(
      createJsonFetchResponse({
        choices: [{ message: { content: '' } }],
      }) as never,
    );
    fetchStub.onCall(1).resolves(
      createJsonFetchResponse({
        choices: [{ message: { content: '[]' } }],
      }) as never,
    );

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        suggestEmojisEngine: 'ai',
        aiProvider: 'openai',
      }),
    ).rejects.toThrow('AI response was empty.');
    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        suggestEmojisEngine: 'ai',
        aiProvider: 'openai',
      }),
    ).rejects.toThrow('AI response was not a JSON object.');
  });

  it('throws when Anthropic request fails or payload is invalid', async function () {
    restoreEnvVar('OPENAI_API_KEY', undefined);
    process.env['ANTHROPIC_API_KEY'] = 'test-anthropic-key';
    const fetchStub = sinon.stub(globalThis, 'fetch');
    fetchStub.onCall(0).rejects(new Error('anthropic-network-failure'));
    fetchStub.onCall(1).resolves({} as never);
    fetchStub.onCall(2).resolves({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: () => Promise.resolve({}),
    } as never);
    fetchStub.onCall(3).resolves(createJsonFetchResponse([]) as never);
    fetchStub.onCall(4).resolves(
      createJsonFetchResponse({
        content: {},
      }) as never,
    );
    fetchStub.onCall(5).resolves(
      createJsonFetchResponse({
        content: [undefined],
      }) as never,
    );
    fetchStub.onCall(6).resolves(
      createJsonFetchResponse({
        content: [{ type: 'image' }],
      }) as never,
    );
    fetchStub.onCall(7).resolves(
      createJsonFetchResponse({
        content: [{ type: 'text' }],
      }) as never,
    );

    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        suggestEmojisEngine: 'ai',
        aiProvider: 'anthropic',
      }),
    ).rejects.toThrow('Anthropic request failed: anthropic-network-failure');
    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        suggestEmojisEngine: 'ai',
        aiProvider: 'anthropic',
      }),
    ).rejects.toThrow(
      'Anthropic request failed: unexpected HTTP response type.',
    );
    await expect(
      generate(fixture.path, {
        suggestEmojis: true,
        suggestEmojisEngine: 'ai',
        aiProvider: 'anthropic',
      }),
    ).rejects.toThrow('Anthropic request failed (429 Too Many Requests).');
    for (let index = 0; index < 5; index += 1) {
      await expect(
        generate(fixture.path, {
          suggestEmojis: true,
          suggestEmojisEngine: 'ai',
          aiProvider: 'anthropic',
        }),
      ).rejects.toThrow(
        'Anthropic response did not include assistant text content.',
      );
    }
  });

  it('rejects reserved emojis and keeps uniqueness when ai suggestions duplicate', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    restoreEnvVar('ANTHROPIC_API_KEY', undefined);
    sinon.stub(globalThis, 'fetch').resolves(
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
      }) as never,
    );

    await generate(fixture.path, {
      suggestEmojis: true,
      suggestEmojisEngine: 'ai',
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
    sinon.stub(globalThis, 'fetch').resolves(
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
      }) as never,
    );

    await generate(fixture.path, {
      suggestEmojis: true,
      suggestEmojisEngine: 'ai',
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

  it('does not call ai provider when no config requires generation', async function () {
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
        const fetchStub = sinon.stub(globalThis, 'fetch');
        process.env['OPENAI_API_KEY'] = 'test-openai-key';
        restoreEnvVar('ANTHROPIC_API_KEY', undefined);

        await generate(tempFixture.path, {
          suggestEmojis: true,
          suggestEmojisEngine: 'ai',
          aiProvider: 'openai',
        });

        expect(fetchStub.callCount).toBe(0);
        expect(consoleLogStub.callCount).toBe(1);
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
    sinon.stub(globalThis, 'fetch').resolves(
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
      }) as never,
    );

    await generate(fixture.path, {
      suggestEmojis: true,
      suggestEmojisEngine: 'ai',
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
        sinon.stub(globalThis, 'fetch').resolves(
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
          }) as never,
        );

        await generate(tempFixture.path, {
          suggestEmojis: true,
          suggestEmojisEngine: 'ai',
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
