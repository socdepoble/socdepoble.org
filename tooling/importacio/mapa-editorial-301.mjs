/** R32.16 · Explicit destination inventory + imported review artifacts.
 * Reuses the complete R32.14 verifier; no guessed slugs, HTTP or deployment. */
import { construeixMapaEditorial301, compilaMapaRedireccions301 } from '../seo/mapa-redireccions-301.mjs';

export function generaTaulaEditorial301(articles, { destinsDisponibles, destinacions } = {}) {
  return { schema: 'sdp.editorial.redirect301.review.v1', ...construeixMapaEditorial301(articles, { destinsDisponibles, destinacions }) };
}
export function exportaTaulaEditorial301(table, { format = 'nginx' } = {}) {
  return compilaMapaRedireccions301(table, { format });
}

/** Includes table construction, lookup and full fresh verification. It excludes
 * fixture generation, final JSON serialization and hosting-config emission. */
export function benchmarkTaulaEditorial301({ count = 100000, samples = 9, profile = 'lookup' } = {}) {
  if (!['direct', 'lookup'].includes(profile) || !Number.isInteger(count) || count < 1 || count > 200000 || !Number.isInteger(samples) || samples < 3 || samples > 31) throw new TypeError('Benchmark editorial invàlid.');
  const articles = [], destinsDisponibles = [], destinacions = Object.create(null);
  let seed = 3216;
  const shuffle = list => {
    for (let i = list.length - 1; i > 0; i--) {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      const j = (seed >>> 0) % (i + 1);
      [list[i], list[j]] = [list[j], list[i]];
    }
  };
  const fixtureStart = performance.now();
  let queryRows = 0;
  for (let i = 0; i < count; i++) {
    const query = i % 4 === 0;
    if (query) queryRows++;
    const source = `https://socdepoble.${i % 2 ? 'net' : 'com'}/${query ? `index.php?p=${i + 1}` : `article-${i}`}`;
    const destination = `/page/article-${i}`;
    articles.push(profile === 'direct' ? { linkOriginal: source, rutaDestiCanonica: destination } : { linkOriginal: source });
    destinsDisponibles.push(destination); destinacions[source] = destination;
  }
  shuffle(articles); shuffle(destinsDisponibles);
  const fixtureMs = performance.now() - fixtureStart, samplesMs = [];
  for (let i = 0; i < samples; i++) {
    const started = performance.now();
    const table = generaTaulaEditorial301(articles, profile === 'direct' ? { destinsDisponibles } : { destinsDisponibles, destinacions });
    samplesMs.push(performance.now() - started);
    if (table.redireccions.length !== count || table.verificacio.mode !== 'general') throw new Error('Benchmark no general o corpus incomplet.');
  }
  const medianMs = [...samplesMs].sort((a, b) => a - b)[Math.floor(samples / 2)];
  return { schema: 'sdp.editorial.redirect301.benchmark.v1', profile, count, fixtureMs, samplesMs, medianMs, targetMs: 25, targetMet: medianMs < 25, workload: { shuffledArticles: true, shuffledInventory: true, queryRows, seed: 3216 }, timingIncludes: `new row construction, ${profile === 'direct' ? 'explicit reviewed article route property' : 'explicit URL dictionary destination'} lookup and full fresh verifier; no result cache`, limits: 'Fixture generation, output JSON serialization and hosting configuration emission excluded; this is a measured local profile, not a universal latency guarantee.' };
}
