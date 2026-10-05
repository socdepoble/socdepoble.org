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
 */

import { getResolvedConfig } from './runtime.js';
import { getClient } from './config.js';
import { usuariDeSessio } from '../identitat.js';
import { handleError } from './utils.js';
import { CODI_BACKEND_INABASTABLE, CODI_MITJANS, esBackendInabastable } from '../errorsBackend.js';

/* Límits per fitxer (ARQ-G07): 25 MiB al bucket privat, 5 MiB al públic. */
const MIDA_MAX_PRIVADA = 26214400;
const MIDA_MAX_PUBLICA = 5242880;

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
  const codi = codiDePujada(error);
  // L'estat de la resposta primer i, si no n'hi ha, el del cos; mai un text que no siga un estat.
  const status = estatHttp(error?.status) ?? estatHttp(error?.statusCode);
  const detall = codi === CODI_MITJANS.DESCONEGUT
    ? `error inesperat${status ? ` del servidor (HTTP ${status})` : ''}.`
    : TEXTOS_PUJADA[codi];
  return Object.assign(new Error(`${PREFIX_PUJADA} ${detall}`, { cause: error }), { codi, status });
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
    return await supabase.storage.from(bucket).upload(path, file);
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
    return await supabase.storage.from(bucket).download(path);
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
    return await supabase.storage.from(bucket).remove(paths);
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
    return await supabase.storage.from(bucket).list(path);
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
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(selectedTenant || '') || !uuid.test(user.id)) throw new Error('Poble o usuari invàlid');
  if (!/^[a-z0-9_-]{1,40}$/.test(carpeta)) throw new Error('Carpeta invàlida');
  const extensions = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/avif': 'avif', 'application/pdf': 'pdf' };
  const isPrivate = carpeta === 'notes';
  if (!(fitxer instanceof Blob) || !extensions[fitxer.type] || (!isPrivate && fitxer.type === 'application/pdf'))
    throw new Error('Format de fitxer no admés en este destí');
  if (!fitxer.size || fitxer.size > (isPrivate ? MIDA_MAX_PRIVADA : MIDA_MAX_PUBLICA)) throw new Error('Mida de fitxer no admesa');
  const bucket = isPrivate ? 'mitjans_privats' : 'mitjans';
  const ruta = `${selectedTenant.toLowerCase()}/${user.id.toLowerCase()}/${carpeta}/${crypto.randomUUID()}.${extensions[fitxer.type]}`;
  const client = await getClient(config);
  const { error } = await client.storage.from(bucket).upload(ruta, fitxer, { upsert: false });
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
  
  const supabase = await getClient(config);
  
  if (bucket === 'mitjans_privats') {
    // URL firmada amb 1 hora de duració (3600 segons)
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
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
  
  // 1. Descarreguem l'arxiu des del bucket privat
  const { data: fileData, error: downloadError } = await downloadFile('mitjans_privats', path, config);
  if (downloadError) {
    // F2 · Sense l'error cru de l'SDK ni el text de handleError (diagnosiDeStorage).
    console.warn("[Storage] Error baixant el fitxer per a promoure'l", diagnosiDeStorage(downloadError));
    return ref; // Deixem l'original
  }

  // 2. El pugem al bucket públic en la mateixa ruta
  const { error: uploadError } = await uploadFile('mitjans', path, fileData, config);
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
