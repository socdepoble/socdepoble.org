/**
 * XatContext.jsx — Fase 4. L'estat del xat contra el backend real.
 *
 * QUÈ HA DESAPAREGUT I PER QUÈ
 * ────────────────────────────
 *   · `loadXat(actorId, config)` → `loadFils` + `loadMissatges` per fil. Abans
 *     es demanaven 500 missatges de tot el poble en cada arrencada.
 *   · `appendChatMessages` → `enviaMissatge`.
 *   · L'`actorId` d'IdentitatContext ja NO és la identitat del xat. A les rutes
 *     /e/:slug/* eixe valor és un SLUG, no un uuid: comparar-lo amb `usuari_id`
 *     marcava TOTS els missatges com a 'other', inclosos els teus.
 *     La identitat del xat és `getCurrentUser().id` i prou.
 *
 * PER QUÈ AÇÒ MAI TORNA status:'error'
 * ────────────────────────────────────
 * AppDataLoader (App.jsx) pinta <LoadError/> per a tot el portal si
 * `xat.status === 'error'`. Amb l'esquema del xat sense aplicar, `loadFils`
 * llança i el Mur, el Mercat i les Notes cauen amb ell. Un mòdul no pot tombar
 * la casa: l'error del xat es queda dins del xat, a `avis`.
 *
 * REALTIME
 * ────────
 * No n'hi ha. Les taules del xat no estan a la publicació `supabase_realtime`,
 * així que una subscripció no donaria error i no rebria res mai. Ací hi ha
 * sondeig adaptatiu: s'atura amb la pestanya amagada i es desperta en tornar.
 * És el que aguanta una connexió de muntanya sense cremar bateria.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  loadFils,
  loadMissatges,
  enviaMissatge,
  marcaLlegit,
  creaFilDirecte,
  carregaMembres,
  getCurrentUser,
  subscribeToXat,
  unsubscribeFromXat
} from '../../data/backendPort.js';

const XatContext = createContext(null);

/* Sondeig. El fil obert va per WebSocket (Realtime); la llista, lenta. */
const MS_LLISTA = 25000;
const LOCALE = 'ca-ES';

const BUIT = {
  status: 'loading',
  error: null,
  avis: null,
  chatThreads: [],
  chatMessages: [],
  filActiu: null,
  getThreadMessages: () => [],
  sendChatMessage: async () => {},
  obriFil: () => {},
  creaFil: async () => { throw new Error('El xat encara no ha carregat.'); },
  cercaMembres: async () => [],
  recarrega: () => {}
};

/* ─────────────────────────── Etiquetes d'hora ─────────────────────────── */

const DIA_MS = 86400000;

function inici(data) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "14:32" · "Ahir" · "dimarts" · "04/09/26" — el que pinta la barra lateral. */
function etiquetaLlista(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dies = Math.round((inici(Date.now()) - inici(d)) / DIA_MS);
  if (dies <= 0) return d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
  if (dies === 1) return 'Ahir';
  if (dies < 7) return d.toLocaleDateString(LOCALE, { weekday: 'long' });
  return d.toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/** "14:32" hui; "04/09 · 14:32" abans. Va davall de cada bombolla. */
function etiquetaBombolla(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hora = d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
  if (inici(d) === inici(Date.now())) return hora;
  return `${d.toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit' })} · ${hora}`;
}

/* ─────────────────────────────── Mapeig ─────────────────────────────── */

/**
 * Del fil del backend a l'objecte que ja llig XatSection.
 * `name`, `lastMessagePreview` i `lastMessageTime` són els noms que la barra
 * lateral esperava des del primer dia i mai rebia.
 */
function mapejaFil(fil) {
  const nom = fil.titol
    || (fil.altresNoms.length ? fil.altresNoms.join(', ') : 'Conversa');
  return {
    id: fil.id,
    title: nom,
    name: nom,
    type: 'directe',
    avatar_url: null,
    lastMessagePreview: fil.ultimText || 'Cap missatge.',
    lastMessageTime: etiquetaLlista(fil.ultimAl || fil.actualitzatAl),
    noLlegits: fil.noLlegits,
    createdAtTs: fil.actualitzatAl ? new Date(fil.actualitzatAl).getTime() : 0
  };
}

/** Del missatge del backend a la bombolla. `joId` decidix el costat. */
function mapejaMissatge(m, joId) {
  const meu = m.usuariId === joId;
  return {
    id: m.id,
    threadId: m.filId,
    usuariId: m.usuariId,
    text: m.text,
    sender: meu ? 'me' : 'other',
    author: meu ? 'Jo' : (m.autorNom || 'Veí'),
    is_ai: Boolean(m.esIA),
    creatAl: m.creatAl,
    createdAtTs: m.creatAl ? new Date(m.creatAl).getTime() : 0,
    time_label: etiquetaBombolla(m.creatAl),
    estatEnviament: 'enviat'
  };
}

/* ─────────────────────────────── Provider ─────────────────────────────── */

export function XatProvider({ children, config }) {
  /* `config` viu a una ref perquè els efectes depenguen només de primitives.
     Si va a l'array de dependències i el pare el recrea, el sondeig es reinicia
     en cada render. */
  const configRef = useRef(config);
  configRef.current = config;

  const usuari = getCurrentUser();
  const joId = usuari?.id || null;

  const [fils, setFils] = useState([]);
  const [estat, setEstat] = useState('loading');
  const [avis, setAvis] = useState(null);
  const [filActiu, setFilActiu] = useState(null);
  const [missatgesPerFil, setMissatgesPerFil] = useState({});

  const genFils = useRef(0);
  const genMissatges = useRef(0);

  /* ── Llista de fils ── */
  const carregaFils = useCallback(async () => {
    const meua = ++genFils.current;
    if (!joId) {
      setFils([]);
      setEstat('ready');
      return;
    }

    try {
      const bruts = await loadFils(configRef.current);
      if (meua !== genFils.current) return;
      setFils(bruts.map(mapejaFil));
      setAvis(null);
      return true;
    } catch (error) {
      if (meua !== genFils.current) return false;
      /* No es propaga a `status`. Vegeu la capçalera del fitxer. */
      setAvis(error?.message || 'No s\'han pogut carregar les converses.');
      setFils([]);
      return false;
    } finally {
      if (meua === genFils.current) setEstat('ready');
    }
  }, [joId]);

  /* ── Missatges d'un fil ── */
  const carregaMissatges = useCallback(async (filId) => {
    if (!filId) return;
    const meua = ++genMissatges.current;
    
    if (!joId) return;

    if (String(filId).startsWith('mock-fil-')) {
      // És un fil de mentira (beta testers) creat en local per a un usuari registrat
      setMissatgesPerFil((previs) => ({ ...previs, [filId]: previs[filId] || [] }));
      return;
    }

    try {
      const bruts = await loadMissatges(filId, configRef.current);
      if (meua !== genMissatges.current) return;
      setMissatgesPerFil((previs) => {
        /* Els optimistes encara pendents no es perden en un refresc: es
           conserven fins que el servidor els torna amb el seu id real. */
        const pendents = (previs[filId] || []).filter((m) => m.estatEnviament !== 'enviat');
        const confirmats = new Set(bruts.map((m) => m.id));
        return {
          ...previs,
          [filId]: [
            ...bruts.map((m) => mapejaMissatge(m, joId)),
            ...pendents.filter((m) => !confirmats.has(m.id))
          ]
        };
      });
      return true;
    } catch (error) {
      if (meua !== genMissatges.current) return false;
      setAvis(error?.message || 'No s\'han pogut carregar els missatges.');
      return false;
    }
  }, [joId]);

  /* ── Càrrega inicial. `jo` a la clau: canviar de sessió recarrega. ── */
  useEffect(() => {
    setEstat('loading');
    carregaFils();
  }, [joId, carregaFils]);

  /* ── Obrir un fil: carregar-lo i marcar-lo llegit ── */
  const obriFil = useCallback((filId) => {
    setFilActiu(filId || null);
  }, []);

  useEffect(() => {
    if (!filActiu) return;
    let viu = true;
    carregaMissatges(filActiu).then(() => {
      if (!viu) return;
      if (joId) marcaLlegit(filActiu, configRef.current);
      setFils((previs) => previs.map((f) => (f.id === filActiu ? { ...f, noLlegits: 0 } : f)));
    });
    return () => { viu = false; };
  }, [filActiu, carregaMissatges]);

  /* ── Sondeig de Fils + Realtime per Missatges ──
     Sondejem només la llista de fils per veure 'no llegits'.
     Per als missatges del fil actiu, usem WebSockets (Realtime). */
  useEffect(() => {
    if (!joId) return undefined;
    let viu = true;
    let temporitzador = null;
    let subscripcioRealtime = null;
    let debounceVisibility = null;

    const amagat = () => typeof document !== 'undefined' && document.hidden;

    const connectaRealtime = () => {
      if (subscripcioRealtime) {
        unsubscribeFromXat(subscripcioRealtime);
        subscripcioRealtime = null;
      }
      if (filActiu && !amagat()) {
        const promesaSub = subscribeToXat(filActiu, (err, data) => {
          if (!err && data) {
            // Si el missatge és nostre, l'estratègia optimista ja l'ha afegit
            if (data.usuari_id === joId) return;

            setMissatgesPerFil((previs) => {
              const filMessages = previs[filActiu] || [];
              if (filMessages.some(ext => ext.id === data.id)) return previs;
              
              const incoming = mapejaMissatge({
                id: data.id,
                filId: data.fil_id,
                usuariId: data.usuari_id,
                text: data.text,
                esIA: data.es_ia,
                creatAl: data.creat_al,
                autorNom: data.autor_nom || null // Suposem que el backend pot injectar-ho, o bé el context ho cerca
              }, joId);
              
              return {
                ...previs,
                [filActiu]: [...filMessages, incoming]
              };
            });
          }
        });
        
        promesaSub.then(res => {
          if (viu) subscripcioRealtime = res.subscription;
          else unsubscribeFromXat(res.subscription);
        });
      }
    };

    connectaRealtime();

    const tic = async () => {
      if (!viu) return;
      if (temporitzador) clearTimeout(temporitzador);
      let ok = true;
      if (!amagat()) {
        ok = await carregaFils();
      }
      if (viu) temporitzador = setTimeout(tic, ok ? MS_LLISTA : MS_LLISTA * 10);
    };

    temporitzador = setTimeout(tic, MS_LLISTA);

    const alCanviarVisibilitat = () => {
      if (debounceVisibility) clearTimeout(debounceVisibility);
      debounceVisibility = setTimeout(() => {
        if (!viu) return;
        if (amagat()) {
          if (subscripcioRealtime) {
            unsubscribeFromXat(subscripcioRealtime);
            subscripcioRealtime = null;
          }
        } else {
          if (temporitzador) clearTimeout(temporitzador);
          tic();
          if (filActiu) {
            carregaMissatges(filActiu);
            connectaRealtime();
          }
        }
      }, 300);
    };
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', alCanviarVisibilitat);
    }

    return () => {
      viu = false;
      if (temporitzador) clearTimeout(temporitzador);
      if (debounceVisibility) clearTimeout(debounceVisibility);
      if (subscripcioRealtime) unsubscribeFromXat(subscripcioRealtime);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', alCanviarVisibilitat);
      }
    };
  }, [joId, filActiu, carregaFils, carregaMissatges]);

  /* ── Enviar ──
     OPTIMISTA AMB REVERSIÓ REAL. La versió anterior feia catch + console.warn i
     deixava la bombolla en pantalla: l'usuari veia enviat un missatge que no
     havia eixit mai del navegador. Ara, si falla, la bombolla desapareix i
     l'error puja perquè ChatConversation restaure el text a l'input. */
  const sendChatMessage = useCallback(async (fil, text) => {
    const filId = fil?.id;
    const cos = String(text ?? '').trim();
    if (!filId || !cos) return [];

    const idProvisional = `pendent::${filId}::${Date.now()}`;
    const ara = new Date().toISOString();
    const optimista = {
      id: idProvisional,
      threadId: filId,
      usuariId: joId,
      text: cos,
      sender: 'me',
      author: 'Jo',
      is_ai: false,
      creatAl: ara,
      createdAtTs: Date.now(),
      time_label: etiquetaBombolla(ara),
      estatEnviament: 'pendent'
    };

    setMissatgesPerFil((previs) => ({
      ...previs,
      [filId]: [...(previs[filId] || []), optimista]
    }));

    if (!joId || String(filId).startsWith('mock-fil-')) {
      // Fake mode per a forasters o converses de mentira amb beta-testers
      setFils((previs) => previs.map((f) => (f.id === filId
        ? { ...f, lastMessagePreview: cos, lastMessageTime: etiquetaLlista(ara) }
        : f)));
      return [optimista];
    }

    try {
      const desat = await enviaMissatge(filId, cos, configRef.current);
      const definitiu = { ...mapejaMissatge(desat, joId), author: 'Jo' };

      setMissatgesPerFil((previs) => ({
        ...previs,
        [filId]: (previs[filId] || []).map((m) => (m.id === idProvisional ? definitiu : m))
      }));
      setFils((previs) => previs.map((f) => (f.id === filId
        ? { ...f, lastMessagePreview: cos, lastMessageTime: etiquetaLlista(desat.creatAl) }
        : f)));

      return [definitiu];
    } catch (error) {
      setMissatgesPerFil((previs) => ({
        ...previs,
        [filId]: (previs[filId] || []).filter((m) => m.id !== idProvisional)
      }));
      throw error;
    }
  }, [joId]);

  /* ── El padró del poble ──
     NO es guarda a l'estat del context a propòsit. La llista només fa falta
     mentre el selector està obert; deixar-la ací obligaria tot l'arbre del xat
     a repintar-se cada volta que es carrega. Qui la demana, la té. */
  const cercaMembres = useCallback(
    async (text = null) => {
      let reals = [];
      if (joId) {
        try {
          reals = await carregaMembres(text, configRef.current);
        } catch {
          reals = [];
        }
      }
      return reals;
    },
    [joId]
  );

  /* ── Obrir conversa amb algú. Idempotent al servidor. ── */
  const creaFil = useCallback(async (altreUsuariId, titol = null) => {
    const filId = await creaFilDirecte(altreUsuariId, titol, configRef.current);
    await carregaFils();
    return filId;
  }, [carregaFils]);

  const getThreadMessages = useCallback(
    (filId) => missatgesPerFil[filId] || [],
    [missatgesPerFil]
  );

  const value = useMemo(() => ({
    status: estat,
    error: null,
    avis,
    chatThreads: fils,
    chatMessages: missatgesPerFil[filActiu] || [],
    filActiu,
    getThreadMessages,
    sendChatMessage,
    obriFil,
    creaFil,
    cercaMembres,
    recarrega: carregaFils
  }), [estat, avis, fils, missatgesPerFil, filActiu, getThreadMessages, sendChatMessage, obriFil, creaFil, cercaMembres, carregaFils]);

  return <XatContext.Provider value={value}>{children}</XatContext.Provider>;
}

export function useXat() {
  return useContext(XatContext) || BUIT;
}
