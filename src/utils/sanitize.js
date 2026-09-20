import DOMPurify from 'dompurify';

/**
 * Sanejador d'HTML. ÚNIC punt d'entrada d'HTML a l'arbre.
 *
 * PER QUÈ NO EL FEM A MÀ: un sanejador d'HTML propi és el camí més curt cap a
 * un XSS. Ací la Pedra Seca cedix: el dolor de mantindre DOMPurify és menor que
 * el dolor de reinventar-lo malament. És l'única excepció d'aquest fitxer.
 *
 * Imposat per tooling/gates/tractor-innerhtml.mjs.
 */

let ganxosPosats = false;
let origensMitjans = [
  'https://lh3.googleusercontent.com',
  'https://platform-lookaside.fbsbx.com',
  'https://graph.facebook.com',
  'https://avatars.githubusercontent.com'
];

export function permetOrigenMitjans(url) {
  if (!url) return;
  try {
    const origen = new URL(url).origin;
    if (!origensMitjans.includes(origen)) origensMitjans.push(origen);
  } catch (err) {
    void err;
  }
}

function posaGanxos() {
  if (ganxosPosats) return;
  ganxosPosats = true;

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // 1. Cap far de tercers. Només imatges del nostre origen o data: URI.
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || '';
      
      const esLocal = esFontImatgeSegura(src);

      if (!esLocal) {
        node.removeAttribute('src');
        node.setAttribute('alt', node.getAttribute('alt') || 'Imatge externa bloquejada');
        node.setAttribute('data-sdp-bloquejada', '1');
      }
      node.setAttribute('loading', 'lazy');
      node.setAttribute('decoding', 'async');
      node.setAttribute('referrerpolicy', 'no-referrer');
    }

    // 2. Cap segrest de pestanya, i cap fuita de referent.
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      node.setAttribute('rel', 'noopener noreferrer nofollow');
      if (node.getAttribute('target') === '_blank') {
        node.setAttribute('target', '_blank');
      }
    }
  });
}

/**
 * P0 · 260903 — el ganxo s'arma en CARREGAR EL MÒDUL, no dins de
 * sanitizeHtml(). `DOMPurify.addHook` és estat global: mentres depenia
 * d'una crida, qualsevol camí que tocara DOMPurify directament corria
 * amb ganxo o sense segons quina pàgina s'haguera pintat primer. Un
 * control de seguretat no pot dependre de l'ordre de renderitzat.
 */
posaGanxos();

export function sanitizeHtml(html) {
  if (!html) return '';
  return DOMPurify.sanitize(String(html), {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'span', 'div', 'img', 'hr', 'code', 'pre', 's', 'u'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'class',
      'width', 'height', 'loading', 'decoding', 'referrerpolicy',
      'data-sdp-bloquejada'
    ],
    // (sollutia, links relatius sense ser protocol-relative, mailto, tel, sdp-media, i data:image restringida sense svg per a offline mode)
    ALLOWED_URI_REGEXP: /^(?! *\/\/)(?:(?:https?|mailto|tel|sdp-media):|data:image\/(?:png|jpeg|jpg|webp|gif|avif);|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'svg', 'math'],
    FORBID_ATTR: ['style', 'srcset', 'formaction', 'ping']
  });
}

/**
 * Netejador de TEXT PLA. NO és un sanejador d'HTML i no ha de ser-ho:
 * React ja escapa el text. Passar text pla per DOMPurify el destrueix
 * («l'aigua < 5 litres & la pedra» → «l'aigua &lt; 5 litres &amp; la pedra»)
 * i el dany és permanent, perquè es guarda escapat a l'Outbox i a Supabase.
 */
export function netejaText(valor, maxim = 4000) {
  return String(valor ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n?/g, '\n')
    .normalize('NFC')
    .trim()
    .slice(0, maxim);
}

/** Font d'imatge admissible: data-URI d'imatge, ruta pròpia o http(s). '' = esborrat legítim. */
export function esFontImatgeSegura(url) {
  if (!url) return false;
  const net = String(url).trim();
  if (/^data:image\/(png|jpeg|jpg|webp|gif|avif);/i.test(net)) return true;
  if (/^sdp-media:\/\/(mitjans_privats|mitjans)\//i.test(net)) return true;
  try {
    const u = new URL(net, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    return (
      (typeof window !== 'undefined' && u.origin === window.location.origin) ||
      origensMitjans.includes(u.origin)
    );
  } catch {
    return false;
  }
}
