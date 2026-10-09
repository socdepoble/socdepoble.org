/**
 * @module supabase/xat
 * @description Adaptador del Xat (F0): escriptura només per RPC idempotent,
 *   historial per cursor de `seq`, marques de rebut i llegit, i avisos per
 *   canal privat de Realtime. Quan `runtimeDataMode !== 'remote'` delega al
 *   magatzem en memòria `localXat` (mode seed).
 * @contract Noms del nucli intactes; signatures ampliades de manera compatible.
 *   - loadFils(config) → Conversa[]. En remot, a la cua, les files d'ajuda
 *     que encara falten (Conversa.perDefecte, xatsPerDefecte.js): no són fils
 *     del servidor i el seu id no és cap UUID.
 *   - loadMissatges(filId, config { abansDeSeq | despresDeSeq, limit }) → Missatge[] per `seq` ascendent
 *   - enviaMissatge(filId, cos | { id, text, tipus, respostaA, metadades }, config) → Missatge
 *   - marcaLlegit(filId, config { llegitFinsSeq, rebutFinsSeq }) → { llegitFinsSeq, rebutFinsSeq }
 *   - creaFilDirecte(altreUsuariId, titol, config) → filId. En remot,
 *     altreUsuariId ha de ser un UUID (crea_fil_directe, p_altre_usuari uuid):
 *     la resta es rebutja abans de cap crida amb `code: 'DESTINATARI_INVALID'`
 *     (W4-10). La interfície no ho comprova: és una regla d'este proveïdor.
 *   - carregaMembres(text, config) → { usuari_id, nom, fil_id }[]
 *   - subscribeToXat(filId, callback, config) → { subscription, error }
 *   - unsubscribeFromXat(subscription, config)
 *   Capacitat opcional 'xatDePagina' (T63.2 i T67, migració 2609282100):
 *   - obriFilDePagina(objecte, config) → { filId, fils: Conversa[] } o null si
 *     el subjecte no té xat. El servidor NO fa participant a qui l'obri: els
 *     fils que encara no has escrit tornen amb `participant: false`.
 *   - Per a un d'eixos fils, `config.visitant` fa que loadMissatges el llija
 *     sense ser-ne participant (xat_llig_fil_de_pagina) i que enviaMissatge hi
 *     entre abans del primer missatge (xat_entra_al_fil_de_pagina).
 *   - Sense la migració, la funció no existix (PGRST202 o 404) i es rebutja
 *     amb `codi: 'sense-capacitat'`. L'absència es recorda per node i poble
 *     fins que es torna a carregar la pàgina: les crides següents ja no van
 *     al servidor (reiniciaMemoriaXatDePagina, per a les proves).
 * @errors Tot error llançat porta `code` i `retriable`. El text del servidor es
 *   conserva quan comença per `SDP-XAT-`; xarxa, temps d'espera i cancel·lació
 *   són reintentables, els codis SDP no (llevat de SDP-XAT-429, el límit de
 *   missatges, que es buida als 5 s). Excepció: els codis de
 *   MISSATGES_SDP_HUMANS porten un text per a la persona (el `code` no
 *   canvia i el text del servidor queda a `cause`).
 */

import { getClient } from './config.js';
import { usuariDeSessio } from '../identitat.js';
import { subjecteDeXat } from '../contracte.js';
import { ambXatsPerDefecte, vestixLaIAIA } from '../xatsPerDefecte.js';
import { generateUUID, getResolvedConfig } from './runtime.js';
import { handleError } from './utils.js';

const LIMIT_PER_DEFECTE = 50;
const LIMIT_MAXIM = 100;
const TEXT_MAXIM = 4096;
const RE_CODI_SDP = /SDP-XAT-\d{3}/;
/* W4-10 · Les persones i les entitats de Supabase són UUID (2609272200_xat_entitats.sql). */
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CATEGORIES_CONEGUDES = new Set(['SESSIO_CADUCADA', 'NO_TROBAT', 'DUPLICAT', 'SENSE_PERMIS', 'XARXA']);
const channelOwners = new WeakMap();

function comprovaSenyal(config) {
  if (config.signal?.aborted) throw new DOMException('Operació cancel·lada', 'AbortError');
}
function ambSenyal(query, config) {
  comprovaSenyal(config);
  return config.signal ? query.abortSignal(config.signal) : query;
}

/* ─────────────────────────────── Errors ─────────────────────────────── */

const jaNormalitzat = (error) => error instanceof Error && Object.hasOwn(error, 'retriable');
const errorLocal = (missatge, code, retriable = false) => Object.assign(new Error(missatge), { code, retriable });

/* B03 (migració 2610081543_xat_consentiment_i_metadades.sql) · Els codis SDP
   que arriben a la persona tal qual (XatSection pinta error.message al toast
   i al diàleg «Nova conversa») i que no li han de mostrar el codi cru.
   SDP-XAT-016: crea_fil_directe no obri un directe NOU amb una persona sense
   consentiment RGPD. El text no diu el motiu: el consentiment de l'altra
   persona és seu. En valencià, com la resta de textos d'este adaptador, que
   no coneix la llengua: és la reserva de la clau
   'section.xat.error.noDisponible' d'i18n.js (cinc llengües), que la
   interfície ha de traduir pel `code` (i18n.claus.test.js comprova que els
   dos textos coincidixen). No s'exporta: index.js reexporta tot xat.js com a
   part del backend.
   Onada 6 (xat per als beta testers) · Tres codis més que una persona es pot
   trobar el primer dia, amb la seua clau d'i18n (section.xat.error.*):
   SDP-XAT-003 (encara no consta com a membre del poble: noMembre), SDP-XAT-013
   (la pàgina no existix o no la pot vore: paginaNoVisible) i SDP-XAT-429 (el
   límit de 15 missatges cada 5 s de 2609080200: massaMissatges). */
const MISSATGES_SDP_HUMANS = Object.freeze({
  'SDP-XAT-003': 'Encara no consta que sigues d’este poble, i el xat és per a la gent del poble. Prova d’eixir i tornar a entrar.',
  'SDP-XAT-013': 'Esta pàgina ja no existix o no la pots vore.',
  'SDP-XAT-016': 'Esta persona no està disponible al xat.',
  'SDP-XAT-429': 'Has enviat molts missatges en poc de temps. Espera uns segons i torna-ho a provar.'
});

/* Onada 6 · L'únic codi SDP que es pot tornar a provar: el límit de
   missatges es buida als 5 s, i els reintents de XatContext (1, 2 i 4 s) ja
   hi arriben. La resta de codis SDP són definitius. */
const CODIS_SDP_REINTENTABLES = new Set(['SDP-XAT-429']);

/* Auditoria 261007 (B) · El text d'un fetch que no ha arribat al servidor
   (Chrome, Firefox, Safari i React Native), com RE_FETCH d'errorsBackend.js.
   SENSE àncores: postgrest-js no llança el TypeError, el torna com a objecte
   pla amb el nom davant ('TypeError: Load failed'). */
const RE_FETCH = /Failed to fetch|NetworkError|Load failed|Network request failed/i;

/**
 * Auditoria 261007 (B) · postgrest-js torna `{ data, error, status }` i deixa
 * l'estat HTTP a la RESPOSTA, no a l'error (0 si el fetch ha fallat, 5xx si
 * la passarel·la o el servidor han caigut). Sense eixe estat, errorDeXat no
 * sabia que eren reintentables i el missatge fallava a la primera. Es copia
 * a l'error només si l'error no en porta cap.
 */
function ambEstat(error, status) {
  if (error && typeof error === 'object' && error.status == null && Number.isFinite(status)) error.status = status;
  return error;
}

/**
 * Converteix qualsevol fallada en un Error amb `code` i `retriable`.
 * `handleError` no torna `message` (torna `error` i `details`), per això el
 * text del servidor es llig directament de l'error original.
 * Auditoria 261007 (B) · Amb el senyal de la crida ja avortat, la fallada és
 * una cancel·lació (AbortError), com promet la capçalera, encara que
 * postgrest-js l'haja tornada com un objecte pla amb estat 0.
 */
function errorDeXat(error, perDefecte, config = {}) {
  if (jaNormalitzat(error)) return error;
  const nom = error?.name;
  if (nom === 'AbortError' || nom === 'TimeoutError') {
    return Object.assign(new Error(error.message || perDefecte), { name: nom, code: nom, retriable: true, cause: error });
  }
  if (config.signal?.aborted) {
    return Object.assign(new Error('Operació cancel·lada'), { name: 'AbortError', code: 'AbortError', retriable: true, cause: error });
  }
  const text = String(error?.message || '');
  const codiSdp = RE_CODI_SDP.exec(text)?.[0];
  if (codiSdp) {
    const huma = Object.hasOwn(MISSATGES_SDP_HUMANS, codiSdp) ? MISSATGES_SDP_HUMANS[codiSdp] : text;
    return Object.assign(new Error(huma), { code: codiSdp, retriable: CODIS_SDP_REINTENTABLES.has(codiSdp), cause: error });
  }
  if (/PGRST20[25]/.test(`${error?.code ?? ''} ${text}`)) {
    return Object.assign(new Error('L’esquema del xat no està aplicat: cal executar la migració 2609270200_xat_f0_fonament.sql.'),
      { code: 'ESQUEMA', retriable: false, cause: error });
  }
  const detall = handleError(error);
  const categoria = CATEGORIES_CONEGUDES.has(detall?.error) ? detall.error : 'XAT';
  const retriable = categoria === 'XARXA' || error instanceof TypeError || error?.status === 0
    || Number(error?.status) >= 500 || RE_FETCH.test(text);
  const missatge = categoria === 'XAT' ? perDefecte : detall.details?.message || perDefecte;
  return Object.assign(new Error(missatge), { code: categoria, retriable, cause: error });
}

/* ─────────────────────────────── Mode seed ─────────────────────────────── */

async function local(config) {
  if (getResolvedConfig(config).runtimeDataMode === 'remote') return null;
  const { localXat } = await import('../localXat.js');
  return localXat;
}

/* ─────────────────────────────── Mapeig ─────────────────────────────── */

const numero = (valor) => (valor === null || valor === undefined ? null : Number(valor));

/* T63.2 · El subjecte d'un fil de pàgina: ja format (llavor) o de les columnes
   subjecte_* del servidor. La URI canònica només hi és si el node en té. */
function subjecteDeFila(f) {
  if (f.subjecte && typeof f.subjecte === 'object') return f.subjecte;
  if (!f.subjecte_tipus || f.subjecte_id === null || f.subjecte_id === undefined) return null;
  return {
    tipus: f.subjecte_tipus, id: String(f.subjecte_id), ruta: f.subjecte_ruta ?? null, titol: f.subjecte_titol ?? null,
    ...(f.subjecte_uri ? { uri: f.subjecte_uri } : {})
  };
}

const mapejaFil = (f) => ({
  id: f.id,
  tipus: f.tipus || 'directe',
  titol: f.titol ?? null,
  altresNoms: Array.isArray(f.altres_noms) ? f.altres_noms : [],
  /* Lògica d'Usuari · qui són els altres (id, nom, tipus, avatar) i si el fil
     és el canal d'una entitat. xat_fils_meus v2 encara no ho torna: buit i
     null fins a la migració del directori; el magatzem local ja ho omple. */
  altres: Array.isArray(f.altres) ? f.altres : [],
  entitatId: f.entitatId ?? f.org_id ?? null,
  entitatNom: f.entitatNom ?? f.entitat_nom ?? null,
  comEntitat: Boolean(f.comEntitat ?? f.com_entitat),
  imatgeUrl: f.imatge_url ?? f.imatgeUrl ?? null,
  actualitzatAl: f.actualitzat_al ?? null,
  ultimText: f.ultim_text ?? null,
  ultimAl: f.ultim_al ?? null,
  ultimAutorId: f.ultim_autor_id ?? null,
  ultimSeq: numero(f.ultim_seq) ?? 0,
  llegitFinsSeq: numero(f.llegit_fins_seq) ?? 0,
  rebutFinsSeq: numero(f.rebut_fins_seq) ?? 0,
  llegitPelsAltresFinsSeq: numero(f.llegit_pels_altres_fins_seq) ?? 0,
  noLlegits: numero(f.no_llegits) ?? 0,
  arxivatAl: f.arxivat_al ?? null,
  fixatAl: f.fixat_al ?? null,
  silenciatFinsAl: f.silenciat_fins_al ?? null,
  preferitAl: f.preferit_al ?? null,
  noLlegitManual: Boolean(f.no_llegit_manual),
  /* Contracte del Xat §2 · la comunitat i el subjecte, tal qual. */
  comunitatId: f.comunitat_id ?? f.comunitatId ?? null,
  subjecte: subjecteDeFila(f),
  /* Només les files noves (xat_fils_meus de 2609282100 i obri_fil_de_pagina)
     porten el rol, el recompte i si ja hi participes: si no hi són, no s'escriuen. */
  ...(f.rol !== null && f.rol !== undefined ? { rol: f.rol } : {}),
  ...(f.participants !== null && f.participants !== undefined ? { participants: numero(f.participants) } : {}),
  ...(typeof f.participant === 'boolean' ? { participant: f.participant } : {})
});

/* Les RPC tornen id, usuari_id, autor_nom, cos, tipus, seq, resposta_a, editat_al, esborrat_al, metadades, es_ia, creat_al. */
const mapejaMissatge = (m, filId) => ({
  id: m.id,
  filId: m.fil_id ?? filId,
  seq: numero(m.seq),
  usuariId: m.usuari_id,
  autorNom: m.autor_nom ?? null,
  text: m.cos ?? null,
  tipus: m.tipus || 'text',
  respostaA: m.resposta_a ?? null,
  editatAl: m.editat_al ?? null,
  esborratAl: m.esborrat_al ?? null,
  metadades: m.metadades && typeof m.metadades === 'object' ? m.metadades : {},
  esIA: Boolean(m.es_ia),
  comOrgId: m.com_org_id ?? null,
  creatAl: m.creat_al
});

/* `cos` pot ser una cadena (content.js) o un objecte amb `id` per a la idempotència. */
function normalitzaCos(cos) {
  const entrada = cos !== null && typeof cos === 'object' ? cos : { text: cos };
  /* El servidor retalla els extrems (btrim): ací igual, perquè el que es pinta siga el que es guarda. */
  const text = entrada.text === null || entrada.text === undefined ? null : String(entrada.text).trim();
  const tipus = typeof entrada.tipus === 'string' && entrada.tipus ? entrada.tipus : 'text';
  /* En F0 el client només envia text; la resta de tipus són del servidor (xat_envia). */
  if (tipus !== 'text') throw errorLocal('SDP-XAT-010: tipus de missatge no admés des del client.', 'SDP-XAT-010');
  if (!text) throw errorLocal('SDP-XAT-007: missatge buit o massa llarg.', 'SDP-XAT-007');
  if (text.length > TEXT_MAXIM) throw errorLocal('SDP-XAT-007: missatge buit o massa llarg.', 'SDP-XAT-007');
  return {
    id: typeof entrada.id === 'string' && entrada.id ? entrada.id : generateUUID(),
    text,
    tipus,
    respostaA: entrada.respostaA ?? null,
    metadades: entrada.metadades && typeof entrada.metadades === 'object' ? entrada.metadades : {}
  };
}

function opcionsDePagina(config) {
  const limit = config.limit ?? LIMIT_PER_DEFECTE;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > LIMIT_MAXIM) {
    throw errorLocal(`SDP-XAT-009: el límit ha d’estar entre 1 i ${LIMIT_MAXIM}.`, 'SDP-XAT-009');
  }
  /* Mateixos límits que xat_historial (abans ≥ 1) i xat_nous (després ≥ 0). */
  const cursor = (valor, minim) => {
    if (valor === null || valor === undefined) return null;
    const n = Number(valor);
    if (!Number.isSafeInteger(n) || n < minim) throw errorLocal('SDP-XAT-009: cursor o límit invàlid.', 'SDP-XAT-009');
    return n;
  };
  return { abansDeSeq: cursor(config.abansDeSeq, 1), despresDeSeq: cursor(config.despresDeSeq, 0), limit };
}

const primeraFila = (data) => (Array.isArray(data) ? data[0] : data) || null;

/* ─────────────────────────────── Temps real ─────────────────────────────── */

/**
 * Canal privat `xat:f:<filId>`. El servidor només avisa («hi ha missatges nous
 * a partir del seq X»); les dades es demanen amb `loadMissatges({ despresDeSeq })`.
 * Si el canal falla, `callback(error, null)` i el context continua amb el sondeig.
 */
export const subscribeToXat = async (filId, callback, config = {}) => {
  const viu = () => !config.signal?.aborted;
  try {
    comprovaSenyal(config);
    const seed = await local(config);
    if (seed) return seed.subscribeToXat(filId, callback, config);
    const supabase = await getClient(config);
    comprovaSenyal(config);
    let avisat = false;
    const channel = supabase
      .channel(`xat:f:${filId}`, { config: { private: true, broadcast: { self: false } } })
      .on('broadcast', { event: 'nous' }, (missatge) => {
        if (!viu()) return;
        const seq = numero(missatge?.payload?.seq);
        callback(null, { tipus: 'nous', filId, seq: Number.isFinite(seq) ? seq : null });
      })
      .subscribe((estat, error) => {
        if (!viu() || avisat || (estat !== 'CHANNEL_ERROR' && estat !== 'TIMED_OUT')) return;
        avisat = true;
        callback(errorDeXat(error || new Error(`El canal del xat ha quedat en estat ${estat}.`), 'No s’ha pogut obrir el canal del xat.'), null);
      });
    channelOwners.set(channel, supabase);
    return { subscription: channel, error: null };
  } catch (error) {
    const normalitzat = errorDeXat(error, 'No s’ha pogut obrir el canal del xat.', config);
    if (viu()) callback(normalitzat, null);
    return { subscription: null, error: normalitzat };
  }
};

/* Un canal remot es tanca amb el client que el va obrir. La resta (el canal del
   magatzem local en seed) no és de Supabase: va al magatzem i no crea cap client. */
export const unsubscribeFromXat = async (subscription, config = {}) => {
  if (!subscription) return;
  const propietari = channelOwners.get(subscription);
  if (!propietari) {
    await (await local(config))?.unsubscribeFromXat(subscription);
    return;
  }
  channelOwners.delete(subscription);
  await propietari.removeChannel(subscription);
};

/* ─────────────────────────────── Missatges ─────────────────────────────── */

export const enviaMissatge = async (filId, cos, config = {}) => {
  try {
    comprovaSenyal(config);
    const user = usuariDeSessio();
    const seed = await local(config);
    if (seed) return seed.enviaMissatge(filId, normalitzaCos(cos), config);
    if (!user) throw errorLocal('Cal iniciar sessió per a escriure al xat.', 'SESSIO');
    const entrada = normalitzaCos(cos);
    const supabase = await getClient(config);
    comprovaSenyal(config);
    if (usuariDeSessio()?.id !== user.id) throw errorLocal('La sessió ha canviat.', 'SESSIO');

    /* T63.2 · En un fil de pàgina que encara llegixes com a visitant, escriure
       és entrar-hi: l'alta és idempotent i la valida el servidor. */
    if (config.visitant) {
      const alta = await ambSenyal(supabase.rpc('xat_entra_al_fil_de_pagina', { p_fil_id: filId }), config);
      if (alta.error) throw ambEstat(alta.error, alta.status);
      comprovaSenyal(config);
    }

    const { data, error, status } = await ambSenyal(supabase.rpc('xat_envia', {
      p_id: entrada.id,
      p_fil_id: filId,
      p_tipus: entrada.tipus,
      p_text: entrada.text,
      p_resposta_a: entrada.respostaA,
      p_metadades: entrada.metadades
    }), config);
    if (error) throw ambEstat(error, status);
    const fila = primeraFila(data);
    if (!fila || fila.seq === null || fila.seq === undefined) {
      throw errorLocal('El servidor no ha confirmat el missatge.', 'SENSE_CONFIRMACIO', true);
    }
    return {
      id: fila.id || entrada.id,
      filId,
      seq: Number(fila.seq),
      usuariId: user.id,
      autorNom: fila.autor_nom ?? null,
      comOrgId: fila.com_org_id ?? null,
      text: entrada.text,
      tipus: entrada.tipus,
      respostaA: entrada.respostaA,
      editatAl: null,
      esborratAl: null,
      metadades: entrada.metadades,
      esIA: false,
      creatAl: fila.creat_al || new Date().toISOString()
    };
  } catch (error) {
    throw errorDeXat(error, 'No s’ha pogut enviar el missatge.', config);
  }
};

export const loadMissatges = async (filId, config = {}) => {
  try {
    comprovaSenyal(config);
    const opcions = opcionsDePagina(config);
    const seed = await local(config);
    if (seed) return seed.loadMissatges(filId, config);
    const supabase = await getClient(config);
    comprovaSenyal(config);
    /* T63.2 · Un fil de pàgina es llig sense ser-ne participant: llegir no et publica. */
    const crida = config.visitant
      ? supabase.rpc('xat_llig_fil_de_pagina', {
        p_fil_id: filId, p_abans_de_seq: opcions.abansDeSeq, p_despres_de_seq: opcions.despresDeSeq, p_limit: opcions.limit
      })
      : opcions.despresDeSeq !== null
        ? supabase.rpc('xat_nous', { p_fil_id: filId, p_despres_de_seq: opcions.despresDeSeq })
        : supabase.rpc('xat_historial', { p_fil_id: filId, p_abans_de_seq: opcions.abansDeSeq, p_limit: opcions.limit });
    const { data, error, status } = await ambSenyal(crida, config);
    if (error) throw ambEstat(error, status);
    return (Array.isArray(data) ? data : [])
      .map((m) => mapejaMissatge(m, filId))
      .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  } catch (error) {
    throw errorDeXat(error, 'No s’han pogut carregar els missatges.', config);
  }
};

export const marcaLlegit = async (filId, config = {}) => {
  try {
    comprovaSenyal(config);
    const seed = await local(config);
    if (seed) return seed.marcaLlegit(filId, config);
    const supabase = await getClient(config);
    comprovaSenyal(config);
    const { data, error, status } = await ambSenyal(supabase.rpc('xat_marca', {
      p_fil_id: filId,
      p_rebut_fins: config.rebutFinsSeq ?? null,
      p_llegit_fins: config.llegitFinsSeq ?? null
    }), config);
    if (error) throw ambEstat(error, status);
    const fila = primeraFila(data);
    return { llegitFinsSeq: numero(fila?.llegit_fins_seq), rebutFinsSeq: numero(fila?.rebut_fins_seq) };
  } catch (error) {
    throw errorDeXat(error, 'No s’ha pogut marcar com a llegit.', config);
  }
};

/* ─────────────────────────────── Converses ─────────────────────────────── */

export const loadFils = async (config = {}) => {
  try {
    comprovaSenyal(config);
    const seed = await local(config);
    if (seed) return seed.loadFils(config);
    const supabase = await getClient(config);
    comprovaSenyal(config);
    const tenantId = getResolvedConfig(config).tenantId;
    if (!tenantId) return [];
    const { data, error, status } = await ambSenyal(supabase.rpc('xat_fils_meus', { p_tenant_id: tenantId }), config);
    if (error) throw ambEstat(error, status);
    /* Ordre del Mestre (261007) · «Sóc de Poble» i la «IAIA MarIA» són a la
       llista de tota persona, també el primer dia: si encara no en té la
       conversa real, una fila sintètica a la cua (Conversa.perDefecte). La
       regla és del mòdul neutre (xatsPerDefecte.js); ací només es crida, i
       només amb la resposta del servidor: sense poble no hi ha llista, i un
       error es propaga sense cap fila inventada. La llavor ja porta els seus
       fils i no passa per ací.
       Onada 6 (tasca 12) · El xat de la IAIA es diu «IAIA MarIA» i porta la
       seua cara (vestixLaIAIA): el xat públic de /iaia que la fila obri ja no
       la canvia de nom. La llavor no en necessita: el seu fil 'iaia' ja es
       diu així, i el xat públic de la pàgina hi és un altre xat. */
    return ambXatsPerDefecte((Array.isArray(data) ? data : []).map((f) => vestixLaIAIA(mapejaFil(f))));
  } catch (error) {
    throw errorDeXat(error, 'No s’han pogut carregar les converses.', config);
  }
};

export const creaFilDirecte = async (altreUsuariId, titol = null, config = {}) => {
  try {
    comprovaSenyal(config);
    const seed = await local(config);
    if (seed) return seed.creaFilDirecte(altreUsuariId, titol, config);
    /* W4-10 · El destinatari arriba tal com el va donar el port o la URL
       (?amb=), en el format del backend que siga. Esta RPC només sap obrir un
       fil amb un UUID: un altre id es rebutja ací, sense client ni crida. */
    if (typeof altreUsuariId !== 'string' || !RE_UUID.test(altreUsuariId)) {
      throw errorLocal(
        'No es pot obrir la conversa: este servidor identifica les persones i les entitats amb un UUID, i el destinatari no en porta cap.',
        'DESTINATARI_INVALID'
      );
    }
    const supabase = await getClient(config);
    comprovaSenyal(config);
    const tenantId = getResolvedConfig(config).tenantId;
    if (!tenantId) throw errorLocal('No s’ha seleccionat cap poble.', 'SENSE_POBLE');
    const { data, error, status } = await ambSenyal(supabase.rpc('crea_fil_directe', {
      p_tenant_id: tenantId,
      p_altre_usuari: altreUsuariId,
      p_titol: titol
    }), config);
    if (error) throw ambEstat(error, status);
    return data;
  } catch (error) {
    throw errorDeXat(error, 'No s’ha pogut crear la conversa.', config);
  }
};

/* ─────────────────────── Xat de pàgina (T63.2, T67) ─────────────────────── */

/* La RPC no existix: el node no té la migració 2609282100. PostgREST ho diu
   amb PGRST202 o amb un 404. Un error ja normalitzat d'ací no ho és mai. */
const esFuncioAbsent = (error) => !jaNormalitzat(error)
  && (/PGRST202/.test(`${error?.code ?? ''} ${error?.message ?? ''}`) || Number(error?.status) === 404);

const senseCapacitat = (error) => Object.assign(
  new Error('Este node encara no té el xat de les pàgines (falten les migracions 2609282100_xat_de_pagina.sql i 2610042330_xat_pagina_iaia.sql).'),
  { codi: 'sense-capacitat', code: 'SENSE_CAPACITAT', retriable: false, cause: error }
);

/* F6 (Onada 5) · Memòria de la RPC absent en esta càrrega de pàgina, per node
   i poble, com la de contacte (T48, organizations.js). Una RPC que ha tornat
   PGRST202 o 404 ja no es torna a cridar: cada clic deixava un altre 404 a la
   consola. Només compta l'esquema absent, mai un SDP-XAT-0xx, la xarxa, la
   cancel·lació ni un 5xx. Aplicada la migració, cal tornar a carregar. */
const xatDePaginaAbsent = new Set();

/* Per a les proves: la memòria és del mòdul i duraria d'una prova a l'altra. */
export function reiniciaMemoriaXatDePagina() {
  xatDePaginaAbsent.clear();
}

/**
 * Troba o crea el xat comú d'una Pàgina Universal. Una entitat, un poble o
 * una organització són una comunitat: el servidor en torna la comunitat,
 * «Avisos» i «General», i marca General com a destí. La resta, un grup. El
 * servidor no et fa participant: ho seràs quan hi escrigues.
 */
export const obriFilDePagina = async (objecte, config = {}) => {
  let clau = '';
  try {
    comprovaSenyal(config);
    const seed = await local(config);
    if (seed) return seed.obriFilDePagina(objecte, config);
    const subjecte = subjecteDeXat(objecte);
    if (!subjecte) return null;
    const user = usuariDeSessio();
    if (!user) throw errorLocal('Cal iniciar sessió per a obrir el xat de la pàgina.', 'SESSIO');
    const supabase = await getClient(config);
    comprovaSenyal(config);
    if (usuariDeSessio()?.id !== user.id) throw errorLocal('La sessió ha canviat.', 'SESSIO');
    const { tenantId, supabaseUrl } = getResolvedConfig(config);
    if (!tenantId) throw errorLocal('No s’ha seleccionat cap poble.', 'SENSE_POBLE');
    /* Entre la consulta de la memòria i la crida no hi ha cap await. */
    clau = JSON.stringify(['obri_fil_de_pagina', supabaseUrl || '', tenantId]);
    if (xatDePaginaAbsent.has(clau)) throw senseCapacitat();
    /* Cap ruta: el servidor la deriva del subjecte. El títol només li val si
       el subjecte no en té cap de propi (un contingut sense títol). */
    const { data, error, status } = await ambSenyal(supabase.rpc('obri_fil_de_pagina', {
      p_tenant_id: tenantId,
      p_tipus: subjecte.tipus,
      p_id: subjecte.id,
      p_titol: subjecte.titol
    }), config);
    if (error) throw ambEstat(error, status);
    const files = Array.isArray(data) ? data : [];
    const desti = files.find((f) => f?.desti === true);
    if (!desti?.id) throw errorLocal('El servidor no ha tornat el xat de la pàgina.', 'SENSE_CONFIRMACIO');
    /* Onada 6 (tasca 12) · El mateix vestit que loadFils: obrir-lo no el reanomena. */
    return { filId: desti.id, fils: files.map((f) => vestixLaIAIA(mapejaFil(f))) };
  } catch (error) {
    if (esFuncioAbsent(error)) {
      if (clau) xatDePaginaAbsent.add(clau);
      throw senseCapacitat(error);
    }
    throw errorDeXat(error, 'No s’ha pogut obrir el xat de la pàgina.', config);
  }
};

/* La cerca va al servidor (`p_cerca`) i l'error puja: la interfície ja el pinta. */
export const carregaMembres = async (textSearch, config = {}) => {
  try {
    comprovaSenyal(config);
    const seed = await local(config);
    if (seed) return seed.carregaMembres(textSearch, config);
    const supabase = await getClient(config);
    comprovaSenyal(config);
    const tenantId = getResolvedConfig(config).tenantId;
    if (!tenantId) return [];
    const cerca = String(textSearch ?? '').trim();
    const { data, error, status } = await ambSenyal(supabase.rpc('membres_del_poble', {
      p_tenant_id: tenantId,
      p_cerca: cerca || null
    }), config);
    if (error) throw ambEstat(error, status);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw errorDeXat(error, 'No s’ha pogut carregar la llista del poble.', config);
  }
};
