/**
 * @module supabase/xat
 * @description Adaptador del Xat (F0): escriptura només per RPC idempotent,
 *   historial per cursor de `seq`, marques de rebut i llegit, i avisos per
 *   canal privat de Realtime. Quan `runtimeDataMode !== 'remote'` delega al
 *   magatzem en memòria `localXat` (mode seed).
 * @contract Noms del nucli intactes; signatures ampliades de manera compatible.
 *   - loadFils(config) → Conversa[]
 *   - loadMissatges(filId, config { abansDeSeq | despresDeSeq, limit }) → Missatge[] per `seq` ascendent
 *   - enviaMissatge(filId, cos | { id, text, tipus, respostaA, metadades }, config) → Missatge
 *   - marcaLlegit(filId, config { llegitFinsSeq, rebutFinsSeq }) → { llegitFinsSeq, rebutFinsSeq }
 *   - creaFilDirecte(altreUsuariId, titol, config) → filId
 *   - carregaMembres(text, config) → { usuari_id, nom, fil_id }[]
 *   - subscribeToXat(filId, callback, config) → { subscription, error }
 *   - unsubscribeFromXat(subscription)
 * @errors Tot error llançat porta `code` i `retriable`. El text del servidor es
 *   conserva quan comença per `SDP-XAT-`; xarxa, temps d'espera i cancel·lació
 *   són reintentables, els codis SDP no.
 */

import { getClient } from './config.js';
import { usuariDeSessio } from '../identitat.js';
import { generateUUID, getResolvedConfig } from './runtime.js';
import { handleError } from './utils.js';

const LIMIT_PER_DEFECTE = 50;
const LIMIT_MAXIM = 100;
const TEXT_MAXIM = 4096;
const RE_CODI_SDP = /SDP-XAT-\d{3}/;
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

/**
 * Converteix qualsevol fallada en un Error amb `code` i `retriable`.
 * `handleError` no torna `message` (torna `error` i `details`), per això el
 * text del servidor es llig directament de l'error original.
 */
function errorDeXat(error, perDefecte) {
  if (jaNormalitzat(error)) return error;
  const nom = error?.name;
  if (nom === 'AbortError' || nom === 'TimeoutError') {
    return Object.assign(new Error(error.message || perDefecte), { name: nom, code: nom, retriable: true, cause: error });
  }
  const text = String(error?.message || '');
  const codiSdp = RE_CODI_SDP.exec(text)?.[0];
  if (codiSdp) return Object.assign(new Error(text), { code: codiSdp, retriable: false, cause: error });
  if (/PGRST20[25]/.test(`${error?.code ?? ''} ${text}`)) {
    return Object.assign(new Error('L’esquema del xat no està aplicat: cal executar la migració 260927_0200_xat_f0_fonament.sql.'),
      { code: 'ESQUEMA', retriable: false, cause: error });
  }
  const detall = handleError(error);
  const categoria = CATEGORIES_CONEGUDES.has(detall?.error) ? detall.error : 'XAT';
  const retriable = categoria === 'XARXA' || error instanceof TypeError || error?.status === 0 || Number(error?.status) >= 500;
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
  noLlegitManual: Boolean(f.no_llegit_manual)
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
    const normalitzat = errorDeXat(error, 'No s’ha pogut obrir el canal del xat.');
    if (viu()) callback(normalitzat, null);
    return { subscription: null, error: normalitzat };
  }
};

export const unsubscribeFromXat = async (subscription) => {
  if (subscription) {
    const supabase = channelOwners.get(subscription) || await getClient();
    await supabase.removeChannel(subscription);
    channelOwners.delete(subscription);
  }
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

    const { data, error } = await ambSenyal(supabase.rpc('xat_envia', {
      p_id: entrada.id,
      p_fil_id: filId,
      p_tipus: entrada.tipus,
      p_text: entrada.text,
      p_resposta_a: entrada.respostaA,
      p_metadades: entrada.metadades
    }), config);
    if (error) throw error;
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
    throw errorDeXat(error, 'No s’ha pogut enviar el missatge.');
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
    const crida = opcions.despresDeSeq !== null
      ? supabase.rpc('xat_nous', { p_fil_id: filId, p_despres_de_seq: opcions.despresDeSeq })
      : supabase.rpc('xat_historial', { p_fil_id: filId, p_abans_de_seq: opcions.abansDeSeq, p_limit: opcions.limit });
    const { data, error } = await ambSenyal(crida, config);
    if (error) throw error;
    return (Array.isArray(data) ? data : [])
      .map((m) => mapejaMissatge(m, filId))
      .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  } catch (error) {
    throw errorDeXat(error, 'No s’han pogut carregar els missatges.');
  }
};

export const marcaLlegit = async (filId, config = {}) => {
  try {
    comprovaSenyal(config);
    const seed = await local(config);
    if (seed) return seed.marcaLlegit(filId, config);
    const supabase = await getClient(config);
    comprovaSenyal(config);
    const { data, error } = await ambSenyal(supabase.rpc('xat_marca', {
      p_fil_id: filId,
      p_rebut_fins: config.rebutFinsSeq ?? null,
      p_llegit_fins: config.llegitFinsSeq ?? null
    }), config);
    if (error) throw error;
    const fila = primeraFila(data);
    return { llegitFinsSeq: numero(fila?.llegit_fins_seq), rebutFinsSeq: numero(fila?.rebut_fins_seq) };
  } catch (error) {
    throw errorDeXat(error, 'No s’ha pogut marcar com a llegit.');
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
    const { data, error } = await ambSenyal(supabase.rpc('xat_fils_meus', { p_tenant_id: tenantId }), config);
    if (error) throw error;
    return (Array.isArray(data) ? data : []).map(mapejaFil);
  } catch (error) {
    throw errorDeXat(error, 'No s’han pogut carregar les converses.');
  }
};

export const creaFilDirecte = async (altreUsuariId, titol = null, config = {}) => {
  try {
    comprovaSenyal(config);
    const seed = await local(config);
    if (seed) return seed.creaFilDirecte(altreUsuariId, titol, config);
    const supabase = await getClient(config);
    comprovaSenyal(config);
    const tenantId = getResolvedConfig(config).tenantId;
    if (!tenantId) throw errorLocal('No s’ha seleccionat cap poble.', 'SENSE_POBLE');
    const { data, error } = await ambSenyal(supabase.rpc('crea_fil_directe', {
      p_tenant_id: tenantId,
      p_altre_usuari: altreUsuariId,
      p_titol: titol
    }), config);
    if (error) throw error;
    return data;
  } catch (error) {
    throw errorDeXat(error, 'No s’ha pogut crear la conversa.');
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
    const { data, error } = await ambSenyal(supabase.rpc('membres_del_poble', {
      p_tenant_id: tenantId,
      p_cerca: cerca || null
    }), config);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw errorDeXat(error, 'No s’ha pogut carregar la llista del poble.');
  }
};
