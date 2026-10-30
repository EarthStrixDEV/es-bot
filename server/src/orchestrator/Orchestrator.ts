import type { ApprovalService } from '../approval/ApprovalService.js';
import type { AuditLog } from '../audit/AuditLog.js';
import type { BudgetMeter } from '../budget/BudgetMeter.js';
import type { ConnectorGateway } from '../connectors/ConnectorGateway.js';
import type { ConversationService } from '../conversation/ConversationService.js';
import type { Clock } from '../domain/clock.js';
import type { EventBus } from '../domain/events.js';
import { hashPayload, newId } from '../domain/ids.js';
import { EFFECTS, type Approval, type Message, type Passport, type Run, type Step } from '../domain/types.js';
import type { ModelClient } from '../models/ModelClient.js';
import type { Store } from '../store/Store.js';

/** Parts attached to Bot messages so clients can render plan/approval/result cards. */
export type MessagePart =
  | { kind: 'plan'; runId: string; approvalId?: string }
  | { kind: 'progress'; runId: string; stepId: string }
  | { kind: 'approval'; runId: string; approvalId: string }
  | { kind: 'result'; runId: string };

const OPEN: Approval['state'][] = ['pending', 'escalated', 'paused'];

const writeOrAbove = (effect: string) => EFFECTS.indexOf(effect as never) >= EFFECTS.indexOf('write');

/**
 * Runs a plan step by step. Every transition is persisted before the next one starts,
 * so `advance()` can be called again after a crash or restart and picks up where it was.
 *
 * Per step: 4 start → policy (deny: stop · ask: wait for approval) → 5 checkpoint (write+)
 * → 6 tool call with lease → 7 verifier (phase 3) → 8 audit + rail events.
 */
export class Orchestrator {
  private locks = new Map<string, Promise<void>>();

  constructor(
    private store: Store,
    private bus: EventBus,
    private clock: Clock,
    private conversation: ConversationService,
    private gateway: ConnectorGateway,
    private approvals: ApprovalService,
    private budget: BudgetMeter,
    private audit: AuditLog,
    private model: ModelClient,
  ) {
    bus.subscribe((e) => {
      if (e.type === 'approval.decided') void this.advance(e.approval.runId);
      if (e.type === 'approval.paused' && this.run(e.approval.runId)) this.setStatus(e.approval.runId, 'paused');
    });
  }

  passport(botId: string): Passport {
    const p = this.store.passports.get(botId);
    if (!p) throw new Error(`Bot ${botId} ยังไม่มี Passport`);
    return p;
  }

  run(id: string) {
    return this.store.runs.get(id);
  }

  steps(runId: string): Step[] {
    return this.store.steps.list({ runId }).sort((a, b) => a.idx - b.idx);
  }

  /** 1 รับคำสั่ง → 2 วางแผน → 3 ขออนุมัติแผน (ข้ามได้เมื่อทุกขั้นเป็น L3). */
  async handleUserMessage(botId: string, text: string, by: string): Promise<{ message: Message; run?: Run }> {
    const thread = this.conversation.mainThread(botId);
    const message = this.conversation.post(thread.id, 'user', text);
    this.audit.record({ actor: by, action: 'message.create', target: thread.id });

    const plan = await this.model.plan(text, this.gateway.tools());
    if (!plan) {
      this.conversation.post(thread.id, 'assistant', await this.model.reply(this.conversation.messages(thread.id)));
      return { message };
    }

    const passport = this.passport(botId);
    const now = this.clock.now().toISOString();
    const run: Run = {
      id: newId('run'),
      botId,
      threadId: thread.id,
      status: 'planning',
      plan,
      cursor: 0,
      budgetCap: passport.budget.perRun,
      createdAt: now,
      updatedAt: now,
    };
    this.store.runs.put(run);
    plan.steps.forEach((s, idx) =>
      this.store.steps.put({ id: newId('stp'), runId: run.id, idx, kind: 'tool', title: s.title, toolId: s.toolId, cost: 0, status: 'pending' }),
    );

    // Preview each step's decision with static args to see whether the plan needs a person.
    const previews = plan.steps.map((s) => this.gateway.decide(passport, s.toolId, s.args, true));
    const denied = previews.find((p) => p.decision === 'deny');
    if (denied) {
      this.stop(run.id, `แผนมีขั้นที่ทำไม่ได้: ${denied.reason}`);
      return { message, run: this.run(run.id) };
    }
    const allL3 = previews.every((p) => p.level === 'L3');
    if (allL3) {
      this.conversation.post(thread.id, 'assistant', plan.summary, { kind: 'plan', runId: run.id } satisfies MessagePart);
      this.setStatus(run.id, 'running');
      await this.advance(run.id);
    } else {
      const approval = this.approvals.create({
        runId: run.id,
        stepId: null,
        title: `อนุมัติแผน: ${plan.summary}`,
        payload: plan,
        reversible: 'yes',
        estimate: plan.steps.reduce((s, x) => s + x.estimate, 0),
      });
      this.conversation.post(thread.id, 'assistant', plan.summary, { kind: 'plan', runId: run.id, approvalId: approval.id } satisfies MessagePart);
      this.setStatus(run.id, 'awaiting_plan_approval');
    }
    return { message, run: this.run(run.id) };
  }

  /** Move a run forward until it finishes or has to wait. Serialized per run. */
  advance(runId: string): Promise<void> {
    const prev = this.locks.get(runId) ?? Promise.resolve();
    const next = prev.then(() => this.advanceUnlocked(runId)).catch((err) => this.stop(runId, `เกิดข้อผิดพลาด: ${String(err)}`));
    this.locks.set(runId, next);
    return next;
  }

  /** Resume every run that was mid-flight when the process stopped. */
  async resumeAll() {
    for (const r of this.store.runs.list()) if (r.status === 'running' || r.status === 'awaiting_approval') await this.advance(r.id);
  }

  private async advanceUnlocked(runId: string): Promise<void> {
    let run = this.run(runId);
    if (!run?.plan) return;

    if (run.status === 'awaiting_plan_approval' || run.status === 'paused') {
      const planApproval = this.store.approvals.list({ runId, stepId: null }).at(-1);
      if (planApproval && !this.approvals.covers(planApproval, run.plan)) {
        if (planApproval.state === 'rejected') return this.cancel(runId, 'พี่ปฏิเสธแผน');
        return; // still waiting for the plan
      }
      const stepApproval = this.latestStepApproval(runId);
      if (run.status === 'paused' && stepApproval && OPEN.includes(stepApproval.state)) return;
      run = this.setStatus(runId, 'running');
    }

    while (run && (run.status === 'running' || run.status === 'awaiting_approval') && run.cursor < run.plan!.steps.length) {
      const waited = await this.runStep(run);
      if (waited === 'wait' || waited === 'stop') return;
      run = this.store.runs.put({ ...this.run(runId)!, cursor: run.cursor + 1, status: 'running', updatedAt: this.clock.now().toISOString() });
      this.bus.emit({ type: 'run.updated', run });
    }

    if (run && run.status === 'running' && run.cursor >= run.plan!.steps.length) this.complete(run);
  }

  private async runStep(run: Run): Promise<'next' | 'wait' | 'stop'> {
    const planStep = run.plan!.steps[run.cursor];
    let step = this.steps(run.id)[run.cursor];
    const passport = this.passport(run.botId);
    const tool = this.gateway.tool(planStep.toolId);

    // 4. Start: materialize args once, then keep them stable across restarts.
    if (!step.args) {
      const previous = this.steps(run.id)
        .slice(0, run.cursor)
        .map((s) => ({ title: s.title, output: s.output }));
      const request = this.conversation.messages(run.threadId).filter((m) => m.role === 'user').at(-1)?.content ?? '';
      const args = await this.model.resolveArgs({ request, step: planStep, previous });
      step = this.saveStep({ ...step, args, argsHash: hashPayload(args), status: 'running', model: this.model.name });
    }
    const args = step.args!;

    // Budget reservation feeds the policy's budget rule.
    const reservation = this.budget.reserve(run.id, step.id, planStep.estimate, run.budgetCap);
    const decision = this.gateway.decide(passport, planStep.toolId, args, reservation !== null);
    step = this.saveStep({ ...step, decision: decision.decision, level: decision.level, reason: decision.reason });

    if (decision.decision === 'deny') {
      if (reservation) this.budget.release(reservation, run.budgetCap);
      this.saveStep({ ...step, status: 'denied' });
      this.stop(run.id, decision.reason);
      return 'stop';
    }

    let approvedHash: string | undefined;
    let callArgs = args;
    if (decision.decision === 'ask') {
      const covered = this.approvalFor(run, step, tool.taskClass, decision.level);
      if (!covered) {
        if (reservation) this.budget.release(reservation, run.budgetCap);
        return this.requestApproval(run, step, tool.reversible, planStep.estimate, decision.level === 'L2' ? tool.taskClass : undefined);
      }
      if (covered.state === 'rejected') {
        if (reservation) this.budget.release(reservation, run.budgetCap);
        this.saveStep({ ...step, status: 'skipped' });
        this.cancel(run.id, 'พี่ปฏิเสธขั้นนี้');
        return 'stop';
      }
      if (covered.state === 'approved_canary' && tool.blastArg && Array.isArray(args[tool.blastArg]) && (args[tool.blastArg] as unknown[]).length > 1) {
        // Canary: run the first item now, then ask again for the rest.
        const items = args[tool.blastArg] as unknown[];
        callArgs = { ...args, [tool.blastArg]: items.slice(0, 1) };
        const rest = { ...args, [tool.blastArg]: items.slice(1) };
        approvedHash = hashPayload(callArgs);
        const result = await this.call(run, step, passport, callArgs, decision.decision, approvedHash, planStep.estimate, reservation);
        if (result === 'stop') return 'stop';
        step = this.saveStep({ ...this.store.steps.get(step.id)!, args: rest, argsHash: hashPayload(rest), status: 'running' });
        this.conversation.post(run.threadId, 'assistant', `ส่งทดลอง 1 รายการแล้ว ผลลัพธ์อยู่ใน audit log · เหลือ ${items.length - 1} รายการ รอพี่อนุมัติ`);
        return this.requestApproval(run, step, tool.reversible, planStep.estimate, undefined);
      }
      approvedHash = hashPayload(args);
    }

    // 5. Checkpoint before anything that writes. Phase 1 has no sandbox snapshot, only context.
    if (writeOrAbove(tool.effect)) {
      this.store.checkpoints.put({
        id: newId('ckp'),
        runId: run.id,
        stepId: step.id,
        messageId: this.conversation.last(run.threadId)?.id,
        createdAt: this.clock.now().toISOString(),
      });
    }

    // 6–8. Call, audit, publish.
    return this.call(run, step, passport, callArgs, decision.decision, approvedHash, planStep.estimate, reservation);
  }

  private async call(
    run: Run,
    step: Step,
    passport: Passport,
    args: Record<string, unknown>,
    decision: Step['decision'],
    approvedHash: string | undefined,
    cost: number,
    reservation: string | null,
  ): Promise<'next' | 'stop'> {
    try {
      const output = await this.gateway.invoke({ passport, toolId: step.toolId!, args, decision: decision!, approvedHash, runId: run.id, cost });
      if (reservation) this.budget.commit(reservation, cost, run.budgetCap);
      this.saveStep({ ...this.store.steps.get(step.id)!, status: 'done', cost, output });
      if (decision === 'allow_and_report') this.audit.record({ actor: `bot:${run.botId}`, action: 'step.report', target: step.id, decision });
      return 'next';
    } catch (err) {
      if (reservation) this.budget.release(reservation, run.budgetCap);
      this.saveStep({ ...this.store.steps.get(step.id)!, status: 'failed', reason: String(err) });
      this.stop(run.id, `${step.title}: ${String(err)}`);
      return 'stop';
    }
  }

  /** The approval that answers this step: the step's own, or (L2) one per task class per run. */
  private approvalFor(run: Run, step: Step, taskClass: string, level?: string): Approval | undefined {
    const own = this.store.approvals.list({ runId: run.id, stepId: step.id }).at(-1);
    if (own && own.state === 'rejected') return own;
    if (own && this.approvals.covers(own, step.args)) return own;
    if (level === 'L2') {
      return this.store.approvals
        .list({ runId: run.id, taskClass })
        .find((a) => a.state === 'approved' || a.state === 'approved_canary');
    }
    return undefined;
  }

  private latestStepApproval(runId: string) {
    return this.store.approvals.list({ runId }).filter((a) => a.stepId).at(-1);
  }

  private requestApproval(run: Run, step: Step, reversible: Approval['reversible'], estimate: number, taskClass?: string): 'wait' {
    const existing = this.store.approvals.list({ runId: run.id, stepId: step.id }).at(-1);
    const stillOpen = existing && OPEN.includes(existing.state) && existing.payloadHash === step.argsHash;
    if (!stillOpen) {
      const items = (Object.values(step.args ?? {}).find(Array.isArray) as unknown[] | undefined) ?? [];
      const approval = this.approvals.create({
        runId: run.id,
        stepId: step.id,
        title: `${step.title}${items.length ? ` · ${items.length} รายการ` : ''}`,
        payload: step.args,
        reversible,
        estimate,
        taskClass,
        preview: items.slice(0, 3).map((i) => (typeof i === 'object' && i && 'text' in i ? String((i as { text: unknown }).text) : JSON.stringify(i))),
      });
      this.conversation.post(run.threadId, 'assistant', `ขออนุมัติ: ${approval.title}`, { kind: 'approval', runId: run.id, approvalId: approval.id } satisfies MessagePart);
    }
    this.saveStep({ ...step, status: 'awaiting_approval' });
    this.setStatus(run.id, 'awaiting_approval');
    return 'wait';
  }

  private complete(run: Run) {
    const done = this.setStatus(run.id, 'completed');
    const steps = this.steps(run.id);
    this.conversation.post(
      run.threadId,
      'assistant',
      `เสร็จแล้วค่ะ · ${steps.filter((s) => s.status === 'done').length}/${steps.length} ขั้น · ใช้งบ ${this.budget.used(run.id)} บาท`,
      { kind: 'result', runId: run.id } satisfies MessagePart,
    );
    this.audit.record({ actor: `bot:${run.botId}`, action: 'run.complete', target: run.id });
    return done;
  }

  private stop(runId: string, reason: string) {
    const run = this.run(runId);
    if (!run || ['completed', 'stopped', 'cancelled'].includes(run.status)) return;
    this.store.runs.put({ ...run, status: 'stopped', stopReason: reason, updatedAt: this.clock.now().toISOString() });
    this.bus.emit({ type: 'run.updated', run: this.run(runId)! });
    this.conversation.post(run.threadId, 'assistant', `หยุดแล้วค่ะ: ${reason}`);
    this.audit.record({ actor: 'system', action: 'run.stop', target: runId, meta: { reason } });
  }

  private cancel(runId: string, reason: string) {
    const run = this.run(runId)!;
    this.store.runs.put({ ...run, status: 'cancelled', stopReason: reason, updatedAt: this.clock.now().toISOString() });
    this.bus.emit({ type: 'run.updated', run: this.run(runId)! });
    this.conversation.post(run.threadId, 'assistant', `ยกเลิกแล้ว: ${reason}`);
    this.audit.record({ actor: 'system', action: 'run.cancel', target: runId, meta: { reason } });
  }

  private setStatus(runId: string, status: Run['status']): Run {
    const run = this.run(runId)!;
    if (run.status === status) return run;
    const next = this.store.runs.put({ ...run, status, updatedAt: this.clock.now().toISOString() });
    this.bus.emit({ type: 'run.updated', run: next });
    return next;
  }

  private saveStep(step: Step): Step {
    this.store.steps.put(step);
    this.bus.emit({ type: 'step.updated', step });
    return step;
  }
}
