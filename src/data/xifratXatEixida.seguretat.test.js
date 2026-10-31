// @vitest-environment node
/* P1-12 pas 17 (disseny §4.5.6, §8.5 i §18 D-09) · L'oblit del xat xifrat en
   eixir de la sessió: bandera apagada sense cap efecte; la CI explícita de qui
   ix (la interfície ja pot haver buidat l'àmbit); les dues capes web, només el
   prefix sdp_xat_; OBLIT_FALLIT anotat a la capa efímera (sobreviu a la
   recàrrega) i reintentable; cap rebuig; instantània estable per a
   useSyncExternalStore. El port se simula BUIT (sense getBackendImplementation),
   com en 142 proves de src/: cap paràmetre per defecte pot tocar-lo. */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { E2EE_ACTIU_PER_DEFECTE } from '../config/xifratXat.js';
import {
  CLAU_OBLITS_PENDENTS, ESTAT_OBLIT_XAT, MAX_OBLITS_PENDENTS, _reiniciaOblitXat,
  escoltaOblitXat, estatOblitXat, oblidaXatEnEixir, reintentaOblitXat
} from './xifratXatEixida.js';
import { ESTAT_OBLIT } from './xifratXatPipeline.js';
import { ambXifratXat, creaServeiAmbitXat, serveiXifratXat } from './xifratXat.js';
import { registraServeiXifratXat } from './xifratXatServei.js';
import { clauIdentitat, creaMagatzemXat } from './xifratXatMagatzem.js';
import { creaIdentitat } from './xifratXatProtocol.js';
import { CONTRACTE_NUCLI } from './contracte.js';
import { creaIdbFalsEstructurat } from '../../tests/helpers/idbFalsEstructurat.js';

vi.mock('./backendPort.js', () => ({}));

const cripto = globalThis.crypto;
const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const B = 'bbbbbbbb-2222-4222-8222-222222222222';
const CONFIG = Object.freeze({ backendId: 'supabase', supabaseUrl: 'https://backend.example.test', dataMode: 'remote', tenantId: null });
const T0 = Date.UTC(2026, 9, 29, 17);
const ci = (u) => clauIdentitat({ backendId: 'supabase', endpoint: CONFIG.supabaseUrl, joId: u });
const ambit = (u) => JSON.stringify(['backend-sintetic', u, `persona::${u}`]);

function creaMagatzemWeb(inicial = {}) {
  const dades = new Map(Object.entries(inicial));
  return {
    dades,
    get length() { return dades.size; },
    key: (i) => [...dades.keys()][i] ?? null,
    removeItem: (k) => { dades.delete(k); }
  };
}

function creaEfimer(inicial = {}) {
  const dades = new Map(Object.entries(inicial));
  return {
    dades,
    get: vi.fn((k) => (dades.has(k) ? structuredClone(dades.get(k)) : null)),
    set: vi.fn((k, v) => { dades.set(k, structuredClone(v)); return true; }),
    del: vi.fn((k) => { dades.delete(k); return true; })
  };
}

/* Un servei d'àmbit real amb un motor d'oblit simulat (el patró de XatContext.xifratAmbit). */
function creaServeiSimulat(respostes = []) {
  const motorRef = {};
  const servei = creaServeiAmbitXat({ motorRef });
  const cua = [...respostes];
  motorRef.oblidaTot = vi.fn(async () => {
    const seguent = cua.length ? cua.shift() : { estat: 'oblidat', pendents: [] };
    if (seguent instanceof Error) throw seguent;
    const estat = Object.freeze({ causes: Object.freeze([]), quanMs: T0, ...seguent, pendents: Object.freeze([...(seguent.pendents ?? [])]) });
    servei.desaEstatOblit(estat);
    return estat;
  });
  const impl = {};
  registraServeiXifratXat(impl, servei);
  return { servei, motorRef, port: () => impl };
}

let web;
let efimer;
const magatzemWeb = (capa) => web[capa];
beforeEach(() => {
  _reiniciaOblitXat();
  web = { sessio: creaMagatzemWeb({ sdp_xat_frase_vista: '1', altra: 'queda' }), preferencies: creaMagatzemWeb({ sdp_xat_recordatori: '1', tema: 'fosc' }) };
  efimer = creaEfimer();
});
afterEach(() => vi.restoreAllMocks());

describe('bandera apagada (la real)', () => {
  test('E2EE_ACTIU_PER_DEFECTE continua false i res no toca el port, les capes, l’efímer ni els oients', async () => {
    expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
    const port = vi.fn();
    const web2 = vi.fn();
    const oient = vi.fn();
    const desfes = escoltaOblitXat(oient);
    await expect(oblidaXatEnEixir({ config: CONFIG, usuariId: A, port, magatzemWeb: web2, efimer })).resolves.toBeNull();
    await expect(reintentaOblitXat({ port, magatzemWeb: web2, efimer })).resolves.toBeNull();
    expect(estatOblitXat({ port, efimer })).toBeNull();
    expect(estatOblitXat()).toBeNull();
    await expect(oblidaXatEnEixir()).resolves.toBeNull();
    await expect(reintentaOblitXat()).resolves.toBeNull();
    expect(port).not.toHaveBeenCalled();
    expect(web2).not.toHaveBeenCalled();
    expect(efimer.get).not.toHaveBeenCalled();
    expect(efimer.set).not.toHaveBeenCalled();
    expect(efimer.del).not.toHaveBeenCalled();
    expect(oient).not.toHaveBeenCalled();
    desfes();
  });

  test('amb el port simulat buit, ni la bandera encesa fa llançar res (cap paràmetre per defecte el toca)', async () => {
    expect(() => estatOblitXat()).not.toThrow();
    expect(estatOblitXat({ actiu: true, efimer })).toBeNull();
    await expect(oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, efimer })).resolves.toBeNull();
    await expect(reintentaOblitXat({ actiu: true, efimer })).resolves.toBeNull();
    await expect(oblidaXatEnEixir(null)).resolves.toBeNull();
    await expect(reintentaOblitXat(null)).resolves.toBeNull();
  });
});

describe('eixida amb el motor real (IndexedDB fals estructurat)', () => {
  async function creaPart(jo) {
    const fals = creaIdbFalsEstructurat();
    const magatzem = creaMagatzemXat({ idb: fals, rangs: fals.IDBKeyRange, cripto, ClasseClau: globalThis.CryptoKey, ara: () => T0 });
    await magatzem.desaIdentitat(ci(jo), await creaIdentitat(cripto, { usuari: jo, creatMs: T0 }));
    const impl = Object.fromEntries(CONTRACTE_NUCLI.map((n) => [n, vi.fn()]));
    const d = ambXifratXat(impl, { actiu: true, isSecureContext: true, origen: 'https://socdepoble.org', cripto, indexedDB: fals, magatzem, ara: () => T0 });
    const servei = serveiXifratXat(d);
    servei.fixaAmbit(ambit(jo), ci(jo));
    return { d, magatzem, servei, port: () => d };
  }

  test('la interfície ja ha buidat l’àmbit: amb la CI de qui ix s’esborra IndexedDB i les claus sdp_xat_ de les dues capes', async () => {
    const p = await creaPart(A);
    p.servei.oblidaClausXat();
    const oient = vi.fn();
    const desfes = escoltaOblitXat(oient);
    const estat = await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: p.port, magatzemWeb, efimer });
    desfes();
    expect(estat).toMatchObject({ estat: 'oblidat', pendents: [] });
    expect(await p.magatzem.identitat(ci(A))).toBeFalsy();
    expect([...web.sessio.dades.keys()]).toEqual(['altra']);
    expect([...web.preferencies.dades.keys()]).toEqual(['tema']);
    expect(efimer.set).not.toHaveBeenCalled();
    expect(efimer.dades.has(CLAU_OBLITS_PENDENTS)).toBe(false);
    expect(oient).toHaveBeenCalledTimes(1);
    expect(estatOblitXat({ actiu: true, port: p.port, efimer })).toBe(estat);
  });

  test('una capa web que no es pot obrir queda pendent (OBLIT_FALLIT), però IndexedDB s’esborra igualment', async () => {
    const p = await creaPart(A);
    const estat = await oblidaXatEnEixir({
      actiu: true, config: CONFIG, usuariId: A, port: p.port, efimer,
      magatzemWeb: (capa) => { if (capa === 'sessio') throw new Error('capa bloquejada'); return web[capa]; }
    });
    expect(estat).toMatchObject({ estat: 'OBLIT_FALLIT', pendents: ['sessio'] });
    expect(await p.magatzem.identitat(ci(A))).toBeFalsy();
    expect(web.preferencies.dades.has('sdp_xat_recordatori')).toBe(false);
    expect(efimer.dades.get(CLAU_OBLITS_PENDENTS)).toEqual([{ ci: ci(A), mantenSessio: false, pendents: ['sessio'], quanMs: T0 }]);
  });
});

describe('estat, marca i reintent', () => {
  test('les opcions que arriben al servei: CI explícita, mantenSessio fals per defecte a la web i les dues capes', async () => {
    const s = creaServeiSimulat();
    await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: s.port, magatzemWeb, efimer });
    expect(s.motorRef.oblidaTot).toHaveBeenCalledTimes(1);
    expect(s.motorRef.oblidaTot.mock.calls[0][0]).toEqual({ clauIdentitat: ci(A), mantenSessio: false, sessio: web.sessio, preferencies: web.preferencies });
    await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, mantenSessio: true, port: s.port, magatzemWeb, efimer });
    expect(s.motorRef.oblidaTot.mock.calls[1][0].mantenSessio).toBe(true);
    await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, mantenSessio: 'sí', port: s.port, magatzemWeb, efimer });
    expect(s.motorRef.oblidaTot.mock.calls[2][0].mantenSessio).toBe(false);
  });

  test('sense usuari al context, la CI és la de l’àmbit encara fixat; sense cap CI, només RAM i capes web', async () => {
    const s = creaServeiSimulat();
    s.servei.fixaAmbit(ambit(B), ci(B));
    await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: null, port: s.port, magatzemWeb, efimer });
    expect(s.motorRef.oblidaTot.mock.calls[0][0].clauIdentitat).toBe(ci(B));
    s.servei.oblidaClausXat();
    await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: 'no-es-uuid', port: s.port, magatzemWeb, efimer });
    expect(s.motorRef.oblidaTot.mock.calls[1][0].clauIdentitat).toBeNull();
  });

  test('OBLIT_FALLIT: marca amb la CI, avisa, instantània estable; el reintent usa la mateixa CI i mantenSessio i en reeixir esborra la marca', async () => {
    const error = Object.assign(new Error('El navegador ha bloquejat l’esborrat.'), { codi: 'OBLIT_FALLIT' });
    const s = creaServeiSimulat([{ estat: 'OBLIT_FALLIT', pendents: ['indexeddb'], causes: [error], quanMs: T0 + 5 }]);
    const oient = vi.fn();
    const desfes = escoltaOblitXat(oient);
    const estat = await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: s.port, magatzemWeb, efimer, ara: () => T0 });
    expect(estat).toMatchObject({ estat: 'OBLIT_FALLIT', pendents: ['indexeddb'] });
    expect(estat.causes[0]).toBe(error);
    expect(oient).toHaveBeenCalledTimes(1);
    expect(efimer.dades.get(CLAU_OBLITS_PENDENTS)).toEqual([{ ci: ci(A), mantenSessio: false, pendents: ['indexeddb'], quanMs: T0 + 5 }]);
    const instantania = estatOblitXat({ actiu: true, port: s.port, efimer });
    expect(instantania).toEqual({ estat: 'OBLIT_FALLIT', pendents: ['indexeddb'], quanMs: T0 + 5, persones: 1, recuperat: false });
    expect(Object.isFrozen(instantania)).toBe(true);
    expect(estatOblitXat({ actiu: true, port: s.port, efimer })).toBe(instantania);

    const despres = await reintentaOblitXat({ actiu: true, port: s.port, magatzemWeb, efimer });
    expect(s.motorRef.oblidaTot).toHaveBeenCalledTimes(2);
    expect(s.motorRef.oblidaTot.mock.calls[1][0]).toEqual({ clauIdentitat: ci(A), mantenSessio: false, sessio: web.sessio, preferencies: web.preferencies });
    expect(despres).toMatchObject({ estat: 'oblidat' });
    expect(despres).toBe(s.servei.estatOblit());
    expect(efimer.dades.has(CLAU_OBLITS_PENDENTS)).toBe(false);
    expect(estatOblitXat({ actiu: true, port: s.port, efimer })).toBe(despres);
    expect(oient).toHaveBeenCalledTimes(2);
    desfes();
  });

  test('després d’una recàrrega la marca torna l’avís (recuperat) i el reintent conserva mantenSessio', async () => {
    efimer = creaEfimer({ [CLAU_OBLITS_PENDENTS]: [{ ci: ci(B), mantenSessio: true, pendents: ['indexeddb', 'sessio'], quanMs: T0 }] });
    const s = creaServeiSimulat();
    expect(estatOblitXat({ actiu: true, port: s.port, efimer })).toEqual({ estat: 'OBLIT_FALLIT', pendents: ['indexeddb', 'sessio'], quanMs: T0, persones: 1, recuperat: true });
    const despres = await reintentaOblitXat({ actiu: true, port: s.port, magatzemWeb, efimer });
    expect(s.motorRef.oblidaTot.mock.calls[0][0]).toMatchObject({ clauIdentitat: ci(B), mantenSessio: true });
    expect(despres).toMatchObject({ estat: 'oblidat' });
    expect(efimer.dades.has(CLAU_OBLITS_PENDENTS)).toBe(false);
  });

  test('una marca malmesa s’esborra; de la que és a mitges es conserven les entrades vàlides', () => {
    const s = creaServeiSimulat();
    for (const brossa of ['brossa', { ci: ci(A) }, [{ ci: 'no-es-ci', mantenSessio: false, pendents: ['indexeddb'], quanMs: 1 }], [{ ci: ci(A), mantenSessio: 'no', pendents: ['indexeddb'], quanMs: 1 }], [{ ci: ci(A), mantenSessio: false, pendents: ['inventat'], quanMs: 1 }], [{ ci: ci(A), mantenSessio: false, pendents: [], quanMs: 1 }], [{ ci: ci(A), mantenSessio: false, pendents: ['sessio'], quanMs: -1 }]]) {
      _reiniciaOblitXat();
      efimer = creaEfimer({ [CLAU_OBLITS_PENDENTS]: brossa });
      expect(estatOblitXat({ actiu: true, port: s.port, efimer }), JSON.stringify(brossa)).toBeNull();
      expect(efimer.dades.has(CLAU_OBLITS_PENDENTS)).toBe(false);
    }
    _reiniciaOblitXat();
    const valida = { ci: ci(A), mantenSessio: false, pendents: ['preferencies'], quanMs: 7 };
    efimer = creaEfimer({ [CLAU_OBLITS_PENDENTS]: [valida, { ci: 'x' }] });
    expect(estatOblitXat({ actiu: true, port: s.port, efimer })).toMatchObject({ persones: 1, pendents: ['preferencies'], recuperat: true });
    expect(efimer.dades.get(CLAU_OBLITS_PENDENTS)).toEqual([valida]);
  });

  test('un servei que rebutja dona un OBLIT_FALLIT sintètic desat al servei, i la funció no rebutja', async () => {
    const error = new Error('fallada inesperada');
    const s = creaServeiSimulat([error]);
    const estat = await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: s.port, magatzemWeb, efimer, ara: () => T0 + 9 });
    expect(estat).toMatchObject({ estat: 'OBLIT_FALLIT', pendents: ['desconegut'], quanMs: T0 + 9 });
    expect(estat.causes[0]).toBe(error);
    expect(s.servei.estatOblit()).toBe(estat);
    expect(efimer.dades.get(CLAU_OBLITS_PENDENTS)).toEqual([{ ci: ci(A), mantenSessio: false, pendents: ['desconegut'], quanMs: T0 + 9 }]);
  });

  test('un port sense servei torna null sense tocar l’efímer', async () => {
    await expect(oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: () => ({}), magatzemWeb, efimer })).resolves.toBeNull();
    await expect(oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: () => { throw new Error('port trencat'); }, magatzemWeb, efimer })).resolves.toBeNull();
    expect(efimer.set).not.toHaveBeenCalled();
    expect(efimer.del).not.toHaveBeenCalled();
  });

  test(`com a molt ${MAX_OBLITS_PENDENTS} persones pendents: fora la més antiga`, async () => {
    const persones = Array.from({ length: MAX_OBLITS_PENDENTS + 1 }, (_, i) => `${String(i + 1).padStart(8, '0')}-0000-4000-8000-000000000000`);
    const s = creaServeiSimulat(persones.map((_, i) => ({ estat: 'OBLIT_FALLIT', pendents: ['indexeddb'], quanMs: T0 + i })));
    for (const u of persones) await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: u, port: s.port, magatzemWeb, efimer });
    const marca = efimer.dades.get(CLAU_OBLITS_PENDENTS);
    expect(marca).toHaveLength(MAX_OBLITS_PENDENTS);
    expect(marca.map((e) => e.ci)).toEqual(persones.slice(1).map(ci));
    expect(estatOblitXat({ actiu: true, port: s.port, efimer })).toMatchObject({ persones: MAX_OBLITS_PENDENTS, quanMs: T0 + MAX_OBLITS_PENDENTS });
  });

  test('el reintent no toca res mentre hi ha una persona dins (àmbit fixat) i dos clics no fan dos oblits', async () => {
    const s = creaServeiSimulat([{ estat: 'OBLIT_FALLIT', pendents: ['indexeddb'] }]);
    await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: s.port, magatzemWeb, efimer });
    s.servei.fixaAmbit(ambit(B), ci(B));
    await expect(reintentaOblitXat({ actiu: true, port: s.port, magatzemWeb, efimer })).resolves.toMatchObject({ estat: 'OBLIT_FALLIT', persones: 1 });
    expect(s.motorRef.oblidaTot).toHaveBeenCalledTimes(1);
    s.servei.oblidaClausXat();
    const u = reintentaOblitXat({ actiu: true, port: s.port, magatzemWeb, efimer });
    const v = reintentaOblitXat({ actiu: true, port: s.port, magatzemWeb, efimer });
    expect(v).toBe(u);
    await expect(u).resolves.toMatchObject({ estat: 'oblidat' });
    expect(s.motorRef.oblidaTot).toHaveBeenCalledTimes(2);
  });

  test('un reintent que torna a fallar conserva la marca; sense pendents torna l’estat de sempre', async () => {
    const s = creaServeiSimulat([{ estat: 'OBLIT_FALLIT', pendents: ['indexeddb'] }, { estat: 'OBLIT_FALLIT', pendents: ['indexeddb', 'preferencies'], quanMs: T0 + 1 }]);
    await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: s.port, magatzemWeb, efimer });
    await expect(reintentaOblitXat({ actiu: true, port: s.port, magatzemWeb, efimer })).resolves.toMatchObject({ estat: 'OBLIT_FALLIT', pendents: ['indexeddb', 'preferencies'], quanMs: T0 + 1, recuperat: false });
    expect(efimer.dades.get(CLAU_OBLITS_PENDENTS)).toHaveLength(1);
    const t = creaServeiSimulat();
    _reiniciaOblitXat();
    const net = creaEfimer();
    await expect(reintentaOblitXat({ actiu: true, port: t.port, magatzemWeb, efimer: net })).resolves.toBeNull();
    expect(t.motorRef.oblidaTot).not.toHaveBeenCalled();
  });

  test('una fallada sense CI (només capes web) es reintenta sense CI; mai amb una d’IndexedDB desconeguda', async () => {
    const s = creaServeiSimulat([{ estat: 'OBLIT_FALLIT', pendents: ['sessio'] }]);
    await oblidaXatEnEixir({ actiu: true, config: { ...CONFIG, dataMode: 'local' }, usuariId: A, port: s.port, magatzemWeb, efimer });
    expect(efimer.set).not.toHaveBeenCalled();
    expect(estatOblitXat({ actiu: true, port: s.port, efimer })).toMatchObject({ estat: 'OBLIT_FALLIT', pendents: ['sessio'] });
    await expect(reintentaOblitXat({ actiu: true, port: s.port, magatzemWeb, efimer })).resolves.toMatchObject({ estat: 'oblidat' });
    expect(s.motorRef.oblidaTot.mock.calls[1][0]).toMatchObject({ clauIdentitat: null, mantenSessio: false });

    const t = creaServeiSimulat();
    t.servei.desaEstatOblit(Object.freeze({ estat: 'OBLIT_FALLIT', pendents: Object.freeze(['indexeddb']), causes: Object.freeze([]), quanMs: T0 }));
    _reiniciaOblitXat();
    await reintentaOblitXat({ actiu: true, port: t.port, magatzemWeb, efimer: creaEfimer() });
    expect(t.motorRef.oblidaTot).not.toHaveBeenCalled();
  });

  test('un oient que llança no atura els altres; escoltaOblitXat desfà la subscripció', async () => {
    const s = creaServeiSimulat();
    const trencat = vi.fn(() => { throw new Error('oient trencat'); });
    const bo = vi.fn();
    const desfes1 = escoltaOblitXat(trencat);
    const desfes2 = escoltaOblitXat(bo);
    expect(escoltaOblitXat('no és una funció')).toBeTypeOf('function');
    await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: s.port, magatzemWeb, efimer });
    expect(bo).toHaveBeenCalledTimes(1);
    desfes1();
    desfes2();
    await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: s.port, magatzemWeb, efimer });
    expect(bo).toHaveBeenCalledTimes(1);
  });
});

describe('la capa efímera real (sense injectar)', () => {
  test('sense la capa (node) el registre viu en memòria; perdut el registre, el servei continua dient OBLIT_FALLIT', async () => {
    const s = creaServeiSimulat([{ estat: 'OBLIT_FALLIT', pendents: ['indexeddb'] }]);
    await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: s.port, magatzemWeb });
    expect(estatOblitXat({ actiu: true, port: s.port })).toMatchObject({ estat: 'OBLIT_FALLIT', persones: 1 });
    _reiniciaOblitXat({ conservaMarca: true });
    expect(estatOblitXat({ actiu: true, port: s.port })).toBe(s.servei.estatOblit());
    expect(s.servei.estatOblit()).toMatchObject({ estat: 'OBLIT_FALLIT', pendents: ['indexeddb'] });
  });
});

describe('paritat i text', () => {
  test('ESTAT_OBLIT_XAT és ESTAT_OBLIT del pipeline', () => {
    expect(ESTAT_OBLIT_XAT).toEqual(ESTAT_OBLIT);
    expect(Object.isFrozen(ESTAT_OBLIT_XAT)).toBe(true);
    expect(`sdp_embed_${CLAU_OBLITS_PENDENTS}`.startsWith('sdp_xat_')).toBe(false);
  });

  test('la font no nomena les capes web, no escriu a la consola ni té paràmetres per defecte amb enllaços importats', () => {
    const font = readFileSync(new URL('./xifratXatEixida.js', import.meta.url), 'utf8');
    expect(font).not.toMatch(new RegExp(['local', 'Storage|session', 'Storage'].join('')));
    const codi = font.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(codi).not.toMatch(/\bconsole\./);
    const importats = [...font.matchAll(/^import\s*\{([^}]*)\}/gm)].flatMap((m) => m[1].split(',').map((n) => n.trim()).filter(Boolean));
    expect(importats.length).toBeGreaterThanOrEqual(8);
    for (const nom of importats) expect(font, nom).not.toMatch(new RegExp(`=\\s*${nom}\\b(?!\\s*[(.])`));
    expect(font).not.toMatch(/from\s+'\.\.\/sections\//);
  });
});
