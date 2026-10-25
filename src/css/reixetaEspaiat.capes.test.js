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

/* Fora de la reixeta amb motiu, no són deute:
     · margin -1px a base.css i a .sdp-nomes-lector: el patró visualment
       amagat (clip d'un píxel);
     · la resta de components.css, exempta amb el seu motiu a
       components.abast.capes.test.js (ESPAI_EXEMPT): la vora encavalcada de
       les pestanyes, el filet de l'anatomia i l'ajust òptic de la icona de
       l'alerta. */
const AMB_MOTIU = {
  'src/css/base.css': ['margin: -1px'],
  'src/css/components.css': ['margin: -1px', 'margin-top: 2px', 'margin-bottom: -2px', 'gap: 2px'],
};

/* Deute a HEAD b842160ac (cens del 261025). Es corregix passant a tokens
   (--sdp-space-N); el canvi de .nav-item (13px) i el de .btn (11px) mouen un
   píxel i demanen captura abans i després. */
const DEUTE = {
  'src/css/layout.css': ['gap: 13px', 'padding: 6px', 'padding: 6px', 'padding: 11px 20px', 'padding: 6px', 'padding: 11px 20px'],
  'src/css/modules.css': ['gap: 2px', 'margin-left: 2px', 'padding: 6px var(--sdp-space-2)', 'margin-top: 18px',
    'padding-inline: calc((var(--sdp-touch-min) - 18px) / 2)', 'gap: 2px', 'margin-top: 18px', 'padding: 2px 8px',
    'gap: 6px', 'padding-inline: 10px'],
  'src/css/sdp.css': ['margin-left: -10px'],
  'src/css/utilities.css': ['margin-bottom: 2px'],
  'src/css/wiki.css': ['padding: 10px 16px', 'margin-bottom: 18px', 'margin-bottom: 6px'],
};

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

  test('el detector veu les formes fora de reixeta i deixa passar les bones', () => {
    expect(foraDeReixeta('.a { gap: 13px; padding: 0.3rem 8px; margin: 0 auto; }'))
      .toEqual(['gap: 13px', 'padding: 0.3rem 8px']);
    expect(foraDeReixeta('.a { padding: 8px 1.25rem; margin-top: -4px; gap: var(--sdp-space-2); }')).toEqual([]);
    expect(foraDeReixeta('.a { padding-bottom: calc(var(--sdp-space-4) + env(safe-area-inset-bottom, 0px)); }')).toEqual([]);
    expect(foraDeReixeta('.a { padding-inline: calc((var(--sdp-touch-min) - 18px) / 2); }'))
      .toEqual(['padding-inline: calc((var(--sdp-touch-min) - 18px) / 2)']);
    expect(foraDeReixeta('.a { width: 13px; border: 1px solid; } /* gap: 13px */')).toEqual([]);
  });
});
