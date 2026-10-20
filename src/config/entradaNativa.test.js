/* Fase D (261020, tasca 1) · El registre de l'entrada nativa (entradaNativa.js):
   pur, immutable un cop registrat, neutral de política (només l'ordre i la regla
   d'iOS de l'App Store 4.8) i una sola entrada alhora. Cada cas carrega un mòdul
   nou: el registre és d'estat de mòdul. Tot és sintètic. */
import { afterEach, describe, expect, test, vi } from 'vitest';

const carrega = async () => {
  vi.resetModules();
  return import('./entradaNativa.js');
};
const adaptador = (plataforma, proveidors, extra = {}) => ({
  plataforma, proveidors, demana: vi.fn(async () => ({ testimoni: 'a.b.c', nonce: 'n'.repeat(64) })), ...extra
});
const promesaOberta = () => {
  let resol;
  let rebutja;
  const promesa = new Promise((r, j) => { resol = r; rebutja = j; });
  return { promesa, resol, rebutja };
};

afterEach(() => { vi.useRealTimers(); });

describe('sense registrar (la web, la PWA, el connector)', () => {
  test('la plataforma és web, no hi ha botons i demanar diu NO_DISPONIBLE', async () => {
    const r = await carrega();
    expect(r.plataformaNativa()).toBe('web');
    expect(r.botonsNatius()).toEqual([]);
    await expect(r.demanaCredencialNativa('apple')).rejects.toMatchObject({ code: r.CODI_ENTRADA_NATIVA.NO_DISPONIBLE });
    expect(r.registraEntradaNativa(null)).toBeNull();
    expect(r.registraEntradaNativa(undefined)).toBeNull();
    expect(r.plataformaNativa()).toBe('web');
    expect(() => r.oblidaCredencialNativa('apple')).not.toThrow();
  });

  test('els codis i els proveïdors són congelats i únics', async () => {
    const r = await carrega();
    expect(Object.isFrozen(r.CODI_ENTRADA_NATIVA) && Object.isFrozen(r.PROVEIDORS_NATIUS)).toBe(true);
    expect(r.PROVEIDORS_NATIUS).toEqual(['apple', 'google']);
    expect(new Set(Object.values(r.CODI_ENTRADA_NATIVA)).size).toBe(4);
  });
});

describe('registrar', () => {
  test.each([
    ['una plataforma desconeguda', { plataforma: 'web', proveidors: [], demana: async () => ({}) }],
    ['un proveïdor desconegut', { plataforma: 'ios', proveidors: ['apple', 'facebook'], demana: async () => ({}) }],
    ['proveïdors que no són llista', { plataforma: 'ios', proveidors: 'apple', demana: async () => ({}) }],
    ['sense demana()', { plataforma: 'ios', proveidors: ['apple'] }],
    ['un oblida que no és funció', { plataforma: 'ios', proveidors: ['apple'], demana: async () => ({}), oblida: 'no' }]
  ])('%s llança TypeError i no registra res', async (_cas, dolent) => {
    const r = await carrega();
    expect(() => r.registraEntradaNativa(dolent)).toThrow(TypeError);
    expect(r.plataformaNativa()).toBe('web');
  });

  test('és immutable: el mateix adaptador torna la plataforma, un altre llança', async () => {
    const r = await carrega();
    const a = adaptador('ios', ['apple']);
    expect(r.registraEntradaNativa(a)).toBe('ios');
    expect(r.registraEntradaNativa(a)).toBe('ios');
    expect(() => r.registraEntradaNativa(adaptador('android', ['google']))).toThrow('immutable');
    expect(r.plataformaNativa()).toBe('ios');
    expect(Object.isFrozen(r.botonsNatius())).toBe(true);
  });

  test.each([
    ['ios', ['google', 'apple'], ['apple', 'google']],
    ['ios', ['apple'], ['apple']],
    // App Store 4.8: a iOS, Google només amb Apple.
    ['ios', ['google'], []],
    ['android', ['apple', 'google'], ['google', 'apple']],
    ['android', ['google'], ['google']],
    ['android', [], []]
  ])('%s amb %j pinta %j', async (plataforma, proveidors, botons) => {
    const r = await carrega();
    r.registraEntradaNativa(adaptador(plataforma, proveidors));
    expect(r.botonsNatius()).toEqual(botons);
  });
});

describe('demanaCredencialNativa', () => {
  test('torna la credencial neta i congelada; un proveïdor sense botó diu NO_DISPONIBLE sense cridar l’adaptador', async () => {
    const r = await carrega();
    const a = adaptador('ios', ['apple'], {
      demana: vi.fn(async () => ({ testimoni: '  a.b.c ', nonce: ' cru ', testimoniAcces: '', nom: '  Na Maria ' }))
    });
    r.registraEntradaNativa(a);
    const credencial = await r.demanaCredencialNativa('apple');
    expect(credencial).toEqual({ testimoni: 'a.b.c', nonce: 'cru', testimoniAcces: null, nom: 'Na Maria' });
    expect(Object.isFrozen(credencial)).toBe(true);
    expect(a.demana).toHaveBeenCalledWith('apple', { viu: expect.any(Function) });
    await expect(r.demanaCredencialNativa('google')).rejects.toMatchObject({ code: r.CODI_ENTRADA_NATIVA.NO_DISPONIBLE });
    expect(a.demana).toHaveBeenCalledTimes(1);
  });

  test('la cancel·lació passa tal qual; qualsevol altre error és FALLIDA amb la causa; sense testimoni, FALLIDA', async () => {
    const r = await carrega();
    const cancelada = Object.assign(new Error('tancat'), { code: r.CODI_ENTRADA_NATIVA.CANCELADA });
    const crua = new Error('ASAuthorizationError 1000');
    const a = adaptador('android', ['google'], {
      demana: vi.fn()
        .mockRejectedValueOnce(cancelada)
        .mockRejectedValueOnce(crua)
        .mockResolvedValueOnce({ testimoni: '   ', nonce: 'x' })
        .mockResolvedValueOnce(null)
    });
    r.registraEntradaNativa(a);
    await expect(r.demanaCredencialNativa('google')).rejects.toBe(cancelada);
    await expect(r.demanaCredencialNativa('google')).rejects.toMatchObject({ code: r.CODI_ENTRADA_NATIVA.FALLIDA, cause: crua });
    await expect(r.demanaCredencialNativa('google')).rejects.toMatchObject({ code: r.CODI_ENTRADA_NATIVA.FALLIDA });
    await expect(r.demanaCredencialNativa('google')).rejects.toMatchObject({ code: r.CODI_ENTRADA_NATIVA.FALLIDA });
    expect(r.esCancelacioNativa(cancelada) && r.esSilenciNatiu(cancelada)).toBe(true);
    expect(r.esSilenciNatiu(crua)).toBe(false);
  });

  /* Fase D (261020, revisió) · EN_CURS ja no és silenci: la vista l'avisa. */
  test('un altre proveïdor mentre la primera espera rebutja amb EN_CURS (que ja no és silenci); acabada la primera, se’n pot demanar una altra', async () => {
    const r = await carrega();
    const full = promesaOberta();
    const a = adaptador('ios', ['apple', 'google'], { demana: vi.fn(() => full.promesa) });
    r.registraEntradaNativa(a);
    const primera = r.demanaCredencialNativa('apple');
    const segona = r.demanaCredencialNativa('google');
    await expect(segona).rejects.toMatchObject({ code: r.CODI_ENTRADA_NATIVA.EN_CURS });
    expect(r.esSilenciNatiu(await segona.catch((e) => e))).toBe(false);
    expect(a.demana).toHaveBeenCalledTimes(1);
    full.resol({ testimoni: 'a.b.c' });
    await expect(primera).resolves.toMatchObject({ testimoni: 'a.b.c' });
    a.demana.mockResolvedValueOnce({ testimoni: 'd.e.f' });
    await expect(r.demanaCredencialNativa('google')).resolves.toMatchObject({ testimoni: 'd.e.f' });
  });

  test('el mateix proveïdor amb la fase 1 en curs s’hi suma: un sol full, la mateixa credencial per a tots dos', async () => {
    const r = await carrega();
    const full = promesaOberta();
    const a = adaptador('ios', ['apple', 'google'], { demana: vi.fn(() => full.promesa) });
    r.registraEntradaNativa(a);
    const primera = r.demanaCredencialNativa('apple');
    const segona = r.demanaCredencialNativa('apple');
    await Promise.resolve();
    expect(a.demana).toHaveBeenCalledTimes(1);
    full.resol({ testimoni: 'a.b.c' });
    const [c1, c2] = await Promise.all([primera, segona]);
    expect(c1).toBe(c2);
    expect(c1).toMatchObject({ testimoni: 'a.b.c' });
  });

  test('l’adaptador rep viu(): «algú encara l’espera», també el que s’hi suma', async () => {
    const r = await carrega();
    const full = promesaOberta();
    const a = adaptador('ios', ['apple'], { demana: vi.fn(() => full.promesa) });
    r.registraEntradaNativa(a);
    let primerViu = true;
    let segonViu = false;
    const primera = r.demanaCredencialNativa('apple', { viu: () => primerViu });
    await Promise.resolve();
    const [[, { viu }]] = a.demana.mock.calls;
    expect(viu()).toBe(true);
    primerViu = false;
    expect(viu()).toBe(false);
    const segona = r.demanaCredencialNativa('apple', { viu: () => segonViu });
    segonViu = true;
    expect(viu()).toBe(true);
    full.resol({ testimoni: 'a.b.c' });
    await expect(Promise.all([primera, segona])).resolves.toHaveLength(2);
  });

  test('abandonaCredencialNativa: viu() fals, l’altre proveïdor arriba a l’adaptador i una tornada tardana no allibera la nova', async () => {
    const r = await carrega();
    const penjat = promesaOberta();
    const segon = promesaOberta();
    const a = adaptador('ios', ['apple', 'google'], {
      demana: vi.fn().mockReturnValueOnce(penjat.promesa).mockReturnValueOnce(segon.promesa)
    });
    r.registraEntradaNativa(a);
    expect(() => r.abandonaCredencialNativa()).not.toThrow();   // sense cap en curs, res
    const primera = r.demanaCredencialNativa('google');
    await Promise.resolve();
    const [[, { viu }]] = a.demana.mock.calls;
    expect(viu()).toBe(true);
    r.abandonaCredencialNativa();
    expect(viu()).toBe(false);
    const segona = r.demanaCredencialNativa('apple');
    await Promise.resolve();
    expect(a.demana).toHaveBeenCalledTimes(2);
    expect(a.demana.mock.calls[1][0]).toBe('apple');
    // El full abandonat torna tard: el pany de la nova continua.
    penjat.resol({ testimoni: 'tard.b.c' });
    await expect(primera).resolves.toMatchObject({ testimoni: 'tard.b.c' });
    await expect(r.demanaCredencialNativa('google')).rejects.toMatchObject({ code: r.CODI_ENTRADA_NATIVA.EN_CURS });
    expect(a.demana).toHaveBeenCalledTimes(2);
    segon.resol({ testimoni: 'd.e.f' });
    await expect(segona).resolves.toMatchObject({ testimoni: 'd.e.f' });
  });

  test('abandonada, el mateix proveïdor s’hi torna a sumar (el full que ve és seu) i viu() torna a ser cert', async () => {
    const r = await carrega();
    const full = promesaOberta();
    const a = adaptador('android', ['google'], { demana: vi.fn(() => full.promesa) });
    r.registraEntradaNativa(a);
    const primera = r.demanaCredencialNativa('google');
    await Promise.resolve();
    const [[, { viu }]] = a.demana.mock.calls;
    r.abandonaCredencialNativa();
    expect(viu()).toBe(false);
    const segona = r.demanaCredencialNativa('google');
    expect(viu()).toBe(true);
    expect(a.demana).toHaveBeenCalledTimes(1);
    full.resol({ testimoni: 'a.b.c' });
    await expect(segona).resolves.toMatchObject({ testimoni: 'a.b.c' });
    await expect(primera).resolves.toMatchObject({ testimoni: 'a.b.c' });
  });

  test('espera l’oblit pendent abans d’obrir el full següent; els errors de l’oblit no surten mai', async () => {
    const r = await carrega();
    const oblit = promesaOberta();
    const a = adaptador('android', ['google'], { oblida: vi.fn(() => oblit.promesa) });
    r.registraEntradaNativa(a);
    r.oblidaCredencialNativa('google');
    const demanada = r.demanaCredencialNativa('google');
    await Promise.resolve();
    expect(a.demana).not.toHaveBeenCalled();
    oblit.rebutja(new Error('clearCredentialState'));
    await expect(demanada).resolves.toMatchObject({ testimoni: 'a.b.c' });
    expect(a.oblida.mock.invocationCallOrder[0]).toBeLessThan(a.demana.mock.invocationCallOrder[0]);
  });

  test('un oblit que no torna mai: el full s’obri igualment passats 3 s, i no queda cap temporitzador', async () => {
    vi.useFakeTimers();
    const r = await carrega();
    const a = adaptador('ios', ['apple'], { oblida: vi.fn(() => new Promise(() => {})) });
    r.registraEntradaNativa(a);
    r.oblidaCredencialNativa('apple');
    const demanada = r.demanaCredencialNativa('apple');
    await vi.advanceTimersByTimeAsync(2999);
    expect(a.demana).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await expect(demanada).resolves.toMatchObject({ testimoni: 'a.b.c' });
    expect(vi.getTimerCount()).toBe(0);
  });

  test('un oblida que llança en sincronia, o cap oblida, no fan res', async () => {
    const r = await carrega();
    r.registraEntradaNativa(adaptador('ios', ['apple'], { oblida: () => { throw new Error('sincron'); } }));
    expect(() => r.oblidaCredencialNativa('apple')).not.toThrow();
    await expect(r.demanaCredencialNativa('apple')).resolves.toMatchObject({ testimoni: 'a.b.c' });
    const s = await carrega();
    s.registraEntradaNativa(adaptador('ios', ['apple']));
    expect(() => s.oblidaCredencialNativa('apple')).not.toThrow();
    await expect(s.demanaCredencialNativa('apple')).resolves.toMatchObject({ testimoni: 'a.b.c' });
  });

  test('l’adaptador rep la crida amb ell mateix de this', async () => {
    const r = await carrega();
    const a = {
      plataforma: 'ios', proveidors: ['apple'], marca: 'propi',
      async demana() { return { testimoni: `${this.marca}.b.c` }; }
    };
    r.registraEntradaNativa(a);
    await expect(r.demanaCredencialNativa('apple')).resolves.toMatchObject({ testimoni: 'propi.b.c' });
  });
});
