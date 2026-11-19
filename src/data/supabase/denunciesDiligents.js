import { capturaSessio } from '../identitat.js';
import { getResolvedConfig, rpc } from './runtime.js';
import { ESTATS_DENUNCIA_DILIGENT, normalitzaDenunciaDiligent, normalitzaRevisioDiligent, rebutDenunciaDiligent, filaDenunciaDiligent } from '../moderacio/denunciesDiligents.js';
function remot(config) { if (getResolvedConfig(config).runtimeDataMode !== 'remote') throw Object.assign(new Error('La denúncia diligent requerix servidor.'), { code: 'LSSI_DILIGENT_UNAVAILABLE' }); }
export async function registraDenunciaDiligent(input, config = {}) {
  const v = normalitzaDenunciaDiligent(input), check = capturaSessio(); remot(config);
  const reply = await rpc('registra_denuncia_diligent', { p_publicacio: v.publicacioId, p_motiu: v.motiu, p_detall: v.detall, p_operacio: v.operacioId }, config, { signal: config.signal });
  check(); return rebutDenunciaDiligent(reply);
}
export async function revisaDenunciaDiligent(input, config = {}) {
  const v = normalitzaRevisioDiligent(input), check = capturaSessio(); remot(config);
  const reply = await rpc('revisa_denuncia_diligent', { p_id: v.id, p_estat_esperat: v.estatEsperat, p_versio: v.versio, p_estat: v.estat, p_justificacio: v.justificacio, p_operacio: v.operacioId }, config, { signal: config.signal });
  check(); const result = rebutDenunciaDiligent(reply);
  if (result.id !== v.id || result.estat !== v.estat || result.versio !== v.versio + 1) throw Object.assign(new Error('Rebut de revisió incongruent.'), { code: 'LSSI_DILIGENT_INVALID' });
  return result;
}
export async function llistaDenunciesDiligents({ estat = 'rebuda', limit = 50 } = {}, config = {}) {
  if (!ESTATS_DENUNCIA_DILIGENT.includes(estat) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new TypeError('Filtre de denúncies invàlid.');
  const check = capturaSessio(); remot(config);
  const reply = await rpc('llista_denuncies_diligents', { p_estat: estat, p_limit: limit }, config, { signal: config.signal });
  check();
  if (!Array.isArray(reply) || reply.length > limit) throw new TypeError('Safata de denúncies invàlida.');
  const rows = reply.map(filaDenunciaDiligent);
  if (rows.some(r => r.estat !== estat) || new Set(rows.map(r => r.id)).size !== rows.length) throw new TypeError('Safata de denúncies incongruent.');
  return rows;
}
