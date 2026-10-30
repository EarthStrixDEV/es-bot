import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, KeyValue, Meter, Segmented } from '@/components/ui';
import { routes } from '@/lib/routes';

const views = [
  { value: 'run', label: 'Run' },
  { value: 'computer', label: 'Computer' },
  { value: 'memory', label: 'Memory' },
] as const;

const checkpoints = [
  { id: 1, label: '#1 อ่าน Sheet' },
  { id: 2, label: '#2 ค้นข้อมูลร้าน' },
  { id: 3, label: '#3 ร่าง 22 ข้อความ', rollback: true },
];

const passport = [
  { name: 'Google Sheets', scope: 'read', tone: 'text-ok' },
  { name: 'CRM (ES Account)', scope: 'read', tone: 'text-ok' },
  { name: 'LINE OA', scope: 'send · ask', tone: 'text-warn' },
  { name: 'Browser profile', scope: 'sales-only', tone: 'text-muted' },
];

export function SessionRail() {
  const [view, setView] = useState<(typeof views)[number]['value']>('run');

  return (
    <aside aria-label="Session rail" className="flex max-w-[420px] shrink grow basis-[360px] flex-col gap-4 bg-paper px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Session rail</span>
        <span className="text-xs text-muted">การ์ดลากสลับลำดับได้</span>
      </div>
      <Segmented label="มุมมอง harness" options={views} value={view} onChange={setView} stretch />

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted">สถานะ run</span>
        <span className="text-[15px] font-semibold">รอพี่อนุมัติ · ขั้น 4 / 4</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <span className="text-[13px] font-medium">งบของ run นี้</span>
          <span className="font-mono text-xs">31% ของเพดาน</span>
        </div>
        <Meter value={31} label="งบของ run นี้" />
        <span className="text-xs text-muted">ถึงเพดานแล้วหยุดทันที แม้อยู่กลาง run</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <span className="text-[13px] font-medium">Context</span>
          <span className="font-mono text-xs">42%</span>
        </div>
        <Meter value={42} label="Context ที่ใช้" color="#0A0A0A" />
        <span className="text-xs text-muted">เกิน 80% จะสรุปบริบทเก่าให้อัตโนมัติ · side chat ไม่กินบริบทหลัก</span>
      </div>

      <div className="flex items-center justify-between rounded-xl px-3 py-2.5 shadow-ring">
        <span className="text-[13px] font-medium">Changes</span>
        <span className="font-mono text-xs">
          <span className="text-ok">+22 drafts</span> · <span className="text-muted">0 sent</span>
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium">Checkpoints</span>
        <ol className="ml-1.5 flex list-none flex-col border-l-2 border-line p-0 pl-3.5">
          {checkpoints.map((c) => (
            <li key={c.id} className="flex justify-between gap-2 py-1">
              <span className="text-[13px]">{c.label}</span>
              {c.rollback ? (
                <Link to={routes.runInspector} className="text-xs">
                  ย้อนกลับไปจุดนี้
                </Link>
              ) : (
                <span className="text-xs text-muted">snapshot</span>
              )}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-2.5 rounded-2xl bg-sand p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold">Bot Passport</span>
          <Link to={routes.passport} className="text-xs">
            จัดการ
          </Link>
        </div>
        <span className="text-xs text-muted">sandbox แยกของ Sales Outbound · Bot อื่นเข้าถึงไม่ได้</span>
        <div className="flex flex-col gap-1.5">
          {passport.map((p) => (
            <KeyValue key={p.name} k={p.name} v={p.scope} mono valueClass={p.tone} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium">Computer</span>
          <span className="text-xs text-muted">หยุดรออนุมัติ</span>
        </div>
        <div className="flex h-[150px] items-center justify-center rounded-[14px] bg-chip text-xs text-muted shadow-[inset_0_0_0_1px_#E6E4E0]">
          [ภาพจอของ Bot · LINE OA draft queue]
        </div>
        <div className="flex gap-2">
          <Button size="md" className="flex-1 text-sm">
            Take control
          </Button>
          <Button size="md" className="flex-1 text-sm">
            Teach a task
          </Button>
        </div>
      </div>
    </aside>
  );
}
