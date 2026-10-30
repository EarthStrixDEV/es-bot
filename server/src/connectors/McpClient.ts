import type { ConnectorClient, RawTool } from './Connector.js';

type JsonRpcResponse = { id?: number; result?: any; error?: { code: number; message: string } };

/** Minimal MCP client over Streamable HTTP (JSON or SSE responses). */
export class McpClient implements ConnectorClient {
  private sessionId?: string;
  private seq = 0;
  private ready?: Promise<void>;

  constructor(private url: string, private staticSecret = '', private fetchImpl: typeof fetch = fetch) {}

  async listTools(): Promise<RawTool[]> {
    const tools: RawTool[] = [];
    let cursor: string | undefined;
    do {
      const res = await this.request('tools/list', cursor ? { cursor } : {}, this.staticSecret);
      tools.push(...(res.tools ?? []));
      cursor = res.nextCursor;
    } while (cursor);
    return tools;
  }

  async call(name: string, args: Record<string, unknown>, secret: string): Promise<unknown> {
    const res = await this.request('tools/call', { name, arguments: args }, secret);
    if (res.isError) throw new Error(`tool error: ${JSON.stringify(res.content)}`);
    return res.structuredContent ?? res.content;
  }

  private async request(method: string, params: unknown, secret: string): Promise<any> {
    if (!this.ready) this.ready = this.initialize(secret);
    await this.ready;
    return this.post({ jsonrpc: '2.0', id: ++this.seq, method, params }, secret);
  }

  private async initialize(secret: string) {
    await this.post(
      { jsonrpc: '2.0', id: ++this.seq, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'es-bot-gateway', version: '0.1.0' } } },
      secret,
    );
    await this.post({ jsonrpc: '2.0', method: 'notifications/initialized' }, secret, true);
  }

  private async post(body: Record<string, unknown>, secret: string, notification = false): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
    if (secret) headers.Authorization = `Bearer ${secret}`;
    if (this.sessionId) headers['Mcp-Session-Id'] = this.sessionId;
    const res = await this.fetchImpl(this.url, { method: 'POST', headers, body: JSON.stringify(body) });
    this.sessionId = res.headers.get('mcp-session-id') ?? this.sessionId;
    if (!res.ok) throw new Error(`MCP ${String(body.method)} ล้มเหลว: ${res.status}`);
    if (notification) return undefined;
    const msg = await readResponse(res, body.id as number);
    if (msg.error) throw new Error(`MCP ${String(body.method)}: ${msg.error.message}`);
    return msg.result;
  }
}

async function readResponse(res: Response, id: number): Promise<JsonRpcResponse> {
  const type = res.headers.get('content-type') ?? '';
  const text = await res.text();
  if (!type.includes('text/event-stream')) return JSON.parse(text);
  for (const block of text.split(/\n\n/)) {
    const data = block.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('');
    if (!data) continue;
    const msg = JSON.parse(data) as JsonRpcResponse;
    if (msg.id === id) return msg;
  }
  throw new Error('MCP: ไม่พบคำตอบใน event stream');
}
