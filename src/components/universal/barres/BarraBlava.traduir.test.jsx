import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { BarraBlava } from './BarraBlava.jsx';
import { MenuTraduir, NOM_MENU_TRADUIR, NOM_ORIGINAL } from '../traduccio/MenuTraduir.jsx';
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
  /* Ordre del Mestre (261030 01:30): el gallec i el basc, després del castellà. */
  expect(opcions.map((opcio) => opcio.textContent)).toEqual(['Castellà', 'Gallec', 'Basc', 'Anglés', 'Francés', 'Alemany']);
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
  const darrera = opcions[opcions.length - 1];
  fireEvent.keyDown(opcions[1], { key: 'End' });
  expect(document.activeElement).toBe(darrera);
  fireEvent.keyDown(darrera, { key: 'ArrowDown' });
  expect(document.activeElement).toBe(opcions[0]);
  fireEvent.keyDown(opcions[0], { key: 'ArrowUp' });
  expect(document.activeElement).toBe(darrera);
  act(() => { fireEvent.pointerDown(document.body); });
  expect(menu()).toBeNull();
});

/* Gauntlet 261030 (Fase 3, TC3.3; menu-traduir-tab-dins-del-menu) · Patró de
   menú de l'APG de WAI-ARIA: les files no són parades de tabulació (s'hi
   arriba amb les fletxes); Tab i Maj+Tab no es consumixen (el navegador porta
   el focus a Comentar o a Traduir) i el menú es tanca, sense furtar el focus. */
test('TC3.3 · Tab ix del menú i el tanca: les files van amb tabIndex -1 i la tecla no es consumix', async () => {
  for (const ambMaj of [false, true]) {
    const onTanca = vi.fn();
    const { container, unmount } = render(<BarraAmbMenu onTanca={onTanca} />);
    fireEvent.click(traduir(container));
    const opcions = within(menu()).getAllByRole('menuitemradio');
    expect(opcions.map((opcio) => opcio.tabIndex)).toEqual(opcions.map(() => -1));
    expect(document.activeElement).toBe(opcions[0]);
    fireEvent.keyDown(opcions[0], { key: 'ArrowDown' });
    const tecla = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: ambMaj, bubbles: true, cancelable: true });
    act(() => { opcions[1].dispatchEvent(tecla); });
    expect(tecla.defaultPrevented, 'el Tab fa el seu camí').toBe(false);
    // El navegador mou el focus (jsdom no ho fa: ací es mou a mà, com faria el Tab).
    act(() => { container.querySelector(ambMaj ? 'button[aria-label="Traduir"]' : 'button[aria-label="Comentar"]').focus(); });
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    expect(menu()).toBeNull();
    expect(onTanca).toHaveBeenCalledTimes(1);
    expect(traduir(container).getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement.getAttribute('aria-label')).toBe(ambMaj ? 'Traduir' : 'Comentar');
    unmount();
  }
});

test('TC3.3 · els altres menús del mateix hook (Comentar) no canvien: sense tancaAmbTab, Tab no tanca res', async () => {
  const { useMenuEmergent } = await import('../../PedraSeca/hooks/useMenuEmergent.js');
  const onTanca = vi.fn();
  function Menu() {
    const { ref, mouFocus } = useMenuEmergent({ files: '[role="menuitem"]', onTanca });
    return <div ref={ref} role="menu" onKeyDown={mouFocus}><button type="button" role="menuitem">Fila</button></div>;
  }
  render(<Menu />);
  const tecla = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  act(() => { screen.getByRole('menuitem').dispatchEvent(tecla); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  expect(onTanca).not.toHaveBeenCalled();
  expect(screen.getByRole('menuitem').tabIndex).toBe(0);
});

/* Gauntlet 261030 (cicle 3, especimen-menu-traduir-inabastable-amb-teclat) ·
   L'espècimen de /disseny (EspecimenControlsBarra: obert i quiet, `mostra`)
   no rep el focus en obrir-se (useMenuEmergent): amb totes les files a
   tabIndex -1 el menú quedava fora de l'ordre de tabulació i no s'hi podia
   arribar amb el teclat. A la mostra, les files són parades de tabulació
   (com abans i com les de Comentar); al producte, el patró de menú (-1). */
test('mostra del catàleg: les files de l’espècimen de Traduir es poden abastar amb Tab, i no furta el focus', () => {
  const abans = document.activeElement;
  render(<MenuTraduir opcions={LLENGUES_TRADUCCIO} actual="ES" onTria={res} onTanca={res} mostra />);
  const opcions = within(menu()).getAllByRole('menuitemradio');
  expect(opcions).toHaveLength(LLENGUES_TRADUCCIO.length + 1);
  expect(opcions.map((opcio) => opcio.tabIndex)).toEqual(opcions.map(() => 0));
  expect(opcions.some((opcio) => opcio.hasAttribute('tabindex'))).toBe(false);
  expect(document.activeElement).toBe(abans);
  // Les fletxes continuen movent el focus dins de la mostra.
  act(() => { opcions[0].focus(); });
  fireEvent.keyDown(opcions[0], { key: 'ArrowDown' });
  expect(document.activeElement).toBe(opcions[1]);
});

test('amb la pàgina traduïda, la llengua va marcada i «Original (valencià)» torna a l’original', () => {
  const onTria = vi.fn();
  const { container } = render(<BarraAmbMenu actual="ES" onTria={onTria} />);
  fireEvent.click(traduir(container));
  const opcions = within(menu()).getAllByRole('menuitemradio');
  expect(opcions.map((opcio) => [opcio.textContent, opcio.getAttribute('aria-checked')])).toEqual([
    ['Castellà', 'true'], ['Gallec', 'false'], ['Basc', 'false'], ['Anglés', 'false'], ['Francés', 'false'],
    ['Alemany', 'false'], [NOM_ORIGINAL, 'false'],
  ]);
  expect(within(menu()).getByRole('separator')).toBeTruthy();
  fireEvent.click(within(menu()).getByRole('menuitemradio', { name: NOM_ORIGINAL }));
  expect(onTria).toHaveBeenCalledWith(null);
});
