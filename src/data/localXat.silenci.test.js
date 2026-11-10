import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
/* B8C-2 (marató 261101_2143; Bloc B8) · El silenci de la conversa al magatzem
   local del Xat (localXat, el «servidor» de la llavor i del node local) i, per
   damunt, a l'adaptador local (conversesLocal.js): el mateix silenciatFinsAl
   que escriu xat_silencia, amb la data de finsAlDelSilenci del contracte. I
   el rebuig honest dels avisos push en un node sense servidor (D-B8C-16). */
import { CAPACITATS, SILENCI_SEMPRE, finsAlDelSilenci } from './contracte.js';
import { createLocalXatAdapter, esperaLaIAIA, reiniciaLocalXat } from './localXat.js';
import { configuraBackendSessio, desaSessio, esborraSessio } from './identitat.js';
import { setBackendImplementation, teCapacitat } from './backendPort.js';
import { CAPACITATS_NO_DECLARADES, creaAdaptadorLocal } from './local/adaptadorLocal.js';

const SEED = Object.freeze({ dataMode: 'seed' });
const PERSONA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const xarxa = vi.fn(() => { throw new Error('XARXA_PROHIBIDA'); });
beforeAll(() => { vi.stubGlobal('fetch', xarxa); });
beforeEach(() => { reiniciaLocalXat(); });
afterEach(() => {
  vi.useRealTimers();
  esborraSessio({ abast: 'tot' });
});
afterAll(async () => {
  await esperaLaIAIA();
  reiniciaLocalXat();
  vi.unstubAllGlobals();
  expect(xarxa).not.toHaveBeenCalled();
});

const errorDe = async (promesa) => {
  try { await promesa; } catch (error) { return error; }
  throw new Error('havia de rebutjar');
};
/* Un fil de la llavor on `jo` és participant i que encara no té cap silenci. */
async function unFil(xat, config = SEED) {
  const fil = (await xat.loadFils(config)).find((f) => f.silenciatFinsAl === null);
  expect(fil, 'la llavor porta algun fil sense silenci').toBeTruthy();
  return fil;
}
const silenciDe = async (xat, filId, config = SEED) => (await xat.loadFils(config)).find((f) => f.id === filId)?.silenciatFinsAl;

describe('localXat.silenciaFil', () => {
  test('«8 hores» és la data de finsAlDelSilenci amb el rellotge de l’aparell, i loadFils la torna', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const ara = Date.parse('2026-11-02T03:00:00.000Z');
    vi.setSystemTime(ara);
    const xat = createLocalXatAdapter();
    const fil = await unFil(xat);
    expect(await xat.silenciaFil(fil.id, '8h', SEED)).toEqual({ silenciatFinsAl: '2026-11-02T11:00:00.000Z' });
    expect(finsAlDelSilenci('8h', ara)).toBe('2026-11-02T11:00:00.000Z');
    expect(await silenciDe(xat, fil.id)).toBe('2026-11-02T11:00:00.000Z');
  });

  test('«1 setmana» dins de la tolerància, «sempre» és SILENCI_SEMPRE i «cap» el desfà', async () => {
    const xat = createLocalXatAdapter();
    const fil = await unFil(xat);
    const abans = Date.now();
    const { silenciatFinsAl } = await xat.silenciaFil(fil.id, '1setmana', SEED);
    const setmana = 7 * 24 * 3600000;
    expect(Date.parse(silenciatFinsAl)).toBeGreaterThanOrEqual(abans + setmana);
    expect(Date.parse(silenciatFinsAl)).toBeLessThanOrEqual(Date.now() + setmana);
    expect(await xat.silenciaFil(fil.id, 'sempre', SEED)).toEqual({ silenciatFinsAl: SILENCI_SEMPRE });
    expect(await silenciDe(xat, fil.id)).toBe(SILENCI_SEMPRE);
    expect(await xat.silenciaFil(fil.id, 'cap', SEED)).toEqual({ silenciatFinsAl: null });
    expect(await silenciDe(xat, fil.id)).toBeNull();
  });

  test('una durada desconeguda rebutja amb SILENCI_INVALID abans de tocar res', async () => {
    const xat = createLocalXatAdapter();
    const fil = await unFil(xat);
    await xat.silenciaFil(fil.id, 'sempre', SEED);
    for (const durada of ['una-hora', 'infinity', null, undefined, '']) {
      expect(await errorDe(xat.silenciaFil(fil.id, durada, SEED)), String(durada)).toMatchObject({ code: 'SILENCI_INVALID' });
    }
    expect(await silenciDe(xat, fil.id)).toBe(SILENCI_SEMPRE);
  });

  test('un fil que no existix o on no pintes res: XAT_NO_PARTICIPANT, i el silenci no és de ningú més', async () => {
    const xat = createLocalXatAdapter();
    for (const filId of ['fil-que-no-existix', '', null, 7]) {
      expect(await errorDe(xat.silenciaFil(filId, '8h', SEED)), String(filId)).toMatchObject({ code: 'XAT_NO_PARTICIPANT', retriable: false });
    }
    // El silenci de la persona de la sessió no canvia la llista d'una altra.
    const fil = await unFil(xat);
    await xat.silenciaFil(fil.id, 'sempre', SEED);
    configuraBackendSessio({ backendId: 'sdp-local', ...SEED });
    expect(desaSessio({ access_token: 'testimoni-opac-local', user: { id: PERSONA, email: 'proves@poble.invalid' } })).toBe(true);
    const altres = await xat.loadFils(SEED);
    expect(altres.filter((f) => f.silenciatFinsAl !== null)).toEqual([]);
  });
});

describe('l’adaptador local (conversesLocal)', () => {
  test('silenciaFil({ filId, durada }) passa pel magatzem i torna una còpia; una entrada invàlida rebutja amb el seu code', async () => {
    const a = creaAdaptadorLocal({ mode: 'seed' });
    try {
      const fil = (await a.loadFils({})).find((f) => !f.perDefecte && f.silenciatFinsAl === null);
      expect(fil).toBeTruthy();
      expect(await a.silenciaFil({ filId: fil.id, durada: 'sempre' }, {})).toEqual({ silenciatFinsAl: SILENCI_SEMPRE });
      expect((await a.loadFils({})).find((f) => f.id === fil.id).silenciatFinsAl).toBe(SILENCI_SEMPRE);
      expect(await a.silenciaFil({ filId: fil.id, durada: 'cap' }, {})).toEqual({ silenciatFinsAl: null });
      expect(await errorDe(a.silenciaFil({ filId: fil.id, durada: 'una-hora' }, {}))).toMatchObject({ code: 'SILENCI_INVALID' });
      expect(await errorDe(a.silenciaFil(null, {}))).toMatchObject({ code: 'SILENCI_INVALID' });
      expect(await errorDe(a.silenciaFil({ filId: 'fil-que-no-existix', durada: '8h' }, {}))).toMatchObject({ code: 'XAT_NO_PARTICIPANT' });
    } finally {
      await a.destroy();
    }
  });

  test('ARB-B8C2-03 · una fila d’ajuda, un fil en blanc o que no és text: SILENCI_INVALID, com l’adaptador Supabase, i el magatzem no canvia', async () => {
    const a = creaAdaptadorLocal({ mode: 'seed' });
    try {
      const fils = await a.loadFils({});
      const ajuda = fils.find((f) => f.perDefecte);
      expect(ajuda?.id, 'la llista local porta files d’ajuda').toMatch(/^sdp-per-defecte:/);
      const abans = JSON.stringify(fils.map((f) => [f.id, f.silenciatFinsAl]));
      for (const filId of [ajuda.id, 'sdp-per-defecte:conformitat', '', '   ', null, undefined, 7, { id: ajuda.id }]) {
        const error = await errorDe(a.silenciaFil({ filId, durada: '8h' }, {}));
        expect(error, String(filId)).toMatchObject({ code: 'SILENCI_INVALID', codi: 'SILENCI_INVALID', retriable: false });
      }
      expect(await errorDe(a.silenciaFil({ filId: ajuda.id, durada: 'una-hora' }, {}))).toMatchObject({ code: 'SILENCI_INVALID' });
      expect(JSON.stringify((await a.loadFils({})).map((f) => [f.id, f.silenciatFinsAl]))).toBe(abans);
    } finally {
      await a.destroy();
    }
  });

  test('avisos push sense servidor: la capacitat hi és i cada mètode rebutja amb NO-DISPONIBLE (D-B8C-16)', async () => {
    const a = creaAdaptadorLocal({ mode: 'local' });
    try {
      for (const nom of CAPACITATS.avisosPush) {
        const error = await errorDe(a[nom]({ plataforma: 'web', adreca: 'https://fcm.googleapis.com/fcm/send/x', gest: true }, {}));
        expect(error, nom).toMatchObject({ code: 'NO-DISPONIBLE', codi: 'NO-DISPONIBLE' });
      }
      setBackendImplementation(a);
      expect(teCapacitat('avisosPush')).toBe(true);
      expect(teCapacitat('silenciXat')).toBe(true);
      // R15 i R54 incorporen grups de servidor; el node local no els declara.
      // Les capacitats locals prèvies, push i silenci incloses, es conserven.
      expect(CAPACITATS_NO_DECLARADES).toEqual(['administracioSessions','curadoriaCultural','iaia','xatRitme','importacioPaquetMunicipal','verificacioCorreu','recuperacioCorreu']);
      const absents = Object.keys(CAPACITATS).filter(cap => CAPACITATS[cap].every(metode => typeof a[metode] !== 'function'));
      expect(absents).toEqual(CAPACITATS_NO_DECLARADES);
      expect(Object.keys(CAPACITATS)).toHaveLength(51);
    } finally {
      await a.destroy();
    }
  });
});
