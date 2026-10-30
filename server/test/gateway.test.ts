import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import WebSocket from 'ws';
import { createGateway } from '../src/gateway/server.js';
import { OUTREACH, testApp } from './helpers.js';

test('REST + WebSocket: auth, message → plan approval → events', async () => {
  const { app } = await testApp();
  const server = createGateway(app).listen(0);
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const api = (path: string, init: RequestInit = {}, token = 'dev-token') =>
    fetch(base + path, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });

  try {
    assert.equal((await api('/api/bots', {}, 'wrong')).status, 401);
    assert.equal((await api('/api/bots')).status, 200);

    const ws = new WebSocket(`${base.replace('http', 'ws')}/api/events?token=dev-token`);
    const events: string[] = [];
    ws.on('message', (d) => events.push(JSON.parse(String(d)).type));
    await new Promise((r) => ws.once('open', r));

    const res = await api('/api/bots/sales-outbound/messages', { method: 'POST', body: JSON.stringify({ text: OUTREACH }) });
    const body = (await res.json()) as any;
    assert.equal(body.run.run.status, 'awaiting_plan_approval');

    const approvalId = body.run.approvals[0].id;
    const decided = (await (await api(`/api/approvals/${approvalId}/decision`, { method: 'POST', body: JSON.stringify({ decision: 'approve' }) })).json()) as any;
    assert.equal(decided.run.status, 'awaiting_approval');
    assert.equal(decided.budget.used > 0, true);

    const again = await api(`/api/approvals/${approvalId}/decision`, { method: 'POST', body: JSON.stringify({ decision: 'approve' }) });
    assert.equal(again.status, 409);

    await new Promise((r) => setTimeout(r, 50));
    for (const t of ['message.created', 'approval.created', 'step.updated', 'budget.updated']) assert.ok(events.includes(t), t);
    ws.close();

    const connectors = (await (await api("/api/connectors")).json()) as Record<string, unknown>[];
    assert.ok(connectors.every((c) => !('secretRef' in c)), 'secret refs never leave the server');
  } finally {
    server.close();
  }
});
