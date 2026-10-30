// Shared vocabulary of the harness, straight from the system design doc.

/** What a tool does to the world, from harmless to irreversible. */
export const EFFECTS = ['read', 'draft', 'write', 'send', 'pay', 'destroy'] as const;
export type Effect = (typeof EFFECTS)[number];

export type Reversible = 'yes' | 'no' | 'partial';

/** How many targets one call touches. */
export type Blast = { kind: 'single' } | { kind: 'batch'; n: number } | { kind: 'all' };

export type Decision = 'allow' | 'allow_and_report' | 'ask' | 'deny';

/** L0 deny · L1 ask every time · L2 ask once per run (batch) · L3 allow and report. */
export type TrustLevel = 'L0' | 'L1' | 'L2' | 'L3';
export const TRUST_LEVELS: TrustLevel[] = ['L0', 'L1', 'L2', 'L3'];

/** Metadata every tool must declare before it can be enabled. */
export type ToolMeta = {
  effect: Effect;
  reversible: Reversible;
  blast: Blast;
};

export type ToolDef = ToolMeta & {
  id: string; // `${connectorId}.${name}`
  connectorId: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** Work category used by the trust ladder (e.g. "read", "crm_write", "send"). */
  taskClass: string;
  enabled: boolean;
  descHash: string;
  /** Array argument whose length becomes the call's blast (e.g. messages → batch(n)). */
  blastArg?: string;
  /** Set when the description failed the injection scan or changed since it was approved. */
  flagged?: string;
};

export type Grant = {
  connectorId: string;
  scope: Effect;
  resources?: string[];
  /** Optional per-grant trust override (e.g. LINE OA send pinned to L1). */
  level?: TrustLevel;
  revokedAt?: string;
};

export type Passport = {
  botId: string;
  version: number;
  sandbox: { image: string; browserProfile: string; network: string[] };
  grants: Grant[];
  budget: { perRun: number; perDay: number; hardStop: boolean; unit: 'THB' };
  trust: Record<string, TrustLevel>;
};

export type Bot = { id: string; accountId: string; name: string; avatar: string; job: string; status: 'active' | 'archived' };

export type Role = 'user' | 'assistant' | 'system' | 'tool';
export type Message = {
  id: string;
  threadId: string;
  role: Role;
  content: string;
  parts?: unknown;
  createdAt: string;
};
export type Thread = { id: string; botId: string; kind: 'main' | 'side' | 'group'; ephemeral: boolean };

export type PlanStep = {
  title: string;
  toolId: string;
  /** Static args; the model fills the rest from earlier outputs when the step starts. */
  args: Record<string, unknown>;
  /** Estimated cost in budget units, reserved before the step runs. */
  estimate: number;
};
export type Plan = { summary: string; steps: PlanStep[] };

export type RunStatus =
  | 'planning'
  | 'awaiting_plan_approval'
  | 'running'
  | 'awaiting_approval'
  | 'paused'
  | 'completed'
  | 'stopped'
  | 'cancelled';

export type Run = {
  id: string;
  botId: string;
  threadId: string;
  parentRunId?: string;
  forkCheckpointId?: string;
  status: RunStatus;
  plan?: Plan;
  /** Index of the next step to execute. */
  cursor: number;
  budgetCap: number;
  stopReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type StepStatus = 'pending' | 'awaiting_approval' | 'running' | 'done' | 'denied' | 'failed' | 'skipped';
export type Step = {
  id: string;
  runId: string;
  idx: number;
  kind: 'plan' | 'tool';
  title: string;
  model?: string;
  toolId?: string;
  /** Resolved arguments, persisted so approvals can be re-checked after a restart. */
  args?: Record<string, unknown>;
  argsHash?: string;
  decision?: Decision;
  level?: TrustLevel;
  reason?: string;
  cost: number;
  status: StepStatus;
  output?: unknown;
};

export type Checkpoint = { id: string; runId: string; stepId: string; messageId?: string; snapshotRef?: string; createdAt: string };

export type ApprovalState = 'pending' | 'escalated' | 'paused' | 'approved' | 'approved_canary' | 'rejected';
export type ApprovalDecision = 'approve' | 'approve_canary' | 'reject';
export type Approval = {
  id: string;
  runId: string;
  stepId: string | null; // null = plan approval
  title: string;
  /** Set for L2 approvals, which cover every call of this task class in the run. */
  taskClass?: string;
  /** Up to three items shown as a preview on the approval card. */
  preview?: string[];
  payloadHash: string;
  state: ApprovalState;
  reversible: Reversible;
  estimate: number;
  createdAt: string;
  escalatedAt?: string;
  pausedAt?: string;
  decidedAt?: string;
  decidedBy?: string;
};

export type AuditEvent = {
  id: string;
  accountId: string;
  actor: string; // "bot:<id>" | "user:<id>" | "system"
  action: string;
  target: string;
  decision?: Decision | ApprovalState;
  payloadHash?: string;
  cost?: number;
  meta?: Record<string, unknown>;
  at: string;
};

export function blastSize(b: Blast): number {
  return b.kind === 'single' ? 1 : b.kind === 'batch' ? b.n : Infinity;
}
