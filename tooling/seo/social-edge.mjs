/* Metadades de resposta HTTP. No autentica ni consulta dades personals.
   Pla 261028_1526 (P1-61, Fase 2) · renderSocialHead és l'únic renderitzador
   del <head> social: el criden el prerender estàtic (prerender-social.mjs,
   dist/<ruta>/index.html) i l'adaptador d'edge, que continua adormit
   (decisió 2 del Mestre: cap Cloudflare ni Cloud Run en este torn). Els
   valors genèrics són els de CAP_SOCIAL_BASE (src/config/imatgeSocial.js),
   els mateixos d'index.html i del client. */
import { ATRIBUT_SSR, CAP_SOCIAL_BASE } from '../../src/config/imatgeSocial.js';

export const SOCIAL_SLOT = '<!--SDP_SOCIAL_HEAD-->';
const SCHEMA = 'sdp.social-manifest.v1';
const ID_WIKI = /^[a-zA-Z0-9_-]{1,180}$/;
const own = (o, key) => o && Object.hasOwn(o, key);
const escape = value => String(value).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);
const bounded = (s, max) => typeof s === 'string' && s.trim().length > 0
  && s.length <= max && !/[\u0000-\u001f\u007f]/u.test(s);

export function socialAgent(ua = '') {
  // Diagnòstic: mai s'usa com a autorització ni per triar el contingut.
  return /(?:WhatsApp|TelegramBot|Twitterbot|facebookexternalhit|Facebot|LinkedInBot|Discordbot|Slackbot)/i.test(ua);
}

/* La clau d'una URL, la de src/config/rutaSocial.js (clauSocialDeRuta), amb
   una diferència a propòsit: a /wikidepoble, un ?item= que hi és però que no
   identifica un sol document vàlid torna null (el head genèric sense indexar),
   no el de la llista. La forma de camí /wikidepoble/<id> (decisió 2 del
   Mestre) és el mateix document que ?item=<id>. */
export function routeKey(input) {
  const url = new URL(input);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const cami = /^\/wikidepoble\/([^/]+)$/.exec(pathname);
  if (cami) return ID_WIKI.test(cami[1]) ? `/wikidepoble?item=${cami[1]}` : pathname;
  if (pathname === '/wikidepoble' && url.searchParams.has('item')) {
    const items = url.searchParams.getAll('item');
    if (items.length !== 1 || !ID_WIKI.test(items[0])) return null;
    return `${pathname}?item=${encodeURIComponent(items[0])}`;
  }
  return pathname; // utm_* i altres paràmetres no identifiquen cap document públic.
}

export function selectMetadata(manifest, input, imageOrigins = []) {
  if (manifest?.schema !== SCHEMA) throw new Error('Manifest social incompatible');
  const origin = new URL(manifest.origin);
  if (origin.protocol !== 'https:' || origin.href !== `${origin.origin}/`) throw new Error('Origen públic invàlid');
  let key = routeKey(input);
  if (!key) return null;
  if (own(manifest.aliases, key)) key = manifest.aliases[key];
  if (typeof key !== 'string' || !own(manifest.routes, key)) return null;
  const entry = manifest.routes[key];
  if (entry?.index !== true || !bounded(entry.title, 240) || !bounded(entry.description, 800)
    || !['website', 'article'].includes(entry.type)) return null;
  const canonical = new URL(key, origin).href;
  if (entry.canonical !== canonical) return null;
  let image;
  try {
    image = new URL(entry.image?.url, origin);
    // Codex C28-05 §6 (261028) · Ni consulta ni fragment: una URL signada del mateix origen tampoc passa.
    if (image.protocol !== 'https:' || image.username || image.password || image.search || image.hash
      || ![origin.origin, ...imageOrigins].includes(image.origin)
      || !/\.(?:png|jpe?g|webp)$/i.test(image.pathname)
      || !bounded(entry.image?.alt, 500)) return null;
  } catch { return null; }
  const dimensions = entry.image.width == null && entry.image.height == null ? {}
    : Number.isInteger(entry.image.width) && entry.image.width > 0
      && Number.isInteger(entry.image.height) && entry.image.height > 0
      ? { width: entry.image.width, height: entry.image.height } : null;
  if (!dimensions) return null;
  return { ...entry, canonical, image: { ...entry.image, ...dimensions, url: image.href } };
}

/* La targeta genèrica (OG-1): la d'index.html, absoluta sobre l'origen. */
export function genericImage(origin) {
  const { url, alt, type, width, height } = CAP_SOCIAL_BASE.image;
  return { url: new URL(url, origin).href, alt, type, width: Number(width), height: Number(height) };
}

/**
 * El <head> social d'una ruta: títol, descripció, og:*, twitter:* i, si cal,
 * og:url i canonical. Sense metadades (una ruta que no és pública), el
 * genèric amb robots noindex. Opcions:
 *   · marca (ATRIBUT_SSR per defecte): l'atribut que porta el <title> i cada
 *     node de la ruta. seoHead el reconeix: el head servit no és la base i es
 *     respecta mentre l'app és a la ruta que declara el seu canonical o
 *     og:url. null, cap atribut.
 *   · canonical (true): false ometi og:url i canonical, per a un fitxer que
 *     se servix a més d'una URL (dist/wikidepoble/index.html, també per a
 *     ?item=). Sense, seoHead el purga en el primer registre.
 *   · ogUrl (null): l'og:url quan no és el canonical. Revisió adversarial
 *     (261028) · Facebook, Messenger i LinkedIn seguixen l'og:url i
 *     prenen la targeta de la pàgina on acaba: el fitxer de la forma de camí
 *     (dist/wikidepoble/<id>/index.html) declara la seua adreça, perquè
 *     ?item=<id> en Firebase servix el head de la llista. El canonical
 *     continua sent ?item=<id> (decisió 2), i seoHead el llig primer.
 * og:site_name i og:locale són del lloc: el shell (prepareShell) els conserva
 * sense marca, i ací no es repetixen. Les mides i el MIME de la imatge només
 * hi van si les metadades les porten.
 */
export function renderSocialHead(metadata, origin, { marca = ATRIBUT_SSR, canonical = true, ogUrl = null } = {}) {
  const attribute = marca ? ` ${marca}` : '';
  const image = metadata?.image || genericImage(origin);
  const title = metadata ? `${metadata.title} | Sóc de Poble` : CAP_SOCIAL_BASE.title;
  const description = metadata?.description || CAP_SOCIAL_BASE.description;
  const meta = (kind, name, content) => `<meta ${kind}="${name}" content="${escape(content)}"${attribute}>`;
  const tags = [
    `<title${attribute}>${escape(title)}</title>`,
    meta('name', 'description', description)
  ];
  if (!metadata) tags.push(meta('name', 'robots', 'noindex, nofollow'));
  tags.push(
    meta('property', 'og:title', title), meta('property', 'og:description', description),
    meta('property', 'og:type', metadata?.type || CAP_SOCIAL_BASE.ogType),
    meta('property', 'og:image', image.url)
  );
  if (image.type) tags.push(meta('property', 'og:image:type', image.type));
  if (image.width && image.height) tags.push(meta('property', 'og:image:width', image.width), meta('property', 'og:image:height', image.height));
  tags.push(
    meta('property', 'og:image:alt', image.alt),
    meta('name', 'twitter:card', CAP_SOCIAL_BASE.twitterCard),
    meta('name', 'twitter:title', title), meta('name', 'twitter:description', description),
    meta('name', 'twitter:image', image.url), meta('name', 'twitter:image:alt', image.alt)
  );
  if (metadata && canonical !== false && metadata.canonical) {
    tags.push(meta('property', 'og:url', ogUrl || metadata.canonical), `<link rel="canonical" href="${escape(metadata.canonical)}"${attribute}>`);
  }
  return tags.join('\n');
}

export async function sha256(value) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map(v => v.toString(16).padStart(2, '0')).join('');
}

function isDocument(request) {
  const pathname = new URL(request.url).pathname;
  return ['GET', 'HEAD'].includes(request.method)
    && !/^\/(?:assets|fonts|api|auth|\.well-known)(?:\/|$)/.test(pathname)
    && !/\.[a-z0-9]{1,12}$/i.test(pathname);
}

function responseHeaders(response, state) {
  const headers = new Headers(response.headers);
  for (const name of ['content-length', 'content-encoding', 'etag', 'last-modified',
    'content-md5', 'digest', 'content-digest', 'repr-digest', 'content-range', 'accept-ranges',
    'cloudflare-cdn-cache-control', 'cdn-cache-control', 'surrogate-control', 'expires', 'age']) headers.delete(name);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  // Primera versió sense caché HTML: cap mescla d'item, sessió o versió.
  headers.set('Cache-Control', 'no-store');
  headers.set('X-SDP-Social', state);
  return headers;
}

export function createSocialHandler({ manifest, shell, fetchOrigin, imageOrigins = [] }) {
  if (typeof fetchOrigin !== 'function' || shell?.template?.split(SOCIAL_SLOT).length !== 2
    || !/^[a-f0-9]{64}$/.test(shell?.sourceSha256 || '')) throw new Error('Shell social incomplet');
  // Valida la capçalera del manifest abans d'acceptar peticions.
  selectMetadata(manifest, manifest.origin, imageOrigins);
  return async request => {
    if (!isDocument(request)) return fetchOrigin(request);
    const headers = new Headers(request.headers);
    for (const name of [...headers.keys()]) {
      if (name.startsWith('if-') || ['range', 'cookie', 'authorization'].includes(name)) headers.delete(name);
    }
    // HEAD necessita el mateix càlcul que GET, però no retorna cos al client.
    const response = await fetchOrigin(new Request(request.url, { method: 'GET', headers, redirect: 'manual' }));
    if (response.status !== 200 || !/^text\/html(?:;|$)/i.test(response.headers.get('Content-Type') || '')
      || response.headers.has('Set-Cookie')) {
      return request.method === 'HEAD'
        ? new Response(null, { status: response.status, statusText: response.statusText, headers: response.headers })
        : response;
    }
    const html = await response.text();
    if (await sha256(html) !== shell.sourceSha256) {
      // Mai mesclem el cos d'una release amb la plantilla d'una altra.
      return new Response(request.method === 'HEAD' ? null : html, {
        status: response.status, headers: responseHeaders(response, 'build-mismatch')
      });
    }
    const metadata = selectMetadata(manifest, request.url, imageOrigins);
    const output = shell.template.replace(SOCIAL_SLOT, () => renderSocialHead(metadata, manifest.origin));
    return new Response(request.method === 'HEAD' ? null : output, {
      status: response.status, headers: responseHeaders(response, metadata ? 'public' : 'generic')
    });
  };
}
