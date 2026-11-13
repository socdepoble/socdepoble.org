import { capturaSessio } from '../identitat.js';
import {
  capturaConsultaPublicadors, capturaReversioPublicacio, capturaTraspasPublicacio,
  errorCopublicacio, publicacioPerDefecte, validaRespostaCopublicacio
} from '../copublicacio.js';
import { esRpcAbsent, getCurrentUser, getResolvedConfig, rpc } from './runtime.js';
import { esCapacitatRpcNoDisponible, rpcOpcional } from './capacitatRpc.js';

const ERRORS_RPC = Object.freeze({
  '001': 'publicacio-invalida',
  '002': 'publicacio-inexistent',
  '003': 'publicador-no-registrat',
  '004': 'conflicte-versio',
  '005': 'operacio-reutilitzada',
  '006': 'publicador-oficial-no-configurat',
  '007': 'cal-segon-factor',
  '008': 'sense-permis'
});

function errorDeServidor(causa) {
  const id = String(causa?.message ?? '').match(/SDP-COPUB-(\d{3})\b/)?.[1];
  if (id && Object.hasOwn(ERRORS_RPC, id)) return errorCopublicacio(ERRORS_RPC[id]);
  if (esRpcAbsent(causa) || esCapacitatRpcNoDisponible(causa)) return errorCopublicacio('no-disponible');
  return causa;
}

function comprovaSenyal(config) {
  if (config.signal?.aborted) throw new DOMException('Operació cancel·lada.', 'AbortError');
}

function parametres(tenantId, { recursTipus, recursId }) {
  return { p_tenant_id: tenantId, p_tipus: recursTipus, p_recurs_id: recursId };
}

export async function lligPublicadorsRegistrats(entrada, config = {}) {
  const recurs = capturaConsultaPublicadors(entrada);
  comprovaSenyal(config);
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (runtimeDataMode !== 'remote') return publicacioPerDefecte(recurs);
  if (!hasSupabaseConfig || !tenantId) throw errorCopublicacio('no-disponible');
  const comprovaSessio = capturaSessio();
  let resposta;
  try {
    resposta = await rpcOpcional('llig_publicadors_registrats', parametres(tenantId, recurs), config,
      { signal: config.signal, disponible: import.meta.env.VITE_SDP_COPUBLICACIO === '1' });
  } catch (causa) { throw errorDeServidor(causa); }
  comprovaSessio();
  comprovaSenyal(config);
  return validaRespostaCopublicacio(resposta, recurs);
}

async function canviaPublicacio(operacio, nom, camps, config) {
  const { recursTipus, recursId, operacioId, versioEsperada } = operacio;
  const recurs = { recursTipus, recursId };
  comprovaSenyal(config);
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (runtimeDataMode !== 'remote' || !hasSupabaseConfig || !tenantId) throw errorCopublicacio('no-disponible');
  if (!getCurrentUser()?.id) throw errorCopublicacio('sense-sessio');
  if (import.meta.env.VITE_SDP_COPUBLICACIO !== '1') throw errorCopublicacio('no-disponible');
  const comprovaSessio = capturaSessio();
  let resposta;
  try {
    resposta = await rpc(nom, { ...parametres(tenantId, recurs), ...camps,
      p_operacio_id: operacioId, p_versio_esperada: versioEsperada }, config, { signal: config.signal });
  } catch (causa) { throw errorDeServidor(causa); }
  comprovaSessio();
  comprovaSenyal(config);
  return validaRespostaCopublicacio(resposta, recurs, operacio);
}

export async function traspassaPublicacio(entrada, config = {}) {
  const operacio = capturaTraspasPublicacio(entrada);
  return canviaPublicacio(operacio, 'traspassa_publicacio', {
    p_actor_id: operacio.nouActorRegistratId,
    p_copublicadors_ids: operacio.copublicadorsRegistratsIds,
    p_mantindre_sdp: operacio.mantindreCopublicadorSdp
  }, config);
}

export async function reverteixTraspasPublicacio(entrada, config = {}) {
  const operacio = capturaReversioPublicacio(entrada);
  return canviaPublicacio(operacio, 'reverteix_traspas_publicacio', { p_traspas_id: operacio.traspasId }, config);
}
