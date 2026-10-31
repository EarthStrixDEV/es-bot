import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { DesktopPage } from '@/components/layout/DesktopPage';
import { Button, Segmented } from '@/components/ui';
import { api, type Bot, type ConnectorView, type ToolDef } from '@/lib/api';
import { cn } from '@/lib/cn';
import { bots } from '@/lib/data';
import { routes } from '@/lib/routes';
import { useLive } from '@/lib/useLive';

type Connector = {
  id: string;
  name: string;
  logo: string; // tile color
  mark?: string; // text on the tile (first-party only)
  badge?: 'first-party' | 'custom';
  usage: string;
  status: { label: string; tone: 'ok' | 'warn' };
  custom?: boolean;
};

const demoConnectors: Connector[] = [
  {
    id: 'es-pos',
    name: 'ES POS',
    logo: '#0A0A0A',
    mark: 'ES',
    badge: 'first-party',
    usage: '8 tools · ใช้ได้กับ POS Ops, Sales Outbound',
    status: { label: 'เชื่อมต่อแล้ว', tone: 'ok' },
  },
  { id: 'line', name: 'LINE OA', logo: '#2F9E44', usage: '4 tools · ใช้ได้กับ Sales Outbound', status: { label: 'เชื่อมต่อแล้ว', tone: 'ok' } },
  { id: 'sheets', name: 'Google Sheets', logo: '#1C7ED6', usage: '6 tools · ใช้ได้กับ 3 Bot', status: { label: 'เชื่อมต่อแล้ว', tone: 'ok' } },
  { id: 'gmail', name: 'Gmail', logo: '#E8590C', usage: 'ยังไม่ให้ Bot ไหนใช้', status: { label: 'ต้อง login ใหม่', tone: 'warn' } },
  { id: 'supabase', name: 'Supabase', logo: '#12B886', usage: '9 tools · ใช้ได้กับ POS Ops', status: { label: 'เชื่อมต่อแล้ว', tone: 'ok' } },
  {
    id: 'discord',
    name: 'Discord MCP',
    logo: '#7048E8',
    badge: 'custom',
    usage: '5 tools · ใช้ได้กับ มินจู · Chief',
    status: { label: 'เชื่อมต่อแล้ว', tone: 'ok' },
    custom: true,
  },
];

const demoBots = [bots.pos, bots.sales];

const demoTools = [
  { id: 'sales.summary', name: 'sales.summary', level: 'read', tone: 'text-ok', on: true },
  { id: 'branch.list', name: 'branch.list', level: 'read', tone: 'text-ok', on: true },
  { id: 'product.update_price', name: 'product.update_price', level: 'write · ต้องอนุมัติ (L1)', tone: 'text-warn-ink', on: true },
  { id: 'bill.void', name: 'bill.void', level: 'destructive · ห้าม (L0)', tone: 'text-danger-ink', on: false },
];

const demoRecent = ['08:00 POS Ops · sales.summary', '10:33 Sales Outbound · branch.list'];

const LOGOS: Record<string, { color: string; mark?: string }> = {
  'es-account': { color: '#0A0A0A', mark: 'ES' },
  'google-sheets': { color: '#1C7ED6' },
  'line-oa': { color: '#2F9E44' },
};

const STATUS: Record<ConnectorView['status'], Connector['status']> = {
  connected: { label: 'เชื่อมต่อแล้ว', tone: 'ok' },
  needs_login: { label: 'ต้อง login ใหม่', tone: 'warn' },
  disabled: { label: 'ตัดการเชื่อมต่อแล้ว', tone: 'warn' },
};

const tabsFor = (count: number) =>
  [
    { value: 'connected', label: `เชื่อมแล้ว · ${count}` },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'custom', label: 'Custom MCP' },
  ] as const;
type Tab = ReturnType<typeof tabsFor>[number]['value'];

const fieldLabel = 'flex flex-col gap-1 text-xs text-muted';
const fieldCls = 'h-10 rounded-[10px] border border-line bg-paper text-[13px] text-ink outline-none focus:border-ink';

function toCard(c: ConnectorView, botNames: Map<string, string>): Connector {
  const logo = LOGOS[c.id] ?? { color: c.transport === 'builtin' ? '#5E6268' : '#7048E8' };
  const custom = !c.firstParty && !LOGOS[c.id];
  const names = c.bots.map((b) => botNames.get(b.botId) ?? b.botId);
  return {
    id: c.id,
    name: c.name,
    logo: logo.color,
    mark: logo.mark,
    badge: c.firstParty ? 'first-party' : custom ? 'custom' : undefined,
    usage: `${c.tools.length} tools · ${names.length ? `ใช้ได้กับ ${names.join(', ')}` : 'ยังไม่ให้ Bot ไหนใช้'}`,
    status: STATUS[c.status],
    custom,
  };
}

function toolLevel(t: ToolDef): { level: string; tone: string } {
  if (t.flagged) return { level: `ตั้งธง · ${t.flagged}`, tone: 'text-danger-ink' };
  if (t.effect === 'pay' || t.effect === 'destroy') return { level: `${t.effect} · ห้าม (L0)`, tone: 'text-danger-ink' };
  if (t.effect === 'read' || t.effect === 'draft') return { level: t.effect, tone: 'text-ok' };
  return { level: `${t.effect} · ${t.reversible === 'no' ? 'ย้อนไม่ได้ · ' : ''}ระดับตาม Passport`, tone: 'text-warn-ink' };
}

const clock = (iso: string) => new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });

function Logo({ c, size }: { c: Connector; size: 32 | 40 }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center font-semibold text-paper',
        size === 32 ? 'h-8 w-8 rounded-[10px] text-[11px]' : 'h-10 w-10 rounded-xl text-xs',
      )}
      style={{ background: c.logo }}
    >
      {c.mark}
    </span>
  );
}

function ConnectorCard({ c, selected, onSelect }: { c: Connector; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'flex shrink grow basis-[260px] cursor-pointer flex-col gap-2 rounded-2xl border-0 bg-paper p-4 text-left',
        selected ? 'shadow-ring-accent' : 'shadow-ring hover:bg-sand',
      )}
    >
      <span className="flex w-full justify-between">
        <span className="flex items-center gap-2.5">
          <Logo c={c} size={32} />
          <span className="font-semibold">{c.name}</span>
        </span>
        {c.badge && (
          <span
            className={cn(
              'self-start rounded-full px-2 py-0.5 text-[11px]',
              c.badge === 'first-party' ? 'bg-accent-soft text-accent-ink' : 'bg-sand',
            )}
          >
            {c.badge}
          </span>
        )}
      </span>
      <span className="text-xs text-muted">{c.usage}</span>
      <span className={cn('text-xs', c.status.tone === 'ok' ? 'text-ok' : 'text-warn-ink')}>{c.status.label}</span>
    </button>
  );
}

/** 09 · MCP Connectors */
export function Connectors() {
  const live = useLive(async () => {
    const [connectors, botList] = await Promise.all([api.connectors(), api.bots()]);
    // The Bot's own Workspace is internal, not something people connect.
    return { connectors: connectors.filter((c) => c.id !== 'workspace'), bots: botList };
  }, []);
  const [tab, setTab] = useState<Tab>('connected');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>();
  const [demoOn, setDemoOn] = useState(() => Object.fromEntries(demoTools.map((t) => [t.id, t.on])));
  const [notice, setNotice] = useState<string>();
  const [addingBot, setAddingBot] = useState(false);
  const [newBot, setNewBot] = useState('');
  const [form, setForm] = useState({ url: '', auth: 'api_key' as 'api_key' | 'none' | 'oauth', apiKey: '' });
  const urlRef = useRef<HTMLInputElement>(null);

  const botMap = new Map<string, Bot>((live.data?.bots ?? []).map((b) => [b.id, b]));
  const botNames = new Map([...botMap].map(([id, b]) => [id, b.name]));
  const views = live.data?.connectors;
  const cards = views ? views.map((c) => toCard(c, botNames)) : demoConnectors;

  const q = query.trim().toLowerCase();
  const toolMatch = (id: string) => views?.find((v) => v.id === id)?.tools.some((t) => t.name.toLowerCase().includes(q));
  const shown = cards
    .filter((c) => (tab === 'custom' ? c.custom : true))
    .filter((c) => !q || c.name.toLowerCase().includes(q) || toolMatch(c.id));
  const selected = cards.find((c) => c.id === selectedId) ?? cards[0];
  const view = views?.find((v) => v.id === selected?.id);

  async function addConnector(e: FormEvent) {
    e.preventDefault();
    if (!views) return setNotice('ยังไม่ได้เชื่อม gateway · รัน npm run dev:server ก่อน');
    if (form.auth === 'oauth') return;
    let name: string;
    try {
      name = new URL(form.url).hostname;
    } catch {
      setNotice('ใส่ Server URL ให้ครบ เช่น https://your-server.example/mcp');
      return;
    }
    const created = await live.act(() => api.addConnector({ name, url: form.url, auth: form.auth as 'api_key' | 'none', apiKey: form.apiKey || undefined }));
    if (created) {
      setForm({ url: '', auth: 'api_key', apiKey: '' });
      setSelectedId(created.id);
      setNotice(`เชื่อม ${created.name} แล้ว · ${created.tools.length} tools ปิดไว้ทั้งหมด รอพี่เปิดทีละตัว`);
    }
  }

  async function test(id: string) {
    const r = await live.act(() => api.testConnector(id));
    if (r) setNotice(r.ok ? `เชื่อมต่อได้ · ${r.tools} tools${r.flagged ? ` · ตั้งธง ${r.flagged}` : ''}` : `เชื่อมต่อไม่ได้: ${r.error}`);
  }

  async function addBot(connectorId: string) {
    if (!newBot) return;
    const tools = view?.tools ?? [];
    // Scope = the strongest effect the connector offers that a grant may hold.
    const scope = ['send', 'write', 'draft', 'read'].find((s) => tools.some((t) => t.effect === s)) ?? 'read';
    const r = await live.act(() => api.grant(newBot, { connectorId, scope, level: scope === 'send' || scope === 'write' ? 'L1' : undefined }));
    if (r) {
      setAddingBot(false);
      setNewBot('');
      setNotice(`ให้ ${botNames.get(newBot)} ใช้ได้แล้ว · scope ${scope}`);
    }
  }

  const tabs = tabsFor(cards.length);
  const authLabel = !view
    ? 'OAuth · token อยู่ใน vault ฝั่ง server'
    : view.transport === 'builtin'
      ? 'ตัวจำลองในเครื่อง · ตั้ง MCP URL ใน .env เพื่อใช้ของจริง'
      : view.authKind === 'api_key'
        ? 'API key · เก็บใน vault ฝั่ง server'
        : view.authKind === 'oauth'
          ? 'OAuth · token อยู่ใน vault ฝั่ง server'
          : 'ไม่ใช้ auth';
  const isDemoDetail = !views && selected?.id === 'es-pos';
  const chipBots = view
    ? view.bots.map((b) => ({ id: b.botId, name: botNames.get(b.botId) ?? b.botId, color: botMap.get(b.botId)?.avatar ?? '#5E6268' }))
    : demoBots.map((b) => ({ id: b.name, name: b.name, color: b.color }));
  // Only Bots with a Passport can hold a grant.
  const otherBots = [...botMap.values()].filter((b) => b.hasPassport && !view?.bots.some((x) => x.botId === b.id));

  return (
    <DesktopPage title="MCP Connectors" direction="row">
      <main className="box-border flex min-w-0 shrink grow-[999] basis-[560px] flex-col gap-5 px-8 pb-10 pt-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Link to={routes.settings} className="text-[13px] no-underline !text-muted hover:!text-ink">
              Settings ›
            </Link>
            <h1 className="m-0 text-[28px] font-medium tracking-[-0.3px]">MCP Connectors</h1>
            <span className="text-muted">เชื่อมแอปครั้งเดียว แล้วเลือกว่า Bot ไหนใช้ tool ไหนได้</span>
          </div>
          <Button variant="primary" className="px-[18px]" onClick={() => urlRef.current?.focus()}>
            + เพิ่ม Custom MCP
          </Button>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <Segmented label="ประเภท connector" options={tabs} value={tab} onChange={setTab} />
          <label className="shrink grow basis-[240px]">
            <span className="sr-only">ค้นหา connector</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหา connector หรือ tool"
              className="box-border h-10 w-full rounded-full border border-line px-4 text-[13px] outline-none focus:border-ink"
            />
          </label>
        </div>

        {(live.error || notice) && (
          <p role="status" className={cn('m-0 text-[13px]', live.error ? 'text-warn-ink' : 'text-ok')}>
            {live.error ?? notice}
          </p>
        )}

        {tab === 'marketplace' ? (
          <div className="flex h-[140px] items-center justify-center rounded-2xl bg-sand text-[13px] text-muted">
            Marketplace ยังไม่เปิด · ตอนนี้เพิ่มได้ทาง Custom MCP
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {shown.map((c) => (
              <ConnectorCard key={c.id} c={c} selected={c.id === selected?.id} onSelect={() => (setSelectedId(c.id), setAddingBot(false))} />
            ))}
            {!shown.length && <span className="text-[13px] text-muted">ไม่พบ connector ที่ตรงกับ "{query}"</span>}
          </div>
        )}

        <form onSubmit={(e) => void addConnector(e)} aria-labelledby="cm" className="flex flex-col gap-3 rounded-[18px] bg-sand p-[18px]">
          <h2 id="cm" className="m-0 text-[15px] font-semibold">
            เพิ่ม Custom MCP
          </h2>
          <div className="flex flex-wrap items-end gap-2.5">
            <label className={cn(fieldLabel, 'shrink grow-[2] basis-[280px]')}>
              Server URL
              <input
                ref={urlRef}
                id="mcp-url"
                type="url"
                required
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://your-server.example/mcp"
                className={cn(fieldCls, 'px-3 font-mono')}
              />
            </label>
            <label className={cn(fieldLabel, 'shrink grow basis-[160px]')}>
              Transport
              <select id="mcp-transport" className={cn(fieldCls, 'px-2.5')}>
                <option>Streamable HTTP</option>
              </select>
            </label>
            <label className={cn(fieldLabel, 'shrink grow basis-[160px]')}>
              Auth
              <select
                id="mcp-auth"
                value={form.auth}
                onChange={(e) => setForm((f) => ({ ...f, auth: e.target.value as typeof f.auth }))}
                className={cn(fieldCls, 'px-2.5')}
              >
                <option value="oauth" disabled>
                  OAuth (เร็วๆ นี้)
                </option>
                <option value="api_key">API key (เก็บใน vault)</option>
                <option value="none">ไม่มี</option>
              </select>
            </label>
            {form.auth === 'api_key' && (
              <label className={cn(fieldLabel, 'shrink grow basis-[200px]')}>
                API key
                <input
                  id="mcp-key"
                  type="password"
                  autoComplete="off"
                  required
                  value={form.apiKey}
                  onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                  className={cn(fieldCls, 'px-3 font-mono')}
                />
              </label>
            )}
            <Button type="submit" variant="primary" disabled={live.busy}>
              เชื่อมต่อ
            </Button>
          </div>
          <span className="text-xs text-muted">
            connector ใหม่เริ่มที่ "ทุก tool ปิด" และยังไม่ให้ Bot ไหนใช้ · ES Bot สแกนคำอธิบาย tool หา prompt injection ก่อนเปิดใช้
          </span>
        </form>
      </main>

      {selected && (
        <aside
          aria-label={`รายละเอียด ${selected.name}`}
          className="box-border flex max-w-[460px] shrink grow basis-[380px] flex-col gap-[18px] border-l border-line px-6 py-7"
        >
          <div className="flex items-center gap-3">
            <Logo c={selected} size={40} />
            <div className="flex flex-col">
              <h2 className="m-0 text-lg font-semibold">{selected.name}</h2>
              <span className="text-xs text-muted">{view || isDemoDetail ? authLabel : selected.usage}</span>
            </div>
          </div>

          {view || isDemoDetail ? (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold">Bot ที่ใช้ได้</span>
                <div className="flex flex-wrap gap-1.5">
                  {chipBots.map((b) => (
                    <span key={b.id} className="flex h-[30px] items-center gap-1.5 rounded-full bg-ink px-3 text-[13px] text-paper">
                      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                      {b.name}
                    </span>
                  ))}
                  {addingBot && view ? (
                    <span className="flex items-center gap-1.5">
                      <label>
                        <span className="sr-only">เลือก Bot</span>
                        <select value={newBot} onChange={(e) => setNewBot(e.target.value)} className="h-[30px] rounded-full border border-line bg-paper px-2 text-[13px]">
                          <option value="">เลือก Bot</option>
                          {otherBots.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Button size="sm" variant="primary" className="h-[30px]" disabled={!newBot || live.busy} onClick={() => void addBot(view.id)}>
                        ให้สิทธิ์
                      </Button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!view || !otherBots.length}
                      onClick={() => setAddingBot(true)}
                      className="flex h-[30px] cursor-pointer items-center rounded-full border-0 bg-chip px-3 text-[13px] hover:bg-line disabled:cursor-default"
                    >
                      + เพิ่ม Bot
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-semibold">Tools</span>
                {(view
                  ? view.tools.map((t) => ({ id: t.id, name: t.name, ...toolLevel(t), on: t.enabled }))
                  : demoTools.map((t) => ({ ...t, on: demoOn[t.id] }))
                ).map((t) => (
                  <label key={t.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5">
                    <span className="flex min-w-0 flex-col">
                      <span className="font-mono text-[13px]">{t.name}</span>
                      <span className={cn('text-xs', t.tone)}>{t.level}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={t.on}
                      disabled={live.busy || view?.status === 'disabled'}
                      onChange={(e) => {
                        const on = e.target.checked;
                        if (view) void live.act(() => api.setTool(t.id, on));
                        else setDemoOn((s) => ({ ...s, [t.id]: on }));
                      }}
                      className="h-5 w-5 shrink-0 cursor-pointer accent-ink"
                    />
                  </label>
                ))}
                <span className="pt-1.5 text-xs text-muted">
                  {view ? `${view.tools.filter((t) => t.enabled).length} จาก ${view.tools.length} tools เปิดอยู่` : '+ อีก 4 tools'} · ระดับ L0–L3 ดึงจาก Bot Passport
                </span>
              </div>

              <div className="flex flex-col gap-1.5 rounded-[14px] bg-sand p-3.5">
                <span className="text-[13px] font-semibold">ใช้งานล่าสุด</span>
                {(view
                  ? view.recent.map((r) => `${clock(r.at)} ${botNames.get(r.actor.replace('bot:', '')) ?? r.actor} · ${r.tool.slice(view.id.length + 1)}`)
                  : demoRecent
                ).map((r, i) => (
                  <span key={i} className="font-mono text-xs">
                    {r}
                  </span>
                ))}
                {view && !view.recent.length && <span className="text-xs text-muted">ยังไม่มี Bot เรียกใช้</span>}
                <Link to={routes.runInspector} className="text-xs">
                  ดูใน audit log
                </Link>
              </div>
            </>
          ) : (
            <div className="flex h-[150px] items-center justify-center rounded-[14px] bg-chip text-xs text-muted">
              [รายละเอียด tools ของ {selected.name}]
            </div>
          )}

          <div className="mt-auto flex flex-wrap gap-2">
            <Button disabled={live.busy} onClick={() => view && void test(view.id)}>
              ทดสอบการเชื่อมต่อ
            </Button>
            <Button
              variant="outline"
              disabled={!!view && (view.status === 'disabled' || live.busy)}
              onClick={() => view && void live.act(() => api.disconnect(view.id)).then((r) => r && setNotice(`ตัดการเชื่อมต่อ ${view.name} แล้ว · ทุก tool ปิด`))}
            >
              ตัดการเชื่อมต่อ
            </Button>
          </div>
        </aside>
      )}
    </DesktopPage>
  );
}
