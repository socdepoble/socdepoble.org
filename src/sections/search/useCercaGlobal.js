/**
 * useCercaGlobal.js — El hook del slice de /cerca (T45).
 *
 * Llig els contextos que ja carreguen dades i en fa un índex únic. L'índex es
 * memoritza per font, mai a cada tecla: cada adaptador només torna a córrer
 * quan canvia el seu array. La cerca sí que es refà per consulta i filtre.
 *
 * El padró del poble és la causa arrel de «no trobe la gent registrada»:
 * /cerca no consultava mai `carregaMembres`. Ara, amb consulta i un filtre
 * que inclou persones o entitats, es demana una vegada per àmbit de dades del
 * xat (`xat.ambitEstable`) i es filtra en local plegant accents. Si torna el
 * límit de la RPC (100 files), també es pregunta al servidor per la consulta.
 * Decisió 1 del Mestre (261007) · Abans la clau era `xat.scopeKey`, que porta
 * `generacio`: cada renovació del JWT (cada hora) tornava a demanar el padró
 * i el grup «Persones» passava per 'loading'. `ambitEstable` (backend, persona
 * i actor, XatContext.jsx) només canvia amb un canvi de persona, actor o
 * backend, i llavors sí que el torna a demanar.
 * La RPC deixa fora qui busca i les entitats que gestiona: les afegim des
 * d'IdentitatContext. Cap correu entra a l'índex.
 *
 * Es crida el padró només quan el xat està llest (el port ja és segellat:
 * abans, `asseguraMetode` llançaria), el contingut base ja no carrega i la
 * sessió ja no es comprova.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useSession } from '../../app/contexts/SessionContext';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { aliesDeLActor } from '../../data/identitatsSeed.js';
import { useMur } from '../mur/MurContext';
import { useMultimedia } from '../multimedia/MultimediaContext';
import { useNotes } from '../notes/NotesContext';
import { useXat } from '../xat/XatContext';
import {
  ambLaIdentitatPropia, cercaEntrades, deActe, deAgent, deConversa, deIdentitat, deMedia, deMembre, deNota,
  dePagina, dePoble, deProducte, dePublicacio, tipusValid
} from './indexCerca.js';

const CAP = Object.freeze([]);
/* p_limit per defecte de membres_del_poble (migració 2609272200). */
export const LIMIT_PADRO = 100;
const MS_PADRO = 250;
const TIPUS_PADRO = new Set(['tot', 'persones', 'entitats']);

const llistaDe = (valor) => (Array.isArray(valor) ? valor : CAP);
/* Un port sense la capacitat, o una prova que simula la sessió sense ella, no fa caure la cerca. */
function teLaCapacitat(teCapacitat, nom) {
  try { return typeof teCapacitat === 'function' && teCapacitat(nom) === true; } catch { return false; }
}
const missatgeDe = (error, perDefecte) => (typeof error === 'string' ? error : error?.message) || perDefecte;

function mapa(llista, adaptador, opcions) {
  const eixida = [];
  for (const element of llistaDe(llista)) {
    const entrada = adaptador(element, opcions);
    if (entrada) eixida.push(entrada);
  }
  return eixida;
}

export function useCercaGlobal({ q = '', tipus = 'tot' } = {}) {
  const { t } = useUIActions();
  const { locale = 'ca-ES', externalConfig } = useUIState();
  const core = useCoreContent();
  const mur = useMur();
  const media = useMultimedia();
  const notes = useNotes() || {};
  const xat = useXat();
  const { identitats = CAP } = useIdentitat();
  const { currentUser, estat: estatSessio, teCapacitat } = useSession();

  /* Només 'fora' és «sense sessió». Mentre la sessió es comprova (arrencada,
     renovació, rol per saber) no s'avisa d'entrar ni es crida el padró, però
     el padró compta com a font que carrega: mai un «Cap resultat» fals. */
  const modeDades = useMemo(() => normalizeBackendConfig(externalConfig || {}).dataMode, [externalConfig]);
  const senseSessio = modeDades === 'remote' && estatSessio === 'fora';
  const sessioPendent = modeDades === 'remote' && estatSessio === 'comprovant';
  const qNet = String(q || '').trim();
  const filtre = tipusValid(tipus);

  const etiquetaIA = t('section.search.ia', 'Intel·ligència artificial');
  const opcions = useMemo(() => ({ locale, etiquetes: { ia: etiquetaIA } }), [locale, etiquetaIA]);
  const nomCompte = t('section.search.elTeuCompte', 'El teu compte');
  const correu = currentUser?.email || null;
  const poble = currentUser?.user_metadata?.town_name || '';
  const opcionsIdentitat = useMemo(() => ({ ...opcions, correu, nomCompte, poble }), [opcions, correu, nomCompte, poble]);

  /* ── El padró: una llista per àmbit del xat, més la consulta al servidor si cal ── */
  const { cercaMembres, ambitEstable: ambitXat = '', status: estatXat } = xat;
  const volPadroBase = Boolean(qNet) && TIPUS_PADRO.has(filtre) && !senseSessio && typeof cercaMembres === 'function';
  const volPadro = volPadroBase && !sessioPendent && estatXat === 'ready' && core.status !== 'loading';
  const errorPadro = t('section.search.errorDesconegut', 'La font no ha dit per què.');

  const [intent, setIntent] = useState(0);
  const clauPadro = `${ambitXat}#${intent}`;
  const [padro, setPadro] = useState({ clau: null, status: 'idle', llista: CAP, error: null });
  const demanat = useRef(null);

  useEffect(() => {
    if (!volPadro || demanat.current === clauPadro) return undefined;
    demanat.current = clauPadro;
    let viu = true;
    let acabat = false;
    setPadro({ clau: clauPadro, status: 'loading', llista: CAP, error: null });
    Promise.resolve()
      .then(() => cercaMembres(null))
      .then((llista) => {
        acabat = true;
        if (viu) setPadro({ clau: clauPadro, status: 'ready', llista: llistaDe(llista), error: null });
      })
      .catch((error) => {
        acabat = true;
        if (viu) setPadro({ clau: clauPadro, status: 'error', llista: CAP, error: missatgeDe(error, errorPadro) });
      });
    /* Una petició tallada abans d'acabar es tornarà a fer quan torne a caldre. */
    return () => { viu = false; if (!acabat) demanat.current = null; };
  }, [volPadro, clauPadro, cercaMembres, errorPadro]);

  const padroActual = padro.clau === clauPadro ? padro : null;
  const llistaPadro = padroActual?.status === 'ready' ? padroActual.llista : CAP;
  const volServidor = volPadro && padroActual?.status === 'ready' && llistaPadro.length >= LIMIT_PADRO;
  const clauServidor = `${clauPadro}|${qNet}`;
  const [servidor, setServidor] = useState({ clau: null, status: 'idle', llista: CAP, error: null });

  useEffect(() => {
    if (!volServidor) return undefined;
    let viu = true;
    const temporitzador = setTimeout(() => {
      setServidor({ clau: clauServidor, status: 'loading', llista: CAP, error: null });
      Promise.resolve()
        .then(() => cercaMembres(qNet))
        .then((llista) => { if (viu) setServidor({ clau: clauServidor, status: 'ready', llista: llistaDe(llista), error: null }); })
        .catch((error) => { if (viu) setServidor({ clau: clauServidor, status: 'error', llista: CAP, error: missatgeDe(error, errorPadro) }); });
    }, MS_PADRO);
    return () => { viu = false; clearTimeout(temporitzador); };
  }, [volServidor, clauServidor, qNet, cercaMembres, errorPadro]);

  const servidorActual = servidor.clau === clauServidor ? servidor : null;
  const llistaServidor = servidorActual?.status === 'ready' ? servidorActual.llista : CAP;

  let estatPadro = 'idle';
  let missatgePadro = null;
  if (volPadroBase) {
    if (padroActual?.status === 'error') { estatPadro = 'error'; missatgePadro = padroActual.error; }
    else if (servidorActual?.status === 'error') { estatPadro = 'error'; missatgePadro = servidorActual.error; }
    else if (padroActual?.status !== 'ready' || (volServidor && servidorActual?.status !== 'ready')) estatPadro = 'loading';
    else estatPadro = 'ready';
  }

  const reintentaPadro = useCallback(() => { setIntent((valor) => valor + 1); }, []);

  /* ── L'índex, font per font ── */
  const deIdentitats = useMemo(() => mapa(identitats, deIdentitat, opcionsIdentitat), [identitats, opcionsIdentitat]);
  /* Poliment T45 · Seed i local saben obrir la fitxa d'una altra persona.
     Ordre del Mestre (261002) · En remot també, quan el port té la capacitat
     'directori' (loadPerfilPublic, que crida la RPC perfil_public): la persona
     del padró ix al cercador amb la seua fitxa. Sense la capacitat, el títol
     no hi enllaça i l'acció és «Escriu-li», com abans. L'adaptador de Supabase
     la declara sempre: la migració 2610021520 va ABANS de publicar el client. */
  const directori = teLaCapacitat(teCapacitat, 'directori');
  const opcionsPadro = useMemo(() => ({ ...opcions, fitxesDePersones: modeDades !== 'remote' || directori }),
    [opcions, modeDades, directori]);
  const dePadro = useMemo(() => mapa([...llistaPadro, ...llistaServidor], deMembre, opcionsPadro), [llistaPadro, llistaServidor, opcionsPadro]);
  const deAgents = useMemo(() => mapa(core.agents, deAgent, opcions), [core.agents, opcions]);
  const dePobles = useMemo(() => mapa(core.towns, dePoble, opcions), [core.towns, opcions]);
  const dePagines = useMemo(() => mapa(core.pages, dePagina, opcions), [core.pages, opcions]);
  const dePublicacions = useMemo(() => mapa(mur.feedPosts, dePublicacio, opcions), [mur.feedPosts, opcions]);
  const deActes = useMemo(() => mapa(mur.events, deActe, opcions), [mur.events, opcions]);
  const deProductes = useMemo(() => mapa(mur.marketItems, deProducte, opcions), [mur.marketItems, opcions]);
  const deMedies = useMemo(() => mapa(media.mediaItems, deMedia, opcions), [media.mediaItems, opcions]);
  const deNotes = useMemo(() => mapa(notes.notes, deNota, opcions), [notes.notes, opcions]);
  const deConverses = useMemo(() => mapa(xat.chatThreads, deConversa, opcions), [xat.chatThreads, opcions]);

  /* Gauntlet 261016 (Bloc 3.5.1) · Els àlies declarats de la persona de la
     sessió (aliesDeLActor, la regla del MAS): en llavor, els de la persona
     pilot; en remot, només el seu id. Amb ells, la seua fitxa del padró i del
     catàleg es fusiona amb la pròpia (ambLaIdentitatPropia), mai pel nom. */
  const aliesPropis = useMemo(() => {
    const persona = llistaDe(identitats).find((identitat) => identitat?.tipus === 'persona');
    return persona ? [...aliesDeLActor(persona, { dataMode: modeDades })] : CAP;
  }, [identitats, modeDades]);

  /* L'ordre decidix qui es pinta en una clau repetida (el text de totes compta,
     vegeu fusionaPerClau): la identitat pròpia primer, el padró abans del catàleg. */
  const index = useMemo(() => ambLaIdentitatPropia([
    ...deIdentitats, ...dePadro, ...deAgents, ...dePobles, ...dePublicacions, ...deActes,
    ...deProductes, ...deMedies, ...deNotes, ...deConverses, ...dePagines
  ], aliesPropis), [deIdentitats, dePadro, deAgents, dePobles, dePublicacions, deActes, deProductes, deMedies, deNotes,
    deConverses, dePagines, aliesPropis]);

  const resultats = useMemo(() => cercaEntrades(index, qNet, filtre), [index, qNet, filtre]);

  /* ── Les fonts, per a dir quina carrega i quina ha fallat ── */
  const fonts = useMemo(() => {
    const font = (id, etiqueta, status, error, reintenta, tipusFont) => ({
      id,
      etiqueta,
      status: status || 'ready',
      error: status === 'error' ? missatgeDe(error, errorPadro) : null,
      reintenta: typeof reintenta === 'function' ? reintenta : null,
      tipus: tipusFont
    });
    return [
      font('contingut', t('section.search.font.contingut', 'el catàleg de persones i pobles'), core.status, core.error, core.refresh,
        ['persones', 'entitats', 'pobles', 'pagines']),
      font('mur', t('section.search.font.mur', "el Mur, l'agenda i el mercat"), mur.status, mur.error, mur.refresh,
        ['publicacions', 'agenda', 'mercat']),
      font('multimedia', t('section.search.font.multimedia', 'la multimèdia'), media.status, media.error, media.refresh, ['multimedia']),
      font('notes', t('section.search.font.notes', 'les teues notes'), notes.status, notes.error, notes.refresh, ['notes']),
      font('converses', t('section.search.font.converses', 'les teues converses'), xat.status, null, xat.recarrega, ['converses']),
      font('padro', t('section.search.font.padro', 'el padró del poble'), estatPadro, missatgePadro, reintentaPadro, ['persones', 'entitats'])
    ];
  }, [t, errorPadro, core.status, core.error, core.refresh, mur.status, mur.error, mur.refresh, media.status, media.error,
    media.refresh, notes.status, notes.error, notes.refresh, xat.status, xat.recarrega, estatPadro, missatgePadro, reintentaPadro]);

  const rellevant = (font) => filtre === 'tot' || font.tipus.includes(filtre);
  const carregant = Boolean(qNet) && fonts.some((font) => font.status === 'loading' && rellevant(font));
  const errors = qNet ? fonts.filter((font) => font.status === 'error' && rellevant(font)) : CAP;

  return { resultats, fonts, errors, carregant, senseSessio };
}
