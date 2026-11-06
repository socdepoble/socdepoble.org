// @vitest-environment node
/* B8C-1 (marató 261101_2143; B8-CLIENT §5.1) · El registre dels avisos push del
   Xat (avisosPushXat.js): la cadena síncrona del gest, el servidor per persona,
   la generació que talla els desats en vol, l'eixida i l'entrada que no es
   pengen mai, el toc sense dades i l'instantània estable. Cada cas carrega un
   mòdul nou (el registre és d'estat de mòdul). Tot és sintètic.
   Onada R9 · C3 (G8-09) · El registre és ara una façana (avisosPushXat.js) i
   un motor (motorAvisosPushXat.js) que s'hi endolla en avaluar-se. `carrega`
   porta els dos, com fan l'entrada web i la nativa abans de registrar cap
   adaptador; les proves de la façana sola (el temps abans que el motor
   arribe) són al bloc «façana sense motor». */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { especificadorsImport } from '../../tests/helpers/especificadorsImport.js';

const carrega = async () => {
  vi.resetModules();
  await import('./motorAvisosPushXat.js');
  return import('./avisosPushXat.js');
};
/* La façana sola, sense el motor (el que veu l'entrada fins que arriba). */
const carregaFacana = async () => {
  vi.resetModules();
  return import('./avisosPushXat.js');
};
const obert = () => {
  let resol;
  let rebutja;
  const promesa = new Promise((r, j) => { resol = r; rebutja = j; });
  return { promesa, resol, rebutja };
};
const buida = async () => { for (let i = 0; i < 20; i += 1) await Promise.resolve(); };

const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc';

function adaptadorFals(extra = {}) {
  const a = {
    tipus: 'web',
    ordre: [],
    toca: null,
    motiu: vi.fn(() => null),
    estat: vi.fn(async () => ({ estat: 'inactiu' })),
    activa: vi.fn(() => { a.ordre.push('activa'); return Promise.resolve({ estat: 'actiu' }); }),
    desactiva: vi.fn(async () => { a.ordre.push('desactiva'); return { estat: 'inactiu' }; }),
    sincronitza: vi.fn(async () => { a.ordre.push('sincronitza'); return { estat: 'actiu' }; }),
    neteja: vi.fn(async () => { a.ordre.push('neteja'); }),
    oblida: vi.fn(() => { a.ordre.push('oblida'); }),
    escoltaToc: vi.fn((fn) => { a.toca = fn; return () => {}; }),
    ...extra
  };
  return a;
}
const servidorFals = (ambit = 'A') => ({ ambit, desa: vi.fn(async () => {}), retira: vi.fn(async () => {}) });

/* L'adaptador web real desa amb la forma que torna desaOdesfes: un desat que
   rebutja és { estat: 'error', error: 'servidor' }. Ací, el mateix. */
const activaQueDesa = (a, dades) => vi.fn(({ desa }) => {
  a.ordre.push('activa');
  return Promise.resolve(desa(dades)).then(() => ({ estat: 'actiu' }), () => ({ estat: 'error', error: 'servidor' }));
});

afterEach(() => { vi.useRealTimers(); });

describe('constants i bandera', () => {
  test('la bandera és encesa (ordre del Mestre del 261106) i literal (Rollup la plega), el límit és de 2,5 s', async () => {
    const r = await carrega();
    expect(r.AVISOS_PUSH_XAT_ACTIUS).toBe(true);
    expect(r.LIMIT_BAIXA_PUSH_MS).toBe(2500);
    const codi = readFileSync(path.join(process.cwd(), 'src/config/avisosPushXat.js'), 'utf8');
    expect(codi).toMatch(/^export const AVISOS_PUSH_XAT_ACTIUS = true;$/m);
    expect(Object.isFrozen(r.ESTAT_AVISOS)).toBe(true);
    expect(Object.values(r.ESTAT_AVISOS)).toEqual(['no-disponible', 'no-oferit', 'inactiu', 'actiu', 'denegat',
      'sense-gest', 'sense-worker', 'sense-connector', 'sense-servidor', 'error']);
  });
});

describe('registrar', () => {
  test('(3) un altre adaptador llança, el mateix torna true i null torna false', async () => {
    const r = await carrega();
    expect(r.registraAvisosPush(null)).toBe(false);
    expect(r.registraAvisosPush(undefined)).toBe(false);
    expect(r.avisosPushDisponibles()).toBe(false);
    const a = adaptadorFals();
    expect(r.registraAvisosPush(a)).toBe(true);
    expect(r.registraAvisosPush(a)).toBe(true);
    expect(() => r.registraAvisosPush(adaptadorFals())).toThrow(Error);
    expect(r.avisosPushDisponibles()).toBe(true);
  });

  test.each([
    ['sense escoltaToc()', { escoltaToc: undefined }],
    ['un oblida que no és funció', { oblida: 'sí' }],
    ['un tipus desconegut', { tipus: 'fax' }],
    ['sense tipus', { tipus: undefined }]
  ])('(3) mal format (%s) → TypeError i no registra res', async (_cas, dolent) => {
    const r = await carrega();
    expect(() => r.registraAvisosPush(adaptadorFals(dolent))).toThrow(TypeError);
    expect(() => r.registraAvisosPush('adaptador')).toThrow(TypeError);
    expect(() => r.registraAvisosPush(7)).toThrow(TypeError);
    expect(r.avisosPushDisponibles()).toBe(false);
    expect(r.registraAvisosPush(adaptadorFals())).toBe(true);
  });

  test('registrar no crida estat() ni cap altra operació: només motiu() (síncron) i escoltaToc', async () => {
    const r = await carrega();
    const a = adaptadorFals({ tipus: 'natiu', motiu: vi.fn(() => 'sense-connector') });
    r.registraAvisosPush(a);
    await buida();
    expect(a.estat).not.toHaveBeenCalled();
    expect(a.activa).not.toHaveBeenCalled();
    expect(a.sincronitza).not.toHaveBeenCalled();
    expect(a.desactiva).not.toHaveBeenCalled();
    expect(a.escoltaToc).toHaveBeenCalledTimes(1);
    expect(r.instantaniaAvisosPush()).toEqual({
      disponible: true, tipus: 'natiu', motiu: 'sense-connector', estat: 'inactiu',
      error: null, ocupat: false, ambServidor: false, eixint: false
    });
  });

  test('un motiu() que llança no s’oferix (motiu no nul) i no tomba el registre', async () => {
    const r = await carrega();
    expect(r.registraAvisosPush(adaptadorFals({ motiu: () => { throw new Error('x'); } }))).toBe(true);
    expect(r.instantaniaAvisosPush().motiu).toBe('sense-suport');
  });
});

describe('activar des del gest', () => {
  test('(1) adaptador.activa es crida en el mateix tic, abans de cap microtasca', async () => {
    const r = await carrega();
    const a = adaptadorFals();
    r.registraAvisosPush(a);
    r.fixaServidorAvisosPush(servidorFals());
    let rebut = false;
    a.activa.mockImplementation(() => { rebut = true; return Promise.resolve({ estat: 'actiu' }); });
    const promesa = r.activaAvisosPush();
    expect(rebut).toBe(true);
    expect(r.instantaniaAvisosPush().ocupat).toBe(true);
    await expect(promesa).resolves.toEqual({ estat: 'actiu' });
    expect(r.instantaniaAvisosPush()).toMatchObject({ estat: 'actiu', ocupat: false, ambServidor: true });
  });

  test('(2) sense servidor → sense-servidor i sense adaptador → no-disponible, sense cridar activa', async () => {
    const r = await carrega();
    await expect(r.activaAvisosPush()).resolves.toEqual({ estat: 'no-disponible' });
    const a = adaptadorFals();
    r.registraAvisosPush(a);
    await expect(r.activaAvisosPush()).resolves.toEqual({ estat: 'sense-servidor' });
    expect(a.activa).not.toHaveBeenCalled();
  });

  test('el desat d’activa porta gest: true i només els quatre camps (cap clau de la subscripció)', async () => {
    const r = await carrega();
    const a = adaptadorFals();
    a.activa = activaQueDesa(a, { plataforma: 'web', adreca: ENDPOINT, caducaMs: 5, gest: false, keys: { p256dh: 'p', auth: 'a' } });
    r.registraAvisosPush(a);
    const s = servidorFals();
    r.fixaServidorAvisosPush(s);
    await expect(r.activaAvisosPush()).resolves.toEqual({ estat: 'actiu' });
    expect(s.desa).toHaveBeenCalledTimes(1);
    expect(s.desa.mock.calls[0][0]).toEqual({ plataforma: 'web', adreca: ENDPOINT, caducaMs: 5, gest: true });
  });

  test('(11) un desat que rebutja amb NO-DISPONIBLE (servidor apagat) torna sense-servidor', async () => {
    const r = await carrega();
    const a = adaptadorFals();
    a.activa = activaQueDesa(a, { plataforma: 'web', adreca: ENDPOINT });
    r.registraAvisosPush(a);
    const s = servidorFals();
    s.desa.mockRejectedValue(Object.assign(new Error('apagat'), { code: 'NO-DISPONIBLE' }));
    r.fixaServidorAvisosPush(s);
    await expect(r.activaAvisosPush()).resolves.toEqual({ estat: 'sense-servidor' });
    expect(r.instantaniaAvisosPush().estat).toBe('sense-servidor');
  });

  test('un altre error del desat continua sent error (no es disfressa de servidor apagat)', async () => {
    const r = await carrega();
    const a = adaptadorFals();
    a.activa = activaQueDesa(a, { plataforma: 'web', adreca: ENDPOINT });
    r.registraAvisosPush(a);
    const s = servidorFals();
    s.desa.mockRejectedValue(Object.assign(new Error('SDP-PUSH-003'), { code: 'AVISOS_INVALID' }));
    r.fixaServidorAvisosPush(s);
    await expect(r.activaAvisosPush()).resolves.toEqual({ estat: 'error', error: 'servidor' });
  });

  test('un activa que llança o torna brossa és error, mai un rebuig', async () => {
    const r = await carrega();
    const a = adaptadorFals({ activa: vi.fn(() => { throw new Error('x'); }) });
    r.registraAvisosPush(a);
    r.fixaServidorAvisosPush(servidorFals());
    await expect(r.activaAvisosPush()).resolves.toEqual({ estat: 'error' });
    a.activa.mockImplementation(() => Promise.resolve('actiu'));
    await expect(r.activaAvisosPush()).resolves.toEqual({ estat: 'error' });
    a.activa.mockImplementation(() => Promise.reject(new Error('y')));
    await expect(r.activaAvisosPush()).resolves.toEqual({ estat: 'error' });
    expect(r.instantaniaAvisosPush().ocupat).toBe(false);
  });
});

describe('eixida', () => {
  test('(4) una baixa que no es resol mai acaba en LIMIT_BAIXA_PUSH_MS i no rebutja; una que llança, tampoc', async () => {
    vi.useFakeTimers();
    const r = await carrega();
    const a = adaptadorFals({ desactiva: vi.fn(() => new Promise(() => {})) });
    r.registraAvisosPush(a);
    r.fixaServidorAvisosPush(servidorFals());
    let acabada = false;
    const baixa = r.baixaAvisosPushEnEixir().then(() => { acabada = true; });
    await vi.advanceTimersByTimeAsync(r.LIMIT_BAIXA_PUSH_MS - 1);
    expect(acabada).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await baixa;
    expect(acabada).toBe(true);
    a.desactiva.mockImplementation(() => { throw new Error('trencat'); });
    await expect(r.baixaAvisosPushEnEixir()).resolves.toBeUndefined();
    a.desactiva.mockImplementation(() => Promise.reject(new Error('trencat')));
    await expect(r.baixaAvisosPushEnEixir({ limitMs: 10 })).resolves.toBeUndefined();
  });

  test('des de la baixa el push es mostra apagat (D-B8C-8), encara que la baixa es penge; si no pot desfer, error', async () => {
    vi.useFakeTimers();
    const r = await carrega();
    const a = adaptadorFals({ desactiva: vi.fn(() => new Promise(() => {})) });
    r.registraAvisosPush(a);
    r.fixaServidorAvisosPush(servidorFals('A'));
    await r.sincronitzaAvisosPush();
    expect(r.instantaniaAvisosPush().estat).toBe('actiu');
    const baixa = r.baixaAvisosPushEnEixir();
    expect(r.instantaniaAvisosPush().estat).toBe('inactiu');
    await vi.advanceTimersByTimeAsync(r.LIMIT_BAIXA_PUSH_MS);
    await baixa;
    r.reprenAvisosPushTrasEixidaFallida();
    expect(r.instantaniaAvisosPush()).toMatchObject({ estat: 'inactiu', eixint: false });
    a.desactiva.mockImplementation(async () => ({ estat: 'error', error: 'subscripcio' }));
    r.fixaServidorAvisosPush(servidorFals('A'));
    await r.baixaAvisosPushEnEixir();
    expect(r.instantaniaAvisosPush()).toMatchObject({ estat: 'error', error: 'subscripcio' });
  });

  test('la baixa marca l’eixida abans de res i retira l’aparell amb el servidor de qui ix', async () => {
    const r = await carrega();
    const a = adaptadorFals({
      desactiva: vi.fn(async ({ retira }) => {
        /* En el moment de la baixa, l'eixida ja és marcada i el servidor, fora. */
        expect(r.instantaniaAvisosPush()).toMatchObject({ eixint: true, ambServidor: false });
        await retira({ plataforma: 'web', adreca: ENDPOINT, intrus: 'x' });
        return { estat: 'inactiu' };
      })
    });
    r.registraAvisosPush(a);
    const s = servidorFals('A');
    r.fixaServidorAvisosPush(s);
    await r.baixaAvisosPushEnEixir();
    expect(a.desactiva).toHaveBeenCalledTimes(1);
    expect(s.retira).toHaveBeenCalledWith({ plataforma: 'web', adreca: ENDPOINT });
    expect(r.instantaniaAvisosPush()).toMatchObject({ eixint: true, ambServidor: false, estat: 'inactiu' });
  });

  test('(5) un activa en vol que torna després de la baixa no publica actiu, i el seu desat es rebutja sense arribar al servidor', async () => {
    const r = await carrega();
    const vol = obert();
    let desaDeLaCrida = null;
    const a = adaptadorFals({ activa: vi.fn(({ desa }) => { desaDeLaCrida = desa; return vol.promesa; }) });
    r.registraAvisosPush(a);
    const s = servidorFals('A');
    r.fixaServidorAvisosPush(s);
    const activacio = r.activaAvisosPush();
    await r.baixaAvisosPushEnEixir();
    await expect(desaDeLaCrida({ plataforma: 'web', adreca: ENDPOINT })).rejects.toMatchObject({ code: 'AVISOS_OBSOLET' });
    expect(s.desa).not.toHaveBeenCalled();
    vol.resol({ estat: 'actiu' });
    await activacio;
    expect(r.instantaniaAvisosPush().estat).not.toBe('actiu');
    expect(r.instantaniaAvisosPush().ocupat).toBe(false);
  });

  test('un desat que el servidor accepta mentre comença l’eixida es retira de cortesia i es rebutja (l’adaptador el desfà)', async () => {
    const r = await carrega();
    const vol = obert();
    const s = servidorFals('A');
    s.desa.mockImplementation(() => vol.promesa);
    let resultatDesat = null;
    const a = adaptadorFals({
      activa: vi.fn(({ desa }) => desa({ plataforma: 'web', adreca: ENDPOINT, caducaMs: null })
        .then(() => { resultatDesat = 'desat'; return { estat: 'actiu' }; }, (e) => { resultatDesat = e.code; return { estat: 'error', error: 'servidor' }; }))
    });
    r.registraAvisosPush(a);
    r.fixaServidorAvisosPush(s);
    const activacio = r.activaAvisosPush();
    await buida();
    expect(s.desa).toHaveBeenCalledTimes(1);
    await r.baixaAvisosPushEnEixir();
    vol.resol();
    await activacio;
    await buida();
    expect(resultatDesat).toBe('AVISOS_OBSOLET');
    expect(s.retira).toHaveBeenCalledWith({ plataforma: 'web', adreca: ENDPOINT });
    expect(r.instantaniaAvisosPush().estat).not.toBe('actiu');
  });

  test('(6) l’oblit fa la baixa local (retira null), oblida i neteja, deixa inactiu i NO lleva l’eixida', async () => {
    const r = await carrega();
    const a = adaptadorFals();
    r.registraAvisosPush(a);
    r.fixaServidorAvisosPush(servidorFals('A'));
    await r.baixaAvisosPushEnEixir();
    a.desactiva.mockClear();
    await r.oblidaAvisosPushEnEixir();
    expect(a.desactiva).toHaveBeenCalledTimes(1);
    expect(a.desactiva).toHaveBeenCalledWith({ retira: null });
    expect(a.oblida).toHaveBeenCalledTimes(1);
    expect(a.neteja).toHaveBeenCalledTimes(1);
    expect(r.instantaniaAvisosPush()).toMatchObject({ eixint: true, estat: 'inactiu', error: null });
    expect(r.fixaServidorAvisosPush(servidorFals('A'))).toBe(false);
  });

  test('l’oblit tampoc es penja: amb una baixa local que no torna mai, acaba al límit i ja ha oblidat', async () => {
    vi.useFakeTimers();
    const r = await carrega();
    const a = adaptadorFals({ desactiva: vi.fn(() => new Promise(() => {})) });
    r.registraAvisosPush(a);
    let acabat = false;
    const oblit = r.oblidaAvisosPushEnEixir().then(() => { acabat = true; });
    expect(a.oblida).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(r.LIMIT_BAIXA_PUSH_MS);
    await oblit;
    expect(acabat).toBe(true);
  });

  test('(10) durant l’eixida, el mateix àmbit es refusa; un altre o null s’accepten; després de reprendre, el mateix torna', async () => {
    const r = await carrega();
    r.registraAvisosPush(adaptadorFals());
    r.fixaServidorAvisosPush(servidorFals('A'));
    await r.baixaAvisosPushEnEixir();
    expect(r.fixaServidorAvisosPush(servidorFals('A'))).toBe(false);
    expect(r.instantaniaAvisosPush().ambServidor).toBe(false);
    expect(r.fixaServidorAvisosPush(servidorFals('B'))).toBe(true);
    expect(r.instantaniaAvisosPush()).toMatchObject({ ambServidor: true, eixint: false });
    /* Una altra eixida (de B) i, ara, null. */
    await r.baixaAvisosPushEnEixir();
    expect(r.fixaServidorAvisosPush(null)).toBe(true);
    expect(r.instantaniaAvisosPush()).toMatchObject({ ambServidor: false, eixint: false });
    /* Una eixida que falla: la persona continua dins i el seu servidor torna. */
    r.fixaServidorAvisosPush(servidorFals('A'));
    await r.baixaAvisosPushEnEixir();
    expect(r.fixaServidorAvisosPush(servidorFals('A'))).toBe(false);
    r.reprenAvisosPushTrasEixidaFallida();
    expect(r.instantaniaAvisosPush().eixint).toBe(false);
    expect(r.fixaServidorAvisosPush(servidorFals('A'))).toBe(true);
  });

  test('un segon «Tanca la sessió» (doble clic) no esborra l’àmbit de qui ix', async () => {
    const r = await carrega();
    r.registraAvisosPush(adaptadorFals());
    r.fixaServidorAvisosPush(servidorFals('A'));
    await r.baixaAvisosPushEnEixir();
    await r.baixaAvisosPushEnEixir();
    expect(r.fixaServidorAvisosPush(servidorFals('A'))).toBe(false);
  });

  test('un servidor mal format es refusa i no canvia res', async () => {
    const r = await carrega();
    r.registraAvisosPush(adaptadorFals());
    expect(r.fixaServidorAvisosPush({ ambit: 'A', desa: () => {} })).toBe(false);
    expect(r.fixaServidorAvisosPush({ ambit: '', desa: () => {}, retira: () => {} })).toBe(false);
    expect(r.fixaServidorAvisosPush({ ambit: 7, desa: () => {}, retira: () => {} })).toBe(false);
    expect(r.fixaServidorAvisosPush('A')).toBe(false);
    expect(r.instantaniaAvisosPush().ambServidor).toBe(false);
  });

  test('sense adaptador, l’eixida i l’entrada són inertes i no rebutgen', async () => {
    const r = await carrega();
    await expect(r.baixaAvisosPushEnEixir()).resolves.toBeUndefined();
    await expect(r.oblidaAvisosPushEnEixir()).resolves.toBeUndefined();
    await expect(r.baixaLocalAvisosPushEnEntrar()).resolves.toBeUndefined();
    await expect(r.netejaAvisosPushMostrats()).resolves.toBeUndefined();
    await expect(r.sincronitzaAvisosPush()).resolves.toEqual({ estat: 'no-disponible' });
    await expect(r.desactivaAvisosPush()).resolves.toEqual({ estat: 'no-disponible' });
    expect(() => r.reprenAvisosPushTrasEixidaFallida()).not.toThrow();
  });
});

describe('entrada explícita i sincronització', () => {
  test('(12) la baixa local en entrar crida desactiva({ retira: null }) i una sincronització alhora l’espera', async () => {
    const r = await carrega();
    const vol = obert();
    const a = adaptadorFals({ desactiva: vi.fn(() => { a.ordre.push('desactiva'); return vol.promesa; }) });
    r.registraAvisosPush(a);
    r.fixaServidorAvisosPush(servidorFals('B'));
    const baixa = r.baixaLocalAvisosPushEnEntrar();
    expect(a.desactiva).toHaveBeenCalledWith({ retira: null });
    const sincronia = r.sincronitzaAvisosPush();
    await buida();
    expect(a.sincronitza).not.toHaveBeenCalled();
    vol.resol({ estat: 'inactiu' });
    await baixa;
    await sincronia;
    expect(a.ordre).toEqual(['desactiva', 'sincronitza']);
  });

  test('la baixa local en entrar no es penja (límit) i tanca una eixida que la interfície no ha vist acabar', async () => {
    vi.useFakeTimers();
    const r = await carrega();
    const a = adaptadorFals({ desactiva: vi.fn(() => new Promise(() => {})) });
    r.registraAvisosPush(a);
    r.fixaServidorAvisosPush(servidorFals('A'));
    void r.baixaAvisosPushEnEixir({ limitMs: 1 });
    let acabada = false;
    const baixa = r.baixaLocalAvisosPushEnEntrar().then(() => { acabada = true; });
    expect(r.instantaniaAvisosPush().eixint).toBe(false);
    await vi.advanceTimersByTimeAsync(r.LIMIT_BAIXA_PUSH_MS);
    await baixa;
    expect(acabada).toBe(true);
    expect(r.fixaServidorAvisosPush(servidorFals('A'))).toBe(true);
  });

  test('(13) durant l’eixida, sincronitzar no crida l’adaptador', async () => {
    const r = await carrega();
    const a = adaptadorFals();
    r.registraAvisosPush(a);
    r.fixaServidorAvisosPush(servidorFals('A'));
    await r.baixaAvisosPushEnEixir();
    await r.sincronitzaAvisosPush();
    expect(a.sincronitza).not.toHaveBeenCalled();
  });

  test('amb servidor: actiu, àmbit, retira de la persona i desat amb gest: false', async () => {
    const r = await carrega();
    const a = adaptadorFals({
      sincronitza: vi.fn(async ({ desa }) => { await desa({ plataforma: 'web', adreca: ENDPOINT, caducaMs: 9, gest: true }); return { estat: 'actiu' }; })
    });
    r.registraAvisosPush(a);
    const s = servidorFals('A');
    r.fixaServidorAvisosPush(s);
    await expect(r.sincronitzaAvisosPush()).resolves.toEqual({ estat: 'actiu' });
    const [opcions] = a.sincronitza.mock.calls[0];
    expect(opcions.actiu).toBe(true);
    expect(opcions.ambit).toBe('A');
    expect(typeof opcions.retira).toBe('function');
    expect(s.desa.mock.calls[0][0]).toEqual({ plataforma: 'web', adreca: ENDPOINT, caducaMs: 9, gest: false });
  });

  test('sense servidor fa d’interruptor: actiu fals i sense desa ni retira', async () => {
    const r = await carrega();
    const a = adaptadorFals({ sincronitza: vi.fn(async () => ({ estat: 'inactiu' })) });
    r.registraAvisosPush(a);
    await r.sincronitzaAvisosPush();
    expect(a.sincronitza).toHaveBeenCalledWith({ actiu: false, desa: undefined, retira: undefined, ambit: undefined });
  });

  test.each([
    ['el codi traduït', Object.assign(new Error('aliè'), { code: 'AVISOS_ALIE' })],
    ['el missatge del servidor', Object.assign(new Error('SDP-PUSH-011: l’aparell és d’una altra persona'), { code: '42501' })]
  ])('SDP-PUSH-011 en sincronitzar (%s): baixa local sense retirada i inactiu (B8-SERVIDOR §2.9)', async (_cas, error) => {
    const r = await carrega();
    const a = adaptadorFals({
      sincronitza: vi.fn(async ({ desa }) => desa({ plataforma: 'web', adreca: ENDPOINT }).then(() => ({ estat: 'actiu' }), () => ({ estat: 'error', error: 'servidor' })))
    });
    r.registraAvisosPush(a);
    const s = servidorFals('B');
    s.desa.mockRejectedValue(error);
    r.fixaServidorAvisosPush(s);
    await expect(r.sincronitzaAvisosPush()).resolves.toEqual({ estat: 'inactiu' });
    expect(a.desactiva).toHaveBeenCalledWith({ retira: null });
    expect(s.retira).not.toHaveBeenCalled();
    expect(r.instantaniaAvisosPush().estat).toBe('inactiu');
  });

  test('un altre error del desat en sincronitzar conserva la subscripció (cap baixa)', async () => {
    const r = await carrega();
    const a = adaptadorFals({
      sincronitza: vi.fn(async ({ desa }) => desa({ plataforma: 'web', adreca: ENDPOINT }).then(() => ({ estat: 'actiu' }), () => ({ estat: 'error', error: 'servidor' })))
    });
    r.registraAvisosPush(a);
    const s = servidorFals('B');
    s.desa.mockRejectedValue(new Error('500'));
    r.fixaServidorAvisosPush(s);
    await expect(r.sincronitzaAvisosPush()).resolves.toEqual({ estat: 'error', error: 'servidor' });
    expect(a.desactiva).not.toHaveBeenCalled();
  });

  test('desactivar: per defecte retira amb el servidor; amb local, només la baixa d’este aparell', async () => {
    const r = await carrega();
    const a = adaptadorFals({ desactiva: vi.fn(async ({ retira }) => { if (retira) await retira({ plataforma: 'web', adreca: ENDPOINT }); return { estat: 'inactiu' }; }) });
    r.registraAvisosPush(a);
    const s = servidorFals('A');
    r.fixaServidorAvisosPush(s);
    await expect(r.desactivaAvisosPush()).resolves.toEqual({ estat: 'inactiu' });
    expect(s.retira).toHaveBeenCalledTimes(1);
    await r.desactivaAvisosPush({ local: true });
    expect(a.desactiva.mock.calls[1][0]).toEqual({ retira: null });
    expect(s.retira).toHaveBeenCalledTimes(1);
    await expect(r.desactivaAvisosPush(null)).resolves.toEqual({ estat: 'inactiu' });
  });

  test('netejar els avisos mostrats delega en l’adaptador i no rebutja si falla', async () => {
    const r = await carrega();
    const a = adaptadorFals({ neteja: vi.fn(() => Promise.reject(new Error('x'))) });
    r.registraAvisosPush(a);
    await expect(r.netejaAvisosPushMostrats()).resolves.toBeUndefined();
    expect(a.neteja).toHaveBeenCalledTimes(1);
  });
});

describe('toc i instantània', () => {
  test('(7) un toc abans de l’oient es lliura una sola vegada i sense dades', async () => {
    const r = await carrega();
    const a = adaptadorFals();
    r.registraAvisosPush(a);
    a.toca({ filId: 'fil-secret', text: 'hola', desti: '/xat/fil-secret' });
    const primer = vi.fn();
    const deixa = r.escoltaTocAvisPush(primer);
    expect(primer).toHaveBeenCalledTimes(1);
    expect(primer).toHaveBeenCalledWith({});
    const segon = vi.fn();
    r.escoltaTocAvisPush(segon);
    expect(segon).not.toHaveBeenCalled();
    a.toca({ filId: 'altre' });
    expect(primer).toHaveBeenCalledTimes(2);
    expect(primer.mock.calls[1]).toEqual([{}]);
    expect(segon).toHaveBeenCalledWith({});
    deixa();
    a.toca();
    expect(primer).toHaveBeenCalledTimes(2);
    expect(r.escoltaTocAvisPush('no')()).toBeUndefined();
  });

  test('un oient del toc que llança no talla els altres', async () => {
    const r = await carrega();
    const a = adaptadorFals();
    r.registraAvisosPush(a);
    const bo = vi.fn();
    r.escoltaTocAvisPush(() => { throw new Error('x'); });
    r.escoltaTocAvisPush(bo);
    a.toca({});
    expect(bo).toHaveBeenCalledTimes(1);
  });

  test('(8) l’instantània és la mateixa referència si no canvia res, i els oients només s’avisen en canviar', async () => {
    const r = await carrega();
    const oient = vi.fn();
    const deixa = r.escoltaAvisosPush(oient);
    const buit = r.instantaniaAvisosPush();
    expect(Object.isFrozen(buit)).toBe(true);
    expect(r.instantaniaAvisosPush()).toBe(buit);
    const a = adaptadorFals();
    r.registraAvisosPush(a);
    expect(oient).toHaveBeenCalledTimes(1);
    const s = servidorFals('A');
    r.fixaServidorAvisosPush(s);
    const ambServidor = r.instantaniaAvisosPush();
    expect(oient).toHaveBeenCalledTimes(2);
    r.fixaServidorAvisosPush(s);
    r.fixaServidorAvisosPush(servidorFals('A'));
    expect(r.instantaniaAvisosPush()).toBe(ambServidor);
    expect(oient).toHaveBeenCalledTimes(2);
    await r.sincronitzaAvisosPush();
    const activa = r.instantaniaAvisosPush();
    expect(activa.estat).toBe('actiu');
    await r.sincronitzaAvisosPush();
    expect(r.instantaniaAvisosPush()).toBe(activa);
    deixa();
    r.fixaServidorAvisosPush(null);
    expect(oient).toHaveBeenCalledTimes(3);
  });
});

/* Corrector N03-B8C-1 (ARB-B8C1-01). El salt de generació és l'ÚNIC pany perquè
   el gest d'una persona no inscriga la següent: amb p_gest cert, B8-SERVIDOR §2.9
   canvia l'amo de l'adreça sense cap SDP-PUSH-011. Cada cas deixa un gest en vol
   (el diàleg del permís obert), avança la generació pel camí real i comprova que
   el desat tardà no arriba a cap servidor i que el seu resultat no es pinta. */
describe('generació: el gest d’una persona no inscriu mai la següent', () => {
  /* Un adaptador que, com el web, espera el permís, després desa i tradueix el
     rebuig del desat a { estat: 'error', error: 'servidor' } (desaOdesfes). */
  const gestPendent = (a, codis) => {
    const permis = obert();
    a.activa = vi.fn(({ desa }) => permis.promesa
      .then(() => desa({ plataforma: 'web', adreca: ENDPOINT, caducaMs: null }))
      .then(() => ({ estat: 'actiu' }), (error) => { codis.push(error?.code); return { estat: 'error', error: 'servidor' }; }));
    return permis;
  };

  test.each([
    ['després d’un canvi de persona dins de la càrrega (B8C-6 iv: baixa local i servidor de B)', async (r, A, B) => {
      r.fixaServidorAvisosPush(A);
      return async () => { await r.desactivaAvisosPush({ local: true }); r.fixaServidorAvisosPush(B); };
    }],
    ['després d’una entrada explícita (ARB-05: baixa local en entrar, el servidor encara és el d’A)', async (r, A) => {
      r.fixaServidorAvisosPush(A);
      return async () => { await r.baixaLocalAvisosPushEnEntrar(); };
    }],
    ['amb la sessió fora (abast pestanya: només es desvincula el servidor)', async (r, A) => {
      r.fixaServidorAvisosPush(A);
      return async () => { r.fixaServidorAvisosPush(null); };
    }],
    ['després de l’oblit d’una eixida d’A amb B ja a la interfície (una altra pestanya)', async (r, A, B) => {
      r.fixaServidorAvisosPush(A);
      await r.baixaAvisosPushEnEixir();
      r.fixaServidorAvisosPush(B);
      return async () => { await r.oblidaAvisosPushEnEixir(); };
    }]
  ])('%s, el desat en vol és obsolet, cap servidor no el rep i el resultat no es publica', async (_cas, prepara) => {
    const r = await carrega();
    const a = adaptadorFals();
    const codis = [];
    const permis = gestPendent(a, codis);
    r.registraAvisosPush(a);
    const A = servidorFals('A');
    const B = servidorFals('B');
    const canvi = await prepara(r, A, B);
    const gest = r.activaAvisosPush();
    expect(a.activa).toHaveBeenCalledTimes(1);
    await canvi();
    const estatDespresDelCanvi = r.instantaniaAvisosPush().estat;
    /* ARB-B8C1-02 (decisió del corrector): l'«ocupat» del gest en vol es manté entre
       generacions; serialitza els gestos perquè el desfés obsolet d'este no mate la
       subscripció compartida que obriria el gest següent. */
    expect(r.instantaniaAvisosPush().ocupat).toBe(true);
    permis.resol('granted');
    await expect(gest).resolves.toEqual({ estat: 'error', error: 'servidor' });
    expect(codis).toEqual(['AVISOS_OBSOLET']);
    expect(A.desa).not.toHaveBeenCalled();
    expect(B.desa).not.toHaveBeenCalled();
    expect(r.instantaniaAvisosPush()).toMatchObject({ estat: estatDespresDelCanvi, error: null, ocupat: false });
  });

  test('ARB-B8C1-02 · l’ocupat del gest d’A passa l’eixida i l’entrada de B fins que l’adaptador acaba; després B pot activar', async () => {
    const r = await carrega();
    const a = adaptadorFals();
    const codis = [];
    const permis = gestPendent(a, codis);
    r.registraAvisosPush(a);
    r.fixaServidorAvisosPush(servidorFals('A'));
    const gestA = r.activaAvisosPush();
    await r.baixaAvisosPushEnEixir();
    await r.oblidaAvisosPushEnEixir();
    r.fixaServidorAvisosPush(null);
    await r.baixaLocalAvisosPushEnEntrar();
    const B = servidorFals('B');
    r.fixaServidorAvisosPush(B);
    await r.sincronitzaAvisosPush();
    /* desactivat={avisos.ocupat} (B8C-6.5): B no toca mentre el gest d'A vola. */
    expect(r.instantaniaAvisosPush()).toMatchObject({ ocupat: true, ambServidor: true, eixint: false });
    permis.resol('granted');
    await gestA;
    expect(codis).toEqual(['AVISOS_OBSOLET']);
    expect(r.instantaniaAvisosPush().ocupat).toBe(false);
    /* Ara el gest de B arriba al servidor de B, amb gest: true. */
    a.activa = activaQueDesa(a, { plataforma: 'web', adreca: ENDPOINT });
    await expect(r.activaAvisosPush()).resolves.toEqual({ estat: 'actiu' });
    expect(B.desa).toHaveBeenCalledWith({ plataforma: 'web', adreca: ENDPOINT, caducaMs: null, gest: true });
  });

  test('una sincronització que espera la baixa d’entrada no crida l’adaptador si mentrestant comença una eixida', async () => {
    const r = await carrega();
    const vol = obert();
    const a = adaptadorFals();
    a.desactiva.mockImplementationOnce(() => vol.promesa);
    r.registraAvisosPush(a);
    r.fixaServidorAvisosPush(servidorFals('B'));
    const baixa = r.baixaLocalAvisosPushEnEntrar();
    const sincronia = r.sincronitzaAvisosPush();
    await buida();
    await r.baixaAvisosPushEnEixir();
    vol.resol({ estat: 'inactiu' });
    await baixa;
    await sincronia;
    expect(a.sincronitza).not.toHaveBeenCalled();
    expect(r.instantaniaAvisosPush()).toMatchObject({ eixint: true, estat: 'inactiu' });
  });

  test('un SDP-PUSH-011 que arriba quan la generació ja ha passat no fa cap baixa (podria desfer el gest de qui ve)', async () => {
    const r = await carrega();
    const resposta = obert();
    const a = adaptadorFals({
      sincronitza: vi.fn(async ({ desa }) => desa({ plataforma: 'web', adreca: ENDPOINT }).then(() => ({ estat: 'actiu' }), () => ({ estat: 'error', error: 'servidor' })))
    });
    r.registraAvisosPush(a);
    const B = servidorFals('B');
    B.desa.mockImplementation(() => resposta.promesa);
    r.fixaServidorAvisosPush(B);
    const sincronia = r.sincronitzaAvisosPush();
    await buida();
    expect(B.desa).toHaveBeenCalledTimes(1);
    r.fixaServidorAvisosPush(servidorFals('C'));
    resposta.rebutja(Object.assign(new Error('aliè'), { code: 'AVISOS_ALIE' }));
    await sincronia;
    expect(a.desactiva).not.toHaveBeenCalled();
    expect(r.instantaniaAvisosPush().estat).toBe('inactiu');
  });

  test('el resultat tardà d’una desactivació d’A no es pinta sobre els avisos de B', async () => {
    const r = await carrega();
    const vol = obert();
    const a = adaptadorFals();
    r.registraAvisosPush(a);
    r.fixaServidorAvisosPush(servidorFals('A'));
    await r.sincronitzaAvisosPush();
    a.desactiva.mockImplementationOnce(() => vol.promesa);
    const apaga = r.desactivaAvisosPush();
    await r.baixaLocalAvisosPushEnEntrar();
    r.fixaServidorAvisosPush(servidorFals('B'));
    await r.sincronitzaAvisosPush();
    expect(r.instantaniaAvisosPush().estat).toBe('actiu');
    vol.resol({ estat: 'error', error: 'subscripcio' });
    await apaga;
    expect(r.instantaniaAvisosPush()).toMatchObject({ estat: 'actiu', error: null });
  });

  test('el resultat tardà de la baixa en eixir d’A (passat el límit) no es pinta sobre els avisos de B', async () => {
    const r = await carrega();
    const vol = obert();
    const a = adaptadorFals();
    a.desactiva.mockImplementationOnce(() => vol.promesa);
    r.registraAvisosPush(a);
    r.fixaServidorAvisosPush(servidorFals('A'));
    await r.baixaAvisosPushEnEixir({ limitMs: 1 });
    await r.baixaLocalAvisosPushEnEntrar();
    r.fixaServidorAvisosPush(servidorFals('B'));
    await r.sincronitzaAvisosPush();
    expect(r.instantaniaAvisosPush().estat).toBe('actiu');
    vol.resol({ estat: 'error', error: 'subscripcio' });
    await buida();
    expect(r.instantaniaAvisosPush()).toMatchObject({ estat: 'actiu', error: null });
  });

  test('el resultat tardà d’una sincronització d’abans d’una entrada explícita no es pinta', async () => {
    const r = await carrega();
    const vol = obert();
    const a = adaptadorFals();
    a.sincronitza.mockImplementationOnce(() => vol.promesa);
    r.registraAvisosPush(a);
    r.fixaServidorAvisosPush(servidorFals('A'));
    const sincronia = r.sincronitzaAvisosPush();
    expect(a.sincronitza).toHaveBeenCalledTimes(1);
    await r.baixaLocalAvisosPushEnEntrar();
    expect(r.instantaniaAvisosPush().estat).toBe('inactiu');
    vol.resol({ estat: 'actiu' });
    await sincronia;
    expect(r.instantaniaAvisosPush().estat).toBe('inactiu');
  });
});

describe('frontera', () => {
  test('(9) per text: no importa res i no nomena el pont natiu, el worker ni cap emmagatzematge', () => {
    const fitxer = 'src/config/avisosPushXat.js';
    const codi = readFileSync(path.join(process.cwd(), fitxer), 'utf8');
    expect(especificadorsImport(codi, fitxer)).toEqual([]);
    expect(codi).not.toMatch(new RegExp(['capa', 'citor'].join(''), 'i'));
    expect(codi).not.toMatch(new RegExp(['service', 'Worker|Push', 'Manager|push', 'Manager'].join('')));
    expect(codi).not.toMatch(new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB'].join(''), 'i'));
  });

  test('(9) el motor només importa la façana, i tampoc nomena el pont natiu, el worker ni cap emmagatzematge', () => {
    const fitxer = 'src/config/motorAvisosPushXat.js';
    const codi = readFileSync(path.join(process.cwd(), fitxer), 'utf8');
    expect(especificadorsImport(codi, fitxer)).toEqual(['./avisosPushXat.js']);
    expect(codi).not.toMatch(new RegExp(['capa', 'citor'].join(''), 'i'));
    expect(codi).not.toMatch(new RegExp(['service', 'Worker|Push', 'Manager|push', 'Manager'].join('')));
    expect(codi).not.toMatch(new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB'].join(''), 'i'));
  });
});

/* Onada R9 · C3 (G8-09) · El temps entre l'arrencada i l'arribada del motor:
   la façana respon el que el registre responia sense adaptador, no pregunta
   res, no perd cap toc ni cap oient i recorda una eixida començada. */
describe('façana sense motor', () => {
  test('sense motor, tot és inert i no rebutja: el que el registre deia sense adaptador', async () => {
    const r = await carregaFacana();
    expect(r.avisosPushDisponibles()).toBe(false);
    expect(r.registraAvisosPush(null)).toBe(false);
    expect(r.instantaniaAvisosPush()).toEqual({
      disponible: false, tipus: null, motiu: null, estat: 'no-disponible',
      error: null, ocupat: false, ambServidor: false, eixint: false
    });
    await expect(r.activaAvisosPush()).resolves.toEqual({ estat: 'no-disponible' });
    await expect(r.desactivaAvisosPush()).resolves.toEqual({ estat: 'no-disponible' });
    await expect(r.sincronitzaAvisosPush()).resolves.toEqual({ estat: 'no-disponible' });
    await expect(r.netejaAvisosPushMostrats()).resolves.toBeUndefined();
    await expect(r.oblidaAvisosPushEnEixir()).resolves.toBeUndefined();
    await expect(r.baixaLocalAvisosPushEnEntrar()).resolves.toBeUndefined();
    /* Sense motor no hi ha on guardar un servidor: es refusa; null sempre s'accepta. */
    expect(r.fixaServidorAvisosPush(servidorFals())).toBe(false);
    expect(r.fixaServidorAvisosPush(null)).toBe(true);
    expect(r.instantaniaAvisosPush().ambServidor).toBe(false);
  });

  test('registrar un adaptador abans del motor llança (l’entrada carrega el motor primer) i no deixa res a mitges', async () => {
    const r = await carregaFacana();
    const a = adaptadorFals();
    expect(() => r.registraAvisosPush(a)).toThrow(/motor/);
    expect(a.escoltaToc).not.toHaveBeenCalled();
    expect(r.avisosPushDisponibles()).toBe(false);
    await import('./motorAvisosPushXat.js');
    expect(r.registraAvisosPush(a)).toBe(true);
    expect(r.avisosPushDisponibles()).toBe(true);
  });

  test('els oients d’abans del motor el veuen arribar (una instantània nova) i després reben els seus canvis', async () => {
    const r = await carregaFacana();
    const oient = vi.fn();
    r.escoltaAvisosPush(oient);
    const abans = r.instantaniaAvisosPush();
    await import('./motorAvisosPushXat.js');
    expect(oient).toHaveBeenCalledTimes(1);
    expect(r.instantaniaAvisosPush()).toEqual(abans);
    r.registraAvisosPush(adaptadorFals());
    expect(oient).toHaveBeenCalledTimes(2);
    expect(r.instantaniaAvisosPush()).toMatchObject({ disponible: true, tipus: 'web', estat: 'inactiu' });
  });

  test('un segon motor no s’endolla i no canvia res', async () => {
    const r = await carrega();
    const enllaca = vi.fn();
    expect(r.connectaMotorAvisosPush({ enllaca })).toBe(false);
    expect(r.connectaMotorAvisosPush(null)).toBe(false);
    expect(enllaca).not.toHaveBeenCalled();
    expect(r.registraAvisosPush(adaptadorFals())).toBe(true);
  });

  test('un oient del toc d’abans del motor rep el toc de l’adaptador, sense dades', async () => {
    const r = await carregaFacana();
    const oient = vi.fn();
    r.escoltaTocAvisPush(oient);
    await import('./motorAvisosPushXat.js');
    const a = adaptadorFals();
    r.registraAvisosPush(a);
    a.toca({ filId: 'fil-secret' });
    expect(oient).toHaveBeenCalledTimes(1);
    expect(oient).toHaveBeenCalledWith({});
  });

  test('una eixida començada abans del motor continua sent eixida: el motor la reprén i un adaptador nou no la desfà', async () => {
    const r = await carregaFacana();
    await expect(r.baixaAvisosPushEnEixir()).resolves.toBeUndefined();
    expect(r.instantaniaAvisosPush().eixint).toBe(true);
    await import('./motorAvisosPushXat.js');
    expect(r.instantaniaAvisosPush().eixint).toBe(true);
    const a = adaptadorFals();
    r.registraAvisosPush(a);
    expect(r.instantaniaAvisosPush()).toMatchObject({ disponible: true, eixint: true });
    await expect(r.sincronitzaAvisosPush()).resolves.toEqual({ estat: 'inactiu' });
    expect(a.sincronitza).not.toHaveBeenCalled();
    /* La sessió ja és fora: null tanca l'eixida, com sempre. */
    expect(r.fixaServidorAvisosPush(null)).toBe(true);
    expect(r.instantaniaAvisosPush().eixint).toBe(false);
  });

  test('sense motor, reprendre o entrar tanquen l’eixida, i el motor arriba sense eixida', async () => {
    const r = await carregaFacana();
    r.baixaAvisosPushEnEixir();
    r.reprenAvisosPushTrasEixidaFallida();
    expect(r.instantaniaAvisosPush().eixint).toBe(false);
    r.baixaAvisosPushEnEixir();
    await r.baixaLocalAvisosPushEnEntrar();
    expect(r.instantaniaAvisosPush().eixint).toBe(false);
    await import('./motorAvisosPushXat.js');
    expect(r.instantaniaAvisosPush().eixint).toBe(false);
  });

  test('(1) amb el motor, activaAvisosPush continua cridant adaptador.activa en el mateix tic a través de la façana', async () => {
    const r = await carregaFacana();
    await import('./motorAvisosPushXat.js');
    const a = adaptadorFals();
    r.registraAvisosPush(a);
    r.fixaServidorAvisosPush(servidorFals());
    let rebut = false;
    a.activa.mockImplementation(() => { rebut = true; return Promise.resolve({ estat: 'actiu' }); });
    const promesa = r.activaAvisosPush();
    expect(rebut).toBe(true);
    await expect(promesa).resolves.toEqual({ estat: 'actiu' });
  });
});
