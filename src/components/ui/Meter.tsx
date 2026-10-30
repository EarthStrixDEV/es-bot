import clsx from 'clsx';

/** Rounded horizontal progress track. `color` defaults to the accent. */
export function Meter({
  value,
  label,
  color,
  height = 8,
  className,
}: {
  value: number;
  label: string;
  color?: string;
  height?: number;
  className?: string;
}) {
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={clsx('overflow-hidden rounded-full bg-chip', className)}
      style={{ height }}
    >
      <div className={clsx('h-full', !color && 'bg-accent')} style={{ width: `${value}%`, background: color }} />
    </div>
  );
}
