import { capturaSessio } from '../identitat.js';
import { backendScope } from '../../config/backendConfig.js';
import { capturaBaixaRevisioPatrimoni, capturaConsultaRevisionsPatrimoni, capturaEdicioRevisioPatrimoni,
  errorRevisioPatrimoni } from '../revisionsPatrimoni.js';
import { getCurrentUser, getResolvedConfig, request } from './runtime.js';

const SELECT = 'id,tenant_id,entitat_tipus,entitat_slug,campanya_any,estat_conservacio,mesures_jsonb,observacions,versio';
const locals = new Map();

async function servidorLocal(config) {
  const scope = backendScope(config);
  const existent = locals.get(scope);
  if (existent) return existent;
  const { creaRevisionsPatrimoniLocal } = await import('../revisionsPatrimoniMemoria.js');
  if (!locals.has(scope)) locals.set(scope, creaRevisionsPatrimoniLocal(getCurrentUser));
  return locals.get(scope);
}

function vigent(comprovaSessio, config) {
  comprovaSessio();
  if (config.signal?.aborted) throw new DOMException('Operació cancel·lada.', 'AbortError');
}

function abast(config) {
  const resolt = getResolvedConfig(config);
  if (resolt.runtimeDataMode === 'remote' && (!resolt.hasSupabaseConfig || !resolt.tenantId)) {
    throw errorRevisioPatrimoni('no-disponible');
  }
  return resolt;
}

/* Arbitratge R17.2B (P2) · El mode `seed` (el del connector de WordPress) no té
   cap magatzem durador: un desament en memòria es perdria en recarregar i seria
   un èxit fals. Només el mode `local` explícit guarda campanyes en memòria. */
function abastEscriptura(config) {
  const resolt = abast(config);
  if (resolt.runtimeDataMode === 'seed') throw errorRevisioPatrimoni('no-disponible');
  return resolt;
}

function cami(parametres) {
  return `/rest/v1/revisions_patrimoni?${parametres}`;
}

function filtrePeca(tenantId, { entitatTipus, entitatSlug }) {
  return new URLSearchParams({
    select: SELECT,
    tenant_id: `eq.${tenantId}`,
    entitat_tipus: `eq.${entitatTipus}`,
    entitat_slug: `eq.${entitatSlug}`
  });
}

function filtreCampanya(tenantId, entrada) {
  const filtre = filtrePeca(tenantId, entrada);
  filtre.set('campanya_any', `eq.${entrada.campanyaAny}`);
  filtre.set('id', `eq.${entrada.id}`);
  filtre.set('versio', `eq.${entrada.versio}`);
  return filtre;
}

function campsEditables(entrada) {
  return {
    estat_conservacio: entrada.estatConservacio,
    mesures_jsonb: entrada.mesures,
    observacions: entrada.observacions
  };
}

function errorDeTransport(causa) {
  if (causa?.status === 404 || causa?.status === 400 && /PGRST20[25]/.test(causa.message)) {
    throw errorRevisioPatrimoni('no-disponible', causa);
  }
  // Arbitratge R17.2B (P2) · Les normes de convivència pendents no són una falta de permís.
  if (/SDP-MOD-428/.test(causa?.message ?? '')) throw errorRevisioPatrimoni('normes-pendents', causa);
  if (causa?.status === 401 || causa?.status === 403) throw errorRevisioPatrimoni('sense-permis', causa);
  if (causa?.status === 409) throw errorRevisioPatrimoni('revisio-no-vigent', causa);
  throw causa;
}

function filaPublica(fila, peca, tenantId) {
  if (fila?.tenant_id !== tenantId) throw errorRevisioPatrimoni('resposta-invalida');
  try {
    const resultat = capturaEdicioRevisioPatrimoni({
      entitatTipus: fila?.entitat_tipus, entitatSlug: fila?.entitat_slug, campanyaAny: fila?.campanya_any,
      id: fila?.id, versio: fila?.versio, estatConservacio: fila?.estat_conservacio, mesures: fila?.mesures_jsonb,
      observacions: fila?.observacions
    }, 1);
    if (resultat.entitatTipus !== peca.entitatTipus || resultat.entitatSlug !== peca.entitatSlug) {
      throw errorRevisioPatrimoni('resposta-invalida');
    }
    return resultat;
  } catch (causa) {
    throw errorRevisioPatrimoni('resposta-invalida', causa);
  }
}

export async function llistaRevisionsPatrimoni(input, config = {}) {
  const consulta = capturaConsultaRevisionsPatrimoni(input);
  const resolt = abast(config);
  const comprova = capturaSessio();
  vigent(comprova, config);
  if (resolt.runtimeDataMode !== 'remote') {
    const local = await servidorLocal(config);
    vigent(comprova, config);
    return local.llistaRevisionsPatrimoni(consulta, config);
  }

  const filtre = filtrePeca(resolt.tenantId, consulta);
  filtre.set('order', 'campanya_any.desc');
  filtre.set('limit', String(consulta.limit));
  if (consulta.abansAny !== null) filtre.set('campanya_any', `lt.${consulta.abansAny}`);

  const files = await request(cami(filtre), config, { signal: config.signal, anonim: true }).catch(errorDeTransport);
  vigent(comprova, config);
  if (!Array.isArray(files) || files.length > consulta.limit) throw errorRevisioPatrimoni('resposta-invalida');
  let anyAnterior = consulta.abansAny ?? 10000;
  return files.map(fila => {
    const revisio = filaPublica(fila, consulta, resolt.tenantId);
    if (revisio.campanyaAny >= anyAnterior) throw errorRevisioPatrimoni('resposta-invalida');
    anyAnterior = revisio.campanyaAny;
    return revisio;
  });
}

export async function desaRevisioPatrimoni(input, config = {}) {
  const entrada = capturaEdicioRevisioPatrimoni(input);
  const resolt = abastEscriptura(config);
  const comprova = capturaSessio();
  vigent(comprova, config);
  if (!getCurrentUser()?.id) throw errorRevisioPatrimoni('sense-sessio');
  if (entrada.versio === 2147483647) throw errorRevisioPatrimoni('revisio-no-vigent');
  if (resolt.runtimeDataMode !== 'remote') {
    const local = await servidorLocal(config);
    vigent(comprova, config);
    return local.desaRevisioPatrimoni(entrada, config);
  }

  const nova = entrada.versio === 0;
  const filtre = nova ? new URLSearchParams({ select: SELECT }) : filtreCampanya(resolt.tenantId, entrada);
  const camps = campsEditables(entrada);
  const body = nova ? {
    tenant_id: resolt.tenantId, entitat_tipus: entrada.entitatTipus, entitat_slug: entrada.entitatSlug,
    campanya_any: entrada.campanyaAny, ...camps
  } : camps;
  const files = await request(cami(filtre), config, {
    method: nova ? 'POST' : 'PATCH', headers: { Prefer: 'return=representation' }, body, signal: config.signal
  }).catch(errorDeTransport);
  vigent(comprova, config);
  if (Array.isArray(files) && files.length === 0) throw errorRevisioPatrimoni('revisio-no-vigent');
  if (!Array.isArray(files) || files.length !== 1) throw errorRevisioPatrimoni('resposta-invalida');
  const revisio = filaPublica(files[0], entrada, resolt.tenantId);
  if (revisio.campanyaAny !== entrada.campanyaAny || revisio.versio !== entrada.versio + 1
    || (!nova && revisio.id !== entrada.id)) {
    throw errorRevisioPatrimoni('resposta-invalida');
  }
  return revisio;
}

export async function esborraRevisioPatrimoni(input, config = {}) {
  const entrada = capturaBaixaRevisioPatrimoni(input);
  const resolt = abastEscriptura(config);
  const comprova = capturaSessio();
  vigent(comprova, config);
  if (!getCurrentUser()?.id) throw errorRevisioPatrimoni('sense-sessio');
  if (resolt.runtimeDataMode !== 'remote') {
    const local = await servidorLocal(config);
    vigent(comprova, config);
    return local.esborraRevisioPatrimoni(entrada, config);
  }

  const filtre = filtreCampanya(resolt.tenantId, entrada);
  const files = await request(cami(filtre), config, {
    method: 'DELETE', headers: { Prefer: 'return=representation' }, signal: config.signal
  }).catch(errorDeTransport);
  vigent(comprova, config);
  if (Array.isArray(files) && files.length === 0) throw errorRevisioPatrimoni('revisio-no-vigent');
  if (!Array.isArray(files) || files.length !== 1) throw errorRevisioPatrimoni('resposta-invalida');
  const revisio = filaPublica(files[0], entrada, resolt.tenantId);
  if (revisio.campanyaAny !== entrada.campanyaAny || revisio.versio !== entrada.versio || revisio.id !== entrada.id) {
    throw errorRevisioPatrimoni('resposta-invalida');
  }
  return true;
}
