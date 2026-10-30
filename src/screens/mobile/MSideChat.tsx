import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MobileScreen } from '@/components/layout/MobileScreen';
import { Bubble, Button, ButtonLink, Composer, IconLink, Pill } from '@/components/ui';
import { bots } from '@/lib/data';
import { routes } from '@/lib/routes';

const tags = [
  { label: 'อ่านบริบทได้', tone: 'neutral' },
  { label: 'ไม่ลง thread หลัก', tone: 'neutral' },
  { label: 'read-only', tone: 'ok' },
] as const;

/** M03 · Side Chat — a bottom sheet over the (dimmed) running chat. */
export function MSideChat() {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate(routes.mChat);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <MobileScreen title="กระซิบข้างหู" className="bg-[#8A8986]">
      {/* Dimmed main chat behind the sheet; tapping it closes the sheet. */}
      <Link
        to={routes.mChat}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-x-0 top-0 box-border flex h-[200px] flex-col gap-2 bg-paper px-4 py-[18px] no-underline !text-ink opacity-[.55]"
      >
        <span className="font-semibold">{bots.sales.name}</span>
        <span className="text-[13px]">run ยังทำงานต่อ · ไม่ถูกขัด</span>
      </Link>

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="m-side-chat-title"
        className="absolute inset-x-0 bottom-0 box-border flex h-[700px] max-h-[calc(100%-24px)] flex-col rounded-t-3xl bg-paper"
      >
        <div className="flex justify-center pb-1 pt-2">
          <span className="h-[5px] w-10 rounded-full bg-[#D5D3CF]" />
        </div>
        <header className="flex flex-col gap-2 border-b border-line px-4 pb-3 pt-1">
          <div className="flex items-center justify-between">
            <h1 id="m-side-chat-title" className="m-0 text-lg font-semibold">
              กระซิบข้างหู
            </h1>
            <IconLink to={routes.mChat} icon="close" label="ปิด" size={44} strokeWidth={2} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Pill key={t.label} tone={t.tone}>
                {t.label}
              </Pill>
            ))}
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 text-sm">
          <Bubble from="out" className="max-w-[85%] px-3.5 !rounded-[16px_16px_4px_16px]">
            2 ร้านที่แก้ชื่อคือร้านไหน ส่งเลยเสี่ยงไหม
          </Bubble>
          <Bubble from="in" className="flex max-w-[92%] flex-col gap-1.5 px-3.5 py-3 !rounded-[16px_16px_16px_4px]">
            <span>
              ครัวบ้านทุ่ง → <strong className="font-semibold">ครัวบ้านทุ่งสุขลา</strong> และ ก๋วยเตี๋ยวเรือป้า →{' '}
              <strong className="font-semibold">ก๋วยเตี๋ยวเรือป้านิด</strong>
            </span>
            <span>ร้านที่ 2 ไม่มี LINE ใน CRM อาจตีกลับ แนะนำส่งทดลอง 1 ร้านก่อนค่ะ</span>
            <span className="text-xs text-muted">อ้างอิง snapshot #3 · Sheet แถว 7, 15</span>
          </Bubble>
          <span className="pt-1 text-[13px] font-semibold">เอากลับไปที่ thread หลัก?</span>
          <Button variant="primary" size="xl" className="shrink-0">
            ส่งเป็นคำสั่ง: "ทดลอง 1 ร้านก่อน"
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button className="h-11 text-sm">ปักเป็น note</Button>
            <ButtonLink to={routes.mFork} className="h-11 text-sm">
              Fork จากตรงนี้
            </ButtonLink>
          </div>
          <span className="text-xs text-muted">ปัดลงเพื่อปิด · ไม่กินบริบทหรืองบของ run</span>
        </div>

        <div className="px-3 pb-[22px]">
          <Composer label="ถามแบบกระซิบ" placeholder="ถามแบบกระซิบ…" action="send" size="lg" className="py-1 pr-1" />
        </div>
      </section>
    </MobileScreen>
  );
}
