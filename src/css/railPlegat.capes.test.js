// @vitest-environment node
/* Prompt 261014_0400 (ordre del Mestre), front B · Consolidació del plegat
   [|<]: plegar o desplegar no mou cap icona d'eix. Dos desajustos que cap
   prova no veia, perquè jsdom no fa layout (mesurats al navegador, 1440x900,
   Chromium amb barres de scroll clàssiques):
     · barra principal i BarraApp plegades: les cel·les centraven 28px de
       contingut (la icona i el margin-right de 4px de .icona-linia, base.css,
       perquè el <span> ocult continua al DOM) i la icona queia a x=14, no a
       l'eix x=16 de la roda de dalt; amb «Sistema» obert i la llista
       desbordada, la barra de scroll clàssica la duia a x=10;
     · rail plegat del Workspace: la roda (o la lupa) en una cel·la de
       var(--sdp-touch) apegada a la fila 1, i el rail amb vora i coixí de
       dalt: tot pujava 5px respecte de la columna oberta. La fila 2 només
       és de l'acció quan el rail en porta una; amb dues (el Bloc, o
       l'obridor i la lupa en «mitja» i «estret») oberta comparteixen la
       fila 2 i plegada s'apilen, i cap no pot caure a la mateixa y en els
       dos estats (correcció dels revisors: la primera versió del torn la
       donava a la primera acció, siga quina siga, i el bot creixia).
   Es comproven les regles escrites i la geometria que en resulta amb els
   valors de tokens.css. Cada guarda es prova també contra una còpia literal
   de les regles d'abans del torn: si no les detectara, no guardaria res. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { PUNTS_DE_TALL } from '../components/layout/graella.js';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();

/** Parteix una llista de selectors per les comes de primer nivell. */
function parteix(preludi) {
  const trossos = [];
  let fondaria = 0;
  let actual = '';
  for (const caracter of preludi) {
    if (caracter === '(' || caracter === '[') fondaria += 1;
    if (caracter === ')' || caracter === ']') fondaria -= 1;
    if (caracter === ',' && fondaria === 0) {
      trossos.push(net(actual));
      actual = '';
    } else {
      actual += caracter;
    }
  }
  if (actual.trim()) trossos.push(net(actual));
  return trossos;
}

/** Regles fulla, amb les @-regles que les embolcallen (@layer, @media…). */
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
        eixida.push({ selectors: parteix(preludi), cos: net(buf), context: pila.filter((p) => p.startsWith('@')) });
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
/** L'últim valor que la regla dona a la propietat (el que guanya dins d'ella). */
const valorDe = (regla, propietat) => declaracions(regla.cos).filter(([p]) => p === propietat).map(([, v]) => v).pop();
/** Les regles que porten exactament eixe selector. */
const ambSelector = (css, selector) => regles(css).filter((r) => r.selectors.includes(selector));

/* Tokens de mida en px (una sola declaració a tot src/css: tokens.css). */
const TOKENS = Object.fromEntries(
  [...senseComentaris(llig('src/css/tokens.css')).matchAll(/(--sdp-[\w-]+)\s*:\s*(\d+)px\s*;/g)].map((m) => [m[1], Number(m[2])])
);
function px(valor) {
  const token = /^var\((--[\w-]+)\)$/.exec(valor ?? '');
  if (token) {
    if (TOKENS[token[1]] === undefined) throw new Error(`token sense px: ${token[1]}`);
    return TOKENS[token[1]];
  }
  const literal = /^(-?\d+)(px)?$/.exec(valor ?? '');
  if (!literal) throw new Error(`valor no resoluble: ${valor}`);
  return Number(literal[1]);
}

/* Les icones de la barra i del rail es pinten a 24 (App.jsx, BarraApp.jsx i
   AppGridColumn.jsx: size={24}, o la mida de lucide per defecte). */
const ICONA = 24;
const { plegada } = PUNTS_DE_TALL;

const LAYOUT = llig('src/css/layout.css');
const GRAELLA = llig('src/components/layout/AppGridShell.css');
const MODULS = llig('src/css/modules.css');

/* ── Barra principal i BarraApp ───────────────────────────────────────── */
const CELLA_PLEGADA = '.sdp-root:not(.is-compact).sidebar-closed nav.app-sidebar .nav-item';
const TOGGLE_PLEGAT = '.sdp-root:not(.is-compact).sidebar-closed .sidebar-rail-toggle';

/** Les fallades de l'eix de la barra plegada en un layout.css donat. */
function auditaBarra(layoutCss) {
  const fallades = [];
  /* L'eix de dalt: el toggle plegat ocupa tota la fila del rail i centra la
     icona (la roda de la T24 o la icona de l'app). */
  const toggle = ambSelector(layoutCss, '.sidebar-rail-toggle');
  const toggleCentrat = toggle.some((r) => valorDe(r, 'justify-content') === 'center');
  const toggleSencer = ambSelector(layoutCss, TOGGLE_PLEGAT).some((r) => valorDe(r, 'width') === '100%');
  if (!toggleCentrat || !toggleSencer) fallades.push('el toggle plegat no centra la icona en tota la fila');
  const eixDeDalt = (plegada - ICONA) / 2;

  /* L'eix de la barra oberta: el coixí inline de l'entrada. */
  const base = ambSelector(layoutCss, '.nav-item').map((r) => valorDe(r, 'padding')).filter(Boolean);
  const eixObert = base.length === 1 ? px(base[0].split(' ')[1]) : NaN;
  if (eixObert !== eixDeDalt) fallades.push(`barra oberta: eix ${eixObert}, el de dalt és ${eixDeDalt}`);

  /* Les cel·les plegades: una sola regla, a la capa legacy (la del § TRUC),
     amb la icona al principi i el coixí d'inici de l'eix. */
  const cel = ambSelector(layoutCss, CELLA_PLEGADA);
  if (cel.length !== 1) {
    fallades.push(`cel·la plegada: ${cel.length} regles`);
    return fallades;
  }
  const [regla] = cel;
  if (regla.context.join(' | ') !== '@layer legacy') fallades.push(`cel·la plegada a [${regla.context.join(', ')}]`);
  const justifica = valorDe(regla, 'justify-content');
  if (justifica !== 'flex-start') fallades.push(`cel·la plegada: justify-content ${justifica}`);
  const inici = valorDe(regla, 'padding-inline-start');
  if (inici === undefined) {
    fallades.push('cel·la plegada: sense padding-inline-start');
  } else {
    if (inici !== 'var(--sdp-space-4)') fallades.push(`cel·la plegada: padding-inline-start ${inici}`);
    if (px(inici) !== eixDeDalt) fallades.push(`cel·la plegada: eix ${px(inici)}, el de dalt és ${eixDeDalt}`);
    /* El shorthand de després el tornaria a 0. */
    const ordre = declaracions(regla.cos).map(([p]) => p);
    if (ordre.lastIndexOf('padding') > ordre.lastIndexOf('padding-inline-start')) fallades.push('cel·la plegada: el padding de després anul·la l’inici');
  }
  return fallades;
}

/* Còpia literal de la regla d'abans del torn (layout.css, § TRUC). */
const LAYOUT_ABANS = `
.sidebar-rail-toggle { flex: none; width: var(--sdp-touch); height: var(--sdp-alt-accio); display: flex; align-items: center; justify-content: center; }
.nav-item { display: flex; align-items: center; gap: 13px; padding: var(--sdp-space-2) 16px; }
@layer legacy {
  ${TOGGLE_PLEGAT} { width: 100%; }
  ${CELLA_PLEGADA} {
    width: auto;
    height: var(--sdp-touch);
    min-height: var(--sdp-touch);
    margin: 0;
    padding: 0;
    justify-content: center;
    border-radius: 0;
  }
}`;

describe('barra principal i BarraApp plegades · layout.css', () => {
  test('la guarda caça la cel·la centrada d’abans del torn', () => {
    expect(auditaBarra(LAYOUT_ABANS)).toEqual([
      'cel·la plegada: justify-content center',
      'cel·la plegada: sense padding-inline-start'
    ]);
  });

  test('i un coixí d’inici que el padding de després anul·laria', () => {
    const girat = LAYOUT_ABANS.replace('padding: 0;\n    justify-content: center;', 'padding-inline-start: var(--sdp-space-4); justify-content: flex-start; padding: 0;');
    expect(auditaBarra(girat)).toEqual(['cel·la plegada: el padding de després anul·la l’inici']);
  });

  test('cap fallada: les icones plegades cauen a l’eix de dalt i de la barra oberta (16px), amb barra de scroll o sense', () => {
    expect(auditaBarra(LAYOUT)).toEqual([]);
    expect((plegada - ICONA) / 2).toBe(TOKENS['--sdp-space-4']);
  });

  test('la regla viu al § TRUC, abans de la portada buida, i l’amplària plegada continua literal', () => {
    const text = net(senseComentaris(LAYOUT));
    const posicio = text.indexOf(`${CELLA_PLEGADA} {`);
    expect(posicio).toBeGreaterThan(text.indexOf('@layer legacy {'));
    expect(posicio).toBeLessThan(text.indexOf('.hero-image--buit'));
    expect(text).toContain(`.sdp-root:not(.is-compact).sidebar-closed nav.app-sidebar { width: ${plegada}px; }`);
  });
});

/* ── Rail plegat del Workspace ────────────────────────────────────────── */
const PLEGADA = '.app-grid-col-header.app-grid-col-header--collapsed';
const FILA_1 = '.app-grid-col-header--collapsed .app-grid-col-header__rail-top';
const ACCIONS = '.app-grid-col-header--collapsed .app-grid-col-header__accio-icon';
/* La fila 2 només és de l'acció quan el rail en porta una (AppGridColumn hi
   posa app-grid-col-header--una-accio): és l'única que ocupa eixa fila també
   oberta. Sense la marca, la prenia la primera acció, siga quina siga. */
const FILA_2_GENERICA = `${FILA_1} + .app-grid-col-header__accio-icon`;
const FILA_2 = '.app-grid-col-header--collapsed.app-grid-col-header--una-accio .app-grid-col-header__rail-top + .app-grid-col-header__accio-icon';
const RAIL = '.app-grid-col-header--collapsed > .sdp-workspace-rail';
const OBERTA = '.sdp-workspace .sdp-workspace-column > .app-grid-col-header:not(.app-grid-col-header--collapsed)';
const MARGE_FILA_2 = 'calc((var(--sdp-alt-accio) - var(--sdp-touch)) / 2)';

/** La y (dins de la columna) de la cel·la de cada acció i de la primera
    carpeta, plegada i oberta, per a un rail amb `accions` accions (1: la roda
    de Disseny, Wiki i Perfil o la lupa de la llista en «ample»; 2: el Bloc, o
    l'obridor de la navegació i la lupa en «mitja» i «estret»), o les fallades
    si les regles no ho permeten saber. */
function geometriaRail(graellaCss, modulsCss, accions = 1) {
  const fallades = [];
  /* La regla que dona la propietat a eixe selector, que ha de ser una. */
  const una = (css, selector, propietat) => {
    const trobades = ambSelector(css, selector).filter((r) => valorDe(r, propietat) !== undefined);
    if (trobades.length !== 1) fallades.push(`${selector} { ${propietat} }: ${trobades.length} regles`);
    return trobades.length ? valorDe(trobades[trobades.length - 1], propietat) : undefined;
  };
  /* Oberta: dues files de capçalera de var(--sdp-alt-accio); totes les
     accions, cel·les de var(--sdp-touch) centrades a la fila 2, i la primera
     carpeta davall. */
  const fila = px(una(modulsCss, OBERTA, 'height'));
  const cella = px(una(graellaCss, ACCIONS, 'height'));
  const oberta = { accio: fila + (fila - cella) / 2, carpeta: 2 * fila };

  /* Plegada: la fila 1 (l'expandir), les accions i el rail apilats. */
  if (una(graellaCss, PLEGADA, 'gap') !== '0') fallades.push('plegada: amb gap');
  if (una(graellaCss, PLEGADA, 'padding') !== '0 0 var(--sdp-space-2)') fallades.push('plegada: amb coixí de dalt');
  const fila1 = px(una(graellaCss, FILA_1, 'height'));
  const ambMarge = (llista) => llista.filter((r) => valorDe(r, 'margin-block') !== undefined);
  const generiques = ambMarge(ambSelector(graellaCss, FILA_2_GENERICA));
  if (generiques.length) fallades.push('fila 2: la pren la primera acció, siga quina siga');
  const fila2 = ambSelector(graellaCss, FILA_2);
  const marge = fila2.length === 1 ? valorDe(fila2[0], 'margin-block') : undefined;
  if (marge !== MARGE_FILA_2) fallades.push(`fila 2: margin-block ${marge ?? 'cap'}`);
  const margeDe = (llista) => (llista.some((r) => valorDe(r, 'margin-block') === MARGE_FILA_2)
    ? (TOKENS['--sdp-alt-accio'] - TOKENS['--sdp-touch']) / 2 : 0);
  /* El marge és del germà adjacent de l'expandir, la primera acció: sense la
     marca, sempre; amb la marca, només si és l'única. */
  const m = generiques.length ? margeDe(generiques) : (accions === 1 ? margeDe(fila2) : 0);
  /* El rail: la regla de la graella (0,2,0, darrere de modules.css a la capa
     components) mana sobre la base de modules.css (.sdp-workspace-rail). */
  const base = ambSelector(modulsCss, '.sdp-workspace-rail');
  const sobre = ambSelector(graellaCss, RAIL);
  const delRail = (propietat) => [...base, ...sobre].map((r) => valorDe(r, propietat)).filter(Boolean).pop() ?? '0';
  const gruix = (vora) => px(vora.split(' ')[0]);
  const salt = px(delRail('margin-top')) + px(delRail('padding-top')) + gruix(delRail('border-top'));
  const ys = [];
  let y = fila1;
  for (let i = 0; i < accions; i += 1) {
    const mi = i === 0 ? m : 0;
    ys.push(y + mi);
    y += mi + cella + mi;
  }
  return { fallades, cella, oberta, plegada: { accions: ys, carpeta: y + salt } };
}

/* Còpia literal de les regles d'abans del torn: la roda apegada a la fila 1 i
   el rail amb la vora i el coixí de modules.css (.sdp-workspace-rail). */
const GRAELLA_ABANS = `
${PLEGADA} { display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start; gap: 0; height: 100%; padding: 0 0 var(--sdp-space-2); }
${FILA_1} { display: flex; flex: none; width: 100%; height: var(--sdp-alt-accio); padding: 0; margin-bottom: 0; }
${ACCIONS} { display: inline-flex; width: var(--sdp-touch); height: var(--sdp-touch); flex: none; align-self: center; }
${RAIL} { margin-top: 0; }`;

/* Còpia literal de la primera versió del torn: la fila 2 per al germà
   adjacent de l'expandir, sense la marca d'acció única. */
const GRAELLA_GENERICA = `
${PLEGADA} { display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start; gap: 0; height: 100%; padding: 0 0 var(--sdp-space-2); }
${FILA_1} { display: flex; flex: none; width: 100%; height: var(--sdp-alt-accio); padding: 0; margin-bottom: 0; }
${ACCIONS} { display: inline-flex; width: var(--sdp-touch); height: var(--sdp-touch); flex: none; align-self: center; }
${FILA_2_GENERICA} { margin-block: ${MARGE_FILA_2}; }
${RAIL} { margin-top: 0; padding-top: 0; border-top: 0; }`;

describe('rail plegat del Workspace · AppGridShell.css', () => {
  test('la guarda caça el salt de 5px d’abans del torn (la vora i el coixí de modules.css)', () => {
    const { fallades, oberta, plegada } = geometriaRail(GRAELLA_ABANS, MODULS);
    expect(fallades).toEqual(['fila 2: margin-block cap']);
    expect(ambSelector(MODULS, '.sdp-workspace-rail').map((r) => [valorDe(r, 'padding-top'), valorDe(r, 'border-top')]))
      .toEqual([['var(--sdp-space-1)', '1px solid var(--sdp-crom-vora-forta)']]);
    expect(oberta.accio - plegada.accions[0]).toBe(5);
    expect(oberta.carpeta - plegada.carpeta).toBe(5);
  });

  test('la guarda caça la fila 2 donada a la primera acció, siga quina siga: amb dues, el bot creixia', () => {
    const generica = geometriaRail(GRAELLA_GENERICA, MODULS, 2);
    const abans = geometriaRail(GRAELLA_ABANS, MODULS, 2);
    expect(generica.fallades).toEqual(['fila 2: la pren la primera acció, siga quina siga', 'fila 2: margin-block cap']);
    /* La segona acció (la roda del Bloc, la lupa de «mitja») baixava 10px
       i la primera carpeta, 5: més lluny de la fila 2 oberta que abans. */
    expect(generica.plegada.accions[1] - generica.oberta.accio).toBeGreaterThan(abans.plegada.accions[1] - abans.oberta.accio);
    expect(generica.plegada.carpeta - generica.oberta.carpeta).toBeGreaterThan(abans.plegada.carpeta - abans.oberta.carpeta);
  });

  test('cap fallada: amb una acció, la roda (o la lupa) i la primera carpeta cauen a la mateixa y plegada i oberta', () => {
    const { fallades, oberta, plegada } = geometriaRail(GRAELLA, MODULS, 1);
    expect(fallades).toEqual([]);
    expect(plegada).toEqual({ accions: [oberta.accio], carpeta: oberta.carpeta });
  });

  test('amb dues accions cap no pren la fila 2: queden on eren abans del torn i el rail s’apega a l’última', () => {
    const { fallades, cella, oberta, plegada } = geometriaRail(GRAELLA, MODULS, 2);
    const abans = geometriaRail(GRAELLA_ABANS, MODULS, 2);
    expect(fallades).toEqual([]);
    expect(plegada.accions).toEqual(abans.plegada.accions);
    expect(plegada.carpeta - plegada.accions[1]).toBe(cella);
    expect(plegada.carpeta - oberta.carpeta).toBeLessThan(abans.plegada.carpeta - abans.oberta.carpeta);
  });

  test('la fila 2 és de l’acció única, i només ella: la resta conserva la cel·la de var(--sdp-touch)', () => {
    expect(ambSelector(GRAELLA, FILA_2).map((r) => declaracions(r.cos))).toEqual([[['margin-block', MARGE_FILA_2]]]);
    expect(ambSelector(GRAELLA, FILA_2_GENERICA)).toEqual([]);
    expect(ambSelector(GRAELLA, ACCIONS).map((r) => [valorDe(r, 'width'), valorDe(r, 'height')])).toEqual([['var(--sdp-touch)', 'var(--sdp-touch)']]);
  });

  test('el rail plegat no porta vora ni coixí de dalt, a tots els rails (el precedent del Xat)', () => {
    expect(ambSelector(GRAELLA, RAIL).map((r) => declaracions(r.cos))).toEqual([[['margin-top', '0'], ['padding-top', '0'], ['border-top', '0']]]);
  });
});
