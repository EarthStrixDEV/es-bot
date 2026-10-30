import { useState } from 'react';
import { DesktopPage } from '@/components/layout/DesktopPage';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, IconButton, KeyValue, Meter, Pill } from '@/components/ui';
import { bots } from '@/lib/data';
import { cn } from '@/lib/cn';

const steps = [
  { n: 1, label: 'อ่าน Google Sheet', meta: '10:31 · sheets.read · fast-tier · snapshot #1', done: true },
  { n: 2, label: 'ค้นข้อมูลร้าน + เทียบ CRM', meta: '10:33 · browser · crm.read · snapshot #2', done: true },
  { n: 3, label: 'ร่าง 22 ข้อความ + Verifier', meta: '10:38 · writing-tier · verifier · snapshot #3', done: true },
  { n: 4, label: 'ส่งผ่าน LINE OA', meta: 'line.send · L1 · รอพี่อนุมัติ', done: false },
];

const actionLog = [
  { t: '10:36:02', e: 'skill.load "ES Sales Voice"' },
  { t: '10:36:40', e: 'draft.create × 22 → /drafts/line' },
  { t: '10:37:55', e: 'verifier.check → 20 pass · 2 fix' },
  { t: '10:38:10', e: 'snapshot.save #3' },
  { t: '10:38:12', e: 'approval.request line.send (L1)', warn: true },
];

/** 03 · Run Inspector */
export function RunInspector() {
  const [current, setCurrent] = useState(3);

  return (
    <DesktopPage title="Run Inspector">
      <PageHeader
        eyebrow={`Run Inspector · ${bots.sales.name}`}
        title="ร่างข้อความ LINE OA ร้านอาหารชลบุรี"
        extras={
          <>
            <Pill tone="outline" mono className="py-1">
              run_0412
            </Pill>
            <Pill tone="warn" className="py-1">
              รออนุมัติขั้น 4
            </Pill>
          </>
        }
        actions={
          <>
            <Button>บันทึกเป็น skill</Button>
            <Button>เพิ่มเป็น eval case</Button>
            <Button variant="primary">ส่งออก audit log</Button>
          </>
        }
      />

      <div className="flex flex-1 flex-wrap">
        <nav
          aria-label="ขั้นของ run"
          className="box-border flex shrink-0 grow-0 basis-[340px] flex-col gap-2 border-r border-line bg-sand p-5"
        >
          <span className="px-1 pb-1 text-xs text-muted">Timeline · 4 ขั้น · 11 tool calls</span>

          {steps.map((s) => {
            const active = s.n === current;
            return (
              <button
                key={s.n}
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => setCurrent(s.n)}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-[14px] border-0 p-3 text-left text-ink',
                  active ? 'bg-paper shadow-ring-accent' : 'bg-transparent hover:bg-paper/60',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs',
                    s.done ? 'bg-ok text-paper' : 'font-semibold text-warn-ink shadow-[inset_0_0_0_2px_#B45309]',
                  )}
                >
                  {s.n}
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className={active ? 'font-semibold' : 'font-medium'}>{s.label}</span>
                  <span className={cn('font-mono text-[11px]', s.done ? 'text-muted' : 'text-warn-ink')}>{s.meta}</span>
                </span>
              </button>
            );
          })}

          <Card variant="paper" className="mt-3 gap-1.5 rounded-[14px] p-3.5">
            <span className="text-[13px] font-semibold">สรุปค่าใช้จ่าย</span>
            <KeyValue k={<span className="text-muted">ใช้ไป</span>} v="[฿] · 31% ของเพดาน" valueClass="font-mono" />
            <KeyValue k={<span className="text-muted">เวลา</span>} v="7 นาที" valueClass="font-mono" />
          </Card>
        </nav>

        <main className="box-border flex min-w-0 shrink grow-[999] basis-[560px] flex-col gap-5 px-8 pb-10 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-lg font-semibold">ขั้น 3 · ร่างข้อความ + Verifier</h2>
            <div className="flex flex-wrap gap-2">
              <Button>รันใหม่จากขั้นนี้</Button>
              <Button variant="outline">ย้อนกลับไป snapshot #3</Button>
            </div>
          </div>

          <Card aria-label="Replay" className="gap-3 rounded-[18px]">
            <div className="flex h-60 items-center justify-center rounded-xl bg-chip text-[13px] text-muted">
              [Replay จอของ Bot · ขั้น 3]
            </div>
            <div className="flex items-center gap-3">
              <IconButton icon="play" label="เล่น replay" tone="primary" iconSize={14} />
              <Meter value={58} label="ตำแหน่ง replay" height={6} className="flex-1" />
              <span className="font-mono text-xs text-muted">02:41 / 04:38</span>
            </div>
          </Card>

          <div className="flex flex-wrap gap-4">
            <Card aria-labelledby="df" className="min-w-0 shrink grow basis-[380px] gap-2.5 rounded-[18px]">
              <h3 id="df" className="m-0 text-[15px] font-semibold">
                Verifier แก้ไขอะไรไป
              </h3>
              <div className="rounded-[10px] bg-danger-soft px-3 py-2.5 text-[13px]">
                <span className="font-mono text-danger-ink">− </span>สวัสดีครับร้าน<span className="line-through">ครัวบ้านทุ่ง</span> ...
              </div>
              <div className="rounded-[10px] bg-ok-soft px-3 py-2.5 text-[13px]">
                <span className="font-mono text-ok-ink">+ </span>สวัสดีครับร้าน<span className="font-semibold">ครัวบ้านทุ่งสุขลา</span> ...
              </div>
              <span className="text-xs text-muted">
                เหตุผล: ชื่อร้านไม่ตรงกับคอลัมน์ B ใน Sheet · ตรวจด้วยโมเดลคนละตัวกับผู้ร่าง
              </span>
            </Card>

            <Card aria-labelledby="lg" className="min-w-0 shrink grow basis-[380px] gap-2.5 rounded-[18px]">
              <h3 id="lg" className="m-0 text-[15px] font-semibold">
                Action log
              </h3>
              <ol className="m-0 flex list-none flex-col gap-2 p-0 font-mono text-xs">
                {actionLog.map((l) => (
                  <li key={l.t} className="flex gap-2.5">
                    <span className="text-muted">{l.t}</span>
                    <span className={l.warn ? 'text-warn-ink' : undefined}>{l.e}</span>
                  </li>
                ))}
              </ol>
              <span className="text-xs text-muted">ทุกบรรทัดผูกกับ credential และโมเดลที่ใช้ · เก็บ 90 วัน</span>
            </Card>
          </div>
        </main>
      </div>
    </DesktopPage>
  );
}
