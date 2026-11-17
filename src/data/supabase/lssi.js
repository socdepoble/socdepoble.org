/** P0-114 · Transport de la revisió humana. L'autoritat i la quota són SQL.
 * Sense simulació seed/local: una migració absent és un error, mai una safata buida.
 */
import { getResolvedConfig, rpc } from './runtime.js';
import { denunciaContingut } from './moderacio.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ESTATS = new Set(['pendent', 'revisada', 'desestimada', 'retirada']);
function invalida() { return Object.assign(new TypeError('Paràmetres LSSI invàlids.'), { code: 'lssi-invalid' }); }
function respostaInvalida() { return Object.assign(new Error('Resposta LSSI invàlida.'), { code: 'lssi-resposta-invalida' }); }
const textOpcional = (v, limit) => v === null || (typeof v === 'string' && [...v].length <= limit);
const data = v => typeof v === 'string' && Number.isFinite(Date.parse(v));
function filaDeSafata(r, estat) {
  if (!r || Array.isArray(r) || typeof r.id !== 'string' || !UUID.test(r.id)
      || typeof r.publicacioId !== 'string' || !UUID.test(r.publicacioId)
      || typeof r.tenantId !== 'string' || !UUID.test(r.tenantId)
      || !['mur', 'mercat', 'events', 'multimedia'].includes(r.seccio)
      || !['ofensiu', 'spam_frau', 'desinformacio', 'altre'].includes(r.motiu)
      || r.estat !== estat || !textOpcional(r.detall, 1000) || !data(r.creatAl)
      || !(r.revisadaAl === null || data(r.revisadaAl))
      || typeof r.estatContingut !== 'string' || r.estatContingut.length > 100
      || !textOpcional(r.justificacio, 2000)) throw respostaInvalida();
  // El port mai propaga autoria, denunciant, IP ni camps aliens del transport.
  return Object.freeze(Object.fromEntries(['id', 'publicacioId', 'tenantId', 'seccio', 'motiu', 'detall',
    'estat', 'creatAl', 'revisadaAl', 'estatContingut', 'justificacio'].map(k => [k, r[k]])));
}
function remot(config) {
  if (['seed', 'local'].includes(getResolvedConfig(config).runtimeDataMode)) {
    throw Object.assign(new Error('La revisió LSSI requerix servidor.'), { code: 'no-disponible' });
  }
}

export async function registraDenunciaPublica({ publicacioId, motiu, detall } = {}, config = {}) {
  if (typeof publicacioId !== 'string' || !UUID.test(publicacioId)) throw invalida();
  remot(config);
  return denunciaContingut({ objecte: { tipus: 'publicacio', id: publicacioId.toLowerCase() }, motiu, detall, murPublic: true }, config);
}

export async function adminSafataDenuncies({ estat = 'pendent', limit = 50 } = {}, config = {}) {
  if (!ESTATS.has(estat) || !Number.isInteger(limit) || limit < 1 || limit > 100) throw invalida();
  remot(config);
  const result = await rpc('admin_safata_denuncies_lssi', { p_estat: estat, p_limit: limit }, config, { signal: config.signal });
  if (!Array.isArray(result) || result.length > limit) throw respostaInvalida();
  return result.map(r => filaDeSafata(r, estat));
}

export async function adminRevisaDenuncia({ id, decisio, justificacio, estatEsperat = 'pendent' } = {}, config = {}) {
  if (typeof id !== 'string' || !UUID.test(id) || !ESTATS.has(decisio) || decisio === 'pendent'
      || estatEsperat !== 'pendent' || typeof justificacio !== 'string'
      || !justificacio.trim() || [...justificacio.trim()].length > 2000) throw invalida();
  remot(config);
  const result = await rpc('admin_revisa_denuncia_lssi', { p_id: id.toLowerCase(), p_decisio: decisio,
    p_justificacio: justificacio.trim(), p_estat_esperat: estatEsperat }, config, { signal: config.signal });
  if (result?.id !== id.toLowerCase() || result?.estat !== decisio || typeof result?.repetida !== 'boolean') {
    throw respostaInvalida();
  }
  return Object.freeze({ id: result.id, estat: result.estat, repetida: result.repetida });
}
