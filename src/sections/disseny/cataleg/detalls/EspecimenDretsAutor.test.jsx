/* Pla 261016 (Bloc 3.1; ordre del Mestre) · L'espècimen de CopyrightPage
   recull l'àmbit 'compte' («El compte» de la persona: els drets de sèrie de
   les seues notes) i les tres props opcionals de quan la vista no és dins
   d'un document (etiquetaTornar, introduccio i llegenda). Els altres casos
   conserven els textos de sempre. Sense h1, sense style= i sense cap avís de
   React. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import EspecimenDretsAutor from './EspecimenDretsAutor.jsx';

let errors;
beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  const crides = errors.mock.calls.map((c) => String(c[0]).slice(0, 200));
  errors.mockRestore();
  cleanup();
  expect(crides).toEqual([]);
});

const munta = () => render(<MemoryRouter><EspecimenDretsAutor /></MemoryRouter>);

/* La fila del contracte d'una prop: [tipus, per defecte, què fa]. */
const filaDe = (taula, prop) => {
  const fila = [...taula.querySelectorAll('tbody tr')].find((tr) => tr.querySelector('td code')?.textContent === prop);
  return fila ? [...fila.querySelectorAll('td')].slice(1).map((td) => td.textContent) : null;
};

const obriElCas = (text) => {
  fireEvent.click(screen.getByRole('button', { name: text }));
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Elegir drets d\'autor' })); });
};

it('el contracte recull l’àmbit «compte» i les tres props opcionals, amb els valors de sèrie', () => {
  const { container } = munta();
  expect(container.querySelector('h1')).toBeNull();
  expect(container.querySelector('[style]')).toBeNull();
  const taula = within(container).getByRole('table', { name: 'Contracte' });
  const [tipusAmbit, , queAmbit] = filaDe(taula, 'ambit');
  expect(tipusAmbit).toBe("'publicacio' | 'perfil' | 'compte' | 'neutre'");
  expect(queAmbit).toContain('«El compte» de la persona');
  const [tipus, defecte, que] = filaDe(taula, 'etiquetaTornar / introduccio / llegenda');
  expect(tipus).toBe('string / ReactNode | null / string');
  expect(defecte).toBe("'Tornar al document' / null / 'Tria els drets d’esta obra'");
  expect(que).toContain('Sense elles, el DOM i els textos de sempre');
});

it('«El compte» pinta la vista amb l’avís del compte i les tres props opcionals, i torna al botó', () => {
  munta();
  const casos = screen.getByRole('group', { name: 'Cas de l’espècimen' });
  expect(within(casos).getAllByRole('button').map((b) => b.textContent))
    .toEqual(['Nota amb herència', 'Nota sense herència', 'Fitxa del Perfil', 'Foraster', 'El compte']);
  obriElCas('El compte');
  expect(screen.getByRole('button', { name: 'El compte' }).getAttribute('aria-pressed')).toBe('true');
  const vista = screen.getByRole('heading', { level: 2, name: 'Drets d’autor' }).closest('section');
  expect(within(vista).getByRole('button', { name: 'Tornar al compte' })).toBeTruthy();
  expect(within(vista).queryByRole('button', { name: 'Tornar al document' })).toBeNull();
  expect(vista.querySelector('.sdp-drets__intro').textContent)
    .toBe('Tria amb quins drets naixen les teues notes noves. Ara són «© Sóc de Poble». Res no canvia fins que prems «Desar autoria».');
  expect(within(vista).getByRole('group', { name: 'Tria els drets de sèrie de les teues notes' })).toBeTruthy();
  expect(within(vista).getByText('Les teues notes noves naixen amb estos drets')).toBeTruthy();
  act(() => { fireEvent.click(within(vista).getByRole('button', { name: 'Tornar al compte' })); });
  expect(screen.queryByRole('heading', { level: 2, name: 'Drets d’autor' })).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Elegir drets d\'autor' }));
});

it('els altres casos no porten cap prop opcional: els textos de sempre de dins d’un document', () => {
  munta();
  for (const cas of ['Nota amb herència', 'Fitxa del Perfil', 'Foraster']) {
    obriElCas(cas);
    const vista = screen.getByRole('heading', { level: 2, name: 'Drets d’autor' }).closest('section');
    expect(within(vista).getByRole('button', { name: 'Tornar al document' })).toBeTruthy();
    expect(vista.querySelector('.sdp-drets__intro').textContent)
      .toBe('Tria qui pot usar esta obra i com. Ara té «© Sóc de Poble». Res no canvia fins que prems «Desar autoria».');
    expect(within(vista).getByRole('group', { name: 'Tria els drets d’esta obra' })).toBeTruthy();
    expect(within(vista).queryByText('Les teues notes noves naixen amb estos drets')).toBeNull();
    act(() => { fireEvent.click(within(vista).getByRole('button', { name: 'Tornar al document' })); });
  }
});
