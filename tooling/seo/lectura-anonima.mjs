/** P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · La lectura anònima fitada del
 * build: un GET amb la clau anon o publishable (mai una altra), sense cap
 * redirecció, amb termini, un sostre de bytes per resposta i un reintent NOMÉS
 * per a la xarxa, un 429 o un 5xx. És el cos de llegixClau (projeccio-publica.mjs)
 * fet reutilitzable: el criden la lectura d'app_content, la del directori públic
 * (organization_directory) i la del Mur públic (la RPC llig_mur_public, per GET).
 * Mai un POST, un PATCH ni un DELETE; mai imprimix l'URL ni la clau.
 */
export const INTENTS = 2;

/** El cos d'una resposta, com a molt `maxim` bytes; si en porta més, error i lectura tallada. */
export async function cosFitat(resposta, maxim) {
  const declarat = Number(resposta.headers.get('content-length'));
  if (Number.isFinite(declarat) && declarat > maxim) throw new Error(`Resposta massa gran (${declarat} B; el sostre és ${maxim} B).`);
  const lector = resposta.body?.getReader?.();
  if (!lector) {
    const bytes = Buffer.from(await resposta.arrayBuffer());
    if (bytes.length > maxim) throw new Error(`Resposta massa gran (més de ${maxim} B).`);
    return bytes;
  }
  const trossos = [];
  let total = 0;
  for (;;) {
    const {done, value} = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxim) {
      await lector.cancel().catch(() => {});
      throw new Error(`Resposta massa gran (més de ${maxim} B).`);
    }
    trossos.push(Buffer.from(value));
  }
  return Buffer.concat(trossos);
}

/**
 * El JSON d'un GET anònim, o error. `etiqueta` nomena la lectura als errors (mai l'URL).
 * Opcions: fetchImpl, termini (ms), maxResposta (bytes) i pausa (ms → Promise).
 */
export async function getJsonFitat(href, {anonKey}, {fetchImpl, termini, maxResposta, pausa}, etiqueta) {
  let darrer = null;
  for (let intent = 1; intent <= INTENTS; intent += 1) {
    let transitori = true;
    try {
      const resposta = await fetchImpl(href, {
        method: 'GET', redirect: 'error', signal: AbortSignal.timeout(termini),
        headers: {apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: 'application/json'}
      });
      if (resposta.status !== 200) {
        transitori = resposta.status === 429 || resposta.status >= 500;
        await resposta.body?.cancel?.().catch(() => {});
        throw new Error(`HTTP ${resposta.status} en llegir ${etiqueta}.`);
      }
      transitori = false;
      if (!/\bjson\b/i.test(resposta.headers.get('content-type') || '')) throw new Error(`Resposta de ${etiqueta} sense JSON.`);
      return JSON.parse((await cosFitat(resposta, maxResposta)).toString('utf8'));
    } catch (error) {
      darrer = error;
      if (!transitori || intent === INTENTS) break;
      await pausa(400 * intent);
    }
  }
  throw darrer;
}
