import { cn } from '@/lib/cn';

/** Segmented control as a radiogroup (the design's theme / pin-scope pickers). */
export function RadioSegmented<T extends string>({
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
    <div role="radiogroup" aria-label={label} className={cn('flex gap-1 rounded-full bg-sand p-1', className)}>
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-8 cursor-pointer whitespace-nowrap rounded-full border-0 px-3.5',
              stretch && 'flex-1',
              checked ? 'bg-paper font-medium shadow-ring' : 'bg-transparent text-muted hover:text-ink',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
