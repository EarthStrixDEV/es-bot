import { Link } from 'react-router-dom';
import { MobileScreen } from '@/components/layout/MobileScreen';
import { Button, IconLink, KeyValue, Meter } from '@/components/ui';
import { bots } from '@/lib/data';
import { routes } from '@/lib/routes';

const meters = [
  { label: 'งบของ run', value: 31 },
  { label: 'Context', value: 42, color: '#0A0A0A' },
];

const checkpoints = [
  { id: 1, label: '#1 อ่าน Sheet', model: 'Haiku 5.5' },
  { id: 2, label: '#2 ค้นข้อมูลร้าน', model: 'Sonnet 5.5' },
  { id: 3, label: '#3 ร่าง + Verifier', fork: true },
];

const passport = [
  { name: 'Sheets · CRM', scope: 'read', tone: 'text-ok' },
  { name: 'LINE OA', scope: 'send · ask', tone: 'text-warn-ink' },
];

/** M04 · Session rail */
export function MRail() {
  return (
    <MobileScreen title="Session rail">
      <header className="flex items-center gap-2 border-b border-line px-3 pb-2.5 pt-3">
        <IconLink to={routes.mChat} icon="back" label="กลับไปที่แชต" tone="plain" size={44} iconSize={20} strokeWidth={2} />
        <div className="flex flex-1 flex-col">
          <h1 className="m-0 text-base font-semibold">Session rail</h1>
          <span className="text-xs text-muted">{bots.sales.name} · run_0412</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4">
        <div className="flex flex-col gap-0.5 rounded-2xl bg-warn-soft p-3.5">
          <span className="text-xs text-warn-ink">สถานะ</span>
          <span className="text-[17px] font-semibold">รอพี่อนุมัติ · ขั้น 4/4</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {meters.map((m) => (
            <div key={m.label} className="flex flex-col gap-1.5 rounded-2xl p-3 shadow-ring">
              <span className="text-xs text-muted">{m.label}</span>
              <span className="font-mono text-xl">{m.value}%</span>
              <Meter value={m.value} label={m.label} color={m.color} height={6} />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-2xl px-3.5 py-3 shadow-ring">
          <span className="font-medium">Changes</span>
          <span className="font-mono text-[13px]">
            <span className="text-ok">+22 drafts</span> · 0 sent
          </span>
        </div>

        <section aria-labelledby="m-rail-checkpoints" className="flex flex-col gap-1.5">
          <h2 id="m-rail-checkpoints" className="m-0 text-sm font-semibold">
            Checkpoints
          </h2>
          <ol className="m-0 ml-1.5 flex list-none flex-col border-l-2 border-line p-0 pl-3.5">
            {checkpoints.map((c) => (
              <li key={c.id} className="flex min-h-11 items-center justify-between">
                <span className={c.fork ? 'font-medium' : undefined}>{c.label}</span>
                {c.fork ? (
                  <Link to={routes.mFork} className="text-[13px]">
                    Fork / ย้อนกลับ
                  </Link>
                ) : (
                  <span className="font-mono text-2xs text-muted">{c.model}</span>
                )}
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col gap-2 rounded-2xl bg-sand p-3.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Bot Passport</span>
            <Link to={routes.mPassport} className="flex min-h-11 items-center text-[13px]">
              จัดการ
            </Link>
          </div>
          {passport.map((p) => (
            <KeyValue key={p.name} k={p.name} v={p.scope} mono valueClass={p.tone} className="text-sm" />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex h-[120px] shrink-0 items-center justify-center rounded-[14px] bg-chip text-[13px] text-muted">
            [จอของ Bot · แตะเพื่อดูเต็มจอ]
          </div>
          <Button className="h-11 text-sm">Take control</Button>
        </div>
      </div>
    </MobileScreen>
  );
}
