// @vitest-environment node
/* Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026) · La lectura pura del manifest públic
   (/.well-known/ard.json) i de versio-viva.json: cada camp es valida a part, un camp dolent no tomba el
   manifest, latestBuild mai és més baix que cap canal, i el GET acotat no llança mai. Cap xarxa: fetch
   simulat. Onada v1.2.16 (ordres del Mestre 261121 01:32 i 01:55: ZERO APK fora de botiga) · apkDirectBuild
   i apkSha256 ja no es lligen: fins a la v1.2.15 anaven junts i anunciaven l'APK directe (estes proves ho
   fixaven); ara, també amb els dos ben formats, tornen null, i latestBuild no els compta. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test, vi } from 'vitest';
import {
  CAMPS_APK_RETIRATS,
  CAMPS_BUILD_MANIFEST,
  MIDA_MAXIMA_JSON_PUBLIC,
  comparaSemver,
  consultaJsonPublic,
  esBuild,
  esSemver,
  esSha256,
  llegixCanalsManifest,
  llegixVersioViva,
  ordinalSemver
} from './manifestVersio.js';

const SHA = 'f'.repeat(64);
const ARREL = path.resolve(import.meta.dirname, '..', '..');

describe('les peces', () => {
  test('comparaSemver, esSemver, esBuild i esSha256', () => {
    expect(comparaSemver('1.2.7', '1.2.6')).toBe(1);
    expect(comparaSemver('1.2.6', '1.10.0')).toBe(-1);
    expect(comparaSemver('1.2.6', '1.2.6')).toBe(0);
    for (const dolent of ['1.2', 'v1.2.6', '1.2.6-beta', '', null, 7]) expect(comparaSemver(dolent, '1.2.6'), String(dolent)).toBeNull();
    expect(esSemver('1.2.7')).toBe(true);
    expect(esSemver('1.2')).toBe(false);
    expect([1, 12, Number.MAX_SAFE_INTEGER].every(esBuild)).toBe(true);
    expect([0, -1, 1.5, '12', null, Number.MAX_SAFE_INTEGER + 1].some(esBuild)).toBe(false);
    expect(esSha256(SHA)).toBe(true);
    expect([SHA.toUpperCase(), SHA.slice(1), `${SHA}0`, null].some(esSha256)).toBe(false);
  });

  test('ordinalSemver ordena com les versions i rebutja el que no pot ordenar', () => {
    expect(ordinalSemver('1.2.7')).toBe(1_002_007);
    expect(ordinalSemver('1.2.7')).toBeGreaterThan(ordinalSemver('1.2.6'));
    expect(ordinalSemver('1.10.0')).toBeGreaterThan(ordinalSemver('1.9.999'));
    expect(ordinalSemver('2.0.0')).toBeGreaterThan(ordinalSemver('1.999.999'));
    for (const dolent of ['1.1000.0', '1.0.1000', '0.0.0', 'x', null]) expect(ordinalSemver(dolent), String(dolent)).toBeNull();
  });
});

describe('llegixCanalsManifest', () => {
  test('un manifest d\'abans (sense camps nous): les botigues públiques i latestBuild calculat', () => {
    // v1.2.16 · Sense apkDirectBuild (ZERO APK): els dos camps de l'APK són a CAMPS_APK_RETIRATS.
    expect(CAMPS_BUILD_MANIFEST).toEqual(['androidBuild', 'iosBuild', 'testflightIosBuild']);
    expect(CAMPS_APK_RETIRATS).toEqual(['apkDirectBuild', 'apkSha256']);
    expect(llegixCanalsManifest({ version: '1.2.6', androidBuild: 1, iosBuild: 1, entries: [] })).toEqual({
      versio: '1.2.6', androidBuild: 1, iosBuild: 1, testflightIosBuild: null, apkDirectBuild: null, apkSha256: null, latestBuild: 1
    });
  });

  test('el manifest REAL del repositori es llig sencer', () => {
    const real = JSON.parse(readFileSync(path.join(ARREL, 'public', '.well-known', 'ard.json'), 'utf8'));
    const canals = llegixCanalsManifest(real);
    expect(canals.versio).toBe(real.version);
    expect(canals.androidBuild).toBe(real.androidBuild);
    expect(canals.iosBuild).toBe(real.iosBuild);
    expect(canals.latestBuild).toBeGreaterThanOrEqual(Math.max(real.androidBuild, real.iosBuild));
  });

  test('el canal de proves (TestFlight) i latestBuild: el més alt, també si el manifest en diu un de més baix', () => {
    const complet = { version: '1.2.7', androidBuild: 1, iosBuild: 1, testflightIosBuild: 12, latestBuild: 12 };
    expect(llegixCanalsManifest(complet)).toEqual({ ...complet, versio: '1.2.7', version: undefined, apkDirectBuild: null, apkSha256: null });
    expect(llegixCanalsManifest({ ...complet, latestBuild: 3 }).latestBuild).toBe(12);
    expect(llegixCanalsManifest({ ...complet, latestBuild: 15 }).latestBuild).toBe(15);
    expect(Object.isFrozen(llegixCanalsManifest(complet))).toBe(true);
  });

  /* v1.2.16 · ZERO APK fora de botiga: un manifest heretat amb l'anunci de l'APK ben format (el que fins a la
     v1.2.15 la prova de dalt llegia sencer) no anuncia cap APK, i el seu build no puja latestBuild. */
  test('v1.2.16 · ZERO APK: apkDirectBuild i apkSha256 heretats, ben formats, es lligen null i no compten', () => {
    const heretat = { version: '1.2.7', androidBuild: 1, iosBuild: 1, testflightIosBuild: 12, apkDirectBuild: 13, apkSha256: SHA };
    const llegit = llegixCanalsManifest(heretat);
    expect([llegit.apkDirectBuild, llegit.apkSha256, llegit.androidBuild, llegit.latestBuild]).toEqual([null, null, 1, 12]);
    expect(llegixCanalsManifest({ version: '1.2.7', androidBuild: 2, apkDirectBuild: 99, apkSha256: SHA }).latestBuild).toBe(2);
    expect(Object.keys(llegit)).toEqual(['versio', 'androidBuild', 'iosBuild', 'testflightIosBuild', 'apkDirectBuild', 'apkSha256', 'latestBuild']);
  });

  // v1.2.16 · Els casos de l'APK continuen: mal formats o no, sempre null (ZERO APK).
  test('valors no vàlids: cada camp cau a null sense tombar la resta; l\'APK, de cap manera', () => {
    const base = { version: '1.2.7', androidBuild: 2, iosBuild: 3 };
    for (const [cas, camps, esperat] of [
      ['testflight en text', { testflightIosBuild: '12' }, { testflightIosBuild: null }],
      ['testflight zero', { testflightIosBuild: 0 }, { testflightIosBuild: null }],
      ['testflight decimal', { testflightIosBuild: 12.5 }, { testflightIosBuild: null }],
      ['APK sense suma', { apkDirectBuild: 12 }, { apkDirectBuild: null, apkSha256: null }],
      ['suma sense APK', { apkSha256: SHA }, { apkDirectBuild: null, apkSha256: null }],
      ['suma en majúscules', { apkDirectBuild: 12, apkSha256: SHA.toUpperCase() }, { apkDirectBuild: null, apkSha256: null }],
      ['suma curta', { apkDirectBuild: 12, apkSha256: 'f'.repeat(63) }, { apkDirectBuild: null, apkSha256: null }],
      ['APK negatiu', { apkDirectBuild: -1, apkSha256: SHA }, { apkDirectBuild: null, apkSha256: null }],
      ['latestBuild en text', { latestBuild: '99' }, {}]
    ]) {
      const llegit = llegixCanalsManifest({ ...base, ...camps });
      expect(llegit, cas).toMatchObject({ versio: '1.2.7', androidBuild: 2, iosBuild: 3, ...esperat });
      expect(llegit.latestBuild, cas).toBe(3);
    }
    expect(llegixCanalsManifest({ ...base, version: '1.2' }).versio).toBeNull();
    expect(llegixCanalsManifest({ version: '1.2.7' }).latestBuild).toBeNull();
    for (const dolent of [null, [], 'text', 7]) expect(llegixCanalsManifest(dolent), String(dolent)).toBeNull();
    // Un prototip enverinat no és un camp del manifest.
    const ambPrototip = Object.create({ testflightIosBuild: 99 });
    Object.assign(ambPrototip, base);
    expect(llegixCanalsManifest(ambPrototip).testflightIosBuild).toBeNull();
  });

  test('llegixVersioViva: només versioSistema «x.y.z»', () => {
    expect(llegixVersioViva({ versioSistema: '1.2.7', versioMinima: 2 })).toBe('1.2.7');
    for (const dolent of [{ versioSistema: '1.2' }, { versioSistema: 127 }, {}, null, [], 'x']) expect(llegixVersioViva(dolent)).toBeNull();
    const real = JSON.parse(readFileSync(path.join(ARREL, 'public', 'versio-viva.json'), 'utf8'));
    expect(llegixVersioViva(real)).toBe(JSON.parse(readFileSync(path.join(ARREL, 'package.json'), 'utf8')).version);
  });
});

describe('consultaJsonPublic', () => {
  const resposta = (cos, { ok = true, status = 200 } = {}) => ({ ok, status, text: async () => (typeof cos === 'string' ? cos : JSON.stringify(cos)) });

  test('un GET sense galetes ni Referer, amb revalidació; torna l\'objecte', async () => {
    const fetchImpl = vi.fn(async () => resposta({ version: '1.2.7' }));
    await expect(consultaJsonPublic({ fetchImpl, url: 'https://socdepoble.org/.well-known/ard.json' })).resolves.toEqual({ version: '1.2.7' });
    const [url, opcions] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://socdepoble.org/.well-known/ard.json');
    expect(opcions).toMatchObject({ method: 'GET', cache: 'no-cache', credentials: 'omit', referrerPolicy: 'no-referrer' });
  });

  test('null sense fetch, sense xarxa, amb un no 2xx, un JSON trencat, una llista o un text massa gran', async () => {
    const url = 'https://socdepoble.org/x.json';
    await expect(consultaJsonPublic({ fetchImpl: null, url })).resolves.toBeNull();
    await expect(consultaJsonPublic({ fetchImpl: async () => resposta({}), url: '' })).resolves.toBeNull();
    for (const fetchImpl of [
      async () => { throw new TypeError('Failed to fetch'); },
      async () => resposta('no', { ok: false, status: 404 }),
      async () => resposta('{trencat'),
      async () => resposta([1, 2]),
      async () => resposta('x'.repeat(MIDA_MAXIMA_JSON_PUBLIC + 1))
    ]) await expect(consultaJsonPublic({ fetchImpl, url })).resolves.toBeNull();
  });

  test('un servidor que no respon: el tall torna null i avorta la petició', async () => {
    let senyal = null;
    const fetchImpl = vi.fn((_url, { signal }) => { senyal = signal; return new Promise(() => {}); });
    await expect(consultaJsonPublic({ fetchImpl, url: 'https://socdepoble.org/x.json', tempsMaxim: 5 })).resolves.toBeNull();
    expect(senyal?.aborted).toBe(true);
  });
});
