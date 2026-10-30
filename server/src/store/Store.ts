import type {
  Approval,
  AuditEvent,
  Bot,
  Checkpoint,
  Message,
  Passport,
  Run,
  Step,
  Thread,
  ToolDef,
} from '../domain/types.js';

/** A keyed collection. Rows come back in insertion order. */
export interface Collection<T extends { id: string }> {
  get(id: string): T | undefined;
  put(row: T): T;
  list(where?: Partial<T>): T[];
}

/** Insert-only collection: there is deliberately no update or delete. */
export interface AppendOnly<T extends { id: string }> {
  append(row: T): T;
  list(where?: Partial<T>): T[];
}

export type ConnectorRow = {
  id: string;
  accountId: string;
  name: string;
  url: string;
  transport: 'streamable-http' | 'builtin';
  authKind: 'oauth' | 'api_key' | 'none';
  secretRef?: string;
  status: 'connected' | 'needs_login' | 'disabled';
  firstParty: boolean;
};

export type SecretRow = { id: string; ciphertext: string; iv: string; tag: string };
export type UsageRow = { id: string; runId: string; stepId: string; reserved: number; committed: number; unit: 'THB'; state: 'reserved' | 'committed' | 'released' };
export type PassportRow = Passport & { id: string };

/** Persistence port. Every module owns its own collections and never reads another's directly. */
export interface Store {
  bots: Collection<Bot>;
  passports: Collection<PassportRow>; // id = botId (current version)
  connectors: Collection<ConnectorRow>;
  tools: Collection<ToolDef>;
  secrets: Collection<SecretRow>;
  threads: Collection<Thread>;
  messages: Collection<Message>;
  runs: Collection<Run>;
  steps: Collection<Step>;
  checkpoints: Collection<Checkpoint>;
  approvals: Collection<Approval>;
  usage: Collection<UsageRow>;
  audit: AppendOnly<AuditEvent>;
  close(): void;
}

export function matches<T>(row: T, where?: Partial<T>): boolean {
  if (!where) return true;
  return Object.entries(where).every(([k, v]) => v === undefined || (row as Record<string, unknown>)[k] === v);
}
