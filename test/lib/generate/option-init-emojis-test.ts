import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';
import * as sinon from 'sinon';

function parseConfigEmojiOutput(output: string): Map<string, string> {
  const tuples = new Map<string, string>();
  const regex = /\['([^']+)', '([^']+)'\],/gu;
  let match: RegExpExecArray | null = regex.exec(output);
  while (match) {
    const configName = match[1];
    const emoji = match[2];
    if (configName && emoji) {
      tuples.set(configName, emoji);
    }
    match = regex.exec(output);
  }
  return tuples;
}

function restoreEnvVar(
  name: 'LLM_API_KEY' | 'LLM_BASE_URL' | 'LLM_MODEL',
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

describe('generate (--init-emojis)', function () {
  let fixture: FixtureContext;

  const originalLlmApiKey = process.env['LLM_API_KEY'];
  const originalLlmBaseUrl = process.env['LLM_BASE_URL'];
  const originalLlmModel = process.env['LLM_MODEL'];

  beforeAll(async function () {
    fixture = await setupFixture({
      fixture: 'esm-base',
      overrides: {
        'README.md': '# README before init emojis',
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

  afterEach(function () {
    sinon.restore();
    restoreEnvVar('LLM_API_KEY', originalLlmApiKey);
    restoreEnvVar('LLM_BASE_URL', originalLlmBaseUrl);
    restoreEnvVar('LLM_MODEL', originalLlmModel);
  });

  afterAll(async function () {
    await fixture.cleanup();
  });

  it('prints copy-pasteable tuples, includes all exported configs, and does not write files', async function () {
    const readmeBefore = await fixture.readFile('README.md');
    const consoleLogStub = sinon.stub(console, 'log');
    const consoleErrorStub = sinon.stub(console, 'error');

    restoreEnvVar('LLM_API_KEY', undefined);
    await generate(fixture.path, { initEmojis: true });

    const readmeAfter = await fixture.readFile('README.md');
    expect(readmeAfter).toBe(readmeBefore);

    expect(consoleLogStub.callCount).toBe(1);
    const output = String(consoleLogStub.firstCall.args[0]);
    expect(output).toContain('configEmoji: [');
    expect(output).toContain("['recommended', '✅']");
    expect(output).toContain("['qqqq-two'");
    expect(output).toContain("['xyzabc'");
    expect(output).toContain("['zzzz-one'");

    expect(consoleErrorStub.callCount).toBe(1);
    expect(String(consoleErrorStub.firstCall.args[0])).toContain(
      'LLM enhancement skipped',
    );
  });

  it('enhances generated suggestions with LLM when configured', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const consoleErrorStub = sinon.stub(console, 'error');
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

    process.env['LLM_API_KEY'] = 'test-key';
    restoreEnvVar('LLM_BASE_URL', undefined);
    restoreEnvVar('LLM_MODEL', undefined);

    await generate(fixture.path, { initEmojis: true });

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

    expect(consoleLogStub.callCount).toBe(1);
    const output = String(consoleLogStub.firstCall.args[0]);
    expect(output).toContain("['xyzabc', '🧠']");
    expect(consoleErrorStub.callCount).toBe(0);
  });

  it('falls back to local suggestions when LLM response is malformed', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const consoleErrorStub = sinon.stub(console, 'error');
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

    process.env['LLM_API_KEY'] = 'test-key';
    await generate(fixture.path, { initEmojis: true });

    expect(consoleLogStub.callCount).toBe(1);
    const output = String(consoleLogStub.firstCall.args[0]);
    expect(output).toContain("['xyzabc'");

    expect(consoleErrorStub.callCount).toBe(1);
    expect(String(consoleErrorStub.firstCall.args[0])).toContain(
      'response was not a JSON object',
    );
  });

  it('falls back to local suggestions when LLM request fails', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const consoleErrorStub = sinon.stub(console, 'error');
    sinon
      .stub(globalThis, 'fetch')
      .rejects(new Error('request failed while connecting'));

    process.env['LLM_API_KEY'] = 'test-key';
    await generate(fixture.path, { initEmojis: true });

    expect(consoleLogStub.callCount).toBe(1);
    expect(consoleErrorStub.callCount).toBe(1);
    expect(String(consoleErrorStub.firstCall.args[0])).toContain(
      'request failed while connecting',
    );
  });

  it('rejects reserved emojis from LLM suggestions', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    sinon.stub(console, 'error');
    sinon.stub(globalThis, 'fetch').resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                xyzabc: '💼',
              }),
            },
          },
        ],
      }) as never,
    );

    process.env['LLM_API_KEY'] = 'test-key';
    await generate(fixture.path, { initEmojis: true });

    expect(consoleLogStub.callCount).toBe(1);
    const output = String(consoleLogStub.firstCall.args[0]);
    expect(output).not.toContain("['xyzabc', '💼']");
  });

  it('keeps best-effort uniqueness when LLM returns duplicates', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    sinon.stub(console, 'error');
    sinon.stub(globalThis, 'fetch').resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                'zzzz-one': '🧪',
                'qqqq-two': '🧪',
              }),
            },
          },
        ],
      }) as never,
    );

    process.env['LLM_API_KEY'] = 'test-key';
    await generate(fixture.path, { initEmojis: true });

    expect(consoleLogStub.callCount).toBe(1);
    const output = String(consoleLogStub.firstCall.args[0]);
    const tuples = parseConfigEmojiOutput(output);
    expect(tuples.get('zzzz-one')).toBeTruthy();
    expect(tuples.get('qqqq-two')).toBeTruthy();
    expect(tuples.get('zzzz-one')).not.toBe(tuples.get('qqqq-two'));
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
          generate(tempFixture.path, { initEmojis: true }),
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
        const consoleErrorStub = sinon.stub(console, 'error');
        restoreEnvVar('LLM_API_KEY', undefined);
        await generate(tempFixture.path, {
          initEmojis: true,
          configEmoji: [['recommended']],
        });

        expect(consoleErrorStub.callCount).toBe(1);
        const output = String(consoleLogStub.firstCall.args[0]);
        expect(output).toContain("['recommended', '✅']");
        expect(output).toContain("['react-native', '⚛️']");
        expect(output).toContain("['honey'");
        expect(output).toContain("['qzxqzx'");
        expect(output).toContain("['---'");
      },
    );
  });

  it('parses array-based LLM message content and normalizes multiple suggestion formats', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const consoleErrorStub = sinon.stub(console, 'error');
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

    process.env['LLM_API_KEY'] = 'test-key';
    await generate(fixture.path, { initEmojis: true });

    expect(consoleErrorStub.callCount).toBe(0);
    const output = String(consoleLogStub.firstCall.args[0]);
    expect(output).toContain("['xyzabc', '🚀']");
    expect(output).toContain("['zzzz-one'");
    expect(output).not.toContain("['zzzz-one', '🚀']");
    expect(output).toContain("['qqqq-two', '!!!']");
    expect(output).not.toContain("['unknown'");
  });

  it('warns when LLM returns empty content string', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const consoleErrorStub = sinon.stub(console, 'error');
    sinon.stub(globalThis, 'fetch').resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
      }) as never,
    );

    process.env['LLM_API_KEY'] = 'test-key';
    await generate(fixture.path, { initEmojis: true });

    expect(consoleLogStub.callCount).toBe(1);
    expect(consoleErrorStub.callCount).toBe(1);
    expect(String(consoleErrorStub.firstCall.args[0])).toContain(
      'empty response content',
    );
  });

  it('warns when LLM response has missing message content', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const consoleErrorStub = sinon.stub(console, 'error');
    sinon.stub(globalThis, 'fetch').resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {},
          },
        ],
      }) as never,
    );

    process.env['LLM_API_KEY'] = 'test-key';
    await generate(fixture.path, { initEmojis: true });

    expect(consoleLogStub.callCount).toBe(1);
    expect(consoleErrorStub.callCount).toBe(1);
    expect(String(consoleErrorStub.firstCall.args[0])).toContain(
      'missing message content',
    );
  });

  it('warns for non-standard fetch responses and HTTP errors', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const consoleErrorStub = sinon.stub(console, 'error');
    const fetchStub = sinon.stub(globalThis, 'fetch');
    fetchStub.onCall(0).resolves({} as never);
    fetchStub.onCall(1).resolves({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: () => Promise.resolve({}),
    } as never);
    fetchStub.onCall(2).resolves({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.reject(new Error('json failed')),
    } as never);

    process.env['LLM_API_KEY'] = 'test-key';
    await generate(fixture.path, { initEmojis: true });
    await generate(fixture.path, { initEmojis: true });
    await generate(fixture.path, { initEmojis: true });

    expect(consoleLogStub.callCount).toBe(3);
    expect(consoleErrorStub.callCount).toBe(3);
    expect(String(consoleErrorStub.getCall(0).args[0])).toContain(
      'unexpected HTTP response type',
    );
    expect(String(consoleErrorStub.getCall(1).args[0])).toContain('503');
    expect(String(consoleErrorStub.getCall(2).args[0])).toContain(
      'invalid JSON response',
    );
  });

  it('does not call LLM when no config requires generation', async function () {
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
        const consoleErrorStub = sinon.stub(console, 'error');
        const fetchStub = sinon.stub(globalThis, 'fetch');
        process.env['LLM_API_KEY'] = 'test-key';

        await generate(tempFixture.path, { initEmojis: true });

        expect(fetchStub.callCount).toBe(0);
        expect(consoleErrorStub.callCount).toBe(0);
        expect(consoleLogStub.callCount).toBe(1);
      },
    );
  });

  it('ignores empty, alphanumeric, and non-string LLM suggestions', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const consoleErrorStub = sinon.stub(console, 'error');
    sinon.stub(globalThis, 'fetch').resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                xyzabc: 'abc123',
                'zzzz-one': '   ',
                'qqqq-two': 123,
              }),
            },
          },
        ],
      }) as never,
    );

    process.env['LLM_API_KEY'] = 'test-key';
    await generate(fixture.path, { initEmojis: true });

    expect(consoleErrorStub.callCount).toBe(0);
    expect(consoleLogStub.callCount).toBe(1);
    const output = String(consoleLogStub.firstCall.args[0]);
    expect(output).not.toContain("['xyzabc', 'abc123']");
    expect(output).not.toContain("['zzzz-one', '']");
  });

  it('warns when LLM content is whitespace only', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const consoleErrorStub = sinon.stub(console, 'error');
    sinon.stub(globalThis, 'fetch').resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: '   ',
            },
          },
        ],
      }) as never,
    );

    process.env['LLM_API_KEY'] = 'test-key';
    await generate(fixture.path, { initEmojis: true });

    expect(consoleLogStub.callCount).toBe(1);
    expect(consoleErrorStub.callCount).toBe(1);
    expect(String(consoleErrorStub.firstCall.args[0])).toContain(
      'response was not a JSON object',
    );
  });

  it('warns when LLM returns non-object JSON', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const consoleErrorStub = sinon.stub(console, 'error');
    sinon.stub(globalThis, 'fetch').resolves(
      createJsonFetchResponse({
        choices: [
          {
            message: {
              content: '[]',
            },
          },
        ],
      }) as never,
    );

    process.env['LLM_API_KEY'] = 'test-key';
    await generate(fixture.path, { initEmojis: true });

    expect(consoleLogStub.callCount).toBe(1);
    expect(consoleErrorStub.callCount).toBe(1);
    expect(String(consoleErrorStub.firstCall.args[0])).toContain(
      'response was not a JSON object',
    );
  });

  it('warns when LLM payload shape is invalid at multiple nested levels', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const consoleErrorStub = sinon.stub(console, 'error');
    const fetchStub = sinon.stub(globalThis, 'fetch');
    fetchStub.onCall(0).resolves(createJsonFetchResponse([]) as never);
    fetchStub
      .onCall(1)
      .resolves(createJsonFetchResponse({ choices: {} }) as never);
    fetchStub
      .onCall(2)
      .resolves(createJsonFetchResponse({ choices: [undefined] }) as never);
    fetchStub
      .onCall(3)
      .resolves(
        createJsonFetchResponse({ choices: [{ message: undefined }] }) as never,
      );
    fetchStub.onCall(4).resolves(
      createJsonFetchResponse({
        choices: [{ message: { content: [undefined] } }],
      }) as never,
    );
    fetchStub.onCall(5).resolves(
      createJsonFetchResponse({
        choices: [{ message: { content: [{}] } }],
      }) as never,
    );

    process.env['LLM_API_KEY'] = 'test-key';
    for (let index = 0; index < 6; index += 1) {
      await generate(fixture.path, { initEmojis: true });
    }

    expect(consoleLogStub.callCount).toBe(6);
    expect(consoleErrorStub.callCount).toBe(6);
    for (let index = 0; index < 6; index += 1) {
      expect(String(consoleErrorStub.getCall(index).args[0])).toContain(
        'missing message content',
      );
    }
  });

  it('handles non-Error throws from fetch', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const consoleErrorStub = sinon.stub(console, 'error');
    sinon.stub(globalThis, 'fetch').rejects('plain-string-rejection');

    process.env['LLM_API_KEY'] = 'test-key';
    await generate(fixture.path, { initEmojis: true });

    expect(consoleLogStub.callCount).toBe(1);
    expect(consoleErrorStub.callCount).toBe(1);
    expect(String(consoleErrorStub.firstCall.args[0])).toContain(
      'LLM enhancement failed (',
    );
  });

  it('uses deterministic fallback reuse after exhausting the fallback palette', async function () {
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
        const consoleErrorStub = sinon.stub(console, 'error');
        restoreEnvVar('LLM_API_KEY', undefined);
        await generate(tempFixture.path, { initEmojis: true });

        expect(consoleErrorStub.callCount).toBe(1);
        const output = String(consoleLogStub.firstCall.args[0]);
        expect(output).toContain("['qzxqzx-1'");
        expect(output).toContain("['qzxqzx-22'");
      },
    );
  });
});
