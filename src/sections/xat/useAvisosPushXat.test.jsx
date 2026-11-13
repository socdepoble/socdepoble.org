/* B8C-6 (marató 261101_2143; B8-CLIENT §5.1) · useSincronitzaAvisosPush i
   useControlAvisosPush sobre el registre DE DEBÒ (src/config/avisosPushXat.js)
   amb un adaptador fals que anota l'ordre. Les funcions públiques del registre
   s'emboliquen amb vi.fn (criden la real) per a vore qui les crida i quan.
     (1) sessió 'comprovant' → cap crida;
     (2) 'fora' → només desvincula el servidor (ni desactiva ni sincronitza);
     (3) 'dins' → 'fora' (renovació fallida) → 'dins' amb la mateixa persona:
         la subscripció continua i el servidor es torna a fixar;
     (4) A → B: la baixa local abans de fixar el servidor de B;
     (5) en llavor, o sense la capacitat: servidor null i una sincronització
         (l'interruptor desfà);
     (6) tornar a la vista amb 'dins' → sincronitza i neteja; amb 'fora', res;
     (7) onCanvi(true) crida activaAvisosPush en el mateix tic;
     (8) eixida en curs i després eixida fallida: el servidor es torna a fixar
         sense canviar de persona.
   I les condicions d'oferir i les notes. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MOTIU_PUSH } from '../../pwa/avisosPush.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

const mock = vi.hoisted(() => ({
  sessio: null,
  mode: 'remote',
  capacitat: true,
  llengua: 'ca',
  config: { backendId: 'supabase', tenantId: 't-1' },
  desaDispositiuAvisos: null,
  retiraDispositiuAvisos: null
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => mock.sessio }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIStateOpcional: () => ({ language: mock.llengua, externalConfig: mock.config }) }));
vi.mock('./XatContext', () => ({ useXat: () => ({ modeDades: mock.mode }) }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => cap === 'avisosPush' && mock.capacitat,
  desaDispositiuAvisos: (...args) => mock.desaDispositiuAvisos(...args),
  retiraDispositiuAvisos: (...args) => mock.retiraDispositiuAvisos(...args)
}));
vi.mock('../../config/avisosPushXat.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    fixaServidorAvisosPush: vi.fn(real.fixaServidorAvisosPush),
    desactivaAvisosPush: vi.fn(real.desactivaAvisosPush),
    sincronitzaAvisosPush: vi.fn(real.sincronitzaAvisosPush),
    activaAvisosPush: vi.fn(real.activaAvisosPush),
    netejaAvisosPushMostrats: vi.fn(real.netejaAvisosPushMostrats)
  };
});

/* Onada R9 (C3) · El motor del registre, que s'endolla a la façana en avaluar-se (com a l'entrada). */
import '../../config/motorAvisosPushXat.js';
import * as registre from '../../config/avisosPushXat.js';
import {
  MOTIU_IOS_SENSE_INSTALAR, TEXTOS_AVISOS, TEXTOS_AVISOS_ENTORN, notesDelsAvisos, textAvisEntorn, useControlAvisosPush, useSincronitzaAvisosPush
} from './useAvisosPushXat.js';

/* El t de la pàgina en cada llengua (el de UIContext): el diccionari i, si no hi és, la reserva. */
const DICCIONARIS = Object.freeze({ ca: CA, es: ES, en: EN, eu: EU, gl: GL });
const traductorDe = (llengua) => (clau, reserva) => DICCIONARIS[llengua][clau] || reserva;

const ADRECA = 'https://fcm.googleapis.com/fcm/send/abc';
const ordre = [];
const adaptador = {
  tipus: 'web',
  motiu: vi.fn(() => null),
  estat: vi.fn(async () => ({ estat: 'inactiu' })),
  activa: vi.fn(({ desa }) => {
    ordre.push('activa');
    return Promise.resolve(desa({ plataforma: 'web', adreca: ADRECA, caducaMs: null })).then(() => ({ estat: 'actiu' }), () => ({ estat: 'error' }));
  }),
  desactiva: vi.fn(async ({ retira }) => {
    ordre.push(retira ? 'desactiva+retira' : 'desactiva-local');
    if (retira) await retira({ plataforma: 'web', adreca: ADRECA });
    return { estat: 'inactiu' };
  }),
  sincronitza: vi.fn(async ({ actiu, desa }) => {
    ordre.push(`sincronitza:${actiu}`);
    if (actiu && desa) {
      await desa({ plataforma: 'web', adreca: ADRECA, caducaMs: 1893456000000 });
      return { estat: 'actiu' };
    }
    return { estat: 'inactiu' };
  }),
  neteja: vi.fn(async () => {}),
  oblida: vi.fn(),
  escoltaToc: vi.fn(() => () => {})
};
registre.registraAvisosPush(adaptador);

function Sincro() {
  useSincronitzaAvisosPush();
  return null;
}
let control = null;
/* El traductor de la pàgina: la reserva, si una prova no en demana un altre. */
let traductor = null;
function Control() {
  control = useControlAvisosPush(traductor || ((_clau, reserva) => reserva));
  return (
    <>
      <button type="button" onClick={() => control.onCanvi(true)}>encén</button>
      <button type="button" onClick={() => control.onCanvi(false)}>apaga</button>
    </>
  );
}
const dins = (id) => ({ estat: 'dins', currentUser: { id } });
const buida = () => act(async () => { await Promise.resolve(); await new Promise((r) => { setTimeout(r, 0); }); });
const fixats = () => registre.fixaServidorAvisosPush.mock.calls.map(([s]) => (s === null ? null : s.ambit));
const ordreDe = (fn) => fn.mock.invocationCallOrder;

test('R54: la retirada d’A captura A encara que la sessió ja siga B', async () => {
  mock.sessio = dins('A');
  const vista = render(<Sincro />);
  await buida();
  const servidorA = registre.fixaServidorAvisosPush.mock.calls.find(([s]) => s?.ambit === 'A')[0];
  mock.sessio = dins('B');
  vista.rerender(<Sincro />);
  await buida();
  await servidorA.retira({ plataforma: 'web', adreca: ADRECA });
  expect(mock.retiraDispositiuAvisos).toHaveBeenLastCalledWith({ plataforma: 'web', adreca: ADRECA, usuariEsperat: 'A' }, mock.config);
});

beforeEach(() => {
  registre.fixaServidorAvisosPush(null);
  mock.sessio = null;
  mock.mode = 'remote';
  mock.capacitat = true;
  mock.llengua = 'ca';
  mock.desaDispositiuAvisos = vi.fn(async () => {});
  mock.retiraDispositiuAvisos = vi.fn(async () => {});
  adaptador.motiu.mockImplementation(() => null);
  vi.clearAllMocks();
  ordre.length = 0;
  control = null;
  traductor = null;
});
afterEach(() => {
  cleanup();
  delete document.visibilityState;
});

describe('useSincronitzaAvisosPush', () => {
  test('(1) amb la sessió en comprovant, cap crida al registre ni a l\'adaptador', async () => {
    mock.sessio = { estat: 'comprovant', currentUser: null };
    render(<Sincro />);
    await buida();
    expect(registre.fixaServidorAvisosPush).not.toHaveBeenCalled();
    expect(registre.sincronitzaAvisosPush).not.toHaveBeenCalled();
    expect(registre.desactivaAvisosPush).not.toHaveBeenCalled();
    expect(ordre).toEqual([]);
  });

  test('(2) amb la sessió fora (o sense proveïdor), només desvincula el servidor: ni desactiva ni sincronitza (ARB-05)', async () => {
    mock.sessio = { estat: 'fora', currentUser: null };
    const vista = render(<Sincro />);
    await buida();
    expect(fixats()).toEqual([null]);
    mock.sessio = null;
    vista.rerender(<Sincro />);
    await buida();
    expect(registre.sincronitzaAvisosPush).not.toHaveBeenCalled();
    expect(registre.desactivaAvisosPush).not.toHaveBeenCalled();
    expect(ordre).toEqual([]);
  });

  test('(3) dins → fora (renovació fallida) → dins amb la mateixa persona: cap baixa i el servidor es torna a fixar', async () => {
    mock.sessio = dins('A');
    const vista = render(<Sincro />);
    await buida();
    expect(fixats()).toEqual(['A']);
    expect(registre.instantaniaAvisosPush().ambServidor).toBe(true);
    expect(ordre).toEqual(['sincronitza:true']);

    mock.sessio = { estat: 'fora', currentUser: null };
    vista.rerender(<Sincro />);
    await buida();
    expect(fixats()).toEqual(['A', null]);
    expect(registre.instantaniaAvisosPush().ambServidor).toBe(false);

    mock.sessio = dins('A');
    vista.rerender(<Sincro />);
    await buida();
    expect(fixats()).toEqual(['A', null, 'A']);
    expect(registre.instantaniaAvisosPush().ambServidor).toBe(true);
    /* La subscripció no s'ha desfet mai: només s'ha renovat. */
    expect(ordre).toEqual(['sincronitza:true', 'sincronitza:true']);
    expect(adaptador.desactiva).not.toHaveBeenCalled();
    expect(registre.desactivaAvisosPush).not.toHaveBeenCalled();
  });

  test('(4) A → B: primer desvincula el servidor d\'A, després la baixa local (sense retirada) i, al final, el servidor de B', async () => {
    mock.sessio = dins('A');
    const vista = render(<Sincro />);
    await buida();
    mock.sessio = dins('B');
    vista.rerender(<Sincro />);
    await buida();
    /* Una sola baixa, encara que desvincular torne a executar l'efecte. */
    expect(registre.desactivaAvisosPush).toHaveBeenCalledTimes(1);
    expect(registre.desactivaAvisosPush).toHaveBeenCalledWith({ local: true });
    expect(adaptador.desactiva).toHaveBeenCalledWith({ retira: null });
    expect(fixats()).toEqual(['A', null, 'B']);
    const [, ordreNull, ordreFixaB] = ordreDe(registre.fixaServidorAvisosPush);
    expect(ordreNull).toBeLessThan(ordreDe(registre.desactivaAvisosPush)[0]);
    expect(ordreDe(registre.desactivaAvisosPush)[0]).toBeLessThan(ordreFixaB);
    expect(ordre).toEqual(['sincronitza:true', 'desactiva-local', 'sincronitza:true']);
    /* B no hereta cap retirada al servidor d'A. */
    expect(mock.retiraDispositiuAvisos).not.toHaveBeenCalled();
  });

  test('(4c) A → B amb una baixa local penjada: B mai veu l\'interruptor ni sincronitza amb l\'àmbit d\'A, i el seu servidor es fixa passat LIMIT_BAIXA_PUSH_MS (CORRECTOR ARB-P05-03)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const micro = () => act(async () => { await vi.advanceTimersByTimeAsync(0); });
    /* La baixa penjada es deslliura sempre en acabar (també si una asserció cau):
       el pany del registre és de mòdul i no pot passar a les proves següents. */
    let deslliura = null;
    try {
      mock.sessio = dins('A');
      const vista = render(<><Sincro /><Control /></>);
      await micro();
      expect(control.oferit).toBe(true);
      adaptador.desactiva.mockImplementationOnce(() => new Promise((r) => { deslliura = r; }));
      mock.sessio = dins('B');
      vista.rerender(<><Sincro /><Control /></>);
      await micro();
      /* Durant la baixa: cap servidor, cap interruptor, i la vista no parla amb el servidor d'A. */
      expect(registre.instantaniaAvisosPush().ambServidor).toBe(false);
      expect(control.oferit).toBe(false);
      adaptador.sincronitza.mockClear();
      await act(async () => { await registre.sincronitzaAvisosPush(); });
      expect(adaptador.sincronitza.mock.calls.map(([o]) => o.ambit)).toEqual([undefined]);
      expect(fixats()).toEqual(['A', null]);

      await act(async () => { await vi.advanceTimersByTimeAsync(registre.LIMIT_BAIXA_PUSH_MS - 10); });
      expect(fixats()).toEqual(['A', null]);
      await act(async () => { await vi.advanceTimersByTimeAsync(20); });
      expect(fixats()).toEqual(['A', null, 'B']);
      expect(adaptador.sincronitza.mock.calls.at(-1)[0].ambit).toBe('B');
      /* Mentre l'unsubscribe no torna, el pany entre gestos continua tancat. */
      expect(control).toMatchObject({ oferit: true, ocupat: true });
      expect(registre.desactivaAvisosPush).toHaveBeenCalledTimes(1);

      await act(async () => { deslliura({ estat: 'inactiu' }); await vi.advanceTimersByTimeAsync(0); });
      expect(control.ocupat).toBe(false);
      expect(fixats()).toEqual(['A', null, 'B']);
    } finally {
      vi.useRealTimers();
      if (deslliura) {
        deslliura({ estat: 'inactiu' });
        await buida();
      }
    }
  });

  test('(4b) A → fora → B també fa la baixa local: l\'última persona no nul·la d\'esta càrrega és A', async () => {
    mock.sessio = dins('A');
    const vista = render(<Sincro />);
    await buida();
    mock.sessio = { estat: 'fora', currentUser: null };
    vista.rerender(<Sincro />);
    await buida();
    mock.sessio = dins('B');
    vista.rerender(<Sincro />);
    await buida();
    expect(registre.desactivaAvisosPush).toHaveBeenCalledWith({ local: true });
    expect(fixats()).toEqual(['A', null, 'B']);
  });

  test.each([
    ['en llavor', () => { mock.mode = 'seed'; }],
    ['en local', () => { mock.mode = 'local'; }],
    ['en remot sense la capacitat', () => { mock.capacitat = false; }]
  ])('(5) %s: el servidor és null i hi ha una sincronització que fa d\'interruptor', async (_nom, prepara) => {
    prepara();
    mock.sessio = dins('A');
    const vista = render(<Sincro />);
    await buida();
    expect(fixats()).toEqual([null]);
    expect(registre.sincronitzaAvisosPush).toHaveBeenCalledTimes(1);
    expect(adaptador.sincronitza).toHaveBeenCalledWith(expect.objectContaining({ actiu: false }));
    expect(mock.desaDispositiuAvisos).not.toHaveBeenCalled();
    /* Un repintat no torna a sincronitzar. */
    vista.rerender(<Sincro />);
    await buida();
    expect(registre.sincronitzaAvisosPush).toHaveBeenCalledTimes(1);
  });

  test('(6) tornar a la vista sincronitza, però no neteja amb un zero antic; amb la sessió fora, res', async () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    mock.sessio = dins('A');
    const vista = render(<Sincro />);
    await buida();
    vi.clearAllMocks();
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    await buida();
    expect(registre.sincronitzaAvisosPush).toHaveBeenCalledTimes(1);
    expect(registre.netejaAvisosPushMostrats).not.toHaveBeenCalled();
    expect(adaptador.neteja).not.toHaveBeenCalled();

    mock.sessio = { estat: 'fora', currentUser: null };
    vista.rerender(<Sincro />);
    await buida();
    vi.clearAllMocks();
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    await buida();
    expect(registre.sincronitzaAvisosPush).not.toHaveBeenCalled();
    expect(registre.netejaAvisosPushMostrats).not.toHaveBeenCalled();
    expect(adaptador.sincronitza).not.toHaveBeenCalled();
  });

  test('(6b) amagar la pàgina no sincronitza', async () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    mock.sessio = dins('A');
    render(<Sincro />);
    await buida();
    vi.clearAllMocks();
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(registre.sincronitzaAvisosPush).not.toHaveBeenCalled();
  });

  test('(8) durant l\'eixida no torna a fixar el servidor de qui ix; si l\'eixida falla, el torna a fixar sense canviar de persona', async () => {
    mock.sessio = dins('A');
    render(<Sincro />);
    await buida();
    vi.clearAllMocks();
    await act(async () => { await registre.baixaAvisosPushEnEixir(); });
    await buida();
    expect(registre.instantaniaAvisosPush()).toMatchObject({ eixint: true, ambServidor: false });
    expect(registre.fixaServidorAvisosPush).not.toHaveBeenCalled();

    await act(async () => { registre.reprenAvisosPushTrasEixidaFallida(); });
    await buida();
    expect(fixats()).toEqual(['A']);
    expect(registre.instantaniaAvisosPush()).toMatchObject({ eixint: false, ambServidor: true });
    expect(registre.desactivaAvisosPush).not.toHaveBeenCalled();
  });

  test('el servidor fixat desa camp a camp, amb la llengua d\'ara i la config de l\'amfitrió; canviar de llengua no torna a fixar res', async () => {
    mock.sessio = dins('A');
    const vista = render(<Sincro />);
    await buida();
    expect(mock.desaDispositiuAvisos).toHaveBeenCalledTimes(1);
    expect(mock.desaDispositiuAvisos).toHaveBeenCalledWith(
      { plataforma: 'web', adreca: ADRECA, caducaMs: 1893456000000, gest: false, llengua: 'ca' },
      mock.config
    );

    mock.llengua = 'es';
    vista.rerender(<Sincro />);
    await buida();
    expect(fixats()).toEqual(['A']);
    expect(registre.sincronitzaAvisosPush).toHaveBeenCalledTimes(1);

    /* El gest següent ja porta la llengua nova, i gest: true. */
    await act(async () => { await registre.activaAvisosPush(); });
    expect(mock.desaDispositiuAvisos).toHaveBeenLastCalledWith(
      { plataforma: 'web', adreca: ADRECA, caducaMs: null, gest: true, llengua: 'es' },
      mock.config
    );
    /* La retirada: només plataforma i adreça. */
    await act(async () => { await registre.desactivaAvisosPush(); });
    expect(mock.retiraDispositiuAvisos).toHaveBeenCalledWith({ plataforma: 'web', adreca: ADRECA, usuariEsperat: 'A' }, mock.config);
  });

  test('l\'àmbit és la persona, no l\'actor: parlar en nom d\'una entitat no rota res', async () => {
    mock.sessio = { estat: 'dins', currentUser: { id: 42 }, actorKey: 'persona::42' };
    const vista = render(<Sincro />);
    await buida();
    mock.sessio = { estat: 'dins', currentUser: { id: 42 }, actorKey: 'entitat::forn' };
    vista.rerender(<Sincro />);
    await buida();
    expect(fixats()).toEqual(['42']);
    expect(registre.desactivaAvisosPush).not.toHaveBeenCalled();
  });
});

describe('useControlAvisosPush', () => {
  async function ambServidor(persona = 'A') {
    mock.sessio = dins(persona);
    render(<><Sincro /><Control /></>);
    await buida();
    vi.clearAllMocks();
    ordre.length = 0;
  }

  test('(7) onCanvi(true) crida activaAvisosPush i l\'adaptador rep activa en el MATEIX tic, abans de cap microtasca', async () => {
    await ambServidor();
    expect(control.oferit).toBe(true);
    fireEvent.click(screen.getByText('encén'));
    /* Síncron: ni una microtasca pel mig. */
    const rebutsAbansDeCapEspera = adaptador.activa.mock.calls.length;
    expect(registre.activaAvisosPush).toHaveBeenCalledTimes(1);
    expect(rebutsAbansDeCapEspera).toBe(1);
    await buida();
    expect(control.actiu).toBe(true);

    fireEvent.click(screen.getByText('apaga'));
    expect(registre.desactivaAvisosPush).toHaveBeenCalledWith();
    await buida();
    expect(control.actiu).toBe(false);
    expect(ordre).toEqual(['activa', 'desactiva+retira']);
  });

  test('ocupat mentre vola un gest (el pany entre gestos) i lliure en acabar', async () => {
    await ambServidor();
    let resol;
    adaptador.activa.mockImplementationOnce(() => new Promise((r) => { resol = r; }));
    fireEvent.click(screen.getByText('encén'));
    await buida();
    expect(control.ocupat).toBe(true);
    await act(async () => { resol({ estat: 'actiu' }); });
    await buida();
    expect(control.ocupat).toBe(false);
  });

  test('s\'oferix només amb adaptador, sessió dins, mode remot, la capacitat i el servidor fixat; amb el motiu d\'iOS, només la nota', async () => {
    await ambServidor();
    expect(control).toMatchObject({ oferit: true, nomesNota: false });

    adaptador.motiu.mockImplementation(() => MOTIU_IOS_SENSE_INSTALAR);
    act(() => { registre.reprenAvisosPushTrasEixidaFallida(); registre.fixaServidorAvisosPush(null); });
    cleanup();
    await ambServidor();
    expect(control).toMatchObject({ oferit: false, nomesNota: true });
    expect(control.notes).toEqual([TEXTOS_AVISOS.ios[1]]);

    /* El text de l'avís d'entorn és el del diccionari de la llengua de la pàgina (el t que rep el hook). */
    for (const motiu of ['sense-clau', 'sense-config', 'sense-connector']) {
      for (const llengua of ['ca', 'es', 'en', 'eu', 'gl']) {
        adaptador.motiu.mockImplementation(() => motiu);
        mock.llengua = llengua;
        traductor = traductorDe(llengua);
        cleanup();
        await ambServidor();
        expect(control).toMatchObject({
          oferit: false,
          nomesNota: false,
          avisEntorn: true,
          motiu,
          nota: { text: DICCIONARIS[llengua][TEXTOS_AVISOS_ENTORN[motiu][0]], error: false },
          notes: []
        });
      }
    }
  });

  test.each([
    ['la sessió en comprovant', () => { mock.sessio = { estat: 'comprovant', currentUser: { id: 'A' } }; }],
    ['la sessió fora', () => { mock.sessio = { estat: 'fora', currentUser: null }; }],
    ['en llavor', () => { mock.mode = 'seed'; }],
    ['sense la capacitat', () => { mock.capacitat = false; }]
  ])('amb %s, no s\'oferix res (la pàgina continua «en construcció»)', async (_nom, prepara) => {
    mock.sessio = dins('A');
    prepara();
    render(<><Sincro /><Control /></>);
    await buida();
    expect(control).toMatchObject({ oferit: false, nomesNota: false });
  });

  test('durant una eixida no s\'oferix (ni encara amb el servidor de qui ix)', async () => {
    await ambServidor();
    await act(async () => { await registre.baixaAvisosPushEnEixir(); });
    expect(control).toMatchObject({ oferit: false });
    act(() => { registre.reprenAvisosPushTrasEixidaFallida(); });
    await buida();
    expect(control.oferit).toBe(true);
  });

  test.each([
    ['la sessió fora', () => { mock.sessio = { estat: 'fora', currentUser: null }; }],
    ['la sessió en comprovant', () => { mock.sessio = { estat: 'comprovant', currentUser: { id: 'A' } }; }],
    ['en llavor', () => { mock.mode = 'seed'; }],
    ['sense la capacitat', () => { mock.capacitat = false; }]
  ])('amb el motiu d\'iOS i %s, tampoc la nota: la nota d\'instal·lar demana les mateixes condicions que l\'interruptor (CORRECTOR ARB-P05-02)', async (_nom, prepara) => {
    adaptador.motiu.mockImplementation(() => MOTIU_IOS_SENSE_INSTALAR);
    mock.sessio = dins('A');
    prepara();
    render(<><Sincro /><Control /></>);
    await buida();
    expect(control).toMatchObject({ oferit: false, nomesNota: false, notes: [] });
  });

  test.each(
    Object.values(registre.ESTAT_AVISOS).filter((estat) => estat !== registre.ESTAT_AVISOS.ACTIU)
  )('si el gest acaba en \'%s\', l\'interruptor diu No: només \'actiu\' és Sí (CORRECTOR ARB-P05-02)', async (estat) => {
    await ambServidor();
    adaptador.activa.mockImplementationOnce(async () => ({ estat }));
    await act(async () => { await registre.activaAvisosPush(); });
    expect(registre.instantaniaAvisosPush().estat).toBe(estat);
    expect(control.actiu).toBe(false);
    await act(async () => { await registre.desactivaAvisosPush({ local: true }); });
  });

  test('el motiu d\'iOS és el mateix text que MOTIU_PUSH.IOS_SENSE_INSTALAR de la subscripció', () => {
    expect(MOTIU_IOS_SENSE_INSTALAR).toBe(MOTIU_PUSH.IOS_SENSE_INSTALAR);
  });
});

describe('notesDelsAvisos (pura)', () => {
  const t = (_clau, reserva) => reserva;
  const R = Object.fromEntries(Object.entries(TEXTOS_AVISOS).map(([nom, [, reserva]]) => [nom, reserva]));

  test('sense res a oferir, cap nota; amb la nota d\'iOS, eixa i prou', () => {
    expect(notesDelsAvisos({}, t)).toEqual({ nota: null, notes: [] });
    expect(notesDelsAvisos({ nomesNota: true, estat: 'error' }, t)).toEqual({ nota: null, notes: [R.ios] });
  });

  test.each([
    ['inactiu', null],
    ['actiu', null],
    ['denegat', { text: R.denegat, error: false }],
    ['sense-servidor', { text: R.noDisponible, error: false }],
    ['sense-worker', { text: R.senseWorker, error: true }],
    ['error', { text: R.error, error: true }],
    ['sense-gest', { text: R.error, error: true }]
  ])('amb l\'interruptor i l\'estat %s: la nota d\'estat i, sempre, la cega i la de l\'eixida', (estat, nota) => {
    expect(notesDelsAvisos({ oferit: true, estat, tipus: 'web' }, t)).toEqual({ nota, notes: [R.cec, R.eixida] });
  });

  test('a l\'app (natiu), el permís denegat parla del dispositiu, no del navegador', () => {
    expect(notesDelsAvisos({ oferit: true, estat: 'denegat', tipus: 'natiu' }, t).nota).toEqual({ text: R.denegatApp, error: false });
  });

  /* R21.4-UI (R21.2-F04) · L'avís d'entorn passa pel traductor com la resta: cada motiu té la seua clau
     als 5 diccionaris, la reserva és el valor valencià i, sense traductor, la reserva. Cap altre motiu en dona. */
  test('l\'avís d\'entorn: un parell [clau, reserva] per motiu, traduït en les 5 llengües', () => {
    expect(Object.keys(TEXTOS_AVISOS_ENTORN)).toEqual(['sense-clau', 'sense-config', 'sense-connector']);
    for (const [motiu, [clau, reserva]] of Object.entries(TEXTOS_AVISOS_ENTORN)) {
      expect(reserva, motiu).toBe(CA[clau]);
      expect(textAvisEntorn(motiu)).toBe(reserva);
      expect(textAvisEntorn(motiu, null)).toBe(reserva);
      for (const llengua of Object.keys(DICCIONARIS)) {
        const text = DICCIONARIS[llengua][clau];
        expect(typeof text === 'string' && text.trim().length > 0, `${llengua}: ${clau}`).toBe(true);
        if (llengua !== 'ca') expect(text, `${llengua}: ${clau}`).not.toBe(reserva);
        expect(textAvisEntorn(motiu, traductorDe(llengua))).toBe(text);
        expect(notesDelsAvisos({ avisEntorn: true, motiu }, traductorDe(llengua))).toEqual({ nota: { text, error: false }, notes: [] });
      }
    }
    for (const motiu of [null, undefined, '', 'ios-sense-instalar', 'sense-res', 42]) expect(textAvisEntorn(motiu, t)).toBeNull();
    expect(notesDelsAvisos({ oferit: true, avisEntorn: true, motiu: 'sense-clau', estat: 'inactiu' }, t)).toEqual({ nota: null, notes: [R.cec, R.eixida] });
  });
});
