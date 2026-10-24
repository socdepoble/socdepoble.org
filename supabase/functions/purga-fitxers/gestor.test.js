// @vitest-environment node
/* T8 (261024; P0-20, auditoria Codex 261024_1315 C-06) · El worker
   purga-fitxers (gestor.js) amb un fetch fals encaminat per l'adreça:
   PostgREST (una cua en memòria que fa de private.purga_storage_pendent i
   storage.objects) i l'API REST de Storage. Tot és sintètic: cap xarxa, cap
   clau de veres. Prova la porta del cron, el cos del DELETE (el de remove()
   de storage-js), fet/fallit, el 404 com a fet, el temps esgotat, la
   reserva que torna sola, el pressupost de temps i que cap resposta ni cap
   línia del registre porta un nom d'objecte.
   Al final, la frontera: cap fitxer de src/ crida les RPC del worker ni
   nomena els seus secrets, i index.ts només li passa tres variables. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, test } from 'vitest';
import { PURGA, capcaleresDeServei, classificaStorage, creaGestor, igualsEnTempsConstant, perBucket, trossos } from './gestor.js';

const URL_SB = 'https://projecte.exemple.test';
const SECRET_CRON = 's'.repeat(64);
const CLAU_LEGADA = 'eyJhbGciOiJIUzI1NiJ9.servei.sintetic';
const CLAU_NOVA = 'sb_secret_sintetica_0000';
const ENV = Object.freeze({ SUPABASE_URL: URL_SB, SUPABASE_SERVICE_ROLE_KEY: CLAU_LEGADA, SDP_CRON_SECRET: SECRET_CRON });
/* Noms amb l'uid a la ruta, com els de veres: no poden eixir mai del worker. */
const NOM_A = 'poble-1/00000000-0000-4000-8000-0000000000aa/mur/foto-secreta.webp';
const NOM_B = 'poble-1/00000000-0000-4000-8000-0000000000aa/perfil/avatar-secret.webp';
const NOM_C = '6f1c2e9a-0000-4000-8000-00000000000c';

/** Una base falsa: la cua, els objectes de Storage i el registre de crides. */
function creaMon({ cua = [], objectes = [], storage = () => ({ estat: 200 }), base = () => null } = {}) {
  const mon = {
    cua: cua.map((f, i) => ({ id: i + 1, intents: 0, ultim_error: null, ...f })),
    objectes: new Set(objectes),
    crides: [],
    fetch: async (url, opcions = {}) => {
      const u = new URL(url);
      const cos = opcions.body ? JSON.parse(opcions.body) : null;
      mon.crides.push({ cami: u.pathname, metode: opcions.method, capcaleres: opcions.headers, cos, senyal: opcions.signal });
      const falla = base(u.pathname, cos, opcions);
      if (falla) return falla;
      if (u.pathname === '/rest/v1/rpc/purga_fitxers_reclama') {
        const lot = mon.cua.filter((f) => f.intents === 0).slice(0, cos.p_limit);
        for (const f of lot) f.intents += 1;
        return Response.json(lot.map(({ id, bucket_id, nom, intents }) => ({ id, bucket_id, nom, intents })));
      }
      if (u.pathname === '/rest/v1/rpc/purga_fitxers_fets') {
        const fets = mon.cua.filter((f) => cos.p_ids.includes(f.id) && !mon.objectes.has(`${f.bucket_id}/${f.nom}`));
        mon.cua = mon.cua.filter((f) => !fets.includes(f));
        return Response.json(fets.length);
      }
      if (u.pathname === '/rest/v1/rpc/purga_fitxers_fallits') {
        for (const f of mon.cua) if (cos.p_ids.includes(f.id)) f.ultim_error = cos.p_error;
        return Response.json(cos.p_ids.length);
      }
      if (u.pathname.startsWith('/storage/v1/object/') && opcions.method === 'DELETE') {
        const bucket = decodeURIComponent(u.pathname.slice('/storage/v1/object/'.length));
        const r = await storage(bucket, cos, opcions);
        if (r.estat >= 200 && r.estat < 300 && !r.sensePurgar) {
          for (const nom of cos.prefixes) mon.objectes.delete(`${bucket}/${nom}`);
        }
        return new Response(r.cos === undefined ? '[]' : JSON.stringify(r.cos), { status: r.estat });
      }
      return new Response('{}', { status: 599 });
    }
  };
  return mon;
}

const peticio = ({ metode = 'POST', secret = SECRET_CRON } = {}) => new Request(`${URL_SB}/functions/v1/purga-fitxers`, {
  method: metode,
  headers: secret === null ? {} : { 'x-sdp-cron': secret }
});

function creaRegistre() {
  const linies = [];
  const desa = (...args) => linies.push(args.map(String).join(' '));
  return { linies, info: desa, warn: desa, error: desa, log: desa };
}

let registre;
beforeEach(() => { registre = creaRegistre(); });

const gestorDe = (mon, extra = {}) => creaGestor({ env: ENV, fetch: mon.fetch, registre, ...extra });
const cami = (mon) => mon.crides.map((c) => `${c.metode} ${c.cami}`);

describe('la porta: només el cron amb el secret', () => {
  test('un GET és 405 i no crida res', async () => {
    const mon = creaMon();
    const r = await gestorDe(mon)(peticio({ metode: 'GET' }));
    expect(r.status).toBe(405);
    expect(r.headers.get('Allow')).toBe('POST');
    expect(mon.crides).toEqual([]);
  });

  test.each([
    ['sense secret', { ...ENV, SDP_CRON_SECRET: '' }],
    ['un secret curt', { ...ENV, SDP_CRON_SECRET: 'curt' }],
    ['sense clau de servei', { ...ENV, SUPABASE_SERVICE_ROLE_KEY: '' }],
    ['sense URL', { ...ENV, SUPABASE_URL: '' }],
    ['una URL amb camí', { ...ENV, SUPABASE_URL: `${URL_SB}/rest/v1` }]
  ])('%s és 503 config, i no crida res', async (_, env) => {
    const mon = creaMon();
    const r = await creaGestor({ env, fetch: mon.fetch, registre })(peticio());
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ ok: false, error: 'config' });
    expect(mon.crides).toEqual([]);
  });

  test.each([['sense capçalera', null], ['un secret equivocat', 'x'.repeat(64)], ['un prefix del secret', SECRET_CRON.slice(0, 63)]])(
    '%s és 401 i no crida res', async (_, secret) => {
      const mon = creaMon({ cua: [{ bucket_id: 'mitjans', nom: NOM_A }] });
      const r = await gestorDe(mon)(peticio({ secret }));
      expect(r.status).toBe(401);
      expect(mon.crides).toEqual([]);
    });

  test('la comparació és per resum: iguals, diferents i de llargària diferent', async () => {
    expect(await igualsEnTempsConstant(SECRET_CRON, SECRET_CRON)).toBe(true);
    expect(await igualsEnTempsConstant(SECRET_CRON, `${SECRET_CRON}x`)).toBe(false);
    expect(await igualsEnTempsConstant('', SECRET_CRON)).toBe(false);
  });
});

describe('una passada', () => {
  test('reclama, esborra per bucket amb {prefixes} i marca fet; la cua queda buida', async () => {
    const mon = creaMon({
      cua: [{ bucket_id: 'mitjans', nom: NOM_A }, { bucket_id: 'mitjans', nom: NOM_B }, { bucket_id: 'xat_adjunts', nom: NOM_C }],
      objectes: [`mitjans/${NOM_A}`, `mitjans/${NOM_B}`, `xat_adjunts/${NOM_C}`]
    });
    const r = await gestorDe(mon)(peticio());
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, fets: 3, fallits: 0, pendents: 0, sense_provar: 0, lots: 1, esgotat: false });
    expect(cami(mon)).toEqual([
      'POST /rest/v1/rpc/purga_fitxers_reclama',
      'DELETE /storage/v1/object/mitjans',
      'POST /rest/v1/rpc/purga_fitxers_fets',
      'DELETE /storage/v1/object/xat_adjunts',
      'POST /rest/v1/rpc/purga_fitxers_fets',
      'POST /rest/v1/rpc/purga_fitxers_reclama'
    ]);
    const [reclama, esborra, fets] = mon.crides;
    expect(reclama.cos).toEqual({ p_limit: PURGA.LOT });
    expect(esborra.cos).toEqual({ prefixes: [NOM_A, NOM_B] });
    expect(esborra.capcaleres).toMatchObject({ apikey: CLAU_LEGADA, Authorization: `Bearer ${CLAU_LEGADA}`, 'Content-Type': 'application/json' });
    expect(esborra.senyal).toBeInstanceOf(AbortSignal);
    expect(fets.cos).toEqual({ p_ids: [1, 2] });
    expect(mon.cua).toEqual([]);
    expect(mon.objectes.size).toBe(0);
  });

  test('la clau nova sb_secret_ només va a apikey', async () => {
    expect(capcaleresDeServei(CLAU_NOVA)).toEqual({ apikey: CLAU_NOVA });
    const mon = creaMon({ cua: [{ bucket_id: 'mitjans', nom: NOM_A }], objectes: [`mitjans/${NOM_A}`] });
    await creaGestor({ env: { ...ENV, SUPABASE_SERVICE_ROLE_KEY: CLAU_NOVA }, fetch: mon.fetch, registre })(peticio());
    for (const c of mon.crides) {
      expect(c.capcaleres.apikey).toBe(CLAU_NOVA);
      expect(c.capcaleres).not.toHaveProperty('Authorization');
    }
  });

  test('un objecte que ja no hi era és fet: 200 sense ell, 404 i el 400 amb statusCode 404', async () => {
    for (const storage of [() => ({ estat: 200, cos: [] }), () => ({ estat: 404, cos: { error: 'not_found' } }),
      () => ({ estat: 400, cos: { statusCode: '404', error: 'Bucket not found' } })]) {
      const mon = creaMon({ cua: [{ bucket_id: 'mitjans', nom: NOM_A }], storage });
      const r = await gestorDe(mon)(peticio());
      expect(await r.json()).toMatchObject({ ok: true, fets: 1, fallits: 0, pendents: 0 });
      expect(mon.cua).toEqual([]);
    }
  });

  test('un 200 que no l’ha esborrat no buida la cua: la base el torna a comprovar i queda pendent', async () => {
    const mon = creaMon({
      cua: [{ bucket_id: 'mitjans', nom: NOM_A }], objectes: [`mitjans/${NOM_A}`],
      storage: () => ({ estat: 200, sensePurgar: true })
    });
    const r = await gestorDe(mon)(peticio());
    expect(await r.json()).toMatchObject({ ok: true, fets: 0, pendents: 1 });
    expect(mon.cua).toHaveLength(1);
  });

  test.each([
    ['un 500', () => ({ estat: 500, cos: { error: 'intern' } }), 'storage 500'],
    ['un 400 que no és «no trobat»', () => ({ estat: 400, cos: { statusCode: '403', error: 'Unauthorized' } }), 'storage 400'],
    ['un 401', () => ({ estat: 401 }), 'storage 401'],
    ['la xarxa', () => { throw new TypeError(`fetch failed ${NOM_A}`); }, 'xarxa']
  ])('%s és fallit: la fila es queda amb l’error i sense el nom', async (_, storage, error) => {
    const mon = creaMon({ cua: [{ bucket_id: 'mitjans', nom: NOM_A }], objectes: [`mitjans/${NOM_A}`], storage });
    const r = await gestorDe(mon)(peticio());
    expect(await r.json()).toMatchObject({ ok: true, fets: 0, fallits: 1 });
    const fallits = mon.crides.find((c) => c.cami === '/rest/v1/rpc/purga_fitxers_fallits');
    expect(fallits.cos).toEqual({ p_ids: [1], p_error: error });
    expect(mon.cua[0].ultim_error).toBe(error);
    expect(mon.objectes.has(`mitjans/${NOM_A}`)).toBe(true);
  });

  test('una petició a Storage que no respon s’avorta pel topall i és «temps»', async () => {
    const mon = creaMon({
      cua: [{ bucket_id: 'mitjans', nom: NOM_A }],
      storage: (_, __, opcions) => new Promise((_resol, rebutja) => {
        opcions.signal.addEventListener('abort', () => rebutja(new DOMException('avortat', 'AbortError')));
      })
    });
    const r = await gestorDe(mon, { opcions: { TOPALL_MS: 20 } })(peticio());
    expect(await r.json()).toMatchObject({ ok: true, fallits: 1 });
    expect(mon.cua[0].ultim_error).toBe('temps');
  });

  test('cada lot es talla en peticions de PER_PETICIO noms i passa a un lot nou fins que la cua és buida', async () => {
    const cua = Array.from({ length: 7 }, (_, i) => ({ bucket_id: 'mitjans', nom: `poble-1/uid/f${i}.webp` }));
    const mon = creaMon({ cua });
    const r = await gestorDe(mon, { opcions: { LOT: 5, PER_PETICIO: 2 } })(peticio());
    expect(await r.json()).toMatchObject({ ok: true, fets: 7, lots: 2 });
    const deletes = mon.crides.filter((c) => c.metode === 'DELETE').map((c) => c.cos.prefixes.length);
    expect(deletes).toEqual([2, 2, 1, 2]);
    expect(mon.crides.filter((c) => c.cami.endsWith('purga_fitxers_reclama'))).toHaveLength(3);
  });

  test('MAX_LOTS limita la passada encara que quede cua', async () => {
    const mon = creaMon({ cua: Array.from({ length: 10 }, (_, i) => ({ bucket_id: 'mitjans', nom: `n${i}` })) });
    const r = await gestorDe(mon, { opcions: { LOT: 1, MAX_LOTS: 3 } })(peticio());
    expect(await r.json()).toMatchObject({ fets: 3, lots: 3 });
    expect(mon.cua).toHaveLength(7);
  });

  test('el pressupost de temps: cap lot nou si no hi caben tres peticions, cap tros si no n’hi caben dos', async () => {
    let t = 0;
    const mon = creaMon({
      cua: Array.from({ length: 4 }, (_, i) => ({ bucket_id: 'mitjans', nom: `n${i}` })),
      storage: () => { t += 40; return { estat: 200 }; }
    });
    const r = await gestorDe(mon, { ara: () => t, opcions: { PRESSUPOST_MS: 100, TOPALL_MS: 30, LOT: 4, PER_PETICIO: 1 } })(peticio());
    /* 0 ms: lot (100 ≥ 90) · tros 1 (100 ≥ 60) → 40 ms · tros 2 (60 ≥ 60) → 80 ms · trossos 3 i 4 (20 < 60) sense provar. */
    expect(await r.json()).toEqual({ ok: true, fets: 2, fallits: 0, pendents: 0, sense_provar: 2, lots: 1, esgotat: true });
    expect(mon.crides.filter((c) => c.metode === 'DELETE')).toHaveLength(2);
    expect(mon.cua.map((f) => f.intents)).toEqual([1, 1]);
  });

  test('la cua buida: una sola reclamació i res més', async () => {
    const mon = creaMon();
    const r = await gestorDe(mon)(peticio());
    expect(await r.json()).toEqual({ ok: true, fets: 0, fallits: 0, pendents: 0, sense_provar: 0, lots: 0, esgotat: false });
    expect(cami(mon)).toEqual(['POST /rest/v1/rpc/purga_fitxers_reclama']);
  });

  test('una fila amb forma estranya no es toca i compta com a sense provar', async () => {
    const mon = creaMon({ cua: [{ bucket_id: 'mitjans', nom: NOM_A }, { bucket_id: '../fora', nom: NOM_B }, { bucket_id: 'mitjans', nom: '' }] });
    const r = await gestorDe(mon)(peticio());
    expect(await r.json()).toMatchObject({ fets: 1, sense_provar: 2 });
    expect(mon.crides.filter((c) => c.metode === 'DELETE').map((c) => c.cami)).toEqual(['/storage/v1/object/mitjans']);
  });

  test('si la base no respon a la reclamació, 502 i cap DELETE', async () => {
    const mon = creaMon({
      cua: [{ bucket_id: 'mitjans', nom: NOM_A }],
      base: (cami) => (cami.endsWith('purga_fitxers_reclama') ? new Response('{"message":"x"}', { status: 500 }) : null)
    });
    const r = await gestorDe(mon)(peticio());
    expect(r.status).toBe(502);
    expect(await r.json()).toMatchObject({ ok: false, error: 'base' });
    expect(mon.crides.filter((c) => c.metode === 'DELETE')).toEqual([]);
  });

  test('si falla el marcatge, 502: la fila reclamada es queda a la cua i l’esborrat es pot repetir', async () => {
    const mon = creaMon({
      cua: [{ bucket_id: 'mitjans', nom: NOM_A }], objectes: [`mitjans/${NOM_A}`],
      base: (cami) => (cami.endsWith('purga_fitxers_fets') ? new Response('{}', { status: 503 }) : null)
    });
    const r = await gestorDe(mon)(peticio());
    expect(r.status).toBe(502);
    expect(mon.cua).toHaveLength(1);
    expect(mon.cua[0].intents).toBe(1);
    expect(mon.objectes.size).toBe(0);
  });
});

describe('cap nom d’objecte ni cap secret ix del worker', () => {
  test('ni a les respostes ni al registre, en cap dels camins', async () => {
    const camins = [
      { storage: () => ({ estat: 200 }) },
      { storage: () => ({ estat: 500, cos: { message: NOM_A } }) },
      { storage: () => { throw new TypeError(NOM_A); } },
      { base: (cami) => (cami.endsWith('purga_fitxers_fets') ? new Response(JSON.stringify({ message: NOM_A }), { status: 500 }) : null) }
    ];
    for (const extra of camins) {
      const mon = creaMon({ cua: [{ bucket_id: 'mitjans', nom: NOM_A }, { bucket_id: 'mitjans', nom: NOM_B }], ...extra });
      const r = await gestorDe(mon)(peticio());
      const text = await r.text();
      for (const secret of [NOM_A, NOM_B, 'foto-secreta', 'avatar-secret', SECRET_CRON, CLAU_LEGADA]) {
        expect(text).not.toContain(secret);
        for (const linia of registre.linies) expect(linia).not.toContain(secret);
      }
    }
  });
});

describe('peces pures', () => {
  test('perBucket agrupa i descarta les formes estranyes; trossos talla', () => {
    const grups = perBucket([{ id: 1, bucket_id: 'a', nom: 'x' }, { id: '2', bucket_id: 'a', nom: 'y' }, { id: 3, bucket_id: 'b', nom: 'z' },
      { id: 0, bucket_id: 'a', nom: 'w' }, { id: 4, bucket_id: 'a b', nom: 'v' }, { id: 5, bucket_id: 'a', nom: 'u'.repeat(1025) }, null]);
    expect([...grups.entries()]).toEqual([['a', [{ id: 1, nom: 'x' }, { id: 2, nom: 'y' }]], ['b', [{ id: 3, nom: 'z' }]]]);
    expect(perBucket(null).size).toBe(0);
    expect(trossos([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  test('classificaStorage', async () => {
    const r = (estat, cos) => new Response(cos === undefined ? null : JSON.stringify(cos), { status: estat });
    expect(await classificaStorage(r(200, []))).toEqual({ fet: true });
    expect(await classificaStorage(r(204))).toEqual({ fet: true });
    expect(await classificaStorage(r(404))).toEqual({ fet: true });
    expect(await classificaStorage(r(400, { statusCode: '404' }))).toEqual({ fet: true });
    expect(await classificaStorage(r(400, { statusCode: '400' }))).toEqual({ fet: false, error: 'storage 400' });
    expect(await classificaStorage(new Response('no és json', { status: 400 }))).toEqual({ fet: false, error: 'storage 400' });
    expect(await classificaStorage(r(429))).toEqual({ fet: false, error: 'storage 429' });
  });
});

describe('la frontera', () => {
  const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const fitxers = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const c = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : fitxers(c);
    return /\.(js|jsx|mjs|ts|tsx|json|html)$/.test(e.name) ? [c] : [];
  });

  /* wikiManifest.js el genera la Wiki (com a identitatDual.guarda.test.js): és prosa, no codi. */
  const GENERATS = new Set(['src/data/wikiManifest.js']);

  test('cap fitxer de src/ crida les RPC del worker ni nomena els seus secrets', () => {
    const trobats = fitxers(path.join(ARREL, 'src'))
      .filter((f) => !/\.test\.jsx?$/.test(f) && !GENERATS.has(path.relative(ARREL, f)))
      .filter((f) => /purga_fitxers_(reclama|fets|fallits)|SDP_CRON_SECRET|SUPABASE_SERVICE_ROLE_KEY/.test(readFileSync(f, 'utf8')))
      .map((f) => path.relative(ARREL, f));
    expect(trobats).toEqual([]);
  });

  test('index.ts només fa de pont: importa el gestor i li passa tres variables, mai tot l’entorn', () => {
    const index = readFileSync(path.join(ARREL, 'supabase/functions/purga-fitxers/index.ts'), 'utf8');
    expect(index).toContain("import { creaGestor } from './gestor.js';");
    expect(index).toContain('Deno.serve(creaGestor(');
    expect([...index.matchAll(/Deno\.env\.get\('([A-Z_]+)'\)/g)].map((m) => m[1]))
      .toEqual(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SDP_CRON_SECRET']);
    expect(index).not.toContain('toObject');
  });

  test('el gestor no usa APIs fora del Baseline compartit ni de cap dels dos costats', () => {
    /* Sense comentaris: es comprova el codi, no la prosa que l'explica. */
    const gestor = readFileSync(path.join(ARREL, 'supabase/functions/purga-fitxers/gestor.js'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
    expect(gestor).toContain('export function creaGestor');
    expect(gestor).not.toMatch(/\bBuffer\b|\bDeno\.|AbortSignal\.(timeout|any)|\brequire\(|from 'node:/);
    expect(gestor).not.toMatch(/^\s*import\s/m);
  });
});
