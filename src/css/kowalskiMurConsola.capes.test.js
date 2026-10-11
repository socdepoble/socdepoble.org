// @vitest-environment node
/* Onada 12 (261011; ordres 261011_0130, punt 5: «Heurístiques de Disseny») ·
   Les regles de moviment i d'interacció que la casa ja va adoptar de Kowalski
   el 261004 (pla 261004_0050; tokens.css, «àtoms de moviment»), fixades sobre
   UNA SUPERFÍCIE: el Mur i la Consola. És a dir, les regles que pinten la
   Targeta Universal (.sp-card*) i la Consola (.sdp-consola*), a modules.css i
   a components.css. Les proves bessones (components.abast, modules.abast,
   rocaIGuardes) vigilen el full sencer; esta diu què val per a la superfície
   i quines excepcions hi queden, amb nom.

   Font: el CSS de la casa i les seues proves. Les tres adreces de l'ordre
   (les guies de Kowalski) no s'han pogut llegir esta nit: ací no hi ha cap
   regla que vinga d'elles.

   jsdom no calcula capes, @media ni animacions: es comprova la regla escrita
   (mateix patró que la resta de proves *.capes de src/css). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (rel) => readFileSync(path.join(process.cwd(), rel), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Les regles fulla d'un full: { prelud, cos, pares, ordre }. */
function regles(css) {
  const eixida = [];
  const pila = [];
  let tros = '';
  for (const c of senseComentaris(css)) {
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: tros.slice(tros.lastIndexOf(';') + 1).trim().replace(/\s+/g, ' '), fills: false });
      tros = '';
    } else if (c === '}') {
      const marc = pila.pop();
      if (marc && !marc.fills) eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim(), pares: pila.map((p) => p.prelud), ordre: eixida.length });
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}
const declaracions = (r) => r.cos.split(';').map((d) => d.trim()).filter((d) => d.includes(':')).map((d) => {
  const tall = d.indexOf(':');
  return [d.slice(0, tall).trim(), d.slice(tall + 1).trim()];
});
const de = (r, propietat) => declaracions(r).filter(([p]) => p === propietat).map(([, v]) => v).at(-1);

const FULLS = {
  'modules.css': regles(llig('src/css/modules.css')),
  'components.css': regles(llig('src/css/components.css'))
};
const TOTES = Object.entries(FULLS).flatMap(([full, rs]) => rs.map((r) => ({ ...r, full })));
/** Prelud exacte, en un full: totes les regles, en ordre de font. */
const amb = (full, prelud) => FULLS[full].filter((r) => r.prelud === prelud);
/** El valor que mana (l'última declaració amb eixe prelud exacte, en eixe full). */
const valor = (full, prelud, propietat) => amb(full, prelud).map((r) => de(r, propietat)).filter((v) => v !== undefined).at(-1);

/* LA SUPERFÍCIE (lliçó 260923: l'abast es definix per superfície, no per patró). */
const SUPERFICIE = TOTES.filter((r) => /\.sp-card|\.sdp-consola/.test(r.prelud));
const on = (r) => `${r.full} · ${r.prelud}`;
const ambGuarda = (r) => r.pares.some((p) => p.startsWith('@media') && p.includes('(hover: hover)') && p.includes('(pointer: fine)'));
const enCapaComponents = (r) => r.pares[0] === '@layer components';

/* EXCEPCIONS AMB NOM · regles que no complixen i que esta passada no toca.
   · .sp-card (la regla base) i .sp-card--action:hover: les copia lletra per
     lletra UniversalCard.vinyeta.capes.test.jsx. La primera ja no mana (una
     regla nova, darrere, li apaga la transició). La segona és la recepta del
     Control (alça 2px, 0.2s ease, sense guarda de ratolí): la pinten
     Traduccions i una peça obsoleta de la Consola, fora del Mur i de la
     Consola d'ara. Pendent d'ordre.
   · Els neutralitzadors: tornen una targeta al seu repòs i han de valdre
     també al tàctil. */
const RECEPTA_DEL_CONTROL = '.sp-card--action:hover';
const NEUTRALITZADORS = [
  '.sp-card--action.sdp-consola__quieta:hover, .sdp-consola__targeta.sdp-consola__quieta:hover',
  '.sdp-connectar__previsualitzacio .sp-card:hover'
];

/* Segona passada (Kowalski §1 i §7, document 261011_0246 de l'Escriptori). */
const VEL = '.sp-card-link-overlay';
const VEL_FOSC = ':root[data-theme="dark"] .sp-card-link-overlay:active, :host([data-theme="dark"]) .sp-card-link-overlay:active';
const MENU_DE_LA_TARGETA = '.sp-card-footer .sdp-menu-comentar';

const transicions = SUPERFICIE.flatMap((r) => declaracions(r).filter(([p]) => /^transition(-property)?$/.test(p)).map(([, v]) => ({ r, v })));
const propietats = (v) => v.split(',').map((t) => t.trim().split(/\s+/)[0]);

describe('la superfície existix i la sonda la veu', () => {
  test('hi ha regles de la targeta i de la Consola als dos fulls, i les seues transicions', () => {
    expect(SUPERFICIE.filter((r) => r.full === 'components.css').length).toBeGreaterThan(80);
    expect(SUPERFICIE.filter((r) => r.full === 'modules.css').length).toBeGreaterThan(30);
    expect(transicions.length).toBeGreaterThanOrEqual(6);
    expect(propietats('background-color var(--sdp-t), transform var(--sdp-durada-premut) var(--sdp-corba-eixida)')).toEqual(['background-color', 'transform']);
  });
});

describe('moviment · només àtoms del sistema', () => {
  test('cap `transition: all`', () => {
    expect(transicions.filter(({ v }) => propietats(v).includes('all')).map(({ r }) => on(r))).toEqual([]);
  });

  test('cap durada ni corba escrita a mà: --sdp-t, --sdp-durada-* i --sdp-corba-* (llevat de la recepta del Control)', () => {
    const literals = transicions
      .filter(({ v }) => /cubic-bezier\(|\b(ease|ease-in|ease-out|ease-in-out|linear)\b|(?<![\w.-])\d*\.?\d+m?s\b/.test(v))
      .map(({ r }) => r.prelud);
    expect(literals).toEqual([RECEPTA_DEL_CONTROL]);
  });

  test('cap transició anima maquetació (width, height, padding, margin…)', () => {
    const dolentes = transicions.filter(({ v }) => propietats(v).some((p) => /^(width|height|min-height|max-height|padding|margin|inline-size|block-size|top|left|right|bottom|inset)$/.test(p)));
    expect(dolentes.map(({ r }) => on(r))).toEqual([]);
  });

  test('una sola animació d’entrada a la superfície, la del menú de Comentar de la targeta; cap scale(0)', () => {
    const animades = SUPERFICIE.filter((r) => declaracions(r).some(([p, v]) => /^animation(-name)?$/.test(p) && v !== 'none'));
    expect(animades.map(on)).toEqual([`components.css · ${MENU_DE_LA_TARGETA}`]);
    expect(SUPERFICIE.filter((r) => /scale\(0\)/.test(r.cos)).map(on)).toEqual([]);
  });

  test('moviment reduït: l’escala del premut val 1 (tokens.css) i l’apagador global és el de base.css, sense capa', () => {
    const tokens = regles(llig('src/css/tokens.css')).filter((r) => r.pares.some((p) => p.includes('prefers-reduced-motion: reduce')));
    expect(Object.fromEntries(tokens.flatMap(declaracions))['--sdp-escala-premut']).toBe('1');
    const apagador = regles(llig('src/css/base.css')).filter((r) => r.pares.some((p) => p.includes('prefers-reduced-motion: reduce')));
    expect(apagador).toHaveLength(1);
    expect(apagador[0].pares).toEqual(['@media (prefers-reduced-motion: reduce)']);
    expect(apagador[0].cos).toMatch(/transition-duration: 0\.01ms !important/);
  });
});

describe('l’ombra de la targeta no s’anima', () => {
  test('la transició que mana a .sp-card és `none`: una regla nova, a la mateixa capa i darrere de la fixada', () => {
    const targeta = amb('components.css', '.sp-card');
    const fixada = targeta.find((r) => de(r, 'transition') === 'box-shadow var(--sdp-t-lenta)');
    const nova = targeta.find((r) => de(r, 'transition') === 'none');
    expect(fixada, 'la regla base que copia UniversalCard.vinyeta.capes.test.jsx').toBeDefined();
    expect(nova, 'la regla nova de l’Onada 12').toBeDefined();
    expect(nova.cos).toBe('transition: none;');
    expect(enCapaComponents(fixada) && enCapaComponents(nova)).toBe(true);
    expect(nova.pares).toEqual(['@layer components']);
    expect(nova.ordre).toBeGreaterThan(fixada.ordre);
    expect(valor('components.css', '.sp-card', 'transition')).toBe('none');
  });

  test('cap altra regla de la superfície anima una ombra (llevat de la recepta del Control)', () => {
    const ombres = transicions.filter(({ v }) => /\bbox-shadow\b/.test(v)).map(({ r }) => r.prelud);
    expect(ombres).toEqual(['.sp-card', RECEPTA_DEL_CONTROL]);
  });

  test('les ombres de sempre es queden (Q6): --sdp-ombra-2 en repòs i --sdp-ombra-3 amb el ratolí, dins de la guarda', () => {
    expect(valor('components.css', '.sp-card', 'box-shadow')).toBe('var(--sdp-ombra-2)');
    const hover = amb('components.css', '.sp-card:hover');
    expect(hover).toHaveLength(1);
    expect(hover[0].cos).toBe('box-shadow: var(--sdp-ombra-3);');
    expect(ambGuarda(hover[0])).toBe(true);
  });
});

describe('hover · de color, i només amb ratolí', () => {
  const hovers = SUPERFICIE.filter((r) => r.prelud.includes(':hover'));

  test('tot :hover de la superfície viu dins de @media (hover: hover) and (pointer: fine), llevat de la recepta del Control i dels neutralitzadors', () => {
    const fora = hovers.filter((r) => !ambGuarda(r)).map((r) => r.prelud);
    expect(fora.sort()).toEqual([RECEPTA_DEL_CONTROL, ...NEUTRALITZADORS].sort());
  });

  test('cap hover alça ni engrandix (llevat de la recepta del Control), i els neutralitzadors no mouen res', () => {
    const mouen = hovers.filter((r) => { const t = de(r, 'transform'); return t !== undefined && t !== 'none'; }).map((r) => r.prelud);
    expect(mouen).toEqual([RECEPTA_DEL_CONTROL]);
    for (const prelud of NEUTRALITZADORS) {
      const r = TOTES.find((x) => x.prelud === prelud);
      expect(r, prelud).toBeDefined();
      expect(de(r, 'transition'), prelud).toBeUndefined();
    }
  });
});

describe('premut · tot el que es pot prémer respon, amb la transició en repòs', () => {
  const PREMUT = 'scale(var(--sdp-escala-premut))';
  const TRANSICIO_PREMUT = 'transform var(--sdp-durada-premut) var(--sdp-corba-eixida)';

  test('les peces menudes de la targeta premen amb l’escala del sistema, declarada en repòs', () => {
    for (const [repos, premut] of [['.sp-card-label__action', '.sp-card-label__action:active'], ['.sp-card-calendar-badge', 'button.sp-card-calendar-badge:active']]) {
      expect(valor('components.css', premut, 'transform'), premut).toBe(PREMUT);
      expect(valor('components.css', repos, 'transition').split(',').map((t) => t.trim()), repos).toContain(TRANSICIO_PREMUT);
      expect(valor('components.css', premut, 'transition'), `${premut}: la transició no viu dins del premut`).toBeUndefined();
    }
  });

  test('la família de barra del peu i de la boina (Q3): cap transform, el premut és de color', () => {
    for (const prelud of ['.sp-card-action:active:not(:disabled), .btn-icon-orange:active:not(:disabled), .sdp-emoticona-barra--boto:active:not(:disabled)', '.btn-connectar:active:not(:disabled)', 'button.btn-date-time:active:not(:disabled)']) {
      const r = amb('components.css', prelud);
      expect(r, prelud).toHaveLength(1);
      expect(de(r[0], 'background'), prelud).toMatch(/^var\(--sdp-/);
      expect(de(r[0], 'transform'), prelud).toBeUndefined();
    }
  });

  test('el desplegable de la Consola: premut de color (el del hover), sense escala, amb la transició del fons en repòs', () => {
    const CAP = '.sdp-consola__detall-cap';
    const hover = amb('modules.css', `${CAP}:hover`);
    const premut = amb('modules.css', `${CAP}:active`);
    expect(hover).toHaveLength(1);
    expect(premut).toHaveLength(1);
    expect(ambGuarda(hover[0])).toBe(true);
    expect(ambGuarda(premut[0]), 'el premut val també al tàctil').toBe(false);
    expect(premut[0].cos).toBe('background: var(--sdp-fons-subtil);');
    expect(de(premut[0], 'background')).toBe(de(hover[0], 'background'));
    expect(valor('modules.css', CAP, 'transition')).toBe('background var(--sdp-t)');
    expect(valor('modules.css', CAP, 'min-height'), 'sòl tàctil').toBe('var(--sdp-touch)');
  });

  test('els títols enllaçats de l’Índex: premut de color (el del hover dels enllaços), mai translúcid, amb la transició en repòs', () => {
    const ENLLAC = '.sdp-consola__index :is(h3, h4) > a';
    expect(valor('modules.css', ENLLAC, 'transition')).toBe('color var(--sdp-t)');
    const premut = amb('modules.css', `${ENLLAC}:active`);
    expect(premut).toHaveLength(1);
    expect(premut[0].cos).toBe('color: var(--sdp-accent-text-hover);');
    expect(premut[0].pares).toEqual(['@layer components']);
    /* El mateix color del hover dels enllaços (base.css). */
    const base = regles(llig('src/css/base.css'));
    expect(de(base.find((r) => r.prelud === 'a:hover'), 'color')).toBe('var(--sdp-accent-text-hover)');
  });

  test('cap premut de la superfície baixa l’opacitat a modules.css (AAA: cap text translúcid)', () => {
    const translucids = SUPERFICIE.filter((r) => r.full === 'modules.css' && r.prelud.includes(':active') && de(r, 'opacity') !== undefined);
    expect(translucids.map(on)).toEqual([]);
  });
});

describe('Kowalski §1 · la targeta sencera respon en prémer-la (el vel enllaç)', () => {
  const TOKENS = regles(llig('src/css/tokens.css'));
  const clar = Object.fromEntries(TOKENS.filter((r) => !r.pares.length && !r.prelud.includes('[')).flatMap(declaracions));

  test('la regla base i l’anell de focus, fixats per altres proves, són els de sempre', () => {
    const base = amb('components.css', VEL).find((r) => de(r, 'position') === 'absolute');
    expect(base.cos).toBe('position: absolute; inset: 0; z-index: 1; border-radius: inherit; outline: none; background: transparent; border: none; cursor: pointer;');
    const anell = amb('components.css', `${VEL}:focus-visible`).filter((r) => r.pares.join(' ') === '@layer components');
    expect(anell.map((r) => r.cos)).toEqual(['box-shadow: 0 0 0 3px var(--sdp-focus) inset;']);
    expect(valor('components.css', VEL, 'z-index')).toBe('1');
  });

  test('en prémer, el vel es tiny a l’instant: color de token, sense escala i sense transició d’entrada', () => {
    const premut = amb('components.css', `${VEL}:active`);
    expect(premut).toHaveLength(1);
    expect(premut[0].cos).toBe('background-color: var(--sdp-fons-hover-subtil); transform: none; transition: none;');
    expect(premut[0].pares).toEqual(['@layer components']);
    expect(ambGuarda(premut[0]), 'val també al tàctil').toBe(false);
  });

  test('la tornada és suau i es declara en repòs: una regla nova, darrere de la fixada, que només nomena el fons', () => {
    const repos = amb('components.css', VEL);
    const nova = repos.find((r) => de(r, 'transition') !== undefined);
    const base = repos.find((r) => de(r, 'position') === 'absolute');
    expect(nova.cos).toBe('transition: background-color var(--sdp-t);');
    expect(nova.pares).toEqual(['@layer components']);
    expect(nova.ordre).toBeGreaterThan(base.ordre);
    expect(amb('components.css', `${VEL}:active`)[0].ordre).toBeGreaterThan(nova.ordre);
    /* --sdp-t és la durada ràpida amb la corba d'eixida: per davall del sostre. */
    expect(clar['--sdp-t']).toBe('var(--sdp-durada-rapida) var(--sdp-corba-eixida)');
    expect(Number.parseInt(clar['--sdp-durada-rapida'], 10)).toBeLessThanOrEqual(Number.parseInt(clar['--sdp-durada-sostre'], 10));
  });

  test('el vel es veu en clar i en fosc: la roca al 6 % en clar i el blanc al 7 % en fosc, el parell de l’etiqueta que es pot prémer', () => {
    expect(clar['--sdp-fons-hover-subtil']).toBe('rgba(14, 13, 12, 0.06)');
    expect(clar['--sdp-crom-realc']).toBe('rgba(255, 255, 255, 0.07)');
    const fosc = amb('components.css', VEL_FOSC);
    expect(fosc).toHaveLength(1);
    expect(fosc[0].cos).toBe('background-color: var(--sdp-crom-realc);');
    expect(fosc[0].pares).toEqual(['@layer components']);
    expect(fosc[0].ordre).toBeGreaterThan(amb('components.css', `${VEL}:active`)[0].ordre);
    /* El mateix parell, ja en ús a la targeta. */
    expect(valor('components.css', '.sp-card-label__action:hover', 'background')).toBe('var(--sdp-fons-hover-subtil)');
    expect(valor('components.css', ':root[data-theme="dark"] .sp-card-label__action:hover, :host([data-theme="dark"]) .sp-card-label__action:hover', 'background')).toBe('var(--sdp-crom-realc)');
  });

  test('les peces interactives de la targeta viuen damunt del vel: prémer-les no el tiny', () => {
    const damunt = amb('components.css', '.sp-card-header, .sp-card-footer, .sp-card-author-link, .sp-card-author-block, .btn-icon-orange, .btn-date-time, .sp-card-action, .sp-card-connect, .sp-card-labels, .sp-card-copyright, .sp-card-body a, .sp-card-body span[onClick]');
    expect(damunt).toHaveLength(1);
    expect(Number(de(damunt[0], 'z-index'))).toBeGreaterThan(Number(valor('components.css', VEL, 'z-index')));
  });
});

describe('Kowalski §7 · el menú de Comentar de la targeta naix del seu botó', () => {
  const MODULS_TOTS = regles(llig('src/css/modules.css'));

  test('entra amb sdp-aparicio-menu, la durada ràpida i la corba d’eixida, amb l’origen baix a l’esquerra', () => {
    const regla = amb('components.css', MENU_DE_LA_TARGETA).find((r) => de(r, 'animation') !== undefined);
    expect(regla.cos).toBe('transform-origin: bottom left; animation: sdp-aparicio-menu var(--sdp-durada-rapida) var(--sdp-corba-eixida);');
    expect(regla.pares).toEqual(['@layer components']);
    /* La mateixa entrada dels menús del Xat (modules.abast.capes.test.js). */
    expect(valor('modules.css', '.sdp-xat-menu', 'animation')).toBe(de(regla, 'animation'));
  });

  test('l’animació no trepitja cap transform del seu lloc: el menú es posa amb bottom i inset-inline-start', () => {
    const lloc = amb('components.css', MENU_DE_LA_TARGETA).find((r) => de(r, 'position') === 'absolute');
    expect(lloc.cos).toBe('position: absolute; bottom: 100%; inset-inline-start: var(--sdp-space-2); z-index: 1;');
    const ambTransform = TOTES.filter((r) => /sdp-menu-(comentar|traduir)/.test(r.prelud) && de(r, 'transform') !== undefined).map((r) => r.prelud);
    /* L'únic transform de la família és el centrat del menú de la barra blava… */
    expect(ambTransform).toEqual(['.bar-blue .sdp-menu-traduir']);
    /* …i per això eixe no s'anima: perdria el translateX(-50%). */
    const animats = TOTES.filter((r) => /sdp-menu-(comentar|traduir)/.test(r.prelud) && de(r, 'animation') !== undefined).map((r) => r.prelud);
    expect(animats).toEqual([MENU_DE_LA_TARGETA]);
  });

  test('ix de 0,96 (mai de 0) i de l’opacitat; amb moviment reduït l’escala val 1 i només queda la fosa', () => {
    const des = MODULS_TOTS.filter((r) => r.pares.includes('@keyframes sdp-aparicio-menu'));
    expect(des.map((r) => [r.prelud, r.cos])).toEqual([['from', 'opacity: 0; transform: scale(var(--sdp-escala-aparicio));']]);
    const tokens = regles(llig('src/css/tokens.css'));
    const arrel = Object.fromEntries(tokens.filter((r) => !r.pares.length && !r.prelud.includes('[')).flatMap(declaracions));
    expect(arrel['--sdp-escala-aparicio']).toBe('0.96');
    const reduit = Object.fromEntries(tokens.filter((r) => r.pares.some((p) => p.includes('prefers-reduced-motion: reduce'))).flatMap(declaracions));
    expect(reduit['--sdp-escala-aparicio']).toBe('1');
  });
});

describe('anell de focus · geometria de tokens, i no s’anima', () => {
  test.each([
    ['modules.css', '.sdp-consola__detall-cap:focus-visible'],
    ['components.css', '.sp-card-copyright__enllac:focus-visible']
  ])('%s · %s: gruix i separació dels tokens', (full, prelud) => {
    expect(valor(full, prelud, 'outline')).toBe('var(--sdp-focus-gruix) solid var(--sdp-focus)');
    expect(valor(full, prelud, 'outline-offset')).toBe('var(--sdp-focus-separacio)');
  });

  test('els tokens valen el que hi havia escrit a mà (3px i 2px): cap píxel canvia', () => {
    const arrel = Object.fromEntries(regles(llig('src/css/tokens.css')).flatMap(declaracions));
    expect([arrel['--sdp-focus-gruix'], arrel['--sdp-focus-separacio']]).toEqual(['3px', '2px']);
  });

  test('cap transició de la superfície nomena outline ni outline-offset', () => {
    expect(transicions.filter(({ v }) => propietats(v).some((p) => /^outline/.test(p))).map(({ r }) => on(r))).toEqual([]);
  });
});

describe('xifres tabulars on els nombres canvien o s’alineen', () => {
  test.each([
    ['modules.css', '.sdp-consola__metrica'],
    ['modules.css', '.sdp-consola__dada'],
    ['components.css', '.sdp-consola__instantania']
  ])('%s · %s', (full, prelud) => {
    expect(valor(full, prelud, 'font-variant-numeric')).toBe('tabular-nums');
  });
});

describe('cap salt de maquetació · la imatge reserva el seu lloc', () => {
  test('el mitjà de la targeta i la miniatura de l’Índex porten aspect-ratio 1 / 1 abans que arribe la imatge', () => {
    expect(valor('components.css', '.sp-card-media-container', 'aspect-ratio')).toBe('1 / 1');
    expect(valor('components.css', '.sp-card-media', 'aspect-ratio')).toBe('1 / 1');
    const miniatura = TOTES.filter((r) => r.full === 'modules.css' && r.prelud.split(',').map((s) => s.trim()).includes('.sdp-consola__index-imatge'));
    expect(miniatura.map((r) => de(r, 'aspect-ratio')).filter(Boolean)).toEqual(['1 / 1']);
    expect(valor('modules.css', '.sdp-consola__index-imatge', 'inline-size')).toBe('calc(var(--sdp-space-16) * 2)');
  });

  test('la miniatura de l’H2 de l’Índex va centrada, com el seu títol i la seua entradeta; la regla només porta marge', () => {
    const centrada = amb('modules.css', '.sdp-consola__index > .sdp-consola__index-imatge');
    expect(centrada).toHaveLength(1);
    expect(centrada[0].cos).toBe('margin-inline: auto;');
    expect(centrada[0].pares).toEqual(['@layer components']);
    const base = regles(llig('src/css/base.css'));
    expect(de(base.find((r) => r.prelud === 'h2, .h2'), 'text-align')).toBe('center');
    expect(de(base.find((r) => r.prelud === '.lead'), 'text-align')).toBe('center');
  });
});
