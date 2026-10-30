import { EventEmitter } from 'node:events';
import type { Approval, Message, Run, Step } from './types.js';

/** Events the Session rail and clients subscribe to (step.*, approval.*, message.*, run.*). */
export type HarnessEvent =
  | { type: 'message.created'; message: Message }
  | { type: 'run.updated'; run: Run }
  | { type: 'step.updated'; step: Step }
  | { type: 'approval.created' | 'approval.escalated' | 'approval.paused' | 'approval.decided'; approval: Approval }
  | { type: 'budget.updated'; runId: string; used: number; cap: number };

export class EventBus {
  private emitter = new EventEmitter();
  emit(e: HarnessEvent) {
    this.emitter.emit('event', e);
  }
  subscribe(fn: (e: HarnessEvent) => void): () => void {
    this.emitter.on('event', fn);
    return () => this.emitter.off('event', fn);
  }
}
