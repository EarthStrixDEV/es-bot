// Client for the ES Bot gateway (server/). Types mirror server/src/domain/types.ts.

export type Decision = 'allow' | 'allow_and_report' | 'ask' | 'deny';
export type ApprovalState = 'pending' | 'escalated' | 'paused' | 'approved' | 'approved_canary' | 'rejected';
export type ApprovalDecision = 'approve' | 'approve_canary' | 'reject';

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  parts?: { kind: 'plan' | 'progress' | 'approval' | 'result'; runId: string; approvalId?: string; stepId?: string };
  createdAt: string;
};
export type Step = {
  id: string;
  idx: number;
  title: string;
  toolId?: string;
  decision?: Decision;
  level?: string;
  reason?: string;
  status: 'pending' | 'awaiting_approval' | 'running' | 'done' | 'denied' | 'failed' | 'skipped';
  cost: number;
  model?: string;
  args?: Record<string, unknown>;
  argsHash?: string;
  output?: unknown;
};
export type Approval = {
  id: string;
  stepId: string | null;
  title: string;
  state: ApprovalState;
  reversible: 'yes' | 'no' | 'partial';
  estimate: number;
  preview?: string[];
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  payloadHash?: string;
};
export type Run = {
  id: string;
  botId: string;
  status: 'planning' | 'awaiting_plan_approval' | 'running' | 'awaiting_approval' | 'paused' | 'completed' | 'stopped' | 'cancelled';
  plan?: { summary: string; steps: { title: string; toolId: string; estimate: number }[] };
  cursor: number;
  stopReason?: string;
  createdAt: string;
  updatedAt: string;
};
export type RunView = {
  run: Run;
  request?: string;
  steps: Step[];
  approvals: Approval[];
  checkpoints: { id: string; stepId: string; createdAt: string }[];
  budget: { used: number; cap: number };
};
export type ToolDef = {
  id: string;
  connectorId: string;
  name: string;
  description: string;
  effect: string;
  reversible: string;
  taskClass: string;
  enabled: boolean;
  flagged?: string;
};
export type TrustLevel = 'L0' | 'L1' | 'L2' | 'L3';
export type Grant = { connectorId: string; scope: string; level?: TrustLevel; resources?: string[]; revokedAt?: string };
export type Passport = {
  botId: string;
  version: number;
  grants: Grant[];
  sandbox: { image: string; browserProfile: string; network: string[] };
  budget: { perRun: number; perDay: number; hardStop: boolean; unit: string };
  trust: Record<string, TrustLevel>;
};
export type PassportPatch = { trust?: Record<string, TrustLevel>; budget?: { perRun?: number; perDay?: number } };
export type DryRunRow = {
  toolId: string;
  connectorId: string;
  effect: string;
  current: { decision: Decision; level?: TrustLevel; reason: string };
  proposed: { decision: Decision; level?: TrustLevel; reason: string };
  changed: boolean;
};
export type Credential = { connectorId: string; name: string; status: string; grant?: Grant; lastUsed?: string };
export type ConnectorView = {
  id: string;
  name: string;
  url: string;
  transport: 'streamable-http' | 'builtin';
  authKind: 'oauth' | 'api_key' | 'none';
  status: 'connected' | 'needs_login' | 'disabled';
  firstParty: boolean;
  hasSecret: boolean;
  tools: ToolDef[];
  bots: { botId: string; scope: string; level?: TrustLevel }[];
  recent: { at: string; actor: string; tool: string }[];
};
export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  decision?: string;
  payloadHash?: string;
  cost?: number;
  meta?: Record<string, unknown>;
  at: string;
};
export type RunSummary = { id: string; botId: string; status: Run['status']; title?: string; createdAt: string };
export type ThreadView = { thread: { id: string }; messages: Message[]; runs: RunView[] };
export type Bot = { id: string; name: string; avatar: string; job: string; status: string; hasPassport?: boolean };

const TOKEN = import.meta.env.VITE_API_TOKEN ?? 'dev-token';

/** Thrown when no gateway is reachable, so screens fall back to the design's demo state. */
export class OfflineError extends Error {
  constructor() {
    super('offline');
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (import.meta.env.VITE_PREVIEW) throw new OfflineError();
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}`, ...init.headers },
    });
  } catch {
    throw new OfflineError();
  }
  const body = await res.json().catch(() => undefined);
  // The gateway always answers JSON; anything else is the dev proxy saying it isn't running.
  if (body === undefined && !res.ok) throw new OfflineError();
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  return body as T;
}

export const api = {
  health: () => call<{ ok: boolean; model: string }>('/api/health'),
  bots: () => call<Bot[]>('/api/bots'),
  thread: (botId: string) => call<ThreadView>(`/api/bots/${botId}/thread`),
  passport: (botId: string) => call<Passport>(`/api/bots/${botId}/passport`),
  tools: () => call<ToolDef[]>('/api/tools'),
  send: (botId: string, text: string) => call<{ run?: RunView }>(`/api/bots/${botId}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  decide: (approvalId: string, decision: ApprovalDecision) =>
    call<RunView>(`/api/approvals/${approvalId}/decision`, { method: 'POST', body: JSON.stringify({ decision }) }),

  savePassport: (botId: string, patch: PassportPatch) => post<Passport>(`/api/bots/${botId}/passport`, patch),
  dryRun: (botId: string, patch: PassportPatch) => post<DryRunRow[]>(`/api/bots/${botId}/passport/dry-run`, patch),
  credentials: (botId: string) => call<Credential[]>(`/api/bots/${botId}/credentials`),
  grant: (botId: string, g: { connectorId: string; scope: string; level?: TrustLevel }) => post<Passport>(`/api/bots/${botId}/grants`, g),
  revoke: (botId: string, connectorId: string) => post<Passport>(`/api/bots/${botId}/grants/${connectorId}/revoke`),

  connectors: () => call<ConnectorView[]>('/api/connectors'),
  addConnector: (c: { name: string; url: string; auth: 'api_key' | 'none'; apiKey?: string }) => post<ConnectorView>('/api/connectors', c),
  testConnector: (id: string) => post<{ ok: boolean; tools: number; flagged: number; error?: string }>(`/api/connectors/${id}/test`),
  disconnect: (id: string) => post<ConnectorView>(`/api/connectors/${id}/disconnect`),
  setTool: (id: string, on: boolean) => post<ToolDef>(`/api/tools/${id}/${on ? 'enable' : 'disable'}`),

  runs: () => call<RunSummary[]>('/api/runs'),
  run: (id: string) => call<RunView>(`/api/runs/${id}`),
  runAudit: (id: string) => call<AuditEvent[]>(`/api/runs/${id}/audit`),
};

function post<T>(path: string, body?: unknown) {
  return call<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
}

/** Subscribe to the gateway event stream; returns an unsubscribe function. */
export function subscribe(onEvent: (e: { type: string }) => void): () => void {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/api/events?token=${encodeURIComponent(TOKEN)}`);
  ws.onmessage = (m) => onEvent(JSON.parse(m.data));
  return () => ws.close();
}
