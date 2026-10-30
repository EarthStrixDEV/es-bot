import type { ReactNode } from 'react';
import { IconLink } from '@/components/ui';
import { routes } from '@/lib/routes';

/** Desktop sub-page header: back button, eyebrow + title, optional extras and actions. */
export function PageHeader({
  eyebrow,
  title,
  back = routes.workspace,
  backLabel = 'กลับไปที่แชต',
  extras,
  actions,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  back?: string;
  backLabel?: string;
  extras?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-8 py-4">
      <div className="flex flex-wrap items-center gap-3.5">
        <IconLink to={back} icon="back" label={backLabel} />
        <div className="flex flex-col">
          <span className="text-xs text-muted">{eyebrow}</span>
          <h1 className="m-0 text-xl font-medium">{title}</h1>
        </div>
        {extras}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
