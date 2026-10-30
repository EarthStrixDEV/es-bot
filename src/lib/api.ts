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
};
export type Run = {
  id: string;
  status: 'planning' | 'awaiting_plan_approval' | 'running' | 'awaiting_approval' | 'paused' | 'completed' | 'stopped' | 'cancelled';
  plan?: { summary: string; steps: { title: string; toolId: string; estimate: number }[] };
  cursor: number;
  stopReason?: string;
};
export type RunView = {
  run: Run;
  steps: Step[];
  approvals: Approval[];
  checkpoints: { id: string; stepId: string; createdAt: string }[];
  budget: { used: number; cap: number };
};
export type ToolDef = { id: string; connectorId: string; name: string; effect: string; reversible: string; enabled: boolean };
export type Passport = {
  botId: string;
  grants: { connectorId: string; scope: string; level?: string; revokedAt?: string }[];
  sandbox: { browserProfile: string };
};
export type ThreadView = { thread: { id: string }; messages: Message[]; runs: RunView[] };

const TOKEN = import.meta.env.VITE_API_TOKEN ?? 'dev-token';

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}`, ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  return body as T;
}

export const api = {
  health: () => call<{ ok: boolean; model: string }>('/api/health'),
  thread: (botId: string) => call<ThreadView>(`/api/bots/${botId}/thread`),
  passport: (botId: string) => call<Passport>(`/api/bots/${botId}/passport`),
  tools: () => call<ToolDef[]>('/api/tools'),
  send: (botId: string, text: string) => call<{ run?: RunView }>(`/api/bots/${botId}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  decide: (approvalId: string, decision: ApprovalDecision) =>
    call<RunView>(`/api/approvals/${approvalId}/decision`, { method: 'POST', body: JSON.stringify({ decision }) }),
};

/** Subscribe to the gateway event stream; returns an unsubscribe function. */
export function subscribe(onEvent: (e: { type: string }) => void): () => void {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/api/events?token=${encodeURIComponent(TOKEN)}`);
  ws.onmessage = (m) => onEvent(JSON.parse(m.data));
  return () => ws.close();
}
