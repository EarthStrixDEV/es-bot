import { DesktopPage } from '@/components/layout/DesktopPage';
import { BotAvatar, Bubble, Button, ButtonLink, Card, Composer, Icon, IconLink, Pill } from '@/components/ui';
import { bots } from '@/lib/data';
import { routes } from '@/lib/routes';

const scope = [
  { label: 'อ่านบริบทถึงข้อความล่าสุด', tone: 'neutral' },
  { label: 'ไม่เขียนลง thread หลัก', tone: 'neutral' },
  { label: 'read-only · ส่ง/แก้อะไรไม่ได้', tone: 'ok' },
] as const;

/** 04 · Side Chat — a read-only whisper next to a run that keeps going. */
export function SideChat() {
  return (
    <DesktopPage title="Side Chat" direction="row">
      <main aria-label="Thread หลัก (ยังทำงานต่อ)" className="flex min-w-0 shrink grow-[999] basis-[520px] flex-col bg-sand">
        <header className="flex items-center gap-2.5 border-b border-line bg-paper px-6 py-3.5">
          <BotAvatar color={bots.sales.color} size={28} />
          <span className="text-base font-semibold">{bots.sales.name}</span>
          <Pill tone="accent">run กำลังทำงานต่อ · ไม่ถูกขัด</Pill>
        </header>
        <div aria-hidden="true" className="mx-auto box-border flex w-full max-w-[720px] flex-1 flex-col gap-3.5 p-6 opacity-50">
          <Bubble from="out">ดึงร้านอาหารในชลบุรีจาก Google Sheet แล้วร่างข้อความ LINE OA แนะนำ ES POS Lite</Bubble>
          <Card variant="paper" className="gap-1.5 shadow-none">
            <span className="font-semibold">แผนก่อนลงมือ · 4 ขั้น</span>
            <span>✓ อ่าน Sheet · ✓ ค้นข้อมูล · ✓ ร่าง + Verifier · ส่ง LINE OA</span>
          </Card>
          <Card variant="paper" className="shadow-none">
            Verifier ตรวจแล้ว · ผ่าน 20 / 22
          </Card>
          <Card variant="accent" className="bg-paper">
            ขออนุมัติ: ส่ง 22 ข้อความผ่าน LINE OA
          </Card>
        </div>
      </main>

      <aside aria-label="Side chat" className="box-border flex max-w-[520px] shrink grow basis-[420px] flex-col bg-paper shadow-side">
        <header className="flex flex-col gap-2 border-b border-line px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon name="chat" size={18} />
              <h1 className="m-0 text-base font-semibold">กระซิบข้างหู</h1>
              <span className="rounded-full px-2 py-0.5 font-mono text-[11px] text-muted shadow-ring">⌘; · /btw</span>
            </div>
            <IconLink to={routes.workspace} icon="close" label="ปิด side chat" iconSize={14} strokeWidth={2} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {scope.map((s) => (
              <Pill key={s.label} tone={s.tone}>
                {s.label}
              </Pill>
            ))}
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-3.5 p-5">
          <Bubble from="out" className="max-w-[85%] rounded-[16px_16px_4px_16px] px-3.5">
            2 ร้านที่ Verifier แก้ชื่อคือร้านไหน ส่งเลยเสี่ยงไหม
          </Bubble>
          <Bubble from="in" className="flex max-w-[92%] flex-col gap-2 rounded-[16px_16px_16px_4px] px-3.5 py-3">
            <span>
              ครัวบ้านทุ่ง → <strong className="font-semibold">ครัวบ้านทุ่งสุขลา</strong> และ ก๋วยเตี๋ยวเรือป้า →{' '}
              <strong className="font-semibold">ก๋วยเตี๋ยวเรือป้านิด</strong> แก้ตาม Sheet แล้วค่ะ
            </span>
            <span>ความเสี่ยงต่ำ แต่ร้านที่ 2 ไม่มี LINE ใน CRM ข้อความอาจตีกลับ แนะนำส่งทดลอง 1 ร้านก่อน</span>
            <span className="text-xs text-muted">อ้างอิง: snapshot #3 · Sheet แถว 7, 15</span>
          </Bubble>

          <Card aria-label="นำคำตอบไปใช้" className="gap-2.5 rounded-[14px] p-3.5">
            <span className="text-[13px] font-semibold">อยากเอาเรื่องนี้กลับไปที่ thread หลักไหม</span>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary">ส่งเป็นคำสั่ง: "ส่งทดลอง 1 ร้านก่อน"</Button>
              <Button>ปักเป็น note ใน Memory</Button>
              <ButtonLink to={routes.fork}>Fork จากตรงนี้</ButtonLink>
            </div>
            <span className="text-xs text-muted">ไม่เลือกอะไร = ปิดแล้วหายไป ไม่กินบริบทหรืองบของ run</span>
          </Card>
        </div>

        <div className="px-5 pb-5 pt-3">
          <Composer label="ถามแบบกระซิบ" placeholder="ถามแบบกระซิบ… Bot ยังทำงานต่อ" action="send" />
        </div>
      </aside>
    </DesktopPage>
  );
}
