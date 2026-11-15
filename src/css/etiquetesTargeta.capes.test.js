/**
 * Onada R29 · Regressions R28 de les etiquetes de les targetes (components.css).
 *
 * R28-REG-02 · La regla R28 de les etiquetes de UniversalCard afegia padding-block:
 *   amb una línia de 22,4px, les curtes passaven de 28 a 30,4px, la beta de 24 a 31px
 *   i el li enllaçat de 28 a 36px. El min-height de --sdp-alt-pastilla ja dona els 28px.
 * R28-REG-01 · L'enllaç d'una etiqueta sense --enllac porta un marge negatiu que deixa
 *   el contingut del li 32px més curt. Amb el max-inline-size: 100% de .page-title-labels
 *   i de .sp-card-body, l'enllaç quedava 32px més estret que el seu text i es partia en
 *   dues o tres línies (/pobles, capçaleres de PageFrame). El màxim ha de recuperar
 *   exactament el que el marge li lleva; amb --enllac, sense marge negatiu, el 100%.
 *
 * jsdom no calcula la geometria: es comprova la regla escrita. La mesura amb Chrome
 * headless (28px i una sola línia als tres contextos, les llargues embolcallades sense
 * desbordar a 328px) és la de l'informe del grup G4 de la R29.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (rel) => fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');

/* Regles fulla del full, amb el selector normalitzat, les declaracions i les
   at-regles que les embolcallen. */
function regles(css) {
  const net = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const pila = [];
  const eixida = [];
  let inici = 0;
  for (let i = 0; i < net.length; i += 1) {
    const c = net[i];
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fulla = false;
      pila.push({ preludi: net.slice(inici, i).replace(/\s+/g, ' ').trim(), cos: i + 1, fulla: true, ordre: eixida.length });
      inici = i + 1;
    } else if (c === '}') {
      const bloc = pila.pop();
      if (bloc?.fulla) {
        const declaracions = Object.fromEntries(net.slice(bloc.cos, i).split(';')
          .map((d) => d.trim()).filter(Boolean)
          .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).replace(/\s+/g, ' ').trim()]));
        eixida.push({
          selector: bloc.preludi.replace(/\s*,\s*/g, ', '),
          declaracions,
          context: pila.map((p) => p.preludi)
        });
      }
      inici = i + 1;
    } else if (c === ';') {
      inici = i + 1;
    }
  }
  return eixida;
}

const components = regles(llig('src/css/components.css'));
const posicio = (selector) => components.findIndex((r) => r.selector === selector);
const regla = (selector) => {
  const trobades = components.filter((r) => r.selector === selector);
  expect(trobades, selector).toHaveLength(1);
  return trobades[0];
};

const DINS_TARGETA = ':where(.sp-card-body) > .sp-card-labels .sp-card-label';
const CAPCALERA = '.page-title-labels .sp-card-label';
const ENLLAC = '.sp-card-label > a.sp-card-label, .sp-card-label--enllac > .sp-card-label';
const ENLLAC_PROPI = '.sp-card-label--enllac > a.sp-card-label, .sp-card-label--enllac > .sp-card-label';

describe('Onada R29 · etiquetes de les targetes: 28px i una sola línia', () => {
  test('R28-REG-02 · les etiquetes de UniversalCard no sumen coixí vertical al mínim de 28px', () => {
    const tokens = llig('src/css/tokens.css');
    /* La Porta Tokens (T3, font única) llegiria una expressió literal com una segona declaració del token. */
    expect(tokens).toMatch(new RegExp(['--sdp-alt-pastilla', ':\\s*28px;'].join('')));

    const { declaracions, context } = regla(DINS_TARGETA);
    expect(context).toEqual(['@layer components']);
    expect(declaracions['min-height']).toBe('var(--sdp-alt-pastilla)');
    expect(declaracions.height).toBe('auto');
    for (const coixi of ['padding', 'padding-block', 'padding-top', 'padding-bottom', 'padding-block-start', 'padding-block-end']) {
      expect(declaracions, coixi).not.toHaveProperty(coixi);
    }
    /* El que la R28 volia arreglar continua: les llargues embolcallen dins de la caixa. */
    expect(declaracions['max-inline-size']).toBe('100%');
    expect(declaracions['white-space']).toBe('normal');
    expect(declaracions['overflow-wrap']).toBe('break-word');
  });

  test('R28-REG-01 · l’enllaç sense --enllac recupera amb el màxim el que li lleva el marge negatiu', () => {
    const { declaracions, context } = regla(ENLLAC);
    expect(context).toEqual(['@layer components']);
    const marge = /^calc\(var\((--[\w-]+)\) \* -1\)$/.exec(declaracions['margin-inline'] ?? '');
    expect(marge, 'margin-inline negatiu amb token').not.toBeNull();
    expect(declaracions['max-inline-size']).toBe(`calc(100% + 2 * var(${marge[1]}))`);
    expect(declaracions.padding).toBe(`0 var(${marge[1]})`);
  });

  test('R28-REG-01 · amb --enllac (sense marge negatiu) el màxim torna al 100% del li', () => {
    const { declaracions, context } = regla(ENLLAC_PROPI);
    expect(context).toEqual(['@layer components']);
    expect(declaracions['margin-inline']).toBe('0');
    expect(declaracions['max-inline-size']).toBe('100%');
  });

  test('R28-REG-01 · les regles de l’enllaç van darrere de les que posen max-inline-size: 100%', () => {
    /* .sp-card-label--enllac > .sp-card-label pesa (0,2,0), com les dues regles del 100%:
       guanya per ordre. Si es mogueren davant, l'enllaç tornaria a partir-se. */
    expect(posicio(CAPCALERA)).toBeGreaterThanOrEqual(0);
    expect(posicio(DINS_TARGETA)).toBeGreaterThanOrEqual(0);
    expect(posicio(ENLLAC)).toBeGreaterThan(posicio(CAPCALERA));
    expect(posicio(ENLLAC)).toBeGreaterThan(posicio(DINS_TARGETA));
    expect(posicio(ENLLAC_PROPI)).toBeGreaterThan(posicio(ENLLAC));
  });

  test('cap regla estira l’enllaç amb un margin-block negatiu: sense coixí al li, l’enllaç partit eixiria de la píndola', () => {
    const males = components
      .filter((r) => /a\.sp-card-label\b/.test(r.selector))
      .filter((r) => /^calc\(.*\* -1\)$|^-/.test(r.declaracions['margin-block'] ?? ''))
      .map((r) => r.selector);
    expect(males).toEqual([]);
  });
});
