import { useState } from 'react';
import { Button, Card, StatTile } from '@/components/ui';
import type { Approval, ApprovalDecision } from '@/lib/api';
import { cn } from '@/lib/cn';

export type PlanRow = { label: string; kind: string; state: 'done' | 'waiting' | 'todo' | 'failed' };

const time = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) : '');

/** "แผนก่อนลงมือ" card: the plan's steps and whether the plan itself is approved. */
export function PlanCard({
  title,
  rows,
  approval,
  onDecide,
  busy,
}: {
  title: string;
  rows: PlanRow[];
  approval?: Pick<Approval, 'state' | 'decidedAt'> & { id?: string };
  onDecide?: (d: ApprovalDecision) => void;
  busy?: boolean;
}) {
  const open = approval && ['pending', 'escalated', 'paused'].includes(approval.state);
  return (
    <Card aria-label="แผนงานก่อนลงมือ" variant={open ? 'accent' : 'ring'} className="gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{title}</span>
        {approval?.state === 'approved' && <span className="text-xs font-medium text-ok">พี่อนุมัติแผนแล้ว {time(approval.decidedAt)}</span>}
        {approval?.state === 'rejected' && <span className="text-xs font-medium text-warn">พี่ปฏิเสธแผนนี้</span>}
        {open && <span className="text-xs text-muted">รอพี่อนุมัติแผน</span>}
      </div>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {rows.map((s, i) => (
          <li key={i} className="flex items-center gap-2.5">
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[11px]',
                s.state === 'done' && 'bg-ok text-paper',
                s.state === 'waiting' && 'font-semibold text-warn shadow-[inset_0_0_0_2px_#B45309]',
                s.state === 'todo' && 'text-muted shadow-[inset_0_0_0_1.5px_#C9C6C0]',
                s.state === 'failed' && 'bg-danger-soft font-semibold text-danger-ink',
              )}
            >
              {s.state === 'done' ? '✓' : s.state === 'failed' ? '!' : i + 1}
            </span>
            <span className={cn('flex-1', s.state === 'waiting' && 'font-medium')}>{s.label}</span>
            <span className={cn('font-mono text-[11px]', s.state === 'waiting' ? 'text-warn' : 'text-muted')}>{s.kind}</span>
          </li>
        ))}
      </ol>
      {open && onDecide && (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" className="px-[18px]" disabled={busy} onClick={() => onDecide('approve')}>
            อนุมัติแผน
          </Button>
          <Button variant="ghost" className="px-[18px]" disabled={busy} onClick={() => onDecide('reject')}>
            ปฏิเสธ
          </Button>
        </div>
      )}
    </Card>
  );
}

const ESCALATION: Record<string, string> = {
  pending: 'ไม่หมดอายุเงียบ · แจ้งเตือน LINE ใน 30 นาที',
  escalated: 'แจ้งเตือนทาง LINE แล้ว · พัก run ใน 2 ชม. ถ้ายังไม่ตอบ',
  paused: 'พัก run ไว้ที่ checkpoint แล้ว · ตอบเมื่อไรก็ทำต่อ',
};

const DECIDED: Record<string, string> = {
  approved: 'พี่อนุมัติแล้ว',
  approved_canary: 'ส่งทดลอง 1 รายการแล้ว',
  rejected: 'พี่ปฏิเสธแล้ว',
};

/** Step approval card: what is being approved, which right it uses, and whether it can be undone. */
export function ApprovalCard({
  approval,
  scopeLabel,
  onDecide,
  busy,
}: {
  approval: Pick<Approval, 'title' | 'state' | 'reversible' | 'estimate' | 'preview'>;
  scopeLabel: string;
  onDecide?: (d: ApprovalDecision) => void;
  busy?: boolean;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const open = ['pending', 'escalated', 'paused'].includes(approval.state);
  const preview = approval.preview ?? [];
  return (
    <Card variant={open ? 'accent' : 'ring'} aria-label="คำขออนุมัติ" className="gap-3">
      <div className="flex flex-wrap justify-between gap-2">
        <span className="text-[15px] font-semibold">ขออนุมัติ: {approval.title}</span>
        <span className="text-xs text-muted">
          {open ? ESCALATION[approval.state] : DECIDED[approval.state]}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="ใช้สิทธิ์" value={scopeLabel} />
        <StatTile
          label="ย้อนกลับได้ไหม"
          value={approval.reversible === 'no' ? 'ไม่ได้ · ส่งแล้วถอนไม่ได้' : approval.reversible === 'partial' ? 'ได้บางส่วน' : 'ได้'}
          valueClass={approval.reversible === 'no' ? 'text-warn' : undefined}
        />
        <StatTile label="ค่าใช้จ่ายขั้นนี้" value={approval.estimate ? `~${approval.estimate} ฿` : '[ประมาณการ ฿]'} />
      </div>
      {showPreview && preview.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1.5 rounded-[10px] bg-sand p-3 text-[13px]">
          {preview.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
      {open && (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" className="px-[18px]" disabled={busy} onClick={() => onDecide?.('approve')}>
            อนุมัติครั้งนี้
          </Button>
          <Button className="px-[18px]" aria-expanded={showPreview} onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? 'ซ่อนตัวอย่าง' : `ดูตัวอย่าง ${preview.length || 3} ข้อความ`}
          </Button>
          <Button className="px-[18px]" disabled={busy} onClick={() => onDecide?.('approve_canary')}>
            ส่งทดลอง 1 ร้านก่อน
          </Button>
          <Button variant="ghost" className="px-[18px]" disabled={busy} onClick={() => onDecide?.('reject')}>
            ปฏิเสธ
          </Button>
        </div>
      )}
    </Card>
  );
}
