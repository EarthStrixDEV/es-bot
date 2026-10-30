import { HOUR, MINUTE, type Clock } from '../domain/clock.js';
import type { EventBus } from '../domain/events.js';
import { hashPayload, newId } from '../domain/ids.js';
import type { Approval, ApprovalDecision, Reversible } from '../domain/types.js';
import type { AuditLog } from '../audit/AuditLog.js';
import type { Notifier } from '../notifier/Notifier.js';
import type { Store } from '../store/Store.js';

export const ESCALATE_AFTER = 30 * MINUTE;
export const PAUSE_AFTER = 2 * HOUR;

const OPEN: Approval['state'][] = ['pending', 'escalated', 'paused'];

/**
 * Approval requests never expire silently:
 * pending → (30 min) escalated + LINE → (2 h) paused at the checkpoint → answered whenever.
 * Every answer is bound to the payload hash, so edited content needs a new approval.
 */
export class ApprovalService {
  constructor(
    private store: Store,
    private bus: EventBus,
    private clock: Clock,
    private notifier: Notifier,
    private audit: AuditLog,
    private appUrl: string,
  ) {}

  create(input: {
    runId: string;
    stepId: string | null;
    title: string;
    payload: unknown;
    reversible: Reversible;
    estimate: number;
    taskClass?: string;
    preview?: string[];
  }): Approval {
    const approval: Approval = {
      id: newId('apr'),
      runId: input.runId,
      stepId: input.stepId,
      title: input.title,
      taskClass: input.taskClass,
      preview: input.preview,
      payloadHash: hashPayload(input.payload),
      state: 'pending',
      reversible: input.reversible,
      estimate: input.estimate,
      createdAt: this.clock.now().toISOString(),
    };
    this.store.approvals.put(approval);
    this.audit.record({ actor: 'system', action: 'approval.request', target: approval.id, decision: 'pending', payloadHash: approval.payloadHash, meta: { runId: input.runId, title: input.title } });
    this.bus.emit({ type: 'approval.created', approval });
    return approval;
  }

  get(id: string) {
    return this.store.approvals.get(id);
  }

  open(runId?: string): Approval[] {
    return this.store.approvals.list({ runId }).filter((a) => OPEN.includes(a.state));
  }

  /** True when an approved request covers exactly this payload. */
  covers(approval: Approval, payload: unknown): boolean {
    return (approval.state === 'approved' || approval.state === 'approved_canary') && approval.payloadHash === hashPayload(payload);
  }

  decide(id: string, decision: ApprovalDecision, by: string): Approval {
    const current = this.store.approvals.get(id);
    if (!current) throw new Error('ไม่พบคำขออนุมัติ');
    if (!OPEN.includes(current.state)) throw new Error(`คำขอนี้ตอบไปแล้ว (${current.state})`);
    const state = decision === 'approve' ? 'approved' : decision === 'approve_canary' ? 'approved_canary' : 'rejected';
    const next: Approval = { ...current, state, decidedAt: this.clock.now().toISOString(), decidedBy: by };
    this.store.approvals.put(next);
    this.audit.record({ actor: by, action: 'approval.decide', target: id, decision: state, payloadHash: next.payloadHash });
    this.bus.emit({ type: 'approval.decided', approval: next });
    return next;
  }

  /** Advance timers. Called by the scheduler every ~30 s and safe to call any time. */
  async tick(): Promise<void> {
    const now = this.clock.now().getTime();
    for (const a of this.open()) {
      const age = now - new Date(a.createdAt).getTime();
      if (a.state === 'pending' && age >= ESCALATE_AFTER) {
        const next: Approval = { ...a, state: 'escalated', escalatedAt: this.clock.now().toISOString() };
        this.store.approvals.put(next);
        this.audit.record({ actor: 'system', action: 'approval.escalate', target: a.id, decision: 'escalated' });
        this.bus.emit({ type: 'approval.escalated', approval: next });
        await this.notifier.send({
          title: 'ES Bot รอพี่อนุมัติ',
          body: `${a.title}\nย้อนกลับ: ${a.reversible === 'no' ? 'ไม่ได้' : 'ได้'} · ค่าใช้จ่าย ~${a.estimate} บาท`,
          url: `${this.appUrl}/?approval=${a.id}`,
        });
      } else if (a.state === 'escalated' && age >= PAUSE_AFTER) {
        const next: Approval = { ...a, state: 'paused', pausedAt: this.clock.now().toISOString() };
        this.store.approvals.put(next);
        this.audit.record({ actor: 'system', action: 'approval.pause', target: a.id, decision: 'paused' });
        this.bus.emit({ type: 'approval.paused', approval: next });
      }
    }
  }
}
