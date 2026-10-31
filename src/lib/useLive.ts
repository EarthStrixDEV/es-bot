import { useCallback, useEffect, useRef, useState } from 'react';
import { OfflineError, subscribe } from './api';

export type LiveState<T> = {
  /** undefined while loading or when offline */
  data?: T;
  /** No gateway reachable: render the design's demo state. */
  offline: boolean;
  /** Last failed mutation, in the gateway's words. */
  error?: string;
  busy: boolean;
  reload: () => Promise<void>;
  /** Run a mutation, then reload. Errors land in `error` instead of throwing. */
  act: <R>(fn: () => Promise<R>) => Promise<R | undefined>;
};

/** Load data from the gateway and keep it fresh from the event stream. */
export function useLive<T>(load: () => Promise<T>, deps: unknown[]): LiveState<T> {
  const [data, setData] = useState<T>();
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const timer = useRef<number>();
  const loader = useCallback(load, deps);

  const reload = useCallback(async () => {
    try {
      setData(await loader());
    } catch (e) {
      if (e instanceof OfflineError) setOffline(true);
      else setError((e as Error).message);
    }
  }, [loader]);

  useEffect(() => {
    setData(undefined);
    setError(undefined);
    void reload();
  }, [reload]);

  useEffect(() => {
    if (offline) return;
    return subscribe(() => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void reload(), 120);
    });
  }, [offline, reload]);

  const act = useCallback(
    async <R,>(fn: () => Promise<R>) => {
      setBusy(true);
      setError(undefined);
      try {
        const r = await fn();
        await reload();
        return r;
      } catch (e) {
        setError((e as Error).message);
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [reload],
  );

  return { data, offline, error, busy, reload, act };
}
