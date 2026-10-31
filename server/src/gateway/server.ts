import { timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage } from 'node:http';
import { WebSocketServer } from 'ws';
import type { App } from '../app.js';
import { McpClient } from '../connectors/McpClient.js';
import { newId } from '../domain/ids.js';
import { EFFECTS, type ApprovalDecision, type AuditEvent, type Effect, type Reversible, type TrustLevel } from '../domain/types.js';
import { PassportError, type PassportPatch } from '../passport/PassportService.js';
import { HttpError, RateLimiter, Router, readJson, send } from './http.js';

/** Gateway: auth, rate limit, REST for commands and reads, WebSocket for the event stream. */
export function createGateway(app: App) {
  const { config, store, orchestrator, approvals, conversation, gateway, budget, audit, bus, passports, broker } = app;
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
    // The request that started the run: the last user message before it was created.
    const request = conversation
      .messages(run.threadId)
      .filter((m) => m.role === 'user' && m.createdAt <= run.createdAt)
      .at(-1)?.content;
    return {
      run,
      request,
      steps: orchestrator.steps(id),
      approvals: store.approvals.list({ runId: id }),
      checkpoints: store.checkpoints.list({ runId: id }),
      budget: { used: budget.used(id), cap: run.budgetCap },
    };
  };

  /** Every audit event that belongs to a run: its own, its steps', its approvals' and tool calls tagged with it. */
  const runAudit = (id: string): AuditEvent[] => {
    const ids = new Set([id, ...orchestrator.steps(id).map((s) => s.id), ...store.approvals.list({ runId: id }).map((a) => a.id)]);
    return audit.list().filter((e) => ids.has(e.target) || e.meta?.runId === id);
  };

  const lastUse = (prefix: string, botId?: string) =>
    audit
      .list()
      .filter((e) => e.action === 'tool.call' && e.target.startsWith(prefix) && (!botId || e.actor === `bot:${botId}`))
      .at(-1)?.at;

  /** Translate the Passport module's validation errors into 400s. */
  const passportCall = <T>(fn: () => T): T => {
    try {
      return fn();
    } catch (err) {
      if (err instanceof PassportError) throw new HttpError(400, err.message);
      throw err;
    }
  };

  const parsePatch = (body: any): PassportPatch => {
    const patch: PassportPatch = {};
    if (body?.trust && typeof body.trust === 'object') patch.trust = body.trust as Record<string, TrustLevel>;
    if (body?.budget && typeof body.budget === 'object') {
      patch.budget = {};
      for (const k of ['perRun', 'perDay'] as const) if (body.budget[k] !== undefined) patch.budget[k] = Number(body.budget[k]);
    }
    return patch;
  };

  const connectorView = (id: string) => {
    const row = store.connectors.get(id);
    if (!row) throw new HttpError(404, 'connector not found');
    const { secretRef, ...rest } = row;
    const tools = gateway.tools().filter((t) => t.connectorId === id);
    return {
      ...rest,
      hasSecret: Boolean(secretRef),
      tools,
      bots: passports.botsWithAccess(id),
      recent: audit
        .list()
        .filter((e) => e.action === 'tool.call' && e.target.startsWith(`${id}.`))
        .slice(-5)
        .reverse()
        .map((e) => ({ at: e.at, actor: e.actor, tool: e.target })),
    };
  };

  router
    .on('GET', '/api/health', () => ({ ok: true, model: app.model.name, notifier: config.line ? 'line' : 'memory' }))
    .on('GET', '/api/bots', () => store.bots.list().map((b) => ({ ...b, hasPassport: Boolean(store.passports.get(b.id)) })))
    .on('GET', '/api/bots/:id/passport', ({ params }) => passportCall(() => passports.get(params.id)))
    .on('GET', '/api/bots/:id/passport/versions', ({ params }) => passports.versions(params.id))
    .on('POST', '/api/bots/:id/passport', ({ params, body, userId }) => passportCall(() => passports.update(params.id, parsePatch(body), userId)))
    .on('POST', '/api/bots/:id/passport/dry-run', ({ params, body }) => passportCall(() => passports.dryRun(params.id, parsePatch(body))))
    .on('GET', '/api/bots/:id/credentials', ({ params }) => {
      const p = passportCall(() => passports.get(params.id));
      return store.connectors.list().map((c) => {
        const grant = p.grants.find((g) => g.connectorId === c.id && !g.revokedAt);
        return { connectorId: c.id, name: c.name, status: c.status, grant, lastUsed: grant ? lastUse(`${c.id}.`, params.id) : undefined };
      });
    })
    .on('POST', '/api/bots/:id/grants', ({ params, body, userId }) => {
      const scope = body?.scope as Effect;
      const level = body?.level as TrustLevel | undefined;
      if (typeof body?.connectorId !== 'string' || !EFFECTS.includes(scope)) throw new HttpError(400, 'connectorId and scope are required');
      return passportCall(() => passports.grant(params.id, { connectorId: body.connectorId, scope, level }, userId));
    })
    .on('POST', '/api/bots/:id/grants/:connectorId/revoke', ({ params, userId }) =>
      passportCall(() => passports.revoke(params.id, params.connectorId, userId)),
    )
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
    .on('GET', '/api/runs', ({ query }) =>
      store.runs
        .list({ botId: query.get('botId') ?? undefined })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((r) => ({ id: r.id, botId: r.botId, status: r.status, title: r.plan?.summary, createdAt: r.createdAt })),
    )
    .on('GET', '/api/runs/:id', ({ params }) => runView(params.id))
    .on('GET', '/api/runs/:id/audit', ({ params }) => {
      runView(params.id); // 404 for unknown runs
      return runAudit(params.id);
    })
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
    .on('GET', '/api/connectors', () => store.connectors.list().map((c) => connectorView(c.id)))
    .on('GET', '/api/connectors/:id', ({ params }) => connectorView(params.id))
    .on('POST', '/api/connectors', async ({ body, userId }) => {
      const name = typeof body?.name === 'string' ? body.name.trim() : '';
      const auth = body?.auth as 'api_key' | 'none';
      let url: URL;
      try {
        url = new URL(String(body?.url ?? ''));
      } catch {
        throw new HttpError(400, 'Server URL ไม่ถูกต้อง');
      }
      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
        throw new HttpError(400, 'ต้องเป็น https (http ได้เฉพาะ localhost)');
      }
      if (!name || name.length > 60) throw new HttpError(400, 'ต้องมีชื่อ connector (≤ 60 ตัวอักษร)');
      if (!['api_key', 'none'].includes(auth)) throw new HttpError(400, 'auth ต้องเป็น api_key หรือ none (OAuth ยังไม่รองรับ)');
      if (auth === 'api_key' && !body?.apiKey) throw new HttpError(400, 'ต้องใส่ API key');
      const secretRef = auth === 'api_key' ? broker.put(String(body.apiKey)) : undefined;
      const id = newId('mcp');
      const client = new McpClient(url.toString(), () => (secretRef ? broker.reveal(secretRef) : ''));
      try {
        await gateway.register(
          { id, accountId: config.accountId, name, url: url.toString(), transport: 'streamable-http', authKind: auth, secretRef, status: 'connected', firstParty: false },
          client,
        );
      } catch (err) {
        store.connectors.put({ id, accountId: config.accountId, name, url: url.toString(), transport: 'streamable-http', authKind: auth, secretRef, status: 'disabled', firstParty: false });
        throw new HttpError(502, `เชื่อมต่อไม่สำเร็จ: ${(err as Error).message}`);
      }
      audit.record({ actor: userId, action: 'connector.create', target: id, meta: { name, url: url.toString() } });
      bus.emit({ type: 'connector.updated', connectorId: id });
      return connectorView(id);
    })
    .on('POST', '/api/connectors/:id/test', async ({ params, userId }) => {
      connectorView(params.id);
      const result = await gateway.test(params.id, userId);
      bus.emit({ type: 'connector.updated', connectorId: params.id });
      return { ...result, connector: connectorView(params.id) };
    })
    .on('POST', '/api/connectors/:id/disconnect', ({ params, userId }) => {
      connectorView(params.id);
      gateway.disconnect(params.id, userId);
      bus.emit({ type: 'connector.updated', connectorId: params.id });
      return connectorView(params.id);
    })
    .on('GET', '/api/tools', () => gateway.tools())
    .on('POST', '/api/tools/:id/enable', ({ params, body, userId }) => {
      // Only classification fields may be confirmed alongside enabling.
      const meta: { effect?: Effect; reversible?: Reversible; taskClass?: string } = {};
      if (body?.effect !== undefined) {
        if (!EFFECTS.includes(body.effect)) throw new HttpError(400, 'effect ไม่ถูกต้อง');
        meta.effect = body.effect;
      }
      if (body?.reversible !== undefined) {
        if (!['yes', 'no', 'partial'].includes(body.reversible)) throw new HttpError(400, 'reversible ไม่ถูกต้อง');
        meta.reversible = body.reversible;
      }
      if (typeof body?.taskClass === 'string' && /^[a-z_]{1,32}$/.test(body.taskClass)) meta.taskClass = body.taskClass;
      try {
        const tool = gateway.enableTool(params.id, userId, meta);
        bus.emit({ type: 'tool.updated', tool });
        return tool;
      } catch (err) {
        throw new HttpError(409, (err as Error).message);
      }
    })
    .on('POST', '/api/tools/:id/disable', ({ params, userId }) => {
      try {
        const tool = gateway.disableTool(params.id, userId);
        bus.emit({ type: 'tool.updated', tool });
        return tool;
      } catch (err) {
        throw new HttpError(404, (err as Error).message);
      }
    })
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
