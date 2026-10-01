/* T10 (ordre del Mestre, 261001) · «Hui ‹ ›» d'un període i el selector de
   vista: la navegació no sap què és un període, ho diu qui la munta. Fase
   visual (prompt 261001_0445): l'ordre de les captures (Hui, ‹, ›, títol,
   vista) i les cinc vistes. */
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { NavegacioPeriode } from './NavegacioPeriode.jsx';

afterEach(cleanup);

test('«Hui» i les fletxes criden el que els diuen, amb les etiquetes donades i en l’ordre de les captures', () => {
  const [onAnterior, onHui, onSeguent] = [vi.fn(), vi.fn(), vi.fn()];
  const { getByRole, queryByRole, getByText, container } = render(
    <NavegacioPeriode onAnterior={onAnterior} onHui={onHui} onSeguent={onSeguent} titol="28 de setembre – 4 d’octubre de 2026"
      etiquetes={{ anterior: 'Setmana anterior', hui: 'Hui', seguent: 'Setmana següent' }} />
  );
  act(() => getByRole('button', { name: 'Setmana anterior' }).click());
  act(() => getByRole('button', { name: 'Hui' }).click());
  act(() => getByRole('button', { name: 'Setmana següent' }).click());
  expect([onAnterior, onHui, onSeguent].map((f) => f.mock.calls.length)).toEqual([1, 1, 1]);
  expect(getByText('28 de setembre – 4 d’octubre de 2026').getAttribute('aria-live')).toBe('polite');
  // Hui (secundari), després les dos fletxes (fantasma, només icona, amb el nom del pas).
  const botons = [...container.querySelectorAll('button')];
  expect(botons.map((b) => b.getAttribute('aria-label') ?? b.textContent)).toEqual(['Hui', 'Setmana anterior', 'Setmana següent']);
  expect(botons[0].className).toBe('sdp-boto sdp-boto--secundari');
  for (const fletxa of botons.slice(1)) {
    expect(fletxa.className).toBe('sdp-boto sdp-boto--fantasma sdp-cal-navegacio__fletxa');
    expect(fletxa.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(fletxa.textContent).toBe('');
  }
  // Sense onCanviaVista no hi ha selector.
  expect(queryByRole('group')).toBeNull();
});

test('per defecte, les etiquetes del mes i les cinc vistes; el selector és un PillToggle amb la vista premuda', () => {
  const onCanviaVista = vi.fn();
  const { getByRole, getAllByRole, container } = render(<NavegacioPeriode vista="mes" onCanviaVista={onCanviaVista} className="de-prova" />);
  expect(getByRole('button', { name: 'Mes anterior' })).toBeTruthy();
  expect(getByRole('button', { name: 'Mes següent' })).toBeTruthy();
  expect(container.firstChild.className).toBe('sdp-cal-navegacio de-prova');
  const grup = getByRole('group', { name: 'Vista' });
  expect(grup.className).toBe('sdp-pindola sdp-cal-vistes');
  const opcions = [...grup.querySelectorAll('button')];
  expect(opcions.map((b) => b.textContent)).toEqual(['Setmana', 'Dues setmanes', 'Mes', 'Any', 'Agenda']);
  expect(opcions.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true', 'false', 'false']);
  expect(getAllByRole('button', { pressed: true }).map((b) => b.textContent)).toEqual(['Mes']);
  act(() => getByRole('button', { name: 'Dues setmanes' }).click());
  expect(onCanviaVista).toHaveBeenLastCalledWith('dues-setmanes');
  act(() => getByRole('button', { name: 'Agenda' }).click());
  expect(onCanviaVista).toHaveBeenLastCalledWith('agenda');
  expect(container.querySelector('.sdp-cal-navegacio__titol')).toBeNull();
});

/* Ordre del Mestre, 261001 · La ranura `accions` (el botó de pantalla
   completa de /calendari): tal qual, entre el títol i el selector. */
test('accions: el node va tal qual entre el títol i el selector; sense, el DOM de sempre', () => {
  const sense = render(<NavegacioPeriode titol="octubre de 2026" vista="mes" onCanviaVista={() => {}} />).container.innerHTML;
  cleanup();
  const ambNull = render(<NavegacioPeriode titol="octubre de 2026" vista="mes" onCanviaVista={() => {}} accions={null} />).container.innerHTML;
  cleanup();
  expect(ambNull).toBe(sense);
  const { container, getByRole } = render(
    <NavegacioPeriode titol="octubre de 2026" vista="mes" onCanviaVista={() => {}}
      accions={<button type="button" className="accio-de-prova">Pantalla completa</button>} />
  );
  const accio = getByRole('button', { name: 'Pantalla completa' });
  expect(accio.parentElement).toBe(container.firstChild);
  expect(accio.previousElementSibling.className).toBe('sdp-cal-navegacio__titol');
  expect(accio.nextElementSibling).toBe(getByRole('group', { name: 'Vista' }));
  // Hui, ‹ i › continuen primer.
  expect([...container.firstChild.children].slice(0, 3).map((b) => b.getAttribute('aria-label') ?? b.textContent)).toEqual(['Hui', 'Mes anterior', 'Mes següent']);
});

test('unes etiquetes a mitges completen amb les per defecte; vistes i nom del grup propis', () => {
  const { getByRole } = render(
    <NavegacioPeriode etiquetes={{ anterior: 'Any anterior', seguent: 'Any següent' }} vista="any" onCanviaVista={() => {}}
      vistes={[{ valor: 'mes', text: 'Mes' }, { valor: 'any', text: 'Any' }]} etiquetaVistes="Vista del calendari" />
  );
  expect(getByRole('button', { name: 'Any anterior' })).toBeTruthy();
  expect(getByRole('button', { name: 'Hui' })).toBeTruthy();
  expect([...getByRole('group', { name: 'Vista del calendari' }).querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Mes', 'Any']);
});
