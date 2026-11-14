/* R24 · Gauntlet Loop, ronda 2 (G-client-4 i G-client-10) · Prova de regressió permanent (arnés copiat de XatSection.unaFilaPerPersona.test.jsx).
   Onada R24 · IDEA-260 (a), carril xat_ui · La bústia del Mestre (captura
   261114_0428) pintava «Damià Llorens Jordà», «Sofía Bornay» i «Alfredo
   Llorens» dues vegades: el canal privat de Sóc de Poble (on entra com a
   gestor, amb la píndola de l'entitat) i el directe personal del «Connexió
   nova». A més, dues files «Cap missatge.» (Alfredo i Luisfe) que ningú no
   havia escrit. I va escriure «Hola amic!» com a Sóc de Poble creient que era
   el seu xat personal (CA-3): res no li deia, dins de la conversa, amb quina
   identitat escrivia ni li deixava canviar-la.
   Opció B (una fila per persona, compatible amb R21.8: mai s'amaga cap canal
   d'entitat): una sola fila, amb una píndola per identitat; la capçalera de
   la conversa porta el selector «Personal · Sóc de Poble» (botons
   aria-pressed) que porta a /xat/<id> de l'altre canal. Patró de
   XatSection.arxivaEnLot.test.jsx i, per al focus, de
   XatSection.focusDeRuta.test.jsx. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { mapejaFil } from './missatges.js';
import { buidaEsborranys } from './esborranys.js';
import { _reiniciaPilaEnrere } from '../../config/pilaEnrere.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), threadId: null, params: new URLSearchParams(), threads: [], amplada: 1280,
  marcaLlegides: vi.fn(), arxivaFil: vi.fn(), showToast: vi.fn(), sendChatMessage: vi.fn(async () => [])
}));

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    useLocation: () => ({ pathname: mocks.threadId ? `/xat/${mocks.threadId}` : '/xat', search: '' }),
    useSearchParams: () => [mocks.params],
    useParams: () => ({ threadId: mocks.threadId }),
    useRouter: () => ({ navigate: mocks.navigate, currentPath: mocks.threadId ? `/xat/${mocks.threadId}` : '/xat' }),
    Link: ({ to, children, className, ...rest }) => createElement('a', { href: to, className, ...rest }, children)
  };
});
vi.mock('../../pages/NotFoundPage', () => ({ default: () => null }));
vi.mock('../text/TextSection', async () => {
  const { createElement } = await import('react');
  return { default: ({ pageKey }) => createElement('div', { 'data-testid': 'document-per-defecte' }, pageKey) };
});
vi.mock('./components/FitxaVivaDeComunitat.jsx', async () => {
  const { createElement } = await import('react');
  return { default: () => createElement('div', { 'data-testid': 'fitxa-viva-de-comunitat' }) };
});
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ pageCopy: {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, fallback) => fallback, resolveAsset: (v) => v }),
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: {} })
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: vi.fn() }) }));
vi.mock('./XatContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useXat: () => ({
    scopeKey: 'A', ambitEstable: '', status: 'ready', avis: null, chatThreads: mocks.threads, getThreadMessages: () => [],
    sendChatMessage: mocks.sendChatMessage, obriFil: () => {}, creaFil: vi.fn(), cercaMembres: vi.fn(async () => []), totalNoLlegits: 0,
    hiHaMesAntics: () => false, carregantAntics: () => false, carregaMesAntics: () => {}, reintenta: () => {},
    descartaFallit: () => {}, marcaVist: () => {}, comunitats: [], contactesFrequents: [], marcaLlegides: mocks.marcaLlegides,
    obriFilDePagina: vi.fn(async () => null), joId: 'jo', joNom: 'Javi', senseSessio: false,
    potArxivarFil: () => true, arxivaFil: mocks.arxivaFil
  })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock('../notes/canalEmojis.js', () => ({
  carregaCatalegEmojis: async () => ({ GRUPS_EMOJIS: [{ id: 'cares-emocions', nom: 'Cares', emojis: [['1F600', '😀', 'grinning face']] }] })
}));

/* AppGridShell mesura el contenidor: 1280 és ample (llista i conversa); 375, estret. */
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return mocks.amplada; } });


const ARA = Date.now();
const fa = (minuts) => new Date(ARA - minuts * 60000).toISOString();
const DAMIA = { id: 'damia', nom: 'Damià Llorens Jordà', tipus: 'persona' };
function fil({ id, entitat = null, al, text, autor = 'damia', seq, llegit }) {
  return mapejaFil({
    id, tipus: 'directe', titol: null, altres: [DAMIA], altresNoms: [DAMIA.nom],
    ...(entitat ? { entitatId: entitat.id, entitatNom: entitat.nom, comEntitat: true } : {}),
    ultimText: text, ultimAl: al, actualitzatAl: al, ultimAutorId: autor, ultimSeq: seq, llegitFinsSeq: llegit
  });
}
const SDP = { id: 'org-sdp', nom: 'Sóc de Poble' };
const RENTONAR = { id: 'org-rentonar', nom: 'El Rentonar' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.threadId = null;
  mocks.params = new URLSearchParams();
  mocks.amplada = 1280;
  mocks.sendChatMessage.mockImplementation(async () => []);
  /* El directe personal és el més recent i està llegit; el canal de Sóc de
     Poble (més vell) porta 3 missatges de Damià sense llegir. */
  mocks.threads = [
    fil({ id: 'd-damia', al: fa(1), text: 'Gràcies!', autor: 'jo', seq: 4, llegit: 4 }),
    fil({ id: 'c-damia', entitat: SDP, al: fa(30), text: 'Vull donar-me de baixa', seq: 3, llegit: 0 })
  ];
  buidaEsborranys();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); _reiniciaPilaEnrere(); });

const llista = () => screen.getByRole('list', { name: 'Converses', hidden: true });
const botoDeDamia = () => within(llista()).queryAllByText('Damià Llorens Jordà')[0].closest('button');

test('G-client-4 · prémer la fila amb 3 no llegits obri el canal que els porta, i amb el personal obert el selector diu on són', () => {
  const vista = render(<XatSection />);
  expect(botoDeDamia().textContent).toContain('3 missatges no llegits');
  fireEvent.click(botoDeDamia());
  /* Abans (Gauntlet R24): obria /xat/d-damia, el directe personal llegit,
     perquè el representant era sempre el més recent. */
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/c-damia');
  /* Amb el directe personal obert (per ruta), la fila continua dient 3 i el
     selector senyala els 3 del canal de Sóc de Poble. */
  mocks.threadId = 'd-damia';
  vista.rerender(<XatSection />);
  expect(botoDeDamia().textContent).toContain('3 missatges no llegits');
  const grup = screen.getByRole('group', { name: 'Escrius com a' });
  const sdp = within(grup).getByRole('button', { name: /Sóc de Poble/ });
  expect(sdp.textContent + (sdp.getAttribute('aria-label') || ''), 'cap senyal dels 3 no llegits del canal de Sóc de Poble')
    .toMatch(/no llegit|\b3\b/);
  expect(sdp.textContent).toContain('3 missatges no llegits');
  /* La identitat premuda (la conversa oberta) no porta cap pastilla. */
  const personal = within(grup).getByRole('button', { name: 'Personal' });
  expect(personal.getAttribute('aria-pressed')).toBe('true');
  expect(personal.textContent).toBe('Personal');
});

test('sobreviu · dues entitats + personal: tres identitats en ordre fix, i cada enviament va al filId del canal triat', async () => {
  mocks.threads = [
    fil({ id: 'd-damia', al: fa(1), text: 'Hola', seq: 1, llegit: 1 }),
    fil({ id: 'c-damia', entitat: SDP, al: fa(2), text: 'Consulta', seq: 1, llegit: 1 }),
    fil({ id: 'r-damia', entitat: RENTONAR, al: fa(3), text: 'Comanda', seq: 1, llegit: 1 })
  ];
  mocks.threadId = 'r-damia';
  const vista = render(<XatSection />);
  const grup = screen.getByRole('group', { name: 'Escrius com a' });
  expect(within(grup).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')]))
    .toEqual([['Personal', 'false'], ['El Rentonar', 'true'], ['Sóc de Poble', 'false']]);
  const envia = async (text) => {
    fireEvent.change(screen.getByRole('textbox', { name: 'Escriu un missatge' }), { target: { value: text } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Envia' })); });
  };
  await envia('com a Rentonar');
  fireEvent.click(within(grup).getByRole('button', { name: 'Personal' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/d-damia');
  mocks.threadId = 'd-damia';
  vista.rerender(<XatSection />);
  await envia('com a persona');
  const crides = mocks.sendChatMessage.mock.calls.map(([f, text]) => [f.id, f.comEntitat, f.entitatNom, text]);
  expect(crides).toEqual([['r-damia', true, 'El Rentonar', 'com a Rentonar'], ['d-damia', false, null, 'com a persona']]);
});

test('G-client-10 · des d’un directe personal encara buit, el selector porta al canal de l’entitat però ja no torna: «Personal» desapareix', () => {
  /* «Escriu-li» des del perfil de Damià crea el directe personal buit i l'obri;
     Javi ja tenia el canal de Sóc de Poble amb Damià. */
  mocks.threads = [
    mapejaFil({ id: 'd-damia', tipus: 'directe', altres: [DAMIA], altresNoms: [DAMIA.nom], ultimSeq: 0, llegitFinsSeq: 0, actualitzatAl: fa(1) }),
    fil({ id: 'c-damia', entitat: SDP, al: fa(30), text: 'Consulta', seq: 2, llegit: 2 })
  ];
  mocks.threadId = 'd-damia';
  const vista = render(<XatSection />);
  const grup = screen.getByRole('group', { name: 'Escrius com a' });
  fireEvent.click(within(grup).getByRole('button', { name: 'Sóc de Poble' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/c-damia');
  mocks.threadId = 'c-damia';
  vista.rerender(<XatSection />);
  const despres = screen.queryByRole('group', { name: 'Escrius com a' });
  expect(despres, 'el selector ha desaparegut: no hi ha cap camí de tornada a «Personal»').not.toBeNull();
});
