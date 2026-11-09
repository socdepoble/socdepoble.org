import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext.jsx';
import MotorHoritzontalRecepta from './MotorHoritzontalRecepta.jsx';
import { ProveidorPlataforma } from '../../apps/plataforma/PlataformaContext.jsx';
vi.mock('../../app/contexts/UIContext', async orig => ({ ...await orig(), useUIState: () => ({ externalConfig: {} }) }));
vi.mock('../../data/menjarIBeure/mercadona.js', () => ({ carregaMercadona: async () => ({ productes: [{ id: 'mer-farina', nom: 'Farina', marca: 'Prova', preuUnitari: 1.5, preuUnitariCentims: 150, unitatPreuUnitari: 'kg' }] }) }));
vi.mock('../../data/menjarIBeure/horitzontal.js', async () => ({ ...await vi.importActual('../../data/menjarIBeure/horitzontal.js'), carregaConnexionsCulturals: async () => ({ llavors: [], plantes: [] }) }));
afterEach(cleanup);
function Ubicacio() { const { state } = useLocation(); return <div data-testid="draft">{JSON.stringify(state)}</div>; }
const munta = (ingredients = ['100 g de farina'], entorn) => render(<MemoryRouter rutaInicial="/receptes/prova"><ProveidorPlataforma entorn={entorn}><MotorHoritzontalRecepta recepta={{ id: 'prova', slug: 'prova', ingredients }} /><Ubicacio /></ProveidorPlataforma></MemoryRouter>);
const confirmaRacions = () => {
  fireEvent.change(screen.getByLabelText('Racions de la recepta original'), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText('Racions que vols preparar'), { target: { value: '4' } });
};
describe('Real Pedra Seca controls and recipe flow', () => {
  it('has real product/unit options and a priced line after explicit choices', async () => {
    munta(); await screen.findByRole('option', { name: /Farina · Prova/ });
    expect(screen.getByRole('option', { name: 'kg' }).value).toBe('kg');
    confirmaRacions();
    fireEvent.change(screen.getByLabelText('Producte per a 100 g de farina'), { target: { value: 'mer-farina' } });
    fireEvent.change(screen.getByLabelText('Minva en percentatge de 100 g de farina'), { target: { value: '0' } });
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Cost total: 0,15 €'));
    fireEvent.change(screen.getByLabelText('Quantitat original de 100 g de farina'), { target: { value: '' } });
    expect(screen.getByLabelText('Quantitat original de 100 g de farina').value).toBe('');
    expect(screen.getByRole('status').textContent).toContain('ingredients pendents');
  });
  it('never invents servings and disables transfer until both are explicit valid integers', async () => {
    munta(); await screen.findByRole('option', { name: /Farina · Prova/ });
    expect(screen.getByLabelText('Racions de la recepta original').value).toBe('');
    expect(screen.getByLabelText('Racions que vols preparar').value).toBe('');
    const prepara = screen.getByRole('button', { name: 'Prepara la compra al Rebost' });
    expect(prepara.disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toContain('Confirma les racions');
    confirmaRacions(); expect(prepara.disabled).toBe(false);
    for (const value of ['', '0', '1.5', '10001']) {
      fireEvent.change(screen.getByLabelText('Racions de la recepta original'), { target: { value } });
      expect(prepara.disabled, value).toBe(true);
      expect(screen.getByRole('status').textContent).not.toContain('Cost total:');
    }
    expect(screen.getByTestId('draft').textContent).toBe('null');
  });
  it('local quotes expose normalized kg/l/u choices', async () => {
    munta(); await screen.findByRole('option', { name: /Farina · Prova/ });
    fireEvent.change(screen.getByLabelText('Producte per a 100 g de farina'), { target: { value: 'oferta-local' } });
    expect([...screen.getByLabelText('Unitat del preu de 100 g de farina').options].map((o) => o.value)).toEqual(['', 'kg', 'l', 'u']);
  });
  it('transfers corrected servings and quantity as ephemeral router state', async () => {
    munta(); await screen.findByRole('option', { name: /Farina · Prova/ });
    fireEvent.change(screen.getByLabelText('Racions de la recepta original'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Racions que vols preparar'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Quantitat original de 100 g de farina'), { target: { value: '250' } });
    fireEvent.click(screen.getByRole('button', { name: 'Prepara la compra al Rebost' }));
    const draft = JSON.parse(screen.getByTestId('draft').textContent).trasllatRecepta;
    expect(draft).toMatchObject({ racions: 8, racionsBase: 8, linies: [{ quantitat: 250, unitat: 'g' }] });
  });
});


it('production default apps block transfer and Bar CTA while retaining real calculation', async () => {
  munta(['100 g de farina'], { produccio: true, teDret: () => true, teCapacitat: () => true });
  await screen.findByRole('option', { name: /Farina · Prova/ }); confirmaRacions();
  fireEvent.change(screen.getByLabelText('Producte per a 100 g de farina'), { target: { value: 'mer-farina' } });
  fireEvent.change(screen.getByLabelText('Minva en percentatge de 100 g de farina'), { target: { value: '0' } });
  expect(screen.getByRole('status').textContent).toContain('Cost total: 0,15 €');
  const compra = screen.getByRole('button', { name: 'Prepara la compra al Rebost' });
  expect(compra.disabled).toBe(true); fireEvent.click(compra);
  expect(screen.getByTestId('draft').textContent).toBe('null');
  expect(screen.queryByRole('link', { name: 'Obri els escandalls d’El Bar' })).toBeNull();
  expect(screen.getByText(/La compra al Rebost no està disponible ací/).textContent).toContain('encara està en proves');
});

it('DEV availability keeps both real destinations usable after explicit serving choices', async () => {
  munta(['100 g de farina'], { produccio: false, teDret: () => true, teCapacitat: () => true });
  await screen.findByRole('option', { name: /Farina · Prova/ }); confirmaRacions();
  expect(screen.getByRole('link', { name: 'Obri els escandalls d’El Bar' }).getAttribute('href')).toBe('/app/bar/escandalls');
  expect(screen.getByRole('button', { name: 'Prepara la compra al Rebost' }).disabled).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Prepara la compra al Rebost' }));
  expect(JSON.parse(screen.getByTestId('draft').textContent).trasllatRecepta).toMatchObject({ racionsBase: 4, racions: 4 });
});
