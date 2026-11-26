import { rpc, getCurrentUser, getResolvedConfig } from './runtime.js';
import { capturaSessio, esBackendDeSessio } from '../identitat.js';
import { capturaIdPagina, capturaTaxonomiaPagina, projectaTaxonomiaPagina } from '../taxonomia/taxonomiaPagina.js';
/* v1.2.26 · #7 P2 (Gauntlet C26-3) · La guarda és la T2 d'xatCerca: el senyal, el backend de la sessió (backendScope
   porta el poble, l'endpoint i el mode) i la sessió capturada abans de la RPC. supabase/index.js ja ha capturat la
   sessió i una còpia de la configuració abans de l'import diferit d'este mòdul. */
function context(config) {
  const c = getResolvedConfig(config);
  if (c.runtimeDataMode !== 'remote' || !c.hasSupabaseConfig || !c.tenantId) throw Object.assign(new Error('L’edició de taxonomia requerix un servidor configurat.'), { code: 'no-disponible' });
  const viu = capturaSessio();
  const comprova = () => { config.signal?.throwIfAborted(); if (!esBackendDeSessio(config)) throw new DOMException('Àmbit canviat.', 'AbortError'); viu(); };
  comprova(); return { c, comprova };
}
/* v1.2.26 · #7 P2 (Gauntlet C26-3) · Els mateixos codis que el port local (taxonomiaPaginesLocal.js) i que els CAS
   germans (revisionsPagines.js, publicacionsPropies.js): el transport desa el SQLSTATE a `sqlstate`. 40001 és la
   versió llegida que ja no és la vigent; 42501, l'autoritat editorial que el servidor no reconeix. La resta passa tal
   qual, amb el cru intacte. */
function falla(causa) {
  if (causa?.name === 'AbortError') throw causa;
  const sql = causa?.sqlstate ?? causa?.postgrestCode;
  const code = causa?.status === 409 || sql === '40001' ? 'conflicte-versio' : sql === '42501' ? 'sense-permis' : null;
  if (!code) throw causa;
  throw Object.assign(new Error(code === 'conflicte-versio' ? 'La pàgina ha canviat. Recarrega abans de desar.' : 'Cal administració editorial de Sóc de Poble.'),
    { code, codi: code, status: code === 'conflicte-versio' ? 409 : causa?.status, cause: causa });
}
async function crida(ctx, nom, params, config) {
  let row;
  try { row = await rpc(nom, params, config, { signal: config.signal }); }
  catch (causa) { ctx.comprova(); falla(causa); }
  ctx.comprova(); return row;
}
export async function actualitzaTaxonomiaPagina(idPagina, input, config = {}) {
  const net = capturaTaxonomiaPagina(idPagina,input), ctx = context(config);
  if (!getCurrentUser()?.id) throw Object.assign(new Error('Cal iniciar sessió.'), { code: 'sense-sessio' });
  const row = await crida(ctx, 'actualitza_taxonomia_pagina', { p_tenant_id: ctx.c.tenantId, p_pagina_id: idPagina, p_canvis: net, p_versio: net.versio }, config);
  const result = projectaTaxonomiaPagina(row);
  if (result.idPagina !== idPagina || result.versio !== net.versio + 1) throw new TypeError('Resposta de taxonomia invàlida.');
  return result;
}
export async function lligTaxonomiaPagina(idPagina, config = {}) {
  capturaIdPagina(idPagina); const ctx = context(config);
  const row = await crida(ctx, 'llig_taxonomia_pagina', { p_tenant_id: ctx.c.tenantId, p_pagina_id: idPagina }, config);
  if (row == null) return null;
  const result = projectaTaxonomiaPagina(row);
  if (result.idPagina !== idPagina) throw new TypeError('Resposta de taxonomia invàlida.');
  return result;
}
