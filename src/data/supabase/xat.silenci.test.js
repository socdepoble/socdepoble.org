import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
/* B8C-2 (marató 261101_2143; Bloc B8) · silenciaFil de l'adaptador Supabase
   (capacitat 'silenciXat') contra el contracte de B8-SERVIDOR §2.9:
   xat_silencia(p_fil_id uuid, p_durada text) returns timestamptz, amb la data
   de fi del rellotge del servidor. En remot, un supabase-js de mentida (com
   conformitat.test.js) que anota cada RPC; en llavor, el magatzem local de
   debò (localXat). */
import { DURADES_SILENCI, SILENCI_SEMPRE, finsAlDelSilenci } from '../contracte.js';
import { esSilenciat } from '../../sections/xat/missatges.js';
import { reiniciaLocalXat } from '../localXat.js';

const servidor = vi.hoisted(() => ({ client: null }));
vi.mock('./config.js', async (original) => ({ ...(await original()), getClient: async () => servidor.client }));

const { loadFils, reiniciaMemoriaSilenci, silenciaFil } = await import('./xat.js');

const FIL = '3f405162-7c8d-4e9f-a0b1-c2d3e4f5a6b7';
const REMOT = Object.freeze({ dataMode: 'remote', supabaseUrl: 'https://silenci.supabase.test', supabaseAnonKey: 'sb_publishable_de_proves', tenantId: '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7' });
const SEED = Object.freeze({ dataMode: 'seed' });
const ARA = Date.parse('2026-11-02T03:00:00.000Z');

/* Una consulta de PostgrestBuilder: es pot esperar i porta abortSignal(). */
const consulta = (resultat) => Object.assign(Promise.resolve(resultat), { abortSignal() { return this; } });
let crides;
let respon;
beforeEach(() => {
  crides = [];
  respon = ({ p_durada: durada }) => ({ data: durada === 'cap' ? null : '2026-11-02T11:00:00+00:00', error: null, status: 200 });
  servidor.client = { rpc(nom, parametres) { crides.push([nom, parametres]); return consulta(respon(parametres)); } };
  reiniciaLocalXat();
  reiniciaMemoriaSilenci();
});
afterEach(() => {
  vi.useRealTimers();
  reiniciaLocalXat();
  reiniciaMemoriaSilenci();
});

const errorDe = async (promesa) => {
  try { await promesa; } catch (error) { return error; }
  throw new Error('havia de rebutjar');
};

describe('abans de cap petició', () => {
  test('una durada fora de DURADES_SILENCI: SILENCI_INVALID, en remot i en llavor, sense cap RPC', async () => {
    for (const durada of ['una-hora', '8H', 'infinity', '', null, undefined, 8, 'constructor', ['8h']]) {
      for (const config of [REMOT, SEED]) {
        const error = await errorDe(silenciaFil({ filId: FIL, durada }, config));
        expect(error, `${JSON.stringify(durada)} ${config.dataMode}`).toMatchObject({ code: 'SILENCI_INVALID', retriable: false });
      }
    }
    expect(crides).toEqual([]);
  });

  test('un fil que no és cap text o que és una fila d’ajuda: SILENCI_INVALID; en remot, també un fil que no és UUID', async () => {
    for (const filId of [undefined, null, '', '   ', 7, { id: FIL }, 'sdp-per-defecte:iaia']) {
      for (const config of [REMOT, SEED]) {
        expect(await errorDe(silenciaFil({ filId, durada: '8h' }, config)), String(filId)).toMatchObject({ code: 'SILENCI_INVALID' });
      }
    }
    for (const filId of ['fake-javi', 'iaia', `${FIL}x`, FIL.replaceAll('-', '')]) {
      expect(await errorDe(silenciaFil({ filId, durada: '8h' }, REMOT)), filId).toMatchObject({ code: 'SILENCI_INVALID' });
    }
    expect(await errorDe(silenciaFil(null, REMOT))).toMatchObject({ code: 'SILENCI_INVALID' });
    expect(await errorDe(silenciaFil(undefined, REMOT))).toMatchObject({ code: 'SILENCI_INVALID' });
    expect(crides).toEqual([]);
  });

  test('amb el senyal ja avortat: AbortError i cap RPC', async () => {
    const control = new AbortController();
    control.abort();
    expect(await errorDe(silenciaFil({ filId: FIL, durada: '8h' }, { ...REMOT, signal: control.signal }))).toMatchObject({ name: 'AbortError' });
    expect(crides).toEqual([]);
  });
});

describe('en remot, el contracte de B8-SERVIDOR §2.9', () => {
  test('el cos és exactament { p_fil_id, p_durada }, per a cada durada, i la interfície mai no envia cap data', async () => {
    for (const durada of DURADES_SILENCI) await silenciaFil({ filId: FIL, durada, fins: '2030-01-01', extra: 1 }, REMOT);
    expect(crides).toEqual(DURADES_SILENCI.map((durada) => ['xat_silencia', { p_fil_id: FIL, p_durada: durada }]));
  });

  test('la data del servidor es conserva tal qual; «sempre» (9999-12-31 00:00 UTC) es llig com a silenciada', async () => {
    respon = () => ({ data: '9999-12-31T00:00:00+00:00', error: null, status: 200 });
    const sempre = await silenciaFil({ filId: FIL, durada: 'sempre' }, REMOT);
    expect(sempre).toEqual({ silenciatFinsAl: '9999-12-31T00:00:00+00:00' });
    expect(esSilenciat(sempre.silenciatFinsAl)).toBe(true);
    expect(Date.parse(sempre.silenciatFinsAl)).toBe(Date.parse(SILENCI_SEMPRE));
    respon = () => ({ data: '2026-11-02T11:00:00.123456+00:00', error: null, status: 200 });
    expect(await silenciaFil({ filId: FIL, durada: '8h' }, REMOT)).toEqual({ silenciatFinsAl: '2026-11-02T11:00:00.123456+00:00' });
    respon = () => ({ data: null, error: null, status: 200 });
    expect(await silenciaFil({ filId: FIL, durada: 'cap' }, REMOT)).toEqual({ silenciatFinsAl: null });
  });

  test('una resposta il·legible (fora de contracte, però desada): la mateixa durada amb el rellotge de l’aparell; «cap», null', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(ARA);
    /* ARB-B8C2-04 · Una data que Date.parse sí que llig però que no és cap
       timestamptz (Date#toString, més de 40 caràcters): només la para el topall. */
    const llarga = new Date('2026-11-02T11:00:00Z').toString();
    expect(llarga.length).toBeGreaterThan(40);
    expect(Number.isNaN(Date.parse(llarga))).toBe(false);
    for (const data of [null, 'no és cap data', 42, { fins: 'x' }, llarga, 'infinity']) {
      respon = () => ({ data, error: null, status: 200 });
      expect(await silenciaFil({ filId: FIL, durada: '8h' }, REMOT), JSON.stringify(data)).toEqual({ silenciatFinsAl: finsAlDelSilenci('8h', ARA) });
      expect(await silenciaFil({ filId: FIL, durada: 'sempre' }, REMOT)).toEqual({ silenciatFinsAl: SILENCI_SEMPRE });
      expect(await silenciaFil({ filId: FIL, durada: 'cap' }, REMOT)).toEqual({ silenciatFinsAl: null });
    }
    expect(finsAlDelSilenci('8h', ARA)).toBe('2026-11-02T11:00:00.000Z');
  });

  test('sense la RPC (404 o PGRST202): NO-DISPONIBLE', async () => {
    respon = () => ({ data: null, error: { code: 'PGRST202', message: 'Could not find the function public.xat_silencia(p_durada, p_fil_id)' }, status: 404 });
    expect(await errorDe(silenciaFil({ filId: FIL, durada: '8h' }, REMOT))).toMatchObject({ code: 'NO-DISPONIBLE', codi: 'NO-DISPONIBLE', retriable: false });
    reiniciaMemoriaSilenci();
    respon = () => ({ data: null, error: { code: 'PGRST202', message: 'Could not find the function' }, status: 400 });
    expect(await errorDe(silenciaFil({ filId: FIL, durada: 'cap' }, REMOT))).toMatchObject({ code: 'NO-DISPONIBLE' });
    reiniciaMemoriaSilenci();
    respon = () => ({ data: null, error: { message: 'Not Found' }, status: 404 });
    expect(await errorDe(silenciaFil({ filId: FIL, durada: 'sempre' }, REMOT))).toMatchObject({ code: 'NO-DISPONIBLE' });
    expect(crides).toHaveLength(3);
  });

  test('ARB-B8C2-05 · la RPC absent es recorda per node i poble: cap altre 404 en esta càrrega de pàgina', async () => {
    respon = () => ({ data: null, error: { code: 'PGRST202', message: 'Could not find the function public.xat_silencia' }, status: 404 });
    for (const durada of ['8h', 'sempre', 'cap']) {
      expect(await errorDe(silenciaFil({ filId: FIL, durada }, REMOT)), durada).toMatchObject({ code: 'NO-DISPONIBLE', codi: 'NO-DISPONIBLE', retriable: false });
    }
    expect(crides).toHaveLength(1);
    // Un altre poble o un altre node encara pregunten (la memòria no és global).
    await errorDe(silenciaFil({ filId: FIL, durada: '8h' }, { ...REMOT, tenantId: '0b1c2d3e-4f5a-4b6c-8d7e-f8091a2b3c4d' }));
    await errorDe(silenciaFil({ filId: FIL, durada: '8h' }, { ...REMOT, supabaseUrl: 'https://altre.supabase.test' }));
    expect(crides).toHaveLength(3);
    // Aplicada la migració i tornada a carregar la pàgina: torna a preguntar i silencia.
    reiniciaMemoriaSilenci();
    respon = () => ({ data: '2026-11-02T11:00:00+00:00', error: null, status: 200 });
    expect(await silenciaFil({ filId: FIL, durada: '8h' }, REMOT)).toEqual({ silenciatFinsAl: '2026-11-02T11:00:00+00:00' });
    expect(crides).toHaveLength(4);
  });

  test('ARB-B8C2-05 · un SDP-XAT-0xx, un 5xx o la xarxa no s’anoten com a RPC absent', async () => {
    const respostes = [
      () => ({ data: null, error: { code: '22023', message: 'SDP-XAT-050: durada del silenci invàlida.' }, status: 400 }),
      () => ({ data: null, error: { code: '42501', message: 'SDP-XAT-006: no eres membre actiu del fil.' }, status: 403 }),
      () => ({ data: null, error: { message: 'Service Unavailable' }, status: 503 }),
      () => ({ data: null, error: { message: 'TypeError: Failed to fetch' }, status: 0 })
    ];
    for (const r of respostes) {
      respon = r;
      expect((await errorDe(silenciaFil({ filId: FIL, durada: '8h' }, REMOT))).code).not.toBe('NO-DISPONIBLE');
    }
    respon = () => ({ data: '2026-11-02T11:00:00+00:00', error: null, status: 200 });
    expect(await silenciaFil({ filId: FIL, durada: '8h' }, REMOT)).toEqual({ silenciatFinsAl: '2026-11-02T11:00:00+00:00' });
    expect(crides).toHaveLength(respostes.length + 1);
  });

  test('SDP-XAT-050 → SILENCI_INVALID i SDP-XAT-006 → XAT_NO_PARTICIPANT, cap reintentable', async () => {
    respon = () => ({ data: null, error: { code: '22023', message: 'SDP-XAT-050: durada del silenci invàlida.' }, status: 400 });
    const durada = await errorDe(silenciaFil({ filId: FIL, durada: '8h' }, REMOT));
    expect(durada).toMatchObject({ code: 'SILENCI_INVALID', retriable: false });
    expect(durada.cause).toMatchObject({ code: '22023' });
    respon = () => ({ data: null, error: { code: '42501', message: 'SDP-XAT-006: no eres membre actiu del fil.' }, status: 403 });
    expect(await errorDe(silenciaFil({ filId: FIL, durada: '8h' }, REMOT))).toMatchObject({ code: 'XAT_NO_PARTICIPANT', retriable: false });
  });

  test('la resta, amb el vocabulari de l’adaptador: un SDP-XAT-001 conserva el codi i un 503 és reintentable', async () => {
    respon = () => ({ data: null, error: { code: '42501', message: 'SDP-XAT-001: cal la sessió iniciada.' }, status: 403 });
    expect(await errorDe(silenciaFil({ filId: FIL, durada: '8h' }, REMOT))).toMatchObject({ code: 'SDP-XAT-001', retriable: false });
    respon = () => ({ data: null, error: { message: 'Service Unavailable' }, status: 503 });
    expect(await errorDe(silenciaFil({ filId: FIL, durada: '8h' }, REMOT))).toMatchObject({ code: 'XAT', retriable: true });
  });
});

/* Paritat amb la migració de B8-SERVIDOR (la que definix xat_silencia), llegida
   com a text: les quatre durades són les que admet el servidor, i «sempre» és el
   mateix instant que el seu timestamptz. Si un costat canvia, la prova cau. */
test('paritat amb la migració: les durades i l’instant de «sempre» del servidor', () => {
  const carpeta = resolve(process.cwd(), 'supabase/migrations');
  const sql = readdirSync(carpeta).filter((f) => f.endsWith('.sql')).sort()
    .map((f) => readFileSync(resolve(carpeta, f), 'utf8'))
    .filter((text) => text.includes('create or replace function public.xat_silencia(p_fil_id uuid, p_durada text)'));
  expect(sql.length, 'una migració defineix xat_silencia(uuid, text)').toBeGreaterThan(0);
  const darrera = sql.at(-1);
  const durades = /p_durada not in \(([^)]*)\)/.exec(darrera)?.[1].split(',').map((d) => d.trim().replaceAll("'", ''));
  expect(durades).toEqual([...DURADES_SILENCI]);
  const sempre = /when 'sempre'\s+then timestamptz '([0-9: -]+)\+00'/.exec(darrera)?.[1];
  expect(Date.parse(`${sempre.replace(' ', 'T')}Z`)).toBe(Date.parse(SILENCI_SEMPRE));
});

describe('en llavor, el magatzem local', () => {
  test('silencia un fil real de la llista, loadFils ho llig i «cap» ho desfà, sense cap RPC', async () => {
    const fils = await loadFils(SEED);
    const fil = fils.find((f) => !f.perDefecte && f.silenciatFinsAl === null);
    expect(fil, 'la llavor porta algun fil real sense silenci').toBeTruthy();
    const { silenciatFinsAl } = await silenciaFil({ filId: fil.id, durada: 'sempre' }, SEED);
    expect(silenciatFinsAl).toBe(SILENCI_SEMPRE);
    expect((await loadFils(SEED)).find((f) => f.id === fil.id).silenciatFinsAl).toBe(SILENCI_SEMPRE);
    expect(await silenciaFil({ filId: fil.id, durada: 'cap' }, SEED)).toEqual({ silenciatFinsAl: null });
    expect((await loadFils(SEED)).find((f) => f.id === fil.id).silenciatFinsAl).toBeNull();
    expect(crides).toEqual([]);
  });

  test('un fil on no pintes res: XAT_NO_PARTICIPANT', async () => {
    expect(await errorDe(silenciaFil({ filId: 'fil-que-no-existix', durada: '8h' }, SEED))).toMatchObject({ code: 'XAT_NO_PARTICIPANT', retriable: false });
  });
});
