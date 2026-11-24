import DOMPurify from 'dompurify';
import { normalitzaUnicodeSegura } from './normalitzaUnicodeSegura.js';
import { destinacioSeguraDEnllac, esEnllacExtern, relEnllacExtern } from './enllacosExterns.js';

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
let imatgesNomesPropies = false;
let llistesNumerades = false;
let enllacosEditorials = false;
let enllacosPatrocinats = false;

const textNet = (v) => (typeof v === 'string' ? v.trim() : '');
const origenActual = (reserva = 'http://localhost') => (typeof window !== 'undefined' ? window.location.origin : reserva);
const esHttp = (u) => u.protocol === 'https:' || u.protocol === 'http:';
const esMateixOrigen = (u) => typeof window !== 'undefined' && u.origin === window.location.origin;

const HOSTS_AVATAR_OAUTH = Object.freeze(['platform-lookaside.fbsbx.com', 'graph.facebook.com', 'avatars.githubusercontent.com']);
const DOMINIS_AVATAR_OAUTH = Object.freeze(['googleusercontent.com', 'ggpht.com', 'gravatar.com']);
const ORIGENS_OAUTH = Object.freeze(['https://lh3.googleusercontent.com', ...HOSTS_AVATAR_OAUTH.map((h) => `https://${h}`)]);
const origensPropis = [];

export function permetOrigenMitjans(url) {
  if (!url) return;
  try {
    const origen = new URL(url).origin;
    if (!origensPropis.includes(origen) && !ORIGENS_OAUTH.includes(origen)) origensPropis.push(origen);
  } catch (err) {
    void err;
  }
}

const MARCA_TAULA = (() => {
  try {
    return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return '';
  }
})();

/** La marca que parseMarkdown posa a data-sdp-taula de cada caixa de taula. */
export const marcaDeTaula = () => MARCA_TAULA;

const esCaixaDeTaula = (node) => node?.tagName === 'DIV' && node.classList?.contains('sdp-taula-prosa') === true;
const CAIXA_MARCADA = Symbol.for('sdp.sanitize.caixaDeTaula');
const esCaixaMarcada = (node) => esCaixaDeTaula(node) && node[CAIXA_MARCADA] === true;
const CAMI_PROPI = /^\/[^/\\]/;
const CARACTER_DE_FORA = /[\u0000-\u001F\u007F\\]/;

const OPCIONS_PURIFICA = {
  ALLOWED_TAGS: 'p,br,strong,em,a,ul,ol,li,h1,h2,h3,h4,h5,h6,blockquote,span,div,img,hr,code,pre,s,u,table,thead,tbody,tfoot,tr,th,td,caption'.split(','),
  ALLOWED_ATTR: 'href,target,rel,src,alt,class,lang,width,height,loading,decoding,referrerpolicy,data-sdp-bloquejada,colspan,rowspan,scope'.split(','),
  ALLOWED_URI_REGEXP: /^(?! *\/\/)(?:(?:https?|mailto|tel|sdp-media):|data:image\/(?:png|jpeg|jpg|webp|gif|avif);|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: 'style,script,iframe,object,embed,form,input,svg,math'.split(','),
  FORBID_ATTR: 'style,srcset,formaction,ping'.split(','),
};

function posaGanxos() {
  if (ganxosPosats || typeof DOMPurify.addHook !== 'function') return;
  ganxosPosats = true;

  DOMPurify.addHook('beforeSanitizeAttributes', (node) => {
    if (MARCA_TAULA && esCaixaDeTaula(node) && node.getAttribute('data-sdp-taula') === MARCA_TAULA) node[CAIXA_MARCADA] = true;
  });

  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName === 'start') {
      data.keepAttr = false;
      if (llistesNumerades && node.tagName === 'OL' && /^[+-]?\d{1,10}$/.test(data.attrValue)
          && Number(data.attrValue) >= -2147483648 && Number(data.attrValue) <= 2147483647) {
        data.forceKeepAttr = true;
      }
      return;
    }
    if (data.attrName === 'data-sdp-taula') {
      data.keepAttr = false;
      return;
    }
    if (node[CAIXA_MARCADA] === true
        && ((data.attrName === 'role' && data.attrValue === 'region') || (data.attrName === 'tabindex' && data.attrValue === '0'))) {
      data.forceKeepAttr = true;
    }
  });

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.nodeType === 1 && !esCaixaMarcada(node) && (node.hasAttribute('role') || node.hasAttribute('tabindex'))) {
      node.removeAttribute('role');
      node.removeAttribute('tabindex');
    }

    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || '';
      const esLocal = imatgesNomesPropies ? esFontImatgePropia(src) : esFontImatgeSegura(src);
      if (!esLocal) {
        node.removeAttribute('src');
        node.setAttribute('alt', node.getAttribute('alt') || 'Imatge externa bloquejada');
        node.setAttribute('data-sdp-bloquejada', '1');
      }
      node.setAttribute('loading', 'lazy');
      node.setAttribute('decoding', 'async');
      node.setAttribute('referrerpolicy', 'no-referrer');
    }

    if (imatgesNomesPropies && node.nodeType === 1) {
      const instantania = node.getAttribute('data-imatge');
      if (instantania && !esFontImatgePropia(instantania)) node.removeAttribute('data-imatge');
    }

    if (node.tagName === 'A') {
      if (!node.hasAttribute('href')) {
        node.removeAttribute('target');
        node.removeAttribute('rel');
      } else {
        const href = node.getAttribute('href');
        const desti = destinacioSeguraDEnllac(href, node.getAttribute('target'));
        if (esEnllacExtern(href)) {
          const sponsored = enllacosPatrocinats || /(?:^|\s)sponsored(?:\s|$)/i.test(node.getAttribute('rel') || '');
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', relEnllacExtern({ editorial: enllacosEditorials, sponsored }));
        } else {
          node.setAttribute('rel', 'noopener noreferrer nofollow');
          if (desti) node.setAttribute('target', desti);
          else node.removeAttribute('target');
        }
      }
    }
  });
}

posaGanxos();

export function sanitizeHtml(html, opcions) {
  if (!html) return '';
  imatgesNomesPropies = opcions?.imatgesPropies === true;
  llistesNumerades = opcions?.llistesNumerades === true;
  enllacosEditorials = opcions?.enllacosEditorials === true;
  enllacosPatrocinats = opcions?.sponsored === true;
  try {
    try {
      return DOMPurify.sanitize(String(html), OPCIONS_PURIFICA);
    } finally {
      imatgesNomesPropies = false;
    }
  } finally {
    llistesNumerades = false;
    enllacosEditorials = false;
    enllacosPatrocinats = false;
  }
}

export function netejaText(valor, maxim = 4000) {
  return normalitzaUnicodeSegura(String(valor ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n?/g, '\n'))
    .trim()
    .slice(0, maxim);
}

function admetFont(url, admetOrigen) {
  if (!url) return false;
  const net = String(url).trim();
  if (/^data:image\/(png|jpeg|jpg|webp|gif|avif);/i.test(net) || /^sdp-media:\/\/(mitjans_privats|mitjans)\//i.test(net)) return true;
  try {
    const u = new URL(net, origenActual());
    return esHttp(u) && (esMateixOrigen(u) || admetOrigen(u.origin));
  } catch {
    return false;
  }
}

export function esFontImatgeSegura(url) {
  if (esCamiPropi(url)) return true;
  return admetFont(url, (origen) => origensPropis.includes(origen) || ORIGENS_OAUTH.includes(origen));
}

function esCamiPropi(url) {
  const net = textNet(url);
  return CAMI_PROPI.test(net) && !CARACTER_DE_FORA.test(net);
}

export function esFontImatgePropia(url) {
  if (esCamiPropi(url)) return true;
  return admetFont(url, (origen) => origensPropis.includes(origen));
}

export function fontImatgePropia(url) {
  return esFontImatgePropia(url) ? url : null;
}

export function esAvatarDeProveidorOAuth(url) {
  const net = textNet(url);
  if (!net) return false;
  try {
    const u = new URL(net);
    if (u.protocol !== 'https:' || u.port !== '') return false;
    if (ORIGENS_OAUTH.includes(u.origin)) return true;
    const host = u.hostname.toLowerCase();
    return HOSTS_AVATAR_OAUTH.includes(host)
      || DOMINIS_AVATAR_OAUTH.some((domini) => host === domini || host.endsWith(`.${domini}`));
  } catch {
    return false;
  }
}

const ORIGENS_VIDEO_NODE0 = Object.freeze(['https://socdepoble.cat', 'https://socdepoble.org']);
const esMitjaPropiNode0 = (u) => u.protocol === 'https:'
  && ORIGENS_VIDEO_NODE0.includes(u.origin)
  && u.pathname.startsWith('/media/');

export function esFontVideoPropia(url) {
  if (esCamiPropi(url)) return true;
  const net = textNet(url);
  if (!net || net.startsWith('//')) return false;
  try {
    const u = new URL(net, origenActual());
    if (!esHttp(u)) return false;
    if (esMateixOrigen(u)) return true;
    return u.protocol === 'https:' && (origensPropis.includes(u.origin) || esMitjaPropiNode0(u));
  } catch {
    return false;
  }
}

export function fontVideoPropia(url) {
  return esFontVideoPropia(url) ? url.trim() : null;
}

const MAXIM_URL_VIDEO = 2048;
const CARACTER_DE_FORA_VIDEO = /[\u0000-\u001F\u007F-\u009F\u2028\u2029\\]/;
const RE_VIDEO_OPAC_PUBLIC = /^sdp-media:\/\/mitjans\/(?![A-Za-z0-9._/-]*\.\.)[A-Za-z0-9._/-]{1,200}\.(?:mp4|webm)$/i;
const RE_SOBRE_VIDEO_HTTPS = /^https:\/\/[^/?#\s]+\/[^?#]*\.(?:mp4|webm)(?:[?#].*)?$/i;
const RE_SOBRE_VIDEO_CAMI = /^\/[^/][^?#]*\.(?:mp4|webm)(?:[?#].*)?$/i;
const RE_EXTENSIO_VIDEO = /\.(?:mp4|webm)$/i;

export function esVideoDeCapcaleraDesable(url, resol = (valor) => valor) {
  const net = textNet(url);
  if (!net || net.length > MAXIM_URL_VIDEO || CARACTER_DE_FORA_VIDEO.test(net)) return false;
  if (/^sdp-media:/i.test(net)) return RE_VIDEO_OPAC_PUBLIC.test(net);
  if (!RE_SOBRE_VIDEO_HTTPS.test(net) && !RE_SOBRE_VIDEO_CAMI.test(net)) return false;
  const resolt = fontVideoPropia(resol(net));
  if (!resolt) return false;
  try {
    return RE_EXTENSIO_VIDEO.test(new URL(resolt, 'https://socdepoble.org').pathname);
  } catch {
    return false;
  }
}
