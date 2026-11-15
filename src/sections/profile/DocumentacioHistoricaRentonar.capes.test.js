/**
 * Onada R29 (DECISIÓ-R29-02, punt 8a) · La fitxa registral de /rentonar a mòbil.
 * La regla global :where(dl) de sdp.css (max-content 1fr) feia la columna dels noms de
 * 243px dins d'un dl de 252px (360px de pantalla): els valors anaven de x=313 a x=422 i
 * el contenidor (overflow: hidden) els tallava. L'encaix és local, a modules.css, i la
 * regla global no es toca.
 *
 * jsdom no calcula la graella: es comprova la regla escrita. La mesura amb Chrome
 * headless (una columna fins a 30rem i sense desbordar a 320, 360, 390 i 430px;
 * columnes idèntiques a les d'abans a 520, 640, 768 i 1280px; un contenidor de 252px
 * dins d'una pantalla ampla tampoc no desborda) és la de l'informe del grup G4 de la R29.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (rel) => readFileSync(resolve(process.cwd(), rel), 'utf8');

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
      pila.push({ preludi: net.slice(inici, i).replace(/\s+/g, ' ').trim(), cos: i + 1, fulla: true });
      inici = i + 1;
    } else if (c === '}') {
      const bloc = pila.pop();
      if (bloc?.fulla) {
        const declaracions = Object.fromEntries(net.slice(bloc.cos, i).split(';')
          .map((d) => d.trim()).filter(Boolean)
          .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).replace(/\s+/g, ' ').trim()]));
        eixida.push({ selector: bloc.preludi.replace(/\s*,\s*/g, ', '), declaracions, context: pila.map((p) => p.preludi) });
      }
      inici = i + 1;
    } else if (c === ';') {
      inici = i + 1;
    }
  }
  return eixida;
}

const moduls = regles(llig('src/css/modules.css'));
const ambSelector = (selector) => moduls.filter((r) => r.selector === selector);

describe('Onada R29 · 8a · la fitxa registral de /rentonar cap a mòbil sense tallar els valors', () => {
  test('fora de mòbil la columna dels noms pot encongir fins a la seua paraula més llarga', () => {
    const base = ambSelector('.sdp-rentonar-doc__fitxa').filter((r) => r.context.length === 1);
    expect(base).toHaveLength(1);
    expect(base[0].context).toEqual(['@layer components']);
    expect(base[0].declaracions['grid-template-columns']).toBe('minmax(min-content, max-content) 1fr');
  });

  test('fins a 30rem la fitxa passa a una sola columna i els valors llargs partixen dins de la caixa', () => {
    const mobil = ['@layer components', '@media (max-width: 30rem)'];
    const fitxa = ambSelector('.sdp-rentonar-doc__fitxa').filter((r) => r.context.join('|') === mobil.join('|'));
    expect(fitxa).toHaveLength(1);
    expect(fitxa[0].declaracions['grid-template-columns']).toBe('minmax(0, 1fr)');

    const valors = ambSelector('.sdp-rentonar-doc__fitxa > dd');
    expect(valors).toHaveLength(1);
    expect(valors[0].context).toEqual(mobil);
    expect(valors[0].declaracions['overflow-wrap']).toBe('anywhere');

    const parelles = ambSelector('.sdp-rentonar-doc__fitxa > dd + dt');
    expect(parelles).toHaveLength(1);
    expect(parelles[0].context).toEqual(mobil);
    expect(parelles[0].declaracions['margin-block-start']).toBe('var(--sdp-space-2)');
  });

  test('la regla global :where(dl) de sdp.css no canvia', () => {
    const sdp = regles(llig('src/css/sdp.css')).filter((r) => r.selector === ':where(dl)');
    expect(sdp).toHaveLength(1);
    expect(sdp[0].declaracions['grid-template-columns']).toBe('max-content 1fr');
  });
});
