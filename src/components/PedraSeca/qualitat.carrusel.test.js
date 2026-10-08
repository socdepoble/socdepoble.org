// @vitest-environment node
/* Carrusel d'imatges (ordre del Mestre, 261007: «Implementa un carrusel a la
   imatge principal d'aquesta pàgina universal perquè l'usuari puga passar les
   fotos») · qualitat de CarruselImatges, del seu bloc a src/css/components.css,
   de l'espècimen i de la portada que el munta (portadaDElement de
   detailSectionMeta.jsx des de l'Esmena 3 del pla 261007_1645: la criden
   /mercat/:id i el lector del MAS). Calcada, en menut, de
   qualitat.alergens.test.js.
   · ESLint amb la configuració del projecte i zero missatges.
   · Pedra Seca per text: cap style=, cap h1/h2, cap import de CSS ni :has();
     classes sdp-* literals amb regla al bloc del carrusel o als fulls
     canònics, cap CSS mort; només tokens que existixen, espais de l'escala,
     cap ombra ni !important, tot dins de @layer components; diapositives 1:1
     i botons de --sdp-touch sense transform propi (el :active de .sdp-boto
     en posa un).
   · Moviment: el bloc no demana cap scroll suau (el demana el JS, que mira
     prefers-reduced-motion).
   · Baseline 2022 (Safari 16.0, Chrome 100, Firefox 100) de JS i CSS.
   · La porta tooling/gates/tractor-cataleg.mjs (C1, C2 i C3), l'export a la
     façana, l'ítem i el carregador del catàleg.
   · El lloc a la cascada (ordre del Mestre, 261007: «Moure a
     components.css»): el full propi ja no existix ni s'importa, el bloc és
     l'únic que nomena .sdp-carrusel* i va darrere de tota regla .sdp-boto de
     components.css (mateixa especificitat: guanya l'ordre de font), i cap
     full que carrega després en la mateixa capa porta un .sdp-boto del
     mateix pes fora del Perfil, on el carrusel no es munta.
   · La porta tooling/gates/tractor-vocabulari.mjs, la de veres (escaneja()):
     cap infracció nova (V1, V2 ni V3) als fitxers propis, el full vell
     inclòs. La V3 de carrusel.css (revisió S1) és resolta: les regles viuen
     al full canònic.
   · SONDES: cada detector és una funció pura i ha de denunciar una mostra
     dolenta. Una porta que no troba res perquè s'ha trencat no ix verd.
   Els patrons vetats es componen a trossos perquè les portes que llegixen
   src/ no els troben ací. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, test } from 'vitest';
import { escaneja } from '../../../tooling/gates/tractor-vocabulari.mjs';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const t = (...trossos) => trossos.join('');
const PS = 'src/components/PedraSeca';
const CAT = 'src/sections/disseny/cataleg';
/* Ordre del Mestre (261007): «Moure a components.css». El full propi
   (FULL_ANTIC) trencava la llei dura V3; ara les regles són un bloc del full
   canònic. */
const CANONIC = 'src/css/components.css';
const FULL_ANTIC = `${PS}/carrusel.css`;

const NOM = 'CarruselImatges';
const COMPONENT = `${PS}/organismes/CarruselImatges.jsx`;
const ESPECIMEN = `${CAT}/detalls/EspecimenCarruselImatges.jsx`;
const DETALL = 'src/sections/detail/ItemDetailSection.jsx';
const META = 'src/sections/detail/detailSectionMeta.jsx';
const JSX = [COMPONENT, ESPECIMEN];
const PROVES = [`${PS}/organismes/CarruselImatges.test.jsx`, `${PS}/qualitat.carrusel.test.js`, 'src/sections/detail/ItemDetailSection.carrusel.test.jsx'];
/* Revisió final (261007) · la regla única de la foto principal d'un producte
   (imatgesDeProducte) i la targeta de producte compartida pel Mercat i el Mur. */
const PROPIS = [...JSX, DETALL, META, 'src/sections/mercat/marketSeed.js', 'src/sections/mercat/imatgesDeProducte.js', 'src/sections/mercat/targetaDeProducte.js', 'src/sections/mercat/MercatSection.mateixProducte.test.jsx', ...PROVES];

const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const classesDelCss = (css) => new Set([...senseComentaris(css).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const CSS_SRC = readdirSync(path.join(ARREL, 'src/css')).filter((f) => f.endsWith('.css')).map((f) => llig(`src/css/${f}`)).join('\n');
const TOKENS_DEFINITS = new Set([...CSS_SRC.matchAll(/(--sdp-[\w-]+)\s*:/g)].map((m) => m[1]));

/* Tots els fitxers d'una carpeta de src/ amb una extensió, recursivament. */
function fitxersDe(dir, extensio) {
  return readdirSync(path.join(ARREL, dir), { withFileTypes: true }).flatMap((e) => {
    const ruta = `${dir}/${e.name}`;
    if (e.isDirectory()) return fitxersDe(ruta, extensio);
    return e.name.endsWith(extensio) ? [ruta] : [];
  });
}

/** Els blocs de primer nivell d'un full sense comentaris: [{ text, inici }].
    Les sentències de primer nivell (`@import …;`, `@layer a, b;`) no en són. */
function blocsDePrimerNivell(net) {
  const blocs = [];
  let profunditat = 0;
  let inici = 0;
  for (let i = 0; i < net.length; i += 1) {
    if (net[i] === '{') profunditat += 1;
    if (net[i] === ';' && profunditat === 0) inici = i + 1;
    if (net[i] === '}') {
      profunditat -= 1;
      if (profunditat === 0) {
        const tros = net.slice(inici, i + 1);
        blocs.push({ text: tros.trim(), inici: inici + tros.length - tros.trimStart().length });
        inici = i + 1;
      }
    }
  }
  return blocs;
}

/* El bloc del carrusel dins del full canònic: l'únic de primer nivell que
   nomena .sdp-carrusel*. */
const CANONIC_NET = senseComentaris(llig(CANONIC));
const BLOCS_CARRUSEL = blocsDePrimerNivell(CANONIC_NET).filter((b) => b.text.includes('sdp-carrusel'));
const BLOC = BLOCS_CARRUSEL[0] ?? { text: '', inici: -1 };
const BLOC_NET = BLOC.text;

/* Les classes sdp-* que nomena un JSX: tot literal entre cometes que ho siga. */
const classesNomenades = (codi) => [...codi.matchAll(/["'`]([^"'`\n]*\bsdp-[^"'`\n]*)["'`]/g)]
  .flatMap((m) => m[1].split(/\s+/)).filter((c) => /^sdp-[a-z0-9_-]+$/.test(c));

/* Les regles del full amb el seu context d'@-regles: [{ selectors, cos, context }].
   El cap comença després de l'última sentència (`@import …;`) i els
   selectors es tallen per les comes de primer nivell (no les de :where()). */
function regles(css) {
  const net = senseComentaris(css);
  const pila = [];
  const fulles = [];
  let marca = 0;
  for (let i = 0; i < net.length; i += 1) {
    if (net[i] === '{') {
      pila.push({ cap: net.slice(marca, i).split(';').pop().trim(), inici: i + 1 });
      marca = i + 1;
    } else if (net[i] === '}') {
      const bloc = pila.pop();
      if (bloc && !bloc.cap.startsWith('@')) {
        fulles.push({ selectors: bloc.cap.split(/,(?![^(]*\))/).map((s) => s.trim()), cos: net.slice(bloc.inici, i), context: pila.map((p) => p.cap) });
      }
      marca = i + 1;
    }
  }
  return fulles;
}
const REGLES = regles(BLOC_NET);
const cosDe = (selector) => REGLES.filter((r) => r.selectors.includes(selector)).map((r) => r.cos).join(';');
const valorDe = (cos, propietat) => cos.match(new RegExp(`(?:^|[;\\s])${propietat}\\s*:\\s*([^;]+);`))?.[1].trim() ?? null;

/* ── Els detectors (funcions pures; les sondes del final en proven la vista) ── */

/** Els colors en cru (hex, rgb, hsl, oklch, color-mix) i els tokens primitius. */
function colorsCrus(cssNet) {
  return [
    ...[...cssNet.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]),
    ...[...cssNet.matchAll(/\b(?:rgba?|hsla?|oklch|color-mix)\(/g)].map((m) => m[0]),
    ...[...cssNet.matchAll(/var\(\s*(--sdp-(?:pedra|primary|secondary|blanc|negre|canon|error-|avis-|exit-)[\w-]*)/g)].map((m) => m[1])
  ];
}

/** Els tokens que el full fa servir i que cap full de src/css definix. */
const tokensFantasma = (cssNet, definits) => [...new Set([...cssNet.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))].filter((tk) => !definits.has(tk));

/** Les regles que no són dins de @layer components. */
const foraDeCapa = (llistaRegles) => llistaRegles.filter((r) => r.context[0] !== '@layer components').map((r) => r.selectors.join(', '));

/** Marges, coixins i separacions: { inspeccionades, dolents }. Bo: 0, auto o l'escala --sdp-space-N. */
function espaisDolents(cssNet) {
  const dolents = [];
  let inspeccionades = 0;
  for (const m of cssNet.matchAll(/(?:^|[;{\s])((?:margin|padding|gap|row-gap|column-gap)[\w-]*)\s*:\s*([^;}]+)/g)) {
    inspeccionades += 1;
    for (const valor of m[2].trim().split(/\s+/)) {
      const ok = valor === '0' || valor === 'auto' || /^var\(--sdp-space-\d+\)$/.test(valor)
        || (/^\d*\.?\d+rem$/.test(valor) && Number.isInteger(parseFloat(valor) * 4));
      if (!ok) dolents.push(`${m[1]}: ${valor}`);
    }
  }
  return { inspeccionades, dolents };
}

/** El selector sense els :where(…), que no pesen (parèntesis equilibrats). */
function senseWhere(selector) {
  let eixida = '';
  for (let i = 0; i < selector.length; i += 1) {
    if (selector.startsWith(':where(', i)) {
      let profunditat = 0;
      let j = i + ':where'.length;
      for (; j < selector.length; j += 1) {
        if (selector[j] === '(') profunditat += 1;
        if (selector[j] === ')') profunditat -= 1;
        if (profunditat === 0) break;
      }
      i = j;
    } else {
      eixida += selector[i];
    }
  }
  return eixida.trim();
}

/** Pesa (0,1,0) i té per subjecte el botó de Boto (.sdp-boto o el secundari):
    empata amb .sdp-carrusel__boto i el desempat és l'ordre de font. */
const empataAmbElBoto = (selector) => /^\.sdp-boto(?:--secundari)?$/.test(senseWhere(selector));

/** La capa d'una regla: la de l'@import i les @layer que l'embolcallen. */
const capaDe = (capaImport, context) => [capaImport, ...context.filter((c) => c.startsWith('@layer ')).map((c) => c.slice('@layer '.length).trim())]
  .filter(Boolean).join('.');

/** Els fulls que index.css importa, en ordre: [{ fitxer, capa }]. */
const importsDe = (indexNet) => [...indexNet.matchAll(/@import\s+url\(\s*'([^']+)'\s*\)\s*([^;]*);/g)]
  .map(([, url, resta]) => ({ fitxer: path.posix.join('src/css', url), capa: /layer\(([\w.-]+)\)/.exec(resta)?.[1] ?? '' }));

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(PROPIS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(PROPIS.length);
    expect(missatges).toEqual([]);
    /* Sonda: la configuració del projecte és activa. */
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, PS, 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca · JSX', () => {
  test('cap style=, cap h1 ni h2, cap import de CSS ni :has()', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [new RegExp(['<h', '[12][\\s>]'].join('')), 'h1/h2'],
      [/^\s*import\s+[^;]*\.css['"]/m, 'import de CSS'],
      [new RegExp([':ha', 's\\('].join('')), ':has()']
    ];
    const trobats = [...JSX, DETALL, META].flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('tota classe sdp-* de la peça té regla al full canònic (components.css), i cap classe del bloc és morta', () => {
    const canoniques = classesDelCss(CANONIC_NET);
    const nomenades = new Set(classesNomenades(llig(COMPONENT)));
    expect([...nomenades].filter((c) => !canoniques.has(c))).toEqual([]);
    expect(nomenades).toEqual(new Set([
      'sdp-carrusel', 'sdp-carrusel__pista', 'sdp-carrusel__diapositiva', 'sdp-carrusel__imatge',
      'sdp-carrusel__controls', 'sdp-carrusel__boto', 'sdp-carrusel__comptador', 'sdp-nomes-lector'
    ]));
    /* Les set classes pròpies (l'arrel i els sis elements) tenen regla al bloc. */
    expect([...nomenades].filter((c) => c.startsWith('sdp-carrusel') && !classesDelCss(BLOC_NET).has(c))).toEqual([]);
    expect([...classesDelCss(BLOC_NET)].filter((c) => !nomenades.has(c))).toEqual([]);
  });

  test('importa pel camí directe, mai per la façana', () => {
    const especificadors = [...llig(COMPONENT).matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    expect(especificadors).toEqual(['react', 'lucide-react', '../atoms/Boto.jsx']);
  });

  test('presentacional: cap emmagatzematge, xarxa ni backend, cap global escrita', () => {
    const vetats = [
      [new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB'].join('')), 'emmagatzematge'],
      [new RegExp(['\\bfet', 'ch\\(|XMLHttp', 'Request|Web', 'Socket'].join('')), 'xarxa'],
      [/supabase|backendPort|adaptadors|SessionContext/, 'backend'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita']
    ];
    const trobats = JSX.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('el moviment reduït es mira en el pas (matchMedia), i el pas suau només sense', () => {
    const codi = llig(COMPONENT);
    expect(codi).toContain("matchMedia?.('(prefers-reduced-motion: reduce)')");
    expect(codi).toMatch(/behavior: movimentReduit\(pista\) \? 'auto' : 'smooth'/);
  });
});

describe('Pedra Seca · el bloc del carrusel a components.css', () => {
  test('només tokens semàntics: cap hex, rgb, hsl ni primitiu, i tots els tokens existixen', () => {
    expect(colorsCrus(BLOC_NET)).toEqual([]);
    expect(tokensFantasma(BLOC_NET, TOKENS_DEFINITS)).toEqual([]);
    expect(new Set([...BLOC_NET.matchAll(/var\(\s*(--sdp-[\w-]+)/g)].map((m) => m[1])).size).toBeGreaterThan(8);
  });

  test('cap :has(), cap ombra, cap !important, cap nesting i tot dins de @layer components', () => {
    expect(new RegExp([':ha', 's\\('].join('')).test(BLOC_NET)).toBe(false);
    expect(/box-shadow|!important/.test(BLOC_NET)).toBe(false);
    expect(BLOC_NET.trim().startsWith('@layer components {')).toBe(true);
    expect(REGLES.length).toBeGreaterThan(6);
    expect(foraDeCapa(REGLES)).toEqual([]);
    // Cap regla dins d'una altra regla (nesting): el context només són @-regles.
    expect(REGLES.filter((r) => r.context.some((c) => !c.startsWith('@')))).toEqual([]);
  });

  test('marges, coixins i separacions: 0, auto o l’escala --sdp-space-N', () => {
    const { inspeccionades, dolents } = espaisDolents(BLOC_NET);
    expect(dolents).toEqual([]);
    expect(inspeccionades).toBeGreaterThan(4);
  });

  test('els botons: àrea de --sdp-touch en els dos sentits, redons i sense transform propi', () => {
    const boto = cosDe('.sdp-carrusel__boto');
    expect(valorDe(boto, 'inline-size')).toBe('var(--sdp-touch)');
    expect(valorDe(boto, 'min-inline-size')).toBe('var(--sdp-touch)');
    expect(valorDe(boto, 'min-block-size')).toBe('var(--sdp-touch)');
    expect(valorDe(boto, 'border-radius')).toBe('var(--sdp-radi-pastilla)');
    expect(valorDe(boto, 'transform')).toBeNull();
    // El centrat el fa el contenidor (flex), que deixa passar el dit a la pista.
    expect(valorDe(cosDe('.sdp-carrusel__controls'), 'pointer-events')).toBe('none');
    expect(valorDe(boto, 'pointer-events')).toBe('auto');
  });

  test('pista amb scroll-snap; diapositives de l’amplada sencera i fotos 1:1; cap scroll suau al bloc', () => {
    expect(valorDe(cosDe('.sdp-carrusel__pista'), 'scroll-snap-type')).toBe('x mandatory');
    expect(valorDe(cosDe('.sdp-carrusel__diapositiva'), 'flex')).toBe('0 0 100%');
    expect(valorDe(cosDe('.sdp-carrusel__diapositiva'), 'scroll-snap-align')).toBe('start');
    expect(valorDe(cosDe('.sdp-carrusel__imatge'), 'aspect-ratio')).toBe('1 / 1');
    expect(/scroll-behavior\s*:\s*smooth/.test(BLOC_NET)).toBe(false);
  });

  /* A carrusel.css era inset-inline-start: 50%. El mateix píxel d'esquerra a
     dreta, però al full canònic tot inset-* ha de ser de l'escala
     (components.abast.capes.test.js) i 50% no ho és. */
  test('el comptador es centra amb left: 50% i translateX(-50%), i cap inset-* ix de l’escala', () => {
    const comptador = cosDe('.sdp-carrusel__comptador');
    expect(valorDe(comptador, 'position')).toBe('absolute');
    expect(valorDe(comptador, 'left')).toBe('50%');
    expect(valorDe(comptador, 'transform')).toBe('translateX(-50%)');
    expect(valorDe(comptador, 'inset-block-end')).toBe('var(--sdp-space-3)');
    expect(valorDe(comptador, 'inset-inline-start')).toBeNull();
    const insets = [...BLOC_NET.matchAll(/(?:^|[;{\s])(inset[\w-]*)\s*:\s*([^;}]+)/g)].map((m) => `${m[1]}: ${m[2].trim()}`);
    expect(insets).toEqual(['inset: 0', 'inset-block-end: var(--sdp-space-3)']);
  });
});

describe('el lloc a la cascada (ordre del Mestre, 261007: «Moure a components.css»)', () => {
  test('el full propi ja no existix ni s’importa, i cap altre full de src/ nomena .sdp-carrusel', () => {
    expect(existsSync(path.join(ARREL, FULL_ANTIC))).toBe(false);
    expect(senseComentaris(llig('src/css/index.css'))).not.toMatch(/carrusel/);
    const altres = fitxersDe('src', '.css').filter((f) => f !== CANONIC && /sdp-carrusel/.test(senseComentaris(llig(f))));
    expect(altres).toEqual([]);
    expect(BLOCS_CARRUSEL).toHaveLength(1);
    expect(BLOC.text.startsWith('@layer components {')).toBe(true);
  });

  test('el bloc va darrere de tota regla .sdp-boto de components.css, que li disputa el coixí, la separació, el radi i l’alçada', () => {
    /* Sonda: la base .sdp-boto pesa el mateix (0,1,0) i declara les quatre
       propietats que el botó redó canvia; si el bloc anara davant, guanyaria. */
    const base = regles(CANONIC_NET).filter((r) => r.selectors.includes('.sdp-boto') && r.context.join(' ') === '@layer components');
    expect(base.length).toBeGreaterThan(0);
    const decls = base.map((r) => r.cos).join(';');
    for (const propietat of ['padding', 'gap', 'border-radius', 'min-height']) expect(valorDe(decls, propietat), propietat).not.toBeNull();
    expect(BLOC.inici).toBeGreaterThan(0);
    expect(CANONIC_NET.lastIndexOf('.sdp-boto')).toBeLessThan(BLOC.inici);
  });

  test('cap full que carrega després en la mateixa capa porta un .sdp-boto del mateix pes, llevat del Perfil, on el carrusel no es munta', () => {
    const imports = importsDe(senseComentaris(llig('src/css/index.css')));
    const posteriors = imports.slice(imports.findIndex((i) => i.fitxer === CANONIC) + 1);
    /* Sonda: la llista és la de la cascada, de modules.css a utilities.css. */
    expect(posteriors.length).toBeGreaterThan(8);
    expect(posteriors[0]).toEqual({ fitxer: 'src/css/modules.css', capa: '' });
    expect(posteriors[posteriors.length - 1].fitxer).toBe('src/css/utilities.css');
    expect(posteriors.find((i) => i.fitxer === 'src/sections/profile/PerfilShell.css')?.capa).toBe('components');
    const empats = posteriors.flatMap(({ fitxer, capa }) => regles(llig(fitxer))
      .filter((r) => capaDe(capa, r.context) === 'components')
      .flatMap((r) => r.selectors.filter(empataAmbElBoto).map((s) => `${fitxer} · ${s}`)));
    expect(empats).toEqual(['src/sections/profile/PerfilShell.css · :where(.perfil-pagina) .sdp-boto']);
    /* El carrusel només el munten la portada compartida i l'espècimen, fora
       del Perfil. Esmena 3 del pla 261007_1645 · la portada ha passat
       d'ItemDetailSection a detailSectionMeta (portadaDElement). */
    const munten = fitxersDe('src', '.jsx').filter((f) => !/\.test\.jsx$/.test(f) && llig(f).includes(`<${NOM}`));
    expect(munten.sort()).toEqual([META, ESPECIMEN].sort());
    expect(munten.filter((f) => llig(f).includes('perfil-pagina'))).toEqual([]);
  });
});

describe('Baseline 2022 (Safari 16.0, Chrome 100, Firefox 100)', () => {
  test('JS: cap API més nova ni lookbehind', () => {
    const vetat = /\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers|\(\?<[=!]/;
    for (const f of [...JSX, DETALL, META]) expect(vetat.test(llig(f)), f).toBe(false);
  });

  test('CSS: cap @container, subgrid, color-mix, unitats dv/sv/lv ni propietats de transformació soltes', () => {
    expect(BLOC_NET).not.toMatch(/@container|subgrid|color-mix|\b\d*\.?\d+(?:dv|sv|lv)(?:h|w)\b/);
    expect(BLOC_NET).not.toMatch(/(?:^|[;{\s])(?:rotate|scale|translate)\s*:/);
  });
});

describe('la porta del catàleg (tooling/gates/tractor-cataleg.mjs) per a CarruselImatges', () => {
  const registre = llig(`${CAT}/registre.js`);
  /* Les mateixes expressions que la porta. */
  const entrades = [...registre.matchAll(/\{\s*nom:\s*'([^']+)',\s*fitxer:\s*'([^']+)'[^}]*estat:\s*'(\w+)'([^}]*)\}/g)]
    .map(([, nom, fitxer, estat, resta]) => ({ nom, fitxer, estat, fora: /fora:\s*true/.test(resta) }));
  const detalls = readdirSync(path.join(ARREL, CAT, 'detalls')).filter((f) => /^Especimen.*\.jsx$/.test(f))
    .map((f) => llig(`${CAT}/detalls/${f}`)).join('\n');
  const importats = new Set([...detalls.matchAll(/import\s*\{([^}]+)\}\s*from\s*'[^']*(?:components\/(?:ui|PedraSeca)\/[^']+|UniversalElements)'/g)]
    .flatMap((m) => m[1].split(',').map((s) => s.trim()).filter(Boolean)));

  test('C1 registrat, C2 viu en un espècimen que el munta, C3 l’export existix', () => {
    const exportats = [...llig(COMPONENT).matchAll(/^export\s+(?:function|const)\s+([A-Z]\w*)/gm)].map((m) => m[1]);
    expect(exportats).toEqual([NOM]);
    expect(entrades.find((e) => e.nom === NOM)).toEqual({ nom: NOM, fitxer: 'PedraSeca/organismes/CarruselImatges.jsx', estat: 'viu', fora: false });
    expect(importats.has(NOM)).toBe(true);
    expect(llig(ESPECIMEN)).toMatch(new RegExp(`<${NOM}\\b`));
  });

  /* Esmena 3 del pla 261007_1645 · La portada amb carrusel viu a
     detailSectionMeta.jsx (portadaDElement), que la importa directa de
     l'organisme: elementDeSeccio.js i els seus consumidors no arrosseguen el
     barril de Pedra Seca. El detall ja no el munta. */
  test('la façana l’exporta, el catàleg en té l’ítem i el carregador, i la portada compartida el munta amb import directe', () => {
    expect(llig(`${PS}/index.js`)).toContain(`export { ${NOM} } from './organismes/CarruselImatges.jsx';`);
    expect(llig(`${CAT}/manifest.js`)).toMatch(/especimen\('fonaments', 'carrusel-imatges',/);
    expect(llig(`${CAT}/detailRegistry.jsx`)).toContain("'fonaments/carrusel-imatges': lazyRoute(() => import('./detalls/EspecimenCarruselImatges.jsx')),");
    expect(llig(META)).toContain("import { CarruselImatges } from '../../components/PedraSeca/organismes/CarruselImatges.jsx';");
    expect(llig(DETALL)).not.toMatch(/CarruselImatges/);
  });
});

/* La porta del vocabulari, la de veres (revisió S1, 261007). tractor-
   vocabulari.mjs és LLEI DURA per a V1 (classe-forastera) i V3 (css-de-seccio)
   i el hook local no deixa executar-la des de la shell; ací se'n crida
   `escaneja()`, sense còpia que puga divergir, i es compara amb el deute admés
   com fa la CLI: identitat regla|fitxer|token. */
describe('la porta del vocabulari (tooling/gates/tractor-vocabulari.mjs), la de veres', () => {
  const DEUTE = JSON.parse(llig('.agents/deute/.vocabulari-deute.json'));
  const identitat = (i) => `${i.regla}|${i.fitxer}|${i.token}`;
  const admesa = (i) => (DEUTE[i.regla]?.identitats ?? []).includes(identitat(i));
  const CODI_PROPI = [...JSX, DETALL, META, 'src/sections/mercat/marketSeed.js'];
  let escaneig;
  let noves;
  beforeAll(() => {
    escaneig = escaneja();
    noves = escaneig.infraccions.filter((i) => !admesa(i));
  }, 120000);

  test('V1, V2 i V3: cap infracció nova als fitxers propis (el full vell inclòs), i tota classe del carrusel és al vocabulari de la porta', () => {
    /* Sonda: la porta llig el vocabulari i escaneja el JSX (troba deute conegut). */
    expect(escaneig.vocab.size).toBeGreaterThan(1000);
    expect(escaneig.infraccions.some((i) => i.regla === 'classe-forastera' && admesa(i))).toBe(true);
    expect([...new Set(classesNomenades(llig(COMPONENT)))].filter((c) => !escaneig.vocab.has(c))).toEqual([]);
    expect(noves.filter((i) => [...CODI_PROPI, FULL_ANTIC].includes(i.fitxer)).map(identitat)).toEqual([]);
  });

  /* Revisió S1 resolta per ordre del Mestre (261007: «Moure a components.css»).
     La V3 de carrusel.css era una infracció nova de llei dura; ara el full no
     existix i les seues regles són al full canònic, que la porta llig com a
     vocabulari. La sonda prova que la V3 viu i escaneja src/components (on viu
     PedraSeca) de manera recursiva: hi troba algun full de deute admés. No
     depén dels quatre fulls de PedraSeca que una altra tanda traurà, sinó de
     tot l'arbre de components (p. ex. layout/AppGridShell.css). */
  test('S1 · LLEI DURA V3 (css-de-seccio): cap full del carrusel, i les seues classes les dona components.css', () => {
    const v3 = escaneig.infraccions.filter((i) => i.regla === 'css-de-seccio');
    expect(v3.some((i) => i.fitxer.startsWith('src/components/') && i.fitxer.endsWith('.css'))).toBe(true);
    expect(v3.filter((i) => /carrusel/i.test(i.fitxer)).map(identitat)).toEqual([]);
    expect(noves.filter((i) => i.regla === 'css-de-seccio' && i.fitxer === FULL_ANTIC).map(identitat)).toEqual([]);
    /* Sense el full propi, el vocabulari de la porta només pot vindre dels
       fulls canònics: les classes pròpies hi són perquè components.css les declara. */
    const canoniques = classesDelCss(CANONIC_NET);
    const propies = [...new Set(classesNomenades(llig(COMPONENT)))].filter((c) => c.startsWith('sdp-carrusel'));
    expect(propies.length).toBe(7);
    expect(propies.filter((c) => !canoniques.has(c) || !escaneig.vocab.has(c))).toEqual([]);
  });
});

/* Les sondes: cada detector ha de denunciar una mostra dolenta. */
describe('les sondes: els detectors denuncien una mostra dolenta', () => {
  const dinsDeCapa = (cos) => t('@layer components { ', cos, ' }');

  test('espais: un valor fora de l’escala, i la cota compta el que inspecciona', () => {
    const { inspeccionades, dolents } = espaisDolents(dinsDeCapa(t('.x { pad', 'ding: 3', 'px; gap: var(--sdp-space-1); }')));
    expect(dolents).toEqual([t('pad', 'ding: 3', 'px')]);
    expect(inspeccionades).toBe(2);
  });

  test('capa: una regla fora de @layer components', () => {
    expect(foraDeCapa(regles('.x { color: inherit; }'))).toEqual(['.x']);
    expect(foraDeCapa(regles(dinsDeCapa('.x { color: inherit; }')))).toEqual([]);
  });

  test('colors i tokens: un hex, un rgb, un primitiu i un token que cap full no definix', () => {
    const mostra = t('.x { color: #', 'fff; background: rg', 'b(0 0 0); border-color: var(--sdp-pe', 'dra-500); }');
    expect(colorsCrus(mostra)).toEqual([t('#', 'fff'), t('rg', 'b('), t('--sdp-pe', 'dra-500')]);
    const inventat = t('--sdp-', 'inventat');
    expect(tokensFantasma(`.x { color: var(${inventat}); background: var(--sdp-fons-targeta); }`, TOKENS_DEFINITS)).toEqual([inventat]);
  });

  test('valors: valorDe llig la declaració i torna null si no hi és', () => {
    const cos = regles(dinsDeCapa('.x { inline-size: var(--sdp-touch); }'))[0].cos;
    expect(valorDe(cos, 'inline-size')).toBe('var(--sdp-touch)');
    expect(valorDe(cos, 'transform')).toBeNull();
  });

  test('blocs: un bloc del carrusel que no és l’últim es veu, i les sentències de primer nivell no en són', () => {
    const mostra = "@layer a, b; @import url('x.css'); @layer components { .sdp-carrusel { gap: 0; } } @layer components { .sdp-boto { gap: 0; } }";
    const blocs = blocsDePrimerNivell(mostra);
    expect(blocs.map((b) => b.text)).toEqual(['@layer components { .sdp-carrusel { gap: 0; } }', '@layer components { .sdp-boto { gap: 0; } }']);
    expect(mostra.slice(blocs[0].inici).startsWith('@layer components { .sdp-carrusel')).toBe(true);
    /* Una .sdp-boto darrere del bloc del carrusel: la comprovació d'ordre la veu. */
    expect(mostra.lastIndexOf('.sdp-boto')).toBeGreaterThan(blocs[0].inici);
  });

  test('empat amb el botó: .sdp-boto sense àmbit o dins de :where() sí; amb àmbit o amb estat, no', () => {
    expect(senseWhere(':where(.a, :where(.b)) .sdp-boto')).toBe('.sdp-boto');
    expect([
      '.sdp-boto', '.sdp-boto--secundari', ':where(.perfil-pagina) .sdp-boto', ':where(.a > .b) .sdp-boto--secundari',
      '.x .sdp-boto', '.sdp-boto:hover', '.sdp-boto--primari', ':where(.a) .sdp-boto:disabled', '.sdp-carrusel__boto'
    ].filter(empataAmbElBoto)).toEqual(['.sdp-boto', '.sdp-boto--secundari', ':where(.perfil-pagina) .sdp-boto', ':where(.a > .b) .sdp-boto--secundari']);
    const empats = regles('.sdp-boto { padding: 0; } :where(.y) .sdp-boto--secundari, .z .sdp-boto { gap: 0; }')
      .flatMap((r) => r.selectors.filter(empataAmbElBoto));
    expect(empats).toEqual(['.sdp-boto', ':where(.y) .sdp-boto--secundari']);
  });

  test('capes i imports: la capa de l’@import i les @layer s’hi sumen; l’ordre és el d’index.css', () => {
    expect(capaDe('components', [])).toBe('components');
    expect(capaDe('', ['@layer components', '@media (hover: hover)'])).toBe('components');
    expect(capaDe('', ['@layer legacy'])).toBe('legacy');
    expect(capaDe('', [])).toBe('');
    expect(capaDe('components', ['@layer components'])).toBe('components.components');
    expect(importsDe("@import url('./a.css'); @import url('../b/c.css') layer(components);")).toEqual([
      { fitxer: 'src/css/a.css', capa: '' }, { fitxer: 'src/b/c.css', capa: 'components' }
    ]);
  });
});
