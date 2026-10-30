import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DesktopPage } from '@/components/layout/DesktopPage';
import { Button, Segmented } from '@/components/ui';
import { cn } from '@/lib/cn';
import { bots } from '@/lib/data';
import { routes } from '@/lib/routes';

type Connector = {
  id: string;
  name: string;
  logo: string; // tile color
  mark?: string; // text on the tile (first-party only)
  badge?: 'first-party' | 'custom';
  usage: string;
  status: { label: string; tone: 'ok' | 'warn' };
};

const connectors: Connector[] = [
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
  },
];

const tabs = [
  { value: 'connected', label: 'เชื่อมแล้ว · 7' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'custom', label: 'Custom MCP' },
] as const;

// Detail panel content for ES POS (the selected connector in the design).
const allowedBots = [bots.pos, bots.sales];

const tools = [
  { name: 'sales.summary', level: 'read', tone: 'text-ok', on: true },
  { name: 'branch.list', level: 'read', tone: 'text-ok', on: true },
  { name: 'product.update_price', level: 'write · ต้องอนุมัติ (L1)', tone: 'text-warn-ink', on: true },
  { name: 'bill.void', level: 'destructive · ห้าม (L0)', tone: 'text-danger-ink', on: false },
];

const recent = ['08:00 POS Ops · sales.summary', '10:33 Sales Outbound · branch.list'];

const fieldLabel = 'flex flex-col gap-1 text-xs text-muted';
const fieldCls = 'h-10 rounded-[10px] border border-line bg-paper text-[13px] text-ink outline-none focus:border-ink';

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
  const [tab, setTab] = useState<(typeof tabs)[number]['value']>('connected');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('es-pos');
  const [toolsOn, setToolsOn] = useState(() => Object.fromEntries(tools.map((t) => [t.name, t.on])));

  const q = query.trim().toLowerCase();
  const shown = connectors.filter((c) => !q || c.name.toLowerCase().includes(q));
  const selected = connectors.find((c) => c.id === selectedId) ?? connectors[0];
  const isEsPos = selected.id === 'es-pos';

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
          <Button variant="primary" className="px-[18px]">
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

        <div className="flex flex-wrap gap-3">
          {shown.map((c) => (
            <ConnectorCard key={c.id} c={c} selected={c.id === selectedId} onSelect={() => setSelectedId(c.id)} />
          ))}
        </div>

        <section aria-labelledby="cm" className="flex flex-col gap-3 rounded-[18px] bg-sand p-[18px]">
          <h2 id="cm" className="m-0 text-[15px] font-semibold">
            เพิ่ม Custom MCP
          </h2>
          <div className="flex flex-wrap gap-2.5">
            <label className={cn(fieldLabel, 'shrink grow-[2] basis-[280px]')}>
              Server URL
              <input type="url" placeholder="https://your-server.example/mcp" className={cn(fieldCls, 'px-3 font-mono')} />
            </label>
            <label className={cn(fieldLabel, 'shrink grow basis-[160px]')}>
              Transport
              <select className={cn(fieldCls, 'px-2.5')}>
                <option>Streamable HTTP</option>
                <option>SSE</option>
              </select>
            </label>
            <label className={cn(fieldLabel, 'shrink grow basis-[160px]')}>
              Auth
              <select className={cn(fieldCls, 'px-2.5')}>
                <option>OAuth</option>
                <option>API key (เก็บใน vault)</option>
                <option>ไม่มี</option>
              </select>
            </label>
          </div>
          <span className="text-xs text-muted">
            connector ใหม่เริ่มที่ "ทุก tool ปิด" และยังไม่ให้ Bot ไหนใช้ · ES Bot สแกนคำอธิบาย tool หา prompt injection ก่อนเปิดใช้
          </span>
        </section>
      </main>

      <aside
        aria-label={`รายละเอียด ${selected.name}`}
        className="box-border flex max-w-[460px] shrink grow basis-[380px] flex-col gap-[18px] border-l border-line px-6 py-7"
      >
        <div className="flex items-center gap-3">
          <Logo c={selected} size={40} />
          <div className="flex flex-col">
            <h2 className="m-0 text-lg font-semibold">{selected.name}</h2>
            <span className="text-xs text-muted">{isEsPos ? 'OAuth · token อยู่ใน vault ฝั่ง server' : selected.usage}</span>
          </div>
        </div>

        {isEsPos ? (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold">Bot ที่ใช้ได้</span>
              <div className="flex flex-wrap gap-1.5">
                {allowedBots.map((b) => (
                  <span key={b.name} className="flex h-[30px] items-center gap-1.5 rounded-full bg-ink px-3 text-[13px] text-paper">
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                    {b.name}
                  </span>
                ))}
                <button type="button" className="flex h-[30px] cursor-pointer items-center rounded-full border-0 bg-chip px-3 text-[13px] hover:bg-line">
                  + เพิ่ม Bot
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-semibold">Tools</span>
              {tools.map((t) => (
                <label key={t.name} className="flex items-center justify-between gap-3 border-b border-line py-2.5">
                  <span className="flex flex-col">
                    <span className="font-mono text-[13px]">{t.name}</span>
                    <span className={cn('text-xs', t.tone)}>{t.level}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={toolsOn[t.name]}
                    onChange={(e) => setToolsOn((s) => ({ ...s, [t.name]: e.target.checked }))}
                    className="h-5 w-5 cursor-pointer accent-ink"
                  />
                </label>
              ))}
              <span className="pt-1.5 text-xs text-muted">+ อีก 4 tools · ระดับ L0–L3 ดึงจาก Bot Passport</span>
            </div>

            <div className="flex flex-col gap-1.5 rounded-[14px] bg-sand p-3.5">
              <span className="text-[13px] font-semibold">ใช้งานล่าสุด</span>
              {recent.map((r) => (
                <span key={r} className="font-mono text-xs">
                  {r}
                </span>
              ))}
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
          <Button>ทดสอบการเชื่อมต่อ</Button>
          <Button variant="outline">ตัดการเชื่อมต่อ</Button>
        </div>
      </aside>
    </DesktopPage>
  );
}
