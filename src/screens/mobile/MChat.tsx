import { Link } from 'react-router-dom';
import { MobileScreen } from '@/components/layout/MobileScreen';
import { BotAvatar, Bubble, Button, Card, Composer, IconButton, IconLink, KeyValue } from '@/components/ui';
import { bots } from '@/lib/data';
import { routes } from '@/lib/routes';

const approval = [
  { k: 'ใช้สิทธิ์', v: 'LINE OA ของ Bot นี้' },
  { k: 'ย้อนกลับ', v: 'ไม่ได้', tone: 'font-medium text-warn-ink' },
  { k: 'ค่าใช้จ่าย', v: '[ประมาณการ ฿]' },
];

/** M02 · แชต + Approval */
export function MChat() {
  return (
    <MobileScreen title={bots.sales.name}>
      <header className="flex items-center gap-2 border-b border-line px-3 pb-2.5 pt-3">
        <IconLink to={routes.mHome} icon="back" label="กลับ" tone="plain" size={44} iconSize={20} strokeWidth={2} />
        <BotAvatar color={bots.sales.color} size={32} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="m-0 text-base font-semibold">{bots.sales.name}</h1>
          <Link to={routes.mModel} className="font-mono text-2xs no-underline !text-muted">
            Trust L2 · model: auto ▾
          </Link>
        </div>
        <IconLink to={routes.mSideChat} icon="chat" label="กระซิบ (side chat)" size={44} iconSize={18} />
        <IconLink to={routes.mRail} icon="panelBottom" label="เปิด session rail" size={44} iconSize={18} />
      </header>

      <Link to={routes.mRail} className="flex items-center gap-2.5 bg-sand px-4 py-2 text-[13px] no-underline !text-ink">
        <span className="h-2 w-2 rounded-full bg-warn" />
        <span className="flex-1">รออนุมัติ · ขั้น 4/4</span>
        <span className="font-mono text-xs text-muted">งบ 31% · ctx 42%</span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <Bubble from="out" className="max-w-[85%] px-3.5 text-sm">
          ดึงร้านอาหารชลบุรีจาก Sheet แล้วร่างข้อความ LINE OA แนะนำ ES POS Lite
        </Bubble>

        <Card aria-label="แผนก่อนลงมือ" className="shrink-0 gap-1.5 px-3.5 py-3 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold">แผน · 4 ขั้น</span>
            <span className="text-xs text-ok">อนุมัติแล้ว</span>
          </div>
          <span>✓ อ่าน Sheet · ✓ ค้นข้อมูล · ✓ ร่าง + Verifier</span>
          <span className="font-medium text-warn-ink">4 ส่ง LINE OA · ต้องอนุมัติ</span>
        </Card>

        <Bubble from="in" className="max-w-[90%] px-3.5 text-sm">
          ร่าง 22 ข้อความแล้ว · Verifier ผ่าน 20/22 และแก้ชื่อร้าน 2 จุดให้แล้วค่ะ
        </Bubble>
      </div>

      <section aria-label="คำขออนุมัติ" className="mx-3 mb-2.5 flex flex-col gap-3 rounded-[20px] bg-paper p-4 shadow-float">
        <span className="text-base font-semibold">ส่ง 22 ข้อความผ่าน LINE OA?</span>
        <div className="flex flex-col gap-1.5">
          {approval.map((r) => (
            <KeyValue key={r.k} k={<span className="text-muted">{r.k}</span>} v={r.v} valueClass={r.tone} />
          ))}
        </div>
        <Button variant="primary" size="xl">
          อนุมัติครั้งนี้
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button className="h-11 text-sm">ส่งทดลอง 1 ร้าน</Button>
          <Button className="h-11 text-sm">ดูตัวอย่าง</Button>
        </div>
      </section>

      <div className="px-3 pb-[22px]">
        <Composer
          label="ข้อความถึง Sales Outbound"
          placeholder="พิมพ์ถึง Sales Outbound"
          size="lg"
          leading={<IconButton icon="plus" label="แนบไฟล์" tone="plain" size={40} iconSize={18} strokeWidth={2} />}
        />
      </div>
    </MobileScreen>
  );
}
