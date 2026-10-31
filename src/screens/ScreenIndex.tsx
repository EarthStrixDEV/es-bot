import { Link } from 'react-router-dom';
import { DesktopPage } from '@/components/layout/DesktopPage';
import { Icon } from '@/components/ui';
import { screenList } from '@/lib/screenList';

/** Index of every screen, for reviewing the build without the canvas. */
export function ScreenIndex() {
  return (
    <DesktopPage title="Screens">
      <div className="mx-auto box-border flex w-full max-w-[960px] flex-col gap-8 px-4 py-10 sm:px-8">
        <header className="flex flex-col gap-1">
          <span className="text-xs text-muted">ES Bot · preview</span>
          <h1 className="m-0 text-[28px] font-medium">ทุกหน้าจอ</h1>
          <p className="m-0 max-w-[60ch] text-muted">
            ตัวอย่างนี้ไม่ได้ต่อ gateway ทุกหน้าจึงแสดงสถานะตัวอย่างจากดีไซน์ ปุ่ม แท็บ และลิงก์ระหว่างหน้ากดได้ตามจริง
          </p>
        </header>
        {(['desktop', 'mobile'] as const).map((group) => (
          <section key={group} aria-labelledby={`h-${group}`} className="flex flex-col gap-3">
            <h2 id={`h-${group}`} className="m-0 text-base font-semibold">
              {group === 'desktop' ? 'Desktop · 10 หน้า' : 'Mobile · 10 หน้า'}
            </h2>
            <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
              {screenList[group].map((s) => (
                <li key={s.to}>
                  <Link
                    to={s.to}
                    className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 no-underline !text-ink shadow-ring hover:bg-sand"
                  >
                    <span>{s.title}</span>
                    <Icon name="send" size={14} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </DesktopPage>
  );
}
