/**
 * Onada R22 · integració (SEO-R22-08) · La barra d'actualització d'app
 * (BarraActualitzacioRecomanada, del kit de Gemini R22) ix de l'arrencada
 * estàtica: App.jsx només munta BarraActualitzacioDiferida, que importa la
 * barra dins de l'app nativa i no fa res a la web, la PWA ni el connector, on
 * el registre és sempre buit i la barra no pintava res.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { BarraActualitzacioDiferida } from './App.jsx';
import {
  netejaActualitzacioRecomanadaPerProves,
  publicaActualitzacioRecomanada
} from '../config/actualitzacioRecomanada.js';

vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));

afterEach(() => {
  cleanup();
  netejaActualitzacioRecomanadaPerProves();
});

const BarraFalsa = () => <p>barra-falsa</p>;

test('a la web no importa la barra ni pinta res', async () => {
  const importa = vi.fn(async () => ({ default: BarraFalsa }));
  const { container } = render(<BarraActualitzacioDiferida importa={importa} plataforma={() => 'web'} />);
  await act(async () => { await Promise.resolve(); });
  expect(importa).not.toHaveBeenCalled();
  expect(container.innerHTML).toBe('');
});

test('dins de l\'app nativa importa la barra una sola vegada i la pinta', async () => {
  const importa = vi.fn(async () => ({ default: BarraFalsa }));
  const { rerender } = render(<BarraActualitzacioDiferida importa={importa} plataforma={() => 'android'} />);
  expect(await screen.findByText('barra-falsa')).toBeTruthy();
  rerender(<BarraActualitzacioDiferida importa={importa} plataforma={() => 'android'} />);
  expect(importa).toHaveBeenCalledTimes(1);
});

test('si el tros no carrega, no hi ha barra ni error', async () => {
  const importa = vi.fn(async () => { throw new Error('tros absent'); });
  const { container } = render(<BarraActualitzacioDiferida importa={importa} plataforma={() => 'ios'} />);
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  expect(importa).toHaveBeenCalledTimes(1);
  expect(container.innerHTML).toBe('');
});

test('desmuntada abans que arribe el tros, no pinta res després', async () => {
  let resol;
  const importa = vi.fn(() => new Promise((r) => { resol = r; }));
  const { container, unmount } = render(<BarraActualitzacioDiferida importa={importa} plataforma={() => 'android'} />);
  await act(async () => { await Promise.resolve(); });
  unmount();
  await act(async () => { resol({ default: BarraFalsa }); await Promise.resolve(); });
  expect(container.innerHTML).toBe('');
});

test('amb el tros de veres, dins de l\'app pinta l\'avís quan el registre el publica', async () => {
  render(<BarraActualitzacioDiferida plataforma={() => 'android'} />);
  await act(async () => {
    publicaActualitzacioRecomanada({ plataforma: 'android', versioRecomanada: 9 });
  });
  expect(await screen.findByText('Hi ha una nova versió disponible de Sóc de Poble.')).toBeTruthy();
});

test('App.jsx no importa la barra de manera estàtica (trinquet de l\'arrencada del connector)', () => {
  const font = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'App.jsx'), 'utf8');
  expect(font).not.toMatch(/^import\s+[^;]*BarraActualitzacioRecomanada[^;]*;/m);
  expect(font).toMatch(/import\('\.\.\/components\/universal\/barres\/BarraActualitzacioRecomanada\.jsx'\)/);
});
