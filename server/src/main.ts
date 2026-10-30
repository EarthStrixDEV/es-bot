import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createGateway } from './gateway/server.js';

const config = loadConfig();
if (config.dataPath !== ':memory:') mkdirSync(dirname(config.dataPath), { recursive: true });

const app = await createApp(config);
await app.orchestrator.resumeAll();

// Approval timers: escalate at 30 min, pause at 2 h.
setInterval(() => void app.approvals.tick().catch((e) => console.error('approval tick', e)), 30_000);

createGateway(app).listen(config.port, () => {
  console.log(`ES Bot gateway on :${config.port} · model=${app.model.name} · notifier=${config.line ? 'LINE' : 'memory'}`);
});
