import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
/* B8C-2 (marató 261101_2143; Bloc B8) · L'adaptador Supabase dels aparells
   d'avisos push (capacitat 'avisosPush') contra el contracte de B8-SERVIDOR
   §2.9: xat_push_desa(p_plataforma, p_adreca, p_caduca_al, p_llengua, p_gest)
   i xat_push_retira(p_plataforma, p_adreca), amb el transport de debò
   (runtime.rpc). El servidor és un fetch de mentida: l'origen, la clau, els
   endpoints i els testimonis són sintètics. Es comprova el cos EXACTE: si un
   costat canvia un nom, la prova cau. */
import { desaDispositiuAvisos, retiraDispositiuAvisos } from './dispositiusAvisos.js';
import { CODI_DISPOSITIU_ALIE } from '../../config/avisosPushXat.js';

const USUARI = '00000000-0000-4000-a000-000000000001';
const ORIGEN = 'https://avisos.supabase.test';
const CLAU = 'sb_publishable_de_proves';
const REMOT = Object.freeze({ dataMode: 'remote', supabaseUrl: ORIGEN, supabaseAnonKey: CLAU });
const WEB = 'https://fcm.googleapis.com/fcm/send/cCaAbBdD-opac_123';
const APNS = 'A1B2C3D4E5F60718293A4B5C6D7E8F90A1B2C3D4E5F60718293A4B5C6D7E8F90';
const FCM = 'fcm_testimoni:APA91bH-opac_0123456789abcdefABCDEF';
const resposta = (cos, status = 200) => ({
  ok: status >= 200 && status < 300, status,
  headers: { get: () => null },
  json: async () => structuredClone(cos),
  text: async () => (cos === null ? '' : JSON.stringify(cos))
});
const servidor = vi.fn();
const crida = (i = 0) => {
  const [url, opcions] = servidor.mock.calls[i];
  return { url, metode: opcions.method, cos: JSON.parse(opcions.body), apikey: opcions.headers.apikey };
};
const errorDe = async (promesa) => {
  try { await promesa; } catch (error) { return error; }
  throw new Error('havia de rebutjar');
};

test('R54: sense usuari esperat UUID no hi ha retirada, i una RPC segura absent mai recau en l’antiga', async () => {
  for (const usuariEsperat of [undefined, null, '', 'b', {}, ['a']]) {
    expect(await errorDe(retiraDispositiuAvisos({ plataforma: 'web', adreca: WEB, usuariEsperat }, REMOT))).toMatchObject({ code: 'AVISOS_INVALID' });
  }
  expect(servidor).not.toHaveBeenCalled();
  servidor.mockResolvedValueOnce(resposta({ code: 'PGRST202', message: 'function missing' }, 404));
  expect(await errorDe(retiraDispositiuAvisos({ plataforma: 'web', adreca: WEB, usuariEsperat: USUARI }, REMOT))).toMatchObject({ code: 'NO-DISPONIBLE' });
  expect(servidor).toHaveBeenCalledTimes(1);
  expect(crida().url).toContain('/xat_push_retira_segura');
});

beforeEach(() => {
  servidor.mockReset();
  servidor.mockResolvedValue(resposta(null, 204));
  vi.stubGlobal('fetch', servidor);
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('sense servidor de push', () => {
  test('en llavor, en local o sense configuració: NO-DISPONIBLE i cap petició', async () => {
    const d = { plataforma: 'web', adreca: WEB, gest: true };
    for (const config of [{ ...REMOT, dataMode: 'seed' }, { ...REMOT, dataMode: 'local' }, { dataMode: 'remote' }, {}, undefined]) {
      for (const metode of [desaDispositiuAvisos, retiraDispositiuAvisos]) {
        const error = await errorDe(metode(d, config));
        expect(error, JSON.stringify(config)).toMatchObject({ code: 'NO-DISPONIBLE', codi: 'NO-DISPONIBLE' });
      }
    }
    expect(servidor).not.toHaveBeenCalled();
  });

  test('ARB-B8C2-04 · sense servidor, NO-DISPONIBLE passa davant d’AVISOS_INVALID (com el node local, que ho rebutja tot)', async () => {
    for (const config of [{ ...REMOT, dataMode: 'seed' }, { ...REMOT, dataMode: 'local' }, { dataMode: 'remote' }]) {
      for (const d of [{ plataforma: 'fax', adreca: 'x' }, { plataforma: 'web', adreca: 'http://insegur' }, null]) {
        for (const metode of [desaDispositiuAvisos, retiraDispositiuAvisos]) {
          expect(await errorDe(metode(d, config)), `${JSON.stringify(config)} ${JSON.stringify(d)}`).toMatchObject({ code: 'NO-DISPONIBLE' });
        }
      }
    }
    expect(servidor).not.toHaveBeenCalled();
  });
});

describe('coacció primitiva abans del transport', () => {
  test('plataformes i adreces fora de la forma del servidor: AVISOS_INVALID sense cap fetch', async () => {
    const dolents = [
      null, undefined, 'web', 7, {},
      { plataforma: 'fax', adreca: 'x' }, { plataforma: 'WEB', adreca: WEB }, { plataforma: 'apns', adreca: APNS.toLowerCase() },
      { plataforma: 'fcm', adreca: FCM }, { plataforma: ['web'], adreca: WEB },
      { plataforma: 'web', adreca: 'http://insegur/push' }, { plataforma: 'web', adreca: 'https://' },
      { plataforma: 'web', adreca: `${WEB}#fragment` }, { plataforma: 'web', adreca: 'https://fcm.googleapis.com/a b' },
      { plataforma: 'web', adreca: 'https://fcm.googleapis.com/ñ' }, { plataforma: 'web', adreca: `https://fcm.googleapis.com/${'a'.repeat(2048)}` },
      { plataforma: 'web', adreca: { href: WEB } }, { plataforma: 'web' },
      { plataforma: 'ios', adreca: 'a'.repeat(63) }, { plataforma: 'ios', adreca: `${'a'.repeat(63)}g` },
      { plataforma: 'ios', adreca: 'a'.repeat(201) }, { plataforma: 'ios', adreca: `${'a'.repeat(64)} ` },
      { plataforma: 'android', adreca: 'f'.repeat(31) }, { plataforma: 'android', adreca: 'f'.repeat(1025) },
      { plataforma: 'android', adreca: `${'f'.repeat(40)}/x` }, { plataforma: 'android', adreca: `${'f'.repeat(40)}=` }
    ];
    for (const d of dolents) {
      for (const metode of [desaDispositiuAvisos, retiraDispositiuAvisos]) {
        const error = await errorDe(metode(d, REMOT));
        expect(error, JSON.stringify(d)?.slice(0, 80)).toMatchObject({ code: 'AVISOS_INVALID', codi: 'AVISOS_INVALID' });
      }
    }
    expect(servidor).not.toHaveBeenCalled();
  });

  test('les vores admeses: 2048 a la web, 64 i 200 a APNs, 32 i 1024 a FCM', async () => {
    const web2048 = `https://fcm.googleapis.com/${'a'.repeat(2048 - 'https://fcm.googleapis.com/'.length)}`;
    expect(web2048).toHaveLength(2048);
    for (const d of [
      { plataforma: 'web', adreca: web2048 }, { plataforma: 'ios', adreca: 'a'.repeat(64) }, { plataforma: 'ios', adreca: 'F'.repeat(200) },
      { plataforma: 'android', adreca: 'f'.repeat(32) }, { plataforma: 'android', adreca: 'f'.repeat(1024) }
    ]) {
      await expect(retiraDispositiuAvisos({ ...(d), usuariEsperat: USUARI }, REMOT), `${d.plataforma} ${d.adreca.length}`).resolves.toBeUndefined();
    }
    expect(servidor).toHaveBeenCalledTimes(5);
  });

  test('caducaMs: un número finit dins de (0, 8.64e15] o res; la resta, AVISOS_INVALID i mai un RangeError', async () => {
    for (const caducaMs of [8.64e15 + 1, Number.NaN, -1, 0, '1', Infinity, -Infinity, { valueOf: () => 1 }, true, 1n]) {
      const error = await errorDe(desaDispositiuAvisos({ plataforma: 'web', adreca: WEB, caducaMs }, REMOT));
      expect(error, String(caducaMs)).not.toBeInstanceOf(RangeError);
      expect(error).toMatchObject({ code: 'AVISOS_INVALID' });
    }
    expect(servidor).not.toHaveBeenCalled();
    await desaDispositiuAvisos({ plataforma: 'web', adreca: WEB, caducaMs: 8.64e15 }, REMOT);
    expect(crida().cos.p_caduca_al).toBe('+275760-09-13T00:00:00.000Z');
    await desaDispositiuAvisos({ plataforma: 'web', adreca: WEB, caducaMs: 1893456000000.9 }, REMOT);
    expect(crida(1).cos.p_caduca_al).toBe('2030-01-01T00:00:00.000Z');
    for (const caducaMs of [null, undefined]) await desaDispositiuAvisos({ plataforma: 'web', adreca: WEB, caducaMs }, REMOT);
    expect([crida(2).cos.p_caduca_al, crida(3).cos.p_caduca_al]).toEqual([null, null]);
  });
});

describe('el cos exacte de B8-SERVIDOR §2.9', () => {
  test('web amb gest: xat_push_desa amb els cinc paràmetres i res més (cap clau de la subscripció ni camp de l’entrada)', async () => {
    const d = {
      plataforma: 'web', adreca: WEB, caducaMs: 1893456000000, llengua: 'gl', gest: true,
      keys: { p256dh: 'clau-publica', auth: 'secret' }, p256dh: 'clau-publica', auth: 'secret', filId: 'f1', tipus: 'web'
    };
    expect(await desaDispositiuAvisos(d, REMOT)).toBeUndefined();
    const { url, metode, cos, apikey } = crida();
    expect(url).toBe(`${ORIGEN}/rest/v1/rpc/xat_push_desa`);
    expect(metode).toBe('POST');
    expect(apikey).toBe(CLAU);
    expect(cos).toEqual({ p_plataforma: 'web', p_adreca: WEB, p_caduca_al: '2030-01-01T00:00:00.000Z', p_llengua: 'gl', p_gest: true });
    expect(Object.keys(cos)).toEqual(['p_plataforma', 'p_adreca', 'p_caduca_al', 'p_llengua', 'p_gest']);
    expect(servidor.mock.calls[0][1].body).not.toMatch(/p256dh|auth|secret|filId/);
  });

  test('només `true` és gest: false, absent, \'true\' o 1 envien p_gest false', async () => {
    for (const [i, gest] of [false, undefined, 'true', 1, null].entries()) {
      await desaDispositiuAvisos({ plataforma: 'web', adreca: WEB, gest }, REMOT);
      expect(crida(i).cos.p_gest, String(gest)).toBe(false);
    }
  });

  test('una llengua que no és de les cinc (o cap) va com a null: el servidor hi posa la seua', async () => {
    for (const [i, llengua] of ['zz', 'CA', '', undefined, 7, 'ca'].entries()) {
      await desaDispositiuAvisos({ plataforma: 'web', adreca: WEB, llengua }, REMOT);
      expect(crida(i).cos.p_llengua, String(llengua)).toBe(llengua === 'ca' ? 'ca' : null);
    }
  });

  test('natius: \'ios\' amb el testimoni en minúscula i \'android\' tal qual; la plataforma és la del client, no la interna', async () => {
    await desaDispositiuAvisos({ plataforma: 'ios', adreca: APNS, llengua: 'eu', gest: true }, REMOT);
    expect(crida(0).cos).toEqual({ p_plataforma: 'ios', p_adreca: APNS.toLowerCase(), p_caduca_al: null, p_llengua: 'eu', p_gest: true });
    await desaDispositiuAvisos({ plataforma: 'android', adreca: FCM, gest: true }, REMOT);
    expect(crida(1).cos).toEqual({ p_plataforma: 'android', p_adreca: FCM, p_caduca_al: null, p_llengua: null, p_gest: true });
  });

  test('la retirada: xat_push_retira amb { p_plataforma, p_adreca } i res més, també per als natius', async () => {
    const respostes = [
      [{ plataforma: 'web', adreca: WEB, caducaMs: 1, gest: true, llengua: 'ca' }, { p_plataforma: 'web', p_adreca: WEB }],
      [{ plataforma: 'ios', adreca: APNS }, { p_plataforma: 'ios', p_adreca: APNS.toLowerCase() }],
      [{ plataforma: 'android', adreca: FCM }, { p_plataforma: 'android', p_adreca: FCM }]
    ];
    for (const [i, [d, esperat]] of respostes.entries()) {
      expect(await retiraDispositiuAvisos({ ...(d), usuariEsperat: USUARI }, REMOT)).toBeUndefined();
      expect(crida(i).url).toBe(`${ORIGEN}/rest/v1/rpc/xat_push_retira_segura`);
      expect(crida(i).cos).toEqual({ ...esperat, p_usuari_esperat: USUARI });
    }
  });

  test('el servidor torna un uuid o un booleà i l’adaptador no en torna res', async () => {
    servidor.mockResolvedValueOnce(resposta('6f1c1d1e-0000-4000-8000-000000000001'));
    expect(await desaDispositiuAvisos({ plataforma: 'web', adreca: WEB }, REMOT)).toBeUndefined();
    servidor.mockResolvedValueOnce(resposta(true));
    expect(await retiraDispositiuAvisos({ ...({ plataforma: 'web', adreca: WEB }), usuariEsperat: USUARI }, REMOT)).toBeUndefined();
  });
});

describe('els errors del servidor', () => {
  const pgrst = (missatge, status) => resposta({ code: 'P0001', details: null, hint: null, message: missatge }, status);

  test('sense la RPC (404 o PGRST202): NO-DISPONIBLE, a desar i a retirar', async () => {
    servidor.mockResolvedValueOnce(resposta({ code: 'PGRST202', message: 'Could not find the function public.xat_push_desa' }, 404));
    expect(await errorDe(desaDispositiuAvisos({ plataforma: 'web', adreca: WEB }, REMOT))).toMatchObject({ code: 'NO-DISPONIBLE' });
    /* R21.1 v2 · esRpcAbsent (runtime.js) només reconeix 404 + PGRST202, la resposta real de PostgREST
       per a una funció absent; un 400 amb el mateix text no és absència d'esquema. */
    servidor.mockResolvedValueOnce(resposta({ code: 'PGRST202', message: 'Could not find the function public.xat_push_retira' }, 404));
    expect(await errorDe(retiraDispositiuAvisos({ ...({ plataforma: 'web', adreca: WEB }), usuariEsperat: USUARI }, REMOT))).toMatchObject({ code: 'NO-DISPONIBLE' });
  });

  test('SDP-PUSH-010 (avisos apagats, 55000 → 500): NO-DISPONIBLE, amb la causa', async () => {
    servidor.mockResolvedValueOnce(pgrst('SDP-PUSH-010: els avisos push no estan encesos en este node.', 500));
    const error = await errorDe(desaDispositiuAvisos({ plataforma: 'web', adreca: WEB, gest: true }, REMOT));
    expect(error).toMatchObject({ code: 'NO-DISPONIBLE', codi: 'NO-DISPONIBLE' });
    expect(error.cause).toMatchObject({ status: 500 });
  });

  test('SDP-PUSH-011 (aparell d’una altra sessió): el codi que reconeix el registre (CODI_DISPOSITIU_ALIE)', async () => {
    servidor.mockResolvedValueOnce(pgrst("SDP-PUSH-011: este aparell és d'una altra sessió; cal activar-lo amb un gest.", 403));
    const error = await errorDe(desaDispositiuAvisos({ plataforma: 'web', adreca: WEB }, REMOT));
    expect(CODI_DISPOSITIU_ALIE).toBe('AVISOS_ALIE');
    expect(error).toMatchObject({ code: CODI_DISPOSITIU_ALIE, codi: CODI_DISPOSITIU_ALIE });
  });

  test('SDP-PUSH-002, 003 i 004 (22023 → 400): AVISOS_INVALID', async () => {
    for (const codi of ['SDP-PUSH-002', 'SDP-PUSH-003', 'SDP-PUSH-004']) {
      servidor.mockResolvedValueOnce(pgrst(`${codi}: rebutjat.`, 400));
      expect(await errorDe(desaDispositiuAvisos({ plataforma: 'web', adreca: WEB }, REMOT)), codi).toMatchObject({ code: 'AVISOS_INVALID' });
    }
  });

  test('la resta es propaga tal qual: un 500 qualsevol, SDP-PUSH-001 i la xarxa caiguda', async () => {
    servidor.mockResolvedValueOnce(resposta({ message: 'error intern' }, 500));
    const intern = await errorDe(desaDispositiuAvisos({ plataforma: 'web', adreca: WEB }, REMOT));
    expect(intern).toMatchObject({ status: 500 });
    expect(intern.code).toBeUndefined();
    servidor.mockResolvedValueOnce(pgrst('SDP-PUSH-001: cal la sessió iniciada.', 403));
    const sensesessio = await errorDe(retiraDispositiuAvisos({ ...({ plataforma: 'web', adreca: WEB }), usuariEsperat: USUARI }, REMOT));
    expect(sensesessio).toMatchObject({ status: 403 });
    expect(sensesessio.message).toContain('SDP-PUSH-001');
    servidor.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect(await errorDe(desaDispositiuAvisos({ plataforma: 'web', adreca: WEB }, REMOT))).toMatchObject({ status: 0 });
  });

  test('una petició penjada es talla als 8 s, no als 12 s de runtime.request', async () => {
    vi.useFakeTimers();
    try {
      servidor.mockImplementation((_url, { signal }) => new Promise((_resol, rebutja) => {
        signal.addEventListener('abort', () => rebutja(new DOMException('Avortada', 'AbortError')));
      }));
      let resultat = 'pendent';
      desaDispositiuAvisos({ plataforma: 'web', adreca: WEB, gest: true }, REMOT)
        .then(() => { resultat = 'resolta'; }, (error) => { resultat = error; });
      await vi.advanceTimersByTimeAsync(7999);
      expect(resultat).toBe('pendent');
      await vi.advanceTimersByTimeAsync(1);
      expect(resultat).toMatchObject({ name: 'TimeoutError' });
    } finally {
      vi.useRealTimers();
    }
  });
});

/* Paritat amb la migració de B8-SERVIDOR, llegida com a text: els paràmetres
   amb nom de les dues RPC són exactament les claus del cos que envia
   l'adaptador, i les plataformes que el servidor mapeja són PLATAFORMES_AVISOS. */
test('paritat amb la migració: paràmetres de xat_push_desa i xat_push_retira i plataformes del servidor', async () => {
  const carpeta = resolve(process.cwd(), 'supabase/migrations');
  const tots = readdirSync(carpeta).filter((f) => f.endsWith('.sql')).sort()
    .map((f) => readFileSync(resolve(carpeta, f), 'utf8'));
  const sql = tots.filter((text) => text.includes('create or replace function public.xat_push_desa('));
  expect(sql.length, 'una migració defineix xat_push_desa').toBeGreaterThan(0);
  const darrera = sql.at(-1);
  const parametres = (nom) => {
    const font = tots.filter(s => s.includes(`create or replace function public.${nom}(`)).at(-1);
    expect(font, nom).toBeTruthy();
    const inici = font.indexOf(`create or replace function public.${nom}(`);
    const signatura = font.slice(inici, font.indexOf(')', inici));
    return [...signatura.matchAll(/\b(p_[a-z_]+)\s+[a-z]/g)].map((m) => m[1]);
  };
  await desaDispositiuAvisos({ plataforma: 'web', adreca: WEB, gest: true }, REMOT);
  await retiraDispositiuAvisos({ ...({ plataforma: 'web', adreca: WEB }), usuariEsperat: USUARI }, REMOT);
  expect(Object.keys(crida(0).cos).sort()).toEqual(parametres('xat_push_desa').sort());
  expect(Object.keys(crida(1).cos).sort()).toEqual(parametres('xat_push_retira_segura').sort());
  const { PLATAFORMES_AVISOS } = await import('../contracte.js');
  const mapa = /case p_plataforma ((?:when '[a-z]+' then '[a-z]+' )+)else null end/.exec(darrera)?.[1];
  expect([...mapa.matchAll(/when '([a-z]+)'/g)].map((m) => m[1])).toEqual([...PLATAFORMES_AVISOS]);
});

test('per text: només importa ../contracte.js i ./runtime.js, i el mòdul no es diu avisosPush (frontera N1/N2)', () => {
  const font = readFileSync(resolve(process.cwd(), 'src/data/supabase/dispositiusAvisos.js'), 'utf8');
  const imports = [...font.matchAll(/^\s*import\s[^;]*?from\s+['"]([^'"]+)['"]/gm)].map((m) => m[1]);
  expect(imports).toEqual(['../contracte.js', './runtime.js']);
  expect(font).not.toMatch(/import\s*\(/);
  expect(font).not.toMatch(/from\s+['"][^'"]*avisosPush(?:\.js)?['"]/);
});
