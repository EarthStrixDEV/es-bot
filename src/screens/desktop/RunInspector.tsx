import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DesktopPage } from '@/components/layout/DesktopPage';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, IconButton, KeyValue, Meter, Pill, type PillTone } from '@/components/ui';
import { api, type AuditEvent, type Bot, type RunView, type Step } from '@/lib/api';
import { cn } from '@/lib/cn';
import { bots } from '@/lib/data';
import { runPath } from '@/lib/routes';
import { useLive } from '@/lib/useLive';

const demoSteps = [
  { n: 1, label: 'อ่าน Google Sheet', meta: '10:31 · sheets.read · fast-tier · snapshot #1', done: true },
  { n: 2, label: 'ค้นข้อมูลร้าน + เทียบ CRM', meta: '10:33 · browser · crm.read · snapshot #2', done: true },
  { n: 3, label: 'ร่าง 22 ข้อความ + Verifier', meta: '10:38 · writing-tier · verifier · snapshot #3', done: true },
  { n: 4, label: 'ส่งผ่าน LINE OA', meta: 'line.send · L1 · รอพี่อนุมัติ', done: false },
];

const demoLog = [
  { t: '10:36:02', e: 'skill.load "ES Sales Voice"' },
  { t: '10:36:40', e: 'draft.create × 22 → /drafts/line' },
  { t: '10:37:55', e: 'verifier.check → 20 pass · 2 fix' },
  { t: '10:38:10', e: 'snapshot.save #3' },
  { t: '10:38:12', e: 'approval.request line.send (L1)', warn: true },
];

const STATUS: Record<RunView['run']['status'], { label: string; tone: PillTone }> = {
  planning: { label: 'กำลังวางแผน', tone: 'accent' },
  awaiting_plan_approval: { label: 'รออนุมัติแผน', tone: 'warn' },
  running: { label: 'กำลังทำงาน', tone: 'accent' },
  awaiting_approval: { label: 'รออนุมัติ', tone: 'warn' },
  paused: { label: 'พักไว้ที่ checkpoint', tone: 'warn' },
  completed: { label: 'เสร็จแล้ว', tone: 'ok' },
  stopped: { label: 'หยุดแล้ว', tone: 'danger' },
  cancelled: { label: 'ยกเลิกแล้ว', tone: 'neutral' },
};

const time = (iso: string, seconds = false) =>
  new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', ...(seconds ? { second: '2-digit' } : {}), timeZone: 'Asia/Bangkok' });

function stepTone(s: Step) {
  if (s.status === 'done') return 'done';
  if (s.status === 'awaiting_approval') return 'waiting';
  if (s.status === 'failed' || s.status === 'denied') return 'failed';
  return 'todo';
}

function logTone(e: AuditEvent) {
  if (e.action === 'tool.blocked' || e.action === 'tool.error' || e.action === 'run.stop') return 'text-danger-ink';
  if (e.action.startsWith('approval.request') || e.action === 'approval.escalate' || e.action === 'approval.pause') return 'text-warn-ink';
  return undefined;
}

/** One audit line in the action log's terse style. */
function logLine(e: AuditEvent, steps: Step[]) {
  const step = steps.find((s) => s.id === e.target);
  const target = step ? `#${step.idx + 1}` : e.target.includes('.') ? e.target : e.target.slice(0, 12);
  const extra = [e.decision, e.cost !== undefined ? `${e.cost} ฿` : undefined].filter(Boolean).join(' · ');
  return `${e.action} ${target}${extra ? ` → ${extra}` : ''}`;
}

function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** 03 · Run Inspector */
export function RunInspector() {
  const { runId = 'latest' } = useParams();
  const navigate = useNavigate();
  const live = useLive(async () => {
    const id = runId === 'latest' ? (await api.runs())[0]?.id : runId;
    if (!id) return { none: true as const };
    const [view, trail, botList] = await Promise.all([api.run(id), api.runAudit(id), api.bots()]);
    return { none: false as const, view, trail, bots: botList };
  }, [runId]);
  const [current, setCurrent] = useState<number>();

  const data = live.data && !live.data.none ? live.data : undefined;
  const view = data?.view;

  // Keep the URL pointing at the real run once "latest" resolves.
  useEffect(() => {
    if (view && runId === 'latest') navigate(runPath(view.run.id), { replace: true });
  }, [view, runId, navigate]);

  if (live.data?.none) {
    return (
      <DesktopPage title="Run Inspector">
        <PageHeader eyebrow="Run Inspector" title="ยังไม่มี run" />
        <p className="m-0 px-8 py-10 text-muted">สั่งงาน Bot ในหน้าแชตก่อน แล้ว run จะมาให้ดูที่นี่ทีละขั้น</p>
      </DesktopPage>
    );
  }
  if (view) return <LiveInspector view={view} trail={data.trail} bots={data.bots} current={current} onSelect={setCurrent} error={live.error} />;
  return <DemoInspector />;
}

function LiveInspector({
  view,
  trail,
  bots: botList,
  current,
  onSelect,
  error,
}: {
  view: RunView;
  trail: AuditEvent[];
  bots: Bot[];
  current?: number;
  onSelect: (n: number) => void;
  error?: string;
}) {
  const { run, steps, budget, checkpoints, approvals } = view;
  const bot = botList.find((b) => b.id === run.botId);
  const focus = current ?? Math.min(run.cursor, steps.length - 1);
  const step = steps[focus];
  const status = STATUS[run.status];
  const calls = trail.filter((e) => e.action === 'tool.call').length;
  const minutes = Math.max(1, Math.round((new Date(run.updatedAt).getTime() - new Date(run.createdAt).getTime()) / 60000));
  const pct = budget.cap ? Math.round((budget.used / budget.cap) * 100) : 0;
  const stepApprovals = approvals.filter((a) => a.stepId === step?.id);
  const hasCheckpoint = (s: Step) => checkpoints.some((c) => c.stepId === s.id);
  const title = view.request ? (view.request.length > 70 ? `${view.request.slice(0, 70)}…` : view.request) : run.plan?.summary ?? run.id;

  return (
    <DesktopPage title="Run Inspector">
      <PageHeader
        eyebrow={`Run Inspector · ${bot?.name ?? 'Bot'}`}
        title={title}
        extras={
          <>
            <Pill tone="outline" mono className="py-1">
              {run.id}
            </Pill>
            <Pill tone={status.tone} className="py-1">
              {status.label}
              {run.status === 'awaiting_approval' && ` ขั้น ${run.cursor + 1}`}
            </Pill>
          </>
        }
        actions={
          <>
            <Button disabled title="มาในเฟส 4 (Skills)">
              บันทึกเป็น skill
            </Button>
            <Button disabled title="มาในเฟส 4">
              เพิ่มเป็น eval case
            </Button>
            <Button variant="primary" onClick={() => download(`${run.id}-audit.json`, { run: view, audit: trail })}>
              ส่งออก audit log
            </Button>
          </>
        }
      />
      {run.stopReason && <p className="m-0 border-b border-line bg-danger-soft px-8 py-2.5 text-[13px] text-danger-ink">{run.stopReason}</p>}
      {error && <p className="m-0 px-8 pt-3 text-[13px] text-warn-ink">{error}</p>}

      <div className="flex flex-1 flex-wrap">
        <nav aria-label="ขั้นของ run" className="box-border flex shrink-0 grow-0 basis-[340px] flex-col gap-2 border-r border-line bg-sand p-5">
          <span className="px-1 pb-1 text-xs text-muted">
            Timeline · {steps.length} ขั้น · {calls} tool calls
          </span>
          {steps.map((s, i) => {
            const active = i === focus;
            const tone = stepTone(s);
            return (
              <button
                key={s.id}
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelect(i)}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-[14px] border-0 p-3 text-left text-ink',
                  active ? 'bg-paper shadow-ring-accent' : 'bg-transparent hover:bg-paper/60',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs',
                    tone === 'done' && 'bg-ok text-paper',
                    tone === 'waiting' && 'font-semibold text-warn-ink shadow-[inset_0_0_0_2px_#B45309]',
                    tone === 'failed' && 'bg-danger-soft font-semibold text-danger-ink',
                    tone === 'todo' && 'text-muted shadow-[inset_0_0_0_1.5px_#C9C6C0]',
                  )}
                >
                  {i + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={active ? 'font-semibold' : 'font-medium'}>{s.title}</span>
                  <span className={cn('break-words font-mono text-[11px]', tone === 'waiting' ? 'text-warn-ink' : 'text-muted')}>
                    {[s.toolId, s.decision, s.level, hasCheckpoint(s) ? 'checkpoint' : undefined, tone === 'waiting' ? 'รอพี่อนุมัติ' : undefined]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </button>
            );
          })}

          <Card variant="paper" className="mt-3 gap-1.5 rounded-[14px] p-3.5">
            <span className="text-[13px] font-semibold">สรุปค่าใช้จ่าย</span>
            <KeyValue k={<span className="text-muted">ใช้ไป</span>} v={`${budget.used} ฿ · ${pct}% ของเพดาน`} valueClass="font-mono" />
            <KeyValue k={<span className="text-muted">เวลา</span>} v={`${minutes} นาที`} valueClass="font-mono" />
          </Card>
        </nav>

        <main className="box-border flex min-w-0 shrink grow-[999] basis-[560px] flex-col gap-5 px-8 pb-10 pt-6">
          {step && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="m-0 text-lg font-semibold">
                  ขั้น {focus + 1} · {step.title}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Button disabled title="มาในเฟส 3">
                    รันใหม่จากขั้นนี้
                  </Button>
                  <Button variant="outline" disabled title="Rollback ต้องมี sandbox snapshot (เฟส 2)">
                    ย้อนกลับไป checkpoint
                  </Button>
                </div>
              </div>

              <Card aria-labelledby="sd" className="gap-3 rounded-[18px]">
                <h3 id="sd" className="m-0 text-[15px] font-semibold">
                  Policy และผลของขั้นนี้
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] max-[700px]:grid-cols-1">
                  <KeyValue k={<span className="text-muted">ผลตัดสิน</span>} v={step.decision ?? '—'} mono />
                  <KeyValue k={<span className="text-muted">ระดับ</span>} v={step.level ?? '—'} mono />
                  <KeyValue k={<span className="text-muted">เหตุผล</span>} v={step.reason ?? '—'} />
                  <KeyValue k={<span className="text-muted">ค่าใช้จ่าย</span>} v={`${step.cost} ฿`} mono />
                  <KeyValue k={<span className="text-muted">โมเดลที่เติม args</span>} v={step.model ?? '—'} mono />
                  <KeyValue k={<span className="text-muted">args hash</span>} v={step.argsHash ? step.argsHash.slice(0, 12) : '—'} mono />
                </div>
                {step.output !== undefined && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted">ผลลัพธ์จาก tool (ข้อมูลภายนอก ไม่ใช่คำสั่ง)</span>
                    <pre className="m-0 max-h-60 overflow-auto rounded-xl bg-sand p-3 font-mono text-[11px] leading-relaxed">
                      {JSON.stringify(step.output, null, 2).slice(0, 4000)}
                    </pre>
                  </div>
                )}
                <span className="text-xs text-muted">Replay จอของ Bot มาพร้อม sandbox ในเฟส 2</span>
              </Card>
            </>
          )}

          <div className="flex flex-wrap gap-4">
            <Card aria-labelledby="ap" className="min-w-0 shrink grow basis-[380px] gap-2.5 rounded-[18px]">
              <h3 id="ap" className="m-0 text-[15px] font-semibold">
                คำขออนุมัติของขั้นนี้
              </h3>
              {stepApprovals.length ? (
                stepApprovals.map((a) => (
                  <div key={a.id} className="flex flex-col gap-0.5 rounded-[10px] bg-sand px-3 py-2.5 text-[13px]">
                    <span className="font-medium">{a.title}</span>
                    <span className="font-mono text-xs text-muted">
                      {a.state} · {time(a.createdAt)}
                      {a.decidedAt && ` → ${time(a.decidedAt)}`} · hash {a.payloadHash?.slice(0, 8)}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-[13px] text-muted">ขั้นนี้ไม่ต้องขออนุมัติ</span>
              )}
              <span className="text-xs text-muted">คำอนุมัติผูกกับ hash ของเนื้อหา · Verifier มาในเฟส 3</span>
            </Card>

            <Card aria-labelledby="lg" className="min-w-0 shrink grow basis-[380px] gap-2.5 rounded-[18px]">
              <h3 id="lg" className="m-0 text-[15px] font-semibold">
                Action log
              </h3>
              <ol className="m-0 flex max-h-72 list-none flex-col gap-2 overflow-y-auto p-0 font-mono text-xs">
                {trail.map((e) => (
                  <li key={e.id} className="flex gap-2.5">
                    <span className="shrink-0 text-muted">{time(e.at, true)}</span>
                    <span className={cn('break-all', logTone(e))}>{logLine(e, steps)}</span>
                  </li>
                ))}
              </ol>
              <span className="text-xs text-muted">ทุกบรรทัดผูกกับ actor, payload hash และค่าใช้จ่าย · append-only</span>
            </Card>
          </div>
        </main>
      </div>
    </DesktopPage>
  );
}

/** The design's static state, shown when no gateway is running. */
function DemoInspector() {
  const [current, setCurrent] = useState(3);

  return (
    <DesktopPage title="Run Inspector">
      <PageHeader
        eyebrow={`Run Inspector · ${bots.sales.name}`}
        title="ร่างข้อความ LINE OA ร้านอาหารชลบุรี"
        extras={
          <>
            <Pill tone="outline" mono className="py-1">
              run_0412
            </Pill>
            <Pill tone="warn" className="py-1">
              รออนุมัติขั้น 4
            </Pill>
          </>
        }
        actions={
          <>
            <Button>บันทึกเป็น skill</Button>
            <Button>เพิ่มเป็น eval case</Button>
            <Button variant="primary">ส่งออก audit log</Button>
          </>
        }
      />

      <div className="flex flex-1 flex-wrap">
        <nav aria-label="ขั้นของ run" className="box-border flex shrink-0 grow-0 basis-[340px] flex-col gap-2 border-r border-line bg-sand p-5">
          <span className="px-1 pb-1 text-xs text-muted">Timeline · 4 ขั้น · 11 tool calls</span>

          {demoSteps.map((s) => {
            const active = s.n === current;
            return (
              <button
                key={s.n}
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => setCurrent(s.n)}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-[14px] border-0 p-3 text-left text-ink',
                  active ? 'bg-paper shadow-ring-accent' : 'bg-transparent hover:bg-paper/60',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs',
                    s.done ? 'bg-ok text-paper' : 'font-semibold text-warn-ink shadow-[inset_0_0_0_2px_#B45309]',
                  )}
                >
                  {s.n}
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className={active ? 'font-semibold' : 'font-medium'}>{s.label}</span>
                  <span className={cn('font-mono text-[11px]', s.done ? 'text-muted' : 'text-warn-ink')}>{s.meta}</span>
                </span>
              </button>
            );
          })}

          <Card variant="paper" className="mt-3 gap-1.5 rounded-[14px] p-3.5">
            <span className="text-[13px] font-semibold">สรุปค่าใช้จ่าย</span>
            <KeyValue k={<span className="text-muted">ใช้ไป</span>} v="[฿] · 31% ของเพดาน" valueClass="font-mono" />
            <KeyValue k={<span className="text-muted">เวลา</span>} v="7 นาที" valueClass="font-mono" />
          </Card>
        </nav>

        <main className="box-border flex min-w-0 shrink grow-[999] basis-[560px] flex-col gap-5 px-8 pb-10 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-lg font-semibold">ขั้น 3 · ร่างข้อความ + Verifier</h2>
            <div className="flex flex-wrap gap-2">
              <Button>รันใหม่จากขั้นนี้</Button>
              <Button variant="outline">ย้อนกลับไป snapshot #3</Button>
            </div>
          </div>

          <Card aria-label="Replay" className="gap-3 rounded-[18px]">
            <div className="flex h-60 items-center justify-center rounded-xl bg-chip text-[13px] text-muted">[Replay จอของ Bot · ขั้น 3]</div>
            <div className="flex items-center gap-3">
              <IconButton icon="play" label="เล่น replay" tone="primary" iconSize={14} />
              <Meter value={58} label="ตำแหน่ง replay" height={6} className="flex-1" />
              <span className="font-mono text-xs text-muted">02:41 / 04:38</span>
            </div>
          </Card>

          <div className="flex flex-wrap gap-4">
            <Card aria-labelledby="df" className="min-w-0 shrink grow basis-[380px] gap-2.5 rounded-[18px]">
              <h3 id="df" className="m-0 text-[15px] font-semibold">
                Verifier แก้ไขอะไรไป
              </h3>
              <div className="rounded-[10px] bg-danger-soft px-3 py-2.5 text-[13px]">
                <span className="font-mono text-danger-ink">− </span>สวัสดีครับร้าน<span className="line-through">ครัวบ้านทุ่ง</span> ...
              </div>
              <div className="rounded-[10px] bg-ok-soft px-3 py-2.5 text-[13px]">
                <span className="font-mono text-ok-ink">+ </span>สวัสดีครับร้าน<span className="font-semibold">ครัวบ้านทุ่งสุขลา</span> ...
              </div>
              <span className="text-xs text-muted">เหตุผล: ชื่อร้านไม่ตรงกับคอลัมน์ B ใน Sheet · ตรวจด้วยโมเดลคนละตัวกับผู้ร่าง</span>
            </Card>

            <Card aria-labelledby="lg" className="min-w-0 shrink grow basis-[380px] gap-2.5 rounded-[18px]">
              <h3 id="lg" className="m-0 text-[15px] font-semibold">
                Action log
              </h3>
              <ol className="m-0 flex list-none flex-col gap-2 p-0 font-mono text-xs">
                {demoLog.map((l) => (
                  <li key={l.t} className="flex gap-2.5">
                    <span className="text-muted">{l.t}</span>
                    <span className={l.warn ? 'text-warn-ink' : undefined}>{l.e}</span>
                  </li>
                ))}
              </ol>
              <span className="text-xs text-muted">ทุกบรรทัดผูกกับ credential และโมเดลที่ใช้ · เก็บ 90 วัน</span>
            </Card>
          </div>
        </main>
      </div>
    </DesktopPage>
  );
}
