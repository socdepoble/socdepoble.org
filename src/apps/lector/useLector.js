/**
 * Lector de notícies · l'estat viu de la persona: el nucli + el magatzem
 * (el patró de useNevera).
 *
 *   const { estat, mode, persistent, error, llegit, accions } = useLector(magatzem);
 *
 *   estat       null mentre es llig el disc; després, l'estat net del nucli
 *   mode        'lliure' | 'escriptora' | 'lectora' (una altra pestanya escriu:
 *               ací només es mira i les accions no fan res)
 *   persistent  false si el navegador no deixa guardar (dades de la sessió)
 *   error       el codi de l'últim error del disc o null
 *   llegit      false fins que el disc s'ha llegit bé una vegada: mentrestant
 *               cap acció canvia ni desa res (xafaria el que el disc no ha tornat)
 *   accions     marcaLlegit(id), marcaLlegits(ids), marcaNoLlegit(id),
 *               commutaDespres(resum), commutaSeguiment(fontId): apliquen el
 *               canvi a la vista de seguida i el desen (en fila). Tornen si han
 *               canviat res.
 * Quan una altra pestanya desa, o quan esta passa a ser l'escriptora, es torna
 * a llegir el disc. Una lectura que arriba després d'un canvi local no el xafa.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  commutaDespres, commutaSeguiment, estatInicial, marcaLlegit, marcaLlegits, marcaNoLlegit
} from './nucli/index.js';

const codiDe = (error) => (typeof error?.codi === 'string' ? error.codi : 'DESCONEGUT');

export function useLector(magatzem) {
  const [estat, setEstat] = useState(null);
  const [mode, setMode] = useState('lliure');
  const [persistent, setPersistent] = useState(true);
  const [error, setError] = useState(null);
  const [llegit, setLlegit] = useState(false);
  const estatRef = useRef(null);
  const modeRef = useRef('lliure');
  const llegitRef = useRef(false);
  /* Puja amb cada canvi local: una lectura començada abans no el xafa. */
  const canvisRef = useRef(0);
  const carregaRef = useRef(() => {});

  useEffect(() => {
    let viu = true;
    modeRef.current = 'lliure';
    llegitRef.current = false;
    const posa = (nou) => {
      estatRef.current = nou;
      setEstat(nou);
    };
    const carrega = ({ conservaError = false } = {}) => {
      const abans = canvisRef.current;
      magatzem.llegix().then((delDisc) => {
        if (!viu || canvisRef.current !== abans) return;
        posa(delDisc);
        llegitRef.current = true;
        setLlegit(true);
        setPersistent(magatzem.persistent);
        if (!conservaError) setError(null);
      }, (motiu) => {
        if (!viu) return;
        setError(codiDe(motiu));
        /* Només per a pintar: llegitRef continua false i aplica() no desa res. */
        if (!estatRef.current) posa(estatInicial());
      });
    };
    carregaRef.current = carrega;
    const posaMode = (nou) => {
      if (!viu) return;
      const relleu = modeRef.current === 'lectora' && nou === 'escriptora';
      modeRef.current = nou;
      setMode(nou);
      if (relleu) {
        llegitRef.current = false;
        setLlegit(false);
        carrega();
      }
    };
    const desfes = magatzem.subscriu((avis) => {
      if (avis.tipus === 'canvi' && avis.local === false) carrega();
      else if (avis.tipus === 'mode') posaMode(avis.mode);
      else if (avis.tipus === 'persistent' && viu) setPersistent(avis.persistent);
    });
    magatzem.obtinBloqueig().then(posaMode, () => {});
    carrega();
    return () => {
      viu = false;
      canvisRef.current += 1;
      carregaRef.current = () => {};
      desfes();
      magatzem.tanca();
    };
  }, [magatzem]);

  /** Aplica una operació pura; si canvia res, la pinta i la desa. */
  const aplica = useCallback((operacio) => {
    const actual = estatRef.current;
    if (!actual || !llegitRef.current || modeRef.current !== 'escriptora') return false;
    const nou = operacio(actual);
    if (nou === actual) return false;
    const canvi = ++canvisRef.current;
    estatRef.current = nou;
    setEstat(nou);
    magatzem.desa(nou, actual).then(() => {
      if (canvi === canvisRef.current) setError(null);
    }, (motiu) => {
      if (canvi !== canvisRef.current) return;
      setError(codiDe(motiu));
      llegitRef.current = false;
      setLlegit(false);
      carregaRef.current({ conservaError: true });
    });
    return true;
  }, [magatzem]);

  const accions = useMemo(() => {
    const fes = (operacio) => (...args) => aplica((actual) => operacio(actual, ...args));
    return Object.freeze({
      marcaLlegit: fes(marcaLlegit),
      marcaLlegits: fes(marcaLlegits),
      marcaNoLlegit: fes(marcaNoLlegit),
      commutaDespres: fes(commutaDespres),
      commutaSeguiment: fes(commutaSeguiment),
      exportaCopia: () => magatzem.exportaCopia(),
      async importaCopia(text) {
        const { personals } = await magatzem.importaCopia(text);
        carregaRef.current();
        return personals.fonts.length;
      }
    });
  }, [aplica, magatzem]);

  return useMemo(
    () => ({ estat, mode, persistent, error, llegit, accions }),
    [estat, mode, persistent, error, llegit, accions]
  );
}
