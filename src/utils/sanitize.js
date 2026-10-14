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

function posaGanxos() {
  if (ganxosPosats) return;
  ganxosPosats = true;

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
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
 */
export function sanitizeHtml(html, opcions) {
  if (!html) return '';
  imatgesNomesPropies = opcions?.imatgesPropies === true;
  try {
    return purifica(html);
  } finally {
    imatgesNomesPropies = false;
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
      'href', 'target', 'rel', 'src', 'alt', 'class',
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
   llig la barra inversa com a barra) ixen d'ací amb l'origen de fora. */
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

/** Font d'imatge admissible: data-URI d'imatge, ruta pròpia o http(s). '' = esborrat legítim. */
export function esFontImatgeSegura(url) {
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
 * Només ací: esFontImatgeSegura, el filtre dels altres consumidors, no canvia.
 */
const CAMI_PROPI = /^\/[^/\\]/;
const CARACTER_DE_FORA = /[\u0000-\u001F\u007F\\]/;

export function esFontImatgePropia(url) {
  const net = typeof url === 'string' ? url.trim() : '';
  if (CAMI_PROPI.test(net) && !CARACTER_DE_FORA.test(net)) return true;
  return admetFont(url, (origen) => origensPropis.includes(origen));
}

/** Decisió 3 (261007) · La mateixa font si és pròpia (esFontImatgePropia); si
 *  no, null: la imatge no es demana i qui la pinta hi posa el seu substitut. */
export function fontImatgePropia(url) {
  return esFontImatgePropia(url) ? url : null;
}
