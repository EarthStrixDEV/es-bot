import { DatabaseSync } from 'node:sqlite';
import { matches, type AppendOnly, type Collection, type Store } from './Store.js';

const COLLECTIONS = [
  'bots', 'passports', 'connectors', 'tools', 'secrets', 'threads', 'messages',
  'runs', 'steps', 'checkpoints', 'approvals', 'usage',
] as const;

/**
 * Durable Store on a single SQLite file (or ":memory:" for tests).
 * Rows are JSON documents; the Postgres schema in db/migrations is the production shape.
 */
export function createSqliteStore(path = ':memory:'): Store {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL;');

  function collection<T extends { id: string }>(name: string): Collection<T> {
    db.exec(`CREATE TABLE IF NOT EXISTS ${name} (seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, data TEXT NOT NULL)`);
    const get = db.prepare(`SELECT data FROM ${name} WHERE id = ?`);
    const upsert = db.prepare(`INSERT INTO ${name} (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data`);
    const all = db.prepare(`SELECT data FROM ${name} ORDER BY seq`);
    return {
      get(id) {
        const row = get.get(id) as { data: string } | undefined;
        return row ? (JSON.parse(row.data) as T) : undefined;
      },
      put(row) {
        upsert.run(row.id, JSON.stringify(row));
        return row;
      },
      list(where) {
        return (all.all() as { data: string }[]).map((r) => JSON.parse(r.data) as T).filter((r) => matches(r, where));
      },
    };
  }

  function appendOnly<T extends { id: string }>(name: string): AppendOnly<T> {
    db.exec(`CREATE TABLE IF NOT EXISTS ${name} (seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, data TEXT NOT NULL)`);
    // Same guarantee as the Postgres trigger: rows can never change once written.
    db.exec(`CREATE TRIGGER IF NOT EXISTS ${name}_no_update BEFORE UPDATE ON ${name} BEGIN SELECT RAISE(ABORT, 'append-only'); END;`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS ${name}_no_delete BEFORE DELETE ON ${name} BEGIN SELECT RAISE(ABORT, 'append-only'); END;`);
    const insert = db.prepare(`INSERT INTO ${name} (id, data) VALUES (?, ?)`);
    const all = db.prepare(`SELECT data FROM ${name} ORDER BY seq`);
    return {
      append(row) {
        insert.run(row.id, JSON.stringify(row));
        return row;
      },
      list(where) {
        return (all.all() as { data: string }[]).map((r) => JSON.parse(r.data) as T).filter((r) => matches(r, where));
      },
    };
  }

  const store = Object.fromEntries(COLLECTIONS.map((n) => [n, collection(n)])) as unknown as Store;
  store.audit = appendOnly('audit_events');
  store.close = () => db.close();
  return store;
}
