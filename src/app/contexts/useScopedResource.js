/** Aïlla cada càrrega per àmbit i descarta respostes de generacions anteriors. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

let hostPromise;
function hostReady(signal) {
  // Compartir la importació entre providers i el doble muntatge de StrictMode.
  hostPromise ||= import('../../host.js').catch(error => { hostPromise = null; throw error; });
  return hostPromise.then(host => host.quanLlest({ signal }));
}

export function useScopedResource(loader, actorId, scopeKey, config) {
  const token = useMemo(() => ({ scopeKey, config }), [scopeKey, config]);
  const latest = useRef(0);
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ token: null, status: 'loading', payload: null, error: null });
  useEffect(() => {
    const generation = ++latest.current;
    const controller = new AbortController();
    const current = () => !controller.signal.aborted && latest.current === generation;
    setState({ token, status: 'loading', payload: null, error: null });
    void (async () => {
      try {
        await hostReady(controller.signal);
        if (!current()) return;
        const payload = await loader(actorId, { ...config, signal: controller.signal });
        if (current()) setState({ token, status: 'ready', payload, error: null });
      } catch (error) {
        if (current()) setState({ token, status: 'error', payload: null, error });
      }
    })();
    return () => controller.abort();
  }, [token, loader, actorId, config, tick]);
  const refresh = useCallback(() => setTick(value => value + 1), []);
  return state.token === token ? { ...state, refresh }
    : { token, status: 'loading', payload: null, error: null, refresh };
}
