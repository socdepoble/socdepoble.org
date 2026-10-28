// @vitest-environment node
/* P1-67 (Mestre, 261028; captura 261028_1650_produccio_tipografia_sidebar_vs_xat.png;
   pla 261028_1526, Bloc H) · Unificació tipogràfica de la barra i dels menús.
   (1) Les llistes del xat i les dues llistes secundàries de fora (el calaix
       d'identitats i les carpetes dels Ajustos del Workspace) heretaven la
       prosa fluida de ul (base.css, @layer legacy: --sdp-fluid-cos, 20px
       des d'una arrel de 1024px). Fan 16px, --sdp-text-small, la mida de la
       barra principal: mai més gran, mai menys. El menú d'opcions del xat
       (.sdp-xat-menu) també: al missatge penja de l'ol de les bombolles.
   (2) SemiCondensed (87.5%) a totes les barres pel token --sdp-font-barra,
       i als rètols de la llista de converses i dels menús del xat.
   jsdom no resol la cascada ni pinta: es comproven les regles escrites, amb
   la capa que les embolcalla i l'ordre del full, i la mida es calcula des
   dels tokens. Cada guarda es prova també contra una còpia literal de les
   regles d'abans del torn: si no les detectara, no guardaria res. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();

/** Regles fulla, en l'ordre del full, amb les @-regles que les embolcallen. */
function regles(css) {
  const eixida = [];
  const pila = [];
  let buf = '';
  for (const caracter of senseComentaris(css)) {
    if (caracter === '{') {
      pila.push(net(buf));
      buf = '';
    } else if (caracter === '}') {
      const preludi = pila.pop();
      if (preludi && !preludi.startsWith('@')) {
        eixida.push({ selectors: preludi.split(',').map(net), cos: net(buf), context: pila.filter((p) => p.startsWith('@')), ordre: eixida.length });
      }
      buf = '';
    } else if (caracter === ';' && (pila.length === 0 || pila[pila.length - 1].startsWith('@'))) {
      buf = '';
    } else {
      buf += caracter;
    }
  }
  return eixida;
}

const declaracions = (cos) => cos.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
  const dos = d.indexOf(':');
  return [d.slice(0, dos).trim(), d.slice(dos + 1).trim()];
});
const valorDe = (regla, propietat) => declaracions(regla.cos).filter(([p]) => p === propietat).map(([, v]) => v).pop();
/** El selector és la classe sola o l'últim compost d'un descendent. */
const nomena = (regla, classe) => regla.selectors.some((s) => s === classe || s.endsWith(` ${classe}`));
/** Especificitat (classes, atributs i pseudoclasses) dels selectors d'esta prova. */
const pes = (selector) => (selector.replace(/:where\([^)]*\)/g, '').match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) || []).length;

function fullsCss(dir) {
  return readdirSync(dir).flatMap((nom) => {
    const abs = join(dir, nom);
    if (statSync(abs).isDirectory()) return fullsCss(abs);
    return nom.endsWith('.css') ? [abs] : [];
  });
}

const MODULES = llig('src/css/modules.css');
const BASE = llig('src/css/base.css');
const INDEX = senseComentaris(llig('src/css/index.css'));
const TOKENS = senseComentaris(llig('src/css/tokens.css'));
const token = (nom) => TOKENS.match(new RegExp(`${nom}\\s*:\\s*([^;]+);`))?.[1].trim();

/* Els contenidors de menú (ul) i les files que en prenen la lletra amb
   `font: inherit`. */
const LLISTES = ['.sdp-xat-llista', '.sdp-xat-filtres-cerca', '.sdp-xat-ajustos__targeta', '.sdp-xat-menu', '.sdp-calaix-identitats', '.sdp-workspace-settings__carpetes'];
const FILES = ['.sdp-xat-fila', '.sdp-xat-opcio', '.sdp-xat-opcio-accio', '.sdp-xat-filtres-cerca__fila', '.sdp-xat-ajustos__fila', '.sdp-xat-menu__item', '.sdp-calaix-identitats__item'];
/* Els rètols en SemiCondensed: noms i resums de la llista de converses i les
   etiquetes dels menús del xat. L'hora i les inicials de l'avatar, no. */
const RETOLS = ['.sdp-xat-fila__nom', '.sdp-xat-fila__previa', '.sdp-xat-opcio__titol', '.sdp-xat-opcio-accio', '.sdp-xat-filtres-cerca__nom', '.sdp-xat-ajustos__etiqueta'];
const NO_ESTRETS = ['.sdp-xat-fila__hora', '.sdp-xat-llista', '.sdp-xat-missatges'];

/** (1) Mida: cada llista fa --sdp-text-small a components; cap fila no la canvia. */
function auditaMides(css) {
  const fallades = [];
  const totes = regles(css);
  for (const llista of LLISTES) {
    const mides = totes.filter((r) => r.selectors.includes(llista) && valorDe(r, 'font-size'));
    if (!mides.length) fallades.push(`${llista}: cap mida pròpia (hereta la prosa de ul)`);
    for (const r of mides) {
      if (valorDe(r, 'font-size') !== 'var(--sdp-text-small)') fallades.push(`${llista}: font-size ${valorDe(r, 'font-size')}`);
      if (!r.context.includes('@layer components')) fallades.push(`${llista}: la mida viu a [${r.context.join(', ')}]`);
    }
  }
  for (const fila of FILES) {
    if (!totes.some((r) => r.selectors.includes(fila) && valorDe(r, 'font') === 'inherit')) fallades.push(`${fila}: sense font: inherit`);
  }
  for (const r of totes) {
    if (![...LLISTES, ...FILES].some((c) => nomena(r, c))) continue;
    if (/var\(--sdp-fluid-/.test(r.cos)) fallades.push(`${r.selectors.join(', ')}: prosa fluida`);
  }
  return fallades;
}

/* (1) Herència: la mida del contenidor arriba a cada fila i a cada rètol si
   cap regla de pel mig, en cap full de src ni en cap capa, no la canvia. Es
   permet l'herència, la mida de la barra i la meta de 14px (l'hora, el resum
   de l'opció, el rol). Les inicials de l'avatar (--sdp-text-h5) no són text
   de la llista. */
const ETIQUETES_SECUNDARIES = ['.sdp-calaix-identitats__nom', '.sdp-workspace-settings__carpeta'];
const DINS_DE_LES_LLISTES = [...new Set([...LLISTES, ...FILES, ...RETOLS, ...ETIQUETES_SECUNDARIES])];
const MIDES_PERMESES = new Set(['inherit', 'var(--sdp-text-small)', 'var(--sdp-text-meta)', 'var(--sdp-font-barra)']);
/** La classe sencera, en qualsevol compost del selector: .sdp-xat-fila sí, .sdp-xat-fila__hora no. */
const tocaLaClasse = (selector, classe) => new RegExp(`${classe.replace(/\./g, '\\.')}(?![\\w-])`).test(selector);
const esAvatar = (selector) => /\.sdp-avatar(?![\w-])/.test(selector.split(/\s*[\s>+~]\s*/).pop());
function auditaHerencia(fulls) {
  const fallades = [];
  for (const { fitxer, css } of fulls) {
    for (const r of regles(css)) {
      const toca = r.selectors.filter((s) => !esAvatar(s) && DINS_DE_LES_LLISTES.some((c) => tocaLaClasse(s, c)));
      if (!toca.length) continue;
      for (const propietat of ['font-size', 'font']) {
        const valor = valorDe(r, propietat);
        if (valor !== undefined && !MIDES_PERMESES.has(valor)) fallades.push(`${fitxer}: ${toca.join(', ')} { ${propietat}: ${valor} }`);
      }
    }
  }
  return fallades;
}

/** (2) Amplada: els rètols declaren l'amplada semi i cap `font` posterior o de més pes no la reinicia. */
function auditaRetols(css) {
  const fallades = [];
  const totes = regles(css);
  for (const retol of RETOLS) {
    const estretes = totes.filter((r) => nomena(r, retol) && valorDe(r, 'font-stretch') === 'var(--sdp-font-amplada-semi)');
    if (!estretes.length) { fallades.push(`${retol}: cap font-stretch semi`); continue; }
    const guanya = estretes.at(-1);
    const pesEstret = Math.max(...guanya.selectors.filter((s) => s === retol || s.endsWith(` ${retol}`)).map(pes));
    for (const r of totes.filter((x) => nomena(x, retol) && valorDe(x, 'font') !== undefined)) {
      const pesFont = Math.max(...r.selectors.filter((s) => s === retol || s.endsWith(` ${retol}`)).map(pes));
      if (pesFont > pesEstret || (pesFont === pesEstret && r.ordre > guanya.ordre)) fallades.push(`${retol}: «font: ${valorDe(r, 'font')}» reinicia l'amplada`);
    }
  }
  for (const classe of NO_ESTRETS) {
    if (totes.some((r) => r.selectors.includes(classe) && valorDe(r, 'font-stretch'))) fallades.push(`${classe}: estreta`);
  }
  return fallades;
}

/** (2) La barra: el token porta la paraula clau del 87.5% i cap consumidor no la desfà. */
const PARAULES_AMPLADA = { 'ultra-condensed': 50, 'extra-condensed': 62.5, condensed: 75, 'semi-condensed': 87.5, normal: 100 };
function auditaBarra(valor) {
  const fallades = [];
  const trossos = (valor || '').split(/\s+/);
  const paraula = trossos.find((t) => t in PARAULES_AMPLADA && t !== 'normal');
  if (!paraula) fallades.push('--sdp-font-barra: sense amplada');
  else if (PARAULES_AMPLADA[paraula] !== Number.parseFloat(token('--sdp-font-amplada-semi'))) fallades.push(`--sdp-font-barra: ${paraula} no és --sdp-font-amplada-semi`);
  if (/\d+(\.\d+)?%|var\(--sdp-font-amplada/.test(valor || '')) fallades.push('--sdp-font-barra: un percentatge dins de l’abreujat font és invàlid');
  return fallades;
}

/* ── Còpies literals d'abans del torn ── */
const MODULES_ABANS = `@layer components {
  .sdp-xat-llista { list-style: none; margin: 0; padding: 0; }
  .sdp-xat-fila, .sdp-xat-opcio { display: flex; font: inherit; }
  .sdp-xat-fila__nom { font-weight: 700; }
  .sdp-xat-filtres-cerca { list-style: none; margin: 0; padding: var(--sdp-space-2) 0; }
  .sdp-xat-ajustos__targeta { margin: 0; padding: 0; list-style: none; }
  .sdp-xat-opcio-accio { display: flex; font: inherit; }
  .sdp-xat-menu { position: absolute; min-width: 14rem; }
  .sdp-xat-menu__item { display: flex; font: inherit; }
}`;
/* Una mida crua o la prosa fluida a pel mig (una fila, un rètol, el li), en
   qualsevol full i capa: les files tornarien a 20px amb el contenidor a 16. */
const MIDES_A_PEL_MIG = [
  { fitxer: 'src/css/modules.css', css: '@layer components { .sdp-xat-fila__nom { font-size: 1.25rem; } .sdp-xat-llista > li { font-size: var(--sdp-fluid-cos); } }' },
  { fitxer: 'src/css/utilities.css', css: '@layer utilities { .sdp-xat-fila, .sdp-xat-opcio { font-size: 1.25rem; } }' },
  { fitxer: 'src/css/modules.css', css: '@layer components { .sdp-calaix-identitats__nom { font: 700 1.25rem/1.2 var(--sdp-font); } }' },
  { fitxer: 'src/css/modules.css', css: '@layer components { .sdp-xat-fila > .sdp-avatar { font-size: var(--sdp-text-h5); } .sdp-xat-fila__hora { font-size: var(--sdp-text-meta); } .sdp-xat-menu__peu { font-size: var(--sdp-text-meta); } }' }
];
/* L'estretor al botó d'acció amb el mateix pes que el seu `font: inherit` de
   més avall: el reinici guanya per ordre. */
const ACCIO_PERDUDA = `@layer components {
  .sdp-xat-opcio-accio { font-stretch: var(--sdp-font-amplada-semi); }
  .sdp-xat-opcio-accio { display: flex; font: inherit; }
}`;
const BARRA_ABANS = '600 var(--sdp-text-small)/1.5 var(--sdp-font)';

describe('les guardes detecten les regles d’abans del torn', () => {
  test('abans: les llistes i el menú del xat sense mida pròpia (20px heretats de ul i de l’ol de les bombolles)', () => {
    const fallades = auditaMides(MODULES_ABANS);
    for (const llista of ['.sdp-xat-llista', '.sdp-xat-filtres-cerca', '.sdp-xat-ajustos__targeta', '.sdp-xat-menu']) {
      expect(fallades).toContain(`${llista}: cap mida pròpia (hereta la prosa de ul)`);
    }
  });

  test('una mida crua o fluida a pel mig, en qualsevol full o capa, es detecta; l’avatar, l’hora i el peu del menú, no', () => {
    expect(auditaHerencia(MIDES_A_PEL_MIG)).toEqual([
      'src/css/modules.css: .sdp-xat-fila__nom { font-size: 1.25rem }',
      'src/css/modules.css: .sdp-xat-llista > li { font-size: var(--sdp-fluid-cos) }',
      'src/css/utilities.css: .sdp-xat-fila, .sdp-xat-opcio { font-size: 1.25rem }',
      'src/css/modules.css: .sdp-calaix-identitats__nom { font: 700 1.25rem/1.2 var(--sdp-font) }'
    ]);
  });

  test('abans: cap rètol del xat en SemiCondensed', () => {
    expect(auditaRetols(MODULES_ABANS)).toContain('.sdp-xat-fila__nom: cap font-stretch semi');
  });

  test('un `font: inherit` posterior del mateix pes reinicia l’amplada del botó d’acció', () => {
    expect(auditaRetols(ACCIO_PERDUDA)).toContain('.sdp-xat-opcio-accio: «font: inherit» reinicia l\'amplada');
  });

  test('abans: la barra sense amplada; i un percentatge dins de l’abreujat no val', () => {
    expect(auditaBarra(BARRA_ABANS)).toEqual(['--sdp-font-barra: sense amplada']);
    expect(auditaBarra('600 var(--sdp-font-amplada-semi) var(--sdp-text-small)/1.5 var(--sdp-font)'))
      .toContain('--sdp-font-barra: un percentatge dins de l’abreujat font és invàlid');
  });
});

describe('P1-67 (1) · 16px a les llistes i menús, com la barra principal', () => {
  test('cap fallada: les sis llistes fan --sdp-text-small a components i les files l’hereten', () => {
    expect(auditaMides(MODULES)).toEqual([]);
  });

  test('la mida arriba a les files i als rètols: cap full de src no la canvia a pel mig', () => {
    const fulls = fullsCss(resolve(ARREL, 'src')).map((f) => ({ fitxer: f.slice(ARREL.length + 1), css: readFileSync(f, 'utf8') }));
    expect(fulls.length).toBeGreaterThan(10);
    expect(auditaHerencia(fulls)).toEqual([]);
  });

  test('la mida calculada és de 16px, la mateixa que la barra (--sdp-font-barra), i guanya la prosa de ul per la capa', () => {
    // Token: 1rem, és a dir, 16px amb l'arrel per defecte. Mai menys de 16px.
    expect(token('--sdp-text-small')).toBe('1rem');
    expect(token('--sdp-font-barra')).toMatch(/ var\(--sdp-text-small\)\/1\.5 /);
    // La prosa de ul (base.css) viu a legacy, i components va darrere a l'ordre de capes.
    const ul = regles(BASE).find((r) => r.selectors.includes('ul') && valorDe(r, 'font-size'));
    expect(valorDe(ul, 'font-size')).toBe('var(--sdp-fluid-cos)');
    expect(ul.context).toEqual(['@layer legacy']);
    const ordre = INDEX.match(/@layer ([\w\s,-]+);/)[1].split(',').map((c) => c.trim());
    expect(ordre.indexOf('legacy')).toBeLessThan(ordre.indexOf('components'));
    // Cap full de src no torna a posar la prosa fluida a les llistes fora de capa ni a utilities.
    const altres = fullsCss(resolve(ARREL, 'src')).flatMap((f) => regles(readFileSync(f, 'utf8')))
      .filter((r) => LLISTES.some((c) => nomena(r, c)) && valorDe(r, 'font-size') && valorDe(r, 'font-size') !== 'var(--sdp-text-small)');
    expect(altres.map((r) => r.selectors.join(', '))).toEqual([]);
  });

  test('les bombolles continuen sent prosa: .sdp-xat-missatges no pren la mida dels menús', () => {
    const bombolles = regles(MODULES).filter((r) => nomena(r, '.sdp-xat-missatges'));
    expect(bombolles.length).toBeGreaterThan(0);
    expect(bombolles.filter((r) => /--sdp-text-small/.test(r.cos))).toEqual([]);
  });
});

describe('P1-67 (2) · SemiCondensed 87.5% a les barres i als rètols del xat', () => {
  test('--sdp-font-barra porta semi-condensed, el 87.5% de --sdp-font-amplada-semi', () => {
    expect(token('--sdp-font-amplada-semi')).toBe('87.5%');
    expect(token('--sdp-font-barra')).toBe('600 semi-condensed var(--sdp-text-small)/1.5 var(--sdp-font)');
    expect(auditaBarra(token('--sdp-font-barra'))).toEqual([]);
  });

  test('totes les barres consumixen el token com a abreujat i cap no en desfà l’amplada', () => {
    const consumidors = fullsCss(resolve(ARREL, 'src')).flatMap((f) => regles(readFileSync(f, 'utf8'))
      .filter((r) => valorDe(r, 'font') === 'var(--sdp-font-barra)')
      .map((r) => ({ fitxer: f.slice(ARREL.length + 1), r })));
    // 261028: layout.css (CONTROL i .nav-item), AppGridShell.css, PerfilShell.css, apps.css i modules.css.
    expect(consumidors.length).toBeGreaterThanOrEqual(10);
    expect(consumidors.some(({ fitxer, r }) => fitxer === 'src/css/layout.css' && r.selectors.includes('.nav-item'))).toBe(true);
    const desfets = consumidors.filter(({ r }) => {
      const props = declaracions(r.cos).map(([p]) => p);
      return props.lastIndexOf('font-stretch') > props.lastIndexOf('font');
    });
    expect(desfets.map(({ fitxer, r }) => `${fitxer}: ${r.selectors.join(', ')}`)).toEqual([]);
  });

  test('cap fallada: els sis rètols del xat en semi, i ni l’hora, ni el ul, ni les bombolles', () => {
    expect(auditaRetols(MODULES)).toEqual([]);
  });

  test('les pestanyes de contingut també són barra: semi després del `font: inherit`, amb la mida i el pes de sempre', () => {
    const pestanya = regles(llig('src/css/components.css')).filter((r) => r.selectors.includes('.sdp-pestanyes__pestanya') && r.selectors.length === 1);
    expect(pestanya).toHaveLength(1);
    const props = declaracions(pestanya[0].cos).map(([p]) => p);
    expect(valorDe(pestanya[0], 'font-stretch')).toBe('var(--sdp-font-amplada-semi)');
    expect(props.lastIndexOf('font-stretch')).toBeGreaterThan(props.lastIndexOf('font'));
    expect([valorDe(pestanya[0], 'font'), valorDe(pestanya[0], 'font-weight')]).toEqual(['inherit', '700']);
  });
});
