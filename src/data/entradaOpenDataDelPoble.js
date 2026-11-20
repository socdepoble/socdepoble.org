/** Adaptador de slug a l'exportador pur: el que el port servix com a públic
 * (el directori i, amb la capacitat 'dadesObertes', notícies, agenda, memòria
 * cultural i memòria oral; T2 · D04/D10, assalt 261101) i l'outbox publicat.
 * Decisió del Mestre del 31-10-2026 (Ronda 2): només els pobles federats
 * (POBLES_FEDERATS, hui La Torre) tenen actor i outbox. Per a un poble de
 * mostra el paquet no porta activitystreams.json ni cap enllaç federat, i no es
 * demana cap outbox que no existix. */
import { urlRemota } from './federacio/urlRemota.js';
import { esPobleFederat, esSlugFederat, CONTEXT_AS, PUBLIC, urlsDeMunicipi } from './activitypub.js';
import { ORIGEN_PUBLIC_PER_DEFECTE } from '../config/origenPublic.js';
const fetchNatiu = globalThis.fetch;

export async function entradaOpenDataDelPoble(slug, { municipi, port, ara = new Date().toISOString(),
  origen = ORIGEN_PUBLIC_PER_DEFECTE, fetchImpl = globalThis.fetch, fetchPinnat = null } = {}) {
  if (!esSlugFederat(slug)) throw new TypeError('Slug municipal invàlid.');
  const backend = port ?? await import('./backendPort.js');
  let poble = municipi;
  if (!poble) {
    const core = await backend.loadCoreContent();
    const trobat = core?.towns?.find(p => (p.slug || p.id) === slug);
    if (!trobat) throw new Error('Poble absent del directori.');
    poble = { slug, nom: trobat.title || trobat.name };
  }
  if (poble.slug !== slug || !poble.nom) throw new TypeError('Identitat municipal invàlida.');
  const { recullDadesPubliquesDelMunicipi } = await import('./exportaMunicipiOpenData.js');
  const dades = await recullDadesPubliquesDelMunicipi(backend, poble, { signal: AbortSignal.timeout(15000) });
  /* Sense la capacitat directoriEntitats, entitats és null: el paquet ix igual i la memòria diu, a «Fonts pendents», que el directori no hi és.
     T2 · Les col·leccions que el port ha llegit hi van totes; les altres són a `pendents`, amb el seu motiu. */
  const llegides = { entitats: dades.entitats ?? undefined, pendents: dades.pendents };
  for (const coleccio of ['noticies', 'agenda', 'memoria', 'memoriaOral']) if (Array.isArray(dades[coleccio])) llegides[coleccio] = dades[coleccio];
  if (!esPobleFederat(slug)) return { municipi: poble, ara, origen, actorsPublicats: [], ...llegides };
  const urls = urlsDeMunicipi(slug, { origen });
  if (!urlRemota(urls.outbox)) throw new TypeError('Origen públic OpenData invàlid.');
  const sameOrigin = globalThis.location?.origin === new URL(urls.outbox).origin;
  /* Gauntlet v1.2.13 · El pin DNS/TLS és per al servidor (Node). Al navegador (apps, .cat, WordPress) no es pot pinar i
     manen CORS i la política del navegador: com a c71f3f163, el fetch propi hi continua valent. */
  const navegador = typeof window !== 'undefined' && typeof document !== 'undefined';
  if (!navegador && (fetchImpl === fetchNatiu || fetchImpl === globalThis.fetch) && !sameOrigin && typeof fetchPinnat !== 'function') throw new TypeError('OpenData necessita un transport DNS/TLS pinat al servidor.');
  const transport = typeof fetchPinnat === 'function' ? fetchPinnat : fetchImpl;
  const resposta = await transport(urls.outbox, { method: 'GET', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Accept: 'application/activity+json' } });
  if (resposta.redirected || resposta.url && resposta.url !== urls.outbox) throw new Error('Redirecció OpenData no admesa.');
  if (!resposta.ok) throw new Error('L’outbox públic no està disponible.');
  // Sostre abans de parsejar; no es carrega una resposta il·limitada.
  if (Number(resposta.headers.get('content-length')) > 16 * 1024 * 1024) throw new Error('Outbox massa gran.');
  const lector = resposta.body.getReader(); let mida = 0; const trossos = [];
  try { while (true) { const { done, value } = await lector.read(); if (done) break;
    mida += value.byteLength; if (mida > 16 * 1024 * 1024) throw new Error('Outbox massa gran.'); trossos.push(value); }
  } finally { await lector.cancel(); lector.releaseLock(); }
  const bytes = new Uint8Array(mida); let posicio = 0;
  for (const tros of trossos) { bytes.set(tros, posicio); posicio += tros.byteLength; }
  const outbox = JSON.parse(new TextDecoder().decode(bytes));
  if (outbox['@context'] !== CONTEXT_AS || outbox.id !== urls.outbox || outbox.type !== 'OrderedCollection'
      || !Array.isArray(outbox.orderedItems) || outbox.totalItems !== outbox.orderedItems.length
      || outbox.orderedItems.some(a => a.type !== 'Create' || a.actor !== urls.actor || !a.to?.includes(PUBLIC)
        || a.object?.attributedTo !== urls.actor || !a.object?.to?.includes(PUBLIC))) throw new Error('Outbox municipal invàlid.');
  return { municipi: poble, ara, origen, actorsPublicats: [slug], ...llegides, activityStreams: outbox };
}
