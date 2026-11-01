// @vitest-environment node
/* P1-07 (deute G-03, Onada 2, 261101) · senseNiatsLineal: el contracte de senseNiats, provat.
   Tres implementacions han de dir el mateix, byte a byte: (1) l'expressió d'abans de G-03
   (d7aa77350^), que és l'especificació i és quadràtica; (2) la versió de d7aa77350, que ja era
   lineal, copiada ací tal qual com a oracle congelat (no s'importa al producte); (3) el mòdul.
   Un contrast diferencial determinista de milers d'entrades hostils (peces d'XML trencades,
   mutacions i cadenes denses de caràcters) amb els noms dels tres cridants de gestor.js; les
   vores, una per una; i la fita de temps per a les famílies d'~1 MiB que fan quadràtiques
   l'expressió o una versió que tornara a buscar des de cada «<» (cap supera 1 s; una versió
   quadràtica hi tarda de 3 a 40 s). */
import { describe, expect, test } from 'vitest';
import { senseNiatsLineal } from './senseNiatsLineal.js';

/* ── L'oracle congelat: la versió de d7aa77350 (gestor.js), sense canviar-ne res ─────────── */
function creaLector(text) {
  let des = Infinity;
  let fi = -1;
  return {
    fi(posicio) {
      if (posicio < des || (fi >= 0 && posicio > fi)) {
        des = posicio;
        fi = text.indexOf('>', posicio);
      }
      return fi;
    }
  };
}
function etiquetaDe(text, lector, des, nom, valida) {
  for (let i = text.indexOf('<', des); i >= 0; i = text.indexOf('<', i + 1)) {
    nom.lastIndex = i + 1;
    const trobat = nom.exec(text);
    if (!trobat) continue;
    const final = nom.lastIndex;
    const fi = lector.fi(final);
    if (fi < 0) return null;
    if (valida(final, fi)) return { inici: i, nom: trobat[1], final, fi };
  }
  return null;
}
const noSAutotanca = (text) => (final, fi) => fi === final || text[fi - 1] !== '/';
const nomDElement = (noms, banderes = '') => new RegExp(`((?:[\\w.-]+:)?(?:${noms}))(?=[\\s>])`, `y${banderes}`);
function creaTancaments(text) {
  const perNom = new Map();
  for (const trobat of text.matchAll(/<\/([\w.:-]+)\s*>/g)) {
    if (!perNom.has(trobat[1])) perNom.set(trobat[1], { llista: [], punter: 0 });
    perNom.get(trobat[1]).llista.push([trobat.index, trobat.index + trobat[0].length]);
  }
  return (nom, des) => {
    const del = perNom.get(nom);
    if (!del) return null;
    while (del.punter < del.llista.length && del.llista[del.punter][0] < des) del.punter += 1;
    return del.llista[del.punter] ?? null;
  };
}
function oracle(tros, noms) {
  const lector = creaLector(tros);
  const nom = nomDElement(noms);
  const valida = noSAutotanca(tros);
  const tancament = creaTancaments(tros);
  let eixida = '';
  let copiat = 0;
  for (let trobat = etiquetaDe(tros, lector, 0, nom, valida); trobat;) {
    const tancat = tancament(trobat.nom, trobat.fi + 1);
    if (!tancat) {
      trobat = etiquetaDe(tros, lector, trobat.inici + 1, nom, valida);
      continue;
    }
    eixida += tros.slice(copiat, trobat.inici);
    copiat = tancat[1];
    trobat = etiquetaDe(tros, lector, tancat[1], nom, valida);
  }
  return eixida + tros.slice(copiat);
}

/* L'especificació: l'expressió d'abans de G-03 (només per a entrades menudes: és quadràtica). */
const especificacio = (tros, noms) => tros.replace(
  new RegExp(`<((?:[\\w.-]+:)?(?:${noms}))(?:\\s[^>]*[^/>])?\\s*>[\\s\\S]*?<\\/\\1\\s*>`, 'g'), '');

/* Els noms que passen els tres cridants de gestor.js (NIATS_ATOM, el canal RSS i NIATS_RSS). */
const NIATS_RSS = 'source|description|encoded|content|summary';
const NOMS_CRIDANTS = Object.freeze(['entry|source|content|summary|subtitle|title|rights', `image|textInput|textinput|${NIATS_RSS}`, NIATS_RSS]);

/* ── El contrast diferencial ──────────────────────────────────────────────── */
const NOMS = ['source', 'description', 'encoded', 'content', 'summary', 'entry', 'subtitle', 'title', 'rights', 'image', 'textInput',
  'textinput', 'TEXTINPUT', 'Source', 'sourcex', 'xsource', 'link', 'item', 'p', 'img', 'sour', 'contents'];
const PREFIXOS = ['', '', '', 'x:', 'content:', 'atom:', 'a.b-c:', ':', 'a:b:', 'x_1:', '-:', '.:'];
const FINALS_OBERTURA = ['>', '>', '>', ' >', '\n>', '\t a="b">', ' a=">">', ' a="</source>">', ' a=\'<title>\'>', ' />', '/>', ' / >',
  ' a/ >', ' a="b"/>', '', ' ', 'x>', ':>', '/', ' a="<', ' >', ' >', ' \n/>', '\r\n>', ' <'];
const FINALS_TANCAMENT = ['>', '>', '>', ' >', '  \n >', '', ' x>', '/>', ' >', '\t>', ':>'];
const SOLTS = ['<', '>', '/', '"', "'", '<![CDATA[', ']]>', '<!--', '-->', 'text', ' ', '\n', '&lt;source&gt;', '<<', '</', '< source>',
  '</ source>', '<?xml?>', '<!DOCTYPE x>', 'ü', '\u{1F600}', '<a href="x">', '</a>', '<img src="a.png">'];
const MUTACIONS = '<>/ :x"\n-.';
/* Peces menudes per als noms d'una o dues lletres: l'estructura hi apareix molt sovint. */
const DENSES = ['<a>', '</a>', '<b>', '</b>', '<ab>', '</ab>', '<x:a>', '</x:a>', '<a ', '<b ', '/>', '>', '<', '</', 'a', 'b', ':', ' ', '"', '\n', '-', '.'];

/* Un generador determinista (LCG): la mateixa llavor, les mateixes entrades a cada passada. */
function generador(llavor) {
  let estat = llavor >>> 0;
  const n = (fins) => {
    estat = (Math.imul(estat, 1664525) + 1013904223) >>> 0;
    return estat % fins;
  };
  const tria = (llista) => llista[n(llista.length)];
  const peca = () => {
    const r = n(10);
    if (r < 4) return `<${tria(PREFIXOS)}${tria(NOMS)}${tria(FINALS_OBERTURA)}`;
    if (r < 8) return `</${tria(PREFIXOS)}${tria(NOMS)}${tria(FINALS_TANCAMENT)}`;
    return tria(SOLTS);
  };
  const muta = (text) => {
    let t = text;
    for (let k = n(6); k > 0; k -= 1) {
      const p = n(t.length + 1);
      const r = n(3);
      if (r === 0) t = t.slice(0, p) + tria([...MUTACIONS]) + t.slice(p);
      else if (r === 1) t = t.slice(0, p) + t.slice(p + 1);
      else if (p > 0 && p < t.length) t = t.slice(0, p - 1) + t[p] + t[p - 1] + t.slice(p + 1);
    }
    return t;
  };
  return {
    perPeces: () => {
      const t = Array.from({ length: n(60) }, peca).join('');
      return n(3) === 0 ? muta(t) : t;
    },
    densa: () => {
      const t = Array.from({ length: n(30) }, () => tria(DENSES)).join('');
      return n(2) === 0 ? muta(t) : t;
    }
  };
}

describe('P1-07 · senseNiatsLineal diu el mateix que l’expressió d’abans i que la versió de d7aa77350', () => {
  const MOSTRES = 2500;

  test.each(NOMS_CRIDANTS)('peces d’XML trencades i mutades, %s', (noms) => {
    const { perPeces } = generador(20261101 + noms.length);
    let lleva = 0;
    for (let k = 0; k < MOSTRES; k += 1) {
      const entrada = perPeces();
      const esperat = especificacio(entrada, noms);
      expect(oracle(entrada, noms), entrada).toBe(esperat);
      const eixida = senseNiatsLineal(entrada, noms);
      expect(eixida, entrada).toBe(esperat);
      if (eixida !== entrada) lleva += 1;
    }
    /* El contrast mossega: una bona part de les entrades lleva algun element. */
    expect(lleva).toBeGreaterThan(MOSTRES / 10);
  });

  test.each(['a|b', 'ab|a', 'a|ab'])('cadenes denses de caràcters amb noms d’una o dues lletres, %s', (noms) => {
    const { densa } = generador(1101 + noms.length * 7);
    let lleva = 0;
    for (let k = 0; k < MOSTRES; k += 1) {
      const entrada = densa();
      const esperat = especificacio(entrada, noms);
      expect(oracle(entrada, noms), entrada).toBe(esperat);
      const eixida = senseNiatsLineal(entrada, noms);
      expect(eixida, entrada).toBe(esperat);
      if (eixida !== entrada) lleva += 1;
    }
    expect(lleva).toBeGreaterThan(MOSTRES / 10);
  });
});

describe('P1-07 · les vores del contracte, una per una', () => {
  const RSS = NOMS_CRIDANTS[1];
  const CASOS = Object.freeze([
    ['un element sencer, fora', '<source>a</source>b', 'b'],
    ['amb un prefix, i el tancament amb el mateix nom sencer', '<x:source>a</x:source>b', 'b'],
    ['un tancament sense el prefix no tanca', '<x:source>a</source>b', '<x:source>a</source>b'],
    ['dos prefixos o un prefix buit, no és cap obertura', '<a:b:source>a</a:b:source><:source>b</:source>', '<a:b:source>a</a:b:source><:source>b</:source>'],
    ['distingix majúscules', '<Source>a</Source><textInput>b</textInput>c', '<Source>a</Source>c'],
    ['un nom més llarg no és el nom', '<sourcex>a</sourcex><source:>b</source:><source-x>c</source-x>', '<sourcex>a</sourcex><source:>b</source:><source-x>c</source-x>'],
    ['<nom/> i <nom a="b"/> s’autotanquen; <nom / >, no', '<source/>a</source>|<source a="b"/>c</source>|<source / >d</source>e', '<source/>a</source>|<source a="b"/>c</source>|e'],
    ['l’obertura acaba en el primer «>», també entre cometes', '<source a=">">x</source>y<source a="/>">z</source>', 'y<source a="/>">z</source>'],
    ['un tancament de dins de l’obertura no compta', '<source a="</source>">x</source>y', 'y'],
    ['fins al primer tancament, sense niar', '<source><source>a</source>b</source>c', 'b</source>c'],
    ['una obertura sense tancament es queda, i la cerca seguix', '<source>a<content>b</content>c', '<source>ac'],
    ['el tancament admet espais abans del «>»; </ nom> no és cap tancament', '<source>a</source \n\t>b<source>c</ source>d', 'b<source>c</ source>d'],
    ['CDATA no té res d’especial', '<description><![CDATA[</description>]]></description>z', ']]></description>z'],
    ['sense cap «>» més, res més', '<source>x</source><content a', '<content a'],
    ['res a llevar, el mateix text', 'cap etiqueta & <p>cap nom</p>', 'cap etiqueta & <p>cap nom</p>']
  ]);

  test.each(CASOS)('%s', (_, entrada, esperat) => {
    expect(senseNiatsLineal(entrada, RSS)).toBe(esperat);
    expect(especificacio(entrada, RSS)).toBe(esperat);
    expect(oracle(entrada, RSS)).toBe(esperat);
  });

  test('els noms són literals: un patró, un «:», un «.» o un nom buit llancen TypeError', () => {
    for (const noms of ['a|b.c', 'a||b', '(a)', 'x:source', 'a|*', '']) {
      expect(() => senseNiatsLineal('<a>x</a>', noms), noms).toThrow(TypeError);
    }
    expect(senseNiatsLineal('<a-b>x</a-b>y<a_c>z</a_c>', 'a-b|a_c')).toBe('y');
  });
});

/* G-03 (CWE-1333) · Famílies d'~1 MiB. Les quatre primeres fan quadràtica l'expressió d'abans; F1, F2,
   F3 i F4 fan quadràtica una versió que, per a cada obertura, tornara a buscar el «>» (F2, F3) o el
   tancament (F1, F4) des del principi: de 3 a 40 s en un Mac M. Lineal, cap no passa de ~70 ms, ni
   en fred; la fita d'1 s deixa marge per a una màquina carregada i continua lluny del quadràtic. */
describe('P1-07 · el recorregut és lineal de veres: cap entrada d’~1 MiB no passa d’1 s', () => {
  const MIDA = 1024 * 1024;
  const fins = (unitat, mida = MIDA) => unitat.repeat(Math.ceil(mida / unitat.length)).slice(0, mida);
  const FAMILIES = Object.freeze([
    ['F1 · obertures sense tancament', fins('<a>'), 'a'],
    ['F2 · molts «<» que compartixen un sol «>»', `${fins('<a ', MIDA - 1)}>`, 'a'],
    ['F3 · obertures sense cap «>»', fins('<a '), 'a'],
    ['F4 · tots els tancaments abans de les obertures', fins('</a>', MIDA / 2) + fins('<a>', MIDA / 2), 'a'],
    ['F5 · moltes extraccions seguides', fins('<a>x</a>'), 'a'],
    ['F6 · obertures amb prefix i atributs, sense tancar', fins('<x:source a="1">'), NOMS_CRIDANTS[1]],
    ['F7 · CDATA sense «]]>» i continguts sense tancar', fins('<![CDATA[<description>'), NOMS_CRIDANTS[1]],
    ['F8 · un «<» i cap «>»', `<${'x'.repeat(MIDA - 1)}`, NOMS_CRIDANTS[0]],
    ['F9 · tancaments de noms distints', Array.from({ length: 120000 }, (_, i) => `</n${i}>`).join(''), NOMS_CRIDANTS[0]]
  ]);

  test.each(FAMILIES)('%s', (nom, entrada, noms) => {
    expect(entrada.length, nom).toBeGreaterThanOrEqual(MIDA);
    const inici = performance.now();
    const eixida = senseNiatsLineal(entrada, noms);
    expect(performance.now() - inici, nom).toBeLessThan(1000);
    /* I diu el mateix que l'oracle congelat (lineal també). */
    expect(eixida === oracle(entrada, noms), nom).toBe(true);
  });
});
