/**
 * Decisió 4 del Mestre (261007) · «Tall de 50 publicacions: CARREGA
 * PROGRESSIVA (LOAD MORE).» El botó «Mostra més» de /mercat: al final de la
 * llista de productes, només amb la capacitat 'paginacioSeccions' i amb més
 * pàgines del Mercat; desactivat i amb aria-busy mentre carrega; l'avís de
 * sempre (EstatErrorDades) si falla. Sense botó, el DOM és el de sempre (Llei
 * del Píxel).
 *
 * El proveïdor (MurProvider, d'on el Mercat trau els productes) i el port són
 * els reals; el backend és un fals complet injectat pel port, com a
 * MercatSection.error.test.jsx i MurSection.carregaMes.test.jsx.
 */
import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  t: (_, alternativa) => alternativa, externalConfig: {}, load: vi.fn(), pagina: vi.fn()
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => ({ externalConfig: mocks.externalConfig })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: null, generacio: 1 }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'A', actorKey: 'A' }) }));
vi.mock('../../config/dataMode.js', async (importOriginal) => ({ ...(await importOriginal()), eleccioRemotaActiva: () => false }));

import { CONTRACTE_NUCLI } from '../../data/contracte.js';
import { setBackendImplementation } from '../../data/backendPort.js';
import { MurProvider } from '../mur/MurContext';
import MercatSection from './MercatSection.jsx';

const CONFIG = { supabaseUrl: 'http://localhost:54321', supabaseAnonKey: 'sb_publishable_proves', tenantId: '11111111-2222-3333-4444-555555555555', dataMode: 'remote' };
const producte = (id) => ({ id, type: 'market', title: `Producte ${id}`, created_at: '2026-10-01T09:00:00.000Z' });
const MERCAT = Object.freeze({ feedPosts: [], events: [], marketItems: [producte('m1'), producte('m2')] });

const installa = ({ ambCapacitat = true } = {}) => {
  const inesperat = (nom) => () => { throw new Error(`Mètode inesperat: ${nom}`); };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, inesperat(nom)])),
    loadMur: (...args) => mocks.load(...args),
    ...(ambCapacitat ? { loadSeccioPage: (...args) => mocks.pagina(...args) } : {})
  });
};
const pinta = () => {
  mocks.externalConfig = CONFIG;
  return render(<MurProvider config={CONFIG}><MercatSection /></MurProvider>);
};
const targetes = () => document.querySelectorAll('.sdp-card-grid > *');
const botoMes = () => screen.queryByRole('button', { name: 'Mostra més' });

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
beforeEach(() => {
  mocks.load.mockReset();
  mocks.pagina.mockReset();
});

test('amb més productes, «Mostra més» ix al final de la llista i afig la pàgina següent del Mercat', async () => {
  installa();
  mocks.load.mockResolvedValue({ ...MERCAT, paginacio: { mercat: 'cm' } });
  mocks.pagina.mockResolvedValueOnce({ elements: [producte('m3')], complete: true, nextCursor: null });
  pinta();
  await waitFor(() => expect(targetes()).toHaveLength(2));
  const boto = botoMes();
  expect(boto).toBeTruthy();
  // Al final de la llista: el bloc que seguix la graella, i cap més després.
  const embolcall = boto.closest('.sdp-camp');
  expect(embolcall.previousElementSibling.classList.contains('sdp-card-grid')).toBe(true);
  expect(embolcall.nextElementSibling).toBeNull();
  await act(async () => { boto.click(); });
  expect(mocks.pagina).toHaveBeenCalledWith({ seccio: 'mercat', cursor: 'cm', signal: expect.any(AbortSignal) }, CONFIG);
  expect(await screen.findByText('Producte m3')).toBeTruthy();
  expect(targetes()).toHaveLength(3);
  // Era la darrera pàgina: el botó se'n va.
  expect(botoMes()).toBeNull();
});

test('només pagina el Mercat: un cursor del Mur o del Calendari no pinta cap botó a /mercat', async () => {
  installa();
  mocks.load.mockResolvedValue({ ...MERCAT, paginacio: { mur: 'c1', events: 'ce' } });
  pinta();
  await waitFor(() => expect(targetes()).toHaveLength(2));
  expect(botoMes()).toBeNull();
  expect(mocks.pagina).not.toHaveBeenCalled();
});

test('mentre carrega, el botó està desactivat i amb aria-busy, i no es pot demanar dues voltes', async () => {
  installa();
  mocks.load.mockResolvedValue({ ...MERCAT, paginacio: { mercat: 'cm' } });
  let acaba;
  mocks.pagina.mockImplementationOnce(() => new Promise((done) => { acaba = done; }));
  pinta();
  const boto = await screen.findByRole('button', { name: 'Mostra més' });
  await act(async () => { boto.click(); });
  expect(boto.disabled).toBe(true);
  expect(boto.getAttribute('aria-busy')).toBe('true');
  await act(async () => { boto.click(); });
  expect(mocks.pagina).toHaveBeenCalledTimes(1);
  await act(async () => { acaba({ elements: [producte('m3')], complete: false, nextCursor: 'cm2' }); });
  const despres = screen.getByRole('button', { name: 'Mostra més' });
  expect(despres.disabled).toBe(false);
  expect(despres.hasAttribute('aria-busy')).toBe(false);
  expect(targetes()).toHaveLength(3);
});

test('si la càrrega falla, l’avís de sempre del Mercat; «Torna-ho a provar» torna a demanar la mateixa pàgina', async () => {
  // Fora de desenvolupament: el detall de l'adaptador no es pinta (T2, EstatErrorDades).
  vi.stubEnv('DEV', false);
  installa();
  mocks.load.mockResolvedValue({ ...MERCAT, paginacio: { mercat: 'cm' } });
  mocks.pagina
    .mockRejectedValueOnce(Object.assign(new Error('Supabase 503: upstream'), { name: 'ErrorSupabase', status: 503 }))
    .mockResolvedValueOnce({ elements: [producte('m3')], complete: true, nextCursor: null });
  pinta();
  const boto = await screen.findByRole('button', { name: 'Mostra més' });
  await act(async () => { boto.click(); });
  const avis = await screen.findByRole('alert');
  expect(avis.textContent).toContain("No s'ha pogut carregar el Mercat");
  expect(avis.textContent).toContain('El servidor del poble ha tornat un error.');
  expect(avis.textContent).not.toMatch(/Supabase|503|upstream/);
  // Els productes que ja hi eren no se'n van.
  expect(targetes()).toHaveLength(2);
  await act(async () => { screen.getByRole('button', { name: 'Torna-ho a provar' }).click(); });
  expect(mocks.pagina.mock.calls.map(([opcions]) => opcions.cursor)).toEqual(['cm', 'cm']);
  expect(await screen.findByText('Producte m3')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(mocks.load).toHaveBeenCalledTimes(1);
});

test('sense la capacitat, cap botó encara que loadMur porte el cursor del Mercat', async () => {
  installa({ ambCapacitat: false });
  mocks.load.mockResolvedValue({ ...MERCAT, paginacio: { mercat: 'cm' } });
  pinta();
  await waitFor(() => expect(targetes()).toHaveLength(2));
  expect(botoMes()).toBeNull();
  expect(mocks.pagina).not.toHaveBeenCalled();
});

/* Els identificadors que genera React (useId) canvien d'un muntatge a l'altre:
   no són part del DOM que es compara. */
const senseIds = (html) => html.replace(/\s(id|for|aria-labelledby|aria-describedby|aria-controls)="[^"]*"/g, ' $1="·"');
/* La primera diferència, curta: un innerHTML sencer no cap en un informe. */
function primeraDiferencia(a, b) {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i += 1;
  return i === a.length && i === b.length ? null : `${a.slice(Math.max(0, i - 80), i + 80)}\n≠\n${b.slice(Math.max(0, i - 80), i + 80)}`;
}

test('Llei del Píxel · sense botó, el DOM és idèntic amb i sense la capacitat, i la graella és el darrer bloc', async () => {
  installa({ ambCapacitat: false });
  mocks.load.mockResolvedValue(MERCAT);
  const sense = pinta();
  await waitFor(() => expect(targetes()).toHaveLength(2));
  const domSense = senseIds(sense.container.innerHTML);
  cleanup();
  installa();
  mocks.load.mockResolvedValue(MERCAT);
  const amb = pinta();
  await waitFor(() => expect(targetes()).toHaveLength(2));
  expect(primeraDiferencia(senseIds(amb.container.innerHTML), domSense)).toBeNull();
  expect(document.querySelector('.sdp-card-grid').nextElementSibling).toBeNull();
  expect(botoMes()).toBeNull();
});
