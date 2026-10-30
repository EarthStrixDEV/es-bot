import { useState } from 'react';
import { MobileScreen } from '@/components/layout/MobileScreen';
import { BotAvatar, Button, IconLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { bots } from '@/lib/data';
import { routes } from '@/lib/routes';

const sandbox = [
  { k: 'เครื่อง', v: 'vm/es-sales-01' },
  { k: 'Network', v: 'allowlist · 6' },
];

const credentials = [
  { name: 'Google Sheets', scope: 'read', tone: 'text-ok' },
  { name: 'ES Account · CRM', scope: 'read', tone: 'text-ok' },
  { name: 'LINE OA', scope: 'send · ask', tone: 'text-warn-ink' },
];

const levels = ['L0', 'L1', 'L2', 'L3'] as const;

const ladder = [
  { id: 'read', label: 'อ่านข้อมูล', aria: 'ระดับอ่านข้อมูล', level: 3 },
  { id: 'send', label: 'ส่งข้อความถึงลูกค้า', aria: 'ระดับส่งข้อความ', level: 1 },
  { id: 'pay', label: 'จ่ายเงิน / ลบข้อมูล', aria: 'ระดับจ่ายเงินและลบข้อมูล', level: 0 },
];

function SectionTitle({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="m-0 text-[13px] font-semibold text-muted">
      {children}
    </h2>
  );
}

/** M06 · Bot Passport */
export function MPassport() {
  const [trust, setTrust] = useState<Record<string, number>>(() =>
    Object.fromEntries(ladder.map((r) => [r.id, r.level])),
  );

  return (
    <MobileScreen title="Bot Passport">
      <header className="flex items-center gap-2.5 border-b border-line p-3">
        <IconLink to={routes.mRail} icon="back" label="กลับ" tone="plain" size={44} iconSize={20} strokeWidth={2} />
        <BotAvatar color={bots.sales.color} size={36} />
        <div className="flex flex-1 flex-col">
          <span className="text-xs text-muted">Bot Passport</span>
          <h1 className="m-0 text-[17px] font-semibold">{bots.sales.name}</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto p-4">
        <section aria-labelledby="sb" className="flex flex-col gap-2">
          <SectionTitle id="sb">SANDBOX</SectionTitle>
          <div className="flex flex-col rounded-2xl shadow-ring">
            {sandbox.map((r, i) => (
              <div key={r.k} className={cn('flex justify-between px-3.5 py-3 text-sm', i > 0 && 'border-t border-line')}>
                <span>{r.k}</span>
                <span className="font-mono text-xs">{r.v}</span>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="cr" className="flex flex-col gap-2">
          <SectionTitle id="cr">CREDENTIALS</SectionTitle>
          <div className="flex flex-col rounded-2xl shadow-ring">
            {credentials.map((c, i) => (
              <div
                key={c.name}
                className={cn('flex items-center justify-between py-1.5 pl-3.5 pr-1.5 text-sm', i > 0 && 'border-t border-line')}
              >
                <span className="flex flex-col">
                  <span>{c.name}</span>
                  <span className={cn('font-mono text-2xs', c.tone)}>{c.scope}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Revoke ${c.name}`}
                  className="h-11 cursor-pointer border-0 bg-transparent px-3 text-[13px] underline"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="tl" className="flex flex-col gap-2">
          <SectionTitle id="tl">TRUST LADDER</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {ladder.map((row) => (
              <div key={row.id} className="flex flex-col gap-1.5">
                <span className="text-sm">{row.label}</span>
                <div role="radiogroup" aria-label={row.aria} className="grid grid-cols-4 gap-1">
                  {levels.map((l, i) => {
                    const on = trust[row.id] === i;
                    return (
                      <button
                        key={l}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setTrust((t) => ({ ...t, [row.id]: i }))}
                        className={cn(
                          'h-10 cursor-pointer rounded-[10px] border-0',
                          on ? cn('font-semibold text-paper', i === 0 ? 'bg-ink' : 'bg-accent') : 'bg-chip',
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
          <span className="text-xs text-muted">+ อีก 2 ประเภทงาน · L0 ห้าม · L1 ถามทุกครั้ง · L3 อัตโนมัติ</span>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-line px-4 pb-6 pt-3">
        <Button size="xl" className="text-sm">
          Dry-run
        </Button>
        <Button size="xl" variant="primary">
          บันทึก
        </Button>
      </div>
    </MobileScreen>
  );
}
