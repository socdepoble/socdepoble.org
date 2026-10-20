/* Fase D (261020, tasca 2; pla 261020_1300) · Tot el camí, de veres: la
   targeta (UniversalCard amb ambModeracio), el proveïdor (ProveidorModeracio)
   i els seus diàlegs (DialegsModeracio), amb el port simulat (cap adaptador:
   E1 de tractor-enxufe). Del ⋮ a la denúncia, de la denúncia al bloqueig
   («Bloqueja també»), l'avís amb el diàleg ja tancat i el focus, que torna
   al ⋮ que ho ha obert tot. I la porta de les normes: una sola pregunta,
   acceptar desa la versió vigent i declinar resol false. */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, toast: vi.fn(), caps: new Set(['moderacio', 'normesConvivencia']),
  llistaBloquejos: vi.fn(), bloquejaAutor: vi.fn(), desbloquejaAutor: vi.fn(), denunciaContingut: vi.fn(),
  estatNormes: vi.fn(), acceptaNormes: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => m.session }));
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (nom) => m.caps.has(nom),
  llistaBloquejos: (...a) => m.llistaBloquejos(...a),
  bloquejaAutor: (...a) => m.bloquejaAutor(...a),
  desbloquejaAutor: (...a) => m.desbloquejaAutor(...a),
  denunciaContingut: (...a) => m.denunciaContingut(...a),
  estatNormes: (...a) => m.estatNormes(...a),
  acceptaNormes: (...a) => m.acceptaNormes(...a)
}));
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { ProveidorModeracio } from '../../app/contexts/ModeracioContext.jsx';
import { useModeracio } from '../PedraSeca/hooks/moderacioDePoble.js';
import { UniversalCard } from '../PedraSeca/organismes/UniversalCard.jsx';
import { objecteDe } from '../../config/navigation.js';
import { DialegsModeracio } from './DialegsModeracio.jsx';

const REMOT = Object.freeze({ dataMode: 'remote', supabaseUrl: 'http://localhost:54321', tenantId: '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7' });
const PUBLICACIO = objecteDe({ id: 'p1', title: 'Fira de tardor', ownerUserId: 'pepa', author_name: 'Pepa' }, 'mur');

let valor;
function Sonda() { valor = useModeracio(); return null; }
const arbre = () => (
  <MemoryRouter rutaInicial="/mur">
    <ProveidorModeracio config={REMOT} Dialegs={DialegsModeracio}>
      <Sonda />
      <UniversalCard title="Fira de tardor" author="Pepa" time="11:00" date="25/10/26" dateTime="2026-10-25T11:00:00"
        mainHref="/mur/p1" objecte={PUBLICACIO} hasFooter={true} ambModeracio />
    </ProveidorModeracio>
  </MemoryRouter>
);
async function munta() {
  const vista = render(arbre());
  await waitFor(() => expect(valor.estatBloquejos).toBe('llest'));
  return vista;
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  valor = null;
  m.session = { currentUser: { id: 'A' }, generacio: 1 };
  m.llistaBloquejos.mockResolvedValue([]);
  m.estatNormes.mockResolvedValue({ versio: '2026-10-20', acceptadaAl: null });
});
afterEach(cleanup);

test('del ⋮ a la denúncia i al bloqueig: el resultat en línia, l’avís amb el diàleg tancat i el focus al ⋮', async () => {
  await munta();
  const kebab = screen.getByRole('button', { name: 'Més opcions: Fira de tardor' });
  act(() => { fireEvent.click(kebab); });
  act(() => { fireEvent.click(screen.getByRole('menuitem', { name: 'Denuncia el contingut' })); });
  const denuncia = screen.getByRole('dialog', { name: 'Denuncia este contingut' });

  m.denunciaContingut.mockResolvedValueOnce({ rebuda: true, repetida: false });
  act(() => { fireEvent.click(within(denuncia).getByRole('radio', { name: /^Spam o frau/ })); });
  await act(async () => { fireEvent.click(within(denuncia).getByRole('button', { name: 'Envia la denúncia' })); });
  expect(m.denunciaContingut).toHaveBeenCalledWith({
    objecte: { tipus: 'publicacio', id: 'p1' }, motiu: 'spam_frau', detall: '', autor: { tipus: 'persona', id: 'pepa' }, filId: null
  }, REMOT);
  /* Fase D (261020, revisió) · el resultat és la descripció de «Tanca», que
     té el focus: VoiceOver no anuncia una regió viva que naix amb el text. */
  const tanca = within(denuncia).getByRole('button', { name: 'Tanca' });
  expect(document.activeElement).toBe(tanca);
  expect(document.getElementById(tanca.getAttribute('aria-describedby') || '')?.textContent)
    .toBe('Gràcies. Hem rebut la denúncia i la revisarem en menys de 24 hores.');
  expect(m.toast).not.toHaveBeenCalled();

  act(() => { fireEvent.click(within(denuncia).getByRole('button', { name: 'Bloqueja també Pepa' })); });
  expect(screen.queryByRole('dialog', { name: 'Denuncia este contingut' })).toBeNull();
  const bloqueig = screen.getByRole('dialog', { name: 'Vols bloquejar Pepa?' });

  m.bloquejaAutor.mockResolvedValueOnce({ tipus: 'persona', id: 'pepa', nom: 'Pepa', creatAl: '2026-10-20T12:00:00Z' });
  await act(async () => { fireEvent.click(within(bloqueig).getByRole('button', { name: 'Bloqueja' })); });
  expect(m.bloquejaAutor).toHaveBeenCalledWith({ tipus: 'persona', id: 'pepa', nom: 'Pepa' }, REMOT);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(m.toast).toHaveBeenCalledWith('Has bloquejat Pepa.', 'success');
  expect(valor.esElementBloquejat({ id: 'p1', ownerUserId: 'pepa' })).toBe(true);
  expect(document.activeElement).toBe(kebab);
});

test('un rebuig del bloqueig es diu dins del diàleg, que continua obert, i res no queda amagat', async () => {
  await munta();
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Més opcions: Fira de tardor' })); });
  act(() => { fireEvent.click(screen.getByRole('menuitem', { name: 'Bloqueja Pepa' })); });
  const bloqueig = screen.getByRole('dialog', { name: 'Vols bloquejar Pepa?' });
  m.bloquejaAutor.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'limit' }));
  await act(async () => { fireEvent.click(within(bloqueig).getByRole('button', { name: 'Bloqueja' })); });
  expect(within(bloqueig).getByRole('alert').textContent)
    .toBe('Has fet massa denúncies o bloquejos en poc de temps. Torna-ho a provar d’ací a una estona.');
  expect(screen.getByRole('dialog', { name: 'Vols bloquejar Pepa?' })).toBe(bloqueig);
  expect(valor.esElementBloquejat({ id: 'p1', ownerUserId: 'pepa' })).toBe(false);
  expect(m.toast).not.toHaveBeenCalled();
});

test('les normes: dues preguntes alhora, un sol diàleg; acceptar desa la versió vigent i la següent resol a l’instant', async () => {
  await munta();
  let primera;
  let segona;
  act(() => { primera = valor.asseguraNormes(); segona = valor.asseguraNormes(); });
  expect(segona).toBe(primera);
  const normes = screen.getByRole('dialog', { name: 'Normes de convivència del poble' });
  m.acceptaNormes.mockResolvedValueOnce({ versio: '2026-10-20', acceptadaAl: '2026-10-20T12:00:00Z' });
  act(() => { fireEvent.click(within(normes).getByRole('checkbox')); });
  await act(async () => { fireEvent.click(within(normes).getByRole('button', { name: 'Accepte i continue' })); });
  await expect(primera).resolves.toBe(true);
  expect(m.acceptaNormes).toHaveBeenCalledWith('2026-10-20', REMOT);
  expect(screen.queryByRole('dialog')).toBeNull();
  await expect(valor.asseguraNormes()).resolves.toBe(true);
});

test('les normes: «Ara no» resol false i no desa res', async () => {
  await munta();
  let resposta;
  act(() => { resposta = valor.asseguraNormes(); });
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Ara no' })); });
  await expect(resposta).resolves.toBe(false);
  expect(m.acceptaNormes).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).toBeNull();
});
