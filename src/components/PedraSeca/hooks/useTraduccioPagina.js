/**
 * useTraduccioPagina.js — L'estat del Traductor Sobirà d'una pàgina (ordre
 * del Mestre, 260930 · via B). El munta PageFrame i el passa a useAccions, que
 * hi posa el botó «Traduir» de la barra blava.
 *
 *  · Descobriment: l'URL del servei ve de useUIState().externalConfig
 *    .traductorUrl (el plugin la hi fa arribar; ronda D1 de Codex, sense cap
 *    nonce). Sense URL, o fora d'un UIProvider, el servei no està disponible
 *    i el clic a Traduir ho diu: AVIS_SENSE_TRADUCTOR.
 *  · En triar una llengua es recullen el títol i els blocs de text de
 *    l'article ORIGINAL (blocsTraduibles), es traduïxen en lots de text
 *    (data/traductor.js) i la pàgina canvia EN LOCAL: estat de React, cap
 *    recàrrega ni navegació. L'original no es desmunta mai: PageFrame
 *    l'amaga mentres es veu la traducció, i «Veure l'original» el torna.
 *  · Memòria cau en memòria per servei + llengua + textos: la mateixa pàgina
 *    en la mateixa llengua no es torna a demanar (ni gasta pressupost).
 *  · Errors: el missatge el tria la vista pel codi, mai pel text del
 *    servidor ni del proveïdor. L'original no es perd mai; una traducció ja
 *    pintada es conserva si la següent falla.
 *  · Un canvi de pàgina (ruta o títol) torna a l'original, tanca el menú i
 *    oblida la petició en vol; una resposta tardana no pinta res.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUIState } from '../../../app/contexts/UIContext';
import { useRouter } from '../../../app/contexts/RouterContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import {
  CODI_TRADUCCIO, LLENGUES_TRADUCCIO, creaTraductor, llenguaDeTraduccio, tradueixTot
} from '../../../data/traductor.js';
import { blocsTraduibles } from '../../universal/traduccio/blocsTraduibles.js';

export const AVIS_SENSE_TRADUCTOR = 'La traducció automàtica no està disponible en este servidor.';
export const AVIS_ERROR_TRADUCCIO = 'No s’ha pogut traduir la pàgina. Torna-ho a provar més tard.';
export const AVIS_MASSA_LLARGA = 'Esta pàgina és massa llarga per a traduir-la automàticament.';
export const AVIS_SENSE_CONNEXIO = 'No s’ha pogut connectar amb el servei de traducció.';
export const AVIS_SENSE_TEXT = 'Esta pàgina no té text per traduir.';

/* Codis de WP REST acordats amb Codex (ronda D1). La resta, el genèric. */
const AVISOS_DEL_SERVIDOR = Object.freeze({
  sdp_traduccio_sense_clau: AVIS_SENSE_TRADUCTOR,
  sdp_traduccio_mida: AVIS_MASSA_LLARGA,
  sdp_traduccio_limit: 'S’ha arribat al límit de traduccions automàtiques. Torna-ho a provar més tard.',
  sdp_traduccio_ocupada: 'El servei de traducció està ocupat. Torna-ho a provar d’ací a un moment.',
});

export function avisDError(error) {
  switch (error?.codi) {
    case CODI_TRADUCCIO.NO_DISPONIBLE: return AVIS_SENSE_TRADUCTOR;
    case CODI_TRADUCCIO.MASSA_LLARGA: return AVIS_MASSA_LLARGA;
    case CODI_TRADUCCIO.INABASTABLE: return AVIS_SENSE_CONNEXIO;
    case CODI_TRADUCCIO.SERVIDOR: return AVISOS_DEL_SERVIDOR[error.codiServidor] || AVIS_ERROR_TRADUCCIO;
    default: return AVIS_ERROR_TRADUCCIO;
  }
}

/* Memòria cau del mòdul: sobreviu al canvi de pàgina i de llengua. */
const MAX_CAU = 16;
const cau = new Map();
export function buidaCauTraduccions() { cau.clear(); }

const ORIGINAL = Object.freeze({ clau: null, llengua: null, carregant: null, titol: null, blocs: null });

/* Fora d'un UIProvider (proves, espècimens) no hi ha configuració: null.
   La forma `return useUIState()` dins del try és la de useUbicacioApp. */
function useEstatUI() {
  try {
    return useUIState();
  } catch {
    return null;
  }
}

/* On està l'app, per a saber quan canvia de pàgina: el mateix que
   useUbicacioApp (useAccions.js), repetit ací a propòsit. Hi ha proves que
   substituïxen useAccions.js sencer (PageFrame.test.jsx), i PageFrame ha de
   continuar pintant-se sense este hook. Sense router, null. */
function useRouterLlegible() {
  try {
    return useRouter() ?? null;
  } catch {
    return null;
  }
}

export function useTraduccioPagina({ titol = null, cosRef = null } = {}) {
  const ui = useEstatUI();
  const url = typeof ui?.externalConfig?.traductorUrl === 'string' ? ui.externalConfig.traductorUrl : '';
  const traductor = useMemo(() => creaTraductor({ url }), [url]);
  const { showToast } = useToast();
  const router = useRouterLlegible();
  const textTitol = typeof titol === 'string' ? titol.trim() : '';
  const clauPagina = JSON.stringify([
    router?.currentPath ?? '', router?.searchParams ? String(router.searchParams) : '', textTitol
  ]);

  const [estat, setEstat] = useState(ORIGINAL);
  const [menuObert, setMenuObert] = useState(false);
  /* Un sol objecte mutable (mai reassignat): la petició viva i el seu torn. */
  const vidaRef = useRef({ peticio: 0, control: null });

  useEffect(() => {
    const vida = vidaRef.current;
    setEstat((abans) => (abans.clau === clauPagina ? abans : ORIGINAL));
    setMenuObert(false);
    return () => {
      vida.peticio += 1;
      vida.control?.abort();
      vida.control = null;
    };
  }, [clauPagina]);

  // Durant el pintat que canvia de pàgina, l'estat vell ja no hi compta.
  const vigent = estat.clau === clauPagina ? estat : ORIGINAL;

  const tria = useCallback(async (codi) => {
    setMenuObert(false);
    if (codi && codi === vigent.llengua && !vigent.carregant) return;
    const vida = vidaRef.current;
    vida.peticio += 1;
    vida.control?.abort();
    vida.control = null;
    if (codi == null) {
      setEstat(ORIGINAL);
      return;
    }
    if (!llenguaDeTraduccio(codi)) return;
    if (!traductor.disponible) {
      showToast(AVIS_SENSE_TRADUCTOR);
      return;
    }
    const blocs = blocsTraduibles(cosRef?.current);
    const textos = [...(textTitol ? [textTitol] : []), ...blocs.map((bloc) => bloc.text)];
    if (!textos.length) {
      showToast(AVIS_SENSE_TEXT);
      return;
    }
    const desplacament = textTitol ? 1 : 0;
    const aplica = (traduccions) => setEstat({
      clau: clauPagina,
      llengua: codi,
      carregant: null,
      titol: textTitol ? (traduccions[0] || textTitol) : null,
      blocs: blocs.map((bloc, i) => ({ ...bloc, text: traduccions[i + desplacament] || bloc.text })),
    });
    const clauCau = JSON.stringify([url, codi, textos]);
    if (cau.has(clauCau)) {
      const desada = cau.get(clauCau);
      cau.delete(clauCau);
      cau.set(clauCau, desada);
      aplica(desada);
      return;
    }
    const id = vida.peticio;
    const control = typeof AbortController === 'function' ? new AbortController() : null;
    vida.control = control;
    setEstat((abans) => ({ ...(abans.clau === clauPagina ? abans : ORIGINAL), clau: clauPagina, carregant: codi }));
    try {
      const traduccions = await tradueixTot(traductor, textos, codi, { signal: control?.signal });
      if (id !== vida.peticio) return;
      vida.control = null;
      cau.set(clauCau, traduccions);
      while (cau.size > MAX_CAU) cau.delete(cau.keys().next().value);
      aplica(traduccions);
    } catch (error) {
      if (id !== vida.peticio || error?.codi === CODI_TRADUCCIO.CANCELLADA) return;
      vida.control = null;
      setEstat((abans) => (abans.clau === clauPagina ? { ...abans, carregant: null } : abans));
      showToast(avisDError(error));
    }
  }, [clauPagina, cosRef, showToast, textTitol, traductor, url, vigent.carregant, vigent.llengua]);

  const commutaMenu = useCallback(() => {
    if (!traductor.disponible) {
      showToast(AVIS_SENSE_TRADUCTOR);
      return;
    }
    setMenuObert((obert) => !obert);
  }, [showToast, traductor]);

  const tancaMenu = useCallback(() => setMenuObert(false), []);
  const original = useCallback(() => tria(null), [tria]);

  return useMemo(() => {
    const obert = menuObert && traductor.disponible;
    return {
      disponible: traductor.disponible,
      llengua: vigent.llengua,
      lang: llenguaDeTraduccio(vigent.llengua)?.lang ?? null,
      carregant: vigent.carregant,
      titol: vigent.titol,
      blocs: vigent.blocs,
      menuObert: obert,
      /* El que useAccions dona a la barra blava (BarraBlava · menuTraduir). */
      menu: { obert, opcions: LLENGUES_TRADUCCIO, actual: vigent.llengua, onTria: tria, onTanca: tancaMenu },
      commutaMenu,
      tancaMenu,
      tria,
      original,
    };
  }, [commutaMenu, menuObert, original, tancaMenu, traductor, tria, vigent]);
}
