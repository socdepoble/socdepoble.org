#!/usr/bin/env node
/** Comprovació puntual de metadades, sense baixar el vídeo ni crear cap cron.
 * oEmbed acredita disponibilitat de metadades; no prova reproducció en cada país. */
import { pathToFileURL } from 'node:url';

export const VIDEO_ID = 'TlZWYbnGuCE';
export const OEMBED_URL = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${VIDEO_ID}`)}&format=json`;

export async function verificaVideoAplec({ fetchImpl = fetch, timeoutMs = 10000 } = {}) {
  if (typeof fetchImpl !== 'function' || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) {
    throw new TypeError('Configuració de sentinella invàlida');
  }
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), timeoutMs);
  const base = { videoId: VIDEO_ID, source: 'YouTube oEmbed', checkedAt: new Date().toISOString() };
  try {
    const response = await fetchImpl(OEMBED_URL, { signal: control.signal, redirect: 'error', headers: { accept: 'application/json' } });
    if (response.status !== 200) {
      const caigut = [401, 403, 404, 410].includes(response.status);
      return { ...base, status: caigut ? 'caigut' : 'indeterminat', httpStatus: response.status,
        message: caigut ? 'Avís: YouTube ja no exposa el vídeo. Revisa l’article de l’Aplec.' : 'No es pot confirmar el vídeo: torna a comprovar la font.' };
    }
    const raw = await response.text();
    if (raw.length > 128 * 1024) throw new Error('resposta_massa_gran');
    const metadata = JSON.parse(raw);
    const iframe = typeof metadata.html === 'string' && metadata.html.match(/\bsrc=["']([^"']+)["']/i);
    let embed;
    try { embed = iframe ? new URL(iframe[1]) : null; } catch { embed = null; }
    if (metadata.type !== 'video' || metadata.provider_name !== 'YouTube' || typeof metadata.title !== 'string' || !metadata.title.trim()
      || !embed || embed.protocol !== 'https:' || !['www.youtube.com', 'www.youtube-nocookie.com'].includes(embed.hostname)
      || embed.pathname !== `/embed/${VIDEO_ID}`) throw new Error('metadades_no_valides');
    return { ...base, status: 'disponible', httpStatus: 200, title: metadata.title, metadataAvailable: true,
      playbackVerified: false, message: 'Metadades disponibles. La reproducció s’ha de contrastar al navegador.' };
  } catch {
    return { ...base, status: 'indeterminat', message: 'Avís: no s’ha pogut validar oEmbed (xarxa, temps límit o resposta invàlida). Revisa el vídeo.' };
  } finally {
    clearTimeout(timer);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await verificaVideoAplec();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.status === 'disponible' ? 0 : result.status === 'caigut' ? 1 : 2;
}
