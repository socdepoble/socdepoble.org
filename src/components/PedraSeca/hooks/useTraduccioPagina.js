/**
 * useTraduccioPagina.js — L'estat del Traductor de Poble d'una pàgina (ordre
 * del Mestre, 260930 · via B; P2-13 · C0545-S1/S2 · ADR-2026-14) + Onada R23
 * (lectura en veu alta i selector d'accent/veu integrat al mateix menú).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUIState } from '../../../app/contexts/UIContext';
import { useRouter } from '../../../app/contexts/RouterContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import {
  CODI_TRADUCCIO, LIMITS_TRADUCCIO, LLENGUES_TRADUCCIO, caractersDe, creaTraductor, llenguaDeTraduccio, sanejaDestinsDeclarats, tradueixTot
} from '../../../data/traductor.js';
import { carregaTraductorLliure, traductorLliureDelLloc } from '../../../data/traductorDelLloc.js';
import { blocsTraduibles, preparaTraduccio, arrelTraduccioPrivada } from '../../universal/traduccio/blocsTraduibles.js';
import {
  VEUS_TERRITORIALS,
  desaVeuPreferida,
  llegeixVeuPreferida,
  sintesiVeuDisponibleLleugera,
  subscriuVeuPreferida,
} from '../../../services/veusTerritorials.js';
import { tradueix, useTraductorOpcional } from './useTraductorOpcional.js';
import { esModeHumaPur } from '../../../sections/realitat/nivellIaia.js';
import useNivellIaia from '../../../sections/realitat/useNivellIaia.js';

export const AVIS_SENSE_TRADUCTOR = 'La traducció automàtica no està disponible en este servidor.';
export const AVIS_ERROR_TRADUCCIO = 'No s’ha pogut traduir la pàgina. Torna-ho a provar més tard.';
export const AVIS_MASSA_LLARGA = 'Esta pàgina és massa llarga per a traduir-la automàticament.';
export const AVIS_SENSE_CONNEXIO = 'No s’ha pogut connectar amb el servei de traducció.';
export const AVIS_SENSE_TEXT = 'Esta pàgina no té text per traduir.';
export const AVIS_ERROR_VEU = 'No s’ha pogut llegir la pàgina en veu alta.';

export const PARELLS_AVIS_TRADUCCIO = Object.freeze({
  senseTraductor: Object.freeze(['section.traduir.avis.senseTraductor', AVIS_SENSE_TRADUCTOR]),
  error: Object.freeze(['section.traduir.avis.error', AVIS_ERROR_TRADUCCIO]),
  massaLlarga: Object.freeze(['section.traduir.avis.massaLlarga', AVIS_MASSA_LLARGA]),
  senseConnexio: Object.freeze(['section.traduir.avis.senseConnexio', AVIS_SENSE_CONNEXIO]),
  senseText: Object.freeze(['section.traduir.avis.senseText', AVIS_SENSE_TEXT]),
  limit: Object.freeze(['section.traduir.avis.limit', 'S’ha arribat al límit de traduccions automàtiques. Torna-ho a provar més tard.']),
  ocupat: Object.freeze(['section.traduir.avis.ocupat', 'El servei de traducció està ocupat. Torna-ho a provar d’ací a un moment.']),
  errorVeu: Object.freeze(['section.traduir.avis.errorVeu', AVIS_ERROR_VEU]),
});

const AVISOS_DEL_SERVIDOR = Object.freeze({
  sdp_traduccio_sense_clau: PARELLS_AVIS_TRADUCCIO.senseTraductor,
  sdp_traduccio_mida: PARELLS_AVIS_TRADUCCIO.massaLlarga,
  sdp_traduccio_limit: PARELLS_AVIS_TRADUCCIO.limit,
  sdp_traduccio_ocupada: PARELLS_AVIS_TRADUCCIO.ocupat,
});

export function parellDError(error) {
  switch (error?.codi) {
    case CODI_TRADUCCIO.NO_DISPONIBLE: return PARELLS_AVIS_TRADUCCIO.senseTraductor;
    case CODI_TRADUCCIO.MASSA_LLARGA: return PARELLS_AVIS_TRADUCCIO.massaLlarga;
    case CODI_TRADUCCIO.INABASTABLE: return PARELLS_AVIS_TRADUCCIO.senseConnexio;
    case CODI_TRADUCCIO.SERVIDOR: return AVISOS_DEL_SERVIDOR[error.codiServidor] || PARELLS_AVIS_TRADUCCIO.error;
    default: return PARELLS_AVIS_TRADUCCIO.error;
  }
}

export const avisDError = (error) => parellDError(error)[1];

const viaLliureDisponible = () => traductorLliureDelLloc() === 'apertium' && typeof globalThis.fetch === 'function';

export const traduccioDePaginesDisponible = (traductorUrl) => creaTraductor({ url: traductorUrl }).disponible || viaLliureDisponible();

const MAX_CAU = 16;
const cau = new Map();
export function buidaCauTraduccions() { cau.clear(); }

const ORIGINAL = Object.freeze({ clau: null, llengua: null, carregant: null, titol: null, blocs: null });

function useEstatUI() {
  try {
    return useUIState();
  } catch {
    return null;
  }
}

function useRouterLlegible() {
  try {
    return useRouter() ?? null;
  } catch {
    return null;
  }
}

/* Onada R29 · R29-CV-06 · La consulta sense ?seccio= (CLAUS_SELECCIO.seccio de seleccioUrl.js; literal
   per no portar eixe mòdul al graf de l'arrencada). */
function consultaSenseSeccio(params) {
  if (!params) return '';
  const copia = new URLSearchParams(params);
  copia.delete('seccio');
  return copia.toString();
}

function textDeBlocTraduit(bloc) {
  if (!bloc || typeof bloc !== 'object') return '';
  if (typeof bloc.text === 'string' && bloc.text.trim()) return bloc.text.trim();
  if (Array.isArray(bloc.peces)) {
    return bloc.peces.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('').trim();
  }
  return '';
}

export function useTraduccioPagina({ titol = null, cosRef = null } = {}) {
  const ui = useEstatUI();
  const url = typeof ui?.externalConfig?.traductorUrl === 'string' ? ui.externalConfig.traductorUrl : '';
  const servidor = useMemo(() => creaTraductor({ url }), [url]);
  const destinsCrus = ui?.externalConfig?.traductorLlengues;
  const clauDestins = Array.isArray(destinsCrus) ? destinsCrus.join(' ') : (typeof destinsCrus === 'string' ? destinsCrus : '');
  const destinsDelServei = useMemo(
    () => (servidor.disponible ? sanejaDestinsDeclarats(clauDestins) ?? null : null),
    [servidor, clauDestins]
  );
  const viaLliure = !servidor.disponible && viaLliureDisponible();
  const traductorDisponible = servidor.disponible || viaLliure;
  const esPrivada = Boolean(cosRef?.current && arrelTraduccioPrivada(cosRef.current));
  const modeHumaPur = esModeHumaPur(useNivellIaia());
  const teVeu = !modeHumaPur && sintesiVeuDisponibleLleugera({ privat: esPrivada });
  const disponible = traductorDisponible || teVeu;

  const { showToast } = useToast();
  const t = useTraductorOpcional();
  const avisa = useCallback((parell) => showToast(tradueix(t, parell)), [showToast, t]);
  const router = useRouterLlegible();
  const textTitol = typeof titol === 'string' ? titol.trim() : '';
  const clauPagina = JSON.stringify([
    router?.currentPath ?? '', router?.searchParams ? String(router.searchParams) : '', textTitol
  ]);
  /* Onada R29 · R29-CV-06 · L'Índex escriu ?seccio= dins de la mateixa pàgina: no és un canvi
     de pàgina i no ha d'aturar la lectura en veu alta. La clau de la veu no el compta. */
  const clauVeu = JSON.stringify([
    router?.currentPath ?? '', consultaSenseSeccio(router?.searchParams), textTitol
  ]);

  const [estat, setEstat] = useState(ORIGINAL);
  const [menuObert, setMenuObert] = useState(false);
  const [veuActual, setVeuActual] = useState(() => llegeixVeuPreferida());
  const [parlantPagina, setParlantPagina] = useState(false);
  const vidaRef = useRef({ peticio: 0, control: null, serveiVeu: null, escoltant: false, lectura: null, generacioVeu: 0 });

  useEffect(() => subscriuVeuPreferida(setVeuActual), []);

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

  useEffect(() => {
    const vida = vidaRef.current;
    if (vida.escoltant) {
      vida.escoltant = false;
      vida.serveiVeu?.atura?.();
    }
    setParlantPagina(false);
    return () => {
      vida.generacioVeu += 1;
      vida.lectura = null;
      if (vida.escoltant) {
        vida.escoltant = false;
        vida.serveiVeu?.atura?.();
      }
    };
  }, [clauVeu]);

  useEffect(() => {
    if (!modeHumaPur) return;
    const vida = vidaRef.current;
    if (vida.escoltant) {
      vida.escoltant = false;
      vida.lectura = null;
      vida.serveiVeu?.atura?.();
      setParlantPagina(false);
    }
  }, [modeHumaPur]);

  const vigent = estat.clau === clauPagina ? estat : ORIGINAL;
  const llenguaInterficie = typeof ui?.llenguaDelText === 'string' && ui.llenguaDelText ? ui.llenguaDelText : null;

  const recullTextPerVeu = useCallback(() => {
    if (vigent.llengua && Array.isArray(vigent.blocs) && vigent.blocs.length) {
      const cap = vigent.titol || textTitol;
      const cos = vigent.blocs.map(textDeBlocTraduit).filter(Boolean);
      const idioma = llenguaDeTraduccio(vigent.llengua)?.lang || 'ca';
      return { text: [cap, ...cos].filter(Boolean).join('\n'), idioma };
    }
    const blocs = blocsTraduibles(cosRef?.current);
    const textos = blocs.map((b) => (typeof b?.text === 'string' ? b.text.trim() : '')).filter(Boolean);
    return {
      text: [textTitol, ...textos].filter(Boolean).join('\n'),
      idioma: llenguaInterficie || 'ca',
    };
  }, [cosRef, llenguaInterficie, textTitol, vigent.blocs, vigent.llengua, vigent.titol]);

  const alternaLecturaVeu = useCallback(async (veuForcada = undefined) => {
    const vida = vidaRef.current;
    const generacio = vida.generacioVeu;
    let modul = vida.serveiVeu;
    if (!modul) {
      try {
        modul = await import('../../../services/veuIaiaService.js');
        // La importació pot acabar després de canviar de pàgina o desmuntar-la.
        if (generacio !== vida.generacioVeu) return;
        vida.serveiVeu = modul;
      } catch {
        if (generacio === vida.generacioVeu) avisa(PARELLS_AVIS_TRADUCCIO.errorVeu);
        return;
      }
    }
    if (vida.escoltant && veuForcada === undefined) {
      vida.escoltant = false;
      modul.atura();
      setParlantPagina(false);
      return;
    }
    const { text, idioma } = recullTextPerVeu();
    if (!text) {
      avisa(PARELLS_AVIS_TRADUCCIO.senseText);
      return;
    }
    const privat = arrelTraduccioPrivada(cosRef?.current);
    /* Onada R29 · R29-CV-01 · Testimoni de crida: en canviar de veu, la locució nova comença
       abans que la vella es rebutge, i el finally de la vella no ha de trepitjar l'estat de la nova. */
    const jo = {};
    vida.lectura = jo;
    vida.escoltant = true;
    setParlantPagina(true);
    try {
      await modul.parla(text, { idioma, privat, veu: veuForcada });
    } catch (err) {
      if (vida.lectura === jo && err?.codi !== 'VEU_AVORTADA') avisa(PARELLS_AVIS_TRADUCCIO.errorVeu);
    } finally {
      if (vida.lectura === jo) {
        vida.lectura = null;
        vida.escoltant = false;
        setParlantPagina(false);
      }
    }
  }, [avisa, cosRef, recullTextPerVeu]);

  const canviaVeuPreferida = useCallback((novaVeu) => {
    const desada = desaVeuPreferida(novaVeu);
    setVeuActual(desada);
    if (vidaRef.current.escoltant) {
      alternaLecturaVeu(desada);
    }
  }, [alternaLecturaVeu]);

  const tria = useCallback(async (codi) => {
    setMenuObert(false);
    if (codi && codi === vigent.llengua && !vigent.carregant) return;
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
    if (arrelTraduccioPrivada(cosRef?.current)) { avisa(PARELLS_AVIS_TRADUCCIO.senseTraductor); return; }
    if (!traductorDisponible) {
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
  }, [avisa, clauPagina, cosRef, destinsDelServei, servidor, textTitol, traductorDisponible, url, vigent.carregant, vigent.llengua]);

  const commutaMenu = useCallback(() => {
    if (!disponible) {
      avisa(PARELLS_AVIS_TRADUCCIO.senseTraductor);
      return;
    }
    setMenuObert((obert) => !obert);
  }, [avisa, disponible]);

  const tancaMenu = useCallback(() => setMenuObert(false), []);
  const original = useCallback(() => tria(null), [tria]);

  const lecturaVeu = useMemo(() => (teVeu ? {
    parlant: parlantPagina,
    veuActual,
    veus: VEUS_TERRITORIALS,
    onEscoltar: () => alternaLecturaVeu(),
    onTriaVeu: canviaVeuPreferida,
  } : null), [alternaLecturaVeu, canviaVeuPreferida, parlantPagina, teVeu, veuActual]);

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
      menu: {
        obert,
        opcions: traductorDisponible ? LLENGUES_TRADUCCIO : [],
        actual: vigent.llengua,
        onTria: tria,
        onTanca: tancaMenu,
        ...(lecturaVeu ? { lecturaVeu } : null),
      },
      commutaMenu,
      tancaMenu,
      tria,
      original,
    };
  }, [commutaMenu, disponible, lecturaVeu, llenguaInterficie, menuObert, original, tancaMenu, traductorDisponible, tria, vigent]);
}
