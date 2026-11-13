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

/* Decisió 3 del Mestre (261007, confirmada) · Relleu 261007 (peça
   «imatges-detall») · El MODE ESTRICTE de les <img> d'un cos HTML. El ganxo
   del sanejador és únic i global (posaGanxos), i DOMPurify és síncron: esta
   marca només val mentre dura la crida de sanitizeHtml(html,
   { imatgesPropies: true }), i torna a fals en acabar, també si falla. Sense
   l'opció, el filtre de sempre (esFontImatgeSegura) per a tots els altres
   consumidors: Notes, el Perfil, la Wiki, l'editor i el mapejador. */
let imatgesNomesPropies = false;

/* O7 · Gauntlet WC-06 · El start d'una llista numerada només viu a la prosa
   dels documents de la Wiki (ProsaDeLaWiki): sanitizeHtml(html,
   { llistesNumerades: true }). Com la marca de dalt, només val mentre dura la
   crida. Sense l'opció, start cau com sempre: Notes, el Mur, el Perfil,
   l'editor i els panells de la Maquinària pinten el mateix, byte a byte. */
let llistesNumerades = false;

/* Decisió 3 del Mestre (261007, confirmada) · «Imatges externes al Mur:
   PROHIBIDES (PRIVACITAT). Per a evitar el rastreig d'IPs dels usuaris per
   part de tercers, només es permetran imatges allotjades localment o pujades
   al nostre servidor.» Abans hi havia una sola llista d'orígens; ara en són
   dos, i esFontImatgeSegura els mira tots dos, com sempre (la mateixa
   semàntica per al sanejador, Notes, el Perfil i les apps):
    · ORIGENS_OAUTH · els avatars dels proveïdors d'entrada (Google, Facebook,
      GitHub). Són de tercers: el mode estricte del Mur no els admet.
    · origensPropis · els del NOSTRE servidor de mitjans, que registra la
      configuració amb permetOrigenMitjans: el Supabase de Sóc de Poble
      (data/supabase/runtime.js) i l'origen des d'on es servix el paquet quan
      no és el de la pàgina, el plugin-url de WordPress o de Sollutia
      (PedraSecaEmbed.jsx, _aplicaBaseRecursos, amb la base d'assetResolver).
      Revisió adversarial del 261007 · Es registra l'ORIGEN sencer, no només
      la carpeta del paquet: si el paquet es servix des d'un CDN compartit,
      tota imatge d'eixe CDN passa per pròpia (pregunta oberta al Mestre). */
const ORIGENS_OAUTH = Object.freeze([
  'https://lh3.googleusercontent.com',
  'https://platform-lookaside.fbsbx.com',
  'https://graph.facebook.com',
  'https://avatars.githubusercontent.com'
]);
const origensPropis = [];

/* Decisió 3 (261007) · Un origen OAuth no es pot fer passar per nostre: ja el
   tenia esFontImatgeSegura i, al mode estricte, continua sent de tercers. */
export function permetOrigenMitjans(url) {
  if (!url) return;
  try {
    const origen = new URL(url).origin;
    if (!origensPropis.includes(origen) && !ORIGENS_OAUTH.includes(origen)) origensPropis.push(origen);
  } catch (err) {
    void err;
  }
}

/* P1-16 (pla 261028_1526 §3.5.1) · La marca de les caixes de taula que fa
   parseMarkdown.js (data-sdp-taula). La classe sola no basta: qualsevol
   autor la pot escriure, i este sanejador és també el del Mur, les Notes i
   el Perfil. La marca és a l'atzar per a cada càrrega del mòdul i només viu
   entre parseMarkdown i sanitizeHtml: el sanejador la lleva sempre, i un
   contingut desat no la pot conéixer. Sense crypto, cap marca: cap caixa no
   guanya role ni tabindex (falla tancada). */
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
/* Una caixa amb la marca bona s'anota al node abans de sanejar-ne cap
   atribut. Symbol.for i no una WeakSet del mòdul: si el mòdul s'avalua dues
   vegades sobre el mateix DOMPurify (el HMR de Vite, vi.resetModules), els
   ganxos de cada avaluació veuen la caixa que n'ha aprovat l'altra. L'HTML
   no pot posar cap propietat de JavaScript a un node. */
const CAIXA_MARCADA = Symbol.for('sdp.sanitize.caixaDeTaula');
const esCaixaMarcada = (node) => esCaixaDeTaula(node) && node[CAIXA_MARCADA] === true;

function posaGanxos() {
  if (ganxosPosats) return;
  /* Pla 261018_1605 (Tasca 0 i 3; ordre del Mestre, 18-10-2026) · Sense DOM
     (Node pla: build-seo-manifest.mjs, les proves amb l'entorn node) DOMPurify
     no porta ni addHook ni sanitize, i este mòdul cauria en carregar-se:
     identitatsSeed.js l'importa ara pel classificador únic de fonts pròpies.
     Sense DOM no hi ha cap ganxo a posar, i sanitizeHtml continua fallant
     tancada (DOMPurify.sanitize no hi és). En el navegador i en jsdom, res no
     canvia: el ganxo s'arma en carregar el mòdul, com sempre. */
  if (typeof DOMPurify.addHook !== 'function') return;
  ganxosPosats = true;

  /* P1-16 (pla 261028_1526 §3.5.1) · La caixa d'una taula de prosa
     (parseMarkdown.js) és una regió amb focus: role="region" i tabindex="0",
     exactament eixos dos valors i només al div.sdp-taula-prosa que porta la
     marca d'esta càrrega (MARCA_TAULA). ALLOWED_ATTR no s'eixampla: el
     sanejador és el de Notes, el Perfil i el Mur, i cap altre element, cap
     caixa escrita a mà ni cap altre valor no guanya role ni tabindex. La
     marca es mira abans de sanejar cap atribut (DOMPurify els recorre de
     l'últim al primer i la lleva) i no ix mai. */
  DOMPurify.addHook('beforeSanitizeAttributes', (node) => {
    if (MARCA_TAULA && esCaixaDeTaula(node) && node.getAttribute('data-sdp-taula') === MARCA_TAULA) node[CAIXA_MARCADA] = true;
  });

  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    // O7 · start és semàntica de numeració, únicament en <ol> i només amb
    // { llistesNumerades: true } (WC-06). Cap atribut global nou: un enter
    // HTML amb signe i dins del rang de 32 bits.
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
    if (node[CAIXA_MARCADA] !== true) return;
    if ((data.attrName === 'role' && data.attrValue === 'region') || (data.attrName === 'tabindex' && data.attrValue === '0')) {
      data.forceKeepAttr = true;
    }
  });

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    /* P1-16 · Si la classe de la caixa ha caigut després de guardar-los (un
       class amb «-->», que DOMPurify esborra sencer), role i tabindex cauen
       amb ella: fora d'una caixa marcada no n'hi ha cap. */
    if (node.nodeType === 1 && !esCaixaMarcada(node) && (node.hasAttribute('role') || node.hasAttribute('tabindex'))) {
      node.removeAttribute('role');
      node.removeAttribute('tabindex');
    }

    // 1. Cap far de tercers. Només imatges del nostre origen o data: URI.
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || '';

      /* Decisió 3 (261007) · Amb { imatgesPropies: true }, només les pròpies
         (esFontImatgePropia: cap avatar OAuth); si no, el filtre de sempre. */
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

    /* Decisió 3 (261007) · Revisió adversarial del 261008 · La instantània
       d'una targeta incrustada al cos (data-imatge, formaDelGrup.js) es pinta
       quan l'original no es resol, i el seu filtre (imatgeNeta i la
       imatgePrivada d'UniversalCard, esFontImatgeSegura) admet els avatars
       OAuth. Amb { imatgesPropies: true }, una que no és pròpia perd
       l'atribut: la targeta es pinta sense imatge. Un valor buit, tal qual.
       Sense l'opció, res no canvia. */
    if (imatgesNomesPropies && node.nodeType === 1) {
      const instantania = node.getAttribute('data-imatge');
      if (instantania && !esFontImatgePropia(instantania)) node.removeAttribute('data-imatge');
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

/**
 * L'HTML sanejat. `opcions.imatgesPropies` (Decisió 3 del Mestre, 261007):
 * cert només per al cos d'una publicació, d'un producte o d'un acte del Mur
 * (cosAmbImatgesPropies de sections/detail/detailSectionMeta.jsx). Una <img>
 * que no és pròpia perd el src com les de fora de sempre (alt i
 * data-sdp-bloquejada), i la instantània d'una targeta incrustada que no és
 * pròpia perd el data-imatge. Sense opcions, o amb qualsevol altre valor, el
 * filtre de sempre: la mateixa eixida, byte a byte.
 * `opcions.llistesNumerades` (O7, WC-06): cert només per a la prosa de la
 * Wiki; una <ol> hi conserva el seu start numèric.
 * Cada marca té el seu finally: el de dins és el del mode estricte, que la
 * guarda del Mur (qualitat.imatgesPropies.test.js) llig literal.
 */
export function sanitizeHtml(html, opcions) {
  if (!html) return '';
  imatgesNomesPropies = opcions?.imatgesPropies === true;
  llistesNumerades = opcions?.llistesNumerades === true;
  try {
    try {
      return purifica(html);
    } finally {
      imatgesNomesPropies = false;
    }
  } finally {
    llistesNumerades = false;
  }
}

function purifica(html) {
  return DOMPurify.sanitize(String(html), {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'span', 'div', 'img', 'hr', 'code', 'pre', 's', 'u',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'class', 'lang',
      'width', 'height', 'loading', 'decoding', 'referrerpolicy',
      'data-sdp-bloquejada', 'colspan', 'rowspan', 'scope'
    ],
    // (sollutia, links relatius sense ser protocol-relative, mailto, tel, sdp-media, i data:image restringida sense svg per a offline mode)
    // El guió de `[^a-z+.\-:]` va escapat: sense barra, `.-:` era un RANG (. / 0-9 :)
    // i un enllaç relatiu com `docs/x.md` o `pagina2` perdia l'href. `:` continua fora.
    ALLOWED_URI_REGEXP: /^(?! *\/\/)(?:(?:https?|mailto|tel|sdp-media):|data:image\/(?:png|jpeg|jpg|webp|gif|avif);|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
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

/* La regla comuna dels dos filtres: data-URI d'imatge (sense SVG), referència
   opaca sdp-media:// dels dos buckets, o http(s) del mateix origen o d'un
   origen que `admetOrigen` accepte. Un camí relatiu es resol contra l'origen
   de la finestra: un '//altre.example' o un '/\altre.example' (el navegador
   llig la barra inversa com a barra) ixen d'ací amb l'origen de fora.
   R22.1 (Gauntlet, regressió de admetFont) · Cap origen del Node 0 ací: el
   mode estricte de les IMATGES (Mur, Notes, sanitizeHtml) és el del COMMIT 5
   i el del disparador del servidor (private.mur_imatge_propia, que només
   admet private.ajustos.origens_mitjans_propis). Els /media/ del Node 0 només
   valen per al vídeo (esFontVideoPropia). */
function admetFont(url, admetOrigen) {
  if (!url) return false;
  const net = String(url).trim();
  if (/^data:image\/(png|jpeg|jpg|webp|gif|avif);/i.test(net)) return true;
  if (/^sdp-media:\/\/(mitjans_privats|mitjans)\//i.test(net)) return true;
  try {
    const u = new URL(net, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    return (typeof window !== 'undefined' && u.origin === window.location.origin) || admetOrigen(u.origin);
  } catch {
    return false;
  }
}

/** Font d'imatge admissible: data-URI d'imatge, ruta pròpia o http(s). '' = esborrat legítim.
 *  Fase C (Capacitor 8; ordre del Mestre, 261019) · El camí propi ('/assets/…')
 *  passa per la mateixa regla que a esFontImatgePropia (esCamiPropi): a l'app
 *  nativa d'iOS (capacitor://localhost) admetFont el rebutjava, i el sanejador,
 *  les Notes i el Perfil perdien la imatge pròpia. A una pàgina http(s) ja
 *  passava: el mateix origen. */
export function esFontImatgeSegura(url) {
  if (esCamiPropi(url)) return true;
  return admetFont(url, (origen) => origensPropis.includes(origen) || ORIGENS_OAUTH.includes(origen));
}

/**
 * Decisió 3 del Mestre (261007) · El MODE ESTRICTE del Mur: només imatges
 * pròpies. El mateix origen, els orígens del nostre servidor de mitjans
 * (permetOrigenMitjans: el Storage del Supabase i el paquet servit des d'un
 * altre origen), data:image i sdp-media://. Cap avatar OAuth (Google,
 * Facebook, GitHub): són servidors de tercers. En una pàgina http(s), tot el
 * que admet este filtre l'admet també esFontImatgeSegura, i per això una
 * targeta amb `imatgePrivada` (fontSegura de marca.jsx) pinta igual el que ja
 * hi ha passat. Llevat de les sdp-media:// (XAT-02, 261014): fontSegura les
 * descarta (esMitjaOpac, utils/mitjaOpac.js) perquè el navegador no les sap
 * carregar; com a dada continuen sent admissibles.
 *
 * Revisió adversarial del 261007 · Un camí absolut del mateix lloc ('/assets/…')
 * és propi encara que la finestra no siga http(s): a l'app nativa
 * (capacitor://localhost) admetFont el resolia contra un origen 'capacitor:' i
 * el rebutjava, i la portada PRÒPIA del detall desapareixia (abans PageFrame la
 * pintava sense filtre). És la regla del trigger del servidor
 * (supabase/migrations/2610072230_mur_imatges_propies.sql): UNA sola barra
 * seguida d'un caràcter que no siga barra ni barra inversa, i cap caràcter de
 * control ni barra inversa enlloc (el navegador lleva els uns i llig l'altra
 * com a barra: '/\t/fora.example' i '/\fora.example' són un altre origen).
 * Fase C (261019) · La mateixa regla val ara per a esFontImatgeSegura.
 */
const CAMI_PROPI = /^\/[^/\\]/;
const CARACTER_DE_FORA = /[\u0000-\u001F\u007F\\]/;

function esCamiPropi(url) {
  const net = typeof url === 'string' ? url.trim() : '';
  return CAMI_PROPI.test(net) && !CARACTER_DE_FORA.test(net);
}

export function esFontImatgePropia(url) {
  if (esCamiPropi(url)) return true;
  return admetFont(url, (origen) => origensPropis.includes(origen));
}

/** Decisió 3 (261007) · La mateixa font si és pròpia (esFontImatgePropia); si
 *  no, null: la imatge no es demana i qui la pinta hi posa el seu substitut. */
export function fontImatgePropia(url) {
  return esFontImatgePropia(url) ? url : null;
}

/* Pla 261018_1605 (Tasca 3, D6; ordre del Mestre, 18-10-2026) · La foto que
   posa el proveïdor d'entrada (Google, Facebook, GitHub, Gravatar). No és cap
   filtre: esFontImatgeSegura i esFontImatgePropia no canvien, i ORIGENS_OAUTH
   tampoc. Només diu de qui és una foto que no és pròpia, per a no confondre-la
   amb una qualsevol de fora. Només https al port per defecte: un origen
   d'ORIGENS_OAUTH, un d'estos hosts exactes o un subdomini (o el domini mateix)
   dels CDN de foto dels proveïdors. Retira les dues còpies de la primera passada
   (personaDeSessio.js i identitatsSeed.js). */
const HOSTS_AVATAR_OAUTH = Object.freeze(['platform-lookaside.fbsbx.com', 'graph.facebook.com', 'avatars.githubusercontent.com']);
const DOMINIS_AVATAR_OAUTH = Object.freeze(['googleusercontent.com', 'ggpht.com', 'gravatar.com']);

export function esAvatarDeProveidorOAuth(url) {
  const net = typeof url === 'string' ? url.trim() : '';
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

/* Ordre del Mestre (03-11-2026) · Vídeo protagonista allotjat al servidor
   de mitjans del Node 0 (https://socdepoble.cat/media/...) o al mateix
   origen. Cap servidor de tercers (YouTube, Vimeo, CDN alienes). Només per al
   VÍDEO: les imatges continuen amb admetFont (vegeu-la, damunt). */
const ORIGENS_VIDEO_NODE0 = Object.freeze([
  'https://socdepoble.cat',
  'https://socdepoble.org'
]);

const esMitjaPropiNode0 = (u) => u.protocol === 'https:'
  && ORIGENS_VIDEO_NODE0.includes(u.origin)
  && u.pathname.startsWith('/media/');

export function esFontVideoPropia(url) {
  if (esCamiPropi(url)) return true;
  const net = typeof url === 'string' ? url.trim() : '';
  if (!net || net.startsWith('//')) return false;
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const u = new URL(net, base);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    if (typeof window !== 'undefined' && u.origin === window.location.origin) return true;
    if (u.protocol !== 'https:') return false;
    if (origensPropis.includes(u.origin)) return true;
    return esMitjaPropiNode0(u);
  } catch {
    return false;
  }
}

export function fontVideoPropia(url) {
  return esFontVideoPropia(url) ? url.trim() : null;
}

/* R22.1 (Gauntlet r221-dades-07, r221-text-09 i r221-dades-03) · El vídeo
   principal que es pot DESAR en una capçalera pública (hero_video_url). Un sol
   validador: el fan servir valorPerDesar (perfilCamps.js) i el diàleg
   (DialegEnquadrament.jsx). La regla canònica té dos passos:
   1. El SOBRE, el del CHECK de 20261113060000 i escrit igual: el text que es
      desa (sense espais als extrems) té com a molt 2.048 caràcters, cap
      caràcter de control ni barra inversa, i és una d'estes tres formes:
      · sdp-media://mitjans/<camí>.mp4|.webm (el bucket PÚBLIC: mai
        mitjans_privats, que cap visitant pot signar, ni cap '..');
      · https://<host>/<camí>.mp4|.webm, amb ? o # opcionals darrere;
      · /<camí>.mp4|.webm, un camí propi d'UNA barra.
      Un camí relatiu sense barra inicial ('media/x.mp4', './x.mp4',
      'x.webm') o un http:// (també el del servidor de desenvolupament) NO hi
      entra: el CHECK el rebutjaria (23514), i un relatiu es resoldria segons
      la pàgina on es pinta.
   2. L'ORIGEN, que el CHECK no pot saber (és configuració de cada node): una
      adreça https o un camí ha de ser propi després de `resol`, el resolutor
      de camins del paquet (esFontVideoPropia: el mateix origen, origensPropis
      o els /media/ del Node 0), i el seu camí, acabat en .mp4 o .webm.
   Tot el que admet este validador ho admet el CHECK; el CHECK n'admet més
   (qualsevol host https), mai al revés. Per això el client és, si de cas, més
   estricte: el [[:cntrl:]] de PostgreSQL en UTF-8 pot incloure els controls
   C1 (U+0080-U+009F) i els separadors U+2028 i U+2029, i el client els
   rebutja sempre. Les proves de paritat són src/utils/sanitize.videoCapcalera.test.js
   (amb el text del CHECK) i tests/r22-1-hero-video-url-postgres.test.mjs
   (contra PostgreSQL 18.6 de veres). */
const MAXIM_URL_VIDEO = 2048;
const CARACTER_DE_FORA_VIDEO = /[\u0000-\u001F\u007F-\u009F\u2028\u2029\\]/;
const RE_VIDEO_OPAC_PUBLIC = /^sdp-media:\/\/mitjans\/(?![A-Za-z0-9._/-]*\.\.)[A-Za-z0-9._/-]{1,200}\.(?:mp4|webm)$/i;
const RE_SOBRE_VIDEO_HTTPS = /^https:\/\/[^/?#\s]+\/[^?#]*\.(?:mp4|webm)(?:[?#].*)?$/i;
const RE_SOBRE_VIDEO_CAMI = /^\/[^/][^?#]*\.(?:mp4|webm)(?:[?#].*)?$/i;
const RE_EXTENSIO_VIDEO = /\.(?:mp4|webm)$/i;

export function esVideoDeCapcaleraDesable(url, resol = (valor) => valor) {
  const net = typeof url === 'string' ? url.trim() : '';
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
