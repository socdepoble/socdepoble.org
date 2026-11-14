/* R24 · CODEX-R24-03 · Capacitat 'consensIsoglosses' sobre Supabase (src/data/contracte.js).
   Els objectes SQL són els de les migracions R23 de la capacitat (encara NO aplicades: les
   aplica el Mestre), citats pel nom de l'objecte i no pel del fitxer, que es pot reanomenar:
     lligConsensIsoglossesPoble → RPC public.resum_consens_isoglosses_poble(p_pregunta_id text),
       SECURITY DEFINER, executable per anon i authenticated, només recomptes agregats;
     votaVariantIsoglossaPoble  → INSERT a public.joc_isoglosses_vots_consens amb
       ON CONFLICT (user_id, pregunta_id, variant_clau) DO NOTHING (la UNIQUE
       joc_isoglosses_vot_unic_usuari_variant; authenticated no té UPDATE);
     desaAportacioVeuPoble      → INSERT a public.aportacions_veu_poble (RLS: user_id =
       auth.uid(), consentiment obert i estat_moderacio 'pendent', el valor per defecte).
   user_id surt de la sessió capturada en cridar, mai dels arguments. Fora del mode remot o
   sense servidor configurat, cap petició: 'no-disponible', i la targeta continua en el seu
   mode local honest. Un esquema absent (PGRST202 o PGRST205) també és 'no-disponible'. */
import { getCurrentUser, getResolvedConfig, request, rpc } from './runtime.js';
import { capturaSessio } from '../identitat.js';
import {
  aportacioDelServidor, capturaAportacioVeu, capturaConsultaConsens, capturaVotVariant, errorConsens,
  filaDAportacio, filaDeVot, resumConsensDelServidor, votDelServidor
} from '../consensIsoglosses.js';

const ESQUEMA_ABSENT = new Set(['PGRST202', 'PGRST205']);
const cancelacio = () => new DOMException('Operació cancel·lada.', 'AbortError');

function prepara(config, ambSessio) {
  const net = config && typeof config === 'object' && !Array.isArray(config) ? config : {};
  if (net.signal?.aborted) throw cancelacio();
  const resolt = getResolvedConfig(net);
  if (resolt.runtimeDataMode !== 'remote' || !resolt.hasSupabaseConfig) {
    throw errorConsens('no-disponible', 'El consens col·lectiu necessita el servidor del Mas en mode remot.');
  }
  const sessio = capturaSessio();
  const persona = getCurrentUser()?.id ?? null;
  if (ambSessio && !persona) throw errorConsens('sense-sessio', 'Cal iniciar sessió per a votar o aportar una variant.', { status: 401 });
  const comprova = () => {
    if (net.signal?.aborted) throw cancelacio();
    if (!ambSessio) return;
    sessio();
    if ((getCurrentUser()?.id ?? null) !== persona) throw new DOMException('La sessió ha canviat.', 'AbortError');
  };
  return { config: net, persona, comprova };
}

async function envia(ctx, fn) {
  let valor;
  try { valor = await fn(); }
  catch (error) {
    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') throw error;
    if (error?.status === 404 && ESQUEMA_ABSENT.has(error?.postgrestCode)) {
      throw errorConsens('no-disponible', 'El servidor encara no té el consens d’isoglosses.', { cause: error, status: 404 });
    }
    throw error;
  }
  ctx.comprova();
  return valor;
}

export async function lligConsensIsoglossesPoble(entrada, config = {}) {
  const { preguntaId } = capturaConsultaConsens(entrada);
  const ctx = prepara(config, false);
  const files = await envia(ctx, () => rpc('resum_consens_isoglosses_poble', { p_pregunta_id: preguntaId }, ctx.config, { signal: ctx.config.signal }));
  return resumConsensDelServidor(files);
}

export async function votaVariantIsoglossaPoble(entrada, config = {}) {
  const vot = capturaVotVariant(entrada);
  const ctx = prepara(config, true);
  const files = await envia(ctx, () => request(
    '/rest/v1/joc_isoglosses_vots_consens?on_conflict=user_id,pregunta_id,variant_clau&select=pregunta_id,variant_clau',
    ctx.config,
    { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' }, body: [filaDeVot(vot, ctx.persona)], signal: ctx.config.signal }
  ));
  return votDelServidor(files, vot);
}

export async function desaAportacioVeuPoble(entrada, config = {}) {
  const aportacio = capturaAportacioVeu(entrada);
  const ctx = prepara(config, true);
  const files = await envia(ctx, () => request(
    '/rest/v1/aportacions_veu_poble?select=id,estat_moderacio,created_at',
    ctx.config,
    { method: 'POST', headers: { Prefer: 'return=representation' }, body: [filaDAportacio(aportacio, ctx.persona)], signal: ctx.config.signal }
  ));
  return aportacioDelServidor(files);
}
