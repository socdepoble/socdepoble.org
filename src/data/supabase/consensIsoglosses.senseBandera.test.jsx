/* R24 · CODEX-R24-03 · Build sense VITE_SDP_CONSENS_ISOGLOSSES (el de producció mentre les
   migracions R23 no siguen aplicades): l'adaptador Supabase real no anuncia 'consensIsoglosses',
   el port la tracta com a absent i la targeta «D'on parles?» continua en el seu mode local
   honest, sense cap petició al servidor (cap 404 de PostgREST a la consola). */
import { vi } from 'vitest';
vi.hoisted(() => { vi.stubEnv('VITE_SDP_CONSENS_ISOGLOSSES', ''); });
vi.mock('../../services/veuIaiaService.js', () => ({ parla: () => Promise.resolve({ ok: true }), atura: () => {} }));
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';
import * as port from '../backendPort.js';
import * as supabase from './index.js';
import { CAPACITATS } from '../contracte.js';
import { JocDonParlesCard } from '../../components/patrimoni/JocDonParlesCard.jsx';

let fetchFals;
beforeEach(() => {
  window.localStorage.clear();
  fetchFals = vi.fn(async () => new Response('{}', { status: 404 }));
  vi.stubGlobal('fetch', fetchFals);
  port.setBackendImplementation({ ...supabase });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test('sense bandera, les tres funcions valen undefined i el port tracta la capacitat com a absent', () => {
  expect(import.meta.env.VITE_SDP_CONSENS_ISOGLOSSES).toBe('');
  for (const nom of CAPACITATS.consensIsoglosses) {
    expect(supabase[nom], nom).toBeUndefined();
    expect(port.getBackendImplementation()[nom], nom).toBeUndefined();
  }
  expect(port.teCapacitat('consensIsoglosses')).toBe(false);
});

test('la targeta vota en local, avança i no envia cap petició de consens', async () => {
  render(<JocDonParlesCard />);
  expect(screen.getByText('Paraula 1 de 12')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Querilla/i }));
  expect(screen.getByText('Paraula 2 de 12')).toBeTruthy();
  await new Promise((r) => setTimeout(r, 0));
  expect(fetchFals.mock.calls.map(([url]) => String(url)).filter((u) => /consens|isoglosses|aportacions_veu/.test(u))).toEqual([]);
});
