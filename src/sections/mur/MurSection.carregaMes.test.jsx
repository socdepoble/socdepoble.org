/**
 * Decisió 4 del Mestre (261007) · «Tall de 50 publicacions: CARREGA
 * PROGRESSIVA (LOAD MORE).» El botó «Mostra més» de /mur: al final de la
 * llista, només amb la capacitat 'paginacioSeccions' i amb més pàgines;
 * desactivat i amb aria-busy mentre carrega; l'avís de sempre si falla. Sense
 * botó, el DOM és el de sempre (Llei del Píxel).
 *
 * El proveïdor (MurProvider) i el port (backendPort) són els reals; el backend
 * és un fals complet injectat pel port, com a MurSection.error.test.jsx.
 */
import React from 'react';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
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
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', error: null, pageCopy: {} }) }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: null, generacio: 1 }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'A', actorKey: 'A' }) }));
vi.mock('../../config/dataMode.js', async (importOriginal) => ({ ...(await importOriginal()), eleccioRemotaActiva: () => false }));

import { CONTRACTE_NUCLI } from '../../data/contracte.js';
import { setBackendImplementation } from '../../data/backendPort.js';
import { MurProvider } from './MurContext';
import MurSection from './MurSection.jsx';

const CONFIG = { supabaseUrl: 'http://localhost:54321', supabaseAnonKey: 'sb_publishable_proves', tenantId: '11111111-2222-3333-4444-555555555555', dataMode: 'remote' };
const publicacio = (id, dia) => ({ id, type: 'feed', title: `Publicació ${id}`, created_at: `2026-10-0${dia}T10:00:00.000Z` });
const producte = (id) => ({ id, type: 'market', title: `Producte ${id}`, created_at: '2026-10-01T09:00:00.000Z' });
const MUR = Object.freeze({ feedPosts: [publicacio('p1', 7), publicacio('p2', 6)], events: [], marketItems: [] });

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
  return render(<MurProvider config={CONFIG}><MurSection /></MurProvider>);
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
  // Sense PAGE_COPY, el Mur avisa en desenvolupament de cada pàgina de sistema: no és d'esta prova.
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

test('amb més pàgines, «Mostra més» ix al final de la llista i afig la pàgina següent', async () => {
  installa();
  mocks.load.mockResolvedValue({ ...MUR, paginacio: { mur: 'c1' } });
  mocks.pagina.mockResolvedValueOnce({ elements: [publicacio('p3', 5)], complete: true, nextCursor: null });
  pinta();
  await waitFor(() => expect(targetes()).toHaveLength(2));
  const boto = botoMes();
  expect(boto).toBeTruthy();
  // Al final de la llista: el darrer bloc de la pàgina, després de la graella.
  const embolcall = boto.closest('.sdp-camp');
  expect(embolcall.previousElementSibling.classList.contains('sdp-card-grid')).toBe(true);
  expect(embolcall.nextElementSibling).toBeNull();
  await act(async () => { boto.click(); });
  expect(mocks.pagina).toHaveBeenCalledWith({ seccio: 'mur', cursor: 'c1', signal: expect.any(AbortSignal) }, CONFIG);
  expect(await screen.findByText('Publicació p3')).toBeTruthy();
  expect(targetes()).toHaveLength(3);
  // Era la darrera pàgina: el botó se'n va.
  expect(botoMes()).toBeNull();
});

test('mentre carrega, el botó està desactivat i amb aria-busy, i no es pot demanar dues voltes', async () => {
  installa();
  mocks.load.mockResolvedValue({ ...MUR, paginacio: { mur: 'c1' } });
  let acaba;
  mocks.pagina.mockImplementationOnce(() => new Promise((done) => { acaba = done; }));
  pinta();
  const boto = await screen.findByRole('button', { name: 'Mostra més' });
  await act(async () => { boto.click(); });
  expect(boto.disabled).toBe(true);
  expect(boto.getAttribute('aria-busy')).toBe('true');
  await act(async () => { boto.click(); });
  expect(mocks.pagina).toHaveBeenCalledTimes(1);
  await act(async () => { acaba({ elements: [publicacio('p3', 5)], complete: false, nextCursor: 'c2' }); });
  const despres = screen.getByRole('button', { name: 'Mostra més' });
  expect(despres.disabled).toBe(false);
  expect(despres.hasAttribute('aria-busy')).toBe(false);
});

test('amb «Mostrar tot», carrega les tres seccions pendents; amb «Mercat», només el Mercat', async () => {
  installa();
  mocks.load.mockResolvedValue({ feedPosts: [publicacio('p1', 7)], events: [], marketItems: [producte('m1')], paginacio: { mur: 'c1', mercat: 'cm' } });
  mocks.pagina.mockImplementation(async ({ seccio }) => ({ elements: [], complete: false, nextCursor: `${seccio}-seguent` }));
  pinta();
  const boto = await screen.findByRole('button', { name: 'Mostra més' });
  await act(async () => { boto.click(); });
  expect(mocks.pagina.mock.calls.map(([opcions]) => opcions.seccio).sort()).toEqual(['mercat', 'mur']);
  mocks.pagina.mockClear();
  const filtre = (nom) => within(screen.getByRole('group', { name: 'Filtres del mur' })).queryByRole('button', { name: nom });
  await act(async () => { filtre('Mercat').click(); });
  await act(async () => { botoMes().click(); });
  expect(mocks.pagina.mock.calls.map(([opcions]) => opcions.seccio)).toEqual(['mercat']);
  // El Calendari no té més pàgines: amb el seu filtre, cap botó.
  await act(async () => { filtre('Calendari').click(); });
  expect(botoMes()).toBeNull();
});

test('si la càrrega falla, l’avís de sempre; «Torna-ho a provar» torna a demanar la mateixa pàgina', async () => {
  // Fora de desenvolupament: el detall de l'adaptador no es pinta (T2, EstatErrorDades).
  vi.stubEnv('DEV', false);
  installa();
  mocks.load.mockResolvedValue({ ...MUR, paginacio: { mur: 'c1' } });
  mocks.pagina
    .mockRejectedValueOnce(Object.assign(new Error('Supabase 503: upstream'), { name: 'ErrorSupabase', status: 503 }))
    .mockResolvedValueOnce({ elements: [publicacio('p3', 5)], complete: true, nextCursor: null });
  pinta();
  const boto = await screen.findByRole('button', { name: 'Mostra més' });
  await act(async () => { boto.click(); });
  const avis = await screen.findByRole('alert');
  expect(avis.textContent).toContain("No s'ha pogut carregar el Mur");
  expect(avis.textContent).toContain('El servidor del poble ha tornat un error.');
  expect(avis.textContent).not.toMatch(/Supabase|503|upstream/);
  // Les targetes que ja hi eren no se'n van.
  expect(targetes()).toHaveLength(2);
  await act(async () => { screen.getByRole('button', { name: 'Torna-ho a provar' }).click(); });
  expect(mocks.pagina.mock.calls.map(([opcions]) => opcions.cursor)).toEqual(['c1', 'c1']);
  expect(await screen.findByText('Publicació p3')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});

/* Relleu 261008 (revisió adversarial) · Amb «Mostrar tot» i dues seccions
   pendents, «Torna-ho a provar» només torna a demanar la que ha fallat, amb el
   mateix cursor: la que ja ha carregat no avança una pàgina més. */
test('amb «Mostrar tot», «Torna-ho a provar» només torna a demanar la secció que ha fallat', async () => {
  vi.stubEnv('DEV', false);
  installa();
  mocks.load.mockResolvedValue({ feedPosts: [publicacio('p1', 7)], events: [], marketItems: [producte('m1')], paginacio: { mur: 'c1', mercat: 'cm' } });
  mocks.pagina.mockImplementation(async ({ seccio }) => {
    if (seccio === 'mur') throw Object.assign(new Error('Supabase 503: upstream'), { name: 'ErrorSupabase', status: 503 });
    return { elements: [producte('m2')], complete: false, nextCursor: 'cm2' };
  });
  pinta();
  const boto = await screen.findByRole('button', { name: 'Mostra més' });
  await act(async () => { boto.click(); });
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(targetes()).toHaveLength(3);
  mocks.pagina.mockReset();
  mocks.pagina.mockResolvedValueOnce({ elements: [publicacio('p2', 6)], complete: true, nextCursor: null });
  await act(async () => { screen.getByRole('button', { name: 'Torna-ho a provar' }).click(); });
  expect(mocks.pagina.mock.calls.map(([{ seccio, cursor }]) => [seccio, cursor])).toEqual([['mur', 'c1']]);
  expect(await screen.findByText('Publicació p2')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(targetes()).toHaveLength(4);
  // El Mercat continua pendent, des d'on s'havia quedat.
  expect(botoMes()).toBeTruthy();
});

test('sense la capacitat, cap botó encara que loadMur porte un cursor', async () => {
  installa({ ambCapacitat: false });
  mocks.load.mockResolvedValue({ ...MUR, paginacio: { mur: 'c1' } });
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
  mocks.load.mockResolvedValue(MUR);
  const sense = pinta();
  await waitFor(() => expect(targetes()).toHaveLength(2));
  const domSense = senseIds(sense.container.innerHTML);
  cleanup();
  installa();
  mocks.load.mockResolvedValue(MUR);
  const amb = pinta();
  await waitFor(() => expect(targetes()).toHaveLength(2));
  expect(primeraDiferencia(senseIds(amb.container.innerHTML), domSense)).toBeNull();
  // El contenidor del Mur, dins del de la Pàgina Universal.
  expect(document.querySelector('.content-wrapper .content-wrapper').lastElementChild.classList.contains('sdp-card-grid')).toBe(true);
  expect(botoMes()).toBeNull();
});
