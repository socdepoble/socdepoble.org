/** Adaptador de slug a l'exportador pur. Només directori públic i outbox publicat.
 * Decisió del Mestre del 31-10-2026 (Ronda 2): només els pobles federats
 * (POBLES_FEDERATS, hui La Torre) tenen actor i outbox. Per a un poble de
 * mostra el paquet no porta activitystreams.json ni cap enllaç federat, i no es
 * demana cap outbox que no existix. */
import { esPobleFederat, esSlugFederat, CONTEXT_AS, PUBLIC, urlsDeMunicipi } from './activitypub.js';
import { ORIGEN_PUBLIC_PER_DEFECTE } from '../config/origenPublic.js';

export async function entradaOpenDataDelPoble(slug, { municipi, port, ara = new Date().toISOString(),
  origen = ORIGEN_PUBLIC_PER_DEFECTE, fetchImpl = globalThis.fetch } = {}) {
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
  /* Sense la capacitat directoriEntitats, entitats és null: el paquet ix igual i la memòria diu, a «Fonts pendents», que el directori no hi és. */
  const llegides = { entitats: dades.entitats ?? undefined, pendents: dades.pendents };
  if (!esPobleFederat(slug)) return { municipi: poble, ara, origen, actorsPublicats: [], ...llegides };
  const urls = urlsDeMunicipi(slug, { origen });
  const resposta = await fetchImpl(urls.outbox, { method: 'GET', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Accept: 'application/activity+json' } });
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
