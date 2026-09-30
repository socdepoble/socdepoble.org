import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

/* T2 (ordre del Mestre, 260930) · Mètriques de tauler en h5 i Índex fins a
   h6. jsdom no calcula capes ni floats: es comprova la regla escrita, amb el
   mateix patró que PageFrame.capes.test.js. */
const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const moduls = net('src/css/modules.css');

/* El bloc que obri `obertura` (comptant claus) i conté `regla`. */
const blocDe = (text, obertura, regla) => {
  for (let obri = text.indexOf(obertura); obri >= 0; obri = text.indexOf(obertura, obri + 1)) {
    let fons = 0;
    for (let i = text.indexOf('{', obri); i < text.length; i += 1) {
      if (text[i] === '{') fons += 1;
      else if (text[i] === '}' && (fons -= 1) === 0) {
        const bloc = text.slice(obri, i + 1);
        if (bloc.includes(regla)) return bloc;
        break;
      }
    }
  }
  return '';
};

const METRIQUES = '.sdp-consola__metriques { clear: both; display: grid; gap: var(--sdp-space-1); }';

test('T2 · el bloc de mètriques esquiva la insígnia flotant (clear) i viu a @layer components', () => {
  expect(moduls).toContain(METRIQUES);
  expect(blocDe(moduls, '@layer components {', METRIQUES)).toContain(METRIQUES);
});

test('T2 · cada mètrica és un h5 centrat, amb xifres tabulars i tipografia de tokens', () => {
  const regla = blocDe(moduls, '.sdp-consola__metrica {', 'text-align');
  for (const declaracio of [
    'margin: 0;', 'font-size: var(--sdp-text-h5);', 'line-height: var(--sdp-leading-snug);', 'font-weight: 700;',
    'color: var(--sdp-accio-text);', 'text-align: center;', 'font-variant-numeric: tabular-nums;',
    'scroll-margin-top: calc(var(--sdp-alt-accio) + var(--sdp-space-4));'
  ]) expect(regla, declaracio).toContain(declaracio);
  // Pedra Seca: cap valor cru (px, hex) dins de la regla.
  expect(regla).not.toMatch(/\d+px|#[0-9a-f]{3,6}\b/i);
  // Guanya a l'h5 de base.css (legacy) per capa, sense apujar l'especificitat.
  expect(blocDe(moduls, '@layer components {', '.sdp-consola__metrica {')).not.toBe('');
});

test('T2 · els nivells 5 i 6 de l’Índex van sagnats, al costat dels altres nivells (@layer legacy)', () => {
  const legacy = blocDe(moduls, '@layer legacy {', '.toc-level-4 button {');
  expect(legacy).toContain('.toc-level-5 button { padding-left: calc(var(--sdp-space-2) + var(--sdp-space-4)); font-weight: 700; color: var(--sdp-text-cos); font-variant-numeric: tabular-nums; }');
  expect(legacy).toContain('.toc-level-6 button { padding-left: calc(var(--sdp-space-2) + var(--sdp-space-6)); font-weight: 400; color: var(--sdp-text-suau); }');
});
