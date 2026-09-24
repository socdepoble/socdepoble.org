import { useCallback, useEffect, useRef, useState } from 'react';
import { carregaMapa } from './mapaContent.js';

/**
 * Una sola lectura del Mapa per a totes les pàgines de la Consola.
 * `actiu: false` no llig res: el consumidor ja rep el Mapa d'un altre lloc.
 * Estat: 'loading' | 'ready' | 'absent' | 'error'. Un error conserva
 * l'última lectura bona.
 */
export function useMapa({ actiu = true } = {}) {
  const [estat, setEstat] = useState(actiu ? 'loading' : 'absent');
  const [mapa, setMapa] = useState(null);
  const [error, setError] = useState(null);
  const enCurs = useRef(null);

  const carrega = useCallback(() => {
    enCurs.current?.abort();
    const ac = new AbortController();
    enCurs.current = ac;
    setEstat('loading');
    setError(null);
    carregaMapa(ac.signal)
      .then((m) => {
        if (ac.signal.aborted) return;
        setMapa(m);
        setEstat(m ? 'ready' : 'absent');
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setError(e);
        setEstat('error');
      });
  }, []);

  useEffect(() => {
    if (!actiu) return undefined;
    carrega();
    return () => enCurs.current?.abort();
  }, [actiu, carrega]);

  return { estat, mapa, error, carrega };
}
