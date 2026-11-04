import { getCurrentUser, getResolvedConfig, rpc } from './runtime.js';
import { personalitzacioDeFiles } from './personalitzacio.js';
import { versioSessio } from '../identitat.js';
export async function adminListUsers(limit = 100, offset = 0, config = {}) {
  if (!getResolvedConfig(config).hasSupabaseConfig) return [];
  const rows = await rpc('admin_list_users', { p_limit: limit, p_offset: offset }, config);
  return Array.isArray(rows) ? rows : [];
}
export async function adminListOrganizations(config = {}) {
  if (!getResolvedConfig(config).hasSupabaseConfig) return [];
  const rows = await rpc('admin_list_organizations', {}, config); return Array.isArray(rows) ? rows : [];
}

const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const abastInvalid = () => Object.assign(new TypeError('Cal el tenant explícit i vàlid del poble seleccionat.'), { code: 'abast-invalid' });
function configuraMultipoble(config) {
  const tenantExplicit = config.tenantId ?? config.tenant_id;
  if (tenantExplicit !== undefined && !UUID.test(tenantExplicit)) throw abastInvalid();
  const resolt = getResolvedConfig(config);
  if (resolt.runtimeDataMode !== 'remote' || !resolt.hasSupabaseConfig) {
    throw Object.assign(new Error('La gestió multipoble requerix un servidor configurat.'), { code: 'no-disponible' });
  }
  if (!getCurrentUser()?.id) throw Object.assign(new Error('Cal iniciar sessió.'), { code: 'sense-sessio' });
  return resolt;
}
export async function adminLlistaPobles(config = {}) {
  configuraMultipoble(config);
  const epoch = versioSessio;
  const rows = await rpc('admin_llista_pobles', {}, config, { signal: config.signal });
  if (epoch !== versioSessio || config.signal?.aborted) throw new DOMException('La sessió ha canviat.', 'AbortError');
  if (!Array.isArray(rows) || rows.some(r => !r || !UUID.test(r.id) || typeof r.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug) || typeof r.nom !== 'string' || !r.nom.trim())
    || new Set(rows.map(r => r.id)).size !== rows.length) throw new TypeError('Resposta de pobles administrats invàlida.');
  return rows.map(({ id, slug, nom }) => ({ id, slug, nom }));
}
export async function adminLligPersonalitzacio(config = {}) {
  if (!UUID.test(config.tenantId ?? config.tenant_id ?? '')) throw abastInvalid();
  const { tenantId } = configuraMultipoble(config);
  const epoch = versioSessio;
  const resultat = await rpc('admin_llegix_personalitzacio', { p_tenant_id: tenantId }, config, { signal: config.signal });
  if (epoch !== versioSessio || config.signal?.aborted) throw new DOMException('La sessió ha canviat.', 'AbortError');
  if (!resultat || resultat.tenantId !== tenantId || !Array.isArray(resultat.files)
    || resultat.files.some(r => !['taxonomia','estil'].includes(r?.key))) throw new TypeError('Resposta de personalització d’un altre poble o invàlida.');
  return personalitzacioDeFiles(resultat.files);
}
