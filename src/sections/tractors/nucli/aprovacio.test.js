// @vitest-environment node
import { webcrypto } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import { base64url, concatena, desdeBase64url, sha256, utf8 } from './canonic.js';
import { calculaEmpremta, empremtaCurta } from './empremta.js';
import { crearMagatzemMemoria } from './magatzem.js';
import { preimatgeRegistre } from './registre.js';
import {
  CODIS_APROVACIO, ErrorAprovacio, autenticadorDePlataforma, confirmacioValida, exigeixAprovacio, preparaRegistre,
  registraClauWebAuthn, repteDeRegistre, signaAmbWebAuthn, verificaRegistre, webauthnDisponible
} from './aprovacio.js';

const subtle = webcrypto.subtle;
const RP_ID = 'app.example.org';
const ORIGEN = 'https://app.example.org';
const UP = 0x01;
const UV = 0x04;
const AT = 0x40;
const EMPREMTA_A = `sha256:a3f91c2b${'0'.repeat(56)}`;
const EMPREMTA_B = `sha256:${'b'.repeat(64)}`;
const NONCE = new Uint8Array(16).fill(9);
const DATA = '2026-10-01T10:00:00.000Z';
const ARA = '2026-10-02T10:00:00.000Z';

function manifest(canvis = {}) {
  return {
    schema: 'sdp.tractor.v1',
    id: 'sdp.gestoria-lector',
    nom: 'Lector de factures',
    versio: '1.0.0',
    descripcio: 'Llig les factures de la carpeta triada.',
    fitxa: 'tractors/gestoria/fitxa.md',
    fonts: ['src/gestoria/lector.js'],
    llig: ['factures/**'],
    escriu: ['eixida/**'],
    xarxa: 'cap',
    dadesPersonals: true,
    nivellMinim: 'signatura',
    caducitatDies: 90,
    ...canvis
  };
}

/* Mini codificador CBOR i autenticador simulat (dades de prova). */
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

/* Imita navigator.credentials: «signa» amb l'autenticador simulat. */
function credencialsFalses(aut, { origen = ORIGEN, flagsGet = UP | UV, flagsCreate = UP | UV | AT, rawId, repteEco, rpIdSignat } = {}) {
  const crides = { get: [], create: [] };
  return {
    crides,
    async get(opcions) {
      crides.get.push(opcions);
      const { challenge, rpId } = opcions.publicKey;
      const authenticatorData = concatena(await sha256(rpIdSignat ?? rpId, subtle), new Uint8Array([flagsGet, 0, 0, 0, 1]));
      const clientDataJSON = utf8(JSON.stringify({ type: 'webauthn.get', challenge: base64url(challenge), origin: origen, crossOrigin: false }));
      const crua = new Uint8Array(await subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' }, aut.parell.privateKey,
        concatena(authenticatorData, await sha256(clientDataJSON, subtle))
      ));
      return {
        rawId: buffer(rawId ?? aut.id),
        response: { authenticatorData: buffer(authenticatorData), clientDataJSON: buffer(clientDataJSON), signature: buffer(crudaADer(crua)) }
      };
    },
    async create(opcions) {
      crides.create.push(opcions);
      const { challenge, rp } = opcions.publicKey;
      const cose = new Map([[1, 2], [3, -7], [-1, 1], [-2, desdeBase64url(aut.jwk.x)], [-3, desdeBase64url(aut.jwk.y)]]);
      const authData = concatena(
        await sha256(rpIdSignat ?? rp.id, subtle), new Uint8Array([flagsCreate, 0, 0, 0, 0]), new Uint8Array(16),
        new Uint8Array([0, aut.id.length]), aut.id, new Uint8Array(cbor(cose))
      );
      const attestationObject = new Uint8Array(cbor(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]])));
      const clientDataJSON = utf8(JSON.stringify({ type: 'webauthn.create', challenge: base64url(repteEco ?? challenge), origin: origen }));
      return { rawId: buffer(aut.id), response: { attestationObject: buffer(attestationObject), clientDataJSON: buffer(clientDataJSON) } };
    }
  };
}

async function codiDe(promesa) {
  try {
    await promesa;
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorAprovacio);
    return error.codi;
  }
  throw new Error('S\'esperava una ErrorAprovacio.');
}

/* Registre signat i la clau corresponent, a punt per a la porta. */
async function aprovacioSignada({ empremta = EMPREMTA_A, canvisManifest = {}, decisio = 'aprovat', ara = DATA } = {}) {
  const aut = await creaAutenticador();
  const m = manifest(canvisManifest);
  const preparat = preparaRegistre({ manifest: m, empremta, decisio, nivell: 'signatura', ara, nonce: NONCE });
  const credentials = credencialsFalses(aut);
  const signat = await signaAmbWebAuthn({ registre: preparat, credencial: base64url(aut.id), credentials, rpId: RP_ID, subtle });
  const claus = [{ credencial: base64url(aut.id), jwk: aut.jwk, creat: DATA, etiqueta: 'Portàtil' }];
  return { aut, m, preparat, signat, claus, credentials };
}

describe('ErrorAprovacio', () => {
  test('és un Error amb codi, nom i registre', () => {
    const error = new ErrorAprovacio('APROVACIO_REQUERIDA', 'Cal aprovar.', { registre: { a: 1 } });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ErrorAprovacio');
    expect(error.codi).toBe('APROVACIO_REQUERIDA');
    expect(error.registre).toEqual({ a: 1 });
    expect(new ErrorAprovacio('SIGNATURA_INVALIDA', 'x', { cause: 'y' }).cause).toBe('y');
    expect(CODIS_APROVACIO).toHaveLength(6);
  });
});

describe('preparaRegistre', () => {
  test('omple el registre amb data, caducitat i nonce', () => {
    const r = preparaRegistre({ manifest: manifest(), empremta: EMPREMTA_A, decisio: 'aprovat', nivell: 'signatura', ara: DATA, nonce: NONCE });
    expect(r).toEqual({
      schema: 'sdp.aprovacio.v1',
      tractor: 'sdp.gestoria-lector',
      versio: '1.0.0',
      empremta: EMPREMTA_A,
      decisio: 'aprovat',
      nivell: 'signatura',
      data: DATA,
      caduca: '2026-12-30T10:00:00.000Z',
      nonce: base64url(NONCE)
    });
  });

  test('sense caducitatDies o en revocar, caduca és null', () => {
    const sense = preparaRegistre({ manifest: manifest({ caducitatDies: null }), empremta: EMPREMTA_A, decisio: 'aprovat', nivell: 'signatura', ara: DATA });
    expect(sense.caduca).toBeNull();
    const revocat = preparaRegistre({ manifest: manifest(), empremta: EMPREMTA_A, decisio: 'revocat', nivell: 'confirmacio', ara: new Date(DATA) });
    expect(revocat).toMatchObject({ decisio: 'revocat', caduca: null, data: DATA });
  });

  test('genera un nonce aleatori de 16 bytes si no se li passa', () => {
    const a = preparaRegistre({ manifest: manifest(), empremta: EMPREMTA_A, decisio: 'revocat', nivell: 'confirmacio', ara: DATA });
    const b = preparaRegistre({ manifest: manifest(), empremta: EMPREMTA_A, decisio: 'revocat', nivell: 'confirmacio', ara: DATA });
    expect(desdeBase64url(a.nonce)).toHaveLength(16);
    expect(a.nonce).not.toBe(b.nonce);
    expect(preparaRegistre({ manifest: manifest(), empremta: EMPREMTA_A, decisio: 'revocat', nivell: 'confirmacio', ara: DATA, nonce: base64url(NONCE) }).nonce)
      .toBe(base64url(NONCE));
  });

  test('aprovar per davall del nivell mínim llança NIVELL_INSUFICIENT', () => {
    expect(() => preparaRegistre({ manifest: manifest(), empremta: EMPREMTA_A, decisio: 'aprovat', nivell: 'confirmacio', ara: DATA }))
      .toThrow(expect.objectContaining({ codi: 'NIVELL_INSUFICIENT' }));
  });

  test.each([
    ['manifest invàlid', { manifest: manifest({ id: 'X' }) }],
    ['empremta mal formada', { empremta: 'sha256:abc' }],
    ['decisio desconeguda', { decisio: 'potser' }],
    ['nivell desconegut', { nivell: 'maxim' }],
    ['data invàlida', { ara: 'ahir' }],
    ['nonce curt', { nonce: new Uint8Array(8) }]
  ])('rebutja %s', (_nom, canvis) => {
    const base = { manifest: manifest(), empremta: EMPREMTA_A, decisio: 'aprovat', nivell: 'signatura', ara: DATA, nonce: NONCE };
    expect(() => preparaRegistre({ ...base, ...canvis })).toThrow(TypeError);
  });
});

describe('repteDeRegistre', () => {
  test('és el SHA-256 de la preimatge i no depén de la prova', async () => {
    const r = preparaRegistre({ manifest: manifest(), empremta: EMPREMTA_A, decisio: 'aprovat', nivell: 'signatura', ara: DATA, nonce: NONCE });
    const repte = await repteDeRegistre(r, subtle);
    expect(repte).toHaveLength(32);
    expect([...repte]).toEqual([...(await sha256(preimatgeRegistre(r), subtle))]);
    expect([...(await repteDeRegistre({ ...r, prova: { tipus: 'webauthn' } }, subtle))]).toEqual([...repte]);
    expect([...(await repteDeRegistre({ ...r, empremta: EMPREMTA_B }, subtle))]).not.toEqual([...repte]);
  });
});

describe('confirmacioValida', () => {
  test.each([['A3F9-1C2B', true], ['a3f9-1c2b', true], ['A3F91C2B', true], [' a3f9 1c2b ', true], ['A3F9–1C2B', true],
    ['A3F9-1C2C', false], ['A3F9-1C2', false], ['', false]])('«%s» → %s', (text, esperat) => {
    expect(confirmacioValida(text, EMPREMTA_A)).toBe(esperat);
  });

  test('entrades dolentes tornen false', () => {
    expect(empremtaCurta(EMPREMTA_A)).toBe('A3F9-1C2B');
    expect(confirmacioValida(null, EMPREMTA_A)).toBe(false);
    expect(confirmacioValida('A3F9-1C2B', 'sha256:a3f91c2b')).toBe(false);
  });
});

describe('detecció de WebAuthn', () => {
  test('webauthnDisponible mira PublicKeyCredential i navigator.credentials', () => {
    const credentials = { get() {}, create() {} };
    expect(webauthnDisponible({})).toBe(false);
    expect(webauthnDisponible({ navigator: { credentials } })).toBe(false);
    expect(webauthnDisponible({ PublicKeyCredential: class {}, navigator: { credentials } })).toBe(true);
    expect(webauthnDisponible(null)).toBe(false);
  });

  test('autenticadorDePlataforma no llança mai', async () => {
    const credentials = { get() {}, create() {} };
    const amb = (pkc) => ({ PublicKeyCredential: pkc, navigator: { credentials } });
    expect(await autenticadorDePlataforma(amb(class { static async isUserVerifyingPlatformAuthenticatorAvailable() { return true; } }))).toBe(true);
    expect(await autenticadorDePlataforma(amb(class { static async isUserVerifyingPlatformAuthenticatorAvailable() { throw new Error('x'); } }))).toBe(false);
    expect(await autenticadorDePlataforma(amb(class {}))).toBe(false);
    expect(await autenticadorDePlataforma({})).toBe(false);
  });
});

describe('registraClauWebAuthn', () => {
  test('demana una clau de plataforma ES256 i RS256 amb UV i en torna la credencial i la jwk', async () => {
    const aut = await creaAutenticador();
    const credentials = credencialsFalses(aut);
    const clau = await registraClauWebAuthn({ credentials, rpId: RP_ID, nomRp: 'Sóc de Poble', subtle, origen: ORIGEN });
    expect(clau).toEqual({ credencial: base64url(aut.id), jwk: aut.jwk });
    const { publicKey } = credentials.crides.create[0];
    expect(publicKey.pubKeyCredParams).toEqual([{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }]);
    expect(publicKey.authenticatorSelection).toEqual({ authenticatorAttachment: 'platform', userVerification: 'required' });
    expect(publicKey.attestation).toBe('none');
    expect(publicKey.rp).toEqual({ id: RP_ID, name: 'Sóc de Poble' });
    expect(publicKey.challenge).toHaveLength(32);
  });

  test.each([
    ['sense verificació d\'usuari', { flagsCreate: UP | AT }, /verificació/],
    ['repte diferent', { repteEco: new Uint8Array(32) }, /repte/],
    ['origen diferent', { origen: 'https://altre.example.com' }, /origen/],
    ['rpId diferent', { rpIdSignat: 'altre.example.com' }, /rpIdHash/]
  ])('rebutja: %s', async (_nom, opcions, motiu) => {
    const aut = await creaAutenticador();
    const promesa = registraClauWebAuthn({ credentials: credencialsFalses(aut, opcions), rpId: RP_ID, subtle, origen: ORIGEN });
    await expect(promesa).rejects.toThrow(motiu);
    expect(await codiDe(registraClauWebAuthn({ credentials: credencialsFalses(aut, opcions), rpId: RP_ID, subtle, origen: ORIGEN })))
      .toBe('SIGNATURA_INVALIDA');
  });

  test('sense WebAuthn, cancel·lat o sense rpId: SIGNATURA_INVALIDA', async () => {
    const cancellat = { create: vi.fn(async () => { throw new Error('NotAllowedError'); }) };
    expect(await codiDe(registraClauWebAuthn({ credentials: null, rpId: RP_ID, subtle }))).toBe('SIGNATURA_INVALIDA');
    expect(await codiDe(registraClauWebAuthn({ credentials: cancellat, rpId: RP_ID, subtle }))).toBe('SIGNATURA_INVALIDA');
    expect(await codiDe(registraClauWebAuthn({ credentials: { create: async () => null }, rpId: RP_ID, subtle }))).toBe('SIGNATURA_INVALIDA');
    expect(await codiDe(registraClauWebAuthn({ credentials: cancellat, subtle }))).toBe('SIGNATURA_INVALIDA');
  });
});

describe('signaAmbWebAuthn', () => {
  test('demana UV amb la credencial i el repte del registre, i hi afig la prova', async () => {
    const { aut, preparat, signat, credentials } = await aprovacioSignada();
    const { publicKey } = credentials.crides.get[0];
    expect(publicKey.userVerification).toBe('required');
    expect(publicKey.rpId).toBe(RP_ID);
    expect([...publicKey.allowCredentials[0].id]).toEqual([...aut.id]);
    expect(publicKey.allowCredentials[0].type).toBe('public-key');
    expect([...publicKey.challenge]).toEqual([...(await repteDeRegistre(preparat, subtle))]);
    expect(signat).toMatchObject({ ...preparat, prova: { tipus: 'webauthn', credencial: base64url(aut.id) } });
  });

  test('errors: sense WebAuthn, nivell confirmació, cancel·lat, credencial diferent', async () => {
    const aut = await creaAutenticador();
    const registre = preparaRegistre({ manifest: manifest(), empremta: EMPREMTA_A, decisio: 'aprovat', nivell: 'signatura', ara: DATA, nonce: NONCE });
    const credencial = base64url(aut.id);
    const base = { registre, credencial, rpId: RP_ID, subtle };
    const confirmacio = { ...registre, nivell: 'confirmacio' };
    const cancellat = { get: async () => { throw new Error('NotAllowedError'); } };
    const altra = credencialsFalses(aut, { rawId: new Uint8Array(16) });
    const casos = [
      { ...base, credentials: null },
      { ...base, registre: confirmacio, credentials: credencialsFalses(aut) },
      { ...base, credentials: cancellat },
      { ...base, credentials: { get: async () => null } },
      { ...base, credentials: altra },
      { ...base, credencial: '+/', credentials: credencialsFalses(aut) },
      { ...base, rpId: '', credentials: credencialsFalses(aut) }
    ];
    for (const cas of casos) expect(await codiDe(signaAmbWebAuthn(cas))).toBe('SIGNATURA_INVALIDA');
  });
});

describe('verificaRegistre', () => {
  test('una signatura bona amb una clau registrada és vàlida', async () => {
    const { signat, claus } = await aprovacioSignada();
    expect(await verificaRegistre({ registre: signat, claus, origen: ORIGEN, rpId: RP_ID, subtle }))
      .toEqual({ valid: true, motiu: expect.any(String) });
  });

  test('una confirmació és vàlida sense prova', async () => {
    const r = preparaRegistre({ manifest: manifest({ nivellMinim: 'confirmacio' }), empremta: EMPREMTA_A, decisio: 'aprovat', nivell: 'confirmacio', ara: DATA, nonce: NONCE });
    expect((await verificaRegistre({ registre: r, claus: [], subtle })).valid).toBe(true);
  });

  test('invàlid: registre manipulat, clau absent, origen o rpId diferents, malformat', async () => {
    const { signat, claus } = await aprovacioSignada();
    const base = { claus, origen: ORIGEN, rpId: RP_ID, subtle };
    const casos = [
      { ...base, registre: { ...signat, empremta: EMPREMTA_B } },
      { ...base, registre: { ...signat, caduca: '2099-01-01T00:00:00.000Z' } },
      { ...base, registre: signat, claus: [] },
      { ...base, registre: signat, claus: undefined },
      { ...base, registre: signat, origen: 'https://altre.example.com' },
      { ...base, registre: signat, rpId: 'altre.example.com' },
      { ...base, registre: { ...signat, prova: undefined } },
      { ...base, registre: null }
    ];
    for (const cas of casos) expect((await verificaRegistre(cas)).valid).toBe(false);
    expect((await verificaRegistre()).valid).toBe(false);
  });
});

describe('exigeixAprovacio', () => {
  const exigeix = (registres, { m = manifest(), empremta = EMPREMTA_A, claus = [], ara = ARA, subtleProva = subtle } = {}) =>
    exigeixAprovacio({ manifest: m, empremta, registres, claus, ara, origen: ORIGEN, rpId: RP_ID, subtle: subtleProva });

  test('aprovació signada vigent: torna una còpia del registre', async () => {
    const { signat, claus } = await aprovacioSignada();
    const vigent = await exigeix([signat], { claus });
    expect(vigent).toEqual(signat);
    expect(vigent).not.toBe(signat);
  });

  test('confirmació vigent en un tractor de nivell confirmació', async () => {
    const m = manifest({ nivellMinim: 'confirmacio' });
    const r = preparaRegistre({ manifest: m, empremta: EMPREMTA_A, decisio: 'aprovat', nivell: 'confirmacio', ara: DATA, nonce: NONCE });
    expect(await exigeix([r], { m })).toEqual(r);
  });

  test('APROVACIO_REQUERIDA sense registres o amb entrades dolentes', async () => {
    expect(await codiDe(exigeix([]))).toBe('APROVACIO_REQUERIDA');
    expect(await codiDe(exigeix(undefined))).toBe('APROVACIO_REQUERIDA');
    expect(await codiDe(exigeix([], { ara: 'demà' }))).toBe('APROVACIO_REQUERIDA');
    expect(await codiDe(exigeix([], { m: { ...manifest(), id: 'X' } }))).toBe('APROVACIO_REQUERIDA');
    expect(await codiDe(exigeixAprovacio())).toBe('APROVACIO_REQUERIDA');
  });

  test('APROVACIO_REVOCADA quan l\'últim registre és una revocació', async () => {
    const { signat, claus } = await aprovacioSignada();
    const revocacio = preparaRegistre({
      manifest: manifest(), empremta: EMPREMTA_A, decisio: 'revocat', nivell: 'confirmacio', ara: '2026-10-01T12:00:00.000Z'
    });
    const error = await exigeix([signat, revocacio], { claus }).catch((e) => e);
    expect(error.codi).toBe('APROVACIO_REVOCADA');
    expect(error.registre).toEqual(revocacio);
  });

  test('EMPREMTA_DIVERGENT quan el codi o la fitxa han canviat', async () => {
    const { signat, claus } = await aprovacioSignada();
    expect(await codiDe(exigeix([signat], { claus, empremta: EMPREMTA_B }))).toBe('EMPREMTA_DIVERGENT');
  });

  test('APROVACIO_CADUCADA passats els dies del manifest', async () => {
    const { signat, claus } = await aprovacioSignada();
    expect(await codiDe(exigeix([signat], { claus, ara: '2026-12-30T10:00:00.000Z' }))).toBe('APROVACIO_CADUCADA');
    expect(await exigeix([signat], { claus, ara: '2026-12-30T09:59:59.999Z' })).toEqual(signat);
  });

  test('NIVELL_INSUFICIENT amb una confirmació en un tractor de signatura', async () => {
    const m = manifest({ nivellMinim: 'confirmacio' });
    const r = preparaRegistre({ manifest: m, empremta: EMPREMTA_A, decisio: 'aprovat', nivell: 'confirmacio', ara: DATA, nonce: NONCE });
    expect(await codiDe(exigeix([r]))).toBe('NIVELL_INSUFICIENT');
  });

  test('SIGNATURA_INVALIDA: sense clau, clau d\'un altre, prova trasplantada o subtle que falla', async () => {
    const { signat, claus } = await aprovacioSignada();
    const altra = await aprovacioSignada({ ara: '2026-10-01T09:00:00.000Z' });
    const trasplantat = { ...signat, prova: altra.signat.prova };
    const subtleTrencat = { digest: (...a) => subtle.digest(...a), importKey: async () => { throw new Error('trencat'); } };
    expect(await codiDe(exigeix([signat], { claus: [] }))).toBe('SIGNATURA_INVALIDA');
    expect(await codiDe(exigeix([signat], { claus: [{ ...claus[0], jwk: altra.claus[0].jwk }] }))).toBe('SIGNATURA_INVALIDA');
    expect(await codiDe(exigeix([trasplantat], { claus: [...claus, ...altra.claus] }))).toBe('SIGNATURA_INVALIDA');
    expect(await codiDe(exigeix([signat], { claus, subtleProva: subtleTrencat }))).toBe('SIGNATURA_INVALIDA');
  });

  test('una signatura retallada a confirmació no passa en un tractor de signatura', async () => {
    const { signat, claus } = await aprovacioSignada();
    const rebaixat = { ...signat, nivell: 'confirmacio' };
    delete rebaixat.prova;
    expect(await codiDe(exigeix([rebaixat], { claus }))).toBe('NIVELL_INSUFICIENT');
  });
});

describe('de punta a punta', () => {
  test('aprovar, guardar, exigir; canviar el codi bloqueja', async () => {
    const m = manifest();
    const fitxa = 'Què fa el lector de factures.\n';
    const codi = 'export const x = 1;\n';
    const fonts = [{ ruta: 'src/gestoria/lector.js', contingut: codi }];
    const empremta = await calculaEmpremta({ manifest: m, fitxa, fonts }, subtle);
    const magatzem = crearMagatzemMemoria();
    const aut = await creaAutenticador();
    const credentials = credencialsFalses(aut);

    const clau = await registraClauWebAuthn({ credentials, rpId: RP_ID, subtle, origen: ORIGEN });
    await magatzem.afegixClau({ ...clau, creat: DATA, etiqueta: 'Portàtil' });
    const registre = await signaAmbWebAuthn({
      registre: preparaRegistre({ manifest: m, empremta, decisio: 'aprovat', nivell: 'signatura', ara: DATA }),
      credencial: clau.credencial, credentials, rpId: RP_ID, subtle
    });
    await magatzem.afegixRegistre(registre);

    const context = { manifest: m, claus: await magatzem.claus(), registres: await magatzem.registres(m.id), ara: ARA, origen: ORIGEN, rpId: RP_ID, subtle };
    expect(await exigeixAprovacio({ ...context, empremta })).toEqual(registre);

    const empremtaNova = await calculaEmpremta({ manifest: m, fitxa, fonts: [{ ...fonts[0], contingut: 'export const x = 2;\n' }] }, subtle);
    expect(await codiDe(exigeixAprovacio({ ...context, empremta: empremtaNova }))).toBe('EMPREMTA_DIVERGENT');
  });
});
