import { cn } from '@/lib/cn';

/** Pill-shaped tab switcher on a sand track (the design's tablists). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  stretch,
  className,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  stretch?: boolean;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn('flex gap-1 rounded-full bg-sand p-1', className)}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-8 cursor-pointer whitespace-nowrap rounded-full border-0 px-3.5',
              stretch && 'flex-1',
              selected ? 'bg-paper font-medium shadow-ring' : 'bg-transparent text-muted hover:text-ink',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
