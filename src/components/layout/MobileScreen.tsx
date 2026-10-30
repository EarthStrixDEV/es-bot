import { cn } from '@/lib/cn';
import { useEffect, type ReactNode } from 'react';

/**
 * A phone screen. Full-bleed on phones; on larger viewports it is shown as a
 * centered 390×844 device so the mobile flows can be reviewed on desktop.
 */
export function MobileScreen({ title, className, children }: { title?: string; className?: string; children: ReactNode }) {
  useEffect(() => {
    if (title) document.title = `${title} · ES Bot`;
  }, [title]);
  return (
    <div className="flex min-h-dvh justify-center bg-sand sm:items-center sm:py-8">
      <div
        className={cn(
          'relative flex h-dvh w-full max-w-[390px] flex-col overflow-hidden bg-paper text-[15px] leading-[1.45] sm:h-[844px] sm:rounded-[28px] sm:shadow-ring',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
