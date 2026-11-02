// @vitest-environment node
/* Pedra Seca §3 (PS-05, 261025) · La reixeta de 4px: cap margin, padding ni
   gap amb un literal que no siga múltiple de 4px (px, o rem a 16px), en cap
   full de src/. Els tokens (var(), env()) no es miren: els vigila
   tokens.contracte.test.js. És un trinquet: el que hi ha hui fora de la
   reixeta està llistat amb fitxer i declaració, un literal nou fa fallar la
   prova, i el deute que es corregix s'ha de llevar de la llista (la prova
   també falla si en sobra). Cap captura de píxels: diu què declaren els
   fulls. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const ES_ESPAI = /^(margin|padding)(-(top|right|bottom|left|block|inline|block-start|block-end|inline-start|inline-end))?$|^(row-|column-)?gap$/;
const LONGITUD = /(?<![\w-])(-?\d*\.?\d+)(px|rem)(?![\w-])/g;

/** Els .css d'una carpeta, recursivament. */
function fulls(carpeta) {
  const eixida = [];
  for (const nom of readdirSync(carpeta)) {
    const ruta = join(carpeta, nom);
    if (statSync(ruta).isDirectory()) eixida.push(...fulls(ruta));
    else if (nom.endsWith('.css')) eixida.push(ruta);
  }
  return eixida;
}

/** Declaracions d'espai d'un full amb algun literal fora de la reixeta, com «propietat: valor». */
function foraDeReixeta(css) {
  const net = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const trobades = [];
  for (const [, prop, valor] of net.matchAll(/(?<![\w-])([a-z-]+)\s*:\s*([^;{}]+)/g)) {
    if (!ES_ESPAI.test(prop)) continue;
    const literals = valor.replace(/var\([^()]*(\([^()]*\))?[^()]*\)/g, ' ').replace(/env\([^)]*\)/g, ' ');
    const fora = [...literals.matchAll(LONGITUD)]
      .some(([, n, unitat]) => (Number(n) * (unitat === 'rem' ? 16 : 1)) % 4 !== 0);
    if (fora) trobades.push(`${prop}: ${valor.trim()}`);
  }
  return trobades;
}

/** El mateix cens amb el selector de cada declaració, com «selector { propietat: valor }». */
function foraDeReixetaAmbSelector(css) {
  // Els comentaris es buiden sense moure els offsets.
  const net = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  const trobades = [];
  for (const m of net.matchAll(/(?<![\w-])([a-z-]+)\s*:\s*([^;{}]+)/g)) {
    const [declaracio] = foraDeReixeta(`${m[1]}: ${m[2]};`);
    if (!declaracio) continue;
    const abans = net.slice(0, m.index);
    const obri = abans.lastIndexOf('{');
    // El selector comença darrere de la regla, la declaració o l'obertura (@media, @layer) d'abans.
    const tall = Math.max(...['}', ';', '{'].map((signe) => abans.lastIndexOf(signe, obri - 1)));
    trobades.push(`${abans.slice(tall + 1, obri).trim().replace(/\s+/g, ' ')} { ${declaracio} }`);
  }
  return trobades;
}

/* Fora de la reixeta amb motiu, no són deute:
     · margin -1px a base.css i a .sdp-nomes-lector: el patró visualment
       amagat (clip d'un píxel);
     · la resta de components.css, exempta amb el seu motiu a
       components.abast.capes.test.js (ESPAI_EXEMPT): la vora encavalcada de
       les pestanyes, el filet de l'anatomia i l'ajust òptic de la icona de
       l'alerta;
     · margin-left 2px a modules.css (.audio-play-btn svg, B7b 261102): l'ajust
       òptic del triangle de reproduir, que pesa a l'esquerra dins del cercle,
       com la icona de l'alerta. */
const AMB_MOTIU = {
  'src/css/base.css': ['margin: -1px'],
  'src/css/components.css': ['margin: -1px', 'margin-top: 2px', 'margin-bottom: -2px', 'gap: 2px'],
  'src/css/modules.css': ['margin-left: 2px'],
};

/* PS-05 (B7b, marató 261101_2143) · Trinquet a 0. Dels 21 literals del cens
   del 261025, 20 ja són tokens (--sdp-space-N, --sdp-mb-ul, --sdp-li-gap) i
   el del triangle de reproduir ha passat a AMB_MOTIU. El deute no torna a
   créixer: un literal nou es corregix amb un token, no s'apunta ací. */
const DEUTE = {};

describe('Pedra Seca §3 · reixeta de 4px a l’espaiat de tots els fulls de src/', () => {
  const cens = {};
  for (const ruta of fulls(resolve(ARREL, 'src'))) {
    const trobades = foraDeReixeta(readFileSync(ruta, 'utf8'));
    if (trobades.length) cens[relative(ARREL, ruta).split(sep).join('/')] = trobades;
  }

  test('cap literal nou fora de la reixeta, i cap deute ja corregit que encara siga a la llista', () => {
    const nous = [];
    const sobrants = [];
    for (const full of new Set([...Object.keys(cens), ...Object.keys(AMB_MOTIU), ...Object.keys(DEUTE)])) {
      const resta = [...(AMB_MOTIU[full] ?? []), ...(DEUTE[full] ?? [])];
      for (const declaracio of cens[full] ?? []) {
        const i = resta.indexOf(declaracio);
        if (i === -1) nous.push(`${full} → ${declaracio}`);
        else resta.splice(i, 1);
      }
      sobrants.push(...resta.map((declaracio) => `${full} → ${declaracio}`));
    }
    expect(nous, 'literals nous fora de la reixeta de 4px: usa --sdp-space-N').toEqual([]);
    expect(sobrants, 'deute ja corregit: lleva’l de la llista').toEqual([]);
  });

  /* PS-05 · El trinquet és a 0: cap deute, i les excepcions són les sis amb
     motiu escrit. Una excepció nova demana el motiu ací i canviar el compte. */
  test('trinquet a 0: el deute és buit i les excepcions amb motiu són sis', () => {
    expect(DEUTE).toEqual({});
    expect(Object.values(AMB_MOTIU).flat()).toHaveLength(6);
  });

  /* L'excepció de modules.css val per al triangle de reproduir i res més: el
     mateix «margin-left: 2px» en un altre selector seria deute nou. */
  test('l’ajust òptic de modules.css és només el del triangle de reproduir', () => {
    const modules = readFileSync(resolve(ARREL, 'src/css/modules.css'), 'utf8');
    expect(foraDeReixetaAmbSelector(modules)).toEqual(['.audio-play-btn svg { margin-left: 2px }']);
  });

  test('el detector veu les formes fora de reixeta i deixa passar les bones', () => {
    expect(foraDeReixeta('.a { gap: 13px; padding: 0.3rem 8px; margin: 0 auto; }'))
      .toEqual(['gap: 13px', 'padding: 0.3rem 8px']);
    expect(foraDeReixeta('.a { padding: 8px 1.25rem; margin-top: -4px; gap: var(--sdp-space-2); }')).toEqual([]);
    expect(foraDeReixeta('.a { padding-bottom: calc(var(--sdp-space-4) + env(safe-area-inset-bottom, 0px)); }')).toEqual([]);
    expect(foraDeReixeta('.a { padding-inline: calc((var(--sdp-touch-min) - 18px) / 2); }'))
      .toEqual(['padding-inline: calc((var(--sdp-touch-min) - 18px) / 2)']);
    expect(foraDeReixeta('.a { width: 13px; border: 1px solid; } /* gap: 13px */')).toEqual([]);
    // Les formes amb què B7b ha tancat el deute: tokens dins de calc() i tokens de prosa.
    expect(foraDeReixeta('.a { margin-left: calc(-1 * var(--sdp-space-3)); margin-bottom: var(--sdp-mb-ul); }')).toEqual([]);
    expect(foraDeReixeta('.a { padding-inline: calc((var(--sdp-touch-min) - var(--sdp-space-6)) / 2); }')).toEqual([]);
    expect(foraDeReixetaAmbSelector('.b {}\n.a svg { width: 9px; margin-left: 2px; }\n@media (x) { .c { gap: 6px; } }'))
      .toEqual(['.a svg { margin-left: 2px }', '.c { gap: 6px }']);
    // Un comentari amb «;» o «{» dins de la regla no ha de tallar el selector.
    expect(foraDeReixetaAmbSelector('.a svg {\n  /* motiu; vegeu { */\n  margin-left: 2px;\n}'))
      .toEqual(['.a svg { margin-left: 2px }']);
  });

  /* Ítem 11 de PS-05 · La icona de l'acció de text ocupa una cel·la de la
     diana tàctil: el coixí és (touch-min − glif) / 2, i el token restat ha de
     valdre el glif real que pinta AppGridColumn (24px), no un de suposat. */
  test('la cel·la de la icona de l’acció de text fa la diana tàctil amb el glif real', () => {
    const tokens = readFileSync(resolve(ARREL, 'src/css/tokens.css'), 'utf8')
      + readFileSync(resolve(ARREL, 'src/css/design-tokens.css'), 'utf8');
    const px = (nom) => Number(tokens.match(new RegExp(`${nom}:\\s*(\\d+)px`))?.[1]);
    const modules = readFileSync(resolve(ARREL, 'src/css/modules.css'), 'utf8');
    const regla = modules.match(/\.sdp-workspace \.app-grid-col-header__accio-text > svg \{([^}]*)\}/)?.[1] ?? '';
    const restat = regla.match(/padding-inline:\s*calc\(\(var\(--sdp-touch-min\) - var\((--sdp-[\w-]+)\)\) \/ 2\)/)?.[1];
    const columna = readFileSync(resolve(ARREL, 'src/components/layout/AppGridColumn.jsx'), 'utf8');
    const glif = Number(columna.match(/<a\.icona size=\{a\.iconSize \|\| (\d+)\}/)?.[1]);
    expect(restat, 'el coixí de la icona ha de ser (touch-min − token) / 2').toBeTruthy();
    expect(glif).toBeGreaterThan(0);
    expect(px(restat), 'el token restat ha de valdre el glif real').toBe(glif);
    const cella = (px('--sdp-touch-min') - px(restat)) + glif;
    expect(cella, 'la cel·la de la icona').toBe(48);
  });
});
