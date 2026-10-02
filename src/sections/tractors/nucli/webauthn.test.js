// @vitest-environment node
import { webcrypto } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { base64url, concatena, desdeBase64url, sha256, utf8 } from './canonic.js';
import {
  FLAG_AT, FLAG_ED, FLAG_UP, FLAG_UV, clauCoseAJwk, derASignaturaCrua, descodificaCbor, extreuClauDeRegistre,
  llegixAuthenticatorData, llegixCbor, verificaAssercio
} from './webauthn.js';

const subtle = webcrypto.subtle;
const RP_ID = 'app.example.org';
const ORIGEN = 'https://app.example.org';
const bytesHex = (text) => new Uint8Array(Buffer.from(text.replace(/ /g, ''), 'hex'));

/* Mini codificador CBOR, només per a fabricar dades de prova. */
function capcalera(major, n) {
  if (n < 24) return [(major << 5) | n];
  if (n < 0x100) return [(major << 5) | 24, n];
  if (n < 0x10000) return [(major << 5) | 25, n >> 8, n & 0xff];
  return [(major << 5) | 26, (n >>> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
function cbor(valor) {
  if (Number.isInteger(valor)) return valor >= 0 ? capcalera(0, valor) : capcalera(1, -1 - valor);
  if (typeof valor === 'string') {
    const b = [...utf8(valor)];
    return [...capcalera(3, b.length), ...b];
  }
  if (valor instanceof Uint8Array) return [...capcalera(2, valor.length), ...valor];
  if (Array.isArray(valor)) return [...capcalera(4, valor.length), ...valor.flatMap(cbor)];
  if (valor instanceof Map) return [...capcalera(5, valor.size), ...[...valor].flatMap(([k, v]) => [...cbor(k), ...cbor(v)])];
  throw new Error('tipus no admés al codificador de prova');
}
const codifica = (valor) => new Uint8Array(cbor(valor));

/* Autenticador simulat: clau P-256 de WebCrypto, signatures en DER com WebAuthn. */
async function creaAutenticador() {
  const parell = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const { x, y } = await subtle.exportKey('jwk', parell.publicKey);
  return { parell, jwk: { kty: 'EC', crv: 'P-256', x, y }, id: webcrypto.getRandomValues(new Uint8Array(16)) };
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

async function assercio(autenticador, {
  repte, rpId = RP_ID, origen = ORIGEN, flags = FLAG_UP | FLAG_UV, tipus = 'webauthn.get', crossOrigin = false
} = {}) {
  const authenticatorData = concatena(await sha256(rpId, subtle), new Uint8Array([flags, 0, 0, 0, 9]));
  const clientDataJSON = utf8(JSON.stringify({ type: tipus, challenge: base64url(repte), origin: origen, crossOrigin }));
  const crua = new Uint8Array(await subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    autenticador.parell.privateKey,
    concatena(authenticatorData, await sha256(clientDataJSON, subtle))
  ));
  return { authenticatorData, clientDataJSON, signatura: crudaADer(crua), crua };
}

async function attestationObject(autenticador, { rpId = RP_ID, flags = FLAG_UP | FLAG_UV | FLAG_AT, cose, cua = [] } = {}) {
  const clau = cose ?? new Map([
    [1, 2], [3, -7], [-1, 1], [-2, desdeBase64url(autenticador.jwk.x)], [-3, desdeBase64url(autenticador.jwk.y)]
  ]);
  const authData = concatena(
    await sha256(rpId, subtle),
    new Uint8Array([flags, 0, 0, 0, 0]),
    new Uint8Array(16),
    new Uint8Array([0, autenticador.id.length]),
    autenticador.id,
    codifica(clau),
    new Uint8Array(cua)
  );
  return codifica(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]]));
}

describe('descodificaCbor (vectors de l\'RFC 8949, annex A)', () => {
  test.each([
    ['00', 0], ['17', 23], ['18 18', 24], ['18 64', 100], ['19 03 e8', 1000], ['1a 00 0f 42 40', 1000000],
    ['1b 00 00 00 e8 d4 a5 10 00', 1000000000000], ['20', -1], ['29', -10], ['38 63', -100], ['39 03 e7', -1000],
    ['60', ''], ['61 61', 'a'], ['64 49 45 54 46', 'IETF'], ['62 c3 bc', 'ü'],
    ['80', []], ['83 01 02 03', [1, 2, 3]], ['83 01 82 02 03 82 04 05', [1, [2, 3], [4, 5]]],
    ['f4', false], ['f5', true], ['f6', null], ['f7', undefined],
    ['f9 3e 00', 1.5], ['f9 7c 00', Infinity], ['f9 c4 00', -4], ['fa 47 c3 50 00', 100000]
  ])('%s', (codi, esperat) => {
    expect(descodificaCbor(bytesHex(codi))).toEqual(esperat);
  });

  test('cadenes de bytes com a Uint8Array', () => {
    expect(descodificaCbor(bytesHex('40'))).toEqual(new Uint8Array(0));
    expect([...descodificaCbor(bytesHex('44 01 02 03 04'))]).toEqual([1, 2, 3, 4]);
  });

  test('mapes com a Map, amb claus enteres i de text', () => {
    expect(descodificaCbor(bytesHex('a0'))).toEqual(new Map());
    expect(descodificaCbor(bytesHex('a2 01 02 03 04'))).toEqual(new Map([[1, 2], [3, 4]]));
    expect(descodificaCbor(bytesHex('a2 61 61 01 61 62 82 02 03'))).toEqual(new Map([['a', 1], ['b', [2, 3]]]));
    expect(descodificaCbor(codifica(new Map([[-2, 5], [-3, 6]])))).toEqual(new Map([[-2, 5], [-3, 6]]));
  });

  test('doble precisió', () => {
    const b = new Uint8Array(9);
    b[0] = 0xfb;
    new DataView(b.buffer).setFloat64(1, 1.1);
    expect(descodificaCbor(b)).toBe(1.1);
  });

  test.each([
    ['longitud indefinida', '5f 41 aa ff'],
    ['etiqueta', 'c1 1a 51 4b 67 b0'],
    ['truncat', '1a 00 00'],
    ['bytes sobrants', '00 00'],
    ['clau repetida', 'a2 01 02 01 02'],
    ['clau de mapa que és una llista', 'a1 80 01'],
    ['valor simple desconegut', 'f0'],
    ['valor simple ampliat', 'f8 18'],
    ['llista que diu ser enorme', '9a 7f ff ff ff 00'],
    ['text UTF-8 trencat', '62 c3 28']
  ])('rebutja %s', (_nom, codi) => {
    expect(() => descodificaCbor(bytesHex(codi))).toThrow(/CBOR|UTF|decode|encoded/i);
  });

  test('rebutja massa nivells d\'imbricació', () => {
    const profund = new Uint8Array(21).fill(0x81);
    profund[20] = 0x00;
    expect(() => descodificaCbor(profund)).toThrow(/nivells/);
  });

  test('llegixCbor torna on acaba', () => {
    expect(llegixCbor(bytesHex('18 64 ff'), 0)).toEqual({ valor: 100, posicio: 2 });
  });
});

describe('derASignaturaCrua', () => {
  test('omple per l\'esquerra i lleva el zero de signe', () => {
    const r = new Uint8Array(32).fill(0x81);
    const s = new Uint8Array(32);
    s[31] = 5;
    const der = crudaADer(concatena(r, s));
    expect(der[3]).toBe(33);
    expect([...derASignaturaCrua(der)]).toEqual([...r, ...s]);
  });

  test.each([
    ['no és SEQUENCE', [0x31, 0x06, 0x02, 0x01, 0x01, 0x02, 0x01, 0x01]],
    ['longitud total falsa', [0x30, 0x07, 0x02, 0x01, 0x01, 0x02, 0x01, 0x01]],
    ['INTEGER negatiu', [0x30, 0x06, 0x02, 0x01, 0x80, 0x02, 0x01, 0x01]],
    ['INTEGER no mínim', [0x30, 0x08, 0x02, 0x02, 0x00, 0x01, 0x02, 0x02, 0x00, 0x01]],
    ['INTEGER buit', [0x30, 0x05, 0x02, 0x00, 0x02, 0x01, 0x01]],
    ['falta s', [0x30, 0x03, 0x02, 0x01, 0x01]],
    ['bytes sobrants', [0x30, 0x07, 0x02, 0x01, 0x01, 0x02, 0x01, 0x01, 0x00]]
  ])('rebutja %s', (_nom, bytes) => {
    expect(() => derASignaturaCrua(new Uint8Array(bytes))).toThrow(/WebAuthn/);
  });
});

describe('extreuClauDeRegistre', () => {
  test('trau la credencial i la clau pública d\'un attestationObject «none»', async () => {
    const aut = await creaAutenticador();
    const clau = extreuClauDeRegistre(await attestationObject(aut));
    expect(clau.credencial).toBe(base64url(aut.id));
    expect(clau.jwk).toEqual(aut.jwk);
    expect(clau.fmt).toBe('none');
    expect(clau.flags & FLAG_UV).toBe(FLAG_UV);
    expect([...clau.rpIdHash]).toEqual([...(await sha256(RP_ID, subtle))]);
  });

  test('admet extensions darrere de la clau (flag ED)', async () => {
    const aut = await creaAutenticador();
    const ambExtensio = await attestationObject(aut, {
      flags: FLAG_UP | FLAG_UV | FLAG_AT | FLAG_ED,
      cua: cbor(new Map([['credProtect', 1]]))
    });
    expect(extreuClauDeRegistre(ambExtensio).credencial).toBe(base64url(aut.id));
  });

  test('rebutja claus que no són ES256 sobre P-256', async () => {
    const aut = await creaAutenticador();
    const x = desdeBase64url(aut.jwk.x);
    const y = desdeBase64url(aut.jwk.y);
    const variants = [
      new Map([[1, 3], [3, -257], [-1, x], [-2, y]]),
      new Map([[1, 2], [3, -8], [-1, 1], [-2, x], [-3, y]]),
      new Map([[1, 2], [3, -7], [-1, 2], [-2, x], [-3, y]]),
      new Map([[1, 2], [3, -7], [-1, 1], [-2, x.subarray(1)], [-3, y]])
    ];
    for (const cose of variants) {
      expect(() => extreuClauDeRegistre(attestationObjectSincron(cose))).toThrow(/WebAuthn/);
    }

    function attestationObjectSincron(cose) {
      const authData = concatena(new Uint8Array(32), new Uint8Array([FLAG_UP | FLAG_UV | FLAG_AT, 0, 0, 0, 0]),
        new Uint8Array(16), new Uint8Array([0, 1, 7]), codifica(cose));
      return codifica(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]]));
    }
  });

  test('rebutja un registre sense credencial o amb bytes sobrants', async () => {
    const aut = await creaAutenticador();
    expect(() => extreuClauDeRegistre(codifica(new Map([
      ['fmt', 'none'], ['attStmt', new Map()], ['authData', concatena(new Uint8Array(32), new Uint8Array([5, 0, 0, 0, 0]))]
    ])))).toThrow(/AT/);
    expect(() => extreuClauDeRegistre(attestationObjectAmbCua())).toThrow(/sobrants/);
    expect(() => extreuClauDeRegistre(codifica([1, 2]))).toThrow(/mapa/);
    expect(() => extreuClauDeRegistre(codifica(new Map([['fmt', 'none']])))).toThrow(/incomplet/);

    function attestationObjectAmbCua() {
      const cose = new Map([[1, 2], [3, -7], [-1, 1], [-2, desdeBase64url(aut.jwk.x)], [-3, desdeBase64url(aut.jwk.y)]]);
      const authData = concatena(new Uint8Array(32), new Uint8Array([FLAG_UP | FLAG_UV | FLAG_AT, 0, 0, 0, 0]),
        new Uint8Array(16), new Uint8Array([0, 1, 7]), codifica(cose), new Uint8Array([0]));
      return codifica(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]]));
    }
  });

  test('clauCoseAJwk exigix un Map', () => {
    expect(() => clauCoseAJwk({ 1: 2 })).toThrow(/mapa/);
  });
});

describe('llegixAuthenticatorData', () => {
  test('llig rpIdHash, flags i comptador', async () => {
    const dades = llegixAuthenticatorData(concatena(await sha256(RP_ID, subtle), new Uint8Array([5, 0, 0, 1, 2])));
    expect(dades.flags).toBe(5);
    expect(dades.comptador).toBe(258);
    expect(dades.credencial).toBeNull();
    expect(() => llegixAuthenticatorData(new Uint8Array(36))).toThrow(/curt/);
  });
});

describe('verificaAssercio', () => {
  const repte = new Uint8Array(32).fill(3);

  test('una asserció bona amb UP i UV és vàlida (bytes o base64url)', async () => {
    const aut = await creaAutenticador();
    const a = await assercio(aut, { repte });
    expect(await verificaAssercio({ jwk: aut.jwk, assercio: a, repte, origen: ORIGEN, rpId: RP_ID }, subtle))
      .toEqual({ valid: true, motiu: expect.any(String) });
    const textual = {
      authenticatorData: base64url(a.authenticatorData),
      clientDataJSON: base64url(a.clientDataJSON),
      signatura: base64url(a.signatura)
    };
    expect((await verificaAssercio({ jwk: aut.jwk, assercio: textual, repte, origen: ORIGEN, rpId: RP_ID }, subtle)).valid).toBe(true);
  });

  test('de punta a punta: la clau extreta del registre verifica l\'asserció', async () => {
    const aut = await creaAutenticador();
    const { jwk } = extreuClauDeRegistre(await attestationObject(aut));
    const a = await assercio(aut, { repte });
    expect((await verificaAssercio({ jwk, assercio: a, repte, origen: ORIGEN, rpId: RP_ID }, subtle)).valid).toBe(true);
  });

  test.each([
    ['repte canviat', {}, { repte: new Uint8Array(32).fill(4) }, /repte/],
    ['origen diferent', { origen: 'https://altre.example.com' }, {}, /Origen/],
    ['origen esperat diferent', {}, { origen: 'http://localhost:3340' }, /Origen/],
    ['rpId diferent', { rpId: 'altre.example.com' }, {}, /rpIdHash/],
    ['rpId esperat diferent', {}, { rpId: 'example.org' }, /rpIdHash/],
    ['sense verificació d\'usuari (UV)', { flags: FLAG_UP }, {}, /UV/],
    ['sense presència (UP)', { flags: FLAG_UV }, {}, /UP/],
    ['tipus de registre', { tipus: 'webauthn.create' }, {}, /type/],
    ['iframe d\'un altre origen', { crossOrigin: true }, {}, /iframe/]
  ])('invàlida: %s', async (_nom, perSignar, perVerificar, motiu) => {
    const aut = await creaAutenticador();
    const a = await assercio(aut, { repte, ...perSignar });
    const resultat = await verificaAssercio({ jwk: aut.jwk, assercio: a, repte, origen: ORIGEN, rpId: RP_ID, ...perVerificar }, subtle);
    expect(resultat.valid).toBe(false);
    expect(resultat.motiu).toMatch(motiu);
  });

  test('invàlida: signatura alterada, dades alterades o clau d\'un altre', async () => {
    const aut = await creaAutenticador();
    const altre = await creaAutenticador();
    const a = await assercio(aut, { repte });
    const crua = a.crua.slice();
    crua[63] ^= 1;
    const comptadorCanviat = a.authenticatorData.slice();
    comptadorCanviat[36] ^= 1;
    const casos = [
      { ...a, signatura: crudaADer(crua) },
      { ...a, authenticatorData: comptadorCanviat }
    ];
    for (const cas of casos) {
      const r = await verificaAssercio({ jwk: aut.jwk, assercio: cas, repte, origen: ORIGEN, rpId: RP_ID }, subtle);
      expect(r).toEqual({ valid: false, motiu: 'La signatura no verifica.' });
    }
    const r = await verificaAssercio({ jwk: altre.jwk, assercio: a, repte, origen: ORIGEN, rpId: RP_ID }, subtle);
    expect(r.valid).toBe(false);
  });

  test('mai llança: entrades absurdes tornen invàlid', async () => {
    const aut = await creaAutenticador();
    const a = await assercio(aut, { repte });
    const casos = [
      {},
      { jwk: aut.jwk, assercio: null, repte, origen: ORIGEN, rpId: RP_ID },
      { jwk: { kty: 'RSA' }, assercio: a, repte, origen: ORIGEN, rpId: RP_ID },
      { jwk: aut.jwk, assercio: { ...a, signatura: 'no-es-der' }, repte, origen: ORIGEN, rpId: RP_ID },
      { jwk: aut.jwk, assercio: { ...a, clientDataJSON: utf8('{trencat') }, repte, origen: ORIGEN, rpId: RP_ID },
      { jwk: aut.jwk, assercio: { ...a, signatura: '+++' }, repte, origen: ORIGEN, rpId: RP_ID },
      { jwk: aut.jwk, assercio: a, repte: 'no-son-bytes', origen: ORIGEN, rpId: RP_ID },
      { jwk: aut.jwk, assercio: a, repte, origen: ORIGEN }
    ];
    for (const cas of casos) {
      const r = await verificaAssercio(cas, subtle);
      expect(r.valid).toBe(false);
      expect(typeof r.motiu).toBe('string');
    }
    expect((await verificaAssercio(undefined, subtle)).valid).toBe(false);
  });
});
