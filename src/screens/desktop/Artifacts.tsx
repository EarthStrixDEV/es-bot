import { useState } from 'react';
import { DesktopPage } from '@/components/layout/DesktopPage';
import { BotAvatar, Bubble, Button, Card, Icon, IconLink, Meter, Pill, Segmented } from '@/components/ui';
import { bots } from '@/lib/data';
import { routes } from '@/lib/routes';

const tabs = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'mini-app', label: 'Mini App' },
  { value: 'all', label: 'ทั้งหมด · 6' },
] as const;

const badges = [
  { label: 'Live data · ES POS · read-only', tone: 'ok' },
  { label: 'รีเฟรชทุก 15 นาที', tone: 'neutral' },
  { label: 'สิทธิ์ตาม Passport ของ POS Ops', tone: 'neutral' },
  { label: 'routine: ส่งสรุปเข้า LINE 07:30', tone: 'neutral' },
] as const;

const kpis = [
  { label: 'ยอดขายรวม', value: '[฿]' },
  { label: 'จำนวนบิล', value: '[บิล]' },
  { label: 'ต่อบิลเฉลี่ย', value: '[฿]' },
];

// Bar lengths fill from real data once ES POS is connected.
const branches = ['[สาขา 1]', '[สาขา 2]', '[สาขา 3]'];

const commissionFields = [
  { label: 'ยอดขายพนักงาน (บาท)', value: '[ยอดขาย]' },
  { label: 'อัตราค่าคอม (%)', value: '[อัตรา]' },
];

/** Thumbnail of a bar chart for the artifact card. */
function ChartThumb() {
  return (
    <div aria-hidden="true" className="box-border flex h-11 w-14 items-end justify-center gap-[3px] rounded-[10px] bg-accent-soft p-2">
      {[12, 20, 16, 26].map((h) => (
        <span key={h} className="w-1.5 rounded-sm bg-accent" style={{ height: h }} />
      ))}
    </div>
  );
}

/** 06 · Artifacts — chat on the left, live artifact panel on the right. */
export function Artifacts() {
  const [tab, setTab] = useState<(typeof tabs)[number]['value']>('dashboard');

  return (
    <DesktopPage title="Artifacts" direction="row">
      <main aria-label="Thread ของ POS Ops" className="flex min-w-0 max-w-[560px] shrink grow basis-[440px] flex-col border-r border-line">
        <header className="flex items-center gap-2.5 border-b border-line px-6 py-3.5">
          <IconLink to={routes.workspace} icon="back" label="กลับไปที่ workspace" size={32} iconSize={14} />
          <BotAvatar color={bots.pos.color} size={28} />
          <h1 className="m-0 text-base font-semibold">{bots.pos.name}</h1>
        </header>

        <div className="flex flex-1 flex-col gap-3.5 p-6">
          <Bubble from="out" className="max-w-[85%]">
            ทำ dashboard ยอดขายทุกสาขาให้ดูทุกเช้า กับเครื่องคิดค่าคอมพนักงานให้ผู้จัดการสาขาใช้เอง
          </Bubble>
          <Bubble from="in" className="max-w-[92%] py-3">
            ทำให้ 2 ชิ้นค่ะ ทั้งคู่ดึงข้อมูลจาก ES POS แบบอ่านอย่างเดียวตาม Passport ของ POS Ops
          </Bubble>

          <a href="#dash" className="flex items-center gap-3 rounded-2xl p-3 no-underline !text-ink shadow-ring-accent hover:bg-sand">
            <ChartThumb />
            <span className="flex flex-1 flex-col">
              <span className="font-semibold">Dashboard · ยอดขายสาขา</span>
              <span className="text-xs text-muted">Live data · v3 · เปิดอยู่ด้านขวา</span>
            </span>
          </a>

          <Card aria-label="Mini App ตัวคำนวณค่าคอม" className="gap-2.5 p-3.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Mini App · คำนวณค่าคอม</span>
              <span className="text-xs text-muted">ใช้ได้ในแชตเลย</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {commissionFields.map((f) => (
                <label key={f.label} className="flex flex-col gap-1 text-xs text-muted">
                  {f.label}
                  <input
                    type="text"
                    defaultValue={f.value}
                    className="h-10 min-w-0 rounded-[10px] border border-line px-2.5 font-mono text-[13px] text-ink outline-none focus:border-ink"
                  />
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-[10px] bg-sand px-3 py-2.5">
              <span className="text-[13px]">ค่าคอมที่ได้</span>
              <span className="font-mono font-medium">[ผลลัพธ์ ฿]</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="md">แชร์ลิงก์ให้ผู้จัดการ</Button>
              <Button size="md">เปิดเต็มจอ</Button>
            </div>
          </Card>
        </div>
      </main>

      <section id="dash" aria-label="Artifact panel" className="flex min-w-0 shrink grow-[999] basis-[560px] flex-col bg-sand">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-6 py-3">
          <Segmented label="Artifacts ใน session" options={tabs} value={tab} onChange={setTab} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted">v3 · แก้ล่าสุด 08:00</span>
            <Button size="md">ปักหมุด</Button>
            <Button size="md">ให้ Bot แก้</Button>
            <Button size="md" variant="primary">
              แชร์
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-line bg-paper px-6 py-2.5">
          {badges.map((b) => (
            <Pill key={b.label} tone={b.tone}>
              {b.label}
            </Pill>
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-6">
          <Card variant="paper" className="gap-5 rounded-[20px] p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="m-0 text-[22px] font-medium tracking-[-0.2px]">ยอดขายทุกสาขา · เมื่อวาน</h2>
              <span className="text-xs text-muted">ข้อมูลจาก ES POS</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {kpis.map((k) => (
                <div key={k.label} className="flex flex-col gap-0.5 rounded-[14px] bg-sand p-3.5">
                  <span className="text-xs text-muted">{k.label}</span>
                  <span className="font-mono text-2xl font-medium">{k.value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-[13px] font-medium">เทียบรายสาขา</span>
              {branches.map((b) => (
                <div key={b} className="flex items-center gap-3">
                  <span className="w-[120px] text-[13px]">{b}</span>
                  <Meter value={100} label={`ยอดขาย ${b}`} height={14} color="rgb(35 72 216 / 0.25)" className="flex-1" />
                  <span className="w-16 text-right font-mono text-xs">[฿]</span>
                </div>
              ))}
              <span className="text-xs text-muted">ความยาวแท่งเติมจากข้อมูลจริงเมื่อเชื่อม ES POS</span>
            </div>
          </Card>

          <Card variant="paper" className="flex-row items-center gap-3 px-4 py-3">
            <Icon name="chat" size={18} className="text-muted" />
            <span className="flex-1 text-[13px] text-muted">คอมเมนต์บนกราฟหรือตัวเลขไหนก็ได้ แล้วส่งให้ Bot แก้เป็นเวอร์ชันใหม่</span>
            <Button size="sm">ดูประวัติเวอร์ชัน</Button>
          </Card>
        </div>
      </section>
    </DesktopPage>
  );
}
