import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MobileScreen } from '@/components/layout/MobileScreen';
import { Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { routes } from '@/lib/routes';

const images = [1, 2, 3, 4];

const checks = [
  { label: 'Brand check', result: 'ผ่าน' },
  { label: 'ตัวอักษร', result: 'อ่านได้' },
  { label: 'โลโก้คนอื่น', result: 'ไม่พบ' },
  { label: 'ใบหน้าจริง', result: 'ไม่พบ' },
];

const round = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2A2A28] text-paper hover:bg-[#3A3A37]';
const darkButton = 'h-11 cursor-pointer rounded-full border-0 bg-[#2A2A28] text-[13px] text-paper hover:bg-[#3A3A37]';

/** M08 · Image Preview */
export function MImage() {
  const [current, setCurrent] = useState(1);

  return (
    <MobileScreen title="Image Preview" className="bg-[#141413] text-paper">
      <header className="flex items-center gap-2 px-3 pb-2 pt-3">
        <Link to={routes.mHome} aria-label="ปิด" className={cn(round, 'no-underline hover:!text-paper')}>
          <Icon name="close" size={16} strokeWidth={2} />
        </Link>
        <div className="flex flex-1 flex-col items-center">
          <h1 className="m-0 text-[15px] font-semibold">
            ภาพ {current} / {images.length}
          </h1>
          <span className="text-xs text-rule">Content Factory · 4:5</span>
        </div>
        <button type="button" aria-label="ดาวน์โหลด" className={cn(round, 'cursor-pointer border-0')}>
          <Icon name="download" size={18} />
        </button>
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex justify-center px-4 py-2">
          <div className="relative flex aspect-[358/447] w-full max-w-[358px] items-center justify-center rounded-[14px] bg-[#E8E3DA] text-[13px] text-muted">
            [ภาพที่สร้าง · 1080×1350]
            <div
              aria-hidden="true"
              className="absolute left-[17.9%] top-[58.2%] h-[13.9%] w-[34.1%] rounded-lg shadow-[0_0_0_2px_#FFFFFF,0_0_0_4px_#2348D8]"
            />
          </div>
        </div>

        <div role="radiogroup" aria-label="เลือกภาพ" className="flex justify-center gap-2 px-4 pb-2.5 pt-1">
          {images.map((n) => {
            const on = n === current;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`ภาพ ${n}`}
                onClick={() => setCurrent(n)}
                className={cn(
                  'h-16 w-[52px] cursor-pointer rounded-lg border-0',
                  on ? 'bg-[#E8E3DA] shadow-ring-accent' : 'bg-[#CFC9BE]',
                )}
              />
            );
          })}
        </div>

        <section
          aria-labelledby="harness-check"
          className="mx-4 flex flex-col gap-1.5 rounded-[14px] bg-[#1E1E1C] px-3.5 py-3 text-[13px]"
        >
          <h2 id="harness-check" className="m-0 text-[13px] font-semibold">
            Harness ตรวจภาพ
          </h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-rule">
            {checks.map((c) => (
              <span key={c.label}>
                {c.label} <span className="text-[#86EFAC]">{c.result}</span>
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-2 px-4 pb-6 pt-3">
        <div className="grid grid-cols-3 gap-2">
          <button type="button" className={darkButton}>
            แก้จุดที่เลือก
          </button>
          <button type="button" className={darkButton}>
            สร้างคล้ายกัน
          </button>
          <button type="button" className={darkButton}>
            Upscale
          </button>
        </div>
        <button
          type="button"
          className="h-12 cursor-pointer rounded-full border-0 bg-paper text-[15px] font-medium text-ink hover:bg-chip"
        >
          ใช้ในโพสต์ · ขออนุมัติก่อนโพสต์
        </button>
      </div>
    </MobileScreen>
  );
}
