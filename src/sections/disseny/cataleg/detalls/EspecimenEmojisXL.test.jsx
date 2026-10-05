import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import EmojisXL from './EspecimenEmojisXL.jsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function munta() {
  const vista = render(<EmojisXL />);
  const boto = (codi) => vista.container.querySelector(`button[data-emoji-code="${codi}"]`);
  const estat = () => vista.container.querySelector('[role="status"]');
  return { ...vista, boto, estat };
}

test('el catàleg té 3972 botons únics i els 10 grups oberts, amb noms visibles i glifs decoratius', () => {
  const { container, boto } = munta();
  expect(within(container).getByRole('region', { name: 'Directori d’emoticones' }))
    .toBe(container.querySelector('.sdp-emojis-xl'));
  const grups = [...container.querySelectorAll('.sdp-emojis-xl details')];
  expect(grups).toHaveLength(10);
  expect(grups.every((grup) => grup.open)).toBe(true);
  const botons = [...container.querySelectorAll('.sdp-emojis-xl__graella button')];
  expect(botons).toHaveLength(3972);
  expect(new Set(botons.map((node) => node.dataset.emojiCode)).size).toBe(3972);
  const primera = boto('1F600');
  expect(primera.getAttribute('type')).toBe('button');
  expect(within(primera).getByText('grinning face').getAttribute('lang')).toBe('en');
  expect(primera.querySelector('.sdp-emojis-xl__glif').getAttribute('aria-hidden')).toBe('true');
  expect(within(grups[0]).getByRole('button', { name: 'Copia grinning face' })).toBe(primera);
});

test('copiar passa només el glif al porta-retalls i anuncia èxit amb un status accessible sense provider', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const { boto, estat } = munta();
  fireEvent.click(boto('1F1EA 1F1F8'));
  expect(writeText).toHaveBeenCalledExactlyOnceWith('🇪🇸');
  await waitFor(() => expect(estat().textContent).toBe('Copiat: flag: Spain.'));
  expect(estat().getAttribute('aria-live')).toBe('polite');
  expect(estat().getAttribute('aria-atomic')).toBe('true');
});

test('un rebuig de permisos anuncia la fallada i no afirma que haja copiat', async () => {
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denegat')) } });
  const { boto, estat } = munta();
  fireEvent.click(boto('1F600'));
  await waitFor(() => expect(estat().textContent).toBe('No s’ha pogut copiar: grinning face. Torna-ho a provar.'));
});

test('sense API de porta-retalls el resultat diu que la còpia no està disponible', () => {
  vi.stubGlobal('navigator', {});
  const { boto, estat } = munta();
  fireEvent.click(boto('1F600'));
  expect(estat().textContent).toBe('La còpia no està disponible en aquest navegador.');
});

test('un navegador que llança una excepció síncrona també anuncia una fallada honesta', () => {
  vi.stubGlobal('navigator', { clipboard: { writeText: () => { throw new Error('bloquejat'); } } });
  const { boto, estat } = munta();
  fireEvent.click(boto('1F600'));
  expect(estat().textContent).toBe('No s’ha pogut copiar: grinning face. Torna-ho a provar.');
});

test('mentre espera diu Copiant; només l’últim clic pot canviar el resultat, resolent o rebutjant', async () => {
  const pendents = [];
  const writeText = vi.fn(() => new Promise((resolve, reject) => pendents.push({ resolve, reject })));
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const { boto, estat } = munta();
  fireEvent.click(boto('1F600'));
  expect(estat().textContent).toBe('Copiant: grinning face…');
  fireEvent.click(boto('1F603'));
  expect(estat().textContent).toBe('Copiant: grinning face with big eyes…');
  await act(async () => { pendents[0].resolve(); });
  expect(estat().textContent).toBe('Copiant: grinning face with big eyes…');
  await act(async () => { pendents[1].resolve(); });
  expect(estat().textContent).toBe('Copiat: grinning face with big eyes.');

  fireEvent.click(boto('1F600'));
  fireEvent.click(boto('1F603'));
  await act(async () => { pendents[2].reject(new Error('resposta antiga')); });
  expect(estat().textContent).toBe('Copiant: grinning face with big eyes…');
  await act(async () => { pendents[3].reject(new Error('denegat')); });
  expect(estat().textContent).toBe('No s’ha pogut copiar: grinning face with big eyes. Torna-ho a provar.');
});
