/* xat-ux-a11y-07 (T7a, 261104) · En el mode de selecció (Retall cap a Notes)
   la bombolla és una casella i dins no hi ha cap control: ni l'autor, ni la
   cita, ni l'adjunt, ni la llista d'«El Comú», ni les rutes de la Wiki. Els
   enllaços externs (EnllacSegur) se n'escapaven: dins de la casella hi havia
   un <a target="_blank"> enfocable, el Tab s'hi aturava i un toc obria la web
   i, alhora, marcava el missatge. Ara, en la selecció, cada enllaç és el seu
   text amb la mateixa classe (.sdp-xat-enllac: el mateix color i el mateix
   subratllat) i l'avís de domini enganyós (XAT-B05) continua al seu lloc.
   Fora de la selecció, el DOM de sempre. */
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import Bombolla from './Bombolla.jsx';

vi.mock('../../../data/backendPort.js', async (original) => ({
  ...(await original()),
  teCapacitat: () => true,
  urlAdjuntXat: vi.fn(async (id) => `https://adjunts.invalid/${id}`)
}));

/* El navegador avisa que la caixa és a la vista tan bon punt s'observa. */
class SempreALaVista {
  constructor(callback) { this.callback = callback; }

  observe(node) { queueMicrotask(() => this.callback([{ isIntersecting: true, target: node }], this)); }

  unobserve() {}

  disconnect() {}
}

beforeEach(() => { vi.stubGlobal('IntersectionObserver', SempreALaVista); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const t = (_, alternativa) => alternativa;
const TEXT = 'Programa: https://example.org/fira i *inscripcions a https://xn--80ak6aa92e.com/alta* fins dijous';
const missatge = (extra) => ({ id: 'm-1', sender: 'other', author: 'Pep', usuariId: 'pep', creatAl: '2026-11-04T08:00:00Z', text: TEXT, ...extra });
const pinta = (dades, opcions = {}) => render(
  <MemoryRouter>
    <ol><Bombolla missatge={missatge(dades)} locale="ca-ES" t={t} {...opcions} /></ol>
  </MemoryRouter>
);
const tria = (onAlterna = () => {}) => ({ seleccio: { actiu: true, triat: false, onAlterna } });
const paragraf = (container) => container.querySelector('p.sdp-xat-bombolla__text');
const casellaDe = (container) => container.querySelector('[role="checkbox"]');
const ENFOCABLES = 'a[href], button, input, select, textarea, audio[controls], video[controls], [tabindex]:not([tabindex="-1"])';
/* L'HTML d'un enllaç fora de la selecció, convertit en el del seu text quiet. */
const quiet = (html) => html.replace(/<a class="sdp-xat-enllac" href="[^"]*" target="_blank" rel="noopener noreferrer">/g, '<span class="sdp-xat-enllac">').replace(/<\/a>/g, '</span>');

test('dins de la casella cap enllaç: el text, la classe i l’avís, iguals que fora de la selecció', () => {
  const normal = pinta({});
  const htmlNormal = paragraf(normal.container).innerHTML;
  const textNormal = paragraf(normal.container).textContent;
  expect(paragraf(normal.container).querySelectorAll('a.sdp-xat-enllac[target="_blank"]')).toHaveLength(2);
  cleanup();

  const { container } = pinta({}, tria());
  const casella = casellaDe(container);
  expect(casella).not.toBeNull();
  expect(within(casella).queryAllByRole('link')).toEqual([]);
  expect(casella.querySelectorAll(ENFOCABLES)).toHaveLength(0);
  /* El mateix DOM llevat de l'<a> → <span> de la mateixa classe. */
  expect(paragraf(container).innerHTML).toBe(quiet(htmlNormal));
  expect(paragraf(container).textContent).toBe(textNormal);
  expect(textNormal.startsWith('Programa: https://example.org/fira i inscripcions a https://xn--80ak6aa92e.com/alta')).toBe(true);
  expect([...casella.querySelectorAll('.sdp-xat-enllac')].map((el) => [el.tagName, el.textContent])).toEqual([
    ['SPAN', 'https://example.org/fira'],
    ['SPAN', 'https://xn--80ak6aa92e.com/alta']
  ]);
  /* L'avís de domini enganyós (XAT-B05) continua, dins del <strong>. */
  const avis = within(casella).getByRole('note');
  expect(avis.textContent).toContain('xn--80ak6aa92e.com');
  expect(avis.closest('strong')).not.toBeNull();
});

test('un toc damunt de l’adreça marca el missatge una sola vegada i no obri res', () => {
  const onAlterna = vi.fn();
  const { container } = pinta({}, tria(onAlterna));
  const adreca = within(casellaDe(container)).getByText('https://example.org/fira');
  expect(adreca.closest('a')).toBeNull();
  fireEvent.click(adreca);
  expect(onAlterna).toHaveBeenCalledTimes(1);
});

test('el teclat de la casella continua: Espai i Retorn la marquen, una vegada cada tecla', () => {
  const onAlterna = vi.fn();
  const { container } = pinta({}, tria(onAlterna));
  const casella = casellaDe(container);
  expect(casella.getAttribute('tabindex')).toBe('0');
  fireEvent.keyDown(casella, { key: ' ' });
  fireEvent.keyDown(casella, { key: 'Enter' });
  expect(onAlterna).toHaveBeenCalledTimes(2);
});

test('el peu d’una foto en la selecció: tampoc no porta cap enllaç', async () => {
  const { container } = pinta({
    tipus: 'imatge', estatEnviament: 'enviat', metadades: { adjunt: { id: '00000000-0000-4000-8000-000000000001' } }
  }, { ...tria(), configAdjunts: { dataMode: 'remote' }, usuariAdjunts: 'u-1' });
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  const casella = casellaDe(container);
  expect(paragraf(container).textContent).toContain('https://example.org/fira');
  expect(within(casella).queryAllByRole('link')).toEqual([]);
  expect(casella.querySelectorAll(ENFOCABLES)).toHaveLength(0);
});

test('fora de la selecció, l’enllaç de sempre: pestanya nova, noopener i l’avís', () => {
  const { container } = pinta({});
  const [primer, segon] = paragraf(container).querySelectorAll('a');
  expect([primer.getAttribute('href'), primer.getAttribute('target'), primer.getAttribute('rel')]).toEqual(['https://example.org/fira', '_blank', 'noopener noreferrer']);
  expect(segon.closest('strong')).not.toBeNull();
  expect(container.querySelector('[role="checkbox"]')).toBeNull();
  expect(container.querySelector('[role="note"]').textContent).toContain('xn--80ak6aa92e.com');
});
