import type { ToolMeta } from '../domain/types.js';

/** A tool as the server describes it (MCP `tools/list`). */
export type RawTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** MCP tool annotations, used to pre-classify before a human confirms. */
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean };
  /** First-party connectors declare their harness metadata directly. */
  harness?: ToolMeta & { taskClass: string; blastArg?: string };
};

/** Transport-level client for one connector (MCP over Streamable HTTP, or a builtin). */
export interface ConnectorClient {
  listTools(): Promise<RawTool[]>;
  call(name: string, args: Record<string, unknown>, secret: string): Promise<unknown>;
}
