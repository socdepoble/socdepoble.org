import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  CRYPTOSUITE_FEP8B32,
  ESQUEMA_PAQUET_SOBIRANIA,
  canonitzaJsonJcs,
  calculaHashEntradaFep8b32,
  codificaBase58Btc,
  codificaBase64Url,
  descodificaBase64Url,
  descodificaBase58Btc,
  emetActivitatMoveActivityPub,
  exportaPaquetSobiraniaMunicipal,
  generaParellClausFediversityEd25519,
  importaPaquetSobiraniaMunicipal,
  normalitzaActorActivityPub,
  sha256Bytes,
  sha256Hex,
  signaObjecteFediversityFep8b32,
  verificaEnllacBidireccionalAlsoKnownAs,
  verificaMigracioActorFep7628,
  verificaObjecteFediversityFep8b32,
} from '../src/data/federacio/portabilitatFediversity.js';

test('SHA-256 FIPS 180-4 isomòrfic coincideix bit a bit amb node:crypto en textos buits, valencians i multibloc', () => {
  const mostres = [
    '',
    'abc',
    'Sóc de Poble · La Torre de les Maçanes · Pedra Seca i Fediversity!',
    'x'.repeat(55),
    'y'.repeat(56),
    'z'.repeat(64),
    'Il·lustració de còmic d’estil Bruguera i memòria oral rural. '.repeat(25),
  ];

  for (const mostra of mostres) {
    const esperatHex = createHash('sha256').update(mostra, 'utf8').digest('hex');
    const esperatBytes = new Uint8Array(createHash('sha256').update(mostra, 'utf8').digest());
    assert.equal(sha256Hex(mostra), esperatHex);
    assert.deepEqual(sha256Bytes(mostra), esperatBytes);
  }
});

test('Base64URL codifica i descodifica sense pèrdua qualsevol longitud de bytes i rebutja entrades corruptes', () => {
  for (let len = 0; len <= 65; len += 1) {
    const original = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) original[i] = (i * 37 + 13) & 255;
    const b64 = codificaBase64Url(original);
    assert.match(b64, /^[A-Za-z0-9\-_]*$/);
    assert.deepEqual(descodificaBase64Url(b64), original);
  }
  assert.throws(() => descodificaBase64Url('abc='), TypeError);
  assert.throws(() => descodificaBase64Url('a'), TypeError);
});

test('FEDI-01 · Base58-btc conserva els zeros inicials i rebutja caràcters d’altres alfabets', () => {
  // Casos propis de frontera; no són vectors W3C.
  for (const [bytes, text] of [[[], ''], [[0], '1'], [[0, 0, 1], '112'], [[255], '5Q']]) {
    assert.equal(codificaBase58Btc(new Uint8Array(bytes)), text);
    assert.deepEqual(descodificaBase58Btc(text), new Uint8Array(bytes));
  }
  for (let len = 0; len <= 65; len += 1) {
    const bytes = new Uint8Array(len).map((_, i) => (i * 37 + 13) & 255);
    assert.deepEqual(descodificaBase58Btc(codificaBase58Btc(bytes)), bytes);
  }
  for (const text of ['0', 'O', 'I', 'l', '+', '/', 'abc=', ' ab', 'z\n']) {
    assert.throws(() => descodificaBase58Btc(text), TypeError);
  }
});

/* Vector OFICIAL W3C Recommendation, 2025-05-15, vc-di-eddsa B.3,
   exemples 29–39. Les claus són exclusivament les claus públiques de prova
   publicades en la norma; no són claus del projecte. Esperats copiats de la
   font, no calculats pel nostre signador:
   https://www.w3.org/TR/2025/REC-vc-di-eddsa-20250515/#representation-eddsa-jcs-2022 */
const W3C_PUBLIC = 'z6MkrJVnaZkeFzdQyMZu1cgjg7k1pZZ6pvBQ7XJPt4swbTQ2';
const W3C_SECRET = 'z3u2en7t5LR2WtQH5PfFqMqwVHBeXouLzo6haApm8XHqvjxq';
const W3C_VM = `did:key:${W3C_PUBLIC}#${W3C_PUBLIC}`;
const W3C_DOCUMENT = {
  '@context': ['https://www.w3.org/ns/credentials/v2', 'https://www.w3.org/ns/credentials/examples/v2'],
  id: 'urn:uuid:58172aac-d8ba-11ed-83dd-0b3aef56cc33',
  type: ['VerifiableCredential', 'AlumniCredential'],
  name: 'Alumni Credential',
  description: 'A minimum viable example of an Alumni Credential.',
  issuer: 'https://vc.example/issuers/5678',
  validFrom: '2023-01-01T00:00:00Z',
  credentialSubject: { id: 'did:example:abcdefgh', alumniOf: 'The School of Examples' },
};
const W3C_PROOF = {
  type: 'DataIntegrityProof', cryptosuite: 'eddsa-jcs-2022', created: '2023-02-24T23:36:38Z',
  verificationMethod: W3C_VM, proofPurpose: 'assertionMethod', '@context': W3C_DOCUMENT['@context'],
};
const W3C_VALUE = 'z2HnFSSPPBzR36zdDgK8PbEHeXbR56YF24jwMpt3R1eHXQzJDMWS93FCzpvJpwTWd3GAVFuUfjoJdcnTMuVor51aX';
const W3C_SIGNATURE_HEX = '407cd12654b33d718ecbb99179a1506daaa849450bf3fc523cce3e1c96f8b80351da3f253d725c6f00b07c9e5448d50b3ef78012b9ab54255116d069c6dd2808';
const hexDe = bytes => Buffer.from(bytes).toString('hex');
const clausW3c = () => {
  const publicBytes = descodificaBase58Btc(W3C_PUBLIC.slice(1));
  const secretBytes = descodificaBase58Btc(W3C_SECRET.slice(1));
  assert.equal(hexDe(publicBytes.slice(0, 2)), 'ed01');
  assert.equal(hexDe(secretBytes.slice(0, 2)), '8026');
  assert.equal(publicBytes.length, 34);
  assert.equal(secretBytes.length, 34);
  const publicKeyJwk = { kty: 'OKP', crv: 'Ed25519', x: codificaBase64Url(publicBytes.slice(2)) };
  return { publicKeyJwk, privateKeyJwk: { ...publicKeyJwk, d: codificaBase64Url(secretBytes.slice(2)) } };
};

test('FEDI-01 · vector oficial W3C B.3: JCS, SHA-256, signatura Ed25519 i Multibase coincideixen bit a bit', async () => {
  const hash = calculaHashEntradaFep8b32(W3C_DOCUMENT, W3C_PROOF);
  assert.equal(hash.sha256Document, '59b7cb6251b8991add1ce0bc83107e3db9dbbab5bd2c28f687db1a03abc92f19');
  assert.equal(hash.sha256ProofConfig, '66ab154f5c2890a140cb8388a22a160454f80575f6eae09e5a097cabe539a1db');
  assert.equal(hexDe(hash.dadesASignar), hash.sha256ProofConfig + hash.sha256Document);
  assert.equal(hexDe(descodificaBase58Btc(W3C_VALUE.slice(1))), W3C_SIGNATURE_HEX);
  assert.equal(`z${codificaBase58Btc(new Uint8Array(Buffer.from(W3C_SIGNATURE_HEX, 'hex')))}`, W3C_VALUE);
  const keys = clausW3c();
  const signed = await signaObjecteFediversityFep8b32(W3C_DOCUMENT, {
    privateKeyJwk: keys.privateKeyJwk, verificationMethod: W3C_VM, created: W3C_PROOF.created,
  });
  assert.deepEqual(signed.proof, { ...W3C_PROOF, proofValue: W3C_VALUE });
  const verified = await verificaObjecteFediversityFep8b32({ ...W3C_DOCUMENT, proof: { ...W3C_PROOF, proofValue: W3C_VALUE } }, {
    publicKeyJwk: keys.publicKeyJwk, verificationMethodEsperat: W3C_VM,
  });
  assert.equal(verified.valid, true);
});

test('FEDI-01 · negatives pròpies: prefix antic, alfabets corruptes, longitud, clau aliena i context alterat fallen tancats', async () => {
  const { publicKeyJwk } = clausW3c();
  const signed = { ...W3C_DOCUMENT, proof: { ...W3C_PROOF, proofValue: W3C_VALUE } };
  const verify = document => verificaObjecteFediversityFep8b32(document, { publicKeyJwk, verificationMethodEsperat: W3C_VM });
  for (const value of ['u' + codificaBase64Url(descodificaBase58Btc(W3C_VALUE.slice(1))), 'z0', 'z1', 'z' + '1'.repeat(90)]) {
    assert.equal((await verify({ ...signed, proof: { ...signed.proof, proofValue: value } })).valid, false, value);
  }
  const aliena = await generaParellClausFediversityEd25519();
  assert.equal((await verificaObjecteFediversityFep8b32(signed, { publicKeyJwk: aliena.publicKeyJwk })).valid, false);
  assert.equal((await verify({ ...signed, '@context': [...W3C_DOCUMENT['@context']].reverse() })).motiu, 'CONTEXT_PROVA_INVALID');
  // La norma permet ampliar el context del document conservant el prefix de la prova.
  assert.equal((await verify({ ...signed, '@context': [...W3C_DOCUMENT['@context'], { added: 'https://example.org/added' }] })).valid, true);
  assert.equal((await verify({ ...signed, name: 'Canviat' })).valid, false);
  for (const created of ['2023-02-29T12:00:00Z', '2024-04-31T00:00:00Z', '2024-01-01T12:00:00+14:01', '2024-01-01T24:00:00.1Z']) {
    assert.equal((await verify({ ...signed, proof: { ...signed.proof, created } })).motiu, 'CREATED_INVALID', created);
  }
});

// O8-PORT-02: el títol deia «filtra prototips»; la JCS ja no en descarta cap (vegeu les proves del Gauntlet).
test('canonitzaJsonJcs (RFC 8785) produeix la mateixa cadena independentment de l’ordre de les claus i descarta només `undefined`', () => {
  const objA = {
    z: 1,
    a: { d: 'valencià', b: [true, null, -0] },
    ignora: undefined,
  };
  const objB = {
    a: { b: [true, null, 0], d: 'valencià' },
    z: 1,
  };
  assert.equal(canonitzaJsonJcs(objA), canonitzaJsonJcs(objB));
  assert.equal(canonitzaJsonJcs(objA), '{"a":{"b":[true,null,0],"d":"valencià"},"z":1}');
  assert.throws(() => canonitzaJsonJcs({ x: Number.NaN }), TypeError);
  assert.throws(() => canonitzaJsonJcs({ x: Number.POSITIVE_INFINITY }), TypeError);
  // O8-PORT-09 · RFC 8785 §3.2.2.2: un surrogat solitari MUST acabar amb error (valor, clau o dins d'una llista).
  assert.throws(() => canonitzaJsonJcs({ a: '\uDEAD' }), TypeError);
  assert.throws(() => canonitzaJsonJcs({ '\uD800': 1 }), TypeError);
  assert.throws(() => canonitzaJsonJcs(['x\uDC00y']), TypeError);
  assert.equal(canonitzaJsonJcs({ a: '😀' }), '{"a":"😀"}');
});

test('FEP-7628: valida la migració bidireccional entre un node WordPress rural i un node NixOS de Fediversity', () => {
  const iriOrigen = 'https://latorre.wp-rural.org/actors/ajuntament';
  const iriDesti = 'https://latorre.fediversity.eu/actors/ajuntament';

  const actorOrigen = normalitzaActorActivityPub({
    id: iriOrigen,
    type: 'Organization',
    preferredUsername: 'ajuntament_latorre',
    name: 'Ajuntament de la Torre de les Maçanes',
    alsoKnownAs: [iriDesti, iriDesti],
    movedTo: iriDesti,
  });

  const actorDesti = normalitzaActorActivityPub({
    id: iriDesti,
    type: 'Organization',
    preferredUsername: 'ajuntament_latorre',
    name: 'Ajuntament de la Torre de les Maçanes',
    alsoKnownAs: [iriOrigen],
  });

  assert.equal(Object.isFrozen(actorOrigen), true);
  assert.deepEqual(actorOrigen.alsoKnownAs, [iriDesti]);

  const enllac = verificaEnllacBidireccionalAlsoKnownAs(actorOrigen, actorDesti);
  assert.equal(enllac.valid, true);
  assert.deepEqual(enllac.motius, []);

  const activitatMove = emetActivitatMoveActivityPub({
    actorOrigen,
    actorDesti,
    publicatEl: '2026-11-03T05:30:00Z',
  });

  assert.equal(activitatMove.type, 'Move');
  assert.equal(activitatMove.actor, iriOrigen);
  assert.equal(activitatMove.object, iriOrigen);
  assert.equal(activitatMove.target, iriDesti);

  const verificacio = verificaMigracioActorFep7628({
    activitatMove,
    actorOrigen,
    actorDesti,
  });
  assert.equal(verificacio.valid, true);
  assert.deepEqual(verificacio.motius, []);
});

test('FEP-7628: bloqueja intents de segrest d’identitat quan l’actor de destinació no confirma l’enllaç a alsoKnownAs', () => {
  const iriOrigen = 'https://latorre.wp-rural.org/actors/ajuntament';
  const iriAtacant = 'https://node-fals.example.org/actors/impostor';

  const actorOrigen = {
    id: iriOrigen,
    type: 'Organization',
    alsoKnownAs: [iriAtacant],
    movedTo: iriAtacant,
  };
  const actorAtacantSenseConfirmacio = {
    id: iriAtacant,
    type: 'Organization',
    alsoKnownAs: [],
  };

  const enllac = verificaEnllacBidireccionalAlsoKnownAs(actorOrigen, actorAtacantSenseConfirmacio);
  assert.equal(enllac.valid, false);
  assert.ok(enllac.motius.some((m) => m.includes('alsoKnownAs')));

  assert.throws(
    () => emetActivitatMoveActivityPub({ actorOrigen, actorDesti: actorAtacantSenseConfirmacio }),
    (err) => err.codi === 'FEP7628_ALSOKNOWNAS_NO_BIDIRECCIONAL',
  );
});

test('FEP-8b32: signa amb Ed25519 (eddsa-jcs-2022) un ban municipal, verifica la integritat i detecta qualsevol alteració', async () => {
  const claus = await generaParellClausFediversityEd25519({
    controller: 'https://latorre.socdepoble.org/actors/ajuntament',
    idClau: 'https://latorre.socdepoble.org/actors/ajuntament#ed25519-main',
  });
  assert.equal(claus.cryptosuite, CRYPTOSUITE_FEP8B32);

  const banMunicipal = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: 'https://latorre.socdepoble.org/bans/2026-11-03-tall-cami-serrat',
    type: 'Note',
    attributedTo: 'https://latorre.socdepoble.org/actors/ajuntament',
    name: 'Ban municipal: Camí del Serrat obert després de la pluja',
    content: 'Es comunica al veïnat que la brigada municipal ha netejat el pas del barranc.',
    published: '2026-11-03T06:00:00Z',
  };

  const banSignat = await signaObjecteFediversityFep8b32(banMunicipal, {
    privateKeyJwk: claus.privateKeyJwk,
    verificationMethod: claus.idClau,
    created: '2026-11-03T06:00:05Z',
  });

  assert.equal(banSignat.proof.type, 'DataIntegrityProof');
  assert.equal(banSignat.proof.cryptosuite, 'eddsa-jcs-2022');
  assert.ok(banSignat.proof.proofValue.startsWith('z'));

  // Reordenem les claus com passaria en travessar un altre servidor JSON-LD:
  const banReordenat = {
    proof: { ...banSignat.proof },
    published: banSignat.published,
    content: banSignat.content,
    name: banSignat.name,
    type: banSignat.type,
    id: banSignat.id,
    attributedTo: banSignat.attributedTo,
    '@context': banSignat['@context'],
  };

  const verificacioOk = await verificaObjecteFediversityFep8b32(banReordenat, {
    publicKeyJwk: claus.publicKeyJwk,
    verificationMethodEsperat: claus.idClau,
  });
  assert.equal(verificacioOk.valid, true);
  assert.equal(verificacioOk.motiu, null);

  // Alterem un sol caràcter del contingut:
  const banManipulat = {
    ...banSignat,
    content: 'Es comunica al veïnat que el camí continua TANCAT.',
  };
  const verificacioFalsa = await verificaObjecteFediversityFep8b32(banManipulat, {
    publicKeyJwk: claus.publicKeyJwk,
  });
  assert.equal(verificacioFalsa.valid, false);
  assert.equal(verificacioFalsa.motiu, 'SIGNATURA_INVALIDA');
});

test('Paquet de Sobirania Municipal (.sdp-fediversity-bundle.jsonld): exporta i restaura en 1 clic amb FEP-7628 + FEP-8b32', async () => {
  const iriOrigen = 'https://latorre.sobirania-vella.org/actors/ajuntament';
  const iriDesti = 'https://latorre.fediversity.eu/actors/ajuntament';

  const claus = await generaParellClausFediversityEd25519({
    controller: iriOrigen,
    idClau: `${iriOrigen}#ed25519-sobirania`,
  });

  const actorOrigen = normalitzaActorActivityPub({
    id: iriOrigen,
    type: 'Organization',
    preferredUsername: 'latorre',
    name: 'La Torre de les Maçanes',
    alsoKnownAs: [iriDesti],
    movedTo: iriDesti,
  });

  const actorDesti = normalitzaActorActivityPub({
    id: iriDesti,
    type: 'Organization',
    preferredUsername: 'latorre',
    name: 'La Torre de les Maçanes',
    alsoKnownAs: [iriOrigen],
  });

  const activitatMove = emetActivitatMoveActivityPub({
    actorOrigen,
    actorDesti,
    publicatEl: '2026-11-03T06:15:00Z',
  });

  const paquet = await exportaPaquetSobiraniaMunicipal({
    municipi: 'La Torre de les Maçanes',
    actor: actorOrigen,
    outbox: [
      { id: `${iriOrigen}/posts/1`, type: 'Create', summary: 'Mercat de l’oli nou a la plaça' },
    ],
    followers: [
      'https://relleu.socdepoble.org/actors/ajuntament',
      'https://xixona.socdepoble.org/actors/cooperativa',
    ],
    entitatsOpenData: [
      { id: 'mercat:oli-verge-2026', tipus: 'ProducteLocal', preuEur: 32.5 },
    ],
    notes: [
      { id: 'nota:calendari-olivera', titol: 'Verema i collita d’oliva 2026' },
    ],
    activitatMove,
    exportatEl: '2026-11-03T06:20:00Z',
    privateKeyJwk: claus.privateKeyJwk,
    verificationMethod: claus.idClau,
  });

  assert.equal(paquet.schema, ESQUEMA_PAQUET_SOBIRANIA);
  assert.equal(paquet.resumIntegritat.totalFollowers, 2);

  const restaurat = await importaPaquetSobiraniaMunicipal(paquet, {
    publicKeyJwk: claus.publicKeyJwk,
    actorDesti,
  });

  assert.equal(restaurat.valid, true);
  assert.deepEqual(restaurat.motius, []);
  assert.equal(restaurat.municipi, 'La Torre de les Maçanes');
  assert.equal(restaurat.dadesRestaurades.followers.length, 2);
  assert.equal(restaurat.dadesRestaurades.entitatsOpenData[0].id, 'mercat:oli-verge-2026');

  // Si algú intenta injectar un seguidor fals dins del paquet exportat, cau tant el resum SHA-256 com la signatura FEP-8b32:
  const paquetCorrupte = {
    ...paquet,
    colleccions: {
      ...paquet.colleccions,
      followers: [...paquet.colleccions.followers, 'https://atacant.example.org/actors/bot'],
    },
  };
  const restauratCorrupte = await importaPaquetSobiraniaMunicipal(paquetCorrupte, {
    publicKeyJwk: claus.publicKeyJwk,
    actorDesti,
  });
  assert.equal(restauratCorrupte.valid, false);
  assert.ok(restauratCorrupte.motius.some((m) => m.includes('resumIntegritat.totalFollowers')));
  assert.ok(restauratCorrupte.motius.some((m) => m.includes('FEP-8b32')));
});

/* Gauntlet O7-O9 (kit Gemini): O8-PORT-02, -04, -05 i -06. */
const IRI_ORIGEN = 'https://latorre.sobirania-vella.org/actors/ajuntament';
const IRI_DESTI = 'https://latorre.fediversity.eu/actors/ajuntament';
async function paquetDeProva({ activitatMove } = {}) {
  const claus = await generaParellClausFediversityEd25519({ controller: IRI_ORIGEN, idClau: `${IRI_ORIGEN}#ed25519-sobirania` });
  const actorOrigen = normalitzaActorActivityPub({ id: IRI_ORIGEN, alsoKnownAs: [IRI_DESTI], movedTo: IRI_DESTI });
  const actorDesti = normalitzaActorActivityPub({ id: IRI_DESTI, alsoKnownAs: [IRI_ORIGEN] });
  const move = activitatMove ?? emetActivitatMoveActivityPub({ actorOrigen, actorDesti, publicatEl: '2026-11-03T06:15:00Z' });
  const paquet = await exportaPaquetSobiraniaMunicipal({
    actor: actorOrigen, notes: [{ id: 'nota:1', titol: 'Original' }], activitatMove: move,
    exportatEl: '2026-11-03T06:20:00Z', privateKeyJwk: claus.privateKeyJwk, verificationMethod: claus.idClau,
  });
  // Com arriba d'un fitxer: JSON.parse dona claus pròpies, també `__proto__`.
  return { claus, actorDesti, paquet: JSON.parse(JSON.stringify(paquet)) };
}

test('O8-PORT-02 · cap clau de prototip afegida després de signar arriba a dadesRestaurades ni passa la prova', async () => {
  assert.equal(canonitzaJsonJcs(JSON.parse('{"k":1,"constructor":2,"__proto__":3,"prototype":4}')), '{"__proto__":3,"constructor":2,"k":1,"prototype":4}');
  const { claus, actorDesti, paquet } = await paquetDeProva();
  for (const clau of ['constructor', 'prototype', '__proto__']) {
    const arrel = JSON.parse(JSON.stringify(paquet).replace('{', `{"${clau}":"injectat",`));
    const v = await verificaObjecteFediversityFep8b32(arrel, { publicKeyJwk: claus.publicKeyJwk });
    assert.equal(v.valid, false, clau); assert.equal(v.motiu, 'CLAU_PROHIBIDA');
    const niada = JSON.parse(JSON.stringify(paquet).replace('"titol":"Original"', `"titol":"Original","${clau}":"<img src=x onerror=alert(1)>"`));
    const r = await importaPaquetSobiraniaMunicipal(niada, { publicKeyJwk: claus.publicKeyJwk, actorDesti });
    assert.equal(r.valid, false, clau); assert.equal(r.dadesRestaurades, null);
  }
  await assert.rejects(signaObjecteFediversityFep8b32(JSON.parse('{"__proto__":{"admin":true},"a":1}'), {
    privateKeyJwk: claus.privateKeyJwk, verificationMethod: claus.idClau,
  }), TypeError);
});

test('O8-PORT-04 · tot el proof entra a la signatura i proofPurpose ha de ser assertionMethod', async () => {
  const { claus, paquet } = await paquetDeProva();
  const opcions = { publicKeyJwk: claus.publicKeyJwk };
  assert.equal((await verificaObjecteFediversityFep8b32(paquet, opcions)).valid, true);
  for (const [canvi, motiu] of [
    [(p) => { p.expires = '2099-01-01T00:00:00Z'; }, 'SIGNATURA_INVALIDA'],
    [(p) => { p.domain = 'atacant.example'; }, 'SIGNATURA_INVALIDA'],
    [(p) => { p['@context'] = 'https://w3id.org/security/v1'; }, 'CONTEXT_PROVA_INVALID'],
    [(p) => { delete p.created; }, 'SIGNATURA_INVALIDA'],
    [(p) => { delete p.proofPurpose; }, 'PROOF_PURPOSE_INVALID'],
    [(p) => { p.proofPurpose = 'authentication'; }, 'PROOF_PURPOSE_INVALID'],
    [(p) => { p.created = 'ahir'; }, 'CREATED_INVALID'],
  ]) {
    const alterat = structuredClone(paquet); canvi(alterat.proof);
    assert.equal((await verificaObjecteFediversityFep8b32(alterat, opcions)).motiu, motiu);
  }
  await assert.rejects(signaObjecteFediversityFep8b32({ a: 1 }, { privateKeyJwk: claus.privateKeyJwk, verificationMethod: claus.idClau, proofPurpose: 'authentication' }), TypeError);
  await assert.rejects(signaObjecteFediversityFep8b32({ a: 1 }, { privateKeyJwk: claus.privateKeyJwk, verificationMethod: claus.idClau, created: 'ahir' }), TypeError);
});

test('O8-PORT-05 · la importació lliga el verificationMethod a l’actor del paquet', async () => {
  const { actorDesti, paquet } = await paquetDeProva();
  const atacant = await generaParellClausFediversityEd25519({ controller: 'https://atacant.example/actors/x', idClau: 'https://atacant.example/actors/x#k' });
  const { proof, ...senseProva } = paquet;
  assert.ok(proof);
  const resignat = await signaObjecteFediversityFep8b32(senseProva, { privateKeyJwk: atacant.privateKeyJwk, verificationMethod: atacant.idClau, created: '2026-11-03T06:20:00Z' });
  const r = await importaPaquetSobiraniaMunicipal(resignat, { publicKeyJwk: atacant.publicKeyJwk, actorDesti });
  assert.equal(r.valid, false); assert.ok(r.motius.some((m) => m.includes('VERIFICATION_METHOD_NO_LLIGAT')));
  await assert.rejects(exportaPaquetSobiraniaMunicipal({ actor: { id: IRI_ORIGEN }, privateKeyJwk: atacant.privateKeyJwk, verificationMethod: atacant.idClau }), TypeError);
});

test('O8-PORT-06 · sense actorDesti el Move no es restaura, i un Move d’un altre actor invalida el paquet', async () => {
  const { claus, actorDesti, paquet } = await paquetDeProva();
  const senseDesti = await importaPaquetSobiraniaMunicipal(paquet, { publicKeyJwk: claus.publicKeyJwk });
  assert.equal(senseDesti.valid, true); assert.equal(senseDesti.dadesRestaurades.migracioFep7628, null);
  const ambDesti = await importaPaquetSobiraniaMunicipal(paquet, { publicKeyJwk: claus.publicKeyJwk, actorDesti });
  assert.equal(ambDesti.dadesRestaurades.migracioFep7628.target, IRI_DESTI);
  const segrest = await paquetDeProva({ activitatMove: { id: 'https://altre.example/activities/m', type: 'Move',
    actor: 'https://altre.example/u/z', object: 'https://altre.example/u/z', target: 'https://segrestador.example/u/y' } });
  const r = await importaPaquetSobiraniaMunicipal(segrest.paquet, { publicKeyJwk: segrest.claus.publicKeyJwk });
  assert.equal(r.valid, false); assert.equal(r.dadesRestaurades, null);
});

test('O8-PORT-09 · un surrogat solitari o un esquema no primitiu a la importació donen valid:false, no una excepció', async () => {
  const { claus, paquet } = await paquetDeProva();
  const opcions = { publicKeyJwk: claus.publicKeyJwk };
  const surrogat = JSON.parse(JSON.stringify(paquet).replace('"titol":"Original"', '"titol":"Orig\\ud800inal"'));
  const r = await importaPaquetSobiraniaMunicipal(surrogat, opcions);
  assert.equal(r.valid, false); assert.equal(r.dadesRestaurades, null);
  assert.ok(r.motius.some((m) => m.includes('JCS')));
  for (const camp of ['schema', 'versioVocabulari']) {
    const hostil = { ...paquet, [camp]: JSON.parse('{"toString":1}') };
    const h = await importaPaquetSobiraniaMunicipal(hostil, opcions);
    assert.equal(h.valid, false, camp); assert.equal(h.dadesRestaurades, null, camp);
    assert.ok(h.motius.some((m) => m.endsWith(': object.')), camp);
  }
});


test('R2F-06 · JCS, signador i verificador rebutgen arrays amb forats abans de signar', async () => {
  const { privateKeyJwk, publicKeyJwk } = clausW3c();
  const opcions = { privateKeyJwk, verificationMethod: W3C_VM, created: W3C_PROOF.created };
  const mig = [1, 2, 3]; delete mig[1];
  const heretat = new Array(1), prototip = Object.create(Array.prototype);
  prototip[0] = 'valor heretat'; Object.setPrototypeOf(heretat, prototip);
  for (const array of [new Array(1), new Array(2), mig, [new Array(1)], heretat]) {
    assert.throws(() => canonitzaJsonJcs({ array }), /JCS no admet arrays amb forats/);
    await assert.rejects(signaObjecteFediversityFep8b32({ ...W3C_DOCUMENT, array }, opcions), /JCS no admet arrays amb forats/);
    const r = await verificaObjecteFediversityFep8b32({ ...W3C_DOCUMENT, array, proof: { ...W3C_PROOF, proofValue: W3C_VALUE } }, { publicKeyJwk, verificationMethodEsperat: W3C_VM });
    assert.equal(r.valid, false);
    assert.equal(r.motiu, 'DOCUMENT_NO_JSON');
  }
  // Un valor null explícit continua sent JSON vàlid i no es confon amb un forat.
  assert.equal(canonitzaJsonJcs({ array: [null, 1] }), '{"array":[null,1]}');
});

test('R11-PORT-01 · la restauració retorna exactament la instantània signada encara que el cridador edite el paquet en vol', async () => {
  const { claus, actorDesti, paquet } = await paquetDeProva();
  const original = structuredClone(paquet);
  const destiMutable = structuredClone(actorDesti);
  const pendent = importaPaquetSobiraniaMunicipal(paquet, { publicKeyJwk: claus.publicKeyJwk, actorDesti: destiMutable });
  paquet.notes[0].titol = 'Edició posterior a la crida';
  paquet.colleccions.followers.push('https://altre.example/actors/nou');
  paquet.municipi = 'Altre municipi';
  paquet.migracioFep7628.target = 'https://altre.example/actors/desti';
  destiMutable.alsoKnownAs.length = 0;
  const r = await pendent;
  assert.equal(r.valid, true);
  assert.equal(r.municipi, original.municipi);
  assert.deepEqual(r.dadesRestaurades.notes, original.notes);
  assert.deepEqual(r.dadesRestaurades.followers, original.colleccions.followers);
  assert.equal(r.dadesRestaurades.migracioFep7628.target, IRI_DESTI);
  assert.equal(r.sha256Paquet, (await verificaObjecteFediversityFep8b32(original, { publicKeyJwk: claus.publicKeyJwk })).sha256Document);
  assert.equal(Object.isFrozen(paquet), false, 'el verificador no congela dades del cridador');
  assert.equal(Object.isFrozen(r.dadesRestaurades.notes[0]), true);
});

test('R11-PORT-02 · les metadades d’una prova vàlida són les comprovades abans de l’espera criptogràfica', async () => {
  const { claus, paquet } = await paquetDeProva();
  const esperades = { verificationMethod: paquet.proof.verificationMethod, created: paquet.proof.created };
  const pendent = verificaObjecteFediversityFep8b32(paquet, {
    publicKeyJwk: claus.publicKeyJwk, verificationMethodEsperat: esperades.verificationMethod,
  });
  paquet.proof.verificationMethod = 'https://altre.example/actors/nou#key';
  paquet.proof.created = '2099-01-01T00:00:00Z';
  const r = await pendent;
  assert.equal(r.valid, true);
  assert.equal(r.verificationMethod, esperades.verificationMethod);
  assert.equal(r.created, esperades.created);
});
