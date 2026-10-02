/**
 * pdfText.js — el text d'un PDF generat per màquina, sense dependències.
 *
 * Lector mínim i tolerant, pensat per a factures. No es refia de la taula
 * xref: recorre el fitxer buscant «N G obj», com els lectors en mode de
 * reparació, i l'última definició d'un número guanya. Llig els fluxos
 * d'objectes (/ObjStm), l'arbre de pàgines, les fonts de cada pàgina amb el
 * seu CMap /ToUnicode i els operadors de text. Cada tros de text es porta a
 * l'espai de la pàgina (matriu de text per CTM) i al final s'agrupa en línies
 * de dalt a baix i d'esquerra a dreta: salt quan canvia la y, espai quan hi
 * ha forat entre trossos o un ajust de TJ < -200.
 * Mai llança: el que no entén ho deixa als avisos. Un PDF xifrat no s'intenta
 * llegir. JS pur: sense DOM ni React; la descompressió s'injecta (inflate.js).
 *
 * Revisió adversarial (seguretat-06) · PRESSUPOST PER PDF. El sostre de
 * inflate.js (64 MiB) és per flux; ací n'hi ha un per document, compartit:
 * cada eixida d'un filtre (inflate inclòs), cada conversió d'un flux a text i
 * cada lectura del contingut d'una pàgina o d'un formulari el gasten. Cada
 * flux es descomprimix i es converteix una sola vegada (els bytes es deixen
 * anar en convertir-los), i el contingut d'una pàgina s'allibera quan l'ha
 * llegida l'última pàgina que l'usa. En passar del pressupost la lectura para
 * de colp i no torna cap text, només l'avís PDF_MASSA_GRAN: mig document
 * podria donar una factura incompleta amb aparença de bona, i sense text el
 * document queda pendent de revisar a mà.
 */
import { aBytes, esPdf, inflateDisponible } from './inflate.js';

/** Pressupost per PDF, en bytes: el que se'n descomprimix, es converteix a text i es llig. */
export const PRESSUPOST_PDF = 128 * 1024 * 1024;
/** L'avís d'un PDF que passa del pressupost (no se'n torna cap text). */
export const PDF_MASSA_GRAN = "El PDF és massa gran una vegada descomprimit (pot ser una bomba de descompressió): no se n'ha extret el text; revisa'l a mà.";

const MAX_PROFUNDITAT = 64;
const MAX_NUM_OBJECTE = 10000000;
const MAX_PAGINES = 10000;
const MAX_OPERADORS = 2000000;
const MAX_FORMULARIS = 8;
const LLINDAR_TJ = -200;
/* Forat mínim entre dos trossos de la mateixa línia, en ems, per a posar-hi un espai. */
const FORAT_ESPAI = 0.2;
/* Diferència màxima de y, en ems, perquè dos trossos siguen de la mateixa línia. */
const TOLERANCIA_LINIA = 0.45;
const IDENTITAT = Object.freeze([1, 0, 0, 1, 0, 0]);

const AVIS = Object.freeze({
  capcalera: 'No comença per «%PDF-»: potser no és un PDF.',
  entrada: "L'entrada no són bytes: no s'ha llegit res.",
  senseObjectes: "No s'hi ha trobat cap objecte PDF.",
  xifrat: "El PDF està xifrat: no se n'extrau el text.",
  sensePagines: "No s'ha trobat cap pàgina.",
  arbre: "L'arbre de pàgines no es pot llegir: les pàgines van en l'ordre del fitxer.",
  senseInflate: 'No hi ha descompressor (DecompressionStream): el text dels fluxos comprimits queda buit.',
  inflate: "Un flux comprimit no s'ha pogut descomprimir.",
  predictor: 'Un flux usa un predictor de compressió, que no es suporta.',
  longitud: "Algun flux té una /Length incorrecta: s'ha recuperat per la marca «endstream».",
  objStm: "Un flux d'objectes (/ObjStm) està mal format.",
  font: 'Una pàgina usa una font que no és als seus recursos.',
  glifs: 'Hi ha glifs sense correspondència Unicode: el text pot estar incomplet.',
  operadors: "El contingut és massa llarg: s'ha tallat la lectura."
});

/* ── Bytes i lèxic ─────────────────────────────────────────────────────── */

/* Cadena binària: un caràcter per byte (0-255), per a buscar amb expressions regulars. */
function binari(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  return s;
}

const esBlanc = (c) => c === 32 || c === 10 || c === 13 || c === 9 || c === 12 || c === 0;
const DELIMITADORS = new Set([37, 40, 41, 47, 60, 62, 91, 93, 123, 125]);
const esRegular = (c) => !Number.isNaN(c) && !esBlanc(c) && !DELIMITADORS.has(c);
const NUMERO = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
/* Paraules clau que tanquen un objecte: un diccionari mal tancat no les travessa. */
const ATURADES = new Set(['obj', 'endobj', 'stream', 'endstream', 'xref', 'trailer']);

class Ref {
  constructor(num, gen) {
    this.num = num;
    this.gen = gen;
  }
}

/* Cadena PDF (literal o hexadecimal) com a cadena binària. Els noms són strings JS. */
class Cadena {
  constructor(b) {
    this.b = b;
  }
}

class Flux {
  constructor(dict, inici, pos) {
    this.dict = dict;
    this.inici = inici;
    this.pos = pos;
    this.fi = -1;
    this.fiCercat = -1;
    this.seguent = inici;
    /* La promesa del text del flux ja descodificat (LectorPdf.textDeFlux); null si no s'ha llegit o s'ha alliberat. */
    this.promesa = null;
  }
}

/* El PDF ha passat del pressupost: atura tota la lectura (cap catch intermedi se la queda). */
class PressupostEsgotat extends Error {
  constructor() {
    super(PDF_MASSA_GRAN);
    this.name = 'PressupostEsgotat';
  }
}

const esPressupostEsgotat = (e) => e instanceof PressupostEsgotat;

class Lexer {
  constructor(s, p = 0, fi = s.length) {
    this.s = s;
    this.p = p;
    this.fi = Math.min(fi, s.length);
  }

  saltaBlancs() {
    const { s } = this;
    while (this.p < this.fi) {
      const c = s.charCodeAt(this.p);
      if (esBlanc(c)) this.p += 1;
      else if (c === 37) {
        while (this.p < this.fi && s.charCodeAt(this.p) !== 10 && s.charCodeAt(this.p) !== 13) this.p += 1;
      } else break;
    }
  }

  /* Torna { t, v } o null al final. t: num, nom, cad, kw, [, ], {, }, <<, >>. */
  seguent() {
    const { s } = this;
    for (;;) {
      this.saltaBlancs();
      if (this.p >= this.fi) return null;
      const c = s.charCodeAt(this.p);
      if (c === 40) return { t: 'cad', v: this.literal() };
      if (c === 60) {
        if (s.charCodeAt(this.p + 1) === 60) {
          this.p += 2;
          return { t: '<<' };
        }
        return { t: 'cad', v: this.hexa() };
      }
      if (c === 62) {
        this.p += 1;
        if (s.charCodeAt(this.p) === 62) {
          this.p += 1;
          return { t: '>>' };
        }
        continue;
      }
      if (c === 91 || c === 93 || c === 123 || c === 125) {
        this.p += 1;
        return { t: s[this.p - 1] };
      }
      if (c === 47) {
        this.p += 1;
        return { t: 'nom', v: this.paraula(true) };
      }
      if (c === 41) {
        this.p += 1;
        continue;
      }
      const w = this.paraula(false);
      if (w === '') {
        this.p += 1;
        continue;
      }
      if (NUMERO.test(w)) return { t: 'num', v: Number(w) };
      return { t: 'kw', v: w };
    }
  }

  paraula(esNom) {
    const { s } = this;
    const inici = this.p;
    while (this.p < this.fi && esRegular(s.charCodeAt(this.p))) this.p += 1;
    const w = s.slice(inici, this.p);
    return esNom && w.includes('#') ? w.replace(/#([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) : w;
  }

  /* Cadena literal: parèntesis equilibrats, escapes \n \r \t \b \f \( \) \\ i octals. */
  literal() {
    const { s } = this;
    let p = this.p + 1;
    let profunditat = 1;
    let r = '';
    while (p < this.fi) {
      const ch = s[p];
      if (ch === '\\') {
        const n = s[p + 1];
        p += 2;
        if (n === undefined) break;
        if (n === 'n') r += '\n';
        else if (n === 'r') r += '\r';
        else if (n === 't') r += '\t';
        else if (n === 'b') r += '\b';
        else if (n === 'f') r += '\f';
        else if (n === '\r') {
          if (s[p] === '\n') p += 1;
        } else if (n === '\n') {
          /* continuació de línia: no afig res */
        } else if (n >= '0' && n <= '7') {
          let octal = n;
          while (octal.length < 3 && s[p] >= '0' && s[p] <= '7') {
            octal += s[p];
            p += 1;
          }
          r += String.fromCharCode(parseInt(octal, 8) & 0xff);
        } else r += n;
        continue;
      }
      if (ch === '(') profunditat += 1;
      else if (ch === ')') {
        profunditat -= 1;
        if (profunditat === 0) {
          p += 1;
          break;
        }
      } else if (ch === '\r') {
        r += '\n';
        p += s[p + 1] === '\n' ? 2 : 1;
        continue;
      }
      r += ch;
      p += 1;
    }
    this.p = p;
    return r;
  }

  hexa() {
    const { s } = this;
    let p = this.p + 1;
    let xifres = '';
    while (p < this.fi && s[p] !== '>') {
      const c = s.charCodeAt(p);
      if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) xifres += s[p];
      p += 1;
    }
    this.p = p + 1;
    if (xifres.length % 2) xifres += '0';
    let r = '';
    for (let i = 0; i < xifres.length; i += 2) r += String.fromCharCode(parseInt(xifres.slice(i, i + 2), 16));
    return r;
  }

  /* Imatge en línia (BI … ID dades EI): se'n salten les dades binàries. */
  saltaImatge() {
    for (;;) {
      const t = this.seguent();
      if (!t) return;
      if (t.t === 'kw' && t.v === 'ID') break;
    }
    let p = this.p + 1;
    for (;;) {
      const k = this.s.indexOf('EI', p);
      if (k < 0 || k >= this.fi) {
        this.p = this.fi;
        return;
      }
      if (esBlanc(this.s.charCodeAt(k - 1)) && (k + 2 >= this.fi || esBlanc(this.s.charCodeAt(k + 2)))) {
        this.p = k + 2;
        return;
      }
      p = k + 1;
    }
  }
}

/* Valor PDF a partir d'un token ja llegit. Amb `refs`, «N G R» és una Ref. */
function valor(lx, tok, refs, profunditat = 0) {
  if (!tok) return null;
  switch (tok.t) {
    case 'num': {
      if (refs && Number.isInteger(tok.v) && tok.v >= 0) {
        const desa = lx.p;
        const gen = lx.seguent();
        if (gen?.t === 'num' && Number.isInteger(gen.v)) {
          const r = lx.seguent();
          if (r?.t === 'kw' && r.v === 'R') return new Ref(tok.v, gen.v);
        }
        lx.p = desa;
      }
      return tok.v;
    }
    case 'cad':
      return new Cadena(tok.v);
    case 'nom':
      return tok.v;
    case '[': {
      const llista = [];
      if (profunditat > MAX_PROFUNDITAT) return llista;
      for (;;) {
        const abans = lx.p;
        const t = lx.seguent();
        if (!t || t.t === ']') break;
        if (t.t === 'kw' && ATURADES.has(t.v)) {
          lx.p = abans;
          break;
        }
        llista.push(valor(lx, t, refs, profunditat + 1));
      }
      return llista;
    }
    case '<<': {
      const dict = new Map();
      if (profunditat > MAX_PROFUNDITAT) return dict;
      for (;;) {
        const abans = lx.p;
        const clau = lx.seguent();
        if (!clau || clau.t === '>>') break;
        if (clau.t === 'kw' && ATURADES.has(clau.v)) {
          lx.p = abans;
          break;
        }
        if (clau.t !== 'nom') continue;
        const abansValor = lx.p;
        const t = lx.seguent();
        if (!t || t.t === '>>') break;
        if (t.t === 'kw' && ATURADES.has(t.v)) {
          lx.p = abansValor;
          break;
        }
        dict.set(clau.v, valor(lx, t, refs, profunditat + 1));
      }
      return dict;
    }
    case 'kw':
      return tok.v === 'true' ? true : tok.v === 'false' ? false : null;
    default:
      return null;
  }
}

/* ── Filtres ───────────────────────────────────────────────────────────── */

function asciiHex(dades) {
  const eixida = [];
  let alt = -1;
  for (const c of dades) {
    if (c === 62) break;
    const v = c >= 48 && c <= 57 ? c - 48 : c >= 65 && c <= 70 ? c - 55 : c >= 97 && c <= 102 ? c - 87 : -1;
    if (v < 0) continue;
    if (alt < 0) alt = v;
    else {
      eixida.push(alt * 16 + v);
      alt = -1;
    }
  }
  if (alt >= 0) eixida.push(alt * 16);
  return Uint8Array.from(eixida);
}

function ascii85(dades) {
  const eixida = [];
  let grup = [];
  const buida = (g) => {
    const v = (((g[0] * 85 + g[1]) * 85 + g[2]) * 85 + g[3]) * 85 + g[4];
    return [Math.floor(v / 16777216) & 0xff, Math.floor(v / 65536) & 0xff, Math.floor(v / 256) & 0xff, v % 256];
  };
  let i = 0;
  while (i < dades.length && esBlanc(dades[i])) i += 1;
  if (dades[i] === 60 && dades[i + 1] === 126) i += 2;
  for (; i < dades.length; i += 1) {
    const c = dades[i];
    if (c === 126) break;
    if (esBlanc(c)) continue;
    if (c === 122 && grup.length === 0) {
      eixida.push(0, 0, 0, 0);
      continue;
    }
    if (c < 33 || c > 117) continue;
    grup.push(c - 33);
    if (grup.length === 5) {
      eixida.push(...buida(grup));
      grup = [];
    }
  }
  if (grup.length > 1) {
    const n = grup.length;
    while (grup.length < 5) grup.push(84);
    eixida.push(...buida(grup).slice(0, n - 1));
  }
  return Uint8Array.from(eixida);
}

/* Marca «endstream» just darrere de la posició p (amb blancs entre mig), o -1. */
function endstreamA(s, p) {
  if (p > s.length) return -1;
  let q = p;
  while (q < s.length && q - p < 32 && esBlanc(s.charCodeAt(q))) q += 1;
  return s.startsWith('endstream', q) ? q : -1;
}

const llista = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

/* ── Matrius i geometria ───────────────────────────────────────────────── */

function mul(m, n) {
  return [
    m[0] * n[0] + m[1] * n[2],
    m[0] * n[1] + m[1] * n[3],
    m[2] * n[0] + m[3] * n[2],
    m[2] * n[1] + m[3] * n[3],
    m[4] * n[0] + m[5] * n[2] + n[4],
    m[4] * n[1] + m[5] * n[3] + n[5]
  ];
}

/* Punt de l'espai de la pàgina vist com es llig la pàgina girada (/Rotate). */
function gira(x, y, rotacio) {
  if (rotacio === 90) return [y, -x];
  if (rotacio === 180) return [-x, -y];
  if (rotacio === 270) return [-y, x];
  return [x, y];
}

/* ── Codificacions i glifs ─────────────────────────────────────────────── */

/* Punts de codi de 0x80-0x9F a Windows-1252; 0 marca els codis buits. */
const CP1252_80 = [
  0x20ac, 0, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0, 0x017d, 0,
  0, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0, 0x017e, 0x0178
];

/* WinAnsiEncoding aproximat: latin1 més els caràcters de Windows-1252. */
const WIN_ANSI = Object.freeze(Array.from({ length: 256 }, (_, c) => {
  if (c < 32 || c === 127) return '';
  if (c >= 0x80 && c < 0xa0) return CP1252_80[c - 0x80] ? String.fromCharCode(CP1252_80[c - 0x80]) : '';
  if (c === 0xa0) return ' ';
  if (c === 0xad) return '-';
  return String.fromCharCode(c);
}));

const NOMS_GLIFS = new Map(Object.entries({
  space: ' ', exclam: '!', quotedbl: '"', numbersign: '#', dollar: '$', percent: '%', ampersand: '&', quotesingle: "'",
  quoteright: '’', quoteleft: '‘', parenleft: '(', parenright: ')', asterisk: '*', plus: '+', comma: ',', hyphen: '-',
  period: '.', slash: '/', zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7',
  eight: '8', nine: '9', colon: ':', semicolon: ';', less: '<', equal: '=', greater: '>', question: '?', at: '@',
  bracketleft: '[', backslash: '\\', bracketright: ']', asciicircum: '^', underscore: '_', grave: '`', braceleft: '{',
  bar: '|', braceright: '}', asciitilde: '~', Euro: '€', endash: '–', emdash: '—', bullet: '•', ellipsis: '…',
  quotedblleft: '“', quotedblright: '”', quotesinglbase: '‚', quotedblbase: '„', guillemotleft: '«', guillemotright: '»',
  exclamdown: '¡', questiondown: '¿', ordfeminine: 'ª', ordmasculine: 'º', degree: '°', periodcentered: '·',
  germandbls: 'ß', multiply: '×', divide: '÷', minus: '−', copyright: '©', registered: '®', trademark: '™', section: '§',
  paragraph: '¶', cent: '¢', sterling: '£', yen: '¥', currency: '¤', nbspace: ' ', nonbreakingspace: ' ', sfthyphen: '',
  softhyphen: '', fi: 'fi', fl: 'fl', ff: 'ff', ffi: 'ffi', ffl: 'ffl', AE: 'Æ', ae: 'æ', OE: 'Œ', oe: 'œ', Oslash: 'Ø',
  oslash: 'ø', dotlessi: 'ı', Lslash: 'Ł', lslash: 'ł'
}));

/* Punts de codi dels diacrítics combinants. */
const ACCENTS = Object.freeze({
  grave: 0x300, acute: 0x301, circumflex: 0x302, tilde: 0x303, dieresis: 0x308, ring: 0x30a, cedilla: 0x327, caron: 0x30c
});

/* Unicode d'un nom de glif (Adobe Glyph List reduïda, uniXXXX, uXXXX[XX], sufixos). */
function unicodeDeGlif(nom) {
  if (typeof nom !== 'string' || nom === '') return null;
  if (NOMS_GLIFS.has(nom)) return NOMS_GLIFS.get(nom);
  let m = /^uni((?:[0-9A-F]{4})+)$/.exec(nom);
  if (m) return m[1].match(/.{4}/g).map((h) => String.fromCharCode(parseInt(h, 16))).join('');
  m = /^u([0-9A-F]{4,6})$/.exec(nom);
  if (m) {
    const cp = parseInt(m[1], 16);
    return cp <= 0x10ffff ? String.fromCodePoint(cp) : null;
  }
  if (/^[A-Za-z]$/.test(nom)) return nom;
  m = /^([A-Za-z])(grave|acute|circumflex|tilde|dieresis|ring|cedilla|caron)$/.exec(nom);
  if (m) return (m[1] + String.fromCharCode(ACCENTS[m[2]])).normalize('NFC');
  const punt = nom.indexOf('.');
  if (punt > 0) return unicodeDeGlif(nom.slice(0, punt));
  if (nom.includes('_')) {
    const parts = nom.split('_').map(unicodeDeGlif);
    return parts.every((p) => p !== null) ? parts.join('') : null;
  }
  return null;
}

/* Amplades de Helvetica (ASCII 32-126, en mil·lèsimes d'em): s'usen per a
   estimar on acaba un tros quan la font no porta /Widths. */
const AMPLADES_HELVETICA = (
  '278 278 355 556 556 889 667 191 333 333 389 584 278 333 278 278 556 556 556 556 556 556 556 556 556 556 '
  + '278 278 584 584 584 556 1015 667 667 722 722 667 611 778 722 278 500 667 556 833 722 778 667 778 722 667 '
  + '611 722 667 944 667 667 611 278 278 278 469 556 333 556 556 500 556 556 278 556 556 222 222 500 222 833 '
  + '556 556 556 556 333 500 278 556 500 722 500 500 500 334 260 334 584'
).split(' ').map(Number);

function ampladaAproximada(caracter, monoespai) {
  if (monoespai) return 0.6;
  const base = String(caracter ?? '').normalize('NFD').charCodeAt(0);
  return (base >= 32 && base <= 126 ? AMPLADES_HELVETICA[base - 32] : 556) / 1000;
}

function utf16(b) {
  if (b.length === 1) return b;
  let r = '';
  for (let i = 0; i + 1 < b.length; i += 2) r += String.fromCharCode((b.charCodeAt(i) << 8) | b.charCodeAt(i + 1));
  return r;
}

function numeroDe(b) {
  let n = 0;
  for (let i = 0; i < b.length; i += 1) n = n * 256 + b.charCodeAt(i);
  return n;
}

/* CMap (ToUnicode o de codificació): codespacerange, bfchar i bfrange (simple i amb matriu). */
function llegixCMap(text) {
  const lx = new Lexer(text);
  const mapa = new Map();
  const rangs = [];
  const finalDeBloc = (t) => !t || t.t === 'kw';
  for (let tok = lx.seguent(); tok; tok = lx.seguent()) {
    if (tok.t !== 'kw') continue;
    if (tok.v === 'begincodespacerange') {
      for (;;) {
        const a = lx.seguent();
        if (finalDeBloc(a)) break;
        const b = lx.seguent();
        if (finalDeBloc(b)) break;
        if (a.t === 'cad' && b.t === 'cad' && a.v.length >= 1 && a.v.length <= 4) rangs.push({ n: a.v.length, lo: numeroDe(a.v), hi: numeroDe(b.v) });
      }
    } else if (tok.v === 'beginbfchar') {
      for (;;) {
        const a = lx.seguent();
        if (finalDeBloc(a)) break;
        const b = lx.seguent();
        if (finalDeBloc(b)) break;
        const u = b.t === 'cad' ? utf16(b.v) : b.t === 'nom' ? unicodeDeGlif(b.v) : null;
        if (a.t === 'cad' && u !== null) mapa.set(numeroDe(a.v), u);
      }
    } else if (tok.v === 'beginbfrange') {
      for (;;) {
        const a = lx.seguent();
        if (finalDeBloc(a)) break;
        const b = lx.seguent();
        const c = lx.seguent();
        if (finalDeBloc(b) || finalDeBloc(c)) break;
        const desti = c.t === '[' ? valor(lx, c, false) : c.t === 'cad' ? c.v : null;
        if (a.t !== 'cad' || b.t !== 'cad' || desti === null) continue;
        const lo = numeroDe(a.v);
        const hi = Math.min(numeroDe(b.v), lo + 65535);
        if (Array.isArray(desti)) {
          desti.forEach((d, k) => {
            if (d instanceof Cadena && lo + k <= hi) mapa.set(lo + k, utf16(d.b));
          });
        } else {
          const base = utf16(desti);
          const darrer = base.charCodeAt(base.length - 1);
          for (let codi = lo; codi <= hi; codi += 1) {
            mapa.set(codi, base === '' ? '' : base.slice(0, -1) + String.fromCharCode((darrer + codi - lo) & 0xffff));
          }
        }
      }
    }
  }
  return { mapa, rangs };
}

function codisSimples(b) {
  const codis = new Array(b.length);
  for (let i = 0; i < b.length; i += 1) codis[i] = b.charCodeAt(i);
  return codis;
}

/* Codis de longitud variable segons els codespacerange; si cap no casa, el més curt. */
function partixCodis(b, rangs) {
  const codis = [];
  const minim = Math.min(...rangs.map((r) => r.n));
  let i = 0;
  while (i < b.length) {
    let codi = 0;
    let trobat = false;
    for (let n = 1; n <= 4 && i + n <= b.length; n += 1) {
      codi = codi * 256 + b.charCodeAt(i + n - 1);
      if (rangs.some((r) => r.n === n && codi >= r.lo && codi <= r.hi)) {
        codis.push(codi);
        i += n;
        trobat = true;
        break;
      }
    }
    if (!trobat) {
      const n = Math.min(minim, b.length - i);
      codis.push(numeroDe(b.slice(i, i + n)));
      i += n;
    }
  }
  return codis;
}

/* Amplades d'una font CID (/W): «c [w1 w2 …]» o «cPrimer cDarrer w». */
function llegixW(w, resol) {
  const amplades = new Map();
  const items = resol(w);
  if (!Array.isArray(items)) return amplades;
  let i = 0;
  while (i < items.length && amplades.size < 1000000) {
    const primer = resol(items[i]);
    const segon = resol(items[i + 1]);
    if (!Number.isInteger(primer)) {
      i += 1;
      continue;
    }
    if (Array.isArray(segon)) {
      segon.forEach((x, k) => {
        const v = resol(x);
        if (Number.isFinite(v)) amplades.set(primer + k, v);
      });
      i += 2;
    } else {
      const amplada = resol(items[i + 2]);
      if (Number.isInteger(segon) && Number.isFinite(amplada)) {
        for (let c = primer; c <= segon && c - primer < 65536; c += 1) amplades.set(c, amplada);
      }
      i += 3;
    }
  }
  return amplades;
}

const FONT_PER_DEFECTE = Object.freeze({
  simple: true,
  codis: codisSimples,
  text: (c) => WIN_ANSI[c] ?? '',
  amplada: (c) => ampladaAproximada(WIN_ANSI[c], false)
});

/* ── Composició de línies ──────────────────────────────────────────────── */

const LLIGADURES = ['ff', 'fi', 'fl', 'ffi', 'ffl', 'st', 'st'];
/* Es construïxen per punt de codi: el guionet discrecional i l'espai
   d'amplada zero s'esborren; les lligadures (U+FB00-FB06) es desfan. */
const INVISIBLES = new RegExp(`[${String.fromCharCode(0xad, 0x200b)}]`, 'g');
const RE_LLIGADURES = new RegExp(`[${String.fromCharCode(0xfb00)}-${String.fromCharCode(0xfb06)}]`, 'g');

function netejaText(t) {
  return t
    .replace(/[\x00-\x08\x0b\x0e-\x1f\x7f]/g, '')
    .replace(/\s/g, ' ')
    .replace(INVISIBLES, '')
    .replace(RE_LLIGADURES, (c) => LLIGADURES[c.charCodeAt(0) - 0xfb00]);
}

function uneixLinia(trossos) {
  let text = '';
  let anterior = null;
  for (const t of trossos) {
    if (anterior && t.text === anterior.text && Math.abs(t.x - anterior.x) < 0.15 * (t.mida || 1)) continue;
    if (anterior && text !== '' && !/\s$/.test(text) && !/^\s/.test(t.text) && t.x - anterior.fiX > FORAT_ESPAI * Math.max(t.mida, anterior.mida)) text += ' ';
    text += t.text;
    anterior = t;
  }
  return text.replace(/\s+/g, ' ').trim();
}

/* Trossos → text: de dalt a baix agrupant per y, i dins de cada línia d'esquerra a dreta. */
function composaLinies(trossos) {
  const ordenats = [...trossos].sort((a, b) => (b.y - a.y) || (a.x - b.x));
  const linies = [];
  for (const t of ordenats) {
    const l = linies[linies.length - 1];
    if (l && Math.abs(l.y - t.y) <= TOLERANCIA_LINIA * (Math.max(l.mida, t.mida) || 1)) {
      l.trossos.push(t);
      l.mida = Math.max(l.mida, t.mida);
    } else {
      linies.push({ y: t.y, mida: t.mida, trossos: [t] });
    }
  }
  return linies.map((l) => uneixLinia(l.trossos.sort((a, b) => a.x - b.x))).filter((l) => l !== '').join('\n');
}

const estatGrafic = () => ({ ctm: IDENTITAT, font: null, mida: 0, tc: 0, tw: 0, th: 1, tl: 0 });

/* ── Lector ────────────────────────────────────────────────────────────── */

class LectorPdf {
  constructor(bytes, inflate, avisa, pressupost = PRESSUPOST_PDF) {
    this.bytes = bytes;
    this.s = binari(bytes);
    this.inflate = typeof inflate === 'function' ? inflate : null;
    this.avisa = avisa;
    this.objectes = new Map();
    this.trailers = [];
    this.fonts = new Map();
    this.glifsPerduts = 0;
    this.operadors = 0;
    this.pressupost = pressupost;
    this.gastat = 0;
    /* Quantes pàgines que encara no s'han llegit usen cada flux de contingut. */
    this.usos = new Map();
  }

  /* Gasta `n` bytes del pressupost del PDF; en passar-se'n, atura la lectura. */
  gasta(n) {
    this.gastat += n;
    if (this.gastat > this.pressupost) throw new PressupostEsgotat();
  }

  /* Recorre el fitxer sencer: objectes indirectes, fluxos i tràilers. */
  primeraPassada() {
    const { s } = this;
    const reObj = /(\d+)\s+(\d+)\s+obj\b/g;
    let m;
    while ((m = reObj.exec(s)) !== null) {
      const num = Number(m[1]);
      const pos = m.index;
      const endobj = s.indexOf('endobj', reObj.lastIndex);
      const lx = new Lexer(s, reObj.lastIndex, endobj < 0 ? s.length : endobj);
      let v = valor(lx, lx.seguent(), true);
      lx.saltaBlancs();
      let seguent = Math.max(lx.p, reObj.lastIndex);
      if (s.startsWith('stream', lx.p)) {
        v = this.flux(v instanceof Map ? v : new Map(), lx.p + 6, pos);
        seguent = v.seguent;
      }
      if (num <= MAX_NUM_OBJECTE) this.objectes.set(num, { pos, valor: v });
      if (v instanceof Flux && v.dict.get('Type') === 'XRef') this.trailers.push({ pos, dict: v.dict });
      reObj.lastIndex = seguent;
    }
    const reTrailer = /trailer\s*<</g;
    while ((m = reTrailer.exec(s)) !== null) {
      const lx = new Lexer(s, m.index + 7);
      const d = valor(lx, lx.seguent(), true);
      if (d instanceof Map) this.trailers.push({ pos: m.index, dict: d });
      reTrailer.lastIndex = Math.max(lx.p, reTrailer.lastIndex);
    }
    this.trailers.sort((a, b) => a.pos - b.pos);
  }

  /* Situa les dades d'un flux: per /Length directa si quadra amb «endstream»; si no, buscant la marca. */
  flux(dict, p, pos) {
    const { s } = this;
    let inici = p;
    if (s.charCodeAt(inici) === 13 && s.charCodeAt(inici + 1) === 10) inici += 2;
    else if (s.charCodeAt(inici) === 10 || s.charCodeAt(inici) === 13) inici += 1;
    const f = new Flux(dict, inici, pos);
    const longitud = dict.get('Length');
    if (Number.isInteger(longitud) && longitud >= 0) {
      const k = endstreamA(s, inici + longitud);
      if (k >= 0) {
        f.fi = inici + longitud;
        f.seguent = k + 9;
        return f;
      }
    }
    const k = s.indexOf('endstream', inici);
    if (k < 0) {
      f.fiCercat = s.length;
      f.seguent = s.length;
      return f;
    }
    let fi = k;
    if (fi > inici && s.charCodeAt(fi - 1) === 10) fi -= 1;
    if (fi > inici && s.charCodeAt(fi - 1) === 13) fi -= 1;
    f.fiCercat = fi;
    f.seguent = k + 9;
    return f;
  }

  resol(v) {
    let x = v;
    for (let i = 0; x instanceof Ref && i < 32; i += 1) x = this.objectes.get(x.num)?.valor ?? null;
    return x instanceof Ref ? null : x;
  }

  dict(v) {
    const x = this.resol(v);
    if (x instanceof Flux) return x.dict;
    return x instanceof Map ? x : null;
  }

  xifrat() {
    if (this.trailers.some((t) => t.dict.has('Encrypt'))) return true;
    for (const { valor: v } of this.objectes.values()) {
      if (v instanceof Map && v.get('Filter') === 'Standard' && v.has('O') && v.has('U')) return true;
    }
    return false;
  }

  /* El text (cadena binària) d'un flux, o null si no es pot descodificar. Es
     descodifica i es converteix una sola vegada: els bytes descomprimits no
     es guarden, només el text, i la conversió gasta del pressupost. */
  textDeFlux(f) {
    if (!f.promesa) {
      f.promesa = this.decodifica(f)
        .then((dades) => {
          if (!dades) return null;
          this.gasta(dades.length);
          return binari(dades);
        })
        .catch((e) => {
          if (esPressupostEsgotat(e)) throw e;
          this.avisa(AVIS.inflate);
          return null;
        });
    }
    return f.promesa;
  }

  /* Compta quantes vegades usen les pàgines cada flux de contingut. */
  comptaUsos(pagines) {
    for (const pagina of pagines) {
      for (const c of llista(this.resol(pagina.get('Contents')))) {
        const f = this.resol(c);
        if (f instanceof Flux) this.usos.set(f, (this.usos.get(f) ?? 0) + 1);
      }
    }
  }

  /* Una pàgina ja ha llegit el flux: si cap altra no l'ha de llegir, se n'allibera el text. */
  deixaAnar(f) {
    const usos = (this.usos.get(f) ?? 1) - 1;
    if (usos > 0) {
      this.usos.set(f, usos);
      return;
    }
    this.usos.delete(f);
    f.promesa = null;
  }

  async decodifica(f) {
    let { fi } = f;
    if (fi < 0) {
      const longitud = this.resol(f.dict.get('Length'));
      if (Number.isInteger(longitud) && longitud >= 0 && endstreamA(this.s, f.inici + longitud) >= 0) fi = f.inici + longitud;
      else {
        fi = f.fiCercat;
        if (longitud != null) this.avisa(AVIS.longitud);
      }
    }
    let dades = this.bytes.subarray(f.inici, Math.max(f.inici, Math.min(fi, this.bytes.length)));
    const parametres = llista(this.resol(f.dict.get('DecodeParms'))).map((p) => this.dict(p));
    if (parametres.some((p) => Number(this.resol(p?.get('Predictor'))) > 1)) {
      this.avisa(AVIS.predictor);
      return null;
    }
    for (const filtre of llista(this.resol(f.dict.get('Filter')))) {
      dades = await this.aplicaFiltre(this.resol(filtre), dades);
      if (!dades) return null;
      // Cada eixida d'un filtre (la d'inflate, fins a 64 MiB) gasta del pressupost del PDF.
      this.gasta(dades.length);
    }
    return dades;
  }

  async aplicaFiltre(nom, dades) {
    if (nom === 'FlateDecode' || nom === 'Fl') {
      if (!this.inflate) {
        this.avisa(AVIS.senseInflate);
        return null;
      }
      try {
        const eixida = aBytes(await this.inflate(dades));
        if (eixida) return eixida;
      } catch {
        /* l'avís va just ací baix */
      }
      this.avisa(AVIS.inflate);
      return null;
    }
    if (nom === 'ASCIIHexDecode' || nom === 'AHx') return asciiHex(dades);
    if (nom === 'ASCII85Decode' || nom === 'A85') return ascii85(dades);
    this.avisa(`Filtre de flux no suportat: ${typeof nom === 'string' ? `/${nom}` : 'desconegut'}.`);
    return null;
  }

  /* Els objectes dels fluxos /ObjStm; una definició directa posterior continua guanyant. */
  async carregaFluxosObjectes() {
    const fluxos = [...this.objectes.values()]
      .map((o) => o.valor)
      .filter((v) => v instanceof Flux && v.dict.get('Type') === 'ObjStm')
      .sort((a, b) => a.pos - b.pos);
    for (const f of fluxos) await this.llegixObjStm(f);
  }

  async llegixObjStm(f) {
    const s = await this.textDeFlux(f);
    // Els objectes que porta queden a this.objectes: el text del flux ja no cal.
    f.promesa = null;
    if (s === null) return;
    const n = this.resol(f.dict.get('N'));
    const primer = this.resol(f.dict.get('First'));
    if (!Number.isInteger(n) || !Number.isInteger(primer) || primer < 0 || primer > s.length) {
      this.avisa(AVIS.objStm);
      return;
    }
    const capcalera = new Lexer(s, 0, primer);
    const parells = [];
    for (let i = 0; i < n && i < 100000; i += 1) {
      const a = capcalera.seguent();
      const b = capcalera.seguent();
      if (a?.t !== 'num' || b?.t !== 'num') break;
      parells.push([a.v, primer + b.v]);
    }
    if (parells.length < n) this.avisa(AVIS.objStm);
    parells.forEach(([num, inici], i) => {
      if (!Number.isInteger(num) || num > MAX_NUM_OBJECTE || inici >= s.length) return;
      const seguent = parells[i + 1]?.[1];
      const lx = new Lexer(s, inici, seguent > inici ? seguent : s.length);
      const v = valor(lx, lx.seguent(), true);
      const actual = this.objectes.get(num);
      if (!actual || actual.pos <= f.pos) this.objectes.set(num, { pos: f.pos, valor: v });
    });
  }

  heretat(d, clau) {
    let node = d;
    for (let i = 0; node && i < MAX_PROFUNDITAT; i += 1) {
      if (node.has(clau)) return node.get(clau);
      node = this.dict(node.get('Parent'));
    }
    return undefined;
  }

  /* Pàgines en l'ordre de l'arbre /Pages /Kids; si no es pot, les /Page en l'ordre del fitxer. */
  pagines() {
    let arrel = null;
    for (let k = this.trailers.length - 1; k >= 0 && !arrel; k -= 1) {
      const d = this.dict(this.trailers[k].dict.get('Root'));
      if (d?.has('Pages')) arrel = d;
    }
    if (!arrel) {
      let millor = null;
      for (const o of this.objectes.values()) {
        if (o.valor instanceof Map && o.valor.get('Type') === 'Catalog' && o.valor.has('Pages') && (!millor || o.pos >= millor.pos)) millor = o;
      }
      arrel = millor?.valor ?? null;
    }
    const pagines = [];
    const visitats = new Set();
    const recorre = (node, profunditat) => {
      const d = this.dict(node);
      if (!d || visitats.has(d) || profunditat > MAX_PROFUNDITAT || pagines.length >= MAX_PAGINES) return;
      visitats.add(d);
      const fills = this.resol(d.get('Kids'));
      if (Array.isArray(fills)) {
        for (const fill of fills) recorre(fill, profunditat + 1);
      } else if (d.get('Type') !== 'Pages') {
        pagines.push(d);
      }
    };
    if (arrel) recorre(arrel.get('Pages'), 0);
    if (pagines.length) return pagines;
    const soltes = [...this.objectes.values()]
      .filter((o) => o.valor instanceof Map && o.valor.get('Type') === 'Page')
      .sort((a, b) => a.pos - b.pos)
      .map((o) => o.valor);
    if (soltes.length) this.avisa(AVIS.arbre);
    return soltes;
  }

  async textPagina(pagina) {
    const recursos = this.dict(this.heretat(pagina, 'Resources'));
    const gir = this.resol(this.heretat(pagina, 'Rotate'));
    const rotacio = Number.isInteger(gir) ? ((gir % 360) + 360) % 360 : 0;
    const parts = [];
    for (const c of llista(this.resol(pagina.get('Contents')))) {
      const f = this.resol(c);
      if (!(f instanceof Flux)) continue;
      const text = await this.textDeFlux(f);
      if (text !== null) parts.push(text);
      this.deixaAnar(f);
    }
    const trossos = [];
    const afig = (x0, y0, x1, y1, mida, text) => {
      const net = netejaText(text);
      if (net.trim() === '') return;
      const [x, y] = gira(x0, y0, rotacio);
      const [fiX] = gira(x1, y1, rotacio);
      trossos.push({ x, y, fiX, mida, text: net });
    };
    await this.interpreta(parts.join('\n'), recursos, estatGrafic(), afig, 0, new Set());
    return composaLinies(trossos);
  }

  async font(recursos, nom) {
    const d = this.dict(this.dict(recursos?.get('Font'))?.get(nom));
    if (!d) {
      this.avisa(AVIS.font);
      return FONT_PER_DEFECTE;
    }
    if (!this.fonts.has(d)) {
      // Una font que no es pot preparar és la per defecte; un PDF que passa del pressupost, no: para.
      this.fonts.set(d, this.preparaFont(d).catch((e) => {
        if (esPressupostEsgotat(e)) throw e;
        return FONT_PER_DEFECTE;
      }));
    }
    return this.fonts.get(d);
  }

  async preparaFont(d) {
    const subtipus = this.resol(d.get('Subtype'));
    let cmap = null;
    const toUnicode = this.resol(d.get('ToUnicode'));
    if (toUnicode instanceof Flux) {
      const text = await this.textDeFlux(toUnicode);
      if (text !== null) cmap = llegixCMap(text);
    }
    const mapa = cmap?.mapa.size ? cmap.mapa : null;
    if (subtipus === 'Type0') return this.fontComposta(d, mapa, cmap?.rangs ?? []);
    return this.fontSimple(d, subtipus, mapa);
  }

  async fontComposta(d, mapa, rangsToUnicode) {
    const codificacio = this.resol(d.get('Encoding'));
    let rangs = [{ n: 2, lo: 0, hi: 0xffff }];
    let ucs2 = false;
    if (codificacio instanceof Flux) {
      const text = await this.textDeFlux(codificacio);
      const cmap = text !== null ? llegixCMap(text) : null;
      if (cmap?.rangs.length) rangs = cmap.rangs;
    } else if (typeof codificacio === 'string') {
      ucs2 = /UCS2|UTF16/.test(codificacio);
      if (!/^Identity-[HV]$/.test(codificacio) && rangsToUnicode.length) rangs = rangsToUnicode;
    }
    const descendent = this.dict(llista(this.resol(d.get('DescendantFonts')))[0]);
    const dw = this.resol(descendent?.get('DW'));
    const perDefecte = Number.isFinite(dw) ? dw : 1000;
    const amplades = llegixW(descendent?.get('W'), (v) => this.resol(v));
    return {
      simple: false,
      codis: (b) => partixCodis(b, rangs),
      text: (c) => (mapa?.has(c) ? mapa.get(c) : ucs2 ? String.fromCharCode(c) : null),
      amplada: (c) => (amplades.get(c) ?? perDefecte) / 1000
    };
  }

  fontSimple(d, subtipus, mapa) {
    const codificacio = this.codificacioSimple(this.resol(d.get('Encoding')));
    const primer = this.resol(d.get('FirstChar'));
    const amplades = this.resol(d.get('Widths'));
    const falta = this.resol(this.dict(d.get('FontDescriptor'))?.get('MissingWidth'));
    const matriu = subtipus === 'Type3' ? this.resol(d.get('FontMatrix')) : null;
    const escala0 = Array.isArray(matriu) ? this.resol(matriu[0]) : null;
    const escala = Number.isFinite(escala0) ? escala0 : 0.001;
    const monoespai = /courier|mono/i.test(String(this.resol(d.get('BaseFont')) ?? ''));
    const text = (c) => (mapa?.has(c) ? mapa.get(c) : codificacio[c] ?? '');
    return {
      simple: true,
      codis: codisSimples,
      text,
      amplada: (c) => {
        const w = Array.isArray(amplades) && Number.isInteger(primer) ? this.resol(amplades[c - primer]) : null;
        if (Number.isFinite(w)) return w * escala;
        if (Number.isFinite(falta) && falta > 0) return falta * escala;
        return ampladaAproximada(text(c), monoespai);
      }
    };
  }

  codificacioSimple(codificacio) {
    const taula = WIN_ANSI.slice();
    if (!(codificacio instanceof Map)) return taula;
    const diferencies = this.resol(codificacio.get('Differences'));
    if (!Array.isArray(diferencies)) return taula;
    let codi = 0;
    for (const item of diferencies) {
      const v = this.resol(item);
      if (typeof v === 'number') codi = v;
      else if (typeof v === 'string') {
        const u = Number.isInteger(codi) && codi >= 0 && codi < 256 ? unicodeDeGlif(v) : null;
        if (u !== null) taula[codi] = u;
        codi += 1;
      }
    }
    return taula;
  }

  /* Mostra cadenes (Tj, TJ, ', ") i en deixa el tros a la pàgina; torna la matriu de text avançada. */
  mostra(elements, gs, tmInicial, afig) {
    const font = gs.font ?? FONT_PER_DEFECTE;
    let tm = tmInicial;
    const inici = mul(tm, gs.ctm);
    let text = '';
    const avanca = (tx) => {
      tm = [tm[0], tm[1], tm[2], tm[3], tm[4] + tx * tm[0], tm[5] + tx * tm[1]];
    };
    for (const el of elements) {
      if (el instanceof Cadena) {
        for (const codi of font.codis(el.b)) {
          const t = font.text(codi);
          if (t === null) this.glifsPerduts += 1;
          else text += t;
          const espai = font.simple && codi === 32 ? gs.tw : 0;
          avanca((font.amplada(codi) * gs.mida + gs.tc + espai) * gs.th);
        }
      } else if (typeof el === 'number' && Number.isFinite(el)) {
        if (el < LLINDAR_TJ && text !== '' && !/\s$/.test(text)) text += ' ';
        avanca((-el / 1000) * gs.mida * gs.th);
      }
    }
    const fi = mul(tm, gs.ctm);
    afig(inici[4], inici[5], fi[4], fi[5], Math.abs(gs.mida) * Math.hypot(inici[2], inici[3]), text);
    return tm;
  }

  async formulari(nom, recursos, gs, afig, profunditat, pila) {
    const x = this.resol(this.dict(recursos?.get('XObject'))?.get(nom));
    if (!(x instanceof Flux) || this.resol(x.dict.get('Subtype')) !== 'Form' || profunditat >= MAX_FORMULARIS || pila.has(x)) return;
    const text = await this.textDeFlux(x);
    if (text === null) return;
    const m = this.resol(x.dict.get('Matrix'));
    const matriu = Array.isArray(m) && m.length === 6 && m.every((v) => Number.isFinite(v)) ? m : IDENTITAT;
    pila.add(x);
    await this.interpreta(text, this.dict(x.dict.get('Resources')) ?? recursos, { ...gs, ctm: mul(matriu, gs.ctm) }, afig, profunditat + 1, pila);
    pila.delete(x);
  }

  async interpreta(codi, recursos, gsInicial, afig, profunditat, pila) {
    // Cada lectura gasta: un flux compartit per mil pàgines es llig mil vegades.
    this.gasta(codi.length);
    const lx = new Lexer(codi);
    const ops = [];
    const pilaGs = [];
    let gs = { ...gsInicial };
    let tm = IDENTITAT;
    let tlm = IDENTITAT;
    const salta = (tx, ty) => {
      tlm = mul([1, 0, 0, 1, tx, ty], tlm);
      tm = tlm;
    };
    const nums = (k) => {
      const a = ops.slice(-k);
      return a.length === k && a.every((v) => typeof v === 'number' && Number.isFinite(v)) ? a : null;
    };
    const darrer = () => ops[ops.length - 1];
    for (let tok = lx.seguent(); tok; tok = lx.seguent()) {
      if (tok.t !== 'kw') {
        ops.push(valor(lx, tok, false));
        if (ops.length > 256) ops.shift();
        continue;
      }
      this.operadors += 1;
      if (this.operadors > MAX_OPERADORS) {
        this.avisa(AVIS.operadors);
        return;
      }
      switch (tok.v) {
        case 'q':
          if (pilaGs.length < MAX_PROFUNDITAT) pilaGs.push({ ...gs });
          break;
        case 'Q':
          if (pilaGs.length) gs = pilaGs.pop();
          break;
        case 'cm': {
          const m = nums(6);
          if (m) gs.ctm = mul(m, gs.ctm);
          break;
        }
        case 'BT':
          tm = IDENTITAT;
          tlm = IDENTITAT;
          break;
        case 'Tf': {
          const [nom, mida] = ops.slice(-2);
          if (typeof nom === 'string') gs.font = await this.font(recursos, nom);
          if (Number.isFinite(mida)) gs.mida = mida;
          break;
        }
        case 'Tc':
        case 'Tw':
        case 'Tz':
        case 'TL': {
          const a = nums(1);
          if (!a) break;
          if (tok.v === 'Tc') gs.tc = a[0];
          else if (tok.v === 'Tw') gs.tw = a[0];
          else if (tok.v === 'Tz') gs.th = a[0] / 100;
          else gs.tl = a[0];
          break;
        }
        case 'Td':
        case 'TD': {
          const a = nums(2);
          if (!a) break;
          if (tok.v === 'TD') gs.tl = -a[1];
          salta(a[0], a[1]);
          break;
        }
        case 'Tm': {
          const a = nums(6);
          if (a) {
            tlm = a;
            tm = a;
          }
          break;
        }
        case 'T*':
          salta(0, -gs.tl);
          break;
        case 'Tj':
          if (darrer() instanceof Cadena) tm = this.mostra([darrer()], gs, tm, afig);
          break;
        case "'":
          salta(0, -gs.tl);
          if (darrer() instanceof Cadena) tm = this.mostra([darrer()], gs, tm, afig);
          break;
        case '"': {
          const [aw, ac, cadena] = ops.slice(-3);
          if (Number.isFinite(aw) && Number.isFinite(ac)) {
            gs.tw = aw;
            gs.tc = ac;
          }
          salta(0, -gs.tl);
          if (cadena instanceof Cadena) tm = this.mostra([cadena], gs, tm, afig);
          break;
        }
        case 'TJ':
          if (Array.isArray(darrer())) tm = this.mostra(darrer(), gs, tm, afig);
          break;
        case 'Do':
          if (typeof darrer() === 'string') await this.formulari(darrer(), recursos, gs, afig, profunditat, pila);
          break;
        case 'BI':
          lx.saltaImatge();
          break;
        default:
          break;
      }
      ops.length = 0;
    }
  }
}

/**
 * Extrau el text d'un PDF generat per màquina. Mai llança: els problemes
 * van a `avisos` (en valencià, sense repetir-se). Si el PDF està xifrat,
 * torna { xifrat: true } sense intentar res.
 * @param {Uint8Array|ArrayBuffer} bytes
 * @param {{ inflate?: null|((b: Uint8Array) => Promise<Uint8Array>), pressupost?: number }} [opcions]
 *   inflate: descompressor zlib; per defecte inflateDisponible(), que usa
 *   DecompressionStream si n'hi ha i, si no (Safari 16.0–16.3), el motor pur.
 *   Amb null, els fluxos comprimits queden buits i se n'avisa.
 *   pressupost: bytes que el PDF pot gastar entre descompressions, conversions
 *   a text i lectures (PRESSUPOST_PDF per defecte). En passar-se'n, cap
 *   pàgina i l'avís PDF_MASSA_GRAN.
 * @returns {Promise<{ pagines: string[], text: string, xifrat: boolean, avisos: string[] }>}
 */
export async function extreuTextPdf(bytes, { inflate = inflateDisponible(), pressupost = PRESSUPOST_PDF } = {}) {
  const avisos = new Set();
  const avisa = (missatge) => avisos.add(missatge);
  const pagines = [];
  let xifrat = false;
  const limit = Number.isFinite(pressupost) && pressupost >= 0 ? pressupost : PRESSUPOST_PDF;
  try {
    const dades = aBytes(bytes);
    if (!dades) avisa(AVIS.entrada);
    else {
      if (!esPdf(dades)) avisa(AVIS.capcalera);
      const lector = new LectorPdf(dades, inflate, avisa, limit);
      lector.primeraPassada();
      if (lector.objectes.size === 0) avisa(AVIS.senseObjectes);
      else if (lector.xifrat()) {
        xifrat = true;
        avisa(AVIS.xifrat);
      } else {
        await lector.carregaFluxosObjectes();
        const llistaPagines = lector.pagines();
        if (!llistaPagines.length) avisa(AVIS.sensePagines);
        lector.comptaUsos(llistaPagines);
        for (const pagina of llistaPagines) pagines.push(await lector.textPagina(pagina));
        if (lector.glifsPerduts > 0) avisa(AVIS.glifs);
        const buides = pagines.map((t, i) => (t === '' ? i + 1 : 0)).filter(Boolean);
        if (buides.length) avisa(`Pàgines sense text (potser escanejades): ${buides.join(', ')}.`);
      }
    }
  } catch (e) {
    if (esPressupostEsgotat(e)) {
      // Cap pàgina a mitges: sense text, la factura queda pendent de revisar a mà.
      pagines.length = 0;
      avisa(PDF_MASSA_GRAN);
    } else avisa(`Error inesperat llegint el PDF: ${e?.message ?? String(e)}`);
  }
  return { pagines, text: pagines.join('\n\n'), xifrat, avisos: [...avisos] };
}
