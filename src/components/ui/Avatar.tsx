import { cn } from '@/lib/cn';

/** Bots are represented by a solid color disc (no faces/emoji). */
export function BotAvatar({ color, size = 32, className }: { color: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block shrink-0 rounded-full', className)}
      style={{ width: size, height: size, background: color }}
    />
  );
}

/** Two overlapping discs for a group chat. */
export function GroupAvatar({ colors, ringColor = '#F6F5F3' }: { colors: [string, string]; ringColor?: string }) {
  return (
    <span aria-hidden="true" className="relative block h-8 w-8 shrink-0">
      <span className="absolute left-0 top-0 h-5 w-5 rounded-full" style={{ background: colors[0] }} />
      <span
        className="absolute bottom-0 right-0 h-5 w-5 rounded-full"
        style={{ background: colors[1], boxShadow: `0 0 0 2px ${ringColor}` }}
      />
    </span>
  );
}

/** Initial-in-a-circle for people. */
export function PersonAvatar({ initial, size = 28, dark }: { initial: string; size?: number; dark?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full text-xs font-semibold',
        dark ? 'bg-ink text-paper' : 'bg-line text-ink',
      )}
      style={{ width: size, height: size }}
    >
      {initial}
    </span>
  );
}
