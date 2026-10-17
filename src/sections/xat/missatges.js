/**
 * missatges.js — Funcions pures de l'estat del Xat (F0: Fonament).
 *
 * Sense React ni xarxa. Tot el que es pot raonar i provar sense muntar res viu
 * ací: el mapeig del backend als objectes de la interfície, la fusió de
 * missatges per número d'ordre (`seq`), la derivació de l'estat d'enviament,
 * l'espera exponencial dels reintents, la suma de no llegits i l'agrupador de
 * marques de lectura. `XatContext.jsx` només orquestra.
 *
 * El generador d'identificadors viu ací i no s'importa de
 * `src/data/supabase/runtime.js`: la porta E1 de `tractor-enxufe.mjs` prohibix
 * a qualsevol mòdul fora de `src/data/supabase/` importar d'eixa carpeta.
 */

/** Mida de pàgina de l'historial: la que el servidor torna per defecte. */
export const LIMIT_PAGINA = 50;
/** Reintents automàtics d'un enviament amb error retriable (ARQ-H03). */
export const MAX_REINTENTS = 3;
/** Espera del primer reintent; es dobla a cada intent (1 s, 2 s, 4 s). */
export const MS_BASE_REINTENT = 1000;

const numero = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

/** `seq` d'un missatge com a número, o `null` si el servidor encara no l'ha posat. */
export function seqDe(missatge) {
  if (!missatge || missatge.seq == null) return null;
  const n = Number(missatge.seq);
  return Number.isFinite(n) ? n : null;
}

/* ───────────────────────────── Identificadors ───────────────────────────── */

/** UUID v4 generat al navegador per a la idempotència de l'enviament (ARQ-A02). */
export function generaId() {
  const cripto = globalThis.crypto;
  if (cripto?.randomUUID) return cripto.randomUUID();
  if (cripto?.getRandomValues) {
    const bytes = cripto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (lletra) => {
    const r = Math.floor(Math.random() * 16);
    return (lletra === 'x' ? r : (r & 3) | 8).toString(16);
  });
}

/* ─────────────────────────────── Mapeig ─────────────────────────────── */

/* Els rols que poden escriure a un canal («Avisos»). */
const ROLS_ADMIN = new Set(['propietari', 'admin']);

/** Una conversa està silenciada mentre la data de fi no haja passat. */
export function esSilenciat(finsAl, ara = Date.now()) {
  if (!finsAl) return false;
  const t = new Date(finsAl).getTime();
  return Number.isNaN(t) ? false : t > ara;
}

/**
 * De la `Conversa` del backend al `Fil` que llig la interfície.
 * Les hores es donen en ISO: la interfície les formata amb el `locale` de
 * `useUIState()` (XAT-P11); ací no es formata res.
 */
export function mapejaFil(fil, ara = Date.now()) {
  const altresNoms = Array.isArray(fil.altresNoms) ? fil.altresNoms : [];
  const nom = fil.titol || (altresNoms.length ? altresNoms.join(', ') : 'Conversa');
  const ultimSeq = numero(fil.ultimSeq);
  const llegitFinsSeq = numero(fil.llegitFinsSeq);
  const ultimText = fil.ultimText || '';
  const tipus = fil.tipus || 'directe';
  const rol = fil.rol || null;
  return {
    id: fil.id,
    tipus,
    /* T63.2 i T67 · La comunitat i el subjecte passen tal qual. Una
       'comunitat' és un contenidor sense missatges; el 'canal' («Avisos»)
       només l'escriuen els seus administradors; un fil de pàgina que encara
       no has escrit el llegixes com a visitant (`participant: false`). */
    comunitatId: fil.comunitatId ?? null,
    subjecte: fil.subjecte ?? null,
    /* Ordre del Mestre (261007) · La fila d'ajuda que el backend sintetitza
       ('javi' | 'iaia' des del Gauntlet 261016_1530; abans també
       'socdepoble', xatsPerDefecte.js): no és cap fil i XatSection
       l'obri per la seua via, mai amb obriFil. Null en una conversa de veres. */
    perDefecte: fil.perDefecte || null,
    esComunitat: tipus === 'comunitat',
    esCanal: tipus === 'canal',
    esGrup: tipus === 'grup',
    rol,
    potEscriure: tipus !== 'comunitat' && (tipus !== 'canal' || ROLS_ADMIN.has(rol)),
    participant: fil.participant !== false,
    participants: fil.participants == null ? null : numero(fil.participants),
    title: nom,
    name: nom,
    avatar_url: fil.imatgeUrl || null,
    altresNoms,
    /* Lògica d'Usuari · els altres amb id, nom, tipus i avatar (perfil públic);
       el canal d'una entitat i si s'hi actua en nom seu; i si l'altra part és
       la IAIA (T3), perquè la interfície ho diga en lloc de fer com si. */
    altres: Array.isArray(fil.altres) ? fil.altres : [],
    entitatId: fil.entitatId || null,
    entitatNom: fil.entitatNom || null,
    comEntitat: Boolean(fil.comEntitat),
    esIA: tipus === 'iaia',
    ultimText,
    ultimAl: fil.ultimAl || fil.actualitzatAl || null,
    ultimAutorId: fil.ultimAutorId || null,
    ultimSeq,
    llegitFinsSeq,
    llegitPelsAltresFinsSeq: numero(fil.llegitPelsAltresFinsSeq),
    noLlegits: fil.noLlegits != null
      ? Math.max(0, numero(fil.noLlegits))
      : Math.max(0, ultimSeq - llegitFinsSeq),
    arxivat: Boolean(fil.arxivatAl),
    fixat: Boolean(fil.fixatAl),
    silenciat: esSilenciat(fil.silenciatFinsAl, ara),
    preferit: Boolean(fil.preferitAl),
    noLlegitManual: Boolean(fil.noLlegitManual),
    searchText: `${nom} ${ultimText}`.toLowerCase()
  };
}

/** Del `Missatge` del backend a la bombolla. `joId` decidix el costat. */
export function mapejaMissatge(m, joId) {
  const meu = Boolean(joId) && m.usuariId === joId;
  return {
    id: m.id,
    threadId: m.filId,
    seq: seqDe(m),
    usuariId: m.usuariId,
    text: m.text ?? '',
    tipus: m.tipus || 'text',
    sender: meu ? 'me' : 'other',
    author: meu ? 'Jo' : (m.autorNom || 'Veí'),
    is_ai: Boolean(m.esIA),
    /* Escrit en nom d'una entitat (T2): el nom que es pinta és el de l'entitat. */
    comEntitat: Boolean(m.comOrgId),
    creatAl: m.creatAl || null,
    respostaA: m.respostaA || null,
    esborrat: Boolean(m.esborratAl),
    metadades: m.metadades || {},
    estatEnviament: 'enviat',
    error: null
  };
}

/* ─────────────────────────── Fusió per seq ─────────────────────────── */

function comparaData(a, b) {
  const ta = a.creatAl ? new Date(a.creatAl).getTime() : 0;
  const tb = b.creatAl ? new Date(b.creatAl).getTime() : 0;
  return (Number.isNaN(ta) ? 0 : ta) - (Number.isNaN(tb) ? 0 : tb);
}

function comparaSeq(a, b) {
  const sa = seqDe(a);
  const sb = seqDe(b);
  if (sa == null && sb == null) return comparaData(a, b);
  if (sa == null) return 1;
  if (sb == null) return -1;
  return sa - sb;
}

/**
 * Fusiona dos llistes de missatges sense duplicats (per `id`) i les ordena per
 * `seq` ascendent. El que arriba després guanya camp a camp; els missatges
 * sense `seq` (encara no confirmats) van al final, per data.
 */
export function fusionaPerSeq(existents, nous) {
  const perId = new Map();
  for (const m of existents || []) perId.set(m.id, m);
  for (const m of nous || []) perId.set(m.id, perId.has(m.id) ? { ...perId.get(m.id), ...m } : m);
  return [...perId.values()].sort(comparaSeq);
}

export function seqMaxim(missatges) {
  let max = null;
  for (const m of missatges || []) {
    const s = seqDe(m);
    if (s != null && (max == null || s > max)) max = s;
  }
  return max;
}

export function seqMinim(missatges) {
  let min = null;
  for (const m of missatges || []) {
    const s = seqDe(m);
    if (s != null && (min == null || s < min)) min = s;
  }
  return min;
}

/* ─────────────────────── Estat d'enviament (XAT-C) ─────────────────────── */

/**
 * `pendent` (XAT-C01) mentre no hi ha `seq`; `enviat` (XAT-C02) quan el
 * servidor l'ha numerat; `llegit` (XAT-C04) quan els altres membres han
 * llegit fins a eixe `seq`; `error` (XAT-C10) es conserva tal com ve.
 *
 * No hi ha «entregat» (les dos marques grises habituals): el `rebut_fins_seq`
 * que torna el port és el rebut PROPI (jo.rebut_fins_seq a xat_fils_meus,
 * meu.rebutFinsSeq a localXat.js), no el dels altres. Fins que el contracte
 * no porte un rebut dels altres explícit, pintar-lo seria mentir (auditoria
 * de Codex 2150, ronda C3; torn 260930).
 */
export function derivaEstat(m, llegitPelsAltresFinsSeq) {
  if (m.estatEnviament === 'pendent' || m.estatEnviament === 'error') return m.estatEnviament;
  if (m.sender !== 'me') return 'enviat';
  const s = seqDe(m);
  if (s == null) return 'pendent';
  return s <= numero(llegitPelsAltresFinsSeq) ? 'llegit' : 'enviat';
}

/**
 * L'estat de l'últim missatge d'un fil per a la previsualització de la llista:
 * només si és meu (el patró de missatgeria no posa marques als missatges dels
 * altres).
 */
export function estatDeLUltim(fil, joId) {
  if (!fil || !joId || fil.ultimAutorId !== joId || !fil.ultimSeq) return null;
  return derivaEstat({ sender: 'me', seq: fil.ultimSeq }, fil.llegitPelsAltresFinsSeq);
}

/** Missatges del servidor (per `seq`) amb l'estat derivat i, al final, els pendents i fallits. */
export function combinaMissatges(servidor, pendents, llegitPelsAltresFinsSeq) {
  const derivats = (servidor || []).map((m) => {
    const estat = derivaEstat(m, llegitPelsAltresFinsSeq);
    return estat === m.estatEnviament ? m : { ...m, estatEnviament: estat };
  });
  return pendents && pendents.length ? [...derivats, ...pendents] : derivats;
}

/* ─────────────────────────── No llegits ─────────────────────────── */

/** Suma dels no llegits de les converses que ni estan silenciades ni arxivades. */
export function sumaNoLlegits(fils) {
  return (fils || []).reduce((total, f) => (f.silenciat || f.arxivat ? total : total + Math.max(0, numero(f.noLlegits))), 0);
}

/* ─────────────────── Comunitats i contactes (T67, T68) ─────────────────── */

/* Instant d'activitat d'un fil, per a ordenar: l'últim missatge o, si no n'hi
   ha, l'última actualització. Una data il·legible compta com la més antiga. */
function instantDe(fil) {
  const t = new Date(fil?.ultimAl || fil?.actualitzatAl || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

const perActivitat = (a, b) => instantDe(b) - instantDe(a);

/**
 * Les comunitats amb els seus fills: «Avisos» (el canal) primer i després els
 * grups per activitat. Els no llegits són la suma dels fills i `ultimAl` el
 * més recent d'ells. La comunitat no té missatges propis: el que compta és
 * dels fills. Un fill sense la seua comunitat a la llista no hi apareix (es
 * queda a la llista de converses). Les comunitats, per activitat.
 */
export function agrupaComunitats(fils) {
  const llista = Array.isArray(fils) ? fils : [];
  const fillsPer = new Map();
  for (const f of llista) {
    if (!f?.comunitatId || f.tipus === 'comunitat') continue;
    const clau = String(f.comunitatId);
    if (!fillsPer.has(clau)) fillsPer.set(clau, []);
    fillsPer.get(clau).push(f);
  }
  return llista
    .filter((f) => f?.tipus === 'comunitat')
    .map((fil) => {
      const fills = [...(fillsPer.get(String(fil.id)) || [])].sort((a, b) => {
        if ((a.tipus === 'canal') !== (b.tipus === 'canal')) return a.tipus === 'canal' ? -1 : 1;
        return perActivitat(a, b);
      });
      const noLlegits = fills.reduce((total, f) => total + Math.max(0, numero(f.noLlegits)), 0);
      const recent = fills.reduce((millor, f) => (instantDe(f) > instantDe(millor) ? f : millor), null);
      return { fil, fills, noLlegits, ultimAl: recent ? recent.ultimAl || recent.actualitzatAl || null : null };
    })
    .sort((a, b) => instantDe({ ultimAl: b.ultimAl }) - instantDe({ ultimAl: a.ultimAl }) || perActivitat(a.fil, b.fil));
}

/* L'identificador d'una fila del padró: 'usuari_id' (servidor), 'usuariId'
   (llavor) o 'id'. */
const idDeMembre = (membre) => String(membre?.usuari_id ?? membre?.usuariId ?? membre?.id ?? '');

/**
 * Fins a `n` persones del padró amb qui hi ha una conversa 'directe', de la
 * més recent a la més antiga, sense una mateixa i sense repetir-ne cap. Torna
 * files amb la forma del padró (usuari_id, nom, tipus, avatar_url, fil_id).
 * Si `membres` és una llista, només hi entren les persones que encara són al
 * padró i se'n prenen les dades; si és null, les dades són les del fil.
 */
export function contactesFrequents(fils, membres, joId, n = 5) {
  const limit = Math.max(0, Math.floor(numero(n)));
  if (!limit) return [];
  const padro = Array.isArray(membres) ? new Map(membres.map((m) => [idDeMembre(m), m])) : null;
  const jo = joId == null ? '' : String(joId);
  const vistos = new Set();
  const resultat = [];
  const directes = (Array.isArray(fils) ? fils : []).filter((f) => f?.tipus === 'directe').sort(perActivitat);
  for (const fil of directes) {
    const altre = Array.isArray(fil.altres) ? fil.altres.find((a) => a?.id != null && String(a.id) !== jo) : null;
    const id = altre ? String(altre.id) : '';
    if (!id || vistos.has(id)) continue;
    if (padro && !padro.has(id)) continue;
    vistos.add(id);
    const membre = padro?.get(id);
    resultat.push({
      usuari_id: id,
      nom: membre?.nom ?? altre.nom ?? '',
      tipus: membre?.tipus ?? altre.tipus ?? 'persona',
      avatar_url: membre?.avatar_url ?? membre?.avatarUrl ?? altre.avatarUrl ?? null,
      fil_id: fil.id
    });
    if (resultat.length >= limit) break;
  }
  return resultat;
}

/* Auditoria 261007 (B) · Dos valors d'un Fil són iguals si són el mateix o, per
   als que l'adaptador torna nous a cada crida (`altres`, `altresNoms`,
   `subjecte`), si tenen el mateix contingut. */
function valorsIguals(a, b) {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Auditoria 261007 (B) · Cert si dos Fils JA mapejats (mapejaFil) diuen el
 * mateix, camp a camp. Es comparen els mapejats i no la fila del backend:
 * `silenciat` depén de l'hora (`esSilenciat`), i és el sondeig qui fa caducar
 * un silenci encara que el servidor torne la mateixa fila.
 */
export function filIgual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const claus = Object.keys(a);
  if (claus.length !== Object.keys(b).length) return false;
  return claus.every((clau) => Object.hasOwn(b, clau) && valorsIguals(a[clau], b[clau]));
}

/**
 * Auditoria 261007 (B) · Cert si dos llistes de Fils són equivalents: la
 * mateixa llargària, el mateix ordre i cada fil igual (filIgual). El sondeig
 * de la llista no crida setFils si no ha canviat res: cap derivat (comunitats,
 * missatges, cerca) no es torna a calcular cada 25 s per a res.
 */
export function filsEquivalents(previs, nous) {
  if (previs === nous) return true;
  if (!Array.isArray(previs) || !Array.isArray(nous) || previs.length !== nous.length) return false;
  return nous.every((fil, i) => filIgual(previs[i], fil));
}

/**
 * Marca local de lectura: `llegitFinsSeq` mai retrocedix i els no llegits
 * baixen abans que el servidor confirme (XAT-C08). Torna el mateix objecte si
 * no hi ha res que canviar.
 */
export function aplicaMarcaLocal(fil, seq) {
  const actual = numero(fil.llegitFinsSeq);
  const llegitFinsSeq = Math.max(actual, numero(seq));
  if (llegitFinsSeq === actual) return fil;
  const noLlegits = Math.min(numero(fil.noLlegits), Math.max(0, numero(fil.ultimSeq) - llegitFinsSeq));
  return { ...fil, llegitFinsSeq, noLlegits };
}

/** Actualitza la fila de la llista amb l'últim missatge propi confirmat pel servidor. */
export function actualitzaFilAmbMissatge(fil, m) {
  const s = seqDe(m);
  const ultimSeq = s == null ? numero(fil.ultimSeq) : Math.max(numero(fil.ultimSeq), s);
  const ultimText = m.text ?? '';
  return {
    ...fil,
    ultimText,
    ultimAl: m.creatAl || fil.ultimAl,
    ultimAutorId: m.usuariId || fil.ultimAutorId,
    ultimSeq,
    searchText: `${fil.name} ${ultimText}`.toLowerCase()
  };
}

/* ─────────────────────── Reintents (ARQ-H03) ─────────────────────── */

/**
 * Espera abans del reintent `intent` (0, 1, 2…): 1 s, 2 s, 4 s… més un
 * component aleatori de fins a la mitat de la base, perquè dos navegadors que
 * han perdut la xarxa alhora no tornen a picar el servidor al mateix instant.
 */
export function esperaReintent(intent, aleatori = Math.random(), base = MS_BASE_REINTENT) {
  const fixa = base * 2 ** Math.max(0, numero(intent));
  const fraccio = Math.min(Math.max(numero(aleatori), 0), 0.999999);
  return fixa + Math.floor(fraccio * (fixa / 2));
}

/* ──────────────────────── Pendents i fallits ──────────────────────── */

export function afigPendent(mapa, filId, missatge) {
  return { ...mapa, [filId]: [...(mapa[filId] || []), missatge] };
}

export function trobaPendent(mapa, id) {
  for (const [filId, llista] of Object.entries(mapa || {})) {
    const missatge = llista.find((m) => m.id === id);
    if (missatge) return { filId, missatge };
  }
  return null;
}

export function retiraPendent(mapa, id) {
  let canviat = false;
  const nou = {};
  for (const [filId, llista] of Object.entries(mapa || {})) {
    const filtrada = llista.filter((m) => m.id !== id);
    if (filtrada.length !== llista.length) canviat = true;
    if (filtrada.length) nou[filId] = filtrada;
  }
  return canviat ? nou : mapa;
}

export function actualitzaPendent(mapa, id, canvis) {
  const trobat = trobaPendent(mapa, id);
  if (!trobat) return mapa;
  return {
    ...mapa,
    [trobat.filId]: mapa[trobat.filId].map((m) => (m.id === id ? { ...m, ...canvis } : m))
  };
}

/** Retira els pendents que el servidor ja ha tornat amb el mateix `id`. */
export function retiraConfirmats(mapa, filId, confirmats) {
  const llista = mapa?.[filId];
  if (!llista || !llista.length) return mapa;
  const ids = new Set((confirmats || []).map((m) => m.id));
  const filtrada = llista.filter((m) => !ids.has(m.id));
  if (filtrada.length === llista.length) return mapa;
  const nou = { ...mapa };
  if (filtrada.length) nou[filId] = filtrada;
  else delete nou[filId];
  return nou;
}

/**
 * Decisió 1 del Mestre (261007) · «Bombolles del xat: S'HAN DE CONSERVAR».
 * Una renovació del JWT avorta els enviaments en vol: les bombolles que encara
 * eren `pendent` passen a `error`, amb el text, la cita i l'id intactes, perquè
 * «Torna-ho a provar» les reenvie amb el MATEIX id (el servidor és idempotent
 * per id: conformitat/kit.js, «enviaMissatge amb un id ja enviat torna el
 * mateix missatge»). L'error és null: la bombolla diu el «No s'ha enviat» de
 * sempre (section.xat.missatge.noEnviat), traduït. Les que ja eren en `error`
 * es queden tal com estaven. Torna el mateix mapa si no n'hi havia cap en vol.
 */
export function interromEnviaments(mapa) {
  let canviat = false;
  const nou = {};
  for (const [filId, llista] of Object.entries(mapa || {})) {
    if (!llista.some((m) => m.estatEnviament === 'pendent')) {
      nou[filId] = llista;
      continue;
    }
    canviat = true;
    nou[filId] = llista.map((m) => (m.estatEnviament === 'pendent' ? { ...m, estatEnviament: 'error', error: null } : m));
  }
  return canviat ? nou : mapa;
}

/* ─────────────────── Agrupador de marques (XAT-C08) ─────────────────── */

/**
 * Agrupa les crides a `marcaVist` per conversa: una escriptura com a màxim
 * cada `esperaMs`, sempre amb el `seq` més alt vist, i mai cap arrere (ni per
 * davall del que ja s'ha confirmat, ni del que és en vol, ni del que està
 * pendent d'enviar).
 * `temps` s'injecta a les proves; per defecte són els temporitzadors globals.
 *
 * Auditoria 261007 (B) · Una marca no es dona per enviada fins que `envia`
 * resol. Abans es consolidava en eixir: si la xarxa fallava, el sondeig
 * tornava els no llegits del servidor i l'agrupador rebutjava per sempre la
 * mateixa marca (la pastilla no s'apagava fins a un missatge nou). Ara la
 * marca en vol (`enVol`) passa a confirmada (`enviats`, que mai baixa) si
 * `envia` resol, i s'oblida si rebutja: la lectura següent la torna a enviar.
 * `cancela` canvia de generació: una resposta tardana de l'àmbit anterior no
 * escriu res en el nou.
 */
export function creaAgrupadorMarques(envia, esperaMs = 2000, temps = globalThis) {
  const pendents = new Map();
  const enVol = new Map();
  const enviats = new Map();
  const temporitzadors = new Map();
  let generacio = 0;

  const fins = (mapa, filId) => mapa.get(filId) ?? 0;
  /* El que ja no cal tornar a enviar: confirmat o en vol. */
  const cobert = (filId) => Math.max(fins(enviats, filId), fins(enVol, filId));

  const buida = (filId) => {
    temporitzadors.delete(filId);
    const seq = pendents.get(filId);
    pendents.delete(filId);
    if (seq == null || seq <= cobert(filId)) return;
    enVol.set(filId, seq);
    const meua = generacio;
    const oblida = () => { if (enVol.get(filId) === seq) enVol.delete(filId); };
    let promesa;
    try {
      promesa = Promise.resolve(envia(filId, seq));
    } catch (error) {
      promesa = Promise.reject(error);
    }
    promesa.then(() => {
      if (meua !== generacio) return;
      enviats.set(filId, Math.max(fins(enviats, filId), seq));
      oblida();
    }, () => {
      if (meua !== generacio) return;
      oblida();
    });
  };

  return {
    marca(filId, seq) {
      const s = numero(seq);
      if (!filId || s <= 0) return false;
      if (s <= cobert(filId) || s <= fins(pendents, filId)) return false;
      pendents.set(filId, s);
      if (!temporitzadors.has(filId)) temporitzadors.set(filId, temps.setTimeout(() => buida(filId), esperaMs));
      return true;
    },
    /**
     * Auditoria 261007 (B) · El `seq` fins al qual la interfície ja ha marcat
     * la lectura: pendent, en vol o confirmada. El sondeig de la llista
     * l'aplica als fils del servidor perquè una resposta que ha eixit abans de
     * la marca no torne a encendre la pastilla. És l'únic accessor: l'antic
     * `enviatFins` (confirmada o en vol) no el cridava ningú fora de les
     * proves, que ara llegixen este després de buidar el temporitzador.
     */
    marcatFins(filId) {
      return Math.max(cobert(filId), fins(pendents, filId));
    },
    cancela() {
      generacio += 1;
      for (const t of temporitzadors.values()) temps.clearTimeout(t);
      temporitzadors.clear();
      pendents.clear();
      enVol.clear();
      enviats.clear();
    }
  };
}
