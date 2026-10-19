// @vitest-environment node
/* Pla 261018_1605 (Tasca 4, D8; ordre del Mestre, 18-10-2026) · La biblioteca
   de fotos pròpies de «Multimèdia» (capacitat 'mitjansPropis'). Fins ara cap
   funció del port llistava les fotos pujades per la persona ni n'esborrava
   cap: «Elimina» només les amagava en este navegador. Estes proves fixen:
   · el llistat: només imatges del bucket públic, només davall del prefix
     propi (carpetes descobertes, i el llegat `<uid>/`), de més nova a més
     vella, amb la forma del contracte, i [] en seed, en local i sense sessió;
   · l'esborrat: només `<poble>/<uid>/avatars/<fitxer>` del poble resolt i de
     la persona de la sessió, una sola crida a remove amb la ruta exacta, i
     'no-disponible' en seed i en local;
   · la consola: només diagnosiDeStorage, sense ruta, uid ni poble. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ llista: vi.fn(), esborra: vi.fn(), client: vi.fn(), usuari: null }));
/* Com runtime.js: el mode resolt ix de `dataMode` (normalizeDataMode, per defecte 'remote'). */
vi.mock('./runtime.js', () => ({
  getResolvedConfig: (config = {}) => ({ ...config, runtimeDataMode: config.dataMode ?? 'remote' })
}));
vi.mock('./config.js', () => ({
  getClient: async (config) => {
    m.client(config);
    return { storage: { from: (bucket) => ({
      list: (...args) => m.llista(bucket, ...args),
      remove: (...args) => m.esborra(bucket, ...args)
    }) } };
  }
}));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => m.usuari }));

import { esborraElMeuMitja, llistaElsMeusMitjans } from './storage.js';
import { CODI_BACKEND_INABASTABLE, CODI_MITJANS, CODI_SEGON_FACTOR } from '../errorsBackend.js';

const UID = '11111111-1a1a-4000-8000-000000000001';
const POBLE = '22222222-2b2b-4000-8000-000000000002';
const ALTRE = '33333333-3c3c-4000-8000-000000000003';
const CONFIG = { tenantId: POBLE };
const ARREL = `${POBLE}/${UID}`;
const RUTA = `${ARREL}/avatars/4b5c6d7e-8f90-4a1b-8c2d-3e4f5a6b7c8d.webp`;
const REF = `sdp-media://mitjans/${RUTA}`;
const PREFIX_LLISTAT = 'No s’ha pogut llegir la teua biblioteca de fotos: ';
const PREFIX_ESBORRAT = 'No s’ha pogut esborrar la foto: ';
// Les úniques claus que pot portar una diagnosi (storage.js, diagnosiDeStorage).
const CLAUS = ['code', 'codi', 'status', 'statusCode'];

/* Les entrades del llistat de Storage (storage-js 2.112, FileObject): una
   carpeta porta id null i cap metadada. */
const carpeta = (name) => ({ name, id: null, updated_at: null, created_at: null, last_accessed_at: null, metadata: null });
function fitxer(name, { creat = '2026-10-18T09:00:00.000Z', mida = 2048, etag = '"e-comu"', tipus = 'image/webp', metadata = {} } = {}) {
  return {
    name, id: `id-${name}`, created_at: creat, updated_at: creat, last_accessed_at: creat,
    metadata: { eTag: etag, size: mida, mimetype: tipus, cacheControl: 'max-age=3600', lastModified: creat,
      contentLength: mida, httpStatusCode: 200, ...metadata }
  };
}

/* Un Storage en memòria: cada prefix, les seues entrades, servides pàgina a pàgina. */
let arbre;
const servix = async (_bucket, prefix, { limit, offset }) => ({ data: (arbre[prefix] ?? []).slice(offset, offset + limit), error: null });
const prefixosLlistats = () => m.llista.mock.calls.map(([, prefix]) => prefix);

let consola;
beforeEach(() => {
  m.llista.mockReset().mockImplementation(servix);
  m.esborra.mockReset().mockImplementation(async (_bucket, rutes) => ({ data: rutes.map((name) => ({ name })), error: null }));
  m.client.mockReset();
  m.usuari = { id: UID, email: 'veina@poble.invalid' };
  arbre = {};
  consola = ['warn', 'error', 'log', 'info', 'debug'].map((nivell) => vi.spyOn(console, nivell).mockImplementation(() => {}));
});
afterEach(() => { consola.forEach((espia) => espia.mockRestore()); });

const avis = () => consola[0];
const totaLaConsola = () => JSON.stringify(consola.flatMap((espia) => espia.mock.calls));

/** Cap secret a la consola ni al missatge: ni la ruta, ni l'uid, ni el poble, ni el text cru. */
function senseSecrets(text, secrets = []) {
  for (const secret of [UID, POBLE, ALTRE, RUTA, ARREL, ...secrets]) expect(text).not.toContain(secret);
}

/* Un rebuig amb dades privades a tots els camps lliures (com storage.privacitat.test.js). */
const errorPrivat = (camps = {}) => Object.assign(new Error(`Object ${RUTA} rejected for ${UID}`), {
  status: 403, code: `inesperat:${RUTA}`, statusCode: `privat:${UID}`, details: { ruta: RUTA, poble: POBLE }
}, camps);

describe('llistaElsMeusMitjans · la biblioteca de la persona de la sessió', () => {
  beforeEach(() => {
    arbre = {
      [ARREL]: [carpeta('avatars'), carpeta('organitzacions'), carpeta('Mal Nom'), carpeta('../fora'), fitxer('solta.webp')],
      [`${ARREL}/avatars`]: [
        fitxer('a-vella.webp', { creat: '2026-10-01T08:00:00.000Z', etag: '"e-vella"', mida: 1000 }),
        // Amb fus horari: ix en ISO UTC.
        fitxer('b-nova.jpg', { creat: '2026-10-18T11:00:00+02:00', etag: '"e-nova"', mida: 4096, tipus: 'image/jpeg' }),
        fitxer('.emptyFolderPlaceholder', { tipus: 'application/octet-stream', mida: 0 }),
        fitxer('document.pdf', { tipus: 'application/pdf' }),
        fitxer('vector.svg', { tipus: 'image/svg+xml' }),
        // Un MIME que no és d'imatge mana sobre l'extensió.
        fitxer('enganya.png', { tipus: 'text/html' }),
        // Sense MIME, l'extensió; sense data, al final.
        { name: 'sense-mime.PNG', id: 'id-sense-mime', created_at: null, updated_at: null, metadata: { size: 7 } },
        fitxer('amb espai.webp'),
        carpeta('subcarpeta')
      ],
      [`${ARREL}/organitzacions`]: [fitxer('logo.png', { creat: '2026-10-10T12:00:00.000Z', tipus: 'image/png', etag: null })],
      [`${ARREL}/Mal Nom`]: [fitxer('no-hi-arriba.webp')],
      // El llegat d'abans que la ruta portara el poble.
      [UID]: [carpeta('avatars')],
      [`${UID}/avatars`]: [fitxer('antiga.webp', { creat: '2026-09-01T07:30:00.000Z', etag: '"e-antiga"' })],
      // Les d'una altra persona no s'han de llistar mai.
      [`${POBLE}/${ALTRE}`]: [carpeta('avatars')],
      [`${POBLE}/${ALTRE}/avatars`]: [fitxer('de-la-veina.webp')]
    };
  });

  test('la forma del contracte, només imatges, de més nova a més vella', async () => {
    const llista = await llistaElsMeusMitjans(CONFIG);
    expect(llista.map((mitja) => mitja.ruta)).toEqual([
      `${ARREL}/avatars/b-nova.jpg`,
      `${ARREL}/organitzacions/logo.png`,
      `${ARREL}/avatars/a-vella.webp`,
      `${UID}/avatars/antiga.webp`,
      `${ARREL}/avatars/sense-mime.PNG`
    ]);
    expect(llista[0]).toEqual({
      ref: `sdp-media://mitjans/${ARREL}/avatars/b-nova.jpg`,
      ruta: `${ARREL}/avatars/b-nova.jpg`,
      nom: 'b-nova.jpg',
      carpeta: 'avatars',
      creat: '2026-10-18T09:00:00.000Z',
      mida: 4096,
      etag: 'e-nova',
      tipus: 'image/jpeg',
      esborrable: true
    });
    expect(llista[1]).toMatchObject({ carpeta: 'organitzacions', etag: null, tipus: 'image/png', esborrable: false });
    expect(llista[3]).toMatchObject({ carpeta: 'avatars', ref: `sdp-media://mitjans/${UID}/avatars/antiga.webp`, esborrable: false });
    expect(llista[4]).toMatchObject({ nom: 'sense-mime.PNG', creat: null, tipus: null, mida: 7, etag: null, esborrable: true });
    for (const mitja of llista) {
      expect(Object.keys(mitja).sort()).toEqual(['carpeta', 'creat', 'esborrable', 'etag', 'mida', 'nom', 'ref', 'ruta', 'tipus']);
      expect(mitja.ref).toBe(`sdp-media://mitjans/${mitja.ruta}`);
    }
    expect(avis()).not.toHaveBeenCalled();
  });

  test('descobrix les carpetes del prefix propi i del llegat, i res més', async () => {
    await llistaElsMeusMitjans(CONFIG);
    expect(new Set(m.llista.mock.calls.map(([bucket]) => bucket))).toEqual(new Set(['mitjans']));
    expect([...prefixosLlistats()].sort()).toEqual([
      ARREL, `${ARREL}/avatars`, `${ARREL}/organitzacions`, UID, `${UID}/avatars`
    ].sort());
    for (const prefix of prefixosLlistats()) {
      expect(prefix.startsWith(ARREL) || prefix.startsWith(UID)).toBe(true);
      expect(prefix).not.toContain(ALTRE);
    }
    // Cada petició va ordenada pel nom, per a paginar sense salts.
    for (const [, , opcions] of m.llista.mock.calls) expect(opcions).toMatchObject({ limit: 100, sortBy: { column: 'name', order: 'asc' } });
  });

  test('les rutes van en minúscules, com les escriu uploadToStorage', async () => {
    m.usuari = { id: UID.toUpperCase() };
    const llista = await llistaElsMeusMitjans({ tenantId: POBLE.toUpperCase() });
    expect(prefixosLlistats()).toContain(ARREL);
    expect(llista[0]).toMatchObject({ ruta: `${ARREL}/avatars/b-nova.jpg`, esborrable: true });
  });

  test('pagina de 100 en 100 i para quan una pàgina ve curta', async () => {
    arbre = {
      [ARREL]: [carpeta('avatars')],
      [`${ARREL}/avatars`]: Array.from({ length: 105 }, (_, n) => fitxer(`foto-${String(n).padStart(3, '0')}.webp`))
    };
    const llista = await llistaElsMeusMitjans(CONFIG);
    expect(llista).toHaveLength(105);
    const offsets = m.llista.mock.calls.filter(([, prefix]) => prefix === `${ARREL}/avatars`).map(([, , opcions]) => opcions.offset);
    expect(offsets).toEqual([0, 100]);
  });

  test('un llistat que no s’acaba mai para a les 10 pàgines', async () => {
    arbre = { [ARREL]: [carpeta('avatars')] };
    const pagina = Array.from({ length: 100 }, (_, n) => fitxer(`foto-${n}.webp`));
    m.llista.mockImplementation(async (bucket, prefix, opcions) => (prefix === `${ARREL}/avatars` ? { data: pagina, error: null } : servix(bucket, prefix, opcions)));
    expect(await llistaElsMeusMitjans(CONFIG)).toHaveLength(1000);
    expect(prefixosLlistats().filter((prefix) => prefix === `${ARREL}/avatars`)).toHaveLength(10);
  });

  test.each([
    ['seed', { ...CONFIG, dataMode: 'seed' }],
    ['local', { ...CONFIG, dataMode: 'local' }]
  ])('en mode %s torna [] sense cap petició', async (_mode, config) => {
    expect(await llistaElsMeusMitjans(config)).toEqual([]);
    expect(m.client).not.toHaveBeenCalled();
    expect(m.llista).not.toHaveBeenCalled();
  });

  test.each([
    ['sense sessió', null],
    ['amb un usuari sense id', { email: 'x@poble.invalid' }],
    ['amb la persona pilot, que no és cap UUID', { id: '0001' }]
  ])('%s torna [] sense cap petició', async (_cas, usuari) => {
    m.usuari = usuari;
    expect(await llistaElsMeusMitjans(CONFIG)).toEqual([]);
    expect(m.client).not.toHaveBeenCalled();
    expect(m.llista).not.toHaveBeenCalled();
  });

  test('sense un poble UUID només es llista el llegat, i res no és esborrable', async () => {
    const llista = await llistaElsMeusMitjans({});
    expect([...prefixosLlistats()].sort()).toEqual([UID, `${UID}/avatars`]);
    expect(llista.map((mitja) => mitja.ruta)).toEqual([`${UID}/avatars/antiga.webp`]);
    expect(llista[0].esborrable).toBe(false);
  });

  test('un rebuig de Storage ix traduït i la consola no porta cap secret', async () => {
    const cru = errorPrivat();
    m.llista.mockImplementation(async (bucket, prefix, opcions) => (prefix === `${ARREL}/avatars` ? { data: null, error: cru } : servix(bucket, prefix, opcions)));
    const error = await llistaElsMeusMitjans(CONFIG).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ codi: CODI_MITJANS.SENSE_PERMIS, code: CODI_MITJANS.SENSE_PERMIS, status: 403 });
    expect(error.message).toBe(`${PREFIX_LLISTAT}el servidor no t’ho ha permés.`);
    expect(error.cause).toBe(cru);
    senseSecrets(error.message, [cru.message]);
    expect(avis()).toHaveBeenCalledOnce();
    const [[text, dades]] = avis().mock.calls;
    expect(text.startsWith('[Storage] ')).toBe(true);
    expect(Object.keys(dades).sort()).toEqual(CLAUS);
    expect(dades).toEqual({ codi: CODI_MITJANS.SENSE_PERMIS, status: 403, statusCode: undefined, code: undefined });
    senseSecrets(totaLaConsola(), [cru.message, 'inesperat:', 'privat:']);
  });

  test('sense resposta del servidor és «inabastable»', async () => {
    m.llista.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(llistaElsMeusMitjans(CONFIG)).rejects.toMatchObject({ codi: CODI_BACKEND_INABASTABLE, code: CODI_BACKEND_INABASTABLE });
    senseSecrets(totaLaConsola());
  });

  test('esborrable vol dir exactament que esborraElMeuMitja l’accepta', async () => {
    const llista = await llistaElsMeusMitjans(CONFIG);
    expect(llista.some((mitja) => mitja.esborrable)).toBe(true);
    expect(llista.some((mitja) => !mitja.esborrable)).toBe(true);
    for (const mitja of llista) {
      m.esborra.mockClear();
      const resultat = await esborraElMeuMitja(mitja.ref, CONFIG).then(() => 'esborrada', (e) => e.codi);
      expect(resultat, mitja.ruta).toBe(mitja.esborrable ? 'esborrada' : CODI_MITJANS.SENSE_PERMIS);
      expect(m.esborra).toHaveBeenCalledTimes(mitja.esborrable ? 1 : 0);
    }
  });
});

describe('esborraElMeuMitja · només una foto de la biblioteca del Perfil', () => {
  test('l’èxit crida remove una sola volta, al bucket públic i amb la ruta exacta', async () => {
    await expect(esborraElMeuMitja(REF, CONFIG)).resolves.toBeUndefined();
    expect(m.esborra).toHaveBeenCalledOnce();
    expect(m.esborra).toHaveBeenCalledWith('mitjans', [RUTA]);
    expect(totaLaConsola()).toBe('[]');
  });

  test('una sessió amb l’uid en majúscules esborra la ruta en minúscules', async () => {
    m.usuari = { id: UID.toUpperCase() };
    await esborraElMeuMitja(REF, { tenantId: POBLE.toUpperCase() });
    expect(m.esborra).toHaveBeenCalledWith('mitjans', [RUTA]);
  });

  const FOTO = '4b5c6d7e-8f90-4a1b-8c2d-3e4f5a6b7c8d.webp';
  test.each([
    ['d’una altra persona', `sdp-media://mitjans/${POBLE}/${ALTRE}/avatars/${FOTO}`],
    ['d’un altre poble', `sdp-media://mitjans/${ALTRE}/${UID}/avatars/${FOTO}`],
    ['d’una carpeta que no és avatars', `sdp-media://mitjans/${ARREL}/organitzacions/${FOTO}`],
    ['dels agents', `sdp-media://mitjans/${ARREL}/agents/${FOTO}`],
    ['del bucket privat', `sdp-media://mitjans_privats/${ARREL}/avatars/${FOTO}`],
    ['del bucket privat de les notes', `sdp-media://mitjans_privats/${ARREL}/notes/document.pdf`],
    ['del llegat sense poble', `sdp-media://mitjans/${UID}/avatars/${FOTO}`],
    ['amb un salt de carpeta', `sdp-media://mitjans/${ARREL}/avatars/../../${ALTRE}/avatars/${FOTO}`],
    ['amb un segment de més', `sdp-media://mitjans/${ARREL}/avatars/sub/${FOTO}`],
    ['amb el poble en majúscules', `sdp-media://mitjans/${POBLE.toUpperCase()}/${UID}/avatars/${FOTO}`],
    ['amb l’esquema en majúscules', `SDP-MEDIA://mitjans/${ARREL}/avatars/${FOTO}`],
    ['que no és una imatge', `sdp-media://mitjans/${ARREL}/avatars/document.pdf`],
    ['amagada', `sdp-media://mitjans/${ARREL}/avatars/.amagada.webp`],
    ['amb una barra codificada', `sdp-media://mitjans/${ARREL}/avatars/x%2F..%2Fy.webp`],
    ['amb una consulta', `sdp-media://mitjans/${ARREL}/avatars/${FOTO}?v=1`],
    ['sense fitxer', `sdp-media://mitjans/${ARREL}/avatars/`],
    ['buida', 'sdp-media://mitjans/'],
    ['una foto de Google', 'https://lh3.googleusercontent.com/a/foto=s96-c'],
    ['un text buit', ''],
    ['null', null],
    ['un número', 42],
    ['un objecte', { ref: REF }]
  ])('rebutja una ref %s sense cap petició ni cap línia a la consola', async (_cas, ref) => {
    const error = await esborraElMeuMitja(ref, CONFIG).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ codi: CODI_MITJANS.SENSE_PERMIS, code: CODI_MITJANS.SENSE_PERMIS });
    expect(error.message).toBe(`${PREFIX_ESBORRAT}només es poden esborrar les fotos que has pujat al teu perfil.`);
    senseSecrets(error.message);
    expect(m.client).not.toHaveBeenCalled();
    expect(m.esborra).not.toHaveBeenCalled();
    expect(totaLaConsola()).toBe('[]');
  });

  test('sense un poble UUID resolt, cap ref és esborrable', async () => {
    await expect(esborraElMeuMitja(REF, {})).rejects.toMatchObject({ codi: CODI_MITJANS.SENSE_PERMIS });
    await expect(esborraElMeuMitja(REF, { tenantId: 'la-torre' })).rejects.toMatchObject({ codi: CODI_MITJANS.SENSE_PERMIS });
    expect(m.esborra).not.toHaveBeenCalled();
  });

  test('amb un usuari de sessió que no és UUID, tampoc', async () => {
    m.usuari = { id: '0001' };
    await expect(esborraElMeuMitja(`sdp-media://mitjans/${POBLE}/0001/avatars/${FOTO}`, CONFIG))
      .rejects.toMatchObject({ codi: CODI_MITJANS.SENSE_PERMIS });
    expect(m.esborra).not.toHaveBeenCalled();
  });

  test('sense sessió demana entrar, sense cap petició', async () => {
    m.usuari = null;
    const error = await esborraElMeuMitja(REF, CONFIG).catch((e) => e);
    expect(error).toMatchObject({ codi: CODI_MITJANS.SESSIO, code: CODI_MITJANS.SESSIO, message: `${PREFIX_ESBORRAT}cal iniciar sessió.` });
    expect(m.client).not.toHaveBeenCalled();
  });

  test.each(['seed', 'local'])('en mode %s rebutja amb «no-disponible», també amb una ref vàlida', async (dataMode) => {
    const error = await esborraElMeuMitja(REF, { ...CONFIG, dataMode }).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ codi: 'no-disponible', code: 'no-disponible' });
    expect(error.codi).toBe(CODI_SEGON_FACTOR.NO_DISPONIBLE);
    expect(error.message).toBe(`${PREFIX_ESBORRAT}en este mode no hi ha cap servidor de fitxers.`);
    expect(m.client).not.toHaveBeenCalled();
    expect(m.esborra).not.toHaveBeenCalled();
  });

  test('un rebuig de Storage ix traduït i la consola no porta cap secret', async () => {
    const cru = errorPrivat({ status: 400, statusCode: '403', code: 'AccessDenied' });
    m.esborra.mockResolvedValue({ data: null, error: cru });
    const error = await esborraElMeuMitja(REF, CONFIG).catch((e) => e);
    expect(error).toMatchObject({ codi: CODI_MITJANS.SENSE_PERMIS, code: CODI_MITJANS.SENSE_PERMIS, status: 400 });
    expect(error.message).toBe(`${PREFIX_ESBORRAT}el servidor no t’ho ha permés.`);
    expect(error.cause).toBe(cru);
    senseSecrets(error.message, [cru.message]);
    expect(avis()).toHaveBeenCalledOnce();
    const [[text, dades]] = avis().mock.calls;
    expect(text.startsWith('[Storage] ')).toBe(true);
    expect(Object.keys(dades).sort()).toEqual(CLAUS);
    expect(dades).toEqual({ codi: CODI_MITJANS.SENSE_PERMIS, status: 400, statusCode: 403, code: 'AccessDenied' });
    senseSecrets(totaLaConsola(), [cru.message, 'privat:']);
  });

  test('una sessió caducada al servidor ix com a sessió', async () => {
    m.esborra.mockResolvedValue({ data: null, error: Object.assign(new Error('jwt expired'), { status: 400, statusCode: '403' }) });
    await expect(esborraElMeuMitja(REF, CONFIG)).rejects.toMatchObject({ codi: CODI_MITJANS.SESSIO });
  });

  test('una excepció de xarxa és «inabastable» i no imprimix el text cru', async () => {
    m.esborra.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(esborraElMeuMitja(REF, CONFIG)).rejects.toMatchObject({ codi: CODI_BACKEND_INABASTABLE, code: CODI_BACKEND_INABASTABLE });
    expect(avis()).toHaveBeenCalledOnce();
    senseSecrets(totaLaConsola(), ['Failed to fetch']);
  });

  test('si Storage no n’ha esborrat res, no és cap èxit', async () => {
    m.esborra.mockResolvedValue({ data: [], error: null });
    const error = await esborraElMeuMitja(REF, CONFIG).catch((e) => e);
    expect(error).toMatchObject({ codi: CODI_MITJANS.SENSE_PERMIS, code: CODI_MITJANS.SENSE_PERMIS });
    expect(error.message).toBe(`${PREFIX_ESBORRAT}el servidor no l’ha esborrada: potser ja no hi era o no tens permís.`);
    expect(m.esborra).toHaveBeenCalledOnce();
    expect(totaLaConsola()).toBe('[]');
  });
});
