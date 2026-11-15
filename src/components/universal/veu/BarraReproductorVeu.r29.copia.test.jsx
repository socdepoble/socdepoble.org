import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { BarraReproductorVeu } from './BarraReproductorVeu.jsx';

vi.mock('../../../services/veuIaiaService.js', () => ({
  atura: vi.fn(),
  parla: vi.fn(() => new Promise(() => {})),
  llegeixVeuPreferida: vi.fn(() => ''),
  subscriuVeuPreferida: vi.fn(() => () => {}),
}));

const BLOCS = [{ id: 'fragment-prova', index: 0, text: 'Fragment de prova', resumCurt: 'Fragment de prova', seccioTitol: '' }];
let completa, rebutja;
beforeEach(() => {
  vi.useFakeTimers();
  const pendent = new Promise((resolve, reject) => { completa = resolve; rebutja = reject; });
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn(() => pendent) } });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); vi.restoreAllMocks(); });

const barra = (oberta = true) => <BarraReproductorVeu oberta={oberta} mostraEspecimen blocsMostra={BLOCS} />;

test.each(['resolve', 'reject'])('una còpia %s que acaba després de tancar/reobrir no publica estat d’una sessió anterior', async (resultat) => {
  const vista = render(barra());
  fireEvent.click(screen.getByRole('button', { name: 'Copiar fragment actual' }));
  vista.rerender(barra(false));
  vista.rerender(barra());
  await act(async () => { if (resultat === 'resolve') completa(); else rebutja(new Error('Còpia no disponible')); });
  expect(screen.getByRole('status').textContent).toBe('');
  expect(vi.getTimerCount()).toBe(0);
});

test('una còpia que acaba després de desmuntar no crea cap temporitzador nou', async () => {
  const vista = render(barra());
  fireEvent.click(screen.getByRole('button', { name: 'Copiar fragment actual' }));
  vista.unmount();
  await act(async () => { completa(); });
  expect(vi.getTimerCount()).toBe(0);
});

test('una còpia vigent publica el resultat i el temporitzador es cancel·la en tancar', async () => {
  const vista = render(barra());
  fireEvent.click(screen.getByRole('button', { name: 'Copiar fragment actual' }));
  await act(async () => { completa(); });
  expect(screen.getByRole('status').textContent).toBe('Fragment copiat al porta-retalls.');
  expect(vi.getTimerCount()).toBe(1);
  vista.rerender(barra(false));
  expect(vi.getTimerCount()).toBe(0);
  vista.rerender(barra());
  expect(screen.getByRole('status').textContent).toBe('');
});

test.each(['resolve', 'reject'])('el resultat %s d’una petició anterior no substituïx el de l’última còpia', async (resultat) => {
  let acabaNova, fallaNova;
  navigator.clipboard.writeText.mockReturnValueOnce(new Promise((resolve, reject) => { acabaNova = resolve; fallaNova = reject; }));
  render(barra());
  const copiar = screen.getByRole('button', { name: 'Copiar fragment actual' });
  fireEvent.click(copiar);
  fireEvent.click(copiar);
  /* La segona petició (la del beforeEach) acaba primer. */
  await act(async () => { if (resultat === 'resolve') completa(); else rebutja(new Error('Còpia no disponible')); });
  const estatVigent = screen.getByRole('status').textContent;
  await act(async () => { if (resultat === 'resolve') fallaNova(new Error('Còpia anterior no disponible')); else acabaNova(); });
  expect(screen.getByRole('status').textContent).toBe(estatVigent);
  expect(vi.getTimerCount()).toBe(resultat === 'resolve' ? 1 : 0);
});
