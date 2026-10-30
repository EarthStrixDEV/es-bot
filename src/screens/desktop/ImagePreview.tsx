import { cn } from '@/lib/cn';
import { useState } from 'react';
import { DesktopPage } from '@/components/layout/DesktopPage';
import { BotAvatar, Bubble, Card, IconLink } from '@/components/ui';
import { bots } from '@/lib/data';
import { routes } from '@/lib/routes';

const images = ['[ภาพ 1]', '[ภาพ 2]', '[ภาพ 3]', '[ภาพ 4]'];

const checks = [
  { label: 'Brand check (สี ฟอนต์ โลโก้ ES)', result: 'ผ่าน' },
  { label: 'ข้อความในภาพอ่านได้', result: 'ผ่าน' },
  { label: 'โลโก้/แบรนด์ของคนอื่น', result: 'ไม่พบ' },
  { label: 'ใบหน้าบุคคลจริง', result: 'ไม่พบ' },
];

const meta = ['size 1080×1350 · 4:5', 'model [ชื่อโมเดลภาพ]', 'seed [seed]', 'เก็บใน /workspace/content/ig'];

const actions = ['แก้เฉพาะจุดที่เลือก', 'สร้างแบบคล้ายกัน', 'Upscale'];

// Buttons on the dark viewer surface.
const darkBtn = 'cursor-pointer rounded-full border-0 bg-[#2A2A28] text-paper hover:bg-[#3A3A37]';

/** 07 · Image Preview */
export function ImagePreview() {
  const [selected, setSelected] = useState(0);
  const step = (d: number) => setSelected((i) => (i + d + images.length) % images.length);

  return (
    <DesktopPage title="Image Preview" direction="row">
      <main
        aria-label="Thread ของ Content Factory"
        className="flex min-w-0 max-w-[560px] shrink grow basis-[440px] flex-col border-r border-line"
      >
        <header className="flex items-center gap-2.5 border-b border-line px-6 py-3.5">
          <IconLink to={routes.workspace} icon="back" label="กลับไปที่ workspace" size={32} iconSize={14} />
          <BotAvatar color={bots.content.color} size={28} />
          <h1 className="m-0 text-base font-semibold">{bots.content.name}</h1>
        </header>

        <div className="flex flex-1 flex-col gap-3.5 p-6">
          <Bubble from="out" className="max-w-[85%]">
            ทำภาพโปรโมต ES POS Lite สำหรับร้านกาแฟ แนวตั้ง 4:5 ไว้โพสต์ Facebook
          </Bubble>

          <Card aria-label="ผลการสร้างภาพ" className="gap-2.5 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">สร้างแล้ว 4 ภาพ</span>
              <span className="font-mono text-[11px] text-muted">image-model · 4:5 · [฿]</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {images.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={i === selected}
                  onClick={() => setSelected(i)}
                  className={cn(
                    'aspect-[4/5] cursor-pointer rounded-xl border-0 bg-[#E8E3DA] text-xs text-muted',
                    i === selected && 'shadow-[0_0_0_3px_#2348D8]',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <details className="text-[13px]">
              <summary className="cursor-pointer text-muted">ดู prompt ที่ Bot ใช้</summary>
              <p className="mb-0 mt-2 font-mono text-xs">[prompt ที่สร้างจาก brief + brand kit ของ ES]</p>
            </details>
          </Card>

          <Bubble from="in" className="max-w-[92%] py-3">
            ภาพ 1 ผ่าน brand check ค่ะ ภาพ 3 มีตัวอักษรเพี้ยนในเมนู แนะนำให้แก้เฉพาะจุดก่อนใช้
          </Bubble>
        </div>
      </main>

      <section aria-label="Image preview" className="flex min-w-0 shrink grow-[999] basis-[560px] flex-wrap bg-[#141413]">
        <div className="flex min-w-0 shrink grow-[999] basis-[420px] flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-paper">
            <span className="font-medium">
              ภาพ {selected + 1} / {images.length}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" aria-label="ภาพก่อนหน้า" onClick={() => step(-1)} className={cn(darkBtn, 'h-9 w-9')}>
                ‹
              </button>
              <button type="button" aria-label="ภาพถัดไป" onClick={() => step(1)} className={cn(darkBtn, 'h-9 w-9')}>
                ›
              </button>
              <button type="button" className={cn(darkBtn, 'h-9 px-3.5 text-[13px]')}>
                ซูม 100%
              </button>
              <button type="button" className={cn(darkBtn, 'h-9 px-3.5 text-[13px]')}>
                เทียบก่อน/หลัง
              </button>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center px-6 pb-6 pt-4">
            <div className="relative flex aspect-[4/5] w-full max-w-[440px] items-center justify-center rounded-xl bg-[#E8E3DA] text-muted">
              [ภาพที่สร้าง · 1080×1350]
              {/* Region picked for "แก้เฉพาะจุดที่เลือก" */}
              <div
                aria-hidden="true"
                className="absolute left-[18%] top-[58%] h-[14%] w-[34%] rounded-lg shadow-[0_0_0_2px_#FFFFFF,0_0_0_4px_#2348D8]"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 px-5 pb-5">
            {actions.map((a) => (
              <button key={a} type="button" className={cn(darkBtn, 'h-10 px-4')}>
                {a}
              </button>
            ))}
            <button type="button" className="h-10 cursor-pointer rounded-full border-0 bg-paper px-4 font-medium text-ink hover:bg-chip">
              ใช้ในโพสต์
            </button>
          </div>
        </div>

        <aside
          aria-label="รายละเอียดภาพ"
          className="box-border flex max-w-[320px] shrink grow basis-[260px] flex-col gap-4 bg-[#1E1E1C] p-5 text-paper"
        >
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold">Harness ตรวจภาพ</span>
            {checks.map((c) => (
              <div key={c.label} className="flex justify-between text-[13px]">
                <span>{c.label}</span>
                <span className="text-[#86EFAC]">{c.result}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-[#3A3A37]" />
          <div className="flex flex-col gap-1.5 font-mono text-xs text-rule">
            {meta.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
          <div className="h-px bg-[#3A3A37]" />
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">ก่อนโพสต์จริง</span>
            <span className="text-[13px] text-rule">
              โพสต์ลง Facebook Page เป็นงาน L1 · Bot จะขออนุมัติพร้อมแคปชันทุกครั้ง
            </span>
          </div>
        </aside>
      </section>
    </DesktopPage>
  );
}
