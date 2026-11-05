/* Revisió del Panell de Control (lot «control», 261104) · Mode rural.

   control-02 · El poble actiu es buscava per `towns.find(p => p.id === tenantId)`
   i llegia `.name`. Però el tenant és l'UUID de public.towns i les fitxes de
   `towns` (la llavor, el local i l'app_content remot) porten l'id slug i el
   camp `title` (configAmfitrio.js): no casava mai. La pantalla deia «Poble
   pendent d’identificar» i eixe text, TRADUÏT a l'idioma de la interfície,
   es gravava com a `municipi` de cada nota i del paquet d'emergència signat.
   Ara: el nom ve de la fitxa del tenant (`id` o `tenant_id`, amb `title` o
   `name`); la dada gravada mai no ix del traductor ni de la configuració de
   l'amfitrió (un global que qualsevol script pot escriure); el poble que
   declara l'amfitrió només es fa servir per al text visible.

   control-06 · L'error del fitxer massa gran passa pel traductor.

   Aquí NO se simula normalizeBackendConfig (ModeRural.test.jsx la fa
   identitat): el tenant és un UUID de veres i les fitxes, les de la llavor. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MOCK_TOWNS } from '../pobles/townsSeed.js';

const TENANT = '11111111-2222-3333-4444-555555555555';
const PENDENT_ANTIC = 'Poble pendent d’identificar';
const POBLE_PER_DEFECTE = 'La Torre de les Maçanes';
const m = vi.hoisted(() => ({ config: {}, towns: [], t: null }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => ({ currentUser: { id: 'persona-a' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitatOpcional: () => ({ actorKey: 'persona:a' }) }));
vi.mock('../../app/contexts/UIContext.jsx', () => ({
  useUIState: () => ({ externalConfig: m.config }),
  useUIActions: () => ({ t: m.t }),
  useUIActionsOpcional: () => (m.t ? { t: m.t } : null)
}));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ towns: m.towns }) }));
vi.mock('../../config/runtimePolicy.js', async (original) => ({ ...await original(), getRuntimePolicy: () => null }));
vi.mock('../../components/universal/UniversalPage.jsx', () => ({ UniversalPage: ({ title, children }) => <section><header className="page-title"><h1>{title}</h1></header>{children}</section> }));

import ModeRural from './ModeRural.jsx';

const estatBuit = () => ({ notes: [], bans: [], pendents: 0, bytesCua: 0, limitBytesCua: 1024, cadenaValida: true, crdt: false, motor: 'memoria' });
const fabrica = vi.fn(async () => ({ estat: async () => estatBuit(), close: () => {}, importaVault: async () => {} }));
const marca = (clau) => `⟦${clau}⟧`;
const reserva = (_clau, text) => text;

beforeEach(() => {
  m.config = { dataMode: 'seed', backendUrl: '', tenantId: TENANT };
  m.towns = MOCK_TOWNS;
  m.t = reserva;
  fabrica.mockClear();
});
afterEach(cleanup);

/* Activa el mode i torna el `municipi` que ha rebut la fàbrica. */
async function municipiGravat(t) {
  m.t = t;
  render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: t('section.control.rural.activa', 'Activar en este dispositiu') }));
  await waitFor(() => expect(fabrica).toHaveBeenCalledTimes(1));
  const { municipi } = fabrica.mock.calls[0][0];
  cleanup(); fabrica.mockClear();
  return municipi;
}

test('control-02 · sense cap fitxa del tenant, el text visible és el pendent traduït i la dada gravada no depén de l’idioma', async () => {
  m.t = marca;
  render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  /* Llei del Píxel · el mateix text visible que abans. */
  expect(screen.getByText(marca('section.control.rural.municipiPendent'))).toBeTruthy();
  cleanup();
  const enValencia = await municipiGravat(reserva);
  const ambClaus = await municipiGravat(marca);
  expect(ambClaus).toBe(enValencia);
  expect(ambClaus).not.toContain('⟦');
  /* La dada és el tenant, que identifica l'origen sense dependre de cap idioma. */
  expect(ambClaus).toBe(TENANT);
});

test('control-02 · la fitxa que declara el tenant (`tenant_id`, camp `title`) dona el nom visible i el gravat', async () => {
  m.towns = MOCK_TOWNS.map((town) => (town.id === 'la-torre-de-les-macanes' ? { ...town, tenant_id: TENANT } : town));
  render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  expect(screen.getByText('La Torre de les Maçanes')).toBeTruthy();
  expect(screen.queryByText(PENDENT_ANTIC)).toBeNull();
  cleanup();
  expect(await municipiGravat(reserva)).toBe('La Torre de les Maçanes');
  expect(await municipiGravat(marca)).toBe('La Torre de les Maçanes');
});

test('control-02 · el poble que declara l’amfitrió es pinta amb el nom de la seua fitxa, però no es grava', async () => {
  m.config = { ...m.config, poble: 'la-torre-de-les-macanes' };
  render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  expect(screen.getByText('La Torre de les Maçanes')).toBeTruthy();
  expect(screen.queryByText('la-torre-de-les-macanes')).toBeNull();
  cleanup();
  expect(await municipiGravat(reserva)).toBe(TENANT);
});

test('control-02 · sense tenant (llavor), la dada és la reserva canònica, mai la traducció', async () => {
  m.config = { dataMode: 'seed', backendUrl: '' };
  expect(await municipiGravat(marca)).toBe(POBLE_PER_DEFECTE);
  expect(await municipiGravat(reserva)).toBe(POBLE_PER_DEFECTE);
});

test('control-03 · el cos de la vista porta el ref que li passa el Panell', () => {
  const vistaRef = createRef();
  render(<ModeRural fabrica={fabrica} onBack={() => {}} vistaRef={vistaRef} />);
  expect(vistaRef.current?.classList.contains('content-wrapper')).toBe(true);
});

test('control-06 · l’error del fitxer massa gran passa pel traductor', async () => {
  m.t = marca;
  render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: marca('section.control.rural.activa') }));
  await waitFor(() => expect(document.querySelector('input[type="file"]')).toBeTruthy());
  const gran = { name: 'notes.json', size: 4 * 1024 * 1024 + 1, text: async () => '{}' };
  fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [gran] } });
  expect((await screen.findByRole('alert')).textContent).toBe(marca('section.control.rural.fitxerGran'));
  expect(screen.queryByText('Tria un fitxer JSON de fins a 4 MB.')).toBeNull();
});
