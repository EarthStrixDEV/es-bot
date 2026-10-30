import { useId, useState } from 'react';
import { DesktopPage } from '@/components/layout/DesktopPage';
import { BotAvatar, IconLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { bots } from '@/lib/data';
import { routes } from '@/lib/routes';
import { RadioSegmented } from './settings/RadioSegmented';

const models = [
  { id: 'opus', name: 'Claude Opus 5.5', use: 'งานยาก วางแผนหลายขั้น', cost: 'ลึก · [฿/งาน]' },
  { id: 'sonnet', name: 'Claude Sonnet 5.5', use: 'เขียนข้อความ งานทั่วไป', cost: 'สมดุล · [฿/งาน]' },
  { id: 'haiku', name: 'Claude Haiku 5.5', use: 'ค้นข้อมูล สรุป จัดหมวด', cost: 'เร็ว · [฿/งาน]' },
  { id: 'grok', name: 'Grok 4.6', use: 'ทางเลือกจากผู้ให้บริการอื่น', cost: '[฿/งาน]' },
  { id: 'local', name: 'Local model', use: 'รันบนเครื่องพี่ ข้อมูลไม่ออกนอกบ้าน', cost: 'ฟรี · ช้ากว่า' },
];

const pinScopes = [
  { value: 'run', label: 'run นี้' },
  { value: 'session', label: 'session นี้' },
  { value: 'bot', label: 'Bot นี้ถาวร' },
] as const;

const autoPicks = [
  { step: '#1 อ่าน Sheet', model: 'Haiku 5.5', why: 'งานดึงข้อมูลตรงไปตรงมา เลือกตัวเร็วและถูก' },
  { step: '#2 ค้นข้อมูลร้าน', model: 'Sonnet 5.5', why: 'ต้องอ่านหน้าเว็บและเทียบ CRM' },
  { step: '#3 ร่างข้อความ', model: 'Sonnet 5.5', why: 'ใช้ skill "ES Sales Voice" ต้องการภาษาไทยที่เป็นธรรมชาติ' },
  { step: '#3 Verifier', model: 'Opus 5.5', why: 'ตรวจด้วยคนละโมเดลกับผู้ร่าง เพื่อไม่ให้ตรวจงานตัวเอง' },
];

/** 10 · Model Selector */
export function ModelSelector() {
  const titleId = useId();
  const [open, setOpen] = useState(true);
  const [model, setModel] = useState('auto');
  const [scope, setScope] = useState<(typeof pinScopes)[number]['value']>('run');

  return (
    <DesktopPage title="Model Selector" direction="row" className="bg-sand">
      <main className="flex min-w-0 shrink grow-[999] basis-[560px] flex-col border-r border-line bg-paper">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <IconLink to={routes.workspace} icon="back" label="กลับไปที่แชต" size={32} iconSize={14} />
            <BotAvatar color={bots.sales.color} size={28} />
            <h1 className="m-0 text-base font-semibold">{bots.sales.name}</h1>
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen((v) => !v)}
            className="h-9 cursor-pointer rounded-full border-0 bg-ink px-3.5 font-mono text-xs text-paper hover:bg-ink/90"
          >
            model: {model === 'auto' ? 'auto' : models.find((m) => m.id === model)?.name} ▾
          </button>
        </header>

        <div className="flex flex-1 justify-end px-6 pb-6 pt-2">
          {open && (
            <section
              role="dialog"
              aria-labelledby={titleId}
              className="flex h-fit w-full max-w-[520px] flex-col gap-3 rounded-[20px] bg-paper p-4 shadow-[0_0_0_1px_#E6E4E0,0_24px_48px_rgba(10,10,10,0.12)]"
            >
              <div className="flex items-center justify-between">
                <h2 id={titleId} className="m-0 text-base font-semibold">
                  เลือกโมเดล
                </h2>
                <span className="text-xs text-muted">ผลเฉพาะ Bot นี้</span>
              </div>

              <div role="radiogroup" aria-labelledby={titleId} className="flex flex-col gap-3">
                <button
                  type="button"
                  role="radio"
                  aria-checked={model === 'auto'}
                  onClick={() => setModel('auto')}
                  className={cn(
                    'flex cursor-pointer flex-col gap-1 rounded-[14px] border-0 p-3.5 text-left',
                    model === 'auto' ? 'bg-accent-soft shadow-ring-accent' : 'bg-paper shadow-ring hover:bg-sand',
                  )}
                >
                  <span className="flex w-full justify-between">
                    <span className="font-semibold">Auto (แนะนำ)</span>
                    {model === 'auto' && <span className="text-xs font-medium text-accent-ink">กำลังใช้</span>}
                  </span>
                  <span className="text-[13px] text-sub">
                    เลือกโมเดลต่อขั้นตามงาน แสดงเหตุผลทุกครั้ง และ Verifier ใช้คนละตัวกับผู้ร่างเสมอ
                  </span>
                </button>

                <span className="px-1 pt-1 text-xs text-muted">หรือ pin โมเดลเอง</span>
                <div className="flex flex-col gap-1">
                  {models.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={model === m.id}
                      onClick={() => setModel(m.id)}
                      className={cn(
                        'flex cursor-pointer items-center justify-between gap-3 rounded-xl border-0 px-3 py-2.5 text-left',
                        model === m.id ? 'bg-accent-soft shadow-ring-accent' : 'bg-transparent hover:bg-sand',
                      )}
                    >
                      <span className="flex flex-col">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-xs text-muted">{m.use}</span>
                      </span>
                      <span className="font-mono text-xs text-muted">{m.cost}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-line pt-3">
                <span className="text-xs text-muted">pin ไว้นานแค่ไหน</span>
                <RadioSegmented label="ขอบเขตการ pin" options={pinScopes} value={scope} onChange={setScope} stretch />
                <span className="text-xs text-muted">โมเดลที่ไม่อยู่ใน allowlist ของ Settings จะไม่แสดงที่นี่</span>
              </div>
            </section>
          )}
        </div>
      </main>

      <aside
        aria-label="เหตุผลการเลือกโมเดล"
        className="box-border flex max-w-[440px] shrink grow basis-[360px] flex-col gap-4 p-6"
      >
        <h2 className="m-0 text-base font-semibold">Auto เลือกอะไรใน run นี้</h2>
        <div className="flex flex-col gap-2.5">
          {autoPicks.map((p) => (
            <div key={p.step + p.model} className="flex flex-col gap-0.5 rounded-[14px] bg-paper px-3.5 py-3 shadow-ring">
              <span className="flex justify-between">
                <span className="font-medium">{p.step}</span>
                <span className="font-mono text-xs">{p.model}</span>
              </span>
              <span className="text-xs text-muted">{p.why}</span>
            </div>
          ))}
        </div>
        <span className="text-xs text-muted">ทุกการเลือกถูกบันทึกลง audit log พร้อมค่าใช้จ่ายรายขั้น</span>
      </aside>
    </DesktopPage>
  );
}
