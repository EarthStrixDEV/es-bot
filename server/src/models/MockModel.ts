import type { Message, Plan, ToolDef } from '../domain/types.js';
import type { Lead } from '../connectors/mocks/data.js';
import type { ModelClient, StepContext } from './ModelClient.js';

type Shop = { shop: string; lineId?: string; online?: boolean };

/**
 * Deterministic stand-in used when no model key is configured. It plans the
 * "Leads ชลบุรี → LINE OA" flow from the design and answers anything else plainly.
 */
export class MockModel implements ModelClient {
  readonly name = 'mock-planner';

  async plan(request: string, tools: ToolDef[]): Promise<Plan | null> {
    const has = (id: string) => tools.some((t) => t.id === id && t.enabled);
    const wantsOutreach = /sheet|ชีต/i.test(request) && /line/i.test(request);
    if (!wantsOutreach || !has('google-sheets.read_range') || !has('line-oa.send_messages')) return null;
    return {
      summary: 'แผนก่อนลงมือ · 4 ขั้น',
      steps: [
        { title: 'อ่าน Google Sheet "Leads ชลบุรี"', toolId: 'google-sheets.read_range', args: { sheet: 'leads-chonburi', range: 'A:E' }, estimate: 1 },
        { title: 'ค้นข้อมูลร้านบนเว็บ เทียบกับ CRM', toolId: 'es-account.lookup_shops', args: {}, estimate: 2 },
        { title: 'ร่างข้อความรายร้าน', toolId: 'workspace.draft_messages', args: { voice: 'ES Sales Voice' }, estimate: 5 },
        { title: 'ส่งผ่าน LINE OA', toolId: 'line-oa.send_messages', args: {}, estimate: 3 },
      ],
    };
  }

  async resolveArgs({ step, previous }: StepContext): Promise<Record<string, unknown>> {
    const data = (i: number) => (previous[i]?.output as { data?: any } | undefined)?.data;
    switch (step.toolId) {
      case 'es-account.lookup_shops': {
        const rows: Lead[] = data(0)?.rows ?? [];
        return { shops: rows.filter((r) => !r.contacted).map((r) => r.shop) };
      }
      case 'workspace.draft_messages': {
        const rows: Lead[] = data(0)?.rows ?? [];
        const crm: Shop[] = data(1)?.results ?? [];
        const items = crm.map((c) => ({ shop: c.shop, lineId: rows.find((r) => r.shop === c.shop)?.lineId }));
        return { ...step.args, items };
      }
      case 'line-oa.send_messages': {
        const drafts: { to?: string; text: string }[] = data(2)?.drafts ?? [];
        return { messages: drafts.map((d) => ({ to: d.to ?? '', text: d.text })) };
      }
      default:
        return step.args;
    }
  }

  async draft({ items }: { instruction: string; items: unknown[] }): Promise<string[]> {
    return (items as Shop[]).map(
      (s) => `สวัสดีครับร้าน${s.shop} ปิดร้านแล้วยังต้องนั่งรวมยอดอยู่ไหมครับ ES POS Lite ช่วยสรุปยอดรายวันให้อัตโนมัติ… [ข้อความตัวอย่าง]`,
    );
  }

  async reply(history: Message[]): Promise<string> {
    const last = history.filter((m) => m.role === 'user').at(-1)?.content ?? '';
    return `รับทราบค่ะ: "${last.slice(0, 80)}" — งานนี้ไม่ต้องใช้ tool เลยตอบได้ทันที (โหมด mock: ตั้ง OPENROUTER_API_KEY เพื่อใช้โมเดลจริง)`;
  }
}
