import type { ToolMeta } from '../domain/types.js';
import type { RawTool } from './Connector.js';

/**
 * Best-effort classification of a third-party tool. The result is only a proposal:
 * every tool starts disabled until a person confirms it.
 */
export function classify(tool: RawTool): ToolMeta & { taskClass: string; blastArg?: string } {
  if (tool.harness) return tool.harness;
  const n = `${tool.name} ${tool.description}`.toLowerCase();
  const a = tool.annotations ?? {};
  if (a.readOnlyHint || /\b(get|list|read|search|query|find|fetch)\b/.test(n)) {
    return { effect: 'read', reversible: 'yes', blast: { kind: 'single' }, taskClass: 'read' };
  }
  if (/\b(pay|charge|refund|transfer)\b/.test(n)) return { effect: 'pay', reversible: 'no', blast: { kind: 'single' }, taskClass: 'pay' };
  if (a.destructiveHint || /\b(delete|remove|drop|destroy|void)\b/.test(n)) {
    return { effect: 'destroy', reversible: 'no', blast: { kind: 'single' }, taskClass: 'destroy' };
  }
  if (/\b(send|post|publish|email|message|notify)\b/.test(n)) return { effect: 'send', reversible: 'no', blast: { kind: 'single' }, taskClass: 'send' };
  if (/\b(draft|preview)\b/.test(n)) return { effect: 'draft', reversible: 'yes', blast: { kind: 'single' }, taskClass: 'draft' };
  return { effect: 'write', reversible: a.idempotentHint ? 'yes' : 'partial', blast: { kind: 'single' }, taskClass: 'write' };
}
