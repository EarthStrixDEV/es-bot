import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PassportError } from '../src/passport/PassportService.js';
import { OUTREACH, testApp } from './helpers.js';

test('updating trust saves a new version, audits it and changes the next decision', async () => {
  const { app } = await testApp();
  const before = app.passports.get('sales-outbound');
  assert.equal(app.gateway.decide(before, 'google-sheets.read_range', {}, true).decision, 'allow_and_report');

  const after = app.passports.update('sales-outbound', { trust: { read: 'L1' }, budget: { perRun: 80 } }, 'user:earth');
  assert.equal(after.version, before.version + 1);
  assert.equal(after.budget.perRun, 80);
  assert.equal(app.gateway.decide(after, 'google-sheets.read_range', {}, true).decision, 'ask');
  assert.equal(app.passports.versions('sales-outbound').length, 2);
  assert.ok(app.audit.list().some((e) => e.action === 'passport.update' && e.target === 'passport:sales-outbound'));
});

test('pay and destroy stay locked at L0, bad levels and budgets are rejected', async () => {
  const { app } = await testApp();
  assert.throws(() => app.passports.update('sales-outbound', { trust: { pay: 'L3' } }, 'user:earth'), PassportError);
  assert.throws(() => app.passports.update('sales-outbound', { trust: { send: 'L9' as never } }, 'user:earth'), PassportError);
  assert.throws(() => app.passports.update('sales-outbound', { budget: { perRun: -1 } }, 'user:earth'), PassportError);
});

test('dry-run shows what would change without saving', async () => {
  const { app } = await testApp();
  const rows = app.passports.dryRun('sales-outbound', { trust: { send: 'L0' } });
  const send = rows.find((r) => r.toolId === 'line-oa.send_messages')!;
  assert.equal(send.current.decision, 'ask');
  assert.equal(send.proposed.decision, 'deny');
  assert.ok(send.changed);
  assert.ok(!rows.find((r) => r.toolId === 'google-sheets.read_range')!.changed);
  assert.equal(app.passports.get('sales-outbound').trust.send, 'L1', 'nothing saved');
});

test('revoking a grant blocks the plan; granting it back restores it', async () => {
  const { app } = await testApp();
  app.passports.revoke('sales-outbound', 'line-oa', 'user:earth');
  const { run } = await app.orchestrator.handleUserMessage('sales-outbound', OUTREACH, 'user:earth');
  assert.equal(run!.status, 'stopped');
  assert.match(run!.stopReason!, /Passport/);

  assert.throws(() => app.passports.grant('sales-outbound', { connectorId: 'line-oa', scope: 'pay' }, 'user:earth'), PassportError);
  app.passports.grant('sales-outbound', { connectorId: 'line-oa', scope: 'send', level: 'L1' }, 'user:earth');
  assert.throws(() => app.passports.grant('sales-outbound', { connectorId: 'line-oa', scope: 'send' }, 'user:earth'), /อยู่แล้ว/);
  const again = await app.orchestrator.handleUserMessage('sales-outbound', OUTREACH, 'user:earth');
  assert.equal(again.run!.status, 'awaiting_plan_approval');
  assert.deepEqual(app.passports.botsWithAccess('line-oa'), [{ botId: 'sales-outbound', scope: 'send', level: 'L1' }]);
});
