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

function createOpenAiTextResponse(
  text: string,
  init?: MockFetchResponseInit,
): MockFetchResponse {
  return {
    ok: (init?.status ?? 200) < 400,
    status: init?.status ?? 200,
    statusText: init?.statusText ?? 'OK',
    json: () =>
      Promise.resolve({
        choices: [{ message: { content: text } }],
      }),
  };
}

function createAnthropicTextResponse(
  text: string,
  init?: MockFetchResponseInit,
): MockFetchResponse {
  return {
    ok: (init?.status ?? 200) < 400,
    status: init?.status ?? 200,
    statusText: init?.statusText ?? 'OK',
    json: () =>
      Promise.resolve({
        content: [{ type: 'text', text }],
      }),
  };
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

interface FetchStubTarget {
  fetch: (...args: unknown[]) => Promise<MockFetchResponse>;
}

function stubFetch() {
  return sinon.stub(globalThis as unknown as FetchStubTarget, 'fetch');
}

const SAMPLE_AI_MARKDOWN = [
  'Disallow the use of `foo` identifiers.',
  '',
  '## Examples',
  '',
  '### Incorrect',
  '',
  '```js',
  '/* eslint test/no-foo: "error" */',
  'const foo = 1;',
  '```',
  '',
  '### Correct',
  '',
  '```js',
  '/* eslint test/no-foo: "error" */',
  'const bar = 1;',
  '```',
  '',
  '## When Not To Use It',
  '',
  'If you need to use `foo` identifiers.',
].join('\n');

const EXISTING_DOC = [
  '# test/no-foo',
  '',
  '<!-- end auto-generated rule header -->',
  '',
  'Old description.',
].join('\n');

const EXISTING_DOC_WITH_OPTIONS = [
  '# test/no-foo',
  '',
  '<!-- end auto-generated rule header -->',
  '',
  'Old description.',
  '',
  '## Options',
  '',
  '<!-- begin auto-generated rule options list -->',
  '<!-- end auto-generated rule options list -->',
].join('\n');

const PLUGIN_WITH_OPTIONS = `
  export default {
    rules: {
      'no-foo': {
        meta: {
          docs: { description: 'Description of no-foo.' },
          schema: [{
            type: 'object',
            properties: {
              allowBar: {
                type: 'boolean',
                description: 'Whether to allow bar.',
                default: false,
              },
            },
            additionalProperties: false,
          }],
        },
        create(context) {
          return {
            Identifier(node) {
              if (node.name === 'foo') {
                context.report({ node, message: 'Unexpected foo.' });
              }
            },
          };
        },
      },
    },
  };
`;

describe('generate (--ai rule docs)', function () {
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

  beforeEach(function () {
    clearProviderApiKeys();
  });

  afterEach(function () {
    sinon.restore();
    restoreProviderApiKeys();
  });

  it('throws when --check and --ai are both set', async function () {
    const fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'docs/rules/no-foo.md': EXISTING_DOC,
      },
    });

    try {
      await expect(
        generate(fixture.path, { check: true, ai: true }),
      ).rejects.toThrow(
        '--check and --ai cannot be used together',
      );
    } finally {
      await fixture.cleanup();
    }
  });

  it('does not call fetch when --ai is not set', async function () {
    const fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'docs/rules/no-foo.md': EXISTING_DOC,
      },
    });

    const fetchStub = stubFetch();

    try {
      await generate(fixture.path, {});
      expect(fetchStub.callCount).toBe(0);
    } finally {
      await fixture.cleanup();
    }
  });

  it('enhances an existing rule doc with AI using OpenAI', async function () {
    const fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'docs/rules/no-foo.md': EXISTING_DOC,
      },
    });

    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    const fetchStub = stubFetch().resolves(
      createOpenAiTextResponse(SAMPLE_AI_MARKDOWN),
    );

    try {
      await generate(fixture.path, { ai: true, aiProvider: 'openai' });

      expect(fetchStub.callCount).toBe(1);
      expect(fetchStub.firstCall.args[0]).toBe(
        'https://api.openai.com/v1/chat/completions',
      );

      const requestInit = fetchStub.firstCall.args[1] as {
        body?: string;
      };
      const requestBody = JSON.parse(requestInit.body!) as {
        model?: string;
        temperature?: number;
        response_format?: unknown;
      };
      expect(requestBody.model).toBe('gpt-5.2');
      expect(requestBody.temperature).toBe(0.2);
      // Text mode: no response_format
      expect(requestBody.response_format).toBeUndefined();

      const doc = await fixture.readFile('docs/rules/no-foo.md');
      expect(doc).toContain('## Examples');
      expect(doc).toContain('### Incorrect');
      expect(doc).toContain('### Correct');
      expect(doc).toContain('## When Not To Use It');
      // Header marker should be preserved
      expect(doc).toContain('<!-- end auto-generated rule header -->');
    } finally {
      await fixture.cleanup();
    }
  });

  it('enhances an existing rule doc with AI using Anthropic', async function () {
    const fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'docs/rules/no-foo.md': EXISTING_DOC,
      },
    });

    process.env['ANTHROPIC_API_KEY'] = 'test-anthropic-key';
    const fetchStub = stubFetch().resolves(
      createAnthropicTextResponse(SAMPLE_AI_MARKDOWN),
    );

    try {
      await generate(fixture.path, { ai: true, aiProvider: 'anthropic' });

      expect(fetchStub.callCount).toBe(1);
      expect(fetchStub.firstCall.args[0]).toBe(
        'https://api.anthropic.com/v1/messages',
      );

      const requestInit = fetchStub.firstCall.args[1] as {
        body?: string;
      };
      const requestBody = JSON.parse(requestInit.body!) as {
        model?: string;
        max_tokens?: number;
        temperature?: number;
      };
      expect(requestBody.model).toBe('claude-sonnet-4-6');
      expect(requestBody.max_tokens).toBe(4096);
      expect(requestBody.temperature).toBe(0.2);

      const doc = await fixture.readFile('docs/rules/no-foo.md');
      expect(doc).toContain('## Examples');
      expect(doc).toContain('<!-- end auto-generated rule header -->');
    } finally {
      await fixture.cleanup();
    }
  });

  it('generates a full doc for a new rule with --init-rule-docs --ai', async function () {
    const fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'README.md': '# test\n\n<!-- begin auto-generated rules list -->\n<!-- end auto-generated rules list -->',
        'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { docs: { description: 'Description of no-foo.' } },
                create(context) {},
              },
              'no-bar': {
                meta: { docs: { description: 'Description of no-bar.' } },
                create(context) {},
              },
            },
          };
        `,
        'docs/rules/no-foo.md': EXISTING_DOC,
      },
    });

    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    const fetchStub = stubFetch().resolves(
      createOpenAiTextResponse(SAMPLE_AI_MARKDOWN),
    );

    try {
      await generate(fixture.path, {
        initRuleDocs: true,
        ai: true,
        aiProvider: 'openai',
      });

      // Two rules: no-foo already has a doc, no-bar needs one created.
      // AI should only be called for the newly-created no-bar doc.
      expect(fetchStub.callCount).toBe(1);

      const newDoc = await fixture.readFile('docs/rules/no-bar.md');
      expect(newDoc).toContain('## Examples');
      expect(newDoc).toContain('### Incorrect');
      expect(newDoc).toContain('### Correct');
      expect(newDoc).toContain('## When Not To Use It');
      expect(newDoc).toContain('<!-- end auto-generated rule header -->');

      // Existing doc should NOT have been AI-enhanced.
      const existingDoc = await fixture.readFile('docs/rules/no-foo.md');
      expect(existingDoc).toContain('Old description.');
      expect(existingDoc).not.toContain('## Examples');
    } finally {
      await fixture.cleanup();
    }
  });

  it('includes rule metadata in the prompt', async function () {
    const fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'docs/rules/no-foo.md': EXISTING_DOC,
      },
    });

    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    const fetchStub = stubFetch().resolves(
      createOpenAiTextResponse(SAMPLE_AI_MARKDOWN),
    );

    try {
      await generate(fixture.path, { ai: true, aiProvider: 'openai' });

      const requestInit = fetchStub.firstCall.args[1] as {
        body?: string;
      };
      const requestBody = JSON.parse(requestInit.body!) as {
        messages?: { role: string; content: string }[];
      };
      const userMessage = requestBody.messages?.find(
        (m) => m.role === 'user',
      );
      expect(userMessage).toBeTruthy();
      expect(userMessage!.content).toContain('test/no-foo');
      expect(userMessage!.content).toContain('Description of no-foo');
      expect(userMessage!.content).toContain('Old description');
    } finally {
      await fixture.cleanup();
    }
  });

  it('includes rule source code in the prompt', async function () {
    const fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'docs/rules/no-foo.md': EXISTING_DOC,
        'index.js': `
          export default {
            rules: {
              'no-foo': {
                meta: { docs: { description: 'no foo' } },
                create(context) {
                  return {
                    Identifier(node) {
                      if (node.name === 'foo') {
                        context.report({ node, message: 'Unexpected foo.' });
                      }
                    },
                  };
                },
              },
            },
          };
        `,
      },
    });

    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    const fetchStub = stubFetch().resolves(
      createOpenAiTextResponse(SAMPLE_AI_MARKDOWN),
    );

    try {
      await generate(fixture.path, { ai: true, aiProvider: 'openai' });

      const requestInit = fetchStub.firstCall.args[1] as {
        body?: string;
      };
      const requestBody = JSON.parse(requestInit.body!) as {
        messages?: { role: string; content: string }[];
      };
      const userMessage = requestBody.messages?.find(
        (m) => m.role === 'user',
      );
      expect(userMessage!.content).toContain('Rule implementation');
      expect(userMessage!.content).toContain('Identifier');
    } finally {
      await fixture.cleanup();
    }
  });

  it('includes options schema in the prompt when rule has options', async function () {
    const fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'docs/rules/no-foo.md': EXISTING_DOC_WITH_OPTIONS,
        'index.js': PLUGIN_WITH_OPTIONS,
      },
    });

    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    const fetchStub = stubFetch().resolves(
      createOpenAiTextResponse(SAMPLE_AI_MARKDOWN),
    );

    try {
      await generate(fixture.path, { ai: true, aiProvider: 'openai' });

      const requestInit = fetchStub.firstCall.args[1] as {
        body?: string;
      };
      const requestBody = JSON.parse(requestInit.body!) as {
        messages?: { role: string; content: string }[];
      };
      const userMessage = requestBody.messages?.find(
        (m) => m.role === 'user',
      );
      expect(userMessage!.content).toContain('allowBar');
      expect(userMessage!.content).toContain('Options schema');
    } finally {
      await fixture.cleanup();
    }
  });

  it('strips leading title from AI response', async function () {
    const fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'docs/rules/no-foo.md': EXISTING_DOC,
      },
    });

    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    stubFetch().resolves(
      createOpenAiTextResponse(`# no-foo\n\n${SAMPLE_AI_MARKDOWN}`),
    );

    try {
      await generate(fixture.path, { ai: true, aiProvider: 'openai' });

      const doc = await fixture.readFile('docs/rules/no-foo.md');
      // The body should not contain a duplicate title
      const bodyAfterMarker = doc.split(
        '<!-- end auto-generated rule header -->',
      )[1]!;
      expect(bodyAfterMarker).not.toContain('# no-foo');
      expect(bodyAfterMarker).toContain('## Examples');
    } finally {
      await fixture.cleanup();
    }
  });

  it('strips wrapping code fences from AI response', async function () {
    const fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'docs/rules/no-foo.md': EXISTING_DOC,
      },
    });

    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    stubFetch().resolves(
      createOpenAiTextResponse(
        `\`\`\`markdown\n${SAMPLE_AI_MARKDOWN}\n\`\`\``,
      ),
    );

    try {
      await generate(fixture.path, { ai: true, aiProvider: 'openai' });

      const doc = await fixture.readFile('docs/rules/no-foo.md');
      expect(doc).not.toContain('```markdown');
      expect(doc).toContain('## Examples');
    } finally {
      await fixture.cleanup();
    }
  });

  it('keeps existing doc when AI returns empty content', async function () {
    const fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'docs/rules/no-foo.md': EXISTING_DOC,
      },
    });

    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    const consoleWarnStub = sinon.stub(console, 'warn');
    stubFetch().resolves(createOpenAiTextResponse(''));

    try {
      await generate(fixture.path, { ai: true, aiProvider: 'openai' });

      expect(consoleWarnStub.callCount).toBe(1);
      expect(String(consoleWarnStub.firstCall.args[0])).toContain(
        'AI returned empty content',
      );

      const doc = await fixture.readFile('docs/rules/no-foo.md');
      expect(doc).toContain('Old description');
    } finally {
      await fixture.cleanup();
    }
  });

  it('preserves options markers in the final output', async function () {
    const fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'docs/rules/no-foo.md': EXISTING_DOC_WITH_OPTIONS,
        'index.js': PLUGIN_WITH_OPTIONS,
      },
    });

    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    stubFetch().resolves(
      createOpenAiTextResponse(
        [
          SAMPLE_AI_MARKDOWN,
          '',
          '## Options',
          '',
          '<!-- begin auto-generated rule options list -->',
          '<!-- end auto-generated rule options list -->',
        ].join('\n'),
      ),
    );

    try {
      await generate(fixture.path, { ai: true, aiProvider: 'openai' });

      const doc = await fixture.readFile('docs/rules/no-foo.md');
      // Options markers should still be present (managed by existing code)
      expect(doc).toContain(
        '<!-- begin auto-generated rule options list -->',
      );
      expect(doc).toContain(
        '<!-- end auto-generated rule options list -->',
      );
    } finally {
      await fixture.cleanup();
    }
  });

  it('throws when AI request fails with network error', async function () {
    const fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'docs/rules/no-foo.md': EXISTING_DOC,
      },
    });

    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    stubFetch().rejects(new Error('network failure'));

    try {
      await expect(
        generate(fixture.path, { ai: true, aiProvider: 'openai' }),
      ).rejects.toThrow('OpenAI request failed: network failure');
    } finally {
      await fixture.cleanup();
    }
  });

  it('throws when AI response returns non-OK HTTP status', async function () {
    const fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'docs/rules/no-foo.md': EXISTING_DOC,
      },
    });

    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    stubFetch().resolves(
      createJsonFetchResponse(
        {},
        { status: 500, statusText: 'Internal Server Error' },
      ),
    );

    try {
      await expect(
        generate(fixture.path, { ai: true, aiProvider: 'openai' }),
      ).rejects.toThrow(
        'OpenAI request failed (500 Internal Server Error)',
      );
    } finally {
      await fixture.cleanup();
    }
  });

  it('passes system prompt instructing not to include title', async function () {
    const fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'docs/rules/no-foo.md': EXISTING_DOC,
      },
    });

    process.env['OPENAI_API_KEY'] = 'test-openai-key';
    const fetchStub = stubFetch().resolves(
      createOpenAiTextResponse(SAMPLE_AI_MARKDOWN),
    );

    try {
      await generate(fixture.path, { ai: true, aiProvider: 'openai' });

      const requestInit = fetchStub.firstCall.args[1] as {
        body?: string;
      };
      const requestBody = JSON.parse(requestInit.body!) as {
        messages?: { role: string; content: string }[];
      };
      const systemMessage = requestBody.messages?.find(
        (m) => m.role === 'system',
      );
      expect(systemMessage).toBeTruthy();
      expect(systemMessage!.content).toContain(
        'Do NOT include a top-level heading',
      );
      expect(systemMessage!.content).toContain(
        'Do NOT include notice/badge lines',
      );
    } finally {
      await fixture.cleanup();
    }
  });
});
