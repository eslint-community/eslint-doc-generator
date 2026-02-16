import { generate } from '../../../lib/generator.js';
import { setupFixture, type FixtureContext } from '../../helpers/fixture.js';
import * as sinon from 'sinon';

function parseConfigEmojiOutput(output: string): Map<string, string> {
  const tuples = new Map<string, string>();
  const regex = /\['([^']+)', '([^']+)'\],/g;
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

function restoreEnvVar(name: 'LLM_API_KEY' | 'LLM_BASE_URL' | 'LLM_MODEL', value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}

describe('generate (--init-emojis)', function () {
  let fixture: FixtureContext;

  const originalLlmApiKey = process.env.LLM_API_KEY;
  const originalLlmBaseUrl = process.env.LLM_BASE_URL;
  const originalLlmModel = process.env.LLM_MODEL;

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

    delete process.env.LLM_API_KEY;
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
      new Response(
        JSON.stringify({
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
      ),
    );

    process.env.LLM_API_KEY = 'test-key';
    delete process.env.LLM_BASE_URL;
    delete process.env.LLM_MODEL;

    await generate(fixture.path, { initEmojis: true });

    expect(fetchStub.callCount).toBe(1);
    expect(fetchStub.firstCall.args[0]).toBe(
      'https://api.openai.com/v1/chat/completions',
    );
    const init = fetchStub.firstCall.args[1];
    expect(init).toBeTruthy();
    const body = init ? JSON.parse(String(init.body)) : undefined;
    expect(body?.model).toBe('gpt-4o-mini');

    expect(consoleLogStub.callCount).toBe(1);
    const output = String(consoleLogStub.firstCall.args[0]);
    expect(output).toContain("['xyzabc', '🧠']");
    expect(consoleErrorStub.callCount).toBe(0);
  });

  it('falls back to local suggestions when LLM response is malformed', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    const consoleErrorStub = sinon.stub(console, 'error');
    sinon.stub(globalThis, 'fetch').resolves(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: 'not-json',
              },
            },
          ],
        }),
      ),
    );

    process.env.LLM_API_KEY = 'test-key';
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

    process.env.LLM_API_KEY = 'test-key';
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
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  xyzabc: '💼',
                }),
              },
            },
          ],
        }),
      ),
    );

    process.env.LLM_API_KEY = 'test-key';
    await generate(fixture.path, { initEmojis: true });

    expect(consoleLogStub.callCount).toBe(1);
    const output = String(consoleLogStub.firstCall.args[0]);
    expect(output).not.toContain("['xyzabc', '💼']");
  });

  it('keeps best-effort uniqueness when LLM returns duplicates', async function () {
    const consoleLogStub = sinon.stub(console, 'log');
    sinon.stub(console, 'error');
    sinon.stub(globalThis, 'fetch').resolves(
      new Response(
        JSON.stringify({
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
        }),
      ),
    );

    process.env.LLM_API_KEY = 'test-key';
    await generate(fixture.path, { initEmojis: true });

    expect(consoleLogStub.callCount).toBe(1);
    const output = String(consoleLogStub.firstCall.args[0]);
    const tuples = parseConfigEmojiOutput(output);
    expect(tuples.get('zzzz-one')).toBeTruthy();
    expect(tuples.get('qqqq-two')).toBeTruthy();
    expect(tuples.get('zzzz-one')).not.toBe(tuples.get('qqqq-two'));
  });
});
