/* Onada R24 · IDEA-260 (a), carril xat_ui · La bústia del Mestre (captura
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
import { useEffect, useRef } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { mapejaFil } from './missatges.js';
import { buidaEsborranys } from './esborranys.js';
import { TEXTOS_ARXIVA } from './arxivaXat.js';
import { _reiniciaPilaEnrere } from '../../config/pilaEnrere.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), threadId: null, params: new URLSearchParams(), threads: [], amplada: 1280,
  marcaLlegides: vi.fn(), arxivaFil: vi.fn(), showToast: vi.fn()
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
    sendChatMessage: vi.fn(async () => []), obriFil: () => {}, creaFil: vi.fn(), cercaMembres: vi.fn(async () => []), totalNoLlegits: 0,
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
const fa = (dies, minuts = 0) => new Date(ARA - dies * 86400000 - minuts * 60000).toISOString();
const CONNEXIO = 'Connexió nova: m’he connectat amb tu a Sóc de Poble.';

/* Un fil com el torna xat_fils_meus i el mapeja missatges.js (XatContext). */
function fil({ id, qui, nom, al, text = null, entitat = false }) {
  return mapejaFil({
    id,
    tipus: 'directe',
    titol: null,
    altres: [{ id: qui, nom, tipus: 'persona' }],
    altresNoms: [nom],
    ...(entitat ? { entitatId: 'org-sdp', entitatNom: 'Sóc de Poble', comEntitat: true } : {}),
    ultimText: text,
    ultimAl: text ? al : null,
    actualitzatAl: al,
    ultimAutorId: text ? 'jo' : null,
    ultimSeq: text ? 1 : 0,
    llegitFinsSeq: text ? 1 : 0
  });
}

/* Les 12 files de la captura del Mestre, de dalt a baix. */
const filsDeLaCaptura = () => [
  fil({ id: 'c-damia', qui: 'damia', nom: 'Damià Llorens Jordà', al: fa(2), text: 'Hola amic! Em veus la foto?', entitat: true }),
  fil({ id: 'c-sofia', qui: 'sofia', nom: 'Sofía Bornay', al: fa(2, 10), text: 'Hola Sofia!!! Pots veure el xat?', entitat: true }),
  fil({ id: 'c-alfredo', qui: 'alfredo', nom: 'Alfredo Llorens', al: fa(4), entitat: true }),
  fil({ id: 'c-luisfe', qui: 'luisfe', nom: 'Luisfe', al: fa(6), entitat: true }),
  fil({ id: 'd-nando', qui: 'nando', nom: 'Nando Llinares', al: fa(7), text: 'Ifufi' }),
  fil({ id: 'd-anna', qui: 'anna', nom: 'Anna Calvo', al: fa(9), text: CONNEXIO }),
  fil({ id: 'd-pep', qui: 'pep', nom: 'Pep c', al: fa(11), text: CONNEXIO }),
  fil({ id: 'd-diego', qui: 'diego', nom: 'Diego Baldo', al: fa(11, 1), text: CONNEXIO }),
  fil({ id: 'd-sofia', qui: 'sofia', nom: 'Sofía Bornay', al: fa(11, 2), text: CONNEXIO }),
  fil({ id: 'd-alfredo', qui: 'alfredo', nom: 'Alfredo Llorens', al: fa(11, 3), text: CONNEXIO }),
  fil({ id: 'd-damia', qui: 'damia', nom: 'Damià Llorens Jordà', al: fa(11, 4), text: CONNEXIO }),
  fil({ id: 'd-carmen', qui: 'carmen', nom: 'Carmen Chabrera', al: fa(11, 5), text: CONNEXIO })
];

/* App.jsx · l'efecte de ruta que enfoca <main> (XatSection.focusDeRuta.test.jsx). */
function AppDeProva() {
  const pathname = mocks.threadId ? `/xat/${mocks.threadId}` : '/xat';
  const mainRef = useRef(null);
  useEffect(() => { mainRef.current?.focus({ preventScroll: true }); }, [pathname]);
  return <main id="main-content" tabIndex={-1} ref={mainRef}><XatSection /></main>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.threadId = null;
  mocks.params = new URLSearchParams();
  mocks.threads = filsDeLaCaptura();
  mocks.amplada = 1280;
  mocks.marcaLlegides.mockReturnValue(2);
  mocks.arxivaFil.mockImplementation(async (_id, arxivar) => ({ estat: 'fet', arxivat: arxivar }));
  buidaEsborranys();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); _reiniciaPilaEnrere(); });

const llista = () => screen.getByRole('list', { name: 'Converses', hidden: true });
const filesDe = (nom) => within(llista()).queryAllByText(nom);
const botoDeLaPersona = (nom) => filesDe(nom)[0].closest('button');
const pindolesDe = (boto) => [...boto.querySelectorAll('.sdp-xat-fila__entitat')].map((p) => p.textContent);
const fotograma = () => act(async () => { await new Promise((r) => { requestAnimationFrame(() => r()); }); });
const fotogrames = async (n = 3) => { for (let i = 0; i < n; i += 1) await fotograma(); };
function aplicaNavegacio(vista) {
  const [ruta] = mocks.navigate.mock.calls.at(-1);
  const url = new URL(ruta, 'https://x.invalid');
  const parts = url.pathname.split('/').filter(Boolean);
  mocks.threadId = parts[1] ? decodeURIComponent(parts[1]) : null;
  mocks.params = new URLSearchParams(url.search);
  vista.rerender(<AppDeProva />);
}

test('IDEA-260 · «Damià Llorens Jordà» es pinta una sola vegada (abans, dues), amb la píndola de Sóc de Poble i la de «Personal»', () => {
  render(<XatSection />);
  expect(filesDe('Damià Llorens Jordà')).toHaveLength(1);
  expect(filesDe('Sofía Bornay')).toHaveLength(1);
  expect(filesDe('Alfredo Llorens')).toHaveLength(1);
  /* R21.8 · el canal d'entitat no s'amaga: la seua píndola continua a la fila. */
  expect(pindolesDe(botoDeLaPersona('Damià Llorens Jordà'))).toEqual(['Personal', 'Sóc de Poble']);
  expect(pindolesDe(botoDeLaPersona('Sofía Bornay'))).toEqual(['Personal', 'Sóc de Poble']);
  /* El lector de pantalla diu que la fila porta dues converses. */
  expect(botoDeLaPersona('Damià Llorens Jordà').textContent).toContain('2 converses: Personal i Sóc de Poble');
  /* Una fila d'un sol canal no canvia: cap píndola nova. */
  expect(pindolesDe(botoDeLaPersona('Nando Llinares'))).toEqual([]);
  /* R24 · Gauntlet (G-client-11) · El canal buit de Sóc de Poble amb Alfredo
     ja no s'amaga (R21.8.3, «mai s'oculten fils comEntitat»): es plega a la
     seua fila, amb la píndola. Abans, `[]`. */
  expect(pindolesDe(botoDeLaPersona('Alfredo Llorens'))).toEqual(['Personal', 'Sóc de Poble']);
});

/* R24 · Gauntlet (G-client-11) · Abans, esta prova demanava que el canal de
   Sóc de Poble amb Luisfe (comEntitat, buit) no es llistara. Contradeia la
   regla R21.8.3 del Mestre («mai s'oculten fils comEntitat»,
   XatR21_8.whatsappMillorat.test.jsx); l'integrador ha triat complir-la. C2
   continua amagant el directe PERSONAL buit; el canal d'entitat buit es
   llista (el de Luisfe, sol; el d'Alfredo, plegat a la seua fila). */
test('IDEA-260 (C2) · cap fila «Cap missatge.» d’un directe personal que ningú no ha escrit; el canal d’entitat buit de Luisfe es queda (R21.8.3)', () => {
  render(<XatSection />);
  expect(filesDe('Luisfe')).toHaveLength(1);
  expect(within(botoDeLaPersona('Luisfe')).queryAllByText('Cap missatge.')).toHaveLength(1);
  expect(within(llista()).queryAllByText('Cap missatge.')).toHaveLength(
    /* La de la IAIA de reserva (actorsDelXat.js) i la del canal d'entitat de Luisfe. */
    within(llista()).queryAllByText('IAIA MarIA').length + 1
  );
  expect(botoDeLaPersona('Alfredo Llorens').textContent).toContain(CONNEXIO);
});

test('el fil buit obert sí que es llista (el de Luisfe, sol), com el de qui acaba d’obrir «En privat»', () => {
  mocks.threadId = 'c-luisfe';
  render(<XatSection />);
  expect(filesDe('Luisfe')).toHaveLength(1);
  expect(botoDeLaPersona('Luisfe').getAttribute('aria-current')).toBe('true');
});

/* Onada R24 · Elephant P2 (CA-3) · Abans, «prémer la fila plegada obri el
   canal més recent (P-2): el de Sóc de Poble amb Damià» ('/xat/c-damia').
   Sense cap no llegit, el més recent era el canal d'entitat, i el Mestre
   acabava escrivint com a Sóc de Poble sense voler. Ara, sense no llegits,
   obri el directe PERSONAL; amb no llegits, continua obrint on són. */
test('prémer la fila plegada sense no llegits obri el directe personal (CA-3), no el canal de Sóc de Poble amb Damià', () => {
  render(<XatSection />);
  fireEvent.click(botoDeLaPersona('Damià Llorens Jordà'));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/d-damia');
});

test('amb no llegits al canal de Sóc de Poble, prémer la fila obri eixe canal (G-client-4, els no llegits primer)', () => {
  mocks.threads = filsDeLaCaptura().map((f) => (f.id === 'c-damia' ? { ...f, noLlegits: 2 } : f));
  render(<XatSection />);
  fireEvent.click(botoDeLaPersona('Damià Llorens Jordà'));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/c-damia');
});

test('CA-3 · dins del directe personal, la capçalera diu i deixa triar amb quina identitat s’escriu: «Personal» premut, «Sóc de Poble» porta al canal', () => {
  mocks.threadId = 'd-damia';
  render(<XatSection />);
  const grup = screen.getByRole('group', { name: 'Escrius com a' });
  const botons = within(grup).getAllByRole('button');
  expect(botons.map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([['Personal', 'true'], ['Sóc de Poble', 'false']]);
  for (const boto of botons) {
    expect(boto.tagName).toBe('BUTTON');
    expect(boto.getAttribute('type')).toBe('button');
    expect(boto.hasAttribute('tabindex')).toBe(false);
  }
  /* La fila de la llista és la del fil obert, i continua sola: representada
     pel directe personal, continua portant la píndola de Sóc de Poble (R21.8). */
  expect(filesDe('Damià Llorens Jordà')).toHaveLength(1);
  expect(botoDeLaPersona('Damià Llorens Jordà').getAttribute('aria-current')).toBe('true');
  expect(botoDeLaPersona('Damià Llorens Jordà').textContent).toContain(CONNEXIO);
  expect(pindolesDe(botoDeLaPersona('Damià Llorens Jordà'))).toEqual(['Personal', 'Sóc de Poble']);
  fireEvent.click(within(grup).getByRole('button', { name: 'Sóc de Poble' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/c-damia');
});

test('CA-3 · dins del canal de Sóc de Poble, «Sóc de Poble» premut i «Personal» porta al directe personal; el canal premut no navega', () => {
  mocks.threadId = 'c-damia';
  render(<XatSection />);
  const grup = screen.getByRole('group', { name: 'Escrius com a' });
  expect(within(grup).getByRole('button', { name: 'Sóc de Poble' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(within(grup).getByRole('button', { name: 'Sóc de Poble' }));
  expect(mocks.navigate).not.toHaveBeenCalledWith('/xat/c-damia');
  fireEvent.click(within(grup).getByRole('button', { name: 'Personal' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/d-damia');
});

test('una conversa d’un sol canal no porta cap selector (Llei del Píxel)', () => {
  mocks.threadId = 'd-nando';
  render(<XatSection />);
  expect(screen.getByRole('heading', { name: 'Nando Llinares' })).toBeTruthy();
  expect(screen.queryByRole('group', { name: 'Escrius com a' })).toBeNull();
});

/* Maj+F10 (el camí del teclat de la pulsació llarga) sobre la fila de Damià, que hi naix triada. */
function seleccionaDamia() {
  const boto = botoDeLaPersona('Damià Llorens Jordà');
  boto.focus();
  fireEvent.keyDown(boto, { key: 'F10', shiftKey: true });
  expect(llista().querySelector('li[data-clau="persona:damia"] > button').getAttribute('aria-checked')).toBe('true');
}

test('seleccionar la fila plegada i marcar-la com a llegida marca tots els seus canals, no només el que la representa', () => {
  render(<XatSection />);
  seleccionaDamia();
  fireEvent.click(screen.getByRole('button', { name: 'Marcar com a llegides' }));
  expect(mocks.marcaLlegides).toHaveBeenCalledWith(['c-damia', 'd-damia']);
});

test('seleccionar la fila plegada i arxivar-la arxiva tots els seus canals: cap no torna a la llista com a fila', async () => {
  render(<XatSection />);
  seleccionaDamia();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: TEXTOS_ARXIVA.seleccionades[1] })); });
  expect(mocks.arxivaFil.mock.calls).toEqual([['c-damia', true], ['d-damia', true]]);
});

test('estret · «Torna a la llista» des del directe personal de Damià porta el focus a la seua fila plegada', async () => {
  mocks.amplada = 375;
  mocks.threadId = 'd-damia';
  const vista = render(<AppDeProva />);
  await fotogrames();
  fireEvent.click(screen.getByRole('button', { name: 'Torna a la llista' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat');
  aplicaNavegacio(vista);
  await fotogrames();
  expect(document.activeElement).toBe(llista().querySelector('li[data-clau="persona:damia"] > button'));
});
