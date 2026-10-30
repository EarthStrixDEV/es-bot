import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

/** "label …… value" row used in summaries and permission lists. */
export function KeyValue({
  k,
  v,
  mono,
  valueClass,
  className,
}: {
  k: ReactNode;
  v: ReactNode;
  mono?: boolean;
  valueClass?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex justify-between gap-3 text-[13px]', className)}>
      <span>{k}</span>
      <span className={cn('text-right', mono && 'font-mono text-xs', valueClass)}>{v}</span>
    </div>
  );
}

/** Small labelled stat tile (11px label over 13–24px value). */
export function StatTile({
  label,
  value,
  tone = 'sand',
  valueClass,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: 'sand' | 'ring';
  valueClass?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-[10px] px-2.5 py-2',
        tone === 'sand' ? 'bg-sand' : 'shadow-ring',
        className,
      )}
    >
      <span className="text-[11px] text-muted">{label}</span>
      <span className={cn('text-[13px] font-medium', valueClass)}>{value}</span>
    </div>
  );
}
