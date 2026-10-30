import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DesktopPage } from '@/components/layout/DesktopPage';
import { Button, Icon, PersonAvatar } from '@/components/ui';
import { cn } from '@/lib/cn';
import { user } from '@/lib/data';
import { routes } from '@/lib/routes';
import { RadioSegmented } from './settings/RadioSegmented';

// Sub-nav: items with `to` open their own screen, the rest switch the panel here.
const sections: { label: string; to?: string }[] = [
  { label: 'ทั่วไป' },
  { label: 'การแจ้งเตือน' },
  { label: 'โมเดล', to: routes.models },
  { label: 'MCP Connectors', to: routes.connectors },
  { label: 'Harness ค่าเริ่มต้น', to: routes.passport },
  { label: 'Computer' },
  { label: 'Memory' },
  { label: 'ข้อมูลและความเป็นส่วนตัว' },
  { label: 'การใช้งานและแพ็กเกจ' },
  { label: 'อัปเดต' },
];

const themes = [
  { value: 'system', label: 'ตามระบบ' },
  { value: 'light', label: 'สว่าง' },
  { value: 'dark', label: 'มืด' },
] as const;

const channels = ['ในแอป', 'LINE', 'Telegram', 'อีเมล'];

const selectCls = 'h-9 rounded-[10px] border border-line bg-paper px-2.5 text-[13px] outline-none focus:border-ink';
const checkCls = 'h-5 w-5 cursor-pointer accent-ink';

function Group({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col">
      <h2 id={id} className="mb-2 mt-0 text-[13px] font-semibold text-muted">
        {title}
      </h2>
      <div className="flex flex-col divide-y divide-line rounded-2xl shadow-ring">{children}</div>
    </section>
  );
}

/** One settings row. `as="label"` when the control is a form field. */
function Row({
  title,
  hint,
  as: Tag = 'div',
  wrap = true,
  children,
}: {
  title: ReactNode;
  hint?: string;
  as?: 'div' | 'label';
  wrap?: boolean;
  children: ReactNode;
}) {
  return (
    <Tag className={cn('flex items-center justify-between gap-3 px-4 py-3.5', wrap && 'flex-wrap')}>
      {hint ? (
        <span className="flex flex-col">
          <span>{title}</span>
          <span className="text-xs text-muted">{hint}</span>
        </span>
      ) : (
        <span>{title}</span>
      )}
      {children}
    </Tag>
  );
}

function Select({ options }: { options: string[] }) {
  return (
    <select className={selectCls}>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

function General() {
  const [theme, setTheme] = useState<(typeof themes)[number]['value']>('system');
  const [on, setOn] = useState<Record<string, boolean>>({ ในแอป: true, LINE: true });
  const [quietHours, setQuietHours] = useState(true);
  const [homeNet, setHomeNet] = useState(false);
  const [noTraining, setNoTraining] = useState(true);

  return (
    <>
      <Group id="ac" title="บัญชีและหน้าตา">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <PersonAvatar initial={user.initial} size={36} />
            <span className="flex flex-col">
              <span className="font-medium">{user.name}</span>
              <span className="text-xs text-muted">ES Account · [แพ็กเกจ]</span>
            </span>
          </div>
          <Button size="md">จัดการบัญชี</Button>
        </div>
        <Row title="ธีม">
          <RadioSegmented label="ธีม" options={themes} value={theme} onChange={setTheme} />
        </Row>
        <Row as="label" title="ภาษาของ Bot">
          <Select options={['ไทย', 'English', 'ตามภาษาที่พิมพ์']} />
        </Row>
        <Row as="label" title="Time zone ของ routine" hint="ใช้คำนวณเวลาของทุก routine">
          <Select options={['Asia/Bangkok (GMT+7)']} />
        </Row>
      </Group>

      <Group id="nt" title="การแจ้งเตือนและ approval">
        <Row title="ช่องทางแจ้งเตือน" hint="ส่งเมื่อ Bot เสร็จงาน หรือรอพี่ตัดสินใจ">
          <div className="flex flex-wrap gap-1.5">
            {channels.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={!!on[c]}
                onClick={() => setOn((s) => ({ ...s, [c]: !s[c] }))}
                className={cn(
                  'flex h-8 cursor-pointer items-center rounded-full border-0 px-3 text-[13px]',
                  on[c] ? 'bg-ink text-paper' : 'bg-chip text-ink hover:bg-line',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </Row>
        <Row as="label" title="ถ้าพี่ไม่ตอบ approval" hint="ไม่ปล่อยให้หมดอายุเงียบ">
          <Select options={['30 นาที → แจ้ง LINE → 2 ชม. → หยุด run', 'รอจนกว่าพี่จะตอบ']} />
        </Row>
        <Row as="label" wrap={false} title="ช่วงห้ามรบกวน 22:00–07:00 (ยกเว้นงานด่วน)">
          <input type="checkbox" checked={quietHours} onChange={(e) => setQuietHours(e.target.checked)} className={checkCls} />
        </Row>
      </Group>

      <Group id="cp" title="เครื่องของพี่">
        <Row as="label" title="ให้ Bot รันคำสั่งบนเครื่องนี้" hint="แยกจาก approval บน cloud computer">
          <Select options={['ถามทุกครั้ง', 'อนุญาตเฉพาะโฟลเดอร์ที่เลือก', 'ไม่อนุญาต']} />
        </Row>
        <Row as="label" wrap={false} title="ส่ง traffic ของ Bot ผ่านเน็ตบ้าน" hint="ใช้เมื่อเว็บไทยบล็อก IP ของ cloud">
          <input type="checkbox" checked={homeNet} onChange={(e) => setHomeNet(e.target.checked)} className={checkCls} />
        </Row>
      </Group>

      <Group id="dt" title="ข้อมูล">
        <Row as="label" wrap={false} title="ไม่ใช้ข้อมูลของพี่ไปเทรนโมเดล">
          <input type="checkbox" checked={noTraining} onChange={(e) => setNoTraining(e.target.checked)} className={checkCls} />
        </Row>
        <Row as="label" title="เก็บ audit log">
          <Select options={['90 วัน', '1 ปี', '30 วัน']} />
        </Row>
        <Row title="ส่งออกข้อมูลทั้งหมด (แชต, memory, skill, log)">
          <Button size="md">ส่งออก</Button>
        </Row>
      </Group>
    </>
  );
}

/** 08 · Settings */
export function Settings() {
  const [active, setActive] = useState('ทั่วไป');
  const navItem = 'rounded-[10px] px-3 py-2.5 text-left no-underline !text-ink';

  return (
    <DesktopPage title="Settings" direction="row">
      <nav
        aria-label="หมวด Settings"
        className="box-border flex shrink-0 grow-0 basis-[248px] flex-col gap-0.5 border-r border-line bg-sand px-3 py-5"
      >
        <Link to={routes.workspace} className="flex items-center gap-2 p-2 text-[13px] no-underline !text-muted hover:!text-ink">
          <Icon name="back" size={16} />
          กลับไปที่แชต
        </Link>
        <span className="px-2 pb-1 pt-3 text-base font-semibold">Settings</span>
        <span className="px-2 pb-2.5 font-mono text-xs text-muted">⌘,</span>
        {sections.map((s) =>
          s.to ? (
            <Link key={s.label} to={s.to} className={cn(navItem, 'hover:bg-paper/60')}>
              {s.label}
            </Link>
          ) : (
            <button
              key={s.label}
              type="button"
              aria-current={active === s.label ? 'page' : undefined}
              onClick={() => setActive(s.label)}
              className={cn(
                navItem,
                'cursor-pointer border-0',
                active === s.label ? 'bg-paper font-medium shadow-ring' : 'bg-transparent hover:bg-paper/60',
              )}
            >
              {s.label}
            </button>
          ),
        )}
      </nav>

      <main className="box-border flex min-w-0 max-w-[880px] shrink grow-[999] basis-[560px] flex-col gap-7 px-10 pb-12 pt-8">
        <h1 className="m-0 text-[28px] font-medium tracking-[-0.3px]">{active}</h1>
        {active === 'ทั่วไป' ? (
          <General />
        ) : (
          <div className="flex h-[150px] items-center justify-center rounded-2xl bg-chip text-xs text-muted">
            [ตั้งค่า{active}]
          </div>
        )}
      </main>
    </DesktopPage>
  );
}
