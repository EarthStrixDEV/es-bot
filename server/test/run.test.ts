import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { hashPayload } from '../src/domain/ids.js';
import { OUTREACH, testApp } from './helpers.js';

test('outreach run: plan approval → 3 L3 steps → LINE send waits for approval → sends', async () => {
  const { app, lineOutbox } = await testApp();
  const { run } = await app.orchestrator.handleUserMessage('sales-outbound', OUTREACH, 'user:earth');
  assert.equal(run!.status, 'awaiting_plan_approval');

  const planApproval = app.approvals.open(run!.id)[0];
  assert.equal(planApproval.stepId, null);
  app.approvals.decide(planApproval.id, 'approve', 'user:earth');
  await app.orchestrator.advance(run!.id);

  const r = app.orchestrator.run(run!.id)!;
  assert.equal(r.status, 'awaiting_approval');
  const steps = app.orchestrator.steps(run!.id);
  assert.deepEqual(steps.map((s) => s.status), ['done', 'done', 'done', 'awaiting_approval']);
  assert.deepEqual(steps.slice(0, 3).map((s) => s.decision), ['allow_and_report', 'allow_and_report', 'allow_and_report']);
  assert.equal(steps[3].level, 'L1');
  assert.equal((steps[3].args!.messages as unknown[]).length, 22, '24 leads − 2 already contacted');
  assert.equal(lineOutbox.length, 0, 'nothing is sent before approval');

  const sendApproval = app.approvals.open(run!.id)[0];
  assert.equal(sendApproval.reversible, 'no');
  assert.equal(sendApproval.preview!.length, 3);
  app.approvals.decide(sendApproval.id, 'approve', 'user:earth');
  await app.orchestrator.advance(run!.id);

  assert.equal(app.orchestrator.run(run!.id)!.status, 'completed');
  assert.equal(lineOutbox.length, 22);
  assert.ok(app.store.checkpoints.list({ runId: run!.id }).length >= 1, 'checkpoint before the send');
  const actions = app.audit.list().map((e) => e.action);
  assert.ok(actions.includes('tool.call') && actions.includes('approval.decide') && actions.includes('run.complete'));
});

test('canary approval sends one message, then asks again for the rest', async () => {
  const { app, lineOutbox } = await testApp();
  const { run } = await app.orchestrator.handleUserMessage('sales-outbound', OUTREACH, 'user:earth');
  app.approvals.decide(app.approvals.open(run!.id)[0].id, 'approve', 'user:earth');
  await app.orchestrator.advance(run!.id);
  app.approvals.decide(app.approvals.open(run!.id)[0].id, 'approve_canary', 'user:earth');
  await app.orchestrator.advance(run!.id);

  assert.equal(lineOutbox.length, 1);
  assert.equal(app.orchestrator.run(run!.id)!.status, 'awaiting_approval');
  const rest = app.approvals.open(run!.id)[0];
  assert.match(rest.title, /21 รายการ/);
  app.approvals.decide(rest.id, 'approve', 'user:earth');
  await app.orchestrator.advance(run!.id);
  assert.equal(lineOutbox.length, 22);
  assert.equal(app.orchestrator.run(run!.id)!.status, 'completed');
});

test('rejecting the send cancels the run and sends nothing', async () => {
  const { app, lineOutbox } = await testApp();
  const { run } = await app.orchestrator.handleUserMessage('sales-outbound', OUTREACH, 'user:earth');
  app.approvals.decide(app.approvals.open(run!.id)[0].id, 'approve', 'user:earth');
  await app.orchestrator.advance(run!.id);
  app.approvals.decide(app.approvals.open(run!.id)[0].id, 'reject', 'user:earth');
  await app.orchestrator.advance(run!.id);
  assert.equal(app.orchestrator.run(run!.id)!.status, 'cancelled');
  assert.equal(lineOutbox.length, 0);
});

test('the gateway refuses a send whose content changed after approval', async () => {
  const { app, lineOutbox } = await testApp();
  const passport = app.orchestrator.passport('sales-outbound');
  const approved = { messages: [{ to: '@a', text: 'สวัสดี' }] };
  const edited = { messages: [{ to: '@a', text: 'สวัสดี แก้แล้ว' }] };
  await assert.rejects(
    app.gateway.invoke({ passport, toolId: 'line-oa.send_messages', args: edited, decision: 'ask', approvedHash: hashPayload(approved), runId: 'r', cost: 1 }),
    /อนุมัติ/,
  );
  assert.equal(lineOutbox.length, 0);
  assert.ok(app.audit.list().some((e) => e.action === 'tool.blocked'));
});

test('a run stops when the budget cap is hit', async () => {
  const { app } = await testApp({ BUDGET_PER_RUN: '5' });
  const { run } = await app.orchestrator.handleUserMessage('sales-outbound', OUTREACH, 'user:earth');
  app.approvals.decide(app.approvals.open(run!.id)[0].id, 'approve', 'user:earth');
  await app.orchestrator.advance(run!.id);
  const r = app.orchestrator.run(run!.id)!;
  assert.equal(r.status, 'stopped');
  assert.match(r.stopReason!, /งบ/);
  assert.ok(app.budget.used(run!.id) <= 5);
});

test('a waiting run survives a restart and continues from the same step', async () => {
  const { app, store, lineOutbox } = await testApp();
  const { run } = await app.orchestrator.handleUserMessage('sales-outbound', OUTREACH, 'user:earth');
  app.approvals.decide(app.approvals.open(run!.id)[0].id, 'approve', 'user:earth');
  await app.orchestrator.advance(run!.id);
  const pending = app.approvals.open(run!.id)[0];

  // Same store, fresh process.
  const app2 = await createApp(loadConfig({ DATA_PATH: ':memory:' }), { store, clock: app.clock, lineOutbox });
  await app2.orchestrator.resumeAll();
  assert.equal(app2.orchestrator.run(run!.id)!.status, 'awaiting_approval');
  assert.equal(app2.approvals.open(run!.id).length, 1, 'no duplicate approval after resume');
  app2.approvals.decide(pending.id, 'approve', 'user:earth');
  await app2.orchestrator.advance(run!.id);
  assert.equal(app2.orchestrator.run(run!.id)!.status, 'completed');
  assert.equal(lineOutbox.length, 22);
});

test('plain questions get a reply without starting a run', async () => {
  const { app } = await testApp();
  const { run } = await app.orchestrator.handleUserMessage('sales-outbound', 'วันนี้มีอะไรต้องทำบ้าง', 'user:earth');
  assert.equal(run, undefined);
  const thread = app.conversation.mainThread('sales-outbound');
  assert.equal(app.conversation.messages(thread.id).at(-1)!.role, 'assistant');
});
