# ADR-0002: ใช้ OpenRouter เป็นช่องทางเรียกโมเดลเพียงทางเดียว

**Status:** Accepted
**Date:** 2026-10-31
**Deciders:** พี่เอิร์ธ

## Context

ส่วน Tech Stack ของเอกสาร system design เสนอ "gateway แบบ OpenAI-compatible (เช่น OpenRouter + Anthropic API ตรง)"
และ Model Router มีขั้น Provider fallback กับ Allowlist ที่อาจเหลือ local model เมื่อข้อมูลห้ามออกนอกบ้าน
พี่เอิร์ธตัดสินว่าระบบจะใช้ OpenRouter อย่างเดียว

## Decision

- `OpenRouterModel` เป็น model client ตัวเดียวที่เรียก provider จริง (endpoint คงที่ `openrouter.ai/api/v1/chat/completions`)
  ไม่มี base URL ให้ตั้งเอง และไม่มี adapter ไป Anthropic API ตรงหรือ local model
- config: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` (ค่าเริ่มต้น `openrouter/auto`), `OPENROUTER_FALLBACK_MODELS`
- Provider fallback ใช้ฟีเจอร์ `models: [...]` ของ OpenRouter แทนการสลับ provider เอง
- ไม่มี key → `MockModel` เหมือนเดิม (สำหรับ dev/test)

## Options Considered

| | OpenRouter อย่างเดียว (เลือก) | OpenRouter + Anthropic ตรง | Gateway กลางที่ตั้ง base URL ได้ |
|---|---|---|---|
| Complexity | ต่ำ — key เดียว บิลเดียว | กลาง — 2 adapter, 2 บิล | กลาง |
| Fallback | OpenRouter ทำให้ | ต้องเขียนเอง | ต้องเขียนเอง |
| Data residency / local model | ทำไม่ได้ | ทำไม่ได้ | ทำได้ |
| ค่าใช้จ่าย | มี markup ของ OpenRouter | ถูกกว่าเล็กน้อยสำหรับ Claude | ขึ้นกับ provider |

## Consequences

- ง่ายขึ้น: key เดียว, เลือก/เปลี่ยนโมเดลด้วย model id, Verifier (เฟส 3) ใช้โมเดลคนละตัวได้ง่ายเพราะอยู่ใน catalog เดียว
- ยากขึ้น: ทุก prompt ออกนอกบ้านผ่าน OpenRouter — กฎ Allowlist "ข้อมูลลูกค้าห้ามออกนอกบ้าน → local model" ในเอกสารทำไม่ได้แล้ว
  ถ้าต้องการต้องเปิด ADR ใหม่ หรือใช้ provider routing ของ OpenRouter (เช่น จำกัด provider ที่ไม่เก็บข้อมูล) แทน
- ต้องกลับมาดู: คำถาม "Data residency" ในเอกสาร และหน้า Model Selector ที่ยังแสดง "Local model"

## Action Items

1. [x] เปลี่ยน `OpenAICompatibleModel` เป็น `OpenRouterModel` + fallback models
2. [x] อัปเดต config, `.env.example`, README
3. [ ] ตั้ง provider routing (data policy) ของ OpenRouter เมื่อตอบเรื่อง data residency แล้ว
4. [ ] เอา "Local model" ออกจากหน้า Model Selector (desktop + mobile) — รอพี่ยืนยัน
