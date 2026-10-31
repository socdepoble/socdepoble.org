import { useCallback, useEffect, useRef, useState } from 'react';
import { fontsLlegibles } from './fontsConsola.js';

/* Neteja 261007 (prompt 261007_1628, peça D: auditoria adversarial i codi
   net) · Les dues fonts de la Consola, consola.json (useConsola,
   ConsolaSection.jsx) i el Mapa (useMapa, mapa/useMapa.js), es lligen amb
   este mateix hook. Abans eren dues còpies línia per línia, i una esmena a
   l'una (l'abort, la barrera de DEV) havia de recordar-se de l'altra.

   Higiene d'amfitrió (ordre del Mestre, 261004, front «amfitrio-admin») ·
   Les lectures en viu només les servix el middleware de desenvolupament
   (tooling/vite/consola-iaia.mjs, apply: 'serve', només des de localhost).
   Contracte de dades (_wiki_de_poble/02_saber/03_consola_termodinamica/
   04_contracte_de_dades.md, «On viu l'eixida»): per ordre del Mestre del
   30-10-2026 (T2.2) la interfície de la Consola és pública en qualsevol
   entorn.
   Decisió del Mestre (31-10-2026) · Fora de DEV, el build web llig la
   instantània sanejada que publica a /__iaia/*.json (un GET al mateix
   origen, sense credencials); un paquet sense instantània (WordPress, natiu,
   Sollutia) no demana res i l'estat és 'absent' des del principi. Ho decidix
   fontsLlegibles (fontsConsola.js), que es llig en cada crida (no en
   importar el mòdul) perquè les proves puguen canviar l'entorn. Derogat:
   «Si es publica una instantània de les dades és un punt pendent del Mestre». */
const ambFont = () => fontsLlegibles();

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
 * Sense cap font en este paquet (ni DEV ni la instantània del build web)
 * tampoc no llig res, ni en muntar ni amb `carrega` (Refrescar).
 * Estat: 'loading' | 'ready' | 'absent' | 'error'. Un error conserva
 * l'última lectura bona, i una lectura nova avorta la que encara corre.
 */
export function useFontDev(carregador, { actiu = true } = {}) {
  const llig = actiu && ambFont();
  const [estat, setEstat] = useState(llig ? 'loading' : 'absent');
  const [valor, setValor] = useState(null);
  const [error, setError] = useState(null);
  const enCurs = useRef(null);
  /* L'últim carregador, actualitzat en un efecte (mai en pintar) i abans del
     de la lectura, que es declara després: el patró de useForceLayout.js. */
  const carregadorRef = useRef(carregador);
  useEffect(() => { carregadorRef.current = carregador; }, [carregador]);

  const carrega = useCallback(() => {
    if (!ambFont()) return;
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
