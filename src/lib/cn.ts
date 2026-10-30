import clsx, { type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: ['ring', 'ring-accent', 'ring-ink', 'float', 'sheet', 'side'] }],
      rounded: [{ rounded: ['bubble-out', 'bubble-in'] }],
    },
  },
});

/** Join class names; later Tailwind classes override earlier conflicting ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
