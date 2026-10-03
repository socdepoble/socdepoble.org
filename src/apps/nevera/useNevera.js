/**
 * La Nevera de Casa · l'estat viu de l'app: el nucli + el magatzem.
 *
 *   const { estat, mode, persistent, error, errorEn, llegit, accions } = useNevera(magatzem);
 *
 *   estat       null mentre es llig el disc; després, l'estat net del nucli
 *   mode        'lliure' | 'escriptora' | 'lectora' (una altra pestanya escriu:
 *               ací només es mira i les accions no fan res)
 *   persistent  false si el navegador no deixa guardar (dades de la sessió)
 *   error       el codi de l'últim error del disc (VERSIO_ANTIGA,
 *               NO_DISPONIBLE, BLOQUEJAT, NOMES_LECTURA…) o null
 *   errorEn     on ha fallat: 'lectura' | 'desat' (null sense error)
 *   llegit      false fins que el disc s'ha llegit bé una vegada. Mentrestant
 *               l'estat és el del primer dia NOMÉS per a pintar: cap acció el
 *               canvia ni el desa (desar-lo xafaria les dades que el disc no
 *               ha pogut tornar). accions.rellegix() ho torna a provar.
 *   accions     les operacions del nucli lligades a l'estat: cada una aplica
 *               el canvi a la vista de seguida i el desa (en fila, en ordre).
 *               Tornen si han canviat res; creaLlista torna l'id nou (o null).
 *
 * Quan una altra pestanya desa, o quan esta passa a ser l'escriptora, es
 * torna a llegir el disc. Una lectura que arriba després d'un canvi local no
 * el xafa.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  afig, afigPerNom, afigPropostes, amagaSeccio, commuta, creaArticlePropi, creaLlista, esborraArticlePropi, esborraLlista,
  estatInicial, lleva, marcaACasa, marcaComprat, mouSeccio, normalitzaEstat, reanomenaLlista, restableixSeccions, triaLlista
} from './nucli/index.js';

const codiDe = (error) => (typeof error?.codi === 'string' ? error.codi : 'DESCONEGUT');

export function useNevera(magatzem) {
  const [estat, setEstat] = useState(null);
  const [mode, setMode] = useState('lliure');
  const [persistent, setPersistent] = useState(true);
  const [error, setError] = useState(null);
  const [errorEn, setErrorEn] = useState(null);
  const [llegit, setLlegit] = useState(false);
  const estatRef = useRef(null);
  const modeRef = useRef('lliure');
  const llegitRef = useRef(false);
  const errorEnRef = useRef(null);
  /* Puja amb cada canvi local: una lectura començada abans no el xafa. */
  const canvisRef = useRef(0);
  /* La lectura del disc de l'efecte viu, per a «Torna-ho a provar». */
  const carregaRef = useRef(() => {});

  /* L'error del disc i on ha passat (null, null: cap). */
  const posaError = useCallback((codi, en) => {
    errorEnRef.current = en;
    setError(codi);
    setErrorEn(en);
  }, []);

  useEffect(() => {
    let viu = true;
    const posa = (nou) => {
      estatRef.current = nou;
      setEstat(nou);
    };
    const carrega = () => {
      const abans = canvisRef.current;
      magatzem.llegix().then((llegitDelDisc) => {
        if (!viu || canvisRef.current !== abans) return;
        posa(llegitDelDisc);
        llegitRef.current = true;
        setLlegit(true);
        setPersistent(magatzem.persistent);
        /* Una lectura bona tanca l'error de lectura; un de desat continua dient-se. */
        if (errorEnRef.current === 'lectura') posaError(null, null);
      }, (motiu) => {
        if (!viu) return;
        posaError(codiDe(motiu), 'lectura');
        /* Només per a pintar: llegitRef continua false i aplica() no desa res. */
        if (!estatRef.current) posa(estatInicial());
      });
    };
    carregaRef.current = carrega;
    const posaMode = (nou) => {
      modeRef.current = nou;
      if (viu) setMode(nou);
    };
    const desfes = magatzem.subscriu((avis) => {
      if (avis.tipus === 'canvi' && avis.local === false) carrega();
      else if (avis.tipus === 'mode') {
        posaMode(avis.mode);
        if (avis.mode === 'escriptora') carrega();
      } else if (avis.tipus === 'persistent' && viu) setPersistent(avis.persistent);
    });
    magatzem.obtinBloqueig().then(posaMode, () => {});
    carrega();
    return () => {
      viu = false;
      carregaRef.current = () => {};
      desfes();
      magatzem.tanca();
    };
  }, [magatzem, posaError]);

  /** Aplica una operació pura; si canvia res, la pinta i la desa. */
  const aplica = useCallback((operacio) => {
    const actual = estatRef.current;
    if (!actual || !llegitRef.current || modeRef.current === 'lectora') return false;
    const nou = operacio(actual);
    if (nou === actual) return false;
    canvisRef.current += 1;
    estatRef.current = nou;
    setEstat(nou);
    magatzem.desa(nou).then(() => posaError(null, null), (motiu) => posaError(codiDe(motiu), 'desat'));
    return true;
  }, [magatzem, posaError]);

  const accions = useMemo(() => {
    const fes = (operacio) => (...args) => aplica((actual) => operacio(actual, ...args));
    return Object.freeze({
      afig: fes(afig),
      afigPerNom: fes(afigPerNom),
      afigPropostes: fes(afigPropostes),
      amagaSeccio: fes(amagaSeccio),
      commuta: fes(commuta),
      creaArticlePropi: fes(creaArticlePropi),
      esborraArticlePropi: fes(esborraArticlePropi),
      esborraLlista: fes(esborraLlista),
      lleva: fes(lleva),
      marcaACasa: fes(marcaACasa),
      marcaComprat: fes(marcaComprat),
      mouSeccio: fes(mouSeccio),
      reanomenaLlista: fes(reanomenaLlista),
      restableixSeccions: fes(restableixSeccions),
      triaLlista: fes(triaLlista),
      creaLlista: (nom) => (aplica((actual) => creaLlista(actual, nom)) ? estatRef.current.darreraLlista : null),
      /** Substituïx totes les dades per les d'una còpia (ja llegida amb llegixCopia). */
      importa: (nou) => aplica(() => normalitzaEstat(nou)),
      esborraTot: () => aplica(() => estatInicial()),
      /** Torna a llegir el disc (després d'un error de lectura). */
      rellegix: () => carregaRef.current()
    });
  }, [aplica]);

  return useMemo(
    () => ({ estat, mode, persistent, error, errorEn, llegit, accions }),
    [estat, mode, persistent, error, errorEn, llegit, accions]
  );
}
