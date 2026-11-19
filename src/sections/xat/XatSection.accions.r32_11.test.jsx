import { useEffect, useState } from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { buidaEsborranys, llegixEsborrany } from './esborranys.js';
import { creaAccionsMissatge } from '../../data/xat/accionsMissatge.js';
import { projectaAccionsMissatges } from '../../data/xat/projeccioAccionsMissatges.js';
import { CLAU_COLUMNES_PLEGADES, _reiniciaColumnesPlegades } from '../../components/universal/workspace/columnesPlegades.js';
import { delVal } from '../../config/storage.js';

const estat = vi.hoisted(() => ({
  navigate: vi.fn(),
  showToast: vi.fn(),
  creaNota: vi.fn(),
  threadId: 'fil-a',
  ambit: 'supabase::usuari-1::persona',
  joId: 'usuari-1',
  joNom: 'Javi',
  senseSessio: false,
  modeDades: 'remote',
  params: new URLSearchParams(),
  threads: [],
  rawMessages: {},
  perMissatge: {},
  notificaCanvi: null,
  port: null,
  motor: null,
  sendChatMedia: vi.fn(),
  sendChatMessage: vi.fn(),
  creaFil: vi.fn(),
  obriFil: vi.fn()
}));

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return {
    useNavigate: () => estat.navigate,
    useLocation: () => ({ pathname: estat.threadId ? `/xat/${estat.threadId}` : '/xat' }),
    useSearchParams: () => [estat.params],
    useParams: () => ({ threadId: estat.threadId }),
    useRouter: () => ({ navigate: estat.navigate, currentPath: estat.threadId ? `/xat/${estat.threadId}` : '/xat' }),
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
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: estat.creaNota }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: estat.showToast })
}));
vi.mock('./IAIAProvider.jsx', () => ({ default: ({ children }) => children }));
vi.mock('./IAIALocalProvider.jsx', () => ({ default: ({ children }) => children }));

vi.mock('./XatContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useXat: () => {
    const [, setTick] = useState(0);
    useEffect(() => {
      estat.notificaCanvi = () => setTick((n) => n + 1);
      return () => {
        estat.notificaCanvi = null;
      };
    }, []);
    return {
      scopeKey: estat.ambit,
      ambitEstable: estat.ambit,
      status: 'ready',
      avis: null,
      llistaFresca: true,
      avisLlista: null,
      modeDades: estat.modeDades,
      chatThreads: estat.threads,
      getThreadMessages: (id) => projectaAccionsMissatges(estat.rawMessages[id] || [], estat.perMissatge),
      sendChatMessage: estat.sendChatMessage,
      sendChatMedia: estat.sendChatMedia,
      obriFil: estat.obriFil,
      creaFil: estat.creaFil,
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
      joId: estat.joId,
      joNom: estat.joNom,
      senseSessio: estat.senseSessio,
      alternaReaccio: (...args) => estat.motor.alternaReaccio(...args),
      alternaDestacat: (...args) => estat.motor.alternaDestacat(...args),
      alternaFixat: (...args) => estat.motor.alternaFixat(...args),
      eliminaPerAMi: (...args) => estat.motor.eliminaPerAMi(...args),
      responEnPrivat: (...args) => estat.motor.responEnPrivat(...args),
      reenviaAConverses: (...args) => estat.motor.reenviaAConverses(...args)
    };
  }
}));

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get() { return 1280; }
});

const ARA = '2026-11-18T12:00:00.000Z';

function muntaXat() {
  return render(<XatSection />);
}

beforeEach(() => {
  delVal(CLAU_COLUMNES_PLEGADES);
  _reiniciaColumnesPlegades();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  buidaEsborranys();
  estat.navigate.mockReset();
  estat.showToast.mockReset();
  estat.sendChatMedia.mockReset();
  estat.sendChatMessage.mockReset();
  estat.creaFil.mockReset();
  estat.obriFil.mockReset();
  estat.threadId = 'fil-a';
  estat.ambit = 'supabase::usuari-1::persona';
  estat.joId = 'usuari-1';
  estat.joNom = 'Javi';
  estat.senseSessio = false;
  estat.modeDades = 'remote';
  estat.params = new URLSearchParams();
  estat.perMissatge = {};

  estat.threads = [
    {
      id: 'fil-a',
      title: 'Grup Cooperativa',
      name: 'Grup Cooperativa',
      tipus: 'grup',
      participant: true,
      potEscriure: true,
      ultimText: 'Bon dia!',
      ultimAl: ARA,
      noLlegits: 0,
      altresNoms: ['Maria', 'Pep']
    },
    {
      id: 'fil-b',
      title: 'Pep Soler',
      name: 'Pep Soler',
      tipus: 'directe',
      participant: true,
      potEscriure: true,
      ultimText: 'Fins ara',
      ultimAl: '2026-11-18T11:00:00.000Z',
      noLlegits: 0,
      altresNoms: ['Pep Soler']
    },
    {
      id: 'fil-arxivat',
      title: 'Conversa Arxivada',
      name: 'Conversa Arxivada',
      tipus: 'directe',
      arxivat: true,
      participant: true,
      potEscriure: true,
      ultimAl: '2026-11-17T10:00:00.000Z'
    }
  ];

  estat.rawMessages = {
    'fil-a': [
      {
        id: 'msg-1',
        filId: 'fil-a',
        threadId: 'fil-a',
        seq: 1,
        sender: 'other',
        usuariId: 'usuari-maria',
        author: 'Maria',
        tipus: 'text',
        text: 'Tenim oli nou al molí!',
        creatAl: ARA
      },
      {
        id: 'msg-meu',
        filId: 'fil-a',
        threadId: 'fil-a',
        seq: 2,
        sender: 'me',
        usuariId: 'usuari-1',
        author: 'Jo',
        tipus: 'imatge',
        text: 'Garrafa de 5L preparada',
        metadades: {
          adjunt: {
            id: 'adj-foto-1',
            mime: 'image/webp',
            midaBytes: 2048,
            amplada: 800,
            alcada: 800,
            duradaMs: null
          }
        },
        creatAl: ARA
      }
    ],
    'fil-b': []
  };

  estat.port = {
    alternaReaccio: vi.fn(async ({ emoji, activa }) => ({
      reaccions: activa ? [{ emoji, total: 1, meua: true }] : []
    })),
    alternaDestacat: vi.fn(async ({ actiu }) => ({ destacat: actiu })),
    alternaFixat: vi.fn(async ({ actiu }) => ({ fixat: actiu })),
    eliminaPerAMi: vi.fn(async () => ({ amagat: true })),
    carregaAccionsMissatges: vi.fn(async () => ({ missatges: [], teMes: false, seguentId: null }))
  };

  let seqGen = 10;
  estat.sendChatMedia.mockImplementation(async (desti, adjunt) => [{
    id: adjunt.id,
    filId: desti.id,
    threadId: desti.id,
    seq: ++seqGen,
    tipus: adjunt.tipus,
    text: adjunt.text || '',
    metadades: { adjunt: { id: 'adj-nou', mime: adjunt.fitxer.type } }
  }]);

  let nId = 0;
  estat.motor = creaAccionsMissatge({
    port: estat.port,
    generaId: () => `op-${++nId}`,
    obteContext: () => ({
      clau: estat.ambit,
      actiu: Boolean(estat.joId) && !estat.senseSessio,
      usuariId: estat.joId,
      modeDades: estat.modeDades,
      config: {}
    }),
    obteMissatge: (ref) => {
      const id = typeof ref === 'object' ? ref?.id : ref;
      const filId = (typeof ref === 'object' ? (ref?.filId ?? ref?.threadId) : null) || estat.threadId;
      return (estat.rawMessages[filId] || []).find((m) => m.id === id) || null;
    },
    onCanvi: (snap) => {
      estat.perMissatge = snap.perMissatge;
      estat.notificaCanvi?.();
    },
    creaPrivat: async (destinatariId) => {
      estat.creaFil(destinatariId, null);
      return 'fil-privat-maria';
    },
    obreFil: (id) => estat.obriFil(id),
    enviaText: async (desti, text, opcions) => [{
      id: opcions.clientMsgId,
      filId: desti.id,
      threadId: desti.id,
      seq: ++seqGen,
      tipus: 'text',
      text
    }],
    enviaAdjunt: (...args) => estat.sendChatMedia(...args),
    lligBlob: async () => new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/webp' })
  });
  estat.motor.activa();
});

afterEach(() => {
  estat.motor?.tanca();
  cleanup();
});

describe('R32.11 · D-v128-2 · XatSection cablejat complet amb useXat()', () => {
  test('1. Reaccions ràpides: obri la paleta de Bombolla i persisteix alternaReaccio al motor', async () => {
    muntaXat();
    const bombolla = document.querySelector('li[data-missatge="msg-1"]');
    expect(bombolla).not.toBeNull();

    fireEvent.click(within(bombolla).getByRole('button', { name: 'Opcions del missatge' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Reacciona' }));

    const botoPolze = within(bombolla).getAllByRole('button').find((b) => b.textContent?.includes('👍'));
    expect(botoPolze).toBeTruthy();
    fireEvent.click(botoPolze);

    await waitFor(() => {
      expect(estat.port.alternaReaccio).toHaveBeenCalledWith(
        { filId: 'fil-a', missatgeId: 'msg-1', emoji: '👍', activa: true },
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });
    expect(bombolla.textContent).toContain('👍');
  });

  test('2. Destacats: alterna Destaca i Lleva dels destacats persistint al motor', async () => {
    muntaXat();
    const bombolla = document.querySelector('li[data-missatge="msg-1"]');

    fireEvent.click(within(bombolla).getByRole('button', { name: 'Opcions del missatge' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Destaca' }));

    await waitFor(() => {
      expect(estat.port.alternaDestacat).toHaveBeenCalledWith(
        { filId: 'fil-a', missatgeId: 'msg-1', actiu: true },
        expect.any(Object)
      );
    });
    expect(within(bombolla).getByTitle('Missatge destacat')).toBeTruthy();

    fireEvent.click(within(bombolla).getByRole('button', { name: 'Opcions del missatge' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Lleva dels destacats' }));

    await waitFor(() => {
      expect(estat.port.alternaDestacat).toHaveBeenCalledWith(
        { filId: 'fil-a', missatgeId: 'msg-1', actiu: false },
        expect.any(Object)
      );
    });
  });

  test('3. Fixats: fixa un missatge al bàner superior i el desfixa des del bàner', async () => {
    muntaXat();
    const bombolla = document.querySelector('li[data-missatge="msg-1"]');

    fireEvent.click(within(bombolla).getByRole('button', { name: 'Opcions del missatge' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Fixa' }));

    await waitFor(() => {
      expect(estat.port.alternaFixat).toHaveBeenCalledWith(
        { filId: 'fil-a', missatgeId: 'msg-1', actiu: true },
        expect.any(Object)
      );
    });

    const botoDesfixa = screen.getByRole('button', { name: 'Desfixa' });
    fireEvent.click(botoDesfixa);

    await waitFor(() => {
      expect(estat.port.alternaFixat).toHaveBeenCalledWith(
        { filId: 'fil-a', missatgeId: 'msg-1', actiu: false },
        expect.any(Object)
      );
    });
  });

  test('4. Elimina per a mi (Llei 0): sense «Elimina per a tothom» i amb persistència d’eliminaPerAMi', async () => {
    muntaXat();
    const bombollaMeua = document.querySelector('li[data-missatge="msg-meu"]');
    expect(bombollaMeua).not.toBeNull();

    fireEvent.click(within(bombollaMeua).getByRole('button', { name: 'Opcions del missatge' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Elimina/i }));

    expect(screen.queryByRole('button', { name: 'Elimina per a tothom' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Elimina per a mi' }));

    await waitFor(() => {
      expect(estat.port.eliminaPerAMi).toHaveBeenCalledWith(
        { filId: 'fil-a', missatgeId: 'msg-meu' },
        expect.any(Object)
      );
    });
    expect(document.querySelector('li[data-missatge="msg-meu"]')).toBeNull();
  });

  test('5. Reenviament multimèdia: preserva foto/Blob i peu de foto cap a una altra conversa i hi navega', async () => {
    muntaXat();
    const bombollaFoto = document.querySelector('li[data-missatge="msg-meu"]');

    fireEvent.click(within(bombollaFoto).getByRole('button', { name: 'Opcions del missatge' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Reenvia' }));

    // Dins del diàleg de reenviament, la conversa arxivada no apareix com a destí; Pep Soler sí
    const dialegReenvia = screen.getByRole('dialog', { name: /Reenvia|Compartix|Tria una conversa/i });
    expect(within(dialegReenvia).queryByText('Conversa Arxivada')).toBeNull();
    const destiPep = within(dialegReenvia).getAllByRole('button').find((b) => b.textContent?.includes('Pep Soler'));
    expect(destiPep).toBeTruthy();
    fireEvent.click(destiPep);

    await waitFor(() => {
      expect(estat.sendChatMedia).toHaveBeenCalledTimes(1);
    });
    const [destiRebut, payloadAdjunt] = estat.sendChatMedia.mock.calls[0];
    expect(destiRebut.id).toBe('fil-b');
    expect(payloadAdjunt.tipus).toBe('imatge');
    expect(payloadAdjunt.fitxer).toBeInstanceOf(Blob);
    expect(payloadAdjunt.fitxer.type).toBe('image/webp');
    expect(payloadAdjunt.text).toBe('Garrafa de 5L preparada');

    await waitFor(() => {
      expect(estat.showToast).toHaveBeenCalledWith('Missatge reenviat', 'success');
      expect(estat.navigate).toHaveBeenCalledWith('/xat/fil-b');
    });
  });

  test('6. Respon en privat des d’un grup: crea directe amb l’autora, desa cita a l’esborrany i navega', async () => {
    muntaXat();
    const bombollaMaria = document.querySelector('li[data-missatge="msg-1"]');

    fireEvent.click(within(bombollaMaria).getByRole('button', { name: 'Opcions del missatge' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Respon en privat' }));

    await waitFor(() => {
      expect(estat.creaFil).toHaveBeenCalledWith('usuari-maria', null);
      expect(estat.navigate).toHaveBeenCalledWith('/xat/fil-privat-maria');
    });
    expect(llegixEsborrany('supabase::usuari-1::persona::fil-privat-maria')).toContain('> Maria: Tenim oli nou al molí!');
  });

  test('7. Click-path-audit: un AbortError no dispara toast d’error espuri i un error real sí que n’avisa', async () => {
    estat.port.alternaReaccio.mockRejectedValueOnce(new DOMException('Avortat', 'AbortError'));
    muntaXat();
    const bombolla = document.querySelector('li[data-missatge="msg-1"]');

    fireEvent.click(within(bombolla).getByRole('button', { name: 'Opcions del missatge' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Reacciona' }));
    fireEvent.click(within(bombolla).getAllByRole('button').find((b) => b.textContent?.includes('❤️')));

    await new Promise((r) => setTimeout(r, 30));
    expect(estat.showToast).not.toHaveBeenCalled();

    estat.port.alternaFixat.mockRejectedValueOnce(new Error('Error de xarxa simulat'));
    fireEvent.click(within(bombolla).getByRole('button', { name: 'Opcions del missatge' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Fixa' }));

    await waitFor(() => {
      expect(estat.showToast).toHaveBeenCalledWith('Error de xarxa simulat', 'error');
    });
  });
});
