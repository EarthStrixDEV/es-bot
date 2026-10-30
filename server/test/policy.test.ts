import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Passport, ToolMeta } from '../src/domain/types.js';
import { evaluate, type ActionRequest, type PolicyContext } from '../src/policy/PolicyEngine.js';

const passport: Passport = {
  botId: 'b',
  version: 1,
  sandbox: { image: 'x', browserProfile: 'p', network: [] },
  grants: [
    { connectorId: 'sheets', scope: 'read' },
    { connectorId: 'crm', scope: 'write' },
    { connectorId: 'line', scope: 'send', level: 'L1' },
    { connectorId: 'old', scope: 'write', revokedAt: '2026-01-01' },
  ],
  budget: { perRun: 10, perDay: 10, hardStop: true, unit: 'THB' },
  trust: { read: 'L3', draft: 'L3', crm_write: 'L2', send: 'L3', pay: 'L0' },
};
const ctx: PolicyContext = { passport, hardDeny: { effects: ['pay', 'destroy'], toolIds: [] }, budgetOk: true, blastThreshold: 20 };
const meta = (effect: ToolMeta['effect'], reversible: ToolMeta['reversible'] = 'yes'): ToolMeta => ({ effect, reversible, blast: { kind: 'single' } });
const req = (connectorId: string, taskClass: string, m: ToolMeta, n = 1): ActionRequest => ({
  botId: 'b', connectorId, toolId: `${connectorId}.x`, taskClass, meta: m, blast: n === 1 ? { kind: 'single' } : { kind: 'batch', n },
});

test('hard deny beats everything, even a matching grant', () => {
  const r = evaluate(req('crm', 'pay', meta('pay')), ctx);
  assert.equal(r.decision, 'deny');
  assert.equal(r.rule, 'hard_deny');
});

test('budget failure denies before checking the passport', () => {
  const r = evaluate(req('sheets', 'read', meta('read')), { ...ctx, budgetOk: false });
  assert.deepEqual([r.decision, r.rule], ['deny', 'budget']);
});

test('no grant, revoked grant or too-narrow scope → deny', () => {
  assert.equal(evaluate(req('gmail', 'read', meta('read')), ctx).rule, 'passport');
  assert.equal(evaluate(req('old', 'crm_write', meta('write')), ctx).rule, 'passport');
  assert.equal(evaluate(req('sheets', 'crm_write', meta('write')), ctx).rule, 'passport');
});

test('trust ladder: L3 allow_and_report, L2 ask', () => {
  assert.equal(evaluate(req('sheets', 'read', meta('read')), ctx).decision, 'allow_and_report');
  const r = evaluate(req('crm', 'crm_write', meta('write')), ctx);
  assert.deepEqual([r.decision, r.level], ['ask', 'L2']);
});

test('a per-grant pin is stricter than the task class level', () => {
  const r = evaluate(req('line', 'send', meta('send')), ctx);
  assert.deepEqual([r.decision, r.level], ['ask', 'L1']);
});

test('irreversible or wide blast pushes one level down, but never to deny', () => {
  const irreversible = evaluate(req('sheets', 'read', meta('read', 'no')), ctx);
  assert.deepEqual([irreversible.decision, irreversible.level, irreversible.rule], ['ask', 'L2', 'risk']);
  const wide = evaluate(req('sheets', 'read', meta('read'), 22), ctx);
  assert.equal(wide.level, 'L2');
  const l1 = evaluate(req('line', 'send', meta('send', 'no'), 22), ctx);
  assert.deepEqual([l1.decision, l1.level], ['ask', 'L1']);
});

test('auto-review can tighten but never relax', () => {
  const tighter = evaluate(req('sheets', 'read', meta('read')), { ...ctx, autoReview: () => 'ask' });
  assert.deepEqual([tighter.decision, tighter.rule], ['ask', 'auto_review']);
  const looser = evaluate(req('crm', 'crm_write', meta('write')), { ...ctx, autoReview: () => 'allow' });
  assert.equal(looser.decision, 'ask');
});
