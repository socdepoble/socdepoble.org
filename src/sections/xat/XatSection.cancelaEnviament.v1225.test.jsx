/* Onada v1.2.25 (XAT-B01, Lot G6) · K-G6-PENDENT de la integració · El cablatge sencer de
   «Cancel·la l’enviament»: XatContext.cancelaEnviament (ee54c3a98) → XatSection → Conversa →
   Bombolla. Una bombolla pròpia pendent es cancel·la amb un clic, sense el diàleg d'eliminar, i
   ni «Elimina per a mi» ni cap altra acció del motor no es crida. Un missatge confirmat continua
   amb «Elimina» i el seu diàleg. Que després no s'envie ho fixa XatContext.eliminaPendent.v1225
   (VS-F4, sobre l'arnés de XC-03). */
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { buidaEsborranys } from './esborranys.js';
import { CLAU_COLUMNES_PLEGADES, _reiniciaColumnesPlegades } from '../../components/universal/workspace/columnesPlegades.js';
import { delVal } from '../../config/storage.js';

const estat = vi.hoisted(() => ({
  navigate: vi.fn(),
  showToast: vi.fn(),
  cancelaEnviament: vi.fn(),
  eliminaPerAMi: vi.fn(),
  ambContext: true,
  rawMessages: {}
}));

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return {
    useNavigate: () => estat.navigate,
    useLocation: () => ({ pathname: '/xat/fil-a' }),
    useSearchParams: () => [new URLSearchParams()],
    useParams: () => ({ threadId: 'fil-a' }),
    useRouter: () => ({ navigate: estat.navigate, currentPath: '/xat/fil-a' }),
    Link: ({ to, children, className, ...rest }) => createElement('a', { href: to, className, ...rest }, children)
  };
});

vi.mock('../../pages/NotFoundPage', () => ({ default: () => null }));
vi.mock('../text/TextSection', () => ({ default: () => null }));
vi.mock('./components/FitxaVivaDeComunitat.jsx', () => ({ default: () => null }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ pageCopy: {}, towns: [] }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, fallback) => fallback, resolveAsset: (v) => v }),
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: { manageDocumentHead: true } })
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: vi.fn() }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: estat.showToast })
}));
vi.mock('./IAIAProvider.jsx', () => ({ default: ({ children }) => children }));
vi.mock('./IAIALocalProvider.jsx', () => ({ default: ({ children }) => children }));

const FIL = {
  id: 'fil-a',
  title: 'Grup Cooperativa',
  name: 'Grup Cooperativa',
  tipus: 'grup',
  participant: true,
  potEscriure: true,
  ultimText: 'Bon dia!',
  ultimAl: '2026-11-25T12:00:00.000Z',
  noLlegits: 0,
  altresNoms: ['Maria']
};

vi.mock('./XatContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useXat: () => ({
    scopeKey: 'supabase::usuari-1::persona',
    ambitEstable: 'supabase::usuari-1::persona',
    status: 'ready',
    avis: null,
    llistaFresca: true,
    avisLlista: null,
    modeDades: 'remote',
    chatThreads: [FIL],
    getThreadMessages: (id) => estat.rawMessages[id] || [],
    sendChatMessage: vi.fn(),
    sendChatMedia: vi.fn(),
    obriFil: vi.fn(),
    creaFil: vi.fn(),
    cercaMembres: vi.fn().mockResolvedValue([]),
    totalNoLlegits: 0,
    hiHaMesAntics: () => false,
    carregantAntics: () => false,
    esperaAntics: () => null,
    carregaMesAntics: vi.fn(),
    reintenta: vi.fn(),
    descartaFallit: vi.fn(),
    marcaVist: vi.fn(),
    comunitats: [],
    contactesFrequents: [],
    marcaLlegides: () => 0,
    obriFilDePagina: async () => null,
    joId: 'usuari-1',
    joNom: 'Javi',
    senseSessio: false,
    eliminaPerAMi: estat.eliminaPerAMi,
    ...(estat.ambContext ? { cancelaEnviament: estat.cancelaEnviament } : {})
  })
}));

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get() { return 1280; }
});

const opcionsDe = (id) => {
  const bombolla = document.querySelector(`li[data-missatge="${id}"]`);
  expect(bombolla, id).not.toBeNull();
  fireEvent.click(within(bombolla).getByRole('button', { name: 'Opcions del missatge' }));
  return screen.getByRole('menu');
};

beforeEach(() => {
  delVal(CLAU_COLUMNES_PLEGADES);
  _reiniciaColumnesPlegades();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  buidaEsborranys();
  estat.navigate.mockReset();
  estat.showToast.mockReset();
  estat.eliminaPerAMi.mockReset();
  estat.cancelaEnviament.mockReset();
  estat.cancelaEnviament.mockImplementation((msg) => ({ estat: 'local', filId: 'fil-a', missatgeId: String(msg?.id) }));
  estat.ambContext = true;
  estat.rawMessages = {
    'fil-a': [
      {
        id: 'msg-1', filId: 'fil-a', threadId: 'fil-a', seq: 1, sender: 'me', usuariId: 'usuari-1',
        author: 'Jo', tipus: 'text', text: 'Ja enviat', creatAl: '2026-11-25T12:00:00.000Z', estatEnviament: 'enviat'
      },
      {
        id: 'pend-1', filId: 'fil-a', threadId: 'fil-a', seq: null, sender: 'me', usuariId: 'usuari-1',
        author: 'Jo', tipus: 'text', text: 'Encara sense xarxa', creatAl: '2026-11-25T12:01:00.000Z', estatEnviament: 'pendent'
      }
    ]
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('XAT-B01 · K-G6-PENDENT · «Cancel·la l’enviament» de XatSection a la bombolla', () => {
  test('un pendent propi es cancel·la al motor amb un clic, sense el diàleg d’eliminar', () => {
    render(<XatSection />);
    const menu = opcionsDe('pend-1');
    expect(within(menu).queryByRole('menuitem', { name: 'Elimina' })).toBeNull();
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Cancel·la l’enviament' }));
    expect(estat.cancelaEnviament).toHaveBeenCalledTimes(1);
    expect(estat.cancelaEnviament.mock.calls[0][0]).toMatchObject({ id: 'pend-1', estatEnviament: 'pendent' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(estat.eliminaPerAMi).not.toHaveBeenCalled();
  });

  test('un missatge confirmat continua amb «Elimina» i el seu diàleg; la cancel·lació no es crida', () => {
    render(<XatSection />);
    const menu = opcionsDe('msg-1');
    expect(within(menu).queryByRole('menuitem', { name: 'Cancel·la l’enviament' })).toBeNull();
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Elimina' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(estat.cancelaEnviament).not.toHaveBeenCalled();
  });

  test('un context sense cancelaEnviament: el pendent ofereix «Elimina», com abans', () => {
    estat.ambContext = false;
    render(<XatSection />);
    const menu = opcionsDe('pend-1');
    expect(within(menu).queryByRole('menuitem', { name: 'Cancel·la l’enviament' })).toBeNull();
    expect(within(menu).getByRole('menuitem', { name: 'Elimina' })).toBeTruthy();
  });
});
