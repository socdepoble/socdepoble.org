import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { buidaSessioLliure, creaTraductorApertium } from './traductorLliure.js';
import { CODI_TRADUCCIO, creaTraductor, exigixTraduccioPublica, tradueixTot } from './traductor.js';

beforeEach(() => buidaSessioLliure());
afterEach(() => vi.unstubAllGlobals());
const doble = () => {
  const fetch = vi.fn(async (url, options) => {
    const q = options.body?.get('q') ?? new URL(url).searchParams.get('q');
    return { status: 200, ok: true, json: async () => ({
      responseStatus: 200, responseData: { translatedText: `TRAD ${q}` },
      matches: [{ 'created-by': 'MT!', segment: q, translation: `TRAD ${q}` }],
    }) };
  });
  return { fetch, traductor: creaTraductorApertium({ fetch, ara: () => 1794132000000 }) };
};

test.each(['ES', 'EU'])('R56 · %s: curated es rebutja abans del transport i d’un resultat ja en cau', async desti => {
  const { fetch, traductor } = doble();
  await traductor.tradueix(['CONTROL'], desti);
  expect(fetch).toHaveBeenCalledTimes(1);
  fetch.mockClear();
  await expect(traductor.tradueix(['CONTROL'], desti, { translation_mode: 'curated_5_langs' }))
    .rejects.toMatchObject({ codi: CODI_TRADUCCIO.NO_DISPONIBLE });
  expect(fetch).not.toHaveBeenCalled();
});

test.each(['none', 'auto', 'CURATED_5_LANGS', 17])('R56 · el mode declarat %s no autoritza traducció automàtica', async translation_mode => {
  const { fetch, traductor } = doble();
  await expect(traductor.tradueix(['CONTROL'], 'ES', { translation_mode }))
    .rejects.toMatchObject({ codi: CODI_TRADUCCIO.NO_DISPONIBLE });
  expect(fetch).not.toHaveBeenCalled();
});

test('R56 · tradueixTot i els objectes de targeta respecten la mateixa guarda abans del motor', async () => {
  const traductor = { disponible: true, tradueix: vi.fn() };
  await expect(tradueixTot(traductor, ['CONTROL'], 'ES', { translation_mode: 'curated_5_langs' }))
    .rejects.toMatchObject({ codi: CODI_TRADUCCIO.NO_DISPONIBLE });
  expect(traductor.tradueix).not.toHaveBeenCalled();
  expect(() => exigixTraduccioPublica([{ title: 'CONTROL', translation_mode: 'curated_5_langs' }]))
    .toThrow(expect.objectContaining({ codi: CODI_TRADUCCIO.NO_DISPONIBLE }));
});

test('R56 · una propietat de mode amb getter falla tancada i no l’executa', () => {
  const get = vi.fn(() => 'on_the_fly');
  const context = Object.defineProperty({}, 'translation_mode', { get });
  expect(() => exigixTraduccioPublica(['CONTROL'], context)).toThrow();
  expect(get).not.toHaveBeenCalled();
});

test.each([undefined, null, 'on_the_fly'])('R56 · mode %s conserva el transport explícit de sempre', async translation_mode => {
  const { fetch, traductor } = doble();
  expect((await traductor.tradueix(['CONTROL'], 'ES', { translation_mode })).traduccions).toEqual(['TRAD CONTROL']);
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('R56 · un mode automàtic no desactiva la guarda de privadesa', async () => {
  const { fetch, traductor } = doble();
  await expect(traductor.tradueix(['CONTROL'], 'EU', { translation_mode: 'on_the_fly', e2ee: true }))
    .rejects.toMatchObject({ codi: CODI_TRADUCCIO.NO_DISPONIBLE });
  expect(fetch).not.toHaveBeenCalled();
});

test('R56 · el servei de l’amfitrió compartix la prohibició curated abans de fer fetch', async () => {
  const fetch = vi.fn(() => { throw Error('TRANSPORT_NO_AUTORITZAT'); });
  vi.stubGlobal('fetch', fetch);
  const traductor = creaTraductor({ url: '/wp-json/socdepoble/v1/traduir' });
  await expect(traductor.tradueix(['CONTROL'], 'ES', { translation_mode: 'curated_5_langs' }))
    .rejects.toMatchObject({ codi: CODI_TRADUCCIO.NO_DISPONIBLE });
  expect(fetch).not.toHaveBeenCalled();
});


test.each(['none', 'curated_5_langs', 'auto', 'CURATED_5_LANGS', 17])('GF6 · mode heretat %s es refusa abans de pressupost, cau o transport', async translation_mode => {
  const { fetch, traductor } = doble();
  const inherited = Object.create({ translation_mode });
  await expect(traductor.tradueix(['CONTROL'], 'ES', inherited)).rejects.toMatchObject({ codi: CODI_TRADUCCIO.NO_DISPONIBLE });
  expect(fetch).not.toHaveBeenCalled();
  const motor = { comprovaPagina: vi.fn(), tradueix: vi.fn() };
  await expect(tradueixTot(motor, ['CONTROL'], 'ES', inherited)).rejects.toMatchObject({ codi: CODI_TRADUCCIO.NO_DISPONIBLE });
  expect(motor.comprovaPagina).not.toHaveBeenCalled(); expect(motor.tradueix).not.toHaveBeenCalled();
  expect(() => exigixTraduccioPublica([Object.assign(Object.create({ translation_mode }), { text: 'CONTROL' })])).toThrow();
});

test.each(['none', 'curated_5_langs'])('GF6 · un resultat calent no evita el veto heretat %s', async translation_mode => {
  const { fetch, traductor } = doble(); await traductor.tradueix(['CONTROL'], 'ES');
  expect(fetch).toHaveBeenCalledTimes(1); fetch.mockClear();
  await expect(traductor.tradueix(['CONTROL'], 'ES', Object.create({ translation_mode })))
    .rejects.toMatchObject({ codi: CODI_TRADUCCIO.NO_DISPONIBLE });
  expect(fetch).not.toHaveBeenCalled();
});

test.each(['get', 'set'])('GF6 · un accessor heretat de mode (%s) falla tancat sense invocar-lo', async tipus => {
  const accessor = vi.fn(() => 'on_the_fly');
  const prototype = Object.defineProperty({}, 'translation_mode', { [tipus]: accessor });
  const { fetch, traductor } = doble();
  await expect(traductor.tradueix(['CONTROL'], 'ES', Object.create(prototype)))
    .rejects.toMatchObject({ codi: CODI_TRADUCCIO.NO_DISPONIBLE });
  expect(accessor).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
});

test('GF6 · un mode prohibit es refusa abans de qualsevol getter de metadades', async () => {
  const getter = vi.fn(() => false);
  const context = Object.defineProperty(Object.create({ translation_mode: 'none' }), 'e2ee', { get: getter });
  const { fetch, traductor } = doble();
  await expect(traductor.tradueix(['CONTROL'], 'ES', context)).rejects.toMatchObject({ codi: CODI_TRADUCCIO.NO_DISPONIBLE });
  expect(getter).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
});

test.each([undefined, null, 'on_the_fly'])('GF6 · dada heretada %s conserva el contracte anterior', async translation_mode => {
  const { fetch, traductor } = doble();
  expect((await traductor.tradueix(['CONTROL'], 'ES', Object.create({ translation_mode }))).traduccions).toEqual(['TRAD CONTROL']);
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('GF6 · una dada pròpia explícita preval sobre l’accessor del prototip sense invocar-lo', async () => {
  const getter = vi.fn(() => 'none');
  const inherited = Object.create(Object.defineProperty({}, 'translation_mode', { get: getter }));
  Object.defineProperty(inherited, 'translation_mode', { value: 'on_the_fly' });
  const { fetch, traductor } = doble();
  expect((await traductor.tradueix(['CONTROL'], 'ES', inherited)).traduccions).toEqual(['TRAD CONTROL']);
  expect(getter).not.toHaveBeenCalled(); expect(fetch).toHaveBeenCalledTimes(1);
});


test('GF6 · modes dels elements també precedixen getters de metadades del context', () => {
  const getter = vi.fn(() => false);
  const context = Object.defineProperty({}, 'e2ee', { get: getter });
  const element = Object.assign(Object.create({ translation_mode: 'curated_5_langs' }), { text: 'CONTROL' });
  expect(() => exigixTraduccioPublica([element], context)).toThrow(expect.objectContaining({ codi: CODI_TRADUCCIO.NO_DISPONIBLE }));
  expect(getter).not.toHaveBeenCalled();
});
