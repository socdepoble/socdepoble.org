import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  resolveAsset as resolveAssetSync
} from '../config/assetResolver.js';

import {
  resolveAsset as resolveAssetAsync,
  teCapacitat
} from '../data/backendPort.js';

// Conserva la signatura coneguda del port.
// Un resolutor alternatiu pot acceptar (ref, { signal }).
const defaultResolver = (ref, options) => resolveAssetAsync(ref, options);

export function useResolvedAssetState(
  assetRef,
  { scopeKey = '', resolver = defaultResolver } = {}
) {
  const ref = typeof assetRef === 'string' ? assetRef.trim() : '';
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const activeRequest = useRef(null);

  // Conservar totes les dimensions del token: scope i retry invaliden la URL.
  const key = useMemo(
    () => ({ ref, scopeKey, resolver, attempt }),
    [ref, scopeKey, resolver, attempt]
  );

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const cancel = useCallback(() => {
    const request = activeRequest.current;
    if (!request || request.key !== key || request.finished) return;

    request.controller.abort();

    setResult({
      key,
      status: 'cancelled',
      url: '',
      error: null
    });
  }, [key]);

  useEffect(() => {
    const controller = new AbortController();
    const request = { key, controller, finished: false };
    activeRequest.current = request;

    const publish = (status, url = '', error = null) => {
      if (
        controller.signal.aborted
        || activeRequest.current !== request
      ) {
        return;
      }

      request.finished = status !== 'loading';
      setResult({ key, status, url, error });
    };

    async function resolve() {
      if (!ref) {
        publish('idle');
        return;
      }

      publish('loading');

      try {
        let value;

        if (ref.startsWith('sdp-media://')) {
          if (!teCapacitat('mitjans')) {
            publish('unsupported');
            return;
          }

          value = await resolver(ref, {
            signal: controller.signal
          });
        } else {
          value = resolveAssetSync(ref);
        }

        if (value != null && typeof value !== 'string') {
          throw new TypeError(
            'El resolutor de recursos ha de retornar una URL o null.'
          );
        }

        const url = value?.trim() || '';
        publish(url ? 'ready' : 'missing', url);
      } catch (error) {
        if (controller.signal.aborted) return;

        publish(
          error?.name === 'AbortError' ? 'cancelled' : 'error',
          '',
          error
        );
      }
    }

    void resolve();

    return () => {
      controller.abort();

      if (activeRequest.current === request) {
        activeRequest.current = null;
      }
    };
  }, [key, ref, resolver]);

  // Evita exposar la URL de l'actiu anterior durant el render
  // que precedeix l'execució del nou efecte.
  const current = result?.key === key
    ? result
    : {
        status: ref ? 'loading' : 'idle',
        url: '',
        error: null
      };

  return {
    status: current.status,
    url: current.url,
    error: current.error,
    isLoading: current.status === 'loading',
    retry,
    cancel
  };
}

// Compatibilitat amb els consumidors que esperen una string.
export function useResolvedAsset(assetRef, options) {
  return useResolvedAssetState(assetRef, options).url;
}
