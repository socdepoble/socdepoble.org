/**
 * useTraduccioPagina.js — L'estat del Traductor Sobirà d'una pàgina (ordre
 * del Mestre, 260930 · via B). El munta PageFrame i el passa a useAccions, que
 * hi posa el botó «Traduir» de la barra blava.
 *
 *  · Descobriment: l'URL del servei ve de useUIState().externalConfig
 *    .traductorUrl (el plugin la hi fa arribar; ronda D1 de Codex, sense cap
 *    nonce). Sense URL, o fora d'un UIProvider, el servei no està disponible
 *    i el clic a Traduir ho diu: AVIS_SENSE_TRADUCTOR. IDEA-31 (261030):
 *    llevat que l'entrada pròpia (main.jsx, socdepoble.org estàtic) haja fixat
 *    el transport lliure d'Apertium (data/traductorLliure.js), que va des del
 *    navegador. Un servei del mateix origen sempre mana.
 *  · En triar una llengua es recullen el títol i els blocs de text de
 *    l'article ORIGINAL (blocsTraduibles), es traduïxen en lots
 *    (data/traductor.js) i la pàgina canvia EN LOCAL: estat de React, cap
 *    recàrrega ni navegació. L'original no es desmunta mai: PageFrame
 *    l'amaga mentres es veu la traducció, i «Veure l'original» el torna.
 *    C4 (Codex 261030) · Un bloc amb enllaços o negretes va com a HTML
 *    local si el motor en sap (`admetHtml`) o partit pels enllaços si no
 *    (preparaTraduccio); torna amb les marques de l'original.
 *  · Memòria cau en memòria per servei + llengua + textos: la mateixa pàgina
 *    en la mateixa llengua no es torna a demanar (ni gasta pressupost),
 *    llevat que algun text haja tornat en l'original (ALT-02, Gemini 261030).
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
  CODI_TRADUCCIO, LIMITS_TRADUCCIO, LLENGUES_TRADUCCIO, caractersDe, creaTraductor, llenguaDeTraduccio, sanejaDestinsDeclarats, tradueixTot
} from '../../../data/traductor.js';
import { carregaTraductorLliure, traductorLliureDelLloc } from '../../../data/traductorDelLloc.js';
import { blocsTraduibles, preparaTraduccio } from '../../universal/traduccio/blocsTraduibles.js';
import { tradueix, useTraductorOpcional } from './useTraductorOpcional.js';

export const AVIS_SENSE_TRADUCTOR = 'La traducció automàtica no està disponible en este servidor.';
export const AVIS_ERROR_TRADUCCIO = 'No s’ha pogut traduir la pàgina. Torna-ho a provar més tard.';
export const AVIS_MASSA_LLARGA = 'Esta pàgina és massa llarga per a traduir-la automàticament.';
export const AVIS_SENSE_CONNEXIO = 'No s’ha pogut connectar amb el servei de traducció.';
export const AVIS_SENSE_TEXT = 'Esta pàgina no té text per traduir.';

/* Gauntlet 261030 (cicle 2, menu-traduir-noms-sense-i18n) · Cada avís és un
   parell [clau i18n, reserva en valencià]: ix en la llengua de la
   interfície (src/config/idiomes) i, sense traductor, en valencià. */
export const PARELLS_AVIS_TRADUCCIO = Object.freeze({
  senseTraductor: Object.freeze(['section.traduir.avis.senseTraductor', AVIS_SENSE_TRADUCTOR]),
  error: Object.freeze(['section.traduir.avis.error', AVIS_ERROR_TRADUCCIO]),
  massaLlarga: Object.freeze(['section.traduir.avis.massaLlarga', AVIS_MASSA_LLARGA]),
  senseConnexio: Object.freeze(['section.traduir.avis.senseConnexio', AVIS_SENSE_CONNEXIO]),
  senseText: Object.freeze(['section.traduir.avis.senseText', AVIS_SENSE_TEXT]),
  limit: Object.freeze(['section.traduir.avis.limit', 'S’ha arribat al límit de traduccions automàtiques. Torna-ho a provar més tard.']),
  ocupat: Object.freeze(['section.traduir.avis.ocupat', 'El servei de traducció està ocupat. Torna-ho a provar d’ací a un moment.']),
});

/* Codis de WP REST acordats amb Codex (ronda D1). La resta, el genèric. */
const AVISOS_DEL_SERVIDOR = Object.freeze({
  sdp_traduccio_sense_clau: PARELLS_AVIS_TRADUCCIO.senseTraductor,
  sdp_traduccio_mida: PARELLS_AVIS_TRADUCCIO.massaLlarga,
  sdp_traduccio_limit: PARELLS_AVIS_TRADUCCIO.limit,
  sdp_traduccio_ocupada: PARELLS_AVIS_TRADUCCIO.ocupat,
});

/** El parell [clau, reserva] de l'avís d'un error; la vista el traduïx. */
export function parellDError(error) {
  switch (error?.codi) {
    case CODI_TRADUCCIO.NO_DISPONIBLE: return PARELLS_AVIS_TRADUCCIO.senseTraductor;
    case CODI_TRADUCCIO.MASSA_LLARGA: return PARELLS_AVIS_TRADUCCIO.massaLlarga;
    case CODI_TRADUCCIO.INABASTABLE: return PARELLS_AVIS_TRADUCCIO.senseConnexio;
    case CODI_TRADUCCIO.SERVIDOR: return AVISOS_DEL_SERVIDOR[error.codiServidor] || PARELLS_AVIS_TRADUCCIO.error;
    default: return PARELLS_AVIS_TRADUCCIO.error;
  }
}

/** L'avís d'un error en valencià (la reserva). */
export const avisDError = (error) => parellDError(error)[1];

/* El transport lliure, si l'entrada pròpia l'ha fixat i hi ha fetch. */
const viaLliureDisponible = () => traductorLliureDelLloc() === 'apertium' && typeof globalThis.fetch === 'function';

/** Gauntlet 261030 (cicle 2, traduccions-actiu-a-app-nativa) · Si Traduir
 *  hi traduïx de veritat, amb el mateix criteri que el hook: un servei del
 *  mateix origen o el transport lliure del lloc propi. A l'app nativa, no. */
export const traduccioDePaginesDisponible = (traductorUrl) => creaTraductor({ url: traductorUrl }).disponible || viaLliureDisponible();

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
  /* IDEA-31 · Primer el servei del mateix origen (el connector, el servidor de
     desenvolupament o VITE_TRADUCTOR_URL); si no n'hi ha i l'entrada pròpia
     l'ha fixat, el transport lliure d'Apertium. Cap amfitrió no el pot posar.
     Gauntlet 261030 (cicle 2) · El transport lliure es carrega en triar una
     llengua (traductorDelLloc.js): el botó només en sap si hi és. */
  const servidor = useMemo(() => creaTraductor({ url }), [url]);
  /* Gauntlet 261030 (Fase 3, TC3.1; traduir-eu-de-servidor-503) · Els destins
     que l'amfitrió declara per al seu servei (`traductorLlengues`: WordPress,
     marcatge.php; el servidor de desenvolupament, main.jsx). Un destí que no
     hi és dona el mateix avís «no disponible» que donava el 503, però sense
     cap petició (cap error a la consola) i sense tocar el menú (Llei del
     Píxel). Sense la declaració (amfitrions vells), com abans. */
  const destinsCrus = ui?.externalConfig?.traductorLlengues;
  const clauDestins = Array.isArray(destinsCrus) ? destinsCrus.join(' ') : (typeof destinsCrus === 'string' ? destinsCrus : '');
  const destinsDelServei = useMemo(
    () => (servidor.disponible ? sanejaDestinsDeclarats(clauDestins) ?? null : null),
    [servidor, clauDestins]
  );
  const viaLliure = !servidor.disponible && viaLliureDisponible();
  const disponible = servidor.disponible || viaLliure;
  const { showToast } = useToast();
  const t = useTraductorOpcional();
  const avisa = useCallback((parell) => showToast(tradueix(t, parell)), [showToast, t]);
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
    /* TC3.1 · Abans de tocar res (la traducció a la vista o la que arriba es
       queden): el destí que el servei no declara no s'envia. */
    if (codi != null && destinsDelServei && llenguaDeTraduccio(codi) && !destinsDelServei.includes(codi)) {
      avisa(PARELLS_AVIS_TRADUCCIO.senseTraductor);
      return;
    }
    const vida = vidaRef.current;
    vida.peticio += 1;
    vida.control?.abort();
    vida.control = null;
    if (codi == null) {
      setEstat(ORIGINAL);
      return;
    }
    if (!llenguaDeTraduccio(codi)) return;
    if (!disponible) {
      avisa(PARELLS_AVIS_TRADUCCIO.senseTraductor);
      return;
    }
    let traductor = servidor;
    if (!servidor.disponible) {
      const torn = vida.peticio;
      try {
        traductor = (await carregaTraductorLliure())?.creaTraductorApertium?.() ?? null;
      } catch {
        traductor = null;
      }
      // Mentre es carregava, la pàgina o la llengua han canviat.
      if (torn !== vida.peticio) return;
      if (!traductor?.disponible) {
        avisa(PARELLS_AVIS_TRADUCCIO.senseConnexio);
        return;
      }
    }
    const blocs = blocsTraduibles(cosRef?.current);
    const preparada = preparaTraduccio(blocs, {
      html: typeof traductor.admetHtml === 'function' ? traductor.admetHtml(codi) : false,
      maxim: LIMITS_TRADUCCIO.caractersPagina - caractersDe(textTitol),
    });
    const textos = [...(textTitol ? [textTitol] : []), ...preparada.textos];
    if (!textos.length) {
      avisa(PARELLS_AVIS_TRADUCCIO.senseText);
      return;
    }
    const desplacament = textTitol ? 1 : 0;
    /* Gauntlet 261030 (cicle 2) · `originals`: els índexs de `textos` que han
       tornat en l'original (tradueixTot · enOriginal). Un títol que torna en
       l'original no porta el lang de la traducció; un bloc, el de l'original. */
    const aplica = ({ traduccions, originals }) => setEstat({
      clau: clauPagina,
      llengua: codi,
      carregant: null,
      titol: textTitol && traduccions[0] && !originals.has(0) ? traduccions[0] : null,
      blocs: preparada.munta(
        traduccions.slice(desplacament),
        new Set([...originals].filter((index) => index >= desplacament).map((index) => index - desplacament))
      ),
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
      const originals = new Set();
      const traduccions = await tradueixTot(traductor, textos, codi, {
        signal: control?.signal, enOriginal: (index) => originals.add(index)
      });
      if (id !== vida.peticio) return;
      vida.control = null;
      const desada = { traduccions, originals };
      /* ALT-02 (Gemini 261030) · Una pàgina amb algun text que ha tornat en
         l'original (el motor no l'ha traduït) no es desa: triar-la de nou
         torna a demanar eixos textos (el transport lliure servix la resta
         de la seua memòria cau) en lloc de quedar-se així tota la sessió. */
      if (!originals.size) {
        cau.set(clauCau, desada);
        while (cau.size > MAX_CAU) cau.delete(cau.keys().next().value);
      }
      aplica(desada);
    } catch (error) {
      if (id !== vida.peticio || error?.codi === CODI_TRADUCCIO.CANCELLADA) return;
      vida.control = null;
      setEstat((abans) => (abans.clau === clauPagina ? { ...abans, carregant: null } : abans));
      avisa(parellDError(error));
    }
  }, [avisa, clauPagina, cosRef, destinsDelServei, disponible, servidor, textTitol, url, vigent.carregant, vigent.llengua]);

  const commutaMenu = useCallback(() => {
    if (!disponible) {
      avisa(PARELLS_AVIS_TRADUCCIO.senseTraductor);
      return;
    }
    setMenuObert((obert) => !obert);
  }, [avisa, disponible]);

  const tancaMenu = useCallback(() => setMenuObert(false), []);
  const original = useCallback(() => tria(null), [tria]);
  /* Gauntlet 261030 (Fase 3, TC3.3) · La llengua del text de la interfície
     (UIContext · llenguaDelText), o null fora d'un UIProvider: PageFrame hi
     compara la del contingut per a posar-li el lang (WCAG 3.1.2). */
  const llenguaInterficie = typeof ui?.llenguaDelText === 'string' && ui.llenguaDelText ? ui.llenguaDelText : null;

  return useMemo(() => {
    const obert = menuObert && disponible;
    return {
      disponible,
      llenguaInterficie,
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
  }, [commutaMenu, disponible, llenguaInterficie, menuObert, original, tancaMenu, tria, vigent]);
}
