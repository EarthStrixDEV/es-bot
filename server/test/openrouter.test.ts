import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { MockModel } from '../src/models/MockModel.js';
import { OpenRouterModel } from '../src/models/OpenRouterModel.js';
import { createSqliteStore } from '../src/store/SqliteStore.js';

function fakeFetch(reply: unknown, calls: { url: string; init: RequestInit }[]) {
  return (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(reply), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
}

test('requests go to OpenRouter with the key, app headers and fallback models', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const model = new OpenRouterModel(
    { apiKey: 'sk-or-test', model: 'openrouter/auto', fallbacks: ['vendor/a', 'vendor/b'], appUrl: 'https://es.example' },
    fakeFetch({ choices: [{ message: { content: 'สวัสดีค่ะ' } }] }, calls),
  );
  const text = await model.reply([{ id: 'm', threadId: 't', role: 'user', content: 'hi', createdAt: '' }]);
  assert.equal(text, 'สวัสดีค่ะ');
  assert.equal(calls[0].url, 'https://openrouter.ai/api/v1/chat/completions');
  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(headers.Authorization, 'Bearer sk-or-test');
  assert.equal(headers['HTTP-Referer'], 'https://es.example');
  const body = JSON.parse(String(calls[0].init.body));
  assert.deepEqual(body.models, ['openrouter/auto', 'vendor/a', 'vendor/b']);
  assert.equal(body.model, undefined);
});

test('plan() parses JSON mode output and treats an empty plan as a plain reply', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const plan = { summary: 'แผน', steps: [{ title: 'อ่าน', toolId: 'google-sheets.read_range', args: {}, estimate: 1 }] };
  const model = new OpenRouterModel({ apiKey: 'k', model: 'm' }, fakeFetch({ choices: [{ message: { content: JSON.stringify({ plan }) } }] }, calls));
  assert.deepEqual(await model.plan('x', []), plan);
  assert.equal(JSON.parse(String(calls[0].init.body)).response_format.type, 'json_object');
  const empty = new OpenRouterModel({ apiKey: 'k', model: 'm' }, fakeFetch({ choices: [{ message: { content: '{"plan": null}' } }] }, []));
  assert.equal(await empty.plan('x', []), null);
});

test('OpenRouter errors surface with the model id', async () => {
  const model = new OpenRouterModel({ apiKey: 'k', model: 'vendor/x' }, fakeFetch({ error: { message: 'No credits' } }, []));
  await assert.rejects(model.reply([]), /OpenRouter vendor\/x: No credits/);
});

test('the app picks OpenRouter when a key is set and the mock otherwise', async () => {
  const withKey = await createApp(loadConfig({ DATA_PATH: ':memory:', OPENROUTER_API_KEY: 'k', OPENROUTER_FALLBACK_MODELS: 'a, b' }), {
    store: createSqliteStore(':memory:'),
  });
  assert.ok(withKey.model instanceof OpenRouterModel);
  assert.equal(withKey.model.name, 'openrouter/auto');
  assert.deepEqual(withKey.config.openrouter?.fallbacks, ['a', 'b']);
  const without = await createApp(loadConfig({ DATA_PATH: ':memory:' }), { store: createSqliteStore(':memory:') });
  assert.ok(without.model instanceof MockModel);
});
