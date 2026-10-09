/* Integració Xat i Pobles (Onada 6, pla 261009_0245, ítem 4: «El fil de xat
   específic també es dirà 'Gent de la Torre'») · El proveïdor del xat vestix
   amb el nom de la gent els fils dels pobles que són a les fitxes
   (useCoreContent): la comunitat a la llista i a les comunitats, i el subjecte
   de tots els seus fils, que és el que diu la capçalera de la conversa
   («Sobre: …»). Els fils arriben com els crea el servidor en remot, amb el nom
   del poble congelat (private.xat_subjecte, 2610042330). La IAIA continua
   sent «IAIA MarIA». Res del que va al servidor no canvia. */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../host.js';
import { XatProvider, useXat } from './XatContext.jsx';
import CapcaleraConversa from './components/CapcaleraConversa.jsx';
import { FilaComunitat } from './components/FilaConversa.jsx';
import { MOCK_TOWNS } from '../pobles/townsSeed.js';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, actorKey: 'persona::A', pathname: '/mur', showToast: vi.fn(), towns: [],
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, identitats: undefined }) }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useLocation: () => ({ pathname: mock.pathname }),
  Link: ({ to, children, ...resta }) => <a href={to} {...resta}>{children}</a>
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, fallback) => fallback }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: mock.towns }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

const t = (_, alternativa) => alternativa;
const ara = '2026-10-09T01:00:00Z';
const TORRE = MOCK_TOWNS.find((town) => town.id === 'la-torre-de-les-macanes');
/* Un poble inventat: no és a la llavor, no té author i el seu nom porta article. */
const INVENTAT = { id: 'olivera-inventada', title: "L'Olivera Inventada" };
const UUID = '44444444-4444-4444-8444-444444444444';

/* La comunitat d'un poble amb Avisos i General, com la torna xat_fils_meus. */
const delPoble = (prefix, subjecte) => [
  { id: `${prefix}-c`, tipus: 'comunitat', titol: subjecte.titol, subjecte, ultimAl: ara },
  { id: `${prefix}-a`, tipus: 'canal', titol: 'Avisos', comunitatId: `${prefix}-c`, subjecte, ultimSeq: 1, llegitFinsSeq: 1, ultimAl: ara },
  { id: `${prefix}-g`, tipus: 'grup', titol: 'General', comunitatId: `${prefix}-c`, subjecte, participants: 3, ultimSeq: 2, llegitFinsSeq: 2, ultimAl: ara }
];
const SUBJECTE_TORRE = { tipus: 'poble', id: TORRE.id, ruta: `/pobles/${TORRE.id}`, titol: TORRE.title };
/* En remot el servidor pot guardar l'UUID de `towns`: la ruta canònica el troba. */
const SUBJECTE_INVENTAT = { tipus: 'poble', id: UUID, ruta: `/pobles/${INVENTAT.id}`, titol: INVENTAT.title };
const IAIA = { id: 'p-iaia', tipus: 'grup', titol: 'IAIA MarIA', subjecte: { tipus: 'pagina', id: '/iaia', ruta: '/iaia', titol: "L'ànima de la iaia" }, ultimAl: ara };
const fils = () => [...delPoble('t', SUBJECTE_TORRE), ...delPoble('i', SUBJECTE_INVENTAT), IAIA];

let value;
function Probe() {
  value = useXat();
  return null;
}
const munta = () => render(<XatProvider config={{ backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' }}><Probe /></XatProvider>);
const fil = (id) => value.chatThreads.find((f) => f.id === id);

beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); mock.pathname = '/mur';
  mock.towns = [...MOCK_TOWNS, INVENTAT];
  mock.loadFils.mockResolvedValue(fils());
  mock.loadMissatges.mockResolvedValue([]);
  mock.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); localStorage.clear(); });

test('la llista i les comunitats diuen el nom de la gent; els fills i la IAIA, el seu', async () => {
  munta();
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(fil('t-c').name).toBe(TORRE.author);
  expect(fil('i-c').name).toBe("Gent de l'Olivera Inventada");
  expect([fil('t-a').name, fil('t-g').name, fil('i-g').name]).toEqual(['Avisos', 'General', 'General']);
  expect(['t-c', 't-a', 't-g'].map((id) => fil(id).subjecte.titol)).toEqual([TORRE.author, TORRE.author, TORRE.author]);
  expect(fil('i-g').subjecte).toEqual({ ...SUBJECTE_INVENTAT, titol: "Gent de l'Olivera Inventada" });
  expect(fil('p-iaia').name).toBe('IAIA MarIA');
  expect(fil('p-iaia').subjecte.titol).toBe("L'ànima de la iaia");
  const perId = Object.fromEntries(value.comunitats.map((c) => [c.fil.id, c.fil.name]));
  expect(perId).toEqual({ 't-c': TORRE.author, 'i-c': "Gent de l'Olivera Inventada" });
});

test('pintat: la fila de la comunitat i la capçalera del General del poble diuen «Gent de …»', async () => {
  munta();
  await waitFor(() => expect(value.status).toBe('ready'));
  const comunitat = value.comunitats.find((c) => c.fil.id === 't-c');
  render(<ul><li><FilaComunitat comunitat={comunitat} onObri={() => {}} t={t} /></li></ul>);
  expect(screen.getByRole('button', { name: new RegExp(TORRE.author) })).toBeTruthy();
  const { container } = render(<CapcaleraConversa fil={fil('t-g')} onTorna={() => {}} t={t} />);
  expect(container.querySelector('.sdp-xat-capcalera__nom').textContent).toBe('General');
  expect(container.querySelector('.sdp-xat-capcalera__sub').textContent).toBe(`Sobre: ${TORRE.author} · 3 participants`);
  const enllac = container.querySelector('.sdp-xat-capcalera__enllac');
  expect(enllac.getAttribute('href')).toBe(`/pobles/${TORRE.id}`);
  expect(enllac.getAttribute('aria-label')).toBe(`Obri la pàgina ${TORRE.author}`);
  cleanup();
  const inventat = render(<CapcaleraConversa fil={fil('i-g')} onTorna={() => {}} t={t} />);
  expect(inventat.container.querySelector('.sdp-xat-capcalera__sub').textContent).toBe("Sobre: Gent de l'Olivera Inventada · 3 participants");
});

test('sense fitxes, el que diu el servidor (cap nom inventat)', async () => {
  mock.towns = [];
  munta();
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(fil('t-c').name).toBe(TORRE.title);
  expect(fil('t-g').subjecte.titol).toBe(TORRE.title);
  expect(fil('i-c').name).toBe(INVENTAT.title);
  expect(fil('p-iaia').name).toBe('IAIA MarIA');
});

test('presentació: el que torna a demanar al servidor el fil de pàgina porta el mateix subjecte (tipus i id)', async () => {
  munta();
  await waitFor(() => expect(value.status).toBe('ready'));
  const general = fil('i-g');
  expect([general.subjecte.tipus, general.subjecte.id, general.subjecte.ruta]).toEqual(['poble', UUID, `/pobles/${INVENTAT.id}`]);
  expect(mock.obriFilDePagina).not.toHaveBeenCalled();
});
