export type Notification = { title: string; body: string; url?: string };

/** Outbound channel for escalations (LINE, Telegram, push). */
export interface Notifier {
  send(n: Notification): Promise<void>;
}

/** Development notifier: keeps what would have been sent. */
export class MemoryNotifier implements Notifier {
  sent: Notification[] = [];
  async send(n: Notification) {
    this.sent.push(n);
    console.log(`[notify] ${n.title} — ${n.body.replace(/\n/g, ' · ')}`);
  }
}

/** LINE Messaging API push message to one user (the account owner). */
export class LineNotifier implements Notifier {
  constructor(private channelToken: string, private toUserId: string, private fetchImpl: typeof fetch = fetch) {}

  async send(n: Notification) {
    const text = [n.title, n.body, n.url].filter(Boolean).join('\n');
    const res = await this.fetchImpl('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.channelToken}` },
      body: JSON.stringify({ to: this.toUserId, messages: [{ type: 'text', text: text.slice(0, 5000) }] }),
    });
    if (!res.ok) throw new Error(`LINE push ล้มเหลว: ${res.status} ${await res.text()}`);
  }
}
