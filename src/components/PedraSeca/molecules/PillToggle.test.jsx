/**
 * Proves de PillToggle amb `render` de Preact directe (com UniversalCard.test):
 * @testing-library/react pinta amb el react-dom real i fa petar les suites.
 */
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { PillToggle } from './PillToggle.jsx';

let arrel;
beforeEach(() => { arrel = document.createElement('div'); });
afterEach(() => { arrel.innerHTML = ''; });

const OPCIONS = [
  { valor: 'cards', text: 'Universal Cards' },
  { valor: 'compacta', text: 'Vista Comprimida' },
];
const pinta = (props) => act(() => { render(<PillToggle etiqueta="Vista" opcions={OPCIONS} {...props} />, arrel); });
const botons = () => [...arrel.querySelectorAll('button')];

test('grup etiquetat amb un botó natiu per opció', () => {
  pinta({ valor: 'cards' });
  const grup = arrel.querySelector('.sdp-pindola');
  expect(grup.getAttribute('role')).toBe('group');
  expect(grup.getAttribute('aria-label')).toBe('Vista');
  expect(botons().map((b) => b.textContent)).toEqual(['Universal Cards', 'Vista Comprimida']);
  expect(botons().every((b) => b.getAttribute('type') === 'button')).toBe(true);
});

test('una sola opció premuda i aria-pressed sempre explícit ("true"/"false")', () => {
  pinta({ valor: 'compacta' });
  expect(botons().map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
});

test('l\'estat no depén de cap classe --active', () => {
  pinta({ valor: 'cards' });
  expect(arrel.innerHTML).not.toMatch(/--active/);
  expect(arrel.innerHTML).not.toMatch(/\bpill\b/);
});

test('onCanvi rep el valor, també si ja és l\'actiu (el consumidor decidix)', () => {
  const onCanvi = vi.fn();
  pinta({ valor: 'cards', onCanvi });
  act(() => { botons()[1].click(); });
  act(() => { botons()[0].click(); });
  expect(onCanvi.mock.calls).toEqual([['compacta'], ['cards']]);
});

test('sense onCanvi no peta', () => {
  pinta({ valor: 'cards' });
  expect(() => act(() => { botons()[1].click(); })).not.toThrow();
});

test('className s\'afegix sense perdre la classe base', () => {
  pinta({ valor: 'cards', className: 'sdp-pindola--centrada onboarding-form__pindola' });
  expect(arrel.firstElementChild.className).toBe('sdp-pindola sdp-pindola--centrada onboarding-form__pindola');
});

test('la icona és decorativa', () => {
  act(() => {
    render(<PillToggle opcions={[{ valor: 'a', text: 'A', icona: <svg /> }]} valor="a" />, arrel);
  });
  expect(arrel.querySelector('.sdp-pindola__icona').getAttribute('aria-hidden')).toBe('true');
});
