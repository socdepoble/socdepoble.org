// @vitest-environment node
/* T5 (P1-07, 261024) · El servei de notícies (gestor.js) amb un fetch, un rellotge i uns
   temporitzadors falsos: cap petició de veres. Les respostes de l'origen són feeds mínims fets
   a mà, amb adreces d'example.org.
   Actualitzada a posta (261024 T5b): el catàleg ja no porta À Punt (les fonts del sistema són els
   referents del §23 del text legal), i les proves de les fonts del sistema demanen ara AyudaWP
   (ayudawp.com) en lloc d'apunt (www.apuntmedia.es), amb les mateixes regles i els mateixos codis.
   Les fonts personals (?url=, describe «les fonts personals») són noves; «el codi» admet ara que
   index.ts llija dues variables d'entorn (cap secret).
   Actualitzada a posta (261024 Lector): les troballes R5 i la D-08 de Codex. Tres proves canvien
   perquè el que fixaven era el defecte: (1) «el codi» llig ara que index.ts encén les personals
   només amb '1' i que les baixades de fora porten les seues regles; (2) «sense resoledor» ja no és
   200 sinó 503 personals_sense_dns (D-08: mai «sense resoledor, és pública»); (3) la memòria
   personal ja no es comparteix entre connexions (R5-05), i la prova de la fita la demana des de la
   mateixa IP. Els describes nous (el límit per connexió, l'empremta, les baixades alhora, la
   memòria per connexió, el BOM, les IP noves i les imatges) són nous.
   Actualitzada a posta (261024 Lector final): les troballes R6 del servei. Canvien perquè el que
   fixaven era el defecte: (1) «el codi» llig ara una tercera variable pública,
   SDP_NOTICIES_IMATGES_EXTERNES (L-12); (2) amb la taula del límit plena, una connexió nova ja no
   espera sense més (era un bloqueig barat per a tothom, L-05): fa lloc traient la finestra viva
   menys gastada, i només espera si totes són al límit; (3) les imatges d'un host del catàleg es
   servixen encara que la instància no les haja vistes (L-08), i les de fora del catàleg només amb
   l'interruptor encés (L-12): les proves d'imatges de fora l'encenen (preparaImatges), i les que
   miraven «desconeguda» amb una del catàleg la miren ara amb una de fora; (4) la novena imatge alhora
   ja no és 'ocupat': espera el seu torn (L-02); (5) les imatges d'una font personal són només de la
   connexió que la llig (L-11); (6) la primera <img> d'un contingut és la que tria el nucli del Lector
   (L-09). Els describes R6 són nous. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test, vi } from 'vitest';
import {
  ACCEPTA, ACCEPTA_IMATGE, AGENT_USUARI, CDN_IMATGES, ESPERA_OCUPAT_S, ESPERA_TORN_IMATGE_MS, FRESC_IMATGE_MS, FRESC_MS, LIMIT, LIMIT_IMATGES,
  LIMIT_PERSONALS, MAXIM_BYTES, MAXIM_BYTES_CAU_IMATGES, MAXIM_BYTES_IMATGE, MAXIM_BYTES_PERSONAL, MAXIM_CAU_PERSONALS, MAXIM_EMPREMTES,
  MAXIM_IMATGES_CAU, MAXIM_IMATGES_EN_CUA, MAXIM_IMATGES_EN_VOL, MAXIM_PERSONALS_EN_VOL, MAXIM_URL_PERSONAL, MAX_AGE_IMATGE_S, OBSOLET_MS,
  TEMPS_ORIGEN_MS, TIPUS_IMATGE, VIDA_IMATGES_MS, adrecaPersonal, clauAmple, clauDeQui, clauDeXarxa, creaEmpremtador, creaGestor, creaLimit,
  HOSTS_DEL_SISTEMA, descodificaFeed, esFeed, esIpNoPublica, imatgesDelFeed, validaCataleg
} from './gestor.js';

const ARREL = process.cwd();
const CARPETA = 'supabase/functions/noticies';
const CATALEG = JSON.parse(readFileSync(path.join(ARREL, CARPETA, 'fonts.json'), 'utf8'));
const FONT = CATALEG.fonts.find((font) => font.id === 'ayudawp');
const FEED = FONT.feed;
const HOST = new URL(FEED).hostname;
const BASE = 'https://abcdefghijklmnop.supabase.co/noticies';
const RSS = '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Prova</title><link>https://example.org/</link></channel></rss>';

const origen = (cos, { status = 200, headers = {} } = {}) => new Response(cos, {
  status, headers: { 'content-type': 'application/rss+xml; charset=utf-8', ...headers }
});

/* Un temporitzador manual: les proves decidixen quan es complix el termini. */
function temporitzadorManual() {
  const pendents = new Map();
  let seguent = 1;
  return {
    posa: (fer, ms) => { const id = seguent++; pendents.set(id, { fer, ms }); return id; },
    lleva: (id) => { pendents.delete(id); },
    venc: () => { for (const [id, { fer }] of pendents) { pendents.delete(id); fer(); } },
    /* Només els que compleix `tria(id)`: per a vencer una espera sense avortar cap baixada. */
    vencEls: (tria) => { for (const [id, { fer }] of pendents) if (tria(id)) { pendents.delete(id); fer(); } },
    pendents
  };
}

function prepara({ fetchImpl = vi.fn(async () => origen(RSS)), inici = Date.UTC(2026, 9, 24, 9, 0, 0), ...opcions } = {}) {
  let moment = inici;
  const temporitzador = temporitzadorManual();
  const gestiona = creaGestor({ cataleg: CATALEG, fetchImpl, ara: () => moment, temporitzador, ...opcions });
  const demana = (cami, { method = 'GET', ip = '198.51.100.7', headers = {} } = {}) => gestiona(
    new Request(`${BASE}${cami}`, { method, headers: { 'x-forwarded-for': ip, ...headers } }),
    { remoteAddr: { hostname: '10.0.0.1' } }
  );
  return { gestiona, demana, fetchImpl, temporitzador, avança: (ms) => { moment += ms; } };
}

async function errorDe(resposta) {
  const cos = await resposta.json();
  return { status: resposta.status, ...cos };
}

describe('les rutes i la forma de les respostes', () => {
  test('GET /fonts: les categories i les fonts sense l’adreça del feed, CORS obert sense credencials i memòria de 5 min', async () => {
    const { demana, fetchImpl } = prepara();
    const resposta = await demana('/fonts');
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(resposta.headers.get('access-control-allow-origin')).toBe('*');
    expect(resposta.headers.get('access-control-allow-credentials')).toBeNull();
    expect(resposta.headers.get('cache-control')).toBe('public, max-age=300');
    const { categories, fonts } = await resposta.json();
    expect(categories.map((c) => c.id)).toEqual(CATALEG.categories.map((c) => c.id));
    expect(fonts.map((f) => f.id)).toEqual(CATALEG.fonts.map((f) => f.id));
    expect(fonts.every((f) => !('feed' in f))).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('GET /feed?font=ayudawp: el sobre del contracte', async () => {
    const { demana } = prepara();
    const resposta = await demana('/feed?font=ayudawp');
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('cache-control')).toBe('public, max-age=300');
    expect(resposta.headers.get('access-control-allow-origin')).toBe('*');
    expect(await resposta.json()).toEqual({ font: 'ayudawp', xml: RSS, obtingut: '2026-10-24T09:00:00.000Z', obsoleta: false });
  });

  test('OPTIONS respon el CORS; un altre mètode, 405; una altra ruta, 404', async () => {
    const { demana } = prepara();
    const opcions = await demana('/feed', { method: 'OPTIONS' });
    expect(opcions.status).toBe(204);
    expect(opcions.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
    expect(await errorDe(await demana('/feed?font=ayudawp', { method: 'POST' }))).toEqual({
      status: 405, code: 'sdp_noticies_metode', message: expect.any(String), data: { status: 405 }
    });
    expect((await errorDe(await demana('/res'))).code).toBe('sdp_noticies_ruta');
  });

  test('els errors porten la forma de WP REST, CORS i no-store', async () => {
    const { demana } = prepara();
    const resposta = await demana('/feed?font=inventada');
    expect(resposta.headers.get('cache-control')).toBe('no-store');
    expect(resposta.headers.get('access-control-allow-origin')).toBe('*');
    expect(await errorDe(resposta)).toEqual({ status: 404, code: 'sdp_noticies_font_desconeguda', message: 'El servei no coneix esta font.', data: { status: 404 } });
  });
});

describe('la llista blanca: l’únic que entra és un id', () => {
  test('un id desconegut, mal format, absent o amb paràmetres de més no fa cap petició', async () => {
    const { demana, fetchImpl } = prepara();
    expect((await errorDe(await demana('/feed?font=inventada'))).code).toBe('sdp_noticies_font_desconeguda');
    expect((await errorDe(await demana('/feed?font=..%2Fayudawp'))).code).toBe('sdp_noticies_font_desconeguda');
    expect((await errorDe(await demana('/feed?font=apunt'))).code).toBe('sdp_noticies_font_desconeguda');
    expect((await errorDe(await demana('/feed?font=constructor'))).code).toBe('sdp_noticies_font_desconeguda');
    expect((await errorDe(await demana('/feed'))).code).toBe('sdp_noticies_peticio');
    expect((await errorDe(await demana('/feed?font=ayudawp&url=https%3A%2F%2Fexample.org%2Fx'))).code).toBe('sdp_noticies_peticio');
    expect((await errorDe(await demana('/feed?url=https%3A%2F%2Fexample.org%2Fx'))).code).toBe('sdp_noticies_peticio');
    expect((await errorDe(await demana('/fonts?font=ayudawp'))).code).toBe('sdp_noticies_peticio');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('a l’origen: l’adreça del catàleg, GET, l’agent honest, sense redireccions automàtiques', async () => {
    const { demana, fetchImpl } = prepara();
    await demana('/feed?font=ayudawp', { headers: { cookie: 'no=passa', authorization: 'Bearer no-passa' } });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(FEED);
    expect(init).toMatchObject({ method: 'GET', redirect: 'manual', headers: { 'User-Agent': AGENT_USUARI, Accept: ACCEPTA } });
    expect(Object.keys(init.headers).sort()).toEqual(['Accept', 'User-Agent']);
    expect(AGENT_USUARI).toBe('SocDePoble/1.0 (+https://socdepoble.org/projecte)');
  });

  /* Actualitzada a posta (261024_1800, T1): el duplicat es prova amb dues fonts d'hosts de la llista
     blanca nativa (amb example.org, ara petaria pel host abans que per l'id repetit). */
  test('el catàleg es valida en crear el gestor: ids nets i únics, feeds https', () => {
    expect(() => validaCataleg({ categories: [], fonts: [{ id: 'x', feed: 'http://example.org/feed' }] })).toThrow(TypeError);
    expect(() => validaCataleg({ categories: [], fonts: [{ id: 'X Y', feed: 'https://example.org/feed' }] })).toThrow(TypeError);
    const bona = (id) => ({ id, feed: 'https://ayudawp.com/feed/', lloc: 'https://ayudawp.com' });
    expect(() => validaCataleg({ categories: [], fonts: [bona('a')] })).not.toThrow();
    expect(() => validaCataleg({ categories: [], fonts: [bona('a'), bona('a')] })).toThrow(/repetit/);
    expect(() => validaCataleg({ fonts: [] })).toThrow(TypeError);
    expect(validaCataleg(CATALEG).fonts).toHaveLength(CATALEG.fonts.length);
  });
});

describe('l’origen', () => {
  test(`${TEMPS_ORIGEN_MS} ms sense resposta → 504 origen_temps, i la baixada s’avorta`, async () => {
    let senyal = null;
    const fetchImpl = vi.fn((url, init) => new Promise((resol, rebutja) => {
      senyal = init.signal;
      init.signal.addEventListener('abort', () => rebutja(new DOMException('avortada', 'AbortError')));
    }));
    const { demana, temporitzador } = prepara({ fetchImpl });
    const promesa = demana('/feed?font=ayudawp');
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalled());
    expect([...temporitzador.pendents.values()].map(({ ms }) => ms)).toEqual([TEMPS_ORIGEN_MS]);
    temporitzador.venc();
    expect(await errorDe(await promesa)).toMatchObject({ status: 504, code: 'sdp_noticies_origen_temps' });
    expect(senyal.aborted).toBe(true);
  });

  test('un error de l’origen o de la xarxa → 502 origen_caigut', async () => {
    for (const fer of [async () => origen('no', { status: 500 }), async () => origen('no', { status: 404 }), async () => { throw new TypeError('xarxa'); }]) {
      const { demana } = prepara({ fetchImpl: vi.fn(fer) });
      expect(await errorDe(await demana('/feed?font=ayudawp'))).toMatchObject({ status: 502, code: 'sdp_noticies_origen_caigut' });
    }
  });

  /* R6 L-06 (Lector final) · El feed de Jon Hernández a /feed/ responia 304 sense cos a tot GET sense
     condicions (una memòria cau de la seua web): no és una redirecció ni una cosa que no es llig. */
  test('un 304 a una petició sense condicions → 504 origen_buit (el Lector hi diu «temps», mai «font»), sense seguir res', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 304, headers: { etag: '"x"', location: 'https://example.org/altre' } }));
    const { demana } = prepara({ fetchImpl });
    expect(await errorDe(await demana('/feed?font=ayudawp'))).toEqual({
      status: 504, code: 'sdp_noticies_origen_buit', message: expect.any(String), data: { status: 504 }
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(Object.keys(fetchImpl.mock.calls[0][1].headers).sort()).toEqual(['Accept', 'User-Agent']);
    /* Amb una còpia bona d'abans, la de reserva, com quan l'origen cau. */
    const respostes = [async () => origen(RSS), async () => new Response(null, { status: 304 })];
    const entorn = prepara({ fetchImpl: vi.fn(async () => respostes.shift()()) });
    await entorn.demana('/feed?font=ayudawp');
    entorn.avança(FRESC_MS);
    expect((await (await entorn.demana('/feed?font=ayudawp')).json()).obsoleta).toBe(true);
  });

  test('redireccions: com a molt 2, dins del mateix host i en https', async () => {
    const salt = (location) => new Response(null, { status: 301, headers: { location } });
    const dins = vi.fn()
      .mockResolvedValueOnce(salt('/rss'))
      .mockResolvedValueOnce(salt(`https://${HOST}/rss/def`))
      .mockResolvedValueOnce(origen(RSS));
    expect((await prepara({ fetchImpl: dins }).demana('/feed?font=ayudawp')).status).toBe(200);
    expect(dins.mock.calls.map(([url]) => url)).toEqual([FEED, `https://${HOST}/rss`, `https://${HOST}/rss/def`]);
    const massa = vi.fn(async () => salt('/rss/altra'));
    expect((await errorDe(await prepara({ fetchImpl: massa }).demana('/feed?font=ayudawp'))).code).toBe('sdp_noticies_origen_caigut');
    expect(massa).toHaveBeenCalledTimes(3);
    /* T1 (261024_1800, Codex C6-03): un altre port del mateix host, tampoc; ni un altre host aprovat
       (revisió adversarial T1-01: cap prova no fixava que el salt és dins del MATEIX host). */
    for (const fora of ['https://example.org/feed', `http://${HOST}/rss/`, `https://usuari:x@${HOST}/rss/`, `https://${HOST}:8443/servei-intern`, `https://${HOST}:444/rss/`,
      'https://www.youtube.com/feeds/videos.xml', 'https://i3.ytimg.com/x.xml']) {
      const fetchImpl = vi.fn().mockResolvedValueOnce(salt(fora)).mockResolvedValue(origen(RSS));
      expect((await errorDe(await prepara({ fetchImpl }).demana('/feed?font=ayudawp'))).code, fora).toBe('sdp_noticies_origen_caigut');
      expect(fetchImpl, fora).toHaveBeenCalledTimes(1);
    }
  });

  test('més de 2 MiB → 502 origen_mida, declarat o en arribar', async () => {
    const declarat = vi.fn(async () => origen(RSS, { headers: { 'content-length': String(MAXIM_BYTES + 1) } }));
    expect((await errorDe(await prepara({ fetchImpl: declarat }).demana('/feed?font=ayudawp'))).code).toBe('sdp_noticies_origen_mida');
    const gran = `<rss version="2.0"><channel><title>${'x'.repeat(MAXIM_BYTES)}</title></channel></rss>`;
    const sencer = vi.fn(async () => new Response(new Blob([gran]).stream(), { headers: { 'content-type': 'application/rss+xml' } }));
    expect((await errorDe(await prepara({ fetchImpl: sencer }).demana('/feed?font=ayudawp'))).code).toBe('sdp_noticies_origen_mida');
  });

  test('una pàgina HTML, un JSON o un XML que no és un feed → 502 origen_format; cap declaració d’entitats', async () => {
    for (const cos of ['<!doctype html><html><body>WAF</body></html>', '{"items":[]}', '<?xml version="1.0"?><urlset></urlset>',
      '<?xml version="1.0"?><!DOCTYPE rss [<!ENTITY a "aaaa">]><rss version="2.0"><channel><title>&a;</title></channel></rss>']) {
      const { demana } = prepara({ fetchImpl: vi.fn(async () => origen(cos)) });
      expect((await errorDe(await demana('/feed?font=ayudawp'))).code, cos).toBe('sdp_noticies_origen_format');
    }
  });
});

describe('la codificació i l’arrel', () => {
  const latin1 = (text) => Uint8Array.from([...text].map((c) => c.charCodeAt(0)));

  test('ISO-8859-1 de la capçalera → UTF-8, i el pròleg ho torna a dir', async () => {
    const cos = '<?xml version="1.0" encoding="ISO-8859-1"?><rss version="2.0"><channel><title>Plaça i església</title></channel></rss>';
    const fetchImpl = vi.fn(async () => new Response(latin1(cos), { headers: { 'content-type': 'text/xml; charset=ISO-8859-1' } }));
    const { xml } = await (await prepara({ fetchImpl }).demana('/feed?font=ayudawp')).json();
    expect(xml).toContain('<title>Plaça i església</title>');
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });

  test('sense charset a la capçalera: el del pròleg (windows-1252, amb «’»); i el BOM d’UTF-8 se’n va', () => {
    const cos = Uint8Array.from([...latin1('<?xml version="1.0" encoding="windows-1252"?><rss><channel><title>l'), 0x92, ...latin1('aigua</title></channel></rss>')]);
    expect(descodificaFeed(cos, 'application/xml')).toContain('<title>l’aigua</title>');
    const ambBom = Uint8Array.from([0xEF, 0xBB, 0xBF, ...new TextEncoder().encode('<rss><channel><title>Plaça</title></channel></rss>')]);
    expect(descodificaFeed(ambBom, 'application/xml')).toBe('<rss><channel><title>Plaça</title></channel></rss>');
    expect(descodificaFeed(new TextEncoder().encode('<feed xmlns="http://www.w3.org/2005/Atom"></feed>'), 'text/xml; charset=x-desconegut'))
      .toBe('<feed xmlns="http://www.w3.org/2005/Atom"></feed>');
  });

  test('esFeed: RSS 2.0, Atom i RSS 1.0, també amb pròleg, comentaris i DOCTYPE', () => {
    for (const bo of [RSS, '<feed xmlns="http://www.w3.org/2005/Atom"/>', '<rdf:RDF xmlns:rdf="x"></rdf:RDF>',
      '<?xml version="1.0"?>\n<!-- hola -->\n<?xml-stylesheet href="a.xsl"?><!DOCTYPE rss PUBLIC "-//x//y" "z.dtd"><rss version="0.91"></rss>']) {
      expect(esFeed(bo), bo).toBe(true);
    }
    for (const dolent of ['', '<html></html>', '<rssx></rssx>', 'rss', null]) expect(esFeed(dolent), String(dolent)).toBe(false);
  });
});

describe('la memòria cau', () => {
  test('fresca 15 min: una sola baixada; passat el termini, es torna a baixar', async () => {
    const { demana, fetchImpl, avança } = prepara();
    await demana('/feed?font=ayudawp');
    avança(FRESC_MS - 1);
    expect((await (await demana('/feed?font=ayudawp')).json()).obtingut).toBe('2026-10-24T09:00:00.000Z');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    avança(1);
    await demana('/feed?font=ayudawp');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  test('si l’origen cau, la de fins a 24 h, amb obsoleta: true; més vella, l’error', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(origen(RSS)).mockResolvedValue(origen('no', { status: 503 }));
    const { demana, avança } = prepara({ fetchImpl });
    await demana('/feed?font=ayudawp');
    avança(FRESC_MS);
    expect(await (await demana('/feed?font=ayudawp')).json()).toEqual({ font: 'ayudawp', xml: RSS, obtingut: '2026-10-24T09:00:00.000Z', obsoleta: true });
    avança(OBSOLET_MS);
    expect((await errorDe(await demana('/feed?font=ayudawp'))).code).toBe('sdp_noticies_origen_caigut');
  });

  test('dues peticions alhora de la mateixa font comparteixen una sola baixada; un error no es desa', async () => {
    let resol;
    const fetchImpl = vi.fn(() => new Promise((r) => { resol = r; }));
    const { demana } = prepara({ fetchImpl });
    const una = demana('/feed?font=ayudawp');
    const altra = demana('/feed?font=ayudawp');
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalled());
    resol(origen('no', { status: 500 }));
    expect([(await una).status, (await altra).status]).toEqual([502, 502]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('el límit per IP', () => {
  test(`${LIMIT.peticions} peticions per finestra; després, 429 amb Retry-After; una altra IP i una finestra nova passen`, async () => {
    const { demana, avança } = prepara();
    for (let i = 0; i < LIMIT.peticions; i += 1) expect((await demana('/fonts')).status).toBe(200);
    const tallada = await demana('/fonts');
    expect(await errorDe(tallada)).toMatchObject({ status: 429, code: 'sdp_noticies_limit' });
    expect(Number(tallada.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(tallada.headers.get('access-control-expose-headers')).toBe('Retry-After');
    expect((await demana('/fonts', { ip: '203.0.113.9' })).status).toBe(200);
    avança(LIMIT.finestraMs);
    expect((await demana('/fonts')).status).toBe(200);
  });
});

describe('el codi', () => {
  const codi = readFileSync(path.join(ARREL, CARPETA, 'gestor.js'), 'utf8');
  const index = readFileSync(path.join(ARREL, CARPETA, 'index.ts'), 'utf8');

  /* Actualitzada a posta (261024 T5b): index.ts llig ara dues variables d'entorn, cap secret:
     SDP_NOTICIES_PERSONALS (l'interruptor de les fonts personals) i SUPABASE_URL (només el host, que
     el mode personal no demana mai). El gestor continua pur: cap Deno, cap entorn.
     Actualitzada a posta (261024 Lector): D-08 de Codex, les personals s'encenen NOMÉS amb '1'
     (abans, tot menys '0'); les baixades de fora (personal, imatge) porten les seues regles i la
     seua fita, i l'empremta ja no és un FNV sense clau (R5-04).
     Actualitzada a posta (261024 Lector final): R6 L-12, una tercera variable pública,
     SDP_NOTICIES_IMATGES_EXTERNES (només '1' encén les imatges de fora del catàleg). */
  test('cap registre ni secret; el gestor no llig l’entorn i index.ts, només les tres variables públiques; el fetch, una sola crida', () => {
    expect(codi).not.toMatch(/console\.|Deno\.env|Deno\.resolveDns\(|process\.env|service_role|SUPABASE_/);
    expect(index).not.toMatch(/console\.|process\.env|service_role|ANON_KEY|DB_URL|JWT_SECRET/i);
    expect([...index.matchAll(/Deno\.env\.[a-z]+\(([^)]*)\)/g)].map((m) => m[1])).toEqual(['nom']);
    expect([...index.matchAll(/variable\('([A-Z_]+)'\)/g)].map((m) => m[1])).toEqual(['SDP_NOTICIES_PERSONALS', 'SDP_NOTICIES_IMATGES_EXTERNES', 'SUPABASE_URL']);
    /* El fetch només rep `actual.href`: naix de font.feed (o d'una adreça de fora ja validada) i només
       canvia per una redirecció que torna a passar les regles. */
    expect([...codi.matchAll(/fetchImpl\(([^,]+),/g)].map((m) => m[1])).toEqual(['actual.href']);
    expect(codi).toContain('baixa(font.feed)');
    expect(codi).toContain('baixa(url.href, { regles: reglesPersonals(vetats), maxim: MAXIM_BYTES_PERSONAL })');
    expect(codi).toContain('baixa(url.href, { regles: reglesImatge(vetats), maxim: MAXIM_BYTES_IMATGE, accepta: ACCEPTA_IMATGE, llig: lligImatge })');
    /* Cap «sense resoledor, és pública» (D-08), i cap empremta sense clau (R5-04). */
    expect(codi).not.toMatch(/return 'publica';|0x811c9dc5|Math\.imul/);
    expect(codi).toContain("if (!teResoledor) return 'sense-dns';");
    /* T1 (261024_1800, Codex C6-02) · Cap salt sense regles: el primer també, i un host aprovat passa
       per aprovatVetat (mai un «return null» directe). */
    expect(codi).not.toContain('if (regles.confiats?.has(neta.hostname)) return null;');
    expect(codi).not.toMatch(/if \(regles\) \{\s*const error = await valida\(actual/);
    expect(codi).toContain("if (nom.adreces.some(esIpNoPublica)) return 'adreca_vetada';");
    /* Gauntlet 261024_1945, Gemini G1945-01 · una família fallada també tanca un host aprovat. */
    expect(codi).toContain("return nom.fallades > 0 || nom.adreces.length === 0 ? 'origen_caigut' : null;");
    /* Codex C6-02, segona passada · allSettled: cap Promise.all en la resolució. */
    expect(codi).toContain('await Promise.allSettled([resol(\'A\'), resol(\'AAAA\')])');
    expect(codi).not.toMatch(/Promise\.all\(\[resol\(/);
    expect(index).toContain("import cataleg from './fonts.json' with { type: 'json' };");
    expect(index).toContain('Deno.serve(');
    expect(index).toContain("personals: variable('SDP_NOTICIES_PERSONALS') === '1'");
    expect(index).toContain("imatgesExternes: variable('SDP_NOTICIES_IMATGES_EXTERNES') === '1'");
    expect(index).not.toContain("!== '0'");
  });
});

/* T5b (ordre del Mestre, 261024) · Les fonts personals: el servei llig també una adreça que la
   persona ha afegit al Lector (?url=), mai el navegador. Totes les regles contra el SSRF, una per
   una, amb un resoledor de noms fals (`resolDns`) que diu què respon cada nom. Cap petició de veres:
   les adreces són d'example.org i les IP, de documentació o privades. */
describe('les fonts personals (?url=)', () => {
  const PERSONAL = 'https://blog.example.org/feed/';
  const PUBLIQUES = Object.freeze({ A: ['93.184.216.34'], AAAA: ['2606:2800:220:1:248:1893:25c8:1946'] });
  /* Un resoledor fals: `respostes[host][tipus]`, o les públiques; una funció en llança o en penja. */
  const resoledor = (respostes = {}) => vi.fn(async (host, tipus) => {
    const delHost = respostes[host];
    if (typeof delHost === 'function') return delHost(tipus);
    return delHost ? (delHost[tipus] || []) : PUBLIQUES[tipus];
  });
  const personal = (opcions = {}) => prepara({ personals: true, resolDns: resoledor(), ...opcions });
  const ambUrl = (adreca) => `/feed?url=${encodeURIComponent(adreca)}`;
  async function vetada(entorn, adreca) {
    const resposta = await entorn.demana(ambUrl(adreca));
    const cos = await errorDe(resposta);
    /* L'adreça no torna mai a la resposta d'error (ni es registra enlloc). */
    if (adreca) expect(JSON.stringify(cos), adreca).not.toContain(adreca);
    return cos;
  }

  test('una adreça pública: el sobre { url, xml, obtingut, obsoleta }, privat 5 min; a l’origen, GET amb l’agent honest i res de qui demana', async () => {
    const entorn = personal();
    const resposta = await entorn.demana(ambUrl(PERSONAL), { headers: { cookie: 'no=passa', authorization: 'Bearer no-passa' } });
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('cache-control')).toBe('private, max-age=300');
    expect(resposta.headers.get('access-control-allow-origin')).toBe('*');
    expect(await resposta.json()).toEqual({ url: PERSONAL, xml: RSS, obtingut: '2026-10-24T09:00:00.000Z', obsoleta: false });
    const [url, init] = entorn.fetchImpl.mock.calls[0];
    expect(url).toBe(PERSONAL);
    expect(init).toMatchObject({ method: 'GET', redirect: 'manual', headers: { 'User-Agent': AGENT_USUARI, Accept: ACCEPTA } });
    expect(Object.keys(init.headers).sort()).toEqual(['Accept', 'User-Agent']);
  });

  test('GET /fonts diu si el servei llig fonts personals', async () => {
    expect((await (await personal().demana('/fonts')).json()).personals).toBe(true);
    expect((await (await prepara().demana('/fonts')).json()).personals).toBe(false);
  });

  test('l’interruptor apagat (SDP_NOTICIES_PERSONALS=0, i per defecte al gestor): url és un paràmetre que no s’admet, sense cap petició ni resolució', async () => {
    const resolDns = resoledor();
    for (const entorn of [prepara({ resolDns }), prepara({ personals: false, resolDns })]) {
      expect(await errorDe(await entorn.demana(ambUrl(PERSONAL)))).toMatchObject({ status: 400, code: 'sdp_noticies_peticio' });
      expect(entorn.fetchImpl).not.toHaveBeenCalled();
    }
    expect(resolDns).not.toHaveBeenCalled();
  });

  test('només https, port 443 i sense usuari: http:, :8443, :80 o credencials són adreca_vetada (422), sense cap petició', async () => {
    const entorn = personal();
    for (const adreca of ['http://blog.example.org/feed/', 'https://blog.example.org:8443/feed/', 'https://blog.example.org:80/feed/',
      'https://usuari:secret@blog.example.org/feed/', 'https://usuari@blog.example.org/feed/', 'ftp://blog.example.org/feed', 'javascript:alert(1)',
      'no és una adreça', '']) {
      expect(await vetada(entorn, adreca), adreca).toMatchObject({ status: 422, code: 'sdp_noticies_adreca_vetada' });
    }
    /* El port per defecte (:443) i el fragment no compten: és la mateixa adreça. */
    expect((await entorn.demana(ambUrl('https://blog.example.org:443/feed/#avui'))).status).toBe(200);
    expect(entorn.fetchImpl.mock.calls.map(([url]) => url)).toEqual([PERSONAL]);
  });

  test('cap IP literal, en cap forma (decimal, hexadecimal, octal, curta, IPv6 i IPv6 amb IPv4), sense resoldre res', async () => {
    const entorn = personal();
    for (const adreca of ['https://2130706433/feed', 'https://0x7f000001/feed', 'https://0177.0.0.1/feed', 'https://127.1/feed',
      'https://127.0.0.1/feed', 'https://169.254.169.254/latest/meta-data/', 'https://10.0.0.1/', 'https://[::1]/feed',
      'https://[::ffff:127.0.0.1]/feed', 'https://[fd00::1]/', 'https://93.184.216.34/feed']) {
      expect((await vetada(entorn, adreca)).code, adreca).toBe('sdp_noticies_adreca_vetada');
    }
    expect(entorn.fetchImpl).not.toHaveBeenCalled();
  });

  test('cap nom local ni sense punt, ni el host del projecte (el de la configuració i el de la petició)', async () => {
    const entorn = personal({ hostsVetats: ['projecte.supabase.co'] });
    for (const adreca of ['https://localhost/feed', 'https://localhost./feed', 'https://app.localhost/feed', 'https://impressora.local/feed',
      'https://metadata.google.internal/computeMetadata/v1/', 'https://router.home.arpa/', 'https://1.0.0.127.in-addr.arpa/',
      'https://intranet/feed', 'https://servidor.lan/feed', 'https://blog.example.org./feed', 'https://projecte.supabase.co/functions/v1/noticies/fonts',
      'https://abcdefghijklmnop.supabase.co/noticies/fonts', 'https://bloc_dolent.example.org/']) {
      expect((await vetada(entorn, adreca)).code, adreca).toBe('sdp_noticies_adreca_vetada');
    }
    expect(entorn.fetchImpl).not.toHaveBeenCalled();
  });

  test(`com a molt ${MAXIM_URL_PERSONAL} caràcters`, async () => {
    const entorn = personal();
    const base = 'https://blog.example.org/feed?';
    expect((await vetada(entorn, `${base}${'a'.repeat(MAXIM_URL_PERSONAL - base.length + 1)}`)).code).toBe('sdp_noticies_adreca_vetada');
    expect((await entorn.demana(ambUrl(`${base}${'a'.repeat(MAXIM_URL_PERSONAL - base.length)}`))).status).toBe(200);
  });

  test('un nom que es resol a una IP privada, de bucle, d’enllaç local, CGNAT, ULA o fe80 és adreca_vetada, sense baixar res', async () => {
    const casos = [
      { A: ['10.0.0.5'] }, { A: ['127.0.0.1'] }, { A: ['169.254.169.254'] }, { A: ['100.64.1.1'] }, { A: ['192.168.1.10'] },
      { A: ['172.20.0.3'] }, { A: ['0.0.0.0'] }, { AAAA: ['::1'] }, { AAAA: ['fd00::1'] }, { AAAA: ['fe80::1'] },
      { AAAA: ['::ffff:10.0.0.1'] }, { A: ['93.184.216.34', '10.0.0.5'] }
    ];
    for (const respostes of casos) {
      const resolDns = resoledor({ 'blog.example.org': respostes });
      const entorn = prepara({ personals: true, resolDns });
      expect((await vetada(entorn, PERSONAL)).code, JSON.stringify(respostes)).toBe('sdp_noticies_adreca_vetada');
      expect(entorn.fetchImpl, JSON.stringify(respostes)).not.toHaveBeenCalled();
      expect(resolDns.mock.calls.map(([host, tipus]) => [host, tipus]).sort()).toEqual([['blog.example.org', 'A'], ['blog.example.org', 'AAAA']]);
    }
  });

  test('si el nom no es pot resoldre (cap resposta o el resoledor falla), no es baixa res: origen_caigut', async () => {
    for (const respostes of [{ A: [], AAAA: [] }, () => { throw new Error('servidor de noms caigut'); }]) {
      const entorn = prepara({ personals: true, resolDns: resoledor({ 'blog.example.org': respostes }) });
      expect((await vetada(entorn, PERSONAL)).code).toBe('sdp_noticies_origen_caigut');
      expect(entorn.fetchImpl).not.toHaveBeenCalled();
    }
  });

  test(`la resolució també entra en els ${TEMPS_ORIGEN_MS} ms: un resoledor penjat és origen_temps`, async () => {
    const entorn = prepara({ personals: true, resolDns: vi.fn(() => new Promise(() => {})) });
    const promesa = entorn.demana(ambUrl(PERSONAL));
    await vi.waitFor(() => expect(entorn.temporitzador.pendents.size).toBe(1));
    entorn.temporitzador.venc();
    expect((await errorDe(await promesa)).code).toBe('sdp_noticies_origen_temps');
    expect(entorn.fetchImpl).not.toHaveBeenCalled();
  });

  /* Actualitzada a posta (261024 Lector): D-08 de Codex. Abans esta prova exigia 200 sense
     resoledor (només les regles del nom): era el defecte. Ara es tanca: 503 i cap petició, i /fonts
     diu que el servei no llig personals, perquè el client no n'envie cap. */
  test('sense resoledor a l’entorn (null), les personals es TANQUEN: 503 personals_sense_dns, cap petició; /fonts diu personals: false', async () => {
    const entorn = prepara({ personals: true, resolDns: null });
    for (const adreca of [PERSONAL, 'https://127.0.0.1/feed']) {
      expect(await vetada(entorn, adreca), adreca).toMatchObject({ status: 503, code: 'sdp_noticies_personals_sense_dns' });
    }
    expect(entorn.fetchImpl).not.toHaveBeenCalled();
    expect((await (await entorn.demana('/fonts')).json()).personals).toBe(false);
  });

  test('cada redirecció torna a passar les regles: a un host privat, a una IP, a http o a localhost, adreca_vetada; com a molt 2', async () => {
    const salt = (location) => new Response(null, { status: 302, headers: { location } });
    for (const desti of ['https://intern.example.org/feed', 'https://127.0.0.1/feed', 'https://[::1]/feed', 'http://blog.example.org/feed',
      'https://localhost/feed', 'https://blog.example.org:8443/feed']) {
      const fetchImpl = vi.fn().mockResolvedValueOnce(salt(desti)).mockResolvedValue(origen(RSS));
      const entorn = prepara({ personals: true, fetchImpl, resolDns: resoledor({ 'intern.example.org': { A: ['192.168.1.10'] } }) });
      expect((await vetada(entorn, PERSONAL)).code, desti).toBe('sdp_noticies_adreca_vetada');
      expect(fetchImpl, desti).toHaveBeenCalledTimes(1);
    }
    /* Cap a un altre host públic, sí: el resol de nou i el baixa. */
    const resolDns = resoledor();
    const fetchImpl = vi.fn().mockResolvedValueOnce(salt('https://feeds.example.org/blog')).mockResolvedValue(origen(RSS));
    const entorn = prepara({ personals: true, fetchImpl, resolDns });
    expect((await entorn.demana(ambUrl(PERSONAL))).status).toBe(200);
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([PERSONAL, 'https://feeds.example.org/blog']);
    expect(resolDns.mock.calls.map(([host]) => host)).toEqual(['blog.example.org', 'blog.example.org', 'feeds.example.org', 'feeds.example.org']);
    const massa = vi.fn(async () => salt('https://blog.example.org/altra'));
    expect((await vetada(prepara({ personals: true, fetchImpl: massa, resolDns: resoledor() }), PERSONAL)).code).toBe('sdp_noticies_origen_caigut');
    expect(massa).toHaveBeenCalledTimes(3);
  });

  test('el que torna l’origen ha de ser un feed, de 2 MiB com a molt, com a les fonts del sistema', async () => {
    const html = prepara({ personals: true, resolDns: resoledor(), fetchImpl: vi.fn(async () => origen('<html><body>intern</body></html>')) });
    expect((await vetada(html, PERSONAL)).code).toBe('sdp_noticies_origen_format');
    const gran = prepara({ personals: true, resolDns: resoledor(), fetchImpl: vi.fn(async () => origen(RSS, { headers: { 'content-length': String(MAXIM_BYTES + 1) } })) });
    expect((await vetada(gran, PERSONAL)).code).toBe('sdp_noticies_origen_mida');
  });

  test('la memòria cau va per l’adreça normalitzada (sense fragment ni :443, host en minúscules); un error no es desa', async () => {
    const entorn = personal();
    await entorn.demana(ambUrl(PERSONAL));
    await entorn.demana(ambUrl('https://BLOG.example.org:443/feed/#x'));
    expect(entorn.fetchImpl).toHaveBeenCalledTimes(1);
    entorn.avança(FRESC_MS);
    await entorn.demana(ambUrl(PERSONAL));
    expect(entorn.fetchImpl).toHaveBeenCalledTimes(2);
    /* Una font del sistema i una personal no es xafen la memòria. */
    await entorn.demana('/feed?font=ayudawp');
    expect(entorn.fetchImpl).toHaveBeenCalledTimes(3);
  });

  /* Actualitzada a posta (261024 Lector): R5-05. Abans la segona i la tercera petició venien d'unes
     altres IP i la còpia es compartia (una connexió sabia què havia demanat una altra). Ara la còpia
     és de cada connexió: la prova torna a demanar des de la mateixa IP que la va baixar. */
  test(`la memòria cau de les personals és fitada: ${MAXIM_CAU_PERSONALS} adreces com a molt, la més vella se’n va`, async () => {
    const entorn = personal();
    const adreca = (i) => `https://blog${i}.example.org/feed`;
    const ip = (i) => `198.51.100.${i % 200}`;
    for (let i = 0; i <= MAXIM_CAU_PERSONALS; i += 1) await entorn.demana(ambUrl(adreca(i)), { ip: ip(i) });
    expect(entorn.fetchImpl).toHaveBeenCalledTimes(MAXIM_CAU_PERSONALS + 1);
    await entorn.demana(ambUrl(adreca(MAXIM_CAU_PERSONALS)), { ip: ip(MAXIM_CAU_PERSONALS) });
    expect(entorn.fetchImpl).toHaveBeenCalledTimes(MAXIM_CAU_PERSONALS + 1);
    await entorn.demana(ambUrl(adreca(0)), { ip: ip(0) });
    expect(entorn.fetchImpl).toHaveBeenCalledTimes(MAXIM_CAU_PERSONALS + 2);
  });

  test(`un límit per IP més estricte (${LIMIT_PERSONALS.peticions} per finestra), a banda del general`, async () => {
    const entorn = personal();
    for (let i = 0; i < LIMIT_PERSONALS.peticions; i += 1) expect((await entorn.demana(ambUrl(PERSONAL))).status).toBe(200);
    const tallada = await entorn.demana(ambUrl(PERSONAL));
    expect(await errorDe(tallada)).toMatchObject({ status: 429, code: 'sdp_noticies_limit' });
    expect(Number(tallada.headers.get('retry-after'))).toBeGreaterThan(0);
    /* Les fonts del sistema, de la mateixa IP, encara passen (el límit general és més ample). */
    expect((await entorn.demana('/feed?font=ayudawp')).status).toBe(200);
    expect(LIMIT_PERSONALS.peticions).toBeLessThan(LIMIT.peticions);
    entorn.avança(LIMIT_PERSONALS.finestraMs);
    expect((await entorn.demana(ambUrl(PERSONAL))).status).toBe(200);
  });

  test('url i font alhora, o dues url, no s’admeten', async () => {
    const entorn = personal();
    expect((await errorDe(await entorn.demana(`/feed?font=ayudawp&url=${encodeURIComponent(PERSONAL)}`))).code).toBe('sdp_noticies_peticio');
    expect((await errorDe(await entorn.demana(`${ambUrl(PERSONAL)}&url=${encodeURIComponent(PERSONAL)}`))).code).toBe('sdp_noticies_peticio');
    expect(entorn.fetchImpl).not.toHaveBeenCalled();
  });

  test('les regles, com a funcions pures: adrecaPersonal i esIpNoPublica', () => {
    expect(adrecaPersonal('https://Blog.Example.org:443/feed#x')?.href).toBe('https://blog.example.org/feed');
    expect(adrecaPersonal('https://xn--pla-0la.example.org/feed')?.href).toBe('https://xn--pla-0la.example.org/feed');
    expect(adrecaPersonal('https://blog.example.org/feed', ['blog.example.org'])).toBeNull();
    for (const privada of ['127.0.0.1', '10.1.2.3', '100.64.0.1', '169.254.169.254', '172.16.0.1', '192.168.0.1', '0.0.0.0', '224.0.0.1',
      '::', '::1', 'fc00::1', 'fd12::1', 'fe80::1', '::ffff:192.168.0.1', '64:ff9b::a00:1', '2002:a00:1::1', '2001:db8::1', 'ff02::1', 'no-és-una-ip']) {
      expect(esIpNoPublica(privada), privada).toBe(true);
    }
    for (const publica of ['93.184.216.34', '8.8.8.8', '100.128.0.1', '172.32.0.1', '2606:4700:4700::1111', '::ffff:8.8.8.8']) {
      expect(esIpNoPublica(publica), publica).toBe(false);
    }
  });
});

/* 261024 Lector · D-08 de Codex: les personals, apagades per defecte; i només un `true` les encén. */
describe('D-08 · les fonts personals, apagades per defecte', () => {
  test('ni una cadena «true» ni un 1 les encenen: només personals === true, amb resoledor', async () => {
    const resolDns = vi.fn(async () => ['93.184.216.34']);
    for (const personals of ['true', '1', 1, undefined]) {
      const entorn = prepara({ personals, resolDns });
      expect((await errorDe(await entorn.demana(`/feed?url=${encodeURIComponent('https://blog.example.org/feed/')}`))).code, String(personals))
        .toBe('sdp_noticies_peticio');
      expect((await (await entorn.demana('/fonts')).json()).personals, String(personals)).toBe(false);
      expect(entorn.fetchImpl).not.toHaveBeenCalled();
    }
    expect(resolDns).not.toHaveBeenCalled();
  });
});

/* R5-03 · Qui demana: la vora de la plataforma (cf-connecting-ip) o l'últim salt de
   x-forwarded-for, mai el primer (el pot escriure qualsevol); una IPv6 compta per la seua /64; i la
   taula plena no es buida mai sencera. */
describe('R5-03 · el límit per connexió', () => {
  test('clauDeXarxa: IPv4, IPv6 per /64, IPv4 dins d’IPv6, i res més', () => {
    expect(clauDeXarxa('198.51.100.7')).toBe('4:198.51.100.7');
    expect(clauDeXarxa(' 198.51.100.7 ')).toBe('4:198.51.100.7');
    expect(clauDeXarxa('[2001:db8:1:2::1]')).toBe('6:2001:db8:1:2');
    expect(clauDeXarxa('2001:db8:1:2:ffff:ffff:ffff:9')).toBe('6:2001:db8:1:2');
    expect(clauDeXarxa('2001:db8:1:3::1')).toBe('6:2001:db8:1:3');
    expect(clauDeXarxa('::ffff:198.51.100.7')).toBe('4:198.51.100.7');
    expect(clauDeXarxa('fe80::1%eth0')).toBe('6:fe80:0:0:0');
    for (const res of ['', 'desconeguda', 'unknown', '1.2.3', '300.1.1.1', '1:2:3', null, undefined, 42]) expect(clauDeXarxa(res), String(res)).toBeNull();
  });

  test('clauDeQui: cf-connecting-ip primer; si no, l’ÚLTIM salt de x-forwarded-for; si no és una IP, l’adreça remota (mai un salt d’abans)', () => {
    const peticio = (headers) => new Request(`${BASE}/fonts`, { headers });
    const remota = { remoteAddr: { hostname: '192.0.2.10' } };
    expect(clauDeQui(peticio({ 'cf-connecting-ip': '203.0.113.50', 'x-forwarded-for': '198.51.100.1' }), remota)).toBe('4:203.0.113.50');
    expect(clauDeQui(peticio({ 'x-forwarded-for': '10.9.9.9, 172.16.0.1, 198.51.100.7' }), remota)).toBe('4:198.51.100.7');
    expect(clauDeQui(peticio({ 'x-forwarded-for': '198.51.100.7, inventat' }), remota)).toBe('4:192.0.2.10');
    expect(clauDeQui(peticio({ 'cf-connecting-ip': 'no', 'x-real-ip': '198.51.100.99' }), remota)).toBe('4:192.0.2.10');
    expect(clauDeQui(peticio({}), {})).toBe('desconeguda');
  });

  test('canviar el primer salt de x-forwarded-for no salta el límit: compta l’últim', async () => {
    const { demana } = prepara();
    for (let i = 0; i < LIMIT.peticions; i += 1) {
      expect((await demana('/fonts', { headers: { 'x-forwarded-for': `10.9.${i >> 8}.${i & 255}, 198.51.100.7` } })).status).toBe(200);
    }
    expect((await demana('/fonts', { headers: { 'x-forwarded-for': '10.200.0.1, 198.51.100.7' } })).status).toBe(429);
    /* Ni canviant cf-connecting-ip per una altra… perquè la vora sí que mana: una connexió nova passa. */
    expect((await demana('/fonts', { headers: { 'cf-connecting-ip': '203.0.113.51', 'x-forwarded-for': '198.51.100.7' } })).status).toBe(200);
  });

  test('una IPv6 compta per la seua /64: una casa no salta el límit canviant l’adreça; una altra /64, sí que passa', async () => {
    const { demana } = prepara();
    for (let i = 0; i < LIMIT.peticions; i += 1) expect((await demana('/fonts', { ip: `2001:db8:1:2::${(i + 1).toString(16)}` })).status).toBe(200);
    expect((await demana('/fonts', { ip: '2001:db8:1:2:abcd::1' })).status).toBe(429);
    expect((await demana('/fonts', { ip: '2001:db8:1:3::1' })).status).toBe(200);
  });

  /* Actualitzada a posta (261024 Lector final): R6 L-05. Amb la taula plena, una clau nova fa lloc
     traient la finestra viva menys gastada; la que ja és al límit no se'n va mai (així ningú no buida
     el límit d'una connexió tallada), i una clau nova només espera si totes les vives ho són. */
  test('creaLimit: amb la taula plena, una clau nova fa lloc traient la finestra viva menys gastada; mai una que ja és al límit', () => {
    const limit = creaLimit({ peticions: 2, finestraMs: 1000 }, 2);
    expect([limit.espera('a', 0), limit.espera('a', 0)]).toEqual([0, 0]);
    expect(limit.espera('a', 0)).toBe(1);
    expect(limit.espera('b', 100)).toBe(0);
    /* Plena: «c» passa traient «b» (una sola petició); «a», al límit, continua tallada. */
    expect(limit.espera('c', 200)).toBe(0);
    expect(limit.espera('a', 300)).toBeGreaterThan(0);
    expect(limit.mida()).toBe(2);
    /* «c» arriba al límit: totes dues hi són, i una clau nova espera fins que vença la més vella («a», 1 s). */
    expect(limit.espera('c', 300)).toBe(0);
    expect(limit.espera('d', 400)).toBe(1);
    expect(limit.espera('a', 500)).toBeGreaterThan(0);
    /* Vençuda «a», «d» ja hi cap; «c» encara és viva i continua comptant. */
    expect(limit.espera('d', 1000)).toBe(0);
    expect(limit.espera('c', 1000)).toBe(1);
    /* De les vives que no són al límit, se'n va la menys gastada («z», una petició), no «y» (dues). */
    const altre = creaLimit({ peticions: 3, finestraMs: 1000 }, 3);
    for (const [clau, voltes] of [['x', 3], ['y', 2], ['z', 1]]) for (let i = 0; i < voltes; i += 1) altre.espera(clau, 10);
    expect(altre.espera('w', 20)).toBe(0);
    expect(altre.espera('y', 30)).toBe(0);
    expect(altre.espera('y', 30)).toBeGreaterThan(0);
    expect(altre.espera('x', 30)).toBeGreaterThan(0);
    expect(altre.mida()).toBe(3);
  });

  test('creaLimit: les finestres vençudes s’esborren a cada crida (i amb escombra): cap empremta no dura més que la seua finestra', () => {
    const limit = creaLimit({ peticions: 5, finestraMs: 1000 });
    limit.espera('a', 0);
    limit.espera('b', 500);
    expect(limit.mida()).toBe(2);
    limit.escombra(1000);
    expect(limit.mida()).toBe(1);
    limit.espera('x', 1500);
    expect(limit.mida()).toBe(1);
  });

  /* Actualitzada a posta (261024 Lector final): R6 L-05. La connexió nova ja no rep 429 perquè la
     taula és plena: passa, i se'n va la finestra menys gastada; la connexió tallada continua tallada.
     Només quan totes les vives són al límit, una de nova espera (429, el mateix Retry-After). */
  test('al gestor: amb la taula plena, una connexió nova passa; la que ja és al límit continua tallada; només si totes ho són, 429', async () => {
    const { demana, avança } = prepara({ maximEmpremtes: 2 });
    for (let i = 0; i < LIMIT.peticions; i += 1) expect((await demana('/fonts', { ip: '198.51.100.1' })).status).toBe(200);
    expect((await demana('/fonts', { ip: '198.51.100.1' })).status).toBe(429);
    expect((await demana('/fonts', { ip: '198.51.100.2' })).status).toBe(200);
    expect((await demana('/fonts', { ip: '198.51.100.3' })).status).toBe(200);
    expect((await demana('/fonts', { ip: '198.51.100.1' })).status).toBe(429);
    for (let i = 1; i < LIMIT.peticions; i += 1) expect((await demana('/fonts', { ip: '198.51.100.3' })).status).toBe(200);
    const nova = await demana('/fonts', { ip: '198.51.100.4' });
    expect(await errorDe(nova)).toMatchObject({ status: 429, code: 'sdp_noticies_limit' });
    expect(Number(nova.headers.get('retry-after'))).toBe(LIMIT.finestraMs / 1000);
    avança(LIMIT.finestraMs);
    expect((await demana('/fonts', { ip: '198.51.100.4' })).status).toBe(200);
  });

  /* R6 L-05 (Lector final) · La prova de R6: 5000 /64 d'una sola /48 omplien les 5000 finestres i un
     visitant nou rebia 429 durant 10 min. Ara, amb la taula mig plena, la /48 compta com una sola
     connexió (i es talla al límit), i el visitant nou passa. */
  test('una /48 que inunda la taula amb /64 distintes no bloqueja ningú: sota pressió compta per /48, i un visitant nou passa', async () => {
    const { demana } = prepara();
    const estats = { 200: 0, 429: 0 };
    for (let i = 0; i < MAXIM_EMPREMTES; i += 1) estats[(await demana('/fonts', { ip: `2001:db8:77:${i.toString(16)}::1` })).status] += 1;
    expect(estats[200]).toBe(MAXIM_EMPREMTES / 2 + LIMIT.peticions);
    expect(estats[429]).toBe(MAXIM_EMPREMTES / 2 - LIMIT.peticions);
    expect((await demana('/fonts', { ip: '198.51.100.20' })).status).toBe(200);
    expect((await demana('/fonts', { ip: '2001:db8:99:1::1' })).status).toBe(200);
  }, 30000);

  test('una inundació d’IPv4 distintes tampoc: cada connexió nova fa lloc, i un visitant nou passa', async () => {
    const { demana } = prepara({ maximEmpremtes: 50 });
    for (let i = 0; i < 300; i += 1) expect((await demana('/fonts', { ip: `198.18.${i >> 8}.${i & 255}` })).status).toBe(200);
    expect((await demana('/fonts', { ip: '198.51.100.20' })).status).toBe(200);
  });

  test('clauAmple: una IPv6 sota pressió compta per la seua /48; una IPv4 no canvia', () => {
    expect(clauAmple(clauDeXarxa('2001:db8:77:1::1'))).toBe('6/48:2001:db8:77');
    expect(clauAmple(clauDeXarxa('2001:db8:77:ffff:1::9'))).toBe('6/48:2001:db8:77');
    expect(clauAmple(clauDeXarxa('2001:db8:78:1::1'))).toBe('6/48:2001:db8:78');
    expect(clauAmple('4:198.51.100.7')).toBe('4:198.51.100.7');
    expect(clauAmple('desconeguda')).toBe('desconeguda');
    expect(clauAmple(clauDeXarxa('::ffff:198.51.100.7'))).toBe('4:198.51.100.7');
  });
});

/* R5-04 · L'empremta: HMAC-SHA-256 amb una clau aleatòria de la instància, no un FNV sense clau. */
describe('R5-04 · l’empremta de la connexió', () => {
  test('la mateixa clau de xarxa, la mateixa empremta dins d’una instància; una altra instància, una altra; mai la IP', async () => {
    const una = creaEmpremtador();
    const altra = creaEmpremtador();
    const [a1, a2, b] = await Promise.all([una('4:198.51.100.7'), una('4:198.51.100.7'), altra('4:198.51.100.7')]);
    expect(a1).toBe(a2);
    expect(a1).toMatch(/^[0-9a-f]{32}$/);
    expect(b).not.toBe(a1);
    expect(a1).not.toContain('198');
    expect(await una('4:198.51.100.8')).not.toBe(a1);
  });

  test('és l’HMAC-SHA-256 de la clau de xarxa amb la clau aleatòria (32 bytes, demanada una vegada)', async () => {
    const { createHmac } = await import('node:crypto');
    const aleatori = vi.fn((n) => new Uint8Array(n).fill(7));
    const empremta = creaEmpremtador({ aleatori });
    const esperada = createHmac('sha256', Buffer.alloc(32, 7)).update('4:198.51.100.7').digest('hex').slice(0, 32);
    expect(await empremta('4:198.51.100.7')).toBe(esperada);
    await empremta('4:198.51.100.8');
    expect(aleatori).toHaveBeenCalledTimes(1);
    expect(aleatori).toHaveBeenCalledWith(32);
  });

  test('si l’empremta falla, el gestor respon 500 intern, sense pila ni detall', async () => {
    const { demana } = prepara({ empremta: async () => { throw new Error('secret intern'); } });
    const resposta = await demana('/fonts');
    const cos = await errorDe(resposta);
    expect(cos).toMatchObject({ status: 500, code: 'sdp_noticies_intern' });
    expect(JSON.stringify(cos)).not.toContain('secret intern');
  });
});

/* R5-02 · Les baixades personals alhora: 4 en tota la instància i 1 per connexió; 512 KiB. */
describe('R5-02 · les baixades personals alhora', () => {
  const ambUrl = (adreca) => `/feed?url=${encodeURIComponent(adreca)}`;
  const resoledor = () => vi.fn(async (host, tipus) => (tipus === 'A' ? ['93.184.216.34'] : []));
  function penjat() {
    const pendents = [];
    const fetchImpl = vi.fn(() => new Promise((resol) => { pendents.push(resol); }));
    return { fetchImpl, pendents, allibera: () => { for (const resol of pendents.splice(0)) resol(origen(RSS)); } };
  }

  test('una connexió amb una baixada personal en camí rep 429 ocupat per a la segona; una altra connexió, no', async () => {
    const { fetchImpl, pendents, allibera } = penjat();
    const entorn = prepara({ personals: true, resolDns: resoledor(), fetchImpl });
    const primera = entorn.demana(ambUrl('https://blog1.example.org/feed'), { ip: '198.51.100.1' });
    await vi.waitFor(() => expect(pendents).toHaveLength(1));
    const segona = await entorn.demana(ambUrl('https://blog2.example.org/feed'), { ip: '198.51.100.1' });
    expect(await errorDe(segona)).toMatchObject({ status: 429, code: 'sdp_noticies_ocupat' });
    expect(segona.headers.get('retry-after')).toBe(String(ESPERA_OCUPAT_S));
    const altra = entorn.demana(ambUrl('https://blog2.example.org/feed'), { ip: '198.51.100.2' });
    await vi.waitFor(() => expect(pendents).toHaveLength(2));
    allibera();
    expect([(await primera).status, (await altra).status]).toEqual([200, 200]);
    /* Acabada la primera, la mateixa connexió ja en pot demanar una altra. */
    fetchImpl.mockImplementation(async () => origen(RSS));
    expect((await entorn.demana(ambUrl('https://blog3.example.org/feed'), { ip: '198.51.100.1' })).status).toBe(200);
  });

  test(`com a molt ${MAXIM_PERSONALS_EN_VOL} baixades personals alhora en tota la instància; la següent, 429 ocupat`, async () => {
    const { fetchImpl, pendents, allibera } = penjat();
    const entorn = prepara({ personals: true, resolDns: resoledor(), fetchImpl });
    const enCami = [];
    for (let i = 0; i < MAXIM_PERSONALS_EN_VOL; i += 1) enCami.push(entorn.demana(ambUrl(`https://blog${i}.example.org/feed`), { ip: `198.51.100.${i + 1}` }));
    await vi.waitFor(() => expect(pendents).toHaveLength(MAXIM_PERSONALS_EN_VOL));
    const massa = await entorn.demana(ambUrl('https://altre.example.org/feed'), { ip: '198.51.100.99' });
    expect(await errorDe(massa)).toMatchObject({ status: 429, code: 'sdp_noticies_ocupat' });
    expect(Number(massa.headers.get('retry-after'))).toBe(ESPERA_OCUPAT_S);
    /* Les fonts del sistema no hi compten. */
    const sistema = entorn.demana('/feed?font=ayudawp', { ip: '198.51.100.99' });
    await vi.waitFor(() => expect(pendents).toHaveLength(MAXIM_PERSONALS_EN_VOL + 1));
    allibera();
    expect((await Promise.all([...enCami, sistema])).map((r) => r.status)).toEqual(Array(MAXIM_PERSONALS_EN_VOL + 1).fill(200));
    fetchImpl.mockImplementation(async () => origen(RSS));
    expect((await entorn.demana(ambUrl('https://altre.example.org/feed'), { ip: '198.51.100.99' })).status).toBe(200);
  });

  test(`una font personal de més de ${MAXIM_BYTES_PERSONAL / 1024} KiB és origen_mida (declarada o en arribar); la mateixa mida d’una font del sistema passa`, async () => {
    const gran = `<rss version="2.0"><channel><title>${'x'.repeat(MAXIM_BYTES_PERSONAL)}</title></channel></rss>`;
    expect(gran.length).toBeLessThan(MAXIM_BYTES);
    const flux = () => new Response(new Blob([gran]).stream(), { headers: { 'content-type': 'application/rss+xml' } });
    const entorn = prepara({ personals: true, resolDns: resoledor(), fetchImpl: vi.fn(async () => flux()) });
    expect((await errorDe(await entorn.demana(ambUrl('https://blog.example.org/feed')))).code).toBe('sdp_noticies_origen_mida');
    const declarat = prepara({
      personals: true, resolDns: resoledor(), fetchImpl: vi.fn(async () => origen(RSS, { headers: { 'content-length': String(MAXIM_BYTES_PERSONAL + 1) } }))
    });
    expect((await errorDe(await declarat.demana(ambUrl('https://blog.example.org/feed')))).code).toBe('sdp_noticies_origen_mida');
    expect((await entorn.demana('/feed?font=ayudawp')).status).toBe(200);
  });
});

/* R5-05 · La còpia personal és de cada connexió, i `obtingut` no diu si algú altre l'havia demanada. */
describe('R5-05 · la memòria personal, per connexió', () => {
  const ambUrl = (adreca) => `/feed?url=${encodeURIComponent(adreca)}`;
  const PERSONAL = 'https://blog.example.org/feed/';

  test('una altra connexió no rep la còpia d’una altra (es torna a baixar), i obtingut és l’hora de la petició', async () => {
    const entorn = prepara({ personals: true, resolDns: vi.fn(async (host, tipus) => (tipus === 'A' ? ['93.184.216.34'] : [])) });
    const a = await (await entorn.demana(ambUrl(PERSONAL), { ip: '198.51.100.1' })).json();
    expect(a.obtingut).toBe('2026-10-24T09:00:00.000Z');
    entorn.avança(5 * 60 * 1000);
    const b = await (await entorn.demana(ambUrl(PERSONAL), { ip: '198.51.100.2' })).json();
    expect(entorn.fetchImpl).toHaveBeenCalledTimes(2);
    expect(b.obtingut).toBe('2026-10-24T09:05:00.000Z');
    entorn.avança(60 * 1000);
    /* La mateixa connexió, dins dels 15 min: la seua còpia, sense baixar, però amb l'hora d'ara. */
    const a2 = await (await entorn.demana(ambUrl(PERSONAL), { ip: '198.51.100.1' })).json();
    expect(entorn.fetchImpl).toHaveBeenCalledTimes(2);
    expect(a2).toEqual({ url: PERSONAL, xml: RSS, obtingut: '2026-10-24T09:06:00.000Z', obsoleta: false });
  });

  test('la còpia de reserva (24 h) també és només de la connexió que la va baixar', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(origen(RSS)).mockResolvedValue(origen('no', { status: 503 }));
    const entorn = prepara({ personals: true, fetchImpl, resolDns: vi.fn(async (host, tipus) => (tipus === 'A' ? ['93.184.216.34'] : [])) });
    await entorn.demana(ambUrl(PERSONAL), { ip: '198.51.100.1' });
    entorn.avança(FRESC_MS);
    expect((await (await entorn.demana(ambUrl(PERSONAL), { ip: '198.51.100.1' })).json()).obsoleta).toBe(true);
    expect((await errorDe(await entorn.demana(ambUrl(PERSONAL), { ip: '198.51.100.2' }))).code).toBe('sdp_noticies_origen_caigut');
  });
});

/* R5-06 · El BOM mana sobre el charset de la capçalera (és el que porten els bytes). */
describe('R5-06 · el BOM primer', () => {
  test('un BOM d’UTF-8 amb una capçalera que diu ISO-8859-1: UTF-8', () => {
    const bytes = Uint8Array.from([0xEF, 0xBB, 0xBF, ...new TextEncoder().encode('<rss><channel><title>Plaça i església</title></channel></rss>')]);
    expect(descodificaFeed(bytes, 'text/xml; charset=ISO-8859-1')).toBe('<rss><channel><title>Plaça i església</title></channel></rss>');
  });

  test('un BOM d’UTF-16LE amb una capçalera que diu UTF-8: UTF-16', () => {
    const text = '<rss><channel><title>Plaça</title></channel></rss>';
    const bytes = new Uint8Array(2 + text.length * 2);
    bytes.set([0xFF, 0xFE]);
    for (let i = 0; i < text.length; i += 1) bytes[2 + i * 2] = text.charCodeAt(i);
    expect(descodificaFeed(bytes, 'application/xml; charset=utf-8')).toBe(text);
  });
});

/* R5-07 · Les IPv6 de traducció i de protocol que passaven per públiques. */
describe('R5-07 · les IP de traducció, de protocol i de documentació', () => {
  test('64:ff9b:1::/48, ::ffff:0:0:0/96, 2001::/23, 3fff::/20 i 192.88.99.0/24 no són públiques', () => {
    for (const privada of ['64:ff9b:1::a00:1', '64:ff9b:1:ffff::1', '64:ff9b:1::808:808', '::ffff:0:a00:1', '::ffff:0:808:808', '::ffff:0:0:1',
      '2001::1', '2001:0:4136:e378:8000:63bf:3fff:fdd2', '2001:1::1', '2001:2::1', '2001:20::1', '2001:1ff:ffff::1', '3fff::1', '3fff:fff::1',
      '192.88.99.1']) {
      expect(esIpNoPublica(privada), privada).toBe(true);
    }
    for (const publica of ['2001:200::1', '2001:4860:4860::8888', '3fff:1000::1', '64:ff9b::808:808', '64:ff9b:2::1', '2606:4700:4700::1111']) {
      expect(esIpNoPublica(publica), publica).toBe(false);
    }
  });

  test('un nom que es resol a una d’estes és adreca_vetada, sense baixar res', async () => {
    for (const aaaa of ['64:ff9b:1::a00:1', '::ffff:0:a00:1', '2001::1']) {
      const entorn = prepara({ personals: true, resolDns: vi.fn(async (host, tipus) => (tipus === 'AAAA' ? [aaaa] : ['93.184.216.34'])) });
      expect((await errorDe(await entorn.demana(`/feed?url=${encodeURIComponent('https://blog.example.org/feed')}`))).code, aaaa).toBe('sdp_noticies_adreca_vetada');
      expect(entorn.fetchImpl).not.toHaveBeenCalled();
    }
  });
});

/* 261024 Lector · Les imatges: el servei només servix les que han eixit en un feed que ha baixat
   ell mateix les últimes 24 h, mai una adreça qualsevol. Bytes de prova fets a mà. */
describe('les imatges (/imatge?u=)', () => {
  const PNG = Uint8Array.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13]);
  const JPEG = Uint8Array.from([0xFF, 0xD8, 0xFF, 0xE0, 0, 16, 0x4A, 0x46, 0x49, 0x46]);
  const WEBP = Uint8Array.from([...'RIFF'].map((c) => c.charCodeAt(0)).concat([4, 0, 0, 0], [...'WEBPVP8 '].map((c) => c.charCodeAt(0))));
  const DEL_CATALEG = `https://${HOST}/wp-content/portada.webp`;
  const DE_FORA = 'https://cdn.example.org/a.jpg?w=1&h=2';
  const MINIATURA = 'https://i1.example.org/vi/x/hq.png';
  const FEED_AMB_IMATGES = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"
    xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>Prova</title><item><title>A</title>
    <enclosure url="https://cdn.example.org/a.jpg?w=1&amp;h=2" type="image/jpeg" length="10"/>
    <media:thumbnail url="${MINIATURA}"/>
    <content:encoded><![CDATA[<p>Hola</p><img src="${DEL_CATALEG}"><img src="https://${HOST}/wp-content/segona.webp">
    <img src="https://127.0.0.1/x.png">]]></content:encoded></item>
    <item><title>B</title><description>&lt;img src=&quot;https://127.0.0.1/x.png&quot;&gt;</description></item>
    <item><title>C</title><description>&lt;img src=&quot;https://intern.example.org/x.png&quot;&gt;</description></item>
    <item><title>D</title><description>&lt;img src=&quot;https://salta.example.org/x.png&quot;&gt;</description></item>
    </channel></rss>`;
  const imatge = (bytes, tipus) => () => new Response(bytes, { headers: { 'content-type': tipus } });
  const PUBLIQUES = ['93.184.216.34'];
  const resoledor = (respostes = {}) => vi.fn(async (host, tipus) => (respostes[host]?.[tipus] ?? (tipus === 'A' ? PUBLIQUES : [])));
  const ambU = (adreca) => `/imatge?u=${encodeURIComponent(adreca)}`;

  /* Un origen fals per adreça: el feed d'AyudaWP porta les imatges; la resta, el que diga `mapa`.
     Actualitzada a posta (261024 Lector final): R6 L-12, les imatges de fora del catàleg estan
     apagades per defecte; estes proves les encenen (imatgesExternes: true) per a provar les seues
     regles. Les proves de l'interruptor apagat són al describe «R6 L-12». */
  function preparaImatges({ mapa = {}, ...opcions } = {}) {
    const respostes = {
      [FEED]: () => origen(FEED_AMB_IMATGES),
      [DEL_CATALEG]: imatge(WEBP, 'image/webp'),
      [DE_FORA]: imatge(JPEG, 'image/jpeg'),
      [MINIATURA]: imatge(PNG, 'image/png'),
      ...mapa
    };
    const fetchImpl = vi.fn(async (url, init) => (respostes[url] ? respostes[url](init) : new Response('no', { status: 404 })));
    return prepara({ fetchImpl, resolDns: resoledor(), imatgesExternes: true, ...opcions });
  }

  /* Actualitzada a posta (261024 Lector final): R6 L-08. Una de fora del catàleg que cap feed ha
     portat continua sent desconeguda, sense cap petició; una del host d'una font del catàleg ja no ho
     és: es servix encara que la instància no l'haja vista (una notícia desada sobreviu al reciclatge). */
  test('una imatge de fora del catàleg que cap feed ha portat: 404 imatge_desconeguda, sense cap petició; una del catàleg, es servix', async () => {
    const entorn = preparaImatges();
    for (const adreca of [DE_FORA, MINIATURA, 'https://example.org/qualsevol.png']) {
      expect(await errorDe(await entorn.demana(ambU(adreca))), adreca).toMatchObject({ status: 404, code: 'sdp_noticies_imatge_desconeguda' });
    }
    expect(entorn.fetchImpl).not.toHaveBeenCalled();
    expect((await entorn.demana(ambU(DEL_CATALEG))).status).toBe(200);
    expect(entorn.fetchImpl.mock.calls.map(([url]) => url)).toEqual([DEL_CATALEG]);
  });

  test('després del feed: els bytes, el tipus, un dia de memòria al navegador, cap galeta; a l’origen, GET honest i res de qui demana', async () => {
    const entorn = preparaImatges();
    await entorn.demana('/feed?font=ayudawp');
    const resposta = await entorn.demana(ambU(DEL_CATALEG), { headers: { cookie: 'no=passa', authorization: 'Bearer no-passa' } });
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('content-type')).toBe('image/webp');
    expect(resposta.headers.get('cache-control')).toBe(`public, max-age=${MAX_AGE_IMATGE_S}`);
    expect(MAX_AGE_IMATGE_S).toBe(86400);
    expect(resposta.headers.get('set-cookie')).toBeNull();
    expect(resposta.headers.get('x-content-type-options')).toBe('nosniff');
    expect(resposta.headers.get('access-control-allow-origin')).toBe('*');
    expect(resposta.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
    expect(new Uint8Array(await resposta.arrayBuffer())).toEqual(WEBP);
    const [url, init] = entorn.fetchImpl.mock.calls[1];
    expect(url).toBe(DEL_CATALEG);
    expect(init).toMatchObject({ method: 'GET', redirect: 'manual', headers: { 'User-Agent': AGENT_USUARI, Accept: ACCEPTA_IMATGE } });
    expect(Object.keys(init.headers).sort()).toEqual(['Accept', 'User-Agent']);
  });

  /* Actualitzada a posta (261024_1800, T1; Codex C6-02): el que fixava era el defecte. Un nom aprovat
     no acredita la IP: amb resoledor, el host d'una font del catàleg també es resol (el feed i la
     imatge), i una resposta pública el deixa passar; qualsevol altre, igual que abans. */
  test('amb resoledor, el host d’una font del catàleg també es resol (el feed i la imatge); qualsevol altre, també (enclosure i media:thumbnail)', async () => {
    const resolDns = resoledor();
    const entorn = preparaImatges({ resolDns });
    await entorn.demana('/feed?font=ayudawp');
    expect((await entorn.demana(ambU(DEL_CATALEG))).status).toBe(200);
    expect(resolDns.mock.calls.map(([host, tipus]) => `${host} ${tipus}`)).toEqual([`${HOST} A`, `${HOST} AAAA`, `${HOST} A`, `${HOST} AAAA`]);
    resolDns.mockClear();
    const fora = await entorn.demana(ambU(DE_FORA));
    expect([fora.status, fora.headers.get('content-type')]).toEqual([200, 'image/jpeg']);
    expect((await entorn.demana(ambU(MINIATURA))).status).toBe(200);
    expect(resolDns.mock.calls.map(([host, tipus]) => `${host} ${tipus}`).sort())
      .toEqual(['cdn.example.org A', 'cdn.example.org AAAA', 'i1.example.org A', 'i1.example.org AAAA']);
    expect(entorn.fetchImpl.mock.calls.map(([url]) => url)).toEqual([FEED, DEL_CATALEG, DE_FORA, MINIATURA]);
  });

  test('resolució: un host de fora que es resol a una IP privada és adreca_vetada, sense baixar; una IP literal també', async () => {
    const resolDns = resoledor({ 'intern.example.org': { A: ['10.0.0.5'] } });
    const entorn = preparaImatges({ resolDns, mapa: { 'https://intern.example.org/x.png': imatge(PNG, 'image/png'), 'https://127.0.0.1/x.png': imatge(PNG, 'image/png') } });
    await entorn.demana('/feed?font=ayudawp');
    for (const adreca of ['https://intern.example.org/x.png', 'https://127.0.0.1/x.png']) {
      const cos = await errorDe(await entorn.demana(ambU(adreca)));
      expect(cos, adreca).toMatchObject({ status: 422, code: 'sdp_noticies_adreca_vetada' });
      expect(JSON.stringify(cos)).not.toContain(adreca);
    }
    expect(entorn.fetchImpl.mock.calls.map(([url]) => url)).toEqual([FEED]);
    /* Actualitzada a posta (261024_1800, T1): el feed del sistema també es resol (els dos primers);
       la IP literal no es resol mai. */
    expect(resolDns.mock.calls.map(([host]) => host)).toEqual([HOST, HOST, 'intern.example.org', 'intern.example.org']);
  });

  test('sense resoledor: les del catàleg encara es servixen; les de fora, 503 imatge_sense_dns, sense cap petició', async () => {
    const entorn = preparaImatges({ resolDns: null });
    await entorn.demana('/feed?font=ayudawp');
    expect((await entorn.demana(ambU(DEL_CATALEG))).status).toBe(200);
    expect(await errorDe(await entorn.demana(ambU(DE_FORA)))).toMatchObject({ status: 503, code: 'sdp_noticies_imatge_sense_dns' });
    expect(entorn.fetchImpl.mock.calls.map(([url]) => url)).toEqual([FEED, DEL_CATALEG]);
  });

  test('cada redirecció torna a passar les regles: cap a un host privat, adreca_vetada; com a molt 2', async () => {
    const salt = (location) => () => new Response(null, { status: 302, headers: { location } });
    const resolDns = resoledor({ 'intern.example.org': { A: ['192.168.1.10'] } });
    const entorn = preparaImatges({ resolDns, mapa: { 'https://salta.example.org/x.png': salt('https://intern.example.org/y.png') } });
    await entorn.demana('/feed?font=ayudawp');
    expect((await errorDe(await entorn.demana(ambU('https://salta.example.org/x.png')))).code).toBe('sdp_noticies_adreca_vetada');
    expect(entorn.fetchImpl.mock.calls.map(([url]) => url)).toEqual([FEED, 'https://salta.example.org/x.png']);
    const bona = preparaImatges({ mapa: { 'https://salta.example.org/x.png': salt('https://cdn.example.org/a.jpg?w=1&h=2') } });
    await bona.demana('/feed?font=ayudawp');
    expect((await bona.demana(ambU('https://salta.example.org/x.png'))).status).toBe(200);
  });

  test(`el tipus: només ${TIPUS_IMATGE.join(', ')}, i els bytes ho han de dir (la signatura mana)`, async () => {
    for (const [cos, tipus] of [['<html></html>', 'text/html'], ['<svg xmlns="http://www.w3.org/2000/svg"/>', 'image/svg+xml'], ['<html></html>', 'image/png'], [PNG, 'application/octet-stream']]) {
      const entorn = preparaImatges({ mapa: { [DEL_CATALEG]: imatge(cos, tipus) } });
      await entorn.demana('/feed?font=ayudawp');
      expect((await errorDe(await entorn.demana(ambU(DEL_CATALEG)))).code, tipus).toBe('sdp_noticies_origen_format');
    }
    /* Un PNG que diu ser JPEG es servix com el que és. */
    const entorn = preparaImatges({ mapa: { [DEL_CATALEG]: imatge(PNG, 'image/jpeg') } });
    await entorn.demana('/feed?font=ayudawp');
    expect((await entorn.demana(ambU(DEL_CATALEG))).headers.get('content-type')).toBe('image/png');
  });

  test(`${MAXIM_BYTES_IMATGE / 1024 / 1024} MiB com a molt (declarat o en arribar) i ${TEMPS_ORIGEN_MS} ms`, async () => {
    const gran = new Uint8Array(MAXIM_BYTES_IMATGE + 1);
    gran.set(PNG);
    const declarat = preparaImatges({ mapa: { [DEL_CATALEG]: () => new Response(PNG, { headers: { 'content-type': 'image/png', 'content-length': String(MAXIM_BYTES_IMATGE + 1) } }) } });
    await declarat.demana('/feed?font=ayudawp');
    expect((await errorDe(await declarat.demana(ambU(DEL_CATALEG)))).code).toBe('sdp_noticies_origen_mida');
    const flux = preparaImatges({ mapa: { [DEL_CATALEG]: () => new Response(new Blob([gran]).stream(), { headers: { 'content-type': 'image/png' } }) } });
    await flux.demana('/feed?font=ayudawp');
    expect((await errorDe(await flux.demana(ambU(DEL_CATALEG)))).code).toBe('sdp_noticies_origen_mida');
    const penja = (init) => new Promise((resol, rebutja) => {
      init.signal.addEventListener('abort', () => rebutja(new DOMException('avortada', 'AbortError')));
    });
    const lenta = preparaImatges({ mapa: { [DEL_CATALEG]: penja } });
    await lenta.demana('/feed?font=ayudawp');
    const promesa = lenta.demana(ambU(DEL_CATALEG));
    await vi.waitFor(() => expect(lenta.temporitzador.pendents.size).toBe(1));
    expect([...lenta.temporitzador.pendents.values()].map(({ ms }) => ms)).toEqual([TEMPS_ORIGEN_MS]);
    lenta.temporitzador.venc();
    expect((await errorDe(await promesa)).code).toBe('sdp_noticies_origen_temps');
  });

  /* Actualitzada a posta (261024 Lector final): R6 L-08. La regla de les 24 h es mira ara amb una
     imatge de fora del catàleg (DE_FORA): la del catàleg ja no depén d'haver-la vista. */
  test('passades 24 h des del feed, una imatge de fora ja no es coneix; si el feed es torna a baixar, sí; la del catàleg, sempre', async () => {
    const entorn = preparaImatges();
    await entorn.demana('/feed?font=ayudawp');
    entorn.avança(VIDA_IMATGES_MS);
    expect((await errorDe(await entorn.demana(ambU(DE_FORA)))).code).toBe('sdp_noticies_imatge_desconeguda');
    expect((await entorn.demana(ambU(DEL_CATALEG))).status).toBe(200);
    await entorn.demana('/feed?font=ayudawp');
    expect((await entorn.demana(ambU(DE_FORA))).status).toBe(200);
  });

  /* Actualitzada a posta (261024 Lector final): R6 L-08 i L-09. La segona <img> es mira ara en un
     host de fora del catàleg (la del catàleg es servix sempre). */
  test('de fora del catàleg, només la primera <img> de cada contingut; i cap altre paràmetre que u', async () => {
    const PRIMERA = 'https://cdn.example.org/primera.png';
    const SEGONA = 'https://cdn.example.org/segona.png';
    const ambDues = `<rss version="2.0"><channel><title>Dues</title><item><title>A</title><description><![CDATA[<img src="${PRIMERA}"><img src="${SEGONA}">]]></description></item></channel></rss>`;
    const entorn = preparaImatges({ mapa: { [FEED]: () => origen(ambDues), [PRIMERA]: imatge(PNG, 'image/png'), [SEGONA]: imatge(PNG, 'image/png') } });
    await entorn.demana('/feed?font=ayudawp');
    expect((await errorDe(await entorn.demana(ambU(SEGONA)))).code).toBe('sdp_noticies_imatge_desconeguda');
    expect((await errorDe(await entorn.demana('/imatge'))).code).toBe('sdp_noticies_peticio');
    expect((await errorDe(await entorn.demana(`${ambU(DEL_CATALEG)}&font=ayudawp`))).code).toBe('sdp_noticies_peticio');
    expect(entorn.fetchImpl.mock.calls.map(([url]) => url)).toEqual([FEED]);
    expect((await entorn.demana(ambU(PRIMERA))).status).toBe(200);
  });

  /* Actualitzada a posta (261024 Lector final): R6 L-02. La part de «baixades alhora» (la novena
     era 429 ocupat) és ara al describe «R6 L-02 · la cua de les imatges»: la novena espera el seu
     torn. El límit propi de les imatges, igual. */
  test('les imatges tenen el seu límit (no gasten el general)', async () => {
    const entorn = preparaImatges();
    await entorn.demana('/feed?font=ayudawp');
    for (let i = 1; i < LIMIT.peticions; i += 1) await entorn.demana('/fonts');
    expect((await entorn.demana('/fonts')).status).toBe(429);
    expect((await entorn.demana(ambU(DEL_CATALEG))).status).toBe(200);
    expect(LIMIT_IMATGES.peticions).toBeGreaterThan(LIMIT.peticions);
  });

  /* Actualitzada a posta (261024 Lector final): R6 L-11. Les imatges d'una font personal es recorden
     només per a la connexió que l'ha llegida: una altra rep imatge_desconeguda, sense cap petició
     (abans, qualsevol podia saber així si algú havia llegit eixa font). */
  test('les imatges d’una font personal es recorden només per a la connexió que la llig (i passen les mateixes regles)', async () => {
    const PERSONAL = 'https://blog.example.org/feed/';
    const ambImatge = `<rss version="2.0"><channel><title>Meua</title><item><enclosure url="${DE_FORA}" type="image/jpeg"/></item></channel></rss>`;
    const entorn = preparaImatges({ personals: true, mapa: { [PERSONAL]: () => origen(ambImatge) } });
    expect((await entorn.demana(`/feed?url=${encodeURIComponent(PERSONAL)}`)).status).toBe(200);
    expect(await errorDe(await entorn.demana(ambU(DE_FORA), { ip: '203.0.113.77' }))).toMatchObject({ status: 404, code: 'sdp_noticies_imatge_desconeguda' });
    expect(entorn.fetchImpl.mock.calls.map(([url]) => url)).toEqual([PERSONAL]);
    expect((await entorn.demana(ambU(DE_FORA))).status).toBe(200);
    /* La còpia d'una connexió no és de l'altra: ni quan la segona ja la coneix per la seua font. */
    expect((await entorn.demana(`/feed?url=${encodeURIComponent(PERSONAL)}`, { ip: '203.0.113.77' })).status).toBe(200);
    expect((await entorn.demana(ambU(DE_FORA), { ip: '203.0.113.77' })).status).toBe(200);
    expect(entorn.fetchImpl.mock.calls.filter(([url]) => url === DE_FORA)).toHaveLength(2);
  });
});

/* R6 L-12 i L-08 (Lector final) · Les imatges de fora del catàleg, APAGADES per defecte (el DNS
   rebinding de les personals hi valdria igual); les del catàleg i dels seus CDN, sempre. */
describe('R6 L-12 · les imatges de fora del catàleg, apagades per defecte', () => {
  const PNG = Uint8Array.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13]);
  const DE_FORA = 'https://cdn.example.org/a.png';
  const DEL_CATALEG = `https://${HOST}/wp-content/portada.png`;
  const DEL_CDN = 'https://i3.ytimg.com/vi/Wjit5lnEiIY/hqdefault.jpg';
  const ambDeFora = `<rss version="2.0"><channel><title>Prova</title><item><title>A</title><enclosure url="${DE_FORA}" type="image/png"/></item></channel></rss>`;
  const ambU = (adreca) => `/imatge?u=${encodeURIComponent(adreca)}`;
  const png = () => new Response(PNG, { headers: { 'content-type': 'image/png' } });

  test('per defecte, una imatge d’un host de fora és 403 imatge_de_fora, encara que l’haja portada un feed: sense resoldre ni baixar res', async () => {
    const resolDns = vi.fn(async () => ['93.184.216.34']);
    const fetchImpl = vi.fn(async (url) => (url === FEED ? origen(ambDeFora) : png()));
    const { demana } = prepara({ fetchImpl, resolDns });
    await demana('/feed?font=ayudawp');
    for (const adreca of [DE_FORA, 'https://example.org/qualsevol.png']) {
      expect(await errorDe(await demana(ambU(adreca)))).toEqual({ status: 403, code: 'sdp_noticies_imatge_de_fora', message: expect.any(String), data: { status: 403 } });
    }
    /* Actualitzada a posta (261024_1800, T1): només es resol el host del feed del sistema (T1, C6-02);
       el de la imatge de fora, mai. */
    expect(resolDns.mock.calls.map(([host]) => host)).toEqual([HOST, HOST]);
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([FEED]);
  });

  /* Actualitzada a posta (261024_1800, T1; Codex C6-02): el que fixava era el defecte («sense
     resoldre»). Amb resoledor, el nom d'un host aprovat es resol igual; sense, encara es servixen. */
  test('les del host d’una font del catàleg i dels seus CDN es servixen sense haver-les vistes (una instància nova); amb resoledor, el seu nom es resol', async () => {
    const resolDns = vi.fn(async () => ['93.184.216.34']);
    const fetchImpl = vi.fn(async () => png());
    const { demana } = prepara({ fetchImpl, resolDns });
    for (const adreca of [DEL_CATALEG, DEL_CDN]) expect((await demana(ambU(adreca))).status, adreca).toBe(200);
    expect(resolDns.mock.calls.map(([host, tipus]) => `${host} ${tipus}`)).toEqual([`${HOST} A`, `${HOST} AAAA`, 'i3.ytimg.com A', 'i3.ytimg.com AAAA']);
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([DEL_CATALEG, DEL_CDN]);
    /* També sense resoledor a l'entorn. */
    const senseDns = prepara({ fetchImpl: vi.fn(async () => png()), resolDns: null });
    expect((await senseDns.demana(ambU(DEL_CDN))).status).toBe(200);
  });

  test('una redirecció des d’un host aprovat cap a un de fora és imatge_de_fora, sense seguir-la', async () => {
    const fetchImpl = vi.fn(async (url) => (url === DEL_CATALEG ? new Response(null, { status: 302, headers: { location: DE_FORA } }) : png()));
    const { demana } = prepara({ fetchImpl, resolDns: vi.fn(async () => ['93.184.216.34']) });
    expect((await errorDe(await demana(ambU(DEL_CATALEG)))).code).toBe('sdp_noticies_imatge_de_fora');
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([DEL_CATALEG]);
  });

  test('les regles del nom continuen per als hosts aprovats: http, un port, credencials o la IP, adreca_vetada', async () => {
    const { demana, fetchImpl } = prepara({ fetchImpl: vi.fn(async () => png()) });
    for (const adreca of [`http://${HOST}/a.png`, `https://${HOST}:8443/a.png`, `https://u:p@${HOST}/a.png`, 'https://127.0.0.1/a.png']) {
      expect((await errorDe(await demana(ambU(adreca)))).code, adreca).toBe('sdp_noticies_adreca_vetada');
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('CDN_IMATGES: la instantània dels CDN d’imatges aprovats (un de nou la posa en roig: és decisió del Mestre)', () => {
    expect(CDN_IMATGES).toEqual(['i.ytimg.com', 'i1.ytimg.com', 'i2.ytimg.com', 'i3.ytimg.com', 'i4.ytimg.com']);
    expect(Object.isFrozen(CDN_IMATGES)).toBe(true);
  });
});

/* R6 L-02 (Lector final) · La cua de les imatges: una llista de notícies en demana més de huit
   alhora, i el navegador no torna a demanar mai una <img> que ha fallat. */
describe('R6 L-02 · la cua de les imatges', () => {
  const PNG = Uint8Array.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13]);
  const ambU = (adreca) => `/imatge?u=${encodeURIComponent(adreca)}`;
  const png = () => new Response(PNG, { headers: { 'content-type': 'image/png' } });
  /* Un feed del sistema amb `n` miniatures en hosts de fora (com Ben Cord: 15 de 15), i un origen
     que respon cada imatge quan la prova ho diu. */
  function ambMiniatures(n, opcions = {}) {
    const imatges = Array.from({ length: n }, (_, i) => `https://cdn${i}.example.org/${i}.png`);
    const feed = `<rss version="2.0"><channel><title>Moltes</title>${imatges.map((u) => `<item><enclosure url="${u}" type="image/png"/></item>`).join('')}</channel></rss>`;
    const pendents = [];
    let enVol = 0;
    let maxim = 0;
    const fetchImpl = vi.fn((url) => {
      if (url === FEED) return Promise.resolve(origen(feed));
      enVol += 1;
      maxim = Math.max(maxim, enVol);
      return new Promise((resol) => { pendents.push(() => { enVol -= 1; resol(png()); }); });
    });
    /* Una empremta immediata: així una petició arriba a la baixada en una sola volta. */
    const entorn = prepara({ fetchImpl, resolDns: vi.fn(async () => ['93.184.216.34']), imatgesExternes: true, empremta: async (text) => text, ...opcions });
    return { ...entorn, imatges, pendents, maxim: () => maxim };
  }
  /* Respon les baixades que van arribant a l'origen fins que `promesa` acaba; torna el que dona. */
  async function responFins(pendents, promesa) {
    let acabada = false;
    const resultat = promesa.then((valor) => { acabada = true; return valor; });
    for (let volta = 0; volta < 1000 && !acabada; volta += 1) {
      for (const fer of pendents.splice(0)) fer();
      await new Promise((resol) => { setImmediate(resol); });
    }
    return resultat;
  }

  test(`${MAXIM_IMATGES_EN_VOL + 7} miniatures distintes alhora: com a molt ${MAXIM_IMATGES_EN_VOL} baixades, la resta espera el torn, i totes acaben 200`, async () => {
    const entorn = ambMiniatures(MAXIM_IMATGES_EN_VOL + 7);
    await entorn.demana('/feed?font=ayudawp');
    const respostes = entorn.imatges.map((u) => entorn.demana(ambU(u)));
    await vi.waitFor(() => expect(entorn.pendents).toHaveLength(MAXIM_IMATGES_EN_VOL));
    await new Promise((resol) => { setTimeout(resol, 0); });
    expect(entorn.pendents).toHaveLength(MAXIM_IMATGES_EN_VOL);
    /* Al rellotge: el termini de cada baixada en camí i l'espera de cada una que fa cua (cap no ha
       rebut res encara: ni un 429). */
    expect(entorn.temporitzador.pendents.size).toBe(MAXIM_IMATGES_EN_VOL + 7);
    expect([...entorn.temporitzador.pendents.values()].every(({ ms }) => ms === ESPERA_TORN_IMATGE_MS)).toBe(true);
    const estats = (await responFins(entorn.pendents, Promise.all(respostes))).map((r) => r.status);
    expect(estats).toEqual(Array(MAXIM_IMATGES_EN_VOL + 7).fill(200));
    expect(entorn.maxim()).toBe(MAXIM_IMATGES_EN_VOL);
    /* Cap espera queda penjada al rellotge. */
    expect(entorn.temporitzador.pendents.size).toBe(0);
  });

  test(`ocupat només per a una sobrecàrrega de veres: la cua plena (${MAXIM_IMATGES_EN_CUA}), o un torn que no arriba en ${ESPERA_TORN_IMATGE_MS} ms`, async () => {
    const entorn = ambMiniatures(MAXIM_IMATGES_EN_VOL + MAXIM_IMATGES_EN_CUA + 1);
    await entorn.demana('/feed?font=ayudawp');
    /* Primer les que troben lloc (i els terminis de les seues baixades); després, les que fan cua. */
    const enCami = entorn.imatges.slice(0, MAXIM_IMATGES_EN_VOL).map((u) => entorn.demana(ambU(u)));
    await vi.waitFor(() => expect(entorn.pendents).toHaveLength(MAXIM_IMATGES_EN_VOL));
    const terminis = new Set(entorn.temporitzador.pendents.keys());
    const enCua = entorn.imatges.slice(MAXIM_IMATGES_EN_VOL, MAXIM_IMATGES_EN_VOL + MAXIM_IMATGES_EN_CUA).map((u) => entorn.demana(ambU(u)));
    await vi.waitFor(() => expect(entorn.temporitzador.pendents.size).toBe(MAXIM_IMATGES_EN_VOL + MAXIM_IMATGES_EN_CUA));
    const massa = await entorn.demana(ambU(entorn.imatges[MAXIM_IMATGES_EN_VOL + MAXIM_IMATGES_EN_CUA]));
    expect(await errorDe(massa)).toMatchObject({ status: 429, code: 'sdp_noticies_ocupat' });
    expect(massa.headers.get('retry-after')).toBe(String(ESPERA_OCUPAT_S));
    /* La mateixa imatge que ja va de camí no és cap baixada nova (ni ocupa la cua). */
    const repetida = entorn.demana(ambU(entorn.imatges[0]));
    /* El torn no arriba: les esperes vencen (no els terminis de les baixades), i les que esperaven reben ocupat. */
    entorn.temporitzador.vencEls((id) => !terminis.has(id));
    const esperades = await Promise.all(enCua);
    expect(esperades.map((r) => r.status)).toEqual(Array(MAXIM_IMATGES_EN_CUA).fill(429));
    expect((await errorDe(esperades[0])).code).toBe('sdp_noticies_ocupat');
    const acabades = await responFins(entorn.pendents, Promise.all([...enCami, repetida]));
    expect(acabades.every((r) => r.status === 200)).toBe(true);
    expect(entorn.fetchImpl).toHaveBeenCalledTimes(MAXIM_IMATGES_EN_VOL + 1);
    /* Buida la cua, la següent torna a passar tot d'una. */
    expect((await responFins(entorn.pendents, entorn.demana(ambU(entorn.imatges[MAXIM_IMATGES_EN_VOL + 1])))).status).toBe(200);
  });

  test('una imatge repetida ix de la memòria dels bytes, sense tornar a l’origen; passats 15 min, sí que hi torna', async () => {
    const entorn = ambMiniatures(1);
    await entorn.demana('/feed?font=ayudawp');
    expect((await responFins(entorn.pendents, entorn.demana(ambU(entorn.imatges[0])))).status).toBe(200);
    for (const ip of ['198.51.100.7', '203.0.113.9']) {
      const repetida = await entorn.demana(ambU(entorn.imatges[0]), { ip });
      expect([repetida.status, repetida.headers.get('content-type')]).toEqual([200, 'image/png']);
      expect(new Uint8Array(await repetida.arrayBuffer())).toEqual(PNG);
    }
    expect(entorn.fetchImpl).toHaveBeenCalledTimes(2);
    entorn.avança(FRESC_IMATGE_MS);
    expect((await responFins(entorn.pendents, entorn.demana(ambU(entorn.imatges[0])))).status).toBe(200);
    expect(entorn.fetchImpl).toHaveBeenCalledTimes(3);
  });

  test(`la memòria dels bytes és fitada: ${MAXIM_IMATGES_CAU} imatges i ${MAXIM_BYTES_CAU_IMATGES / 1024 / 1024} MiB com a molt; la més vella se’n va`, async () => {
    const entorn = ambMiniatures(MAXIM_IMATGES_CAU + 1);
    await entorn.demana('/feed?font=ayudawp');
    for (const u of entorn.imatges) expect((await responFins(entorn.pendents, entorn.demana(ambU(u)))).status).toBe(200);
    const abans = entorn.fetchImpl.mock.calls.length;
    expect((await entorn.demana(ambU(entorn.imatges[MAXIM_IMATGES_CAU]))).status).toBe(200);
    expect(entorn.fetchImpl.mock.calls.length).toBe(abans);
    expect((await responFins(entorn.pendents, entorn.demana(ambU(entorn.imatges[0])))).status).toBe(200);
    expect(entorn.fetchImpl.mock.calls.length).toBe(abans + 1);
    expect(MAXIM_BYTES_CAU_IMATGES).toBeGreaterThanOrEqual(MAXIM_BYTES_IMATGE);
  });

  test('una imatge que no és d’un feed del sistema (del catàleg sense haver-la vista) no es compartix entre connexions', async () => {
    const DEL_CDN = 'https://i2.ytimg.com/vi/qToiptX7rLw/hqdefault.jpg';
    const fetchImpl = vi.fn(async () => png());
    const { demana } = prepara({ fetchImpl, empremta: async (text) => text });
    for (const ip of ['198.51.100.7', '198.51.100.7', '203.0.113.9']) expect((await demana(ambU(DEL_CDN), { ip })).status).toBe(200);
    /* La mateixa connexió, de la memòria; l'altra, una baixada seua. */
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe('imatgesDelFeed (pura)', () => {
  test('enclosure, media:thumbnail, media:content d’imatge, itunes:image, link enclosure d’Atom i la primera <img> https de cada contingut', () => {
    const xml = `<rss xmlns:media="m" xmlns:itunes="i" xmlns:content="c"><channel><itunes:image href="https://example.org/logo.png"/>
      <item><enclosure url="https://cdn.example.org/a.jpg?w=1&amp;h=2" type="image/jpeg"/><enclosure url="https://cdn.example.org/so.mp3" type="audio/mpeg"/>
      <enclosure url="https://cdn.example.org/sense-tipus.webp"/><media:thumbnail url="https://i1.example.org/hq.jpg"/>
      <media:content url="https://www.example.org/v/x" type="application/x-shockwave-flash"/><media:content url="https://cdn.example.org/m.png" medium="image"/>
      <content:encoded><![CDATA[<img src="data:image/png;base64,AAAA"><img src="/relativa.png"><img src="http://cdn.example.org/http.png">
      <img src='https://cdn.example.org/primera.png#x'><img src="https://cdn.example.org/segona.png">]]></content:encoded></item>
      <item><description>&lt;p&gt;&lt;img alt=&quot;x&quot; src=&quot;https://cdn.example.org/d.png?x=1&amp;amp;y=2&quot;&gt;</description></item>
      </channel></rss>`;
    /* Actualitzada a posta (261024 Lector final): R6 L-09. La primera <img> del contingut és ara la
       que tria el nucli del Lector: la primera que es resol, http inclosa. Ací és http.png (la data:
       no es resol, i la relativa no té base), que el Lector no demana: primera.png ja no es guarda. */
    expect(imatgesDelFeed(xml)).toEqual([
      'https://example.org/logo.png', 'https://cdn.example.org/a.jpg?w=1&h=2', 'https://cdn.example.org/sense-tipus.webp',
      'https://i1.example.org/hq.jpg', 'https://cdn.example.org/m.png', 'https://cdn.example.org/d.png?x=1&y=2'
    ]);
    /* Amb una base (el lloc de la font), la relativa es resol i és ella la primera. */
    expect(imatgesDelFeed(xml, 'https://blog.example.org')).toContain('https://blog.example.org/relativa.png');
    expect(imatgesDelFeed(xml, 'https://blog.example.org')).not.toContain('https://cdn.example.org/primera.png');
    const atom = '<feed xmlns="http://www.w3.org/2005/Atom"><entry><link rel="enclosure" type="image/png" href="https://example.org/e.png"/>'
      + '<link rel="alternate" href="https://example.org/no.png"/><content type="xhtml"><div><img src="https://example.org/c.png"/></div></content></entry></feed>';
    expect(imatgesDelFeed(atom)).toEqual(['https://example.org/e.png', 'https://example.org/c.png']);
  });

  test('fitada i sense llançar: res que no siga text, un feed trencat no fa la cerca quadràtica, i com a molt el màxim per feed', () => {
    for (const res of [null, undefined, 42, '', '<rss>']) expect(imatgesDelFeed(res)).toEqual([]);
    const trencat = '<description>'.repeat(40000);
    const inici = performance.now();
    expect(imatgesDelFeed(trencat)).toEqual([]);
    /* Actualitzada a posta (261024 suite completa): amb 2 s la prova queia per càrrega
       (2,8 s dins de la suite sencera). Una cerca quadràtica sobre estos 560.000
       caràcters tarda minuts, així que 10 s continua separant lineal de quadràtic. */
    expect(performance.now() - inici).toBeLessThan(10000);
    const moltes = `<rss>${Array.from({ length: 700 }, (_, i) => `<media:thumbnail url="https://example.org/${i}.png"/>`).join('')}</rss>`;
    expect(imatgesDelFeed(moltes)).toHaveLength(500);
  });
});

/* T1 (261024_1800, P1-07; auditoria Codex 261024_1800 C6-02, C6-03) · L'anti-SSRF a tots els salts:
   cap baixada no ix sense que el seu nom passe les regles, tampoc la d'un host aprovat (el catàleg i
   els seus CDN). Un resoledor fals diu què respon cada nom; cap petició de veres. */
describe('T1 · anti-SSRF a tots els salts, també dels hosts aprovats', () => {
  const PNG = Uint8Array.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13]);
  const png = () => new Response(PNG, { headers: { 'content-type': 'image/png' } });
  const DEL_CATALEG = `https://${HOST}/wp-content/portada.png`;
  const DEL_CDN = 'https://i3.ytimg.com/vi/Wjit5lnEiIY/hqdefault.jpg';
  const ambU = (adreca) => `/imatge?u=${encodeURIComponent(adreca)}`;
  /* Els rangs que nomena T1, amb els seus extrems, i formes IPv6 que en porten una IPv4. */
  const PRIVADES = Object.freeze([
    ['A', '127.0.0.1'], ['A', '127.255.255.254'], ['A', '10.0.0.1'], ['A', '10.255.255.255'], ['A', '172.16.0.1'],
    ['A', '172.31.255.254'], ['A', '192.168.0.1'], ['A', '192.168.255.254'], ['A', '169.254.169.254'],
    ['AAAA', '::1'], ['AAAA', 'fc00::1'], ['AAAA', 'fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'],
    ['AAAA', '::ffff:169.254.169.254'], ['AAAA', '::ffff:7f00:1'], ['AAAA', 'fe80::1']
  ]);
  /* Un resoledor que respon el mateix a tots els noms: A pública, i la privada al seu tipus. */
  const ambPrivada = ([tipus, ip]) => vi.fn(async (host, demanat) => (demanat === tipus ? [ip] : (demanat === 'A' ? ['93.184.216.34'] : [])));

  test('esIpNoPublica: cada rang de T1, extrems inclosos, no és públic; els veïns de fora dels rangs, sí', () => {
    for (const [, ip] of PRIVADES) expect(esIpNoPublica(ip), ip).toBe(true);
    for (const ip of ['126.255.255.255', '11.0.0.1', '172.15.255.255', '172.32.0.1', '192.167.255.255', '192.169.0.1', '169.253.255.255',
      '169.255.0.1', '93.184.216.34', '2001:4860:4860::8888', '2606:4700:4700::1111']) {
      expect(esIpNoPublica(ip), ip).toBe(false);
    }
  });

  test.each(PRIVADES)('el feed d’una font del sistema que es resol a %s %s: 422 adreca_vetada, sense baixar res ni dir l’adreça', async (tipus, ip) => {
    const resolDns = ambPrivada([tipus, ip]);
    const fetchImpl = vi.fn(async () => origen(RSS));
    const { demana } = prepara({ fetchImpl, resolDns });
    const cos = await errorDe(await demana('/feed?font=ayudawp'));
    expect(cos).toMatchObject({ status: 422, code: 'sdp_noticies_adreca_vetada' });
    expect(JSON.stringify(cos)).not.toContain(ip);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(resolDns.mock.calls.map(([host]) => host)).toEqual([HOST, HOST]);
  });

  test.each(PRIVADES)('una imatge del catàleg o d’un CDN aprovat que es resol a %s %s: adreca_vetada, sense baixar res', async (tipus, ip) => {
    const fetchImpl = vi.fn(async () => png());
    const { demana } = prepara({ fetchImpl, resolDns: ambPrivada([tipus, ip]) });
    for (const adreca of [DEL_CATALEG, DEL_CDN]) {
      expect(await errorDe(await demana(ambU(adreca))), adreca).toMatchObject({ status: 422, code: 'sdp_noticies_adreca_vetada' });
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('una sola resposta privada entre moltes de públiques ja la veta (A i AAAA)', async () => {
    const resolDns = vi.fn(async (host, tipus) => (tipus === 'A' ? ['93.184.216.34', '10.1.2.3'] : ['2606:4700:4700::1111']));
    const fetchImpl = vi.fn(async () => origen(RSS));
    const { demana } = prepara({ fetchImpl, resolDns });
    expect((await errorDe(await demana('/feed?font=ayudawp'))).code).toBe('sdp_noticies_adreca_vetada');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('cada salt torna a resoldre: un nom que canvia de resposta entre el primer salt i la redirecció (rebinding entre salts) es veta abans del segon', async () => {
    let respostes = 0;
    const resolDns = vi.fn(async (host, tipus) => {
      if (tipus !== 'A') return [];
      respostes += 1;
      return respostes === 1 ? ['93.184.216.34'] : ['169.254.169.254'];
    });
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: '/rss' } })).mockResolvedValue(origen(RSS));
    const { demana } = prepara({ fetchImpl, resolDns });
    expect((await errorDe(await demana('/feed?font=ayudawp'))).code).toBe('sdp_noticies_adreca_vetada');
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([FEED]);
  });

  test('una redirecció d’una imatge aprovada cap a un altre host aprovat que es resol privat: vetada, sense seguir-la', async () => {
    const resolDns = vi.fn(async (host, tipus) => (tipus !== 'A' ? [] : (host === 'i3.ytimg.com' ? ['192.168.1.1'] : ['93.184.216.34'])));
    const fetchImpl = vi.fn(async (url) => (url === DEL_CATALEG ? new Response(null, { status: 302, headers: { location: DEL_CDN } }) : png()));
    const { demana } = prepara({ fetchImpl, resolDns });
    expect((await errorDe(await demana(ambU(DEL_CATALEG)))).code).toBe('sdp_noticies_adreca_vetada');
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([DEL_CATALEG]);
  });

  test('si el nom d’una font del sistema es torna privat, el Lector rep la còpia de reserva (obsoleta) sense cap baixada nova', async () => {
    let privada = false;
    const resolDns = vi.fn(async (host, tipus) => (tipus === 'A' ? [privada ? '10.0.0.9' : '93.184.216.34'] : []));
    const fetchImpl = vi.fn(async () => origen(RSS));
    const entorn = prepara({ fetchImpl, resolDns });
    expect((await entorn.demana('/feed?font=ayudawp')).status).toBe(200);
    privada = true;
    entorn.avança(FRESC_MS);
    const cos = await (await entorn.demana('/feed?font=ayudawp')).json();
    expect(cos).toMatchObject({ font: 'ayudawp', obsoleta: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  /* Codex C6-02, segona passada (261024_1800) · Amb Promise.all, una família privada i l'altra amb
     error donava 'desconeguda' i un host aprovat passava (200, una baixada). */
  test.each([['A', '127.0.0.1', 'AAAA'], ['AAAA', '::1', 'A'], ['A', '169.254.169.254', 'AAAA'], ['AAAA', 'fd00::5', 'A']])(
    'una família %s privada (%s) i l’altra (%s) amb error: vetada, sense baixar res (feed, imatge del catàleg i CDN)', async (tipus, ip) => {
      const resolDns = vi.fn(async (host, demanat) => { if (demanat === tipus) return [ip]; throw new Error('SERVFAIL'); });
      const fetchImpl = vi.fn(async (url) => (url === FEED ? origen(RSS) : png()));
      const { demana } = prepara({ fetchImpl, resolDns, personals: true });
      expect((await errorDe(await demana('/feed?font=ayudawp'))).code).toBe('sdp_noticies_adreca_vetada');
      for (const adreca of [DEL_CATALEG, DEL_CDN]) expect((await errorDe(await demana(ambU(adreca)))).code, adreca).toBe('sdp_noticies_adreca_vetada');
      expect((await errorDe(await demana(`/feed?url=${encodeURIComponent('https://blog.example.org/feed')}`))).code).toBe('sdp_noticies_adreca_vetada');
      expect(fetchImpl).not.toHaveBeenCalled();
    });

  test('un host aprovat sense cap adreça (cap resposta, o les dues famílies amb error) no es baixa: 502 origen_caigut', async () => {
    for (const resolDns of [vi.fn(async () => []), vi.fn(async () => { throw new Error('SERVFAIL'); }), vi.fn(async () => 'no és una llista')]) {
      const fetchImpl = vi.fn(async (url) => (url === FEED ? origen(RSS) : png()));
      const { demana } = prepara({ fetchImpl, resolDns });
      expect((await errorDe(await demana('/feed?font=ayudawp'))).code).toBe('sdp_noticies_origen_caigut');
      for (const adreca of [DEL_CATALEG, DEL_CDN]) expect((await errorDe(await demana(ambU(adreca)))).code, adreca).toBe('sdp_noticies_origen_caigut');
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });

  /* Actualitzada a posta (Gauntlet 261024_1945, Gemini G1945-01): el que fixava era el defecte. Una adreça
     pública i l'altra família amb error ja no passen: una família que no ha respost no acredita res. */
  test.each(['A', 'AAAA'])('un host aprovat amb una adreça pública i la família %s amb error no es baixa (502 origen_caigut); una font personal, tampoc', async (falla) => {
    const resolDns = vi.fn(async (host, tipus) => {
      if (tipus === falla) throw new Error('SERVFAIL');
      return tipus === 'A' ? ['93.184.216.34'] : ['2606:4700:4700::1111'];
    });
    const fetchImpl = vi.fn(async (url) => (url === FEED ? origen(RSS) : png()));
    const { demana } = prepara({ fetchImpl, resolDns, personals: true });
    expect((await errorDe(await demana('/feed?font=ayudawp'))).code).toBe('sdp_noticies_origen_caigut');
    for (const adreca of [DEL_CATALEG, DEL_CDN]) expect((await errorDe(await demana(ambU(adreca)))).code, adreca).toBe('sdp_noticies_origen_caigut');
    expect((await errorDe(await demana(`/feed?url=${encodeURIComponent('https://blog.example.org/feed')}`))).code).toBe('sdp_noticies_origen_caigut');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('un host sense IPv6 no cau: l’AAAA sense resposta (el NotFound d’index.ts és una llista buida) no és cap fallada', async () => {
    const resolDns = vi.fn(async (host, tipus) => (tipus === 'A' ? ['93.184.216.34'] : []));
    const fetchImpl = vi.fn(async (url) => (url === FEED ? origen(RSS) : png()));
    const { demana } = prepara({ fetchImpl, resolDns });
    expect((await demana('/feed?font=ayudawp')).status).toBe(200);
    for (const adreca of [DEL_CATALEG, DEL_CDN]) expect((await demana(ambU(adreca))).status, adreca).toBe(200);
  });

  test('disponibilitat: només sense resoledor a l’entorn els hosts aprovats es servixen sense resoldre; les personals es tanquen', async () => {
    const fetchImpl = vi.fn(async (url) => (url === FEED ? origen(RSS) : png()));
    const { demana } = prepara({ fetchImpl, resolDns: null, personals: true, imatgesExternes: true });
    expect((await demana('/feed?font=ayudawp')).status).toBe(200);
    for (const adreca of [DEL_CATALEG, DEL_CDN]) expect((await demana(ambU(adreca))).status, adreca).toBe(200);
    expect((await errorDe(await demana(`/feed?url=${encodeURIComponent('https://blog.example.org/feed')}`))).code).toBe('sdp_noticies_personals_sense_dns');
  });

  test('HOSTS_DEL_SISTEMA: la instantània de la llista blanca nativa (un de nou la posa en roig: és decisió del Mestre); és exactament la dels feeds de fonts.json', () => {
    expect(HOSTS_DEL_SISTEMA).toEqual(['ayudawp.com', 'emowe.com', 'iaenaccion.com', 'www.jonhernandez.education', 'www.youtube.com']);
    expect(Object.isFrozen(HOSTS_DEL_SISTEMA)).toBe(true);
    expect([...new Set(CATALEG.fonts.map((font) => new URL(font.feed).hostname))].sort()).toEqual([...HOSTS_DEL_SISTEMA]);
    /* Ni el domini curt dels vídeos ni la forma sense www: cap host sense feed. */
    for (const host of ['youtu.be', 'youtube.com', 'jonhernandez.education']) expect(HOSTS_DEL_SISTEMA).not.toContain(host);
  });

  test('validaCataleg: el feed i el lloc, només d’un host de la llista blanca nativa, https net i sense port; cap IP literal ni subdomini per extensió', () => {
    const font = (feed, lloc = feed) => ({ categories: [], fonts: [{ id: 'f', feed, lloc }] });
    for (const feed of ['https://127.0.0.1/feed', 'https://[::1]/feed', 'https://2130706433/feed', 'https://169.254.169.254/latest/meta-data/',
      'https://example.org/feed', 'https://emowe.com.example.org/rss.xml', 'https://sub.ayudawp.com/feed/', 'https://ayudawp.com./feed/',
      'https://youtube.com/feeds/videos.xml?channel_id=UCX_dT6nVtCIHRo_GFOsWK2A', 'https://youtu.be/x', 'https://ayudawp.com:8443/feed/',
      'http://ayudawp.com/feed/', 'https://u:p@ayudawp.com/feed/', 'https://ayudawp.com/feed/#x', 'file:///etc/passwd', 'gopher://ayudawp.com/', 'no és una adreça',
      /* Un CDN aprovat per a les imatges no és cap host de feeds. */
      'https://i.ytimg.com/feed']) {
      expect(() => validaCataleg(font(feed)), feed).toThrow(TypeError);
    }
    /* El lloc: del mateix host que el feed, i amb les mateixes regles. */
    for (const lloc of ['https://emowe.com', 'http://ayudawp.com', 'https://ayudawp.com:8443', 'https://127.0.0.1', null]) {
      expect(() => validaCataleg(font('https://ayudawp.com/feed/', lloc)), String(lloc)).toThrow(TypeError);
    }
    expect(() => validaCataleg(font('https://ayudawp.com:443/feed/', 'https://ayudawp.com'))).not.toThrow();
    expect(() => creaGestor({ cataleg: font('https://127.0.0.1/feed') })).toThrow(TypeError);
  });
});
