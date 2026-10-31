// @vitest-environment node
/* Gauntlet Loop c1 (261029, troballa «oblit-xat-idb-lent-sessio-nova») · Un
   oblit d'eixida que arriba tard (la cua d'autodesament o l'IndexedDB del xat
   van lents) quan una altra persona ja és dins i XatContext li ha fixat
   l'àmbit. Abans buidava la RAM d'ella (textos, blob: revocats), li tancava la
   connexió del magatzem i, sense CI de context, prenia la CI d'ella com si fora
   la de qui ix (i li esborrava IndexedDB). Ara: de qui ix, només IndexedDB per
   la seua CI explícita; l'àmbit, la RAM i la connexió de qui és dins, intactes.
   La mateixa persona amb una CI d'una altra config s'oblida sencera, com sempre
   (cap resta de RAM en un ordinador compartit). Servei i motor reals; el
   magatzem de claus, simulat; el port, explícit (backendPort.js simulat buit). */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { _reiniciaOblitXat, oblidaXatEnEixir } from './xifratXatEixida.js';
import { creaServeiAmbitXat } from './xifratXat.js';
import { creaMotorXifrat } from './xifratXatPipeline.js';
import { registraServeiXifratXat } from './xifratXatServei.js';
import { clauIdentitat } from './xifratXatMagatzem.js';

vi.mock('./backendPort.js', () => ({}));

const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const B = 'bbbbbbbb-2222-4222-8222-222222222222';
const ENDPOINT = 'https://backend.example.test';
const CONFIG = Object.freeze({ backendId: 'supabase', supabaseUrl: ENDPOINT, dataMode: 'remote', tenantId: null });
const ci = (u, endpoint = ENDPOINT) => clauIdentitat({ backendId: 'supabase', endpoint, joId: u });
const ambit = (u) => JSON.stringify(['backend-sintetic', u, `persona::${u}`]);
const URL_B = 'blob:http://localhost:3340/b-foto';

function creaMagatzemWeb(inicial = {}) {
  const dades = new Map(Object.entries(inicial));
  return { dades, get length() { return dades.size; }, key: (i) => [...dades.keys()][i] ?? null, removeItem: (k) => { dades.delete(k); } };
}
function creaEfimer() {
  const dades = new Map();
  return { dades, get: (k) => dades.get(k) ?? null, set: (k, v) => { dades.set(k, v); return true; }, del: (k) => { dades.delete(k); return true; } };
}

/* Servei d'àmbit real, motor real (o cap, amb `senseMotor`) i un magatzem de claus simulat. */
function creaPart({ senseMotor = false, oblidaEnTancar = async () => 1 } = {}) {
  const revocades = [];
  const motorRef = {};
  const servei = creaServeiAmbitXat({ revocaUrl: (u) => revocades.push(u), motorRef });
  const magatzem = { identitat: async () => null, oblidaEnTancar: vi.fn(oblidaEnTancar), tanca: vi.fn() };
  const impl = {};
  if (!senseMotor) {
    const motor = creaMotorXifrat({ cripto: globalThis.crypto, impl, servei, magatzem });
    motorRef.oblidaTot = motor.oblidaTot;
  }
  registraServeiXifratXat(impl, servei);
  return { servei, magatzem, revocades, port: () => impl };
}

/* La persona entra: àmbit fixat, una foto pintada (blob:) i un text desxifrat en RAM. */
function entra(servei, u, ciDe = ci(u)) {
  servei.fixaAmbit(ambit(u), ciDe);
  servei.desaUrlAdjunt(`adj:${u}`, `${URL_B}-${u}`, 1000);
  servei.desaTextDesxifrat('fil1', 'm1', `hola ${u}`);
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

describe('l’oblit tardà de qui ix no toca la sessió de qui ja és dins', () => {
  test('B és dins: de A només s’esborra IndexedDB per la seua CI; la RAM, l’àmbit i la connexió de B queden intactes', async () => {
    const p = creaPart();
    entra(p.servei, B);
    const estat = await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, mantenSessio: false, port: p.port, magatzemWeb, efimer });
    expect(estat).toMatchObject({ estat: 'oblidat', pendents: [] });
    expect(p.magatzem.oblidaEnTancar.mock.calls).toEqual([[ci(A), { mantenSessio: false }]]);
    expect(p.magatzem.tanca).not.toHaveBeenCalled();
    const despres = p.servei.estatAmbit();
    expect(despres.clauIdentitat).toBe(ci(B));
    expect(despres.ambitEstable).toBe(ambit(B));
    expect(despres.midaBlobs).toBe(1);
    expect(p.servei.textDesxifrat('fil1', 'm1')).toBe(`hola ${B}`);
    expect(p.revocades).toEqual([]);
    // Les claus sdp_xat_ de les capes web no porten la persona: se n'van (D-09, cap èxit fals).
    expect([...web.sessio.dades.keys()]).toEqual(['altra']);
    expect([...web.preferencies.dades.keys()]).toEqual(['tema']);
  });

  test('sense CI de context per a A, no pren mai la de B: cap esborrat d’IndexedDB i la RAM de B intacta', async () => {
    const p = creaPart();
    entra(p.servei, B);
    await oblidaXatEnEixir({ actiu: true, config: { dataMode: 'local' }, usuariId: A, mantenSessio: false, port: p.port, magatzemWeb, efimer });
    expect(p.magatzem.oblidaEnTancar).not.toHaveBeenCalled();
    expect(p.magatzem.tanca).not.toHaveBeenCalled();
    expect(p.servei.estatAmbit().clauIdentitat).toBe(ci(B));
    expect(p.servei.textDesxifrat('fil1', 'm1')).toBe(`hola ${B}`);
  });

  test('sense motor (només RAM), l’oblit de A tampoc buida la RAM de B', async () => {
    const p = creaPart({ senseMotor: true });
    entra(p.servei, B);
    const estat = await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, port: p.port, magatzemWeb, efimer });
    expect(estat).toMatchObject({ estat: 'oblidat', nomesRam: true });
    expect(p.servei.estatAmbit().clauIdentitat).toBe(ci(B));
    expect(p.servei.textDesxifrat('fil1', 'm1')).toBe(`hola ${B}`);
    expect(p.revocades).toEqual([]);
  });

  test('B entra mentre s’esborra IndexedDB de A: la connexió que B ja usa no es tanca', async () => {
    let allibera;
    const p = creaPart({ oblidaEnTancar: () => new Promise((resol) => { allibera = resol; }) });
    entra(p.servei, A);
    const enVol = oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, mantenSessio: false, port: p.port, magatzemWeb, efimer });
    // L'àmbit de A ja és buit (oblidaClausXat abans d'esperar l'IndexedDB) i la seua RAM, fora.
    expect(p.servei.estatAmbit().clauIdentitat).toBeNull();
    expect(p.revocades).toEqual([`${URL_B}-${A}`]);
    await vi.waitFor(() => expect(typeof allibera).toBe('function'));
    entra(p.servei, B);
    allibera(1);
    expect(await enVol).toMatchObject({ estat: 'oblidat' });
    expect(p.magatzem.oblidaEnTancar.mock.calls).toEqual([[ci(A), { mantenSessio: false }]]);
    expect(p.magatzem.tanca).not.toHaveBeenCalled();
    expect(p.servei.textDesxifrat('fil1', 'm1')).toBe(`hola ${B}`);
  });
});

describe('qui ix amb el seu àmbit encara fixat s’oblida sencer, com sempre', () => {
  test('la mateixa persona amb una CI d’una altra config (o el joId en majúscules): RAM buida, IndexedDB i connexió tancada', async () => {
    for (const usuariId of [A, A.toUpperCase()]) {
      _reiniciaOblitXat();
      const p = creaPart();
      entra(p.servei, A, ci(A, 'https://altre.example.test'));
      const estat = await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId, mantenSessio: false, port: p.port, magatzemWeb, efimer });
      expect(estat, usuariId).toMatchObject({ estat: 'oblidat' });
      expect(p.servei.estatAmbit().clauIdentitat).toBeNull();
      expect(p.servei.textDesxifrat('fil1', 'm1')).toBeNull();
      expect(p.revocades).toEqual([`${URL_B}-${A}`]);
      expect(p.magatzem.tanca).toHaveBeenCalledTimes(1);
    }
  });

  test('l’àmbit fixat és de qui ix: tot com abans (RAM, IndexedDB per la seua CI i connexió tancada)', async () => {
    const p = creaPart();
    entra(p.servei, A);
    await oblidaXatEnEixir({ actiu: true, config: CONFIG, usuariId: A, mantenSessio: false, port: p.port, magatzemWeb, efimer });
    expect(p.servei.estatAmbit().clauIdentitat).toBeNull();
    expect(p.servei.textDesxifrat('fil1', 'm1')).toBeNull();
    expect(p.magatzem.oblidaEnTancar.mock.calls).toEqual([[ci(A), { mantenSessio: false }]]);
    expect(p.magatzem.tanca).toHaveBeenCalledTimes(1);
  });
});
