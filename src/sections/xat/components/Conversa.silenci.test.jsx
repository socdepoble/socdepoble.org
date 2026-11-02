/* B8C-5 (marató 261101_2143; B8-CLIENT §5.1) · Integració del silenci de la
   conversa: Conversa connectada al XatProvider REAL (com a XatSection) amb el
   port simulat. Menú «⋯» → diàleg → «1 setmana» → avís «Conversa silenciada
   fins al …» → l'entrada passa a «Deixa de silenciar», que desfà sense diàleg.
   Sense servidor (NO-DISPONIBLE), l'avís honest del silenci en memòria. En
   anglés, «Mute notifications». jsdom no té showModal: es fa com el navegador. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../host.js';
import '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { XatProvider, useXat } from '../XatContext.jsx';
import Conversa from './Conversa.jsx';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, showToast: vi.fn(),
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn(), silenciaFil: vi.fn(),
  quotaXat: vi.fn(async () => ({ usats: 0, limit: 20_000_000, pendents: [] })), descartaAdjuntXat: vi.fn()
}));
vi.mock('../../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: 'persona::A', identitats: undefined }) }));
vi.mock('../../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: (_, alternativa) => alternativa })
}));
vi.mock('../../../components/universal/NotificationContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: () => ({ showToast: mock.showToast })
}));
vi.mock('../../../data/backendPort.js', () => mock);
vi.mock('../../../host.js', () => ({ quanLlest: async () => {} }));

const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
const ca = createTranslator('ca');
const FIL = { id: 'fil-A', tipus: 'directe', titol: 'Pepa', altresNoms: ['Pepa'], altres: [{ id: 'P', nom: 'Pepa', tipus: 'persona' }], ultimSeq: 3, llegitFinsSeq: 3, noLlegits: 0, ultimAutorId: 'P', ultimAl: '2026-11-01T10:00:00Z' };
const FORMAT = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };

let value;
function Arnes({ t, locale }) {
  const xat = useXat();
  value = xat;
  const fil = xat.chatThreads.find((f) => f.id === 'fil-A');
  if (!fil) return null;
  return (
    <Conversa
      fil={fil} messages={[]} onSendMessage={xat.sendChatMessage} onBack={() => {}} onEnviaAlBloc={async () => {}}
      onCopia={() => {}} hiHaMes={false} carregantMes={false} onCarregaMes={() => {}} onReintenta={() => {}}
      onDescarta={() => {}} onMarcaVist={() => {}} locale={locale} t={t}
    />
  );
}
const arbre = (t = ca, locale = 'ca-ES') => (
  <MemoryRouter>
    <AppGridContext.Provider value={{ mida: 'ample' }}>
      <XatProvider config={CONFIG}><Arnes t={t} locale={locale} /></XatProvider>
    </AppGridContext.Provider>
  </MemoryRouter>
);
const opcions = () => document.querySelector('.sdp-xat-capcalera__menu > button');
async function muntada(t, locale) {
  render(arbre(t, locale));
  await vi.waitFor(() => expect(value.status).toBe('ready'));
  await vi.waitFor(() => expect(opcions()).toBeTruthy());
}
const obriMenu = () => fireEvent.click(opcions());
const etiquetes = () => screen.getAllByRole('menuitem').map((item) => item.textContent);
const dialeg = () => document.querySelector('dialog');
const obert = () => dialeg()?.hasAttribute('open') === true;

beforeEach(() => {
  vi.clearAllMocks();
  mock.loadFils.mockResolvedValue([FIL]);
  mock.loadMissatges.mockResolvedValue([]);
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 3, rebutFinsSeq: 3 });
  mock.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.teCapacitat.mockReturnValue(true);
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() {
    this.setAttribute('open', '');
    (this.querySelector('[autofocus]') || this.querySelector('button:not(:disabled)'))?.focus();
  } });
});
afterEach(() => {
  cleanup();
  delete HTMLDialogElement.prototype.showModal;
});

describe('amb el servidor (capacitat silenciXat)', () => {
  test('menú → diàleg → «1 setmana» → «Conversa silenciada fins al …» → «Deixa de silenciar», que desfà sense diàleg', async () => {
    await muntada(ca, 'ca-ES');
    obriMenu();
    expect(etiquetes()).toEqual(['Seleccionar missatges', 'Silencia les notificacions']);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Silencia les notificacions' }));
    expect(obert()).toBe(true);
    expect(screen.getByRole('dialog', { name: 'Silencia les notificacions d’esta conversa' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '8 hores' }).checked).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: '1 setmana' }));

    const fi = new Date(Date.now() + 7 * 24 * 3600000).toISOString();
    mock.silenciaFil.mockResolvedValueOnce({ silenciatFinsAl: fi });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Silencia' })); });
    await vi.waitFor(() => expect(mock.showToast).toHaveBeenCalledTimes(1));
    expect(mock.silenciaFil).toHaveBeenCalledWith({ filId: 'fil-A', durada: '1setmana' }, expect.objectContaining(CONFIG));
    const data = new Intl.DateTimeFormat('ca-ES', FORMAT).format(new Date(fi));
    expect(mock.showToast).toHaveBeenCalledWith(`Conversa silenciada fins al ${data}`, 'success');
    expect(obert()).toBe(false);
    expect(value.chatThreads.find((f) => f.id === 'fil-A').silenciat).toBe(true);

    obriMenu();
    expect(etiquetes()).toEqual(['Seleccionar missatges', 'Deixa de silenciar']);
    mock.silenciaFil.mockResolvedValueOnce({ silenciatFinsAl: null });
    await act(async () => { fireEvent.click(screen.getByRole('menuitem', { name: 'Deixa de silenciar' })); });
    await vi.waitFor(() => expect(mock.showToast).toHaveBeenCalledTimes(2));
    expect(mock.silenciaFil).toHaveBeenLastCalledWith({ filId: 'fil-A', durada: 'cap' }, expect.anything());
    expect(obert()).toBe(false);
    expect(mock.showToast).toHaveBeenLastCalledWith('La conversa ja no està silenciada', 'success');
    obriMenu();
    expect(etiquetes()).toEqual(['Seleccionar missatges', 'Silencia les notificacions']);
  });

  test('«Cancel·la» no crida el port ni canvia res', async () => {
    await muntada(ca, 'ca-ES');
    obriMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Silencia les notificacions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
    expect(mock.silenciaFil).not.toHaveBeenCalled();
    expect(mock.showToast).not.toHaveBeenCalled();
    obriMenu();
    expect(etiquetes()).toEqual(['Seleccionar missatges', 'Silencia les notificacions']);
  });
});

test('sense el servidor (NO-DISPONIBLE): l’avís honest del silenci en memòria i l’entrada passa a «Deixa de silenciar»', async () => {
  await muntada(ca, 'ca-ES');
  mock.silenciaFil.mockRejectedValueOnce(Object.assign(new Error('Este servidor encara no sap silenciar converses.'), { code: 'NO-DISPONIBLE' }));
  obriMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Silencia les notificacions' }));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Silencia' })); });
  await vi.waitFor(() => expect(mock.showToast).toHaveBeenCalledTimes(1));
  expect(mock.silenciaFil).toHaveBeenCalledWith({ filId: 'fil-A', durada: '8h' }, expect.anything());
  expect(mock.showToast).toHaveBeenCalledWith('Silenciada només en este dispositiu fins que tornes a obrir l’app: el servidor encara no ho guarda.');
  obriMenu();
  expect(etiquetes()).toEqual(['Seleccionar missatges', 'Deixa de silenciar']);
});

test('en anglés, l’etiqueta és «Mute notifications», el diàleg parla anglés i la data va amb el locale de la interfície', async () => {
  const en = createTranslator('en');
  await muntada(en, 'en-GB');
  obriMenu();
  expect(etiquetes()).toEqual(['Select messages', 'Mute notifications']);
  fireEvent.click(screen.getByRole('menuitem', { name: 'Mute notifications' }));
  expect(screen.getByRole('dialog', { name: 'Mute notifications for this chat' })).toBeTruthy();
  expect(screen.getAllByRole('radio').map((r) => r.labels[0].textContent)).toEqual(['8 hours', '1 week', 'Always']);
  const fi = new Date(Date.now() + 8 * 3600000).toISOString();
  mock.silenciaFil.mockResolvedValueOnce({ silenciatFinsAl: fi });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Mute' })); });
  await vi.waitFor(() => expect(mock.showToast).toHaveBeenCalledTimes(1));
  expect(mock.showToast).toHaveBeenCalledWith(`Chat muted until ${new Intl.DateTimeFormat('en-GB', FORMAT).format(new Date(fi))}`, 'success');
  obriMenu();
  expect(etiquetes()).toEqual(['Select messages', 'Unmute']);
});
