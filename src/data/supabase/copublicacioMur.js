import { creaCuaRevocacionsMur } from '../copublicacioMur.js';
import { getCurrentUser, getResolvedConfig, request } from './runtime.js';
import { versioSessio } from '../identitat.js';
import { marcaPublicacioEsborrada } from '../publicacionsEsborrades.js';

/* Gauntlet R22 (ronda 3, dades-03) · El drenatge va en segon pla (content.js ·
   loadSections no l'espera; tampoc el rellotge ni els despertars): la lectura
   del Mur pot arribar abans que l'ACK i portar encara la publicació. Amb l'ACK
   (només amb ell: true del servidor), la publicació retirada s'anota al
   registre de publicacions esborrades, com fa NotesContext quan la retirada
   es confirma a l'instant (retiraPublicacionsDeLaNota): el Mur, el Mercat i
   l'Agenda d'esta pestanya la deixen de mostrar sense esperar cap recàrrega.
   L'acte retirat i, com allà, l'id de la nota (les publicacions d'abans de
   R21 tenien el mateix id que la nota). */
function amagaLaRetirada(id, { tipus, publicacioId }) {
  const ids = new Set([String(id)]);
  if (tipus === 'nota' && publicacioId) ids.add(String(publicacioId));
  for (const publicacio of ids) {
    for (const seccio of ['mur', 'mercat', 'events']) marcaPublicacioEsborrada(seccio, publicacio);
  }
}

const configs = new Map();
let escoltant = false;
let generacio = 0;
let rellotge = null;
let termini = Infinity;
function scope(config) {
  const c = getResolvedConfig(config), user = getCurrentUser()?.id;
  if (c.runtimeDataMode !== 'remote' || !c.hasSupabaseConfig || !c.tenantId || !user)
    throw new Error('Cal una sessió remota per retirar la publicació.');
  return { backend: c.supabaseUrl, tenant: c.tenantId, user };
}
function cua(config) {
  const original = scope(config);
  const epoch = versioSessio, lifecycle = generacio;
  return creaCuaRevocacionsMur({ obteAbast: () => {
    if (epoch !== versioSessio || lifecycle !== generacio) throw new DOMException('La sessió o el port han canviat.', 'AbortError');
    if (getCurrentUser()?.id !== original.user) throw new DOMException('La sessió ha canviat.', 'AbortError');
    const current = scope(config);
    if (current.user !== original.user) throw new DOMException('La sessió ha canviat.', 'AbortError');
    return current;
  }, envia: async (id, intent) => {
    if (epoch !== versioSessio || lifecycle !== generacio) throw new DOMException('La sessió o el port han canviat.', 'AbortError');
    const current = scope(config);
    if (current.user !== original.user) throw new DOMException('La sessió ha canviat.', 'AbortError');
    const nota = intent.tipus === 'nota';
    const ack = await request(`/rest/v1/rpc/${nota ? 'revoca_publicacio_de_nota' : 'revoca_publicacio_mur'}`, config, {
      method: 'POST', body: { p_id: id, p_tenant_id: current.tenant, ...(nota ? { p_expected_revision: intent.revision, p_publicacio_id: intent.publicacioId } : {}) }
    });
    if (ack !== true) throw new Error('El servidor no ha confirmat la retirada.');
    amagaLaRetirada(id, intent);
  } });
}
function alTornar() {
  for (const config of configs.values()) void drenaRevocacionsMur(config).catch(() => {});
}
function quanVisible() { if (globalThis.document?.visibilityState === 'visible') alTornar(); }
function recorda(config) {
  const s = scope(config);
  configs.set(JSON.stringify([s.backend, s.tenant, s.user]), config);
  if (!escoltant && globalThis.window?.addEventListener) {
    window.addEventListener('online', alTornar);
    window.addEventListener('focus', alTornar);
    globalThis.document?.addEventListener?.('visibilitychange', quanVisible); escoltant = true;
  }
}
export function destroy() {
  generacio += 1;
  if (escoltant) { window.removeEventListener('online', alTornar); window.removeEventListener('focus', alTornar); globalThis.document?.removeEventListener?.('visibilitychange', quanVisible); }
  clearTimeout(rellotge); rellotge = null; termini = Infinity;
  escoltant = false; configs.clear();
}
function programa(when) {
  if (!Number.isFinite(when) || when >= termini) return;
  clearTimeout(rellotge); termini = when;
  rellotge = setTimeout(() => { rellotge = null; termini = Infinity; alTornar(); }, Math.max(50, when - Date.now()));
  rellotge.unref?.();
}
export async function drenaRevocacionsMur(config = {}) {
  if (!getCurrentUser()?.id || !globalThis.indexedDB) return { pendents: 0, seguentIntent: null };
  const c = getResolvedConfig(config);
  if (c.runtimeDataMode !== 'remote' || !c.hasSupabaseConfig) return { pendents: 0, seguentIntent: null };
  recorda(config);
  try { const result = await cua(config).drena(); programa(result.seguentIntent); if (result.pendents === 0) globalThis.window?.dispatchEvent?.(new Event('sdp-mur-revocat')); return result; }
  catch(e) { programa(e.seguentIntent); throw e; }
}
export async function revocaPublicacioMur(id, config = {}) {
  const q = cua(config);
  await q.encua(id, { reintentaRebutjada: true }); recorda(config);
  try { await drenaRevocacionsMur(config); }
  catch(e) { if (e?.name === 'AbortError' || !e.revocacioPendent) throw e; }
  const state = await q.estat(id);
  return { id, pendent: state?.pendent !== false };
}
export async function comprovaPublicacioNoRetirada(id, config = {}) {
  if (!getCurrentUser()?.id || !globalThis.indexedDB) return;
  if (await cua(config).estaRetirada(id)) {
    throw Object.assign(new Error('Esta publicació està retirada. Per tornar a publicar cal un UUID nou.'), { codi: 'MUR_PUBLICACIO_RETIRADA' });
  }
}

/* Gauntlet R22 (dades-04) · Fora del mode remot (llavor o local) no hi ha cap
   Mur de servidor que retirar: res a encuar, i ho diu ({ pendent: false }) en
   lloc de llançar un error que tapava el de la mutació. Sense IndexedDB, la
   cua sí que llança (MUR_REVOCACIO_PERSISTENCIA): el port conserva l'error
   original i el marca revocacioNoPersistida. */
const UUID_REVOCACIO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function encuaRevocacioNotaMur(id, revision, config = {}, publicacioId = null) {
  // Una entrada invàlida rebutja sempre, en qualsevol mode (contracte del port).
  if (!UUID_REVOCACIO.test(String(id)) || !Number.isSafeInteger(revision) || revision < 0
      || (publicacioId !== null && !UUID_REVOCACIO.test(String(publicacioId)))) throw new TypeError('Intent de revocació invàlid.');
  const c = getResolvedConfig(config);
  if (c.runtimeDataMode !== 'remote' || !c.hasSupabaseConfig || !getCurrentUser()?.id) return { id, pendent: false };
  const q = cua(config);
  await q.encua(id, { tipus: 'nota', revision, publicacioId });
  programa(Date.now());
  recorda(config);
  return { id, pendent: true };
}
