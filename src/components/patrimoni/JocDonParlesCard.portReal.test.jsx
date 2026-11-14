/* R24 · CODEX-R24-03 · La targeta «D'on parles?» amb el port REAL (backendPort.js, sense cap
   mock) i un adaptador real (l'adaptador local, amb el seu magatzem en memòria). La prova de la
   targeta (JocDonParlesCard.test.jsx) substituïx getBackendImplementation per un objecte amb
   els tres mètodes inventats: així passava encara que cap adaptador no els poguera fer arribar
   al backend segellat. Ací la lectura, el vot i l'aportació passen pel contracte de veres. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { setBackendImplementation } from '../../data/backendPort.js';
import { creaAdaptadorLocal } from '../../data/local/adaptadorLocal.js';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../../data/identitat.js';
import { JocDonParlesCard } from './JocDonParlesCard.jsx';

vi.mock('../../services/veuIaiaService.js', () => ({ parla: () => Promise.resolve({ ok: true }), atura: () => {} }));

const ANNA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const BERTA = '2e3f4051-6b7c-4d8e-9fa0-b1c2d3e4f5a6';
let local;
const entra = (id) => {
  configuraBackendSessio(local.configuracio);
  expect(desaSessio({ access_token: 'testimoni-opac-local', user: { id, email: 'proves@poble.invalid' } })).toBe(true);
};

beforeEach(() => {
  window.localStorage.clear();
  local = creaAdaptadorLocal({ mode: 'local', tenantId: '11111111-1111-4111-8111-111111111111' });
});
afterEach(async () => { cleanup(); esborraSessio({ abast: 'tot' }); await local.destroy(); });

describe('JocDonParlesCard · consens pel port real', () => {
  test('llig el resum col·lectiu: una variant votada per una altra persona apareix com a opció viva', async () => {
    entra(BERTA);
    await local.votaVariantIsoglossaPoble({ preguntaId: 'q01_creilla', variantClau: 'creilleta', paraulaEtiqueta: 'Creïlleta', poble: 'Xixona', comarcaId: 'alacanti', abastComarcal: 'crec_comarca' });
    entra(ANNA);
    setBackendImplementation(local);
    render(<JocDonParlesCard />);
    expect(await screen.findByRole('button', { name: /Creïlleta/ })).toBeTruthy();
  });

  test('el vot de la targeta arriba a l’adaptador amb l’autoria de la sessió', async () => {
    entra(ANNA);
    setBackendImplementation(local);
    render(<JocDonParlesCard />);
    fireEvent.click(screen.getByRole('button', { name: /Querilla/i }));
    expect(screen.getByText('Paraula 2 de 12')).toBeTruthy();
    await waitFor(async () => {
      expect(await local.lligConsensIsoglossesPoble({ preguntaId: 'q01_creilla' })).toEqual([
        expect.objectContaining({ preguntaId: 'q01_creilla', variantClau: 'querilla', paraula: 'Querilla', vots: 1 })
      ]);
    });
  });

  test('l’aportació del formulari (la forma exacta de la targeta) entra pendent de moderació', async () => {
    entra(ANNA);
    const desa = vi.fn((...args) => local.desaAportacioVeuPoble(...args));
    setBackendImplementation({ ...local, desaAportacioVeuPoble: desa });
    render(<JocDonParlesCard />);
    fireEvent.click(screen.getByRole('button', { name: /Al meu poble ho diem d’una altra manera/i }));
    fireEvent.change(screen.getByLabelText(/Paraula o expressió del teu poble/i), { target: { value: 'Creïlla de secà' } });
    fireEvent.change(screen.getByLabelText(/^Poble$/i), { target: { value: 'La Torre de les Maçanes' } });
    fireEvent.change(screen.getByLabelText(/^Comarca \(opcional\)$/i), { target: { value: 'alacanti' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Desar paraula i passar a la següent/i }));
    await waitFor(() => expect(desa).toHaveBeenCalledTimes(1));
    await expect(desa.mock.results[0].value).resolves.toMatchObject({ estatModeracio: 'pendent' });
  });

  test('sense sessió, el vot es queda al dispositiu i la targeta continua (cap error a la vista)', async () => {
    setBackendImplementation(local);
    render(<JocDonParlesCard />);
    fireEvent.click(screen.getByRole('button', { name: /Querilla/i }));
    expect(screen.getByText('Paraula 2 de 12')).toBeTruthy();
    await new Promise((r) => setTimeout(r, 0));
    await expect(local.lligConsensIsoglossesPoble()).resolves.toEqual([]);
  });
});
