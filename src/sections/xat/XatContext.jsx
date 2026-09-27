/**
 * XatContext.jsx — L'estat del xat (F0: Fonament).
 *
 * QUÈ FA I QUÈ NO
 * ───────────────
 *   · La identitat del xat és `getCurrentUser().id` (via SessionContext), no
 *     l'`actorId` d'IdentitatContext: a les rutes /e/:slug/* eixe valor és un
 *     SLUG i marcaria tots els missatges com a 'other'.
 *   · No formata cap hora: `ultimAl` i `creatAl` ixen en ISO i la interfície
 *     els formata amb el `locale` de `useUIState()` (XAT-P11).
 *   · No coneix el mode seed: si no hi ha Supabase, l'adaptador de dades ja
 *     delega a un magatzem local. Ací no queda cap identificador fictici.
 *
 * PER QUÈ AÇÒ MAI TORNA status:'error'
 * ────────────────────────────────────
 * Un mòdul no pot tombar la casa: l'error del xat es queda dins del xat, a
 * `avis`. Amb l'esquema del xat sense aplicar, `loadFils` llança i el Mur, el
 * Mercat i les Notes han de continuar en peu.
 *
 * ENVIAMENT FIABLE (ARQ-A02, ARQ-H02, ARQ-H03)
 * ────────────────────────────────────────────
 * Cada missatge naix amb un UUID generat ací i es pinta `pendent` ABANS de la
 * xarxa (llei L4 de tractor-persistencia). El servidor l'accepta una sola
 * vegada per `id`: un reintent no duplica res. Si l'error és retriable es
 * reintenta sol tres vegades (1 s, 2 s, 4 s més component aleatori); si no, o
 * si s'esgoten, la bombolla passa a `error` i es queda fins que la persona la
 * reintenta o la descarta (XAT-B25). `sendChatMessage` no llança mai.
 *
 * TEMPS REAL I SONDEIG (ARQ-A06, ARQ-F03)
 * ───────────────────────────────────────
 * El canal només avisa («hi ha nous a partir del seq X»); els missatges es
 * demanen sempre a l'adaptador amb `despresDeSeq`. El sondeig és la xarxa de
 * seguretat: la llista cada MS_LLISTA; el fil obert cada MS_FIL sense canal i
 * cada MS_FIL_AMB_CANAL amb canal viu. S'atura amb la pestanya amagada i es
 * desperta en tornar (`visibilitychange`) o en tornar la xarxa (`online`).
 *
 * LECTURA (XAT-C08)
 * ─────────────────
 * Obrir una conversa NO la marca llegida. La interfície crida `marcaVist(filId,
 * seq)` quan una bombolla entra en pantalla amb la pestanya visible; ací
 * s'agrupa (una escriptura cada MS_MARQUES per conversa, mai cap arrere) i els
 * no llegits baixen en local abans que el servidor confirme.
 */
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  loadFils,
  loadMissatges,
  enviaMissatge,
  marcaLlegit,
  creaFilDirecte,
  carregaMembres,
  subscribeToXat,
  unsubscribeFromXat
} from '../../data/backendPort.js';
import { useSession } from '../../app/contexts/SessionContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { getDefaultUserId } from '../../data/appSeed.js';
import { useLocation } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useToast } from '../../components/universal/NotificationContext.jsx';
import {
  LIMIT_PAGINA,
  MAX_REINTENTS,
  actualitzaFilAmbMissatge,
  actualitzaPendent,
  afigPendent,
  aplicaMarcaLocal,
  combinaMissatges,
  creaAgrupadorMarques,
  esperaReintent,
  fusionaPerSeq,
  generaId,
  mapejaFil,
  mapejaMissatge,
  retiraConfirmats,
  retiraPendent,
  seqMaxim,
  seqMinim,
  sumaNoLlegits,
  trobaPendent
} from './missatges.js';

const XatContext = createContext(null);
let hostPromise;
function hostReady(signal) {
  // Compartir la importació en el doble muntatge de StrictMode i el sondeig.
  hostPromise ||= import('../../host.js').catch(error => { hostPromise = null; throw error; });
  return hostPromise.then(host => host.quanLlest({ signal }));
}

/* Sondeig. La llista, lenta; el fil obert, ràpid sense canal i espaiat amb canal. */
const MS_LLISTA = 25000;
const MS_FIL = 5000;
const MS_FIL_AMB_CANAL = 30000;
/* Agrupació de les marques de lectura per conversa. */
const MS_MARQUES = 2000;
/* La ruta del xat, també dins d'un espai /e/:slug/xat. */
const RUTA_XAT = /(^|\/)xat(\/|$)/;

const BUIT = {
  status: 'loading',
  error: null,
  avis: null,
  scopeKey: '',
  chatThreads: [],
  chatMessages: [],
  totalNoLlegits: 0,
  filActiu: null,
  getThreadMessages: () => [],
  hiHaMesAntics: () => false,
  carregantAntics: () => false,
  carregaMesAntics: async () => false,
  sendChatMessage: async () => [],
  reintenta: async () => [],
  descartaFallit: () => {},
  marcaVist: () => {},
  obriFil: () => {},
  creaFil: async () => { throw new Error('El xat encara no ha carregat.'); },
  cercaMembres: async () => [],
  recarrega: async () => false
};

/** Espera `ms` o fins que el senyal s'aborte. Torna `false` si s'ha abortat. */
function espera(ms, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) { resolve(false); return; }
    let temporitzador = null;
    const alAbortar = () => { clearTimeout(temporitzador); resolve(false); };
    temporitzador = setTimeout(() => {
      signal?.removeEventListener('abort', alAbortar);
      resolve(true);
    }, ms);
    signal?.addEventListener('abort', alAbortar, { once: true });
  });
}

/**
 * Avís dins de l'app (XAT-J01). Viu en un component propi perquè els seus
 * ganxos necessiten el router, el proveïdor de notificacions i el d'interfície,
 * que a App.jsx estan per damunt de XatProvider. Només diu qui ha escrit, mai
 * el text, i només quan la persona no és al xat.
 */
function AvisadorXat({ registra }) {
  const { pathname } = useLocation();
  const { showToast } = useToast();
  const { t } = useUIActions();
  useEffect(() => {
    registra((nom) => {
      if (RUTA_XAT.test(String(pathname || ''))) return;
      const plantilla = t('section.xat.avisNouMissatge', 'Missatge nou de {nom}');
      showToast(String(plantilla).replace('{nom}', nom || ''));
    });
    return () => registra(null);
  }, [registra, pathname, showToast, t]);
  return null;
}

/* ─────────────────────────────── Provider ─────────────────────────────── */

export function XatProvider({ children, config }) {
  const { currentUser: usuari, generacio } = useSession();
  const { actorKey } = useIdentitat();
  /* Sense sessió, el xat només existix en mode seed/local (l'adaptador ja escriu
     com a convidat amb el mateix identificador); en remot cal la sessió. Es llig
     de la configuració i no del port, que encara no està segellat al primer render. */
  const modeDades = normalizeBackendConfig(config || {}).dataMode;
  const joId = usuari?.id || (modeDades !== 'remote' ? getDefaultUserId() : null);
  const scopeKey = JSON.stringify([config?.backendId || 'supabase', config?.tenantId,
    joId, actorKey, generacio]);
  const token = useMemo(() => ({ scopeKey, config }), [scopeKey, config]);
  const tokenActual = useRef(token);
  tokenActual.current = token;
  const operacio = useRef(null);
  const [tokenEstat, setTokenEstat] = useState(null);
  const captura = useCallback(() => {
    const op = operacio.current;
    return op?.token === token && !op.controller.signal.aborted ? op : null;
  }, [token]);
  const vigent = useCallback(op => Boolean(op && tokenActual.current === op.token
    && !op.controller.signal.aborted), []);

  const [fils, setFils] = useState([]);
  const filsRef = useRef([]);
  const [estat, setEstat] = useState('loading');
  const [avis, setAvis] = useState(null);
  const [filActiu, setFilActiu] = useState(null);
  /* Missatges confirmats pel servidor, per fil, ordenats per seq. */
  const [missatgesPerFil, setMissatgesPerFil] = useState({});
  const missatgesRef = useRef({});
  /* Bombolles pròpies encara sense seq: pendents i fallides. */
  const [pendentsPerFil, setPendentsPerFil] = useState({});
  const pendentsRef = useRef({});
  /* Paginació cap arrere per fil: { hiHaMes, carregant }. */
  const [paginacio, setPaginacio] = useState({});
  const carregantAnticsRef = useRef(new Set());
  /* Últim seq del qual ja s'ha avisat (o vist) per fil, per a no repetir avisos. */
  const ultimSeqAvisat = useRef({});
  const avisadorRef = useRef(null);
  const enviaMarcaRef = useRef(null);
  const agrupador = useRef(null);
  if (!agrupador.current) {
    agrupador.current = creaAgrupadorMarques((filId, seq) => enviaMarcaRef.current?.(filId, seq), MS_MARQUES);
  }

  const genFils = useRef(0);
  const genMissatges = useRef(0);

  /* Els refs són la font de veritat per als camins asíncrons; l'estat, per al render. */
  const mutaMissatges = useCallback((fn) => {
    const nou = fn(missatgesRef.current);
    missatgesRef.current = nou;
    setMissatgesPerFil(nou);
  }, []);
  const mutaPendents = useCallback((fn) => {
    const nou = fn(pendentsRef.current);
    pendentsRef.current = nou;
    setPendentsPerFil(nou);
  }, []);
  useEffect(() => { filsRef.current = fils; }, [fils]);
  useEffect(() => () => agrupador.current?.cancela(), []);

  const registraAvisador = useCallback((fn) => { avisadorRef.current = fn; }, []);

  /* Avisa una sola vegada per seq nou d'una altra persona (XAT-J01). El primer
     valor d'un fil és la línia base: en arrencar no s'avisa de res. */
  const avisaSiCal = useCallback((filId, seq, autorId, nom) => {
    const s = Number(seq) || 0;
    const previ = ultimSeqAvisat.current[filId];
    if (previ === undefined) { ultimSeqAvisat.current[filId] = s; return; }
    if (s <= previ) return;
    ultimSeqAvisat.current[filId] = s;
    if (autorId && autorId !== joId) avisadorRef.current?.(nom);
  }, [joId]);

  // Purga física després del render. El value oculta l'estat anterior des del
  // primer render, abans que React execute este efecte o les seues neteges.
  useLayoutEffect(() => {
    const op = { token, controller: new AbortController() };
    operacio.current = op;
    setTokenEstat(token);
    setFils([]);
    filsRef.current = [];
    setMissatgesPerFil({});
    missatgesRef.current = {};
    setPendentsPerFil({});
    pendentsRef.current = {};
    setPaginacio({});
    carregantAnticsRef.current.clear();
    ultimSeqAvisat.current = {};
    agrupador.current?.cancela();
    setFilActiu(null);
    setAvis(null);
    setEstat(joId ? 'loading' : 'ready');
    return () => { op.controller.abort(); };
  }, [token, joId]);

  /* ── Llista de fils ── */
  const carregaFils = useCallback(async () => {
    const op = captura();
    if (!vigent(op)) return false;
    const meua = ++genFils.current;
    if (!joId) {
      setFils([]);
      setEstat('ready');
      return false;
    }

    try {
      await hostReady(op.controller.signal);
      if (!vigent(op)) return false;
      const bruts = await loadFils({ ...config, signal: op.controller.signal });
      if (!vigent(op) || meua !== genFils.current) return false;
      const nous = (Array.isArray(bruts) ? bruts : []).map((f) => mapejaFil(f));
      filsRef.current = nous;
      setFils(nous);
      setAvis(null);
      for (const f of nous) avisaSiCal(f.id, f.ultimSeq, f.ultimAutorId, f.name);
      return true;
    } catch (error) {
      if (!vigent(op) || meua !== genFils.current) return false;
      /* No es propaga a `status`. Vegeu la capçalera del fitxer. */
      setAvis(error?.message || 'No s\'han pogut carregar les converses.');
      filsRef.current = [];
      setFils([]);
      return false;
    } finally {
      if (vigent(op) && meua === genFils.current) setEstat('ready');
    }
  }, [joId, config, captura, vigent, avisaSiCal]);

  /* ── Missatges d'un fil: complet la primera vegada, incremental (despresDeSeq) després ── */
  const carregaMissatges = useCallback(async (filId) => {
    const op = captura();
    if (!filId || !joId || !vigent(op)) return false;
    const meua = ++genMissatges.current;
    const desDe = seqMaxim(missatgesRef.current[filId] || []);
    const incremental = desDe != null;

    try {
      await hostReady(op.controller.signal);
      if (!vigent(op)) return false;
      const opcions = { ...config, signal: op.controller.signal };
      if (incremental) opcions.despresDeSeq = desDe;
      const bruts = await loadMissatges(filId, opcions);
      if (!vigent(op) || meua !== genMissatges.current) return false;
      const nous = (Array.isArray(bruts) ? bruts : []).map((m) => mapejaMissatge(m, joId));
      mutaMissatges((previs) => ({
        ...previs,
        [filId]: fusionaPerSeq(incremental ? previs[filId] || [] : [], nous)
      }));
      /* Un pendent que el servidor ja torna amb el seu id és un missatge confirmat. */
      mutaPendents((previs) => retiraConfirmats(previs, filId, nous));
      if (incremental) {
        for (const m of nous) avisaSiCal(filId, m.seq, m.usuariId, m.author);
      } else {
        setPaginacio((previs) => ({ ...previs, [filId]: { hiHaMes: nous.length >= LIMIT_PAGINA, carregant: false } }));
        const max = seqMaxim(nous);
        if (max != null) ultimSeqAvisat.current[filId] = Math.max(ultimSeqAvisat.current[filId] || 0, max);
      }
      return true;
    } catch (error) {
      if (!vigent(op) || meua !== genMissatges.current) return false;
      setAvis(error?.message || 'No s\'han pogut carregar els missatges.');
      return false;
    }
  }, [joId, config, captura, vigent, avisaSiCal, mutaMissatges, mutaPendents]);

  /* ── Historial cap arrere (XAT-A23): abansDeSeq = el seq mínim carregat ── */
  const carregaMesAntics = useCallback(async (filId) => {
    const op = captura();
    if (!filId || !joId || !vigent(op)) return false;
    if (carregantAnticsRef.current.has(filId)) return false;
    const minim = seqMinim(missatgesRef.current[filId] || []);
    if (minim == null) return carregaMissatges(filId);

    carregantAnticsRef.current.add(filId);
    setPaginacio((previs) => ({ ...previs, [filId]: { hiHaMes: previs[filId]?.hiHaMes ?? true, carregant: true } }));
    try {
      await hostReady(op.controller.signal);
      if (!vigent(op)) return false;
      const bruts = await loadMissatges(filId, { ...config, signal: op.controller.signal, abansDeSeq: minim, limit: LIMIT_PAGINA });
      if (!vigent(op)) return false;
      const antics = (Array.isArray(bruts) ? bruts : []).map((m) => mapejaMissatge(m, joId));
      mutaMissatges((previs) => ({ ...previs, [filId]: fusionaPerSeq(previs[filId] || [], antics) }));
      setPaginacio((previs) => ({ ...previs, [filId]: { hiHaMes: antics.length >= LIMIT_PAGINA, carregant: false } }));
      return true;
    } catch (error) {
      if (!vigent(op)) return false;
      setAvis(error?.message || 'No s\'ha pogut carregar l\'historial.');
      setPaginacio((previs) => ({ ...previs, [filId]: { hiHaMes: previs[filId]?.hiHaMes ?? true, carregant: false } }));
      return false;
    } finally {
      carregantAnticsRef.current.delete(filId);
    }
  }, [joId, config, captura, vigent, carregaMissatges, mutaMissatges]);

  /* ── Càrrega inicial. `joId` a la clau: canviar de sessió recarrega. ── */
  useEffect(() => {
    setEstat('loading');
    carregaFils();
  }, [joId, carregaFils]);

  /* ── Obrir un fil: carregar-lo. La lectura la marca la interfície amb marcaVist. ── */
  const obriFil = useCallback((filId) => {
    if (vigent(captura())) setFilActiu(joId ? filId || null : null);
  }, [joId, captura, vigent]);

  useEffect(() => {
    const op = captura();
    if (!filActiu || tokenEstat !== token || !joId || !vigent(op)) return;
    carregaMissatges(filActiu);
  }, [filActiu, carregaMissatges, tokenEstat, token, joId, captura, vigent]);

  /* ── Sondeig de fils i del fil obert, amb el canal de temps real com a avís ── */
  useEffect(() => {
    const op = captura();
    if (!joId || tokenEstat !== token || !vigent(op)) return undefined;
    let viu = true;
    let temporitzador = null;
    let temporitzadorFil = null;
    let debounceVisibilitat = null;
    let subscripcio = null;
    let canalViu = false;
    let versioSub = 0;

    const amagat = () => typeof document !== 'undefined' && document.hidden;

    const desconnecta = () => {
      versioSub += 1;
      canalViu = false;
      if (subscripcio) {
        const antiga = subscripcio;
        subscripcio = null;
        unsubscribeFromXat(antiga);
      }
    };

    const connectaRealtime = () => {
      desconnecta();
      if (!viu || !vigent(op) || !filActiu || amagat()) return;
      const versio = versioSub;
      const alRebre = (error, dades) => {
        if (!viu || !vigent(op) || versio !== versioSub) return;
        if (error) { canalViu = false; return; }
        /* El canal només avisa: els missatges es demanen sempre per seq. */
        if (dades?.tipus === 'nous' && dades.filId === filActiu) carregaMissatges(filActiu);
      };
      let promesa;
      try {
        promesa = Promise.resolve(subscribeToXat(filActiu, alRebre, { ...config, signal: op.controller.signal }));
      } catch (error) {
        promesa = Promise.reject(error);
      }
      promesa.then((res) => {
        const sub = res?.subscription || null;
        if (!sub) return;
        if (viu && vigent(op) && versio === versioSub) {
          subscripcio = sub;
          canalViu = !res.error;
        } else {
          unsubscribeFromXat(sub);
        }
      }).catch(() => { canalViu = false; });
    };

    connectaRealtime();

    const tic = async () => {
      if (!viu || !vigent(op)) return;
      if (temporitzador) clearTimeout(temporitzador);
      let ok = true;
      if (!amagat()) ok = await carregaFils();
      if (viu && vigent(op)) temporitzador = setTimeout(tic, ok ? MS_LLISTA : MS_LLISTA * 10);
    };

    temporitzador = setTimeout(tic, MS_LLISTA);

    const ticFil = async () => {
      if (!viu || !vigent(op) || !filActiu) return;
      if (temporitzadorFil) clearTimeout(temporitzadorFil);
      let ok = true;
      if (!amagat()) ok = await carregaMissatges(filActiu);
      if (viu && vigent(op)) {
        const base = canalViu ? MS_FIL_AMB_CANAL : MS_FIL;
        temporitzadorFil = setTimeout(ticFil, ok === false ? base * 6 : base);
      }
    };

    if (filActiu) temporitzadorFil = setTimeout(ticFil, MS_FIL);

    const desperta = () => {
      if (!viu || !vigent(op)) return;
      if (temporitzador) clearTimeout(temporitzador);
      tic();
      if (filActiu) {
        ticFil();
        connectaRealtime();
      }
    };

    const alCanviarVisibilitat = () => {
      if (debounceVisibilitat) clearTimeout(debounceVisibilitat);
      debounceVisibilitat = setTimeout(() => {
        if (!viu || !vigent(op)) return;
        if (amagat()) desconnecta();
        else desperta();
      }, 300);
    };
    const alTornarXarxa = () => { if (!amagat()) desperta(); };

    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', alCanviarVisibilitat);
    if (typeof window !== 'undefined') window.addEventListener('online', alTornarXarxa);

    return () => {
      viu = false;
      if (temporitzador) clearTimeout(temporitzador);
      if (temporitzadorFil) clearTimeout(temporitzadorFil);
      if (debounceVisibilitat) clearTimeout(debounceVisibilitat);
      desconnecta();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', alCanviarVisibilitat);
      if (typeof window !== 'undefined') window.removeEventListener('online', alTornarXarxa);
    };
  }, [joId, filActiu, carregaFils, carregaMissatges, tokenEstat, token, config, captura, vigent]);

  /* ── Enviament amb reintents: sempre el mateix id (XAT-A25) ── */
  const executaEnviament = useCallback(async (filId, id, cos) => {
    const op = captura();
    if (!vigent(op)) return [];
    for (let intent = 0; ; intent += 1) {
      try {
        const desat = await enviaMissatge(filId, { id, text: cos }, { ...config, signal: op.controller.signal });
        if (!vigent(op)) return [];
        const definitiu = { ...mapejaMissatge(desat, joId), author: 'Jo' };
        mutaPendents((previs) => retiraPendent(previs, id));
        mutaMissatges((previs) => ({ ...previs, [filId]: fusionaPerSeq(previs[filId] || [], [definitiu]) }));
        if (definitiu.seq != null) {
          ultimSeqAvisat.current[filId] = Math.max(ultimSeqAvisat.current[filId] || 0, definitiu.seq);
        }
        setFils((previs) => previs.map((f) => (f.id === filId ? actualitzaFilAmbMissatge(f, definitiu) : f)));
        return [definitiu];
      } catch (error) {
        if (!vigent(op)) return [];
        if (error?.retriable && intent < MAX_REINTENTS) {
          const seguir = await espera(esperaReintent(intent), op.controller.signal);
          if (!seguir || !vigent(op)) return [];
          continue;
        }
        mutaPendents((previs) => actualitzaPendent(previs, id, {
          estatEnviament: 'error',
          error: error?.message || 'No s\'ha enviat.'
        }));
        return [];
      }
    }
  }, [joId, config, captura, vigent, mutaMissatges, mutaPendents]);

  /* ── Enviar: la bombolla es pinta abans de la xarxa (L4). No llança. ── */
  const sendChatMessage = useCallback(async (fil, text) => {
    const op = captura();
    if (!joId || !vigent(op)) return [];
    const filId = fil?.id;
    const cos = String(text ?? '').trim();
    if (!filId || !cos) return [];

    const id = generaId();
    const pendent = {
      id,
      threadId: filId,
      seq: null,
      usuariId: joId,
      text: cos,
      tipus: 'text',
      sender: 'me',
      author: 'Jo',
      is_ai: false,
      creatAl: new Date().toISOString(),
      respostaA: null,
      esborrat: false,
      metadades: {},
      estatEnviament: 'pendent',
      error: null
    };
    mutaPendents((previs) => afigPendent(previs, filId, pendent));
    return executaEnviament(filId, id, cos);
  }, [joId, captura, vigent, mutaPendents, executaEnviament]);

  /* ── Reintent manual d'una bombolla en error, amb el mateix id ── */
  const reintenta = useCallback(async (missatgeId) => {
    if (!joId || !vigent(captura())) return [];
    const trobat = trobaPendent(pendentsRef.current, missatgeId);
    if (!trobat || trobat.missatge.estatEnviament !== 'error') return [];
    mutaPendents((previs) => actualitzaPendent(previs, missatgeId, { estatEnviament: 'pendent', error: null }));
    return executaEnviament(trobat.filId, missatgeId, trobat.missatge.text);
  }, [joId, captura, vigent, mutaPendents, executaEnviament]);

  const descartaFallit = useCallback((missatgeId) => {
    if (!vigent(captura())) return;
    const trobat = trobaPendent(pendentsRef.current, missatgeId);
    if (!trobat || trobat.missatge.estatEnviament !== 'error') return;
    mutaPendents((previs) => retiraPendent(previs, missatgeId));
  }, [captura, vigent, mutaPendents]);

  /* ── Marques de lectura (XAT-C08): local a l'instant, servidor agrupat ── */
  const enviaMarca = useCallback(async (filId, seq) => {
    const op = captura();
    if (!vigent(op)) return;
    try {
      const res = await marcaLlegit(filId, { ...config, signal: op.controller.signal, llegitFinsSeq: seq });
      if (!vigent(op)) return;
      const confirmat = Number(res?.llegitFinsSeq);
      if (Number.isFinite(confirmat) && confirmat > 0) {
        setFils((previs) => previs.map((f) => (f.id === filId ? aplicaMarcaLocal(f, confirmat) : f)));
      }
    } catch (error) {
      if (vigent(op)) setAvis(error?.message || 'No s\'ha pogut marcar com a llegit.');
    }
  }, [config, captura, vigent]);
  enviaMarcaRef.current = enviaMarca;

  const marcaVist = useCallback((filId, seq) => {
    if (!filId || !joId || !vigent(captura())) return;
    const s = Number(seq) || 0;
    if (s <= 0) return;
    const fil = filsRef.current.find((f) => f.id === filId);
    if (fil && s <= (Number(fil.llegitFinsSeq) || 0)) return;
    if (!agrupador.current.marca(filId, s)) return;
    setFils((previs) => previs.map((f) => (f.id === filId ? aplicaMarcaLocal(f, s) : f)));
  }, [joId, captura, vigent]);

  /* ── El padró del poble ──
     NO es guarda a l'estat del context a propòsit: la llista només fa falta
     mentre el selector està obert. L'error puja perquè la interfície el pinte. */
  const cercaMembres = useCallback(
    async (text = null) => {
      const op = captura();
      if (!joId || !vigent(op)) return [];
      try {
        const reals = await carregaMembres(text, { ...config, signal: op.controller.signal });
        return vigent(op) ? reals || [] : [];
      } catch (error) {
        if (!vigent(op)) return [];
        throw error;
      }
    },
    [joId, config, captura, vigent]
  );

  /* ── Obrir conversa amb algú. Idempotent al servidor. ── */
  const creaFil = useCallback(async (altreUsuariId, titol = null) => {
    const op = captura();
    if (!joId || !vigent(op)) return null;
    try {
      const filId = await creaFilDirecte(altreUsuariId, titol, { ...config, signal: op.controller.signal });
      if (!vigent(op)) return null;
      await carregaFils();
      return vigent(op) ? filId : null;
    } catch (error) {
      if (!vigent(op)) return null;
      throw error;
    }
  }, [joId, config, captura, vigent, carregaFils]);

  /* ── Lectures derivades ── */
  const missatgesDerivats = useMemo(() => {
    const ids = new Set([...Object.keys(missatgesPerFil), ...Object.keys(pendentsPerFil)]);
    const resultat = {};
    for (const id of ids) {
      const fil = fils.find((f) => f.id === id);
      resultat[id] = combinaMissatges(missatgesPerFil[id] || [], pendentsPerFil[id] || [], fil?.llegitPelsAltresFinsSeq ?? 0);
    }
    return resultat;
  }, [missatgesPerFil, pendentsPerFil, fils]);

  const visible = tokenEstat === token && Boolean(joId);
  const dins = useCallback(() => visible && vigent(captura()), [visible, captura, vigent]);

  const getThreadMessages = useCallback(
    (filId) => (dins() ? missatgesDerivats[filId] || [] : []),
    [missatgesDerivats, dins]
  );
  const hiHaMesAntics = useCallback(
    (filId) => (dins() ? Boolean(paginacio[filId]?.hiHaMes) : false),
    [paginacio, dins]
  );
  const carregantAntics = useCallback(
    (filId) => (dins() ? Boolean(paginacio[filId]?.carregant) : false),
    [paginacio, dins]
  );
  const totalNoLlegits = useMemo(() => (visible ? sumaNoLlegits(fils) : 0), [visible, fils]);

  const value = useMemo(() => ({
    status: visible ? estat : joId ? 'loading' : 'ready',
    error: null,
    avis: visible ? avis : null,
    scopeKey,
    chatThreads: visible ? fils : [],
    chatMessages: visible && filActiu ? missatgesDerivats[filActiu] || [] : [],
    totalNoLlegits,
    filActiu: visible ? filActiu : null,
    getThreadMessages,
    hiHaMesAntics,
    carregantAntics,
    carregaMesAntics,
    sendChatMessage,
    reintenta,
    descartaFallit,
    marcaVist,
    obriFil,
    creaFil,
    cercaMembres,
    recarrega: carregaFils
  }), [visible, joId, estat, avis, scopeKey, fils, missatgesDerivats, totalNoLlegits, filActiu, getThreadMessages,
    hiHaMesAntics, carregantAntics, carregaMesAntics, sendChatMessage, reintenta, descartaFallit, marcaVist,
    obriFil, creaFil, cercaMembres, carregaFils]);

  return (
    <XatContext.Provider value={value}>
      <AvisadorXat registra={registraAvisador} />
      {children}
    </XatContext.Provider>
  );
}

export function useXat() {
  return useContext(XatContext) || BUIT;
}
