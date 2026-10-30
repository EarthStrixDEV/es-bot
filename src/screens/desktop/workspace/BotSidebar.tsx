import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { BotAvatar, GroupAvatar, Icon, IconButton, PersonAvatar } from '@/components/ui';
import { needsYou, salesFork, team, user, type BotListItem } from '@/lib/data';
import { routes } from '@/lib/routes';

function BotRow({ bot, active }: { bot: BotListItem; active?: boolean }) {
  const body = (
    <>
      {bot.colors.length > 1 ? (
        <GroupAvatar colors={[bot.colors[0], bot.colors[1]]} />
      ) : (
        <BotAvatar color={bot.colors[0]} />
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex justify-between gap-2">
          <span className="font-semibold">{bot.name}</span>
          <span className={clsx('text-xs', bot.timeTone === 'accent' ? 'text-accent' : 'text-muted')}>{bot.time}</span>
        </span>
        <span className={clsx('text-xs', bot.statusTone === 'warn' ? 'font-medium text-warn' : 'text-muted')}>
          {bot.status}
        </span>
      </span>
    </>
  );
  const cls = clsx(
    'flex items-start gap-2.5 rounded-xl px-2 py-2.5 text-left no-underline !text-ink',
    active ? 'bg-paper shadow-ring' : 'hover:bg-paper/60',
  );
  return bot.to ? (
    <Link to={bot.to} className={cls} aria-current={active ? 'page' : undefined}>
      {body}
    </Link>
  ) : (
    <button type="button" className={clsx(cls, 'w-full cursor-pointer border-0 bg-transparent')}>
      {body}
    </button>
  );
}

export function BotSidebar() {
  return (
    <aside className="flex shrink-0 grow-0 basis-[272px] flex-col gap-3 border-r border-line bg-sand px-3 py-4">
      <div className="flex items-center justify-between px-1 pb-2 pt-1">
        <div className="flex items-center gap-2">
          <PersonAvatar initial="ES" dark />
          <span className="text-base font-semibold">ES Bot</span>
        </div>
        <IconButton icon="plus" label="สร้าง Bot ใหม่" tone="primary" strokeWidth={2} />
      </div>
      <label className="flex flex-col">
        <span className="sr-only">ค้นหา</span>
        <input
          type="search"
          placeholder="ค้นหา Bot, งาน, ไฟล์"
          className="h-9 rounded-full border border-line bg-paper px-3.5 text-[13px] outline-none focus:border-ink"
        />
      </label>

      <nav aria-label="Bots" className="flex flex-col gap-0.5">
        <span className="px-2 pb-1 pt-2 text-xs text-muted">ต้องการพี่ · {needsYou.length}</span>
        {needsYou.map((b) => (
          <BotRow key={b.id} bot={b} active />
        ))}
        <Link
          to={salesFork.to}
          className="flex items-center gap-2 rounded-[10px] py-1.5 pl-7 pr-2 text-[13px] no-underline !text-ink hover:bg-paper/60"
        >
          <Icon name="fork" size={14} className="text-muted" />
          <span className="flex-1">{salesFork.label}</span>
          <span className="text-[11px] text-muted">{salesFork.from}</span>
        </Link>
        <span className="px-2 pb-1 pt-3 text-xs text-muted">ทีม · ES Ecosystem</span>
        {team.map((b) => (
          <BotRow key={b.id} bot={b} />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-line pt-3">
        <Link to={routes.passport} className="flex items-center gap-2.5 rounded-[10px] px-2 py-2.5 font-medium no-underline !text-ink hover:bg-paper/60">
          <Icon name="shield" size={18} />
          Harness Center
        </Link>
        <Link to={routes.connectors} className="flex items-center gap-2.5 rounded-[10px] px-2 py-2.5 no-underline !text-ink hover:bg-paper/60">
          <Icon name="connector" size={18} />
          MCP Connectors · 7
        </Link>
        <Link to={routes.settings} className="flex items-center gap-2.5 rounded-[10px] px-2 py-2.5 no-underline !text-ink hover:bg-paper/60">
          <PersonAvatar initial={user.initial} />
          <span className="flex-1 text-[13px]">{user.name}</span>
          <span className="text-xs text-muted">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
