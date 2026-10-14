import { webcrypto } from 'node:crypto';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { base64url, concatena, desdeBase64url, sha256, utf8 } from './nucli/canonic.js';
import { exigeixAprovacio, preparaRegistre, signaAmbWebAuthn } from './nucli/aprovacio.js';
import { crearMagatzem, crearMagatzemMemoria } from './nucli/magatzem.js';
import { catalegTractors, empremtaDe } from './registreTractors.js';
import {
  APROVABLES_EN_BLOC, aprovaEnBloc, contextAprovacio, entornDe, esAprovableEnBloc, estatDelTractor, magatzemTractors,
  suportaWebAuthn, useTractors
} from './useTractors.js';

afterEach(cleanup);

const subtle = webcrypto.subtle;
const RP_ID = 'app.example.org';
const ORIGEN = 'https://app.example.org';
const DIA = 86400000;
const T0 = Date.UTC(2026, 9, 2, 8);

function manifest(canvis = {}) {
  return {
    schema: 'sdp.tractor.v1',
    id: 'prova.lector',
    nom: 'Lector de prova',
    versio: '1.0.0',
    descripcio: 'Llig una carpeta de prova.',
    fitxa: 'src/sections/gestoria/fitxes/prova.md',
    fonts: ['src/sections/gestoria/nucli/lector.js'],
    llig: ['La carpeta que tries'],
    escriu: ['Res'],
    xarxa: 'cap',
    dadesPersonals: false,
    nivellMinim: 'confirmacio',
    caducitatDies: 90,
    ...canvis
  };
}

const GLOB = {
  '../gestoria/fitxes/prova.md': '# Lector de prova\n\nQuè fa.\n',
  '../gestoria/nucli/lector.js': 'export const lector = 1;\n'
};
const MANIFESTS = [
  manifest(),
  manifest({ id: 'prova.signat', nom: 'Signat de prova', nivellMinim: 'signatura' }),
  manifest({ id: 'prova.incomplet', nom: 'Incomplet de prova', fonts: ['src/sections/gestoria/nucli/absent.js'] })
];
const CATALEG = catalegTractors(MANIFESTS, GLOB);
const CATALEG_V2 = catalegTractors(MANIFESTS, { ...GLOB, '../gestoria/nucli/lector.js': 'export const lector = 2;\n' });

/* Autenticador simulat (model: nucli/aprovacio.test.js). */
function capcalera(major, n) {
  if (n < 24) return [(major << 5) | n];
  if (n < 0x100) return [(major << 5) | 24, n];
  return [(major << 5) | 25, n >> 8, n & 0xff];
}
function cbor(valor) {
  if (Number.isInteger(valor)) return valor >= 0 ? capcalera(0, valor) : capcalera(1, -1 - valor);
  if (typeof valor === 'string') return [...capcalera(3, utf8(valor).length), ...utf8(valor)];
  if (valor instanceof Uint8Array) return [...capcalera(2, valor.length), ...valor];
  return [...capcalera(5, valor.size), ...[...valor].flatMap(([k, v]) => [...cbor(k), ...cbor(v)])];
}
function crudaADer(crua) {
  const enter = (b) => {
    let i = 0;
    while (i < b.length - 1 && b[i] === 0) i++;
    let v = [...b.subarray(i)];
    if (v[0] & 0x80) v = [0, ...v];
    return [0x02, v.length, ...v];
  };
  const cos = [...enter(crua.subarray(0, 32)), ...enter(crua.subarray(32))];
  return new Uint8Array([0x30, cos.length, ...cos]);
}
async function creaAutenticador() {
  const parell = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const { x, y } = await subtle.exportKey('jwk', parell.publicKey);
  return { parell, jwk: { kty: 'EC', crv: 'P-256', x, y }, id: webcrypto.getRandomValues(new Uint8Array(16)) };
}
const buffer = (bytes) => bytes.slice().buffer;
function credencialsFalses(aut) {
  const crides = { get: 0, create: 0 };
  return {
    crides,
    async get({ publicKey }) {
      crides.get += 1;
      const authenticatorData = concatena(await sha256(publicKey.rpId, subtle), new Uint8Array([0x05, 0, 0, 0, 1]));
      const clientDataJSON = utf8(JSON.stringify({ type: 'webauthn.get', challenge: base64url(publicKey.challenge), origin: ORIGEN, crossOrigin: false }));
      const crua = new Uint8Array(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, aut.parell.privateKey,
        concatena(authenticatorData, await sha256(clientDataJSON, subtle))));
      return { rawId: buffer(aut.id), response: { authenticatorData: buffer(authenticatorData), clientDataJSON: buffer(clientDataJSON), signature: buffer(crudaADer(crua)) } };
    },
    async create({ publicKey }) {
      crides.create += 1;
      const cose = new Map([[1, 2], [3, -7], [-1, 1], [-2, desdeBase64url(aut.jwk.x)], [-3, desdeBase64url(aut.jwk.y)]]);
      const authData = concatena(await sha256(publicKey.rp.id, subtle), new Uint8Array([0x45, 0, 0, 0, 0]), new Uint8Array(16),
        new Uint8Array([0, aut.id.length]), aut.id, new Uint8Array(cbor(cose)));
      const attestationObject = new Uint8Array(cbor(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]])));
      const clientDataJSON = utf8(JSON.stringify({ type: 'webauthn.create', challenge: base64url(publicKey.challenge), origin: ORIGEN }));
      return { rawId: buffer(aut.id), response: { attestationObject: buffer(attestationObject), clientDataJSON: buffer(clientDataJSON) } };
    }
  };
}
class PKCAmbPlataforma {
  static async isUserVerifyingPlatformAuthenticatorAvailable() { return true; }
}
function entornAmb(credentials) {
  return { location: { origin: ORIGEN, hostname: RP_ID }, navigator: { credentials }, PublicKeyCredential: PKCAmbPlataforma };
}
const ENTORN_SENSE = { location: { origin: ORIGEN, hostname: RP_ID }, navigator: {} };

function rellotgeMobil(inici = T0) {
  const r = { ara: inici };
  r.fn = () => r.ara;
  return r;
}

async function munta({ magatzem = crearMagatzemMemoria(), tractors = CATALEG, entorn = ENTORN_SENSE, rellotge = rellotgeMobil() } = {}) {
  const vista = renderHook((props) => useTractors(props), {
    initialProps: { magatzem, subtle, tractors, entorn, rellotge: rellotge.fn }
  });
  await waitFor(() => expect(vista.result.current.carregant).toBe(false));
  const fila = (id) => vista.result.current.tractors.find((t) => t.id === id);
  return { ...vista, magatzem, rellotge, fila };
}

async function errorDe(promesa) {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  throw new Error('S\'esperava un error.');
}

describe('estat inicial', () => {
  test('pendent sense aprovacions, incomplet sense fonts, i l\'empremta curta a punt', async () => {
    const { result, fila } = await munta();
    expect(result.current.error).toBeNull();
    expect(result.current.persistent).toBe(false);
    expect(result.current.tractors.map((t) => [t.id, t.estat])).toEqual([
      ['prova.lector', 'pendent'], ['prova.signat', 'pendent'], ['prova.incomplet', 'incomplet']
    ]);
    const info = await empremtaDe(CATALEG[0], subtle);
    expect(fila('prova.lector')).toMatchObject({ empremta: info.empremta, curta: info.curta, registres: [], registre: null });
    expect(fila('prova.incomplet')).toMatchObject({ empremta: null, fontsAbsents: ['src/sections/gestoria/nucli/absent.js'] });
    expect(fila('prova.incomplet').motiu).toMatch(/Falten/);
    expect(result.current.origen).toBe(ORIGEN);
    expect(result.current.rpId).toBe(RP_ID);
  });

  test('si el magatzem falla, ho diu sense trencar', async () => {
    const trencat = { ...crearMagatzemMemoria(), registres: async () => { throw new Error('IndexedDB tancada'); } };
    const { result } = await munta({ magatzem: trencat });
    expect(result.current.error).toMatch(/IndexedDB tancada/);
  });
});

/* Un indexedDB que existix però no es deixa obrir: open() torna la petició i
   l'error arriba després (Firefox antic en finestra privada). */
function idbQueNoObri() {
  return {
    open() {
      const peticio = { error: new Error('InvalidStateError: finestra privada') };
      setTimeout(() => peticio.onerror?.(), 0);
      return peticio;
    }
  };
}

describe('IndexedDB que no es deixa obrir (governanca-06)', () => {
  test('el panell passa a memòria: persistent false, sense error, i es pot aprovar', async () => {
    const { result, fila } = await munta({ magatzem: crearMagatzem({ idb: idbQueNoObri() }) });
    expect(result.current.error).toBeNull();
    expect(result.current.persistent).toBe(false);
    expect(fila('prova.lector').estat).toBe('pendent');
    const { curta } = fila('prova.lector');
    await act(async () => { await result.current.aprova('prova.lector', { nivell: 'confirmacio', confirmacio: curta }); });
    expect(fila('prova.lector').estat).toBe('aprovat');
  });

  test('magatzemTractors, el de la pàgina, també: el global indexedDB falla tard i treballa en memòria', async () => {
    vi.stubGlobal('indexedDB', idbQueNoObri());
    vi.resetModules();
    try {
      const { magatzemTractors: deLaPagina } = await import('./useTractors.js');
      const magatzem = deLaPagina();
      expect(await magatzem.claus()).toEqual([]);
      expect(await magatzem.registres()).toEqual([]);
      expect(magatzem.persistent).toBe(false);
    } finally {
      vi.unstubAllGlobals();
      vi.resetModules();
    }
  });
});

describe('aprova per confirmació', () => {
  test('la curta escrita aprova i el registre queda al magatzem', async () => {
    const { result, fila, magatzem } = await munta();
    const { curta, empremta } = fila('prova.lector');
    let registre;
    await act(async () => {
      registre = await result.current.aprova('prova.lector', { nivell: 'confirmacio', confirmacio: curta.toLowerCase(), empremta });
    });
    expect(registre).toMatchObject({ tractor: 'prova.lector', decisio: 'aprovat', nivell: 'confirmacio', empremta });
    expect(await magatzem.registres('prova.lector')).toEqual([registre]);
    expect(fila('prova.lector')).toMatchObject({ estat: 'aprovat', registre });
  });

  test.each([
    ['curta equivocada', 'prova.lector', { nivell: 'confirmacio', confirmacio: '0000-0000' }, 'CONFIRMACIO_INCORRECTA'],
    ['sense nivell', 'prova.lector', { confirmacio: 'x' }, 'NIVELL_INSUFICIENT'],
    ['el manifest exigix signatura', 'prova.signat', { nivell: 'confirmacio', confirmacio: 'CURTA' }, 'NIVELL_INSUFICIENT'],
    ['versió incompleta', 'prova.incomplet', { nivell: 'confirmacio', confirmacio: 'x' }, 'EMPREMTA_INCOMPLETA'],
    ['tractor desconegut', 'prova.cap', { nivell: 'confirmacio' }, 'APROVACIO_REQUERIDA'],
    ['la versió ha canviat mentre es llegia', 'prova.lector', { nivell: 'confirmacio', confirmacio: 'CURTA', empremta: `sha256:${'a'.repeat(64)}` }, 'EMPREMTA_DIVERGENT']
  ])('rebutja: %s', async (_nom, id, opcions, codi) => {
    const { result, fila, magatzem } = await munta();
    const curta = fila('prova.signat').curta;
    const dades = { ...opcions, confirmacio: opcions.confirmacio === 'CURTA' ? curta : opcions.confirmacio };
    const error = await errorDe(result.current.aprova(id, dades));
    expect(error.codi).toBe(codi);
    expect(await magatzem.registres()).toEqual([]);
  });
});

describe('aprova amb signatura (WebAuthn simulat)', () => {
  test('registra la clau la primera vegada, la reutilitza després i l\'estat és aprovat', async () => {
    const credentials = credencialsFalses(await creaAutenticador());
    const { result, fila, magatzem } = await munta({ entorn: entornAmb(credentials) });
    await waitFor(() => expect(result.current.webauthn).toBe(true));
    await act(async () => { await result.current.aprova('prova.signat', { nivell: 'signatura' }); });
    expect(credentials.crides).toEqual({ get: 1, create: 1 });
    expect(await magatzem.claus()).toEqual([expect.objectContaining({ etiqueta: expect.any(String), creat: new Date(T0).toISOString() })]);
    expect(fila('prova.signat')).toMatchObject({ estat: 'aprovat', registre: { nivell: 'signatura', prova: { tipus: 'webauthn' } } });

    await act(async () => { await result.current.aprova('prova.lector', { nivell: 'signatura' }); });
    expect(credentials.crides).toEqual({ get: 2, create: 1 });
    expect(fila('prova.lector').estat).toBe('aprovat');
  });

  test('sense WebAuthn al navegador, SIGNATURA_INVALIDA i res desat', async () => {
    const { result, magatzem } = await munta();
    expect(result.current.webauthn).toBe(false);
    expect((await errorDe(result.current.aprova('prova.signat', { nivell: 'signatura' }))).codi).toBe('SIGNATURA_INVALIDA');
    expect(await magatzem.registres()).toEqual([]);
  });

  test('una signatura que no verifica amb les claus desades no es pinta com a aprovada', async () => {
    const autA = await creaAutenticador();
    const autB = await creaAutenticador();
    const magatzem = crearMagatzemMemoria();
    const { empremta } = await empremtaDe(CATALEG[1], subtle);
    const registre = await signaAmbWebAuthn({
      registre: preparaRegistre({ manifest: CATALEG[1].manifest, empremta, decisio: 'aprovat', nivell: 'signatura', ara: T0 }),
      credencial: base64url(autA.id), credentials: credencialsFalses(autA), rpId: RP_ID, subtle
    });
    await magatzem.afegixRegistre(registre);
    await magatzem.afegixClau({ credencial: base64url(autA.id), jwk: autB.jwk, creat: new Date(T0).toISOString(), etiqueta: 'Altra' });
    const { fila } = await munta({ magatzem, rellotge: rellotgeMobil(T0 + 1000) });
    expect(fila('prova.signat').estat).toBe('pendent');
    expect(fila('prova.signat').motiu).toMatch(/verificació/);
  });
});

describe('estats que caduquen, canvien o es revoquen', () => {
  test('caducat passats els dies del manifest', async () => {
    const rellotge = rellotgeMobil();
    const { result, fila } = await munta({ rellotge });
    const { curta } = fila('prova.lector');
    await act(async () => { await result.current.aprova('prova.lector', { nivell: 'confirmacio', confirmacio: curta }); });
    rellotge.ara = T0 + 90 * DIA;
    await act(async () => { await result.current.recarrega(); });
    expect(fila('prova.lector').estat).toBe('caducat');
  });

  test('una font canviada torna «empremta-divergent» amb el mateix magatzem', async () => {
    const primer = await munta();
    const { curta } = primer.fila('prova.lector');
    await act(async () => { await primer.result.current.aprova('prova.lector', { nivell: 'confirmacio', confirmacio: curta }); });
    const segon = await munta({ magatzem: primer.magatzem, tractors: CATALEG_V2 });
    expect(segon.fila('prova.lector').estat).toBe('empremta-divergent');
    expect(segon.fila('prova.lector').curta).not.toBe(curta);
  });

  test('revoca deixa l\'estat «revocat»; sense aprovació no hi ha res a revocar', async () => {
    const { result, fila } = await munta();
    expect((await errorDe(result.current.revoca('prova.lector'))).codi).toBe('APROVACIO_REQUERIDA');
    const { curta, empremta } = fila('prova.lector');
    await act(async () => { await result.current.aprova('prova.lector', { nivell: 'confirmacio', confirmacio: curta }); });
    let revocacio;
    await act(async () => { revocacio = await result.current.revoca('prova.lector'); });
    expect(revocacio).toMatchObject({ decisio: 'revocat', empremta, caduca: null });
    expect(fila('prova.lector').estat).toBe('revocat');
    expect(fila('prova.lector').registres.map((r) => r.decisio)).toEqual(['aprovat', 'revocat']);
    expect((await errorDe(result.current.revoca('prova.lector'))).codi).toBe('APROVACIO_REQUERIDA');
  });

  /* seguretat-03: aprovada amb el rellotge 8 minuts avançat i revocada quan
     ja l'han corregit (NTP). La revocació ha d'anar darrere de l'aprovació,
     o en passar l'hora de l'aprovació tornaria a valdre sense cap signatura. */
  test('una revocació amb el rellotge tornat arrere va darrere de l’aprovació i no es perd', async () => {
    const rellotge = rellotgeMobil(T0 + 10 * 60000);
    const { result, fila } = await munta({ rellotge });
    const { curta } = fila('prova.lector');
    let aprovacio;
    await act(async () => {
      aprovacio = await result.current.aprova('prova.lector', { nivell: 'confirmacio', confirmacio: curta });
    });
    rellotge.ara = T0 + 2 * 60000;
    let revocacio;
    await act(async () => { revocacio = await result.current.revoca('prova.lector'); });
    // Mai abans de l'aprovació; en empat, la revocació va darrere (ordenaRegistres) i guanya.
    expect(revocacio.data).toBe(aprovacio.data);
    expect(fila('prova.lector').registres.map((r) => r.decisio)).toEqual(['aprovat', 'revocat']);
    // Mentre no arriba l'hora, pendent (data futura); després, revocat. Mai aprovat.
    expect(fila('prova.lector').estat).toBe('pendent');
    rellotge.ara = T0 + 11 * 60000;
    await act(async () => { await result.current.recarrega(); });
    expect(fila('prova.lector').estat).toBe('revocat');
  });

  test('amb el rellotge en ordre, la revocació porta l’hora d’ara', async () => {
    const rellotge = rellotgeMobil();
    const { result, fila } = await munta({ rellotge });
    const { curta } = fila('prova.lector');
    await act(async () => { await result.current.aprova('prova.lector', { nivell: 'confirmacio', confirmacio: curta }); });
    rellotge.ara = T0 + DIA;
    let revocacio;
    await act(async () => { revocacio = await result.current.revoca('prova.lector'); });
    expect(revocacio.data).toBe(new Date(T0 + DIA).toISOString());
  });

  test('un tractor incomplet amb una aprovació vella es pot revocar', async () => {
    const magatzem = crearMagatzemMemoria();
    const { empremta } = await empremtaDe(CATALEG[0], subtle);
    await magatzem.afegixRegistre(preparaRegistre({
      manifest: CATALEG[2].manifest, empremta, decisio: 'aprovat', nivell: 'confirmacio', ara: T0 - DIA
    }));
    const { result, fila } = await munta({ magatzem });
    expect(fila('prova.incomplet')).toMatchObject({ estat: 'incomplet', registre: { decisio: 'aprovat' } });
    await act(async () => { await result.current.revoca('prova.incomplet'); });
    expect(fila('prova.incomplet').registre.decisio).toBe('revocat');
  });
});

/* Ordre del Mestre, 13-10-2026 (pla 261013_1930, front 2) · L'aprovació en
   bloc, només al servidor de desenvolupament, pel mateix camí que la via
   individual (aprova). vitest corre amb DEV cert. */
describe('aprovaTotsPendents (només DEV)', () => {
  afterEach(() => vi.unstubAllEnvs());

  const aprovaTots = async (result) => {
    let resultat;
    await act(async () => { resultat = await result.current.aprovaTotsPendents(); });
    return resultat;
  };
  const ids = (llista) => llista.map(({ id }) => id);

  test('aprovaEnBloc, pura: només pendent, empremta-divergent i caducat, amb empremta, en sèrie i amb el nivell mínim', async () => {
    expect(APROVABLES_EN_BLOC).toEqual(['pendent', 'empremta-divergent', 'caducat']);
    const empremta = `sha256:${'a'.repeat(64)}`;
    const files = ['pendent', 'aprovat', 'caducat', 'revocat', 'empremta-divergent', 'incomplet', 'error']
      .map((estat) => ({
        id: `t.${estat}`, estat, curta: 'AAAA-AAAA', manifest: { nivellMinim: 'confirmacio' },
        empremta: ['incomplet', 'error'].includes(estat) ? null : empremta
      }));
    files.push({ id: 't.sense-empremta', estat: 'pendent', empremta: null, manifest: { nivellMinim: 'confirmacio' } });
    expect(files.filter(esAprovableEnBloc).map((f) => f.estat)).toEqual(['pendent', 'caducat', 'empremta-divergent']);
    const crides = [];
    let alhora = 0;
    const resultat = await aprovaEnBloc(files, {
      aprova: async (id, opcions) => {
        alhora += 1;
        crides.push([id, opcions, alhora]);
        await new Promise((resol) => setTimeout(resol, 0));
        alhora -= 1;
        return { tractor: id };
      }
    });
    expect(crides).toEqual(['t.pendent', 't.caducat', 't.empremta-divergent']
      .map((id) => [id, { nivell: 'confirmacio', confirmacio: 'AAAA-AAAA', empremta }, 1]));
    expect(resultat).toEqual({
      aprovats: ['t.pendent', 't.caducat', 't.empremta-divergent'].map((id) => ({ id, registre: { tractor: id } })),
      fallits: [],
      omesos: []
    });
    expect(await aprovaEnBloc(undefined, { aprova: () => { throw new Error('no'); } })).toEqual({ aprovats: [], fallits: [], omesos: [] });
  });

  test('sense WebAuthn: aprova el de confirmació amb la curta, ometa el de signatura (SENSE_WEBAUTHN) i no toca l’incomplet', async () => {
    const { result, fila, magatzem } = await munta();
    expect(result.current.webauthn).toBe(false);
    const resultat = await aprovaTots(result);
    expect(ids(resultat.aprovats)).toEqual(['prova.lector']);
    expect(resultat.omesos).toEqual([{ id: 'prova.signat', motiu: 'SENSE_WEBAUTHN' }]);
    expect(resultat.fallits).toEqual([]);
    // Les files que torna són les ja refrescades.
    expect(resultat.files.map((f) => [f.id, f.estat])).toEqual([
      ['prova.lector', 'aprovat'], ['prova.signat', 'pendent'], ['prova.incomplet', 'incomplet']
    ]);
    expect((await magatzem.registres()).map((r) => [r.tractor, r.nivell])).toEqual([['prova.lector', 'confirmacio']]);
    expect(fila('prova.lector')).toMatchObject({ estat: 'aprovat', registre: resultat.aprovats[0].registre });
  });

  test('amb WebAuthn (credencials falses): el de signatura es signa (registra la clau) i tots dos queden aprovats; una segona crida no fa res', async () => {
    const credentials = credencialsFalses(await creaAutenticador());
    const { result, fila, magatzem } = await munta({ entorn: entornAmb(credentials) });
    await waitFor(() => expect(result.current.webauthn).toBe(true));
    const resultat = await aprovaTots(result);
    expect(ids(resultat.aprovats)).toEqual(['prova.lector', 'prova.signat']);
    expect(resultat.omesos).toEqual([]);
    expect(credentials.crides).toEqual({ get: 1, create: 1 });
    expect(fila('prova.lector')).toMatchObject({ estat: 'aprovat', registre: { nivell: 'confirmacio' } });
    expect(fila('prova.signat')).toMatchObject({ estat: 'aprovat', registre: { nivell: 'signatura', prova: { tipus: 'webauthn' } } });

    // Idempotent: ja no queda cap pendent.
    const segona = await aprovaTots(result);
    expect([segona.aprovats, segona.fallits, segona.omesos]).toEqual([[], [], []]);
    expect(credentials.crides).toEqual({ get: 1, create: 1 });
    expect(await magatzem.registres()).toHaveLength(2);
  });

  test('una versió canviada i una aprovació caducada es tornen a aprovar; una revocada, no', async () => {
    const rellotge = rellotgeMobil();
    const primer = await munta({ rellotge });
    const { curta } = primer.fila('prova.lector');
    await act(async () => { await primer.result.current.aprova('prova.lector', { nivell: 'confirmacio', confirmacio: curta }); });

    const canviat = await munta({ magatzem: primer.magatzem, tractors: CATALEG_V2, rellotge });
    expect(canviat.fila('prova.lector').estat).toBe('empremta-divergent');
    rellotge.ara = T0 + 1000;
    expect(ids((await aprovaTots(canviat.result)).aprovats)).toEqual(['prova.lector']);
    expect(canviat.fila('prova.lector').estat).toBe('aprovat');
    expect(canviat.fila('prova.lector').registre.empremta).toBe(canviat.fila('prova.lector').empremta);

    rellotge.ara = T0 + 1000 + 90 * DIA;
    await act(async () => { await canviat.result.current.recarrega(); });
    expect(canviat.fila('prova.lector').estat).toBe('caducat');
    rellotge.ara += 1000;
    expect(ids((await aprovaTots(canviat.result)).aprovats)).toEqual(['prova.lector']);
    expect(canviat.fila('prova.lector').estat).toBe('aprovat');

    rellotge.ara += 1000;
    await act(async () => { await canviat.result.current.revoca('prova.lector'); });
    expect(canviat.fila('prova.lector').estat).toBe('revocat');
    const revocat = await aprovaTots(canviat.result);
    expect(ids(revocat.aprovats)).toEqual([]);
    expect(canviat.fila('prova.lector').estat).toBe('revocat');
    expect(canviat.fila('prova.lector').registres.map((r) => r.decisio)).toEqual(['aprovat', 'aprovat', 'aprovat', 'revocat']);
  });

  test('si el codi canvia després de llegir les files, EMPREMTA_DIVERGENT i res desat', async () => {
    const { result, rerender, magatzem, rellotge } = await munta();
    const vistes = result.current.tractors;
    rerender({ magatzem, subtle, tractors: CATALEG_V2, entorn: ENTORN_SENSE, rellotge: rellotge.fn });
    await waitFor(() => expect(result.current.tractors[0].curta).not.toBe(vistes[0].curta));
    let resultat;
    await act(async () => { resultat = await aprovaEnBloc(vistes, { aprova: result.current.aprova }); });
    expect(resultat.fallits.map(({ id, error }) => [id, error.codi])).toEqual([['prova.lector', 'EMPREMTA_DIVERGENT']]);
    expect(resultat.aprovats).toEqual([]);
    expect(await magatzem.registres()).toEqual([]);
  });

  test('Touch ID cancel·lat: SIGNATURA_INVALIDA atura la sèrie i la resta s’ometen (SERIE_ATURADA)', async () => {
    const credentials = credencialsFalses(await creaAutenticador());
    credentials.get = async () => {
      credentials.crides.get += 1;
      throw new Error('NotAllowedError: cancel·lat');
    };
    const tractors = catalegTractors([
      MANIFESTS[1], MANIFESTS[0], manifest({ id: 'prova.signat2', nom: 'Segon signat', nivellMinim: 'signatura' })
    ], GLOB);
    const { result, magatzem } = await munta({ entorn: entornAmb(credentials), tractors });
    await waitFor(() => expect(result.current.webauthn).toBe(true));
    const resultat = await aprovaTots(result);
    expect(resultat.fallits.map(({ id, error }) => [id, error.codi])).toEqual([['prova.signat', 'SIGNATURA_INVALIDA']]);
    expect(resultat.omesos).toEqual([
      { id: 'prova.lector', motiu: 'SERIE_ATURADA' }, { id: 'prova.signat2', motiu: 'SERIE_ATURADA' }
    ]);
    expect(resultat.aprovats).toEqual([]);
    expect(credentials.crides.get).toBe(1);
    expect(await magatzem.registres()).toEqual([]);
  });

  test('fora de DEV el hook no l’exposa', async () => {
    expect(typeof (await munta()).result.current.aprovaTotsPendents).toBe('function');
    cleanup();
    vi.stubEnv('DEV', false);
    const { result } = await munta();
    expect(result.current.aprovaTotsPendents).toBeUndefined();
    expect('aprovaTotsPendents' in result.current).toBe(false);
  });
});

describe('exporta i oblida', () => {
  test('exporta JSONL sense dades personals i oblidaTot torna a pendent', async () => {
    const { result, fila, magatzem } = await munta();
    expect(await result.current.exporta()).toBe('');
    const { curta } = fila('prova.lector');
    await act(async () => { await result.current.aprova('prova.lector', { nivell: 'confirmacio', confirmacio: curta }); });
    const linies = (await result.current.exporta()).trim().split('\n').map((l) => JSON.parse(l));
    expect(linies).toHaveLength(1);
    expect(linies[0].tipus).toBe('registre');
    expect(Object.keys(linies[0].valor).sort()).toEqual(['caduca', 'data', 'decisio', 'empremta', 'nivell', 'nonce', 'schema', 'tractor', 'versio']);
    await act(async () => { await result.current.oblidaTot(); });
    expect(await magatzem.registres()).toEqual([]);
    expect(fila('prova.lector').estat).toBe('pendent');
  });
});

describe('contextAprovacio i la porta', () => {
  test('el context obri exigeixAprovacio després d\'aprovar i la bloqueja si el codi canvia', async () => {
    const magatzem = crearMagatzemMemoria();
    const opcions = { magatzem, subtle, tractors: CATALEG, entorn: ENTORN_SENSE, rellotge: () => T0 };
    const sense = await contextAprovacio('prova.lector', opcions);
    expect(sense).toMatchObject({ manifest: CATALEG[0].manifest, registres: [], claus: [], origen: ORIGEN, rpId: RP_ID, ara: T0 });
    expect((await errorDe(exigeixAprovacio(sense))).codi).toBe('APROVACIO_REQUERIDA');

    const { result } = await munta({ magatzem });
    const curta = result.current.tractors[0].curta;
    await act(async () => { await result.current.aprova('prova.lector', { nivell: 'confirmacio', confirmacio: curta }); });
    expect(await exigeixAprovacio(await contextAprovacio('prova.lector', { ...opcions, rellotge: () => T0 + 1 })))
      .toMatchObject({ decisio: 'aprovat' });
    const canviat = await contextAprovacio('prova.lector', { ...opcions, tractors: CATALEG_V2, rellotge: () => T0 + 1 });
    expect((await errorDe(exigeixAprovacio(canviat))).codi).toBe('EMPREMTA_DIVERGENT');
    const incomplet = await contextAprovacio('prova.incomplet', opcions);
    expect(incomplet.empremta).toBeNull();
    expect((await errorDe(exigeixAprovacio(incomplet))).codi).toBe('APROVACIO_REQUERIDA');
  });

  test('un tractor desconegut és APROVACIO_REQUERIDA', async () => {
    const error = await errorDe(contextAprovacio('prova.cap', { magatzem: crearMagatzemMemoria(), tractors: CATALEG }));
    expect(error.codi).toBe('APROVACIO_REQUERIDA');
  });

  test('sense magatzem injectat, el de la pàgina és únic', () => {
    expect(magatzemTractors()).toBe(magatzemTractors());
  });
});

describe('peces soltes', () => {
  test('entornDe i suportaWebAuthn no llancen mai', async () => {
    expect(entornDe({})).toEqual({ origen: '', rpId: '' });
    expect(entornDe(null)).toEqual({ origen: '', rpId: '' });
    expect(await suportaWebAuthn(entornAmb({ get() {}, create() {} }))).toBe(true);
    expect(await suportaWebAuthn(ENTORN_SENSE)).toBe(false);
    class SensePlataforma { static async isUserVerifyingPlatformAuthenticatorAvailable() { throw new Error('x'); } }
    expect(await suportaWebAuthn({ ...entornAmb({ get() {}, create() {} }), PublicKeyCredential: SensePlataforma })).toBe(false);
  });

  test('estatDelTractor: una fila «error» no avalua res', async () => {
    const fila = await estatDelTractor({
      tractor: CATALEG[0], info: { estat: 'error', empremta: null, curta: null, fontsAbsents: [], motiu: 'Sense WebCrypto.' },
      registres: undefined, claus: [], ara: T0, origen: ORIGEN, rpId: RP_ID, subtle
    });
    expect(fila).toMatchObject({ estat: 'error', motiu: 'Sense WebCrypto.', registres: [], registre: null });
  });
});
