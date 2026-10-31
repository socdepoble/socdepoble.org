/**
 * @module supabase/storage
 * @description Gestió de fitxers amb Supabase Storage.
 * @contract
 *   - uploadFile(bucket, path, file)
 *   - downloadFile(bucket, path)
 *   - deleteFile(bucket, path)
 *   - listFiles(bucket, path)
 *   - getPublicUrl(bucket, path)
 *   - resolveAsset(ref)
 *   - promoteToPublic(ref)
 *   - llistaElsMeusMitjans(config)        (capacitat 'mitjansPropis')
 *   - esborraElMeuMitja(ref, config)      (capacitat 'mitjansPropis')
 */

import { getResolvedConfig } from './runtime.js';
import { getClient } from './config.js';
import { usuariDeSessio } from '../identitat.js';
import { handleError } from './utils.js';
import { CODI_BACKEND_INABASTABLE, CODI_MITJANS, CODI_SEGON_FACTOR, esBackendInabastable } from '../errorsBackend.js';
import { tempsLimitPujada } from '../xatMultimedia.js';

/* Límits per fitxer (ARQ-G07): 25 MiB al bucket privat, 5 MiB al públic. */
const MIDA_MAX_PRIVADA = 26214400;
const MIDA_MAX_PUBLICA = 5242880;

/* PN-04 (auditoria Port Neutral 261025) · Cap crida a Storage no espera per
   sempre. storage-js 2.112 no hi posa cap termini i el client es crea sense
   cap fetch propi (config.js): una pujada, una URL signada o un llistat que
   no tornaven deixaven la vista «carregant» indefinidament. El patró de CUR-02
   (ambSenyal, xat.js) i de la fitxa pública (perfils.js): la cursa allibera
   qui espera encara que el transport no sàpia avortar, i el termini també
   talla la petició: download i list reben el senyal per l'API de storage-js,
   i upload, createSignedUrl i remove pel fetch de la seua instància (P1-27,
   ambSenyalDelTermini). Una pujada creix amb la mida (tempsLimitPujada, la
   regla dels adjunts del xat); una baixada no la sap abans i pren la del
   fitxer més gran que admet el bucket privat. La resta són respostes curtes: 12 s, com request() (runtime.js).
   El temps esgotat porta el codi neutral de «no ha arribat al servidor»: és
   el que la persona pot fer (comprovar la connexió i tornar-ho a provar), i
   errorDeStorage el traduïx amb la frase de sempre. */
const TEMPS_STORAGE_MS = 12_000;
const TEMPS_BAIXADA_MS = tempsLimitPujada(MIDA_MAX_PRIVADA);

function ambTermini(ms, feina) {
  const controlador = new AbortController();
  let talla;
  const tallada = new Promise((_resol, rebutja) => { talla = rebutja; });
  const perTermini = setTimeout(() => {
    talla(Object.assign(new Error('Storage no ha respost a temps.'), { name: 'TimeoutError', codi: CODI_BACKEND_INABASTABLE }));
    controlador.abort();
  }, ms);
  /* La feina entra en un then: una excepció síncrona del SDK és un rebuig, i
     un resultat tardà queda consumit per la cursa. */
  return Promise.race([Promise.resolve().then(() => feina(controlador.signal)), tallada])
    .finally(() => clearTimeout(perTermini));
}

/* P1-27 (C2120-03, G2120-06) · storage-js 2.112.4 no accepta cap senyal a
   upload, createSignedUrl ni remove: el termini alliberava qui esperava, però
   la petició continuava viva per davall. Cada `storage.from(cubell)` és una
   instància nova (StorageClient.from) que fa totes les seues peticions amb el
   seu `fetch`; ací, només en eixa instància, el fetch porta el senyal del
   termini. El client compartit i les altres crides no el veuen. Si l'SDK ja
   hi posa un senyal (download, list), mana el seu. Si una versió futura no
   exposa `fetch` a la instància, es queda com abans: la cursa continua
   alliberant qui espera (storage.termini.test.js ho vigila amb l'SDK real).
   Avortar una pujada o un esborrat que el servidor ja havia rebut no el desfà:
   és igual que abans del canvi, i la reconciliació és decisió pendent. */
function ambSenyalDelTermini(cubell, signal) {
  const base = cubell?.fetch;
  if (typeof base !== 'function') return cubell;
  try {
    cubell.fetch = (url, init) => base(url, init?.signal ? init : { ...init, signal });
  } catch {
    /* Una instància tancada (un doble congelat): com abans. */
  }
  return cubell;
}

/* Un UUID de poble o d'usuari (uploadToStorage i la biblioteca de fotos pròpies). */
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* F2 (ordre del Mestre, 261004; pla 2045, Marató 2230) · El rebuig d'una pujada.
   Abans es llegia `handleError(error)?.message`, que no existix mai: handleError
   torna `{error, code, details}`, sense `message` (utils.js:18; xat.js:63 fa el
   mateix rodeig), i qualsevol causa eixia com el mateix
   «No s’ha pogut pujar el fitxer». Ara el rebuig de Storage es traduïx al
   vocabulari neutral del port (errorsBackend.js): el codi va a `error.codi` i el
   text, en valencià, conserva el prefix de sempre perquè es puga buscar. Cap text
   porta la ruta, l'uid, el poble ni el missatge cru del proveïdor; l'original
   queda a `cause` per a qui depure. */
const PREFIX_PUJADA = 'No s’ha pogut pujar el fitxer:';
const TEXTOS_PUJADA = Object.freeze({
  [CODI_BACKEND_INABASTABLE]: 'el servidor no respon. Comprova la connexió i torna-ho a provar.',
  [CODI_MITJANS.SESSIO]: 'la sessió ha caducat. Torna a entrar i repeteix-ho.',
  [CODI_MITJANS.SENSE_ESPAI]: 'el servidor encara no té preparat l’espai de fitxers.',
  [CODI_MITJANS.SENSE_PERMIS]: 'el servidor no t’ha donat permís per a guardar-lo ací.',
  [CODI_MITJANS.MASSA_GRAN]: 'passa del límit de mida del servidor.',
  [CODI_MITJANS.FORMAT]: 'el servidor no admet este format.',
  [CODI_MITJANS.SERVIDOR]: 'el servidor ha fallat; torna-ho a provar d’ací a un moment.'
});

/* F2 · Bloquejant de Codex (Relleus 13, 17 i 21 de 261004_2240_auditoria_codex;
   sondes /tmp/sdp-f2-adversarial-probe*.json). Les expressions miraven el
   missatge sencer, ruta inclosa, abans que l'estat: un 413 amb «jwt» al nom del
   fitxer eixia com a sessió caducada i un 500 amb «Unauthorized» a la ruta, com
   a falta de permís. Regla: les dades estructurades manen, en este ordre.
   1. El `code` exacte del servei. storage-js 2.112 (fetch.ts, handleError) el
      deixa a `code` i, quan el cos no porta statusCode, també a `statusCode`.
   2. L'estat HTTP: el numèric del cos primer, perquè Storage respon HTTP 400
      amb el real ('403', '404') al cos; si no n'hi ha, el de la resposta.
   3. Només amb un 400 genèric o sense estat, el missatge, i sencer: frases
      completes del servidor, mai un tros que puga viure dins d'una ruta.
   Codis: els que storage-js nomena a StorageApiError.code (errors.ts) i la
   taula de Supabase que hi enllaça (storage/debugging/error-codes). */
const CODIS_STORAGE = Object.freeze({
  InvalidJWT: CODI_MITJANS.SESSIO,
  NoSuchBucket: CODI_MITJANS.SENSE_ESPAI,
  AccessDenied: CODI_MITJANS.SENSE_PERMIS,
  EntityTooLarge: CODI_MITJANS.MASSA_GRAN,
  InvalidMimeType: CODI_MITJANS.FORMAT
});

/* Missatges complets coneguts, per a la reserva (pas 3). JWT: el Storage nou
   verifica amb jose («"exp" claim timestamp check failed», «signature
   verification failed», «Invalid Compact JWS»), l'antic amb jsonwebtoken («jwt
   expired», «jwt malformed», «invalid signature»), i sense `message` storage-js
   agafa el camp `error` del cos («Invalid JWT», «Unauthorized»; fetch.ts,
   _getErrorMessage). Kong: les dos respostes de la clau pública rebutjada. */
const RE_SESSIO = /^(?:"exp" claim timestamp check failed|signature verification failed|invalid compact jws|jwt expired|jwt malformed|invalid signature|invalid jwt)$/i;
const RE_CLAU_PUBLICA = /^(?:invalid api key|no api key found in request)$/i;
const RE_SENSE_ESPAI = /^(?:bucket not found|nosuchbucket)$/i;
const RE_SENSE_PERMIS = /^(?:new row violates row-level security policy(?: for table "[^"]*")?|unauthorized|accessdenied)$/i;
const RE_MASSA_GRAN = /^(?:the object exceeded the maximum allowed size|entitytoolarge)$/i;
const RE_FORMAT = /^(?:mime type [\w.+-]+\/[\w.+-]+ is not supported|invalidmimetype)$/i;
// El TypeError de fetch de cada motor, sencer (Chrome, Safari, React Native, Firefox).
const RE_XARXA = /^(?:failed to fetch|load failed|network request failed|networkerror when attempting to fetch resource\.?)$/i;

/** El code si és un dels de Storage que traduïm (propi, no heretat: «constructor» no ho és). */
const codiDeStorage = (valor) => (typeof valor === 'string' && Object.hasOwn(CODIS_STORAGE, valor) ? valor : undefined);

/* Un estat HTTP és un enter de 100 a 599: un número o un text de tres xifres
   (el cos de Storage el porta en text, '403'). Un codi textual, una ruta o
   '0x193' no ho són. */
function estatHttp(valor) {
  const n = typeof valor === 'string' && /^\d{3}$/.test(valor.trim()) ? Number(valor) : valor;
  return Number.isInteger(n) && n >= 100 && n <= 599 ? n : undefined;
}

/* Auditoria 261007 (B) · «L'objecte ja existix»: el code 'Duplicate' del servei
   o l'estat 409, amb el del cos per davant de l'HTTP genèric com a codiDePujada
   (el Storage antic respon HTTP 400 amb statusCode '409' al cos). Quan el cos no
   porta statusCode, storage-js 2.112 hi copia el `code` (fetch.ts, handleError). */
function esDuplicat(error) {
  return error?.code === 'Duplicate' || error?.statusCode === 'Duplicate'
    || (estatHttp(error?.statusCode) ?? estatHttp(error?.status)) === 409;
}

/* Sense resposta: el criteri de tot el port (esBackendInabastable,
   errorsBackend.js). storage-js 2.112 embolica l'error de fetch en un
   StorageUnknownError i el deixa a `originalError`. Les marques estructurades
   (codi neutral, estat 0) valen soles; si l'única prova és el text d'un
   TypeError, ha de ser el text sencer: «Failed to fetch» dins d'una ruta no és
   una xarxa caiguda. «Failed to execute 'fetch' on 'Window'» (bug del client) i
   l'AbortError de Safari tampoc ho són. */
function senseResposta(error) {
  if (!esBackendInabastable(error)) return false;
  if (error.codi === CODI_BACKEND_INABASTABLE || error.status === 0 || error.name !== 'TypeError') return true;
  return RE_XARXA.test(String(error.message || '').trim());
}

function codiDePujada(error) {
  // 1. El code exacte del servei.
  const codi = codiDeStorage(error?.code) ?? codiDeStorage(error?.statusCode);
  if (codi) return CODIS_STORAGE[codi];
  const http = estatHttp(error?.status);
  const cos = estatHttp(error?.statusCode);
  // Amb un estat HTTP, el servidor ha respost: no és «el servidor no respon».
  if (http === undefined && cos === undefined && (senseResposta(error) || senseResposta(error?.originalError))) {
    return CODI_BACKEND_INABASTABLE;
  }
  // 2. L'estat: el del cos mana sobre l'HTTP genèric.
  const estat = cos ?? http;
  const missatge = typeof error?.message === 'string' ? error.message.trim() : '';
  const sessioAntiga = RE_SESSIO.test(missatge);
  /* Kong rebutja la clau pública del desplegament amb 401: és configuració i
     tornar a entrar no ho arregla. Va a DESCONEGUT amb l'estat HTTP. */
  if ((estat === 401 || estat === undefined) && RE_CLAU_PUBLICA.test(missatge)) return CODI_MITJANS.DESCONEGUT;
  if (estat === 401) return CODI_MITJANS.SESSIO;
  /* El Storage antic respon el JWT caducat amb statusCode '403' i sense code:
     només el missatge complet el distingix d'un rebuig de permisos. */
  if (estat === 403) return sessioAntiga ? CODI_MITJANS.SESSIO : CODI_MITJANS.SENSE_PERMIS;
  if (estat === 404) return CODI_MITJANS.SENSE_ESPAI;
  if (estat === 413) return CODI_MITJANS.MASSA_GRAN;
  if (estat === 415) return CODI_MITJANS.FORMAT;
  if (estat >= 500) return CODI_MITJANS.SERVIDOR;
  // Un altre estat concret (409, 418…) no s'endevina pel text.
  if (estat !== undefined && estat !== 400) return CODI_MITJANS.DESCONEGUT;
  // 3. Reserva: 400 genèric o sense estat, i el missatge sencer.
  if (sessioAntiga) return CODI_MITJANS.SESSIO;
  if (RE_SENSE_ESPAI.test(missatge)) return CODI_MITJANS.SENSE_ESPAI;
  if (RE_SENSE_PERMIS.test(missatge)) return CODI_MITJANS.SENSE_PERMIS;
  if (RE_MASSA_GRAN.test(missatge)) return CODI_MITJANS.MASSA_GRAN;
  if (RE_FORMAT.test(missatge)) return CODI_MITJANS.FORMAT;
  return CODI_MITJANS.DESCONEGUT;
}

/**
 * Traduïx el rebuig d'una pujada a un Error amb `codi` neutral (CODI_MITJANS o
 * CODI_BACKEND_INABASTABLE), `status` HTTP si n'hi ha i l'original a `cause`.
 * Funció pura: no escriu enlloc. Una resposta que no reconeix (una versió nova
 * de l'API, per exemple) cau a DESCONEGUT amb l'estat HTTP, en lloc d'endevinar.
 * @param {object} error - L'error de Storage (StorageApiError o StorageUnknownError).
 * @returns {Error}
 */
export function errorDePujada(error) {
  return errorDeStorage(error, PREFIX_PUJADA, TEXTOS_PUJADA);
}

/* Pla 261018_1605 (Tasca 4, D8) · La mateixa traducció per a la pujada, el
   llistat i l'esborrat de la biblioteca: només canvien el prefix i, si n'hi ha,
   la frase d'algun codi (si no, la de la pujada, que és genèrica). */
function errorDeStorage(error, prefix, textos) {
  const codi = codiDePujada(error);
  // L'estat de la resposta primer i, si no n'hi ha, el del cos; mai un text que no siga un estat.
  const status = estatHttp(error?.status) ?? estatHttp(error?.statusCode);
  const detall = codi === CODI_MITJANS.DESCONEGUT
    ? `error inesperat${status ? ` del servidor (HTTP ${status})` : ''}.`
    : (textos[codi] ?? TEXTOS_PUJADA[codi]);
  return Object.assign(new Error(`${prefix} ${detall}`, { cause: error }), { codi, status });
}

/* F2 · Privacitat de la consola (Relleus 21 i 24 de Codex; proposta
   261005_0112_produccio_proposta_f2_storage_privacitat_completa, revalidada
   sobre estos bytes). Totes les diagnosis del mòdul (pujada, URL firmada,
   baixada i pujada en promoure) passen per ací i només escriuen dades
   validades: el codi neutral, un estat HTTP si és un enter de 100 a 599 i un
   code si és un dels de Storage que traduïm. Mai la ruta, l'uid, el poble, la
   ref ni el text cru del proveïdor. Abans, resolveAsset hi posava la ruta i
   l'Error sencer, i promoteToPublic l'error de l'SDK tal qual; quan l'SDK
   llança, downloadFile i uploadFile tornen el `{ error }` de handleError, que
   és el missatge cru (utils.js:66-70), i també arribava a la consola. Un valor
   que no és un error de Storage (eixe text, per exemple) ix DESCONEGUT i sense
   estat. L'original queda a `cause` o al retorn, per a qui depure. */
function diagnosiDeStorage(error) {
  return {
    codi: codiDePujada(error),
    status: estatHttp(error?.status),
    statusCode: estatHttp(error?.statusCode),
    code: codiDeStorage(error?.code) ?? codiDeStorage(error?.statusCode)
  };
}

/**
 * Puja un fitxer a un bucket.
 * @param {string} bucket - Nom del bucket.
 * @param {string} path - Camí dins el bucket.
 * @param {File|Blob} file - Fitxer a pujar.
 * @param {object} config - Configuració
 * @returns {Promise<{data: object, error: object}>}
 */
export const uploadFile = async (bucket, path, file, config = {}) => {
  try {
    const supabase = await getClient(config);
    return await ambTermini(tempsLimitPujada(file?.size), (signal) => ambSenyalDelTermini(supabase.storage.from(bucket), signal).upload(path, file));
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Baixa un fitxer.
 * @param {string} bucket - Nom del bucket.
 * @param {string} path - Camí dins el bucket.
 * @param {object} config - Configuració
 * @returns {Promise<{data: Blob, error: object}>}
 */
export const downloadFile = async (bucket, path, config = {}) => {
  try {
    const supabase = await getClient(config);
    return await ambTermini(TEMPS_BAIXADA_MS, (signal) => supabase.storage.from(bucket).download(path, undefined, { signal }));
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Elimina un fitxer o múltiples fitxers d'un bucket.
 * @param {string} bucket - Nom del bucket.
 * @param {string|string[]} pathOrPaths - Camí o array de camins dins el bucket.
 * @param {object} config - Configuració
 * @returns {Promise<{data: object, error: object}>}
 */
export const deleteFile = async (bucket, pathOrPaths, config = {}) => {
  try {
    const supabase = await getClient(config);
    const paths = Array.isArray(pathOrPaths) ? pathOrPaths : [pathOrPaths];
    return await ambTermini(TEMPS_STORAGE_MS, (signal) => ambSenyalDelTermini(supabase.storage.from(bucket), signal).remove(paths));
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Llista els fitxers d'un bucket.
 * @param {string} bucket - Nom del bucket.
 * @param {string} path - Camí dins el bucket (opcional).
 * @param {object} config - Configuració
 * @returns {Promise<{data: Array, error: object}>}
 */
export const listFiles = async (bucket, path = '', config = {}) => {
  try {
    const supabase = await getClient(config);
    return await ambTermini(TEMPS_STORAGE_MS, (signal) => supabase.storage.from(bucket).list(path, undefined, { signal }));
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Obté l'URL pública d'un fitxer.
 * @param {string} bucket - Nom del bucket.
 * @param {string} path - Camí dins el bucket.
 * @param {object} config - Configuració
 * @returns {Promise<string>}
 */
export const getPublicUrl = async (bucket, path, config = {}) => {
  const supabase = await getClient(config);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

/**
 * Puja un fitxer al bucket per defecte de mitjans o mitjans_privats, complint el contracte.
 * @param {File} fitxer
 * @param {object} options
 * @param {object} config
 */
export const uploadToStorage = async (fitxer, { carpeta = 'general', tenantId } = {}, config = {}) => {
  const user = usuariDeSessio();
  if (!user?.id) throw new Error('Cal iniciar sessió');
  const resolvedTenant = getResolvedConfig(config).tenantId;
  if (tenantId && resolvedTenant && tenantId !== resolvedTenant) throw new Error('Poble inconsistent');
  const selectedTenant = tenantId || resolvedTenant;
  if (!RE_UUID.test(selectedTenant || '') || !RE_UUID.test(user.id)) throw new Error('Poble o usuari invàlid');
  if (!/^[a-z0-9_-]{1,40}$/.test(carpeta)) throw new Error('Carpeta invàlida');
  const extensions = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/avif': 'avif', 'application/pdf': 'pdf' };
  const isPrivate = carpeta === 'notes';
  if (!(fitxer instanceof Blob) || !extensions[fitxer.type] || (!isPrivate && fitxer.type === 'application/pdf'))
    throw new Error('Format de fitxer no admés en este destí');
  if (!fitxer.size || fitxer.size > (isPrivate ? MIDA_MAX_PRIVADA : MIDA_MAX_PUBLICA)) throw new Error('Mida de fitxer no admesa');
  const bucket = isPrivate ? 'mitjans_privats' : 'mitjans';
  const ruta = `${selectedTenant.toLowerCase()}/${user.id.toLowerCase()}/${carpeta}/${crypto.randomUUID()}.${extensions[fitxer.type]}`;
  const client = await getClient(config);
  /* PN-04 · El temps esgotat (o una excepció del SDK) passa per la mateixa
     traducció que un rebuig: la vista diu el motiu pel codi, mai un error cru. */
  let error;
  try {
    ({ error } = await ambTermini(tempsLimitPujada(fitxer.size), (signal) => ambSenyalDelTermini(client.storage.from(bucket), signal).upload(ruta, fitxer, { upsert: false })));
  } catch (excepcio) {
    error = excepcio;
  }
  if (error) {
    const rebuig = errorDePujada(error);
    /* F2 · Per a diagnosi, només dades validades: ni la ruta, ni l'uid, ni el
       poble. Abans s'hi copiaven code, statusCode i status crus, i un proveïdor
       que hi posara la ruta la deixava a la consola (Relleu 21 de Codex). Ara
       ix un estat si és un estat i un code si és un dels que traduïm
       (diagnosiDeStorage; la forma és la mateixa de les 01:00). */
    console.warn('[Storage] pujada rebutjada', diagnosiDeStorage(error));
    throw rebuig;
  }
  return { url: `sdp-media://${bucket}/${ruta}`, ruta };
};

/* Auditoria de seguretat 261019 (F5) · El bucket i el camí d'una referència
   opaca només arriben a Storage si cap segment no pot moure la URL. storage-js
   ajunta el camí sense codificar a /object/sign/<bucket>/<camí> i hi fa un
   POST amb el token de qui mira; un avatar_url d'un altre veí amb segments de
   punts (o '%2e', o un tabulador que l'analitzador d'URL esborra) eixia de la
   ruta de signatura cap a un altre punt de l'origen de Supabase, i la promoció
   (promoteToPublic) feia el mateix amb la baixada i la pujada. Un segment buit,
   '.', '..', o amb '%', '?', '#', barra inversa o un caràcter de control no
   passa; tampoc un camí que acaba en espai: el camí és el final de la URL, i
   l'analitzador lleva els espais del final ('.. ' hi arribava com '..'). La
   resta de noms (també els de pujades antigues) es resolen igual que abans.
   Una referència que no passa es torna tal qual, com quan la signatura falla:
   les peces que la pinten descarten el que torna encara opac. */
const CARACTER_QUE_MOU_LA_URL = /[%?#\\\u0000-\u001f\u007f]/;
const segmentNet = (segment) => segment !== '' && segment !== '.' && segment !== '..' && !CARACTER_QUE_MOU_LA_URL.test(segment);
const camiNet = (cami) => !cami.endsWith(' ') && cami.split('/').every(segmentNet);

/**
 * Resol un actiu (asset) a la seua URL real (pública o firmada temporal).
 * @param {string} ref - Referència opaca, ex. sdp-media://mitjans_privats/tenant_id/user_id/...
 * @param {object} config
 */
export const resolveAsset = async (ref, config = {}) => {
  if (!ref || typeof ref !== 'string') return ref;
  if (!ref.startsWith('sdp-media://')) return ref; // Backwards compatibility

  const pathPart = ref.replace('sdp-media://', '');
  const slashIndex = pathPart.indexOf('/');
  if (slashIndex === -1) return ref;

  const bucket = pathPart.substring(0, slashIndex);
  const path = pathPart.substring(slashIndex + 1);
  if (!segmentNet(bucket) || !camiNet(path)) return ref;

  const supabase = await getClient(config);
  
  if (bucket === 'mitjans_privats') {
    // URL firmada amb 1 hora de duració (3600 segons)
    // PN-04 · Una signatura que no torna a temps és una signatura fallida.
    let data;
    let error;
    try {
      ({ data, error } = await ambTermini(TEMPS_STORAGE_MS, (signal) => ambSenyalDelTermini(supabase.storage.from(bucket), signal).createSignedUrl(path, 3600)));
    } catch (excepcio) {
      error = excepcio;
    }
    if (error) {
      // F2 · Sense la ruta ni l'Error cru (diagnosiDeStorage).
      console.warn("[Storage] No s'ha pogut generar l'URL firmada", diagnosiDeStorage(error));
      return ref;
    }
    return data.signedUrl;
  } else {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
};

/**
 * Promou un actiu privat a públic, movent-lo del bucket privat al públic.
 * @param {string} ref - Referència opaca de mitjans_privats
 * @param {object} config
 * @returns {Promise<string>} La nova referència promoguda
 */
export const promoteToPublic = async (ref, config = {}) => {
  if (!ref || typeof ref !== 'string') return ref;
  if (!ref.startsWith('sdp-media://mitjans_privats/')) return ref; 
  
  const path = ref.replace('sdp-media://mitjans_privats/', '');
  // F5 · El mateix camí net que resolveAsset, abans de baixar i de pujar.
  if (!camiNet(path)) return ref;

  // 1. Descarreguem l'arxiu des del bucket privat
  const { data: fileData, error: downloadError } = await downloadFile('mitjans_privats', path, config);
  if (downloadError) {
    // F2 · Sense l'error cru de l'SDK ni el text de handleError (diagnosiDeStorage).
    console.warn("[Storage] Error baixant el fitxer per a promoure'l", diagnosiDeStorage(downloadError));
    return ref; // Deixem l'original
  }

  // 2. El pugem al bucket públic en la mateixa ruta
  const { error: uploadError } = await uploadFile('mitjans', path, fileData, config);
  /* Auditoria 261007 (B) · La promoció és idempotent. Republicar («Actualitzar
     al Mur») torna a promoure la mateixa ruta, i Storage (upsert: false per
     defecte a storage-js) contesta «Duplicate» amb un 409 al cos o a la
     resposta. Abans es tornava la ref PRIVADA i l'upsert de section_submissions
     la desava al payload compartit. El fitxer privat és immutable (UUID nou i
     upsert: false a uploadToStorage), així que la còpia pública ja és idèntica:
     el duplicat és un èxit i no avisa. Una fallada real (mida, format, permís)
     continua tornant la ref, a l'espera de la decisió del Mestre. */
  if (uploadError && esDuplicat(uploadError)) return `sdp-media://mitjans/${path}`;
  if (uploadError) {
    // F2 · Com la baixada: només dades validades (diagnosiDeStorage).
    console.warn("[Storage] Error pujant el fitxer al promoure'l", diagnosiDeStorage(uploadError));
    return ref;
  }
  
  // C17 (Auditoria): No esborrem l'original per evitar pèrdua de dades si falla 
  // la persistència de la nova referència o la publicació al Mur.
  // await deleteFile('mitjans_privats', path, config);

  return `sdp-media://mitjans/${path}`;
};

/* ═══ Pla 261018_1605 (Tasca 4, D8; ordre del Mestre, 18-10-2026) ═══
   LA BIBLIOTECA DE FOTOS PRÒPIES (capacitat 'mitjansPropis', contracte.js).
   «Multimèdia» del Perfil llista les imatges que la persona de la sessió ha
   pujat al bucket públic i esborra de veritat les de la seua biblioteca.
   · Llistat: només davall del prefix propi `<poble>/<uid>/`, amb les carpetes
     descobertes (el llistat de Storage les torna com a entrades amb id null),
     i el llegat `<uid>/<carpeta>/` d'abans que la ruta portara el poble
     (2609200300_blindatge_storage_i_contingut.sql,
     es_ruta_mitjans_publics_propia). El bucket és de lectura pública
     (2609130500_bucket_mitjans.sql, «mitjans llegir»): «només el propi» és
     una guarda d'ací, no del servidor.
   · Esborrat: només `<poble>/<uid>/avatars/<fitxer>`, del poble resolt i de
     la persona de la sessió. Les altres carpetes són d'altres publicacions
     (una organització, un agent) i el llegat no s'esborra des d'ací.
   · Consola: només diagnosiDeStorage (F2). Els rebutjos de la guarda no hi
     escriuen res. */
const CUBELL_PUBLIC = 'mitjans';
const PREFIX_REF_PUBLICA = `sdp-media://${CUBELL_PUBLIC}/`;
const CARPETA_ESBORRABLE = 'avatars';
const MODES_LOCALS = new Set(['seed', 'local']);
const PAGINA_LLISTAT = 100;
const MAX_PAGINES_LLISTAT = 10;
// Una carpeta com les que admet uploadToStorage.
const RE_CARPETA = /^[a-z0-9_-]{1,40}$/;
/* Un segment net, la regla de fotoDelBucketPublic (utils/mitjaOpac.js): cap
   punt davant, cap '%', espai, barra ni caràcter de control. */
const RE_NOM_NET = /^[a-z0-9_-][a-z0-9._-]{0,254}$/i;
const RE_EXTENSIO_IMATGE = /\.(?:jpe?g|png|webp|gif|avif)$/i;
const TIPUS_IMATGE = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
/* CODI_MITJANS no té cap «no disponible»: és el valor comú del port per a «este
   mode no té eixe servidor» (el de CODI_SEGON_FACTOR i CODI_PERSONALITZACIO). */
const CODI_NO_DISPONIBLE = CODI_SEGON_FACTOR.NO_DISPONIBLE;
const PREFIX_LLISTAT = 'No s’ha pogut llegir la teua biblioteca de fotos:';
const PREFIX_ESBORRAT = 'No s’ha pogut esborrar la foto:';
const TEXTOS_BIBLIOTECA = Object.freeze({
  [CODI_MITJANS.SENSE_PERMIS]: 'el servidor no t’ho ha permés.'
});

const esModeLocal = (config) => MODES_LOCALS.has(getResolvedConfig(config).runtimeDataMode);

/* El codi neutral va a `codi`, com a la pujada, i també a `code`, com el
   'no-disponible' de la resta del port: la vista en mira un i no ha d'endevinar quin. */
const ambCode = (error) => Object.assign(error, { code: error.codi });
const rebuigDEsborrat = (codi, detall) => ambCode(Object.assign(new Error(`${PREFIX_ESBORRAT} ${detall}`), { codi }));

/* La persona i el poble d'esta sessió, en minúscules com les rutes que escriu
   uploadToStorage; null si no són UUID. */
function propietariDeSessio(config) {
  const id = usuariDeSessio()?.id;
  const poble = getResolvedConfig(config).tenantId;
  return {
    sessio: Boolean(id),
    uid: typeof id === 'string' && RE_UUID.test(id) ? id.toLowerCase() : null,
    poble: typeof poble === 'string' && RE_UUID.test(poble) ? poble.toLowerCase() : null
  };
}

/* La ruta dins del bucket públic d'una ref que esta sessió pot esborrar, o null.
   Una sola regla per a esborraElMeuMitja i per a Mitja.esborrable. */
function rutaEsborrable(ref, { uid, poble }) {
  if (!uid || !poble || typeof ref !== 'string' || !ref.startsWith(PREFIX_REF_PUBLICA)) return null;
  const ruta = ref.slice(PREFIX_REF_PUBLICA.length);
  const [segPoble, segUsuari, carpeta, nom, ...resta] = ruta.split('/');
  if (resta.length || segPoble !== poble || segUsuari !== uid || carpeta !== CARPETA_ESBORRABLE) return null;
  return typeof nom === 'string' && RE_NOM_NET.test(nom) && RE_EXTENSIO_IMATGE.test(nom) ? ruta : null;
}

/* Tot el que hi ha davall d'un prefix, pàgina a pàgina (Storage en torna 100
   per defecte), i com a molt MAX_PAGINES_LLISTAT pàgines. */
async function llistaSencera(cubell, prefix) {
  const entrades = [];
  for (let pagina = 0; pagina < MAX_PAGINES_LLISTAT; pagina += 1) {
    // PN-04 · Cada pàgina, el seu termini (i el senyal, que storage-js passa a fetch).
    const { data, error } = await ambTermini(TEMPS_STORAGE_MS, (signal) => cubell.list(prefix, {
      limit: PAGINA_LLISTAT, offset: pagina * PAGINA_LLISTAT, sortBy: { column: 'name', order: 'asc' }
    }, { signal }));
    if (error) throw error;
    const lot = Array.isArray(data) ? data : [];
    entrades.push(...lot);
    if (lot.length < PAGINA_LLISTAT) break;
  }
  return entrades;
}

const esCarpeta = (entrada) => entrada?.id === null || entrada?.id === undefined;

/* Els fitxers de cada carpeta d'una arrel (`<poble>/<uid>` o el llegat `<uid>`). */
async function fitxersDeLArrel(cubell, arrel) {
  const carpetes = (await llistaSencera(cubell, arrel))
    .filter((entrada) => esCarpeta(entrada) && typeof entrada?.name === 'string' && RE_CARPETA.test(entrada.name))
    .map((entrada) => entrada.name);
  const perCarpeta = await Promise.all(carpetes.map(async (carpeta) =>
    (await llistaSencera(cubell, `${arrel}/${carpeta}`))
      .filter((entrada) => entrada && !esCarpeta(entrada))
      .map((fitxer) => ({ arrel, carpeta, fitxer }))));
  return perCarpeta.flat();
}

/* Un instant ISO, o null: mai una data inventada. */
function instantIso(valor) {
  if (typeof valor !== 'string' || !valor.trim()) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

const midaDe = (metadata) => [metadata.size, metadata.contentLength]
  .find((valor) => Number.isInteger(valor) && valor >= 0) ?? null;

// L'eTag de Storage ve entre cometes ("…"): sense elles, o null.
const etagDe = (valor) => (typeof valor === 'string' && valor.replace(/"/g, '').trim()) || null;

/* Una entrada del llistat com a Mitja, o null si no és una imatge amb un nom
   net. El MIME del servidor mana; sense MIME, l'extensió. */
function mitjaDeFitxer({ arrel, carpeta, fitxer }, propietari) {
  const nom = fitxer.name;
  if (typeof nom !== 'string' || !RE_NOM_NET.test(nom)) return null;
  const metadata = fitxer.metadata && typeof fitxer.metadata === 'object' ? fitxer.metadata : {};
  const mime = typeof metadata.mimetype === 'string' ? metadata.mimetype.trim().toLowerCase() : '';
  if (mime ? !TIPUS_IMATGE.has(mime) : !RE_EXTENSIO_IMATGE.test(nom)) return null;
  const ruta = `${arrel}/${carpeta}/${nom}`;
  const ref = `${PREFIX_REF_PUBLICA}${ruta}`;
  return {
    ref,
    ruta,
    nom,
    carpeta,
    creat: instantIso(fitxer.created_at) ?? instantIso(fitxer.updated_at) ?? instantIso(metadata.lastModified),
    mida: midaDe(metadata),
    etag: etagDe(metadata.eTag),
    tipus: mime || null,
    esborrable: rutaEsborrable(ref, propietari) !== null
  };
}

/* De més nova a més vella; les que no tenen data, al final; els empats, per ruta. */
function perMesNova(a, b) {
  if (a.creat !== b.creat) {
    if (a.creat === null) return 1;
    if (b.creat === null) return -1;
    return a.creat < b.creat ? 1 : -1;
  }
  if (a.ruta === b.ruta) return 0;
  return a.ruta < b.ruta ? -1 : 1;
}

/**
 * Les imatges que la persona de la sessió ha pujat al bucket públic, de més
 * nova a més vella (capacitat 'mitjansPropis').
 * @param {object} config
 * @returns {Promise<Array<{ ref: string, ruta: string, nom: string, carpeta: string, creat: string|null,
 *   mida: number|null, etag: string|null, tipus: string|null, esborrable: boolean }>>}
 *   [] en seed o local, sense sessió o amb un usuari que no és UUID. Rebutja
 *   amb `codi` (i `code`) de CODI_MITJANS o CODI_BACKEND_INABASTABLE.
 */
export const llistaElsMeusMitjans = async (config = {}) => {
  if (esModeLocal(config)) return [];
  const propietari = propietariDeSessio(config);
  if (!propietari.uid) return [];
  // El llegat es llista sempre: és una petició més i ningú l'esborra des d'ací.
  const arrels = propietari.poble ? [`${propietari.poble}/${propietari.uid}`, propietari.uid] : [propietari.uid];
  try {
    const cubell = (await getClient(config)).storage.from(CUBELL_PUBLIC);
    const fitxers = (await Promise.all(arrels.map((arrel) => fitxersDeLArrel(cubell, arrel)))).flat();
    return fitxers.map((entrada) => mitjaDeFitxer(entrada, propietari)).filter(Boolean).sort(perMesNova);
  } catch (error) {
    console.warn('[Storage] llistat de la biblioteca rebutjat', diagnosiDeStorage(error));
    throw ambCode(errorDeStorage(error, PREFIX_LLISTAT, TEXTOS_BIBLIOTECA));
  }
};

/**
 * Esborra de veritat una foto de la biblioteca del Perfil (capacitat
 * 'mitjansPropis'): només 'sdp-media://mitjans/<poble>/<uid>/avatars/<fitxer>'
 * del poble resolt i de la persona de la sessió (Mitja.esborrable).
 * @param {string} ref
 * @param {object} config
 * @returns {Promise<void>} Rebutja amb `codi` (i `code`): 'no-disponible' en seed
 *   o local; CODI_MITJANS.SESSIO sense sessió; CODI_MITJANS.SENSE_PERMIS si la ref
 *   no és esborrable o el servidor no n'ha esborrat res; la resta, com la pujada.
 */
export const esborraElMeuMitja = async (ref, config = {}) => {
  if (esModeLocal(config)) throw rebuigDEsborrat(CODI_NO_DISPONIBLE, 'en este mode no hi ha cap servidor de fitxers.');
  const propietari = propietariDeSessio(config);
  if (!propietari.sessio) throw rebuigDEsborrat(CODI_MITJANS.SESSIO, 'cal iniciar sessió.');
  const ruta = rutaEsborrable(ref, propietari);
  if (!ruta) throw rebuigDEsborrat(CODI_MITJANS.SENSE_PERMIS, 'només es poden esborrar les fotos que has pujat al teu perfil.');
  let data;
  let error;
  try {
    const cubell = (await getClient(config)).storage.from(CUBELL_PUBLIC);
    ({ data, error } = await ambTermini(TEMPS_STORAGE_MS, (signal) => ambSenyalDelTermini(cubell, signal).remove([ruta])));
  } catch (excepcio) {
    error = excepcio;
  }
  if (error) {
    console.warn('[Storage] esborrat rebutjat', diagnosiDeStorage(error));
    throw ambCode(errorDeStorage(error, PREFIX_ESBORRAT, TEXTOS_BIBLIOTECA));
  }
  /* Storage respon amb la llista del que ha esborrat: buida vol dir que no n'ha
     esborrat res (ja no hi era, o una política l'ha filtrada). No és cap èxit. */
  if (Array.isArray(data) && data.length === 0) {
    throw rebuigDEsborrat(CODI_MITJANS.SENSE_PERMIS, 'el servidor no l’ha esborrada: potser ja no hi era o no tens permís.');
  }
};
