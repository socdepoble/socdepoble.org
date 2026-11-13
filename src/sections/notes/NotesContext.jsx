import { useContext, useState, useMemo, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
/* P1-71 (Gauntlet 261029) · L'objecte de context viu a objectesDeContext.js,
   que no importa res del projecte. */
import { NotesContext } from './objectesDeContext.js';
import { bgSaveManager } from './GlobalSaveManager.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { emojiSol } from '../../utils/emoji.js';
import { useUIState } from '../../app/contexts/UIContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useNotesData } from './NotesDataContext';
import { useMur } from '../mur/MurContext';
import { extractPlainText } from '../../utils/contentAdapter.js';
import { promoteToPublic, teCapacitat, drenaRevocacionsMur } from '../../data/backendPort.js';
import { dataIsoONull } from '../../utils/calendari.js';
import { estatPerAlEditor } from './useEstatDesamentNota.js';
import {
  ErrorPublicacio, ErrorRetirada, bloqueigDeNota, campQuePassaDelLimit, errorDeRetirada, esRebuigDeMida, esRebuigDefinitiuDePublicacio,
  esRebuigDeRetirada, esRebuigDeSeccio, motiuDeMida, motiuDesatPendent, motiuModeLocal,
  motiuPobleNoDeterminat, motiuPublicacioNoFeta, motiuSeccioPublicada, textRetirada
} from './visibilitatNota.js';
import { creaDiariPublicacions } from './actesPublicacio.js';
import { motiuSignaturaDAltri } from './signaturaDAltri.js';
import { useIdentitatOReserva } from '../../app/contexts/useIdentitatOReserva.js';
import { ErrorIdentitatDeLectura } from '../../app/contexts/identitatDeReserva.js';
import { useSession } from '../../app/contexts/SessionContext.jsx';
import { ID_NOTA_BENVINGUDA, actorAmbPobleDeLEntitat, autoriaDeLActor, modeDeDadesResolt } from './autoriaNota.js';
import { llistaDePobles, poblePrincipal, slugDelPoble } from '../pobles/nomsDelPoble.js';
import { pobleDeConfig } from '../xat/pobleAmfitrio.js';
import { esConnexio, esExtern, netejaDrets } from '../../data/origenNota.js';
import { cosDeConnexioEditadaPerAlMur } from './connexions.js';
import { cosDeLExternPerAlMur } from '../connectar/contingutExtern.js';
import { CODI_ENTRADA, CODI_ESQUEMA_ABSENT, CODI_PROMOCIO_PUBLICA, esRebuigDeNormes } from '../../data/errorsBackend.js';
/* P4 (revisió, 261003) · El sanejador del canal viu a netejaCamp.js: la nota
   preparada (notaPreparada.js) en crear-se hi passa pel mateix. */
import { netejaCamp } from './netejaCamp.js';
import { esLlavorDeNota } from './llavorNota.js';
import { getVal, setVal } from '../../config/storage.js';
/* IDEA-61 (T0, prompt 261102_1532) · El contracte pur del Flux Universal de
   Publicació: la fitxa d'àmbit d'una nota es projecta al payload amb ell. */
import { ESTATS, canviaEstat, coaccionaAmbit, esFitxaDAmbit, projeccioPayload, seccioDAmbit } from '../../utils/publicacioUniversal.js';
import { marcaPublicacioEsborrada } from '../../data/publicacionsEsborrades.js';

/* F03-UI · Si la nota té (o ha tingut sense retirar) una publicació al Mur. */
const esNotaPublicada = (note) => Boolean(note?.isPublished || note?.publishedSubmissionId);

function retiraPublicacionsDeLaNota(note) {
  if (!note?.id) return;
  const ids = new Set([String(note.id)]);
  if (note.publishedSubmissionId) ids.add(String(note.publishedSubmissionId));
  for (const id of ids) {
    marcaPublicacioEsborrada('mur', id);
    marcaPublicacioEsborrada('mercat', id);
    marcaPublicacioEsborrada('events', id);
  }
}

/**
 * IDEA-61 (T0, prompt 261102_1532) · La fitxa d'àmbit d'una nota (note.fitxa =
 * { ambit, estat, dades }, un sol objecte), neta pel contracte; null si no és
 * cap fitxa vertical (la nota de sempre, o brossa).
 */
export function fitxaDeNota(valor) {
  return esFitxaDAmbit(valor) ? coaccionaAmbit(valor) : null;
}

/* Correcció L1-A5 (àrbitre, 261102; IDEA-61, T0, prompt 261102_1532) · La capa
   local d'un camp que és un objecte o una llista (la fitxa d'àmbit, les
   categories, les etiquetes) es compara amb el desat per valor: el sanejador
   torna sempre un objecte nou i, per identitat, la capa no s'esborrava mai i
   tapava el que el servidor diguera després (l'estat canviat des d'un altre
   aparell). Un primitiu, com sempre. */
function mateixValor(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/* Correcció L1-A2 (àrbitre, 261102; IDEA-61) · El termini per a vore arribar
   el detall d'una nota resum a la llista (canviaEstatPublicacio): cap botó es
   queda penjat si la llista no es torna a pintar. */
const TEMPS_NOTA_RESOLTA_MS = 4000;

/* T11-03 (marató 261101_2143, D-M1) · En mode 'seed', la n1 retirada amb èxit
   (arxiu, paperera o esborrat) es recorda per àmbit de la cua, amb la clau que
   llig notaTutorial.js (tutorialRetirada). No s'importa d'allà: porta la llavor
   (appSeed → pageContent.js) i el NotesProvider és del paquet d'arrencada
   (paquetDArrencada.test.js). Que les dues claus casen ho fixa la prova del
   NotesProvider de NotesSection.tutorial.test.jsx. */
function recordaRetiradaDeLaN1(note, config, scopeKey) {
  if (String(note?.id) !== ID_NOTA_BENVINGUDA || modeDeDadesResolt(config) !== 'seed') return false;
  return typeof scopeKey === 'string' && scopeKey !== '' && setVal(`notes.tutorialRetirada.${scopeKey}`, true);
}

/* Onada R20 (revisió creuada P1 · poble de destinació fora de la finestra del Mur) ·
   Marcador persistent acotat (mateix contracte que modesTraduccioLocals.js: una sola
   clau versionada amb sostre LRU de 200 entrades a config/storage.js) perquè reobrir
   una nota quan la fila ja no és entre les 50 primeres de feedPosts conserve el poble
   publicat sense mutar l'esquema de la taula notes al servidor ni fer créixer el magatzem. */
const CLAU_DESTINS_PUBLICATS = 'notes.destinsPublicats.v1';
const VERSIO_DESTINS = 1;
const MAXIM_DE_DESTINS = 200;

function clauEntradaDesti(scopeKey, submissionId) {
  const ambit = typeof scopeKey === 'string' ? scopeKey.trim() : '';
  const id = submissionId == null ? '' : String(submissionId).trim();
  return ambit && id ? `${ambit}:${id}` : '';
}

function magatzemDestinsPublicats() {
  const desat = getVal(CLAU_DESTINS_PUBLICATS, null);
  return desat && typeof desat === 'object' && !Array.isArray(desat)
    && desat.v === VERSIO_DESTINS
    && desat.destins && typeof desat.destins === 'object' && !Array.isArray(desat.destins)
    ? desat.destins
    : {};
}

function llegixDestiPublicat(scopeKey, submissionId) {
  const clau = clauEntradaDesti(scopeKey, submissionId);
  if (!clau) return null;
  const destins = magatzemDestinsPublicats();
  const guardat = Object.hasOwn(destins, clau) ? destins[clau] : null;
  if (!guardat || typeof guardat !== 'object' || Array.isArray(guardat)) return null;
  const pobleId = typeof guardat.pobleId === 'string' ? guardat.pobleId.trim() : '';
  if (!pobleId) return null;
  const authorLocation = typeof guardat.authorLocation === 'string' ? guardat.authorLocation.trim() : '';
  return { pobleId, authorLocation };
}

function desaDestiPublicat(scopeKey, submissionId, { pobleId = '', authorLocation = '' } = {}) {
  const clau = clauEntradaDesti(scopeKey, submissionId);
  const idNet = typeof pobleId === 'string' ? pobleId.trim() : '';
  if (!clau || !idNet) return false;
  const locNeta = typeof authorLocation === 'string' ? authorLocation.trim() : '';
  const previ = llegixDestiPublicat(scopeKey, submissionId);
  if (previ && previ.pobleId === idNet && previ.authorLocation === locNeta) return false;
  const destins = { ...magatzemDestinsPublicats() };
  delete destins[clau];
  destins[clau] = { pobleId: idNet, authorLocation: locNeta };
  const claus = Object.keys(destins);
  for (const vella of claus.slice(0, Math.max(0, claus.length - MAXIM_DE_DESTINS))) {
    delete destins[vella];
  }
  return Boolean(setVal(CLAU_DESTINS_PUBLICATS, { v: VERSIO_DESTINS, destins }));
}

// Només una publicació vinculada és reutilitzable. Cada acte nou rep un UUID
// durable del diari, mai el UUID immutable de la nota.
const idDePublicacio = (_scope, note) => note.publishedSubmissionId || null;
/* La UI recorda quines notes tenen una retirada sense ACK. El diari neutral
   conserva la voluntat real, l’acte exacte i el backoff sense sostre LRU. */
const CLAU_RETIRADES_PENDENTS = 'notes.retiradesPendents.v1';
const VERSIO_RETIRADES_PENDENTS = 1;
const MAXIM_DE_RETIRADES_PENDENTS = 200;
/* Gauntlet R22 (notes-03) · La marca porta també l'acte que es retirava
   (`actes`, camp additiu de la mateixa versió: les marques d'abans no en
   tenen). Amb ell, una llista que porta la nota publicada amb un ALTRE acte
   (retirat i republicat en un altre dispositiu) ja no deixa la nota
   bloquejada per sempre. */
const CAP_RETIRADA = new Set();

function magatzemDeRetirades() {
  const desat = getVal(CLAU_RETIRADES_PENDENTS, null);
  return desat && typeof desat === 'object' && !Array.isArray(desat)
    && desat.v === VERSIO_RETIRADES_PENDENTS
    && desat.ids && typeof desat.ids === 'object' && !Array.isArray(desat.ids)
    ? desat
    : null;
}
function magatzemRetiradesPendents() {
  return magatzemDeRetirades()?.ids ?? {};
}
function magatzemActesRetirats() {
  const actes = magatzemDeRetirades()?.actes;
  return actes && typeof actes === 'object' && !Array.isArray(actes) ? actes : {};
}
/** L'acte (UUID de la publicació) que es retirava d'una nota amb la marca, o null (marca d'abans). */
function llegixActeRetirat(scopeKey, noteId) {
  const clau = clauEntradaDesti(scopeKey, noteId);
  const acte = clau ? magatzemActesRetirats()[clau] : null;
  return typeof acte === 'string' && acte ? acte : null;
}

/** Els ids de les notes de l'àmbit amb una retirada pendent (un Set nou). */
function llegixRetiradesPendents(scopeKey) {
  const pendents = new Set();
  for (const [clau, id] of Object.entries(magatzemRetiradesPendents())) {
    if (typeof id === 'string' && id && clau === clauEntradaDesti(scopeKey, id)) pendents.add(id);
  }
  return pendents;
}

function desaRetiradaPendent(scopeKey, noteId, pendent, publicacioId = null) {
  const clau = clauEntradaDesti(scopeKey, noteId);
  if (!clau) return;
  const ids = { ...magatzemRetiradesPendents() };
  const actes = { ...magatzemActesRetirats() };
  if (!pendent && !Object.hasOwn(ids, clau)) return;
  delete ids[clau];
  delete actes[clau];
  if (pendent) {
    ids[clau] = String(noteId);
    if (publicacioId) actes[clau] = String(publicacioId);
    const claus = Object.keys(ids);
    for (const vella of claus.slice(0, Math.max(0, claus.length - MAXIM_DE_RETIRADES_PENDENTS))) { delete ids[vella]; delete actes[vella]; }
  }
  for (const clauActe of Object.keys(actes)) if (!Object.hasOwn(ids, clauActe)) delete actes[clauActe];
  setVal(CLAU_RETIRADES_PENDENTS, { v: VERSIO_RETIRADES_PENDENTS, ids, actes });
}

export function etiquetesDeNota(note, _noteFolders, accions = {}) {
  // La carpeta organitza el bloc; no és una categoria editorial. Els labels
  // explícits de notes antigues són el fallback fins que tinguen categories.
  if (!Array.isArray(note.categories) && Array.isArray(note.labels)) {
    return note.labels.map(label => typeof label === 'string'
      ? { text: label, className: 'sdp-badge-tag' }
      : label);
  }
  return [
    ...(note.categories || []).filter(Boolean).map(cat => ({
      text: cat, className: 'sdp-badge-category',
      onClick: accions.categoria ? () => accions.categoria(cat) : undefined
    })),
    ...(note.tags || []).filter(Boolean).map(etiqueta => ({
      text: etiqueta, className: 'sdp-badge-tag',
      onClick: accions.etiqueta ? () => accions.etiqueta(etiqueta) : undefined
    }))
  ];
}

const EMPTY_OVERRIDE = {};

export function NotesProvider({ children }) {
  const { showToast } = useToast();
  const { locale, externalConfig } = useUIState();
  const { normalizeSearchText, t } = useUIActions();
  const { noteFolders, notes: rawNotes, creaNota, updateNote: updateNoteContext, confirmaPublicacioNota, mouNota: mouNotaContext, esborraNota: esborraNotaContext, status, error, scopeKey, workspaceKey, notesComplete, resolveNote, refresh, config, canCreate, nomesLectura = false } = useNotesData();
  const { sendSectionSubmission, feedPosts, marketItems } = useMur();
  /* Poliment T41/T43 · Qui signa la publicació: l'actor que MurContext envia
     com a author_org_id, també al nom, la foto i el poble del payload. */
  const { actor, memberships } = useIdentitatOReserva();
  const { currentUser } = useSession();
  /* Onada 6 (revisió adversarial) · Una entitat signa des del poble de la
     seua organització (el town_name de la seua fila de pertinença): sense,
     les seues publicacions no arribaven a cap pestanya «Gent de …». */
  const actorQueSigna = useMemo(() => actorAmbPobleDeLEntitat(actor, memberships), [actor, memberships]);
  const autoria = useMemo(() => autoriaDeLActor(actorQueSigna, currentUser), [actorQueSigna, currentUser]);
  /* Grup E (261008) · Les publicacions del Mur que ja hi ha carregades, per a
     la guarda de re-signatura de publishNote. En una referència: el Mur es
     refresca després de cada publicació i publishNote no ha de canviar per
     això (el valor del context es tornaria a fer a cada refresc).
     idea61-02 (Gauntlet T7a, 261104) · I les del Mercat: des d'IDEA-61
     publishNote també hi escriu (seccioDAmbit). Per secció (la de la consulta
     que les ha portades), perquè la guarda de secció (idea61-01) sàpia on viu
     cada fila. Un useMur sense alguna de les llistes (un doble de proves
     d'abans) no en porta cap d'eixa secció. */
  const publicacionsDelMur = useRef({ mur: feedPosts, mercat: marketItems });
  useLayoutEffect(() => { publicacionsDelMur.current = { mur: feedPosts, mercat: marketItems }; }, [feedPosts, marketItems]);
  /* La fila carregada amb eixe id i la secció on viu ({ element, seccio }), o null. */
  const publicacioCarregada = useCallback((id) => {
    const idPublicat = String(id);
    for (const [seccio, llista] of Object.entries(publicacionsDelMur.current || {})) {
      const element = (Array.isArray(llista) ? llista : []).find((fila) => fila && String(fila.id) === idPublicat);
      if (element) return { element, seccio };
    }
    return null;
  }, []);

  const parsedNotesCache = useRef(new Map());

  // F01 / F05 / F07: El desmuntatge no interromp el desat
  // Com que ara utilitzem un gestor global en segon pla (GlobalSaveManager),
  // les operacions continuen encara que el NotesProvider es desmunte.

  // IndexedDB owns persistence; React only holds the immediate editing overlay.
  const [localNoteOverrides, setLocalNoteOverrides] = useState({});
  const [versioDestinsPublicats, setVersioDestinsPublicats] = useState(0);
  const destiPublicatDeNota = useCallback((submissionId) => (
    llegixDestiPublicat(scopeKey, submissionId)
  ), [scopeKey]);
  const desaDestiPublicatNota = useCallback((submissionId, dades) => {
    const canviat = desaDestiPublicat(scopeKey, submissionId, dades);
    if (canviat) setVersioDestinsPublicats((v) => v + 1);
    return canviat;
  }, [scopeKey]);
  const operationRef = useRef(null);
  const operation = useMemo(() => ({ workspaceKey, scopeKey }), [workspaceKey, scopeKey]);
  useLayoutEffect(() => {
    operationRef.current = operation;
    setLocalNoteOverrides({});
    return () => { if (operationRef.current === operation) operationRef.current = null; };
  }, [operation]);
  /* F03-UI · Verificació R21 (P1) · Les notes de l'àmbit amb una retirada del
     Mur pendent (vegeu CLAU_RETIRADES_PENDENTS). L'estat de React mana durant
     la sessió (també si el navegador no deixa desar); el magatzem el porta a
     la recàrrega següent. */
  const [retirades, setRetirades] = useState(() => ({ scopeKey, ids: llegixRetiradesPendents(scopeKey) }));
  if (retirades.scopeKey !== scopeKey) setRetirades({ scopeKey, ids: llegixRetiradesPendents(scopeKey) });
  const retiradesPendents = retirades.scopeKey === scopeKey ? retirades.ids : CAP_RETIRADA;
  const retiradesRef = useRef(retiradesPendents);
  useLayoutEffect(() => { retiradesRef.current = retiradesPendents; }, [retiradesPendents]);
  /* Gauntlet R22 (ronda 3) · Quantes vegades s'ha marcat pendent cada nota en
     esta sessió: una retirada nova (un altre intent a la cua) mentre es
     resol la nota invalida la conclusió (conclouRetiradesSenseCua). */
  const marquesDeRetirada = useRef(new Map());
  const marcaRetiradaPendent = useCallback((noteId, pendent, publicacioId = null) => {
    const id = noteId == null ? '' : String(noteId);
    if (!id) return;
    if (pendent) marquesDeRetirada.current.set(id, (marquesDeRetirada.current.get(id) ?? 0) + 1);
    desaRetiradaPendent(scopeKey, id, pendent, publicacioId);
    if (operationRef.current?.scopeKey !== scopeKey) return;
    setRetirades((previ) => {
      const base = previ.scopeKey === scopeKey ? previ.ids : llegixRetiradesPendents(scopeKey);
      if (base.has(id) === Boolean(pendent)) return previ.scopeKey === scopeKey ? previ : { scopeKey, ids: base };
      const ids = new Set(base);
      if (pendent) ids.add(id); else ids.delete(id);
      return { scopeKey, ids };
    });
  }, [scopeKey]);
  const retiradaPendentDeNota = useCallback((noteId) => (
    noteId != null && retiradesPendents.has(String(noteId))
  ), [retiradesPendents]);
  /* T47b (ordre del Mestre, 260928) · Els desadors de l'operació viva. Una
     crida d'un editor d'abans (la tecla que el debounce de TipTap o el
     desmuntatge lliuren tard) que és del MATEIX actor va ací i no es perd.
     D'un altre actor (scopeKey diferent), mai: el text d'A no es desa amb B. */
  const vigentRef = useRef(null);
  const delMateixActor = useCallback(() => {
    const viva = operationRef.current;
    return Boolean(viva && viva !== operation && viva.scopeKey === operation.scopeKey && vigentRef.current);
  }, [operation]);
  const publishing = useRef(new Map());
  const diariPublicacions = useMemo(() => creaDiariPublicacions(), []);
  // Notes que han eixit del Bloc (paperera, arxiu o esborrat). L'editor encara
  // desa en desmuntar-se i a cada tecla; cap d'eixos desats ha d'arribar a una
  // nota que ja no hi és (tornaria 404 i un avís d'error fals).
  const esborrades = useRef(new Set());

  const clearLocalNoteFields = useCallback((id, savedPayload) => {
    if (!id || operationRef.current !== operation) return;
    setLocalNoteOverrides(prev => {
      const currentOverrides = prev[id];
      if (!currentOverrides) return prev;

      const nextOverrides = { ...currentOverrides };
      let changed = false;
      for (const k of Object.keys(savedPayload)) {
        /* L1-A5 · La fitxa es compara neta (el desat és fitxaDeNota del valor
           de la capa): un '3' escrit i el 3 desat són el mateix canvi. */
        const local = k === 'fitxa' ? fitxaDeNota(nextOverrides[k]) : nextOverrides[k];
        if (k in nextOverrides && mateixValor(local, savedPayload[k])) {
          delete nextOverrides[k];
          changed = true;
        }
      }
      if (!changed) return prev;

      const next = { ...prev, [id]: nextOverrides };



      return next;
    });
  }, [operation]);

  const notes = useMemo(() => {
    // F12: purgar memòria cau per evitar fuita amb notes desaparegudes
    const validIds = new Set(rawNotes.map(n => n.id));
    for (const key of parsedNotesCache.current.keys()) {
      if (!validIds.has(key)) parsedNotesCache.current.delete(key);
    }

    return rawNotes.map((rawNote) => {
      const overrides = localNoteOverrides[rawNote.id] || EMPTY_OVERRIDE;
      const note = { ...rawNote, ...overrides };

      const cache = parsedNotesCache.current.get(rawNote.id);
      if (cache && cache.rawNote === rawNote && cache.overrides === overrides) {
        return cache.parsed;
      }

      const plainText = extractPlainText(note.content || '', Infinity);
      const plainTitle = extractPlainText(note.title || '', Infinity);

      const parsed = {
        ...note,
        plainText,
        coverImage: note.heroImage || undefined,
        searchText: normalizeSearchText(`${plainTitle} ${extractPlainText(note.subtitle || '')} ${extractPlainText(note.lead || '')} ${(note.tags || []).join(' ')} ${plainText}`),
        formattedDate: new Date(note.updatedAt || Date.now()).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' }),
        formattedTime: new Date(note.updatedAt || Date.now()).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
      };

      parsedNotesCache.current.set(rawNote.id, { rawNote, overrides, parsed });
      return parsed;
    });
  }, [locale, normalizeSearchText, rawNotes, localNoteOverrides]);

  const saveNoteField = useCallback((noteId, field, value) => {
    /* D-7 (pla 261101_1246) · Amb la reserva de només lectura, res a la cua
       ni a IndexedDB: el desat no comença. */
    if (nomesLectura) return Promise.resolve(false);
    if (noteId && delMateixActor()) return vigentRef.current.saveNoteField(noteId, field, value);
    if (!noteId || operationRef.current !== operation) return Promise.resolve(false);
    if (esborrades.current.has(noteId)) return Promise.resolve(false);
    /* IDEA-61 · La fitxa d'àmbit és un objecte: la neteja el contracte, no el
       sanejador de text (que en faria «[object Object]»). */
    const netejat = field === 'fitxa' ? fitxaDeNota(value) : netejaCamp(field, value);
    return bgSaveManager.enqueue(
      scopeKey,
      noteId,
      field,
      netejat,
      (id) => rawNotes.find(n => n.id === id),
      updateNoteContext,
      clearLocalNoteFields,
      (msg, type) => showToast(msg, type)
    );
  }, [scopeKey, rawNotes, clearLocalNoteFields, updateNoteContext, operation, showToast, delMateixActor, nomesLectura]);

  const setLocalNoteField = useCallback((id, field, value) => {
    if (nomesLectura) return; // D-7 · cap capa local que semble desada
    if (id && delMateixActor()) {
      vigentRef.current.setLocalNoteField(id, field, value);
      return;
    }
    if (!id || operationRef.current !== operation || esborrades.current.has(id)) return;
    void saveNoteField(id, field, value);
    setLocalNoteOverrides(prev => {
      const currentOverrides = prev[id] || EMPTY_OVERRIDE;
      if (currentOverrides[field] === value) return prev;

      const next = { ...prev, [id]: { ...currentOverrides, [field]: value } };



      return next;
    });
  }, [operation, saveNoteField, delMateixActor, nomesLectura]);

  /* R21.6 · La preparada pot rebre l'ACK de creació després que l'editor haja
     eixit. La seua revisió encara pot no ser a rawNotes: és la creada la que
     inicia la base CAS. Els últims camps entren al MATEIX diari durable abans
     de la xarxa, i el gestor conserva/reprén el lot si el servidor falla. */
  const desaNotaPreparada = useCallback(async (creada, camps) => {
    if (nomesLectura) throw new ErrorIdentitatDeLectura();
    if (delMateixActor()) return vigentRef.current.desaNotaPreparada(creada, camps);
    if (operationRef.current !== operation) throw new DOMException('Operació cancel·lada.', 'AbortError');
    const id = typeof creada?.id === 'string' || typeof creada?.id === 'number' ? String(creada.id) : '';
    if (!id || esborrades.current.has(id)) throw new DOMException('Operació cancel·lada.', 'AbortError');
    if (!Number.isSafeInteger(creada.revision) || creada.revision < 0) throw new Error('La nota creada no porta una revisió vàlida per a conservar l’esborrany.');
    const nets = Object.fromEntries(Object.entries(camps || {}).map(([camp, valor]) => [camp,
      camp === 'fitxa' ? fitxaDeNota(valor) : netejaCamp(camp, valor)]));
    if (!Object.keys(nets).length) return true;
    for (const [camp, valor] of Object.entries(nets)) {
      void bgSaveManager.enqueue(scopeKey, id, camp, valor, () => ({ revision: creada.revision }),
        updateNoteContext, clearLocalNoteFields, (msg, type) => showToast(msg, type));
    }
    setLocalNoteOverrides(prev => ({ ...prev, [id]: { ...prev[id], ...nets } }));
    return bgSaveManager.flush(scopeKey, id);
  }, [nomesLectura, delMateixActor, operation, scopeKey, updateNoteContext, clearLocalNoteFields, showToast]);

  useLayoutEffect(() => {
    vigentRef.current = { saveNoteField, setLocalNoteField, desaNotaPreparada };
  }, [saveNoteField, setLocalNoteField, desaNotaPreparada]);

  /* P0-25 (Onada R6, Bloc 2) · Les guardes de publishNote que miren la
     publicació (signatura aliena i canvi de secció), soles i exposades:
     PublicacioEditable les passa ABANS d'adoptar o de desar una revisió
     editorial, i un rebuig no deixa cap nota lligada. Torna l'ErrorPublicacio
     (amb el toast ja fet) o null. `seccio: false` salta la del canvi de
     secció (una revisió editorial no canvia mai de secció). El comentari de
     cada guarda és a publishNote.
     D-B4-1 (Onada R6, Bloc 4; decisió de MarIA) · La signatura aliena passa
     per la mateixa funció pura que la dels actes (signaturaDAltri.js).
     `esSuperadmin` (el de useSuperadminEstable) només el passa qui fa una
     REVISIÓ editorial, que conserva l'autoria (PublicacioEditable); publishNote
     no el passa mai, perquè el seu upsert signa amb l'actor actiu i
     re-signaria la peça d'altri. */
  const rebuigDePublicacio = useCallback((activeNote, { compartir = false, seccio = true, esSuperadmin = false } = {}) => {
    if (!activeNote) return null;
    if (activeNote.isPublished && activeNote.publishedSubmissionId != null && actor?.id) {
      const publicada = publicacioCarregada(activeNote.publishedSubmissionId)?.element;
      const motiu = motiuSignaturaDAltri(publicada, { actor, config, esSuperadmin, t });
      if (motiu) {
        showToast(motiu, 'info');
        return new ErrorPublicacio(motiu);
      }
    }
    if (!seccio) return null;
    const seccioPrevista = seccioDAmbit((compartir ? null : fitxaDeNota(activeNote.fitxa))?.ambit);
    /* F03-UI · L'id que s'enviarà (idDePublicacio): després d'una retirada, el nou. */
    const seccioDeLaFila = publicacioCarregada(idDePublicacio(scopeKey, activeNote))?.seccio;
    if (seccioDeLaFila && seccioDeLaFila !== seccioPrevista) {
      const motiu = motiuSeccioPublicada(seccioDeLaFila, t);
      showToast(motiu, 'info');
      return new ErrorPublicacio(motiu);
    }
    return null;
  }, [actor, config, publicacioCarregada, showToast, t, scopeKey]);

  /* T5 · `mode: 'compartir'`: la nota és d'altri (origen) i va al mur de la
     persona com a compartida, citant l'origen, mai com a publicació pròpia.
     T47 (ordre del Mestre, 260928) · Torna true (publicada) o false (la xarxa:
     ERROR_PUBLICAR, tornar-ho a provar servix). Quan no ha arribat ni a provar-ho
     (sense servidor, desat previ sense confirmar) rebutja amb ErrorPublicacio i
     el motiu del toast: el selector de visibilitat el diu en línia.
     Integració 261024 (Codex C-02) · El rebuig del servidor per les normes
     (SDP-MOD-428) rebutja amb l'error original i sense toast.
     T71b · Una nota amb origen (connexió o contingut de fora) mai es publica
     com a pròpia: es compartix encara que la crida no ho demane. */
  const publishNote = useCallback((activeNote, { mode = 'publicar', poble = null } = {}) => {
    // D-7 · Ni publicar ni pujar cap imatge pública amb la reserva de només lectura.
    if (nomesLectura) return Promise.reject(new ErrorIdentitatDeLectura());
    const compartir = mode === 'compartir' || esConnexio(activeNote) || esExtern(activeNote);
    if (!activeNote || operationRef.current !== operation) return Promise.resolve(false);
    if (config?.dataMode === 'seed' || config?.dataMode === 'local') {
      // P1-22 · El motiu en la llengua de l'app (visibilitatNota.js, amb `t`).
      const motiu = motiuModeLocal({ connexio: compartir, t });
      showToast(motiu, 'info');
      return Promise.reject(new ErrorPublicacio(motiu));
    }
    /* Grup E de l'Onada 4 (prompt 261008_1201, risc «que estiga clavat el
       comportament») · La guarda de re-signatura. Una nota ja publicada
       s'edita com a esborrany privat, i el Mur només canvia amb «Actualitzar
       al Mur», que fa un upsert amb el mateix id signat per l'actor actiu
       (MurContext). Si la publicació (la del Mur o, idea61-02, la del Mercat
       amb publishedSubmissionId) la signa una altra identitat, no s'envia
       res: el motiu va pel canal de sempre (ErrorPublicacio, que el selector
       diu en línia). Si no és entre
       les carregades (el port en porta una finestra), o no se sap qui la
       signa, o no hi ha actor, com abans.
       Revisió del Gauntlet 261017 (ID6) · Els àlies de l'actor, amb el mode
       RESOLT (modeDeDadesResolt), com el Bloc (NotesSection): mai els de la
       persona pilot per a un compte remot qualsevol. Mentre la guarda de dalt
       continue rebutjant amb el mode cru ('seed' o 'local'), el resolt només
       difereix d'eixe en els casos que ja no arriben ací: el canvi no altera
       cap publicació d'avui, però la guarda no tornarà a obrir el forat el
       dia que la de dalt passe al mode resolt.
       idea61-02 · La del Mur o la del Mercat (publicacioCarregada).
       P0-25 (Bloc 2) · Esta guarda i la de baix viuen a rebuigDePublicacio. */
    /* idea61-01 (Gauntlet T7a, 261104) · Una publicació no canvia mai de
       secció: el trigger sdp_force_author rebutja l'upsert amb un section_id
       nou (SDP-SEC-002) i la fila es queda on era. Si la fila carregada amb
       l'id que s'enviarà (el de l'upsert de baix) viu en una altra secció que
       la de l'àmbit de la fitxa (moure la nota entre el Mur i el Mercat amb
       «On es publica?», la carpeta o ?ambit=), no s'envia res i el motiu diu
       on viu i què es pot fer, pel canal de sempre (ErrorPublicacio). Fora de
       la finestra carregada, el rebuig del servidor (al catch de baix). */
    const rebuig = rebuigDePublicacio(activeNote, { compartir });
    if (rebuig) return Promise.reject(rebuig);
    /* F03-UI · Verificació R21 (P1) · Amb una retirada del Mur pendent, cap
       publicació ni actualització: tornaria a pujar la fila que s'ha de
       retirar i, en pujar la revisió, el reintent ja no casaria. */
    if (retiradesRef.current.has(String(activeNote.id))) {
      const motiu = textRetirada('pendentBloqueja', t);
      showToast(motiu, 'info');
      return Promise.reject(new ErrorPublicacio(motiu));
    }
    const seccioPrevista = seccioDAmbit((compartir ? null : fitxaDeNota(activeNote.fitxa))?.ambit);
    const key = `${workspaceKey}:${activeNote.id}`;
    if (publishing.current.has(key)) return publishing.current.get(key);
    const result = (async () => {
      const pending = await diariPublicacions.llegix(scopeKey, activeNote.id);
      if (operationRef.current !== operation) throw new DOMException('Sessió canviada.', 'AbortError');
      let consultaSenseOperacio = false;
      if (pending?.pending) {
        const receipt = await sendSectionSubmission({ id:pending.actId, noteId:activeNote.id, operationId:pending.operationId,
          expectedNoteRevision:pending.revision, sectionId:seccioPrevista, consulta:true });
        if (operationRef.current !== operation) throw new DOMException('Sessió canviada.', 'AbortError');
        if (receipt?.retirada) {
          await diariPublicacions.retira(scopeKey, activeNote.id);
          refresh?.(); throw new ErrorPublicacio(textRetirada('jaRetirada',t));
        }
        if (receipt) {
          if (receipt.publicacio?.id !== pending.actId || !Number.isSafeInteger(receipt.nota_revision)
              || !Number.isSafeInteger(receipt.publicada_revision) || receipt.publicada_revision < 1 || receipt.publicada_revision > receipt.nota_revision) throw new Error('Rebut de publicació invàlid.');
          const publicadaRevision = receipt.publicada_revision;
          await diariPublicacions.confirma(scopeKey,activeNote.id,pending.operationId);
          if (operationRef.current !== operation) throw new DOMException('Sessió canviada.', 'AbortError');
          await bgSaveManager.confirmRevision(scopeKey,activeNote.id,publicadaRevision);
          await confirmaPublicacioNota(activeNote.id,{revision:receipt.nota_revision,publicadaRevision,isPublished:true,publishedSubmissionId:pending.actId});
          bgSaveManager.marcaPublicada(scopeKey,activeNote.id,publicadaRevision);
          // El replay confirma exactament l’acte anterior. Els canvis nous
          // continuen al Bloc i necessiten una actualització deliberada.
          showToast('Publicació confirmada. Els canvis posteriors es publiquen amb Actualitzar.', 'info');
          return true;
        }
        consultaSenseOperacio = receipt === null;
      }
    // Capture and persist the exact visible document, including editor changes
    // whose own debounce has not fired yet, before entering publication.
    /* Revisió de D4 (260930) · Una connexió no té drets propis que desar: el
       copyright que li pinta l'editor és el de l'original (NotesEditor), i
       desar-lo ací l'escriuria a la nota. */
    /* IDEA-61 · També la fitxa d'àmbit (`fitxa`): sense ella (undefined) no es desa res. */
    for (const field of ['title', 'subtitle', 'lead', 'content', 'heroImage', 'logoImage', 'logoImageDark', 'folderId', 'categories', 'tags', 'copyright', 'icon', 'publishDate', 'fitxa']) {
      if (field === 'copyright' && esConnexio(activeNote)) continue;
      if (activeNote[field] !== undefined) void saveNoteField(activeNote.id, field, activeNote[field]);
    }
    return bgSaveManager.runExclusive(scopeKey, activeNote.id, async () => {
    const assertCurrent = () => {
      if (operationRef.current !== operation) throw new DOMException('Sessió canviada.', 'AbortError');
    };
    assertCurrent();

    const labels = etiquetesDeNota(activeNote, noteFolders)
      .map(({ text, className }) => ({ text, className }));

    try {
      /* La reserva '/assets/…' va al payload tal qual, SENSE resolveAsset: és
         una dada que es desa al servidor i la llegix qualsevol amfitrió. El Mur
         la resol en pintar-la (MurSection); desar-la resolta hi gravaria la
         carpeta del paquet de l'amfitrió on s'ha publicat. */
      let finalHeroImage = netejaCamp('heroImage', activeNote.coverImage) || externalConfig?.fallbackLogoUrl || '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
      /* Ordre E del Mestre (261007, prompt 261007_1628: «no es pot posar el
         logotip damunt de l'H1») · El logotip que la persona puja amb
         «Editar logotip» (logoImage) es desava a la nota i no arribava enlloc:
         ara viatja al Mur com a logo_image i la pàgina publicada el pinta
         damunt de l'H1 (elementDeSeccio.js · logoEntitatDElement). Net pel
         mateix sanejador del canal; sense reserva: sense logotip, cap clau. */
      let finalLogo = netejaCamp('logoImage', activeNote.logoImage);
      let finalLogoDark = netejaCamp('logoImageDark', activeNote.logoImageDark);
      /* D4 (excepció del Mestre, 260930; desfà T54) · Una connexió és una
         còpia editable: ix el cos EDITAT, sense els paràgrafs fixos que el
         sistema li escriu a qui la té, i la presentació de l'original (enllaç
         i autoria) només si el cos ja no l'enllaça (connexions.js). La nota
         desada no es toca: el bucle de dalt només torna a desar el cos que ja
         tenia.
         T71b · Un contingut de fora és de la persona: ix el seu cos, i la
         cita de l'origen només si el cos ja no en porta l'enllaç (una sola
         vegada). Es mira el cos sanejat, el que arriba al Mur. */
      const cosPerAlMur = esConnexio(activeNote) ? cosDeConnexioEditadaPerAlMur(netejaCamp('content', activeNote.content), activeNote.origen)
        : esExtern(activeNote) ? cosDeLExternPerAlMur(netejaCamp('content', activeNote.content), activeNote.origen)
          : activeNote.content;
      /* Gauntlet 261016 (Bloc 3.9; ordre del Mestre: la plantilla de format
         «s'esvaeix al primer clic») · La plantilla verge (la d'ara o la
         d'abans, en qualsevol forma: llavorNota.js) no és contingut de
         ningú: no arriba mai al Mur. Una nota amb títol i la plantilla
         intacta publica el títol amb el cos buit. */
      let finalContent = esLlavorDeNota(cosPerAlMur) ? '' : netejaCamp('content', cosPerAlMur);
      /* D4 · Els drets d'una connexió són els de l'original (origen.drets,
         presos de l'element resolt en connectar), no els de la nota: una
         còpia no canvia la llicència de l'obra d'altri.
         Revisió (260930) · Sense drets a l'origen, cap copyright propi ('' i
         el Mur pinta el seu text de sèrie, com la pàgina de l'original), mai
         el de la nota: triar-hi una llicència relicenciaria l'obra d'altri. */
      const drets = esConnexio(activeNote) ? netejaDrets(activeNote.origen?.drets) : (activeNote.copyright || '');

      if (teCapacitat('mitjans')) {
        if (typeof finalHeroImage === 'string' && finalHeroImage.startsWith('sdp-media://mitjans_privats/')) {
          const publicHero = await promoteToPublic(finalHeroImage, config);
          if (publicHero !== finalHeroImage) {
            finalHeroImage = publicHero;

          }
        }
        /* Ordre E (261007) · El logotip, com la capçalera: el Mur el llig tot
           el poble i un mitjà privat no s'hi veuria. */
        if (finalLogo.startsWith('sdp-media://mitjans_privats/')) {
          finalLogo = (await promoteToPublic(finalLogo, config)) || finalLogo;
        }
        if (finalLogoDark.startsWith('sdp-media://mitjans_privats/')) {
          finalLogoDark = (await promoteToPublic(finalLogoDark, config)) || finalLogoDark;
        }

        const imgRegex = /sdp-media:\/\/mitjans_privats\/[^\s"']+/g;
        const matches = finalContent.match(imgRegex);
        if (matches) {
          // Eliminem duplicats
          const uniqueMatches = [...new Set(matches)];
          for (const match of uniqueMatches) {
            const newUrl = await promoteToPublic(match, config);
            if (newUrl !== match) {
              // Reemplaçar de forma global
              finalContent = finalContent.split(match).join(newUrl);
            }
          }

        }
      }

      /* P1-64 (pla 261028_1526 §3.1.1; Mestre 261028) · L'índex del Mapa
         fotogràfic, derivat de les fotos ja promogudes (sense migració): les
         del cos amb ubicació (els data-* de l'ordre «/» Imatge) i la ubicació
         i la data del hero (el seu EXIF, ja arrodonit a la precisió triada).
         Només d'una publicació pròpia (una connexió o un contingut de fora és
         d'altri), només si la persona ha posat la capçalera (mai la reserva)
         i, si la lectura de l'EXIF del hero falla o tarda més de 4 s
         (TEMPS_HERO_MS), cap clau: publicar no s'atura mai per això. */
      /* P1-20 · D15 (Assalt 10/10, T4a, 261101) · La geo de les fotos i l'EXIF
         que arrossega (uns 19 kB gzip) ja no viatgen al tros d'entrada: es
         demanen ací, només en publicar una nota pròpia. La regla de dalt hi
         val igual: si el tros no baixa (un 404 amb una pestanya d'abans d'un
         desplegament) o no arriba en 4 s (TEMPS_TROS_GEO_MS, una xarxa
         encallada), o si la lectura de l'EXIF del hero tarda més de 4 s
         (TEMPS_HERO_MS, a geoDeLesFotos.js), cap clau i la publicació
         continua. Són dos terminis seguits: publicar pot esperar per la geo
         fins a uns 8 s, mai més. Republicar així una nota amb fotos situades les
         lleva del Mapa fins a la publicació següent: l'índex es deriva del cos,
         que no es toca. */
      const TEMPS_TROS_GEO_MS = 4000;
      let terminiGeo;
      const geo = compartir ? null : await Promise.race([
        import('./geoDeLesFotos.js'),
        new Promise((resolve) => { terminiGeo = setTimeout(resolve, TEMPS_TROS_GEO_MS, null); })
      ]).catch(() => null);
      clearTimeout(terminiGeo);
      const fotosGeo = geo ? geo.fotosGeoDelCos(finalContent) : [];
      const geoHero = geo && netejaCamp('heroImage', activeNote.coverImage)
        ? await geo.geoDelHero(finalHeroImage).catch(() => ({}))
        : {};
      assertCurrent();
      /* R51V-02 i V2-04 · El mode de traducció, la llengua original i les
         traduccions que viatgen al payload (modesTraduccioLocals.js ·
         traduccioDelPayload, validats amb el contracte). Una còpia compartida
         (obra d'altri), cap. El tros es demana ací, no a l'entrada
         (pressupost): el Bloc ja el porta carregat (NotesEditor l'importa).
         Si no baixa, publicar falla pel catch de sempre (ERROR_PUBLICAR):
         mai un payload que perda el mode o les traduccions revisades. */
      const elementPublicat = activeNote.publishedSubmissionId != null
        ? publicacioCarregada(activeNote.publishedSubmissionId)?.element
        : null;
      const traduccio = compartir ? {} : (await import('../../components/universal/traduccio/modesTraduccioLocals.js'))
        .traduccioDelPayload(activeNote, elementPublicat);
      assertCurrent();

      const dataTriada = dataIsoONull(activeNote.publishDate);
      /* Onada 6 · El poble des d'on es publica (vegeu author_location, baix):
         el de qui signa; si no, el poble que declara l'amfitrió (el seu id,
         pobleDeConfig, el mateix que llig el Xat), sense inventar-ne el nom.
         Pla 261018_1605 (Tasca 2, D5; correcció de la revisió) · Una persona
         pot tindre diversos pobles ('A · B', el primer el principal): la clau
         és la del PRINCIPAL (poblePrincipal), perquè 'A · B' fet slug no és
         cap poble i la nota no eixiria a cap pestanya «Gent de …». El lloc
         escrit (author_location) es queda com el diu qui signa, excepte si
         tria explícitament publicar en un dels seus pobles vinculats, i en
         actualitzar sense canviar de poble conserva el ja publicat. */
      /* F03-UI (Onada R21) · Mai l'UUID d'una publicació retirada: després
         d'una retirada, el triat abans del POST (idDePublicacio). */
      /* Gauntlet R22 · L'acte vigent (el de la nota publicada) decidix el poble ja
         publicat; l'intent durable es crea DESPRÉS de les guardes del client: un
         rebuig local (cap poble triat) no deixa cap intent pendent al diari, que
         faria una consulta de més al pròxim intent. */
      const actIdVigent = activeNote.isPublished ? activeNote.publishedSubmissionId : null;
      const destiRecordat = actIdVigent ? llegixDestiPublicat(scopeKey, actIdVigent) : null;
      const pobleIdDeLaNota = typeof activeNote.publishedPobleId === 'string' && activeNote.publishedPobleId.trim()
        ? activeNote.publishedPobleId.trim()
        : (typeof activeNote.poble_id === 'string' && activeNote.poble_id.trim() ? activeNote.poble_id.trim() : '');
      const idPobleJaPublicat = elementPublicat?.poble_id || pobleIdDeLaNota || destiRecordat?.pobleId || '';
      const llocJaPublicat = String(
        elementPublicat?.author_location || activeNote.publishedLocation || destiRecordat?.authorLocation || '',
      ).trim();

      const poblesVinculats = llistaDePobles(autoria?.poble);
      const pobleTriat = typeof poble === 'string' && poblesVinculats.includes(poble.trim())
        ? poble.trim()
        : null;
      if (Boolean(activeNote.isPublished) && poblesVinculats.length > 1 && !pobleTriat && !idPobleJaPublicat) {
        const motiu = motiuPobleNoDeterminat(t);
        showToast(motiu, 'info');
        throw new ErrorPublicacio(motiu);
      }
      const llocPerDefecte = String(autoria?.poble || externalConfig?.appLocation || '').trim();
      const pobleJaPublicat = !pobleTriat && idPobleJaPublicat
        ? poblesVinculats.find((candidat) => slugDelPoble(candidat) === idPobleJaPublicat) || null
        : null;
      const llocDePublicacio = pobleTriat
        || (idPobleJaPublicat ? (llocJaPublicat || pobleJaPublicat || '') : llocPerDefecte);
      const pobleDePublicacio = slugDelPoble(pobleTriat || pobleJaPublicat)
        || (!pobleTriat && idPobleJaPublicat ? idPobleJaPublicat : '')
        || slugDelPoble(poblePrincipal(llocDePublicacio))
        || pobleDeConfig(externalConfig)?.id
        || null;
      /* IDEA-61 (T0, prompt 261102_1532) · La fitxa d'àmbit de la nota: el
         payload de sempre es projecta amb el contracte (ambit, estat i dades
         nets, el type de l'àmbit i, per al mercat, price i tag) i la fila va
         a la secció de l'àmbit ('mercat' o 'mur': cap section_id nou). Una
         connexió o un contingut de fora és d'altri: mai una fitxa pròpia.
         Sense fitxa, el payload és byte a byte el de sempre i la secció,
         'mur' (Llei del Píxel). */
      const titolPublicat = compartir && ['persona','entitat','grup','ia'].includes(activeNote.origen?.objecte) ? 'Perfil compartit' : (netejaCamp('title', activeNote.title) || 'Sense Títol');
      const resumPublicat = netejaCamp('lead', activeNote.lead);
      /* Gauntlet R22 (ronda 3, sql-05) · El servidor rebutja (SDP-MUR-MIDA) un
         títol, una entradilla o un cos que passen del límit; una foto enganxada
         en data: dins del cos ja hi arriba. Es diu ací, abans d'obrir cap intent
         al diari i amb el camp que passa, en lloc d'enviar una publicació que no
         eixirà mai. Es mira el que s'enviaria: el cos ja amb les còpies públiques.
         Gauntlet R22 (ronda 4) · Només per a un acte NOU (sense acte vigent). Una
         actualització la decidix el servidor: mur_limita_mida deixa editar una
         publicació d'abans del límit que ja en passava mentre el camp no cresca,
         i si creix, el rebuig (SDP-MUR-MIDA, 22001) té el mateix motiu
         (esRebuigDeMida i motiuDeMida, davall). */
      const campMassaLlarg = actIdVigent ? null : campQuePassaDelLimit({ titol: titolPublicat, resum: resumPublicat, cos: finalContent });
      if (campMassaLlarg) {
        const motiu = motiuDeMida({ camp: campMassaLlarg, t });
        showToast(motiu, 'error');
        throw new ErrorPublicacio(motiu);
      }
      const currentRevision = bgSaveManager.getExpectedRevision(scopeKey, activeNote.id, activeNote.revision);
      /* Gauntlet R22 (notes-07) · Si la consulta d'ací dalt ha confirmat que el
         servidor no té l'operació pendent, el reintent porta la revisió vigent
         (una edició després de la fallada ja no fa fallar el CAS una vegada). */
      let intent = await diariPublicacions.comenca(scopeKey, activeNote.id, { actId: actIdVigent, revision: currentRevision, noAplicat: consultaSenseOperacio });
      assertCurrent();
      let submissionId = intent.actId;
      const fitxa = compartir ? null : fitxaDeNota(activeNote.fitxa);
      const seccio = seccioDAmbit(fitxa?.ambit);
      const payloadDeSempre = {
        sectionId: seccio,
        type: compartir ? 'compartit' : 'feed',
        ...(compartir && activeNote.origen ? { origen: Object.fromEntries(
          ['tipus','sectionId','itemId','objecte','ruta','url','lloc','titol','drets'].filter(k => activeNote.origen[k] != null)
            .map(k => [k,k === 'titol' && ['persona','entitat','grup','ia'].includes(activeNote.origen.objecte) ? 'Perfil compartit' : activeNote.origen[k]])
        ) } : {}),
        title: titolPublicat,
        subtitle: netejaCamp('subtitle', activeNote.subtitle),
        description: resumPublicat,
        content: finalContent,
        copyright: netejaCamp('copyright', drets),
        image: finalHeroImage,
        labels,
      /* Poliment T41/T43 · el nom, la foto i el poble de l'actor que signa (mai
         un correu). El de l'app només queda de reserva sense actor (incrustat);
         sense poble conegut, el del poble on es publica.
         Onada 6 (decisió 2 de la nit del 261009: «les publicacions noves
         porten poble_id i ja no s'escriu "La Torre de les Maçanes" per
         defecte a les dades») · Sense poble conegut (ni el de qui signa ni
         el de l'amfitrió), cap clau: la targeta continua pintant la seua
         reserva (TargetaDelMur, Llei del Píxel), però la dada ja no diu un
         poble que ningú ha triat. Amb poble, també poble_id (el seu slug,
         nomsDelPoble.js): la clau per la qual la pestanya «Gent de …» de la
         pàgina del poble la troba (pobles/clauDelPoble.js). Com publish_date
         i icon, l'upsert reemplaça el payload: republicar sense poble el
         lleva. */
      author_name: autoria?.nom || externalConfig?.appName || 'Sóc de Poble',
      ...(autoria?.avatar ? { author_avatar: autoria.avatar } : {}),
      ...(llocDePublicacio ? { author_location: llocDePublicacio } : {}),
      ...(pobleDePublicacio ? { poble_id: pobleDePublicacio } : {}),
      /* T40 (ordre del Mestre, 260928) · la data triada al calendari de la
         barra taronja. No programa res: el Mur l'ordena amb esta data. Sense
         data triada no s'envia la clau: l'upsert reemplaça el payload i el Mur
         cau a created_at, que el trigger section_submissions_conserva_creacio
         conserva en republicar. Posar-hi l'hora de publicar tornaria a datar,
         i a pujar dalt de tot, cada «Actualitzar al Mur». */
      ...(dataTriada ? { publish_date: dataTriada } : {}),
      /* T51 (ordre del Mestre, 260928) · l'emoticona triada, perquè el Mur la
         pinte al centre de la caputxa de la targeta. El payload és jsonb
         flexible (section_submissions.payload): cap canvi d'esquema. Com la
         data, sense emoticona no s'envia la clau (l'upsert reemplaça el
         payload: llevar-la i republicar la lleva també del Mur). */
      ...(emojiSol(activeNote.icon) ? { icon: emojiSol(activeNote.icon) } : {}),
      /* Ordre E (261007) · Com l'emoticona: sense logotip no s'envia la clau,
         i llevar-lo i republicar el lleva també de la pàgina publicada. */
      ...(finalLogo ? { logo_image: finalLogo } : {}),
      ...(finalLogoDark ? { logo_image_dark: finalLogoDark } : {}),
      /* P1-64 · Com la data: sense ubicació no s'envia la clau (l'upsert
         reemplaça el payload: llevar-la i republicar la lleva també del Mapa). */
      ...(fotosGeo.length ? { fotos_geo: fotosGeo } : {}),
      ...(geoHero.geolocalitzacio ? { geolocalitzacio: geoHero.geolocalitzacio } : {}),
      ...(geoHero.dataCaptura ? { dataCaptura: geoHero.dataCaptura } : {}),
      /* R51 (P0-46 / IDEA-177; R51V-02) · El mode de traducció i la llengua
         original viatgen al payload (jsonb: cap migració, el camí de la data).
         Els de la nota (NotesEditor els hi posa, validats, des del dispositiu)
         o, si no en porta, els de la fila ja publicada: republicar des d'un
         altre dispositiu, o canviar l'estat d'una fitxa, no els esborra.
         V2-04 · El de la fila passa per normalizeTranslationMode (un mode
         invàlid no es copia), i les traduccions revisades de la fila també
         viatgen: republicar una curated_5_langs no les perd. Una còpia
         compartida (obra d'altri), cap. Els renderers els validen amb el
         contracte (planTraduccioPublicacio.js). */
      ...traduccio
    };
    /* IDEA-61 · Amb fitxa, la projecció del contracte; sense, el de sempre tal qual. */
    const payload = fitxa
      ? projeccioPayload({ ...payloadDeSempre, ambit: fitxa.ambit, estat: fitxa.estat, dades: fitxa.dades })
      : payloadDeSempre;

    assertCurrent();
    const send = () => sendSectionSubmission({ id: submissionId, sectionId: seccio, payload,
      noteId: activeNote.id, expectedNoteRevision: intent.revision, operationId: intent.operationId });
    let receipt;
    try { receipt = await send(); }
    catch(error) {
      if (error?.codi === 'SDP-MUR-REVISION' || /\bSDP-MUR-REVISION\b/.test(String(error?.message || ''))) {
        // L’operació no té rebut i el servidor ha rebutjat el CAS: no ha
        // publicat este intent. Una decisió nova usarà la nota refrescada.
        // Gauntlet R22 (notes-07) · Es diu com un conflicte: mai «es reutilitzarà».
        await diariPublicacions.retira(scopeKey,activeNote.id); refresh?.();
        const motiu = motiuPublicacioNoFeta('conflicte', t);
        if (operationRef.current === operation) showToast(motiu, 'error');
        throw new ErrorPublicacio(motiu);
      }
      if (!esRebuigDeRetirada(error)) throw error;
      if (activeNote.isPublished) { refresh?.(); throw new ErrorPublicacio(textRetirada('jaRetirada',t)); }
      await diariPublicacions.retira(scopeKey,activeNote.id); assertCurrent();
      intent = await diariPublicacions.comenca(scopeKey,activeNote.id,{revision:currentRevision});
      submissionId = intent.actId; receipt = await send();
    }
    assertCurrent();
    if (!Number.isSafeInteger(receipt?.nota_revision) || receipt?.publicacio?.id !== submissionId
        || !Number.isSafeInteger(receipt.publicada_revision) || receipt.publicada_revision < 1 || receipt.publicada_revision > receipt.nota_revision) {
      throw new Error('El servidor no ha confirmat el rebut atòmic de publicació.');
    }
    const changes = { isPublished: true, publishedSubmissionId: submissionId };
    const saved = { ...changes, revision: receipt.nota_revision };
    await diariPublicacions.confirma(scopeKey, activeNote.id, intent.operationId);
    assertCurrent();
    await confirmaPublicacioNota(activeNote.id, { ...saved, publicadaRevision: receipt.publicada_revision });
    assertCurrent();
    if (pobleDePublicacio) desaDestiPublicatNota(submissionId, { pobleId: pobleDePublicacio, authorLocation: llocDePublicacio });
    // D01 · La revisió de la publicació és pròpia: avança també la base persistida
    // de l'esborrany, perquè una recàrrega no la confonga amb un canvi d'altri.
    // La revisió en memòria s'anota en l'acte; si l'escriptura local fallara, la
    // publicació continua feta i, com a molt, una recàrrega demanaria decidir.
    bgSaveManager.confirmRevision(scopeKey, activeNote.id, receipt.publicada_revision).catch(() => {});
    /* Revisió final R16a (carril FA) · El Mur té ara la nota a esta revisió:
       l'editor pot dir «Publicat» fins al pròxim desat (versioAlMur, baix). */
    bgSaveManager.marcaPublicada(scopeKey, activeNote.id, receipt.publicada_revision);
    assertCurrent();
    clearLocalNoteFields(activeNote.id, changes);
    showToast(compartir ? 'Compartit al teu mur, citant l’origen.' : 'Nota publicada correctament al mur!', 'success');
    return true;
  } catch (error) {
    /* Integració 261024 (Codex C-02) · El servidor no troba acceptades les
       normes vigents (SDP-MOD-428): no és cap xarxa ni cap «pendent de
       confirmar». L'error passa tal qual, sense toast: l'editor torna a obrir
       la porta i ho reintenta una vegada (visibilitatNota.js · publicaAmbMotiu). */
    if (operationRef.current === operation && esRebuigDeNormes(error)) throw error;
    /* idea61-01 (Gauntlet T7a, 261104) · El servidor no deixa canviar la
       secció d'una fila (SDP-SEC-002): reintentar-ho no servix mai. La fila
       viu a l'altra secció de publishNote (seccioDAmbit només en torna dues),
       i el motiu ho diu en lloc de «Reintenta-la». */
    /* Gauntlet R22 (notes-05) · És definitiu: l'intent del diari es retira (la RPC
       no ha escrit res) i el pròxim intent no fa cap consulta de més. */
    if (operationRef.current === operation && esRebuigDeSeccio(error)) {
      await diariPublicacions.retira(scopeKey, activeNote.id).catch(() => {});
      const motiu = motiuSeccioPublicada(seccioPrevista === 'mercat' ? 'mur' : 'mercat', t);
      showToast(motiu, 'info');
      throw new ErrorPublicacio(motiu);
    }
    if (error instanceof ErrorPublicacio) throw error;
    /* Gauntlet R22 (sql-02) · La còpia pública d'una imatge no s'ha pogut pujar
       (promoteToPublic rebutja amb CODI_PROMOCIO_PUBLICA, p. ex. SDP-PURGA-004):
       no s'ha enviat res i mai una ref privada al Mur. Encara no s'ha obert cap
       intent nou al diari (la promoció va abans), i no es toca. */
    if (operationRef.current === operation && error?.codi === CODI_PROMOCIO_PUBLICA) {
      const motiu = motiuPublicacioNoFeta('imatge', t);
      showToast(motiu, 'error');
      throw new ErrorPublicacio(motiu);
    }
    /* Gauntlet R22 (ronda 3, sql-05) · El servidor diu que un camp passa del
       límit de mida (SDP-MUR-MIDA, 22001): és definitiu (la transacció s'ha desfet
       i el mateix contingut fallaria sempre). L'intent es retira i el motiu diu
       quin camp; mai «Reintenta-la: es reutilitzarà». */
    if (operationRef.current === operation && esRebuigDeMida(error)) {
      await diariPublicacions.retira(scopeKey, activeNote.id).catch(() => {});
      const motiu = motiuDeMida({ error, t });
      showToast(motiu, 'error');
      throw new ErrorPublicacio(motiu);
    }
    /* Gauntlet R22 (notes-05) · SDP-MUR-OWNER o SDP-MUR-PUBLICACIO: definitius.
       L'intent es retira i el motiu ho diu; mai «Reintenta-la: es reutilitzarà». */
    if (operationRef.current === operation && esRebuigDefinitiuDePublicacio(error)) {
      await diariPublicacions.retira(scopeKey, activeNote.id).catch(() => {});
      const motiu = motiuPublicacioNoFeta('rebutjada', t);
      showToast(motiu, 'error');
      throw new ErrorPublicacio(motiu);
    }
    /* Gauntlet R22 (dades-01) · Sense la publicació atòmica al servidor no s'ha
       publicat res: l'intent es descarta i el motiu ho diu (mai «pendent»). */
    if (operationRef.current === operation && error?.codi === CODI_ESQUEMA_ABSENT) {
      await diariPublicacions.retira(scopeKey, activeNote.id).catch(() => {});
      const motiu = motiuPublicacioNoFeta('servidor', t);
      showToast(motiu, 'error');
      throw new ErrorPublicacio(motiu);
    }
    if (operationRef.current === operation) {
      /* T2 · En mode de proves el port rebutja sense xarxa (code 'mode-local'):
         dir «pendent de confirmar» faria creure que s'ha enviat. */
      showToast(error?.code === CODI_ENTRADA.MODE_LOCAL
        ? error.message
        : 'Publicació pendent de confirmar. Reintenta-la: es reutilitzarà la mateixa publicació.', 'error');
    }
    return false;
  }
    });
    })().catch((error) => {
      // La sessió ha canviat abans d'entrar: l'editor és d'una altra operació.
      if (error?.name === 'AbortError' || operationRef.current !== operation) return false;
      /* Integració 261024 · El rebuig per les normes ve de dins (vegeu dalt): passa tal qual. */
      if (esRebuigDeNormes(error)) throw error;
      /* Gauntlet R22 (notes-05) · La consulta prèvia d'un intent pendent també pot
         tornar un rebuig definitiu: l'intent es retira (sense esperar-ho). */
      if (esRebuigDeSeccio(error)) {
        void diariPublicacions.retira(scopeKey, activeNote.id).catch(() => {});
        const motiu = motiuSeccioPublicada(seccioPrevista === 'mercat' ? 'mur' : 'mercat',t);
        showToast(motiu,'info'); throw new ErrorPublicacio(motiu);
      }
      if (esRebuigDeRetirada(error)) { refresh?.(); throw new ErrorPublicacio(textRetirada('jaRetirada',t)); }
      /* idea61-01 · El motiu de la secció també ve de dins, amb el seu toast fet. */
      if (error instanceof ErrorPublicacio) throw error;
      if (esRebuigDefinitiuDePublicacio(error)) {
        void diariPublicacions.retira(scopeKey, activeNote.id).catch(() => {});
        const motiu = motiuPublicacioNoFeta('rebutjada', t);
        showToast(motiu, 'error');
        throw new ErrorPublicacio(motiu);
      }
      /* Gauntlet R22 (dades-01) · La consulta prèvia contra un servidor sense la publicació atòmica:
         l'intent es descarta (sense esperar-ho) i el motiu ho diu. */
      if (error?.codi === CODI_ESQUEMA_ABSENT) {
        void diariPublicacions.retira(scopeKey, activeNote.id).catch(() => {});
        const motiu = motiuPublicacioNoFeta('servidor', t);
        showToast(motiu, 'error');
        throw new ErrorPublicacio(motiu);
      }
      /* T47 · El desat previ no s'ha confirmat: el motiu és el de la ploma
         (conflicte D01, validació, sense còpia al dispositiu…), no «torna-ho a provar». */
      const motiu = motiuDesatPendent(estatPerAlEditor(bgSaveManager.estat(scopeKey, activeNote.id)).detall, t);
      showToast(motiu, 'error');
      throw new ErrorPublicacio(motiu);
    }).finally(() => publishing.current.delete(key));
    publishing.current.set(key, result);
    return result;
  }, [noteFolders, sendSectionSubmission, saveNoteField, externalConfig, autoria, config, workspaceKey, scopeKey, operation, confirmaPublicacioNota, diariPublicacions, clearLocalNoteFields, showToast, nomesLectura, t, rebuigDePublicacio, publicacioCarregada, desaDestiPublicatNota, refresh]);

  const compartirNota = useCallback(
    (note, opcions) => publishNote(note, { mode: 'compartir', ...(opcions?.poble ? { poble: opcions.poble } : null) }),
    [publishNote]
  );

  /* Revisió final R16a (carril FA) · Si el Mur té la versió d'esta nota que
     el servidor ha confirmat: true, false o null (no se sap). Una nota
     publicada s'edita com a esborrany i el Mur només canvia amb publishNote:
     el verd «Publicat» de l'editor ho demana (GlobalSaveManager · versioAlMur). */
  const versioAlMur = useCallback((nota) => (
    nota?.id == null ? null : bgSaveManager.versioAlMur(scopeKey, nota.id, nota.revision)
  ), [scopeKey]);

  /* IDEA-61 (T0, prompt 261102_1532) · Les notes vives (amb la capa local), en
     una referència: canviaEstatPublicacio no ha de canviar a cada tecla. Qui
     espera la llista següent (esperenLaLlista: notaResolta, amb una nota resum)
     es desperta ací, perquè el detall que resolveNote posa a la llista arriba
     amb un render, mai amb el seu retorn. */
  const notesVives = useRef(notes);
  const esperenLaLlista = useRef([]);
  useLayoutEffect(() => {
    notesVives.current = notes;
    if (!esperenLaLlista.current.length) return;
    const pendents = esperenLaLlista.current;
    esperenLaLlista.current = [];
    for (const desperta of pendents) desperta();
  }, [notes]);
  /* La nota viva (rawNote més la capa local) per id, o null. */
  const notaViva = useCallback((noteId) => (notesVives.current || []).find((n) => n && String(n.id) === String(noteId)) || null, []);

  /* Correcció L1-A2 (àrbitre, 261102; IDEA-61) · Una nota resum (contentLoaded
     false: la llista en remot no porta el cos, ni l'emoticona, la data o la
     fitxa) es resol abans de tocar-la: republicar-la tal qual reescriuria la
     fila del Mur amb el cos buit i sense publish_date ni icon. resolveNote no
     torna el detall: arriba amb la llista següent, que s'espera amb un termini
     (TEMPS_NOTA_RESOLTA_MS). La nota resolta, o null si no s'ha pogut. */
  const notaResolta = useCallback(async (noteId) => {
    let resolucio;
    try {
      resolucio = await resolveNote(noteId);
    } catch {
      return null;
    }
    if (operationRef.current !== operation || resolucio?.status !== 'found') return null;
    let note = notaViva(noteId);
    if (note?.contentLoaded === false) {
      let termini;
      await Promise.race([
        new Promise((desperta) => { esperenLaLlista.current.push(desperta); }),
        new Promise((resolve) => { termini = setTimeout(resolve, TEMPS_NOTA_RESOLTA_MS); })
      ]);
      clearTimeout(termini);
      if (operationRef.current !== operation) return null;
      note = notaViva(noteId);
    }
    return note && note.contentLoaded !== false ? note : null;
  }, [resolveNote, operation, notaViva]);

  /* Retirada de servidor: l’ACK governa l’estat. Qualsevol error encuat
     conserva la voluntat i l’acte exacte; el drenador reprén el mateix acte
     encara que la nota s’edite després. El Bloc no anuncia èxit anticipat. */
  const potRetirarDelMur = Boolean(
    teCapacitat('revocacioPublicacions') && !nomesLectura
      && config?.dataMode !== 'seed' && config?.dataMode !== 'local' && modeDeDadesResolt(config) === 'remote'
  );
  const retirant = useRef(new Map());
  const executaRetirada = useCallback((note) => {
    const key = `${workspaceKey}:${note.id}`;
    if (retirant.current.has(key)) return retirant.current.get(key);
    const result = bgSaveManager.runExclusive(scopeKey, note.id, async () => {
      if (operationRef.current !== operation) throw new DOMException('Sessió canviada.', 'AbortError');
      const changes = { isPublished: false, publishedSubmissionId: null, ...(note.publishedSubmissionId ? { revocaPublicacioId: note.publishedSubmissionId } : {}) };
      const expectedRevision = bgSaveManager.getExpectedRevision(scopeKey, note.id, note.revision);
      let saved;
      try {
        saved = await updateNoteContext(note.id, changes, expectedRevision);
      } catch (error) {
        if (error?.name === 'AbortError') throw error;
        throw errorDeRetirada(error, t);
      }
      if (Number.isSafeInteger(saved?.revision)) bgSaveManager.confirmRevision(scopeKey, note.id, saved.revision).catch(() => {});
      /* Confirmada: l'UUID de la publicació següent es tria ara (cap
         republicació no tornarà a l'UUID retirat), el Mur d'esta pestanya la
         deixa de mostrar sense esperar la recàrrega i ja no és pendent. */
      await diariPublicacions.retira(scopeKey, note.id).catch(() => {});
      retiraPublicacionsDeLaNota(note);
      marcaRetiradaPendent(note.id, false);
      if (operationRef.current === operation) clearLocalNoteFields(note.id, changes);
      return true;
    }).catch((error) => {
      if (error?.name === 'AbortError' || operationRef.current !== operation) return false;
      /* runExclusive rebutja abans d'entrar si el desat previ no es confirma. */
      const motiu = error instanceof ErrorRetirada ? error : new ErrorRetirada(textRetirada('desatPendent', t), 'desat');
      if (motiu.tipus === 'pendent') marcaRetiradaPendent(note.id, true, note.publishedSubmissionId);
      throw motiu;
    }).finally(() => retirant.current.delete(key));
    retirant.current.set(key, result);
    return result;
  }, [operation, t, workspaceKey, scopeKey, updateNoteContext, clearLocalNoteFields, marcaRetiradaPendent, diariPublicacions]);

  const retiraDelMur = useCallback((note) => {
    if (nomesLectura) return Promise.reject(new ErrorIdentitatDeLectura());
    if (!note?.id || operationRef.current !== operation) return Promise.resolve(false);
    if (!potRetirarDelMur) {
      const connexio = esConnexio(note) || esExtern(note);
      return Promise.reject(new ErrorRetirada(bloqueigDeNota({ publicada: true, connexio, t }).motiu, 'sense-capacitat'));
    }
    if (!esNotaPublicada(note)) return Promise.resolve(true);
    return executaRetirada(note).then((fet) => {
      if (fet && operationRef.current === operation) showToast(textRetirada('feta', t), 'success');
      return fet;
    }, (motiu) => {
      if (operationRef.current === operation) showToast(motiu.message, motiu.tipus === 'pendent' ? 'info' : 'error');
      throw motiu;
    });
  }, [nomesLectura, operation, potRetirarDelMur, t, executaRetirada, showToast]);

  /* Gauntlet R22 (ronda 3, notes-03) · La cua ha dit que no queda cap
     retirada pendent ({ pendents: 0 }): per a cada nota amb marca, decidix la
     resposta del servidor que porta ESTA nota (resolveNote, una petició feta
     després del drenatge). Mai una referència nova qualsevol de la llista: amb
     més de 50 notes la recàrrega arriba pàgina a pàgina i les files que encara
     no han arribat conserven l'objecte vell (mergeNotes), i un autodesat o una
     altra resolució també en fan una de nova. Publicada amb el MATEIX acte (o
     amb una marca d'abans, sense acte): la retirada no s'ha fet i no es
     tornarà a provar sola; es diu (pendentFallida) i el panell es desbloqueja.
     Amb un ALTRE acte: d'esta nota ja no queda res pendent. No publicada: la
     llista, que resolveNote ja ha posat al dia, diu «feta» a l'efecte de baix.
     Una retirada nova de la mateixa nota mentrestant (un altre intent a la
     cua) deixa la decisió per a la pròxima vegada. */
  const resolentRetirades = useRef(new Set());
  const conclouRetiradesSenseCua = useCallback(async () => {
    if (typeof resolveNote !== 'function') return;
    for (const id of [...retiradesRef.current]) {
      if (operationRef.current !== operation) return;
      if (resolentRetirades.current.has(id) || retirant.current.has(`${workspaceKey}:${id}`)) continue;
      resolentRetirades.current.add(id);
      try {
        const marca = marquesDeRetirada.current.get(id) ?? 0;
        const acteRetirat = llegixActeRetirat(scopeKey, id);
        const resolucio = await resolveNote(id).catch(() => null);
        const nota = resolucio?.status === 'found' ? resolucio.note : null;
        if (operationRef.current !== operation || !nota?.isPublished || !retiradesRef.current.has(id)
            || retirant.current.has(`${workspaceKey}:${id}`) || (marquesDeRetirada.current.get(id) ?? 0) !== marca) continue;
        const altreActe = Boolean(acteRetirat && nota.publishedSubmissionId
          && String(nota.publishedSubmissionId).toLowerCase() !== acteRetirat.toLowerCase());
        marcaRetiradaPendent(id, false);
        if (!altreActe) showToast(textRetirada('pendentFallida', t), 'error');
      } finally {
        resolentRetirades.current.delete(id);
      }
    }
  }, [resolveNote, operation, workspaceKey, scopeKey, marcaRetiradaPendent, showToast, t]);

  /* Un despertar demana al diari un drenatge; no fabrica una altra retirada.
     Els leases i nextRetryAt persistents són comuns a totes les pestanyes. */
  const reprenRetirades = useCallback(() => {
    if (!potRetirarDelMur || operationRef.current !== operation) return;
    // La cua durable té el retard exponencial i el lease entre pestanyes.
    // La UI mai crea intents nous de xarxa en resposta a un despertar.
    void drenaRevocacionsMur(config).then((resultat) => {
      // Cua buida: cap marca no pot esperar cap reintent més (vegeu dalt).
      if (operationRef.current === operation && resultat?.pendents === 0) void conclouRetiradesSenseCua().catch(() => {});
    }, () => {}).finally(() => {
      if (operationRef.current === operation && typeof refresh === 'function') refresh();
    });
  }, [potRetirarDelMur, operation, config, refresh, conclouRetiradesSenseCua]);
  const reprenRetiradesRef = useRef(reprenRetirades);
  useLayoutEffect(() => { reprenRetiradesRef.current = reprenRetirades; }, [reprenRetirades]);

  /* La llista del servidor diu si una retirada pendent ja s'ha fet (la cua del
     port l'ha drenada, o un altre dispositiu): deixa de ser pendent.
     Gauntlet R22 (notes-03) · Una eixida més, perquè la marca no bloquege la
     nota per sempre: la nota és publicada amb un ALTRE acte que el que es
     retirava (un altre dispositiu l'ha retirat i republicat): d'esta nota ja
     no queda res pendent, i la publicació nova és de la persona. Que la
     retirada NO s'ha fet (pendentFallida) no ho diu mai la llista: ho diu la
     resposta que porta la nota (conclouRetiradesSenseCua, dalt). */
  useEffect(() => {
    if (!retiradesPendents.size || operationRef.current !== operation) return;
    for (const id of retiradesPendents) {
      if (retirant.current.has(`${workspaceKey}:${id}`)) continue;
      const fila = rawNotes.find((n) => n && String(n.id) === id);
      if (!fila) continue;
      const acteRetirat = llegixActeRetirat(scopeKey, id);
      if (!fila.isPublished) {
        void diariPublicacions.retira(scopeKey, id).catch(() => {});
        marcaRetiradaPendent(id, false);
        showToast(textRetirada('feta', t), 'success');
      } else if (acteRetirat && fila.publishedSubmissionId && String(fila.publishedSubmissionId).toLowerCase() !== acteRetirat.toLowerCase()) {
        marcaRetiradaPendent(id, false);
      }
    }
  }, [rawNotes, retiradesPendents, operation, workspaceKey, marcaRetiradaPendent, showToast, t, diariPublicacions, scopeKey]);

  /* Recuperació de primer pla i després de recarregar. El rellotge únic del
     provider respecta el backoff; ací només es refresca l’estat confirmat. */
  const hiHaRetiradesPendents = retiradesPendents.size > 0;
  const llistaLlesta = status === 'ready';
  const represaInicial = useRef(null);
  useEffect(() => {
    /* Una sola vegada per àmbit, quan el Bloc ja és carregat: les pendents
       que hi havia d'abans (una recàrrega). Una que es marca després no es
       reprén a l'instant (el transport acaba de caure): ho farà 'online' o
       el rellotge. */
    if (!potRetirarDelMur || !llistaLlesta || represaInicial.current === scopeKey) return;
    represaInicial.current = scopeKey;
    if (hiHaRetiradesPendents) reprenRetiradesRef.current();
  }, [potRetirarDelMur, hiHaRetiradesPendents, llistaLlesta, scopeKey]);
  useEffect(() => {
    if (!potRetirarDelMur || !hiHaRetiradesPendents || typeof window === 'undefined') return undefined;
    const repren = () => {
      reprenRetiradesRef.current();
    };
    window.addEventListener('online', repren);
    window.addEventListener('focus', repren);
    window.addEventListener('sdp-mur-revocat', refresh);
    return () => {
      window.removeEventListener('online', repren);
      window.removeEventListener('focus', repren);
      window.removeEventListener('sdp-mur-revocat', refresh);
    };
  }, [potRetirarDelMur, hiHaRetiradesPendents, refresh]);

  /* IDEA-61 (T0, prompt 261102_1532) · El canvi d'estat d'una fitxa d'àmbit
     (Disponible / Reservat / Complet / Tancat): actualitza note.fitxa.estat
     amb el contracte (canviaEstat), el desa pel canal de sempre i, si la nota
     és publicada, torna a publicar amb el mateix id i el payload complet
     (l'upsert reemplaça el payload sencer). Torna true si ha canviat; false
     sense fitxa, amb un estat de fora d'ESTATS, sense sessió d'escriptura, amb
     una nota resum que no es pot resoldre (L1-A2) o si la publicació no ha
     eixit, també quan publishNote rebutja (L1-A4: mode local, desat pendent,
     signatura aliena; el toast ja l'ha fet publishNote). Només el rebuig del
     servidor per les normes (SDP-MOD-428) passa tal qual: l'editor el tracta. */
  const canviaEstatPublicacio = useCallback(async (noteId, estat) => {
    if (nomesLectura || !noteId || operationRef.current !== operation) return false;
    if (typeof estat !== 'string' || !ESTATS.includes(estat)) return false;
    let note = notaViva(noteId);
    if (note?.contentLoaded === false) note = await notaResolta(noteId);
    if (!note || operationRef.current !== operation) return false;
    const fitxa = fitxaDeNota(note.fitxa);
    if (!fitxa) return false;
    const nova = canviaEstat(fitxa, estat);
    setLocalNoteField(note.id, 'fitxa', nova);
    if (!note.isPublished) return true;
    return publishNote({ ...note, fitxa: nova }).catch((error) => {
      if (esRebuigDeNormes(error)) throw error;
      return false;
    });
  }, [operation, nomesLectura, setLocalNoteField, publishNote, notaViva, notaResolta]);

  const informaError = useCallback((msg) => showToast(msg?.message || msg || 'Error', 'error'), [showToast]);
  // La roda de CARPETES ja es veu (sdp-app-grid-shell §2), però el gestor de
  // carpetes, categories i etiquetes encara no existix: ho diem a la persona
  // en lloc de deixar un botó mut. Quan hi haja gestor, s'obrirà ací.
  const obriConfiguracioNotes = useCallback(
    () => showToast('La configuració de carpetes, categories i etiquetes encara no està disponible.'),
    [showToast]
  );

  // D01 · Resolució explícita d'un esborrany antic (vegeu applyDraft a NotesDataContext).
  //   · 'remot': es descarta l'esborrany i es torna a llegir la nota del servidor.
  //   · 'meu': la base passa a la revisió remota i els camps es desen damunt.
  const resolConflicteEsborrany = useCallback(async (note, decisio) => {
    if (nomesLectura || !note?.draftConflict || operationRef.current !== operation) return false;
    if (decisio === 'remot') {
      await bgSaveManager.clearDraft(scopeKey, note.id);
      setLocalNoteOverrides(prev => {
        if (!prev[note.id]) return prev;
        const resta = { ...prev };
        delete resta[note.id];
        return resta;
      });
      // Una recàrrega de llistat pot portar només resums, i mergeNotes hi
      // conservaria el cos de l'esborrany descartat: es resol la nota sencera.
      try {
        await resolveNote(note.id);
      } catch {
        refresh();
      }
      return true;
    }
    const camps = await bgSaveManager.rebaseDraft(scopeKey, note.id, note.draftConflict.remoteRevision);
    const desats = await Promise.all(Object.entries(camps).map(([field, value]) => saveNoteField(note.id, field, value)));
    return desats.every(Boolean);
  }, [operation, scopeKey, resolveNote, refresh, saveNoteField, nomesLectura]);

  // Capacitat opcional del backend: sense ella l'editor no pinta «Borrar».
  const potEsborrar = teCapacitat('cicleNotes');

  const oblidaOverlay = useCallback((id) => {
    setLocalNoteOverrides(prev => {
      if (!prev[id]) return prev;
      const resta = { ...prev };
      delete resta[id];
      return resta;
    });
  }, []);

  /* Paperera ('paperera') o arxiu ('arxivada'). runExclusive desa primer el
     que quede pendent: la nota ix del Bloc tal com es veu. La revisió esperada
     es llig DINS del torn, com a publishNote: un desat en curs l'avança i
     llegir-la abans donaria un 409 fals. Només fa eixir notes del Bloc: la
     nota es retira de la llista i els desats posteriors es tallen. Recuperar-la
     ('activa') necessita desfer tot açò i és de la fase de la vista de
     recuperació; ací es refusa sense tocar res. */
  const mouNota = useCallback((note, estat) => {
    if (nomesLectura || !note?.id || operationRef.current !== operation) return Promise.resolve(false);
    if (estat !== 'paperera' && estat !== 'arxivada') return Promise.resolve(false);
    return bgSaveManager.runExclusive(scopeKey, note.id, async () => {
      if (operationRef.current !== operation) throw new DOMException('Sessió canviada.', 'AbortError');
      esborrades.current.add(note.id);
      try {
        await mouNotaContext(note.id, estat, bgSaveManager.getExpectedRevision(scopeKey, note.id, note.revision), ...(note.publishedSubmissionId ? [note.publishedSubmissionId] : []));
      } catch (error) {
        esborrades.current.delete(note.id);
        throw error;
      }
    }).then(async () => {
      /* T11-03 (D-M1) · La n1 retirada en mode 'seed' es recorda per àmbit
         (recordaRetiradaDeLaN1, dalt): abans de cap espera, perquè el Bloc ja
         la trobe en pintar la llista sense la n1. */
      recordaRetiradaDeLaN1(note, config, scopeKey);
      {
        await diariPublicacions.retira(scopeKey, note.id).catch(() => {});
        retiraPublicacionsDeLaNota(note);
        /* El servidor retira tant la paperera com l’arxiu. */
        marcaRetiradaPendent(note.id, false);
      }
      /* T47b (ordre del Mestre, 260928) · retira i no oblida: el que el servidor
         no ha pogut guardar (l'emoticona en quarantena) es queda al dispositiu. */
      await bgSaveManager.retira(scopeKey, note.id).catch(() => {});
      oblidaOverlay(note.id);
      showToast(estat === 'paperera' ? 'Nota a la paperera. Es guardarà 30 dies.' : 'Nota arxivada.', 'success');
      return true;
    }, (error) => {
      /* F03-UI · A la paperera amb el transport caigut, el port ha encuat la
         retirada del Mur (revocacioPendent): la nota continua on estava, i la
         retirada es tornarà a provar. Gauntlet R22 (dades-02) · El port només
         l'encua amb l'acte publicat (config.revocaPublicacioId): només una
         nota publicada té res a retirar, i només d'ella es diu (i es recorda,
         amb l'acte, per a reprendre-la). */
      const ambRetiradaPendent = error?.revocacioPendent === true && esNotaPublicada(note);
      if (ambRetiradaPendent && potRetirarDelMur) marcaRetiradaPendent(note.id, true, note.publishedSubmissionId);
      if (operationRef.current === operation) {
        showToast(ambRetiradaPendent
          ? textRetirada('pendentMoure', t)
          : 'No s’ha pogut moure la nota. Continua on estava.', 'error');
      }
      return false;
    });
  }, [operation, scopeKey, mouNotaContext, oblidaOverlay, showToast, nomesLectura, config, t, marcaRetiradaPendent, potRetirarDelMur, diariPublicacions]);

  /* Esborrat definitiu: no es desa res. La cua pendent es cancel·la abans
     (oblida); si hi havia un desat en curs, el serial l'espera i la revisió es
     llig després. El segon oblida neteja el registre que eixe desat en curs
     haja pogut tornar a escriure en IndexedDB. */
  const esborraNota = useCallback(async (note) => {
    if (nomesLectura || !note?.id || operationRef.current !== operation) return false;
    esborrades.current.add(note.id);
    try {
      await bgSaveManager.oblida(scopeKey, note.id);
      await bgSaveManager.serial(`${scopeKey}:${note.id}`, () => esborraNotaContext(
        note.id, bgSaveManager.getExpectedRevision(scopeKey, note.id, note.revision), ...(note.publishedSubmissionId ? [note.publishedSubmissionId] : [])));
    } catch (error) {
      esborrades.current.delete(note.id);
      /* F03-UI · Com a mouNota: la retirada del Mur pot haver quedat encuada,
         i només es diu (i es recorda) d'una nota publicada. */
      const ambRetiradaPendent = error?.revocacioPendent === true && esNotaPublicada(note);
      if (ambRetiradaPendent && potRetirarDelMur) marcaRetiradaPendent(note.id, true, note.publishedSubmissionId);
      if (operationRef.current === operation) {
        showToast(ambRetiradaPendent
          ? textRetirada('pendentBorrar', t)
          : 'No s’ha pogut borrar la nota. Continua on estava.', 'error');
      }
      return false;
    }
    // T11-03 (D-M1) · Com a mouNota: abans de cap espera.
    recordaRetiradaDeLaN1(note, config, scopeKey);
    await diariPublicacions.retira(scopeKey, note.id).catch(() => {});
    retiraPublicacionsDeLaNota(note);
    marcaRetiradaPendent(note.id, false);
    await bgSaveManager.oblida(scopeKey, note.id).catch(() => {});
    oblidaOverlay(note.id);
    showToast('Nota borrada definitivament.', 'success');
    return true;
  }, [operation, scopeKey, esborraNotaContext, oblidaOverlay, showToast, nomesLectura, config, t, marcaRetiradaPendent, potRetirarDelMur, diariPublicacions]);

  const ctxValue = useMemo(() => ({
    notes,
    noteFolders,
    saveNoteField,
    setLocalNoteField,
    desaNotaPreparada,
    publishNote,
    compartirNota,
    /* Revisió final R16a (carril FA) · si el Mur té la versió de la nota. */
    versioAlMur,
    destiPublicatDeNota,
    desaDestiPublicatNota,
    versioDestinsPublicats,
    /* IDEA-61 · el canvi d'estat d'una fitxa d'àmbit (Disponible / Reservat / Complet / Tancat). */
    canviaEstatPublicacio,
    creaNota,
    updateNote: updateNoteContext,
    status,
    error,
    // T47b · l'àmbit de la cua: NotesEditor el fa servir per a llegir la ploma.
    scopeKey,
    workspaceKey, notesComplete, resolveNote, refresh, config, canCreate,
    /* P4 (ordre del Mestre, 261003) · Si hi ha sessió, de la mateixa font que
       canCreate (useSession). canCreate també depén de la càrrega; esta no:
       el Bloc diu «Connecta…» només quan de veres no n'hi ha (reglaDEntrada). */
    teSessio: Boolean(currentUser?.id),
    /* D-7 · Cert amb la reserva de només lectura (sense IdentitatProvider). */
    nomesLectura,
    /* P0-25 (Bloc 2) · Les guardes de publishNote, per a PublicacioEditable. */
    rebuigDePublicacio,
    informaError,
    obriConfiguracioNotes,
    resolConflicteEsborrany,
    mouNota,
    esborraNota,
    potEsborrar,
    retiraDelMur, potRetirarDelMur, retiradaPendentDeNota,
    t
  }), [
    notes, noteFolders, saveNoteField, setLocalNoteField, desaNotaPreparada,
    publishNote, compartirNota, canviaEstatPublicacio, creaNota, updateNoteContext, status, error, scopeKey, workspaceKey, notesComplete, resolveNote, refresh, config, canCreate, currentUser, informaError, obriConfiguracioNotes, resolConflicteEsborrany,
    mouNota, esborraNota, potEsborrar, retiraDelMur, potRetirarDelMur, retiradaPendentDeNota, t, nomesLectura, rebuigDePublicacio, versioAlMur,
    destiPublicatDeNota, desaDestiPublicatNota, versioDestinsPublicats
  ]);

  return (
    <NotesContext.Provider value={ctxValue}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  return useContext(NotesContext);
}

/* P1-71 · Un valor de notes fix per a un sol editor (PublicacioEditable,
   ImportacioPaginaWpNotes): l'objecte de context només l'importen este .jsx i
   NotesDataContext.jsx, i els altres pinten el proveïdor per ací. */
export function ValorDeNotes({ value, children }) {
  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}
