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
  if (!fitxer.size || fitxer.size > (isPrivate ? 25242880 : 5242880)) throw new Error('Mida de fitxer no admesa');
  const bucket = isPrivate ? 'mitjans_privats' : 'mitjans';
  const ruta = `${selectedTenant.toLowerCase()}/${user.id.toLowerCase()}/${carpeta}/${crypto.randomUUID()}.${extensions[fitxer.type]}`;
  const client = await getClient(config);
  const { error } = await client.storage.from(bucket).upload(ruta, fitxer, { upsert: false });
  if (error) throw new Error(handleError(error)?.message || 'No s’ha pogut pujar el fitxer');
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
      console.warn("[Storage] No s'ha pogut generar URL firmada per", path, error);
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
    console.warn("[Storage] Error baixant el fitxer per a promoure'l", downloadError);
    return ref; // Deixem l'original
  }

  // 2. El pugem al bucket públic en la mateixa ruta
  const { error: uploadError } = await uploadFile('mitjans', path, fileData, config);
  if (uploadError) {
    console.warn("[Storage] Error pujant el fitxer al promoure'l", uploadError);
    return ref; 
  }
  
  // C17 (Auditoria): No esborrem l'original per evitar pèrdua de dades si falla 
  // la persistència de la nova referència o la publicació al Mur.
  // await deleteFile('mitjans_privats', path, config);

  return `sdp-media://mitjans/${path}`;
};