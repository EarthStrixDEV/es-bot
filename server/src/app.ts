import { ApprovalService } from './approval/ApprovalService.js';
import { AuditLog } from './audit/AuditLog.js';
import { BudgetMeter } from './budget/BudgetMeter.js';
import type { Config } from './config.js';
import { ConnectorGateway } from './connectors/ConnectorGateway.js';
import type { ConnectorClient } from './connectors/Connector.js';
import { McpClient } from './connectors/McpClient.js';
import { esAccountCrm, googleSheets, lineOa } from './connectors/mocks/builtins.js';
import { workspace } from './connectors/mocks/workspace.js';
import { ConversationService } from './conversation/ConversationService.js';
import { CredentialBroker } from './credentials/CredentialBroker.js';
import { systemClock, type Clock } from './domain/clock.js';
import { EventBus } from './domain/events.js';
import type { Passport } from './domain/types.js';
import { MockModel } from './models/MockModel.js';
import type { ModelClient } from './models/ModelClient.js';
import { OpenRouterModel } from './models/OpenRouterModel.js';
import { LineNotifier, MemoryNotifier, type Notifier } from './notifier/Notifier.js';
import { Orchestrator } from './orchestrator/Orchestrator.js';
import { createSqliteStore } from './store/SqliteStore.js';
import type { ConnectorRow, Store } from './store/Store.js';

export type App = Awaited<ReturnType<typeof createApp>>;

/** Composition root: wires the phase-1 modules together. Tests pass their own clock, store and fakes. */
export async function createApp(
  config: Config,
  overrides: { clock?: Clock; store?: Store; notifier?: Notifier; model?: ModelClient; lineOutbox?: unknown[] } = {},
) {
  const clock = overrides.clock ?? systemClock;
  const store = overrides.store ?? createSqliteStore(config.dataPath);
  const bus = new EventBus();
  const audit = new AuditLog(store, clock, config.accountId);
  const notifier = overrides.notifier ?? (config.line ? new LineNotifier(config.line.token, config.line.userId) : new MemoryNotifier());
  const model =
    overrides.model ?? (config.openrouter ? new OpenRouterModel({ ...config.openrouter, appUrl: config.appUrl }) : new MockModel());
  const broker = new CredentialBroker(store, clock, config.masterKey);
  const budget = new BudgetMeter(store, bus);
  const gateway = new ConnectorGateway(store, broker, audit, {
    hardDeny: { effects: ['pay', 'destroy'], toolIds: [] },
    blastThreshold: config.blastThreshold,
  });
  const approvals = new ApprovalService(store, bus, clock, notifier, audit, config.appUrl);
  const conversation = new ConversationService(store, bus, clock);
  const orchestrator = new Orchestrator(store, bus, clock, conversation, gateway, approvals, budget, audit, model);

  await seed({ config, store, gateway, broker, model, lineOutbox: overrides.lineOutbox });

  return { config, clock, store, bus, audit, notifier, model, broker, budget, gateway, approvals, conversation, orchestrator };
}

/** First-run data: the account's bots, Sales Outbound's Passport and the three MVP connectors. */
async function seed(ctx: { config: Config; store: Store; gateway: ConnectorGateway; broker: CredentialBroker; model: ModelClient; lineOutbox?: unknown[] }) {
  const { config, store, gateway, broker } = ctx;
  const accountId = config.accountId;

  const bots = [
    { id: 'sales-outbound', name: 'Sales Outbound', avatar: '#E8590C', job: 'หาลูกค้าใหม่ให้ ES POS' },
    { id: 'chief', name: 'มินจู · Chief', avatar: '#7048E8', job: 'สรุปงานและประสานทีม' },
    { id: 'pos-ops', name: 'POS Ops', avatar: '#1C7ED6', job: 'ดูแลยอดขายสาขา' },
    { id: 'content-factory', name: 'Content Factory', avatar: '#2F9E44', job: 'ทำคอนเทนต์และภาพ' },
  ];
  for (const b of bots) if (!store.bots.get(b.id)) store.bots.put({ ...b, accountId, status: 'active' });

  if (!store.passports.get('sales-outbound')) {
    const passport: Passport = {
      botId: 'sales-outbound',
      version: 1,
      sandbox: { image: 'es-base:2026.10', browserProfile: 'sales-only', network: ['*.line.me', 'docs.google.com'] },
      grants: [
        { connectorId: 'google-sheets', scope: 'read', resources: ['sheet:leads-chonburi'] },
        { connectorId: 'es-account', scope: 'read' },
        { connectorId: 'workspace', scope: 'draft' },
        { connectorId: 'line-oa', scope: 'send', level: 'L1' },
      ],
      budget: { perRun: config.budgetPerRun, perDay: config.budgetPerDay, hardStop: true, unit: 'THB' },
      trust: { read: 'L3', draft: 'L3', crm_write: 'L2', send: 'L1', pay: 'L0', destroy: 'L0' },
    };
    store.passports.put({ ...passport, id: passport.botId });
  }

  const connectors: { row: Omit<ConnectorRow, 'accountId' | 'secretRef' | 'transport' | 'url'>; mock: () => ConnectorClient }[] = [
    { row: { id: 'google-sheets', name: 'Google Sheets', authKind: 'oauth', status: 'connected', firstParty: false }, mock: googleSheets },
    { row: { id: 'es-account', name: 'ES Account · CRM', authKind: 'oauth', status: 'connected', firstParty: true }, mock: esAccountCrm },
    { row: { id: 'line-oa', name: 'LINE OA', authKind: 'api_key', status: 'connected', firstParty: false }, mock: () => lineOa(ctx.lineOutbox) },
  ];
  for (const c of connectors) {
    const real = config.mcp[c.row.id];
    const existing = store.connectors.get(c.row.id);
    const secretRef = existing?.secretRef ?? (real?.secret ? broker.put(real.secret) : undefined);
    const row: ConnectorRow = { ...c.row, accountId, url: real?.url ?? `builtin://${c.row.id}`, transport: real ? 'streamable-http' : 'builtin', secretRef };
    const client = real ? new McpClient(real.url, real.secret) : c.mock();
    // Builtins ship with confirmed metadata; real MCP tools wait for a person in the Connectors screen.
    await gateway.register(row, client, { autoEnable: !real });
  }
  await gateway.register(
    { id: 'workspace', accountId, name: 'Workspace', url: 'builtin://workspace', transport: 'builtin', authKind: 'none', status: 'connected', firstParty: true },
    workspace(ctx.model),
    { autoEnable: true },
  );
}
