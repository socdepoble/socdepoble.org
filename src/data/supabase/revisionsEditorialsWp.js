import { getResolvedConfig, rpc } from './runtime.js';
import { capturaSessio } from '../identitat.js';

export const ESTATS_REVISIO_WP_REMOT = Object.freeze([
  'pendent_admin',
  'aprovat',
  'amb_observacions'
]);

const RE_DESTI = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
    || !Number.isFinite(Date.parse(f.actualitzat_a))
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
  const resposta = await consulta(
    'desa_revisio_editorial_wp',
    {
      p_wp_id: entrada.wpId,
      p_estat: entrada.estat,
      p_nota: entrada.nota ?? '',
      p_autoria: entrada.autoria ? entrada.autoria.trim() : 'Sóc de Poble',
      p_desti: entrada.desti ?? 'mur'
    },
    config
  );
  return validaFilaRevisioEditorialWp(resposta);
}
