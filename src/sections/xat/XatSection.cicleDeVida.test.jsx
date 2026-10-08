/* Auditoria 261008 (261008_1355_auditoria_claude.md) · El cicle de vida de
   la conversa oberta, amb el XatProvider REAL i el port simulat (no el
   useXat simulat de XatSection.test.jsx, que és on s'amagaven estos dos):
     · B04 · un sondeig de la llista que falla després d'una càrrega bona no
       convertix la conversa oberta en un 404, i un fil que ja s'havia trobat
       tampoc quan desapareix d'una llista al dia;
     · B05 · un fil de pàgina llegit com a visitant sobreviu a recarregar (un
       proveïdor nou, sense visitants, amb la mateixa ruta): la URL de la
       conversa porta el descriptor (?sobre=…) i es torna a obrir abans de
       decidir el 404, sense cap lectura de visitant per xat_historial.
   El router és simulat (com a XatSection.test.jsx): `vesA` hi aplica la ruta
   que l'aplicació demana amb navigate. */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../host.js';
import XatSection from './XatSection';
import { XatProvider } from './XatContext.jsx';
import { buidaEsborranys } from './esborranys.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  threadId: null,
  params: new URLSearchParams(),
  showToast: vi.fn(),
  session: { currentUser: { id: 'A' }, generacio: 1, estat: 'dins' },
  actorKey: 'persona::A',
  port: {
    loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(), creaFilDirecte: vi.fn(),
    carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(), obriFilDePagina: vi.fn(), teCapacitat: vi.fn()
  }
}));

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    useLocation: () => ({ pathname: mocks.threadId ? `/xat/${mocks.threadId}` : '/xat' }),
    useSearchParams: () => [mocks.params],
    useParams: () => ({ threadId: mocks.threadId }),
    useRouter: () => ({ navigate: mocks.navigate, currentPath: '/xat' }),
    Link: ({ to, children, className, ...rest }) => createElement('a', { href: to, className, ...rest }, children)
  };
});
/* Una marca visible: les proves han de poder dir que el 404 NO hi és. */
vi.mock('../../pages/NotFoundPage', async () => {
  const { createElement } = await import('react');
  return { default: () => createElement('p', { 'data-testid': 'pagina-no-trobada' }, 'No trobada') };
});
vi.mock('../text/TextSection', async () => {
  const { createElement } = await import('react');
  return { default: ({ pageKey }) => createElement('div', { 'data-testid': 'document-per-defecte' }, pageKey) };
});
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ pageCopy: {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, resolveAsset: (v) => v }),
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: {} })
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: vi.fn() }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock('../../app/contexts/SessionContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useSession: () => mocks.session
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useIdentitat: () => ({ actorKey: mocks.actorKey, identitats: undefined })
}));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({ ...(await importOriginal()), ...mocks.port }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

/* AppGridShell mesura el contenidor: 1280 és escriptori (llista i conversa). */
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 1280; } });

const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
const TITOL_IAIA = "L'ànima de la iaia";
const SUBJECTE_IAIA = { tipus: 'pagina', id: '/iaia', ruta: '/iaia', titol: TITOL_IAIA };
/* El fil comú de /iaia tal com el torna obri_fil_de_pagina: encara no hi has escrit. */
const FIL_IAIA = { id: 'g-ia', tipus: 'grup', titol: TITOL_IAIA, altresNoms: [], participant: false, subjecte: SUBJECTE_IAIA, ultimSeq: 1, llegitFinsSeq: 0 };
const FIL_A = { id: 'fil-A', tipus: 'directe', titol: 'Pepa', altresNoms: ['Pepa'], ultimSeq: 1, llegitFinsSeq: 1, noLlegits: 0, ultimAutorId: 'X', ultimAl: '2026-10-08T10:00:00Z' };
const missatge = (filId, text) => ({ id: `m-${filId}`, filId, usuariId: 'X', autorNom: 'Pep', text, seq: 1, creatAl: '2026-10-08T10:00:00Z' });

const arbre = () => <XatProvider config={CONFIG}><XatSection /></XatProvider>;

/** El router simulat aplica la ruta que l'aplicació ha demanat. */
function vesA(ruta) {
  const url = new URL(ruta, 'https://x.invalid');
  const parts = url.pathname.split('/').filter(Boolean);
  mocks.threadId = parts[1] ? decodeURIComponent(parts[1]) : null;
  mocks.params = new URLSearchParams(url.search);
}

const noTrobada = () => screen.queryByTestId('pagina-no-trobada');
const lecturesDe = (filId) => mocks.port.loadMissatges.mock.calls.filter(([id]) => id === filId);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.navigate.mockReset();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.threadId = null;
  mocks.params = new URLSearchParams();
  mocks.session = { currentUser: { id: 'A' }, generacio: 1, estat: 'dins' };
  mocks.port.loadFils.mockResolvedValue([]);
  mocks.port.loadMissatges.mockImplementation(async (filId) => [missatge(filId, filId === 'g-ia' ? 'Hola des de la IAIA' : 'Bon dia')]);
  mocks.port.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 1, rebutFinsSeq: 1 });
  mocks.port.subscribeToXat.mockResolvedValue({ subscription: 'sub', error: null });
  mocks.port.unsubscribeFromXat.mockResolvedValue(null);
  mocks.port.carregaMembres.mockResolvedValue([]);
  mocks.port.teCapacitat.mockReturnValue(true);
  mocks.port.obriFilDePagina.mockResolvedValue({ filId: 'g-ia', fils: [FIL_IAIA] });
  buidaEsborranys();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('B05 · un fil de pàgina llegit com a visitant sobreviu a recarregar', () => {
  it('«Comentar» porta a /xat/<filId> amb el descriptor; remuntar el proveïdor amb la mateixa ruta torna a obrir el fil, sense 404 ni avís', async () => {
    /* 1 · «Comentar → En públic» de /iaia (la fila «IAIA MarIA» fa el mateix). */
    mocks.params = new URLSearchParams({ sobre: 'pagina:/iaia', titol: TITOL_IAIA, ruta: '/iaia' });
    const primera = render(arbre());
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
    const [ruta, opcions] = mocks.navigate.mock.calls.at(-1);
    expect(opcions).toEqual({ replace: true });
    const url = new URL(ruta, 'https://x.invalid');
    expect(url.pathname).toBe('/xat/g-ia');
    /* Revisió 261008 · Només el descriptor: ni títol ni ruta a la URL. */
    expect(Object.fromEntries(url.searchParams)).toEqual({ sobre: 'pagina:/iaia' });
    vesA(ruta);
    primera.rerender(arbre());
    await waitFor(() => expect(screen.getByText('Hola des de la IAIA')).toBeTruthy());
    expect(lecturesDe('g-ia').every(([, o]) => o.visitant === true)).toBe(true);
    primera.unmount();

    /* 2 · Recarregar: un proveïdor nou, sense visitants, a /xat/g-ia?sobre=…
       El servidor no et fa participant: la llista continua buida. */
    mocks.port.obriFilDePagina.mockClear();
    mocks.port.loadMissatges.mockClear();
    mocks.navigate.mockReset();
    render(arbre());
    await waitFor(() => expect(screen.getByText('Hola des de la IAIA')).toBeTruthy());
    expect(noTrobada()).toBeNull();
    expect(mocks.port.obriFilDePagina).toHaveBeenCalledTimes(1);
    /* Una 'pagina' pren la ruta del seu id; el títol el posa el servidor. */
    expect(mocks.port.obriFilDePagina).toHaveBeenCalledWith(
      { tipus: 'pagina', id: '/iaia', titol: '', ruta: '/iaia' }, expect.objectContaining({ tenantId: CONFIG.tenantId })
    );
    /* Mai per xat_historial (sense `visitant`): respondria SDP-XAT-006 en bucle. */
    expect(lecturesDe('g-ia').length).toBeGreaterThan(0);
    expect(lecturesDe('g-ia').every(([, o]) => o.visitant === true)).toBe(true);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(document.querySelector('.sdp-xat-avis')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Escriu un missatge' })).toBeTruthy();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  it('un enllaç compartit a un veí d’un altre poble porta al fil que el servidor li torna, amb el mateix descriptor', async () => {
    /* Un enllaç d'abans de la revisió, amb ?ruta=: es continua obrint, però la URL nova ja no la porta. */
    vesA(`/xat/g-ia?sobre=${encodeURIComponent('pagina:/iaia')}&ruta=${encodeURIComponent('/iaia')}`);
    mocks.port.obriFilDePagina.mockResolvedValue({ filId: 'g-ia-2', fils: [{ ...FIL_IAIA, id: 'g-ia-2' }] });
    render(arbre());
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith(
      `/xat/g-ia-2?sobre=${encodeURIComponent('pagina:/iaia')}`, { replace: true }
    ));
    expect(noTrobada()).toBeNull();
    expect(lecturesDe('g-ia')).toEqual([]);
  });

  it('si el subjecte ja no té xat comú, el 404 de sempre; sense descriptor, el 404 sense cap crida', async () => {
    vesA(`/xat/g-ia?sobre=${encodeURIComponent('pagina:/iaia')}`);
    mocks.port.obriFilDePagina.mockResolvedValue(null);
    const vista = render(arbre());
    await waitFor(() => expect(noTrobada()).not.toBeNull());
    expect(mocks.port.obriFilDePagina).toHaveBeenCalledTimes(1);
    vista.unmount();

    mocks.port.obriFilDePagina.mockClear();
    vesA('/xat/desconegut');
    render(arbre());
    await waitFor(() => expect(noTrobada()).not.toBeNull());
    expect(mocks.port.obriFilDePagina).not.toHaveBeenCalled();
    expect(lecturesDe('desconegut')).toEqual([]);
  });

  it('un fil visitant obert des de la llista (sense ?sobre=) afig el seu descriptor a la URL', async () => {
    mocks.params = new URLSearchParams({ sobre: 'pagina:/iaia', titol: TITOL_IAIA, ruta: '/iaia' });
    const vista = render(arbre());
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
    /* La persona torna a la llista i hi prem el fil: /xat/g-ia, sense consulta. */
    vesA('/xat/g-ia');
    mocks.navigate.mockReset();
    vista.rerender(arbre());
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledTimes(1));
    const [ruta, opcions] = mocks.navigate.mock.calls[0];
    expect(opcions).toEqual({ replace: true });
    const url = new URL(ruta, 'https://x.invalid');
    expect(url.pathname).toBe('/xat/g-ia');
    expect(Object.fromEntries(url.searchParams)).toEqual({ sobre: 'pagina:/iaia' });
    expect(screen.getByText('Hola des de la IAIA')).toBeTruthy();
  });

  /* Revisió 261008 · Mòbil amb cobertura rural: la llista arriba bé i la
     reobertura falla per la xarxa. Abans, el catch expulsava a /xat amb
     replace i l'enllaç es perdia. */
  it('una fallada de xarxa en tornar a obrir conserva la URL, avisa on aniria la conversa i el botó hi torna', async () => {
    vesA(`/xat/g-ia?sobre=${encodeURIComponent('pagina:/iaia')}`);
    mocks.port.obriFilDePagina.mockRejectedValueOnce(Object.assign(new Error('Load failed'), { code: 'XARXA', retriable: true }));
    render(arbre());
    const avis = await screen.findByRole('alert');
    expect(within(avis).getByText("No s'ha pogut obrir la conversa.")).toBeTruthy();
    expect(within(avis).getByText('Load failed')).toBeTruthy();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(noTrobada()).toBeNull();
    expect(lecturesDe('g-ia')).toEqual([]);
    fireEvent.click(within(avis).getByRole('button', { name: 'Torna-ho a provar' }));
    await waitFor(() => expect(screen.getByText('Hola des de la IAIA')).toBeTruthy());
    expect(mocks.port.obriFilDePagina).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(noTrobada()).toBeNull();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('després d’una fallada de xarxa, torna a provar sola als 2 s, sense prémer res', async () => {
    vesA(`/xat/g-ia?sobre=${encodeURIComponent('pagina:/iaia')}`);
    mocks.port.obriFilDePagina.mockRejectedValueOnce(Object.assign(new Error('Load failed'), { code: 'XARXA', retriable: true }));
    render(arbre());
    await screen.findByRole('alert');
    const inici = Date.now();
    await waitFor(() => expect(screen.getByText('Hola des de la IAIA')).toBeTruthy(), { timeout: 4000 });
    expect(Date.now() - inici).toBeGreaterThanOrEqual(1500);
    expect(mocks.port.obriFilDePagina).toHaveBeenCalledTimes(2);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('un error que no es pot reintentar continua portant a la llista amb l’avís', async () => {
    vesA(`/xat/g-ia?sobre=${encodeURIComponent('pagina:/iaia')}`);
    mocks.port.obriFilDePagina.mockRejectedValue(Object.assign(new Error('SDP-XAT-013: la pàgina no existix o no la pots vore.'), { code: 'SDP-XAT-013', retriable: false }));
    render(arbre());
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/xat', { replace: true }));
    expect(mocks.showToast).toHaveBeenCalledWith('SDP-XAT-013: la pàgina no existix o no la pots vore.', 'info');
    expect(mocks.port.obriFilDePagina).toHaveBeenCalledTimes(1);
  });
});

describe('B04 · la conversa oberta no es convertix en un 404', () => {
  async function conversaOberta() {
    mocks.port.loadFils.mockResolvedValue([FIL_A]);
    vesA('/xat/fil-A');
    const vista = render(arbre());
    await waitFor(() => expect(screen.getByText('Bon dia')).toBeTruthy());
    return vista;
  }

  it('un loadFils rebutjat després d’una càrrega bona conserva la conversa i la llista, amb un avís que no les tapa', async () => {
    await conversaOberta();
    mocks.port.loadFils.mockRejectedValueOnce(Object.assign(new Error('Load failed'), { code: 'XARXA', retriable: true }));
    /* La xarxa que torna desperta el sondeig: la càrrega de la llista falla. */
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(document.querySelector('.sdp-xat-avis')?.textContent).toBe('Load failed'));
    expect(noTrobada()).toBeNull();
    expect(screen.getByText('Bon dia')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Escriu un missatge' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(within(screen.getByRole('list', { name: 'Converses' })).getByText('Pepa')).toBeTruthy();
    expect(document.querySelector('.sdp-xat-avis').getAttribute('role')).toBe('status');
  });

  /* Revisió 261008 · La conversa «zombi»: un fil que desapareix d'una llista
     AL DIA (li han llevat el rol a qui representava l'entitat) ja no es
     queda a la vista congelada i amb el compositor actiu: es decidix com
     qualsevol fil absent, i no es torna a demanar. */
  it('un fil que desapareix d’una llista al dia ja no es queda congelat: el 404, sense cap lectura més', async () => {
    await conversaOberta();
    mocks.port.loadFils.mockResolvedValue([]);
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(noTrobada()).not.toBeNull());
    expect(screen.queryByText('Bon dia')).toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Escriu un missatge' })).toBeNull();
    const lectures = lecturesDe('fil-A').length;
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await act(async () => {});
    expect(lecturesDe('fil-A').length).toBe(lectures);
  });

  it('amb la llista que no està al dia (l’esquema que la buida), el fil que ja s’havia trobat es conserva, i no en tornar-hi des d’una altra ruta', async () => {
    const vista = await conversaOberta();
    mocks.port.loadFils.mockRejectedValue(Object.assign(new Error('L’esquema del xat no està aplicat.'), { code: 'ESQUEMA', retriable: false }));
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(screen.getByText('L’esquema del xat no està aplicat.')).toBeTruthy());
    expect(noTrobada()).toBeNull();
    expect(screen.getByText('Bon dia')).toBeTruthy();
    /* /xat/fil-A → /xat → /xat/fil-A: la memòria és de la ruta i s'ha oblidat. */
    vesA('/xat');
    vista.rerender(arbre());
    await act(async () => {});
    vesA('/xat/fil-A');
    vista.rerender(arbre());
    await act(async () => {});
    expect(screen.queryByText('Bon dia')).toBeNull();
    /* Amb la llista rància tampoc no es decidix cap 404. */
    expect(noTrobada()).toBeNull();
  });

  /* Revisió 261008 · Un lector de pantalla no anuncia una regió role="status"
     que naix amb el text: la regió hi és sempre, buida i amagada, i el mateix
     node rep el text. */
  it('la regió viva de l’avís de la llista hi és des del principi i el mateix node rep el text', async () => {
    await conversaOberta();
    const regio = document.querySelector('.sdp-workspace-column__body > p[role="status"]');
    expect(regio).not.toBeNull();
    expect(regio.textContent).toBe('');
    expect(regio.className).toBe('sdp-nomes-lector');
    mocks.port.loadFils.mockRejectedValueOnce(Object.assign(new Error('Load failed'), { code: 'XARXA', retriable: true }));
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(regio.textContent).toBe('Load failed'));
    expect(regio.isConnected).toBe(true);
    expect(regio.className).toBe('sdp-xat-avis');
    expect(document.querySelector('.sdp-workspace-column__body > p[role="status"]')).toBe(regio);
  });

  /* [DEFECTE] B18 (pendent, 261008_1355_auditoria_claude.md) · Un sol `avis`
     al context: si en ample, amb la conversa oberta, fallen alhora la llista
     i el fil (ticFil cada 5 s, abans que el tic de 25 s), l'error del fil
     substituïx la llista conservada per «No s'ha pogut carregar el xat».
     B04 continua complint el que és seu (cap 404, la conversa a la vista),
     però l'avís no bloquejant no arriba a vore's. Quan B18 separe avisFil
     d'avisLlista, esta prova s'ha de girar. */
  it('[DEFECTE] B18 · si fallen alhora la llista i el fil obert, l’error del fil tapa la llista conservada', async () => {
    await conversaOberta();
    const xarxa = () => Object.assign(new Error('Load failed'), { code: 'XARXA', retriable: true });
    mocks.port.loadFils.mockRejectedValue(xarxa());
    mocks.port.loadMissatges.mockRejectedValue(xarxa());
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(within(screen.getByRole('alert')).getByText("No s'ha pogut carregar el xat")).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Converses' })).toBeNull();
    expect(noTrobada()).toBeNull();
    expect(screen.getByText('Bon dia')).toBeTruthy();
  });
});
