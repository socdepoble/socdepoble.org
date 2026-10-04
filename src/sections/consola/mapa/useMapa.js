import { useCallback, useEffect, useRef, useState } from 'react';
import { carregaMapa } from './mapaContent.js';

/* Higiene d'amfitrió (ordre del Mestre, 261004, front «amfitrio-admin») ·
   El Mapa només el servix el middleware de desenvolupament
   (tooling/vite/consola-iaia.mjs, apply: 'serve'). Fora de DEV (el paquet
   públic, WordPress, Sollutia) no hi ha res a llegir: cap petició a /__iaia/*
   i l'estat és 'absent' des del principi. Es llig en cada crida (no en
   importar el mòdul) perquè les proves puguen canviar l'entorn. */
const ambMiddleware = () => import.meta.env.DEV === true;

/**
 * Una sola lectura del Mapa per a totes les pàgines de la Consola.
 * `actiu: false` no llig res: el consumidor ja rep el Mapa d'un altre lloc.
 * Fora de DEV tampoc no llig res, ni en muntar ni amb `carrega` (Refrescar).
 * Estat: 'loading' | 'ready' | 'absent' | 'error'. Un error conserva
 * l'última lectura bona.
 */
export function useMapa({ actiu = true } = {}) {
  const llig = actiu && ambMiddleware();
  const [estat, setEstat] = useState(llig ? 'loading' : 'absent');
  const [mapa, setMapa] = useState(null);
  const [error, setError] = useState(null);
  const enCurs = useRef(null);

  const carrega = useCallback(() => {
    if (!ambMiddleware()) return;
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
    if (!llig) return undefined;
    carrega();
    return () => enCurs.current?.abort();
  }, [llig, carrega]);

  return { estat, mapa, error, carrega };
}
