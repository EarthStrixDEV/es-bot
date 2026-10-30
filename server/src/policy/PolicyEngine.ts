import {
  blastSize,
  type Blast,
  type Decision,
  type Effect,
  type Passport,
  type ToolMeta,
  type TrustLevel,
  TRUST_LEVELS,
} from '../domain/types.js';

export type ActionRequest = {
  botId: string;
  connectorId: string;
  toolId: string;
  taskClass: string;
  meta: ToolMeta;
  /** Resolved blast for this call (args may turn a "single" tool into a batch). */
  blast: Blast;
  resource?: string;
};

export type PolicyContext = {
  passport: Passport;
  /** Account/admin rules that can never be relaxed. */
  hardDeny: { effects: Effect[]; toolIds: string[] };
  /** Result of BudgetMeter.reserve() for this step. */
  budgetOk: boolean;
  /** Blast size above which a step counts as risky. */
  blastThreshold: number;
  /** Optional model review; it can only make the outcome stricter. */
  autoReview?: (req: ActionRequest, proposed: Decision) => Decision | undefined;
};

export type PolicyResult = {
  decision: Decision;
  level?: TrustLevel;
  /** Rule that produced the decision, shown in the rail and audit log. */
  rule: 'hard_deny' | 'budget' | 'passport' | 'trust' | 'risk' | 'auto_review';
  reason: string;
};

const STRICTNESS: Record<Decision, number> = { allow: 0, allow_and_report: 1, ask: 2, deny: 3 };

/** Return whichever decision is stricter. */
export function stricter(a: Decision, b: Decision): Decision {
  return STRICTNESS[a] >= STRICTNESS[b] ? a : b;
}

const LEVEL_DECISION: Record<TrustLevel, Decision> = {
  L0: 'deny',
  L1: 'ask',
  L2: 'ask', // asked once per run; the orchestrator batches it
  L3: 'allow_and_report',
};

/** One step stricter, floored at L1: risk alone turns "allow" into "ask", never into "deny". */
function lowerLevel(l: TrustLevel): TrustLevel {
  return l === 'L3' ? 'L2' : l === 'L2' ? 'L1' : l;
}

function minLevel(a: TrustLevel, b: TrustLevel): TrustLevel {
  return TRUST_LEVELS.indexOf(a) <= TRUST_LEVELS.indexOf(b) ? a : b;
}

const SCOPE_RANK: Record<Effect, number> = { read: 0, draft: 1, write: 2, send: 3, pay: 4, destroy: 5 };

/**
 * Decide one action. Rules run strictest-first and the first terminal rule wins:
 * hard deny → budget → passport → trust ladder → risk multiplier → auto-review.
 */
export function evaluate(req: ActionRequest, ctx: PolicyContext): PolicyResult {
  const { passport } = ctx;

  // 1. Hard deny — account/admin rules.
  if (ctx.hardDeny.effects.includes(req.meta.effect) || ctx.hardDeny.toolIds.includes(req.toolId)) {
    return { decision: 'deny', level: 'L0', rule: 'hard_deny', reason: `บัญชีห้าม ${req.meta.effect} เด็ดขาด` };
  }

  // 2. Budget — reserve() failed: stop the run.
  if (!ctx.budgetOk) {
    return { decision: 'deny', rule: 'budget', reason: 'งบของ run ไม่พอ หยุดทันที' };
  }

  // 3. Passport — a live grant on this connector whose scope covers the effect.
  const grant = passport.grants.find(
    (g) =>
      !g.revokedAt &&
      g.connectorId === req.connectorId &&
      SCOPE_RANK[g.scope] >= SCOPE_RANK[req.meta.effect] &&
      (!g.resources?.length || !req.resource || g.resources.includes(req.resource)),
  );
  if (!grant) {
    return { decision: 'deny', rule: 'passport', reason: `Passport ไม่มีสิทธิ์ ${req.meta.effect} บน ${req.connectorId}` };
  }

  // 4. Trust ladder — the stricter of the task-class level and a per-grant pin.
  const classLevel = passport.trust[req.taskClass] ?? passport.trust[req.meta.effect] ?? 'L1';
  let level: TrustLevel = grant.level ? minLevel(grant.level, classLevel) : classLevel;
  let result: PolicyResult = {
    decision: LEVEL_DECISION[level],
    level,
    rule: 'trust',
    reason: `${req.taskClass} อยู่ระดับ ${level}`,
  };

  // 5. Risk multiplier — irreversible or wide blast pushes one level down.
  const risky = req.meta.reversible === 'no' || blastSize(req.blast) > ctx.blastThreshold;
  if (risky && level !== 'L0') {
    const lowered = lowerLevel(level);
    if (lowered !== level) {
      level = lowered;
      result = {
        decision: LEVEL_DECISION[level],
        level,
        rule: 'risk',
        reason: req.meta.reversible === 'no' ? 'ย้อนกลับไม่ได้ ดันขึ้น 1 ขั้น' : `blast ${blastSize(req.blast)} เกินเกณฑ์`,
      };
    }
  }

  // 6. Auto-review — may only tighten.
  const reviewed = ctx.autoReview?.(req, result.decision);
  if (reviewed && stricter(reviewed, result.decision) !== result.decision) {
    result = { decision: reviewed, level, rule: 'auto_review', reason: 'โมเดลตรวจแล้วให้เข้มขึ้น' };
  }

  return result;
}
