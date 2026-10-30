import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

/** Chat bubble. `out` = the user (ink, right); `in` = the bot (sand, left). */
export function Bubble({
  from,
  className,
  children,
}: {
  from: 'out' | 'in';
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'px-4 py-2.5',
        from === 'out'
          ? 'max-w-[78%] self-end rounded-bubble-out bg-ink text-paper'
          : 'max-w-[88%] self-start rounded-bubble-in bg-sand',
        className,
      )}
    >
      {children}
    </div>
  );
}
