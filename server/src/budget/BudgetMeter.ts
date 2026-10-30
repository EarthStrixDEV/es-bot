import type { EventBus } from '../domain/events.js';
import { newId } from '../domain/ids.js';
import type { Store, UsageRow } from '../store/Store.js';

/**
 * Real-time spend per run. A step reserves its estimate before it runs and commits the
 * actual cost after; a reservation that would cross the cap fails and the run stops.
 */
export class BudgetMeter {
  constructor(private store: Store, private bus: EventBus) {}

  used(runId: string): number {
    return this.store.usage
      .list({ runId })
      .reduce((sum, u) => sum + (u.state === 'committed' ? u.committed : u.state === 'reserved' ? u.reserved : 0), 0);
  }

  /** Returns the reservation id, or null when the cap would be exceeded. */
  reserve(runId: string, stepId: string, amount: number, cap: number): string | null {
    if (this.used(runId) + amount > cap) return null;
    const row: UsageRow = { id: newId('use'), runId, stepId, reserved: amount, committed: 0, unit: 'THB', state: 'reserved' };
    this.store.usage.put(row);
    this.publish(runId, cap);
    return row.id;
  }

  commit(reservationId: string, actual: number, cap: number) {
    const row = this.store.usage.get(reservationId);
    if (!row || row.state !== 'reserved') return;
    this.store.usage.put({ ...row, committed: actual, state: 'committed' });
    this.publish(row.runId, cap);
  }

  release(reservationId: string, cap: number) {
    const row = this.store.usage.get(reservationId);
    if (!row || row.state !== 'reserved') return;
    this.store.usage.put({ ...row, state: 'released' });
    this.publish(row.runId, cap);
  }

  private publish(runId: string, cap: number) {
    this.bus.emit({ type: 'budget.updated', runId, used: this.used(runId), cap });
  }
}
