import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MobileScreen } from '@/components/layout/MobileScreen';
import { MobileTabBar } from '@/components/layout/MobileTabBar';
import { IconLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { user } from '@/lib/data';
import { routes } from '@/lib/routes';

type Connector = { name: string; meta: string; status: string; ok: boolean; mark: ReactNode; markClass: string };

const connectors: Connector[] = [
  { name: 'ES POS', meta: '8 tools · 2 Bot', status: 'เชื่อมแล้ว', ok: true, mark: 'ES', markClass: 'bg-ink text-paper text-[10px] font-semibold' },
  { name: 'LINE OA', meta: '4 tools · 1 Bot', status: 'เชื่อมแล้ว', ok: true, mark: null, markClass: 'bg-[#2F9E44]' },
  { name: 'Gmail', meta: 'ยังไม่มี Bot ใช้', status: 'login ใหม่', ok: false, mark: null, markClass: 'bg-[#E8590C]' },
];

type Row =
  | { kind: 'link'; label: string; value: string; to?: string }
  | { kind: 'toggle'; id: 'dnd' | 'noTrain'; label: string };

const general: Row[] = [
  { kind: 'link', label: 'โมเดลเริ่มต้น', value: 'Auto ›', to: routes.mModel },
  { kind: 'link', label: 'แจ้งเตือน', value: 'แอป · LINE ›' },
  { kind: 'link', label: 'approval ไม่มีคนตอบ', value: '30 นาที → LINE ›' },
  { kind: 'toggle', id: 'dnd', label: 'ห้ามรบกวน 22:00–07:00' },
  { kind: 'link', label: 'Harness ค่าเริ่มต้น', value: '›', to: routes.mPassport },
  { kind: 'toggle', id: 'noTrain', label: 'ไม่ใช้ข้อมูลไปเทรน' },
];

const rowBase = 'flex min-h-[52px] w-full items-center gap-3 px-3.5 text-left';
const divider = 'border-0 border-t border-solid border-line';

function SectionTitle({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="m-0 px-1 text-[13px] font-semibold text-muted">
      {children}
    </h2>
  );
}

/** M10 · Settings + Connectors */
export function MSettings() {
  const [toggles, setToggles] = useState({ dnd: true, noTrain: true });

  return (
    <MobileScreen title="Settings" className="bg-sand">
      <header className="flex items-center gap-2 px-3 pb-1 pt-3">
        <IconLink to={routes.mHome} icon="back" label="กลับ" tone="plain" size={44} iconSize={20} strokeWidth={2} className="hover:bg-chip" />
      </header>
      <h1 className="m-0 px-5 pb-3 text-3xl font-medium tracking-[-0.4px]">Settings</h1>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        <div className="flex items-center gap-3 rounded-2xl bg-paper px-3.5 py-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-line font-semibold"
          >
            {user.initial}
          </span>
          <span className="flex flex-1 flex-col">
            <span className="font-semibold">{user.name}</span>
            <span className="text-xs text-muted">ES Account · [แพ็กเกจ]</span>
          </span>
        </div>

        <section aria-labelledby="cn" className="flex flex-col gap-1.5">
          <SectionTitle id="cn">{`MCP CONNECTORS · 7`}</SectionTitle>
          <div className="flex flex-col overflow-hidden rounded-2xl bg-paper">
            {connectors.map((c, i) => (
              <button
                key={c.name}
                type="button"
                className={cn(rowBase, 'cursor-pointer bg-transparent py-2.5', i > 0 ? divider : 'border-0')}
              >
                <span aria-hidden="true" className={cn('flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px]', c.markClass)}>
                  {c.mark}
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted">{c.meta}</span>
                </span>
                <span className={cn('text-xs', c.ok ? 'text-ok' : 'text-warn-ink')}>{c.status}</span>
              </button>
            ))}
            <button type="button" className={cn(rowBase, divider, 'cursor-pointer bg-transparent py-2.5')}>
              <span aria-hidden="true" className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-sand">
                +
              </span>
              <span className="flex-1">เพิ่ม Custom MCP / ดูทั้งหมด</span>
            </button>
          </div>
        </section>

        <section aria-labelledby="nt" className="flex flex-col gap-1.5">
          <SectionTitle id="nt">ทั่วไป</SectionTitle>
          <div className="flex flex-col overflow-hidden rounded-2xl bg-paper">
            {general.map((r, i) => {
              const cls = cn(rowBase, 'justify-between', i > 0 ? divider : 'border-0');
              if (r.kind === 'toggle') {
                return (
                  <label key={r.label} className={cn(cls, 'cursor-pointer')}>
                    <span>{r.label}</span>
                    <input
                      type="checkbox"
                      checked={toggles[r.id]}
                      onChange={(e) => setToggles((t) => ({ ...t, [r.id]: e.target.checked }))}
                      className="h-[22px] w-[22px] cursor-pointer accent-ink"
                    />
                  </label>
                );
              }
              const body = (
                <>
                  <span>{r.label}</span>
                  <span className="text-[13px] text-muted">{r.value}</span>
                </>
              );
              return r.to ? (
                <Link key={r.label} to={r.to} className={cn(cls, 'no-underline !text-ink hover:bg-sand')}>
                  {body}
                </Link>
              ) : (
                <button key={r.label} type="button" className={cn(cls, 'cursor-pointer bg-transparent hover:bg-sand')}>
                  {body}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <MobileTabBar />
    </MobileScreen>
  );
}
