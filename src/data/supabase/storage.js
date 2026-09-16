/**
 * @module supabase/storage
 * @description Gestió de fitxers amb Supabase Storage.
 * @contract
 *   - uploadFile(bucket, path, file)
 *   - downloadFile(bucket, path)
 *   - deleteFile(bucket, path)
 *   - listFiles(bucket, path)
 *   - getPublicUrl(bucket, path)
 */

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
 * Puja un fitxer al bucket per defecte de mitjans, complint el contracte.
 * @param {File} fitxer
 * @param {object} options
 * @param {object} config
 */
export const uploadToStorage = async (fitxer, { carpeta = 'general' } = {}, config = {}) => {
  const supabase = await getClient(config);
  const user = usuariDeSessio();
  if (!user) throw new Error("Usuari no identificat per a pujar fitxers.");

  // El RLS exigix que el primer nivell de carpeta siga el user_id
  const extensio = fitxer.name.split('.').pop();
  const nomAleatori = crypto.randomUUID();
  const ruta = `${user.id}/${carpeta}/${nomAleatori}.${extensio}`;

  const { error } = await supabase.storage.from('mitjans').upload(ruta, fitxer, { upsert: true });
  if (error) throw new Error(handleError(error)?.message || "Error a l'enviar el fitxer al servidor.");

  const { data: publicData } = supabase.storage.from('mitjans').getPublicUrl(ruta);
  return { url: publicData.publicUrl, ruta };
};
