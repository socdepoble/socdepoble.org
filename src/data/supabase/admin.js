import { getCurrentUser, getResolvedConfig, rpc } from './runtime.js';
import { personalitzacioDeFiles } from './personalitzacio.js';
import { capturaSessio, versioSessio } from '../identitat.js';
import { capturaAdminUsuaris,validaLlistaAdminUsuaris,validaInvitacioAdmin,validaConnexioAdmin } from '../adminUsuaris.js';
async function adminUsuarisRpc(nom,entrada,operation,config) {
  const captured=capturaAdminUsuaris(entrada,operation);
  if(!UUID.test(config?.tenantId??config?.tenant_id??'')||config.tenantId&&config.tenant_id&&config.tenantId!==config.tenant_id)throw abastInvalid();
  const {tenantId}=configuraMultipoble(config);
  const epoch=versioSessio;
  const params=operation==='llista'?{p_limit:captured.limit,p_cursor_creat:captured.cursorCreat,p_cursor_id:captured.cursorId}:operation==='membre'
    ?{p_usuari_id:captured.usuariId,p_organitzacio_id:captured.organitzacioId}
    :{p_usuari_id:captured.usuariId};
  const value=await rpc(nom,{p_tenant_id:tenantId,...params},config,{signal:config.signal});
  if(epoch!==versioSessio||config.signal?.aborted)throw new DOMException('La sessió ha canviat.','AbortError');
  if(operation==='llista')return validaLlistaAdminUsuaris(value,captured.limit);
  if(operation==='membre')return validaInvitacioAdmin(value,captured);
  return validaConnexioAdmin(value,captured);
}
export const adminLlistaUsuarisRegistrats=(entrada={},config={})=>adminUsuarisRpc('admin_llista_usuaris_registrats',entrada,'llista',config);
// Compatibility name: this proposes an invitation; it never assigns membership.
export const adminAssignaMembreOrganitzacio=(entrada,config={})=>adminUsuarisRpc('admin_convida_a_entitat',entrada,'membre',config);
export const adminConnectaUsuari=(entrada,config={})=>adminUsuarisRpc('admin_connecta_usuari',entrada,'connecta',config);
export async function adminListUsers(limit = 100, offset = 0, config = {}) {
  if (!getResolvedConfig(config).hasSupabaseConfig) return [];
  const rows = await rpc('admin_list_users', { p_limit: limit, p_offset: offset }, config);
  return Array.isArray(rows) ? rows : [];
}
export async function adminListOrganizations(config = {}) {
  if (!getResolvedConfig(config).hasSupabaseConfig) return [];
  const rows = await rpc('admin_list_organizations', {}, config); return Array.isArray(rows) ? rows : [];
}
/* R13-C7 (ordre del Mestre, 08-11-2026) · Els recomptes de persones amb sessió activa per camí de
   2611082238_admin_resum_sessions_dispositius.sql. Com admin_list_users, la guarda és la del servidor
   (private.es_superadmin(), aal2); torna el JSON tal qual i src/data/resumSessionsDispositius.js el
   valida. Sense servidor configurat no hi ha cap xifra que tornar: no-disponible, mai un resum buit. */
export async function adminResumSessionsDispositius(config = {}) {
  if (!getResolvedConfig(config).hasSupabaseConfig) throw Object.assign(new Error('El resum de sessions requerix un servidor configurat.'), { code: 'no-disponible' });
  return rpc('admin_resum_sessions_dispositius', {}, config, { signal: config.signal });
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

export async function adminLlistaSessionsDispositius(entrada = {}, config = {}) {
  const vigilaSessio = capturaSessio();
  const { capturaFiltreSessions, validaSessionsDispositius } = await import('../sessionsDispositius.js');
  vigilaSessio();
  const { cerca, cami } = capturaFiltreSessions(entrada);
  if (!getResolvedConfig(config).hasSupabaseConfig) throw Object.assign(new Error('Cal un servidor configurat.'), { code: 'no-disponible' });
  const valor = await rpc('admin_llista_sessions_dispositius', { p_cerca: cerca, p_cami: cami }, config, { signal: config.signal });
  vigilaSessio();
  if (config.signal?.aborted) throw new DOMException('La sessió ha canviat.', 'AbortError');
  return validaSessionsDispositius(valor);
}
