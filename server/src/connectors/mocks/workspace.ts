import type { ModelClient } from '../../models/ModelClient.js';
import { BuiltinConnector } from './builtins.js';

/** The Bot's own scratch space: drafts never leave it, so drafting is reversible. */
export const workspace = (model: ModelClient) =>
  new BuiltinConnector(
    [
      {
        name: 'draft_messages',
        description: 'Draft one message per item and keep them in the run workspace.',
        inputSchema: { type: 'object', properties: { items: { type: 'array' }, voice: { type: 'string' } }, required: ['items'] },
        harness: { effect: 'draft', reversible: 'yes', blast: { kind: 'single' }, taskClass: 'draft' },
      },
    ],
    {
      draft_messages: async ({ items, voice }: { items: { shop: string; lineId?: string }[]; voice?: string }) => {
        const texts = await model.draft({ instruction: 'ร่างข้อความ LINE OA แนะนำ ES POS Lite ให้ร้านอาหาร', items, voice });
        return { drafts: items.map((it, i) => ({ shop: it.shop, to: it.lineId, text: texts[i] ?? '' })) };
      },
    },
  );
