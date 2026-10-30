import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'soft';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-paper font-medium hover:bg-ink/90',
  secondary: 'bg-chip text-ink hover:bg-line',
  outline: 'bg-transparent text-ink border border-ink hover:bg-sand',
  ghost: 'bg-transparent text-ink underline hover:bg-sand',
  soft: 'bg-sand text-ink hover:bg-chip',
};

// Heights in the design: 32 / 36 / 40 / 48 (mobile primary 44–48).
const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-3.5 text-[13px]',
  lg: 'h-10 px-4',
  xl: 'h-12 px-5 text-[15px]',
};

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'lg', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-1.5 rounded-full border-0 cursor-pointer no-underline transition-colors whitespace-nowrap',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    variants[variant],
    sizes[size],
    className,
  );
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant, size, className, type = 'button', ...rest }: Props) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

/** A router link styled as a button (the design uses <a> pills for navigation). */
export function ButtonLink({
  variant,
  size,
  className,
  ...rest
}: LinkProps & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={cn(buttonClass(variant, size, className), 'hover:text-current', variant === 'primary' ? '!text-paper' : '!text-ink')} {...rest} />;
}
