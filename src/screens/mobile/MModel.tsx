import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MobileScreen } from '@/components/layout/MobileScreen';
import { IconLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { bots } from '@/lib/data';
import { routes } from '@/lib/routes';

const autoPicks = ['#1 อ่าน Sheet · Haiku 5.5', '#2 ค้นข้อมูล · Sonnet 5.5', '#3 ร่าง · Sonnet 5.5', '#3 Verifier · Opus 5.5'];

const models = [
  { id: 'opus', name: 'Claude Opus 5.5', note: 'งานยาก วางแผนหลายขั้น', price: '[฿/งาน]' },
  { id: 'sonnet', name: 'Claude Sonnet 5.5', note: 'เขียน งานทั่วไป', price: '[฿/งาน]' },
  { id: 'haiku', name: 'Claude Haiku 5.5', note: 'เร็ว ค้นและสรุป', price: '[฿/งาน]' },
  { id: 'grok', name: 'Grok 4.6', note: 'ผู้ให้บริการอื่น', price: '[฿/งาน]' },
];

const scopes = [
  { value: 'run', label: 'run นี้' },
  { value: 'session', label: 'session' },
  { value: 'forever', label: 'ถาวร' },
] as const;

/** M09 · Model Selector (bottom sheet over the chat) */
export function MModel() {
  const [model, setModel] = useState('auto');
  const [scope, setScope] = useState<(typeof scopes)[number]['value']>('run');
  const isAuto = model === 'auto';

  return (
    <MobileScreen title="เลือกโมเดล" className="bg-[#8A8986]">
      <Link to={routes.mChat} aria-hidden="true" tabIndex={-1} className="absolute inset-0" />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="mm"
        className="absolute inset-x-0 bottom-0 box-border flex h-[760px] max-h-[calc(100%-24px)] flex-col rounded-t-3xl bg-paper"
      >
        <div className="flex justify-center pb-1 pt-2">
          <span className="h-[5px] w-10 rounded-full bg-[#D5D3CF]" />
        </div>
        <header className="flex items-center justify-between px-4 pb-2.5 pt-1">
          <div className="flex flex-col">
            <h1 id="mm" className="m-0 text-lg font-semibold">
              เลือกโมเดล
            </h1>
            <span className="text-xs text-muted">{bots.sales.name}</span>
          </div>
          <IconLink to={routes.mChat} icon="close" label="ปิด" size={44} strokeWidth={2} />
        </header>

        <div role="radiogroup" aria-label="โมเดล" className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4">
          <button
            type="button"
            role="radio"
            aria-checked={isAuto}
            onClick={() => setModel('auto')}
            className={cn(
              'flex shrink-0 cursor-pointer flex-col gap-1 rounded-2xl border-0 p-3.5 text-left',
              isAuto ? 'bg-accent-soft shadow-ring-accent' : 'bg-paper shadow-ring',
            )}
          >
            <span className="flex w-full justify-between">
              <span className="font-semibold">Auto (แนะนำ)</span>
              {isAuto && <span className="text-xs font-medium text-accent-ink">กำลังใช้</span>}
            </span>
            <span className="text-[13px] text-sub">เลือกต่อขั้น แสดงเหตุผลเสมอ</span>
          </button>

          <details className="shrink-0 rounded-[14px] bg-sand px-3.5 py-2.5 text-[13px]">
            <summary className="min-h-7 cursor-pointer font-medium">run นี้ Auto เลือกอะไร</summary>
            <div className="flex flex-col gap-1 pt-1.5 font-mono text-xs">
              {autoPicks.map((p) => (
                <span key={p}>{p}</span>
              ))}
            </div>
          </details>

          <span className="pt-0.5 text-xs text-muted">หรือ pin เอง</span>
          <div className="flex flex-col">
            {models.map((m, i) => {
              const on = model === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setModel(m.id)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between border-0 bg-transparent px-0.5 py-3 text-left',
                    i < models.length - 1 && 'border-b border-solid border-line',
                  )}
                >
                  <span className="flex flex-col">
                    <span className={on ? 'font-semibold' : 'font-medium'}>{m.name}</span>
                    <span className="text-xs text-muted">{m.note}</span>
                  </span>
                  {on ? (
                    <span className="text-xs font-medium text-accent-ink">กำลังใช้</span>
                  ) : (
                    <span className="font-mono text-2xs text-muted">{m.price}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-line px-4 pb-6 pt-3">
          <span className="text-xs text-muted">pin ไว้นานแค่ไหน</span>
          <div role="radiogroup" aria-label="ขอบเขตการ pin" className="flex gap-1 rounded-full bg-sand p-1">
            {scopes.map((s) => {
              const on = s.value === scope;
              return (
                <button
                  key={s.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setScope(s.value)}
                  className={cn(
                    'h-10 flex-1 cursor-pointer rounded-full border-0 text-[13px]',
                    on ? 'bg-paper font-medium shadow-ring' : 'bg-transparent text-muted hover:text-ink',
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </MobileScreen>
  );
}
