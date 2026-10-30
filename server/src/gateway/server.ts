import { timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage } from 'node:http';
import { WebSocketServer } from 'ws';
import type { App } from '../app.js';
import type { ApprovalDecision } from '../domain/types.js';
import { HttpError, RateLimiter, Router, readJson, send } from './http.js';

/** Gateway: auth, rate limit, REST for commands and reads, WebSocket for the event stream. */
export function createGateway(app: App) {
  const { config, store, orchestrator, approvals, conversation, gateway, budget, audit, bus } = app;
  const limiter = new RateLimiter(config.rateLimitPerMinute);
  const router = new Router();

  function authenticate(token: string | null): string {
    const a = Buffer.from(token ?? '');
    const b = Buffer.from(config.authToken);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new HttpError(401, 'unauthorized');
    return config.ownerId;
  }

  function bearer(req: IncomingMessage) {
    const h = req.headers.authorization ?? '';
    return h.startsWith('Bearer ') ? h.slice(7) : null;
  }

  const runView = (id: string) => {
    const run = orchestrator.run(id);
    if (!run) throw new HttpError(404, 'run not found');
    return {
      run,
      steps: orchestrator.steps(id),
      approvals: store.approvals.list({ runId: id }),
      checkpoints: store.checkpoints.list({ runId: id }),
      budget: { used: budget.used(id), cap: run.budgetCap },
    };
  };

  router
    .on('GET', '/api/health', () => ({ ok: true, model: app.model.name, notifier: config.line ? 'line' : 'memory' }))
    .on('GET', '/api/bots', () => store.bots.list())
    .on('GET', '/api/bots/:id/passport', ({ params }) => orchestrator.passport(params.id))
    .on('GET', '/api/bots/:id/thread', ({ params }) => {
      const thread = conversation.mainThread(params.id);
      const runs = store.runs.list({ threadId: thread.id });
      return { thread, messages: conversation.messages(thread.id), runs: runs.map((r) => runView(r.id)) };
    })
    .on('POST', '/api/bots/:id/messages', async ({ params, body, userId }) => {
      const text = typeof body?.text === 'string' ? body.text.trim() : '';
      if (!text || text.length > 4000) throw new HttpError(400, 'text is required (≤ 4000 chars)');
      if (!store.bots.get(params.id)) throw new HttpError(404, 'bot not found');
      const { message, run } = await orchestrator.handleUserMessage(params.id, text, userId);
      return { message, run: run ? runView(run.id) : undefined };
    })
    .on('GET', '/api/runs/:id', ({ params }) => runView(params.id))
    .on('GET', '/api/approvals', ({ query }) => (query.get('state') === 'open' ? approvals.open() : store.approvals.list()))
    .on('POST', '/api/approvals/:id/decision', async ({ params, body, userId }) => {
      const decision = body?.decision as ApprovalDecision;
      if (!['approve', 'approve_canary', 'reject'].includes(decision)) throw new HttpError(400, 'decision must be approve | approve_canary | reject');
      try {
        const approval = approvals.decide(params.id, decision, userId);
        await orchestrator.advance(approval.runId);
        return runView(approval.runId);
      } catch (err) {
        throw new HttpError(409, String((err as Error).message));
      }
    })
    .on('GET', '/api/connectors', () => store.connectors.list().map(({ secretRef, ...c }) => ({ ...c, hasSecret: Boolean(secretRef) })))
    .on('GET', '/api/tools', () => gateway.tools())
    .on('POST', '/api/tools/:id/enable', ({ params, body, userId }) => gateway.enableTool(params.id, userId, body ?? undefined))
    .on('GET', '/api/audit', ({ query }) => audit.list({ target: query.get('target') ?? undefined }).slice(-500));

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    try {
      if (url.pathname === '/api/health') return send(res, 200, await router.match('GET', url.pathname)!.handler({} as never));
      const userId = authenticate(bearer(req));
      if (!limiter.take(userId)) throw new HttpError(429, 'rate limited');
      const route = router.match(req.method ?? 'GET', url.pathname);
      if (!route) throw new HttpError(404, 'not found');
      const body = req.method === 'POST' ? await readJson(req) : undefined;
      send(res, 200, await route.handler({ req, params: route.params, query: url.searchParams, body, userId }));
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      send(res, status, { error: status === 500 ? 'internal error' : (err as Error).message });
    }
  });

  // Event stream for the Session rail. Auth with ?token= (browsers can't set WS headers).
  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    try {
      if (url.pathname !== '/api/events') throw new HttpError(404, 'not found');
      authenticate(url.searchParams.get('token'));
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      const off = bus.subscribe((e) => ws.readyState === ws.OPEN && ws.send(JSON.stringify(e)));
      ws.on('close', off);
    });
  });

  return server;
}
