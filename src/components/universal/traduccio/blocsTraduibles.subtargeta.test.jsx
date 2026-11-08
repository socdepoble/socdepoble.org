/* O4-CLAUDE-3 (D5-a11y-pedra-seca-02) · La primitiva <div class="sdp-subtargeta"
   data-sdp-subtargeta=""> sobreviu al Traductor de pàgina: blocsTraduibles apunta
   l'índex de la caixa de cada bloc i CosTraduit torna a embolicar els blocs seguits
   d'una mateixa caixa. Amb el PAGE_COPY de fediversity (4 partides), sanejat i
   muntat en jsdom: 4 caixes a l'original i 4 a la vista traduïda, cada una amb el
   seu h4 al capdavant i els seus h5. Dues caixes veïnes són dos div. */
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { blocsTraduibles, preparaTraduccio } from './blocsTraduibles.js';
import { CosTraduit } from './TraduccioPagina.jsx';
import { sanitizeHtml } from '../../../utils/sanitize.js';
import { PAGE_COPY } from '../../../sections/text/pageContent.js';

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

function arrelDe(html) {
  const arrel = document.createElement('article');
  arrel.innerHTML = sanitizeHtml(html);
  document.body.appendChild(arrel);
  return arrel;
}
/* Una traducció de prova: cada text torna marcat, en text o en HTML local. */
function tradueix(blocs) {
  const { textos, munta } = preparaTraduccio(blocs, { html: true });
  return munta(textos.map((entrada) => (typeof entrada === 'string' ? `[es] ${entrada}` : entrada.text.replace(/>([^<]+)</, '>[es] $1<'))));
}
const caixesDe = (node) => [...node.querySelectorAll(':scope > div[data-sdp-subtargeta]')];
const anatomia = (caixa) => ({
  primer: caixa.firstElementChild?.tagName.toLowerCase(),
  h5: caixa.querySelectorAll(':scope > h5').length,
  classe: caixa.className
});

test('fediversity: 4 caixes a l’original i 4 a la vista traduïda, cada una amb el seu h4 i els seus h5', () => {
  const arrel = arrelDe(PAGE_COPY.fediversity.html);
  const originals = caixesDe(arrel);
  expect(originals).toHaveLength(4);
  const esperada = originals.map(anatomia);
  expect(esperada.every(({ primer, h5 }) => primer === 'h4' && h5 > 0)).toBe(true);

  const blocs = blocsTraduibles(arrel);
  expect(new Set(blocs.filter((bloc) => Number.isInteger(bloc.subtargeta)).map((bloc) => bloc.subtargeta))).toEqual(new Set([0, 1, 2, 3]));

  for (const pintar of [blocs, tradueix(blocs)]) {
    const { container } = render(createElement(CosTraduit, { blocs: pintar, llengua: 'es' }));
    const caixes = caixesDe(container);
    expect(caixes).toHaveLength(4);
    expect(caixes.map(anatomia)).toEqual(esperada.map((caixa) => ({ ...caixa, classe: 'sdp-subtargeta' })));
    // El títol de cada caixa és el de l'original (en la vista traduïda, amb la marca de prova).
    caixes.forEach((caixa, i) => {
      expect(caixa.firstElementChild.textContent).toContain(originals[i].firstElementChild.textContent.trim());
    });
    cleanup();
  }
});

/* P0-62 bis (08-11-2026; ordre del Mestre al xat de Claude) · Descàrregues porta una caixa més, davant:
   els tres passos de Google Play (h5 i una llista numerada de tres). Les dues veïnes de les instruccions
   de cada navegador continuen tornant com a dos div. */
test('dues caixes veïnes (descàrregues) tornen com a dos div, i el que hi ha fora no hi entra', () => {
  const arrel = arrelDe(PAGE_COPY.descarregues.html);
  expect(caixesDe(arrel)).toHaveLength(3);
  expect(caixesDe(arrel)[0].querySelectorAll(':scope > ol > li')).toHaveLength(3);
  const { container } = render(createElement(CosTraduit, { blocs: tradueix(blocsTraduibles(arrel)), llengua: 'es' }));
  const caixes = caixesDe(container);
  expect(caixes).toHaveLength(3);
  expect(caixes.map((caixa) => caixa.firstElementChild.tagName.toLowerCase())).toEqual(['h5', 'h5', 'h5']);
  expect(caixes.map((caixa) => caixa.querySelectorAll('li').length)).toEqual([3, 3, 2]);
  // El paràgraf de darrere de la caixa dels passos és fora d'ella, i el de darrere de les veïnes, fora de la segona.
  expect(caixes[0].nextElementSibling?.tagName.toLowerCase()).toBe('p');
  expect(caixes[0].textContent).not.toContain('Si no formes part del grup');
  expect(caixes[2].nextElementSibling?.tagName.toLowerCase()).toBe('p');
  expect(caixes[2].textContent).not.toContain('El nom exacte de cada opció');
});

test('una pàgina sense subtargetes no porta cap caixa nova', () => {
  const arrel = arrelDe('<h3>Títol</h3><p>Text</p><ul><li>U</li></ul>');
  const blocs = blocsTraduibles(arrel);
  expect(blocs.some((bloc) => 'subtargeta' in bloc)).toBe(false);
  const { container } = render(createElement(CosTraduit, { blocs }));
  expect(container.querySelector('[data-sdp-subtargeta]')).toBeNull();
});
