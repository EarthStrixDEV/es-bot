import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { ManualClock } from '../src/domain/clock.js';
import { MemoryNotifier } from '../src/notifier/Notifier.js';
import { createSqliteStore } from '../src/store/SqliteStore.js';

export const OUTREACH = 'ดึงร้านอาหารในชลบุรีจาก Google Sheet แล้วร่างข้อความ LINE OA แนะนำ ES POS Lite ส่งให้ร้านที่ยังไม่เคยติดต่อ';

export async function testApp(env: Record<string, string> = {}) {
  const clock = new ManualClock();
  const notifier = new MemoryNotifier();
  const lineOutbox: { to: string; text: string }[] = [];
  const store = createSqliteStore(':memory:');
  const app = await createApp(loadConfig({ DATA_PATH: ':memory:', ...env }), { clock, notifier, store, lineOutbox });
  return { app, clock, notifier, lineOutbox, store };
}
