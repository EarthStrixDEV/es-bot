import { useCallback, useEffect, useRef, useState } from 'react';
import { api, subscribe, type ApprovalDecision, type Passport, type ThreadView, type ToolDef } from './api';

export type Live = {
  thread: ThreadView;
  passport: Passport;
  tools: Map<string, ToolDef>;
  send: (text: string) => Promise<void>;
  decide: (approvalId: string, decision: ApprovalDecision) => Promise<void>;
  busy: boolean;
  error?: string;
};

/**
 * Live thread for one Bot from the gateway. Returns `null` while loading and
 * `'offline'` when no gateway is running, so screens can fall back to the design's demo state.
 */
export function useBotThread(botId: string): Live | null | 'offline' {
  const [thread, setThread] = useState<ThreadView>();
  const [passport, setPassport] = useState<Passport>();
  const [tools, setTools] = useState<Map<string, ToolDef>>(new Map());
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const timer = useRef<number>();

  const refresh = useCallback(() => api.thread(botId).then(setThread), [botId]);

  useEffect(() => {
    // The hosted preview has no gateway to talk to.
    if (import.meta.env.VITE_PREVIEW) return setOffline(true);
    let cancelled = false;
    Promise.all([api.thread(botId), api.passport(botId), api.tools()])
      .then(([t, p, tl]) => {
        if (cancelled) return;
        setThread(t);
        setPassport(p);
        setTools(new Map(tl.map((x) => [x.id, x])));
      })
      .catch(() => !cancelled && setOffline(true));
    return () => {
      cancelled = true;
    };
  }, [botId]);

  // Coalesce bursts of step/approval events into one refetch.
  useEffect(() => {
    if (offline) return;
    const off = subscribe(() => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void refresh().catch(() => undefined), 80);
    });
    return off;
  }, [offline, refresh]);

  const wrap = useCallback(
    async (fn: () => Promise<unknown>) => {
      setBusy(true);
      setError(undefined);
      try {
        await fn();
        await refresh();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  if (offline) return 'offline';
  if (!thread || !passport) return null;
  return {
    thread,
    passport,
    tools,
    busy,
    error,
    send: (text) => wrap(() => api.send(botId, text)),
    decide: (id, d) => wrap(() => api.decide(id, d)),
  };
}
