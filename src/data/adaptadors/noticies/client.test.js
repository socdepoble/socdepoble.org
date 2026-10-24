// @vitest-environment node
/* T5 (P1-07, 261024) · El client del servei de notícies (client.js) amb un fetch fals: cap
   petició de veres. La resposta de prova té la forma del contracte sdp.noticies.v1 (README.md);
   la captura real arribarà quan el Mestre desplegue la funció.
   Actualitzada a posta (261024 T5b): el catàleg és ara el dels referents del §23 (cap À Punt ni
   Mallata): el sobre i les proves demanen 'emowe' i 'ayudawp', amb les mateixes regles. Les fonts
   personals (feedPersonal) són noves (describe «les fonts personals»).
   Actualitzada a posta (261024 Lector): el client pregunta ara l'estat del servei (GET /fonts, una
   vegada per sessió) abans del primer feed. El fetch fals respon per camí (`fals`): /fonts dona
   l'estat i /feed el sobre, i les proves que miraven «la primera crida» miren ara la crida a /feed
   (`cridesA`), amb les mateixes assercions. Una adreça personal que no ix és ara el motiu 'adreca'
   (R5-08: cap font contactada), no 'font', i el 422 del servei també. Els describes de l'estat, de
   les imatges, dels vídeos i de la cua de les personals són nous.
   Actualitzada a posta (261024 Lector final): R6 L-01, L-03 i L-08. (1) Només es guarda tota la
   sessió una resposta definitiva de /fonts (200 del contracte o 404 que no és del servei); una de
   passada val ESPERA_ESTAT_MS i després es torna a preguntar: les proves de les respostes de
   passada continuen amb les mateixes assercions dins de l'espera i miren, a més, que passada
   l'espera es pregunta de nou. (2) imatge() només fa l'adreça quan l'estat conegut diu que el
   servei hi és: les proves d'imatge pregunten primer l'estat (una petició a /fonts i cap a
   /imatge). (3) video() admet /shorts/<id>. (4) El 504 origen_buit (un 304 sense cos) és 'temps'. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FONTS_TERRITORIALS } from './cataleg.js';
import {
  CAMI_NOTICIES, ESPERA_ESTAT_MAXIMA_MS, ESPERA_ESTAT_MS, ErrorDades, ErrorNoticies, INCRUSTACIO_YOUTUBE, MAXIM_RESPOSTA, MAXIM_URL_PERSONAL,
  MOTIUS_NOTICIES, TEMPS_ESTAT_MS, TEMPS_FEED_MS,
  adrecaPersonalDelClient, creaServeiNoticies, decodificaEstat, decodificaFeed, decodificaFeedPersonal, motiuDe, videoDe
} from './client.js';

const ORIGEN = 'https://abcdefghijklmnop.supabase.co';
const XML = '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Prova</title></channel></rss>';
const SOBRE = Object.freeze({ font: 'emowe', xml: XML, obtingut: '2026-10-24T09:00:00.000Z', obsoleta: false });
const ESTAT = Object.freeze({ categories: [], fonts: [], personals: true });

const resposta = (cos, { status = 200, headers = {} } = {}) => new Response(cos === null ? null : JSON.stringify(cos), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers }
});
const errorWp = (codi, status) => resposta({ code: `sdp_noticies_${codi}`, message: 'x', data: { status } }, { status });
const camiDe = (url) => new URL(url).pathname;
/* El sobre bo de qualsevol feed: el de la font o el de l'adreça que s'ha demanat. */
function resso(url) {
  const consulta = new URL(url).searchParams;
  return consulta.has('url')
    ? resposta({ url: consulta.get('url'), xml: XML, obtingut: SOBRE.obtingut, obsoleta: false })
    : resposta({ ...SOBRE, font: consulta.get('font') });
}
/* Un fetch fals per camí: /fonts (l'estat) i /feed (els feeds). */
const fals = ({ fonts = () => resposta(ESTAT), feed = resso } = {}) => vi.fn(async (url, init) => (
  camiDe(url).endsWith('/fonts') ? fonts(url, init) : feed(url, init)
));
const cridesA = (fetch, final) => fetch.mock.calls.filter(([url]) => camiDe(url).endsWith(final));

let fetchImpl;
const servei = (opcions = {}) => creaServeiNoticies({ apiOrigin: ORIGEN, fetchImpl, ...opcions });
const motiuDelRebuig = async (promesa) => {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  throw new Error('havia de rebutjar');
};

beforeEach(() => {
  fetchImpl = fals();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('el transport', () => {
  test('GET sense credencials ni redireccions al camí de la funció, i només el paràmetre font', async () => {
    expect(await servei().feed('emowe')).toEqual(SOBRE);
    const [[url, init]] = cridesA(fetchImpl, '/feed');
    const adreca = new URL(url);
    expect(adreca.origin).toBe(ORIGEN);
    expect(adreca.pathname).toBe(`${CAMI_NOTICIES}/feed`);
    expect([...adreca.searchParams]).toEqual([['font', 'emowe']]);
    expect(init).toMatchObject({ method: 'GET', credentials: 'omit', redirect: 'error', headers: { Accept: 'application/json' } });
    /* Cap adreça de feed viatja mai: ni a la consulta ni a les capçaleres. */
    expect(url).not.toContain('emowe.com');
    expect(JSON.stringify(init.headers)).not.toMatch(/emowe|rss/i);
  });

  test('un id que el catàleg no porta no fa cap petició', async () => {
    for (const id of ['inventada', 'constructor', '', null, 'https://example.org/feed']) {
      const error = await motiuDelRebuig(servei().feed(id));
      expect(error).toBeInstanceOf(ErrorNoticies);
      expect(error.motiu).toBe('font');
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('fonts(): el catàleg sense adreces de feed, sense cap petició', async () => {
    const { categories, fonts } = await servei().fonts();
    expect(categories.map((categoria) => categoria.id)).toEqual(['coneixement', 'videos']);
    expect(fonts.map((font) => font.id)).toEqual(FONTS_TERRITORIALS.map((font) => font.id));
    expect(fonts.every((font) => !('feed' in font))).toBe(true);
    expect(Object.isFrozen(fonts)).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('l’origen ha de ser https i el camí, net', () => {
    expect(() => creaServeiNoticies({ apiOrigin: 'http://localhost:54321', fetchImpl })).toThrow(ErrorDades);
    expect(() => creaServeiNoticies({ apiOrigin: 'no és una adreça', fetchImpl })).toThrow(ErrorDades);
    expect(() => creaServeiNoticies({ apiOrigin: undefined, fetchImpl })).toThrow(ErrorDades);
    for (const cami of ['functions/v1/noticies', '//altre.example/x', '/functions/v1/noticies/', '/a/../b', '/a?b']) {
      expect(() => creaServeiNoticies({ apiOrigin: ORIGEN, cami, fetchImpl }), cami).toThrow(ErrorDades);
    }
    /* Un origen amb camí es queda només amb l'origen. */
    expect(() => creaServeiNoticies({ apiOrigin: `${ORIGEN}/rest/v1`, fetchImpl })).not.toThrow();
  });
});

describe('els motius', () => {
  test.each([
    [429, 'limit_superat', 'limit'],
    [504, 'origen_temps', 'temps'],
    [504, 'origen_buit', 'temps'],
    [502, 'origen_caigut', 'font'],
    [502, 'origen_format', 'font'],
    [502, 'origen_mida', 'font'],
    [404, 'font_desconeguda', 'servidor'],
    [500, 'intern', 'servidor'],
    [503, 'intern', 'servidor'],
    [401, 'intern', 'servidor'],
    [403, 'intern', 'servidor']
  ])('HTTP %i (sdp_noticies_%s) → %s', async (status, codi, motiu) => {
    fetchImpl = fals({ feed: () => errorWp(codi, status) });
    const error = await motiuDelRebuig(servei().feed('emowe'));
    expect(error).toBeInstanceOf(ErrorNoticies);
    expect(error.motiu).toBe(motiu);
    expect(MOTIUS_NOTICIES).toContain(error.motiu);
  });

  test('la xarxa no respon (TypeError de fetch) → sense-connexio', async () => {
    fetchImpl = fals({ feed: () => { throw new TypeError('Failed to fetch'); } });
    expect((await motiuDelRebuig(servei().feed('emowe'))).motiu).toBe('sense-connexio');
  });

  test(`${TEMPS_FEED_MS} ms sense resposta → temps, i la petició s’avorta`, async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    let senyal = null;
    fetchImpl = fals({
      feed: (url, init) => new Promise((resol, rebutja) => {
        senyal = init.signal;
        init.signal.addEventListener('abort', () => rebutja(new DOMException('avortada', 'AbortError')));
      })
    });
    const promesa = motiuDelRebuig(servei().feed('emowe'));
    /* L'estat (/fonts) respon abans: s'espera sense moure el rellotge fals. */
    for (let volta = 0; volta < 100 && !senyal; volta += 1) await new Promise((resol) => { setImmediate(resol); });
    expect(senyal).not.toBeNull();
    await vi.advanceTimersByTimeAsync(TEMPS_FEED_MS - 1);
    expect(senyal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const error = await promesa;
    expect(error.motiu).toBe('temps');
    expect(senyal.aborted).toBe(true);
  });

  test('una resposta que no casa amb el contracte → servidor', async () => {
    const dolentes = [
      () => new Response('<html>no</html>', { status: 200, headers: { 'content-type': 'text/html' } }),
      () => resposta({ ...SOBRE, font: 'ayudawp' }),
      () => resposta({ ...SOBRE, obsoleta: 'no' }),
      () => resposta({ ...SOBRE, xml: '' }),
      () => resposta({ ...SOBRE, obtingut: 'ahir' }),
      () => resposta([SOBRE]),
      () => resposta(SOBRE, { headers: { 'content-length': String(MAXIM_RESPOSTA + 1) } })
    ];
    for (const [i, fer] of dolentes.entries()) {
      fetchImpl = fals({ feed: fer });
      const error = await motiuDelRebuig(servei().feed('emowe'));
      expect(error.motiu, `resposta ${i}`).toBe('servidor');
    }
  });

  test('una cancel·lació passa tal qual (no és cap motiu)', async () => {
    const controlador = new AbortController();
    controlador.abort();
    const error = await motiuDelRebuig(servei().feed('emowe', { signal: controlador.signal }));
    expect(error).toBeInstanceOf(ErrorDades);
    expect(error.code).toBe('CANCELLED');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  /* Actualitzada a posta (261024 Lector): el 422 (una adreça que el servei no llig) és ara
     'adreca', no 'font' (R5-08). La resta de la taula, igual. */
  test('motiuDe: la taula sencera', () => {
    expect(motiuDe(new ErrorDades('TIMEOUT'))).toBe('temps');
    expect(motiuDe(new ErrorDades('UNAVAILABLE'))).toBe('sense-connexio');
    expect(motiuDe(new ErrorDades('UNAVAILABLE', 429))).toBe('limit');
    expect(motiuDe(new ErrorDades('UNAVAILABLE', 502))).toBe('font');
    expect(motiuDe(new ErrorDades('UNAVAILABLE', 504))).toBe('temps');
    expect(motiuDe(new ErrorDades('UNAVAILABLE', 404))).toBe('servidor');
    expect(motiuDe(new ErrorDades('UNAVAILABLE', 422))).toBe('adreca');
    expect(motiuDe(new ErrorDades('UNAVAILABLE', 400))).toBe('servidor');
    expect(motiuDe(new ErrorDades('UNAVAILABLE', 503))).toBe('servidor');
    expect(motiuDe(new ErrorDades('INVALID_PAYLOAD'))).toBe('servidor');
    expect(motiuDe(new ErrorDades('PAYLOAD_TOO_LARGE'))).toBe('servidor');
    expect(motiuDe(new ErrorDades('FORBIDDEN', 403))).toBe('servidor');
    expect(motiuDe(new ErrorNoticies('limit'))).toBe('limit');
    expect(motiuDe(new Error('qualsevol'))).toBe('servidor');
    expect(new ErrorNoticies('inventat').motiu).toBe('servidor');
  });

  /* Actualitzada a posta (261024 Lector): dos motius nous, 'adreca' i 'personals-off'. */
  test('MOTIUS_NOTICIES: la llista tancada (la mateixa de src/apps/lector/fontNoticies.js)', () => {
    expect(MOTIUS_NOTICIES).toEqual(['sense-connexio', 'temps', 'servidor', 'font', 'limit', 'adreca', 'personals-off']);
    expect(Object.isFrozen(MOTIUS_NOTICIES)).toBe(true);
    expect(new ErrorNoticies('adreca').motiu).toBe('adreca');
    expect(new ErrorNoticies('personals-off').motiu).toBe('personals-off');
  });
});

describe('el DTO del feed', () => {
  test('exactament quatre camps, congelat; obtingut pot ser null', () => {
    const dto = decodificaFeed({ ...SOBRE, sobrant: 'no passa' });
    expect(dto).toEqual(SOBRE);
    expect(Object.isFrozen(dto)).toBe(true);
    expect(decodificaFeed({ ...SOBRE, obtingut: null }).obtingut).toBeNull();
    expect(() => decodificaFeed(null)).toThrow(TypeError);
  });
});

/* 261024 Lector (Gemini G2-03, R5-01) · L'estat: una pregunta per sessió de pàgina, també quan
   falla; sense servei, cap feed ix. */
describe('l’estat del servei (GET /fonts)', () => {
  const NO_TROBADA = () => resposta({ code: 'NOT_FOUND', message: 'Requested function was not found' }, { status: 404 });

  test('una sola petició per sessió, memoritzada: GET sense credencials al camí de /fonts, sense consulta', async () => {
    const client = servei();
    expect(await client.estat()).toEqual({ disponible: true, personals: true });
    await Promise.all([client.estat(), client.feed('emowe'), client.feed('ayudawp'), client.feedPersonal('https://blog.example.org/feed')]);
    expect(Object.isFrozen(await client.estat())).toBe(true);
    const crides = cridesA(fetchImpl, '/fonts');
    expect(crides).toHaveLength(1);
    const [[url, init]] = crides;
    expect(camiDe(url)).toBe(`${CAMI_NOTICIES}/fonts`);
    expect(new URL(url).search).toBe('');
    expect(init).toMatchObject({ method: 'GET', credentials: 'omit', redirect: 'error', headers: { Accept: 'application/json' } });
  });

  test('un 404 que no és del servei (la funció no hi és): no disponible, i cap feed ni personal ix (com a molt UNA petició fallida)', async () => {
    for (const fonts of [NO_TROBADA, () => new Response('<html>404</html>', { status: 404, headers: { 'content-type': 'text/html' } }),
      () => resposta({ code: `sdp_noticies_${'x'.repeat(5000)}` }, { status: 404 })]) {
      fetchImpl = fals({ fonts });
      const client = servei();
      const rebutjos = await Promise.all([...FONTS_TERRITORIALS.map((font) => motiuDelRebuig(client.feed(font.id))),
        motiuDelRebuig(client.feedPersonal('https://blog.example.org/feed'))]);
      expect(rebutjos.map((error) => error.motiu)).toEqual(Array(FONTS_TERRITORIALS.length + 1).fill('servidor'));
      expect(await client.estat()).toEqual({ disponible: false, personals: false });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    }
  });

  /* Actualitzada a posta (261024 Lector final): R6 L-01. La resposta és de passada: dins de
     l'espera, les mateixes assercions (cap feed ix, una sola petició); passada l'espera, es torna a
     preguntar, i si la xarxa ja hi arriba, el Lector torna. */
  test('la xarxa no arriba amb el dispositiu en línia: no disponible durant ESPERA_ESTAT_MS (motiu servidor, cap petició més); després es torna a preguntar', async () => {
    let moment = 0;
    let caiguda = true;
    fetchImpl = fals({ fonts: () => { if (caiguda) throw new TypeError('Failed to fetch'); return resposta(ESTAT); } });
    const client = servei({ enLinia: () => true, ara: () => moment });
    expect((await motiuDelRebuig(client.feed('emowe'))).motiu).toBe('servidor');
    expect((await motiuDelRebuig(client.feed('ayudawp'))).motiu).toBe('servidor');
    expect(await client.estat()).toEqual({ disponible: false, personals: false });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    moment += ESPERA_ESTAT_MS - 1;
    expect((await motiuDelRebuig(client.feed('emowe'))).motiu).toBe('servidor');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    caiguda = false;
    moment += 1;
    expect(await client.feed('emowe')).toEqual(SOBRE);
    expect(await client.estat()).toEqual({ disponible: true, personals: true });
    expect(cridesA(fetchImpl, '/fonts')).toHaveLength(2);
  });

  test('fora de línia (el dispositiu ho diu): motiu sense-connexio i NO es guarda; quan torna la xarxa, es pregunta una vegada més', async () => {
    let enLinia = false;
    let senseXarxa = true;
    fetchImpl = fals({ fonts: () => { if (senseXarxa) throw new TypeError('Failed to fetch'); return resposta(ESTAT); } });
    const client = servei({ enLinia: () => enLinia });
    expect((await motiuDelRebuig(client.feed('emowe'))).motiu).toBe('sense-connexio');
    enLinia = true;
    senseXarxa = false;
    expect(await client.feed('emowe')).toEqual(SOBRE);
    await client.feed('ayudawp');
    expect(cridesA(fetchImpl, '/fonts')).toHaveLength(2);
  });

  /* Actualitzada a posta (261024 Lector final): R6 L-01. Dins de l'espera, les mateixes
     assercions; passada l'espera, es torna a preguntar i, si el servei diu personals: true, les
     personals ixen (abans quedaven apagades tota la sessió). */
  test('un 404 del servei, un 5xx, un 429 o un sobre que no casa: disponible sense personals durant l’espera (cap adreça ix); després es torna a preguntar', async () => {
    for (const dolenta of [() => errorWp('ruta', 404), () => errorWp('intern', 500), () => errorWp('limit', 429), () => resposta({ personals: true }),
      () => resposta(ESTAT, { headers: { 'content-type': 'text/html' } })]) {
      let moment = 0;
      let bona = false;
      fetchImpl = fals({ fonts: () => (bona ? resposta(ESTAT) : dolenta()) });
      const client = servei({ ara: () => moment });
      expect(await client.estat()).toEqual({ disponible: true, personals: false });
      expect(await client.feed('emowe')).toEqual(SOBRE);
      expect((await motiuDelRebuig(client.feedPersonal('https://blog.example.org/feed'))).motiu).toBe('personals-off');
      expect(cridesA(fetchImpl, '/feed').map(([url]) => [...new URL(url).searchParams.keys()])).toEqual([['font']]);
      expect(cridesA(fetchImpl, '/fonts')).toHaveLength(1);
      bona = true;
      moment += ESPERA_ESTAT_MS;
      expect((await client.feedPersonal('https://blog.example.org/feed')).url).toBe('https://blog.example.org/feed');
      expect(await client.estat()).toEqual({ disponible: true, personals: true });
      expect(cridesA(fetchImpl, '/fonts')).toHaveLength(2);
    }
  });

  /* R6 L-01 (Lector final) · Una fallada de passada no apaga el Lector tota la sessió. */
  test('la primera /fonts falla amb el dispositiu en línia; «Torna-ho a provar» passada l’espera ho recupera', async () => {
    let moment = 1000;
    const respostes = [() => { throw new TypeError('Failed to fetch'); }, () => resposta(ESTAT)];
    fetchImpl = fals({ fonts: () => respostes.shift()() });
    const client = servei({ enLinia: () => true, ara: () => moment });
    /* La primera ronda: totes les fonts cauen amb 'servidor' i només ix la pregunta de l'estat. */
    const primera = await Promise.all(FONTS_TERRITORIALS.map((font) => motiuDelRebuig(client.feed(font.id))));
    expect(primera.map((error) => error.motiu)).toEqual(Array(FONTS_TERRITORIALS.length).fill('servidor'));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    /* «Torna-ho a provar» passada l'espera: una pregunta nova, i els feeds ixen. */
    moment += ESPERA_ESTAT_MS;
    const segona = await Promise.all(FONTS_TERRITORIALS.map((font) => client.feed(font.id)));
    expect(segona.map((dto) => dto.font)).toEqual(FONTS_TERRITORIALS.map((font) => font.id));
    expect(cridesA(fetchImpl, '/fonts')).toHaveLength(2);
    expect(cridesA(fetchImpl, '/feed')).toHaveLength(FONTS_TERRITORIALS.length);
  });

  test('un 503 a /fonts no apaga les fonts personals tota la sessió: passada l’espera, el servei les llig', async () => {
    let moment = 0;
    const respostes = [() => errorWp('intern', 503), () => resposta(ESTAT)];
    fetchImpl = fals({ fonts: () => respostes.shift()() });
    const client = servei({ ara: () => moment });
    expect((await motiuDelRebuig(client.feedPersonal('https://blog.example.org/feed'))).motiu).toBe('personals-off');
    expect(cridesA(fetchImpl, '/feed')).toHaveLength(0);
    moment += ESPERA_ESTAT_MS;
    expect((await client.feedPersonal('https://blog.example.org/feed')).url).toBe('https://blog.example.org/feed');
    expect(cridesA(fetchImpl, '/feed').map(([url]) => [...new URL(url).searchParams.keys()])).toEqual([['url']]);
  });

  test('dues fallades seguides: la segona espera ESPERA_ESTAT_MAXIMA_MS; una resposta definitiva ja no es torna a preguntar mai', async () => {
    let moment = 0;
    const respostes = [() => errorWp('intern', 500), () => errorWp('limit', 429), () => resposta(ESTAT)];
    fetchImpl = fals({ fonts: () => respostes.shift()() });
    const client = servei({ ara: () => moment });
    await client.estat();
    moment += ESPERA_ESTAT_MS;
    await client.estat();
    expect(cridesA(fetchImpl, '/fonts')).toHaveLength(2);
    moment += ESPERA_ESTAT_MS;
    expect(await client.estat()).toEqual({ disponible: true, personals: false });
    expect(cridesA(fetchImpl, '/fonts')).toHaveLength(2);
    moment += ESPERA_ESTAT_MAXIMA_MS - ESPERA_ESTAT_MS;
    expect(await client.estat()).toEqual({ disponible: true, personals: true });
    expect(cridesA(fetchImpl, '/fonts')).toHaveLength(3);
    moment += 24 * 60 * 60 * 1000;
    await Promise.all([client.estat(), client.feed('emowe')]);
    expect(cridesA(fetchImpl, '/fonts')).toHaveLength(3);
  });

  test('un 404 que no és del servei també és definitiu: la funció no hi és, i no es torna a preguntar', async () => {
    let moment = 0;
    fetchImpl = fals({ fonts: NO_TROBADA });
    const client = servei({ ara: () => moment });
    expect(await client.estat()).toEqual({ disponible: false, personals: false });
    moment += 24 * 60 * 60 * 1000;
    expect((await motiuDelRebuig(client.feed('emowe'))).motiu).toBe('servidor');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test('dues preguntes alhora mentre la de l’estat va de camí comparteixen la mateixa petició', async () => {
    let respon;
    fetchImpl = fals({ fonts: () => new Promise((resol) => { respon = () => resol(errorWp('intern', 500)); }) });
    const client = servei();
    const estats = Promise.all([client.estat(), client.estat()]);
    await vi.waitFor(() => expect(respon).toBeTypeOf('function'));
    respon();
    expect(await estats).toEqual([{ disponible: true, personals: false }, { disponible: true, personals: false }]);
    expect(cridesA(fetchImpl, '/fonts')).toHaveLength(1);
  });

  test('personals: false, o un servei d’abans que no ho diu: cap font personal ix (personals-off, sense petició)', async () => {
    for (const cos of [{ ...ESTAT, personals: false }, { categories: [], fonts: [] }, { ...ESTAT, personals: 'true' }]) {
      fetchImpl = fals({ fonts: () => resposta(cos) });
      const client = servei();
      const error = await motiuDelRebuig(client.feedPersonal('https://blog.example.org/feed'));
      expect(error).toBeInstanceOf(ErrorNoticies);
      expect(error.motiu).toBe('personals-off');
      expect(cridesA(fetchImpl, '/feed')).toHaveLength(0);
    }
  });

  test(`${TEMPS_ESTAT_MS} ms sense resposta de /fonts: disponible sense personals, i els feeds ixen`, async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fetchImpl = fals({
      fonts: (url, init) => new Promise((resol, rebutja) => {
        init.signal.addEventListener('abort', () => rebutja(new DOMException('avortada', 'AbortError')));
      })
    });
    const client = servei();
    const feed = client.feed('emowe');
    await vi.advanceTimersByTimeAsync(TEMPS_ESTAT_MS);
    expect(await feed).toEqual(SOBRE);
    expect(await client.estat()).toEqual({ disponible: true, personals: false });
  });

  test('un senyal avortat mentre s’espera l’estat: CANCELLED tot d’una, i el feed no ix', async () => {
    let respon;
    fetchImpl = fals({ fonts: () => new Promise((resol) => { respon = () => resol(resposta(ESTAT)); }) });
    const client = servei();
    const controlador = new AbortController();
    const feed = motiuDelRebuig(client.feed('emowe', { signal: controlador.signal }));
    await vi.waitFor(() => expect(respon).toBeTypeOf('function'));
    controlador.abort();
    const error = await feed;
    expect(error).toBeInstanceOf(ErrorDades);
    expect(error.code).toBe('CANCELLED');
    respon();
    expect(await client.estat()).toEqual({ disponible: true, personals: true });
    expect(cridesA(fetchImpl, '/feed')).toHaveLength(0);
  });

  test('decodificaEstat: només el sobre de /fonts; personals només si és true', () => {
    expect(decodificaEstat(ESTAT)).toEqual({ disponible: true, personals: true });
    expect(decodificaEstat({ categories: [], fonts: [] })).toEqual({ disponible: true, personals: false });
    for (const dolent of [null, [], {}, { categories: [] }, { fonts: [] }, 'x']) expect(() => decodificaEstat(dolent)).toThrow(TypeError);
  });
});

/* T5b (ordre del Mestre, 261024) · Les fonts personals: el navegador només demana l'adreça al
   servei del poble (GET …/feed?url=), mai a l'origen; i abans d'eixir la comprova. */
describe('les fonts personals', () => {
  const PERSONAL = 'https://blog.example.org/feed/';
  const SOBRE_PERSONAL = Object.freeze({ url: PERSONAL, xml: XML, obtingut: '2026-10-24T09:00:00.000Z', obsoleta: false });

  test('GET sense credencials ni redireccions al camí de la funció, amb url i prou; el fragment no viatja', async () => {
    fetchImpl = fals({ feed: () => resposta(SOBRE_PERSONAL) });
    expect(await servei().feedPersonal(`${PERSONAL}#avui`)).toEqual(SOBRE_PERSONAL);
    const [[url, init]] = cridesA(fetchImpl, '/feed');
    const adreca = new URL(url);
    expect(adreca.origin).toBe(ORIGEN);
    expect(adreca.pathname).toBe(`${CAMI_NOTICIES}/feed`);
    expect([...adreca.searchParams]).toEqual([['url', PERSONAL]]);
    expect(init).toMatchObject({ method: 'GET', credentials: 'omit', redirect: 'error', headers: { Accept: 'application/json' } });
    expect(new URL(url).origin).not.toBe('https://blog.example.org');
  });

  /* Actualitzada a posta (261024 Lector): el motiu és ara 'adreca' (R5-08), no 'font': no s'ha
     contactat cap font. Cap petició, tampoc la de l'estat. */
  test('una adreça que no és https neta, o massa llarga, no fa cap petició: motiu adreca', async () => {
    fetchImpl = fals({ feed: () => resposta(SOBRE_PERSONAL) });
    for (const adreca of ['http://blog.example.org/feed', 'https://u:p@blog.example.org/feed', 'https://blog.example.org:8443/feed', 'ftp://blog.example.org/',
      'no és una adreça', '', null, 42, `https://blog.example.org/${'a'.repeat(MAXIM_URL_PERSONAL)}`]) {
      const error = await motiuDelRebuig(servei().feedPersonal(adreca));
      expect(error, String(adreca)).toBeInstanceOf(ErrorNoticies);
      expect(error.motiu, String(adreca)).toBe('adreca');
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  /* Actualitzada a posta (261024 Lector): 'adreca', no 'font' (R5-08). */
  test('la Frontissa no deixa eixir un valor de més de 512 caràcters: tampoc ix, motiu adreca', async () => {
    const llarga = `https://blog.example.org/feed?q=${'a'.repeat(600)}`;
    expect(adrecaPersonalDelClient(llarga)).toBe(llarga);
    expect((await motiuDelRebuig(servei().feedPersonal(llarga))).motiu).toBe('adreca');
    expect(cridesA(fetchImpl, '/feed')).toHaveLength(0);
  });

  /* Actualitzada a posta (261024 Lector): el 422 és 'adreca' (R5-08); el 503 personals_sense_dns,
     'servidor'; el 429 ocupat, 'limit'. */
  test.each([
    [422, 'adreca_vetada', 'adreca'],
    [400, 'peticio', 'servidor'],
    [429, 'limit', 'limit'],
    [429, 'ocupat', 'limit'],
    [503, 'personals_sense_dns', 'servidor'],
    [502, 'origen_caigut', 'font'],
    [504, 'origen_temps', 'temps']
  ])('HTTP %i (sdp_noticies_%s) → %s', async (status, codi, motiu) => {
    fetchImpl = fals({ feed: () => errorWp(codi, status) });
    expect((await motiuDelRebuig(servei().feedPersonal(PERSONAL))).motiu).toBe(motiu);
  });

  test('una resposta que no casa amb el contracte (una altra adreça, el sobre d’una font del sistema) → servidor; una cancel·lació, tal qual', async () => {
    for (const cos of [{ ...SOBRE_PERSONAL, url: 'https://altra.example.org/feed' }, SOBRE, { ...SOBRE_PERSONAL, xml: '' }]) {
      fetchImpl = fals({ feed: () => resposta(cos) });
      expect((await motiuDelRebuig(servei().feedPersonal(PERSONAL))).motiu).toBe('servidor');
    }
    const controlador = new AbortController();
    controlador.abort();
    const error = await motiuDelRebuig(servei().feedPersonal(PERSONAL, { signal: controlador.signal }));
    expect(error).toBeInstanceOf(ErrorDades);
    expect(error.code).toBe('CANCELLED');
  });

  test('el DTO personal: exactament quatre camps, congelat', () => {
    const dto = decodificaFeedPersonal({ ...SOBRE_PERSONAL, font: 'sobrant' });
    expect(dto).toEqual(SOBRE_PERSONAL);
    expect(Object.isFrozen(dto)).toBe(true);
    expect(() => decodificaFeedPersonal(SOBRE)).toThrow(TypeError);
    expect(adrecaPersonalDelClient('https://Blog.Example.org:443/feed#x')).toBe('https://blog.example.org/feed');
  });

  test('d’una en una (el servei n’admet una alhora per connexió): la segona ix quan acaba la primera; una avortada a la cua no deixa passar la tercera', async () => {
    const pendents = [];
    fetchImpl = fals({ feed: (url) => new Promise((resol) => { pendents.push({ url, resol }); }) });
    const client = servei();
    const adreca = (i) => `https://blog${i}.example.org/feed`;
    const sobre = (url) => resposta({ ...SOBRE_PERSONAL, url: new URL(url).searchParams.get('url') });
    const primera = client.feedPersonal(adreca(1));
    const controlador = new AbortController();
    const segona = motiuDelRebuig(client.feedPersonal(adreca(2), { signal: controlador.signal }));
    const tercera = client.feedPersonal(adreca(3));
    await vi.waitFor(() => expect(pendents).toHaveLength(1));
    controlador.abort();
    expect((await segona).code).toBe('CANCELLED');
    await new Promise((resol) => { setTimeout(resol, 0); });
    expect(pendents).toHaveLength(1);
    pendents[0].resol(sobre(pendents[0].url));
    expect((await primera).url).toBe(adreca(1));
    await vi.waitFor(() => expect(pendents).toHaveLength(2));
    expect(new URL(pendents[1].url).searchParams.get('url')).toBe(adreca(3));
    pendents[1].resol(sobre(pendents[1].url));
    expect((await tercera).url).toBe(adreca(3));
  });
});

/* 261024 Lector · Les imatges i els vídeos: dues funcions pures, cap xarxa. */
/* Actualitzada a posta (261024 Lector final): R6 L-08. imatge() només fa l'adreça amb un estat
   conegut que diu que el servei hi és; per això estes proves pregunten primer l'estat (una petició
   a /fonts). imatge() mateixa continua sense fer cap petició. */
describe('imatge(): l’adreça del servei per a una imatge d’un feed', () => {
  test('una imatge https: <base>/imatge?u=<adreça>, sense fragment; imatge() no fa cap petició', async () => {
    const client = servei();
    await client.estat();
    const abans = fetchImpl.mock.calls.length;
    const adreca = client.imatge('https://cdn.example.org/a.jpg?w=1&h=2#x');
    const url = new URL(adreca);
    expect(url.origin).toBe(ORIGEN);
    expect(url.pathname).toBe(`${CAMI_NOTICIES}/imatge`);
    expect([...url.searchParams]).toEqual([['u', 'https://cdn.example.org/a.jpg?w=1&h=2']]);
    expect(adreca).not.toContain('#');
    expect(fetchImpl.mock.calls.length).toBe(abans);
    expect(cridesA(fetchImpl, '/imatge')).toHaveLength(0);
  });

  test('qualsevol altra cosa: null (http, credencials, port, data:, relativa, massa llarga, no és text)', async () => {
    const client = servei();
    await client.estat();
    for (const res of ['http://cdn.example.org/a.jpg', 'https://u:p@cdn.example.org/a.jpg', 'https://cdn.example.org:8443/a.jpg',
      'data:image/png;base64,AAAA', '/relativa.png', '', null, undefined, 42, `https://cdn.example.org/${'a'.repeat(MAXIM_URL_PERSONAL)}`]) {
      expect(client.imatge(res), String(res)).toBeNull();
    }
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(cridesA(fetchImpl, '/imatge')).toHaveLength(0);
  });

  /* R6 L-08 · Cap petició condemnada: sense servei (o abans de saber-ho), cap adreça d'imatge. */
  test('abans de saber l’estat, o amb el servei absent, null: cap miniatura convida a una petició que fallaria', async () => {
    const IMATGE = 'https://cdn.example.org/a.jpg';
    expect(servei().imatge(IMATGE)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
    for (const fonts of [() => resposta({ code: 'NOT_FOUND' }, { status: 404 }), () => { throw new TypeError('Failed to fetch'); }]) {
      fetchImpl = fals({ fonts });
      const client = servei({ enLinia: () => true });
      expect((await client.estat()).disponible).toBe(false);
      expect(client.imatge(IMATGE)).toBeNull();
    }
    /* Fora de línia, tampoc. Amb un servei que hi és però sense personals (un 5xx de passada), sí. */
    fetchImpl = fals({ fonts: () => { throw new TypeError('Failed to fetch'); } });
    const fora = servei({ enLinia: () => false });
    await fora.estat();
    expect(fora.imatge(IMATGE)).toBeNull();
    fetchImpl = fals({ fonts: () => errorWp('intern', 503) });
    const ambServei = servei();
    expect(await ambServei.estat()).toEqual({ disponible: true, personals: false });
    expect(ambServei.imatge(IMATGE)).toMatch(/\/imatge\?u=/);
  });
});

describe('video(): els vídeos de YouTube, incrustats sense galetes', () => {
  const NOCOOKIE = ['https://www.youtube', '-nocookie.com/embed/'].join('');

  test('watch?v= i youtu.be: l’id, la incrustació sense galetes i l’enllaç net', () => {
    const esperat = { proveidor: 'youtube', id: 'dQw4w9WgXcQ', incrustacio: `${NOCOOKIE}dQw4w9WgXcQ`, enllac: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
    expect(INCRUSTACIO_YOUTUBE).toBe(NOCOOKIE);
    for (const enllac of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&si=rastre',
      'https://youtu.be/dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ?si=rastre', 'https://www.youtube.com:443/watch?v=dQw4w9WgXcQ#minut']) {
      const video = servei().video(enllac);
      expect(video, enllac).toEqual(esperat);
      expect(Object.isFrozen(video)).toBe(true);
    }
    expect(videoDe('https://youtu.be/a_b-c1D2e3F')?.id).toBe('a_b-c1D2e3F');
  });

  /* R6 L-03 (Lector final) · Els Shorts: 12 dels 15 vídeos de Migue Baena ho són. */
  test('/shorts/<id>: el mateix id, la mateixa incrustació sense galetes i l’enllaç net /watch?v=', () => {
    for (const [enllac, id] of [['https://www.youtube.com/shorts/Wjit5lnEiIY', 'Wjit5lnEiIY'], ['https://www.youtube.com/shorts/qToiptX7rLw', 'qToiptX7rLw'],
      ['https://www.youtube.com/shorts/91uaIeMxzZ4?feature=share', '91uaIeMxzZ4'], ['https://www.youtube.com:443/shorts/a_b-c1D2e3F#x', 'a_b-c1D2e3F']]) {
      const video = servei().video(enllac);
      expect(video, enllac).toEqual({ proveidor: 'youtube', id, incrustacio: `${NOCOOKIE}${id}`, enllac: `https://www.youtube.com/watch?v=${id}` });
      expect(Object.isFrozen(video)).toBe(true);
    }
  });

  test('/shorts/ amb un camí de més, sense id o amb un id que no és d’11 caràcters: null', () => {
    for (const res of ['https://www.youtube.com/shorts/Wjit5lnEiIY/extra', 'https://www.youtube.com/shorts/Wjit5lnEiIY/', 'https://www.youtube.com/shorts/',
      'https://www.youtube.com/shorts', 'https://www.youtube.com/shorts/Wjit5lnEiI', 'https://www.youtube.com/shorts/Wjit5lnEiIYx',
      'https://www.youtube.com/shorts/Wjit5lnE%3CY', 'https://www.youtube.com/shorts//Wjit5lnEiIY', 'https://youtube.com/shorts/Wjit5lnEiIY',
      'https://m.youtube.com/shorts/Wjit5lnEiIY', 'http://www.youtube.com/shorts/Wjit5lnEiIY', 'https://www.youtube.com/x/shorts/Wjit5lnEiIY',
      'https://u:p@www.youtube.com/shorts/Wjit5lnEiIY', 'https://www.youtube.com:8443/shorts/Wjit5lnEiIY']) {
      expect(videoDe(res), res).toBeNull();
    }
  });

  test('qualsevol altra cosa: null', () => {
    for (const res of ['http://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtube.com/watch?v=dQw4w9WgXcQ', 'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      `${NOCOOKIE}dQw4w9WgXcQ`, 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=curt', 'https://www.youtube.com/watch?v=dQw4w9WgXcQx',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&v=aaaaaaaaaaa', 'https://www.youtube.com/watch', 'https://youtu.be/', 'https://youtu.be/dQw4w9WgXcQ/x',
      'https://youtu.be/dQw4w9Wg%3CQ', 'https://u:p@youtu.be/dQw4w9WgXcQ', 'https://youtu.be:8443/dQw4w9WgXcQ', 'https://www.youtube.com.example.org/watch?v=dQw4w9WgXcQ',
      'no és un enllaç', '', null, 42]) {
      expect(videoDe(res), String(res)).toBeNull();
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
