import type { ConnectorClient, RawTool } from '../Connector.js';
import { crm, leads } from './data.js';

/** In-process stand-ins for the three MVP connectors. Same contract as a real MCP server. */
export class BuiltinConnector implements ConnectorClient {
  constructor(private tools: RawTool[], private handlers: Record<string, (args: any) => unknown>) {}
  async listTools() {
    return this.tools;
  }
  async call(name: string, args: Record<string, unknown>) {
    const h = this.handlers[name];
    if (!h) throw new Error(`ไม่มี tool ${name}`);
    return h(args);
  }
}

export const googleSheets = () =>
  new BuiltinConnector(
    [
      {
        name: 'read_range',
        description: 'Read rows from a Google Sheet range.',
        inputSchema: { type: 'object', properties: { sheet: { type: 'string' }, range: { type: 'string' } }, required: ['sheet'] },
        harness: { effect: 'read', reversible: 'yes', blast: { kind: 'single' }, taskClass: 'read' },
      },
    ],
    { read_range: () => ({ rows: leads }) },
  );

export const esAccountCrm = () =>
  new BuiltinConnector(
    [
      {
        name: 'lookup_shops',
        description: 'Look up shops in ES Account CRM by name.',
        inputSchema: { type: 'object', properties: { shops: { type: 'array', items: { type: 'string' } } }, required: ['shops'] },
        harness: { effect: 'read', reversible: 'yes', blast: { kind: 'single' }, taskClass: 'read' },
      },
    ],
    { lookup_shops: ({ shops }: { shops: string[] }) => ({ results: shops.map((s) => ({ shop: s, ...crm.get(s) })) }) },
  );

export const lineOa = (outbox: unknown[] = []) =>
  new BuiltinConnector(
    [
      {
        name: 'send_messages',
        description: 'Send LINE OA text messages to shops.',
        inputSchema: {
          type: 'object',
          properties: { messages: { type: 'array', items: { type: 'object', properties: { to: { type: 'string' }, text: { type: 'string' } } } } },
          required: ['messages'],
        },
        harness: { effect: 'send', reversible: 'no', blast: { kind: 'batch', n: 1 }, taskClass: 'send', blastArg: 'messages' },
      },
    ],
    {
      send_messages: ({ messages }: { messages: { to: string; text: string }[] }) => {
        outbox.push(...messages);
        return { sent: messages.length, failed: messages.filter((m) => !m.to).map((m) => m.to) };
      },
    },
  );
