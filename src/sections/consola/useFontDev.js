import { useCallback, useEffect, useRef, useState } from 'react';

/* Neteja 261007 (prompt 261007_1628, peça D: auditoria adversarial i codi
   net) · Les dues fonts de la Consola, consola.json (useConsola,
   ConsolaSection.jsx) i el Mapa (useMapa, mapa/useMapa.js), es lligen amb
   este mateix hook. Abans eren dues còpies línia per línia, i una esmena a
   l'una (l'abort, la barrera de DEV) havia de recordar-se de l'altra.

   Higiene d'amfitrió (ordre del Mestre, 261004, front «amfitrio-admin») ·
   Les dues fonts només les servix el middleware de desenvolupament
   (tooling/vite/consola-iaia.mjs, apply: 'serve', només des de localhost).
   Fora de DEV (el paquet públic, WordPress, Sollutia) no hi ha res a llegir:
   cap petició a /__iaia/* i l'estat és 'absent' des del principi. El Mapa no
   pot entrar al paquet de WordPress ni a la Wiki pública (contracte de dades,
   _wiki_de_poble/02_saber/03_consola_termodinamica/04_contracte_de_dades.md,
   «On viu l'eixida»): el codi seguix la primera de les dues opcions que eixe
   apartat deixa al Mestre, servir la Consola només en desenvolupament.
   Es llig en cada crida (no en importar el mòdul) perquè les proves puguen
   canviar l'entorn. */
const ambMiddleware = () => import.meta.env.DEV === true;

/**
 * Una lectura d'una font de desenvolupament per a totes les pàgines de la
 * Consola. `carregador(signal)` torna la promesa de la lectura (null si la
 * font no hi és); els d'ara són funcions de mòdul (carregaConsola,
 * carregaMapa).
 * Esmena del revisor adversarial (peça D) · `carrega` és estable, com en
 * les dues còpies d'abans (useCallback amb []): el hook guarda l'últim
 * carregador en una ref i `carrega` el llig en cada crida. Un carregador en
 * línia, nou a cada pintada, no torna a llegir sol (sense el bucle de
 * lectures que tindria si `carrega` en depenguera); el següent Refrescar ja
 * fa servir el nou.
 * `actiu: false` no llig res: el consumidor ja rep la font d'un altre lloc.
 * Fora de DEV tampoc no llig res, ni en muntar ni amb `carrega` (Refrescar).
 * Estat: 'loading' | 'ready' | 'absent' | 'error'. Un error conserva
 * l'última lectura bona, i una lectura nova avorta la que encara corre.
 */
export function useFontDev(carregador, { actiu = true } = {}) {
  const llig = actiu && ambMiddleware();
  const [estat, setEstat] = useState(llig ? 'loading' : 'absent');
  const [valor, setValor] = useState(null);
  const [error, setError] = useState(null);
  const enCurs = useRef(null);
  /* L'últim carregador, actualitzat en un efecte (mai en pintar) i abans del
     de la lectura, que es declara després: el patró de useForceLayout.js. */
  const carregadorRef = useRef(carregador);
  useEffect(() => { carregadorRef.current = carregador; }, [carregador]);

  const carrega = useCallback(() => {
    if (!ambMiddleware()) return;
    enCurs.current?.abort();
    const ac = new AbortController();
    enCurs.current = ac;
    setEstat('loading');
    setError(null);
    carregadorRef.current(ac.signal)
      .then((v) => {
        if (ac.signal.aborted) return;
        setValor(v);
        setEstat(v ? 'ready' : 'absent');
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

  return { estat, valor, error, carrega };
}
