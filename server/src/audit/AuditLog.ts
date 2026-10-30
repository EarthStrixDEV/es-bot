import type { Clock } from '../domain/clock.js';
import { newId } from '../domain/ids.js';
import type { AuditEvent } from '../domain/types.js';
import type { Store } from '../store/Store.js';

/** Append-only record of every decision and side effect. There is no edit or delete. */
export class AuditLog {
  constructor(private store: Store, private clock: Clock, private accountId: string) {}

  record(e: Omit<AuditEvent, 'id' | 'at' | 'accountId'>): AuditEvent {
    return this.store.audit.append({ ...e, id: newId('aud'), accountId: this.accountId, at: this.clock.now().toISOString() });
  }

  list(filter?: { target?: string; actor?: string }): AuditEvent[] {
    return this.store.audit.list(filter);
  }
}
