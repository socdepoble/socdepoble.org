/**
 * usePublicacionsDeLActor.js — el que l'actor actiu (la persona, o l'entitat
 * amb què actua) ja ha publicat en una secció, en l'ordre del Mur.
 *
 * Esmena 2 del pla 261007_1645 (ordre del Mestre, 261007: «Esta lògica de
 * llistar elements de la categoria per a l'avatar actiu ha d'estar disponible
 * per tot el sistema») · Abans, el MAS només ho pintava a la columna de la
 * llista del Bloc (NotesSection · itemsPublicatsDe) i davall de l'editor no
 * hi havia res. Ara la peça és una: este hook i el component que el pinta
 * (PublicacionsDeLActor.jsx). Qui la vulga (una publicació oberta,
 * un perfil demà) passa la secció i, si cal, l'element que ja té obert.
 * Gauntlet 261016 (Bloc 3.9, F45) · L'editor del Bloc de Notes ja no en
 * porta cap: el peu «Ja publicat al Mur» només viu a PublicacioDetall.
 *
 * Cap lògica nova ni cap petició nova (lliçó 261007: es reutilitza la
 * maquinària que ja existix):
 *  · les dades, les del Mur (useMur → MurContext → backendPort.loadMur):
 *    Model B, tot passa pel port;
 *  · qui és l'actor, useIdentitat; els seus àlies, aliesDeLActor
 *    (identitatsSeed.js), amb el mode de dades normalitzat
 *    (normalizeBackendConfig), com useEntitatDelProjecte;
 *  · què és de l'actor, itemsPublicatsDe (masDeLUsuari.js), SENSE
 *    publicadesDesDeNotes: la deduplicació D2 (261004) és de la columna de la
 *    llista, on la peça és la nota editable. Ací les publicacions del Mur
 *    nascudes d'una nota sí que ixen; si no, el Mur de Sóc de Poble quedaria
 *    buit al peu d'una publicació oberta;
 *  · l'ordre, el de MurSection: momentDeLaTargeta i perMomentDescendent
 *    (targetesMur.js), amb el model de l'acte (acteAEsdeveniment) per als
 *    esdeveniments.
 *
 * Seccions: Mur, Mercat i Esdeveniments, les que tenen targeta canònica de
 * llista (TargetaDelMur, TargetaDelMercat). Multimèdia no en té cap: queda
 * fora fins que el Mestre decidisca quina targeta porta (pregunta oberta).
 *
 * Grup E de l'Onada 4 (prompt 261008_1201, tasca 2; decisió del Mestre del
 * 261008) · Les pàgines del sistema que el Mur signa com a «Sóc de Poble»
 * (targetesDeSistema, les mateixes de MurSection, del contingut core) són de
 * l'entitat pilot: al Mur de l'actor hi entren amb les seues publicacions, en
 * l'ordre del Mur (momentDeLaTargeta). De qui són ho diu pertanyALActor
 * (masDeLUsuari.js): de l'entitat pilot i de ningú més.
 *
 * Límit conegut · En remot el port porta les 50 darreres publicacions de cada
 * secció de tot el poble (section_submissions, content.js) i el filtre per
 * actor es fa al client: l'històric és una finestra, no l'historial sencer.
 * El contingut base (app_content) arriba sencer.
 */
import { useMemo } from 'react';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useUIState } from '../../app/contexts/UIContext';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { autorDe } from '../../config/navigation.js';
import { aliesDeLActor } from '../../data/identitatsSeed.js';
import { itemsPublicatsDe } from '../notes/masDeLUsuari.js';
import { useMur } from './MurContext';
import { acteAEsdeveniment } from './agendaMur.js';
import { momentDeLaTargeta, perMomentDescendent, targetesDeSistema } from './targetesMur.js';

/* Les seccions que tenen històric, en l'ordre del catàleg del Bloc. */
export const SECCIONS_AMB_HISTORIC = Object.freeze(['mur', 'mercat', 'events']);
export const teHistoric = (seccio) => SECCIONS_AMB_HISTORIC.includes(seccio);

/* Decisió per defecte del Mestre (261007) · el Foraster no veu cap històric.
   Revisió adversarial del 261007 · Sense sessió l'actor no és null:
   IdentitatContext hi posa la persona convidada ({ tipus: 'persona', id:
   getDefaultUserId(), rol: 'convidat' }), i eixe id no és mai buit (el kit
   de conformitat: «text no buit, la sessió o el convidat»). Per això no
   n'hi ha prou amb l'id: el criteri és el d'aliesDeLActor (identitatsSeed.js),
   on el convidat tampoc no hereta res. Una sola regla per a qui decidix si
   hi ha peu (PublicacioDetall) i per a qui el pinta
   (PublicacionsDeLActor): si divergiren, PageFrame pintaria una regió amb nom,
   buida i amb coixí. */
export const esActorAmbHistoric = (actor) => Boolean(actor?.id) && actor?.rol !== 'convidat';
/** Si `actor` veu l'històric de `seccio`: una secció que en té i un actor que no és el Foraster. */
export const potVeureHistoric = (actor, seccio) => teHistoric(seccio) && esActorAmbHistoric(actor);

/* D'on ix cada secció dins del Mur (la llista ordenada amb les fixades
   davant, sortPinnedContent) i amb quina clau la llig itemsPublicatsDe. */
const LLISTA_DEL_MUR = Object.freeze({ mur: 'sortedFeedPosts', mercat: 'sortedMarketItems', events: 'sortedEvents' });
const FONT_DEL_MAS = Object.freeze({ mur: 'feedPosts', mercat: 'marketItems', events: 'events' });
const CAP = Object.freeze([]);

/* Els textos de la regió, com a parells [clau, reserva en valencià].
   Revisió adversarial del 261007 · Les claus ja són al diccionari en les cinc
   llengües (i18n.js), i la reserva és el valor valencià (i18n.claus.test.js).
   El text final és una pregunta oberta al Mestre. Mòdul pur: qui pinta passa
   el seu `t`. */
const TEXTOS = Object.freeze({
  mur: {
    titol: ['section.notes.historic.mur.titol', 'Ja publicat al Mur'],
    buit: ['section.notes.historic.mur.buit', 'Amb esta identitat encara no hi ha res publicat al Mur.']
  },
  mercat: {
    titol: ['section.notes.historic.mercat.titol', 'Ja publicat al Mercat'],
    buit: ['section.notes.historic.mercat.buit', 'Amb esta identitat encara no hi ha res publicat al Mercat.']
  },
  events: {
    titol: ['section.notes.historic.events.titol', 'Ja publicat a Esdeveniments'],
    buit: ['section.notes.historic.events.buit', 'Amb esta identitat encara no hi ha res publicat a Esdeveniments.']
  }
});
const CARREGANT = ['section.notes.historic.carregant', 'Carregant les publicacions…'];
const ERROR = ['section.notes.historic.error', 'No s’han pogut carregar les publicacions'];

const senseTraduccio = (_clau, reserva) => reserva;

/** Els textos de l'històric d'una secció ({ titol, buit, carregant, error }); null si no en té. */
export function textosDeLHistoric(seccio, t = senseTraduccio) {
  const propis = teHistoric(seccio) ? TEXTOS[seccio] : null;
  if (!propis) return null;
  const tradueix = typeof t === 'function' ? t : senseTraduccio;
  return {
    titol: tradueix(...propis.titol),
    buit: tradueix(...propis.buit),
    carregant: tradueix(...CARREGANT),
    error: tradueix(...ERROR)
  };
}

/** El títol de la regió (el nom accessible de la ranura de PageFrame); '' si la secció no en té. */
export const titolDeLHistoric = (seccio, t) => textosDeLHistoric(seccio, t)?.titol ?? '';

/**
 * Pura · Els elements d'una llista del Mur que signa l'actor (àlies), sense
 * el que ja està obert (`exclouId`), de més nou a més vell com al Mur. Cada
 * entrada porta un id textual propi (GraellaTargetes descarta els que no ho
 * són), l'element cru (`item`, el que pinta la targeta canònica) i, per a un
 * acte, el seu model (`esdeveniment`).
 */
export function publicacionsDeLaSeccio(llista, seccio, alies, { exclouId = null, tipusAutor = null } = {}) {
  if (!teHistoric(seccio) || !Array.isArray(llista) || !llista.length) return CAP;
  const exclos = exclouId == null ? null : String(exclouId);
  /* itemsPublicatsDe ja salta els elements sense id i, des del grup E
     (261008), les pàgines de sistema de qui no és l'entitat pilot; data.item
     és l'element cru que porta cada fitxa del MAS.
     P1-11 (pla 261024_2230, T5B-02) · `tipusAutor` ('persona' | 'entitat'),
     per a la fitxa pública d'una altra identitat: només el que signa una
     identitat d'eixe tipus (autorDe; una pàgina del sistema és de l'entitat
     pilot). Un id de persona que coincidira amb el d'una entitat no s'emporta
     les seues publicacions. Sense, com sempre. */
  return itemsPublicatsDe({ [FONT_DEL_MAS[seccio]]: llista }, alies)
    .map((publicacio) => publicacio.data.item)
    .filter((item) => exclos === null || String(item.id) !== exclos)
    .filter((item) => tipusAutor === null || (item.isSystem ? tipusAutor === 'entitat' : autorDe(item)?.tipus === tipusAutor))
    .map((item) => {
      const esdeveniment = item.type === 'event' ? acteAEsdeveniment(item) : null;
      return { item, esdeveniment, moment: momentDeLaTargeta(item, esdeveniment) };
    })
    .sort(perMomentDescendent)
    .map(({ item, esdeveniment }) => ({ id: `${seccio}:${item.id}`, item, esdeveniment }));
}

/* La identitat i la configuració de l'app, o null fora dels seus proveïdors
   (una peça muntada sola: el catàleg, una prova). La forma `return useX()`
   dins d'un try és la que rules-of-hooks accepta (useEntitatDelProjecte.js). */
function useIdentitatSiNHiHa() {
  try {
    return useIdentitat();
  } catch {
    return null;
  }
}

function useEstatDeLApp() {
  try {
    return useUIState();
  } catch {
    return null;
  }
}

/* El mode de dades efectiu. Fora de l'App (cap configuració) o amb una
   configuració invàlida, cap: aliesDeLActor llavors pren el remot, el més
   estret (una persona no hereta mai els àlies de la persona pilot). */
function modeDeDades(config) {
  if (!config) return undefined;
  try {
    return normalizeBackendConfig(config || {}).dataMode;
  } catch {
    return undefined;
  }
}

/**
 * Grup E (261008) · Les pàgines del sistema que el Mur barreja, fetes targeta
 * (targetesDeSistema, la mateixa crida de MurSection i del Calendari) amb el
 * pageCopy del contingut core: { targetes, carregant }.
 *  · `targetes`, memoritzades sobre pageCopy; sense cap pàgina, CAP, la
 *    constant buida i congelada. useCoreContent sense proveïdor torna un
 *    objecte nou a cada crida (amb un pageCopy nou): sense la constant, qui
 *    les barreja amb el Mur refaria les seues llistes a cada pintada.
 *  · `carregant`, cert només mentre el contingut core del proveïdor carrega.
 *    Sense proveïdor (una peça muntada sola, una prova), useCoreContent torna
 *    una reserva sense `refresh` i en 'loading' per sempre: ni pàgines ni
 *    espera, el comportament d'abans.
 */
export function usePaginesDelSistema() {
  const core = useCoreContent();
  const pageCopy = core?.pageCopy;
  const targetes = useMemo(() => {
    const llista = targetesDeSistema(pageCopy);
    return llista.length ? llista : CAP;
  }, [pageCopy]);
  const carregant = typeof core?.refresh === 'function' && core.status === 'loading';
  return { targetes, carregant };
}

/** Grup E (261008) · Les pàgines del sistema fetes targeta (usePaginesDelSistema), o CAP. */
export function useTargetesDeSistema() {
  return usePaginesDelSistema().targetes;
}

/**
 * Si l'actor actiu veu l'històric de `seccio` (potVeureHistoric), amb la
 * identitat de l'App o cap fora del seu proveïdor. La munten els qui decidixen
 * si hi ha peu sense tindre l'actor a mà (PublicacioDetall) i el component, que
 * així no munta la regió per al Foraster.
 */
export function useVeuHistoric(seccio) {
  return potVeureHistoric(useIdentitatSiNHiHa()?.actor ?? null, seccio);
}

/**
 * Les publicacions de l'actor actiu en `seccio`. Torna { elements, estat,
 * error, refresh, ambActor }: l'estat, l'error i el Reintentar són els del Mur
 * (fora de 'ready' les llistes del Mur són buides). Una secció sense històric
 * torna una llista buida i 'ready'. Les llistes es memoritzen sobre les del
 * Mur, els àlies i l'element exclòs: la mateixa entrada, els mateixos objectes.
 * Decisió per defecte del Mestre (261007) · el Foraster no veu cap històric:
 * sense actor, o amb el convidat, `ambActor` és fals i no es calcula res.
 * Grup E (261008) · Al Mur, també les pàgines del sistema (usePaginesDelSistema);
 * amb el Mur llest i el contingut core encara carregant, l'estat és 'loading'
 * (la vista ja pinta la llista que hi haja: només espera si és buida).
 */
export function usePublicacionsDeLActor(seccio, { exclouId = null } = {}) {
  const identitat = useIdentitatSiNHiHa();
  const actor = identitat?.actor ?? null;
  const dataMode = modeDeDades(useEstatDeLApp()?.externalConfig);
  const ambActor = esActorAmbHistoric(actor);
  const alies = useMemo(() => aliesDeLActor(actor, { dataMode }), [actor, dataMode]);
  const font = usePublicacionsDelsAlies(seccio, alies, { exclouId, actiu: ambActor });
  return useMemo(() => ({ ...font, ambActor }), [font, ambActor]);
}

/**
 * P1-11 (pla 261024_2230, T5B-02; reserva de Codex 1945: el DTO de
 * VistaPublicacionsDeLActor) · El cos d'usePublicacionsDeLActor per a
 * qualsevol conjunt d'àlies: el de l'actor actiu o el de la fitxa pública
 * d'una altra identitat (profile/usePublicacionsDeLaFitxa.js). Torna
 * { elements, estat, error, refresh }, la forma que pinta la vista
 * ({ id, item, esdeveniment }, publicacionsDeLaSeccio). `actiu` fals no
 * calcula res; `tipusAutor`, el de publicacionsDeLaSeccio.
 */
export function usePublicacionsDelsAlies(seccio, alies, { exclouId = null, actiu = true, tipusAutor = null } = {}) {
  const mur = useMur();
  const { targetes: sistema, carregant: paginesCarregant } = usePaginesDelSistema();
  const ambHistoric = teHistoric(seccio);
  const delMur = (ambHistoric ? mur?.[LLISTA_DEL_MUR[seccio]] : null) || CAP;
  const estatDelMur = ambHistoric ? (mur?.status ?? 'ready') : 'ready';
  /* Revisió del grup E (troballa 1) · La regla del Bloc (NotesSection ·
     feedDelMas): les pàgines són del Mur i, com les seues publicacions (buides
     fora de 'ready'), només hi entren amb el Mur llest. Si no, amb el core
     llest abans que el Mur, el peu les pintava soles i les publicacions s'hi
     intercalaven en arribar. */
  const ambSistema = seccio === 'mur' && sistema.length > 0 && estatDelMur === 'ready';
  const llista = useMemo(() => (ambSistema ? [...delMur, ...sistema] : delMur), [ambSistema, delMur, sistema]);
  const elements = useMemo(
    () => (ambHistoric && actiu ? publicacionsDeLaSeccio(llista, seccio, alies, { exclouId, tipusAutor }) : CAP),
    [ambHistoric, actiu, llista, seccio, alies, exclouId, tipusAutor]
  );
  const estat = seccio === 'mur' && estatDelMur === 'ready' && paginesCarregant ? 'loading' : estatDelMur;
  const error = ambHistoric ? (mur?.error ?? null) : null;
  const refresh = typeof mur?.refresh === 'function' ? mur.refresh : null;
  return useMemo(() => ({ elements, estat, error, refresh }), [elements, estat, error, refresh]);
}
