/**
 * localXat.js — Magatzem en memòria del Xat per als modes `seed` i `local`.
 *
 * Té la mateixa API que l'adaptador remot (`src/data/supabase/xat.js`) perquè
 * este hi delegue quan `runtimeDataMode !== 'remote'`. Fa el paper del servidor:
 * assigna el número d'ordre (`seq`), respecta la idempotència per `id`, pagina
 * per cursor, guarda les marques de rebut i llegit, resol el directori, avisa
 * els canals subscrits quan entra un missatge i, com faria un disparador de
 * la base de dades, fa respondre la IAIA.
 *
 * LÒGICA D'USUARI (prompt 260927_1925)
 * ───────────────────────────────────
 *   · T2 · Un fil pot ser d'una ENTITAT (`fil.orgId`): l'entitat hi és una
 *     participant virtual (`esEntitat`) i qualsevol persona que hi mana el veu
 *     com a canal compartit. Qui escriu en nom de l'entitat és una persona
 *     (`usuariId`) que signa com l'entitat (`comOrgId`), igual que el servidor
 *     amb `xat_participants.com_org_id`.
 *   · T3 · Un fil de tipus 'iaia' fa respondre la IAIA amb la frase fixa
 *     d'identitatsSeed, i l'avís del canal fa que la interfície la demane a
 *     l'instant.
 *   · T4 · Cada fil diu qui són els altres (`altres`: id, nom, tipus i avatar)
 *     perquè l'avatar de la conversa enllace amb el perfil públic.
 *
 * És un singleton de mòdul: viu mentre viu la pestanya i es reinicia amb ella.
 * La persona que mira és la de la sessió o, sense sessió, el convidat, perquè el
 * xat es puga vore al navegador sense Supabase.
 */
import { getDefaultUserId, usuariDeSessio } from './identitat.js';
import { backendScope, normalizeBackendConfig } from '../config/backendConfig.js';
import { XAT_SEED_MEMBRES, XAT_SEED_NOMS, construeixLlavorXat } from './xatSeed.js';
import { ENTITATS_SEED, RESPOSTA_IAIA, esIAIA, rolALEntitat, IAIA_ID } from './identitatsSeed.js';
import { AGENTS_MAP } from './agentsSeed.js';

const LIMIT_PER_DEFECTE = 50;
const LIMIT_MAXIM = 100;
const TEXT_MAXIM = 4096;

const magatzems = new Map();
/* Canals subscrits per fil: el mateix paper que `realtime.send` al servidor. */
const subscriptors = new Map();

/* Mateix format que el servidor: «SDP-XAT-NNN: text», amb `code` i `retriable`. */
const errorXat = (codi, missatge) => Object.assign(new Error(`${codi}: ${missatge}`), { code: codi, retriable: false });
const errorPla = (missatge) => Object.assign(new Error(missatge), { code: 'LOCAL', retriable: false });

const copia = (missatge) => ({ ...missatge, metadades: { ...missatge.metadades } });

const participantNou = (filId, usuariId, extra = {}) => ({
  filId, usuariId, llegitFinsSeq: 0, rebutFinsSeq: 0, buidatFinsSeq: 0,
  arxivatAl: null, fixatAl: null, silenciatFinsAl: null, preferitAl: null, noLlegitManual: false,
  comOrgId: null, esEntitat: false, ...extra
});

function creaMagatzem(config, jo, teSessio) {
  const estat = {
    fils: new Map(), participants: new Map(), missatges: new Map(),
    noms: new Map(Object.entries(XAT_SEED_NOMS)),
    membres: XAT_SEED_MEMBRES.map((membre) => ({ ...membre })),
    entitats: new Map(ENTITATS_SEED.map((e) => [e.id, { id: e.id, nom: e.name, avatarUrl: e.logo_url, slug: e.slug }])),
    teSessio
  };
  if (normalizeBackendConfig(config).dataMode !== 'seed') return estat;
  const llavor = construeixLlavorXat(jo);
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
  const sessio = usuariDeSessio();
  const jo = sessio?.id || getDefaultUserId();
  const clau = JSON.stringify([backendScope(config), jo]);
  if (!magatzems.has(clau)) magatzems.set(clau, creaMagatzem(config, jo, Boolean(sessio)));
  return { estat: magatzems.get(clau), jo };
}

/* ─────────────────────────── Qui és qui ─────────────────────────── */

/** Fitxa d'un identificador del padró: persona, entitat o la IAIA. */
function fitxaDe(estat, id) {
  const entitat = estat.entitats.get(id);
  if (entitat) return { id, nom: entitat.nom, tipus: 'entitat', avatarUrl: entitat.avatarUrl };
  if (esIAIA(id)) return { id, nom: AGENTS_MAP.IAIA.name, tipus: 'ia', avatarUrl: AGENTS_MAP.IAIA.avatar_url };
  const membre = estat.membres.find((m) => m.usuariId === id);
  if (membre) return { id, nom: membre.nom, tipus: membre.tipus || 'persona', avatarUrl: membre.avatarUrl || null };
  return { id, nom: estat.noms.get(id) || 'Veí', tipus: 'persona', avatarUrl: null };
}

/** Si `jo` mana a l'entitat `orgId` (llavor o regla del mode seed). */
const esMembreDe = (estat, orgId, jo) => Boolean(orgId) && rolALEntitat(orgId, jo, { teSessio: estat.teSessio }) !== null;

/**
 * La fila de `jo` en un fil, o null si no hi pinta res. En un fil d'entitat on
 * mane, la fila naix en obrir-lo, signada com l'entitat: el canal compartit.
 */
function participantDe(estat, fil, jo) {
  const parts = estat.participants.get(fil.id);
  if (!parts) return null;
  const meu = parts.get(jo);
  if (meu) return meu;
  if (!esMembreDe(estat, fil.orgId, jo)) return null;
  const nou = participantNou(fil.id, jo, { comOrgId: fil.orgId });
  parts.set(jo, nou);
  return nou;
}

function exigixParticipant(estat, filId, jo) {
  const fil = estat.fils.get(filId);
  const meu = fil ? participantDe(estat, fil, jo) : null;
  if (!meu) throw errorXat('SDP-XAT-005', 'no eres participant d’aquest fil.');
  return meu;
}

/** Els altres, tal com els veu `jo`: darrere d'una entitat no es veuen les persones. */
function altresDe(estat, fil, meu) {
  const parts = [...estat.participants.get(fil.id).values()].filter((p) => p.usuariId !== meu.usuariId);
  const visibles = meu.comOrgId
    ? parts.filter((p) => !p.esEntitat && !p.comOrgId)
    : parts.filter((p) => !p.comOrgId);
  return visibles.map((p) => fitxaDe(estat, p.usuariId));
}

/** Els que llegixen «a l'altre costat» del fil, per a la marca «llegit». */
function altreCostat(estat, fil, meu) {
  const parts = [...estat.participants.get(fil.id).values()].filter((p) => p.usuariId !== meu.usuariId);
  if (!fil.orgId) return parts;
  return meu.comOrgId ? parts.filter((p) => !p.esEntitat && !p.comOrgId) : parts.filter((p) => p.esEntitat);
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

/** El fil on `jo` parla amb la IAIA, o amb l'entitat com a client. */
function filEspecialAmb(estat, jo, altre) {
  for (const fil of estat.fils.values()) {
    const parts = estat.participants.get(fil.id);
    if (fil.tipus === 'iaia' && esIAIA(altre) && parts.has(jo)) return fil.id;
    if (fil.tipus === 'entitat' && fil.orgId === altre && parts.get(jo) && !parts.get(jo).comOrgId) return fil.id;
  }
  return null;
}

function filAmb(estat, jo, altre) {
  if (estat.entitats.has(altre) || esIAIA(altre)) return filEspecialAmb(estat, jo, altre);
  return filDirecteAmb(estat, jo, altre);
}

function creaFil(estat, tipus, orgId, participants) {
  const ara = new Date().toISOString();
  const fil = { id: crypto.randomUUID(), tipus, titol: null, orgId, imatgeUrl: null, creatAl: ara, actualitzatAl: ara, ultimSeq: 0 };
  estat.fils.set(fil.id, fil);
  estat.participants.set(fil.id, new Map(participants.map((p) => [p.usuariId, { ...p, filId: fil.id }])));
  estat.missatges.set(fil.id, []);
  return fil;
}

/* ─────────────────────────── Canals ─────────────────────────── */

/** Avisa els canals del fil, després de tornar: com `realtime.send` del servidor. */
function avisa(filId, seq) {
  const canals = subscriptors.get(filId);
  if (!canals || !canals.size) return;
  for (const cb of [...canals]) {
    queueMicrotask(() => { try { cb(null, { tipus: 'nous', filId, seq }); } catch { /* un canal trencat no atura els altres */ } });
  }
}

/** T3 · La IAIA respon sola, com ho faria un disparador després d'inserir. */
function respostaIAIA(estat, fil) {
  const parts = estat.participants.get(fil.id);
  const creatAl = new Date().toISOString();
  const resposta = {
    id: crypto.randomUUID(), filId: fil.id, seq: ++fil.ultimSeq, usuariId: IAIA_ID, autorNom: AGENTS_MAP.IAIA.name,
    text: RESPOSTA_IAIA, tipus: 'text', respostaA: null, editatAl: null, esborratAl: null, metadades: {},
    esIA: true, comOrgId: null, creatAl
  };
  estat.missatges.get(fil.id).push(resposta);
  fil.actualitzatAl = creatAl;
  const iaia = parts.get(IAIA_ID) || participantNou(fil.id, IAIA_ID);
  iaia.llegitFinsSeq = Math.max(iaia.llegitFinsSeq, resposta.seq);
  iaia.rebutFinsSeq = Math.max(iaia.rebutFinsSeq, resposta.seq);
  parts.set(IAIA_ID, iaia);
  return resposta;
}

export function createLocalXatAdapter() {
  return {
    async loadFils(config = {}) {
      const { estat, jo } = magatzem(config);
      const converses = [];
      for (const fil of estat.fils.values()) {
        const meu = participantDe(estat, fil, jo);
        if (!meu) continue;
        const altres = altresDe(estat, fil, meu);
        const costat = altreCostat(estat, fil, meu);
        const ultim = (estat.missatges.get(fil.id) || []).at(-1) || null;
        const entitat = fil.orgId ? estat.entitats.get(fil.orgId) : null;
        converses.push({
          id: fil.id,
          tipus: fil.tipus,
          titol: fil.titol,
          altresNoms: altres.map((p) => p.nom),
          altres,
          entitatId: fil.orgId || null,
          entitatNom: entitat ? entitat.nom : null,
          comEntitat: Boolean(meu.comOrgId),
          imatgeUrl: fil.imatgeUrl || (fil.tipus !== 'grup' ? altres[0]?.avatarUrl || null : null),
          actualitzatAl: fil.actualitzatAl,
          ultimText: ultim ? ultim.text : null,
          ultimAl: ultim ? ultim.creatAl : null,
          ultimAutorId: ultim ? ultim.usuariId : null,
          ultimSeq: fil.ultimSeq,
          llegitFinsSeq: meu.llegitFinsSeq,
          rebutFinsSeq: meu.rebutFinsSeq,
          llegitPelsAltresFinsSeq: costat.length ? Math.min(...costat.map((p) => p.llegitFinsSeq)) : 0,
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
      const entitat = meu.comOrgId ? estat.entitats.get(meu.comOrgId) : null;
      const nou = {
        id: entrada.id, filId, seq: ++fil.ultimSeq, usuariId: jo,
        /* En nom de l'entitat: signa l'entitat i recorda qui ho ha escrit. */
        autorNom: entitat ? entitat.nom : null,
        text: entrada.text, tipus: entrada.tipus,
        respostaA: entrada.respostaA, editatAl: null, esborratAl: null,
        metadades: entitat ? { ...entrada.metadades, autorPersona: fitxaDe(estat, jo).nom } : entrada.metadades,
        esIA: false, comOrgId: meu.comOrgId || null, creatAl
      };
      estat.missatges.get(filId).push(nou);
      fil.actualitzatAl = creatAl;
      /* Qui escriu ja ha llegit el que escriu; l'entitat, també. */
      meu.llegitFinsSeq = Math.max(meu.llegitFinsSeq, nou.seq);
      meu.rebutFinsSeq = Math.max(meu.rebutFinsSeq, nou.seq);
      if (entitat) {
        const virtual = estat.participants.get(filId).get(entitat.id);
        if (virtual) {
          virtual.llegitFinsSeq = Math.max(virtual.llegitFinsSeq, nou.seq);
          virtual.rebutFinsSeq = Math.max(virtual.rebutFinsSeq, nou.seq);
        }
      }
      let ultimSeq = nou.seq;
      if (fil.tipus === 'iaia') ultimSeq = respostaIAIA(estat, fil).seq;
      avisa(filId, ultimSeq);
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
      /* El que llig un membre en nom de l'entitat, ho ha llegit l'entitat. */
      if (meu.comOrgId) {
        const virtual = estat.participants.get(filId).get(meu.comOrgId);
        if (virtual) {
          virtual.llegitFinsSeq = Math.max(virtual.llegitFinsSeq, meu.llegitFinsSeq);
          virtual.rebutFinsSeq = Math.max(virtual.rebutFinsSeq, meu.rebutFinsSeq);
        }
      }
      return { llegitFinsSeq: meu.llegitFinsSeq, rebutFinsSeq: meu.rebutFinsSeq };
    },

    /**
     * Obri una conversa amb algú del padró: una persona (fil directe), l'entitat
     * (fil d'entitat, jo com a client) o la IAIA (fil 'iaia'). Idempotent.
     */
    async creaFilDirecte(altreUsuariId, titol = null, config = {}) {
      const { estat, jo } = magatzem(config);
      if (!altreUsuariId || altreUsuariId === jo) throw errorPla('No pots obrir una conversa amb tu mateix.');
      const altre = String(altreUsuariId);
      if (!estat.membres.some((membre) => membre.usuariId === altre)) throw errorPla('Esta persona no és del poble.');
      const existent = filAmb(estat, jo, altre);
      if (existent) return existent;
      if (estat.entitats.has(altre)) {
        return creaFil(estat, 'entitat', altre, [participantNou(null, jo), participantNou(null, altre, { esEntitat: true })]).id;
      }
      if (esIAIA(altre)) {
        return creaFil(estat, 'iaia', null, [participantNou(null, jo), participantNou(null, altre)]).id;
      }
      const fil = creaFil(estat, 'directe', null, [participantNou(null, jo), participantNou(null, altre)]);
      if (titol) fil.titol = titol;
      return fil.id;
    },

    /* Mateixa forma que l’RPC `membres_del_poble`: usuari_id, nom i fil_id si ja
       parleu, més el tipus (persona, entitat o ia) i l'avatar del padró. */
    async carregaMembres(text = null, config = {}) {
      const { estat, jo } = magatzem(config);
      const cerca = String(text ?? '').trim().toLowerCase();
      return estat.membres
        .filter((membre) => membre.usuariId !== jo && (!cerca || membre.nom.toLowerCase().includes(cerca)))
        .sort((a, b) => a.nom.localeCompare(b.nom))
        .map((membre) => ({
          usuari_id: membre.usuariId, nom: membre.nom, tipus: membre.tipus || 'persona',
          avatar_url: membre.avatarUrl || null, fil_id: filAmb(estat, jo, membre.usuariId)
        }));
    },

    /* Canal local: avisa quan entra un missatge al fil (la IAIA inclosa).
       El sondeig del context continua com a xarxa de seguretat. */
    async subscribeToXat(filId, callback) {
      if (!filId || typeof callback !== 'function') return { subscription: null, error: null };
      if (!subscriptors.has(filId)) subscriptors.set(filId, new Set());
      subscriptors.get(filId).add(callback);
      return { subscription: { filId, callback }, error: null };
    },

    async unsubscribeFromXat(subscription) {
      const canals = subscription ? subscriptors.get(subscription.filId) : null;
      if (!canals) return;
      canals.delete(subscription.callback);
      if (!canals.size) subscriptors.delete(subscription.filId);
    }
  };
}

/** Per a les proves: oblida tots els magatzems i els canals. */
export function reiniciaLocalXat() {
  magatzems.clear();
  subscriptors.clear();
}

export const localXat = createLocalXatAdapter();
