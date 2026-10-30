import clsx from 'clsx';
import { useState } from 'react';
import { DesktopPage } from '@/components/layout/DesktopPage';
import { BotAvatar, Bubble, Button, ButtonLink, Card, Composer, Icon, IconButton, Pill, StatTile } from '@/components/ui';
import { bots } from '@/lib/data';
import { routes } from '@/lib/routes';
import { Link } from 'react-router-dom';
import { BotSidebar } from './BotSidebar';
import { SessionRail } from './SessionRail';

const plan = [
  { label: 'อ่าน Google Sheet "Leads ชลบุรี"', kind: 'read', done: true },
  { label: 'ค้นข้อมูลร้านบนเว็บ เทียบกับ CRM', kind: 'read', done: true },
  { label: 'ร่างข้อความรายร้าน + Verifier ตรวจ', kind: 'draft', done: true },
  { label: 'ส่งผ่าน LINE OA', kind: 'send · ต้องอนุมัติ', done: false },
];

/** 01 · Workspace + Session rail */
export function Workspace() {
  const [railOpen, setRailOpen] = useState(true);

  return (
    <DesktopPage title="Workspace" direction="row">
      <BotSidebar />

      <main className="flex min-w-0 shrink grow-[999] basis-[520px] flex-col border-r border-line">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <BotAvatar color={bots.sales.color} size={28} />
            <h1 className="m-0 text-base font-semibold">{bots.sales.name}</h1>
            <Pill tone="accent">Trust L2 · ร่างเองได้ ส่งต้องขอ</Pill>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={routes.models}
              className="rounded-full px-2.5 py-1 font-mono text-xs no-underline !text-sub shadow-ring hover:bg-sand"
            >
              model: auto ▾
            </Link>
            <ButtonLink to={routes.sideChat} variant="soft" size="md">
              <Icon name="chat" size={15} />
              กระซิบ <span className="font-mono text-[11px] text-muted">⌘;</span>
            </ButtonLink>
            <ButtonLink to={routes.fork} variant="soft" size="md">
              <Icon name="fork" size={15} />
              Fork
            </ButtonLink>
            <IconButton
              icon="panelRight"
              label={railOpen ? 'ซ่อน session rail' : 'แสดง session rail'}
              aria-pressed={railOpen}
              onClick={() => setRailOpen((v) => !v)}
            />
            <IconButton icon="info" label="ดูรายละเอียด Bot" />
          </div>
        </header>

        <div className="mx-auto box-border flex w-full max-w-[760px] flex-1 flex-col gap-4 p-6">
          <Bubble from="out">
            ดึงร้านอาหารในชลบุรีจาก Google Sheet แล้วร่างข้อความ LINE OA แนะนำ ES POS Lite ในโทนของพี่
            ส่งให้ร้านที่ยังไม่เคยติดต่อ
          </Bubble>

          <Card aria-label="แผนงานก่อนลงมือ" className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">แผนก่อนลงมือ · 4 ขั้น</span>
              <span className="text-xs font-medium text-ok">พี่อนุมัติแผนแล้ว 10:31</span>
            </div>
            <ol className="m-0 flex list-none flex-col gap-2 p-0">
              {plan.map((s, i) => (
                <li key={s.label} className="flex items-center gap-2.5">
                  <span
                    className={clsx(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[11px]',
                      s.done ? 'bg-ok text-paper' : 'font-semibold text-warn shadow-[inset_0_0_0_2px_#B45309]',
                    )}
                  >
                    {s.done ? '✓' : i + 1}
                  </span>
                  <span className={clsx('flex-1', !s.done && 'font-medium')}>{s.label}</span>
                  <span className={clsx('font-mono text-[11px]', s.done ? 'text-muted' : 'text-warn')}>{s.kind}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Bubble from="in" className="flex flex-col gap-1 py-3">
            <span>✓ Google Sheet → 24 ร้าน · 2 ร้านเคยติดต่อแล้ว ข้ามให้</span>
            <span>✓ Web + CRM → ข้อมูลครบ 20 ร้าน · 2 ร้านไม่พบหน้าร้านออนไลน์</span>
            <span>✓ ร่างข้อความ 22 ชิ้นในโทนพี่ (จาก skill "ES Sales Voice")</span>
          </Bubble>

          <Card as="section" variant="sand" aria-label="ผลตรวจของ Verifier" className="flex-row items-start gap-3 px-4 py-3.5">
            <Icon name="shieldCheck" size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-ok" />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">Verifier ตรวจแล้ว · ผ่าน 20 / 22</span>
              <span className="text-[13px] text-muted">2 ข้อความชื่อร้านไม่ตรงกับ Sheet — แก้ให้แล้ว รอพี่ดูในตัวอย่าง</span>
            </div>
          </Card>

          <Card variant="accent" aria-label="คำขออนุมัติ" className="gap-3">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-[15px] font-semibold">ขออนุมัติ: ส่ง 22 ข้อความผ่าน LINE OA</span>
              <span className="text-xs text-muted">ไม่หมดอายุเงียบ · แจ้งเตือน LINE ใน 30 นาที</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatTile label="ใช้สิทธิ์" value="LINE OA ของ Bot นี้เท่านั้น" />
              <StatTile label="ย้อนกลับได้ไหม" value="ไม่ได้ · ส่งแล้วถอนไม่ได้" valueClass="text-warn" />
              <StatTile label="ค่าใช้จ่ายขั้นนี้" value="[ประมาณการ ฿]" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" className="px-[18px]">
                อนุมัติครั้งนี้
              </Button>
              <Button className="px-[18px]">ดูตัวอย่าง 3 ข้อความ</Button>
              <Button className="px-[18px]">ส่งทดลอง 1 ร้านก่อน</Button>
              <Button variant="ghost" className="px-[18px]">
                ปฏิเสธ
              </Button>
            </div>
          </Card>
        </div>

        <div className="mx-auto box-border w-full max-w-[760px] px-6 pb-5 pt-3">
          <Composer label="ข้อความถึง Sales Outbound" placeholder="พิมพ์ถึง Sales Outbound · @ เรียก Bot หรือ skill" />
        </div>
      </main>

      {railOpen && <SessionRail />}
    </DesktopPage>
  );
}
