// @vitest-environment node
/* La variant panoràmica 16:9 · EXCEPCIÓ a la regla 1:1 de Pedra Seca (§8),
   autoritzada pel Mestre el 261003 i LIMITADA a les imatges de les targetes
   del Lector de notícies (src/apps/lector) i al seu espècimen del catàleg.
   · Ús exclusiu: fora del Lector, de l'espècimen i de la peça que la
     implementa (agrupacio.jsx), cap fitxer de producció de src/ passa la
     variant; i fora del full i de la peça, ningú escriu la classe (l'espècimen
     només la nomena en el text que la documenta).
   · El full: tot aspect-ratio que no és 1:1 als dos fulls de Pedra Seca penja
     de .sdp-panoramica i és 16:9 (o el reset de la rajola); la imatge i el
     marcador hi són, en la Revista i en les Targetes. I la forma que pinta
     el navegador, no només la declarada: la miniatura de la Revista fixa les
     dues mides (el seu aspect-ratio és inert), de manera que es comprova el
     quocient; les Targetes deixen l'alçada en auto i hi mana l'aspect-ratio.
   · ESLint sobre els fitxers nous de l'excepció.
   Els comentaris no compten: només el codi. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const PS = 'src/components/PedraSeca';
const FULL = `${PS}/catalegColleccio.css`;
const PECA = `${PS}/organismes/agrupacio.jsx`;
const LECTOR = 'src/apps/lector/';
const ESPECIMEN = 'src/sections/disseny/cataleg/detalls/EspecimenImatgeApaisada.jsx';
const NOUS = [ESPECIMEN, ESPECIMEN.replace(/\.jsx$/, '.test.jsx'), `${PS}/qualitat.panoramica.test.js`];

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else fitxers.push(ruta);
  }
  return fitxers.sort();
}

/* El codi de producció de src/: sense proves ni fixtures, i sense la Wiki compilada (dades, no codi que pinte). */
const PRODUCCIO = fitxersDe('src').filter((f) => /\.(?:jsx?|mjs|css)$/.test(f)
  && !/\.test\.[cm]?jsx?$/.test(f) && !f.includes('/__fixtures__/') && f !== 'src/data/wikiManifest.js');
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const usaClasse = (codi) => /(?<![\w-])sdp-panoramica(?![\w-])/.test(codi);
const usaVariant = (codi) => /(?<![\w-])panoramica(?![\w-])/.test(codi);
const quiUsa = (prova) => PRODUCCIO.filter((f) => prova(senseComentaris(llig(f))));

describe('ús exclusiu: el Lector i el seu espècimen', () => {
  test('les sondes: la guarda caça cada forma de passar la variant o d’escriure la classe', () => {
    for (const sonda of ['<GraellaArticles panoramica />', '<LlistaArticles\n  panoramica={true}', 'const props = { panoramica: true };', '{...{ panoramica }}']) {
      expect(usaVariant(sonda), sonda).toBe(true);
    }
    for (const sonda of ['className="sdp-panoramica"', "'.sdp-panoramica'", '<ul class="x sdp-panoramica">']) expect(usaClasse(sonda), sonda).toBe(true);
    for (const sonda of ['sdp-panoramica', 'panoràmica', 'panoramicament', 'panoramica-x']) expect(usaVariant(sonda), sonda).toBe(false);
    expect(usaClasse('sdp-panoramica-ampla')).toBe(false);
    expect(senseComentaris('/* panoramica */\n// panoramica\nconst a = 1;')).not.toMatch(/panoramica/);
  });

  test('la classe .sdp-panoramica només la definix el full, només la posa la peça i només la nomena l’espècimen', () => {
    expect(PRODUCCIO.length).toBeGreaterThan(100);
    expect(quiUsa(usaClasse)).toEqual([FULL, PECA, ESPECIMEN].sort());
    /* L'espècimen la documenta en text; el className el posa la variant, mai a mà. */
    expect(/className=["'{][^>]*sdp-panoramica/.test(llig(ESPECIMEN))).toBe(false);
  });

  /* Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, «no inventar targetes») · Les
     notícies del Lector ja són UniversalCard (1:1, la targeta de sempre) i no passen la variant.
     L'excepció continua limitada al Lector i a l'espècimen: al Lector, ara, cap fitxer. */
  test('la variant només la passen el Lector (ara cap fitxer seu) i l’espècimen del catàleg', () => {
    const usuaris = quiUsa(usaVariant);
    expect(usuaris.filter((f) => !f.startsWith(LECTOR))).toEqual([PECA, ESPECIMEN].sort());
    expect(usuaris.filter((f) => f.startsWith(LECTOR))).toEqual([]);
  });
});

/* Les regles d'un full: [selectors, cos], amb els comentaris fora. */
const regles = (css) => [...senseComentaris(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, selectors, cos]) => [selectors.split(',').map((s) => s.trim()), cos]);
const proporcio = (cos) => cos.match(/aspect-ratio:\s*([^;]+);/)?.[1].trim().replace(/\s+/g, ' ') ?? null;
/* Les declaracions d'un cos de regla: { propietat: valor }, amb els espais normalitzats. */
const declaracions = (cos) => Object.fromEntries([...cos.matchAll(/([\w-]+)\s*:\s*([^;]+?)\s*(?:;|$)/g)]
  .map(([, propietat, valor]) => [propietat, valor.replace(/\s+/g, ' ')]));

/* El que guanya per a un element dins de .sdp-panoramica: la seua regla base (pecesApps.css i
   després el full, tots dos dins de @layer components) i, damunt, la de la variant, que hi té
   més especificitat. */
function guanyen(fulls, element) {
  const perSelector = new Map();
  for (const css of fulls) {
    for (const [selectors, cos] of regles(css)) {
      for (const selector of selectors) perSelector.set(selector, { ...perSelector.get(selector), ...declaracions(cos) });
    }
  }
  return { ...perSelector.get(`.${element}`), ...perSelector.get(`.sdp-panoramica .${element}`) };
}

/* La forma que pinta el navegador, no la que es declara. Amb les dues mides fixades,
   l'aspect-ratio no hi fa res i mana el quocient; amb una mida en auto, mana l'aspect-ratio;
   amb 100% × 100%, la forma és la del contenidor. */
function formaPintada({ 'inline-size': ample = 'auto', 'block-size': alt = 'auto', 'aspect-ratio': declarada = 'auto' }) {
  if (ample === 'auto' || alt === 'auto') return declarada;
  if (ample === '100%' && alt === '100%') return 'la del contenidor';
  if (ample === alt) return '1 / 1';
  const quocient = ample.match(/^calc\((.+) \* (\d+) \/ (\d+)\)$/);
  return quocient?.[1] === alt ? `${quocient[2]} / ${quocient[3]}` : `${ample} × ${alt}`;
}

describe('el full: el 16:9 penja només de .sdp-panoramica', () => {
  const DOS_FULLS = [`${PS}/pecesApps.css`, FULL];
  /* Els marcs que fixen la forma; la imatge i el marcador hi van a 100% × 100%. */
  const MARCS = { Revista: 'sdp-llista-articles__quadrat', Targetes: 'sdp-rajola__media' };
  const FILLS = ['sdp-rajola__imatge', 'sdp-marca-article', 'sdp-marca-article__imatge'];

  test('als dos fulls de Pedra Seca, tota proporció que no és 1:1 és de la variant (16:9, o el reset de la rajola)', () => {
    for (const full of DOS_FULLS) {
      for (const [selectors, cos] of regles(llig(full))) {
        const valor = proporcio(cos);
        if (valor === null || valor === '1 / 1') continue;
        expect(['16 / 9', 'auto'], `${full}: ${selectors.join(', ')}`).toContain(valor);
        for (const selector of selectors) expect(selector, `${full}: ${selector}`).toMatch(/\.sdp-panoramica\b/);
      }
    }
    expect(regles(llig(`${PS}/pecesApps.css`)).flatMap(([selectors]) => selectors).filter((s) => s.includes('sdp-panoramica'))).toEqual([]);
  });

  test('les declaracions: la imatge i el marcador, a la Revista i a les Targetes, declaren 16:9; la rajola deixa de ser quadrada', () => {
    const perSelector = new Map(regles(llig(FULL)).flatMap(([selectors, cos]) => selectors.map((s) => [s, cos])));
    for (const selector of ['.sdp-panoramica .sdp-rajola__media', '.sdp-panoramica .sdp-rajola__imatge', '.sdp-panoramica .sdp-llista-articles__quadrat',
      '.sdp-panoramica .sdp-marca-article', '.sdp-panoramica .sdp-marca-article__imatge']) {
      expect(proporcio(perSelector.get(selector) ?? ''), selector).toBe('16 / 9');
    }
    expect(proporcio(perSelector.get('.sdp-panoramica .sdp-rajola'))).toBe('auto');
  });

  test('les sondes: la forma es calcula com la pinta el navegador, no com es declara', () => {
    const touch = 'var(--sdp-touch)';
    expect(formaPintada({ 'inline-size': `calc(${touch} * 16 / 9)`, 'block-size': touch, 'aspect-ratio': '1 / 1' })).toBe('16 / 9');
    expect(formaPintada({ 'inline-size': `calc(${touch} * 2)`, 'block-size': touch, 'aspect-ratio': '16 / 9' })).not.toBe('16 / 9');
    expect(formaPintada({ 'inline-size': touch, 'block-size': touch, 'aspect-ratio': '16 / 9' })).toBe('1 / 1');
    expect(formaPintada({ 'inline-size': '100%', 'block-size': 'auto', 'aspect-ratio': '16 / 9' })).toBe('16 / 9');
    expect(formaPintada({ 'block-size': touch, 'aspect-ratio': '16 / 9' })).toBe('16 / 9');
    expect(formaPintada({ 'inline-size': '100%', 'block-size': '100%', 'aspect-ratio': '1 / 1' })).toBe('la del contenidor');
    /* Sobre el full de veres, les mutacions que la comprovació de les declaracions deixa passar:
       la miniatura de la Revista a 2:1, el seu inline-size llevat (torna el --sdp-touch de la
       regla base: un quadrat) i el block-size: auto de les Targetes llevat (torna el 100%). */
    const [base, full] = DOS_FULLS.map(llig);
    const muta = (de, a) => {
      expect(full).toContain(de);
      return [base, full.replace(de, a)];
    };
    const ampleRevista = 'inline-size: calc(var(--sdp-touch) * 16 / 9); ';
    expect(formaPintada(guanyen(muta(ampleRevista, 'inline-size: calc(var(--sdp-touch) * 2); '), MARCS.Revista))).not.toBe('16 / 9');
    expect(formaPintada(guanyen(muta(ampleRevista, ''), MARCS.Revista))).toBe('1 / 1');
    expect(formaPintada(guanyen(muta('inline-size: 100%; block-size: auto; aspect-ratio: 16 / 9;', 'inline-size: 100%; aspect-ratio: 16 / 9;'), MARCS.Targetes))).toBe('la del contenidor');
  });

  test('la forma pintada: el marc de la Revista i el de les Targetes fan 16:9, i la imatge i el marcador l’omplin', () => {
    const fulls = DOS_FULLS.map(llig);
    for (const [vista, marc] of Object.entries(MARCS)) expect(formaPintada(guanyen(fulls, marc)), vista).toBe('16 / 9');
    for (const fill of FILLS) expect(formaPintada(guanyen(fulls, fill)), fill).toBe('la del contenidor');
    /* La Revista fixa les dues mides (l'aspect-ratio hi és inert): l'alçada del quadrat de sempre i l'amplada que la fa 16:9. */
    expect(guanyen(fulls, MARCS.Revista)).toMatchObject({ 'block-size': 'var(--sdp-touch)', 'inline-size': 'calc(var(--sdp-touch) * 16 / 9)' });
    /* Les Targetes deixen l'alçada en auto: ací l'aspect-ratio és el que mana. */
    expect(guanyen(fulls, MARCS.Targetes)).toMatchObject({ 'inline-size': '100%', 'block-size': 'auto', 'aspect-ratio': '16 / 9' });
  });

  test('el full ho documenta com a excepció del Mestre, limitada al Lector', () => {
    const full = llig(FULL);
    for (const text of ['EXCEPCIÓ a la regla 1:1 (Pedra Seca §8)', 'Autoritzada pel Mestre el 261003', 'src/apps/lector']) expect(full).toContain(text);
    expect(llig(PECA)).toContain('EXCEPCIÓ a la regla 1:1 de Pedra Seca');
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, als fitxers nous de l’excepció', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(NOUS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(NOUS.length);
    expect(missatges).toEqual([]);
  }, 120000);
});
