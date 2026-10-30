import clsx from 'clsx';
import { useEffect, type ReactNode } from 'react';

/** Root for desktop screens: fluid, at least one viewport tall. */
export function DesktopPage({
  title,
  direction = 'col',
  className,
  children,
}: {
  title: string;
  direction?: 'row' | 'col';
  className?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    document.title = `${title} · ES Bot`;
  }, [title]);
  return (
    <div className={clsx('flex min-h-dvh bg-paper', direction === 'row' ? 'flex-wrap' : 'flex-col', className)}>
      {children}
    </div>
  );
}
