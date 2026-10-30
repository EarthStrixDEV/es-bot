import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

type Tone = 'soft' | 'primary' | 'plain';
const tones: Record<Tone, string> = {
  soft: 'bg-sand text-ink hover:bg-chip',
  primary: 'bg-ink text-paper hover:bg-ink/90',
  plain: 'bg-transparent text-ink hover:bg-sand',
};

type Common = {
  icon: IconName;
  label: string;
  tone?: Tone;
  /** px — 32, 36, 40 or 44 in the design */
  size?: number;
  iconSize?: number;
  strokeWidth?: number;
  className?: string;
};

function cls(tone: Tone, className?: string) {
  return clsx(
    'inline-flex shrink-0 items-center justify-center rounded-full border-0 cursor-pointer transition-colors',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    tones[tone],
    className,
  );
}

export function IconButton({
  icon,
  label,
  tone = 'soft',
  size = 36,
  iconSize = 16,
  strokeWidth,
  className,
  type = 'button',
  ...rest
}: Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button type={type} aria-label={label} className={cls(tone, className)} style={{ width: size, height: size }} {...rest}>
      <Icon name={icon} size={iconSize} strokeWidth={strokeWidth} />
    </button>
  );
}

export function IconLink({ icon, label, tone = 'soft', size = 36, iconSize = 16, strokeWidth, className, to }: Common & { to: string }) {
  return (
    <Link to={to} aria-label={label} className={clsx(cls(tone, className), tone === 'primary' ? '!text-paper' : '!text-ink')} style={{ width: size, height: size }}>
      <Icon name={icon} size={iconSize} strokeWidth={strokeWidth} />
    </Link>
  );
}
