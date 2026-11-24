import { useLayoutEffect } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../components/layout/AppGridShell.jsx';
import Conversa from './components/Conversa.jsx';
import { XatProvider, useXat } from './XatContext.jsx';
import { potEliminarMissatgePerATothom } from './eliminaPerATothomModel.js';
import { _reiniciaEsborratsSessioLocalPerATests } from './eliminaPerATothomPrevia.js';
import { textAccioMissatgeXat } from './i18nAccionsMissatgeXat.js';
import ca from '../../config/idiomes/ca.js';
import es from '../../config/idiomes/es.js';
import en from '../../config/idiomes/en.js';
import eu from '../../config/idiomes/eu.js';
import gl from '../../config/idiomes/gl.js';

const FIL_GENERAL = '11111111-1111-4111-8111-111111111111';
const COM_LA_TORRE = '22222222-2222-4222-8222-222222222222';
const JAVI_ID = '33333333-3333-4333-8333-333333333333';
const SOC_DE_POBLE_ORG = '44444444-4444-4444-8444-444444444444';
const ALTRE_VEI_ID = '55555555-5555-4555-8555-555555555555';
const ALTRA_ORG_ID = '66666666-6666-4666-8666-666666666666';

const MSG_ANTIC = 'aaaa0001-aaaa-4aaa-8aaa-aaaaaaaa0001';
const MSG_PROVA2 = 'aaaa0002-aaaa-4aaa-8aaa-aaaaaaaa0002';
const MSG_SCREENSHOT = 'aaaa0003-aaaa-4aaa-8aaa-aaaaaaaa0003';
const MSG_RESPOSTA_VEI = 'aaaa0004-aaaa-4aaa-8aaa-aaaaaaaa0004';

const mockPort = vi.hoisted(() => ({
  session: {},
  identitat: {},
  entrada: 1,
  loadFils: vi.fn(),
  loadMissatges: vi.fn(),
  enviaMissatge: vi.fn(),
  publicaAdjuntXat: vi.fn(),
  marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(),
  carregaMembres: vi.fn(),
  subscribeToXat: vi.fn(),
  unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(),
  teCapacitat: vi.fn(),
  carregaAccionsMissatges: vi.fn(),
  alternaReaccio: vi.fn(),
  alternaDestacat: vi.fn(),
  alternaFixat: vi.fn(),
  eliminaPerAMi: vi.fn(),
  eliminaPerATothom: vi.fn(),
  urlAdjuntXat: vi.fn()
}));

vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mockPort.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mockPort.identitat }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [], pageCopy: {} }) }));
vi.mock('../../app/contexts/RouterContext', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useLocation: () => ({ pathname: `/xat/${FIL_GENERAL}`, search: '' }) };
});
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (clau, reserva) => ca[clau] ?? reserva ?? clau }),
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: {} })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockPort
}));
vi.mock('../../data/xat/accionsMissatge.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    creaAccionsMissatge: (opcions) => {
      const base = actual.creaAccionsMissatge(opcions);
      return {
        ...base,
        eliminaPerATothom: (ref, extra = {}) => {
          const id = typeof ref === 'string' ? ref : (ref?.missatgeId ?? ref?.id);
          const filId = typeof ref === 'object' ? (ref?.filId ?? ref?.threadId) : null;
          return mockPort.eliminaPerATothom({ filId, missatgeId: id }, extra);
        }
      };
    }
  };
});
vi.mock('../../data/identitat.js', async (importOriginal) => ({
  ...(await importOriginal()),
  capturaSessio: () => {
    const entrada = mockPort.entrada;
    return () => {
      if (entrada !== mockPort.entrada) throw new DOMException('changed', 'AbortError');
    };
  }
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

let ctxValue = null;
function SondaXat() {
  const x = useXat();
  useLayoutEffect(() => { ctxValue = x; });
  return null;
}

const GRID_AMPLE = {
  mida: 'ample',
  panellObert: null,
  obriEsquerra: () => {},
  obriMig: () => {},
  tancaPanells: () => {}
};

describe('R32.65_gemini · IDEA-342 · Elimina per a tothom sense caducitat, multi-barret i sense làpides soltes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    _reiniciaEsborratsSessioLocalPerATests();
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    mockPort.entrada = 1;
    mockPort.session = { currentUser: { id: JAVI_ID }, generacio: 1, estat: 'dins' };
    /* Cas real de la captura del Mestre: mirant el xat amb barret actiu d'entitat Sóc de Poble */
    mockPort.identitat = {
      actorKey: `entitat::${SOC_DE_POBLE_ORG}`,
      actor: { tipus: 'entitat', id: SOC_DE_POBLE_ORG, nom: 'Sóc de Poble' },
      identitats: [
        { tipus: 'persona', id: JAVI_ID, nom: 'Javi Llinares', activa: false },
        { tipus: 'entitat', id: SOC_DE_POBLE_ORG, nom: 'Sóc de Poble', rol: 'propietari', activa: true }
      ]
    };
    mockPort.teCapacitat.mockImplementation((nom) => ['xatMultimedia', 'xatAccionsMissatge'].includes(nom));
    mockPort.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
    mockPort.carregaAccionsMissatges.mockResolvedValue({ missatges: [], teMes: false, seguentId: null });
    mockPort.urlAdjuntXat.mockResolvedValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
    mockPort.eliminaPerATothom.mockImplementation(async ({ filId, missatgeId }) => ({
      estat: 'confirmat',
      filId,
      missatgeId,
      esborratAl: '2026-11-23T23:00:00.000Z'
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test('1. Regles pures: sense límit d’hores ni dies (∞) i autoria humana multi-barret en els 4 supòsits', () => {
    const contextMultiBarret = {
      joId: JAVI_ID,
      orgIdsPermeses: [SOC_DE_POBLE_ORG],
      fil: { id: FIL_GENERAL, tipus: 'grup', rol: 'membre' }
    };

    // 1) Missatge molt antic (fa més de 3 anys) amb sender: 'me' -> permés sense caducitat
    expect(potEliminarMissatgePerATothom({
      id: MSG_ANTIC,
      sender: 'me',
      usuariId: JAVI_ID,
      text: 'Prova de 2023',
      creatAl: '2023-01-05T09:15:00.000Z'
    }, contextMultiBarret)).toBe(true);

    // 2) Cas captura del Mestre: el missatge arriba amb sender: 'other' però usuariId === joId (Javi Llinares mirant com a Sóc de Poble)
    expect(potEliminarMissatgePerATothom({
      id: MSG_PROVA2,
      sender: 'other',
      usuariId: JAVI_ID,
      author: 'Javi Llinares',
      text: 'Prova 2',
      creatAl: '2025-05-10T10:00:00.000Z'
    }, contextMultiBarret)).toBe(true);

    // 3) Missatge enviat com a entitat Sóc de Poble (comOrgId dins d'orgIdsPermeses) encara que l'haja enviat una altra sessió/membre
    expect(potEliminarMissatgePerATothom({
      id: 'msg-org',
      sender: 'other',
      usuariId: ALTRE_VEI_ID,
      comOrgId: SOC_DE_POBLE_ORG,
      comEntitat: true,
      text: 'Bàndol de Sóc de Poble',
      creatAl: '2024-02-01T08:00:00.000Z'
    }, contextMultiBarret)).toBe(true);

    // Un veí normal NO pot eliminar per a tothom el missatge d'un altre veí ni d'una altra entitat
    expect(potEliminarMissatgePerATothom({
      id: 'msg-vei',
      sender: 'other',
      usuariId: ALTRE_VEI_ID,
      text: 'Bon dia poble'
    }, contextMultiBarret)).toBe(false);
    expect(potEliminarMissatgePerATothom({
      id: 'msg-altra-org',
      sender: 'other',
      usuariId: ALTRE_VEI_ID,
      comOrgId: ALTRA_ORG_ID,
      text: 'Avís Cooperativa'
    }, contextMultiBarret)).toBe(false);

    // 4) Administrador o propietari del grup SÍ que pot moderar i eliminar per a tothom qualsevol missatge
    expect(potEliminarMissatgePerATothom({
      id: 'msg-vei',
      sender: 'other',
      usuariId: ALTRE_VEI_ID,
      text: 'Brossa de prova'
    }, { ...contextMultiBarret, fil: { id: FIL_GENERAL, tipus: 'grup', rol: 'admin' } })).toBe(true);
    expect(potEliminarMissatgePerATothom({
      id: 'msg-vei',
      sender: 'other',
      usuariId: ALTRE_VEI_ID,
      text: 'Brossa de prova'
    }, { ...contextMultiBarret, fil: { id: FIL_GENERAL, tipus: 'grup', rol: 'propietari' } })).toBe(true);
  });

  test('2. XatContext remot + multi-barret: «Elimina per a tothom» neteja la prèvia de General/comunitat i fa rollback honest si falla el servidor (Llei 0)', async () => {
    mockPort.loadFils.mockResolvedValue([
      { id: COM_LA_TORRE, tipus: 'comunitat', titol: 'Gent de La Torre', ultimSeq: 0, altres: [] },
      {
        id: FIL_GENERAL,
        tipus: 'grup',
        comunitatId: COM_LA_TORRE,
        titol: 'General',
        ultimSeq: 3,
        ultimText: 'Screenshot 2026-11-23 at 19.30.00.png',
        ultimTipus: 'imatge',
        ultimAutorId: JAVI_ID,
        ultimAl: '2026-11-23T19:30:00.000Z',
        altres: []
      }
    ]);
    mockPort.loadMissatges.mockResolvedValue([
      { id: MSG_ANTIC, filId: FIL_GENERAL, usuariId: ALTRE_VEI_ID, autorNom: 'Pep', text: 'Benvinguts al grup General!', tipus: 'text', seq: 1, creatAl: '2024-01-10T10:00:00.000Z' },
      { id: MSG_PROVA2, filId: FIL_GENERAL, usuariId: JAVI_ID, autorNom: 'Javi Llinares', text: 'Prova 2', tipus: 'text', seq: 2, creatAl: '2026-11-20T10:00:00.000Z' },
      {
        id: MSG_SCREENSHOT,
        filId: FIL_GENERAL,
        usuariId: JAVI_ID,
        autorNom: 'Javi Llinares',
        text: 'Screenshot 2026-11-23 at 19.30.00.png',
        tipus: 'imatge',
        metadades: { adjunt: { id: 'adj-screen-1', mime: 'image/png', midaBytes: 4096 } },
        seq: 3,
        creatAl: '2026-11-23T19:30:00.000Z'
      }
    ]);

    render(<XatProvider config={{ dataMode: 'remote', backendUrl: 'https://test.invalid' }}><SondaXat /></XatProvider>);
    await waitFor(() => expect(ctxValue.status).toBe('ready'));
    await waitFor(() => expect(typeof ctxValue.eliminaPerATothom).toBe('function'));
    expect(ctxValue.orgIdsPermeses).toContain(SOC_DE_POBLE_ORG);

    act(() => { ctxValue.obriFil(FIL_GENERAL); });
    await waitFor(() => expect(ctxValue.getThreadMessages(FIL_GENERAL)).toHaveLength(3));

    const filGeneral = () => ctxValue.chatThreads.find((f) => f.id === FIL_GENERAL);
    const fillComunitat = () => ctxValue.comunitats.find((c) => c.fil.id === COM_LA_TORRE)?.fills.find((f) => f.id === FIL_GENERAL);
    expect(filGeneral().ultimText).toContain('Screenshot');

    // Simulem primer un error de xarxa/permís al servidor: ha de fer rollback honest (Llei 0)
    const errServidor = Object.assign(new Error('Error de xarxa simulat'), { status: 503 });
    mockPort.eliminaPerATothom.mockRejectedValueOnce(errServidor);
    await act(async () => {
      await expect(ctxValue.eliminaPerATothom({ id: MSG_SCREENSHOT, filId: FIL_GENERAL })).rejects.toBe(errServidor);
    });
    expect(ctxValue.errorAccions).toBe(errServidor);
    expect(filGeneral().ultimText).toContain('Screenshot');
    expect(ctxValue.getThreadMessages(FIL_GENERAL).find((m) => m.id === MSG_SCREENSHOT).esborrat).toBe(false);

    // Ara el servidor confirma l'eliminació de la captura: la prèvia passa a «Prova 2»
    await act(async () => {
      await ctxValue.eliminaPerATothom({ id: MSG_SCREENSHOT, filId: FIL_GENERAL });
    });
    expect(mockPort.eliminaPerATothom).toHaveBeenLastCalledWith(
      { filId: FIL_GENERAL, missatgeId: MSG_SCREENSHOT },
      expect.any(Object)
    );
    expect(filGeneral()).toMatchObject({ ultimText: 'Prova 2', ultimAutorId: JAVI_ID, seqPrevia: 2 });
    expect(fillComunitat()).toMatchObject({ ultimText: 'Prova 2', seqPrevia: 2 });

    // Eliminem també «Prova 2» (de fa dies): la prèvia passa al primer missatge viu del grup
    await act(async () => {
      await ctxValue.eliminaPerATothom({ id: MSG_PROVA2, filId: FIL_GENERAL });
    });
    expect(filGeneral()).toMatchObject({ ultimText: 'Benvinguts al grup General!', ultimAutorId: ALTRE_VEI_ID, seqPrevia: 1 });
  });

  test('3. Conversa UI: zero bombolles fantasma soltes, preservació de CitaResposta i diàleg en les 5 llengües (ca, es, en, eu, gl)', async () => {
    const onEliminaPerATothom = vi.fn().mockResolvedValue({ estat: 'confirmat' });
    const missatges = [
      {
        id: MSG_PROVA2,
        threadId: FIL_GENERAL,
        seq: 1,
        sender: 'other', // Cas barret d'entitat activa mentre el missatge es va enviar com a Javi Llinares
        usuariId: JAVI_ID,
        author: 'Javi Llinares',
        tipus: 'text',
        text: 'Prova 2 amb text vell',
        creatAl: '2025-01-15T12:00:00.000Z'
      },
      {
        id: MSG_SCREENSHOT,
        threadId: FIL_GENERAL,
        seq: 2,
        sender: 'other',
        usuariId: JAVI_ID,
        author: 'Javi Llinares',
        tipus: 'imatge',
        text: 'Screenshot de prova',
        metadades: { adjunt: { id: 'adj-1', mime: 'image/png', midaBytes: 1024 } },
        creatAl: '2026-11-23T19:30:00.000Z'
      },
      {
        id: MSG_RESPOSTA_VEI,
        threadId: FIL_GENERAL,
        seq: 3,
        sender: 'other',
        usuariId: ALTRE_VEI_ID,
        author: 'Maria',
        tipus: 'text',
        text: 'Què era això?',
        respostaA: MSG_PROVA2,
        creatAl: '2026-11-23T19:31:00.000Z'
      }
    ];

    render(
      <MemoryRouter initialEntries={[`/xat/${FIL_GENERAL}`]}>
        <AppGridContext.Provider value={GRID_AMPLE}>
          <Conversa
            fil={{ id: FIL_GENERAL, tipus: 'grup', name: 'General', potEscriure: true }}
            messages={missatges}
            usuariAdjunts={JAVI_ID}
            orgIdsPermeses={[SOC_DE_POBLE_ORG]}
            onSendMessage={vi.fn()}
            onEliminaPerATothom={onEliminaPerATothom}
            onBack={vi.fn()}
            onEnviaAlBloc={vi.fn()}
            onCopia={vi.fn()}
            hiHaMes={false}
            carregantMes={false}
            onCarregaMes={vi.fn()}
            onReintenta={vi.fn()}
            onDescarta={vi.fn()}
            onMarcaVist={vi.fn()}
            locale="ca-ES"
            t={(k, f) => ca[k] ?? f ?? k}
          />
        </AppGridContext.Provider>
      </MemoryRouter>
    );

    // Eliminem la captura de prova: desapareix la bombolla del tot sense deixar làpida
    const nodeScreen = document.querySelector(`[data-missatge="${MSG_SCREENSHOT}"]`);
    expect(nodeScreen).not.toBeNull();
    fireEvent.click(within(nodeScreen).getByRole('button', { name: 'Opcions del missatge' }));
    fireEvent.click(within(nodeScreen).getByRole('menuitem', { name: 'Elimina' }));

    const dialeg1 = screen.getByRole('dialog', { name: 'Vols eliminar el missatge?' });
    fireEvent.click(within(dialeg1).getByRole('button', { name: 'Elimina per a tothom' }));

    expect(document.querySelector(`[data-missatge="${MSG_SCREENSHOT}"]`)).toBeNull();
    expect(document.body.textContent).not.toContain('Screenshot de prova');
    expect(document.body.textContent).not.toContain("S'ha esborrat este missatge");

    // Ara eliminem MSG_PROVA2, al qual Maria havia respost amb respostaA:
    // la bombolla de MSG_PROVA2 desapareix del tot, però la xicoteta caixa de cita dins de Maria diu «S'ha esborrat este missatge»
    const nodeProva2 = document.querySelector(`[data-missatge="${MSG_PROVA2}"]`);
    fireEvent.click(within(nodeProva2).getByRole('button', { name: 'Opcions del missatge' }));
    fireEvent.click(within(nodeProva2).getByRole('menuitem', { name: 'Elimina' }));
    const dialeg2 = screen.getByRole('dialog', { name: 'Vols eliminar el missatge?' });
    fireEvent.click(within(dialeg2).getByRole('button', { name: 'Elimina per a tothom' }));

    expect(document.querySelector(`[data-missatge="${MSG_PROVA2}"]`)).toBeNull();
    const nodeMaria = document.querySelector(`[data-missatge="${MSG_RESPOSTA_VEI}"]`);
    expect(nodeMaria).not.toBeNull();
    expect(nodeMaria.textContent).not.toContain('Prova 2 amb text vell');
    expect(within(nodeMaria).getByText("S'ha esborrat este missatge")).toBeTruthy();
    expect(document.querySelectorAll('li[data-missatge]')).toHaveLength(1);

    // Paritat completa de claus en les 5 llengües oficials (ca, es, en, eu, gl)
    for (const [codi, dict] of [['ca', ca], ['es', es], ['en', en], ['eu', eu], ['gl', gl]]) {
      for (const clau of [
        'section.xat.missatge.eliminaTitol',
        'section.xat.missatge.eliminaPerATothom',
        'section.xat.missatge.eliminaPerAMi',
        'section.xat.missatge.esborrat',
        'common.cancela'
      ]) {
        expect(typeof dict[clau]).toBe('string');
        expect(dict[clau].trim().length).toBeGreaterThan(0);
      }
      expect(textAccioMissatgeXat(codi, 'eliminaPerATothomError').trim().length).toBeGreaterThan(0);
    }
  });

  test('4. Mode local/seed: eliminaPerATothom funciona immediatament i persisteix a la sessió local', async () => {
    mockPort.loadFils.mockResolvedValue([
      { id: FIL_GENERAL, tipus: 'grup', titol: 'General', ultimSeq: 1, ultimText: 'Hji9', ultimTipus: 'text', ultimAutorId: JAVI_ID, altres: [] }
    ]);
    mockPort.loadMissatges.mockResolvedValue([
      { id: MSG_PROVA2, filId: FIL_GENERAL, usuariId: JAVI_ID, autorNom: 'Javi Llinares', text: 'Hji9', tipus: 'text', seq: 1, creatAl: '2026-11-23T19:00:00.000Z' }
    ]);

    const { unmount } = render(<XatProvider config={{ dataMode: 'local' }}><SondaXat /></XatProvider>);
    await waitFor(() => expect(ctxValue.status).toBe('ready'));
    expect(typeof ctxValue.eliminaPerATothom).toBe('function');

    act(() => { ctxValue.obriFil(FIL_GENERAL); });
    await waitFor(() => expect(ctxValue.getThreadMessages(FIL_GENERAL)).toHaveLength(1));

    await act(async () => {
      await ctxValue.eliminaPerATothom({ id: MSG_PROVA2, filId: FIL_GENERAL });
    });
    expect(ctxValue.chatThreads.find((f) => f.id === FIL_GENERAL)).toMatchObject({ ultimText: '', ultimTipus: null, seqPrevia: null });

    // Si es remunta el proveïdor dins de la mateixa sessió local, continua esborrat
    unmount();
    render(<XatProvider config={{ dataMode: 'local' }}><SondaXat /></XatProvider>);
    await waitFor(() => expect(ctxValue.status).toBe('ready'));
    act(() => { ctxValue.obriFil(FIL_GENERAL); });
    await waitFor(() => expect(ctxValue.getThreadMessages(FIL_GENERAL)[0]?.esborrat).toBe(true));
    expect(ctxValue.chatThreads.find((f) => f.id === FIL_GENERAL).ultimText).toBe('');
  });
});
