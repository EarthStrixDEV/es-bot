import clsx from 'clsx';

/** Accessible on/off switch. */
export function Switch({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative h-7 w-12 shrink-0 cursor-pointer rounded-full border-0 transition-colors',
        checked ? 'bg-ink' : 'bg-chip shadow-ring',
        className,
      )}
    >
      <span
        className={clsx(
          'absolute top-1 h-5 w-5 rounded-full bg-paper transition-all',
          checked ? 'left-6' : 'left-1 shadow-ring',
        )}
      />
    </button>
  );
}
