import type { Clock } from '../domain/clock.js';
import type { EventBus } from '../domain/events.js';
import { newId } from '../domain/ids.js';
import type { Message, Role, Thread } from '../domain/types.js';
import type { Store } from '../store/Store.js';

/** Threads and messages. Phase 1 has the main thread per Bot; side/group threads come in phase 3 and 5. */
export class ConversationService {
  constructor(private store: Store, private bus: EventBus, private clock: Clock) {}

  mainThread(botId: string): Thread {
    const existing = this.store.threads.list({ botId, kind: 'main' })[0];
    return existing ?? this.store.threads.put({ id: newId('thr'), botId, kind: 'main', ephemeral: false });
  }

  thread(id: string) {
    return this.store.threads.get(id);
  }

  post(threadId: string, role: Role, content: string, parts?: unknown): Message {
    const message: Message = { id: newId('msg'), threadId, role, content, parts, createdAt: this.clock.now().toISOString() };
    this.store.messages.put(message);
    this.bus.emit({ type: 'message.created', message });
    return message;
  }

  messages(threadId: string): Message[] {
    return this.store.messages.list({ threadId });
  }

  last(threadId: string): Message | undefined {
    return this.messages(threadId).at(-1);
  }
}
