/** P0-115 · Un mapa SEO és un inventari verificable, mai una heurística de slugs.
 * Pur i determinista: cap rellotge, xarxa ni dependència del DOM. No acredita
 * cap resposta HTTP desplegada: status és el codi de la regla a publicar.
 */
const HOSTS_ORIGEN = new Set(['socdepoble.net', 'www.socdepoble.net', 'elrentonar.blogspot.com']);
const HOST_DESTI = 'https://socdepoble.org';
const COMPARA = (a, b) => a < b ? -1 : a > b ? 1 : 0;

export function normalitzaOrigenRedireccio301(valor) {
  if (typeof valor !== 'string' || valor !== valor.trim() || /[\s\\\u0000-\u001f\u007f]/u.test(valor)) return null;
  try {
    const url = new URL(valor);
    if (!['http:', 'https:'].includes(url.protocol) || !HOSTS_ORIGEN.has(url.hostname)
      || url.username || url.password || url.port || url.hash) return null;
    // ?m=1 és l'àlies mòbil de Blogger, no un altre article. Altres queries
    // (p=123, search, feeds…) necessiten una regla explícita i es conserven.
    if (url.hostname === 'elrentonar.blogspot.com' && url.searchParams.get('m') === '1') url.searchParams.delete('m');
    url.searchParams.sort();
    url.protocol = 'https:';
    if (url.hostname === 'www.socdepoble.net') url.hostname = 'socdepoble.net';
    return url.href;
  } catch { return null; }
}

function rutaCanonica(valor) {
  if (typeof valor !== 'string' || !valor.startsWith('/') || valor.startsWith('//')
    || /[\s\\\u0000-\u001f\u007f?#]/u.test(valor)) return null;
  try {
    const desescapat = decodeURIComponent(valor);
    // Els slugs històrics poden contindre UTF-8 (%c2%b7 = ·), però mai
    // separadors codificats, doble escape, controls, bidi ni segments ../.
    if (/[\s\\\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069?#%]/u.test(desescapat)
      || desescapat.split('/').length !== valor.split('/').length
      || desescapat.split('/').some(segment => segment === '.' || segment === '..')) return null;
    const url = new URL(valor, HOST_DESTI);
    // Rebutgem normalitzacions silencioses (../, //, separadors codificats).
    return url.origin === HOST_DESTI && url.pathname === valor && !valor.includes('//') ? valor : null;
  } catch { return null; }
}

/**
 * Contracte: [{source: URL històrica, destination: ruta interna final, status:301}].
 * destinsDisponibles és l'inventari autoritatiu de pàgines finals, no patrons
 * del router SPA: un 200 genèric no prova que existisca l'article.
 * orígensEsperats, si es dóna, exigix cobertura exacta del corpus seleccionat.
 */
export function validaMapaRedireccions301(redireccions, { destinsDisponibles, origensEsperats } = {}) {
  const errors = [];
  const falla = (codi, index = null, valor = null) => errors.push({ codi, index, valor });
  if (!Array.isArray(redireccions)) return { valid: false, redireccions: [], errors: [{ codi: 'mapa_invalid', index: null, valor: null }] };
  if (!Array.isArray(destinsDisponibles) || destinsDisponibles.some(desti => !rutaCanonica(desti))) falla('inventari_destins_invalid');
  const destins = new Set(Array.isArray(destinsDisponibles) ? destinsDisponibles : []);
  const fonts = new Map();
  const valides = [];
  for (const [index, regla] of redireccions.entries()) {
    if (!regla || typeof regla !== 'object' || Array.isArray(regla)) { falla('regla_invalida', index); continue; }
    const source = normalitzaOrigenRedireccio301(regla.source);
    const destination = rutaCanonica(regla.destination);
    if (!source) falla('origen_invalid', index, typeof regla.source === 'string' ? regla.source : null);
    if (!destination) falla('desti_invalid', index, typeof regla.destination === 'string' ? regla.destination : null);
    if (regla.status !== 301) falla('codi_no_301', index);
    if (source && fonts.has(source)) falla(fonts.get(source) === destination ? 'origen_duplicat' : 'origen_conflictiu', index, source);
    if (source) fonts.set(source, destination);
    if (destination && !destins.has(destination)) falla('desti_absent', index, destination);
    if (source && destination && regla.status === 301) valides.push({ source, destination, status: 301 });
  }
  if (origensEsperats !== undefined) {
    if (!Array.isArray(origensEsperats)) falla('inventari_origens_invalid');
    else {
      const esperats = new Set();
      for (const raw of origensEsperats) {
        const origen = normalitzaOrigenRedireccio301(raw);
        if (!origen) falla('origen_esperat_invalid');
        else esperats.add(origen);
      }
      for (const origen of [...esperats].sort(COMPARA)) if (!fonts.has(origen)) falla('origen_sense_regla', null, origen);
      for (const origen of [...fonts.keys()].sort(COMPARA)) if (!esperats.has(origen)) falla('origen_fora_corpus', null, origen);
    }
  }
  // L'origen és obligatòriament als dominis històrics; el destí és intern de
  // socdepoble.org i ha d'estar a l'inventari final. Per construcció cap regla
  // del mapa pot apuntar a l'origen d'una altra: ni cadena ni bucle.
  valides.sort((a, b) => COMPARA(a.source, b.source) || COMPARA(a.destination, b.destination));
  return { valid: errors.length === 0, redireccions: valides, errors };
}

/** Mateix esquema d'eixida per REST, WXR i Atom ja transformats. */
export function generaMapaRedireccions301(articles, opcions) {
  if (!Array.isArray(articles)) throw new TypeError('Cal un corpus d’articles.');
  const resultat = validaMapaRedireccions301(articles.map(article => ({
    source: article?.linkOriginal,
    destination: article?.rutaDestiCanonica,
    status: 301,
  })), opcions);
  if (!resultat.valid) throw new TypeError(`Mapa 301 invàlid: ${resultat.errors.map(error => error.codi).join(', ')}`);
  return resultat.redireccions;
}
