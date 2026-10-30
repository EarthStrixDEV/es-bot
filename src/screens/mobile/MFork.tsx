import { Fragment, useState } from 'react';
import { MobileScreen } from '@/components/layout/MobileScreen';
import { Button, Card, IconLink, KeyValue, Segmented, StatTile } from '@/components/ui';
import { cn } from '@/lib/cn';
import { routes } from '@/lib/routes';

type Branch = 'A' | 'B';

const branches = [
  { value: 'A', label: 'A · ทางการ' },
  { value: 'B', label: 'B · เป็นกันเอง' },
] as const;

const trunk = ['#1', '#2', '#3'];

const stats = [
  { label: 'Verifier', value: '22/22', note: 'A: 20/22' },
  { label: 'ความยาว', value: '[คำ]' },
  { label: 'งบ', value: '[฿]' },
];

const inherited = [
  { k: 'บริบทถึง #3', v: 'คัดลอกแล้ว', tone: 'text-ok' },
  { k: 'ไฟล์', v: 'copy-on-write', tone: 'text-ok' },
  { k: 'Credentials', v: 'Passport เดิม', tone: 'text-muted' },
  { k: 'งบ', v: 'แยกเพดาน', tone: 'text-muted' },
];

const connector = <span className="h-0.5 w-3.5 bg-rule" />;

/** M05 · Fork Session */
export function MFork() {
  const [branch, setBranch] = useState<Branch>('B');

  return (
    <MobileScreen title="Fork">
      <header className="flex items-center gap-2 border-b border-line px-3 pb-2.5 pt-3">
        <IconLink to={routes.mChat} icon="back" label="กลับไปที่แชต" tone="plain" size={44} iconSize={20} strokeWidth={2} />
        <div className="flex flex-1 flex-col">
          <h1 className="m-0 text-base font-semibold">Fork จาก checkpoint #3</h1>
          <span className="text-xs text-muted">เทียบสองกิ่งแล้วเลือก</span>
        </div>
      </header>

      <div aria-label="เส้นทาง checkpoint" className="flex items-center px-4 pt-3 text-xs">
        {trunk.map((c, i) => (
          <Fragment key={c}>
            <span className={cn('rounded-full px-2.5 py-1', i === trunk.length - 1 ? 'bg-ink text-paper' : 'bg-sand')}>{c}</span>
            {connector}
          </Fragment>
        ))}
        {branches.map((b, i) => (
          <Fragment key={b.value}>
            {i > 0 && <span className="w-2" />}
            <span
              className={cn(
                'rounded-full px-2.5 py-1',
                branch === b.value ? 'font-semibold shadow-ring-accent' : 'bg-sand',
              )}
            >
              {b.value}
            </span>
          </Fragment>
        ))}
      </div>

      <div className="px-4 pt-3">
        <Segmented label="เลือกกิ่ง" options={branches} value={branch} onChange={setBranch} stretch className="[&>button]:h-10" />
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <div className="rounded-2xl bg-sand p-3.5 text-sm">
          สวัสดีครับร้านครัวบ้านทุ่งสุขลา ปิดร้านแล้วยังต้องนั่งรวมยอดอยู่ไหมครับ ES POS Lite ช่วยได้... [ข้อความตัวอย่าง]
        </div>
        <span className="text-center text-xs text-muted">ปัดซ้าย-ขวาเพื่อสลับดูข้อความ 1 / 22</span>
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <StatTile
              key={s.label}
              tone="ring"
              label={s.label}
              value={
                <>
                  {s.value}
                  {s.note && <span className="block text-2xs font-normal text-muted">{s.note}</span>}
                </>
              }
              valueClass="text-sm"
              className="rounded-xl"
            />
          ))}
        </div>
        <Card className="shrink-0 gap-1.5 px-3.5 py-3">
          <span className="text-sm font-semibold">fork นี้ได้อะไรติดมา</span>
          {inherited.map((r) => (
            <KeyValue key={r.k} k={r.k} v={r.v} valueClass={r.tone} />
          ))}
        </Card>
      </div>

      <div className="flex flex-col gap-2 px-4 pb-6">
        <Button variant="primary" size="xl">
          ใช้ {branch} แล้วไปขั้นส่ง
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button className="h-11 text-sm">ผสม A + B</Button>
          <Button className="h-11 text-sm">เก็บทั้งคู่</Button>
        </div>
      </div>
    </MobileScreen>
  );
}
