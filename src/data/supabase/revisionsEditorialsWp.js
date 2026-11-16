import { getResolvedConfig, rpc } from './runtime.js';
import { capturaSessio } from '../identitat.js';

export const ESTATS_REVISIO_WP_REMOT = Object.freeze([
  'pendent_admin',
  'aprovat',
  'amb_observacions'
]);

const RE_DESTI = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/* Onada R30 · P1-79 (àrbitre) · El mateix criteri que runtime.js: només el codi PGRST202 del
   protocol demostra que la funció no hi és. Es copia ací perquè les proves que simulen
   runtime.js no l'han d'exportar. */
const esRpcAbsent = (error) => error?.status === 404 && error?.postgrestCode === 'PGRST202';
const esConflicteDeVersio = (error) => error?.sqlstate === '40001' || error?.postgrestCode === '40001'
  || String(error?.message).includes('SDP-WP-REV-409');

async function consulta(nom, params, config = {}) {
  if (!getResolvedConfig(config).hasSupabaseConfig) {
    throw Object.assign(new Error('Revisions editorials sense servidor configurat.'), { code: 'no-disponible' });
  }
  const vigilaSessio = capturaSessio();
  const valor = await rpc(nom, params, config, { signal: config.signal });
  vigilaSessio();
  if (config.signal?.aborted) throw new DOMException('La sessió ha canviat.', 'AbortError');
  return valor;
}

export function validaFilaRevisioEditorialWp(f) {
  if (
    !f
    || typeof f !== 'object'
    || !Number.isInteger(f.wp_id)
    || f.wp_id <= 0
    || !ESTATS_REVISIO_WP_REMOT.includes(f.estat)
    || typeof f.nota !== 'string'
    || f.nota.length > 4000
    || typeof f.autoria !== 'string'
    || !f.autoria.trim()
    || f.autoria.length > 256
    || typeof f.desti !== 'string'
    || f.desti.length > 64
    || !RE_DESTI.test(f.desti)
    || typeof f.actualitzat_a !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(f.actualitzat_a) || !Number.isFinite(Date.parse(f.actualitzat_a))
  ) {
    throw new TypeError('Fila de revisió editorial WordPress invàlida.');
  }
  return {
    wpId: f.wp_id,
    estat: f.estat,
    nota: f.nota,
    autoria: f.autoria,
    desti: f.desti,
    actualitzatA: f.actualitzat_a
  };
}

export async function llistaRevisionsEditorialsWp(config = {}) {
  const brut = await consulta('llista_revisions_editorials_wp', {}, config);
  if (!Array.isArray(brut) || brut.length > 1000) {
    throw new TypeError('Llista de revisions editorials WordPress invàlida.');
  }
  return brut.map(validaFilaRevisioEditorialWp);
}

export async function desaRevisioEditorialWp(entrada, config = {}) {
  if (
    !entrada
    || typeof entrada !== 'object'
    || Array.isArray(entrada)
    || !Number.isInteger(entrada.wpId)
    || entrada.wpId <= 0
    || !ESTATS_REVISIO_WP_REMOT.includes(entrada.estat)
    || (entrada.nota !== undefined && (typeof entrada.nota !== 'string' || entrada.nota.length > 4000))
    || (entrada.autoria !== undefined && (typeof entrada.autoria !== 'string' || !entrada.autoria.trim() || entrada.autoria.length > 256))
    || (entrada.desti !== undefined && (typeof entrada.desti !== 'string' || entrada.desti.length > 64 || !RE_DESTI.test(entrada.desti)))
  ) {
    throw new TypeError('Entrada de revisió editorial WordPress invàlida.');
  }
  if (entrada.actualitzatEsperat != null && (typeof entrada.actualitzatEsperat !== 'string' || !Number.isFinite(Date.parse(entrada.actualitzatEsperat)))) throw new TypeError('Versió editorial esperada invàlida.');
  const params = {
    p_wp_id: entrada.wpId,
    p_estat: entrada.estat,
    p_nota: entrada.nota ?? '',
    p_autoria: entrada.autoria ? entrada.autoria.trim() : 'Sóc de Poble',
    p_desti: entrada.desti ?? 'mur'
  };
  const conflicte = (cause) => Object.assign(new Error('La revisió ha canviat. Revisa la versió del servidor abans de tornar a desar.'), { code: 'conflicte-versio', cause });
  let resposta;
  try {
    resposta = await consulta('desa_revisio_editorial_wp_cas', { ...params, p_actualitzat_esperat: entrada.actualitzatEsperat ?? null }, config);
  } catch (cause) {
    if (esConflicteDeVersio(cause)) throw conflicte(cause);
    /* Onada R30 · P1-79 (àrbitre) · Un servidor sense 20261115230000 (producció fins que el
       Mestre l'aplique) no té la RPC CAS: es desa amb la signatura de sempre, com fins ara
       (sense guarda de versió). Amb la migració, eixa mateixa signatura només pot crear, de
       manera que este camí mai no és un bypass del CAS. Cap altre error no hi recorre. */
    if (!esRpcAbsent(cause)) throw cause;
    try {
      resposta = await consulta('desa_revisio_editorial_wp', params, config);
    } catch (anterior) {
      if (esConflicteDeVersio(anterior)) throw conflicte(anterior);
      throw anterior;
    }
  }
  return validaFilaRevisioEditorialWp(resposta);
}
