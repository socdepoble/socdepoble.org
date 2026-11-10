import { getResolvedConfig, rpc } from './runtime.js';
import { capturaSessio } from '../identitat.js';
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const ESTATS_CULTURALS = Object.freeze(['pendent_revisio', 'aprovat', 'correccio', 'descartat']);
async function consulta(nom, params, config) {
  if (!getResolvedConfig(config).hasSupabaseConfig) throw Object.assign(new Error('Curadoria sense servidor configurat.'), { code: 'no-disponible' });
  const vigilaSessio = capturaSessio();
  const valor = await rpc(nom, params, config, { signal: config.signal });
  // Token renewal preserves the login; logout, account switch or re-entry do not.
  vigilaSessio();
  if (config.signal?.aborted) throw new DOMException('La sessió ha canviat.', 'AbortError');
  return valor;
}
export async function estatCuradoriaCultural(config = {}) {
  const v = await consulta('estat_curadoria_cultural', {}, config);
  if (!v || typeof v.autenticat !== 'boolean' || typeof v.pot_curar !== 'boolean' || typeof v.ingestio_disponible !== 'boolean' || v.ingestio_disponible !== false || (!v.autenticat && v.pot_curar)) throw new TypeError('Estat cultural invàlid.');
  return { autenticat: v.autenticat, potCurar: v.pot_curar, ingestioDisponible: false };
}
export function validaAportacionsCulturals(v) {
  if (!Array.isArray(v) || v.length > 200) throw new TypeError('Safata cultural invàlida.');
  return v.map(f => {
    if (!f || !UUID.test(f.id) || !ESTATS_CULTURALS.includes(f.estat) || !Number.isFinite(Date.parse(f.creat_a)) || ['titol','autoria','poble','contingut','nota'].some(k => typeof f[k] !== 'string') || f.titol.length > 200 || f.autoria.length > 200 || f.poble.length > 200 || f.contingut.length > 20000 || f.nota.length > 4000) throw new TypeError('Aportació cultural invàlida.');
    return { id: f.id, titol: f.titol, autoria: f.autoria, poble: f.poble, contingut: f.contingut, nota: f.nota, estat: f.estat, creatA: f.creat_a };
  });
}
export async function llistaAportacionsCulturals(config = {}) {
  return validaAportacionsCulturals(await consulta('llista_aportacions_culturals', {}, config));
}
export async function enviaAportacioCultural(entrada, config = {}) {
  if (!entrada || entrada.permisos !== true || ['titol','autoria','poble','contingut'].some(k => typeof entrada[k] !== 'string' || !entrada[k].trim()) || entrada.titol.length > 200 || entrada.autoria.length > 200 || entrada.poble.length > 200 || entrada.contingut.length > 20000) throw new TypeError('Cal completar els camps i declarar els permisos.');
  const f = Object.fromEntries(['titol','autoria','poble','contingut'].map(k => ['p_'+k, entrada[k].trim()]));
  return validaAportacionsCulturals([await consulta('envia_aportacio_cultural', { ...f, p_permisos: true }, config)])[0];
}
export async function revisaAportacioCultural(entrada, config = {}) {
  if (!entrada || !UUID.test(entrada.id) || !ESTATS_CULTURALS.includes(entrada.estat) || typeof entrada.nota !== 'string' || entrada.nota.length > 4000) throw new TypeError('Revisió cultural invàlida.');
  return validaAportacionsCulturals([await consulta('revisa_aportacio_cultural', { p_id: entrada.id, p_estat: entrada.estat, p_nota: entrada.nota }, config)])[0];
}
