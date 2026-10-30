import { cn } from '@/lib/cn';
import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '@/components/ui';
import { routes } from '@/lib/routes';

const tabs: { to: string; label: string; icon: IconName }[] = [
  { to: routes.mHome, label: 'Bots', icon: 'chat' },
  { to: routes.mRail, label: 'Runs', icon: 'pulse' },
  { to: routes.mArtifact, label: 'Artifacts', icon: 'grid' },
  { to: routes.mPassport, label: 'Harness', icon: 'shield' },
];

/** Bottom navigation for the mobile app. `active` overrides route matching (e.g. Settings → Harness). */
export function MobileTabBar({ active }: { active?: string }) {
  return (
    <nav aria-label="เมนูหลัก" className="grid grid-cols-4 border-t border-line bg-paper px-2 pb-5 pt-1.5">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end
          aria-current={active ? (active === t.to ? 'page' : undefined) : undefined}
          className={({ isActive }) => {
            const on = active ? active === t.to : isActive;
            return cn(
              'flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[11px] no-underline',
              on ? 'font-semibold !text-ink' : '!text-muted',
            );
          }}
        >
          {({ isActive }) => {
            const on = active ? active === t.to : isActive;
            return (
              <>
                <Icon name={t.icon} size={22} strokeWidth={on ? 2 : 1.75} />
                {t.label}
              </>
            );
          }}
        </NavLink>
      ))}
    </nav>
  );
}
