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
 *   · Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25) · La resposta de la IAIA
 *     és asíncrona: primer busca a la Wiki pública del paquet (iaiaLocal.js)
 *     i contesta amb els 3 documents més pròxims; sense cap resultat, o si la
 *     Wiki no es pot carregar, la frase fixa de sempre. Al fil 'iaia' cada
 *     pregunta espera que ella haja contestat l'anterior: el `seq` sempre va
 *     pregunta, resposta, pregunta, resposta, sense forats.
 *   · T4 · Cada fil diu qui són els altres (`altres`: id, nom, tipus i avatar)
 *     perquè l'avatar de la conversa enllace amb el perfil públic.
 *
 * XAT DE PÀGINA I COMUNITATS (T63.2 i T67, contracte del Xat §1-§3)
 * ─────────────────────────────────────────────────────────────────
 *   · Tot fil porta `comunitatId` i `subjecte` (null si no en té), també els
 *     de la llavor, i la Conversa els torna tal qual.
 *   · `obriFilDePagina(objecte)` troba per subjecte (tipus + id) o crea: per a
 *     una entitat, un poble o una organització, la 'comunitat' amb el canal
 *     «Avisos» i el grup «General» (en torna General); per a la resta de
 *     comentables, un 'grup'. Qui l'obri hi entra com a participant (en remot
 *     no: vegeu supabase/xat.js). Cap missatge de sistema, com al servidor.
 *   · La 'comunitat' no té missatges propis i al 'canal' només hi escriuen
 *     els administradors (qui gestiona l'entitat, que hi signa com ella):
 *     `enviaMissatge` rebutja la resta amb SDP-XAT-011.
 *   · Un fil de pàgina no llista les persones que hi participen (només
 *     l'entitat, si n'hi ha), sinó quantes n'hi ha (`participants`).
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
import { PAGINES_AMB_XAT, rutaDeSubjecte, subjecteDeXat } from './contracte.js';
import { respostaDeLaIAIA } from './iaiaLocal.js';

const LIMIT_PER_DEFECTE = 50;
const LIMIT_MAXIM = 100;
const TEXT_MAXIM = 4096;

const magatzems = new Map();
/* Canals subscrits per fil: el mateix paper que `realtime.send` al servidor. */
const subscriptors = new Map();

/* Mateix format que el servidor: «SDP-XAT-NNN: text», amb `code` i `retriable`. */
const errorXat = (codi, missatge) => Object.assign(new Error(`${codi}: ${missatge}`), { code: codi, retriable: false });
const errorPla = (missatge) => Object.assign(new Error(missatge), { code: 'LOCAL', retriable: false });
/* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · Obrir
   un directe amb algú que no és al padró ix amb el MATEIX codi que
   crea_fil_directe (SDP-XAT-004) i amb el text humà de l'adaptador remot
   (MISSATGES_SDP_HUMANS de supabase/xat.js, que és el valor valencià de
   'section.xat.error.noDelPoble'): la interfície el tradueix pel `code` a les
   cinc llengües (errorsXat.js), sense cap clau nova. Abans era un errorPla
   ('LOCAL') amb un text propi que eixia en valencià en les cinc.
   Sense el prefix «SDP-XAT-004: » d'errorXat: en remot l'adaptador el canvia
   pel text humà, i ací no hi ha qui el canvie (useAplicaAbast pinta el
   `message` tal qual). `retriable` continua sent false i cap consumidor
   mirava 'LOCAL': ni reintent ni cap altre camí, només el text.
   xatCorporatiu.test.jsx vigila que el text siga el de la clau. */
const errorForastera = () => Object.assign(new Error('Esta persona és forastera en este poble.'), { code: 'SDP-XAT-004', retriable: false });

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
    /* Contracte del Xat §1: tot fil porta comunitatId i subjecte, amb còpia pròpia. */
    estat.fils.set(fil.id, { ...fil, comunitatId: fil.comunitatId ?? null, subjecte: fil.subjecte ? { ...fil.subjecte } : null });
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

/* Qui gestiona una entitat (owner o admin): escriu als seus Avisos i hi signa com ella. */
const ROLS_GESTOR = new Set(['owner', 'admin']);
const esGestorDe = (estat, orgId, jo) => Boolean(orgId) && ROLS_GESTOR.has(rolALEntitat(orgId, jo, { teSessio: estat.teSessio }));

/** El rol efectiu de `jo` en un fil: el declarat o, si hi signa com l'entitat o la gestiona, 'admin'. */
function rolDe(estat, fil, meu, jo) {
  if (meu.rol === 'propietari' || meu.rol === 'admin') return meu.rol;
  if (meu.comOrgId || esGestorDe(estat, fil.orgId, jo)) return 'admin';
  return meu.rol || 'membre';
}

/** La comunitat és un contenidor; al canal («Avisos») només hi escriuen els administradors. */
function exigixEscriptura(estat, fil, meu, jo) {
  if (fil.tipus === 'comunitat') {
    throw errorXat('SDP-XAT-011', 'la comunitat no té missatges propis: escriu al grup General.');
  }
  if (fil.tipus === 'canal' && rolDe(estat, fil, meu, jo) === 'membre') {
    throw errorXat('SDP-XAT-011', 'en este canal només escriuen els administradors de la comunitat.');
  }
}

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

/**
 * Els altres, tal com els veu `jo`: darrere d'una entitat no es veuen les
 * persones. En un fil de pàgina (amb subjecte) tampoc: llegir-lo no publica
 * qui hi ha; només es veu l'entitat, si el fil és seu i jo no hi signe.
 */
function altresDe(estat, fil, meu) {
  if (fil.subjecte) return fil.orgId && !meu.comOrgId ? [fitxaDe(estat, fil.orgId)] : [];
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

function creaFil(estat, tipus, orgId, participants, extra = {}) {
  const ara = new Date().toISOString();
  const fil = {
    id: crypto.randomUUID(), tipus, titol: null, orgId, imatgeUrl: null, comunitatId: null, subjecte: null,
    creatAl: ara, actualitzatAl: ara, ultimSeq: 0, ...extra
  };
  estat.fils.set(fil.id, fil);
  estat.participants.set(fil.id, new Map(participants.map((p) => [p.usuariId, { ...p, filId: fil.id }])));
  estat.missatges.set(fil.id, []);
  return fil;
}

/* ─────────────────────── Fils de pàgina (T63.2, T67) ─────────────────────── */

const mateixSubjecte = (fil, clau) => fil.subjecte?.tipus === clau.tipus && String(fil.subjecte?.id ?? '') === clau.id;

/** El fil d'un tipus que naix d'un subjecte, o null. */
function filDelSubjecte(estat, clau, tipus) {
  for (const fil of estat.fils.values()) {
    if (fil.tipus === tipus && mateixSubjecte(fil, clau)) return fil;
  }
  return null;
}

/** El fill d'una comunitat: el del mateix subjecte o, per a Avisos, el primer canal. */
function fillDeComunitat(estat, comunitat, tipus, clau) {
  let primer = null;
  for (const fil of estat.fils.values()) {
    if (fil.comunitatId !== comunitat.id || fil.tipus !== tipus) continue;
    if (mateixSubjecte(fil, clau)) return fil;
    primer ||= fil;
  }
  return tipus === 'canal' ? primer : null;
}

/** Qui obri el fil hi entra: la fila que ja té, la de gestor de l'entitat o una de membre. */
function entraAlFil(estat, fil, jo) {
  const meu = participantDe(estat, fil, jo);
  if (meu) return meu;
  const nou = participantNou(fil.id, jo);
  estat.participants.get(fil.id).set(jo, nou);
  return nou;
}

/** Persones que participen en un fil, sense la participant virtual de l'entitat. */
const participantsDe = (estat, fil) => [...estat.participants.get(fil.id).values()].filter((p) => !p.esEntitat).length;

/** La Conversa que veu `jo`, amb la mateixa forma que torna el servidor. */
function conversaDe(estat, fil, meu, jo) {
  const altres = altresDe(estat, fil, meu);
  const costat = altreCostat(estat, fil, meu);
  const ultim = (estat.missatges.get(fil.id) || []).at(-1) || null;
  const entitat = fil.orgId ? estat.entitats.get(fil.orgId) : null;
  return {
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
    noLlegitManual: meu.noLlegitManual,
    comunitatId: fil.comunitatId ?? null,
    subjecte: fil.subjecte ? { ...fil.subjecte } : null,
    rol: rolDe(estat, fil, meu, jo),
    participants: participantsDe(estat, fil),
    participant: true
  };
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
function respostaIAIA(estat, fil, text = RESPOSTA_IAIA) {
  const parts = estat.participants.get(fil.id);
  const creatAl = new Date().toISOString();
  const resposta = {
    id: crypto.randomUUID(), filId: fil.id, seq: ++fil.ultimSeq, usuariId: IAIA_ID, autorNom: AGENTS_MAP.IAIA.name,
    text, tipus: 'text', respostaA: null, editatAl: null, esborratAl: null, metadades: {},
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

/* Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25) · Les respostes de la IAIA
   en curs. Per fil (objecte del magatzem, mai l'id: la llavor repetix l'id del
   fil 'iaia' a cada àmbit), el torn que una pregunta nova ha d'esperar; a
   més, totes juntes per a esperaLaIAIA. `generacio` canvia amb
   reiniciaLocalXat: una resposta d'un magatzem oblidat no s'escriu ni avisa. */
const tornsDeLaIAIA = new WeakMap();
const respostesEnCurs = new Set();
let generacio = 0;

/**
 * La IAIA contesta `pregunta` quan té la resposta: la de la Wiki
 * (iaiaLocal.js) o, sense cap resultat o si la Wiki falla, RESPOSTA_IAIA. El
 * `seq` es pren en escriure-la, mai abans: cap forat que el cursor de la
 * interfície (despresDeSeq) puga saltar-se. Avisa una sola vegada, amb el seq
 * de la resposta, com abans.
 */
function encarregaRespostaIAIA(estat, fil, pregunta) {
  const meua = generacio;
  const torn = { promesa: null };
  tornsDeLaIAIA.set(fil, torn);
  respostesEnCurs.add(torn);
  torn.promesa = (async () => {
    let text = null;
    try {
      text = await respostaDeLaIAIA(pregunta);
    } catch {
      text = null;
    }
    try {
      if (meua !== generacio) return;
      const resposta = respostaIAIA(estat, fil, typeof text === 'string' && text.trim() ? text : RESPOSTA_IAIA);
      avisa(fil.id, resposta.seq);
    } catch {
      /* Cap resposta: el sondeig de la interfície no hi trobarà res nou. */
    } finally {
      respostesEnCurs.delete(torn);
      if (tornsDeLaIAIA.get(fil) === torn) tornsDeLaIAIA.delete(fil);
    }
  })();
}

/** El missatge d'este `id` si ja és al magatzem (idempotència), o null. */
function jaEnviat(estat, id, jo) {
  for (const llista of estat.missatges.values()) {
    const existent = llista.find((m) => m.id === id);
    if (!existent) continue;
    if (existent.usuariId !== jo) throw errorXat('SDP-XAT-008', 'este identificador ja és d’una altra persona.');
    return copia(existent);
  }
  return null;
}

export function createLocalXatAdapter() {
  return {
    async loadFils(config = {}) {
      const { estat, jo } = magatzem(config);
      const converses = [];
      for (const fil of estat.fils.values()) {
        const meu = participantDe(estat, fil, jo);
        if (meu) converses.push(conversaDe(estat, fil, meu, jo));
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
      const repetit = jaEnviat(estat, entrada.id, jo);
      if (repetit) return repetit;
      const fil = estat.fils.get(filId);
      /* F25 · Al fil de la IAIA, una pregunta nova espera que ella haja
         contestat l'anterior. A cada torn es torna a mirar la idempotència: un
         reintent del mateix `id` que ja ha entrat torna el missatge i no
         entra dues vegades. */
      if (fil.tipus === 'iaia') {
        for (let torn = tornsDeLaIAIA.get(fil); torn; torn = tornsDeLaIAIA.get(fil)) {
          await torn.promesa;
          const entretant = jaEnviat(estat, entrada.id, jo);
          if (entretant) return entretant;
        }
      }
      exigixEscriptura(estat, fil, meu, jo);
      const creatAl = new Date().toISOString();
      /* Als Avisos de l'entitat, qui la gestiona hi signa com ella. */
      const comOrgId = meu.comOrgId || (fil.tipus === 'canal' && esGestorDe(estat, fil.orgId, jo) ? fil.orgId : null);
      const entitat = comOrgId ? estat.entitats.get(comOrgId) : null;
      const nou = {
        id: entrada.id, filId, seq: ++fil.ultimSeq, usuariId: jo,
        /* En nom de l'entitat: signa l'entitat i recorda qui ho ha escrit. */
        autorNom: entitat ? entitat.nom : null,
        text: entrada.text, tipus: entrada.tipus,
        respostaA: entrada.respostaA, editatAl: null, esborratAl: null,
        metadades: entitat ? { ...entrada.metadades, autorPersona: fitxaDe(estat, jo).nom } : entrada.metadades,
        esIA: false, comOrgId: comOrgId || null, creatAl
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
      /* F25 · Al fil de la IAIA l'avís el fa la resposta, quan arriba (un sol
         avís per pregunta, amb el seq de la resposta, com abans). */
      if (fil.tipus === 'iaia') encarregaRespostaIAIA(estat, fil, nou.text);
      else avisa(filId, nou.seq);
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
     * Onada 10 (261010) · Qui no és al padró és «forastera»: SDP-XAT-004, com
     * al servidor (errorForastera, dalt).
     * Front 3 (261013; pla 261013_1930) · Com crea_fil_directe (2610081543),
     * que obri qualsevol organització pública del poble, una entitat del
     * padró d'entitats (ENTITATS_SEED, totes públiques) s'obri encara que no
     * siga al padró del xat: és el que fa «Escriu-li al xat» de /grup/rentonar.
     * El padró que llista carregaMembres no canvia (xatSeed.js).
     */
    async creaFilDirecte(altreUsuariId, titol = null, config = {}) {
      const { estat, jo } = magatzem(config);
      if (!altreUsuariId || altreUsuariId === jo) throw errorPla('No pots obrir una conversa amb tu mateix.');
      const altre = String(altreUsuariId);
      if (!estat.membres.some((membre) => membre.usuariId === altre) && !estat.entitats.has(altre)) throw errorForastera();
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

    /**
     * T63.2 i T67 · El xat comú d'una Pàgina Universal (capacitat 'xatDePagina').
     * Troba per subjecte o crea: una entitat, un poble o una organització són
     * una comunitat amb «Avisos» (canal) i «General» (grup), i se'n torna
     * General; la resta de comentables, un grup. Qui l'obri hi entra. Un
     * subjecte sense xat (nota, persona, IA, sense id estable) torna null.
     * @returns {{ filId: string, fils: object[] } | null}
     */
    async obriFilDePagina(objecte, config = {}) {
      const { estat, jo } = magatzem(config);
      const subjecte = subjecteDeXat(objecte);
      if (!subjecte) return null;
      /* Una entitat del padró, per id o per slug: la clau és sempre el seu id. */
      const entitat = subjecte.tipus === 'entitat'
        ? [...estat.entitats.values()].find((e) => e.id === subjecte.id || e.slug === subjecte.id) || null
        : null;
      /* Com el servidor: la ruta és la canònica i el títol, el de la pàgina o
         el de l'entitat; el del client només si no en tenim cap. */
      const id = entitat ? entitat.id : subjecte.id;
      const titolPropi = subjecte.tipus === 'pagina' ? PAGINES_AMB_XAT[id] : entitat?.nom;
      const clau = { tipus: subjecte.tipus, id, ruta: rutaDeSubjecte(subjecte.tipus, id), titol: titolPropi || subjecte.titol || id };
      const deSubjecte = (tipus, extra) => creaFil(estat, tipus, extra.orgId ?? null, [], { ...extra, subjecte: { ...clau } });
      let fils;
      if (subjecte.classe === 'comunitat') {
        const orgId = entitat ? entitat.id : null;
        const comunitat = filDelSubjecte(estat, clau, 'comunitat')
          || deSubjecte('comunitat', { titol: clau.titol, orgId, imatgeUrl: entitat ? entitat.avatarUrl || null : null });
        const avisos = fillDeComunitat(estat, comunitat, 'canal', clau)
          || deSubjecte('canal', { titol: 'Avisos', orgId, comunitatId: comunitat.id });
        const general = fillDeComunitat(estat, comunitat, 'grup', clau)
          || deSubjecte('grup', { titol: 'General', comunitatId: comunitat.id });
        fils = [comunitat, avisos, general];
      } else {
        fils = [filDelSubjecte(estat, clau, 'grup') || deSubjecte('grup', { titol: clau.titol })];
      }
      const converses = fils.map((fil) => conversaDe(estat, fil, entraAlFil(estat, fil, jo), jo));
      return { filId: fils.at(-1).id, fils: converses };
    },

    /* Mateixa forma que l’RPC `membres_del_poble`: usuari_id, nom i fil_id si ja
       parleu, més el tipus (persona, entitat o ia) i l'avatar del padró. */
    async carregaMembres(text = null, config = {}) {
      const { estat, jo } = magatzem(config);
      const plega = value => String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
      const cerca = plega(text).trim();
      return estat.membres
        .filter((membre) => membre.usuariId !== jo && (!cerca || cerca.split(/\s+/).every(part => plega(membre.nom).includes(part))))
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

/** Per a les proves: oblida tots els magatzems i els canals, i les respostes de la IAIA en curs. */
export function reiniciaLocalXat() {
  magatzems.clear();
  subscriptors.clear();
  generacio += 1;
  respostesEnCurs.clear();
}

/** Per a les proves: espera que la IAIA haja contestat tot el que té pendent. */
export async function esperaLaIAIA() {
  while (respostesEnCurs.size) await Promise.all([...respostesEnCurs].map((torn) => torn.promesa));
}

export const localXat = createLocalXatAdapter();
