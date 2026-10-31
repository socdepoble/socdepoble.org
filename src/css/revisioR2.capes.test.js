// @vitest-environment node
/* Revisió R2 del pla 261004_0050 (píxel, moviment, tàctil). Tres forats que
   les proves de cada full no veien:
     · pecesApps.css no era a cap llista de la Fase B: tres :hover sense guarda
       (al tàctil, la vora o el fons es queden enganxats després del toc);
     · layout.css: les icones de la barra negra encara pujaven 1px en passar-hi
       per damunt (Fase C: cap hover alça ni engrandix);
     · modules.css: els botons de classificació i de drets d'autor de la
       capçalera de l'editor tenien un sòl de 24px (Q2: 48px a tot arreu).
   jsdom no resol la cascada: es comproven les regles escrites, i cada guarda
   es prova contra una còpia literal de la forma d'abans. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

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

const GUARDA = '@media (hover: hover) and (pointer: fine)';

/** Els :hover fora de la guarda de ratolí. */
const hoversSenseGuarda = (css) => regles(css)
  .filter((r) => !r.context.includes(GUARDA))
  .flatMap((r) => r.selectors.filter((s) => s.includes(':hover')));

/** Els :hover que alcen o engrandixen (un transform que no és none). */
const hoversQueEsMouen = (css) => regles(css)
  .filter((r) => r.selectors.some((s) => s.includes(':hover')))
  .filter((r) => declaracions(r.cos).some(([p, v]) => p === 'transform' && v !== 'none'))
  .flatMap((r) => r.selectors);

/** Sòls d'alçada literals en px per davall dels 48px de la Q2. */
const solsMenuts = (css) => regles(css).flatMap((r) => declaracions(r.cos)
  .filter(([p, v]) => /^min-(height|block-size)$/.test(p) && /^\d+(\.\d+)?px$/.test(v) && parseFloat(v) < 48)
  .map(([p, v]) => `${r.selectors.join(', ')} { ${p}: ${v} }`));

/* ── Còpies literals de les regles d'abans de la revisió ── */
const PECES_ABANS = `@layer components {
  .sdp-rajola:hover { border-color: var(--sdp-vora-forta); }
  .sdp-teclat__tecla:hover { border-color: var(--sdp-vora-forta); }
  button.sdp-linia-temps__accio:hover, a.sdp-linia-temps__accio:hover { background: var(--sdp-fons-subtil); }
}`;
const BARRA_NEGRA_ABANS = `@media (hover: hover) and (pointer: fine) {
  .bar-black .right-icons .icon:hover { opacity: 1; transform: translateY(-1px); }
}`;
const BOTONERA_ABANS = `@layer components {
  .sdp-classificacio-botonera > .sdp-boto, .sdp-copyright-selector { min-height: 24px; height: auto; padding: 2px 8px; }
}`;

describe('les guardes detecten les formes d’abans', () => {
  test('hover sense guarda, hover que alça i sòl de 24px', () => {
    expect(hoversSenseGuarda(PECES_ABANS)).toEqual([
      '.sdp-rajola:hover', '.sdp-teclat__tecla:hover',
      'button.sdp-linia-temps__accio:hover', 'a.sdp-linia-temps__accio:hover'
    ]);
    expect(hoversQueEsMouen(BARRA_NEGRA_ABANS)).toEqual(['.bar-black .right-icons .icon:hover']);
    expect(solsMenuts(BOTONERA_ABANS)).toEqual(['.sdp-classificacio-botonera > .sdp-boto, .sdp-copyright-selector { min-height: 24px }']);
  });
});

/* tractor-vocabulari (261030) · El full de les peces és ara el bloc pecesApps
   de modules.css, entre les seues marques. */
function blocDeModuls(nom) {
  const tot = llig('src/css/modules.css');
  const inici = tot.indexOf(`/* ═══ BLOC ${nom} · `);
  const fi = tot.indexOf(`/* ═══ FI DEL BLOC ${nom} ═══ */`);
  if (inici < 0 || fi < inici) throw new Error(`modules.css no té el bloc ${nom}`);
  return tot.slice(inici, fi);
}

describe('Fase B · bloc pecesApps (modules.css)', () => {
  const PECES = blocDeModuls('pecesApps');

  test('tot :hover va dins de @media (hover: hover) and (pointer: fine)', () => {
    expect(hoversSenseGuarda(PECES)).toEqual([]);
  });

  test('la guarda no canvia de capa: les regles continuen dins de @layer components', () => {
    const guardades = regles(PECES).filter((r) => r.context.includes(GUARDA));
    expect(guardades.length).toBe(3);
    for (const r of guardades) expect(r.context[0], r.selectors.join(', ')).toBe('@layer components');
  });
});

describe('Fase C · cap hover alça ni engrandix (layout.css)', () => {
  test('la barra negra i la resta de la closca: el hover és d’opacitat o de color', () => {
    expect(hoversQueEsMouen(llig('src/css/layout.css'))).toEqual([]);
  });
});

describe('Q2 · sòl tàctil de 48px', () => {
  const FULLS = [
    /* modules.css porta ara els blocs pecesApps i catalegColleccio (261030). */
    'src/css/modules.css', 'src/css/components.css', 'src/css/layout.css',
    'src/components/layout/AppGridShell.css'
  ];

  test.each(FULLS)('%s: cap sòl d’alçada literal per davall de 48px', (ruta) => {
    expect(solsMenuts(llig(ruta))).toEqual([]);
  });

  test('classificació i drets d’autor de la capçalera de l’editor: el sòl és el token tàctil', () => {
    const cos = regles(llig('src/css/modules.css'))
      .filter((r) => r.selectors.includes('.sdp-classificacio-botonera > .sdp-boto') && r.selectors.includes('.sdp-copyright-selector'))
      .map((r) => r.cos).join('; ');
    expect(declaracions(cos).filter(([p]) => p === 'min-height').pop()?.[1]).toBe('var(--sdp-touch-min)');
  });
});

/* ── Hover dels botons blaus de la capçalera de l'editor ──
   «Categories» i «Emoticona» són .sdp-boto--secundari pintats de blau amb
   lletra blanca per la regla de la botonera (0,2,0). El hover del secundari
   (components.css, 0,3,0) hi guanyava el fons i hi posava --sdp-fons-subtil:
   blanc sobre gris clar, 1,18:1 mesurat al navegador. «Drets», «Vista A4» i
   «Crear portada» no tenien cap hover. */
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lluminancia = (hex) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lluminancia(a), lluminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** Valor d'un token als blocs sense @-regla de tokens.css (el clar; el fosc i el Bancal hi escriuen damunt). */
function token(nom, filtre) {
  const blocs = regles(llig('src/css/tokens.css')).filter((r) => r.context.length === 0 && filtre(r.selectors));
  const mapa = new Map(blocs.flatMap((r) => declaracions(r.cos)));
  let valor = mapa.get(nom);
  for (let salt = 0; valor && /^var\(/.test(valor) && salt < 10; salt += 1) {
    const seguent = valor.match(/^var\((--[\w-]+)\)$/)[1];
    valor = mapa.get(seguent) ?? token(seguent, (s) => s.includes(':root') && s.includes(':host'));
  }
  return valor;
}
const CLAR = (s) => s.includes(':root') && s.includes(':host') && !s.some((x) => x.includes('['));
const FOSC = (s) => s.some((x) => x === ':root[data-theme="dark"]');

describe('hover dels botons blaus de la capçalera de l’editor (Fase B i Q1)', () => {
  const RL = regles(llig('src/css/modules.css'));
  const BOTONERA = '.sdp-classificacio-botonera > .sdp-boto:hover:not(:disabled)';
  const DRETS = '.sdp-copyright-selector:hover:not(:disabled)';

  test('el fons de hover és el blau de control fort, dins de la guarda de ratolí, i guanya al del secundari', () => {
    const regla = RL.find((r) => r.selectors.includes(BOTONERA) && r.selectors.includes(DRETS));
    expect(regla?.context).toEqual(['@layer components', GUARDA]);
    expect(declaracions(regla.cos)).toEqual([['background', 'var(--sdp-accio-control-hover)']]);
  });

  test('la lletra blanca fa 7:1 o més sobre el fons de hover, en clar i en fosc (abans, 1,18:1)', () => {
    /* La forma d'abans: lletra blanca sobre --sdp-fons-subtil, llegits de
       tokens.css (design_guard no admet hex crus fora dels blocs de tema). */
    expect(contrast(token('--sdp-sobre-accio', CLAR), token('--sdp-fons-subtil', CLAR))).toBeLessThan(1.3);
    for (const tema of [CLAR, FOSC]) {
      const fons = token('--sdp-accio-control-hover', tema) ?? token('--sdp-accio-control-hover', CLAR);
      expect(contrast(token('--sdp-sobre-accio', CLAR), fons)).toBeGreaterThanOrEqual(7);
    }
  });
});
