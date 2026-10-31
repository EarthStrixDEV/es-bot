import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { MINUTE, type Clock } from '../domain/clock.js';
import { newId } from '../domain/ids.js';
import type { Effect } from '../domain/types.js';
import type { Store } from '../store/Store.js';

export type Lease = { handle: string; botId: string; connectorId: string; scope: Effect; expiresAt: number };

/**
 * Holds secrets encrypted at rest and hands out short-lived, single-use handles.
 * Bots and models only ever see the handle; the Connector Gateway redeems it at call time.
 */
export class CredentialBroker {
  private key: Buffer;
  private leases = new Map<string, Lease & { secretRef: string }>();

  constructor(private store: Store, private clock: Clock, masterKey: string, private ttlMs = 5 * MINUTE) {
    this.key = createHash('sha256').update(masterKey).digest();
  }

  /** Store a secret; returns the reference kept on the connector row. */
  put(secret: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const id = newId('sec');
    this.store.secrets.put({ id, ciphertext: ciphertext.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64') });
    return id;
  }

  /** Issue a lease. Called by the Tool Runtime only after Policy has decided. */
  lease(botId: string, connectorId: string, scope: Effect, secretRef: string | undefined): Lease {
    const lease = { handle: newId('lease'), botId, connectorId, scope, expiresAt: this.clock.now().getTime() + this.ttlMs };
    this.leases.set(lease.handle, { ...lease, secretRef: secretRef ?? '' });
    return lease;
  }

  /** Redeem once. Returns the plaintext secret ('' for connectors without auth). */
  redeem(handle: string, connectorId: string): string {
    const lease = this.leases.get(handle);
    this.leases.delete(handle); // single use, even on failure
    if (!lease) throw new Error('lease ไม่ถูกต้องหรือใช้ไปแล้ว');
    if (lease.connectorId !== connectorId) throw new Error('lease ไม่ตรงกับ connector');
    if (this.clock.now().getTime() > lease.expiresAt) throw new Error('lease หมดอายุ');
    if (!lease.secretRef) return '';
    return this.decrypt(lease.secretRef);
  }

  /**
   * Server-side only: the Connector Gateway needs a connector's secret to list its tools.
   * Never exposed through the API or to a model.
   */
  reveal(ref: string): string {
    return this.decrypt(ref);
  }

  private decrypt(ref: string): string {
    const row = this.store.secrets.get(ref);
    if (!row) throw new Error('ไม่พบ secret');
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(row.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(row.tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(row.ciphertext, 'base64')), decipher.final()]).toString('utf8');
  }
}
