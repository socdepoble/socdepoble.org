/* T69 (captura 19.13.56) · La llista VERTICAL de filtres de la cerca global:
   l'ordre i els textos de FILTRES_CERCA_XAT, una icona de contorn per fila i
   la fletxa diagonal a la dreta. Triar-ne un no treu el focus del cercador. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import FiltresCerca, { ICONES_FILTRE } from './FiltresCerca.jsx';
import { FILTRES_CERCA_XAT } from '../cercaXat.js';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);

test('cada filtre del contracte té la seua icona de lucide', () => {
  for (const filtre of FILTRES_CERCA_XAT) expect(ICONES_FILTRE[filtre.icona], filtre.id).toBeTruthy();
});

test('pinta els huit filtres en l’ordre de WhatsApp, amb icona i fletxa, i en tria un', () => {
  const onTria = vi.fn();
  render(<FiltresCerca onTria={onTria} t={t} />);
  const llista = screen.getByRole('list', { name: 'Filtres de cerca' });
  const files = within(llista).getAllByRole('button');
  expect(files.map((b) => b.textContent)).toEqual(FILTRES_CERCA_XAT.map((f) => f.etiqueta));
  for (const fila of files) {
    expect(fila.querySelectorAll('svg')).toHaveLength(2);
    expect(fila.querySelector('svg.sdp-xat-filtres-cerca__fletxa')).toBeTruthy();
  }
  /* Ni el ratolí ni el dit mouen el focus: el cercador el conserva. */
  expect(fireEvent.mouseDown(files[2])).toBe(false);
  fireEvent.click(files[2]);
  expect(onTria).toHaveBeenCalledWith('enllacos');
});

test('amb el teclat: fletxes, Inici i Fi es mouen; Fletxa amunt a la primera, Maj+Tab a la primera i Escape tornen al camp', () => {
  const onTornaAlCamp = vi.fn();
  render(<FiltresCerca onTria={() => {}} onTornaAlCamp={onTornaAlCamp} t={t} />);
  const files = within(screen.getByRole('list', { name: 'Filtres de cerca' })).getAllByRole('button');
  act(() => files[0].focus());
  fireEvent.keyDown(files[0], { key: 'ArrowDown' });
  expect(document.activeElement).toBe(files[1]);
  fireEvent.keyDown(files[1], { key: 'End' });
  expect(document.activeElement).toBe(files[files.length - 1]);
  /* A l'última, Fletxa avall s'hi queda. */
  fireEvent.keyDown(files[files.length - 1], { key: 'ArrowDown' });
  expect(document.activeElement).toBe(files[files.length - 1]);
  fireEvent.keyDown(document.activeElement, { key: 'Home' });
  expect(document.activeElement).toBe(files[0]);

  expect(fireEvent.keyDown(files[0], { key: 'ArrowUp' })).toBe(false);
  expect(fireEvent.keyDown(files[0], { key: 'Tab', shiftKey: true })).toBe(false);
  expect(fireEvent.keyDown(files[3], { key: 'Escape' })).toBe(false);
  expect(onTornaAlCamp).toHaveBeenCalledTimes(3);
  /* Tab endavant no es toca: el navegador passa a la fila següent. */
  expect(fireEvent.keyDown(files[3], { key: 'Tab' })).toBe(true);
});

test('usa la clau i18n de cada filtre', () => {
  const traduccio = vi.fn((clau, alternativa) => (clau === 'section.xat.cerca.filtre.fotos' ? 'Photos' : alternativa));
  render(<FiltresCerca onTria={() => {}} t={traduccio} />);
  expect(screen.getByRole('button', { name: 'Photos' })).toBeTruthy();
  expect(traduccio).toHaveBeenCalledWith('section.xat.cerca.filtre.esdeveniments', 'Esdeveniments');
});
