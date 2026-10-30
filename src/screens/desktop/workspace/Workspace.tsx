import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DesktopPage } from '@/components/layout/DesktopPage';
import { BotAvatar, Bubble, ButtonLink, Card, Composer, Icon, IconButton, Pill } from '@/components/ui';
import type { Message, RunView } from '@/lib/api';
import { bots } from '@/lib/data';
import { routes } from '@/lib/routes';
import { useBotThread, type Live } from '@/lib/useBotThread';
import { BotSidebar } from './BotSidebar';
import { ApprovalCard, PlanCard, type PlanRow } from './RunCards';
import { SessionRail, type RailData } from './SessionRail';

const BOT_ID = 'sales-outbound';

const demoPlan: PlanRow[] = [
  { label: 'อ่าน Google Sheet "Leads ชลบุรี"', kind: 'read', state: 'done' },
  { label: 'ค้นข้อมูลร้านบนเว็บ เทียบกับ CRM', kind: 'read', state: 'done' },
  { label: 'ร่างข้อความรายร้าน + Verifier ตรวจ', kind: 'draft', state: 'done' },
  { label: 'ส่งผ่าน LINE OA', kind: 'send · ต้องอนุมัติ', state: 'waiting' },
];

/** 01 · Workspace + Session rail */
export function Workspace() {
  const [railOpen, setRailOpen] = useState(true);
  const live = useBotThread(BOT_ID);
  const isLive = live !== null && live !== 'offline';

  return (
    <DesktopPage title="Workspace" direction="row">
      <BotSidebar />

      <main className="flex min-w-0 shrink grow-[999] basis-[520px] flex-col border-r border-line">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <BotAvatar color={bots.sales.color} size={28} />
            <h1 className="m-0 text-base font-semibold">{bots.sales.name}</h1>
            <Pill tone="accent">Trust L2 · ร่างเองได้ ส่งต้องขอ</Pill>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={routes.models}
              className="rounded-full px-2.5 py-1 font-mono text-xs no-underline !text-sub shadow-ring hover:bg-sand"
            >
              model: auto ▾
            </Link>
            <ButtonLink to={routes.sideChat} variant="soft" size="md">
              <Icon name="chat" size={15} />
              กระซิบ <span className="font-mono text-[11px] text-muted">⌘;</span>
            </ButtonLink>
            <ButtonLink to={routes.fork} variant="soft" size="md">
              <Icon name="fork" size={15} />
              Fork
            </ButtonLink>
            <IconButton
              icon="panelRight"
              label={railOpen ? 'ซ่อน session rail' : 'แสดง session rail'}
              aria-pressed={railOpen}
              onClick={() => setRailOpen((v) => !v)}
            />
            <IconButton icon="info" label="ดูรายละเอียด Bot" />
          </div>
        </header>

        <div className="mx-auto box-border flex w-full max-w-[760px] flex-1 flex-col gap-4 p-6" aria-live="polite">
          {isLive ? <LiveThread live={live} /> : <DemoThread />}
        </div>

        <div className="mx-auto box-border flex w-full max-w-[760px] flex-col gap-2 px-6 pb-5 pt-3">
          {isLive && live.error && <span className="text-xs text-warn">{live.error}</span>}
          {live === 'offline' && <span className="text-xs text-muted">ยังไม่ได้เชื่อม gateway · แสดงตัวอย่างจากดีไซน์ (รัน npm run dev:server)</span>}
          <Composer
            label="ข้อความถึง Sales Outbound"
            placeholder="พิมพ์ถึง Sales Outbound · @ เรียก Bot หรือ skill"
            onSubmit={isLive ? (t) => void live.send(t) : undefined}
          />
        </div>
      </main>

      {railOpen && <SessionRail data={isLive ? railData(live) : undefined} />}
    </DesktopPage>
  );
}

/** The design's static state, shown when no gateway is running. */
function DemoThread() {
  return (
    <>
      <Bubble from="out">
        ดึงร้านอาหารในชลบุรีจาก Google Sheet แล้วร่างข้อความ LINE OA แนะนำ ES POS Lite ในโทนของพี่
        ส่งให้ร้านที่ยังไม่เคยติดต่อ
      </Bubble>
      <PlanCard title="แผนก่อนลงมือ · 4 ขั้น" rows={demoPlan} approval={{ state: 'approved', decidedAt: '2026-10-30T03:31:00Z' }} />
      <Bubble from="in" className="flex flex-col gap-1 py-3">
        <span>✓ Google Sheet → 24 ร้าน · 2 ร้านเคยติดต่อแล้ว ข้ามให้</span>
        <span>✓ Web + CRM → ข้อมูลครบ 20 ร้าน · 2 ร้านไม่พบหน้าร้านออนไลน์</span>
        <span>✓ ร่างข้อความ 22 ชิ้นในโทนพี่ (จาก skill "ES Sales Voice")</span>
      </Bubble>
      <Card as="section" variant="sand" aria-label="ผลตรวจของ Verifier" className="flex-row items-start gap-3 px-4 py-3.5">
        <Icon name="shieldCheck" size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-ok" />
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">Verifier ตรวจแล้ว · ผ่าน 20 / 22</span>
          <span className="text-[13px] text-muted">2 ข้อความชื่อร้านไม่ตรงกับ Sheet — แก้ให้แล้ว รอพี่ดูในตัวอย่าง</span>
        </div>
      </Card>
      <ApprovalCard
        approval={{ title: 'ส่ง 22 ข้อความผ่าน LINE OA', state: 'pending', reversible: 'no', estimate: 0 }}
        scopeLabel="LINE OA ของ Bot นี้เท่านั้น"
      />
    </>
  );
}

function LiveThread({ live }: { live: Live }) {
  const runs = new Map(live.thread.runs.map((r) => [r.run.id, r]));
  const { messages } = live.thread;
  if (!messages.length) {
    return (
      <p className="m-auto max-w-sm text-center text-muted">
        สั่งงาน Sales Outbound ได้เลยค่ะ ทุก action จะผ่าน Policy ก่อน และขั้นที่ส่งออกนอกบ้านต้องรอพี่อนุมัติเสมอ
      </p>
    );
  }
  return <>{messages.map((m) => <LiveMessage key={m.id} message={m} run={m.parts ? runs.get(m.parts.runId) : undefined} live={live} />)}</>;
}

function LiveMessage({ message, run, live }: { message: Message; run?: RunView; live: Live }): ReactNode {
  if (message.role === 'user') return <Bubble from="out">{message.content}</Bubble>;
  const part = message.parts;

  if (part?.kind === 'plan' && run) {
    const planApproval = run.approvals.find((a) => a.stepId === null);
    return (
      <PlanCard
        title={message.content}
        rows={run.steps.map((s) => planRow(s, live))}
        approval={planApproval}
        busy={live.busy}
        onDecide={planApproval ? (d) => void live.decide(planApproval.id, d) : undefined}
      />
    );
  }

  if (part?.kind === 'approval' && run && part.approvalId) {
    const approval = run.approvals.find((a) => a.id === part.approvalId);
    if (!approval) return null;
    const step = run.steps.find((s) => s.id === approval.stepId);
    const connector = step?.toolId?.split('.')[0] ?? '';
    return (
      <ApprovalCard
        approval={approval}
        scopeLabel={`${connectorName(connector)} ของ Bot นี้เท่านั้น`}
        busy={live.busy}
        onDecide={(d) => void live.decide(approval.id, d)}
      />
    );
  }

  return (
    <Bubble from="in" className="whitespace-pre-line">
      {message.content}
    </Bubble>
  );
}

function planRow(s: RunView['steps'][number], live: Live): PlanRow {
  const effect = (s.toolId && live.tools.get(s.toolId)?.effect) ?? '';
  const state: PlanRow['state'] =
    s.status === 'done' ? 'done' : s.status === 'awaiting_approval' ? 'waiting' : s.status === 'denied' || s.status === 'failed' ? 'failed' : 'todo';
  const kind = s.decision === 'ask' ? `${effect} · ต้องอนุมัติ` : s.decision === 'deny' ? `${effect} · ไม่ได้รับอนุญาต` : effect;
  return { label: s.title, kind, state };
}

const CONNECTOR_NAMES: Record<string, string> = {
  'line-oa': 'LINE OA',
  'google-sheets': 'Google Sheets',
  'es-account': 'CRM (ES Account)',
  workspace: 'Workspace',
};
const connectorName = (id: string) => CONNECTOR_NAMES[id] ?? id;

const STATUS_LABEL: Record<RunView['run']['status'], string> = {
  planning: 'กำลังวางแผน',
  awaiting_plan_approval: 'รอพี่อนุมัติแผน',
  running: 'กำลังทำงาน',
  awaiting_approval: 'รอพี่อนุมัติ',
  paused: 'พักไว้ที่ checkpoint',
  completed: 'เสร็จแล้ว',
  stopped: 'หยุดแล้ว',
  cancelled: 'ยกเลิกแล้ว',
};

function railData(live: Live): RailData {
  const latest = live.thread.runs.at(-1);
  const grants = live.passport.grants
    .filter((g) => !g.revokedAt)
    .map((g) => ({
      name: connectorName(g.connectorId),
      scope: g.level && g.level !== 'L3' && g.scope !== 'read' ? `${g.scope} · ask` : g.scope,
      tone: g.scope === 'read' || g.scope === 'draft' ? 'text-ok' : 'text-warn',
    }));
  grants.push({ name: 'Browser profile', scope: live.passport.sandbox.browserProfile, tone: 'text-muted' });
  if (!latest) return { status: 'ยังไม่มี run', budget: 0, grants };
  const total = latest.steps.length;
  const current = Math.min(latest.run.cursor + 1, total);
  return {
    status: `${STATUS_LABEL[latest.run.status]} · ขั้น ${current} / ${total}`,
    budget: latest.budget.cap ? Math.round((latest.budget.used / latest.budget.cap) * 100) : 0,
    changes: `+${latest.steps.filter((s) => s.status === 'done').length} steps`,
    checkpoints: latest.steps
      .filter((s) => s.status === 'done' || latest.checkpoints.some((c) => c.stepId === s.id))
      // Rollback needs sandbox snapshots (phase 2), so live checkpoints are listed without the action.
      .map((s) => ({ id: s.id, label: `#${s.idx + 1} ${s.title}` })),
    grants,
  };
}
