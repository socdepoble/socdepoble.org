import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  bar: null,
  ves: vi.fn(),
  ruta: vi.fn((...parts) => `/app/bar/${parts.join('/')}`)
}));

vi.mock('../estat/ProveidorBar.jsx', () => ({
  useBar: () => mocks.bar
}));

vi.mock('./comu.jsx', async (original) => ({
  ...(await original()),
  AvisBase: () => null,
  AvisDeLaColumna: () => null,
  AvisOperacio: () => null,
  Preparat: ({ children }) => <>{children}</>,
  Columna: ({ titol, eines, children }) => (
    <section aria-label={titol}>
      {eines}
      {children}
    </section>
  )
}));

vi.mock('./punt.js', async (original) => ({
  ...(await original()),
  useIdiomaBar: () => 'ca',
  useVes: () => ({ ves: mocks.ves, ruta: mocks.ruta })
}));

import { TornActual } from './Torn.jsx';
import { PasTancament } from './Tancament.jsx';

afterEach(() => {
  cleanup();
  mocks.ves.mockReset();
});

describe('G12 · Ergonomia AAA i anti-doble-clic al Bar', () => {
  test('doble clic sobre «Obri el torn» només executa una obertura i centra el botó en Accions', async () => {
    let resolObri;
    const obriTorn = vi.fn(() => new Promise((resolve) => { resolObri = resolve; }));
    mocks.bar = {
      tornActual: null,
      traspas: null,
      permis: { potEscriure: true },
      accions: { obriTorn }
    };

    render(<TornActual />);
    const boto = screen.getByRole('button', { name: 'Obri el torn' });
    expect(boto.closest('.sdp-accions')).toBeTruthy();

    fireEvent.click(boto);
    fireEvent.click(boto);
    expect(obriTorn).toHaveBeenCalledTimes(1);

    resolObri({ ok: true });
    await waitFor(() => expect(boto.disabled).toBe(false));
  });

  test('doble clic sobre «L’he llegida» en la nota de traspàs no duplica la lectura', async () => {
    let resolLectura;
    const llegeixTraspas = vi.fn(() => new Promise((resolve) => { resolLectura = resolve; }));
    mocks.bar = {
      tornActual: null,
      traspas: {
        llegidaA: null,
        fonsDeixatCents: 5000,
        de: 'Joan',
        tancatA: '2026-11-24T00:10:00.000Z',
        avisos: ['Falta gel'],
        incidencies: [],
        comandesObertes: [],
        reposicio: []
      },
      permis: { potEscriure: true },
      accions: { llegeixTraspas }
    };

    render(<TornActual />);
    const boto = screen.getByRole('button', { name: /he llegida/i });
    expect(boto.closest('.sdp-accions')).toBeTruthy();

    fireEvent.click(boto);
    fireEvent.click(boto);
    expect(llegeixTraspas).toHaveBeenCalledTimes(1);

    resolLectura({ ok: true });
    await waitFor(() => expect(boto.disabled).toBe(false));
  });

  test('doble clic sobre «Tanca el torn» evita tancaments concurrents i navega un sol colp', async () => {
    let resolTanca;
    const tancaTorn = vi.fn(() => new Promise((resolve) => { resolTanca = resolve; }));
    mocks.bar = {
      tornActual: {
        id: 't1',
        obertPer: 'Anna',
        obertA: '2026-11-23T18:00:00.000Z',
        fonsInicialCents: 10000,
        moviments: []
      },
      tancament: { perDenominacio: { 1000: 10 }, avisos: [], fonsDeixatCents: 5000 },
      comandes: [],
      tiquets: [],
      carta: { categories: [], productes: [] },
      establiment: { denominacions: [1000] },
      permis: { potEscriure: true },
      accions: { tancaTorn }
    };

    render(<PasTancament params={{ pas: 'confirmar' }} />);
    const boto = screen.getByRole('button', { name: 'Tanca el torn' });
    expect(boto.closest('.sdp-accions')).toBeTruthy();

    fireEvent.click(boto);
    fireEvent.click(boto);
    expect(tancaTorn).toHaveBeenCalledTimes(1);

    resolTanca({ ok: true, valor: { id: 't1' } });
    await waitFor(() => expect(mocks.ves).toHaveBeenCalledTimes(1));
  });
});
