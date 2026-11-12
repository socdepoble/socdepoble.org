import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from '../../app/contexts/RouterContext';
import { RECEPTES_QUE_DINEM } from '../../data/patrimoni/queDinem.js';
import ReceptaDetailSection from './ReceptaDetailSection.jsx';

const m = vi.hoisted(() => ({ carrega: vi.fn(), cultura: vi.fn() }));
vi.mock('../../app/contexts/UIContext', async orig => ({
  ...await orig(), useUIState: () => ({ externalConfig: {} }), useUIActions: () => ({ t: (_clau, reserva) => reserva, language: 'ca' })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast() {} }) }));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO() {} }));
vi.mock('../../data/menjarIBeure/mercadona.js', () => ({ carregaMercadona: m.carrega }));
vi.mock('../../data/menjarIBeure/horitzontal.js', async orig => ({ ...await orig(), carregaConnexionsCulturals: m.cultura }));
function Ubicacio() { const { pathname, state } = useLocation(); return <output data-testid="ubicacio">{JSON.stringify({ pathname, state })}</output>; }
const munta = () => render(<MemoryRouter rutaInicial="/receptes/pa-rustic"><Routes>
  <Route path="/receptes/:itemId" element={<ReceptaDetailSection />} />
  <Route path="/app/nevera/llista/casa" element={<p>Compra preparada</p>} />
</Routes><Ubicacio /></MemoryRouter>);
beforeEach(() => {
  m.carrega.mockReset().mockResolvedValue({ productes: [{ id: 'farina-font', nom: 'Farina', marca: 'Fixture', preuUnitari: 1.5, preuUnitariCentims: 150, unitatPreuUnitari: 'kg' }] });
  m.cultura.mockReset().mockResolvedValue({ llavors: [], plantes: [] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('Canonical editorial detail with an explicit calculation layer', () => {
  it('opening the recipe keeps literal blocks/notes and upload images without loading prices or writing storage', () => {
    const guarda = vi.spyOn(Storage.prototype, 'setItem');
    const xarxa = vi.fn(() => { throw new Error('XARXA_NO_ESPERADA'); }); vi.stubGlobal('fetch', xarxa);
    const { container } = munta();
    const r = RECEPTES_QUE_DINEM[0];
    expect([...container.querySelectorAll('[data-bloc="ingredients"] li')].map(li => li.textContent)).toEqual(r.ingredients.flatMap(b => b.linies));
    expect([...container.querySelectorAll('[data-bloc="notes"] li')].map(li => li.textContent)).toEqual([...r.notes]);
    expect(screen.queryByRole('region', { name: 'Escandall i connexions de la recepta' })).toBeNull();
    expect(m.carrega).not.toHaveBeenCalled(); expect(m.cultura).not.toHaveBeenCalled();
    expect(guarda).not.toHaveBeenCalled(); expect(xarxa).not.toHaveBeenCalled();
    // Onada R17 (AH-R17-05) · La làmina és el heroImage d'UniversalPage (sense duplicat inline) i el vídeo, un bloc amb façana.
    expect(container.querySelector('.hero-image img').getAttribute('src')).toBe(r.lamina);
    expect(container.querySelector('.sdp-recepta__lamina')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
    expect(r.lamina).toMatch(/^\/assets\/uploads\//);
    expect(JSON.parse(screen.getByTestId('ubicacio').textContent)).toMatchObject({ pathname: '/receptes/pa-rustic', state: null });
  });
  it('calculates only explicit servings/product/yield and transfers only after the requested action', async () => {
    const original = JSON.stringify(RECEPTES_QUE_DINEM[0]);
    const { container } = munta();
    const ingredientsHTML = container.querySelector('[data-bloc="ingredients"]').innerHTML;
    const notesHTML = container.querySelector('[data-bloc="notes"]').innerHTML;
    fireEvent.click(screen.getByRole('button', { name: 'Calcula i prepara la compra' }));
    const motor = within(await screen.findByRole('region', { name: 'Escandall i connexions de la recepta' }));
    await within(motor.getByLabelText('Producte per a 1 kg de farina de força')).findByRole('option', { name: /Farina · Fixture/ });
    expect(m.carrega).toHaveBeenCalledTimes(1);
    const compra = motor.getByRole('button', { name: 'Prepara la compra al Rebost' });
    expect(compra.disabled).toBe(true);
    expect(motor.getByLabelText('Racions de la recepta original').value).toBe('');
    fireEvent.change(motor.getByLabelText('Racions de la recepta original'), { target: { value: '4' } });
    fireEvent.change(motor.getByLabelText('Racions que vols preparar'), { target: { value: '2' } });
    fireEvent.change(motor.getByLabelText('Producte per a 1 kg de farina de força'), { target: { value: 'farina-font' } });
    fireEvent.change(motor.getByLabelText('Minva en percentatge de 1 kg de farina de força'), { target: { value: '0' } });
    expect(motor.getByRole('status').textContent).toContain('Subtotal conegut: 0,75 €');
    expect(motor.getByRole('status').textContent).not.toContain('Cost total:');
    expect(motor.getByText('Gluten: sense revisar', { exact: false })).toBeTruthy();
    expect(container.querySelector('[data-bloc="ingredients"]').innerHTML).toBe(ingredientsHTML);
    expect(container.querySelector('[data-bloc="notes"]').innerHTML).toBe(notesHTML);
    expect(JSON.stringify(RECEPTES_QUE_DINEM[0])).toBe(original);
    expect(JSON.parse(screen.getByTestId('ubicacio').textContent).state).toBeNull();
    fireEvent.click(compra);
    const location = JSON.parse(screen.getByTestId('ubicacio').textContent);
    expect(location.pathname).toBe('/app/nevera/llista/casa');
    expect(location.state.trasllatRecepta).toMatchObject({ slug: 'pa-rustic', racions: 2, racionsBase: 4 });
    expect(location.state.trasllatRecepta.linies).toHaveLength(4);
    expect(location.state.trasllatRecepta.linies[0]).toMatchObject({ text: '1 kg de farina de força', quantitat: 1, unitat: 'kg' });
    expect(JSON.stringify(location.state)).not.toMatch(/preu|costTotal|font fiscal/);
  });
});

/* Onada R15 (P1-02, R15-REG-06, P2-04) · La capa de compra va amb la Nevera: la mateixa porta de compilació que
   src/apps/nevera/manifest.js. P0-113 (ordre del Mestre, 261111): la Nevera és oberta per defecte i la porta és
   d'exclusió; amb VITE_SDP_APP_NEVERA=0 la capa no arriba ni al build ni a la pàgina. Cada cas avalua una
   instància nova de la pàgina (consulta pròpia a l'especificador) amb l'entorn del build que simula; React, el
   router i els mocks són els mateixos. */
describe('the purchase layer ships with the Nevera and leaves with it (VITE_SDP_APP_NEVERA=0)', () => {
  const PORTA = "import.meta.env.VITE_SDP_APP_NEVERA !== '0'";
  const paginaAmb = async (entorn, consulta) => {
    for (const [nom, valor] of Object.entries(entorn)) vi.stubEnv(nom, valor);
    const { default: Pagina } = await import(/* @vite-ignore */ `./ReceptaDetailSection.jsx?${consulta}`);
    return render(<MemoryRouter rutaInicial="/receptes/pa-rustic"><Routes>
      <Route path="/receptes/:itemId" element={<Pagina />} />
      <Route path="/app/nevera/llista/casa" element={<p>Compra preparada</p>} />
    </Routes></MemoryRouter>);
  };

  it('the exact, foldable build literal gates the page block and the Mercadona loader; nothing static reaches the page', () => {
    const pagina = readFileSync('src/sections/patrimoni/ReceptaDetailSection.jsx', 'utf8');
    expect(pagina).toContain(`const MotorDeLaRecepta = ${PORTA}\n  ? lazy(() => import('./MotorHoritzontalRecepta.jsx')`);
    expect(pagina).not.toMatch(/^import .*(?:MotorHoritzontalRecepta|receptaEditorial|menjarIBeure\/mercadona)/m);
    expect(readFileSync('src/data/menjarIBeure/mercadona.js', 'utf8')).toContain(`const importaCataleg = ${PORTA}\n  ? () => import('./mercadona.generated.js')\n  : null;`);
    expect(readFileSync('src/apps/nevera/manifest.js', 'utf8')).toContain(`carrega: ${PORTA} ? () => import('./AppNevera.jsx') : null`);
  });

  it('public build by default (no flag, outside DEV): the motor is there, behind the button, as a deferred chunk', async () => {
    const { container } = await paginaAmb({ DEV: false, VITE_SDP_APP_NEVERA: undefined }, 'publica-per-defecte');
    await screen.findByRole('tablist', { name: 'Tria què vols vore' });
    // Res no es carrega fins que la persona ho demana: ni el motor ni el catàleg.
    expect(screen.queryByRole('region', { name: 'Escandall i connexions de la recepta' })).toBeNull();
    expect(m.carrega).not.toHaveBeenCalled();
    expect(container.textContent).not.toMatch(/no està disponible/i);
    fireEvent.click(screen.getByRole('button', { name: 'Calcula i prepara la compra' }));
    const motor = within(await screen.findByRole('region', { name: 'Escandall i connexions de la recepta' }));
    await within(motor.getByLabelText('Producte per a 1 kg de farina de força')).findByRole('option', { name: /Farina · Fixture/ });
    expect(m.carrega).toHaveBeenCalledTimes(1);
  });

  it('with VITE_SDP_APP_NEVERA=0 the recipe page is R14 again, with no button, no motor and no catalogue', async () => {
    const { container } = await paginaAmb({ DEV: false, VITE_SDP_APP_NEVERA: '0' }, 'nevera-desendollada');
    await screen.findByRole('tablist', { name: 'Tria què vols vore' });
    expect(screen.queryByRole('button', { name: 'Calcula i prepara la compra' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Prepara una compra amb esta recepta' })).toBeNull();
    // Onada R15b (RV-03) · La proposta d'al·lèrgens hi és, però sense línia d'escandall: el DOM sencer es torna a mirar.
    const proposta = container.querySelector('section[data-estat="pendent_validacio_humana"]');
    expect(proposta.querySelector('h3').textContent).toBe('Proposta assistida · Pendent de validació humana');
    expect(container.textContent).not.toMatch(/Mercadona|Escandall|Calcula i prepara/i);
    expect(m.carrega).not.toHaveBeenCalled();
  });

  it('with VITE_SDP_APP_NEVERA=1 (the old opt-in value) the motor still works as in the kit', async () => {
    await paginaAmb({ DEV: false, VITE_SDP_APP_NEVERA: '1' }, 'nevera');
    fireEvent.click(screen.getByRole('button', { name: 'Calcula i prepara la compra' }));
    const motor = within(await screen.findByRole('region', { name: 'Escandall i connexions de la recepta' }));
    await within(motor.getByLabelText('Producte per a 1 kg de farina de força')).findByRole('option', { name: /Farina · Fixture/ });
    expect(m.carrega).toHaveBeenCalledTimes(1);
    fireEvent.change(motor.getByLabelText('Racions de la recepta original'), { target: { value: '4' } });
    fireEvent.change(motor.getByLabelText('Racions que vols preparar'), { target: { value: '2' } });
    fireEvent.change(motor.getByLabelText('Producte per a 1 kg de farina de força'), { target: { value: 'farina-font' } });
    fireEvent.change(motor.getByLabelText('Minva en percentatge de 1 kg de farina de força'), { target: { value: '0' } });
    expect(motor.getByRole('status').textContent).toContain('Subtotal conegut: 0,75 €');
  });
});
