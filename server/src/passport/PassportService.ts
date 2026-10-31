import type { AuditLog } from '../audit/AuditLog.js';
import type { ConnectorGateway } from '../connectors/ConnectorGateway.js';
import type { Clock } from '../domain/clock.js';
import type { EventBus } from '../domain/events.js';
import { TRUST_LEVELS, type Decision, type Effect, type Grant, type Passport, type TrustLevel } from '../domain/types.js';
import type { Store } from '../store/Store.js';

export type PassportPatch = {
  trust?: Record<string, TrustLevel>;
  budget?: { perRun?: number; perDay?: number };
};

export type DryRunRow = {
  toolId: string;
  connectorId: string;
  effect: Effect;
  current: { decision: Decision; level?: TrustLevel; reason: string };
  proposed: { decision: Decision; level?: TrustLevel; reason: string };
  changed: boolean;
};

/** Classes that stay at L0 whatever the Passport says (the Policy Engine hard-denies them anyway). */
const LOCKED: Record<string, TrustLevel> = { pay: 'L0', destroy: 'L0' };
const GRANTABLE: Effect[] = ['read', 'draft', 'write', 'send'];

export class PassportError extends Error {}

/**
 * The single document that says what a Bot may do. Every change saves a new version,
 * is audited, and takes effect on the next Policy decision.
 */
export class PassportService {
  constructor(
    private store: Store,
    private bus: EventBus,
    private clock: Clock,
    private audit: AuditLog,
    private gateway: ConnectorGateway,
  ) {}

  get(botId: string): Passport {
    const p = this.store.passports.get(botId);
    if (!p) throw new PassportError(`Bot ${botId} ยังไม่มี Passport`);
    return strip(p);
  }

  versions(botId: string): Passport[] {
    return this.store.passportVersions.list({ botId }).map(strip);
  }

  /** Apply a patch in memory and validate it, without saving. */
  preview(botId: string, patch: PassportPatch): Passport {
    const current = this.get(botId);
    const trust = { ...current.trust };
    for (const [taskClass, level] of Object.entries(patch.trust ?? {})) {
      if (!TRUST_LEVELS.includes(level)) throw new PassportError(`ระดับ ${level} ไม่ถูกต้อง`);
      if (LOCKED[taskClass] && level !== LOCKED[taskClass]) throw new PassportError(`${taskClass} ถูกล็อกไว้ที่ ${LOCKED[taskClass]} ทั้งบัญชี`);
      trust[taskClass] = level;
    }
    const budget = { ...current.budget };
    for (const key of ['perRun', 'perDay'] as const) {
      const v = patch.budget?.[key];
      if (v === undefined) continue;
      if (!Number.isFinite(v) || v < 0 || v > 1_000_000) throw new PassportError('งบต้องเป็นตัวเลข 0–1,000,000 บาท');
      budget[key] = v;
    }
    return { ...current, trust, budget };
  }

  update(botId: string, patch: PassportPatch, by: string): Passport {
    const next = this.preview(botId, patch);
    return this.save(next, by, 'passport.update', { patch });
  }

  /** What every enabled tool would be decided under the patched Passport, next to today's answer. */
  dryRun(botId: string, patch: PassportPatch): DryRunRow[] {
    const current = this.get(botId);
    const proposed = this.preview(botId, patch);
    return this.gateway
      .tools()
      .filter((t) => t.enabled)
      .map((t) => {
        const args = t.blastArg ? { [t.blastArg]: Array.from({ length: 1 }) } : {};
        const now = this.gateway.decide(current, t.id, args, true);
        const then = this.gateway.decide(proposed, t.id, args, true);
        const pick = (r: typeof now) => ({ decision: r.decision, level: r.level, reason: r.reason });
        return {
          toolId: t.id,
          connectorId: t.connectorId,
          effect: t.effect,
          current: pick(now),
          proposed: pick(then),
          changed: now.decision !== then.decision || now.level !== then.level,
        };
      });
  }

  grant(botId: string, input: { connectorId: string; scope: Effect; level?: TrustLevel }, by: string): Passport {
    const current = this.get(botId);
    if (!this.store.connectors.get(input.connectorId)) throw new PassportError('ไม่พบ connector');
    if (!GRANTABLE.includes(input.scope)) throw new PassportError(`ให้สิทธิ์ ${input.scope} ไม่ได้ (pay/destroy ถูกห้ามทั้งบัญชี)`);
    if (input.level && !TRUST_LEVELS.includes(input.level)) throw new PassportError(`ระดับ ${input.level} ไม่ถูกต้อง`);
    if (current.grants.some((g) => g.connectorId === input.connectorId && !g.revokedAt)) {
      throw new PassportError('Bot นี้มีสิทธิ์บน connector นี้อยู่แล้ว · revoke ก่อนถ้าจะเปลี่ยน scope');
    }
    const grant: Grant = { connectorId: input.connectorId, scope: input.scope, ...(input.level ? { level: input.level } : {}) };
    return this.save({ ...current, grants: [...current.grants, grant] }, by, 'grant.create', { ...grant });
  }

  revoke(botId: string, connectorId: string, by: string): Passport {
    const current = this.get(botId);
    const at = this.clock.now().toISOString();
    let found = false;
    const grants = current.grants.map((g) => {
      if (g.connectorId !== connectorId || g.revokedAt) return g;
      found = true;
      return { ...g, revokedAt: at };
    });
    if (!found) throw new PassportError('ไม่มีสิทธิ์ที่ใช้งานอยู่บน connector นี้');
    return this.save({ ...current, grants }, by, 'grant.revoke', { connectorId });
  }

  /** Bots holding a live grant on a connector. */
  botsWithAccess(connectorId: string): { botId: string; scope: Effect; level?: TrustLevel }[] {
    return this.store.passports
      .list()
      .flatMap((p) => p.grants.filter((g) => g.connectorId === connectorId && !g.revokedAt).map((g) => ({ botId: p.botId, scope: g.scope, level: g.level })));
  }

  private save(next: Passport, by: string, action: string, meta: Record<string, unknown>): Passport {
    const saved: Passport = { ...next, version: next.version + 1 };
    this.store.passports.put({ ...saved, id: saved.botId });
    this.store.passportVersions.put({ ...saved, id: `${saved.botId}@v${saved.version}` });
    this.audit.record({ actor: by, action, target: `passport:${saved.botId}`, meta: { version: saved.version, ...meta } });
    this.bus.emit({ type: 'passport.updated', passport: saved });
    return saved;
  }
}

function strip(p: Passport & { id?: string }): Passport {
  const { id: _id, ...rest } = p;
  return rest;
}

