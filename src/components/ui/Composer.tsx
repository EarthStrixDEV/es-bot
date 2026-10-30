import clsx from 'clsx';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Icon } from './Icon';

/** Rounded message input with a trailing round action (mic or send). */
export function Composer({
  label,
  placeholder,
  action = 'mic',
  leading,
  size = 'md',
  onSubmit,
  className,
}: {
  label: string;
  placeholder: string;
  action?: 'mic' | 'send';
  leading?: ReactNode;
  size?: 'md' | 'lg';
  onSubmit?: (text: string) => void;
  className?: string;
}) {
  const id = useId();
  const [text, setText] = useState('');
  const box = size === 'lg' ? 40 : 36;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit?.(text.trim());
    setText('');
  }

  return (
    <form
      onSubmit={submit}
      className={clsx(
        'flex items-center gap-2 rounded-full shadow-ring focus-within:shadow-ring-ink',
        leading ? 'py-1 pl-1.5 pr-1' : 'py-1.5 pl-4 pr-1.5',
        className,
      )}
    >
      {leading}
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className={clsx('min-w-0 flex-1 border-0 bg-transparent outline-none', size === 'lg' ? 'h-10 text-[15px]' : 'h-9 text-sm')}
      />
      <button
        type="submit"
        aria-label={action === 'mic' && !text ? 'พูดด้วยเสียง' : 'ส่ง'}
        className="flex shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-ink text-paper"
        style={{ width: box, height: box }}
      >
        <Icon name={action === 'mic' && !text ? 'mic' : 'send'} size={16} strokeWidth={2} />
      </button>
    </form>
  );
}
