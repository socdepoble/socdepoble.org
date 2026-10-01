import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { BarraBlava } from './BarraBlava.jsx';
import { NOM_MENU_TRADUIR, NOM_ORIGINAL } from '../traduccio/MenuTraduir.jsx';
import { LLENGUES_TRADUCCIO } from '../../../data/traductor.js';

/* Traductor Sobirà (ordre del Mestre, 260930 · via B) · El botó Traduir de
   la barra blava obri un menú de llengües: rols menu/menuitemradio,
   aria-expanded, Escape que tanca i consumix l'esdeveniment, focus que entra
   a la primera opció i torna a Traduir. Tancat, la barra no canvia. */
afterEach(cleanup);

const res = () => {};
const TOTES = {
  onBack: res, onForward: res, onIndex: res,
  traduirVisible: true, comentarVisible: true, compartirVisible: true, connectarVisible: true,
  onTranslate: res, onComment: res, onShare: res, onConnect: res,
};
const marques = (el) => [...el.children].map((e) => `${e.tagName.toLowerCase()}.${e.getAttribute('class')}`);

/* Qui munta la barra (useAccions) té l'estat: ací, un embolcall mínim. */
function BarraAmbMenu({ actual = null, onTria = vi.fn(), onTanca = null }) {
  const [obert, setObert] = useState(false);
  return (
    <BarraBlava {...TOTES} onTranslate={() => setObert((abans) => !abans)}
      menuTraduir={{
        obert, opcions: LLENGUES_TRADUCCIO, actual, onTria,
        onTanca: () => { onTanca?.(); setObert(false); },
      }} />
  );
}
const traduir = (container) => container.querySelector('button[aria-label="Traduir"]');
const menu = () => screen.queryByRole('menu', { name: NOM_MENU_TRADUIR });

test('Llei del Píxel · tancat, el trio té els tres botons de sempre; el botó només diu que obri un menú', () => {
  const { container } = render(<BarraAmbMenu />);
  const accions = container.querySelector('.sp-card-actions');
  expect(marques(accions)).toEqual(['button.sp-card-action', 'button.sp-card-action', 'button.sp-card-action']);
  expect(traduir(container).getAttribute('aria-haspopup')).toBe('menu');
  expect(traduir(container).getAttribute('aria-expanded')).toBe('false');
  expect(menu()).toBeNull();
  cleanup();
  // Sense menuTraduir (sense servei o amb un onTranslate propi): cap atribut nou.
  const sense = render(<BarraBlava {...TOTES} />).container;
  expect(traduir(sense).hasAttribute('aria-haspopup')).toBe(false);
  expect(traduir(sense).hasAttribute('aria-expanded')).toBe(false);
});

test('obrir: el menú va just després de Traduir, amb la llista tancada, i el focus entra a la primera opció', () => {
  const { container } = render(<BarraAmbMenu />);
  fireEvent.click(traduir(container));
  expect(traduir(container).getAttribute('aria-expanded')).toBe('true');
  const obert = menu();
  expect(obert).not.toBeNull();
  expect(traduir(container).nextElementSibling).toBe(obert);
  const opcions = within(obert).getAllByRole('menuitemradio');
  expect(opcions.map((opcio) => opcio.textContent)).toEqual(['Castellà', 'Anglés', 'Francés', 'Alemany']);
  expect(opcions.every((opcio) => opcio.getAttribute('aria-checked') === 'false')).toBe(true);
  expect(document.activeElement).toBe(opcions[0]);
  // Un segon clic a Traduir el tanca (el pointerdown sobre el botó no compta com a «fora»).
  fireEvent.pointerDown(traduir(container));
  fireEvent.click(traduir(container));
  expect(menu()).toBeNull();
});

test('triar: tanca el menú, torna el focus a Traduir i passa el codi', () => {
  const onTria = vi.fn();
  const { container } = render(<BarraAmbMenu onTria={onTria} />);
  fireEvent.click(traduir(container));
  fireEvent.click(within(menu()).getByRole('menuitemradio', { name: 'Francés' }));
  expect(onTria).toHaveBeenCalledWith('FR');
  expect(menu()).toBeNull();
  expect(document.activeElement).toBe(traduir(container));
});

test('Escape tanca, torna el focus a Traduir i queda consumit', () => {
  const onTanca = vi.fn();
  const alaFinestra = vi.fn();
  window.addEventListener('keydown', alaFinestra);
  try {
    const { container } = render(<BarraAmbMenu onTanca={onTanca} />);
    fireEvent.click(traduir(container));
    const opcio = within(menu()).getAllByRole('menuitemradio')[0];
    const noCancellat = fireEvent.keyDown(opcio, { key: 'Escape' });
    expect(noCancellat).toBe(false); // preventDefault
    expect(alaFinestra).not.toHaveBeenCalled(); // stopPropagation: l'amfitrió no el rep
    expect(onTanca).toHaveBeenCalledTimes(1);
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(traduir(container));
  } finally {
    window.removeEventListener('keydown', alaFinestra);
  }
});

test('un clic fora el tanca; les fletxes, Inici i Fi mouen el focus entre les opcions', () => {
  const { container } = render(<BarraAmbMenu />);
  fireEvent.click(traduir(container));
  const opcions = within(menu()).getAllByRole('menuitemradio');
  fireEvent.keyDown(opcions[0], { key: 'ArrowDown' });
  expect(document.activeElement).toBe(opcions[1]);
  fireEvent.keyDown(opcions[1], { key: 'End' });
  expect(document.activeElement).toBe(opcions[3]);
  fireEvent.keyDown(opcions[3], { key: 'ArrowDown' });
  expect(document.activeElement).toBe(opcions[0]);
  fireEvent.keyDown(opcions[0], { key: 'ArrowUp' });
  expect(document.activeElement).toBe(opcions[3]);
  act(() => { fireEvent.pointerDown(document.body); });
  expect(menu()).toBeNull();
});

test('amb la pàgina traduïda, la llengua va marcada i «Original (valencià)» torna a l’original', () => {
  const onTria = vi.fn();
  const { container } = render(<BarraAmbMenu actual="ES" onTria={onTria} />);
  fireEvent.click(traduir(container));
  const opcions = within(menu()).getAllByRole('menuitemradio');
  expect(opcions.map((opcio) => [opcio.textContent, opcio.getAttribute('aria-checked')])).toEqual([
    ['Castellà', 'true'], ['Anglés', 'false'], ['Francés', 'false'], ['Alemany', 'false'], [NOM_ORIGINAL, 'false'],
  ]);
  expect(within(menu()).getByRole('separator')).toBeTruthy();
  fireEvent.click(within(menu()).getByRole('menuitemradio', { name: NOM_ORIGINAL }));
  expect(onTria).toHaveBeenCalledWith(null);
});
