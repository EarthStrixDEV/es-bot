import { cn } from '@/lib/cn';
import type { HTMLAttributes } from 'react';

type Variant = 'ring' | 'sand' | 'paper' | 'accent';
const variants: Record<Variant, string> = {
  ring: 'shadow-ring',
  sand: 'bg-sand',
  paper: 'bg-paper shadow-ring',
  accent: 'shadow-ring-accent',
};

/** Rounded surface. Default: 16px radius, 1px warm ring, 16px padding. */
export function Card({
  as: Tag = 'section',
  variant = 'ring',
  className,
  ...rest
}: HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' | 'article' | 'aside'; variant?: Variant }) {
  return <Tag className={cn('flex flex-col rounded-2xl p-4', variants[variant], className)} {...rest} />;
}
