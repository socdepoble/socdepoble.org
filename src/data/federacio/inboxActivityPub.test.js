// @vitest-environment node
/**
 * D05/D07 (pla 261101_1246, carril T3) · Proves de src/data/federacio/inboxActivityPub.js:
 * WebFinger dinàmic, signatures HTTP de veres (node:crypto signa com un
 * servidor remot i WebCrypto verifica), el processador idempotent i el port
 * del magatzem. Les claus es generen en temps d'execució: cap PEM privat al
 * repositori. Cap xarxa: obtenClauPublica i obtenDocument són funcions locals.
 * Casos del kit de Codex 261101 integrats (auditats): consulta alterada,
 * paràmetre repetit, propietari de la clau d'un altre origen, 8 Follow
 * concurrents i Create repetit després d'un Delete sense ressuscitar.
 * Casos de l'àrbitre adversarial (T3-S1, T3-S2, T3-T1): FQDN amb punt final i
 * dominis locals, Announce inclòs amb una autoria falsa, inbox de l'Accept, Undo
 * d'un Announce aliè, Delete de qui va anunciar, sostre RSA i títol tallat.
 * Gauntlet B (seguretat de la inbox): el Create de l'autor sobre un Announce,
 * l'expires no signat, la làpida per propietari, la quota per origen, l'Undo
 * sense actor declarat, el documentActor d'un altre actor i el sostre de la
 * capçalera Signature. Residus del Gauntlet: la quota per host, no per port
 * (B-V1), i el segon anunciador d'una alerta, que no pren la via (B-V2).
 */
import { describe, expect, test } from 'vitest';
import { createHash, createPublicKey, createSign, generateKeyPairSync, sign as signaEd, webcrypto } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FINESTRA_SIGNATURA, MAXIM_COS_INBOX, VIGENCIA_ALERTA_REMOTA_MS, analitzaCapcaleraSignatura, atenPeticioInbox, clauDeDocumentActor,
  creaMagatzemInboxEnMemoria, importaClauPublica, processaActivitatInbox, resolveWebFingerAcct, signaPeticioHttpActivityPub,
  textDHtmlRemot, tipusDAlertaFederada, urlRemota, verificaSignaturaHttpActivityPub,
  MARGE_PURGA_ALERTA_MS, RETENCIO_ACTIVITAT_MS, RETENCIO_LAPIDA_MS, MAXIM_VIGENCIA_ALERTA_MS, hostDeQuota
} from './inboxActivityPub.js';
import { VIGENCIA_ALERTA_MS, tipusDAlerta } from '../../sections/mur/alertesMunicipals.js';

const subtle = webcrypto.subtle;
const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const ORIGEN = 'https://socdepoble.org';
const HOST = 'socdepoble.org';
const TORRE = 'la-torre-de-les-macanes';
const CAMI = `/ap/inbox/${TORRE}`;
const LOCAL = `${ORIGEN}/ap/actors/${TORRE}.json`;
const ARA = Date.UTC(2026, 10, 1, 12, 0, 0);
const HORA = 3_600_000;
const REMOT = 'https://mastodon.example/users/anna';
const KEY = `${REMOT}#main-key`;
const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';

const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const ed = generateKeyPairSync('ed25519');
const pemRsa = rsa.publicKey.export({ type: 'spki', format: 'pem' });
const pemEd = ed.publicKey.export({ type: 'spki', format: 'pem' });
const docActor = (pem) => ({ id: REMOT, type: 'Person', inbox: `${REMOT}/inbox`, publicKey: { id: KEY, owner: REMOT, publicKeyPem: pem } });
const obtenDe = (pem) => async (keyId) => (keyId === KEY ? { clau: clauDeDocumentActor(docActor(pem), keyId), documentActor: docActor(pem) } : null);
const obtenRsa = obtenDe(pemRsa);
const obtenEd = obtenDe(pemEd);
const sha256hex = (text) => createHash('sha256').update(text).digest('hex');
/* Altres comptes remots (Gauntlet B): la mateixa clau RSA de prova, cadascun amb el seu document i el seu keyId. */
const ALTRA = 'https://mastodon.example/users/altra';
const AJUNTAMENT = 'https://mastodon.example/users/ajuntament';
const HOSTIL = 'https://hostil.example/users/x';
const docDe = (id) => ({ id, type: 'Person', inbox: `${id}/inbox`, publicKey: { id: `${id}#main-key`, owner: id, publicKeyPem: pemRsa } });
const obtenComptes = async (keyId) => {
  const id = keyId.slice(0, keyId.indexOf('#'));
  return keyId === `${id}#main-key` ? { clau: clauDeDocumentActor(docDe(id), keyId), documentActor: docDe(id) } : null;
};
const de = (actor) => ({ keyId: `${actor}#main-key` });

/* Una petició signada com la signaria un servidor remot (node:crypto, no el mòdul). */
function peticio(activitat, {
  algorithm = 'rsa-sha256', clau = 'rsa', data = new Date(ARA).toUTCString(), signat = CAMI, rebut = signat,
  noms = '(request-target) host date digest', toca = null, host = HOST, keyId = KEY, created = null, expires = null,
  digest = (d) => d, privada = null
} = {}) {
  const cos = typeof activitat === 'string' ? activitat : JSON.stringify(activitat);
  const capcaleres = { host, date: data, digest: digest(`SHA-256=${createHash('sha256').update(cos).digest('base64')}`), 'content-type': 'application/activity+json' };
  const linia = (n) => (n === '(request-target)' ? `(request-target): post ${signat}`
    : n === '(created)' ? `(created): ${created}` : n === '(expires)' ? `(expires): ${expires}` : `${n}: ${capcaleres[n]}`);
  const cadena = noms.split(' ').map(linia).join('\n');
  const signatura = clau === 'rsa'
    ? createSign('RSA-SHA256').update(cadena).sign(privada ?? rsa.privateKey, 'base64')
    : signaEd(null, Buffer.from(cadena), privada ?? ed.privateKey).toString('base64');
  const temps = `${created !== null ? `,created=${created}` : ''}${expires !== null ? `,expires=${expires}` : ''}`;
  capcaleres.signature = `keyId="${keyId}",algorithm="${algorithm}",headers="${noms}"${temps},signature="${signatura}"`;
  return { metode: 'POST', cami: rebut, capcaleres, cos: toca ? toca(cos) : cos };
}
const verifica = (p, extra = {}) => verificaSignaturaHttpActivityPub({ ...p, obtenClauPublica: obtenRsa, hostEsperat: HOST, ara: ARA, subtle, ...extra });
const follow = { '@context': 'https://www.w3.org/ns/activitystreams', id: `${REMOT}#follows/1`, type: 'Follow', actor: REMOT, object: LOCAL };
const opcions = (magatzem, extra = {}) => ({ origen: ORIGEN, actorsLocals: ['socdepoble', TORRE], obtenClauPublica: obtenRsa, magatzem, ara: ARA, subtle, ...extra });
const confiat = (magatzem, extra = {}) => opcions(magatzem, { nodesDeConfianca: ['https://mastodon.example'], ...extra });

/* base58btc independent (BigInt) per a construir un Multikey Ed25519 (FEP-521a). */
function base58btc(bytes) {
  const alfabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let n = 0n;
  for (const b of bytes) n = n * 256n + BigInt(b);
  let text = '';
  while (n > 0n) { text = alfabet[Number(n % 58n)] + text; n /= 58n; }
  for (const b of bytes) { if (b !== 0) break; text = `1${text}`; }
  return text;
}

describe('WebFinger dinàmic (resolveWebFingerAcct)', () => {
  const municipis = [{ slug: 'socdepoble', perfil: '/projecte' }, { slug: TORRE, alies: ['latorredelesmacanes'] }];
  const resol = (consulta) => resolveWebFingerAcct(consulta, { origen: ORIGEN, municipis });

  test('200: el compte, l’àlies (subject canònic), sense caixa, l’URL de l’actor i el filtre rel', () => {
    const r = resol(`resource=acct:${TORRE}@socdepoble.org`);
    expect(r.status).toBe(200);
    expect(r.capcaleres).toEqual({ 'Content-Type': 'application/jrd+json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    expect(r.cos.subject).toBe(`acct:${TORRE}@socdepoble.org`);
    expect(r.cos.links.find((l) => l.rel === 'self').href).toBe(LOCAL);
    expect(resol('?resource=acct:latorredelesmacanes@socdepoble.org').cos.subject).toBe(`acct:${TORRE}@socdepoble.org`);
    expect(resol('resource=acct:SocDePoble@SocDePoble.org').cos.subject).toBe('acct:socdepoble@socdepoble.org');
    expect(resol(new URLSearchParams({ resource: LOCAL })).status).toBe(200);
    expect(resol(new URL(`${ORIGEN}/.well-known/webfinger?resource=${encodeURIComponent(`acct:${TORRE}@socdepoble.org`)}&rel=self`)).cos.links.map((l) => l.rel)).toEqual(['self']);
  });

  test('400: absent, repetit o malformat (RFC 7033 §4.2); 404: un altre host, un poble de mostra o desconegut', () => {
    for (const consulta of ['', 'rel=self', 'resource=acct:a@b.example&resource=acct:c@d.example', 'resource=invalida', 'resource=acct:sense-arroba']) {
      expect([consulta, resol(consulta).status, resol(consulta).cos]).toEqual([consulta, 400, { error: 'bad_resource' }]);
    }
    /* Kit de Codex: 'invalida' hi esperava 404. Un resource sense esquema és malformat: 400, com el servidor de dev. */
    for (const consulta of [`resource=acct:${TORRE}@sella.example`, 'resource=acct:sella@socdepoble.org', 'resource=acct:ningu@socdepoble.org']) {
      expect([consulta, resol(consulta).status, resol(consulta).cos]).toEqual([consulta, 404, { error: 'not_found' }]);
    }
  });
});

describe('capçalera Signature (analitzaCapcaleraSignatura)', () => {
  test('els paràmetres i els valors per defecte de Mastodon', () => {
    expect(analitzaCapcaleraSignatura('keyId="https://a.example/k",algorithm="rsa-sha256",headers="(request-target) Host",signature="YWJj"'))
      .toEqual({ keyId: 'https://a.example/k', algorithm: 'rsa-sha256', headers: ['(request-target)', 'host'], signature: 'YWJj', created: null, expires: null });
    expect(analitzaCapcaleraSignatura('keyId="k", signature="YWJj", created=1798804800').algorithm).toBe('hs2019');
    expect(analitzaCapcaleraSignatura('keyId="k",signature="YWJj"').headers).toEqual(['(created)']);
    expect(analitzaCapcaleraSignatura('keyId="k",algorithm="rsa-sha256",signature="YWJj"').headers).toEqual(['date']);
    expect(analitzaCapcaleraSignatura('keyId="k",signature="YWJj",created=17,expires=18')).toMatchObject({ created: 17, expires: 18 });
  });

  test('malformades: paràmetre repetit, sense separador, valor no numèric, massa paràmetres, base64 o capçaleres dolentes', () => {
    for (const dolenta of [
      'keyId="a",keyId="b",signature="YWJj"', 'keyId="a"signature="YWJj"', 'keyId="a"Xsignature="YWJj"', 'keyId="a" ;signature="YWJj"', 'keyId="a",signature="YWJj",created=ara',
      'keyId="a",signature="YWJj",created="1e3"', 'keyId="a",signature="YWJ"', 'keyId="a",signature="YW!j"',
      'keyId="a",headers="date date",signature="YWJj"', 'keyId="a",headers="date x_y",signature="YWJj"', 'keyId="a",signature="YWJj",x="1",y="2",z="3",w="4",v="5",u="6",t="7"',
      'keyId="a",signature="YWJj', 'signature="YWJj"', '', `keyId="${'a'.repeat(5000)}"`, null
    ]) expect([dolenta, analitzaCapcaleraSignatura(dolenta)]).toEqual([dolenta, null]);
  });

  test('lineal: entrades patològiques fins al límit i de 100.000 caràcters, en menys de 50 ms', () => {
    for (const entrada of ['a'.repeat(4090), ','.repeat(4096), `keyId="${'a'.repeat(4080)}`, 'k='.repeat(2048), `keyId=${'1'.repeat(4000)}`, 'x'.repeat(100_000)]) {
      const inici = performance.now();
      expect(analitzaCapcaleraSignatura(entrada)).toBe(null);
      expect(performance.now() - inici).toBeLessThan(50);
    }
  });

  test('Gauntlet B T3-V3: el sostre de 4096 caràcters, amb una capçalera per la resta vàlida', async () => {
    const p = peticio(follow);
    const original = p.capcaleres.signature;
    // Un paràmetre desconegut (s'ignora i no es signa) farcix la capçalera fins a `total` caràcters.
    const farcida = (total) => `${original},nota="${'x'.repeat(total - original.length - ',nota=""'.length)}"`;
    expect(farcida(4096)).toHaveLength(4096);
    expect(analitzaCapcaleraSignatura(farcida(4096))).toMatchObject({ keyId: KEY, algorithm: 'rsa-sha256' });
    expect(analitzaCapcaleraSignatura(farcida(4097))).toBe(null);
    const amb = (total) => verifica({ ...p, capcaleres: { ...p.capcaleres, signature: farcida(total) } });
    expect((await amb(4096)).valida).toBe(true);
    expect(await amb(4097)).toEqual({ valida: false, motiu: 'signature_malformed' });
  });
});

describe('signatures HTTP (verificaSignaturaHttpActivityPub)', () => {
  test('RSA (rsa-sha256, hs2019) i Ed25519 (hs2019, ed25519) signades amb node:crypto es verifiquen amb WebCrypto', async () => {
    for (const [algorithm, clau, obten] of [['rsa-sha256', 'rsa', obtenRsa], ['hs2019', 'rsa', obtenRsa], ['hs2019', 'ed', obtenEd], ['ed25519', 'ed', obtenEd]]) {
      const r = await verifica(peticio(follow, { algorithm, clau }), { obtenClauPublica: obten });
      expect([algorithm, clau, r.valida, r.motiu]).toEqual([algorithm, clau, true, undefined]);
      expect(r).toMatchObject({ keyId: KEY, actor: REMOT, algorisme: algorithm });
      expect(r.documentActor.inbox).toBe(`${REMOT}/inbox`);
    }
  });

  test('hs2019 amb (created) i (expires) i sense Date; rsa-sha256 no admet pseudocapçaleres de temps', async () => {
    const created = ARA / 1000 - 10;
    const noms = '(request-target) host (created) (expires) digest';
    for (const [clau, obten] of [['rsa', obtenRsa], ['ed', obtenEd]]) {
      const p = peticio(follow, { algorithm: 'hs2019', clau, noms, created, expires: created + 300 });
      delete p.capcaleres.date;
      expect((await verifica(p, { obtenClauPublica: obten })).valida).toBe(true);
    }
    const vella = peticio(follow, { algorithm: 'hs2019', noms, created: ARA / 1000 - 7200, expires: ARA / 1000 - 7140 });
    expect(await verifica(vella)).toEqual({ valida: false, motiu: 'date_out_of_window' });
    expect(await verifica(peticio(follow, { noms, created, expires: created + 300 }))).toEqual({ valida: false, motiu: 'signature_malformed' });
  });

  test('la finestra de Mastodon: 5 min de vigència i 1 h de marge, mai més de 12 h', async () => {
    const amb = (desfase) => verifica(peticio(follow, { data: new Date(ARA + desfase).toUTCString() }));
    for (const desfase of [-65 * 60_000, -HORA, 0, HORA]) expect([desfase, (await amb(desfase)).valida]).toEqual([desfase, true]);
    for (const desfase of [-66 * 60_000, -2 * HORA, HORA + 60_000, 2 * HORA]) expect([desfase, await amb(desfase)]).toEqual([desfase, { valida: false, motiu: 'date_out_of_window' }]);
    expect(FINESTRA_SIGNATURA).toEqual({ caducitatMs: 300_000, maximMs: 43_200_000, margeMs: 3_600_000 });
    const llarga = peticio(follow, { algorithm: 'hs2019', noms: '(request-target) host (created) (expires) digest', created: ARA / 1000 - 14 * 3600, expires: ARA / 1000 + 3600 });
    expect(await verifica(llarga)).toEqual({ valida: false, motiu: 'date_out_of_window' });
  });

  test('Gauntlet B SEG-02: un expires no signat no allarga la finestra; un (expires) signat sí que hi mana', async () => {
    const tard = ARA + 6 * HORA;
    const fins = Math.floor((ARA + 12 * HORA) / 1000);
    // La petició capturada, reproduïda a +6 h amb `,expires=` afegit per qui la reenvia.
    const capturada = peticio(follow);
    const replica = { ...capturada, capcaleres: { ...capturada.capcaleres, signature: `${capturada.capcaleres.signature},expires=${fins}` } };
    expect(await verifica(capturada, { ara: tard })).toEqual({ valida: false, motiu: 'date_out_of_window' });
    expect(await verifica(replica, { ara: tard })).toEqual({ valida: false, motiu: 'date_out_of_window' });
    const resposta = await atenPeticioInbox(replica, opcions(creaMagatzemInboxEnMemoria(), { ara: tard }));
    expect([resposta.status, resposta.cos]).toEqual([401, { error: 'date_out_of_window' }]);
    // hs2019: amb (created) signat i expires solt, igual; amb (expires) signat, la finestra s'allarga fins a 12 h.
    const created = ARA / 1000;
    const solt = peticio(follow, { algorithm: 'hs2019', noms: '(request-target) host (created) digest', created, expires: fins });
    expect(await verifica(solt, { ara: tard })).toEqual({ valida: false, motiu: 'date_out_of_window' });
    const signat = peticio(follow, { algorithm: 'hs2019', noms: '(request-target) host (created) (expires) digest', created, expires: fins });
    expect((await verifica(signat, { ara: tard })).valida).toBe(true);
  });

  test('mutants: cada manipulació té el seu motiu, i obtenClauPublica no es crida si falla el que és local', async () => {
    let crides = 0;
    const comptada = async (keyId) => { crides += 1; return obtenRsa(keyId); };
    const sensDigest = peticio(follow);
    delete sensDigest.capcaleres.digest;
    const sensSignatura = peticio(follow);
    delete sensSignatura.capcaleres.signature;
    const casos = [
      [peticio(follow, { toca: (c) => c.replace('anna', 'anne') }), 'digest_mismatch'],
      [sensDigest, 'digest_missing'],
      [sensSignatura, 'signature_missing'],
      [peticio(follow, { data: '2026-11-01T12:00:00Z' }), 'date_invalid'],
      [peticio(follow, { data: new Date(ARA - 2 * HORA).toUTCString() }), 'date_out_of_window'],
      [peticio(follow, { noms: '(request-target) host date' }), 'headers_insufficient'],
      [peticio(follow, { noms: '(request-target) date digest' }), 'headers_insufficient'],
      [peticio(follow, { noms: 'host date digest' }), 'headers_insufficient'],
      [peticio(follow, { noms: '(request-target) host digest' }), 'headers_insufficient'],
      [peticio(follow, { algorithm: 'rsa-sha1' }), 'algorithm_unsupported'],
      [peticio(follow, { host: 'altre.example' }), 'host_mismatch']
    ];
    for (const [p, motiu] of casos) expect([motiu, await verifica(p, { obtenClauPublica: comptada })]).toEqual([motiu, { valida: false, motiu }]);
    expect(crides).toBe(0);
    // Diversos algorismes al Digest i el nom en minúscules (Mastodon en llig el sha-256).
    expect((await verifica(peticio(follow, { digest: (d) => `SHA-512=YWJj, sha-256=${d.slice(8)}` }))).valida).toBe(true);
  });

  test('el camí signat i la consulta: un altre camí o una consulta afegida no verifiquen', async () => {
    expect(await verifica(peticio(follow, { signat: '/ap/inbox/socdepoble', rebut: CAMI }))).toEqual({ valida: false, motiu: 'signature_invalid' });
    const ambConsulta = `${CAMI}?via=prova`;
    expect((await verifica(peticio(follow, { signat: ambConsulta }))).valida).toBe(true);
    // El cos com a ArrayBuffer (Deno.serve) o Buffer: els mateixos bytes, la mateixa verificació.
    const p = peticio(follow);
    expect((await verifica({ ...p, cos: new TextEncoder().encode(p.cos).buffer })).valida).toBe(true);
    expect((await verifica({ ...p, cos: Buffer.from(p.cos) })).valida).toBe(true);
    expect(await verifica(peticio(follow, { signat: ambConsulta, rebut: `${ambConsulta}&x=1` }))).toEqual({ valida: false, motiu: 'signature_invalid' });
  });

  test('la clau: la del keyId, d’un propietari del mateix origen, RSA ≥ 2048 o Ed25519 i del tipus que diu l’algorisme', async () => {
    const p = peticio(follow);
    const amb = (clau) => verifica(p, { obtenClauPublica: async () => ({ clau }) });
    expect(await verifica(p, { obtenClauPublica: async () => null })).toEqual({ valida: false, motiu: 'key_not_found' });
    expect(await verifica(p, { obtenClauPublica: async () => { throw new Error('xarxa'); } })).toEqual({ valida: false, motiu: 'key_not_found' });
    // Kit de Codex: una clau que diu ser d'un actor d'un altre servidor.
    expect(await amb({ id: KEY, owner: 'https://intrus.example/actor', publicKeyPem: pemRsa })).toEqual({ valida: false, motiu: 'key_not_found' });
    expect(await amb({ id: `${KEY}2`, owner: REMOT, publicKeyPem: pemRsa })).toEqual({ valida: false, motiu: 'key_not_found' });
    expect(await amb({ id: KEY, owner: REMOT, publicKeyPem: rsa.publicKey.export({ type: 'pkcs1', format: 'pem' }) })).toEqual({ valida: false, motiu: 'key_unsupported' });
    const feble = generateKeyPairSync('rsa', { modulusLength: 1024 });
    const ambFeble = peticio(follow, { privada: feble.privateKey });
    expect(await verifica(ambFeble, { obtenClauPublica: async () => ({ clau: { id: KEY, owner: REMOT, publicKeyPem: feble.publicKey.export({ type: 'spki', format: 'pem' }) } }) }))
      .toEqual({ valida: false, motiu: 'key_unsupported' });
    // El sostre de 8192 bits (àrbitre T3-T1): un mòdul de 8192 bits s'importa i un de 8200, no (JWK sense primers: només es llig la mida).
    const rsaDe = (bytes) => ({ publicKeyPem: createPublicKey({ key: { kty: 'RSA', n: Buffer.alloc(bytes, 0xff).toString('base64url'), e: 'AQAB' }, format: 'jwk' }).export({ type: 'spki', format: 'pem' }) });
    expect((await importaClauPublica(rsaDe(1024), { subtle }))?.tipus).toBe('rsa');
    expect(await importaClauPublica(rsaDe(1025), { subtle })).toBe(null);
    expect(await verifica(peticio(follow, { algorithm: 'ed25519' }))).toEqual({ valida: false, motiu: 'key_unsupported' });
    expect(await verifica(peticio(follow, { clau: 'ed' }), { obtenClauPublica: obtenEd })).toEqual({ valida: false, motiu: 'key_unsupported' });
    expect(await verifica(peticio(follow, { clau: 'ed', algorithm: 'hs2019' }))).toEqual({ valida: false, motiu: 'signature_invalid' });
    // Àrbitre T3-S1: el punt final del FQDN i els dominis locals tampoc arriben a obtenClauPublica.
    for (const keyId of ['http://mastodon.example/users/anna#main-key', 'https://10.0.0.1/k', 'https://localhost/k', 'https://intranet/k',
      'https://localhost.:8080/admin#k', 'https://foo.localhost./k', 'https://nas.local/k']) {
      let crides = 0;
      expect(await verifica(peticio(follow, { keyId }), { obtenClauPublica: async () => { crides += 1; return null; } })).toEqual({ valida: false, motiu: 'key_not_found' });
      expect([keyId, crides]).toEqual([keyId, 0]);
    }
  });

  test('Gauntlet B T3-V2: documentActor és null si el document obtingut és d’un altre actor', async () => {
    const altra = { ...docActor(pemRsa), id: ALTRA, inbox: `${ALTRA}/inbox` };
    const r = await verifica(peticio(follow), { obtenClauPublica: async (k) => ({ clau: clauDeDocumentActor(docActor(pemRsa), k), documentActor: altra }) });
    expect(r).toEqual({ valida: true, keyId: KEY, actor: REMOT, algorisme: 'rsa-sha256', documentActor: null });
    // Control: el document del mateix actor sí que torna.
    expect((await verifica(peticio(follow))).documentActor).toEqual(docActor(pemRsa));
  });

  test('Multikey Ed25519 (FEP-521a) a assertionMethod, i clauDeDocumentActor només amb el propietari', async () => {
    const crua = Buffer.from(ed.publicKey.export({ format: 'jwk' }).x, 'base64url');
    const multibase = `z${base58btc([0xed, 0x01, ...crua])}`;
    const keyId = `${REMOT}#clau-ed`;
    const perfil = { id: REMOT, assertionMethod: [{ id: keyId, type: 'Multikey', controller: REMOT, publicKeyMultibase: multibase }] };
    const clau = clauDeDocumentActor(perfil, keyId);
    expect(clau).toEqual({ id: keyId, owner: REMOT, publicKeyMultibase: multibase });
    expect((await importaClauPublica(clau, { subtle })).tipus).toBe('ed25519');
    expect((await verifica(peticio(follow, { clau: 'ed', algorithm: 'hs2019', keyId }), { obtenClauPublica: async () => ({ clau }) })).valida).toBe(true);
    expect(await importaClauPublica({ publicKeyMultibase: `z${base58btc([0x12, 0x00, ...crua])}` }, { subtle })).toBe(null);
    expect(await importaClauPublica({ publicKeyMultibase: 'z0OIl' }, { subtle })).toBe(null);
    expect(clauDeDocumentActor({ ...perfil, assertionMethod: [{ ...perfil.assertionMethod[0], controller: 'https://intrus.example/x' }] }, keyId)).toBe(null);
    expect(clauDeDocumentActor({ ...perfil, assertionMethod: [{ ...perfil.assertionMethod[0], type: 'JsonWebKey2020' }] }, keyId)).toBe(null);
    expect(clauDeDocumentActor({ id: REMOT, publicKey: [{ id: 'x' }, { id: KEY, owner: REMOT, publicKeyPem: pemRsa }] }, KEY)).toEqual({ id: KEY, owner: REMOT, publicKeyPem: pemRsa });
    expect(clauDeDocumentActor({ id: REMOT, publicKey: { id: KEY, owner: 'https://mastodon.example/users/altra', publicKeyPem: pemRsa } }, KEY)).toBe(null);
    expect(clauDeDocumentActor({ id: 'http://mastodon.example/users/anna', publicKey: { id: KEY, publicKeyPem: pemRsa } }, KEY)).toBe(null);
  });

  test('signaPeticioHttpActivityPub ↔ verificaSignaturaHttpActivityPub (WebCrypto ↔ WebCrypto), RSA i Ed25519, amb consulta', async () => {
    const cos = JSON.stringify(follow);
    for (const algorisme of [{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, { name: 'Ed25519' }]) {
      const parell = await subtle.generateKey(algorisme, true, ['sign', 'verify']);
      const spki = Buffer.from(await subtle.exportKey('spki', parell.publicKey)).toString('base64');
      const pem = `-----BEGIN PUBLIC KEY-----\n${spki.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----\n`;
      const capcaleres = await signaPeticioHttpActivityPub({ url: `https://socdepoble.org${CAMI}?via=prova`, cos, keyId: KEY, clauPrivada: parell.privateKey, ara: ARA, subtle });
      expect(capcaleres.date).toBe('Sun, 01 Nov 2026 12:00:00 GMT');
      expect(capcaleres.signature).toContain(`algorithm="${algorisme.name === 'Ed25519' ? 'hs2019' : 'rsa-sha256'}"`);
      const r = await verificaSignaturaHttpActivityPub({
        metode: 'POST', cami: `${CAMI}?via=prova`, capcaleres, cos, obtenClauPublica: async () => ({ clau: { id: KEY, owner: REMOT, publicKeyPem: pem } }), hostEsperat: HOST, ara: ARA, subtle
      });
      expect([algorisme.name, r.valida, r.motiu]).toEqual([algorisme.name, true, undefined]);
    }
    await expect(signaPeticioHttpActivityPub({ url: `${ORIGEN}${CAMI}`, keyId: KEY, clauPrivada: {}, subtle })).rejects.toThrow(TypeError);
    await expect(signaPeticioHttpActivityPub({ url: 'http://socdepoble.org/x', keyId: KEY, clauPrivada: { algorithm: { name: 'Ed25519' } }, ara: ARA, subtle })).rejects.toThrow(TypeError);
    await expect(verificaSignaturaHttpActivityPub({ ...peticio(follow), obtenClauPublica: obtenRsa, subtle })).rejects.toThrow(/ara/);
  });

  test('urlRemota: https públic, sense credencials, loopback, IP literal, host sense punt, punt final ni domini local', () => {
    // Precisió: el domini local s'ha de casar per etiquetes senceres, no per sufix de text.
    for (const bona of ['https://mastodon.example/users/anna', 'https://localhost.example/x', 'https://local.example/x', 'https://internal.example/x', 'https://a.myhome.arpa/x', 'https://festes.glocal/x']) {
      expect([bona, urlRemota(bona)?.href]).toEqual([bona, bona]);
    }
    for (const dolenta of ['http://a.example/x', 'https://u:p@a.example/x', 'https://127.0.0.1/x', 'https://[::1]/x', 'https://a.localhost/x', 'https://intranet/x', 'nope', `https://a.example/${'x'.repeat(2100)}`, 7,
      // Àrbitre T3-S1: el FQDN amb punt final (https://localhost./ passava) i els dominis de la xarxa local.
      'https://localhost./k', 'https://LOCALHOST./k', 'https://foo.localhost./k', 'https://mastodon.example./x', 'https://127.0.0.1./k', 'https://0x7f.0.0.1/k', 'https://2130706433/k',
      'https://nas.local/x', 'https://svc.internal/x', 'https://router.home.arpa/x', 'https://pc.localdomain/x', 'https://localdomain/x']) {
      expect([dolenta, urlRemota(dolenta)]).toEqual([dolenta, null]);
    }
  });

  test('B5 (ARB-M13-03) · urlRemota només admet la forma que accepten les CHECK de la migració', () => {
    // L'esquema literal, el host LDH de 253 com a molt, i de 12 a 2048 caràcters també després de normalitzar.
    const etiqueta = 'a'.repeat(63);
    for (const dolenta of ['HTTPS://mastodon.example/x', 'Https://mastodon.example/x', ' https://mastodon.example/x', '\thttps://mastodon.example/x',
      'https://a_b.example/x', 'https://a*b.example/x', "https://a'b.example/x", `https://${etiqueta}.${etiqueta}.${etiqueta}.${etiqueta}.example/x`,
      'https://a.b', `https://a.example/${'é'.repeat(700)}`]) {
      expect([dolenta, urlRemota(dolenta)]).toEqual([dolenta, null]);
    }
    // El parser encara normalitza el que la CHECK no mira: la caixa del host i la barra final.
    expect(urlRemota('https://a.bc')?.href).toBe('https://a.bc/');
    expect(urlRemota('https://Mastodon.Example/users/anna')?.href).toBe('https://mastodon.example/users/anna');
    expect(urlRemota(`https://a.example/${'x'.repeat(2030)}`)?.href).toHaveLength(2048);
  });

  test('B5 (ARB-M13-03) · una activitat amb l’id o l’actor en una forma que l’SQL rebutja és 4xx sense tocar el magatzem, no 503', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    const base = { slug: TORRE, origen: ORIGEN, actorsLocals: [TORRE], documentActor: docActor(pemRsa), magatzem, ara: ARA, subtle };
    const borra = { type: 'Delete', actor: REMOT, object: 'https://mastodon.example/n/1' };
    const id = await processaActivitatInbox({ ...borra, id: 'HTTPS://mastodon.example/users/anna#delete/1' }, { ...base, signant: { actor: REMOT } });
    expect([id.estat, id.motiu, id.http]).toEqual(['rebutjada', 'activity_id_invalid', 400]);
    const actor = 'https://mastodon_x.example/users/anna';
    const ambHost = await processaActivitatInbox({ ...borra, id: `${actor}#delete/1`, actor, object: `${actor}/n/1` }, { ...base, signant: { actor } });
    expect([ambHost.estat, ambHost.http]).toEqual(['rebutjada', 403]);
    expect(magatzem.instantania().activitats).toEqual([]);
  });
});

describe('inbox: Follow → Accept, Undo i frontera HTTP (atenPeticioInbox)', () => {
  test('Follow → Accept determinista cap a l’inbox de l’actor; la repetició torna el mateix Accept', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    const r1 = await atenPeticioInbox(peticio(follow), opcions(magatzem));
    expect([r1.status, r1.cos]).toEqual([202, { estat: 'processada' }]);
    expect(r1.lliuraments).toHaveLength(1);
    const { inbox, activitat: accept } = r1.lliuraments[0];
    expect(inbox).toBe(`${REMOT}/inbox`);
    expect(accept).toEqual({
      '@context': 'https://www.w3.org/ns/activitystreams', id: `${LOCAL}#accepts/${sha256hex(follow.id).slice(0, 32)}`,
      type: 'Accept', actor: LOCAL, to: [REMOT], object: { id: follow.id, type: 'Follow', actor: REMOT, object: LOCAL }
    });
    const r2 = await atenPeticioInbox(peticio(follow), opcions(magatzem));
    expect([r2.status, r2.cos]).toEqual([202, { estat: 'duplicada' }]);
    expect(r2.lliuraments).toEqual(r1.lliuraments);
    expect(magatzem.instantania().seguidors).toEqual([{ slug: TORRE, actor: REMOT, inbox: `${REMOT}/inbox`, followId: follow.id, acceptId: accept.id, des: new Date(ARA).toISOString() }]);
  });

  test('kit de Codex: 8 lliuraments concurrents del mateix Follow, un de processat i 7 de duplicats amb el mateix Accept', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    const nou = { ...follow, id: `${REMOT}#follows/2` };
    const resultats = await Promise.all(Array.from({ length: 8 }, () => atenPeticioInbox(peticio(nou), opcions(magatzem))));
    expect(resultats.map((r) => r.cos.estat).sort()).toEqual(['duplicada', ...Array(6).fill('duplicada'), 'processada'].sort());
    expect(new Set(resultats.map((r) => r.lliuraments[0].activitat.id)).size).toBe(1);
    expect(magatzem.instantania().seguidors).toHaveLength(1);
    expect(magatzem.instantania().activitats).toEqual([nou.id]);
  });

  test('un Follow nou d’un seguidor existent actualitza el followId; Undo(Follow) el retira; autoria i objecte comprovats', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    await atenPeticioInbox(peticio(follow), opcions(magatzem));
    const altre = { ...follow, id: `${REMOT}#follows/3` };
    const r = await processaActivitatInbox(altre, { slug: TORRE, origen: ORIGEN, actorsLocals: [TORRE], signant: { actor: REMOT }, documentActor: docActor(pemRsa), magatzem, ara: ARA + 1000, subtle });
    expect(r.efectes).toEqual([{ tipus: 'seguidor_existent', actor: REMOT }]);
    expect(magatzem.instantania().seguidors.map((s) => [s.followId, s.des])).toEqual([[altre.id, new Date(ARA).toISOString()]]);
    const undo = (objecte, id = `${REMOT}#undo/1`) => peticio({ id, type: 'Undo', actor: REMOT, object: objecte });
    expect((await atenPeticioInbox(undo({ id: altre.id, type: 'Follow', actor: 'https://mastodon.example/users/altra', object: LOCAL }), opcions(magatzem))).status).toBe(403);
    expect((await atenPeticioInbox(undo({ id: altre.id, type: 'Follow', actor: REMOT, object: `${ORIGEN}/ap/actors/socdepoble.json` }), opcions(magatzem))).status).toBe(403);
    expect((await atenPeticioInbox(undo({ id: follow.id, type: 'Follow', actor: REMOT, object: LOCAL }), opcions(magatzem))).cos).toEqual({ estat: 'ignorada', motiu: 'nothing_to_undo' });
    expect((await atenPeticioInbox(undo({ id: altre.id, type: 'Follow', actor: REMOT, object: LOCAL }, `${REMOT}#undo/2`), opcions(magatzem))).cos).toEqual({ estat: 'processada' });
    expect(magatzem.instantania().seguidors).toEqual([]);
    // Undo amb només l'id (sense objecte): també retira el seguiment.
    await atenPeticioInbox(peticio({ ...follow, id: `${REMOT}#follows/4` }), opcions(magatzem));
    expect((await atenPeticioInbox(undo(`${REMOT}#follows/4`, `${REMOT}#undo/3`), opcions(magatzem))).cos).toEqual({ estat: 'processada' });
    expect((await atenPeticioInbox(undo({ id: 'https://mastodon.example/x', type: 'Like' }, `${REMOT}#undo/4`), opcions(magatzem))).cos).toEqual({ estat: 'ignorada', motiu: 'type_unsupported' });
  });

  test('Follow d’un altre actor local, sense inbox remota o a una inbox de mostra: cap seguidor', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    expect((await atenPeticioInbox(peticio({ ...follow, id: `${REMOT}#f/a`, object: `${ORIGEN}/ap/actors/socdepoble.json` }), opcions(magatzem))).cos).toEqual({ estat: 'rebutjada', motiu: 'follow_target_mismatch' });
    const senseDoc = await atenPeticioInbox(peticio({ ...follow, id: `${REMOT}#f/b` }), opcions(magatzem, { obtenClauPublica: async (k) => ({ clau: (await obtenRsa(k)).clau }) }));
    expect([senseDoc.status, senseDoc.cos, senseDoc.lliuraments]).toEqual([202, { estat: 'ignorada', motiu: 'actor_without_inbox' }, []]);
    // No es reclama: el mateix Follow, quan ja hi ha el document de l'actor, es processa.
    expect((await atenPeticioInbox(peticio({ ...follow, id: `${REMOT}#f/b` }), opcions(magatzem))).cos).toEqual({ estat: 'processada' });
    expect((await atenPeticioInbox({ ...peticio(follow), cami: '/ap/inbox/sella' }, opcions(magatzem))).status).toBe(404);
    expect((await atenPeticioInbox({ ...peticio(follow), cami: '/ap/inbox/../socdepoble' }, opcions(magatzem))).status).toBe(404);
  });

  test('àrbitre T3-T1: l’Accept només va a l’inbox https pública del document del MATEIX actor', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    const amb = (documentActor, n) => processaActivitatInbox({ ...follow, id: `${REMOT}#f/doc${n}` }, {
      slug: TORRE, origen: ORIGEN, actorsLocals: [TORRE], signant: { actor: REMOT }, documentActor, magatzem, ara: ARA, subtle
    });
    const altra = 'https://mastodon.example/users/altra';
    const dolents = [
      { ...docActor(pemRsa), id: altra, inbox: `${altra}/inbox` },
      { ...docActor(pemRsa), inbox: 'http://mastodon.example/users/anna/inbox' },
      { ...docActor(pemRsa), inbox: 'https://localhost./inbox' },
      { ...docActor(pemRsa), inbox: 'https://nas.local/inbox' },
      { ...docActor(pemRsa), inbox: 7 }
    ];
    for (const [n, documentActor] of dolents.entries()) {
      expect([n, await amb(documentActor, n)]).toEqual([n, { estat: 'ignorada', motiu: 'actor_without_inbox', http: 202, efectes: [], lliuraments: [] }]);
    }
    expect(magatzem.instantania()).toMatchObject({ activitats: [], seguidors: [] });
    expect((await amb(docActor(pemRsa), 'bo')).lliuraments.map((l) => l.inbox)).toEqual([`${REMOT}/inbox`]);
  });

  test('frontera HTTP: 405, 415, 413, 401, 403, 400 i 202, sense cap efecte quan no toca', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    const get = await atenPeticioInbox({ ...peticio(follow), metode: 'GET' }, opcions(magatzem));
    expect([get.status, get.capcaleres.Allow]).toEqual([405, 'POST']);
    const pla = peticio(follow);
    expect((await atenPeticioInbox({ ...pla, capcaleres: { ...pla.capcaleres, 'content-type': 'text/plain' } }, opcions(magatzem))).status).toBe(415);
    expect((await atenPeticioInbox({ ...pla, capcaleres: { ...pla.capcaleres, 'content-type': 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"' } }, opcions(magatzem))).status).toBe(202);
    let crides = 0;
    const gran = await atenPeticioInbox(peticio({ ...follow, farcit: 'x'.repeat(MAXIM_COS_INBOX) }), opcions(magatzem, { obtenClauPublica: async () => { crides += 1; return null; } }));
    expect([gran.status, gran.cos, crides]).toEqual([413, { error: 'payload_too_large' }, 0]);
    const sensSignatura = peticio(follow);
    delete sensSignatura.capcaleres.signature;
    expect((await atenPeticioInbox(sensSignatura, opcions(magatzem))).cos).toEqual({ error: 'signature_missing' });
    const altre = await atenPeticioInbox(peticio({ ...follow, id: 'https://altre.example/f/1', actor: 'https://altre.example/users/x' }), opcions(magatzem));
    expect([altre.status, altre.cos]).toEqual([401, { estat: 'rebutjada', motiu: 'actor_mismatch' }]);
    // Una clau del nostre origen no pot parlar en nom d'un actor local.
    const nostra = `${ORIGEN}/ap/actors/socdepoble.json`;
    const suplantada = await atenPeticioInbox(peticio({ ...follow, id: `${nostra}#f`, actor: nostra }, { keyId: `${nostra}#main-key` }),
      opcions(magatzem, { obtenClauPublica: async (k) => ({ clau: { id: k, owner: nostra, publicKeyPem: pemRsa } }) }));
    expect([suplantada.status, suplantada.cos]).toEqual([403, { estat: 'rebutjada', motiu: 'origin_spoofed' }]);
    expect((await atenPeticioInbox(peticio({ ...follow, id: 'https://altre.example/f/2' }), opcions(magatzem))).cos).toEqual({ estat: 'rebutjada', motiu: 'activity_id_invalid' });
    expect((await atenPeticioInbox(peticio('{no és json'), opcions(magatzem))).cos).toEqual({ error: 'invalid_json' });
    expect((await atenPeticioInbox(peticio('[1,2]'), opcions(magatzem))).cos).toEqual({ estat: 'rebutjada', motiu: 'invalid_activity' });
    expect((await atenPeticioInbox(peticio({ id: `${REMOT}#like/1`, type: 'Like', actor: REMOT, object: LOCAL }), opcions(magatzem))).cos).toEqual({ estat: 'ignorada', motiu: 'type_unsupported' });
    // Amb consulta al camí: la ruta la llig sense consulta, i la signatura amb.
    expect((await atenPeticioInbox(peticio({ ...follow, id: `${REMOT}#f/q` }, { signat: `${CAMI}?via=prova` }), opcions(magatzem))).cos).toEqual({ estat: 'processada' });
    expect(magatzem.instantania().activitats).toEqual([follow.id, `${REMOT}#f/q`].sort());
  });

  test('un efecte que falla allibera la reclamació: el reintent es processa', async () => {
    // Amb una quota d'1 per origen, el reintent només entra si l'alliberament també torna la quota.
    const base = creaMagatzemInboxEnMemoria({ maximPerOrigen: 1 });
    let falla = true;
    const magatzem = { ...base, instantania: base.instantania, async desaSeguidor(s) { if (falla) { falla = false; throw new Error('BD caiguda'); } return base.desaSeguidor(s); } };
    await expect(atenPeticioInbox(peticio(follow), opcions(magatzem))).rejects.toThrow('BD caiguda');
    expect(base.instantania().activitats).toEqual([]);
    expect((await atenPeticioInbox(peticio(follow), opcions(magatzem))).cos).toEqual({ estat: 'processada' });
  });
});

describe('alertes municipals federades (Create, Announce, Delete)', () => {
  const alerta = {
    id: 'https://mastodon.example/objects/1', type: 'Note', attributedTo: REMOT, published: '2026-11-01T11:00:00Z', to: [PUBLIC],
    content: '<p>Tall de la <b>CV-780</b> &amp; pluges &#x2014; &#x41;vís</p>', url: 'https://mastodon.example/@anna/1',
    tag: [{ type: 'Hashtag', name: '#AlertaMunicipal', href: 'https://mastodon.example/tags/alertamunicipal' }]
  };
  const create = (objecte, id) => ({ id, type: 'Create', actor: REMOT, to: [PUBLIC], object: objecte });

  test('fallada tancada: sense nodesDeConfianca, cap alerta; d’un node de confiança, en text pla i amb la vigència del Mur', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    expect((await atenPeticioInbox(peticio(create(alerta, 'https://mastodon.example/a/1')), opcions(magatzem))).cos).toEqual({ estat: 'ignorada', motiu: 'not_trusted' });
    expect(magatzem.instantania().activitats).toEqual([]);
    expect((await atenPeticioInbox(peticio(create(alerta, 'https://mastodon.example/a/2')), confiat(magatzem))).cos).toEqual({ estat: 'processada' });
    expect(magatzem.instantania().alertes).toEqual([{
      id: alerta.id, actor: REMOT, via: null, activitat: 'https://mastodon.example/a/2', tipus: 'alerta', url: alerta.url, nom: '',
      text: 'Tall de la CV-780 & pluges — Avís', publicat: '2026-11-01T11:00:00Z', caduca: '2026-11-04T11:00:00.000Z', rebuda: new Date(ARA).toISOString()
    }]);
    expect(VIGENCIA_ALERTA_REMOTA_MS).toBe(VIGENCIA_ALERTA_MS);
    expect((await atenPeticioInbox(peticio(create(alerta, 'https://mastodon.example/a/2')), confiat(magatzem))).cos).toEqual({ estat: 'duplicada' });
    expect(await magatzem.llistaAlertesVigents(ARA)).toHaveLength(1);
    expect(await magatzem.llistaAlertesVigents(Date.parse('2026-11-04T11:00:00Z'))).toEqual([]);
  });

  test('vigència: endTime fins a 30 dies, una data futura compta des de la recepció; bàndol urgent', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    const casos = [
      [{ ...alerta, id: 'https://mastodon.example/objects/e1', endTime: '2026-11-02T11:00:00Z' }, '2026-11-02T11:00:00.000Z'],
      [{ ...alerta, id: 'https://mastodon.example/objects/e2', endTime: '2027-02-01T00:00:00Z' }, '2026-12-01T11:00:00.000Z'],
      [{ ...alerta, id: 'https://mastodon.example/objects/e3', published: '2026-11-20T00:00:00Z' }, '2026-11-04T12:00:00.000Z']
    ];
    for (const [objecte, caduca] of casos) {
      expect((await atenPeticioInbox(peticio(create(objecte, `${objecte.id}#c`)), confiat(magatzem))).cos.estat).toBe('processada');
      expect([objecte.id, magatzem.instantania().alertes.find((a) => a.id === objecte.id).caduca]).toEqual([objecte.id, caduca]);
    }
    const bandol = { ...alerta, id: 'https://mastodon.example/objects/b', tag: [{ type: 'Hashtag', name: '#BàndolUrgent' }, { type: 'Hashtag', name: '#bandol_urgent' }] };
    await atenPeticioInbox(peticio(create(bandol, 'https://mastodon.example/a/b')), confiat(magatzem));
    expect(magatzem.instantania().alertes.find((a) => a.id === bandol.id).tipus).toBe('bandol_urgent');
    // Àrbitre T3-T1: el títol, en text pla i tallat a 160 caràcters.
    const titulada = { ...alerta, id: 'https://mastodon.example/objects/t', name: `  Tall   de la CV-780 ${'x'.repeat(200)}` };
    await atenPeticioInbox(peticio(create(titulada, 'https://mastodon.example/a/t')), confiat(magatzem));
    expect(magatzem.instantania().alertes.find((a) => a.id === titulada.id).nom).toBe(`Tall de la CV-780 ${'x'.repeat(200)}`.slice(0, 160));
  });

  test('ignorades i rebutjades: sense etiqueta, caducada, no pública, tipus aliè, autoria falsa', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    const motiu = async (objecte, id) => (await atenPeticioInbox(peticio(create(objecte, id)), confiat(magatzem))).cos;
    expect(await motiu({ ...alerta, id: 'https://mastodon.example/objects/2', tag: [{ type: 'Hashtag', name: '#Festes' }] }, 'https://mastodon.example/a/3')).toEqual({ estat: 'ignorada', motiu: 'not_an_alert' });
    expect(await motiu({ ...alerta, id: 'https://mastodon.example/objects/3', published: '2026-10-20T00:00:00Z' }, 'https://mastodon.example/a/4')).toEqual({ estat: 'ignorada', motiu: 'alert_expired' });
    expect(await motiu({ ...alerta, id: 'https://mastodon.example/objects/4', to: [`${REMOT}/followers`] }, 'https://mastodon.example/a/5')).toEqual({ estat: 'ignorada', motiu: 'not_public' });
    expect(await motiu({ ...alerta, id: 'https://mastodon.example/objects/5', type: 'Question' }, 'https://mastodon.example/a/6')).toEqual({ estat: 'ignorada', motiu: 'type_unsupported' });
    expect(await motiu({ ...alerta, attributedTo: 'https://mastodon.example/users/altra' }, 'https://mastodon.example/a/7')).toEqual({ estat: 'rebutjada', motiu: 'authorship_mismatch' });
    expect(await motiu({ ...alerta, id: 'https://altre.example/objects/1' }, 'https://mastodon.example/a/8')).toEqual({ estat: 'rebutjada', motiu: 'authorship_mismatch' });
    expect(magatzem.instantania()).toMatchObject({ activitats: [], alertes: [] });
  });

  test('Announce: d’una URL només amb obtenDocument injectat i d’un autor de confiança; Undo(Announce) el retira', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    const propia = { ...alerta, id: 'https://mastodon.example/objects/9', attributedTo: 'https://mastodon.example/users/ajuntament' };
    const announce = { id: 'https://mastodon.example/a/ann', type: 'Announce', actor: REMOT, to: [PUBLIC], object: propia.id };
    expect((await atenPeticioInbox(peticio(announce), confiat(magatzem))).cos).toEqual({ estat: 'ignorada', motiu: 'object_unverifiable' });
    const documents = new Map([[propia.id, propia], ['https://mastodon.example/objects/fals', { ...propia }], ['https://altre.example/o/1', { ...propia, id: 'https://altre.example/o/1', attributedTo: 'https://altre.example/u' }]]);
    const obtenDocument = async (id) => documents.get(id) ?? null;
    for (const objecte of ['https://mastodon.example/objects/fals', 'https://altre.example/o/1', 'https://mastodon.example/objects/cap']) {
      expect((await atenPeticioInbox(peticio({ ...announce, id: `${announce.id}/${objecte.length}`, object: objecte }), confiat(magatzem, { obtenDocument }))).cos)
        .toEqual({ estat: 'ignorada', motiu: 'object_unverifiable' });
    }
    expect((await atenPeticioInbox(peticio(announce), confiat(magatzem, { obtenDocument }))).cos).toEqual({ estat: 'processada' });
    expect(magatzem.instantania().alertes.map((a) => [a.actor, a.via, a.activitat])).toEqual([[propia.attributedTo, REMOT, announce.id]]);
    // Qui anuncia no pot esborrar l'objecte d'una altra persona (només Undo del seu Announce).
    expect(await magatzem.retiraAlertaRemota({ id: propia.id, actor: REMOT })).toBe(false);
    // Àrbitre T3-T1: l'Undo d'un Announce que diu ser d'una altra persona és 403 i no retira res.
    const alie = await atenPeticioInbox(peticio({ id: 'https://mastodon.example/a/undo-alie', type: 'Undo', actor: REMOT, object: { id: announce.id, type: 'Announce', actor: 'https://mastodon.example/users/altra' } }), confiat(magatzem));
    expect([alie.status, alie.cos]).toEqual([403, { estat: 'rebutjada', motiu: 'authorship_mismatch' }]);
    expect(magatzem.instantania().alertes).toHaveLength(1);
    const undo = { id: 'https://mastodon.example/a/undo-ann', type: 'Undo', actor: REMOT, object: { id: announce.id, type: 'Announce', actor: REMOT } };
    expect((await atenPeticioInbox(peticio(undo), confiat(magatzem))).cos).toEqual({ estat: 'processada' });
    expect(magatzem.instantania().alertes).toEqual([]);
  });

  test('àrbitre T3-S2: Announce amb l’objecte inclòs, només d’un autor de confiança del seu origen i de l’origen de qui anuncia; si no, obtenDocument', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    let crides = 0;
    const documents = new Map();
    const obtenDocument = async (id) => { crides += 1; return documents.get(id) ?? null; };
    const anuncia = async (objecte, n, extra = {}) => (await atenPeticioInbox(
      peticio({ id: `https://mastodon.example/a/inc${n}`, type: 'Announce', actor: REMOT, to: [PUBLIC], object: objecte }),
      confiat(magatzem, { nodesDeConfianca: ['https://mastodon.example', 'https://node-b.example'], ...extra })
    )).cos;
    const ajuntament = 'https://mastodon.example/users/ajuntament';
    // Inclòs, del mateix origen i d'un autor d'eixe origen: es desa sense demanar res a ningú.
    const local = { ...alerta, id: 'https://mastodon.example/objects/inc1', attributedTo: ajuntament };
    expect(await anuncia(local, 1, { obtenDocument })).toEqual({ estat: 'processada' });
    expect(crides).toBe(0);
    // La sonda de l'àrbitre: del mateix origen, però atribuït a un servidor sense confiança. Ni es desa ni s'atribuïx.
    const falsAjuntament = { ...alerta, id: 'https://mastodon.example/objects/inc2', attributedTo: 'https://alie-sense-confianca.example/users/ajuntament' };
    expect(await anuncia(falsAjuntament, 2)).toEqual({ estat: 'ignorada', motiu: 'object_unverifiable' });
    // Inclòs d'un altre origen (encara que siga de confiança) i sense obtenDocument: inverificable.
    const deB = { ...alerta, id: 'https://node-b.example/objects/1', attributedTo: 'https://node-b.example/users/ajuntament', content: '<p>Text inclòs manipulat</p>' };
    expect(await anuncia(deB, 3)).toEqual({ estat: 'ignorada', motiu: 'object_unverifiable' });
    // L'autor ha de ser de l'origen de l'objecte, encara que tots dos servidors siguen de confiança.
    expect(await anuncia({ ...alerta, id: 'https://mastodon.example/objects/inc6', attributedTo: deB.attributedTo }, 6)).toEqual({ estat: 'ignorada', motiu: 'object_unverifiable' });
    // Cap dels tres inverificables (inc2, inc3 i inc6) no es reclama: quan arribe el document, el mateix Announce es podrà processar.
    expect(magatzem.instantania()).toMatchObject({ activitats: ['https://mastodon.example/a/inc1'], alertes: [expect.objectContaining({ id: local.id })] });
    // Amb obtenDocument, mana el document de l'origen, no el que ve inclòs.
    documents.set(deB.id, { ...deB, content: '<p>Text de l’origen</p>' });
    expect(await anuncia(deB, 4, { obtenDocument })).toEqual({ estat: 'processada' });
    documents.set(falsAjuntament.id, { ...falsAjuntament, attributedTo: ajuntament });
    expect(await anuncia(falsAjuntament, 5, { obtenDocument })).toEqual({ estat: 'processada' });
    expect(crides).toBe(2);
    expect(magatzem.instantania().alertes.map((a) => [a.id, a.actor, a.via, a.text])).toEqual([
      [local.id, ajuntament, REMOT, 'Tall de la CV-780 & pluges — Avís'],
      [deB.id, deB.attributedTo, REMOT, 'Text de l’origen'],
      [falsAjuntament.id, ajuntament, REMOT, 'Tall de la CV-780 & pluges — Avís']
    ]);
  });

  test('àrbitre T3-T1: el Delete de l’actor que va anunciar retira les alertes que van entrar pel seu Announce', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    const propia = { ...alerta, id: 'https://mastodon.example/objects/via', attributedTo: 'https://mastodon.example/users/ajuntament' };
    await atenPeticioInbox(peticio({ id: 'https://mastodon.example/a/via', type: 'Announce', actor: REMOT, to: [PUBLIC], object: propia }), confiat(magatzem));
    expect(magatzem.instantania().alertes.map((a) => [a.actor, a.via])).toEqual([[propia.attributedTo, REMOT]]);
    const del = { id: 'https://mastodon.example/a/del-via', type: 'Delete', actor: REMOT, object: REMOT };
    expect((await atenPeticioInbox(peticio(del), confiat(magatzem))).cos).toEqual({ estat: 'processada' });
    expect(magatzem.instantania().alertes).toEqual([]);
  });

  test('Gauntlet B SEG-01: el Create de l’autor sobre una alerta anunciada la fa directa; ni l’Undo ni el Delete de qui l’anuncià la retiren', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    const op = confiat(magatzem, { obtenClauPublica: obtenComptes });
    const propia = { ...alerta, id: 'https://mastodon.example/objects/s1', attributedTo: AJUNTAMENT };
    const announce = { id: 'https://mastodon.example/a/s1-ann', type: 'Announce', actor: REMOT, to: [PUBLIC], object: propia };
    expect((await atenPeticioInbox(peticio(announce), op)).cos).toEqual({ estat: 'processada' });
    // Un Create d'un altre compte amb el mateix id no la converteix: no n'és el propietari.
    const intrus = { id: 'https://mastodon.example/a/s1-cre-altra', type: 'Create', actor: ALTRA, to: [PUBLIC], object: { ...propia, attributedTo: ALTRA } };
    expect((await atenPeticioInbox(peticio(intrus, de(ALTRA)), op)).cos).toEqual({ estat: 'processada' });
    expect(magatzem.instantania().alertes.map((a) => [a.actor, a.via, a.activitat])).toEqual([[AJUNTAMENT, REMOT, announce.id]]);
    const cre = { id: 'https://mastodon.example/a/s1-cre', type: 'Create', actor: AJUNTAMENT, to: [PUBLIC], object: propia };
    expect((await atenPeticioInbox(peticio(cre, de(AJUNTAMENT)), op)).cos).toEqual({ estat: 'processada' });
    expect(magatzem.instantania().alertes.map((a) => [a.actor, a.via, a.activitat])).toEqual([[AJUNTAMENT, null, cre.id]]);
    const undo = { id: 'https://mastodon.example/a/s1-undo', type: 'Undo', actor: REMOT, object: { id: announce.id, type: 'Announce', actor: REMOT } };
    expect((await atenPeticioInbox(peticio(undo), op)).cos).toEqual({ estat: 'ignorada', motiu: 'nothing_to_undo' });
    const del = { id: 'https://mastodon.example/a/s1-del', type: 'Delete', actor: REMOT, object: REMOT };
    expect((await atenPeticioInbox(peticio(del), op)).cos).toEqual({ estat: 'ignorada', motiu: 'nothing_to_delete' });
    expect(magatzem.instantania().alertes.map((a) => [a.id, a.actor, a.via])).toEqual([[propia.id, AJUNTAMENT, null]]);
  });

  test('Gauntlet B B-V2: un segon Announce d’un altre compte no pren la via: el seu Undo no la retira, el del primer sí', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    const op = confiat(magatzem, { obtenClauPublica: obtenComptes });
    const propia = { ...alerta, id: 'https://mastodon.example/objects/bv2', attributedTo: AJUNTAMENT };
    const annB = { id: 'https://mastodon.example/a/bv2-ann-b', type: 'Announce', actor: REMOT, to: [PUBLIC], object: propia };
    const annC = { id: 'https://mastodon.example/a/bv2-ann-c', type: 'Announce', actor: ALTRA, to: [PUBLIC], object: propia };
    const estat = () => magatzem.instantania().alertes.map((a) => [a.id, a.actor, a.via, a.activitat]);
    expect((await atenPeticioInbox(peticio(annB), op)).cos).toEqual({ estat: 'processada' });
    expect((await atenPeticioInbox(peticio(annC, de(ALTRA)), op)).cos).toEqual({ estat: 'processada' });
    expect(estat()).toEqual([[propia.id, AJUNTAMENT, REMOT, annB.id]]);
    const undoC = { id: 'https://mastodon.example/a/bv2-undo-c', type: 'Undo', actor: ALTRA, object: { id: annC.id, type: 'Announce', actor: ALTRA } };
    expect((await atenPeticioInbox(peticio(undoC, de(ALTRA)), op)).cos).toEqual({ estat: 'ignorada', motiu: 'nothing_to_undo' });
    expect(estat()).toEqual([[propia.id, AJUNTAMENT, REMOT, annB.id]]);
    const undoB = { id: 'https://mastodon.example/a/bv2-undo-b', type: 'Undo', actor: REMOT, object: { id: annB.id, type: 'Announce', actor: REMOT } };
    expect((await atenPeticioInbox(peticio(undoB), op)).cos).toEqual({ estat: 'processada' });
    expect(estat()).toEqual([]);
  });

  test('Gauntlet B SEG-03: la làpida d’un altre compte del mateix origen no veta el Create del propietari', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    const op = confiat(magatzem, { obtenClauPublica: obtenComptes });
    const preventiu = { id: 'https://mastodon.example/a/s3-del', type: 'Delete', actor: ALTRA, object: alerta.id };
    expect((await atenPeticioInbox(peticio(preventiu, de(ALTRA)), op)).cos).toEqual({ estat: 'ignorada', motiu: 'nothing_to_delete' });
    expect((await atenPeticioInbox(peticio(create(alerta, 'https://mastodon.example/a/s3-cre')), op)).cos).toEqual({ estat: 'processada' });
    // La làpida del propietari sí que el veta, també si l'objecte torna per l'Announce d'un altre compte.
    expect((await atenPeticioInbox(peticio({ id: 'https://mastodon.example/a/s3-del2', type: 'Delete', actor: REMOT, object: alerta.id }), op)).cos).toEqual({ estat: 'processada' });
    expect((await atenPeticioInbox(peticio(create(alerta, 'https://mastodon.example/a/s3-cre2')), op)).cos).toEqual({ estat: 'ignorada', motiu: 'object_deleted' });
    const ann = { id: 'https://mastodon.example/a/s3-ann', type: 'Announce', actor: ALTRA, to: [PUBLIC], object: alerta };
    expect((await atenPeticioInbox(peticio(ann, de(ALTRA)), op)).cos).toEqual({ estat: 'ignorada', motiu: 'object_deleted' });
    expect(magatzem.instantania()).toMatchObject({ alertes: [], lapides: [alerta.id] });
  });

  test('Gauntlet B T3-V1: l’Undo d’un Announce sense actor declarat (id nu o {id, type}) d’un altre compte no retira res', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    const op = confiat(magatzem, { obtenClauPublica: obtenComptes });
    const propia = { ...alerta, id: 'https://mastodon.example/objects/v1', attributedTo: AJUNTAMENT };
    const announce = { id: 'https://mastodon.example/a/v1-ann', type: 'Announce', actor: REMOT, to: [PUBLIC], object: propia };
    expect((await atenPeticioInbox(peticio(announce), op)).cos).toEqual({ estat: 'processada' });
    // Un compte del mateix origen de confiança i un d'un origen sense confiança (l'Undo no exigix confiança).
    for (const [actor, prefix] of [[ALTRA, 'https://mastodon.example/a/v1-u'], [HOSTIL, 'https://hostil.example/a/v1-u']]) {
      for (const [n, objecte] of [announce.id, { id: announce.id, type: 'Announce' }].entries()) {
        const r = await atenPeticioInbox(peticio({ id: `${prefix}${n}`, type: 'Undo', actor, object: objecte }, de(actor)), op);
        expect([actor, n, r.status, r.cos]).toEqual([actor, n, 202, { estat: 'ignorada', motiu: 'nothing_to_undo' }]);
      }
    }
    expect(magatzem.instantania().alertes.map((a) => [a.id, a.via])).toEqual([[propia.id, REMOT]]);
    // Control: el mateix Undo amb l'id nu, de qui l'anuncià, sí que la retira.
    const propi = { id: 'https://mastodon.example/a/v1-propi', type: 'Undo', actor: REMOT, object: announce.id };
    expect((await atenPeticioInbox(peticio(propi), op)).cos).toEqual({ estat: 'processada' });
    expect(magatzem.instantania().alertes).toEqual([]);
  });

  test('Gauntlet B SEG-04: un origen sense confiança que esgota la seua quota no bloqueja l’alerta d’un node de confiança', async () => {
    // Sense la quota per origen, les 4 activitats de l'origen hostil omplirien el magatzem sencer (maxim 4).
    const magatzem = creaMagatzemInboxEnMemoria({ maxim: 4, maximPerOrigen: 3 });
    const op = confiat(magatzem, { obtenClauPublica: obtenComptes });
    const undo = (n) => peticio({ id: `https://hostil.example/u/${n}`, type: 'Undo', actor: HOSTIL, object: `https://hostil.example/x/${n}` }, de(HOSTIL));
    for (let n = 0; n < 3; n += 1) expect((await atenPeticioInbox(undo(n), op)).cos).toEqual({ estat: 'ignorada', motiu: 'nothing_to_undo' });
    await expect(atenPeticioInbox(undo(3), op)).rejects.toThrow(RangeError);
    await expect(atenPeticioInbox(undo(4), op)).rejects.toThrow('Quota de la inbox esgotada per a este origen.');
    expect((await atenPeticioInbox(peticio(create(alerta, 'https://mastodon.example/a/s4')), op)).cos).toEqual({ estat: 'processada' });
    expect(magatzem.instantania().alertes.map((a) => a.id)).toEqual([alerta.id]);
    // Una repetició d'un origen ple continua sent 'duplicada': no gasta quota.
    expect((await atenPeticioInbox(undo(0), op)).cos).toEqual({ estat: 'duplicada' });
  });

  test('Gauntlet B SEG-04: la quota del magatzem és per origen, i alliberaActivitat la torna una sola vegada', async () => {
    const magatzem = creaMagatzemInboxEnMemoria({ maximPerOrigen: 1 });
    expect(await magatzem.reclamaActivitat('a', { actor: 'https://x.example/u' })).toBe(true);
    await expect(magatzem.reclamaActivitat('b', { actor: 'https://x.example/v' })).rejects.toThrow('Quota de la inbox esgotada per a este origen.');
    expect(await magatzem.reclamaActivitat('a', { actor: 'https://x.example/u' })).toBe(false);
    expect(await magatzem.reclamaActivitat('c', { actor: 'https://y.example/u' })).toBe(true);
    await magatzem.alliberaActivitat('a');
    await magatzem.alliberaActivitat('a');
    expect(await magatzem.reclamaActivitat('b', { actor: 'https://x.example/v' })).toBe(true);
    await expect(magatzem.reclamaActivitat('d', { actor: 'https://x.example/w' })).rejects.toThrow(RangeError);
    expect(magatzem.instantania().activitats).toEqual(['b', 'c']);
  });

  test('Gauntlet B B-V1: la quota és per host: els ports, les majúscules i el punt final no en donen una altra', async () => {
    const magatzem = creaMagatzemInboxEnMemoria({ maximPerOrigen: 2 });
    const plena = 'Quota de la inbox esgotada per a este origen.';
    expect(await magatzem.reclamaActivitat('p1', { actor: 'https://hostil.example:8443/users/x' })).toBe(true);
    expect(await magatzem.reclamaActivitat('p2', { actor: 'https://HOSTIL.example:8444/users/x' })).toBe(true);
    // Un esquema no especial no passa el host a minúscules: la quota sí.
    for (const actor of ['https://hostil.example:9000/users/x', 'https://hostil.example/users/x', 'https://hostil.example.:8445/users/x', 'https://hostil.example../users/x', 'ap://HOSTIL.example/x']) {
      await expect(magatzem.reclamaActivitat(actor, { actor })).rejects.toThrow(plena);
    }
    // Un subdomini és un altre host (residu declarat: només el fita `maxim`).
    expect(await magatzem.reclamaActivitat('r', { actor: 'https://sub.hostil.example/users/x' })).toBe(true);
    await magatzem.alliberaActivitat('p1');
    expect(await magatzem.reclamaActivitat('p3', { actor: 'https://hostil.example.:8446/users/y' })).toBe(true);
    await expect(magatzem.reclamaActivitat('p4', { actor: 'https://hostil.example:8447/users/z' })).rejects.toThrow(plena);
    expect(magatzem.instantania().activitats).toEqual(['p2', 'p3', 'r']);
  });

  test('Gauntlet B B-V1: un host sense confiança amb dos ports no omple el magatzem ni bloqueja l’alerta d’un node de confiança', async () => {
    // Amb la quota per origen (port inclòs), 8443 i 8444 serien dues quotes: 2 + 2 omplirien el sostre global (maxim 4).
    const magatzem = creaMagatzemInboxEnMemoria({ maxim: 4, maximPerOrigen: 2 });
    const op = confiat(magatzem, { obtenClauPublica: obtenComptes });
    const undo = (port, n) => {
      const actor = `https://hostil.example:${port}/users/x`;
      return peticio({ id: `https://hostil.example:${port}/u/${n}`, type: 'Undo', actor, object: `https://hostil.example:${port}/x/${n}` }, de(actor));
    };
    for (let n = 0; n < 2; n += 1) expect((await atenPeticioInbox(undo(8443, n), op)).cos).toEqual({ estat: 'ignorada', motiu: 'nothing_to_undo' });
    for (let n = 0; n < 2; n += 1) await expect(atenPeticioInbox(undo(8444, n), op)).rejects.toThrow('Quota de la inbox esgotada per a este origen.');
    expect((await atenPeticioInbox(peticio(create(alerta, 'https://mastodon.example/a/bv1')), op)).cos).toEqual({ estat: 'processada' });
    expect(magatzem.instantania()).toMatchObject({
      activitats: ['https://hostil.example:8443/u/0', 'https://hostil.example:8443/u/1', 'https://mastodon.example/a/bv1'], alertes: [expect.objectContaining({ id: alerta.id })]
    });
  });

  test('Delete del propietari; repetit, 202 ignorada; kit de Codex: un Create posterior del mateix objecte no el ressuscita', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    await atenPeticioInbox(peticio(create(alerta, 'https://mastodon.example/a/c1')), confiat(magatzem));
    const del = { id: 'https://mastodon.example/a/d1', type: 'Delete', actor: REMOT, object: { id: alerta.id, type: 'Tombstone' } };
    expect((await atenPeticioInbox(peticio(del), confiat(magatzem))).cos).toEqual({ estat: 'processada' });
    expect(magatzem.instantania()).toMatchObject({ alertes: [], lapides: [alerta.id] });
    const repetit = await atenPeticioInbox(peticio({ ...del, id: 'https://mastodon.example/a/d2' }), confiat(magatzem));
    expect([repetit.status, repetit.cos]).toEqual([202, { estat: 'ignorada', motiu: 'nothing_to_delete' }]);
    expect((await atenPeticioInbox(peticio(create(alerta, 'https://mastodon.example/a/c1')), confiat(magatzem))).cos).toEqual({ estat: 'duplicada' });
    expect((await atenPeticioInbox(peticio(create(alerta, 'https://mastodon.example/a/c2')), confiat(magatzem))).cos).toEqual({ estat: 'ignorada', motiu: 'object_deleted' });
    expect(magatzem.instantania().alertes).toEqual([]);
    expect((await atenPeticioInbox(peticio({ ...del, id: 'https://mastodon.example/a/d3', object: 'https://altre.example/objects/1' }), confiat(magatzem))).status).toBe(403);
    // D'un actor sense confiança: retira el que és seu, però no deixa làpides.
    const sensConfianca = creaMagatzemInboxEnMemoria();
    await atenPeticioInbox(peticio({ ...del, id: 'https://mastodon.example/a/d4', object: 'https://mastodon.example/objects/x' }), opcions(sensConfianca));
    expect(sensConfianca.instantania().lapides).toEqual([]);
  });

  test('Delete de l’actor: retira els seus seguiments i les seues alertes', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    await atenPeticioInbox(peticio(follow), confiat(magatzem));
    await atenPeticioInbox(peticio(create(alerta, 'https://mastodon.example/a/c9')), confiat(magatzem));
    const del = { id: 'https://mastodon.example/a/del-actor', type: 'Delete', actor: REMOT, object: REMOT };
    expect((await atenPeticioInbox(peticio(del), confiat(magatzem))).cos).toEqual({ estat: 'processada' });
    expect(magatzem.instantania()).toMatchObject({ seguidors: [], alertes: [] });
    expect((await atenPeticioInbox(peticio({ ...del, id: `${del.id}/2` }), confiat(magatzem))).cos).toEqual({ estat: 'ignorada', motiu: 'nothing_to_delete' });
  });

  test('classificació: paritat amb tipusDAlerta del Mur i hashtags CamelCase de Mastodon', () => {
    for (const etiqueta of ['Alerta', 'alerta municipal', 'Emergència', 'emergencia_municipal', 'Bàndol urgent', 'BÀNDOL URGENT!', 'Festes', 'alertes', '_alerta_']) {
      expect([etiqueta, tipusDAlertaFederada({ tag: [{ type: 'Hashtag', name: `#${etiqueta}` }] })]).toEqual([etiqueta, tipusDAlerta({ tags: [etiqueta] })]);
    }
    expect(tipusDAlertaFederada({ tag: [{ type: 'Hashtag', name: '#AlertaMunicipal' }] })).toBe('alerta');
    expect(tipusDAlertaFederada({ tag: [{ type: 'Hashtag', name: '#EmergenciaMunicipal' }] })).toBe('alerta');
    expect(tipusDAlertaFederada({ tag: [{ type: 'Hashtag', name: '#BandolUrgent' }, { type: 'Hashtag', name: '#Alerta' }] })).toBe('alerta');
    expect(tipusDAlertaFederada({ tag: [{ type: 'Mention', name: '#Alerta' }, ...Array(32).fill({ type: 'Hashtag', name: '#x' }), { type: 'Hashtag', name: '#Alerta' }] })).toBe(null);
    expect(tipusDAlertaFederada({ tag: [{ type: 'Hashtag', name: `#${'a'.repeat(70)}alerta` }] })).toBe(null);
  });

  test('textDHtmlRemot: text pla, entitats, cap substitut aïllat i lineal sobre 64 KiB', () => {
    expect(textDHtmlRemot('<script>x</script><p>Hola &lt;b&gt; &AMP; &#65;&#x1F600; &#xD800; &nope;</p>')).toBe('x Hola <b> & A😀 &#xD800; &nope;');
    expect(textDHtmlRemot('Més de 40 °C > 38 °C <i>a l’ombra</i>')).toBe('Més de 40 °C > 38 °C a l’ombra');
    expect(textDHtmlRemot('a'.repeat(3000))).toHaveLength(2000);
    expect(textDHtmlRemot(null)).toBe('');
    for (const entrada of ['<'.repeat(200_000), '&#'.repeat(100_000), '&amp'.repeat(50_000)]) {
      const inici = performance.now();
      textDHtmlRemot(entrada);
      expect(performance.now() - inici).toBeLessThan(50);
    }
  });

  test('el magatzem en memòria: fitat (RangeError) i sense referències compartides', async () => {
    const magatzem = creaMagatzemInboxEnMemoria({ maxim: 2 });
    expect(await magatzem.reclamaActivitat('a', {})).toBe(true);
    expect(await magatzem.reclamaActivitat('a', {})).toBe(false);
    await magatzem.reclamaActivitat('b', {});
    await expect(magatzem.reclamaActivitat('c', {})).rejects.toThrow(RangeError);
    await magatzem.desaAlertaRemota({ id: 'x', actor: REMOT, caduca: '2026-11-02T00:00:00.000Z' });
    const [copia] = await magatzem.llistaAlertesVigents(ARA);
    copia.actor = 'manipulat';
    expect(magatzem.instantania().alertes[0].actor).toBe(REMOT);
  });
});

describe('frontera del mòdul', () => {
  const font = readFileSync(path.join(ARREL, 'src/data/federacio/inboxActivityPub.js'), 'utf8');

  test('només importa ../activitypub.js i no toca xarxa, navegador ni procés', () => {
    expect([...font.matchAll(/^import[^;]*?from\s+'([^']+)'/gms)].map((m) => m[1])).toEqual(['../activitypub.js']);
    for (const prohibit of ['fetch(', 'document.', 'localStorage', 'XMLHttpRequest', 'process.', 'http://', 'Date.now(', 'new Date()']) {
      expect([prohibit, font.includes(prohibit)]).toEqual([prohibit, false]);
    }
    // «window» com a identificador (el motiu date_out_of_window és text de protocol).
    expect(font.match(/(?<!\w)window\b/g)).toBe(null);
  });

  test('cap fitxer de producció de src/ l’importa: no entra al paquet del navegador', () => {
    const recorre = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) return recorre(abs);
      return /\.(?:jsx?|mjs)$/.test(e.name) && !/\.test\.(?:jsx?|mjs)$/.test(e.name) ? [abs] : [];
    });
    const importadors = recorre(path.join(ARREL, 'src'))
      .filter((abs) => !abs.endsWith(path.join('federacio', 'inboxActivityPub.js')))
      .filter((abs) => /(?:\bfrom\s*|\bimport\s*\(\s*)['"][^'"]*inboxActivityPub(?:\.js)?['"]/.test(readFileSync(abs, 'utf8')))
      .map((abs) => path.relative(ARREL, abs));
    expect(importadors).toEqual([]);
  });
});

/* B5 (marató 261101_2143, spec B5-FEDERACIO §2.1) · Els canvis compatibles que demana el servidor
   supabase/functions/ap-inbox-verifica: purga per TTL, confirmació de la reclamació, prefix del camí
   i host esperat, i el host de la quota com a funció pública. */
describe('B5 · purga, confirmació, prefix del camí i host de la quota', () => {
  const iso = (t) => new Date(t).toISOString();
  const X = 'https://x.example/u';
  const Y = 'https://y.example/u';

  test('una sola font per a les retencions: 14 h per a les activitats, 30 dies i 14 h per a les làpides', () => {
    expect(RETENCIO_ACTIVITAT_MS).toBe(14 * HORA);
    expect(RETENCIO_ACTIVITAT_MS).toBe(FINESTRA_SIGNATURA.maximMs + 2 * FINESTRA_SIGNATURA.margeMs);
    expect(RETENCIO_LAPIDA_MS).toBe(MAXIM_VIGENCIA_ALERTA_MS + RETENCIO_ACTIVITAT_MS);
    expect(MARGE_PURGA_ALERTA_MS).toBe(24 * HORA);
  });

  test('purga: buida el que ha caducat, deixa el vigent i torna la quota del host', async () => {
    const m = creaMagatzemInboxEnMemoria({ maximPerOrigen: 1 });
    expect(await m.reclamaActivitat('https://x.example/a/1', { actor: X, tipus: 'Undo', rebuda: iso(ARA) })).toBe(true);
    expect(await m.reclamaActivitat('https://y.example/a/1', { actor: Y, tipus: 'Undo', rebuda: iso(ARA + 2 * HORA) })).toBe(true);
    await expect(m.reclamaActivitat('https://x.example/a/2', { actor: X, tipus: 'Undo', rebuda: iso(ARA) })).rejects.toThrow(RangeError);
    // Sense data de recepció, la purga no la toca mai.
    expect(await m.reclamaActivitat('https://z.example/a/1', { actor: 'https://z.example/u' })).toBe(true);
    await m.desaAlertaRemota({ id: 'https://x.example/n/1', actor: X, activitat: 'https://x.example/c/1', caduca: iso(ARA + HORA) });
    await m.desaAlertaRemota({ id: 'https://x.example/n/2', actor: X, activitat: 'https://x.example/c/2', caduca: iso(ARA + 72 * HORA) });
    expect(await m.retiraAlertaRemota({ id: 'https://x.example/n/3', actor: X, lapida: true, ara: ARA })).toBe(false);
    // Just a la frontera, res: la comparació és estricta.
    expect(await m.purga(ARA + RETENCIO_ACTIVITAT_MS)).toEqual({ activitats: 0, alertes: 0, lapides: 0 });
    expect(await m.purga(ARA + RETENCIO_ACTIVITAT_MS + 1)).toEqual({ activitats: 1, alertes: 0, lapides: 0 });
    expect(m.instantania().activitats).toEqual(['https://y.example/a/1', 'https://z.example/a/1']);
    // La quota del host torna amb la purga.
    expect(await m.reclamaActivitat('https://x.example/a/2', { actor: X, tipus: 'Undo', rebuda: iso(ARA) })).toBe(true);
    const t2 = ARA + HORA + MARGE_PURGA_ALERTA_MS + 1;
    expect(await m.purga(t2)).toEqual({ activitats: 2, alertes: 1, lapides: 0 });
    expect(m.instantania()).toMatchObject({ activitats: ['https://z.example/a/1'], alertes: [expect.objectContaining({ id: 'https://x.example/n/2' })], lapides: ['https://x.example/n/3'] });
    // La làpida encara veta el mateix propietari; passada la seua retenció, ja no.
    expect(await m.desaAlertaRemota({ id: 'https://x.example/n/3', actor: X, activitat: 'https://x.example/c/3', caduca: iso(t2 + HORA) })).toBe('esborrada');
    expect(await m.purga(ARA + RETENCIO_LAPIDA_MS + 1)).toEqual({ activitats: 0, alertes: 1, lapides: 1 });
    expect(await m.desaAlertaRemota({ id: 'https://x.example/n/3', actor: X, activitat: 'https://x.example/c/3', caduca: iso(ARA + RETENCIO_LAPIDA_MS + 2 * HORA) })).toBe('nova');
    await expect(m.purga()).rejects.toThrow(TypeError);
  });

  test('el Delete del processador data la làpida amb `ara`: la purga la pot vèncer', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    const del = { id: 'https://mastodon.example/a/b5-del', type: 'Delete', actor: REMOT, object: { id: 'https://mastodon.example/objects/b5', type: 'Tombstone' } };
    expect((await atenPeticioInbox(peticio(del), confiat(magatzem))).cos).toEqual({ estat: 'ignorada', motiu: 'nothing_to_delete' });
    expect(magatzem.instantania().lapides).toEqual(['https://mastodon.example/objects/b5']);
    expect(await magatzem.purga(ARA + RETENCIO_LAPIDA_MS)).toMatchObject({ lapides: 0 });
    expect(await magatzem.purga(ARA + RETENCIO_LAPIDA_MS + 1)).toMatchObject({ lapides: 1 });
    expect(magatzem.instantania().lapides).toEqual([]);
  });

  test('rèplica: dins de la retenció és duplicada; passada la retenció, la verificació ja la rebutja', async () => {
    const magatzem = creaMagatzemInboxEnMemoria();
    // La signatura més llarga que s'admet: hs2019 amb (expires) signat a 12 h, més 1 h de marge.
    const created = ARA / 1000;
    const p = peticio({ ...follow, id: `${REMOT}#follows/b5` }, { algorithm: 'hs2019', noms: '(request-target) host (created) (expires) digest', created, expires: created + 12 * 3600 });
    const aten = (ara) => atenPeticioInbox(p, opcions(magatzem, { ara }));
    expect((await aten(ARA)).cos).toEqual({ estat: 'processada' });
    const darrer = ARA + FINESTRA_SIGNATURA.maximMs + FINESTRA_SIGNATURA.margeMs;
    await magatzem.purga(darrer);
    expect((await aten(darrer)).cos).toEqual({ estat: 'duplicada' });
    const tard = ARA + RETENCIO_ACTIVITAT_MS + 1;
    await magatzem.purga(tard);
    expect(magatzem.instantania().activitats).toEqual([]);
    const r = await aten(tard);
    expect([r.status, r.cos]).toEqual([401, { error: 'date_out_of_window' }]);
  });

  test('confirmaActivitat: una vegada si l’efecte va bé, cap si falla; si llança, el resultat continua sent processada', async () => {
    const base = creaMagatzemInboxEnMemoria();
    const crides = [];
    const m1 = { ...base, async confirmaActivitat(id) { crides.push(id); return base.confirmaActivitat(id); } };
    const r1 = await atenPeticioInbox(peticio(follow), opcions(m1));
    expect([r1.cos, crides]).toEqual([{ estat: 'processada' }, [follow.id]]);
    // Una reclamació confirmada ja no s'allibera.
    expect(await base.alliberaActivitat(follow.id)).toBe(false);
    expect(base.instantania().activitats).toEqual([follow.id]);
    expect((await atenPeticioInbox(peticio(follow), opcions(m1))).cos).toEqual({ estat: 'duplicada' });
    expect(crides).toHaveLength(1);
    // L'efecte falla: cap confirmació, i la reclamació s'allibera.
    const m2 = { ...base, async desaSeguidor() { throw new Error('BD caiguda'); }, async confirmaActivitat(id) { crides.push(id); return true; } };
    await expect(atenPeticioInbox(peticio({ ...follow, id: `${REMOT}#follows/c2` }), opcions(m2))).rejects.toThrow('BD caiguda');
    expect(crides).toHaveLength(1);
    expect(base.instantania().activitats).toEqual([follow.id]);
    // La confirmació llança: processada igual, amb l'Accept, i la reclamació es queda (una rèplica és duplicada).
    const m3 = { ...base, async confirmaActivitat() { throw new Error('xarxa'); } };
    const r3 = await atenPeticioInbox(peticio({ ...follow, id: `${REMOT}#follows/c3` }), opcions(m3));
    expect([r3.status, r3.cos, r3.lliuraments.length]).toEqual([202, { estat: 'processada' }, 1]);
    expect((await atenPeticioInbox(peticio({ ...follow, id: `${REMOT}#follows/c3` }), opcions(m3))).cos).toEqual({ estat: 'duplicada' });
    // Un magatzem sense el mètode es comporta com abans.
    const sense = Object.fromEntries(Object.entries(base).filter(([nom]) => nom !== 'confirmaActivitat'));
    expect((await atenPeticioInbox(peticio({ ...follow, id: `${REMOT}#follows/c4` }), opcions(sense))).cos).toEqual({ estat: 'processada' });
  });

  test('prefixCami i hostEsperat: la ruta sense el prefix, la signatura sobre el camí sencer i el host públic', async () => {
    const PREFIX = '/functions/v1/ap-inbox-verifica';
    const FUNCIO = 'abc.supabase.co';
    const magatzem = creaMagatzemInboxEnMemoria();
    const op = (extra = {}) => opcions(magatzem, { prefixCami: PREFIX, hostEsperat: FUNCIO, ...extra });
    const signada = (n, extra = {}) => peticio({ ...follow, id: `${REMOT}#f/pre${n}` }, { signat: `${PREFIX}${CAMI}`, host: FUNCIO, ...extra });
    expect((await atenPeticioInbox(signada(1), op())).cos).toEqual({ estat: 'processada' });
    // La mateixa petició rebuda per un altre prefix: la ruta hi és, però el camí signat no és el rebut.
    expect((await atenPeticioInbox(signada(2, { rebut: `/altre${CAMI}` }), op({ prefixCami: '/altre' }))).cos).toEqual({ error: 'signature_invalid' });
    // Rebuda amb el prefix però sense configurar-lo: cap ruta.
    expect((await atenPeticioInbox(signada(3), op({ prefixCami: '' }))).status).toBe(404);
    // Signada per al host de l'origen quan el públic és el de la funció: rèplica d'una altra inbox.
    expect((await atenPeticioInbox(signada(4, { host: HOST }), op())).cos).toEqual({ error: 'host_mismatch' });
    // Un prefix mal format no obri cap ruta.
    for (const dolent of ['functions', '/functions/', '/a b', 7]) {
      expect([dolent, (await atenPeticioInbox(signada(5), op({ prefixCami: dolent }))).status]).toEqual([dolent, 404]);
    }
    // Sense opcions, com abans: el host esperat és el de l'origen.
    expect((await atenPeticioInbox(signada(6), opcions(magatzem))).status).toBe(404);
    expect((await atenPeticioInbox(peticio({ ...follow, id: `${REMOT}#f/pre7` }), opcions(magatzem))).cos).toEqual({ estat: 'processada' });
    expect(magatzem.instantania().activitats).toEqual([`${REMOT}#f/pre1`, `${REMOT}#f/pre7`]);
  });

  test('el text i el títol desats no tallen mai un emoji per la meitat ni porten subrogats solts (PostgreSQL rebutjaria el JSON)', () => {
    const solt = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/;
    const tallat = textDHtmlRemot(`${'a'.repeat(1999)}😀 i més`);
    expect([tallat.length, solt.test(tallat), tallat]).toEqual([1999, false, 'a'.repeat(1999)]);
    expect(textDHtmlRemot(`${'a'.repeat(1998)}😀`)).toBe(`${'a'.repeat(1998)}😀`);
    expect(textDHtmlRemot('abans \ud83d després \ude00 fi')).toBe('abans \ufffd després \ufffd fi');
    expect(JSON.parse(JSON.stringify(textDHtmlRemot(`x\udbff${'b'.repeat(10)}`)))).toBe(`x\ufffd${'b'.repeat(10)}`);
  });

  test('hostDeQuota: la mateixa quota que la memòria (ports, caixa, punts finals, ap://)', async () => {
    expect(hostDeQuota('https://HOSTIL.example:8443/users/x')).toBe('hostil.example');
    expect(hostDeQuota('https://hostil.example../u')).toBe('hostil.example');
    expect(hostDeQuota('ap://HOSTIL.example/x')).toBe('hostil.example');
    expect([hostDeQuota('no és una url'), hostDeQuota(undefined), hostDeQuota(7)]).toEqual(['', '', '']);
    expect(hostDeQuota('https://sub.hostil.example/u')).not.toBe(hostDeQuota('https://hostil.example/u'));
    for (const [x, y] of [['https://a.example:1/u', 'https://A.EXAMPLE./v'], ['https://b.example/u', 'ap://B.example/v']]) {
      expect(hostDeQuota(x)).toBe(hostDeQuota(y));
      const m = creaMagatzemInboxEnMemoria({ maximPerOrigen: 1 });
      expect(await m.reclamaActivitat(x, { actor: x })).toBe(true);
      await expect(m.reclamaActivitat(y, { actor: y })).rejects.toThrow('Quota de la inbox esgotada per a este origen.');
    }
  });
});
