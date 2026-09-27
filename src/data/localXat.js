/**
 * localXat.js — Magatzem en memòria del Xat per als modes `seed` i `local`.
 *
 * Té la mateixa API que l'adaptador remot (`src/data/supabase/xat.js`) perquè
 * este hi delegue quan `runtimeDataMode !== 'remote'`. Fa el paper del servidor:
 * assigna el número d'ordre (`seq`), respecta la idempotència per `id`, pagina
 * per cursor, guarda les marques de rebut i llegit i resol el directori.
 *
 * És un singleton de mòdul: viu mentre viu la pestanya i es reinicia amb ella.
 * La persona que mira és la de la sessió o, sense sessió, el convidat, perquè el
 * xat es puga vore al navegador sense Supabase.
 */
import { getDefaultUserId, usuariDeSessio } from './identitat.js';
import { backendScope, normalizeBackendConfig } from '../config/backendConfig.js';
import { XAT_SEED_MEMBRES, XAT_SEED_NOMS, construeixLlavorXat } from './xatSeed.js';

const LIMIT_PER_DEFECTE = 50;
const LIMIT_MAXIM = 100;
const TEXT_MAXIM = 4096;

const magatzems = new Map();

/* Mateix format que el servidor: «SDP-XAT-NNN: text», amb `code` i `retriable`. */
const errorXat = (codi, missatge) => Object.assign(new Error(`${codi}: ${missatge}`), { code: codi, retriable: false });
const errorPla = (missatge) => Object.assign(new Error(missatge), { code: 'LOCAL', retriable: false });

const joActual = () => usuariDeSessio()?.id || getDefaultUserId();
const copia = (missatge) => ({ ...missatge, metadades: { ...missatge.metadades } });

function creaMagatzem(config, jo) {
  const estat = { fils: new Map(), participants: new Map(), missatges: new Map(), noms: new Map(Object.entries(XAT_SEED_NOMS)), membres: [] };
  if (normalizeBackendConfig(config).dataMode !== 'seed') return estat;
  const llavor = construeixLlavorXat(jo);
  estat.membres = XAT_SEED_MEMBRES.map((membre) => ({ ...membre }));
  for (const fil of llavor.fils) {
    estat.fils.set(fil.id, { ...fil });
    estat.participants.set(fil.id, new Map());
    estat.missatges.set(fil.id, []);
  }
  for (const p of llavor.participants) estat.participants.get(p.filId).set(p.usuariId, { ...p });
  for (const missatge of llavor.missatges) estat.missatges.get(missatge.filId).push(copia(missatge));
  return estat;
}

function magatzem(config) {
  const jo = joActual();
  const clau = JSON.stringify([backendScope(config), jo]);
  if (!magatzems.has(clau)) magatzems.set(clau, creaMagatzem(config, jo));
  return { estat: magatzems.get(clau), jo };
}

function exigixParticipant(estat, filId, jo) {
  const meu = estat.participants.get(filId)?.get(jo);
  if (!meu) throw errorXat('SDP-XAT-005', 'no eres participant d’aquest fil.');
  return meu;
}

function validaLimit(limit) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > LIMIT_MAXIM) {
    throw errorXat('SDP-XAT-009', `el límit ha d’estar entre 1 i ${LIMIT_MAXIM}.`);
  }
}

/* Mateixos límits que el servidor: abans ≥ 1 (xat_historial), després ≥ 0 (xat_nous). */
function cursor(valor, minim = 0) {
  if (valor === null || valor === undefined) return null;
  const n = Number(valor);
  if (!Number.isSafeInteger(n) || n < minim) throw errorXat('SDP-XAT-009', 'cursor o límit invàlid.');
  return n;
}

/* Admet una cadena (compatibilitat) o l’objecte ja normalitzat per l’adaptador.
   Mateixes regles que xat_envia: només text, retallat, d’1 a 4096 caràcters. */
function normalitzaCos(cos) {
  const entrada = cos !== null && typeof cos === 'object' ? cos : { text: cos };
  const text = entrada.text === null || entrada.text === undefined ? null : String(entrada.text).trim();
  const tipus = typeof entrada.tipus === 'string' && entrada.tipus ? entrada.tipus : 'text';
  if (tipus !== 'text') throw errorXat('SDP-XAT-010', 'tipus de missatge no admés des del client.');
  if (!text || text.length > TEXT_MAXIM) throw errorXat('SDP-XAT-007', 'missatge buit o massa llarg.');
  return {
    id: typeof entrada.id === 'string' && entrada.id ? entrada.id : crypto.randomUUID(),
    text,
    tipus,
    respostaA: entrada.respostaA ?? null,
    metadades: entrada.metadades && typeof entrada.metadades === 'object' ? { ...entrada.metadades } : {}
  };
}

function filDirecteAmb(estat, jo, altre) {
  for (const fil of estat.fils.values()) {
    if (fil.tipus !== 'directe') continue;
    const parts = estat.participants.get(fil.id);
    if (parts.size === 2 && parts.has(jo) && parts.has(altre)) return fil.id;
  }
  return null;
}

export function createLocalXatAdapter() {
  return {
    async loadFils(config = {}) {
      const { estat, jo } = magatzem(config);
      const converses = [];
      for (const fil of estat.fils.values()) {
        const parts = estat.participants.get(fil.id);
        const meu = parts.get(jo);
        if (!meu) continue;
        const altres = [...parts.values()].filter((p) => p.usuariId !== jo);
        const ultim = (estat.missatges.get(fil.id) || []).at(-1) || null;
        converses.push({
          id: fil.id,
          tipus: fil.tipus,
          titol: fil.titol,
          altresNoms: altres.map((p) => estat.noms.get(p.usuariId) || 'Veí'),
          imatgeUrl: fil.imatgeUrl,
          actualitzatAl: fil.actualitzatAl,
          ultimText: ultim ? ultim.text : null,
          ultimAl: ultim ? ultim.creatAl : null,
          ultimAutorId: ultim ? ultim.usuariId : null,
          ultimSeq: fil.ultimSeq,
          llegitFinsSeq: meu.llegitFinsSeq,
          rebutFinsSeq: meu.rebutFinsSeq,
          llegitPelsAltresFinsSeq: altres.length ? Math.min(...altres.map((p) => p.llegitFinsSeq)) : 0,
          noLlegits: Math.max(0, fil.ultimSeq - Math.max(meu.llegitFinsSeq, meu.buidatFinsSeq)),
          arxivatAl: meu.arxivatAl,
          fixatAl: meu.fixatAl,
          silenciatFinsAl: meu.silenciatFinsAl,
          preferitAl: meu.preferitAl,
          noLlegitManual: meu.noLlegitManual
        });
      }
      return converses.sort((a, b) => String(b.ultimAl || b.actualitzatAl).localeCompare(String(a.ultimAl || a.actualitzatAl)));
    },

    async loadMissatges(filId, config = {}) {
      const { estat, jo } = magatzem(config);
      const limit = config.limit ?? LIMIT_PER_DEFECTE;
      validaLimit(limit);
      const abans = cursor(config.abansDeSeq, 1);
      const despres = cursor(config.despresDeSeq, 0);
      const meu = exigixParticipant(estat, filId, jo);
      const visibles = (estat.missatges.get(filId) || []).filter((m) => m.seq > meu.buidatFinsSeq);
      const tria = despres !== null
        ? visibles.filter((m) => m.seq > despres)
        : visibles.filter((m) => abans === null || m.seq < abans).slice(-limit);
      return tria.map(copia);
    },

    async enviaMissatge(filId, cos, config = {}) {
      const { estat, jo } = magatzem(config);
      const entrada = normalitzaCos(cos);
      const meu = exigixParticipant(estat, filId, jo);
      /* Idempotència per `id`, com fa el servidor amb `on conflict (id) do nothing`. */
      for (const llista of estat.missatges.values()) {
        const existent = llista.find((m) => m.id === entrada.id);
        if (!existent) continue;
        if (existent.usuariId !== jo) throw errorXat('SDP-XAT-008', 'este identificador ja és d’una altra persona.');
        return copia(existent);
      }
      const fil = estat.fils.get(filId);
      const creatAl = new Date().toISOString();
      const nou = {
        id: entrada.id, filId, seq: ++fil.ultimSeq, usuariId: jo, autorNom: null, text: entrada.text, tipus: entrada.tipus,
        respostaA: entrada.respostaA, editatAl: null, esborratAl: null, metadades: entrada.metadades, esIA: false, creatAl
      };
      estat.missatges.get(filId).push(nou);
      fil.actualitzatAl = creatAl;
      /* Qui escriu ja ha llegit el que escriu. */
      meu.llegitFinsSeq = Math.max(meu.llegitFinsSeq, nou.seq);
      meu.rebutFinsSeq = Math.max(meu.rebutFinsSeq, nou.seq);
      return copia(nou);
    },

    async marcaLlegit(filId, config = {}) {
      const { estat, jo } = magatzem(config);
      const meu = exigixParticipant(estat, filId, jo);
      const fil = estat.fils.get(filId);
      /* `null` vol dir fins a l’últim; una marca mai retrocedix. */
      const objectiu = (valor) => (valor === null || valor === undefined ? fil.ultimSeq : Math.min(fil.ultimSeq, cursor(valor)));
      meu.llegitFinsSeq = Math.max(meu.llegitFinsSeq, objectiu(config.llegitFinsSeq));
      meu.rebutFinsSeq = Math.max(meu.rebutFinsSeq, objectiu(config.rebutFinsSeq), meu.llegitFinsSeq);
      /* Com xat_marca: el «no llegit» manual s’apaga només quan s’ha llegit tot. */
      if (meu.llegitFinsSeq >= fil.ultimSeq) meu.noLlegitManual = false;
      return { llegitFinsSeq: meu.llegitFinsSeq, rebutFinsSeq: meu.rebutFinsSeq };
    },

    async creaFilDirecte(altreUsuariId, titol = null, config = {}) {
      const { estat, jo } = magatzem(config);
      if (!altreUsuariId || altreUsuariId === jo) throw errorPla('No pots obrir una conversa amb tu mateix.');
      if (!estat.membres.some((membre) => membre.usuariId === altreUsuariId)) throw errorPla('Esta persona no és del poble.');
      const existent = filDirecteAmb(estat, jo, altreUsuariId);
      if (existent) return existent;
      const ara = new Date().toISOString();
      const fil = { id: crypto.randomUUID(), tipus: 'directe', titol: titol || null, imatgeUrl: null, creatAl: ara, actualitzatAl: ara, ultimSeq: 0 };
      const participant = (usuariId) => ({
        filId: fil.id, usuariId, llegitFinsSeq: 0, rebutFinsSeq: 0, buidatFinsSeq: 0,
        arxivatAl: null, fixatAl: null, silenciatFinsAl: null, preferitAl: null, noLlegitManual: false
      });
      estat.fils.set(fil.id, fil);
      estat.participants.set(fil.id, new Map([[jo, participant(jo)], [altreUsuariId, participant(altreUsuariId)]]));
      estat.missatges.set(fil.id, []);
      return fil.id;
    },

    /* Mateixa forma que l’RPC `membres_del_poble`: usuari_id, nom i fil_id si ja parleu. */
    async carregaMembres(text = null, config = {}) {
      const { estat, jo } = magatzem(config);
      const cerca = String(text ?? '').trim().toLowerCase();
      return estat.membres
        .filter((membre) => membre.usuariId !== jo && (!cerca || membre.nom.toLowerCase().includes(cerca)))
        .sort((a, b) => a.nom.localeCompare(b.nom))
        .map((membre) => ({ usuari_id: membre.usuariId, nom: membre.nom, fil_id: filDirecteAmb(estat, jo, membre.usuariId) }));
    },

    /* Sense servidor no hi ha canal; el sondeig del context ja cobrix la resta. */
    async subscribeToXat() {
      return { subscription: null, error: null };
    },

    async unsubscribeFromXat() {}
  };
}

/** Per a les proves: oblida tots els magatzems. */
export function reiniciaLocalXat() {
  magatzems.clear();
}

export const localXat = createLocalXatAdapter();
