#!/usr/bin/env node
/**
 * porta-perimetre-tellado.mjs (v1.4) — Porta estàtica de Perímetre, Signatures
 * d'Exfiltració, Manteniment 503, Secrets WP 7.2+, HSTS i Favicon SEO (`R25` +
 * `R25.2` + correccions de l'Onada R26 a l'auditoria Codex `R25.2-P01..P03`).
 *
 * 100 % lectura determinista, zero xarxa, zero mutacions al repositori.
 *
 * QUÈ CERTIFICA I QUÈ NO
 *   · Certifica només les signatures cobertes (`abast.signatures`). El veredicte
 *     distingix tres estats: `infraccions`, `desconegut` i
 *     `net-en-signatures-cobertes`. Cap estat vol dir «zero exfiltració»: un
 *     destí de xarxa concatenat, variable o extern es declara `desconegut`.
 *   · El lexer és lineal i heurístic (JS/JSX/TS, CSS, HTML i PHP amb HTML
 *     incrustat), no un AST. Per això tota signatura es busca també sobre el
 *     text cru: la que només apareix dins del que el lexer creu un comentari es
 *     declara `SIGNATURA_EN_COMENTARI` (desconeguda), mai no desapareix.
 *
 * COBERTURA (`R25.2-P01..P03`)
 *   1. Lexer lineal conscient de cadenes, plantilles amb `${}` niuats, literals
 *      regex, apòstrofs de text JSX, `?>` i HTML incrustat en PHP, heredoc i
 *      nowdoc, i `<script>`/`<style>` en HTML.
 *   2. Signatures `TELLADO-EXF-01..04` amb recorregut lineal d'etiquetes (cap
 *      expressió amb retrocés quadràtic) i inventari de destins de xarxa
 *      (`fetch`, `sendBeacon`, `WebSocket`, `EventSource`, `import()` i
 *      `createElement('script')`).
 *   3. Capçaleres i CSP (`TELLADO-HDR-01..04` + `VIG-09`).
 *   4. Perímetre WordPress (`TELLADO-WP-01..03`): guarda `ABSPATH`/`exit|die`
 *      exacta com a primera sentència, `permission_callback` real per endpoint
 *      (cap cadena que l'imite ni cap closure trivial) i àmbit (`distribuit`
 *      segons la llista blanca ADAPTADOR, `exemple-amfitrio` per a
 *      `wordpress-plugin/eines/amfitrio/`, `no-distribuit`, `amfitrio-arrel`).
 *   4b. Ronda 2 (Onada R26): JSX amb text entre etiquetes, URL normalitzades
 *      amb el parser WHATWG (escapaments JS, entitats HTML, `\`, tabuladors),
 *      etiquetes sense tancar declarades i xarxa de seguretat dels embornals.
 *   4c. Ronda 3 (Onada R26): cada etiqueta es llig amb l'autòmat d'atributs del
 *      navegador (PHP opac, `{…}` JSX conscient de cadenes) i les signatures
 *      miren la unió amb la lectura de la base (cada «\ssrc=»): cap cas que la
 *      base marcava no es perd. RCDATA (textarea, title…), `<script href>`,
 *      EXF-02 per l'amfitrió WHATWG, lectures ambigües del lexer declarades i
 *      costos lineals (xarxa de seguretat, VIG-08).
 *   4d. Ronda 4 (Onada R26): el prefix fix d'un src amb plantilla (`${`, `<?`,
 *      `{{`, `{%`) es classifica abans que la plantilla: un amfitrió extern ja
 *      escrit és EXF-01 (fallada tancada, com la base) i un amfitrió complet de
 *      la llista blanca és un iframe permés. El punt decimal i el spread no fan
 *      de la paraula clau següent un nom de propietat.
 *   5. `VIG-07`, `VIG-08` i `VIG-10`.
 *   6. Pressupostos que tanquen en fals: bytes per fitxer, bytes totals i
 *      incidències (`TELLADO-LIMIT-01/02`).
 *
 *   node tooling/gates/porta-perimetre-tellado.mjs [--json] [--arrel=DIR]
 */
import fs from 'node:fs';
import path from 'node:path';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import { preparaRevisioTellado, catalogaTellado, resumCatalegTellado } from '../lib/tellado-cataleg-r32_14.mjs';

export const VERSIO_PORTA_TELLADO = '1.5.0';
export const MAX_BYTES_FITXER_ESCANEIG = 8 * 1024 * 1024;
export const MAX_BYTES_TOTAL_ESCANEIG = 256 * 1024 * 1024;
export const MAX_INCIDENCIES = 1000;
export const MAX_DESCONEGUTS = 1000;
const MAX_LITERAL_REGEX = 512;
const MAX_ETIQUETA = 16 * 1024;
const MAX_ARGUMENT = 4096;

export const DOMINIS_IFRAME_PERMESOS = Object.freeze([
  'www.youtube-nocookie.com',
  'www.openstreetmap.org',
  'socdepoble.org',
  'www.socdepoble.org',
  'sollutia.cat',
  'www.sollutia.cat',
  'sollutia.com',
  'www.sollutia.com',
]);

const EXPRESSIONS_IFRAME_SANEJADES = Object.freeze([
  /^\$\{ORIGEN_VIDEO_EDITORIAL\}\/embed\//,
  /^buildMapEmbedUrl\(\)$/,
  /^video\.incrustacio$/,
  /^\$\{hrefSegur\}$/,
]);

const REFERRER_POLICIES_ESTRICTES = new Set([
  'strict-origin-when-cross-origin',
  'same-origin',
  'strict-origin',
  'no-referrer',
]);

const RE_FITXER_PROVA_O_MIRALL = /(?:^|\/)(?:__tests__|tests|fixtures)\/|\.(?:test|spec)\.[cm]?[jt]sx?$|src\/data\/wikiManifest\.js$/;

const DOMINIS_FONTS = '(?:fonts\\.googleapis\\.com|fonts\\.gstatic\\.com|use\\.typekit\\.net|fast\\.fonts\\.net)';
const RE_FONT_HREF = new RegExp(DOMINIS_FONTS, 'i');
// Sense cap `[^…]*` davant de l'àncora: cost lineal fins i tot amb milers d'aparicions.
const RE_FONTS_SENSE_LINK = new RegExp(
  `@import\\s+(?:url\\s*\\(\\s*)?["']?(?:https?:)?\\/\\/${DOMINIS_FONTS}`
  + `|url\\s*\\(\\s*["']?(?:https?:)?\\/\\/${DOMINIS_FONTS}`
  + `|["']https?:\\/\\/${DOMINIS_FONTS}\\/`,
  'gi',
);

const PATRONS_TRACKERS = Object.freeze([
  { nom: 'Google Tag Manager / Analytics', re: /(?:https?:)?\/\/(?:www\.)?(?:googletagmanager\.com|google-analytics\.com)\//i },
  { nom: 'Meta / Facebook Pixel', re: /(?:https?:)?\/\/connect\.facebook\.net\/|\bfbq\s*\(\s*['"](?:init|track)['"]/i },
  { nom: 'Google gtag()', re: /\bgtag\s*\(\s*['"](?:config|event|js)['"]/i },
  { nom: 'DoubleClick / AdSense', re: /(?:https?:)?\/\/(?:[\w-]+\.)?(?:doubleclick\.net|googlesyndication\.com)\//i },
  { nom: 'Hotjar / Clarity / Mixpanel / Segment', re: /(?:https?:)?\/\/(?:static\.hotjar\.com|www\.clarity\.ms|cdn\.mxpnl\.com|cdn\.segment\.com)\//i },
  { nom: 'TikTok Pixel', re: /(?:https?:)?\/\/analytics\.tiktok\.com\//i },
]);

/** Embornals de xarxa inventariats. Fora d'esta llista la porta no diu res. */
const EMBORNALS_XARXA = Object.freeze([
  { nom: 'fetch', re: /(?<![\w$.])fetch\s*\(/g },
  { nom: 'window.fetch', re: /\b(?:window|globalThis|self)\.fetch\s*\(/g },
  { nom: 'navigator.sendBeacon', re: /\bnavigator\.sendBeacon\s*\(/g },
  { nom: 'WebSocket', re: /\bnew\s+WebSocket\s*\(/g },
  { nom: 'EventSource', re: /\bnew\s+EventSource\s*\(/g },
  { nom: 'import()', re: /(?<![\w$.])import\s*\(/g },
]);
const RE_SCRIPT_DINAMIC = /\bcreateElement\s*\(\s*(['"`])script\1\s*\)/gi;

const PARAULES_EXPRESSIO = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else',
  'yield', 'await', 'export', 'default', 'extends', 'import', 'from',
]);
/**
 * Paraules que també poden ser identificadors (`const of = 0`, `from`, `yield`
 * i `await` fora de generadors o funcions asíncrones): després d'elles un «<»
 * no obri JSX (Onada R26, ronda 3) i una regex és una lectura ambigua.
 */
const PARAULES_CONTEXTUALS = new Set(['of', 'from', 'yield', 'await']);
/** Paraules el «(…)» de les quals pot anar seguit d'una regex: `if (x) /re/.test(y)`. */
const PARAULES_CONTROL = new Set(['if', 'while', 'for', 'with']);
/** Extensions on el lexer entén JSX (text entre etiquetes). */
const EXTENSIONS_JSX = new Set(['.jsx', '.tsx']);
/**
 * Puntuació després de la qual comença una expressió (una «/» obri una regex).
 * Ronda 4: el spread «...» sempre va seguit d'una expressió o d'un patró, mai
 * d'una divisió (`[.../'/]` és una regex; la base el llegia com a divisió).
 */
const PUNTS_REGEX = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^', '...']);

/* ═══════════════════════ Lexer lineal (R25.2-P01/P02) ═══════════════════════ */

/**
 * Acumula trams a esborrar (substituïts per espais, salts conservats). Lineal.
 * Si rep `trams`, hi anota cada tram que el lexer no considera codi
 * (`comentari`, `literal` o `text-jsx`) perquè la xarxa de seguretat dels
 * embornals puga decidir si eixa lectura és versemblant.
 */
function creaBuidador(src, trams = null) {
  const trossos = [];
  let ultim = 0;
  return {
    buida(ini, fi) {
      const a = Math.max(ini, ultim);
      if (fi <= a) return;
      if (a > ultim) trossos.push(src.slice(ultim, a));
      trossos.push(src.slice(a, fi).replace(/[^\n]/g, ' '));
      ultim = fi;
    },
    anota(tipus, ini, fi, extra = {}) {
      if (trams && fi > ini) trams.push({ tipus, ini, fi, ...extra });
    },
    tanca() {
      if (ultim < src.length) trossos.push(src.slice(ultim));
      return trossos.join('');
    },
  };
}

function esCarIdentificador(c) {
  if (!c) return false;
  const k = c.charCodeAt(0);
  return (k >= 48 && k <= 57) || (k >= 65 && k <= 90) || (k >= 97 && k <= 122) || k === 95 || k === 36 || k > 127;
}

/**
 * La paraula `src[ini, fi)` és la part entera d'un número decimal (`1`, `1_000`,
 * `08`), de manera que el «.» que la seguix enganxat és el seu punt decimal i no
 * un accés a propietat. No ho és la part fraccionària (`1.5.x`, `.5.x`) ni un
 * hexadecimal, un BigInt o un exponent (`0x1F.x`, `1n.x`, `1e5.x`).
 */
function esPartEnteraDecimal(src, ini, fi) {
  if (src[ini - 1] === '.' && src[ini - 2] !== '.') return false;
  for (let k = ini; k < fi; k += 1) {
    const c = src.charCodeAt(k);
    if (!((c >= 48 && c <= 57) || (c === 95 && k > ini))) return false;
  }
  return true;
}

/** Primer caràcter d'un nom d'etiqueta JSX (`<p`, `<Foo`, `<_x`, `<$y`) o d'un fragment (`<>`). */
const esIniciEtiquetaJsx = (c) => c === '>' || (esCarIdentificador(c) && !(c >= '0' && c <= '9'));

/**
 * HTML: comentaris `<!-- -->` fora de les etiquetes. Dins d'una etiqueta, els
 * valors d'atribut entre cometes són opacs (un `title="<!--"` no obri cap
 * comentari, com fa el navegador) i el contingut de `<script>`/`<style>` és
 * text cru. Una cometa sense tancar allarga l'etiqueta fins al final: no
 * s'esborra res més (tanca en fals).
 */
// `\b` com la base: `<script-x>` també es tracta com a text cru (més conservador).
const RE_ELEMENT_TEXT_CRU = /^<(script|style|textarea|title|xmp|iframe|noembed|noframes|noscript)\b/i;

function netejaHtml(src, trams = null) {
  const b = creaBuidador(src, trams);
  const n = src.length;
  let i = 0;
  while (i < n) {
    const k = src.indexOf('<', i);
    if (k === -1) break;
    if (src.startsWith('<!--', k)) {
      const fi = src.indexOf('-->', k + 4);
      const fiReal = fi === -1 ? n : fi + 3;
      b.buida(k, fiReal);
      b.anota('comentari', k, fiReal, { obert: fi === -1, previ: src[k - 1] || '' });
      i = fiReal;
      continue;
    }
    if (!/^<\/?[A-Za-z]/.test(src.slice(k, k + 3))) { i = k + 1; continue; }
    let j = k + 1;
    while (j < n && src[j] !== '>') {
      if (src[j] !== '=') { j += 1; continue; }
      j += 1;
      while (j < n && (src[j] === ' ' || src[j] === '\t' || src[j] === '\n' || src[j] === '\r' || src[j] === '\f')) j += 1;
      if (src[j] === '"' || src[j] === "'") {
        const fq = src.indexOf(src[j], j + 1);
        j = fq === -1 ? n : fq + 1;
      }
    }
    const fiEtq = Math.min(n, j + 1);
    const mCru = src[k + 1] === '/' ? null : RE_ELEMENT_TEXT_CRU.exec(src.slice(k, k + 12));
    if (mCru) {
      // Contingut d'un element de text cru o RCDATA (script, style, textarea,
      // title, xmp, iframe, noembed, noframes, noscript): cap «<!--» hi obri un
      // comentari, com al navegador (ronda 3: `<textarea><!--</textarea>`).
      const reTanca = new RegExp(`</${mCru[1]}\\s*>`, 'gi');
      reTanca.lastIndex = fiEtq;
      const t = reTanca.exec(src);
      i = t ? t.index + t[0].length : n;
    } else {
      i = fiEtq;
    }
  }
  return b.tanca();
}

function netejaCss(src, trams = null) {
  const b = creaBuidador(src, trams);
  const n = src.length;
  let i = 0;
  while (i < n) {
    const ch = src[i];
    if (ch === '/' && src[i + 1] === '*') {
      const fi = src.indexOf('*/', i + 2);
      const fiReal = fi === -1 ? n : fi + 2;
      b.buida(i, fiReal);
      b.anota('comentari', i, fiReal, { obert: fi === -1, previ: src[i - 1] || '' });
      i = fiReal;
      continue;
    }
    if (ch === '"' || ch === "'") {
      i += 1;
      while (i < n && src[i] !== ch && src[i] !== '\n') i += src[i] === '\\' ? 2 : 1;
      i += 1;
      continue;
    }
    i += 1;
  }
  return b.tanca();
}

/**
 * JS/JSX/TS: cadenes d'una línia, plantilles amb `${}` niuats, literals regex
 * (heurística del token previ) i apòstrofs de text JSX (`L'home`, `d'aigua`:
 * una cometa enganxada a un identificador que no és paraula clau no obri cap
 * cadena, perquè en JS vàlid no ho pot fer).
 *
 * Amb `jsx` (`.jsx`/`.tsx`), un `<` en posició d'expressió seguit d'un nom
 * obri un element JSX: els atributs entre cometes són literals, `{…}` torna al
 * codi i el contingut entre etiquetes és text JSX fins a `<` o `{` (Onada R26,
 * ronda 2: una URL `https://…` o un `src/*.js` de text ja no obrin cap
 * comentari fals). Un marc que no es tanca abans del final queda anotat com a
 * tram `desincronia`.
 */
function netejaJs(src, buidaCadenes = false, { jsx = false, trams = null } = {}) {
  const b = creaBuidador(src, trams);
  // Ronda 3: fins a `ambiguFins` (final de línia) la lectura del lexer depén
  // d'una decisió ambigua (regex o divisió); els trams que hi comencen no són
  // versemblants per a la xarxa de seguretat.
  let ambiguFins = -1;
  let proxSalt = -1;
  const marcaAmbigu = (desDe) => {
    if (proxSalt < desDe) {
      proxSalt = src.indexOf('\n', desDe);
      if (proxSalt === -1) proxSalt = src.length;
    }
    ambiguFins = Math.max(ambiguFins, proxSalt);
  };
  const anota = (tipus, ini, fi, extra = {}) => b.anota(tipus, ini, fi, ini < ambiguFins ? { ...extra, ambigu: true } : extra);
  const buidaLiteral = (ini, fi, extra = {}) => {
    anota('literal', ini, fi, extra);
    if (buidaCadenes) b.buida(ini, fi);
  };
  const n = src.length;
  // Marcs: { t: 'plantilla' | 'expr', claus } (codi dins de `${…}` o de `{…}` JSX)
  //        { t: 'jsx', nivell, mode: 'etiqueta' | 'fills' | 'tancament' }.
  const pila = [];
  // Per cada «(» obert: si el precedix if/while/for/with.
  const parens = [];
  let i = 0;
  let ultim = { tipus: 'inici', valor: '' };
  let iniciParaula = -1;

  const tancaParaula = (fi) => {
    if (iniciParaula >= 0) {
      // Després de «.» o «#» una paraula és un nom de propietat, mai una paraula
      // clau (`obj.default <b>…`, `x.in / 2`): ni obri JSX ni permet una regex.
      // El punt decimal («1.») i el spread («...») no arriben ací com a «.».
      const propietat = ultim.tipus === 'punt' && (ultim.valor === '.' || ultim.valor === '#');
      ultim = { tipus: 'paraula', valor: !propietat && fi - iniciParaula <= 12 ? src.slice(iniciParaula, fi) : '' };
      iniciParaula = -1;
    }
  };
  const regexPermesa = () => (ultim.tipus === 'inici'
    || (ultim.tipus === 'punt' && PUNTS_REGEX.has(ultim.valor))
    || (ultim.tipus === 'paraula' && PARAULES_EXPRESSIO.has(ultim.valor)));

  const consumixPlantilla = (j) => {
    // j apunta just després de «`» o del «}» que torna a la plantilla.
    while (j < n) {
      const c = src[j];
      if (c === '\\') { j += 2; continue; }
      if (c === '`') return { contingut: j, fi: j + 1, expressio: false };
      if (c === '$' && src[j + 1] === '{') return { contingut: j, fi: j + 2, expressio: true };
      j += 1;
    }
    return { contingut: n, fi: n, expressio: false };
  };
  const entraPlantilla = (desDe) => {
    const r = consumixPlantilla(desDe);
    buidaLiteral(desDe, Math.min(r.contingut, n), { obert: r.contingut >= n });
    i = r.fi;
    if (r.expressio) {
      pila.push({ t: 'plantilla', claus: 0, ini: desDe - 1 });
      ultim = { tipus: 'punt', valor: '{' };
    } else {
      ultim = { tipus: 'literal', valor: '' };
    }
  };
  const comentariLinia = (ini, desDe) => {
    const fi = src.indexOf('\n', desDe);
    const fiReal = fi === -1 ? n : fi;
    b.buida(ini, fiReal);
    anota('comentari', ini, fiReal, { linia: true, obert: false, previ: src[ini - 1] || '' });
    return fiReal;
  };
  const comentariBloc = (ini) => {
    const fi = src.indexOf('*/', ini + 2);
    const fiReal = fi === -1 ? n : fi + 2;
    b.buida(ini, fiReal);
    anota('comentari', ini, fiReal, { linia: false, obert: fi === -1, previ: src[ini - 1] || '' });
    return fiReal;
  };
  const tancaElementJsx = (marc) => {
    marc.nivell -= 1;
    if (marc.nivell <= 0) {
      pila.pop();
      ultim = { tipus: 'literal', valor: '' };
    } else {
      marc.mode = 'fills';
    }
  };
  /** Un pas dins d'un element JSX. */
  const passJsx = (marc) => {
    const ch = src[i];
    if (marc.mode === 'fills') {
      let j = i;
      while (j < n && src[j] !== '<' && src[j] !== '{') j += 1;
      if (j > i) {
        anota('text-jsx', i, j);
        if (buidaCadenes) b.buida(i, j);
        i = j;
        return;
      }
      if (ch === '{') {
        pila.push({ t: 'expr', claus: 0, ini: i });
        ultim = { tipus: 'punt', valor: '{' };
        i += 1;
        return;
      }
      if (src[i + 1] === '/') { marc.mode = 'tancament'; i += 2; return; }
      if (esIniciEtiquetaJsx(src[i + 1])) { marc.mode = 'etiqueta'; i += 1; return; }
      // «<» solt en text: JSX invàlid; es tracta com a text.
      anota('text-jsx', i, i + 1);
      if (buidaCadenes) b.buida(i, i + 1);
      i += 1;
      return;
    }
    if (marc.mode === 'tancament') {
      const fi = src.indexOf('>', i);
      i = fi === -1 ? n : fi + 1;
      tancaElementJsx(marc);
      return;
    }
    // mode 'etiqueta': nom, atributs, `{…}`, `/>` o `>`.
    if (ch === '"' || ch === "'") {
      const fq = src.indexOf(ch, i + 1);
      const fi = fq === -1 ? n : fq;
      buidaLiteral(i + 1, fi, { obert: fq === -1 });
      i = fq === -1 ? n : fq + 1;
      return;
    }
    if (ch === '{') {
      pila.push({ t: 'expr', claus: 0, ini: i });
      ultim = { tipus: 'punt', valor: '{' };
      i += 1;
      return;
    }
    if (ch === '/' && src[i + 1] === '>') {
      i += 2;
      marc.nivell += 1;
      tancaElementJsx(marc);
      return;
    }
    if (ch === '/' && src[i + 1] === '/') { i = comentariLinia(i, i + 2); return; }
    if (ch === '/' && src[i + 1] === '*') { i = comentariBloc(i); return; }
    if (ch === '>') {
      marc.nivell += 1;
      marc.mode = 'fills';
      i += 1;
      return;
    }
    i += 1;
  };
  /**
   * Posicions on un `<` és una comparació encara que el token previ siga
   * puntuació: després d'un postfix (`i++ < n`), d'un `}` que tanca una
   * expressió (`x = {} <b>…`, JS vàlid on el que seguix s'executa) o d'un altre
   * `<` (`x <<b>…`). Allí mai no s'obri JSX.
   */
  const comparacioSegura = (pos) => {
    let p = pos - 1;
    while (p >= 0 && (src[p] === ' ' || src[p] === '\t' || src[p] === '\n' || src[p] === '\r')) p -= 1;
    if (p < 0) return false;
    if (src[p] === '}' || src[p] === '<') return true;
    return p >= 1 && (src[p] === '+' || src[p] === '-') && src[p - 1] === src[p];
  };

  while (i < n) {
    // Sense `pila[-1]`: amb la pila buida, V8 ho resol com una cerca de
    // propietat lenta a cada caràcter (ronda 3: el lexer anava 5 vegades més lent que la base).
    const marc = pila.length > 0 ? pila[pila.length - 1] : undefined;
    if (marc && marc.t === 'jsx') {
      tancaParaula(i);
      passJsx(marc);
      continue;
    }
    const ch = src[i];

    if (esCarIdentificador(ch)) {
      if (iniciParaula < 0) iniciParaula = i;
      i += 1;
      continue;
    }
    const iniciEnganxada = iniciParaula;
    tancaParaula(i);

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') { i += 1; continue; }

    if (ch === '/' && src[i + 1] === '/') {
      i = comentariLinia(i, i + 2);
      continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      i = comentariBloc(i);
      continue;
    }

    if (ch === "'" || ch === '"') {
      const enganxada = iniciEnganxada >= 0
        && (i - iniciEnganxada > 12 || !PARAULES_EXPRESSIO.has(src.slice(iniciEnganxada, i)));
      if (enganxada) {
        // Apòstrof de text (JSX) o sintaxi invàlida: mai obri cadena.
        ultim = { tipus: 'punt', valor: ch };
        i += 1;
        continue;
      }
      let j = i + 1;
      while (j < n && src[j] !== ch && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      const tancada = j < n && src[j] === ch;
      buidaLiteral(i + 1, Math.min(j, n), { obert: !tancada });
      i = tancada ? j + 1 : j;
      ultim = { tipus: 'literal', valor: '' };
      continue;
    }

    if (ch === '`') {
      entraPlantilla(i + 1);
      continue;
    }

    if (marc && (ch === '{' || ch === '}')) {
      if (ch === '{') {
        marc.claus += 1;
      } else if (marc.claus === 0) {
        pila.pop();
        if (marc.t === 'plantilla') {
          entraPlantilla(i + 1);
          continue;
        }
        // Fi de `{…}` JSX: es torna a l'element (atributs o fills).
        i += 1;
        continue;
      } else {
        marc.claus -= 1;
      }
      ultim = { tipus: 'punt', valor: ch };
      i += 1;
      continue;
    }

    const despresContextual = ultim.tipus === 'paraula' && PARAULES_CONTEXTUALS.has(ultim.valor);
    if (jsx && ch === '<' && regexPermesa() && !despresContextual && esIniciEtiquetaJsx(src[i + 1]) && !comparacioSegura(i)) {
      pila.push({ t: 'jsx', nivell: 0, mode: 'etiqueta', ini: i });
      i += 1;
      continue;
    }

    if (ch === '/' && regexPermesa()) {
      const tancaJsx = ultim.tipus === 'punt' && ultim.valor === '<';
      const autotancament = src[i + 1] === '>' && !(ultim.tipus === 'punt' && ['(', ',', '=', ':'].includes(ultim.valor));
      if (!tancaJsx && !autotancament) {
        let j = i + 1;
        let classe = false;
        let ok = false;
        while (j < n && j - i <= MAX_LITERAL_REGEX) {
          const c = src[j];
          if (c === '\n') break;
          if (c === '\\') { j += 2; continue; }
          if (classe) { if (c === ']') classe = false; } else if (c === '[') classe = true; else if (c === '/') { ok = true; break; }
          j += 1;
        }
        if (ok) {
          // Després de «}» o d'una paraula contextual, la mateixa «/» pot ser una
          // divisió (`x = {} / fetch(…) / 1`): lectura ambigua.
          if ((ultim.tipus === 'punt' && ultim.valor === '}') || despresContextual) marcaAmbigu(i);
          buidaLiteral(i + 1, j);
          j += 1;
          while (j < n && /[a-z]/i.test(src[j])) j += 1;
          i = j;
          ultim = { tipus: 'literal', valor: '' };
          continue;
        }
      }
    }

    // Ronda 4: només el «.» d'un accés a propietat fa de la paraula següent un
    // nom de propietat (tancaParaula). El punt decimal d'un enter («1. in /re/»)
    // tanca un número i el tercer punt d'un spread («[...typeof /re/]») obri una
    // expressió: després de tots dos, una paraula clau continua sent-ho.
    if (ch === '.') {
      if (iniciEnganxada >= 0 && esPartEnteraDecimal(src, iniciEnganxada, i)) {
        ultim = { tipus: 'paraula', valor: '' };
        i += 1;
        continue;
      }
      if (src[i - 1] === '.' && src[i - 2] === '.') {
        ultim = { tipus: 'punt', valor: '...' };
        i += 1;
        continue;
      }
    }

    // Una «/» llegida com a divisió després del «)» d'un if/while/for/with pot
    // ser una regex (`if (x) /'/.test(y); fetch(…)`): lectura ambigua.
    if (ch === '/' && ultim.tipus === 'punt' && ultim.valor === ')' && ultim.control) marcaAmbigu(i);
    if (ch === '(') {
      parens.push(ultim.tipus === 'paraula' && PARAULES_CONTROL.has(ultim.valor));
    } else if (ch === ')' && parens.pop()) {
      ultim = { tipus: 'punt', valor: ')', control: true };
      i += 1;
      continue;
    }
    ultim = { tipus: 'punt', valor: ch };
    i += 1;
  }
  // Un JSX o una plantilla sense tancar al final: la lectura del lexer des
  // d'eixe punt no és fiable (el codi real no compilaria).
  if (pila.length) b.anota('desincronia', pila[0].ini, n);
  return b.tanca();
}

/**
 * PHP: el fitxer comença en mode HTML fins a `<?php`/`<?=`; `?>` torna a HTML
 * (també dins d'un comentari de línia, com fa l'intèrpret); heredoc i nowdoc
 * es salten sencers. L'HTML incrustat es conserva intacte: el PHP que hi
 * haja dins d'un `<!-- -->` també s'executa.
 */
function netejaPhp(src, buidaCadenes = false, trams = null) {
  const b = creaBuidador(src, trams);
  const n = src.length;
  let i = 0;
  let enCodi = false;
  while (i < n) {
    if (!enCodi) {
      const k = src.indexOf('<?', i);
      if (k === -1) break;
      if (/^<\?xml\b/i.test(src.slice(k, k + 6))) { i = k + 2; continue; }
      i = k + (/^<\?php\b/i.test(src.slice(k, k + 6)) ? 5 : (src[k + 2] === '=' ? 3 : 2));
      enCodi = true;
      continue;
    }
    const ch = src[i];
    if (ch === '?' && src[i + 1] === '>') { enCodi = false; i += 2; continue; }
    if ((ch === '/' && src[i + 1] === '/') || (ch === '#' && src[i + 1] !== '[')) {
      let j = i + (ch === '#' ? 1 : 2);
      while (j < n && src[j] !== '\n' && !(src[j] === '?' && src[j + 1] === '>')) j += 1;
      b.buida(i, j);
      b.anota('comentari', i, j, { linia: true, obert: false, previ: src[i - 1] || '' });
      i = j;
      continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      const fi = src.indexOf('*/', i + 2);
      const fiReal = fi === -1 ? n : fi + 2;
      b.buida(i, fiReal);
      b.anota('comentari', i, fiReal, { linia: false, obert: fi === -1, previ: src[i - 1] || '' });
      i = fiReal;
      continue;
    }
    if (ch === "'" || ch === '"') {
      let j = i + 1;
      while (j < n && src[j] !== ch) j += src[j] === '\\' ? 2 : 1;
      b.anota('literal', i + 1, Math.min(j, n), { obert: j >= n });
      if (buidaCadenes) b.buida(i + 1, Math.min(j, n));
      i = j + 1;
      continue;
    }
    if (ch === '<' && src.startsWith('<<<', i)) {
      const m = /^<<<[ \t]*(["']?)([A-Za-z_][A-Za-z0-9_]*)\1\r?\n/.exec(src.slice(i, i + 80));
      if (m) {
        const reFi = new RegExp(`^[ \\t]*${m[2]}\\b`, 'gm');
        reFi.lastIndex = i + m[0].length;
        const f = reFi.exec(src);
        b.anota('literal', i + m[0].length, f ? f.index : n, { obert: !f });
        if (buidaCadenes) b.buida(i + m[0].length, f ? f.index : n);
        i = f ? f.index + f[0].length : n;
        continue;
      }
    }
    i += 1;
  }
  return b.tanca();
}

/**
 * Substituïx els comentaris per espais (mateixa longitud i mateixos salts de
 * línia) sense tocar cadenes, plantilles, regex ni HTML incrustat. Lineal.
 * Amb `{ buidaCadenes: true }` també buida el contingut dels literals (en JS i
 * PHP) i torna una màscara de codi actiu; els delimitadors es conserven.
 */
export function netejaComentarisLineal(text, extensio, { buidaCadenes = false, trams = null } = {}) {
  const src = String(text ?? '');
  if (src.length === 0) return '';
  const ext = String(extensio || '').toLowerCase();
  if (ext === '.html' || ext === '.htm') return netejaHtml(src, trams);
  if (ext === '.php') return netejaPhp(src, buidaCadenes, trams);
  if (ext === '.css') return netejaCss(src, trams);
  return netejaJs(src, buidaCadenes, { jsx: EXTENSIONS_JSX.has(ext), trams });
}

/* ═══════════════════════ Utilitats lineals ═══════════════════════ */

function construeixIndexSaltsLinia(text) {
  const salts = [];
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) === 10) salts.push(i);
  }
  return salts;
}

function numeroLiniaAmbIndex(salts, offset) {
  if (offset <= 0 || salts.length === 0) return 1;
  let esq = 0;
  let dre = salts.length - 1;
  let trobats = 0;
  while (esq <= dre) {
    const mig = (esq + dre) >> 1;
    if (salts[mig] < offset) {
      trobats = mig + 1;
      esq = mig + 1;
    } else {
      dre = mig - 1;
    }
  }
  return trobats + 1;
}

/**
 * Arguments d'una crida amb parèntesis balancejats (cadenes respectades).
 * Torna també on acaba, perquè qui recorre crides continue des d'ací i el
 * conjunt siga lineal. Una crida oberta fins al final es talla a `max`.
 */
function extreuCridaBalancejada(text, idxParen, max = Infinity) {
  const n = text.length;
  if (idxParen < 0 || idxParen >= n || text[idxParen] !== '(') return { text: '', fi: idxParen + 1, tancada: false };
  let profunditat = 0;
  let cometa = null;
  const limit = Math.min(n, idxParen + max);
  for (let i = idxParen; i < limit; i += 1) {
    const ch = text[i];
    if (cometa !== null) {
      if (ch === '\\') { i += 1; continue; }
      if (ch === cometa) cometa = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { cometa = ch; continue; }
    if (ch === '(') profunditat += 1;
    else if (ch === ')') {
      profunditat -= 1;
      if (profunditat === 0) return { text: text.slice(idxParen, i + 1), fi: i + 1, tancada: true };
    }
  }
  return { text: text.slice(idxParen, limit), fi: limit, tancada: false };
}

/* ═══════════════════════ Normalització d'URL (Onada R26, ronda 2) ═══════════════════════ */

/**
 * Base fictícia per a resoldre destins relatius. El TLD `.invalid` no resol
 * mai (RFC 6761): un destí que hi apunte explícitament no pot exfiltrar res.
 */
const BASES_RESOLUCIO = Object.freeze(['https://arrel-relativa.invalid/r/', 'http://arrel-relativa.invalid/r/']);
const HOST_BASE = 'arrel-relativa.invalid';

const ESCAPAMENTS_JS = Object.freeze({ n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v' });
const desdeCodi = (cp) => (Number.isSafeInteger(cp) && cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : '\ufffd');

/** Valor en temps d'execució d'un literal JS (contingut entre cometes, sense els delimitadors). */
export function descodificaEscapamentsJs(cos) {
  return String(cos).replace(
    /\\(?:u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|([0-7]{1,3})|(\r\n|[\s\S]))/g,
    (_m, cp, u4, x2, oct, c) => {
      if (cp) return desdeCodi(parseInt(cp, 16));
      if (u4) return String.fromCharCode(parseInt(u4, 16));
      if (x2) return String.fromCharCode(parseInt(x2, 16));
      if (oct) return oct === '0' ? '\0' : String.fromCharCode(parseInt(oct, 8));
      if (c === '\n' || c === '\r\n' || c === '\r' || c === '\u2028' || c === '\u2029') return '';
      return ESCAPAMENTS_JS[c] ?? c;
    },
  );
}

const ENTITATS_HTML = Object.freeze({
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', sol: '/', bsol: '\\', colon: ':',
  period: '.', commat: '@', num: '#', quest: '?', equals: '=', percnt: '%', lpar: '(', rpar: ')',
  comma: ',', excl: '!', dollar: '$', plus: '+', lowbar: '_', hyphen: '-', dash: '-', semi: ';', Tab: '\t', NewLine: '\n',
});
const ENTITATS_SENSE_PUNT_I_COMA = new Set(['amp', 'lt', 'gt', 'quot', 'nbsp']);

/** Valor d'un atribut HTML o JSX entre cometes: referències numèriques i les entitats rellevants per a una URL. */
export function descodificaEntitatsHtml(valor) {
  // Els zeros inicials no tenen límit (`&#0000000047;` és «/»); fora de rang dona U+FFFD, com el navegador.
  return String(valor).replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([A-Za-z][A-Za-z0-9]{1,31}))(;?)/g, (m, dec, hex, nom, puntIComa) => {
    if (dec) return desdeCodi(parseInt(dec, 10));
    if (hex) return desdeCodi(parseInt(hex, 16));
    if (!Object.hasOwn(ENTITATS_HTML, nom)) return m;
    if (!puntIComa && !ENTITATS_SENSE_PUNT_I_COMA.has(nom)) return m;
    return ENTITATS_HTML[nom];
  });
}

/**
 * Classifica un destí ja descodificat amb el parser WHATWG (el mateix que el
 * navegador): lleva tabuladors i salts, els C0 dels extrems, i tracta `\` com
 * `/` en els esquemes especials. `relatiu` = mateix origen que la pàgina.
 */
function classificaContraBase(valor, base) {
  let url;
  try { url = new URL(String(valor), base); } catch { return { tipus: 'invalid' }; }
  if (url.protocol === 'data:' || url.protocol === 'blob:') return { tipus: 'local' };
  if (url.protocol === 'about:') return { tipus: 'about', url };
  if (!/^(?:https?|wss?):$/.test(url.protocol)) return { tipus: 'esquema', protocol: url.protocol };
  if (url.hostname === HOST_BASE) return { tipus: 'relatiu' };
  return { tipus: 'extern', url, origen: url.origin };
}

/**
 * Es resol contra una pàgina https i una http (un amfitrió WordPress pot
 * servir-se en http: allí `https:evil.invalid` ja és un altre origen).
 * Guanya la lectura menys favorable.
 */
export function classificaUrlDesti(valor) {
  const lectures = BASES_RESOLUCIO.map((base) => classificaContraBase(valor, base));
  return lectures.find((c) => c.tipus === 'extern') || lectures.find((c) => c.tipus !== 'relatiu') || lectures[0];
}

/** Un literal d'atribut que en realitat és una plantilla (JS `${}`, PHP `<?`, Mustache/Twig `{{`/`{%`): no és un destí relatiu. */
const RE_PLANTILLA_EN_LITERAL = /\$\{|<\?|\{\{|\{%/;

/**
 * Ronda 4: el prefix fix d'un literal amb plantilla (el text fins al primer
 * marcador) es classifica abans de declarar-lo «plantilla». Torna `null` si no
 * hi ha cap marcador.
 * - `extern`: el prefix ja porta una autoritat (`https://cdn…/x.js?ver=<?php …?>`,
 *   `//evil/${v}/x.js`, `https://${h}/x.js`); cap plantilla no el torna local.
 *   Es llig amb un caràcter de mostra al lloc del marcador i, com la base, tot
 *   prefix «https://» o «//» compta.
 * - `url`: l'URL del prefix quan l'amfitrió ja és complet (seguit de «/», «?»,
 *   «#»…): la plantilla ja no el pot allargar ni posar-li un «@» davant.
 * - `relatiuFix`: el prefix ja és un camí del mateix origen que cap continuació
 *   no pot tornar extern (`/embed/<?php …?>`): ja ha eixit de l'estat d'esquema
 *   (`java` + `script:` sí que podria) i ni «//» ni «\\» hi obrin una autoritat
 *   (`/` + `/evil` sí que ho faria).
 */
function llegeixPrefixPlantilla(valor) {
  const m = RE_PLANTILLA_EN_LITERAL.exec(valor);
  if (!m) return null;
  const prefix = valor.slice(0, m.index);
  const sol = classificaUrlDesti(prefix);
  const ambMostra = classificaUrlDesti(`${prefix}a`);
  const net = prefix.replace(/^[\x00-\x20]+/, '').replace(/[\t\n\r]/g, '');
  const extern = ambMostra.tipus === 'extern' || sol.tipus === 'extern' || /^(?:https?:)?\/\//i.test(net);
  const complet = sol.tipus === 'extern' && ambMostra.tipus === 'extern'
    && sol.url.protocol === ambMostra.url.protocol && sol.url.host === ambMostra.url.host;
  return {
    prefix,
    extern,
    url: complet ? sol.url : null,
    origen: complet ? sol.origen : null,
    // Només el consulta avaluaIframe: es calcula quan cal (tres lectures més).
    get relatiuFix() {
      // Integració R26 (verificació de la ronda 4) · Un prefix que acaba en una referència de caràcter
      // incompleta («&», «&#», «&#x», «j&»…) no és fix: el navegador la descodifica junt amb l'eixida de
      // la plantilla («&» + «#47;/evil» és «//evil», «j&» + «#97;vascript:» és «javascript:»).
      return !extern && !/&[#A-Za-z0-9]*$/.test(prefix) && !/^(?:[a-z][a-z0-9+.-]*)?$/i.test(net)
        && ['a', '//a', '\\\\a'].every((mostra) => classificaUrlDesti(`${prefix}${mostra}`).tipus === 'relatiu');
    },
  };
}

/** Atribut literal → valor descodificat (entitats per a cometes HTML/JSX, escapaments per a `{'…'}`). */
const valorAtribut = (attr) => (attr.codificacio === 'js' ? descodificaEscapamentsJs(attr.literal) : descodificaEntitatsHtml(attr.literal));

/* ═══════════════════════ Recorregut d'etiquetes ═══════════════════════ */

const esBlancHtml = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f';

/**
 * Final d'una expressió JS `{…}` que comença en `ini` (la «{»): claus
 * equilibrades, cadenes, plantilles amb `${}` niuats i comentaris, sense
 * passar de `fins`. Torna l'índex de la «}» de tancament o -1.
 */
function fiExpressioJs(text, ini, fins) {
  // Marcs: un nombre (claus obertes dins d'un tram de codi) o -1 (plantilla).
  const marcs = [0];
  let j = ini + 1;
  while (j < fins) {
    const c = text[j];
    if (marcs[marcs.length - 1] === -1) {
      if (c === '\\') j += 2;
      else if (c === '`') { marcs.pop(); j += 1; } else if (c === '$' && text[j + 1] === '{') { marcs.push(0); j += 2; } else j += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      j += 1;
      while (j < fins && text[j] !== c && text[j] !== '\n') j += text[j] === '\\' ? 2 : 1;
      j += 1;
      continue;
    }
    if (c === '`') { marcs.push(-1); j += 1; continue; }
    if (c === '/' && text[j + 1] === '/') {
      while (j < fins && text[j] !== '\n') j += 1;
      continue;
    }
    if (c === '/' && text[j + 1] === '*') {
      j += 2;
      while (j < fins && !(text[j] === '*' && text[j + 1] === '/')) j += 1;
      j += 2;
      continue;
    }
    if (c === '{') {
      marcs[marcs.length - 1] += 1;
    } else if (c === '}') {
      if (marcs[marcs.length - 1] > 0) {
        marcs[marcs.length - 1] -= 1;
      } else {
        marcs.pop();
        if (marcs.length === 0) return j;
      }
    }
    j += 1;
  }
  return -1;
}

/**
 * Llig una etiqueta amb l'autòmat d'atributs del tokenitzador HTML (WHATWG):
 * una cometa només obri un valor just després de «=», un valor sense cometes
 * acaba en un blanc o en «>», i «/» o una cometa de tancament separen
 * atributs (`<script/src=…>`, `a="x"src=…`). Modes: `html`; `php` (cada
 * `<?…?>` és opac, també dins d'un valor, perquè s'executa abans que el
 * navegador llija l'etiqueta) i `jsx` (JS/JSX/TS: `{…}` com a valor o com a
 * propagació és una expressió JS opaca). Torna el final, si és completa i els
 * atributs en ordre (el navegador es queda amb el primer de cada nom). Cost:
 * la longitud de l'etiqueta, acotada a `fins`.
 */
function llegeixEtiqueta(text, ini, mode, fins = Math.min(text.length, ini + MAX_ETIQUETA)) {
  const atributs = [];
  const php = mode === 'php';
  let j = ini + 1;
  const enPhp = () => php && text[j] === '<' && text[j + 1] === '?';
  /** Salta el bloc PHP que comença en `j`; false si no tanca abans del límit. */
  const saltaPhp = () => {
    for (let f = j + 2; f + 1 < fins; f += 1) {
      if (text[f] === '?' && text[f + 1] === '>') { j = f + 2; return true; }
    }
    j = fins;
    return false;
  };
  const fiNom = (c, ambIgual) => esBlancHtml(c) || c === '/' || c === '>' || (ambIgual && c === '=');
  const avancaFins = (ambIgual) => {
    while (j < fins && !fiNom(text[j], ambIgual)) {
      if (enPhp()) { if (!saltaPhp()) return; continue; }
      j += 1;
    }
  };
  avancaFins(false); // nom de l'etiqueta
  while (j < fins) {
    const c = text[j];
    if (esBlancHtml(c) || c === '/') { j += 1; continue; }
    if (c === '>') return { fi: j, completa: true, atributs };
    if (enPhp()) { if (!saltaPhp()) break; continue; }
    if (mode === 'jsx' && c === '{') { // propagació `{...props}`
      const f = fiExpressioJs(text, j, fins);
      if (f === -1) break;
      j = f + 1;
      continue;
    }
    // Nom d'atribut: un «=» o una cometa inicials en formen part (com al navegador).
    const iniNom = j;
    j += 1;
    avancaFins(true);
    const nom = text.slice(iniNom, j).toLowerCase();
    let k = j;
    while (k < fins && esBlancHtml(text[k])) k += 1;
    if (text[k] !== '=') {
      atributs.push({ nom, valor: '', ini: j, cometa: '', tancat: true });
      j = k;
      continue;
    }
    j = k + 1;
    while (j < fins && esBlancHtml(text[j])) j += 1;
    const q = text[j];
    if (q === '"' || q === "'") {
      const iniV = j + 1;
      j = iniV;
      while (j < fins && text[j] !== q) {
        if (enPhp()) { if (!saltaPhp()) break; continue; }
        j += 1;
      }
      atributs.push({ nom, valor: text.slice(iniV, Math.min(j, fins)), ini: iniV, cometa: q, tancat: j < fins });
      if (j >= fins) break;
      j += 1;
      continue;
    }
    if (q === '{' && mode === 'jsx') {
      const f = fiExpressioJs(text, j, fins);
      atributs.push({ nom, valor: text.slice(j, f === -1 ? fins : f + 1), ini: j, cometa: '{', tancat: f !== -1 });
      if (f === -1) break;
      j = f + 1;
      continue;
    }
    // Sense cometes (en HTML i PHP, també un valor que comença per «{»).
    const iniV = j;
    while (j < fins && !esBlancHtml(text[j]) && text[j] !== '>') {
      if (enPhp()) { if (!saltaPhp()) break; continue; }
      j += 1;
    }
    atributs.push({ nom, valor: text.slice(iniV, Math.min(j, fins)), ini: iniV, cometa: '', tancat: true });
  }
  return { fi: fins - 1, completa: false, atributs };
}

/**
 * Valor interpretat d'un atribut llegit dins de `font` (el text o un tram):
 * literal amb la seua codificació (`html` per a cometes HTML/JSX, `js` per a
 * `{'…'}`) o expressió no verificable. Un valor sense cometes que comença per
 * «{» es llig com a expressió acotada a `fins` (en HTML i PHP, el final de
 * l'etiqueta), com ho feia la base.
 */
function interpretaValor(font, a, fins) {
  if (a.cometa === '"' || a.cometa === "'") return { literal: a.valor.trim(), expressio: null, codificacio: 'html' };
  if (a.cometa === '{' || a.valor.startsWith('{')) {
    let cos = a.valor;
    let tancat = a.tancat;
    if (a.cometa !== '{') {
      const f = fiExpressioJs(font, a.ini, fins);
      tancat = f !== -1;
      cos = tancat ? font.slice(a.ini, f + 1) : a.valor;
    }
    const expressio = (tancat ? cos.slice(1, -1) : cos.slice(1)).trim();
    const lit = tancat && /^(["'`])((?:\\[\s\S]|(?!\1)[^\\$])*)\1$/.exec(expressio);
    return lit ? { literal: lit[2].trim(), expressio: null, codificacio: 'js' } : { literal: null, expressio };
  }
  // HTML dins d'una cadena JS o PHP (`"<script src=\"https://…\">"`): el valor
  // que arriba al navegador és el que va entre les cometes escapades.
  const escapat = /^\\(["'])([\s\S]*?)\\\1/.exec(a.valor);
  if (escapat) return { literal: escapat[2].trim(), expressio: null, codificacio: 'js' };
  return { literal: a.valor, expressio: null, codificacio: 'html' };
}

const RES_LECTURA_BASE = new Map();
/** «\snom=» per a cada nom (la lectura de la base, sense els separadors «/» i cometa). */
function reLecturaBase(noms) {
  const clau = noms.join('|');
  if (!RES_LECTURA_BASE.has(clau)) RES_LECTURA_BASE.set(clau, new RegExp(`\\s(?:${clau})\\s*=\\s*`, 'gi'));
  return RES_LECTURA_BASE.get(clau);
}

/**
 * Lectura de la base sobre un tram: cada «\snom=» (no només el primer), amb
 * el valor com el llegia la base. Lineal: després d'un valor la cerca
 * continua al seu final, de manera que cap valor es torna a llegir.
 */
function valorsPerPatro(tram, noms) {
  const re = reLecturaBase(noms);
  const valors = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(tram)) !== null) {
    const i = m.index + m[0].length;
    const q = tram[i];
    let a;
    let seguent;
    if (q === '"' || q === "'") {
      const f = tram.indexOf(q, i + 1);
      a = { valor: tram.slice(i + 1, f === -1 ? tram.length : f), ini: i + 1, cometa: q, tancat: f !== -1 };
      seguent = f === -1 ? tram.length : f + 1;
    } else if (q === '{') {
      const f = fiExpressioJs(tram, i, tram.length);
      a = { valor: tram.slice(i, f === -1 ? tram.length : f + 1), ini: i, cometa: '{', tancat: f !== -1 };
      seguent = f === -1 ? tram.length : f + 1;
    } else {
      let f = i;
      while (f < tram.length && !esBlancHtml(tram[f]) && tram[f] !== '>') f += 1;
      a = { valor: tram.slice(i, f), ini: i, cometa: '', tancat: true };
      seguent = f;
    }
    valors.push(interpretaValor(tram, a, tram.length));
    re.lastIndex = Math.max(seguent, m.index + 1);
  }
  return valors;
}

/**
 * Recorre `<nom …>` sense retrocés amb `llegeixEtiqueta`. Cada etiqueta dona
 * dues lectures dels seus atributs, i les signatures miren la unió (davant del
 * dubte, mai «net»): la de l'autòmat (el primer atribut de cada nom, com el
 * navegador) i la de la base (cada «\snom=» del tram). Una etiqueta que no
 * tanca (cometa o clau sense parella, o més de MAX_ETIQUETA) no es salta: es
 * marca `completa: false`, la lectura de la base mira tot el tram mesurat i el
 * recorregut continua al primer «>» cru, de manera que cap etiqueta posterior
 * queda amagada. Dins d'una zona ja mesurada sense tancar, cada etiqueta acaba
 * al primer «>» cru (cost lineal); si en passa el límit, es mesura de nou.
 */
function* etiquetes(text, nom, mode = 'html') {
  const re = new RegExp(`<${nom}\\b`, 'gi');
  let fiMesurat = -1;
  let proxGt = -1;
  const gtDesDe = (p) => {
    if (proxGt < p) {
      proxGt = text.indexOf('>', p);
      if (proxGt === -1) proxGt = text.length;
    }
    return Math.min(proxGt, text.length - 1);
  };
  let m;
  while ((m = re.exec(text)) !== null) {
    const s = m.index;
    let lectura;
    let completa = true;
    let primera = false;
    let tramBase;
    let seguent;
    const g = s <= fiMesurat ? gtDesDe(s + 1) : -1;
    if (s > fiMesurat || g > fiMesurat) {
      lectura = llegeixEtiqueta(text, s, mode);
      if (lectura.completa) {
        seguent = lectura.fi + 1;
        tramBase = text.slice(s, seguent);
      } else {
        completa = false;
        primera = true;
        fiMesurat = lectura.fi;
        tramBase = text.slice(s, fiMesurat + 1);
        seguent = gtDesDe(s + 1) + 1;
      }
    } else {
      completa = false;
      lectura = llegeixEtiqueta(text, s, mode, g + 1);
      seguent = g + 1;
      tramBase = text.slice(s, seguent);
    }
    const finsLectura = lectura.fi + 1;
    const primer = (nomAtribut) => {
      const a = lectura.atributs.find((x) => x.nom === nomAtribut);
      return a ? interpretaValor(text, a, finsLectura) : null;
    };
    yield {
      index: s,
      etiqueta: text.slice(s, seguent),
      completa,
      primera,
      primer,
      valors: (noms) => [...noms.map(primer).filter(Boolean), ...valorsPerPatro(tramBase, noms)],
    };
    re.lastIndex = Math.max(seguent, s + 1);
  }
}

/* ═══════════════════════ Signatures del navegador ═══════════════════════ */

function avaluaIframe(attr, dominisPermesos) {
  if (!attr) return { permés: true };
  if (attr.expressio !== null) {
    const expressioNeta = attr.expressio.replace(/^`([\s\S]*)`$/, '$1').trim();
    if (EXPRESSIONS_IFRAME_SANEJADES.some((re) => re.test(expressioNeta))) return { permés: true };
    // Una plantilla amb `${}` es mira pel seu prefix literal ja descodificat
    // (`\@` o `\/` canvien l'amfitrió real). Ronda 4: només el prefix fins al
    // primer marcador, i només si l'amfitrió ja hi és complet
    // (`https://${x}@www.youtube-nocookie.com/` no ho és: la base el permetia).
    const prefix = descodificaEscapamentsJs(expressioNeta);
    if (/^(?:https?:)?\/\//i.test(prefix)) {
      const plantilla = llegeixPrefixPlantilla(prefix);
      const c = plantilla ? { tipus: plantilla.url ? 'extern' : 'incomplet', url: plantilla.url } : classificaUrlDesti(prefix);
      if (c.tipus === 'extern' && c.url.protocol === 'https:' && dominisPermesos.has(c.url.hostname.toLowerCase())) return { permés: true };
    }
    return { permés: false, motiu: `Expressió src d'iframe no acreditada a la llista blanca: {${attr.expressio.slice(0, 80)}}` };
  }
  const literal = valorAtribut(attr).trim();
  if (!literal) return { permés: true };
  // Ronda 4: com a avaluaScript, el prefix fix es classifica abans que la
  // plantilla. Un amfitrió complet de la llista blanca o un camí relatiu fix
  // són permesos, com a la base (`https://www.youtube-nocookie.com/embed/<?php
  // echo esc_attr( $id ); ?>`, `/embed/<?php …?>`); `/<?php …?>` no ho és.
  const plantilla = llegeixPrefixPlantilla(literal);
  if (plantilla) {
    if (plantilla.relatiuFix || EXPRESSIONS_IFRAME_SANEJADES.some((re) => re.test(literal))) return { permés: true };
    if (plantilla.url) {
      if (plantilla.url.protocol === 'https:' && dominisPermesos.has(plantilla.url.hostname.toLowerCase())) return { permés: true };
      return { permés: false, motiu: `Domini d'iframe extern fora de la llista blanca (${plantilla.url.protocol}//${plantilla.url.hostname})` };
    }
    return { permés: false, motiu: `Origen d'iframe no verificable (${literal.slice(0, 80)})` };
  }
  const c = classificaUrlDesti(literal);
  if (c.tipus === 'about' || c.tipus === 'relatiu' || (c.tipus === 'local' && /^blob:/i.test(literal))) return { permés: true };
  if (c.tipus === 'local' || (c.tipus === 'esquema' && c.protocol === 'javascript:')) {
    return { permés: false, motiu: `Esquema perillós en <iframe src="${literal.slice(0, 60)}">` };
  }
  if (c.tipus === 'extern') {
    if (c.url.protocol === 'https:' && dominisPermesos.has(c.url.hostname.toLowerCase())) return { permés: true };
    return { permés: false, motiu: `Domini d'iframe extern fora de la llista blanca (${c.url.protocol}//${c.url.hostname})` };
  }
  if (EXPRESSIONS_IFRAME_SANEJADES.some((re) => re.test(literal))) return { permés: true };
  return { permés: false, motiu: c.tipus === 'invalid' ? `URL d'iframe malformada (${literal.slice(0, 80)})` : `Origen d'iframe no verificable (${literal.slice(0, 80)})` };
}

/**
 * EXF-01: el pitjor dels destins d'un `<script>` (extern > dinàmic > no
 * resoluble). `href` i `xlink:href` també compten: un `<script>` dins d'un
 * `<svg>` es carrega per eixos atributs.
 */
function avaluaScript(valors, etiqueta) {
  let pitjor = null;
  const proposa = (rang, motiu, desconegut = null) => {
    if (!pitjor || rang > pitjor.rang) pitjor = { rang, motiu, desconegut };
  };
  for (const v of valors) {
    if (v.expressio !== null) {
      proposa(2, `<script src> amb expressió no verificable: {${v.expressio.slice(0, 80)}}`, 'SCRIPT_SRC_DINAMIC');
      continue;
    }
    const valor = valorAtribut(v);
    // Ronda 4: el prefix fix es classifica abans que la plantilla. Un amfitrió
    // extern ja escrit és infracció (fallada tancada, com la base).
    const plantilla = llegeixPrefixPlantilla(valor);
    if (plantilla?.extern) {
      proposa(3, `Prohibit carregar <script src> des d'un origen extern (${plantilla.origen || plantilla.prefix.slice(0, 60)}, prefix fix d'una plantilla): ${etiqueta.slice(0, 120)}`);
      continue;
    }
    if (plantilla) {
      proposa(2, `<script src> amb una plantilla no verificable: ${valor.slice(0, 80)}`, 'SCRIPT_SRC_DINAMIC');
      continue;
    }
    const c = classificaUrlDesti(valor);
    if (c.tipus === 'extern') proposa(3, `Prohibit carregar <script src> des d'un origen extern (${c.origen}): ${etiqueta.slice(0, 120)}`);
    else if (c.tipus === 'invalid' || c.tipus === 'esquema') proposa(1, `<script src> amb un destí que no es pot resoldre o d'esquema no cobert: ${valor.slice(0, 80)}`, 'SCRIPT_SRC_NO_RESOLUBLE');
  }
  return pitjor;
}

const LLISTA_DOMINIS_FONTS = Object.freeze(['fonts.googleapis.com', 'fonts.gstatic.com', 'use.typekit.net', 'fast.fonts.net']);
/** EXF-02: un href de fonts per text (com la base) o per l'amfitrió real que resol el parser WHATWG (`%2E`, amplada completa…). */
function esHrefFonts(valor) {
  if (RE_FONT_HREF.test(valor)) return true;
  const c = classificaUrlDesti(valor);
  if (c.tipus !== 'extern') return false;
  const host = c.url.hostname.toLowerCase();
  return LLISTA_DOMINIS_FONTS.some((d) => host === d || host.endsWith(`.${d}`));
}

const REGLA_PER_ETIQUETA = Object.freeze({ script: 'TELLADO-EXF-01', link: 'TELLADO-EXF-02', iframe: 'TELLADO-EXF-04' });
const NOMS_DESTI_SCRIPT = Object.freeze(['src', 'href', 'xlink:href']);

/**
 * Totes les signatures cobertes d'un text. Les mateixes regles s'apliquen al
 * text net i al cru; la comparació de trams decidix infracció o desconegut.
 * `mode`: `html`, `php` o `jsx` (vegeu `llegeixEtiqueta`).
 */
function trobaSignatures(text, dominisPermesos, { mode = 'html' } = {}) {
  const troballes = [];
  const afig = (regla, index, longitud, motiu, extra = {}) => troballes.push({ regla, index, longitud, motiu, ...extra });
  const noTancada = (nom, index, etiqueta, primera) => {
    if (primera) afig(REGLA_PER_ETIQUETA[nom], index, etiqueta.length, `<${nom}> sense tancar (cometa o clau sense parella, o més de ${MAX_ETIQUETA} caràcters): el recorregut continua al primer «>» i no certifica l'etiqueta.`, { desconegut: 'ETIQUETA_NO_TANCADA' });
  };

  for (const et of etiquetes(text, 'script', mode)) {
    if (!et.completa) noTancada('script', et.index, et.etiqueta, et.primera);
    const r = avaluaScript(et.valors(NOMS_DESTI_SCRIPT), et.etiqueta);
    if (r) afig('TELLADO-EXF-01', et.index, et.etiqueta.length, r.motiu, r.desconegut ? { desconegut: r.desconegut } : {});
  }

  for (const et of etiquetes(text, 'link', mode)) {
    if (!et.completa) noTancada('link', et.index, et.etiqueta, et.primera);
    if (et.valors(['href']).some((v) => v.literal && esHrefFonts(valorAtribut(v)))) {
      afig('TELLADO-EXF-02', et.index, et.etiqueta.length, `Exfiltració d'IP via CDN tipogràfic extern detectada: ${et.etiqueta.slice(0, 120)}`);
    }
  }
  RE_FONTS_SENSE_LINK.lastIndex = 0;
  for (const m of text.matchAll(RE_FONTS_SENSE_LINK)) {
    afig('TELLADO-EXF-02', m.index, m[0].length, `Exfiltració d'IP via CDN tipogràfic extern detectada: ${m[0].slice(0, 120)}`);
  }

  for (const tracker of PATRONS_TRACKERS) {
    const m = tracker.re.exec(text);
    if (m) afig('TELLADO-EXF-03', m.index, m[0].length, `Detectat rastrejador o píxel de tercers prohibit (${tracker.nom}).`);
  }

  for (const et of etiquetes(text, 'iframe', mode)) {
    if (!et.completa) noTancada('iframe', et.index, et.etiqueta, et.primera);
    for (const v of et.valors(['src'])) {
      const avaluacio = avaluaIframe(v, dominisPermesos);
      if (!avaluacio.permés) {
        afig('TELLADO-EXF-04', et.index, et.etiqueta.length, avaluacio.motiu);
        break;
      }
    }
  }
  return troballes;
}

/**
 * Classifica el primer argument d'un embornal de xarxa a partir del `(`.
 * Només mira el literal inicial (acotat a MAX_ARGUMENT, sense travessar salts
 * de línia en cometes simples o dobles): el cost per crida és el del literal,
 * no el de tota la crida, i el recorregut sencer continua sent lineal.
 */
function classificaDesti(text, idxParen) {
  const n = text.length;
  // Mostra acotada (96 caràcters) que acaba al «)» de la crida, com abans.
  const mostra = () => extreuCridaBalancejada(text, idxParen, 96).text.slice(1).trimStart().slice(0, 80).replace(/\s+/g, ' ');
  const dinamic = () => ({ tipus: 'DESTI_XARXA_DINAMIC', motiu: `Destí construït en temps d'execució: ${mostra()}` });
  let j = idxParen + 1;
  while (j < n && j - idxParen <= 64 && /\s/.test(text[j])) j += 1;
  const q = text[j];
  if (q !== '"' && q !== "'" && q !== '`') return dinamic();
  let k = j + 1;
  let tancat = false;
  while (k < n && k - j <= MAX_ARGUMENT) {
    const c = text[k];
    if (c === '\\') { k += 2; continue; }
    if (c === q) { tancat = true; break; }
    if (q !== '`' && c === '\n') break;
    if (q === '`' && c === '$' && text[k + 1] === '{') return dinamic();
    k += 1;
  }
  if (!tancat) return dinamic();
  let f = k + 1;
  while (f < n && f - k <= 64 && /\s/.test(text[f])) f += 1;
  if (f < n && text[f] !== ',' && text[f] !== ')') return dinamic();
  const valor = descodificaEscapamentsJs(text.slice(j + 1, k));
  const c = classificaUrlDesti(valor);
  if (c.tipus === 'relatiu' || c.tipus === 'local') return null; // mateix origen, data: o blob:, coberts
  if (c.tipus === 'extern') return { tipus: 'DESTI_XARXA_EXTERN', origen: c.origen, motiu: `Destí literal extern no certificat: ${c.origen}` };
  return { tipus: 'DESTI_XARXA_DINAMIC', motiu: c.tipus === 'invalid' ? `Destí literal que no es pot resoldre: ${valor.slice(0, 40)}` : `Esquema no cobert: ${valor.slice(0, 40)}` };
}

/* ═══════════════════════ Favicon i capçaleres ═══════════════════════ */

function lligDimensionsRaster(buf) {
  if (!buf) return [];
  if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return [{ width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }];
  }
  if (buf.length >= 6 && buf.readUInt16LE(0) === 0 && buf.readUInt16LE(2) === 1) {
    const n = buf.readUInt16LE(4);
    const llista = [];
    for (let i = 0; i < n; i += 1) {
      const off = 6 + i * 16;
      if (off + 16 <= buf.length) llista.push({ width: buf[off] === 0 ? 256 : buf[off], height: buf[off + 1] === 0 ? 256 : buf[off + 1] });
    }
    return llista;
  }
  return [];
}

/**
 * VIG-10 (IDEA-266 · guia oficial de Google Search): almenys un
 * `<link rel="icon"|"shortcut icon"|"apple-touch-icon">` declarat a `index.html`
 * que apunte a un raster real de `public/` quadrat i `>= 48x48`. Mira les
 * dimensions del fitxer, no l'atribut `sizes`; no exigix múltiples de 48.
 */
const llegeixDirecte = (arrel) => (rel) => {
  const abs = path.join(arrel, rel);
  return fs.existsSync(abs) && fs.statSync(abs).isFile() ? fs.readFileSync(abs) : null;
};

export function faviconsRasterValids(arrel, { llegeix = llegeixDirecte(arrel) } = {}) {
  const bufHtml = llegeix('index.html');
  if (!bufHtml) return null;
  const html = netejaComentarisLineal(bufHtml.toString('utf8'), '.html');
  const valids = [];
  // Prova positiva: només compta una etiqueta completa llegida com el navegador.
  for (const { completa, primer } of etiquetes(html, 'link')) {
    if (!completa) continue;
    const rel = primer('rel')?.literal?.toLowerCase().replace(/\s+/g, ' ') || '';
    if (!['icon', 'shortcut icon', 'apple-touch-icon', 'apple-touch-icon-precomposed'].includes(rel)) continue;
    const href = primer('href')?.literal || '';
    const mHref = /^\/([^?#]+?\.(?:png|ico))(?:[?#].*)?$/i.exec(href);
    if (!mHref) continue;
    if (mHref[1].split('/').some((t) => t === '..' || t === '.')) continue;
    const dims = lligDimensionsRaster(llegeix(`public/${mHref[1]}`));
    const quadrat = dims.find((d) => d.width === d.height && d.width >= 48);
    if (quadrat) valids.push({ href, rel, width: quadrat.width, height: quadrat.height });
  }
  return valids;
}

function revisaFaviconSeoGoogle(arrel, registra) {
  const valids = faviconsRasterValids(arrel);
  if (valids === null) {
    registra('VIG-10', 'index.html', 1, 'Falta index.html per a verificar el favicon SEO per a Google Search.');
  } else if (valids.length === 0) {
    registra(
      'VIG-10',
      'index.html',
      1,
      'Favicon SEO Google Search incomplet: no es pot dependre només de .svg; cal almenys un recurs raster (.png o .ico) declarat a index.html i existent a public/ amb dimensions quadrades >= 48x48.',
    );
  }
}

function parsejaDirectivesCsp(valorCsp) {
  const directives = Object.create(null);
  for (const part of String(valorCsp || '').split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (tokens.length) directives[tokens[0].toLowerCase()] = tokens.slice(1);
  }
  return directives;
}

function revisaFirebaseHeaders(arrel, registra) {
  const rutaFirebase = path.join(arrel, 'firebase.json');
  if (!fs.existsSync(rutaFirebase)) {
    registra('TELLADO-HDR-00', 'firebase.json', 1, 'Falta firebase.json per a verificar les capçaleres del perímetre web.');
    return;
  }
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(rutaFirebase, 'utf8'));
  } catch (err) {
    registra('TELLADO-HDR-00', 'firebase.json', 1, `firebase.json invàlid: ${err.message}`);
    return;
  }
  const reglesHeaders = Array.isArray(cfg?.hosting?.headers) ? cfg.hosting.headers : [];
  const reglaGlobal = reglesHeaders.find((r) => r?.source === '**' || r?.source === '/**');
  if (!reglaGlobal || !Array.isArray(reglaGlobal.headers)) {
    registra('TELLADO-HDR-00', 'firebase.json', 1, 'Falta el bloc global hosting.headers per a source "**".');
    return;
  }
  const mapa = Object.create(null);
  for (const h of reglaGlobal.headers) {
    if (h && typeof h.key === 'string' && typeof h.value === 'string') mapa[h.key.trim().toLowerCase()] = h.value.trim();
  }

  if ((mapa['x-content-type-options'] || '').toLowerCase() !== 'nosniff') {
    registra('TELLADO-HDR-01', 'firebase.json', 1, 'X-Content-Type-Options ha de ser exactament "nosniff".');
    registra('VIG-09', 'firebase.json', 1, 'Falta capçalera crítica X-Content-Type-Options: nosniff.');
  }
  const referrer = (mapa['referrer-policy'] || '').toLowerCase();
  if (!REFERRER_POLICIES_ESTRICTES.has(referrer)) {
    registra('TELLADO-HDR-02', 'firebase.json', 1, `Referrer-Policy absent o laxa ("${mapa['referrer-policy'] || ''}"); cal strict-origin-when-cross-origin, same-origin, strict-origin o no-referrer.`);
    registra('VIG-09', 'firebase.json', 1, 'Falta Referrer-Policy estricta a firebase.json.');
  }
  const perms = mapa['permissions-policy'] || '';
  if (!perms) {
    registra('TELLADO-HDR-03', 'firebase.json', 1, 'Falta la capçalera Permissions-Policy mínima.');
    registra('VIG-09', 'firebase.json', 1, 'Falta Permissions-Policy a firebase.json.');
  } else {
    if (/\*|(?:camera|microphone|geolocation)\s*=\s*\(\s*\*\s*\)/i.test(perms)) {
      registra('TELLADO-HDR-03', 'firebase.json', 1, 'Permissions-Policy no pot obrir comodins (*).');
    }
    for (const capSensor of ['camera', 'microphone', 'geolocation']) {
      if (!new RegExp(`\\b${capSensor}\\s*=`, 'i').test(perms)) {
        registra('TELLADO-HDR-03', 'firebase.json', 1, `Permissions-Policy ha d'acotar explícitament "${capSensor}".`);
      }
    }
  }
  const mMaxAge = /\bmax-age\s*=\s*(\d+)/i.exec(mapa['strict-transport-security'] || '');
  if (!mMaxAge || Number(mMaxAge[1]) < 31536000) {
    registra('VIG-09', 'firebase.json', 1, 'Falta Strict-Transport-Security amb max-age >= 31536000 al bloc global "**" de firebase.json.');
  }

  const cspCrua = mapa['content-security-policy'] || '';
  if (!cspCrua) {
    registra('TELLADO-HDR-04', 'firebase.json', 1, 'Falta la capçalera Content-Security-Policy a firebase.json.');
    return;
  }
  const directives = parsejaDirectivesCsp(cspCrua);
  const scriptSrc = directives['script-src'] || [];
  if (!scriptSrc.includes("'self'")) registra('TELLADO-HDR-04', 'firebase.json', 1, "CSP script-src ha d'incloure 'self'.");
  for (const prohibit of ["'unsafe-inline'", "'unsafe-eval'", '*', 'https:', 'http:', 'data:']) {
    if (scriptSrc.includes(prohibit)) registra('TELLADO-HDR-04', 'firebase.json', 1, `CSP script-src conté una font prohibida pel perímetre Tellado (${prohibit}).`);
  }
  if (!(directives['object-src'] || []).includes("'none'")) registra('TELLADO-HDR-04', 'firebase.json', 1, "CSP object-src ha de ser 'none'.");
  const baseUri = directives['base-uri'] || [];
  if (!baseUri.includes("'self'") && !baseUri.includes("'none'")) registra('TELLADO-HDR-04', 'firebase.json', 1, "CSP base-uri ha d'estar restringida a 'self' o 'none'.");
  const connectSrc = directives['connect-src'] || [];
  if (!connectSrc.includes("'self'") || !connectSrc.some((t) => t === 'https:' || t.startsWith('https://')) || !connectSrc.some((t) => t === 'wss:' || t.startsWith('wss://'))) {
    registra('TELLADO-HDR-04', 'firebase.json', 1, "CSP connect-src ha de mantindre 'self', https i wss per no trencar Supabase REST/Realtime ni WebAuthn.");
  }
  const frameAncestors = directives['frame-ancestors'] || [];
  if (!frameAncestors.length || frameAncestors.includes('*')) {
    registra('TELLADO-HDR-04', 'firebase.json', 1, "CSP frame-ancestors ha d'existir i no pot permetre el comodí obert (*).");
  }
  const imgSrc = directives['img-src'] || [];
  if (!imgSrc.includes("'self'") || !imgSrc.some((t) => t === 'https:' || t.startsWith('https://'))) {
    registra('TELLADO-HDR-04', 'firebase.json', 1, "CSP img-src ha de permetre 'self' i https per conservar mitjans i OpenGraph.");
  }
}

/* ═══════════════════════ Perímetre WordPress (R25.2-P03) ═══════════════════════ */

const RE_EIXIDA_PHP = String.raw`(?:exit|die)\b\s*(?:\(\s*(?:(?:'[^'\n]{0,200}'|"[^"\n]{0,200}"|\d+)\s*)?\))?`;
const RE_CONSTANT_GUARDA = String.raw`defined\s*\(\s*(?:'(?:ABSPATH|WP_UNINSTALL_PLUGIN)'|"(?:ABSPATH|WP_UNINSTALL_PLUGIN)")\s*\)`;
const RE_GUARDA_PHP = new RegExp(
  String.raw`^\s*<\?php\b\s*`
  + String.raw`(?:declare\s*\(\s*strict_types\s*=\s*1\s*\)\s*;\s*)?`
  + String.raw`(?:namespace\s+[A-Za-z_\\][\w\\]*\s*;\s*)?`
  + String.raw`(?:${RE_CONSTANT_GUARDA}\s*(?:\|\||\bor\b)\s*${RE_EIXIDA_PHP}\s*;`
  + String.raw`|if\s*\(\s*!\s*${RE_CONSTANT_GUARDA}\s*\)\s*(?:\{\s*${RE_EIXIDA_PHP}\s*;\s*\}|${RE_EIXIDA_PHP}\s*;))`,
  'i',
);

/** Màscara PHP de codi actiu (sense comentaris ni contingut de literals), alineada caràcter a caràcter. */
const mascaraPhp = (text) => netejaComentarisLineal(text, '.php', { buidaCadenes: true });

/**
 * Un `.l10n.php` només n'està exempt si és dades pures: `return` d'arrays amb
 * literals escalars, sense crides, variables, constants, interpolació,
 * heredoc ni backticks (que en PHP executen una ordre).
 */
function esDadesL10n(net) {
  if (!/^\s*<\?php\s+return\s+(?:\[|array\s*\()/i.test(net)) return false;
  const codi = mascaraPhp(net).replace(/^\s*<\?php/i, '').replace(/\?>\s*$/, '');
  if (/[$`\\]|<<<|::|->/.test(codi)) return false;
  for (const ident of codi.match(/[A-Za-z_\x80-\uffff][\w\x80-\uffff]*/g) || []) {
    if (!/^(?:return|array|true|false|null)$/i.test(ident)) return false;
  }
  // Ronda 3: cada «(» ha d'anar just després de la paraula «array». En PHP 7+
  // una cadena es pot cridar com a funció ('file_put_contents'(…)), i
  // `('f')(…)` o `['C', 'm'](…)` també criden.
  for (let k = codi.indexOf('('); k !== -1; k = codi.indexOf('(', k + 1)) {
    if (!/\barray\s*$/i.test(codi.slice(Math.max(0, k - 64), k))) return false;
  }
  // Cap cadena entre cometes dobles amb `$` (interpolació).
  let obertura = -1;
  for (let i = 0; i < codi.length; i += 1) {
    if (codi[i] !== '"') continue;
    if (obertura < 0) { obertura = i; continue; }
    if (net.slice(obertura + 1, i).includes('$')) return false;
    obertura = -1;
  }
  return true;
}

/**
 * R25.2-P03: la guarda d'accés directe ha de ser la primera sentència del
 * fitxer (després de `declare`/`namespace`) i ha d'acabar en `exit`/`die`.
 * Un `.l10n.php` de dades pures (`return array(...)` de literals) n'està
 * exempt. Treballa sobre el text sense comentaris.
 */
export function teGuardaAbspathAmbEixida(rel, net) {
  if (RE_GUARDA_PHP.test(net)) return true;
  return String(rel).endsWith('.l10n.php') && esDadesL10n(net);
}

/**
 * Còpia de la llista blanca ADAPTADOR de wordpress-plugin/eines/empaqueta.mjs
 * (el que entra al ZIP del connector). La prova de la porta en vigila la
 * paritat: si l'empaquetador canvia, la porta no pot quedar desfasada.
 */
export const WP_DISTRIBUIT = Object.freeze({
  fitxers: Object.freeze(['socdepoble-enxufe.php', 'uninstall.php', 'readme.txt']),
  carpetes: Object.freeze(['includes', 'templates', 'languages']),
});

/** Àmbit d'un fitxer PHP: `distribuit` (va al ZIP), `exemple-amfitrio`, `no-distribuit` o `amfitrio-arrel`. */
export function ambitWordPress(rel) {
  if (!rel.startsWith('wordpress-plugin/')) return 'amfitrio-arrel';
  const dins = rel.slice('wordpress-plugin/'.length);
  if (WP_DISTRIBUIT.fitxers.includes(dins) || WP_DISTRIBUIT.carpetes.some((c) => dins.startsWith(`${c}/`))) return 'distribuit';
  if (dins.startsWith('eines/amfitrio/')) return 'exemple-amfitrio';
  return 'no-distribuit';
}

/** Crides `nom(…)` en codi actiu: torna el text de la crida (amb literals) des del «(». Lineal. */
function cridesPhp(codi, net, re) {
  const crides = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(codi)) !== null) {
    const idxParen = m.index + m[0].length - 1;
    const crida = extreuCridaBalancejada(codi, idxParen);
    crides.push({ index: m.index, text: net.slice(idxParen, crida.fi) });
    re.lastIndex = Math.max(crida.fi, idxParen + 1);
  }
  return crides;
}

/** Claus d'array `'nom' =>` reals: la cometa d'obertura i el `=>` són codi, no contingut d'una cadena. */
function clausReals(text, mascara, nom) {
  const re = new RegExp(String.raw`(['"])${nom}\1\s*=>`, 'g');
  const claus = [];
  for (const m of text.matchAll(re)) {
    if (mascara[m.index] === m[1] && mascara[m.index + m[0].length - 2] === '=') claus.push(m);
  }
  return claus;
}

/**
 * VIG-07 (lèxic, sobre codi actiu): el fitxer de manteniment fa una crida real
 * que emet 503 (`status_header(503)`, `http_response_code(503)`,
 * `header('HTTP/… 503 …')`, `header(…, true, 503)` o `wp_die(…, ['response' => 503])`),
 * envia Retry-After i no-store per `header()`, `nocache_headers()` o les claus
 * d'una resposta, i respecta robots.txt. Una cadena o un comentari que només
 * ho anomenen no compten. Que la funció s'execute de veritat no ho pot
 * provar cap lexer: ho mesura la sonda.
 */
export function mancancesManteniment503(net) {
  const codi = mascaraPhp(net);
  const headers = cridesPhp(codi, net, /\bheader\s*\(/gi);
  const fa503 = /\b(?:status_header|http_response_code)\s*\(\s*503\s*[,)]/i.test(codi)
    || headers.some(({ text }) => /^\(\s*(['"])\s*(?:HTTP\/\d(?:\.\d)?|Status:)\s*503\b/i.test(text)
      || /^\(\s*\$_SERVER\s*\[\s*['"]SERVER_PROTOCOL['"]\s*\]\s*\.\s*['"]\s*503\b/i.test(text)
      || /,\s*(?:true|false|1|0)\s*,\s*503\s*\)$/i.test(text))
    || cridesPhp(codi, net, /\bwp_die\s*\(/gi).some(({ text }) => /(['"])response\1\s*=>\s*503\b/i.test(text));
  const retryAfter = headers.some(({ text }) => /^\(\s*['"]\s*Retry-After\s*:/i.test(text))
    || clausReals(net, codi, 'Retry-After').length > 0;
  const noStore = /\b(?:wp_get_)?nocache_headers\s*\(/i.test(codi)
    || headers.some(({ text }) => /^\(\s*['"]\s*Cache-Control\s*:[^'"]*\bno-store\b/i.test(text));
  return [
    !fa503 && '503',
    !retryAfter && 'Retry-After',
    !noStore && 'no-store/nocache_headers',
    !/\bis_robots\s*\(/i.test(codi) && !/robots\.txt/i.test(net) && 'exempció robots.txt/is_robots()',
  ].filter(Boolean);
}

// Ronda 3: el nom es captura sencer (fins a la primera cometa) i es mira a part.
// L'expressió antiga ([^'"]*X[^'"]*) retrocedia de manera quadràtica davant
// d'un nom sense cometa de tancament (512 KiB = 49 s).
const RE_OPCIO_SECRETA = /\b(?:update|add|get)_(?:site_)?option\s*\(\s*['"]([^'"]*)['"]/gi;
const RE_NOM_OPCIO_SECRETA = /_key|_secret|_token|api_key|_wp_secret_|password/i;
// Vies per on un valor ix cap al client, el registre o una capçalera (també l'eco curt «<?=»).
const RE_EXPOSICIO = /\b(?:echo|print|printf|vprintf|print_r|var_dump|var_export|error_log|wp_die|die|exit|header|setcookie|wp_send_json(?:_success|_error)?|wp_localize_script|wp_add_inline_script|rest_ensure_response|WP_REST_Response)\b|<\?=/gi;
const RE_CLAU_SECRETA = /\b(?:WP_SECRETS_KEY|_wp_secret_)\b/;

/**
 * VIG-08 sobre text PHP sense comentaris. Lineal: cada sentència es mira una
 * vegada. El final de la sentència es busca sobre la màscara (un «;» dins
 * d'una cadena no la talla) i la via d'exposició ha de ser codi actiu.
 * `mascara` és opcional: la porta la passa per a la xarxa de seguretat.
 */
export function trobaSecretsWp(net, mascara = mascaraPhp(net)) {
  const troballes = [];
  RE_OPCIO_SECRETA.lastIndex = 0;
  let mo;
  while ((mo = RE_OPCIO_SECRETA.exec(net)) !== null) {
    // Com l'expressió antiga, la cerca següent comença just després de l'inici.
    RE_OPCIO_SECRETA.lastIndex = mo.index + 1;
    if (mascara[mo.index] !== net[mo.index] || !RE_NOM_OPCIO_SECRETA.test(mo[1])) continue;
    troballes.push({ index: mo.index, longitud: mo[0].length, motiu: `Prohibit llegir o persistir secrets en clar o claus internes a wp_options ("${mo[1]}"). Useu Secrets API WP 7.2+ o constants.` });
  }
  // Punters de memòria al proper «?>» i al proper «;» de codi: cada cerca
  // avança, mai no torna enrere (ronda 3: el «;» es tornava a buscar des de
  // cada via d'exposició quan un «?>» tallava abans).
  let proxPuntIComa = -1;
  const puntIComaDesDe = (p) => {
    if (proxPuntIComa < p) {
      proxPuntIComa = mascara.indexOf(';', p);
      if (proxPuntIComa === -1) proxPuntIComa = mascara.length;
    }
    return proxPuntIComa;
  };
  let proxTanca = -1;
  const tancaDesDe = (p) => {
    if (proxTanca < p) {
      proxTanca = mascara.indexOf('?>', p);
      if (proxTanca === -1) proxTanca = mascara.length;
    }
    return proxTanca;
  };
  RE_EXPOSICIO.lastIndex = 0;
  let m;
  while ((m = RE_EXPOSICIO.exec(mascara)) !== null) {
    // L'eco curt «<?=» acaba al seu «?>» (es busca des del final del «<?=»).
    const fi = Math.min(puntIComaDesDe(m.index), tancaDesDe(m.index + m[0].length));
    if (RE_CLAU_SECRETA.test(net.slice(m.index, fi))) {
      troballes.push({ index: m.index, longitud: fi - m.index, motiu: 'Prohibit exposar el valor de WP_SECRETS_KEY o _wp_secret_ en respostes HTTP, capçaleres, scripts o registres.' });
    }
    RE_EXPOSICIO.lastIndex = fi + 1;
  }
  return troballes;
}

/** Valor d'un `permission_callback` real que sempre autoritza: `__return_true`, `is_admin` o un closure trivial. */
function permisTrivial(text, desDe) {
  const valor = text.slice(desDe, desDe + 400);
  // En PHP els noms de funció no distingixen majúscules i un callable pot portar
  // el «\» global ('\\__return_true'); PHP 8.1 també admet `__return_true(...)`.
  if (/^\s*(['"])\\{0,2}(?:__return_true|is_admin)\1/i.test(valor)
    || /^\s*\\?(?:__return_true|is_admin)\s*\(\s*\.\.\.\s*\)/i.test(valor)) {
    return 'usa __return_true o is_admin sense verificació real.';
  }
  if (/^\s*(?:static\s+)?function\s*\([^)]*\)\s*(?:use\s*\([^)]*\)\s*)?(?::\s*\??\w+\s*)?\{\s*return\s+(?:true|1|!0|__return_true\s*\(\s*\))\s*;\s*\}/i.test(valor)
    || /^\s*(?:static\s+)?fn\s*\([^)]*\)\s*(?::\s*\??\w+\s*)?=>\s*(?:true|1|!0)\s*[,)\]]/i.test(valor)) {
    return 'usa un closure que sempre torna cert (equivalent a __return_true).';
  }
  return null;
}

/** WP-02: cada endpoint declara el seu permission_callback; cap permís trivial. Només compten les claus reals. */
function revisaPermisosCrida(cridaText, mascara) {
  const callbacks = clausReals(cridaText, mascara, 'callback').length;
  const permisos = clausReals(cridaText, mascara, 'permission_callback');
  if (permisos.length === 0) return 'sense permission_callback explícit.';
  for (const p of permisos) {
    const trivial = permisTrivial(cridaText, p.index + p[0].length);
    if (trivial) return trivial;
  }
  if (callbacks > permisos.length) return `declara ${callbacks} callback i només ${permisos.length} permission_callback: un endpoint germà no hereta el permís d'un altre.`;
  return null;
}

/**
 * WP-02 sobre text PHP sense comentaris: cada `register_rest_route` i
 * `wp_register_ability` de codi actiu amb arguments balancejats; la cerca
 * continua al final de cada crida (lineal) i cap crida hereta el permís
 * d'una veïna. Una cadena que imita `'permission_callback' =>` no compta.
 * Un closure que no és literalment trivial no es pot avaluar lèxicament.
 */
export function defectesPermisosWp(net, mascara = mascaraPhp(net)) {
  const defectes = [];
  for (const [nomCrida, re] of [['register_rest_route', /\bregister_rest_route\s*\(/g], ['wp_register_ability', /\bwp_register_ability\s*\(/g]]) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(mascara)) !== null) {
      const idxParen = m.index + m[0].length - 1;
      const crida = extreuCridaBalancejada(mascara, idxParen);
      const defecte = revisaPermisosCrida(net.slice(idxParen, crida.fi), mascara.slice(idxParen, crida.fi));
      if (defecte) defectes.push({ nomCrida, index: m.index, defecte });
      re.lastIndex = Math.max(crida.fi, idxParen + 1);
    }
  }
  return defectes;
}

/* ═══════════════════════ Recorregut ═══════════════════════ */

function caminaFitxers(dirAbs, predicatExt, acumulat, enllacos) {
  if (!fs.existsSync(dirAbs)) return acumulat;
  const entrades = fs.readdirSync(dirAbs, { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entrada of entrades) {
    const rutaAbs = path.join(dirAbs, entrada.name);
    if (entrada.isSymbolicLink()) {
      if (predicatExt(entrada.name) || !path.extname(entrada.name)) enllacos.push(rutaAbs);
      continue;
    }
    if (entrada.isDirectory()) {
      if (entrada.name === 'node_modules' || entrada.name === 'dist' || entrada.name === '.git') continue;
      caminaFitxers(rutaAbs, predicatExt, acumulat, enllacos);
    } else if (entrada.isFile() && predicatExt(entrada.name)) {
      acumulat.push(rutaAbs);
    }
  }
  return acumulat;
}

const EXTENSIONS_JS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);
/** Caràcters que no poden precedir l'obertura d'un comentari JS real: `https://`, `src/*.js`, `a.//`… */
const esPreviImpossibleComentari = (c) => Boolean(c) && (esCarIdentificador(c) || c === ':' || c === '.' || c === '/' || c === '\\' || c === '"' || c === "'" || c === '`');
const RE_TANCAMENT_JSX = /<\/(?:[A-Za-z_$][\w$.:-]*)?\s*>/;

/**
 * Lectura dels trams no-codi d'un fitxer per a la xarxa de seguretat dels
 * embornals. `tramDe` és una cerca binària (els trams van en ordre); una
 * desincronia (JSX o plantilla sense tancar) invalida tota lectura posterior.
 */
function lecturaTrams(trams, ext) {
  const desincronia = trams.find((t) => t.tipus === 'desincronia') || null;
  const ordenats = trams.filter((t) => t.tipus !== 'desincronia').sort((a, b) => a.ini - b.ini);
  const js = EXTENSIONS_JS.has(ext);
  return {
    tramDe(pos) {
      let esq = 0;
      let dre = ordenats.length - 1;
      let trobat = null;
      while (esq <= dre) {
        const mig = (esq + dre) >> 1;
        if (ordenats[mig].ini <= pos) { trobat = ordenats[mig]; esq = mig + 1; } else dre = mig - 1;
      }
      if (desincronia && pos >= desincronia.ini) return desincronia;
      return trobat && pos < trobat.fi ? trobat : null;
    },
    versemblant(t, cru) {
      if (!t || t.tipus === 'desincronia' || t.obert || t.ambigu) return false;
      if (t.tipus === 'comentari' && js) {
        if (esPreviImpossibleComentari(t.previ)) return false;
        // Una línia de «comentari» que tanca una etiqueta JSX és text JSX mal
        // llegit. Es calcula una sola vegada per tram (ronda 3: abans es
        // repetia per cada embornal del mateix comentari, cost quadràtic).
        if (t.linia) {
          if (t.tancaJsx === undefined) t.tancaJsx = RE_TANCAMENT_JSX.test(cru.slice(t.ini, t.fi));
          if (t.tancaJsx) return false;
        }
      }
      return true;
    },
  };
}

const solapaComentari = (cru, net, index, longitud) => cru.slice(index, index + longitud) !== net.slice(index, index + longitud);

/**
 * Executa l'auditoria estàtica de perímetre i signatures cobertes.
 * `opcions.maxBytesFitxer`, `maxBytesTotal` i `maxIncidencies` permeten provar
 * els pressupostos sense crear fitxers gegants.
 */
export function avaluaPerimetreTellado(arrel = arrelSegura(), opcions = {}) {
  const arrelAbs = path.resolve(arrel);
  const dominisPermesos = new Set((opcions.dominisIframePermesos || DOMINIS_IFRAME_PERMESOS).map((d) => String(d).toLowerCase()));
  const maxBytesFitxer = Number(opcions.maxBytesFitxer) > 0 ? Number(opcions.maxBytesFitxer) : MAX_BYTES_FITXER_ESCANEIG;
  const maxBytesTotal = Number(opcions.maxBytesTotal) > 0 ? Number(opcions.maxBytesTotal) : MAX_BYTES_TOTAL_ESCANEIG;
  const maxIncidencies = Number(opcions.maxIncidencies) > 0 ? Number(opcions.maxIncidencies) : MAX_INCIDENCIES;

  const infraccions = [];
  let incidenciesTruncades = false;
  const registra = (regla, fitxer, linia, missatge, extra = {}) => {
    if (infraccions.length >= maxIncidencies) {
      if (!incidenciesTruncades) {
        incidenciesTruncades = true;
        infraccions.push({ regla: 'TELLADO-LIMIT-02', fitxer, linia, missatge: `Pressupost d'incidències exhaurit (${maxIncidencies}); la resta no s'enumera i la porta tanca en fals.` });
      }
      return;
    }
    infraccions.push({ regla, fitxer, linia, missatge, ...extra });
  };
  const desconeguts = [];
  const revisionsDinamiques = [];
  let revisioDinamica = new Map();
  let totalDesconeguts = 0;
  const declaraDesconegut = (d) => {
    totalDesconeguts += 1;
    const revisio = catalogaTellado(d, revisioDinamica);
    if (revisio) revisionsDinamiques.push(revisio);
    if (desconeguts.length < MAX_DESCONEGUTS) desconeguts.push(d);
  };
  const destinsXarxa = { coberts: 0, desconeguts: 0 };

  let bytesTotals = 0;
  let pressupostTotalExhaurit = false;
  const llegeixDinsPressupost = (abs, rel) => {
    if (pressupostTotalExhaurit) return null;
    const mida = fs.statSync(abs).size;
    if (mida > maxBytesFitxer) {
      registra('TELLADO-LIMIT-01', rel, 1, `Fitxer supera el pressupost d'escaneig per fitxer (${mida} > ${maxBytesFitxer} bytes).`);
      return null;
    }
    if (bytesTotals + mida > maxBytesTotal) {
      pressupostTotalExhaurit = true;
      registra('TELLADO-LIMIT-01', rel, 1, `Pressupost total d'escaneig exhaurit (${maxBytesTotal} bytes); la resta de fitxers no s'ha mesurat.`);
      return null;
    }
    bytesTotals += mida;
    return fs.readFileSync(abs, 'utf8');
  };

  const enllacos = [];
  const candidats = [];
  const indexHtml = path.join(arrelAbs, 'index.html');
  if (fs.existsSync(indexHtml)) candidats.push(indexHtml);
  for (const carpeta of ['src', 'public', 'wordpress-plugin']) {
    caminaFitxers(path.join(arrelAbs, carpeta), (nom) => /\.(?:html|js|jsx|mjs|cjs|ts|tsx|css|php)$/i.test(nom), candidats, enllacos);
  }
  const relDe = (abs) => path.relative(arrelAbs, abs).split(path.sep).join('/');
  for (const abs of enllacos) {
    declaraDesconegut({ tipus: 'ENLLAC_SIMBOLIC_NO_RECORREGUT', fitxer: relDe(abs), linia: 1, motiu: 'Els enllaços simbòlics no es travessen; el seu contingut no està mesurat.' });
  }

  const textos = new Map();
  let fitxersEscanejats = 0;
  for (const abs of candidats) {
    const rel = relDe(abs);
    if (RE_FITXER_PROVA_O_MIRALL.test(rel)) continue;
    const cru = llegeixDinsPressupost(abs, rel);
    if (cru === null) continue;
    fitxersEscanejats += 1;
    const ext = path.extname(abs).toLowerCase();
    const net = netejaComentarisLineal(cru, ext);
    revisioDinamica = preparaRevisioTellado(cru, net);
    if (ext === '.php') textos.set(rel, { cru, net });
    const salts = construeixIndexSaltsLinia(net);
    const linia = (index) => numeroLiniaAmbIndex(salts, index);

    // Recorregut d'etiquetes: PHP opac en .php i claus JSX en tota la família JS
    // (un .js també pot portar JSX; la base comptava claus en tots els fitxers).
    const mode = ext === '.php' ? 'php' : EXTENSIONS_JS.has(ext) ? 'jsx' : 'html';
    const netes = trobaSignatures(net, dominisPermesos, { mode });
    const vistes = new Set();
    for (const t of netes) {
      vistes.add(`${t.regla}@${t.index}`);
      if (t.desconegut) declaraDesconegut({ tipus: t.desconegut, regla: t.regla, fitxer: rel, linia: linia(t.index), motiu: t.motiu });
      else registra(t.regla, rel, linia(t.index), t.motiu);
    }
    // Xarxa de seguretat: el lexer és heurístic; una signatura del text cru que
    // el net no mostra mai no es dona per neta.
    for (const t of trobaSignatures(cru, dominisPermesos, { mode })) {
      if (vistes.has(`${t.regla}@${t.index}`)) continue;
      if (solapaComentari(cru, net, t.index, t.longitud)) {
        declaraDesconegut({ tipus: 'SIGNATURA_EN_COMENTARI', regla: t.regla, fitxer: rel, linia: linia(t.index), motiu: `Signatura dins del que el lexer creu un comentari; no es pot certificar: ${t.motiu}` });
      } else if (!t.desconegut) {
        registra(t.regla, rel, linia(t.index), t.motiu);
      }
    }

    if (ext !== '.css') {
      // Màscara de codi actiu: ni comentaris ni contingut de literals ni text JSX («l'import (part)»).
      const trams = [];
      const codi = netejaComentarisLineal(cru, ext, { buidaCadenes: true, trams });
      const vistos = new Set();
      for (const embornal of EMBORNALS_XARXA) {
        embornal.re.lastIndex = 0;
        let m;
        while ((m = embornal.re.exec(codi)) !== null) {
          vistos.add(m.index);
          const idxParen = m.index + m[0].length - 1;
          const classe = classificaDesti(net, idxParen);
          if (classe) {
            destinsXarxa.desconeguts += 1;
            declaraDesconegut({ tipus: classe.tipus, regla: embornal.nom, fitxer: rel, linia: linia(m.index), motiu: classe.motiu, ...(classe.origen ? { origen: classe.origen } : {}) });
          } else {
            destinsXarxa.coberts += 1;
          }
          embornal.re.lastIndex = idxParen + 1;
        }
      }
      RE_SCRIPT_DINAMIC.lastIndex = 0;
      const scriptsVistos = new Set();
      for (const m of net.matchAll(RE_SCRIPT_DINAMIC)) {
        scriptsVistos.add(m.index);
        declaraDesconegut({ tipus: 'SCRIPT_INJECTAT_DINAMIC', regla: 'TELLADO-EXF-01', fitxer: rel, linia: linia(m.index), motiu: "createElement('script'): l'origen del script es decidix en temps d'execució." });
      }

      // Xarxa de seguretat dels embornals (ronda 2): un embornal del text cru que
      // cau en un tram que el lexer no llig com a codi només es dona per inert si
      // eixa lectura és versemblant (comentari real, literal tancat, text JSX en
      // un fitxer sense desincronia). Si no, es declara desconegut.
      const lectura = lecturaTrams(trams, ext);
      for (const embornal of EMBORNALS_XARXA) {
        embornal.re.lastIndex = 0;
        let m;
        while ((m = embornal.re.exec(cru)) !== null) {
          const idxParen = m.index + m[0].length - 1;
          embornal.re.lastIndex = idxParen + 1;
          if (vistos.has(m.index) || codi[m.index] === cru[m.index]) continue;
          const t = lectura.tramDe(m.index);
          if (lectura.versemblant(t, cru)) continue;
          const classe = classificaDesti(cru, idxParen);
          if (!classe) continue;
          destinsXarxa.desconeguts += 1;
          declaraDesconegut({
            tipus: t?.tipus === 'comentari' ? 'EMBORNAL_EN_COMENTARI' : 'EMBORNAL_FORA_DE_CODI',
            regla: embornal.nom,
            fitxer: rel,
            linia: linia(m.index),
            motiu: `Embornal dins d'un tram que el lexer llig com a ${t?.tipus || 'desconegut'} sense que la lectura siga versemblant; no es pot certificar: ${classe.motiu}`,
            ...(classe.origen ? { origen: classe.origen } : {}),
          });
        }
      }
      RE_SCRIPT_DINAMIC.lastIndex = 0;
      for (const m of cru.matchAll(RE_SCRIPT_DINAMIC)) {
        if (scriptsVistos.has(m.index) || net[m.index] === cru[m.index]) continue;
        const t = lectura.tramDe(m.index);
        if (lectura.versemblant(t, cru)) continue;
        declaraDesconegut({ tipus: 'SCRIPT_INJECTAT_DINAMIC', regla: 'TELLADO-EXF-01', fitxer: rel, linia: linia(m.index), motiu: "createElement('script') dins d'un tram que el lexer no llig com a codi de manera versemblant." });
      }
    }
  }

  revisaFirebaseHeaders(arrelAbs, registra);
  revisaFaviconSeoGoogle(arrelAbs, registra);

  const phpFiles = [];
  const wpDir = path.join(arrelAbs, 'wordpress-plugin');
  if (fs.existsSync(wpDir)) caminaFitxers(wpDir, (nom) => nom.endsWith('.php'), phpFiles, []);
  for (const extraRel of ['wp-content/maintenance.php', 'public/maintenance.php', 'maintenance.php']) {
    const extraAbs = path.join(arrelAbs, extraRel);
    if (fs.existsSync(extraAbs) && !phpFiles.includes(extraAbs)) phpFiles.push(extraAbs);
  }
  let fitxersPhpRevisats = 0;
  for (const abs of phpFiles) {
    const rel = relDe(abs);
    if (RE_FITXER_PROVA_O_MIRALL.test(rel)) continue;
    let parella = textos.get(rel);
    if (!parella) {
      const cru = llegeixDinsPressupost(abs, rel);
      if (cru === null) continue;
      parella = { cru, net: netejaComentarisLineal(cru, '.php') };
    }
    fitxersPhpRevisats += 1;
    const { cru, net } = parella;
    const salts = construeixIndexSaltsLinia(net);
    const linia = (index) => numeroLiniaAmbIndex(salts, index);
    const ambit = ambitWordPress(rel);

    if (rel.startsWith('wordpress-plugin/') && !teGuardaAbspathAmbEixida(rel, net)) {
      registra('TELLADO-WP-01', rel, 1, "Fitxer PHP de WordPress sense guarda efectiva com a primera sentència: defined('ABSPATH') || exit/die.", { ambit });
    }

    const codiPhp = mascaraPhp(net);
    for (const d of defectesPermisosWp(net, codiPhp)) {
      registra('TELLADO-WP-02', rel, linia(d.index), `${d.nomCrida} ${d.defecte}`, { ambit });
    }

    for (const [regla, re, missatge] of [
      ['TELLADO-WP-03', /\bheader\s*\(\s*['"]Content-Security-Policy\s*:/gi, "El plugin WordPress no pot imposar una Content-Security-Policy global amb header() que trenque l'amfitrió."],
    ]) {
      for (const text of [net, cru]) {
        re.lastIndex = 0;
        for (const m of text.matchAll(re)) {
          if (text === net) registra(regla, rel, linia(m.index), missatge, { ambit });
          else if (solapaComentari(cru, net, m.index, m[0].length)) declaraDesconegut({ tipus: 'SIGNATURA_EN_COMENTARI', regla, fitxer: rel, linia: linia(m.index), motiu: missatge });
        }
      }
    }

    if (/(?:^|\/)(?:maintenance\.php|[^/]*manteniment[^/]*503[^/]*\.php)$/i.test(rel)) {
      const mancances = mancancesManteniment503(net);
      if (mancances.length) {
        registra('VIG-07', rel, 1, `Fitxer de manteniment WordPress incomplet (falten: ${mancances.join(', ')}); mai pot respondre 200 OK ni bloquejar robots.txt.`, { ambit });
      }
    }

    const secretsNets = trobaSecretsWp(net, codiPhp);
    const secretsVistos = new Set(secretsNets.map((s) => s.index));
    for (const s of secretsNets) registra('VIG-08', rel, linia(s.index), s.motiu, { ambit });
    // Xarxa de seguretat: els comentaris es miren crus, la resta amb la màscara
    // de codi. Mateixa regla que caràcter a caràcter, però per trams (ronda 3:
    // un caràcter per element costava més que tota la resta del fitxer).
    const trossosXarxa = [];
    let iniTros = 0;
    let trosCru = false;
    for (let i = 0; i <= cru.length; i += 1) {
      const esCru = i < cru.length && net[i] !== cru[i];
      if (i === cru.length || esCru !== trosCru) {
        if (i > iniTros) trossosXarxa.push((trosCru ? cru : codiPhp).slice(iniTros, i));
        iniTros = i;
        trosCru = esCru;
      }
    }
    const mascaraXarxa = trossosXarxa.join('');
    for (const s of trobaSecretsWp(cru, mascaraXarxa)) {
      if (!secretsVistos.has(s.index) && solapaComentari(cru, net, s.index, s.longitud)) {
        declaraDesconegut({ tipus: 'SIGNATURA_EN_COMENTARI', regla: 'VIG-08', fitxer: rel, linia: linia(s.index), motiu: s.motiu });
      }
    }
  }

  const ok = infraccions.length === 0;
  return {
    porta: 'porta-perimetre-tellado',
    versio: VERSIO_PORTA_TELLADO,
    cobertura: 'signatures-estatiques-acotades',
    abast: {
      certificaZeroExfiltracio: false,
      signatures: ['TELLADO-EXF-01..04', 'TELLADO-HDR-00..04', 'TELLADO-WP-01..03', 'VIG-07..10', 'TELLADO-LIMIT-01/02'],
      embornalsXarxa: [...EMBORNALS_XARXA.map((e) => e.nom), "createElement('script')"],
      noCobreix: [
        'XMLHttpRequest, window.open, formularis, <img>/<a> generats i URL construïdes fora dels embornals llistats',
        "comportament HTTP desplegat (capçaleres reals, cookies, consentiment): cal la sonda o una auditoria viva",
        'VIG-07 és lèxic: que la crida de 503 s\'execute de veritat (hook registrat, funció cridada) només ho prova la sonda',
        'closures de permission_callback que no són literalment trivials (WP-02 només veu __return_true, is_admin i return true)',
        'PHP amb sintaxi alternativa no habitual; un AST real substituiria la heurística lèxica',
        "atributs que arriben per propagació JSX ({...props}) o per un <?php ?> en posició de nom d'atribut; modulepreload/preload as=script i srcdoc codificat en entitats",
      ],
    },
    veredicte: !ok ? 'infraccions' : totalDesconeguts > 0 ? 'desconegut' : 'net-en-signatures-cobertes',
    ok,
    arrel: arrelAbs,
    fitxersEscanejats,
    fitxersPhpRevisats,
    bytesEscanejats: bytesTotals,
    totalInfraccions: infraccions.length,
    infraccions,
    totalDesconeguts,
    desconegutsTruncats: totalDesconeguts > desconeguts.length,
    desconeguts,
    destinsXarxa,
    catalegDinamic: resumCatalegTellado(revisionsDinamiques, totalDesconeguts, totalDesconeguts > desconeguts.length),
  };
}

export function executaCliTellado(argv = process.argv.slice(2)) {
  let arrel = null;
  let modeJson = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') modeJson = true;
    else if (arg.startsWith('--arrel=')) arrel = arg.slice('--arrel='.length);
    else if (arg === '--arrel' && argv[i + 1]) { arrel = argv[i + 1]; i += 1; }
  }
  let resultat;
  try {
    resultat = avaluaPerimetreTellado(arrel ?? arrelSegura());
  } catch (err) {
    console.error(err?.informe ? err.informe() : `❌ [TELLADO] No s'ha pogut mesurar l'arrel: ${err?.message || err}`);
    return 2;
  }
  if (modeJson) {
    console.log(JSON.stringify(resultat, null, 2));
  } else if (!resultat.ok) {
    console.error(`❌ [TELLADO v${VERSIO_PORTA_TELLADO}] ${resultat.totalInfraccions} infracció(ns) de perímetre o exfiltració:`);
    for (const inf of resultat.infraccions) console.error(`  - [${inf.regla}] ${inf.fitxer}:${inf.linia} -> ${inf.missatge}`);
  } else {
    const desc = resultat.totalDesconeguts;
    console.log(
      `${desc ? '⚠️' : '✅'} [TELLADO v${VERSIO_PORTA_TELLADO}] ${resultat.fitxersEscanejats} fitxers i ${resultat.fitxersPhpRevisats} PHP revisats · 0 infraccions en signatures cobertes · veredicte: ${resultat.veredicte}`
      + (desc ? ` (${desc} element(s) no verificables; no es certifica zero exfiltració)` : '') + '.',
    );
    for (const d of resultat.desconeguts.slice(0, 10)) console.log(`  · [${d.tipus}] ${d.fitxer}:${d.linia} -> ${d.motiu}`);
    if (desc > 10) console.log(`  · … ${desc - 10} més (--json per a la llista sencera)`);
  }
  return resultat.ok ? 0 : 1;
}

if (esMain(import.meta.url)) {
  process.exitCode = executaCliTellado();
}
