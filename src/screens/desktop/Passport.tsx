import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DesktopPage } from '@/components/layout/DesktopPage';
import { BotAvatar, Button, Card, Icon, KeyValue } from '@/components/ui';
import { cn } from '@/lib/cn';
import { bots } from '@/lib/data';
import { routes } from '@/lib/routes';

const centerNav = [
  { label: 'Bot Passports', to: routes.passport, current: true },
  { label: 'Policy ทั้งบัญชี' },
  { label: 'Runs & Audit log', to: routes.runInspector },
  { label: 'งบและการใช้งาน' },
  { label: 'Skills & Evals' },
];

const botList = [bots.sales, bots.chief, bots.pos, bots.content];

const sandbox = [
  { k: 'เครื่อง', v: 'vm/es-sales-01 · แยกต่อ Bot' },
  { k: 'Browser profile', v: 'sales-only' },
  { k: 'Shared folder', v: '/shared/leads · read' },
  { k: 'Network', v: 'allowlist · 6 โดเมน' },
];

const credentials = [
  { app: 'Google Sheets', scope: 'read', tone: 'text-ok', used: 'วันนี้ 10:31', action: 'Revoke' },
  { app: 'ES Account · CRM', scope: 'read', tone: 'text-ok', used: 'วันนี้ 10:33', action: 'Revoke' },
  { app: 'LINE OA', scope: 'send · ask', tone: 'text-warn', used: 'ยังไม่เคยใช้', action: 'Revoke' },
  { app: 'Gmail', scope: 'ไม่มีสิทธิ์', tone: 'text-muted', used: '—', action: 'ให้สิทธิ์', none: true },
];

const levels = ['L0', 'L1', 'L2', 'L3'] as const;
type Level = (typeof levels)[number];

const trustRows: { id: string; label: string; aria: string; level: Level }[] = [
  { id: 'read', label: 'อ่านข้อมูล (Sheet, เว็บ, CRM)', aria: 'ระดับสำหรับอ่านข้อมูล', level: 'L3' },
  { id: 'draft', label: 'ร่างข้อความ / เอกสาร', aria: 'ระดับสำหรับร่าง', level: 'L3' },
  { id: 'crm', label: 'แก้ข้อมูลใน CRM', aria: 'ระดับสำหรับแก้ CRM', level: 'L2' },
  { id: 'send', label: 'ส่งข้อความถึงลูกค้า', aria: 'ระดับสำหรับส่งข้อความ', level: 'L1' },
  { id: 'pay', label: 'จ่ายเงิน / ลบข้อมูล', aria: 'ระดับสำหรับจ่ายเงินและลบข้อมูล', level: 'L0' },
];

const budgets = ['ต่อ run', 'ต่อวัน', 'ต่อสัปดาห์'];

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

/** Passport section: 20px radius ring card. */
function Panel({ id, title, wide, children }: { id: string; title: ReactNode; wide?: boolean; children: ReactNode }) {
  return (
    <Card aria-labelledby={id} className={cn('min-w-0 shrink grow gap-3.5 rounded-[20px] p-5', wide ? 'basis-full' : 'basis-[420px]')}>
      {title}
      {children}
    </Card>
  );
}

function HarnessNav() {
  const [bot, setBot] = useState<string>(bots.sales.name);
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
      {botList.map((b) => (
        <button
          key={b.name}
          type="button"
          aria-pressed={bot === b.name}
          onClick={() => setBot(b.name)}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-transparent px-3 py-2 text-left text-ink hover:bg-paper/60',
            bot === b.name && 'font-medium',
          )}
        >
          <BotAvatar color={b.color} size={14} />
          {b.name}
        </button>
      ))}
    </nav>
  );
}

function TrustLadder() {
  const [values, setValues] = useState<Record<string, Level>>(() =>
    Object.fromEntries(trustRows.map((r) => [r.id, r.level])),
  );

  return (
    <div className="flex flex-col gap-2.5">
      {trustRows.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-3">
          <span className="shrink grow basis-[220px]">{r.label}</span>
          <div role="group" aria-label={r.aria} className="flex gap-1">
            {levels.map((l) => {
              const on = values[r.id] === l;
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setValues((v) => ({ ...v, [r.id]: l }))}
                  className={cn(
                    'h-8 w-12 cursor-pointer rounded-lg border-0',
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

/** 02 · Bot Passport */
export function Passport() {
  const [mode, setMode] = useState<(typeof routingModes)[number]['value']>('auto');

  return (
    <DesktopPage title="Bot Passport" direction="row">
      <HarnessNav />

      <main className="box-border flex min-w-0 shrink grow-[999] basis-[560px] flex-col gap-6 px-8 pb-10 pt-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <BotAvatar color={bots.sales.color} size={48} />
            <div className="flex flex-col">
              <span className="text-xs text-muted">Bot Passport</span>
              <h1 className="m-0 text-[28px] font-medium tracking-[-0.3px]">{bots.sales.name}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="px-[18px]">ทดสอบ policy (dry-run)</Button>
            <Button variant="primary" className="px-[18px]">
              บันทึก
            </Button>
          </div>
        </header>
        <p className="m-0 max-w-[720px] text-muted">
          ทุก Bot มีเครื่อง สิทธิ์ และงบของตัวเอง ลบ Bot แล้วสิทธิ์ทั้งหมดถูก revoke ตามไปด้วย
        </p>

        <div className="flex flex-wrap gap-4">
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
                <Button size="sm" className="px-3.5">
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
                  {credentials.map((c) => (
                    <tr key={c.app} className="border-t border-line">
                      <td className={cn('py-2.5', c.none && 'text-muted')}>{c.app}</td>
                      <td className={cn('font-mono', c.tone)}>{c.scope}</td>
                      <td className="text-muted">{c.used}</td>
                      <td className="text-right">
                        <button type="button" className="cursor-pointer border-0 bg-transparent py-2 text-[13px] text-ink underline">
                          {c.action}
                        </button>
                      </td>
                    </tr>
                  ))}
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
            <TrustLadder />
            <span className="text-xs text-muted">
              Bot ขอเลื่อนระดับได้เองเมื่อผ่านงานแบบเดียวกันครบ 10 ครั้งโดยไม่ถูกแก้ · พี่เป็นคนกดยืนยัน
            </span>
          </Panel>

          <Panel id="bg" title={<h2 id="bg" className="m-0 text-base font-semibold">งบและกฎหยุด</h2>}>
            <div className="grid grid-cols-3 gap-2">
              {budgets.map((b) => (
                <label key={b} className="flex flex-col gap-1 text-xs text-muted">
                  {b}
                  <input
                    type="text"
                    defaultValue="[฿]"
                    className="h-9 min-w-0 rounded-[10px] border border-line px-2.5 font-mono text-[13px] text-ink outline-none focus:border-ink"
                  />
                </label>
              ))}
            </div>
            {stopRules.map((r) => (
              <label key={r} className="flex min-h-[44px] items-center gap-2.5">
                <input type="checkbox" defaultChecked className="h-[18px] w-[18px] accent-ink" />
                {r}
              </label>
            ))}
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
                ลบ Bot นี้จะ revoke 3 credentials, ปิด sandbox vm/es-sales-01 และเก็บ audit log ไว้ 90 วัน
              </span>
            </div>
            <Button variant="outline" className="px-[18px]">
              ดูสิ่งที่จะถูกลบ
            </Button>
          </Card>
        </div>
      </main>
    </DesktopPage>
  );
}
