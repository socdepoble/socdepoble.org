// @vitest-environment node
/* La llista de paraules de la frase de recuperació (P1-12 / IDEA-19, pas 4 del
   disseny final, disseny_final_e2ee.md §5.2-§5.3; DM-2: pendent de la revisió
   del Mestre). Es mira: que són exactament 2.048, en NFC, ordenades i fixades
   per l'empremta SHA-256 de la capçalera; totes les regles de §5.3 amb
   implementacions pròpies d'esta prova (plegat, Levenshtein, clau fonètica,
   plurals), no les del mòdul; l'anada i tornada paraules ↔ índexs escrites de
   moltes maneres; el plegat tolerant (accents, majúscules, ela geminada); i
   que el generador fa servir només el getRandomValues injectat, sense biaix
   (χ² en 10⁵ frases, i un control que demostra que la prova veu un biaix). */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  BITS_FRASE, BITS_PER_PARAULA, EMPREMTA_LLISTA, LLETRES_PREFIX, NOMBRE_PARAULES, PARAULES, PARAULES_PER_FRASE,
  REVISADA_PEL_MESTRE, VERSIO_LLISTA, generaFrase, generaIndexs, indexDeParaula, indexsDeFrase, paraulesDeIndexs,
  plega, suggeriments, trossejaFrase
} from './xifratXatParaules.js';

const cripto = globalThis.crypto;
const FONT = readFileSync(new URL('./xifratXatParaules.js', import.meta.url), 'utf8');

/* Plegat propi de la prova: les paraules de la llista no porten ela geminada (ho mira la forma). */
const plegaProva = (paraula) => paraula.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const PLEGATS = PARAULES.map(plegaProva);
const FORMA = /^[a-zàèéíïòóúüç]+$/;

/* La clau fonètica de la porta, escrita de nou: b/v, tx/ix/x, ss/s/z, ç/s i c davant e/i,
   g/j davant e/i (i tg/tj), h muda, qu/c/k, -ig final com a x. */
function clauFonetica(paraula) {
  let s = plegaProva(paraula.normalize('NFC').toLowerCase().replace(/ç/g, 's')).replace(/h/g, '');
  s = s.replace(/ig$/, 'X');
  s = s.replace(/qu(?=[ei])/g, 'K').replace(/q/g, 'K');
  s = s.replace(/gu(?=[ei])/g, 'G');
  s = s.replace(/tg(?=[ei])|tj/g, 'J');
  s = s.replace(/g(?=[ei])/g, 'J').replace(/j/g, 'J').replace(/g/g, 'G');
  s = s.replace(/c(?=[ei])/g, 'S').replace(/[ck]/g, 'K');
  s = s.replace(/tx|ix|x/g, 'X');
  s = s.replace(/ss|s|z/g, 'S');
  return s.replace(/[bv]/g, 'B');
}

/* Distància de Levenshtein clàssica (programació dinàmica, dues files). */
function levenshtein(a, b) {
  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const actual = [i];
    for (let j = 1; j <= b.length; j += 1) {
      actual[j] = Math.min(anterior[j] + 1, actual[j - 1] + 1, anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    anterior = actual;
  }
  return anterior[b.length];
}

/* Les formes de plural d'una paraula plegada (masculí, femení amb els canvis ortogràfics, -os, -ns, -ig). */
function plurals(f) {
  const p = new Set([`${f}s`, `${f}os`, `${f}ns`, `${f}es`]);
  if (f.endsWith('a')) {
    const arrel = f.slice(0, -1);
    p.add(`${arrel}es`);
    if (arrel.endsWith('c')) { p.add(`${arrel.slice(0, -1)}ques`); p.add(`${arrel.slice(0, -1)}ces`); }
    if (arrel.endsWith('g')) p.add(`${arrel.slice(0, -1)}gues`);
    if (arrel.endsWith('j')) p.add(`${arrel.slice(0, -1)}ges`);
  }
  if (f.endsWith('ig')) { p.add(`${f.slice(0, -2)}jos`); p.add(`${f.slice(0, -2)}tjos`); }
  return p;
}

/* Les mateixes vetades que la porta (plegades): doble sentit, marques, anglicismes, tristesa,
   religió, política, homògrafs amb diacrític i noms que la plataforma ja fa servir. */
const VETADES = new Set(`
figa polla pardal cigala palla fava bleda mona coca porra pebrot marieta golfa porro gandula curt gras negre
senyor forca jou cort campana creu missa ermita bandera senyera rei reina corona mall rave api test lego vespa
mango puma cola golf bar jersei futbol xiprer tomba mort sang guerra fam preso bala caca escopeta trampa
parany veri bruixa dimoni diable infern pecat verge bisbe capella monja frare papa llei vot jutge soldat
iaia iaio poble mestre porta mur tractor segell epoca falla pastera navalla fuet feix truita cella mora sol
dona net nou deu bota pel soc son mes mon cap clau pols coure llima mata coma pujol front foca balena
alqueria pau custodia regent regna victoria suprem matriu membre truja xuclar cuca lotus zodiac gimcana casual
frase paraula copiar targeta xifrat
`.trim().split(/\s+/));

/* Un getRandomValues fals que omple amb uns valors donats i apunta les crides. */
function criptoFals(valors) {
  const crides = [];
  return {
    crides,
    getRandomValues(vector) {
      crides.push(vector);
      vector.set(valors.slice(0, vector.length));
      return vector;
    }
  };
}

/* Un generador determinista (xorshift32) per al control esbiaixat; mai per a frases de veres. */
function xorshift(llavor) {
  let x = llavor >>> 0;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    return x;
  };
}

/* χ² d'uns comptatges contra la uniforme, i els límits per a 2.047 graus de llibertat amb
   z = ±6 (Wilson-Hilferty): una prova sana cau fora una vegada en uns mil milions. */
function khiQuadrat(comptes, total) {
  const esperat = total / comptes.length;
  let suma = 0;
  for (const c of comptes) suma += ((c - esperat) ** 2) / esperat;
  return suma;
}
const GRAUS = NOMBRE_PARAULES - 1;
const limitKhi = (z) => GRAUS * (1 - 2 / (9 * GRAUS) + z * Math.sqrt(2 / (9 * GRAUS))) ** 3;
const KHI_MIN = limitKhi(-6);
const KHI_MAX = limitKhi(6);

function errorDe(funcio) {
  try { funcio(); } catch (error) { return error; }
  return null;
}

describe('la llista v1, pendent de la revisió del Mestre', () => {
  test('són exactament 2.048 paraules (11 bits), congelades, en NFC i només amb lletres', () => {
    expect(PARAULES).toHaveLength(2048);
    expect(NOMBRE_PARAULES).toBe(2048);
    expect(2 ** BITS_PER_PARAULA).toBe(NOMBRE_PARAULES);
    expect(BITS_FRASE).toBe(PARAULES_PER_FRASE * BITS_PER_PARAULA);
    expect(BITS_FRASE).toBe(66);
    expect(Object.isFrozen(PARAULES)).toBe(true);
    for (const paraula of PARAULES) {
      expect(paraula, paraula).toBe(paraula.normalize('NFC'));
      // Sense ela geminada, apòstrof, guionet, espais ni majúscules (noms propis).
      expect(FORMA.test(paraula), paraula).toBe(true);
    }
  });

  test('porta la marca de pendent: res no s’activa sense el Mestre (DM-2)', () => {
    expect(REVISADA_PEL_MESTRE).toBe(false);
    expect(VERSIO_LLISTA).toBe(1);
    expect(FONT).toContain('PENDENT DE LA REVISIÓ DEL MESTRE');
  });

  test('l’empremta SHA-256 fixa la llista i és a la capçalera del mòdul', async () => {
    const resum = await cripto.subtle.digest('SHA-256', new TextEncoder().encode(`${PARAULES.join('\n')}\n`));
    const hex = Buffer.from(resum).toString('hex');
    expect(hex).toBe(EMPREMTA_LLISTA);
    expect(FONT.slice(0, FONT.indexOf('export const'))).toContain(hex);
  });

  test('l’ordre és el del plegat, estrictament creixent: l’índex és la posició', () => {
    for (let i = 1; i < PLEGATS.length; i += 1) expect(PLEGATS[i - 1] < PLEGATS[i], `${PARAULES[i - 1]} · ${PARAULES[i]}`).toBe(true);
  });
});

describe('les regles de §5.3', () => {
  test('de 3 a 8 lletres i úniques després de plegar; el plegat del mòdul coincidix', () => {
    for (const [i, f] of PLEGATS.entries()) {
      expect(f.length >= 3 && f.length <= 8, PARAULES[i]).toBe(true);
      expect(plega(PARAULES[i])).toBe(f);
    }
    expect(new Set(PLEGATS).size).toBe(2048);
  });

  test('prefix únic de 4 lletres, o la paraula sencera si en té 3, que no comença cap altra', () => {
    const claus = PLEGATS.map((f) => (f.length === 3 ? f : f.slice(0, LLETRES_PREFIX)));
    expect(LLETRES_PREFIX).toBe(4);
    expect(new Set(claus).size).toBe(2048);
    const curtes = PLEGATS.filter((f) => f.length === 3);
    expect(curtes.length).toBeGreaterThan(0);
    for (const curta of curtes) {
      expect(PLEGATS.filter((f) => f !== curta && f.startsWith(curta)), curta).toEqual([]);
    }
  });

  test('Levenshtein ≥ 2 entre qualsevol parella, després de plegar', () => {
    expect([levenshtein('vaca', 'baca'), levenshtein('pera', 'pedra'), levenshtein('casa', 'camp'), levenshtein('', 'eco')])
      .toEqual([1, 1, 2, 3]);
    const perLlargaria = new Map();
    for (const f of PLEGATS) perLlargaria.set(f.length, [...(perLlargaria.get(f.length) ?? []), f]);
    const properes = [];
    for (const [n, grup] of perLlargaria) {
      // Amb dues lletres o més de diferència, la distància ja és ≥ 2.
      const veines = [...grup, ...(perLlargaria.get(n + 1) ?? [])];
      for (let i = 0; i < grup.length; i += 1) {
        for (let j = i + 1; j < veines.length; j += 1) {
          if (levenshtein(grup[i], veines[j]) < 2) properes.push(`${grup[i]}~${veines[j]}`);
        }
      }
    }
    expect(properes).toEqual([]);
  });

  test('cap parella sona igual quan es dicta (clau fonètica única)', () => {
    // La clau sí que ajunta el que sona igual: si no, la prova no miraria res.
    for (const [a, b] of [['vaca', 'baca'], ['caixa', 'catxa'], ['cassola', 'casola'], ['plaça', 'plassa'],
      ['gelat', 'jelat'], ['hort', 'ort'], ['cera', 'sera'], ['platja', 'plaja'], ['roig', 'roix'], ['zona', 'sona']]) {
      expect(clauFonetica(a), `${a} · ${b}`).toBe(clauFonetica(b));
    }
    expect(clauFonetica('vaca')).not.toBe(clauFonetica('vara'));
    const vistes = new Map();
    const iguals = [];
    for (const paraula of PARAULES) {
      const clau = clauFonetica(paraula);
      if (vistes.has(clau)) iguals.push(`${vistes.get(clau)}≈${paraula}`);
      vistes.set(clau, paraula);
    }
    expect(iguals).toEqual([]);
  });

  test('cap entrada és el plural d’una altra', () => {
    const totes = new Set(PLEGATS);
    expect(plurals('vaca').has('vaques') && plurals('placa').has('places') && plurals('peix').has('peixos')).toBe(true);
    const trobats = [];
    for (const f of PLEGATS) for (const plural of plurals(f)) if (totes.has(plural)) trobats.push(`${f}→${plural}`);
    expect(trobats).toEqual([]);
  });

  test('res amb l’arrel vetada per a la plataforma (és el Mas) ni cap paraula vetada', () => {
    expect(PLEGATS.filter((f) => f.startsWith('mas'))).toEqual([]);
    expect(PLEGATS.filter((f) => VETADES.has(f))).toEqual([]);
    expect(FONT.toLowerCase()).not.toMatch(/\bmas+i+a\b/);
  });
});

describe('anada i tornada paraules ↔ índexs', () => {
  test('cada paraula torna el seu índex: normativa, sense accents, en majúscules o amb 4 lletres', () => {
    for (const [i, paraula] of PARAULES.entries()) {
      const f = PLEGATS[i];
      expect(indexDeParaula(paraula)).toBe(i);
      expect(indexDeParaula(f)).toBe(i);
      expect(indexDeParaula(paraula.toUpperCase())).toBe(i);
      expect(indexDeParaula(f.length === 3 ? f : f.slice(0, LLETRES_PREFIX))).toBe(i);
    }
  });

  test('mil frases a l’atzar tornen igual, escrites de moltes maneres', () => {
    for (let n = 0; n < 1000; n += 1) {
      const { indexs, paraules } = generaFrase(cripto);
      expect(paraules).toEqual(paraulesDeIndexs(indexs));
      const curtes = indexs.map((i) => (PLEGATS[i].length === 3 ? PLEGATS[i] : PLEGATS[i].slice(0, 4)));
      const maneres = [
        paraules.join(' '),
        paraules.join(', ').toUpperCase(),
        paraules.map((p, i) => `${i + 1}. ${p}`).join('\n'),
        indexs.map((i) => PLEGATS[i]).join('  \t'),
        curtes.join(' '),
        paraules.join(' ').normalize('NFD')
      ];
      for (const text of maneres) expect(indexsDeFrase(text), text).toEqual(indexs);
    }
  });

  test('paraulesDeIndexs només accepta sis enters de 0 a 2.047', () => {
    expect(paraulesDeIndexs([0, 1, 2, 2045, 2046, 2047])).toEqual([PARAULES[0], PARAULES[1], PARAULES[2], ...PARAULES.slice(-3)]);
    expect(paraulesDeIndexs(Uint16Array.of(5, 4, 3, 2, 1, 0))).toHaveLength(6);
    for (const dolent of [[0, 0, 0, 0, 0, 2048], [-1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1.5], [0, 0, 0, 0, 0, '3'],
      [0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], null, 'abcdef', [0, 0, 0, 0, 0, Number.NaN]]) {
      expect(errorDe(() => paraulesDeIndexs(dolent))?.codi, JSON.stringify(dolent)).toBe('INDEXS_INVALIDS');
    }
  });
});

describe('plegat tolerant de l’entrada (§5.3, §5.4)', () => {
  test('sense accents, en minúscules, la ç i la dièresi plegades, també en NFD', () => {
    expect(plega('CAMÍ')).toBe('cami');
    expect(plega('Creïlla')).toBe('creilla');
    expect(plega('Plaça')).toBe('placa');
    expect(plega('ÀNEC')).toBe('anec');
    expect(plega('camí'.normalize('NFD'))).toBe('cami');
    expect(indexDeParaula('creilla')).toBe(indexDeParaula('creïlla'));
    expect(indexDeParaula('CREÏ')).toBe(indexDeParaula('creïlla'));
  });

  test('l’ela geminada escrita de qualsevol manera és «ll»; el guionet no l’ajunta', () => {
    // La ŀ precomposta ja porta la primera ela: «ceŀla».
    for (const escrita of ['cel·la', 'CEL·LA', 'ceŀla', 'CEĿLA', 'cel.la', 'cel•la', 'cel∙la', 'cel⋅la', 'cel・la', 'cel‧la']) {
      expect(plega(escrita), escrita).toBe('cella');
    }
    expect(plega('cel-la')).toBe('cel-la');
    // Qui escriu una «ll» de la llista com si fóra geminada, l'encerta igual.
    expect(indexDeParaula('caval·l')).toBe(indexDeParaula('cavall'));
    expect(indexDeParaula('CAVAĿL')).toBe(indexDeParaula('cavall'));
  });

  test('amplada completa, cometes i punts al voltant no canvien res', () => {
    expect(plega('ＣＡＭＰ')).toBe('camp');
    expect(indexDeParaula(' «Camp». ')).toBe(indexDeParaula('camp'));
    expect(trossejaFrase('1) camp, 2) casa\n3-hort')).toEqual(['camp', 'casa', 'hort']);
  });
});

describe('errors amb codi estable', () => {
  const sis = paraulesDeIndexs([10, 20, 30, 40, 50, 60]);

  test('frase que no és un text, o amb 5 o 7 paraules', () => {
    expect(errorDe(() => indexsDeFrase(42))?.codi).toBe('FRASE_INVALIDA');
    expect(errorDe(() => trossejaFrase(null))?.codi).toBe('FRASE_INVALIDA');
    expect(errorDe(() => indexsDeFrase(sis.slice(0, 5).join(' ')))?.codi).toBe('FRASE_LLARGARIA');
    expect(errorDe(() => indexsDeFrase([...sis, sis[0]].join(' ')))?.codi).toBe('FRASE_LLARGARIA');
    expect(errorDe(() => indexsDeFrase(''))?.codi).toBe('FRASE_LLARGARIA');
  });

  test('una paraula que no és de la llista diu la posició; menys de 4 lletres no endevina', () => {
    const fora = [...sis];
    fora[3] = 'qqqq';
    const error = errorDe(() => indexsDeFrase(fora.join(' ')));
    expect(error?.codi).toBe('PARAULA_DESCONEGUDA');
    expect(error?.posicio).toBe(3);
    const llarga = PLEGATS.find((f) => f.length > 4 && !PLEGATS.includes(f.slice(0, 3)));
    expect(indexDeParaula(llarga.slice(0, 3))).toBe(-1);
    expect(indexDeParaula(llarga.slice(0, 2))).toBe(-1);
    for (const dolent of [null, undefined, 7, '', '¿?', '  ']) expect(indexDeParaula(dolent)).toBe(-1);
  });
});

describe('autocompletat amb el prefix únic', () => {
  test('4 lletres (o la paraula sencera si en té 3) donen una sola paraula', () => {
    for (const [i, f] of PLEGATS.entries()) {
      expect(suggeriments(f.length === 3 ? f : f.slice(0, 4), 10)).toEqual([PARAULES[i]]);
    }
  });

  test('amb menys lletres, unes quantes que hi comencen; buit o res, cap', () => {
    const ca = suggeriments('CA', 5);
    expect(ca.length).toBe(5);
    for (const p of ca) expect(plegaProva(p).startsWith('ca')).toBe(true);
    expect(suggeriments('')).toEqual([]);
    expect(suggeriments('zzzz')).toEqual([]);
    expect(suggeriments('ca', 0)).toEqual([]);
  });
});

describe('generació sense biaix (§5.2)', () => {
  test('un sol getRandomValues de 6 × 16 bits del cripto injectat, amb la màscara d’11 bits', () => {
    const fals = criptoFals([0x0000, 0x07ff, 0x0800, 0xffff, 0x1234, 0xf800]);
    expect(generaIndexs(fals)).toEqual([0, 2047, 0, 2047, 0x234, 0]);
    expect(fals.crides).toHaveLength(1);
    expect(fals.crides[0]).toBeInstanceOf(Uint16Array);
    expect(fals.crides[0]).toHaveLength(6);
    // Les mostres no es queden a la memòria del vector que s'ha passat.
    expect([...fals.crides[0]]).toEqual([0, 0, 0, 0, 0, 0]);
    expect(generaFrase(criptoFals([1, 2, 3, 4, 5, 6])).paraules).toEqual(paraulesDeIndexs([1, 2, 3, 4, 5, 6]));
  });

  test('sense un cripto de veres no genera res, i el mòdul no en pren cap de global', () => {
    for (const dolent of [undefined, null, {}, { getRandomValues: 1 }]) {
      expect(errorDe(() => generaIndexs(dolent))?.codi).toBe('CRIPTO_ABSENT');
    }
    expect(FONT).not.toMatch(/Math\.random/);
    expect(FONT).not.toMatch(/(globalThis|window|self)\.crypto/);
  });

  test('uniformitat χ² en 10⁵ frases: cada posició, el conjunt i cada bit', () => {
    const N = 100000;
    const perPosicio = Array.from({ length: PARAULES_PER_FRASE }, () => new Uint32Array(NOMBRE_PARAULES));
    const conjunt = new Uint32Array(NOMBRE_PARAULES);
    const bits = new Uint32Array(BITS_PER_PARAULA);
    for (let n = 0; n < N; n += 1) {
      const indexs = generaIndexs(cripto);
      for (let p = 0; p < PARAULES_PER_FRASE; p += 1) {
        const i = indexs[p];
        perPosicio[p][i] += 1;
        conjunt[i] += 1;
        for (let b = 0; b < BITS_PER_PARAULA; b += 1) bits[b] += (i >> b) & 1;
      }
    }
    for (const comptes of perPosicio) {
      const khi = khiQuadrat(comptes, N);
      expect(khi).toBeGreaterThan(KHI_MIN);
      expect(khi).toBeLessThan(KHI_MAX);
    }
    const khiConjunt = khiQuadrat(conjunt, N * PARAULES_PER_FRASE);
    expect(khiConjunt).toBeGreaterThan(KHI_MIN);
    expect(khiConjunt).toBeLessThan(KHI_MAX);
    const total = N * PARAULES_PER_FRASE;
    const sigma = Math.sqrt(total * 0.25);
    for (const uns of bits) expect(Math.abs(uns - total / 2)).toBeLessThan(6 * sigma);
  });

  test('la mateixa prova sí que veu un generador esbiaixat (mòdul de 3.072)', () => {
    const seguent = xorshift(0x5eed1234);
    const esbiaixat = { getRandomValues: (v) => { for (let k = 0; k < v.length; k += 1) v[k] = seguent() % 3072; return v; } };
    const comptes = new Uint32Array(NOMBRE_PARAULES);
    const N = 100000;
    for (let n = 0; n < N; n += 1) comptes[generaIndexs(esbiaixat)[0]] += 1;
    expect(khiQuadrat(comptes, N)).toBeGreaterThan(KHI_MAX * 4);
  });
});
