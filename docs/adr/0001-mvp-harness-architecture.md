# ADR-0001: สร้างเฟส 1 (MVP) ของ ES Bot harness เป็น Node service แบบ ports/adapters

**Status:** Accepted
**Date:** 2026-10-30
**Deciders:** พี่เอิร์ธ

## Context

เอกสาร "ES Bot — Workflow, Modules & System Design" กำหนดระบบ 4 ชั้น 16 โมดูล และแบ่งการสร้างเป็น 5 เฟส
เฟส 1 (MVP — "Bot เดียวที่ไว้ใจได้") ประกอบด้วย แชต + Orchestrator + Policy (L0–L3) + Approval ผ่าน LINE
+ Connector Gateway กับ 3 connector + Audit log โดยยังไม่มี sandbox

เอกสารยังเปิดคำถามไว้ว่า Orchestrator จะใช้ Temporal หรือ Inngest และยังไม่มี Supabase project หรือ key
ของบริการภายนอกใน environment นี้ ดังนั้นต้องเลือกโครงที่ (1) ทำงานได้ครบวงจรวันนี้ (2) ไม่ล็อกการตัดสินใจที่ยังเปิดอยู่

ข้อกำหนดที่ต้องคงไว้จากเอกสาร:

- Bot ไม่เคยเห็น secret — ใช้ handle จาก Credential Broker เท่านั้น
- ทุก side-effect ผ่าน Policy Engine — ไม่มีการตัดสิน = รันไม่ได้
- คำอนุมัติผูกกับ hash ของ payload และไม่หมดอายุเงียบ (pending → escalated 30 นาที → paused 2 ชม.)
- Audit log แบบ append-only
- run ยาวและรอ approval ได้โดยไม่หายเมื่อ process restart

## Decision

สร้าง `server/` เป็น Node + TypeScript service เดียว (Gateway process) ที่แบ่งโมดูลตามเอกสาร
และคุยกันผ่าน interface/event เท่านั้น:

| โมดูล (เอกสาร) | ไฟล์ | หมายเหตุเฟส 1 |
|---|---|---|
| Gateway | `gateway/` | REST + WebSocket, auth ด้วย bearer token (ES Account adapter ภายหลัง), rate limit |
| Conversation Service | `conversation/` | thread หลัก + message |
| Orchestrator | `orchestrator/` | state machine ที่ persist ทุก transition (durable), resume ได้หลัง restart |
| Policy Engine | `policy/` | ลำดับตัดสิน 6 ชั้นตามเอกสาร, pure function |
| Approval Service | `approval/` | lifecycle + escalate + canary + payload hash |
| Budget Meter | `budget/` | `reserve()` / `commit()` บน usage ledger, hard stop |
| Audit Log | `audit/` | append-only (ไม่มี API แก้/ลบ; Postgres มี trigger กัน) |
| Credential Broker | `credentials/` | vault เข้ารหัส AES-256-GCM, lease อายุสั้นใช้ครั้งเดียว |
| Connector Gateway | `connectors/` | registry + สแกน prompt injection + `desc_hash` + output filter |
| Notifier | `notifier/` | LINE Messaging API adapter / console mock |
| Model access | `models/` | OpenAI-compatible adapter (OpenRouter) / mock planner |

Persistence อยู่หลัง `Store` port: ตอนนี้ใช้ SQLite (`node:sqlite`, ไฟล์เดียว) เพื่อให้ durable จริง
และมี `server/db/migrations/001_init.sql` สำหรับ Supabase Postgres + RLS ตาม Data Model ในเอกสาร

บริการภายนอกทุกตัวมี adapter จริงคู่กับ mock เลือกด้วย env: มี key → ใช้ของจริง, ไม่มี → mock

## Options Considered

### Option A: Node service + ports/adapters (เลือก)

| Dimension | Assessment |
|---|---|
| Complexity | Med — ต้องเขียน durable state machine เอง |
| Cost | ต่ำ — ไม่มี infra เพิ่มในเฟส 1 |
| Scalability | พอสำหรับ Bot เดียว/บัญชีเดียว; ย้าย Orchestrator ไป Inngest/Temporal ได้โดยไม่แตะโมดูลอื่น |
| Team familiarity | สูง — TypeScript เดียวกับ App Shell |

**Pros:** รันและทดสอบได้ครบวันนี้; ไม่ล็อก vendor; Policy/Approval เป็น pure logic ทดสอบง่าย
**Cons:** ต้องดูแล timer ของ approval เอง (ใช้ `tick()` ทุก 30 วินาที); SQLite ไม่เหมาะหลาย instance

### Option B: Supabase + Inngest ตั้งแต่วันแรก

| Dimension | Assessment |
|---|---|
| Complexity | Med |
| Cost | ต่ำ–กลาง |
| Scalability | ดี |
| Team familiarity | สูง (Supabase) |

**Pros:** durable workflow + retry ฟรี; Realtime ใช้ทำ rail ได้เลย
**Cons:** ต้องมี key/project ก่อนจะรันได้; ผูก vendor ก่อนตอบคำถามที่เอกสารเปิดไว้

### Option C: Supabase + Temporal

**Pros:** แข็งแรงที่สุดสำหรับ run หลายชั่วโมง
**Cons:** ต้องดูแล Temporal server เอง เกินจำเป็นสำหรับเฟส 1

## Trade-off Analysis

ความเสี่ยงหลักของเฟส 1 คือ "harness ไว้ใจได้ไหม" ไม่ใช่ scale — Option A ทำให้พิสูจน์กฎทั้งหมด
(policy, approval, lease, audit) ด้วย test ได้ทันที ส่วนความ durable ของ run ได้จากการ persist
ทุก transition ลง Store ซึ่งพอสำหรับ Bot เดียว เมื่อเลือก Inngest/Temporal แล้วจะเขียน adapter
ที่เรียก `Orchestrator.advance()` เป็น step function แทน loop ภายใน

## Consequences

- ง่ายขึ้น: ทดสอบ harness ครบวงจรโดยไม่มี key, เปลี่ยน provider/DB ได้ทีละ adapter
- ยากขึ้น: timer ของ approval อยู่ใน process เดียว ต้องย้ายไป scheduler เมื่อมีหลาย instance
- ต้องกลับมาตัดสิน: Inngest vs Temporal, Supabase project, ES Account auth, sandbox provider (เฟส 2)

## Action Items

1. [x] Domain types + Policy Engine + tests
2. [x] Budget Meter, Audit Log, Credential Broker
3. [x] Approval Service (lifecycle, canary, payload hash)
4. [x] Connector Gateway + 3 connectors (Google Sheets, ES Account CRM, LINE OA) + MCP adapter
5. [x] Orchestrator (durable) + Conversation + Gateway REST/WS
6. [x] Postgres migration + RLS
7. [x] ต่อ Workspace UI เข้ากับ API
8. [ ] เลือก Orchestrator runtime จริง (Inngest/Temporal)
9. [ ] ES Account auth adapter + Supabase Store adapter
