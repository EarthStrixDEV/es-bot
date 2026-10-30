import { cn } from '@/lib/cn';
import { Link } from 'react-router-dom';
import { MobileScreen } from '@/components/layout/MobileScreen';
import { MobileTabBar } from '@/components/layout/MobileTabBar';
import { BotAvatar, Icon, IconButton, IconLink } from '@/components/ui';
import { needsYou, salesFork, team, type BotListItem } from '@/lib/data';
import { routes } from '@/lib/routes';

// The mobile list shows a newer Content Factory status than the desktop sidebar.
const mobileStatus: Record<string, string> = {
  content: 'สร้างภาพโปรโมต 4 ภาพ รอพี่เลือก',
};

/** 44px avatar; group chats get two overlapping 28px discs. */
function RowAvatar({ colors }: { colors: string[] }) {
  if (colors.length < 2) return <BotAvatar color={colors[0]} size={44} />;
  return (
    <span aria-hidden="true" className="relative block h-11 w-11 shrink-0">
      <span className="absolute left-0 top-0 h-7 w-7 rounded-full" style={{ background: colors[0] }} />
      <span className="absolute bottom-0 right-0 h-7 w-7 rounded-full shadow-[0_0_0_2px_#FFFFFF]" style={{ background: colors[1] }} />
    </span>
  );
}

function BotRow({ bot, highlight }: { bot: BotListItem; highlight?: boolean }) {
  const body = (
    <>
      <RowAvatar colors={bot.colors} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex justify-between gap-2">
          <span className="font-semibold">{bot.name}</span>
          <span className={cn('text-xs', bot.timeTone === 'accent' ? 'font-medium text-accent' : 'text-muted')}>{bot.time}</span>
        </span>
        <span className={cn('text-[13px]', bot.statusTone === 'warn' ? 'font-medium text-warn-ink' : 'text-muted')}>
          {mobileStatus[bot.id] ?? bot.status}
        </span>
      </span>
    </>
  );
  const cls = cn(
    'flex items-center gap-3 rounded-2xl px-2.5 py-3 text-left no-underline !text-ink',
    highlight ? 'bg-warn-soft' : 'hover:bg-sand',
  );
  return bot.mobileTo ? (
    <Link to={bot.mobileTo} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" className={cn(cls, 'w-full cursor-pointer border-0 bg-transparent text-[15px]')}>
      {body}
    </button>
  );
}

/** M01 · รายชื่อ Bot */
export function MHome() {
  return (
    <MobileScreen title="Bots">
      <header className="flex flex-col gap-3 px-5 pb-2 pt-5">
        <div className="flex items-center justify-between">
          <h1 className="m-0 text-3xl font-medium tracking-[-0.4px]">Bots</h1>
          <div className="flex gap-2">
            <IconLink to={routes.mSettings} icon="sun" label="Settings" size={44} iconSize={18} />
            <IconButton icon="plus" label="สร้าง Bot ใหม่" tone="primary" size={44} iconSize={18} strokeWidth={2} />
          </div>
        </div>
        <label className="flex flex-col">
          <span className="sr-only">ค้นหา</span>
          <input
            type="search"
            placeholder="ค้นหา Bot, งาน, ไฟล์"
            className="box-border h-11 w-full rounded-full border-0 bg-sand px-4 text-[15px] outline-none focus:shadow-ring-ink"
          />
        </label>
      </header>

      <nav aria-label="Bots" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-1">
        <span className="px-2 pb-1 pt-2 text-[13px] text-muted">ต้องการพี่ · {needsYou.length}</span>
        {needsYou.map((b) => (
          <BotRow key={b.id} bot={b} highlight />
        ))}
        <Link
          to={salesFork.mobileTo}
          className="box-border flex min-h-11 items-center gap-2.5 py-2 pl-[66px] pr-2.5 text-[13px] no-underline !text-ink"
        >
          <Icon name="fork" size={14} className="text-muted" />
          <span className="flex-1">{salesFork.label}</span>
          <span className="text-xs text-muted">{salesFork.from}</span>
        </Link>

        <span className="px-2 pb-1 pt-3 text-[13px] text-muted">ทีม · ES Ecosystem</span>
        {team.map((b) => (
          <BotRow key={b.id} bot={b} />
        ))}
      </nav>

      <MobileTabBar />
    </MobileScreen>
  );
}
