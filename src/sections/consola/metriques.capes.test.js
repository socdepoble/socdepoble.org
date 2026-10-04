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

/* Derogat per l'ordre del Mestre del 261004 (barra taronja universal): el
   marge d'una sola barra, calc(var(--sdp-alt-accio) + var(--sdp-space-4)).
   Tota pàgina porta ara la blava i la taronja, totes dues sticky i de
   --sdp-alt-accio: el salt des de l'Índex ha de deixar la mètrica sencera
   per davall de les dues (verificador de la barra taronja, D1 · Consola). */
const DUES_BARRES = 'scroll-margin-top: calc(var(--sdp-alt-accio) * 2 + var(--sdp-space-4));';

test('T2 · cada mètrica és un h5 centrat, amb xifres tabulars i tipografia de tokens', () => {
  const regla = blocDe(moduls, '.sdp-consola__metrica {', 'text-align');
  for (const declaracio of [
    'margin: 0;', 'font-size: var(--sdp-text-h5);', 'line-height: var(--sdp-leading-snug);', 'font-weight: 700;',
    'color: var(--sdp-accio-text);', 'text-align: center;', 'font-variant-numeric: tabular-nums;',
    DUES_BARRES
  ]) expect(regla, declaracio).toContain(declaracio);
  // Pedra Seca: cap valor cru (px, hex) dins de la regla.
  expect(regla).not.toMatch(/\d+px|#[0-9a-f]{3,6}\b/i);
  // Guanya a l'h5 de base.css (legacy) per capa, sense apujar l'especificitat.
  expect(blocDe(moduls, '@layer components {', '.sdp-consola__metrica {')).not.toBe('');
});

/* Barra taronja universal (261004) · Els desplegables de la Consola i els
   controls de l'Explorador que reben el focus salten igual que les mètriques:
   el marge suma les dues barres, i cap regla de la Consola ni de l'Explorador
   no es queda amb el d'una sola. */
test('barra taronja universal · desplegables i Explorador deixen lloc a la blava i a la taronja', () => {
  expect(blocDe(moduls, '.sdp-consola__detall {', 'scroll-margin-top')).toContain(DUES_BARRES);
  expect(blocDe(moduls, '.sdp-explorador__grup > summary,', 'scroll-margin-top')).toContain(DUES_BARRES);
  const UNA_BARRA = 'scroll-margin-top: calc(var(--sdp-alt-accio) + var(--sdp-space-4));';
  expect(moduls).not.toContain(UNA_BARRA);
});

test('T2 · els nivells 5 i 6 de l’Índex van sagnats, al costat dels altres nivells (@layer legacy)', () => {
  const legacy = blocDe(moduls, '@layer legacy {', '.toc-level-4 button {');
  expect(legacy).toContain('.toc-level-5 button { padding-left: calc(var(--sdp-space-2) + var(--sdp-space-4)); font-weight: 700; color: var(--sdp-text-cos); font-variant-numeric: tabular-nums; }');
  expect(legacy).toContain('.toc-level-6 button { padding-left: calc(var(--sdp-space-2) + var(--sdp-space-6)); font-weight: 400; color: var(--sdp-text-suau); }');
});
