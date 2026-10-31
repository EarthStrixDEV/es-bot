import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DesktopPage } from '@/components/layout/DesktopPage';
import { BotAvatar, Button, Card, Icon, KeyValue } from '@/components/ui';
import { api, type Bot, type Credential, type DryRunRow, type Passport as PassportDoc, type TrustLevel } from '@/lib/api';
import { cn } from '@/lib/cn';
import { bots } from '@/lib/data';
import { routes } from '@/lib/routes';
import { useLive } from '@/lib/useLive';

const centerNav = [
  { label: 'Bot Passports', to: routes.passport, current: true },
  { label: 'Policy ทั้งบัญชี' },
  { label: 'Runs & Audit log', to: routes.runInspector },
  { label: 'งบและการใช้งาน' },
  { label: 'Skills & Evals' },
];

const demoBots: Bot[] = [
  { id: 'sales-outbound', name: bots.sales.name, avatar: bots.sales.color, job: '', status: 'active' },
  { id: 'chief', name: bots.chief.name, avatar: bots.chief.color, job: '', status: 'active' },
  { id: 'pos-ops', name: bots.pos.name, avatar: bots.pos.color, job: '', status: 'active' },
  { id: 'content-factory', name: bots.content.name, avatar: bots.content.color, job: '', status: 'active' },
];

const demoSandbox = [
  { k: 'เครื่อง', v: 'vm/es-sales-01 · แยกต่อ Bot' },
  { k: 'Browser profile', v: 'sales-only' },
  { k: 'Shared folder', v: '/shared/leads · read' },
  { k: 'Network', v: 'allowlist · 6 โดเมน' },
];

type CredRow = { id: string; app: string; scope: string; tone: string; used: string; granted: boolean };

const demoCredentials: CredRow[] = [
  { id: 'google-sheets', app: 'Google Sheets', scope: 'read', tone: 'text-ok', used: 'วันนี้ 10:31', granted: true },
  { id: 'es-account', app: 'ES Account · CRM', scope: 'read', tone: 'text-ok', used: 'วันนี้ 10:33', granted: true },
  { id: 'line-oa', app: 'LINE OA', scope: 'send · ask', tone: 'text-warn', used: 'ยังไม่เคยใช้', granted: true },
  { id: 'gmail', app: 'Gmail', scope: 'ไม่มีสิทธิ์', tone: 'text-muted', used: '—', granted: false },
];

const levels: TrustLevel[] = ['L0', 'L1', 'L2', 'L3'];

/** Task classes on the ladder. `pay` stands for pay + destroy, which the account locks at L0. */
const trustRows: { id: string; label: string; aria: string; demo: TrustLevel; locked?: boolean }[] = [
  { id: 'read', label: 'อ่านข้อมูล (Sheet, เว็บ, CRM)', aria: 'ระดับสำหรับอ่านข้อมูล', demo: 'L3' },
  { id: 'draft', label: 'ร่างข้อความ / เอกสาร', aria: 'ระดับสำหรับร่าง', demo: 'L3' },
  { id: 'crm_write', label: 'แก้ข้อมูลใน CRM', aria: 'ระดับสำหรับแก้ CRM', demo: 'L2' },
  { id: 'send', label: 'ส่งข้อความถึงลูกค้า', aria: 'ระดับสำหรับส่งข้อความ', demo: 'L1' },
  { id: 'pay', label: 'จ่ายเงิน / ลบข้อมูล', aria: 'ระดับสำหรับจ่ายเงินและลบข้อมูล', demo: 'L0', locked: true },
];

const stopRules = [
  'หยุดทันทีเมื่อถึงเพดาน แม้อยู่กลาง run',
  'หยุดและถามเมื่อขั้นเดิมล้มเหลว 2 ครั้ง',
  'ให้ Verifier ตรวจทุกงานก่อนส่งออกนอกระบบ',
];

const routingModes = [
  { value: 'auto', label: 'Auto + แสดงเหตุผล' },
  { value: 'pin', label: 'Pin โมเดลเอง' },
] as const;

const routing = [
  { k: 'ค้นข้อมูล / สรุป', v: 'fast-tier' },
  { k: 'เขียนข้อความลูกค้า', v: 'writing-tier' },
  { k: 'Verifier', v: 'คนละโมเดลกับผู้ร่าง' },
];

const GRANT_SCOPES = ['read', 'draft', 'write', 'send'] as const;

const fieldCls = 'h-9 min-w-0 rounded-[10px] border border-line bg-paper px-2.5 font-mono text-[13px] text-ink outline-none focus:border-ink';

function timeLabel(iso?: string) {
  if (!iso) return 'ยังไม่เคยใช้';
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  const t = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
  return sameDay ? `วันนี้ ${t}` : `${d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' })} ${t}`;
}

function credRow(c: Credential): CredRow {
  const g = c.grant;
  if (!g) return { id: c.connectorId, app: c.name, scope: 'ไม่มีสิทธิ์', tone: 'text-muted', used: '—', granted: false };
  const asks = g.level === 'L1' || g.level === 'L2';
  return {
    id: c.connectorId,
    app: c.name,
    scope: asks ? `${g.scope} · ask` : g.scope,
    tone: g.scope === 'read' || g.scope === 'draft' ? 'text-ok' : 'text-warn',
    used: timeLabel(c.lastUsed),
    granted: true,
  };
}

/** Passport section: 20px radius ring card. */
function Panel({ id, title, wide, children }: { id: string; title: ReactNode; wide?: boolean; children: ReactNode }) {
  return (
    <Card aria-labelledby={id} className={cn('min-w-0 shrink grow gap-3.5 rounded-[20px] p-5', wide ? 'basis-full' : 'basis-[420px]')}>
      {title}
      {children}
    </Card>
  );
}

function HarnessNav({ list, botId, onPick }: { list: Bot[]; botId: string; onPick: (id: string) => void }) {
  const item = 'rounded-[10px] px-3 py-2.5 no-underline !text-ink';
  return (
    <nav
      aria-label="Harness Center"
      className="box-border flex shrink-0 grow-0 basis-[240px] flex-col gap-1 border-r border-line bg-sand px-3 py-5"
    >
      <Link to={routes.workspace} className="flex items-center gap-2 p-2 text-[13px] no-underline !text-muted hover:!text-ink">
        <Icon name="back" size={16} />
        กลับไปที่แชต
      </Link>
      <span className="px-2 pb-2 pt-3 text-base font-semibold">Harness Center</span>
      {centerNav.map((n) =>
        n.to ? (
          <Link
            key={n.label}
            to={n.to}
            aria-current={n.current ? 'page' : undefined}
            className={cn(item, n.current ? 'bg-paper font-medium shadow-ring' : 'hover:bg-paper/60')}
          >
            {n.label}
          </Link>
        ) : (
          <button key={n.label} type="button" className={cn(item, 'cursor-pointer border-0 bg-transparent text-left hover:bg-paper/60')}>
            {n.label}
          </button>
        ),
      )}
      <span className="px-3 pb-1 pt-4 text-xs text-muted">Bot</span>
      {list.map((b) => (
        <button
          key={b.id}
          type="button"
          aria-pressed={botId === b.id}
          onClick={() => onPick(b.id)}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-transparent px-3 py-2 text-left text-ink hover:bg-paper/60',
            botId === b.id && 'font-medium',
          )}
        >
          <BotAvatar color={b.avatar} size={14} />
          {b.name}
        </button>
      ))}
    </nav>
  );
}

function TrustLadder({ values, onChange }: { values: Record<string, TrustLevel>; onChange: (id: string, l: TrustLevel) => void }) {
  return (
    <div className="flex flex-col gap-2.5">
      {trustRows.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-3">
          <span className="shrink grow basis-[220px]">
            {r.label}
            {r.locked && <span className="ml-2 text-xs text-muted">ล็อกทั้งบัญชี</span>}
          </span>
          <div role="group" aria-label={r.aria} className="flex gap-1">
            {levels.map((l) => {
              const on = values[r.id] === l;
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={on}
                  disabled={r.locked && l !== 'L0'}
                  onClick={() => onChange(r.id, l)}
                  className={cn(
                    'h-8 w-12 cursor-pointer rounded-lg border-0 disabled:cursor-not-allowed disabled:opacity-40',
                    on ? cn('font-semibold text-paper', l === 'L0' ? 'bg-ink' : 'bg-accent') : 'bg-chip text-ink hover:bg-line',
                  )}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function DryRunResult({ rows, onClose }: { rows: DryRunRow[]; onClose: () => void }) {
  const changed = rows.filter((r) => r.changed);
  return (
    <Card variant="accent" aria-labelledby="dr" className="basis-full gap-3 rounded-[20px] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="dr" className="m-0 text-base font-semibold">
          ผล dry-run · {changed.length ? `${changed.length} tool เปลี่ยน` : 'ไม่มี tool ไหนเปลี่ยน'}
        </h2>
        <Button size="sm" onClick={onClose}>
          ปิด
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-1.5 font-medium">Tool</th>
              <th className="py-1.5 font-medium">ตอนนี้</th>
              <th className="py-1.5 font-medium">หลังบันทึก</th>
              <th className="py-1.5 font-medium">เหตุผล</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.toolId} className={cn('border-t border-line', !r.changed && 'text-muted')}>
                <td className="py-2 font-mono">{r.toolId}</td>
                <td className="font-mono">
                  {r.current.decision}
                  {r.current.level && ` · ${r.current.level}`}
                </td>
                <td className={cn('font-mono', r.changed && 'font-semibold text-accent-ink')}>
                  {r.proposed.decision}
                  {r.proposed.level && ` · ${r.proposed.level}`}
                </td>
                <td>{r.proposed.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** 02 · Bot Passport */
export function Passport() {
  const [mode, setMode] = useState<(typeof routingModes)[number]['value']>('auto');
  const [botId, setBotId] = useState('sales-outbound');
  const live = useLive(
    async () => {
      const list = await api.bots();
      try {
        const [passport, creds] = await Promise.all([api.passport(botId), api.credentials(botId)]);
        return { list, passport, creds };
      } catch {
        return { list, passport: undefined, creds: [] as Credential[] };
      }
    },
    [botId],
  );
  const doc: PassportDoc | undefined = live.data?.passport;

  // Edits are kept locally until Save; they reset whenever a new version arrives.
  const [trust, setTrust] = useState<Record<string, TrustLevel>>({});
  const [budget, setBudget] = useState({ perRun: '', perDay: '' });
  const [dry, setDry] = useState<DryRunRow[]>();
  const [granting, setGranting] = useState<string>();
  const [grantScope, setGrantScope] = useState<(typeof GRANT_SCOPES)[number]>('read');
  const [notice, setNotice] = useState<string>();

  // Reset edits only when a new version (or another Bot) arrives, not on every refresh from the event stream.
  useEffect(() => {
    if (!doc) return;
    setTrust(doc.trust);
    setBudget({ perRun: String(doc.budget.perRun), perDay: String(doc.budget.perDay) });
    setDry(undefined);
  }, [doc?.botId, doc?.version]);

  const values = useMemo(
    () => (doc ? { ...trust, pay: 'L0' as TrustLevel } : Object.fromEntries(trustRows.map((r) => [r.id, r.demo]))),
    [doc, trust],
  ) as Record<string, TrustLevel>;

  const patch = () => ({
    trust: Object.fromEntries(Object.entries(trust).filter(([k, v]) => doc && doc.trust[k] !== v && k !== 'pay' && k !== 'destroy')),
    budget: { perRun: Number(budget.perRun), perDay: Number(budget.perDay) },
  });
  const dirty =
    !!doc && (Object.keys(patch().trust).length > 0 || Number(budget.perRun) !== doc.budget.perRun || Number(budget.perDay) !== doc.budget.perDay);

  const listedBots = live.data?.list ?? demoBots;
  const bot = listedBots.find((b) => b.id === botId) ?? demoBots[0];
  // The Bot's own Workspace (drafts) is internal plumbing, not an app people grant.
  const creds = live.data ? live.data.creds.filter((c) => c.connectorId !== 'workspace').map(credRow) : demoCredentials;
  const firstUngranted = creds.find((c) => !c.granted)?.id;
  const sandbox = doc
    ? [
        { k: 'เครื่อง', v: `${doc.sandbox.image} · แยกต่อ Bot` },
        { k: 'Browser profile', v: doc.sandbox.browserProfile },
        { k: 'Network', v: `allowlist · ${doc.sandbox.network.length} โดเมน` },
      ]
    : demoSandbox;
  const liveGrants = doc?.grants.filter((g) => !g.revokedAt && g.connectorId !== 'workspace').length ?? 3;

  async function save() {
    const saved = await live.act(() => api.savePassport(botId, patch()));
    if (saved) setNotice(`บันทึกแล้ว · Passport v${saved.version}`);
  }

  async function runDry() {
    const rows = await live.act(() => api.dryRun(botId, patch()));
    if (rows) setDry(rows);
  }

  async function grant(connectorId: string) {
    const level: TrustLevel | undefined = grantScope === 'send' || grantScope === 'write' ? 'L1' : undefined;
    const saved = await live.act(() => api.grant(botId, { connectorId, scope: grantScope, level }));
    if (saved) {
      setGranting(undefined);
      setNotice(`ให้สิทธิ์ ${grantScope} แล้ว · Passport v${saved.version}`);
    }
  }

  async function revoke(connectorId: string, app: string) {
    const saved = await live.act(() => api.revoke(botId, connectorId));
    if (saved) setNotice(`Revoke ${app} แล้ว · Passport v${saved.version}`);
  }

  const missing = live.data && !doc;

  return (
    <DesktopPage title="Bot Passport" direction="row">
      <HarnessNav list={listedBots} botId={botId} onPick={(id) => (setBotId(id), setNotice(undefined))} />

      <main className="box-border flex min-w-0 shrink grow-[999] basis-[560px] flex-col gap-6 px-8 pb-10 pt-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <BotAvatar color={bot.avatar} size={48} />
            <div className="flex flex-col">
              <span className="text-xs text-muted">Bot Passport{doc && ` · v${doc.version}`}</span>
              <h1 className="m-0 text-[28px] font-medium tracking-[-0.3px]">{bot.name}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="px-[18px]" disabled={live.busy} onClick={() => doc && void runDry()}>
              ทดสอบ policy (dry-run)
            </Button>
            <Button variant="primary" className="px-[18px]" disabled={!!doc && (!dirty || live.busy)} onClick={() => doc && void save()}>
              บันทึก
            </Button>
          </div>
        </header>
        <p className="m-0 max-w-[720px] text-muted">
          ทุก Bot มีเครื่อง สิทธิ์ และงบของตัวเอง ลบ Bot แล้วสิทธิ์ทั้งหมดถูก revoke ตามไปด้วย
        </p>
        {(live.error || notice) && (
          <p role="status" className={cn('m-0 text-[13px]', live.error ? 'text-warn-ink' : 'text-ok')}>
            {live.error ?? notice}
          </p>
        )}

        {missing ? (
          <Card variant="sand" className="items-start gap-2 rounded-[20px] p-5">
            <span className="font-semibold">{bot.name} ยังไม่มี Passport</span>
            <span className="text-[13px] text-muted">Bot นี้ยังทำอะไรผ่าน harness ไม่ได้จนกว่าจะมี Passport</span>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-4">
            {dry && <DryRunResult rows={dry} onClose={() => setDry(undefined)} />}

            <Panel id="sb" title={<h2 id="sb" className="m-0 text-base font-semibold">Sandbox</h2>}>
              <div className="flex flex-col gap-2.5">
                {sandbox.map((s) => (
                  <KeyValue key={s.k} k={<span className="text-muted">{s.k}</span>} v={s.v} valueClass="font-mono text-[13px]" className="text-sm" />
                ))}
              </div>
              <span className="text-xs text-muted">ส่งงานให้ Bot อื่นผ่าน handoff ที่แนบไฟล์ ไม่ใช่การแชร์ login</span>
            </Panel>

            <Panel
              id="cr"
              title={
                <div className="flex items-center justify-between">
                  <h2 id="cr" className="m-0 text-base font-semibold">
                    Credentials
                  </h2>
                  <Button size="sm" className="px-3.5" disabled={!!doc && !firstUngranted} onClick={() => doc && setGranting(firstUngranted)}>
                    + ให้สิทธิ์เพิ่ม
                  </Button>
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="text-left text-muted">
                      <th className="py-1.5 font-medium">แอป</th>
                      <th className="py-1.5 font-medium">สิทธิ์</th>
                      <th className="py-1.5 font-medium">ใช้ล่าสุด</th>
                      <th className="py-1.5">
                        <span className="sr-only">การจัดการ</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {creds.map((c) =>
                      granting === c.id ? (
                        <tr key={c.id} className="border-t border-line">
                          <td className="py-2.5">{c.app}</td>
                          <td colSpan={2}>
                            <label className="flex items-center gap-2 text-muted">
                              <span className="sr-only">สิทธิ์ที่จะให้ {c.app}</span>
                              <select
                                value={grantScope}
                                onChange={(e) => setGrantScope(e.target.value as (typeof GRANT_SCOPES)[number])}
                                className={fieldCls}
                              >
                                {GRANT_SCOPES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                    {s === 'send' || s === 'write' ? ' · ต้องอนุมัติ (L1)' : ''}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </td>
                          <td className="whitespace-nowrap text-right">
                            <button
                              type="button"
                              disabled={live.busy}
                              onClick={() => void grant(c.id)}
                              className="cursor-pointer border-0 bg-transparent py-2 text-[13px] font-semibold text-ink underline"
                            >
                              ยืนยัน
                            </button>
                            <button
                              type="button"
                              onClick={() => setGranting(undefined)}
                              className="ml-2 cursor-pointer border-0 bg-transparent py-2 text-[13px] text-muted underline"
                            >
                              ยกเลิก
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={c.id} className="border-t border-line">
                          <td className={cn('py-2.5', !c.granted && 'text-muted')}>{c.app}</td>
                          <td className={cn('font-mono', c.tone)}>{c.scope}</td>
                          <td className="text-muted">{c.used}</td>
                          <td className="text-right">
                            <button
                              type="button"
                              disabled={!doc || live.busy}
                              onClick={() => (c.granted ? void revoke(c.id, c.app) : setGranting(c.id))}
                              className="cursor-pointer border-0 bg-transparent py-2 text-[13px] text-ink underline disabled:cursor-default"
                            >
                              {c.granted ? 'Revoke' : 'ให้สิทธิ์'}
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
              <span className="text-xs text-muted">token เก็บใน vault ฝั่ง server · Bot เรียกใช้ได้แต่ไม่เห็นค่า</span>
            </Panel>

            <Panel
              id="tl"
              wide
              title={
                <div className="flex flex-wrap justify-between gap-2">
                  <h2 id="tl" className="m-0 text-base font-semibold">
                    Trust ladder ต่อประเภทงาน
                  </h2>
                  <span className="text-xs text-muted">L0 ห้าม · L1 ถามทุกครั้ง · L2 ถามเป็นชุด · L3 อัตโนมัติ + รายงาน</span>
                </div>
              }
            >
              <TrustLadder values={values} onChange={(id, l) => setTrust((t) => ({ ...t, [id]: l }))} />
              <span className="text-xs text-muted">
                Bot ขอเลื่อนระดับได้เองเมื่อผ่านงานแบบเดียวกันครบ 10 ครั้งโดยไม่ถูกแก้ · พี่เป็นคนกดยืนยัน
              </span>
            </Panel>

            <Panel id="bg" title={<h2 id="bg" className="m-0 text-base font-semibold">งบและกฎหยุด</h2>}>
              <div className={cn('grid gap-2', doc ? 'grid-cols-2' : 'grid-cols-3')}>
                {doc ? (
                  (['perRun', 'perDay'] as const).map((k) => (
                    <label key={k} className="flex flex-col gap-1 text-xs text-muted">
                      {k === 'perRun' ? 'ต่อ run (บาท)' : 'ต่อวัน (บาท)'}
                      <input
                        type="number"
                        min={0}
                        inputMode="decimal"
                        value={budget[k]}
                        onChange={(e) => setBudget((b) => ({ ...b, [k]: e.target.value }))}
                        className={fieldCls}
                      />
                    </label>
                  ))
                ) : (
                  ['ต่อ run', 'ต่อวัน', 'ต่อสัปดาห์'].map((b) => (
                    <label key={b} className="flex flex-col gap-1 text-xs text-muted">
                      {b}
                      <input type="text" defaultValue="[฿]" className={fieldCls} />
                    </label>
                  ))
                )}
              </div>
              {stopRules.map((r, i) => {
                // Only the hard stop is enforced today; the other two arrive with phase 3.
                const live0 = !!doc;
                const enforced = i === 0;
                return (
                  <label key={r} className={cn('flex min-h-[44px] items-center gap-2.5', live0 && !enforced && 'text-muted')}>
                    <input
                      type="checkbox"
                      checked={live0 ? enforced && doc.budget.hardStop : true}
                      disabled={live0}
                      readOnly
                      className="h-[18px] w-[18px] accent-ink"
                    />
                    {r}
                    {live0 && !enforced && <span className="text-xs">· เฟส 3</span>}
                  </label>
                );
              })}
            </Panel>

            <Panel id="md" title={<h2 id="md" className="m-0 text-base font-semibold">Model routing</h2>}>
              <div role="radiogroup" aria-label="โหมดเลือกโมเดล" className="flex gap-1 rounded-full bg-sand p-1">
                {routingModes.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={mode === m.value}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      'h-9 flex-1 cursor-pointer rounded-full border-0',
                      mode === m.value ? 'bg-paper font-medium shadow-ring' : 'bg-transparent text-muted hover:text-ink',
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 text-[13px]">
                {routing.map((r) => (
                  <KeyValue key={r.k} k={r.k} v={r.v} valueClass="font-mono text-muted" />
                ))}
              </div>
              <span className="text-xs text-muted">ทุกขั้นบันทึกโมเดลที่ใช้ลง audit log · allowlist ผู้ให้บริการได้</span>
            </Panel>

            <Card
              variant="sand"
              aria-labelledby="off"
              className="min-w-0 shrink grow basis-full flex-row flex-wrap items-center justify-between gap-4 rounded-[20px] p-5"
            >
              <div className="flex shrink grow basis-[360px] flex-col gap-1">
                <h2 id="off" className="m-0 text-base font-semibold">
                  Offboarding
                </h2>
                <span className="text-[13px] text-muted">
                  ลบ Bot นี้จะ revoke {liveGrants} credentials, ปิด sandbox {doc ? doc.sandbox.image : 'vm/es-sales-01'} และเก็บ audit log ไว้ 90 วัน
                </span>
              </div>
              <Button variant="outline" className="px-[18px]">
                ดูสิ่งที่จะถูกลบ
              </Button>
            </Card>
          </div>
        )}
      </main>
    </DesktopPage>
  );
}
