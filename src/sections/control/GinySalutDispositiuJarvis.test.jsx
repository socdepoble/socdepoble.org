import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { creaServeiSalutEmmagatzematgeDispositiu } from '../../data/salutEmmagatzematgeDispositiu.js';
import GinySalutDispositiuJarvis from './GinySalutDispositiuJarvis.jsx';
import {
  formataBytesHumans,
  IDIOMES_SALUT_DISPOSITIU,
  TEXTOS_SALUT_DISPOSITIU,
} from './textosSalutDispositiuJarvis.js';

vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_clau, reserva) => reserva, language: 'ca' }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const TX = TEXTOS_SALUT_DISPOSITIU.ca;
const estatDe = () => screen.getByTestId('giny-salut-dispositiu-jarvis').getAttribute('data-estat-ui');

function serveiMock({
  lectura = {
    usage: 24 * 1024 * 1024,
    quota: 1024 * 1024 * 1024,
    persistent: true,
    categories: [
      { id: 'claus-e2ee', tipus: 'sagrada', bytes: null, purgable: false },
      { id: 'notes-locals', tipus: 'sagrada', bytes: null, purgable: false },
      { id: 'esborranys-pendents', tipus: 'sagrada', bytes: null, purgable: false },
      { id: 'copies-sdpbackup', tipus: 'sagrada', bytes: null, purgable: false },
      { id: 'sdp-pwa-recursos-v0', tipus: 'regenerable', bytes: 6 * 1024 * 1024, purgable: true, entrades: 12 },
    ],
    avisos: [],
  },
  historial = { registres: [{ id: 'r1', bytesEliminats: 4 * 1024 * 1024 }], persistent: true },
  purga = {
    id: 'r2',
    bytesEliminats: 6 * 1024 * 1024,
    entradesEliminades: 12,
    estat: 'complet',
    avisos: [],
  },
} = {}) {
  return {
    lligSalutEmmagatzematgeDispositiu: vi.fn().mockResolvedValue(lectura),
    historialNetegesLocals: vi.fn().mockResolvedValue(historial),
    purgaMemoriaCauRegenerable: vi.fn().mockResolvedValue(purga),
  };
}

/* El servei real de Codex R32 (lot_04) amb un navegador i unes memòries cau de prova:
   cap productor connectat, igual que en producció. */
function entornServeiReal({ memoriesRetirades = [] } = {}) {
  const caches = new Map(memoriesRetirades.map(([nom, claus]) => [nom, {
    keys: vi.fn(async () => claus.map((url) => ({ url, method: 'GET', headers: new Headers() }))),
    match: vi.fn(async () => undefined),
    delete: vi.fn(async () => true),
  }]));
  const memories = {
    keys: vi.fn(async () => [...caches.keys()]),
    has: vi.fn(async (nom) => caches.has(nom)),
    open: vi.fn(async (nom) => caches.get(nom)),
    delete: vi.fn(async () => { throw new Error('Mai esborrem memòries senceres'); }),
  };
  const navegador = {
    storage: { estimate: vi.fn(async () => ({ usage: 900, quota: 2000 })), persisted: vi.fn(async () => false) },
    locks: { request: vi.fn((_nom, _opcions, fn) => Promise.resolve().then(fn)) },
  };
  const magatzemHistorial = {
    totes: vi.fn(async () => []),
    estatPersistencia: async () => ({ persistent: true }),
    obtinBloqueig: async () => 'escriptora',
    desa: vi.fn(),
    tanca: vi.fn(),
  };
  const servei = creaServeiSalutEmmagatzematgeDispositiu({
    navegador, memories, origen: 'https://socdepoble.org', magatzemHistorial,
  });
  return { servei, memories, caches, magatzemHistorial };
}

describe('IDEA-278 · textosSalutDispositiuJarvis (5 llengües i Llei 0)', () => {
  test('paritat exacta de claus en ca, es, en, eu i gl, sense sobirà/sobirana ni mètriques inventades', () => {
    const clausBase = Object.keys(TEXTOS_SALUT_DISPOSITIU.ca).sort();
    expect(clausBase.length).toBeGreaterThan(25);
    for (const idioma of IDIOMES_SALUT_DISPOSITIU) {
      expect(Object.keys(TEXTOS_SALUT_DISPOSITIU[idioma]).sort(), idioma).toEqual(clausBase);
      for (const [clau, valor] of Object.entries(TEXTOS_SALUT_DISPOSITIU[idioma])) {
        expect(typeof valor, `${idioma}.${clau}`).toBe('string');
        expect(valor.trim().length, `${idioma}.${clau}`).toBeGreaterThan(0);
        expect(valor, `${idioma}.${clau}`).not.toMatch(/sobir[aà]|soberan/i);
        expect(valor, `${idioma}.${clau}`).not.toMatch(/dies estalviats|días ahorrados|days saved/i);
      }
    }
    expect(TEXTOS_SALUT_DISPOSITIU.ca.notaHonestaNavegador).toContain('aplicació de poble');
    expect(TEXTOS_SALUT_DISPOSITIU.ca.notaHonestaNavegador).toContain('utilitza');
  });

  test('R32.2 · Llei 0: cap text promet que les dades personals mai s’esborren ni que no hi ha memòria acumulada', () => {
    /* El navegador pot desallotjar totes les dades d'un origen no persistent: el giny només
       pot garantir que la SEUA neteja no les toca. Sense «èxit zero»: un 0 mai és un èxit. */
    const SOBREPROMESES = /blindad|blindatuta|mai s’esborren|nunca se borran|never deleted|inoiz ez dira ezabatzen|memòria temporal acumulada|memoria temporal acumulada|accumulated temporary|pilatutako/i;
    for (const idioma of IDIOMES_SALUT_DISPOSITIU) {
      const tx = TEXTOS_SALUT_DISPOSITIU[idioma];
      expect(Object.hasOwn(tx, 'estatExitZero'), idioma).toBe(false);
      for (const [clau, valor] of Object.entries(tx)) {
        expect(valor, `${idioma}.${clau}`).not.toMatch(SOBREPROMESES);
      }
      expect(tx.compartimentTemporalNet, idioma).toMatch(/^0 B /);
      expect(tx.estatBuit, idioma).toMatch(/^0 B /);
    }
  });

  test('formataBytesHumans formata bytes reals sense inventar unitats', () => {
    expect(formataBytesHumans(0, 'ca')).toBe('0 B');
    expect(formataBytesHumans(512, 'ca')).toBe('512 B');
    expect(formataBytesHumans(5 * 1024 * 1024, 'en')).toBe('5 MB');
  });
});

describe('IDEA-278 · GinySalutDispositiuJarvis (6 estats UI ECC, revelació in-situ i integritat)', () => {
  test.each(IDIOMES_SALUT_DISPOSITIU)('renderitza en %s amb dades protegides diferenciades, revisió desplegable i botó centrat', async (idioma) => {
    const srv = serveiMock();
    render(<GinySalutDispositiuJarvis idioma={idioma} servei={srv} />);

    const tx = TEXTOS_SALUT_DISPOSITIU[idioma];
    const seccio = await screen.findByTestId('giny-salut-dispositiu-jarvis');
    /* 6 MB confirmats pel productor i encara sense netejar: «ready», no «empty». */
    await waitFor(() => expect(seccio.getAttribute('data-estat-ui')).toBe('ready'));

    expect(screen.getByRole('heading', { level: 3, name: tx.titolSeccio })).toBeTruthy();
    expect(screen.getByText(tx.compartimentSagratTitol)).toBeTruthy();

    const botoRevisar = screen.getByRole('button', { name: tx.botoRevisar });
    expect(botoRevisar.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(botoRevisar);
    expect(screen.getByRole('button', { name: tx.botoTancarRevisio }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(tx.categoriaClausE2ee)).toBeTruthy();

    const botoPrincipal = screen.getByRole('button', { name: tx.botoAlliberar });
    expect(botoPrincipal.closest('.sdp-salut-dispositiu__accio-principal')).toBeTruthy();
    expect(botoPrincipal.disabled).toBe(false);
  });

  test('estat loading -> success: executa purga segura i mostra els bytes eliminats sense tocar dades sagrades', async () => {
    let resolLectura;
    const srv = {
      lligSalutEmmagatzematgeDispositiu: vi.fn()
        .mockImplementationOnce(() => new Promise((r) => { resolLectura = r; }))
        .mockResolvedValue({
          usage: 18 * 1024 * 1024,
          quota: 1024 * 1024 * 1024,
          persistent: true,
          categories: [{ id: 'claus-e2ee', tipus: 'sagrada', bytes: null, purgable: false }],
          avisos: [],
        }),
      historialNetegesLocals: vi.fn().mockResolvedValue({ registres: [], persistent: true }),
      purgaMemoriaCauRegenerable: vi.fn().mockResolvedValue({
        id: 'r-ok',
        bytesEliminats: 6 * 1024 * 1024,
        entradesEliminades: 12,
        estat: 'complet',
        avisos: [],
      }),
    };

    render(<GinySalutDispositiuJarvis idioma="ca" servei={srv} />);
    const seccio = screen.getByTestId('giny-salut-dispositiu-jarvis');
    expect(seccio.getAttribute('data-estat-ui')).toBe('loading');

    await waitFor(() => expect(typeof resolLectura).toBe('function'));
    resolLectura({
      usage: 24 * 1024 * 1024,
      quota: 1024 * 1024 * 1024,
      persistent: true,
      categories: [
        { id: 'claus-e2ee', tipus: 'sagrada', bytes: null, purgable: false },
        { id: 'sdp-pwa-recursos-v0', tipus: 'regenerable', bytes: 6 * 1024 * 1024, purgable: true, entrades: 12 },
      ],
      avisos: [],
    });

    await waitFor(() => expect(seccio.getAttribute('data-estat-ui')).toBe('ready'));
    const barra = seccio.querySelector('progress.sdp-salut-dispositiu__progres');
    expect(barra).toBeTruthy();
    expect(barra.hasAttribute('tabindex')).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: TX.botoAlliberar }));
    await waitFor(() => expect(seccio.getAttribute('data-estat-ui')).toBe('success'));
    expect(srv.purgaMemoriaCauRegenerable).toHaveBeenCalledTimes(1);
    expect(within(seccio).getAllByText(/6 MB/).length).toBeGreaterThan(0);
  });

  test('estats permission, partial, guia d’espai al límit (>=85%) i error amb reintent real', async () => {
    const srvPermis = serveiMock({
      lectura: {
        usage: null,
        quota: null,
        persistent: null,
        categories: [],
        avisos: ['ESTIMACIO_NO_DISPONIBLE', 'CACHE_NO_DISPONIBLE'],
      },
    });
    const { unmount } = render(<GinySalutDispositiuJarvis idioma="ca" servei={srvPermis} />);
    await waitFor(() => expect(estatDe()).toBe('permission'));
    expect(screen.getByRole('button', { name: TX.botoAlliberar }).disabled).toBe(true);
    unmount();

    const srvParcialICritic = serveiMock({
      lectura: {
        usage: 920 * 1024 * 1024,
        quota: 1000 * 1024 * 1024,
        persistent: false,
        categories: [{ id: 'sdp-pwa-recursos-v0', tipus: 'regenerable', bytes: 1024, purgable: false }],
        avisos: ['CACHE_AMB_DADES_NO_VERIFICADES'],
      },
    });
    const vista2 = render(<GinySalutDispositiuJarvis idioma="ca" servei={srvParcialICritic} />);
    await waitFor(() => expect(estatDe()).toBe('partial'));
    expect(screen.getByText(TX.estatCritic)).toBeTruthy();
    expect(screen.getByText(TX.guiaPas1)).toBeTruthy();
    expect(screen.getByText(TX.persistenciaTemporal)).toBeTruthy();
    vista2.unmount();

    const srvError = {
      lligSalutEmmagatzematgeDispositiu: vi.fn()
        .mockRejectedValueOnce(new Error('fallada idb'))
        .mockResolvedValue({
          usage: 10 * 1024 * 1024,
          quota: 100 * 1024 * 1024,
          persistent: true,
          categories: [],
          avisos: [],
        }),
      historialNetegesLocals: vi.fn().mockResolvedValue({ registres: [], persistent: false }),
      purgaMemoriaCauRegenerable: vi.fn(),
    };
    render(<GinySalutDispositiuJarvis idioma="ca" servei={srvError} />);
    await waitFor(() => expect(estatDe()).toBe('error'));
    expect(screen.getByRole('alert').textContent).toContain(TX.estatError);

    fireEvent.click(screen.getByRole('button', { name: TX.botoReintentar }));
    await waitFor(() => expect(estatDe()).toBe('empty'));
  });

  test('Llei 0 · quan purgaMemoriaCauRegenerable torna estat="bloquejat" (CAP_PRODUCTOR_REGENERABLE_CONFIRMAT), estatUi és "partial" i mai anuncia fals "success"', async () => {
    const srvBloquejat = serveiMock({
      purga: {
        id: 'r-bloq',
        bytesEliminats: 0,
        bytesAlliberats: null,
        entradesEliminades: 0,
        estat: 'bloquejat',
        avisos: ['CAP_PRODUCTOR_REGENERABLE_CONFIRMAT'],
      },
    });
    render(<GinySalutDispositiuJarvis idioma="ca" servei={srvBloquejat} />);
    const seccio = await screen.findByTestId('giny-salut-dispositiu-jarvis');
    await waitFor(() => expect(seccio.getAttribute('data-estat-ui')).toBe('ready'));

    fireEvent.click(screen.getByRole('button', { name: TX.botoAlliberar }));
    await waitFor(() => expect(seccio.getAttribute('data-estat-ui')).toBe('partial'));
    expect(within(seccio).getAllByText(TX.estatBloquejat).length).toBeGreaterThan(0);
  });

  /* R32.3 · Peix: IndexedDB o storage.estimate() que mai resolen no deixen el giny en «carregant» per sempre. */
  test('una lectura que mai resol passa a error honest després del topall', async () => {
    const srv = serveiMock();
    srv.lligSalutEmmagatzematgeDispositiu.mockImplementation(() => new Promise(() => {}));
    render(<GinySalutDispositiuJarvis idioma="ca" servei={srv} topallMs={30} />);
    expect(estatDe()).toBe('loading');
    await waitFor(() => expect(estatDe()).toBe('error'));
    expect(screen.getByTestId('giny-salut-dispositiu-jarvis').textContent).toContain(TX.estatError);
    expect(srv.lligSalutEmmagatzematgeDispositiu.mock.calls[0][0].signal.aborted).toBe(true);
  });

  test('un historial que mai resol no bloqueja el giny', async () => {
    const srv = serveiMock();
    srv.historialNetegesLocals.mockImplementation(() => new Promise(() => {}));
    render(<GinySalutDispositiuJarvis idioma="ca" servei={srv} topallMs={30} />);
    await waitFor(() => expect(estatDe()).toBe('ready'));
    expect(screen.getByText(TX.historialNoDisponible)).toBeTruthy();
    expect(screen.queryByText(TX.historialCap)).toBeNull();
    expect(srv.historialNetegesLocals.mock.calls[0][0].signal.aborted).toBe(true);
  });
});

describe('R32.2 · ARBITRATGE-EGM-01 · el giny i el servei de Codex: cap èxit perquè la Promise resolga', () => {
  test('amb el servei real sense productor: «partial» honest des de la càrrega, 0 B confirmats, botó d’alliberar deshabilitat i cap mutació', async () => {
    const { servei, memories, magatzemHistorial } = entornServeiReal();
    const purga = vi.spyOn(servei, 'purgaMemoriaCauRegenerable');
    render(<GinySalutDispositiuJarvis idioma="ca" servei={servei} />);

    await waitFor(() => expect(estatDe()).toBe('partial'));
    const seccio = screen.getByTestId('giny-salut-dispositiu-jarvis');
    expect(within(seccio).getAllByText(TX.estatBloquejat).length).toBeGreaterThan(0);
    expect(within(seccio).getByText(TX.compartimentTemporalNet)).toBeTruthy();
    expect(within(seccio).queryByText(TX.estatBuit)).toBeNull();
    expect(within(seccio).getByText(TX.historialCap)).toBeTruthy();

    const boto = screen.getByRole('button', { name: TX.botoAlliberar });
    expect(boto.disabled).toBe(true);
    fireEvent.click(boto);
    expect(purga).not.toHaveBeenCalled();
    expect(memories.open).not.toHaveBeenCalled();
    expect(memories.delete).not.toHaveBeenCalled();
    expect(magatzemHistorial.desa).not.toHaveBeenCalled();
  });

  test('amb el servei real i una memòria retirada amb una entrada no verificada: «partial» prudent i cap supressió', async () => {
    const { servei, caches, memories } = entornServeiReal({
      memoriesRetirades: [['sdp-pwa-recursos-v0', ['https://socdepoble.org/esborrany-pendent']]],
    });
    render(<GinySalutDispositiuJarvis idioma="ca" servei={servei} />);

    await waitFor(() => expect(estatDe()).toBe('partial'));
    const seccio = screen.getByTestId('giny-salut-dispositiu-jarvis');
    /* R32.3 · Sense productor, el missatge principal és el bloqueig (Codex R32.2): «Neteja prudent: només
       s'eliminen fitxers públics verificats» suggeriria una neteja que el servei no pot fer. La detecció
       de dades sense verificar la diu el compartiment. */
    expect(within(seccio).getAllByText(TX.estatBloquejat).length).toBeGreaterThan(0);
    expect(within(seccio).queryByText(TX.estatParcial)).toBeNull();
    expect(within(seccio).getByText(TX.compartimentTemporalParcial)).toBeTruthy();
    expect(screen.getByRole('button', { name: TX.botoAlliberar }).disabled).toBe(true);
    expect(caches.get('sdp-pwa-recursos-v0').delete).not.toHaveBeenCalled();
    expect(memories.delete).not.toHaveBeenCalled();
  });

  test.each([
    ['complet sense supressions i amb un recurs canviat', { estat: 'complet', bytesEliminats: 0, entradesEliminades: 0, avisos: ['RECURS_CANVIAT'] }, 'partial'],
    ['parcial amb error després d’una supressió', { estat: 'parcial', bytesEliminats: 3, entradesEliminades: 1, avisos: [], error: { codi: 'PURGA_FALLIDA' } }, 'partial'],
    ['complet sense cap supressió', { estat: 'complet', bytesEliminats: 0, entradesEliminades: 0, avisos: [] }, 'empty'],
  ])('rebut %s: mai «success» ni el missatge d’èxit', async (_cas, purga, esperat) => {
    const srv = serveiMock({ purga });
    srv.lligSalutEmmagatzematgeDispositiu
      .mockResolvedValueOnce({
        usage: 1024, quota: 4096, persistent: true,
        categories: [{ id: 'sdp-pwa-recursos-v0', tipus: 'regenerable', bytes: 3, purgable: true, entrades: 1 }],
        avisos: [],
      })
      .mockResolvedValue({ usage: 1024, quota: 4096, persistent: true, categories: [], avisos: [] });
    render(<GinySalutDispositiuJarvis idioma="ca" servei={srv} />);
    await waitFor(() => expect(estatDe()).toBe('ready'));

    fireEvent.click(screen.getByRole('button', { name: TX.botoAlliberar }));
    await waitFor(() => expect(srv.purgaMemoriaCauRegenerable).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(estatDe()).toBe(esperat));
    const seccio = screen.getByTestId('giny-salut-dispositiu-jarvis');
    expect(seccio.querySelector('[data-to="exit"]')).toBeNull();
    expect(seccio.textContent).not.toContain(TX.estatExit.split(':')[0]);
  });

  test('un historial que no es pot llegir no es presenta com «cap neteja registrada»', async () => {
    const srv = serveiMock();
    srv.historialNetegesLocals.mockRejectedValue(new Error('IDB no respon'));
    render(<GinySalutDispositiuJarvis idioma="ca" servei={srv} />);
    await waitFor(() => expect(estatDe()).toBe('ready'));
    const seccio = screen.getByTestId('giny-salut-dispositiu-jarvis');
    expect(within(seccio).queryByText(TX.historialCap)).toBeNull();
    expect(seccio.textContent).not.toMatch(/Cossos de memòria temporal suprimits/);
  });

  test('dos clics seguits llancen una sola purga', async () => {
    let resolPurga;
    const srv = serveiMock();
    srv.purgaMemoriaCauRegenerable.mockImplementation(() => new Promise((r) => { resolPurga = r; }));
    render(<GinySalutDispositiuJarvis idioma="ca" servei={srv} />);
    await waitFor(() => expect(estatDe()).toBe('ready'));

    const boto = screen.getByRole('button', { name: TX.botoAlliberar });
    /* R32.3 · Peix R32.2 (P3): els dos clics dins d'un sol act(), abans del pintat que deshabilita el botó.
       Amb un fireEvent per clic el segon ja trobava el botó deshabilitat i la prova no podia fallar. */
    await act(async () => { boto.click(); boto.click(); });
    await waitFor(() => expect(typeof resolPurga).toBe('function'));
    expect(srv.purgaMemoriaCauRegenerable).toHaveBeenCalledTimes(1);
    expect(boto.getAttribute('aria-busy')).toBe('true');
    resolPurga({ estat: 'complet', bytesEliminats: 6 * 1024 * 1024, entradesEliminades: 12, avisos: [] });
    await waitFor(() => expect(estatDe()).toBe('success'));
  });

  test('una segona purga que falla no recupera l’èxit de l’anterior: ni en vol ni després de «Tornar a provar»', async () => {
    /* Peix R32.2 (P2): el rebut 'complet' de la purga anterior no pot tornar a anunciar-se
       quan la purga següent està en vol o ha fallat (cache.keys, memories.open o locks.request
       rebutgen abans de suprimir res). */
    let rebutjaSegona;
    const srv = serveiMock({
      lectura: {
        usage: 1024, quota: 4096, persistent: true,
        categories: [{ id: 'sdp-pwa-recursos-v0', tipus: 'regenerable', bytes: 3, purgable: true, entrades: 1 }],
        avisos: [],
      },
    });
    srv.purgaMemoriaCauRegenerable
      .mockResolvedValueOnce({ estat: 'complet', bytesEliminats: 3, entradesEliminades: 1, avisos: [] })
      .mockImplementationOnce(() => new Promise((_resol, rebutja) => { rebutjaSegona = rebutja; }));
    render(<GinySalutDispositiuJarvis idioma="ca" servei={srv} />);
    const seccio = screen.getByTestId('giny-salut-dispositiu-jarvis');
    const anunciExit = TX.estatExit.split(':')[0];
    const senseExit = () => {
      expect(estatDe()).not.toBe('success');
      expect(seccio.querySelector('[data-to="exit"]')).toBeNull();
      expect(seccio.textContent).not.toContain(anunciExit);
    };
    await waitFor(() => expect(estatDe()).toBe('ready'));

    fireEvent.click(screen.getByRole('button', { name: TX.botoAlliberar }));
    await waitFor(() => expect(estatDe()).toBe('success'));
    const boto = screen.getByRole('button', { name: TX.botoAlliberar });
    expect(boto.disabled).toBe(false);

    fireEvent.click(boto);
    await waitFor(() => expect(typeof rebutjaSegona).toBe('function'));
    expect(boto.getAttribute('aria-busy')).toBe('true');
    senseExit();

    rebutjaSegona(new DOMException('cache.keys ha fallat', 'InvalidStateError'));
    await waitFor(() => expect(estatDe()).toBe('error'));
    senseExit();

    fireEvent.click(screen.getByRole('button', { name: TX.botoReintentar }));
    await waitFor(() => expect(estatDe()).toBe('ready'));
    senseExit();
    expect(srv.purgaMemoriaCauRegenerable).toHaveBeenCalledTimes(2);
  });

  test('R32.3 · sense Cache API (CACHE_NO_DISPONIBLE) és un límit de permís, mai «0 B, res per netejar»', async () => {
    /* El servei real torna només CACHE_NO_DISPONIBLE quan no hi ha caches ni origen, encara que l'estimació
       funcione: no ha pogut comprovar res, així que no pot dir que no hi ha res per netejar. */
    render(<GinySalutDispositiuJarvis idioma="ca" servei={serveiMock({
      lectura: { usage: 1024, quota: 4096, persistent: true, categories: [], avisos: ['CACHE_NO_DISPONIBLE'] },
    })} />);
    await waitFor(() => expect(estatDe()).toBe('permission'));
    const seccio = screen.getByTestId('giny-salut-dispositiu-jarvis');
    expect(within(seccio).getAllByText(TX.estatPermis).length).toBeGreaterThan(0);
    expect(within(seccio).queryByText(TX.estatBuit)).toBeNull();
    expect(screen.getByRole('button', { name: TX.botoAlliberar }).disabled).toBe(true);
  });

  test('R32.3 · mentre l’historial encara no s’ha llegit no s’afirma «cap neteja registrada»', async () => {
    let resolLectura;
    const srv = serveiMock();
    srv.lligSalutEmmagatzematgeDispositiu.mockImplementationOnce(() => new Promise((r) => { resolLectura = r; }));
    render(<GinySalutDispositiuJarvis idioma="ca" servei={srv} />);
    await waitFor(() => expect(typeof resolLectura).toBe('function'));
    expect(estatDe()).toBe('loading');
    const seccio = screen.getByTestId('giny-salut-dispositiu-jarvis');
    expect(within(seccio).queryByText(TX.historialCap)).toBeNull();
    expect(within(seccio).queryByText(TX.historialNoDisponible)).toBeNull();
    resolLectura({ usage: 1024, quota: 4096, persistent: true, categories: [], avisos: [] });
    await waitFor(() => expect(estatDe()).toBe('empty'));
  });
});
