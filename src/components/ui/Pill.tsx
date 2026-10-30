import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export type PillTone = 'neutral' | 'outline' | 'accent' | 'ok' | 'warn' | 'danger' | 'ink';

const tones: Record<PillTone, string> = {
  neutral: 'bg-sand text-ink',
  outline: 'bg-transparent text-muted shadow-ring',
  accent: 'bg-accent-soft text-accent-ink font-medium',
  ok: 'bg-ok-soft text-ok-ink font-medium',
  warn: 'bg-warn-soft text-warn-ink font-medium',
  danger: 'bg-danger-soft text-danger-ink font-medium',
  ink: 'bg-ink text-paper font-medium',
};

/** Small rounded status/label chip (12px text, 3–4px × 10px padding). */
export function Pill({
  tone = 'neutral',
  mono,
  className,
  children,
}: {
  tone?: PillTone;
  mono?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-[3px] text-xs',
        mono && 'font-mono',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
