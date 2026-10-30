import { Fragment } from 'react';
import { DesktopPage } from '@/components/layout/DesktopPage';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, KeyValue, StatTile } from '@/components/ui';
import { bots } from '@/lib/data';
import { cn } from '@/lib/cn';

const trunk = [
  { label: '#1 อ่าน Sheet' },
  { label: '#2 ค้นข้อมูล' },
  { label: '#3 จุดแตกกิ่ง', branch: true },
  { label: 'A · โทนทางการ (เดิม)' },
];

const branches = [
  {
    id: 'ba',
    title: 'A · โทนทางการ',
    note: 'pane ที่ไม่ได้โฟกัส',
    sample: 'เรียน เจ้าของร้านครัวบ้านทุ่งสุขลา ทางเราขอแนะนำ ES POS Lite ระบบขายหน้าร้านที่ช่วยสรุปยอดรายวัน... [ข้อความตัวอย่าง]',
    verifier: '20 / 22 ผ่าน',
  },
  {
    id: 'bb',
    title: 'B · โทนเป็นกันเอง',
    note: 'fork · กำลังโฟกัส',
    sample: 'สวัสดีครับร้านครัวบ้านทุ่งสุขลา ปิดร้านแล้วยังต้องนั่งรวมยอดอยู่ไหมครับ ES POS Lite ช่วยได้... [ข้อความตัวอย่าง]',
    verifier: '22 / 22 ผ่าน',
    focused: true,
  },
];

const inherited = [
  { k: 'บริบทถึง checkpoint #3', v: 'คัดลอกแล้ว', tone: 'text-ok' },
  { k: 'ไฟล์ใน sandbox', v: 'copy-on-write', tone: 'text-ok' },
  { k: 'Credentials', v: 'ใช้ Passport เดิม · ไม่ได้สิทธิ์เพิ่ม', tone: 'text-muted' },
  { k: 'งบ', v: 'แยกเพดานของ fork', tone: 'text-muted' },
];

const node = 'rounded-full px-3 py-1.5 text-[13px]';

/** 05 · Fork Session — two tones from checkpoint #3, side by side. */
export function Fork() {
  return (
    <DesktopPage title="Fork Session">
      <PageHeader
        eyebrow={`Fork Session · ${bots.sales.name}`}
        title="ลองสองโทนจาก checkpoint #3 แล้วเลือกอันที่ดีกว่า"
        actions={<span className="text-xs text-muted">split view · ⌥ คลิก session เพื่อเปิดคู่กัน</span>}
      />

      <section aria-label="แผนผังกิ่ง" className="flex flex-col gap-2.5 border-b border-line bg-sand px-8 py-5">
        <div className="flex flex-wrap items-center">
          {trunk.map((n, i) => (
            <Fragment key={n.label}>
              {i > 0 && <span className="h-0.5 w-6 bg-rule" />}
              <span className={cn(node, n.branch ? 'bg-ink font-medium text-paper' : 'bg-paper shadow-ring')}>{n.label}</span>
            </Fragment>
          ))}
        </div>
        <div className="flex items-center pl-[300px]">
          <span className="mr-[22px] h-5 w-0.5 bg-accent" />
          <span className={cn(node, 'bg-paper font-medium shadow-ring-accent')}>B · โทนเป็นกันเอง (fork)</span>
        </div>
      </section>

      <div className="flex flex-1 flex-wrap">
        {branches.map((b) => (
          <section
            key={b.id}
            aria-labelledby={b.id}
            className={cn(
              'box-border flex min-w-0 shrink grow basis-[420px] flex-col gap-3.5 px-8 py-6',
              !b.focused && 'border-r border-line opacity-[0.72]',
            )}
          >
            <div className="flex items-center justify-between">
              <h2 id={b.id} className="m-0 text-base font-semibold">
                {b.title}
              </h2>
              <span className={cn('text-xs', b.focused ? 'font-medium text-accent-ink' : 'text-muted')}>{b.note}</span>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-3.5">{b.sample}</div>
            <div className="grid grid-cols-3 gap-2">
              <StatTile tone="ring" label="Verifier" value={b.verifier} valueClass="text-sm" />
              <StatTile tone="ring" label="ความยาวเฉลี่ย" value="[จำนวนคำ]" valueClass="text-sm" />
              <StatTile tone="ring" label="งบที่ใช้" value="[฿]" valueClass="text-sm" />
            </div>
            {b.focused && (
              <Card className="gap-2 rounded-[14px] p-3.5">
                <span className="text-[13px] font-semibold">fork นี้ได้อะไรติดมา</span>
                {inherited.map((r) => (
                  <KeyValue key={r.k} k={r.k} v={r.v} valueClass={r.tone} />
                ))}
              </Card>
            )}
          </section>
        ))}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-8 py-4">
        <span className="text-[13px] text-muted">
          กิ่งที่ไม่เลือกถูกเก็บเข้า archive พร้อม audit log ไม่ส่งอะไรออกไปจนกว่าพี่จะเลือก
        </span>
        <div className="flex flex-wrap gap-2">
          <Button>เก็บไว้ทั้งคู่</Button>
          <Button>ผสม: ใช้ B กับร้านใหม่, A กับร้านเครือ</Button>
          <Button variant="primary">ใช้ B แล้วไปขั้นส่ง</Button>
        </div>
      </footer>
    </DesktopPage>
  );
}
