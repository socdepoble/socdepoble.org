/**
 * useTraduccioTargeta.js — Traducció dinàmica de targetes individuals (P2-13 ·
 * ADR-2026-14, servei lliure de traducció · Kit r56).
 *
 * Traduïx a demanda els camps de text d'una targeta (`title`, `subtitle`,
 * `summary`, `content`) amb el mateix transport que `useTraduccioPagina`
 * (`creaTraductor` o el carregador diferit de `traductorDelLloc`), sense importar
 * mai `traductorLliure.js` de forma estàtica per preservar l'invariant del paquet
 * d'entrada (`traductorLliure.test.js`).
 *
 * Característiques:
 *  · Agrupa els camps no buits de la targeta en una sola crida a `tradueixTot`
 *    (amb protecció automàtica de noms propis: «Sóc de Poble», «IAIA MarIA»,
 *    «Pedra Seca», «el Mas», etc.).
 *  · Guarda en memòria de sessió (`cacheTargetes`, acotada a 64 entrades LRU)
 *    la traducció de cada combinació `(empremtaTargeta, desti)` per evitar
 *    repetir peticions quan la persona alterna entre l'original i una llengua.
 *  · Informa de quins camps s'han quedat en l'original (`campsEnOriginal`)
 *    perquè la vista mantinga l'atribut `lang="ca"` en eixos camps.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CODI_TRADUCCIO,
  ErrorTraductor,
  LLENGUES_TRADUCCIO,
  creaTraductor,
  llenguaDeTraduccio,
  sanejaDestinsDeclarats,
  tradueixTot,
  exigixTraduccioPublica,
  contingutNoTraduible,
} from '../../../data/traductor.js';
import {
  carregaTraductorLliure,
  traductorLliureDelLloc,
} from '../../../data/traductorDelLloc.js';
import { publicacioTraduible } from '../../universal/traduccio/planTraduccioPublicacio.js';

export const CAMPS_TARGETA_TRADUIBLES = Object.freeze([
  'title',
  'subtitle',
  'summary',
  'content',
]);

export const MAX_CACHE_TARGETES = 64;

const cacheTargetes = new Map();

export function buidaCacheTraduccioTargetes() {
  cacheTargetes.clear();
}

function lligCache(clau) {
  if (!cacheTargetes.has(clau)) return null;
  const valor = cacheTargetes.get(clau);
  cacheTargetes.delete(clau);
  cacheTargetes.set(clau, valor);
  return valor;
}

function escriuCache(clau, valor) {
  if (cacheTargetes.has(clau)) cacheTargetes.delete(clau);
  else if (cacheTargetes.size >= MAX_CACHE_TARGETES) {
    const primera = cacheTargetes.keys().next().value;
    if (primera !== undefined) cacheTargetes.delete(primera);
  }
  cacheTargetes.set(clau, valor);
}

/**
 * Extreu els camps de text pla traduïbles d'una targeta en ordre canònic.
 */
export function extreuCampsTargeta(targeta) {
  exigixTraduccioPublica([targeta]);
  /* R51 (P0-46) · Una targeta amb translation_mode protegit ('curated_5_langs', 'none' o invàlid) no es
     traduïx a màquina: es refusa abans de la memòria cau i del motor, com la marca de privadesa.
     Troballa DQ-01 · Amb l'element sencer, el veredicte del pla (publicacioTraduible): 'on_the_fly'
     sense llengua original de les cinc també és un error i es refusa. */
  if (!publicacioTraduible(targeta)) throw new ErrorTraductor(CODI_TRADUCCIO.NO_DISPONIBLE);
  return llegeixCampsTargeta(targeta);
}

/* Lectura sense guarda: el hook la usa per a pintar l'original d'una targeta
   privada sense llançar en renderitzar; la guarda és al camí de traducció. */
function llegeixCampsTargeta(targeta) {
  const origen = targeta && typeof targeta === 'object' ? targeta : {};
  const valors = {};
  const clausActives = [];

  for (const camp of CAMPS_TARGETA_TRADUIBLES) {
    const cru = origen[camp];
    const net = typeof cru === 'string' ? cru.trim() : '';
    valors[camp] = typeof cru === 'string' ? cru : '';
    if (net.length > 0) {
      clausActives.push(camp);
    }
  }

  const empremta = [
    typeof origen.id === 'string' || typeof origen.id === 'number' ? String(origen.id) : '',
    ...CAMPS_TARGETA_TRADUIBLES.map((camp) => valors[camp]),
  ].join('\u001f');

  return {
    valors,
    clausActives,
    empremta,
  };
}

function missatgeDErrorTargeta(error) {
  switch (error?.codi) {
    case CODI_TRADUCCIO.MASSA_LLARGA:
      return 'Esta targeta és massa llarga per a traduir-la d’una vegada.';
    case CODI_TRADUCCIO.INABASTABLE:
      return 'No s’ha pogut connectar amb el servei de traducció.';
    case CODI_TRADUCCIO.SERVIDOR:
      if (error.status === 429 && error.codiServidor === 'sdp_traduccio_quota_diaria') {
        return 'S’ha esgotat el pressupost diari del servei gratuït de traducció.';
      }
      if (error.status === 429) {
        return 'S’han fet massa traduccions seguides. Espera uns minuts.';
      }
      return 'El servei de traducció no està disponible ara mateix.';
    default:
      return 'No s’ha pogut traduir esta targeta. Torna-ho a provar.';
  }
}

/**
 * Traduïx de manera pura els camps d'una targeta amb un traductor injectat.
 * Retorna `{ camps, campsEnOriginal, desti, lang, desDeCache }`.
 */
export async function tradueixCampsTargeta(
  targeta,
  desti,
  { traductor, signal, usarCache = true } = {}
) {
  const llengua = llenguaDeTraduccio(desti);
  if (!llengua) {
    throw new Error(`Destí de traducció no vàlid: ${String(desti)}`);
  }
  if (!traductor || typeof traductor.tradueix !== 'function') {
    throw new Error('Traductor no disponible');
  }

  const { valors, clausActives, empremta } = extreuCampsTargeta(targeta);
  if (clausActives.length === 0) {
    return {
      camps: { ...valors },
      campsEnOriginal: Object.freeze([]),
      desti: llengua.codi,
      lang: llengua.lang,
      desDeCache: false,
    };
  }

  const clauCache = `${empremta}::${llengua.codi}`;
  if (usarCache) {
    const guardat = lligCache(clauCache);
    if (guardat) {
      return {
        camps: { ...guardat.camps },
        campsEnOriginal: guardat.campsEnOriginal,
        desti: llengua.codi,
        lang: llengua.lang,
        desDeCache: true,
      };
    }
  }

  const textos = clausActives.map((camp) => valors[camp]);
  const indexosEnOriginal = new Set();
  const traduits = await tradueixTot(traductor, textos, llengua.codi, {
    signal,
    enOriginal: (idx) => indexosEnOriginal.add(idx),
  });

  const campsSortida = { ...valors };
  const campsEnOriginal = [];
  clausActives.forEach((camp, idx) => {
    campsSortida[camp] = traduits[idx] ?? valors[camp];
    if (indexosEnOriginal.has(idx)) {
      campsEnOriginal.push(camp);
    }
  });

  const congelat = Object.freeze({
    camps: Object.freeze({ ...campsSortida }),
    campsEnOriginal: Object.freeze(campsEnOriginal),
  });

  if (usarCache) {
    escriuCache(clauCache, congelat);
  }

  return {
    camps: { ...campsSortida },
    campsEnOriginal: congelat.campsEnOriginal,
    desti: llengua.codi,
    lang: llengua.lang,
    desDeCache: false,
  };
}

/**
 * Hook React per a traduir una targeta individual sense recarregar ni alterar el DOM global.
 */
export function useTraduccioTargeta(
  targeta,
  { traductorUrl = '', traductorLlengues } = {}
) {
  const transportLliure = !traductorUrl ? traductorLliureDelLloc() : null;
  const traductorServidor = useMemo(
    () => (traductorUrl ? creaTraductor({ url: traductorUrl }) : null),
    [traductorUrl]
  );
  const adaptadorLliureRef = useRef(null);
  const disponible = !contingutNoTraduible(targeta) && publicacioTraduible(targeta) && Boolean(
    traductorServidor?.disponible || transportLliure === 'apertium'
  );

  const destins = useMemo(() => {
    if (transportLliure === 'apertium') return LLENGUES_TRADUCCIO;
    const declarats = sanejaDestinsDeclarats(traductorLlengues);
    if (!declarats) return LLENGUES_TRADUCCIO;
    return Object.freeze(
      declarats.map((codi) => llenguaDeTraduccio(codi)).filter(Boolean)
    );
  }, [transportLliure, traductorLlengues]);

  const { valors: valorsOriginals, empremta } = useMemo(
    () => llegeixCampsTargeta(targeta),
    [targeta]
  );

  const [estat, setEstat] = useState({
    fase: 'original',
    desti: null,
    error: null,
    campsTraduits: null,
    campsEnOriginal: [],
  });

  const abortRef = useRef(null);
  const empremtaRef = useRef(empremta);

  useEffect(() => {
    if (empremtaRef.current !== empremta) {
      empremtaRef.current = empremta;
      abortRef.current?.abort();
      abortRef.current = null;
      setEstat({
        fase: 'original',
        desti: null,
        error: null,
        campsTraduits: null,
        campsEnOriginal: [],
      });
    }
  }, [empremta]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
    },
    []
  );

  const original = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setEstat({
      fase: 'original',
      desti: null,
      error: null,
      campsTraduits: null,
      campsEnOriginal: [],
    });
  }, []);

  const tria = useCallback(
    async (codi) => {
      if (!disponible || !destins.some((d) => d.codi === codi)) return;
      const llengua = llenguaDeTraduccio(codi);
      if (!llengua) return;

      abortRef.current?.abort();
      const control = new AbortController();
      abortRef.current = control;

      setEstat((prev) => ({
        ...prev,
        fase: 'traduint',
        desti: codi,
        error: null,
      }));

      try {
        let clientActiu = traductorServidor;
        if (!clientActiu) {
          if (!adaptadorLliureRef.current) {
            const modul = await carregaTraductorLliure();
            if (control.signal.aborted) return;
            if (!modul?.creaTraductorApertium) {
              throw new Error('Adaptador lliure no disponible');
            }
            adaptadorLliureRef.current = modul.creaTraductorApertium();
          }
          clientActiu = adaptadorLliureRef.current;
        }

        const resultat = await tradueixCampsTargeta(targeta, codi, {
          traductor: clientActiu,
          signal: control.signal,
        });
        if (control.signal.aborted) return;

        setEstat({
          fase: 'traduida',
          desti: codi,
          error: null,
          campsTraduits: resultat.camps,
          campsEnOriginal: resultat.campsEnOriginal,
        });
      } catch (error) {
        if (control.signal.aborted || error?.codi === CODI_TRADUCCIO.CANCELLADA) {
          return;
        }
        setEstat({
          fase: 'original',
          desti: null,
          error: missatgeDErrorTargeta(error),
          campsTraduits: null,
          campsEnOriginal: [],
        });
      }
    },
    [disponible, destins, targeta, traductorServidor]
  );

  const llenguaActiva = estat.desti ? llenguaDeTraduccio(estat.desti) : null;
  const camps = estat.fase === 'traduida' && estat.campsTraduits
    ? estat.campsTraduits
    : valorsOriginals;

  const langDeCamp = useCallback(
    (camp) => {
      if (estat.fase !== 'traduida' || !llenguaActiva) return undefined;
      if (estat.campsEnOriginal.includes(camp)) return 'ca';
      return llenguaActiva.lang;
    },
    [estat.fase, estat.campsEnOriginal, llenguaActiva]
  );

  return {
    disponible,
    destins,
    fase: estat.fase,
    desti: estat.desti,
    llengua: llenguaActiva,
    error: estat.error,
    camps,
    campsEnOriginal: estat.campsEnOriginal,
    langDeCamp,
    tria,
    original,
  };
}
