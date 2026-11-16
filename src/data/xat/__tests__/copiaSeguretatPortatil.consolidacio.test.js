// @vitest-environment node
/**
 * Consolidació R26 dels dos motors `.sdpbackup` (ordre del Mestre, 14-11-2026):
 * el canònic `sdp.xat.backup.v2` és l'únic motor, i els vectors que Codex va
 * caçar al Kit R26 de Gemini (auditoria 261114_2212 i pegat 261114_2224) hi
 * queden com a proves permanents, adaptats a l'API canònica:
 *   · GBK01 · cursor per fil amb la llista de fils buida o incompleta;
 *   · GBK02 · credencials amb els noms reals del projecte i JWK privada
 *     reconeguda per l'estructura, en exportar I en importar;
 *   · GBK03 · una nota llarga i repetitiva que l'exportació accepta s'importa.
 * I els auxiliars d'arxiu del kit (Web Share, File System Access, descàrrega i
 * lectura d'un File de SAF o Files.app), portats sense Capacitor.
 * WebCrypto real de Node; dades sintètiques; cap xarxa. Els noms i valors que
 * els escàners de secrets del repositori vigilen es componen en temps
 * d'execució. Cada negativa comprova el `codi` i, quan és únic, el `motiu`.
 */
import { createHash, webcrypto } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { aBase64url, deBase64url, desxifraAesGcm, kekPbkdf2, xifraAesGcm } from '../../xifratXatCripto.js';
import {
  CODI_ARXIU_NO_DESAT,
  CODI_CADENA_DIVERGENT,
  CODI_CLAU_FEBLE,
  CODI_COPIA_CORRUPTA,
  CODI_LIMIT_SUPERAT,
  CODI_MATERIAL_SENSIBLE,
  CODI_QR_INVALID,
  ESPERA_REVOCACIO_URL_MS,
  EXTENSIO_SDP_BACKUP,
  MAX_BYTES_ARXIU_BACKUP,
  MIME_SDP_BACKUP,
  creaOfertaTraspasLocalQr,
  desaArxiuCopiaSeguretatXat,
  exportaCopiaSeguretatXat,
  exportaCopiaSeguretatXatAmbRebut,
  fusionaRevisioMissatge,
  generaParellaEfimeraTraspas,
  importaCopiaSeguretatXat,
  llegixArxiuCopiaSeguretatXat,
  nomArxiuCopiaSeguretatXat,
  validaOfertaTraspasLocalQr,
} from '../copiaSeguretatPortatil.js';

const U = 'usr-javi';
const T = 'la-torre';
const CLAU = 'olivera-centenaria-2026!';
const ambitPla = { usuariId: U, tenantId: T, permetSenseXifrar: true };
const ambitXifrat = { usuariId: U, tenantId: T, contrasenya: CLAU };
const opcionsImport = (extra = {}) => ({ usuariIdEsperat: U, tenantIdEsperat: T, contrasenya: CLAU, ...extra });
const opcionsPla = (extra = {}) => ({ usuariIdEsperat: U, tenantIdEsperat: T, permetSenseXifrar: true, ...extra });
const pla = async (opcions) => JSON.parse(await exportaCopiaSeguretatXat({ ...ambitPla, ...opcions })).pla;
const fils = (...ids) => ids.map((id) => ({ id }));
/* Missatge amb la forma del DTO real (mapejaMissatge: `creatAl`). */
const msg = (id, filId, seq, creatAl = '2026-11-13T12:00:00.000Z', extra = {}) => ({ id, filId, seq, creatAl, ...extra });
const rebutja = (codi, motiu) => expect.objectContaining(motiu ? { codi, motiu } : { codi });
const ids = (llista) => llista.map((m) => m.id);
/* L'error que llança una funció síncrona (null si no en llança cap). */
const lanca = (fn) => {
  try {
    fn();
  } catch (err) {
    return err;
  }
  return null;
};
const codifica = (text) => new TextEncoder().encode(text);

const canon = (v) => (v === null || typeof v !== 'object' ? JSON.stringify(v)
  : Array.isArray(v) ? `[${v.map(canon).join(',')}]`
    : `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`);
const sha = (v) => createHash('sha256').update(canon(v)).digest('hex');
const refaLots = (paquet) => {
  for (const lot of Object.keys(paquet.dades)) {
    paquet.manifest.lots[lot] = { total: paquet.dades[lot].length, sha256: sha(paquet.dades[lot]) };
  }
};

/* Una còpia sense xifrar (mode de proves) reescrita amb els hashes refets. */
function reescriuPla(text, muta) {
  const sobre = JSON.parse(text);
  muta(sobre.pla, sobre);
  refaLots(sobre.pla);
  return JSON.stringify(sobre);
}

/* Un text XIFRAT fabricat per qui coneix la contrasenya (o per un motor
   germà): es desxifra amb les primitives del xat, es muta el contingut, es
   refan els SHA-256 dels lots i es torna a xifrar amb la mateixa AAD i un IV
   nou. L'etiqueta GCM és vàlida: l'única defensa és la validació interna. */
const clausForja = new Map();
async function forjaXifrada(text, muta) {
  const sobre = JSON.parse(text);
  const cap = sobre.capcalera;
  const aad = codifica(canon({
    esquema: sobre.esquema,
    versio: sobre.versio,
    capcalera: { ...cap, aead: { algoritme: cap.aead.algoritme, etiquetaBits: cap.aead.etiquetaBits } },
  }));
  if (!clausForja.has(cap.kdf.sal)) {
    clausForja.set(cap.kdf.sal, await kekPbkdf2(webcrypto, codifica(CLAU.normalize('NFC')), deBase64url(cap.kdf.sal, 16),
      { iteracions: cap.kdf.iteracions, usos: ['encrypt', 'decrypt'] }));
  }
  const clau = clausForja.get(cap.kdf.sal);
  const clar = await desxifraAesGcm(webcrypto, clau, { xifrat: new Uint8Array(Buffer.from(sobre.xifrat, 'base64url')), aad, iv: deBase64url(cap.aead.iv, 12) });
  const paquet = JSON.parse(new TextDecoder().decode(clar));
  muta(paquet);
  refaLots(paquet);
  const { iv, xifrat } = await xifraAesGcm(webcrypto, clau, { dades: codifica(JSON.stringify(paquet)), aad });
  return JSON.stringify({ ...sobre, capcalera: { ...cap, aead: { ...cap.aead, iv: aBase64url(iv) } }, xifrat: Buffer.from(xifrat).toString('base64url') });
}

/* Magatzem en memòria amb la regla d'«aplica-si-mes-nou» i comptadors. */
function creaMagatzemMemoria() {
  const confirmat = new Map();
  const comptes = { obertes: 0, confirmades: 0 };
  return {
    confirmat,
    comptes,
    async obriTransaccio() {
      comptes.obertes += 1;
      const staging = [];
      return {
        async escriu(op) {
          staging.push(op);
        },
        async confirma() {
          for (const op of staging) {
            const clau = `${op.tipus}:${op.id}`;
            if (op.mode === 'insereix-si-absent') {
              if (!confirmat.has(clau)) confirmat.set(clau, op.valor);
            } else {
              confirmat.set(clau, fusionaRevisioMissatge(confirmat.get(clau) ?? null, op.valor));
            }
          }
          comptes.confirmades += 1;
        },
        async avorta() {
          staging.length = 0;
        },
      };
    },
  };
}

/* ── GBK01 ─────────────────────────────────────────────────────────────── */

describe('GBK01 · cursor per fil: un fil no desapareix mai, ni en exportar ni en restaurar', () => {
  const A11 = msg('a11', 'a', 11);
  const B2 = msg('b2', 'b', 2);
  const ANTERIORS = Array.from({ length: 10 }, (_, i) => msg(`a${i + 1}`, 'a', i + 1));

  it('exportar amb fils buit o incomplet falla tancat (B mai s’omet en silenci) i el cursor global és ambigu', async () => {
    // El vector de Codex: fils buit, A11/B2 i desDeSeq 10 (el kit exportava només A11).
    await expect(pla({ fils: [], missatges: [A11, B2], desDeSeq: 10 })).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'cursor-ambigu'));
    await expect(pla({ fils: fils('a'), missatges: [A11, B2], desDeSeq: 10 })).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'cursor-ambigu'));
    // Amb cursor per fil, sense cursor o amb la llista incompleta: el missatge de B no té fil i la còpia no ix.
    for (const opcions of [
      { fils: [], missatges: [A11, B2], desDeSeqPerFil: { a: 10 } },
      { fils: [], missatges: [A11, B2], desDeSeqPerFil: { a: 10, b: 1 } },
      { fils: [], missatges: [A11, B2] },
      { fils: fils('a'), missatges: [A11, B2], desDeSeqPerFil: { a: 10 } },
    ]) {
      await expect(pla(opcions)).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'missatge-orfe'));
    }
    // Contracas de Codex: un sol fil continua vàlid amb el cursor global.
    const unFil = await pla({ fils: fils('a'), missatges: [A11], desDeSeq: 10 });
    expect(ids(unFil.dades.missatges)).toEqual(['a11']);
    expect(unFil.manifest.cursors.desDeSeqPerFil).toEqual({ a: 10 });
    expect(unFil.manifest.cursors.ultimSeqPerFil).toEqual({ a: 11 });
  });

  it('cursor base {a:10} amb la llista completa: B2 viatja, es restaura i el mapa conserva els dos fils', async () => {
    const { text, rebut } = await exportaCopiaSeguretatXatAmbRebut({ ...ambitXifrat, fils: fils('a', 'b'), missatges: [A11, B2], desDeSeqPerFil: { a: 10 } });
    expect(rebut.ultimSeqPerFil).toEqual({ a: 11, b: 2 });
    const aplica = vi.fn();
    const res = await importaCopiaSeguretatXat(text, opcionsImport({ aplicaImportacio: aplica }));
    expect(ids(res.missatges)).toEqual(['a11', 'b2']);
    expect(res.manifest.cursors.desDeSeqPerFil).toEqual({ a: 10 });
    expect(res.rebut.ultimSeqPerFil).toEqual({ a: 11, b: 2 });
    expect(aplica).toHaveBeenCalledTimes(1);
    expect(ids(aplica.mock.calls[0][0].missatges)).toEqual(['a11', 'b2']);
  });

  it('incremental sobre una base que només coneixia A (a:10): el fil B nou arriba al magatzem i a la cadena', async () => {
    const c0 = await exportaCopiaSeguretatXatAmbRebut({ ...ambitXifrat, fils: fils('a'), missatges: ANTERIORS });
    expect(c0.rebut.ultimSeqPerFil).toEqual({ a: 10 });
    const c1 = await exportaCopiaSeguretatXatAmbRebut({ ...ambitXifrat, fils: fils('a', 'b'), missatges: [...ANTERIORS, A11, B2], base: c0.rebut });
    expect(c1.rebut.mode).toBe('incremental');
    expect(c1.rebut.ultimSeqPerFil).toEqual({ a: 11, b: 2 });

    const magatzem = creaMagatzemMemoria();
    const r0 = await importaCopiaSeguretatXat(c0.text, opcionsImport({ magatzem }));
    const r1 = await importaCopiaSeguretatXat(c1.text, opcionsImport({ magatzem, estatLocal: { copies: new Map([[r0.rebut.backupId, r0.rebut]]) } }));
    expect(ids(r1.missatges)).toEqual(['a11', 'b2']);
    expect(r1.rebut.ultimSeqPerFil).toEqual({ a: 11, b: 2 });
    for (const clau of ['fil:a', 'fil:b', 'missatge:a10', 'missatge:a11', 'missatge:b2']) expect(magatzem.confirmat.has(clau)).toBe(true);

    // La incremental tampoc no pot ometre B: amb la llista incompleta o amb un cursor global, no ix.
    await expect(pla({ fils: fils('a'), missatges: [...ANTERIORS, A11, B2], base: c0.rebut })).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'missatge-orfe'));
    await expect(pla({ fils: fils('a', 'b'), missatges: [A11, B2], base: c0.rebut, desDeSeq: 10 })).rejects.toEqual(rebutja(CODI_CADENA_DIVERGENT, 'cursor-ambigu'));
  });

  it('restaurar una còpia forjada que esborra B del mapa de cursors, el seu fil o en rebaixa el cursor es rebutja', async () => {
    const text = await exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('a', 'b'), missatges: [A11, B2], desDeSeqPerFil: { a: 10 } });
    await expect(importaCopiaSeguretatXat(text, opcionsPla())).resolves.toMatchObject({ rebut: { ultimSeqPerFil: { a: 11, b: 2 } } });
    for (const muta of [
      (p) => { delete p.manifest.cursors.ultimSeqPerFil.b; },
      (p) => { p.manifest.cursors.ultimSeqPerFil = {}; },
      (p) => { p.manifest.cursors.ultimSeqPerFil.b = 1; },
      (p) => { p.manifest.cursors.ultimSeqPerFil = { a: 11 }; p.manifest.cursors.desDeSeqPerFil = { a: 10 }; },
    ]) {
      await expect(importaCopiaSeguretatXat(reescriuPla(text, muta), opcionsPla())).rejects.toEqual(rebutja(CODI_CADENA_DIVERGENT, 'cursor-incoherent'));
    }
    const senseFil = reescriuPla(text, (p) => { p.dades.fils = p.dades.fils.filter((f) => f.id !== 'b'); });
    await expect(importaCopiaSeguretatXat(senseFil, opcionsPla())).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'missatge-orfe'));
  });

  it('el tall de data llig creatAl i createdAt (els dos fils) i cap cursor passa el primer missatge exclòs', async () => {
    const missatges = [
      msg('a11', 'a', 11, '2026-11-13T12:00:00.000Z'),
      msg('a12', 'a', 12, '2026-11-15T12:00:00.000Z'),
      { id: 'b2', filId: 'b', seq: 2, createdAt: '2026-11-13T12:00:00.000Z' },
      { id: 'b3', filId: 'b', seq: 3, createdAt: '2026-11-15T12:00:00.000Z' },
    ];
    const finsA = await pla({ fils: fils('a', 'b'), missatges, desDeSeqPerFil: { a: 10 }, finsAlDia: '2026-11-14' });
    expect(ids(finsA.dades.missatges)).toEqual(['a11', 'b2']);
    expect(finsA.manifest.cursors.ultimSeqPerFil).toEqual({ a: 11, b: 2 });
    expect(finsA.manifest.cursors.finsAlDia).toBe('2026-11-14T23:59:59.999Z');
    const desDe = await pla({ fils: fils('a', 'b'), missatges, desDeData: '2026-11-14' });
    expect(ids(desDe.dades.missatges)).toEqual(['a12', 'b3']);
    expect(desDe.manifest.cursors.ultimSeqPerFil).toEqual({ a: 10, b: 1 });
    // I la còpia amb tall es restaura amb el mateix mapa.
    const text = await exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('a', 'b'), missatges, desDeSeqPerFil: { a: 10 }, finsAlDia: '2026-11-14' });
    await expect(importaCopiaSeguretatXat(text, opcionsPla())).resolves.toMatchObject({ rebut: { ultimSeqPerFil: { a: 11, b: 2 } } });
    // Dos camps de data discordants mai passen.
    const discordant = { ...missatges[0], createdAt: '2026-11-15T12:00:00.000Z' };
    await expect(pla({ fils: fils('a'), missatges: [discordant], finsAlDia: '2026-11-14' })).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'missatge-data'));
  });
});

/* ── GBK02 ─────────────────────────────────────────────────────────────── */

describe('GBK02 · cap credencial ni clau privada, amb els noms reals del projecte i per estructura', () => {
  let privEd;
  let pubEd;
  let privEc;
  let pubEc;
  beforeAll(async () => {
    const ed = await webcrypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
    privEd = await webcrypto.subtle.exportKey('jwk', ed.privateKey);
    pubEd = await webcrypto.subtle.exportKey('jwk', ed.publicKey);
    const ec = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    privEc = await webcrypto.subtle.exportKey('jwk', ec.privateKey);
    pubEc = await webcrypto.subtle.exportKey('jwk', ec.publicKey);
  });

  /* La forma exacta de credencialDe (src/natiu/entradaSocial.js), sintètica. */
  const credencialNativa = () => ({ testimoni: 'opac-sintetic', nonce: 'nonce-sintetic', testimoniAcces: null, nom: null, codiAutoritzacio: null });
  const NOM_CLIENT = ['client', 'secret'].join('_');
  const SECRET_SUPABASE = ['sb', 'secret', 'x'.repeat(24)].join('_');
  const base = (extra) => ({ fils: fils('f1'), missatges: [msg('m1', 'f1', 1)], ...extra });

  /* [nom, valor]: noms reals i les seues variants de caixa i de separador. */
  const NOMS = () => [
    ['credencial', credencialNativa()], ['credencialNativa', credencialNativa()], ['credencial_nativa', 'opac'], ['credentials', { usuari: 'u' }],
    ['privateKeyJwk', 'opac'], ['private_key_jwk', 'opac'], ['private-key-jwk', 'opac'], ['privateKeyJwk', privEd],
    ['privateKeyPem', 'opac'], ['clauPrivadaB64', 'opac'],
    ['accessToken', { token: 'opac' }], ['accessToken', 'opac'], ['access_token', 'opac'], ['access-token', 'opac'], ['ACCESS_TOKEN', 'opac'],
    ['ACCESS.TOKEN', 'opac'], ['access\u200BToken', 'opac'], ['ａｃｃｅｓｓＴｏｋｅｎ', 'opac'],
    ['idToken', 'opac'], ['id_token', 'opac'], ['id-token', 'opac'], ['ID_TOKEN', 'opac'],
    ['refreshToken', 'opac'], ['refresh_token', 'opac'], ['refresh-token', 'opac'],
    ['token', 'opac'], ['Token', 'opac'], ['TOKEN', 'opac'], ['token', { valor: 'opac' }], ['pushToken', 'opac'], ['token_acces', 'opac'],
    ['sessio', 'opac'], ['sessio', { usuari: 'u' }], ['Sessió', 'opac'], ['SESSIO', 'opac'], ['session', 'opac'], ['sessions', ['opac']],
    ['testimoniAcces', 'opac'], ['testimoni_acces', 'opac'], ['codiAutoritzacio', 'opac'], ['codi-autoritzacio', 'opac'],
    ['authorizationCode', 'opac'], ['serverAuthCode', 'opac'], ['apiKey', 'opac'], ['service_role', 'opac'], [NOM_CLIENT, 'opac'],
  ];
  /* On pot anar: qualsevol objecte lliure, a qualsevol nivell, de qualsevol àmbit, inclòs un perfil niat. */
  const LLOCS = [
    ['missatge.metadades', (k, v) => base({ missatges: [msg('m1', 'f1', 1, undefined, { metadades: { [k]: v } })] })],
    ['missatge.metadades.perfil', (k, v) => base({ missatges: [msg('m1', 'f1', 1, undefined, { metadades: { perfil: { nom: 'Pepa', [k]: v } } })] })],
    ['fil.altres[0].perfil', (k, v) => base({ fils: [{ id: 'f1', altres: [{ id: 'u2', nom: 'Pepa', perfil: { [k]: v } }] }] })],
    ['fil.subjecte', (k, v) => base({ fils: [{ id: 'f1', subjecte: { tipus: 'pagina', id: 'p1', [k]: v } }] })],
    ['missatge.xifrat', (k, v) => base({ missatges: [msg('m1', 'f1', 1, undefined, { xifrat: { v: 1, [k]: v } })] })],
    ['set nivells', (k, v) => base({ missatges: [msg('m1', 'f1', 1, undefined, { metadades: { a: { b: { c: { d: { e: { [k]: v } } } } } } })] })],
    ['JSON serialitzat', (k, v) => base({ missatges: [msg('m1', 'f1', 1, undefined, { metadades: { json: JSON.stringify({ perfil: { [k]: v } }) } })] })],
  ];

  it('exportar: cada nom real, en camelCase, snake_case, kebab-case o majúscules, en qualsevol lloc lliure, es rebutja', async () => {
    let casos = 0;
    for (const [lloc, posa] of LLOCS) {
      for (const [k, v] of NOMS()) {
        await expect(pla(posa(k, v)), `${lloc}.${k}`).rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE, 'material-sensible'));
        casos += 1;
      }
    }
    expect(casos).toBe(LLOCS.length * NOMS().length);
    // Al primer nivell d'un registre, també (pel nom o per la llista blanca; el codi és el mateix).
    for (const [k, v] of [...NOMS(), ['perfil', { privateKeyJwk: privEd }]]) {
      await expect(pla(base({ fils: [{ id: 'f1', [k]: v }] })), `fil.${k}`).rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE));
      await expect(pla(base({ missatges: [msg('m1', 'f1', 1, undefined, { [k]: v })] })), `missatge.${k}`).rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE));
    }
    // I a la procedència de claus, on només viatgen kid i comptador.
    const kid = Buffer.alloc(16, 1).toString('base64url');
    for (const extra of [{ privateKeyJwk: privEd }, { token: 'opac' }, { credencial: credencialNativa() }]) {
      await expect(pla(base({ estatClaus: { kid, comptador: 1, ...extra } }))).rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE));
    }
  });

  it('exportar: una JWK privada es reconeix per l’estructura encara que el camp es diga d’una altra manera', async () => {
    const privades = [
      privEd, privEc,
      { crv: 'P-256', x: 'xx', y: 'yy', d: 'dd' }, { x: 'xx', y: 'yy', d: 'dd' },
      { kty: 'RSA', n: 'nn', e: 'AQAB', d: 'dd' }, { n: 'nn', e: 'AQAB', d: 'dd' }, { n: 'nn', e: 'AQAB', p: 'pp', q: 'qq' },
      { kty: 'oct', k: 'c2VjcmV0' },
    ];
    for (const jwk of privades) {
      for (const metadades of [{ contenidorReanomenat: jwk }, { llista: [pubEd, jwk] }, { serialitzada: JSON.stringify(jwk) }]) {
        await expect(pla(base({ missatges: [msg('m1', 'f1', 1, undefined, { metadades })] }))).rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE, 'material-sensible'));
      }
    }
    // La credencial nativa sense el seu nom (testimoni + nonce) i un secret de Supabase en un camp neutre.
    for (const metadades of [{ dades: credencialNativa() }, { dades: { testimoni: 'opac', nonce: 'n' } }, { valor: SECRET_SUPABASE }]) {
      await expect(pla(base({ missatges: [msg('m1', 'f1', 1, undefined, { metadades })] }))).rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE, 'material-sensible'));
    }
  });

  it('cap fals positiu: JWK públiques, nonce i testimoni patrimonial, recomptes i el text lliure de la gent es conserven', async () => {
    const fil = {
      id: 'f1', titol: 'Forn de la plaça', ultimText: 'el token del sorteig és demà',
      altres: [{ id: 'u2', nom: 'Pepa', perfil: { nom: 'Pepa', clauPublica: pubEd, testimoni: 'Damià Pla' } }],
      subjecte: { tipus: 'pagina', id: 'p1', ruta: '/p1', titol: 'Pàgina' },
    };
    const missatge = msg('m1', 'f1', 1, undefined, {
      text: 'accessToken, refresh_token, token, sessió i privateKeyJwk són paraules, no secrets. Bearer de bones notícies!',
      metadades: {
        clauPublica: pubEd, clauEc: pubEc, rsa: { kty: 'RSA', n: 'nn', e: 'AQAB' }, coordenades: { n: 1, e: 2, d: 3 },
        nonce: 'nonce-public', publicKey: 'publica', tokens: 512, sessio: 3,
        us: { inputTokens: 10, outputTokens: 20 }, session: null,
      },
    });
    const text = await exportaCopiaSeguretatXat({ ...ambitXifrat, fils: [fil], missatges: [missatge] });
    const res = await importaCopiaSeguretatXat(text, opcionsImport());
    expect(res.fils).toEqual([fil]);
    expect(res.missatges).toEqual([missatge]);
  });

  /* Onada R28 · copia-xat-02 · El nom d'una altra persona (altres[*].nom, el
     full_name d'un altre veí) i el títol del subjecte (subjecte.titol) són text
     de la gent, com el títol del fil: un «Bearer …» o un text amb forma de JWT
     que algú s'ha posat de nom no deixa sense còpia qui hi parla. */
  const JWT_NOM = ['eyJhbG', 'ciOi', 'J9'].join('.');
  const PEM_PRIVADA = ['-----BEGIN', 'PRIVATE', 'KEY-----'].join(' ');

  it('cap fals positiu: el nom d’una altra persona i el títol del subjecte amb forma de «Bearer» o de JWT es conserven, en exportar i en importar', async () => {
    const fil = {
      id: 'f1', titol: 'Forn de la plaça',
      altres: [{ id: 'u2', nom: 'Bearer Pepa', tipus: 'persona', avatar: null }, { id: 'u3', nom: JWT_NOM, tipus: 'persona' }],
      subjecte: { tipus: 'pagina', id: 'p1', ruta: '/p1', titol: 'Bearer de la Torre' },
    };
    const text = await exportaCopiaSeguretatXat({ ...ambitXifrat, fils: [fil], missatges: [msg('m1', 'f1', 1)] });
    const res = await importaCopiaSeguretatXat(text, opcionsImport());
    expect(res.fils).toEqual([fil]);
  });

  it('el text lliure niat només allibera eixos dos camps de text: dins d’altres i de subjecte, i a les metadades, la resta de l’heurística continua', async () => {
    const casos = [
      ['altres[0].nom amb una JWK privada', { altres: [{ id: 'u2', nom: privEd }] }],
      ['altres[0].nom amb un objecte que porta un JWT', { altres: [{ id: 'u2', nom: { valor: JWT_NOM } }] }],
      ['altres[0].avatar amb un «Bearer»', { altres: [{ id: 'u2', nom: 'Pepa', avatar: 'Bearer opac' }] }],
      ['altres[0].clau amb una clau PEM privada', { altres: [{ id: 'u2', nom: 'Pepa', clau: PEM_PRIVADA }] }],
      ['altres[0].perfil amb un nom de credencial', { altres: [{ id: 'u2', nom: 'Pepa', perfil: { accessToken: 'opac' } }] }],
      ['altres[0] amb la credencial nativa', { altres: [{ id: 'u2', ...credencialNativa(), nom: 'Pepa' }] }],
      ['altres sense llista: el nom no és el d’un element', { altres: { nom: 'Bearer opac' } }],
      /* Onada R28 · revisió · `'*'` és cada element d'una LLISTA: en un objecte, una clau «*» és una clau més. */
      ['altres sense llista amb una clau «*»: no és cap element', { altres: { '*': { nom: 'Bearer opac' } } }],
      ['subjecte.ruta amb un JWT', { subjecte: { tipus: 'pagina', id: 'p1', titol: 'Pàgina', ruta: JWT_NOM } }],
      ['subjecte.titol amb una JWK privada', { subjecte: { tipus: 'pagina', id: 'p1', titol: privEc } }],
      ['subjecte.nom amb un «Bearer» (no és el títol)', { subjecte: { tipus: 'pagina', id: 'p1', nom: 'Bearer opac' } }],
      ['subjecte.titol amb un secret de Supabase dins d’un objecte', { subjecte: { tipus: 'pagina', id: 'p1', titol: { valor: SECRET_SUPABASE } } }],
    ];
    for (const [cas, extra] of casos) {
      await expect(pla(base({ fils: [{ id: 'f1', ...extra }] })), cas).rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE, 'material-sensible'));
    }
    /* Un missatge no té eixos camps niats: a les seues metadades, el mateix nom és material. */
    await expect(pla(base({ missatges: [msg('m1', 'f1', 1, undefined, { metadades: { altres: [{ nom: 'Bearer opac' }] } })] })))
      .rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE, 'material-sensible'));
  });

  it('importar: un text xifrat fabricat amb secrets a dins es rebutja abans de cridar aplicaImportacio', async () => {
    const text = await exportaCopiaSeguretatXat({ ...ambitXifrat, fils: [{ id: 'f1', altres: [{ id: 'u2', nom: 'Pepa' }] }], missatges: [msg('m1', 'f1', 1)] });
    // Control: la mateixa forja amb una JWK pública i text lliure s'importa i crida el callback una sola vegada.
    const aplicaControl = vi.fn();
    const control = await forjaXifrada(text, (p) => { p.dades.missatges[0].metadades = { clauPublica: pubEd }; p.dades.missatges[0].text = 'token i sessió'; });
    await expect(importaCopiaSeguretatXat(control, opcionsImport({ aplicaImportacio: aplicaControl }))).resolves.toMatchObject({ autenticada: true });
    expect(aplicaControl).toHaveBeenCalledTimes(1);

    const vectors = [
      (p) => { p.dades.missatges[0].metadades = { perfil: { privateKeyJwk: privEd } }; },
      (p) => { p.dades.fils[0].altres[0].credencial = credencialNativa(); },
      (p) => { p.dades.missatges[0].metadades = { proveidor: { accessToken: { token: 'opac' }, idToken: 'opac' } }; },
      (p) => { p.dades.missatges[0].metadades = { contenidorReanomenat: privEc }; },
      (p) => { p.dades.missatges[0].metadades = { rsa: { n: 'nn', e: 'AQAB', d: 'dd' } }; },
      (p) => { p.dades.missatges[0].metadades = { dades: credencialNativa() }; },
      (p) => { p.dades.missatges[0].metadades = { perfil: { 'refresh-token': 'opac', sessio: { usuari: 'u' } } }; },
    ];
    for (const muta of vectors) {
      const aplica = vi.fn();
      await expect(importaCopiaSeguretatXat(await forjaXifrada(text, muta), opcionsImport({ aplicaImportacio: aplica })))
        .rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE, 'material-sensible'));
      expect(aplica).not.toHaveBeenCalled();
    }
    // Amb magatzem transaccional: ni tan sols s'obri la transacció.
    const magatzem = creaMagatzemMemoria();
    await expect(importaCopiaSeguretatXat(await forjaXifrada(text, vectors[0]), opcionsImport({ magatzem }))).rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE));
    expect(magatzem.comptes.obertes).toBe(0);
    expect(magatzem.confirmat.size).toBe(0);
  }, 60_000);

  it('importar: la mateixa defensa a les revisions d’una incremental i a la procedència de claus del manifest', async () => {
    const c0 = await exportaCopiaSeguretatXatAmbRebut({ ...ambitPla, fils: fils('f1'), missatges: [msg('m1', 'f1', 1)] });
    const c1 = await exportaCopiaSeguretatXatAmbRebut({
      ...ambitPla,
      fils: fils('f1'),
      missatges: [msg('m1', 'f1', 1, undefined, { text: 'editat', editatAl: '2026-11-14T10:00:00.000Z' }), msg('m2', 'f1', 2)],
      base: c0.rebut,
    });
    expect(ids(JSON.parse(c1.text).pla.dades.revisions)).toEqual(['m1']);
    const estatLocal = { copies: new Map([[c0.rebut.backupId, c0.rebut]]) };
    await expect(importaCopiaSeguretatXat(c1.text, opcionsPla({ estatLocal }))).resolves.toMatchObject({ revisions: [{ id: 'm1' }] });
    for (const muta of [
      (p) => { p.dades.revisions[0].metadades = { refresh_token: 'opac' }; },
      (p) => { p.dades.revisions[0].metadades = { perfil: { privateKeyJwk: { kty: 'OKP', crv: 'Ed25519', x: 'xx', d: 'dd' } } }; },
    ]) {
      await expect(importaCopiaSeguretatXat(reescriuPla(c1.text, muta), opcionsPla({ estatLocal }))).rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE, 'material-sensible'));
    }
    const clau = reescriuPla(c1.text, (p) => { p.manifest.clau = { kid: Buffer.alloc(16, 2).toString('base64url'), comptador: 1, privateKeyJwk: 'opac' }; });
    await expect(importaCopiaSeguretatXat(clau, opcionsPla({ estatLocal }))).rejects.toEqual(rebutja(CODI_MATERIAL_SENSIBLE, 'estat-claus'));
  });
});

/* ── GBK03 ─────────────────────────────────────────────────────────────── */

describe('GBK03 · el que l’exportació accepta, la importació ho obri', () => {
  it('una nota llarga i repetitiva (sense compressió, cap ràtio que la faça fallar) s’importa sencera', async () => {
    const missatges = [
      msg('m1', 'f1', 1, undefined, { text: 'A'.repeat(2_000_000) }),
      msg('m2', 'f1', 2, undefined, {
        text: 'Sóc de Poble! '.repeat(100_000),
        /* Onada R28 · `gran` ja no té forma de JSON: des del kit R28 de Codex
           (copiaSeguretatPortatil.r28.jsonNiat.test.js), un JSON serialitzat de
           més de 64 KiB no es pot inspeccionar i es rebutja tancat (ho comprova
           el final d'esta prova). Una cadena llarga i repetitiva que no és JSON
           continua passant sencera. */
        metadades: { resum: 'x'.repeat(300_000), gran: 'a:1;'.repeat(35_000), petit: '{"a":1}'.repeat(5_000) },
      }),
    ];
    const text = await exportaCopiaSeguretatXat({ ...ambitXifrat, fils: fils('f1'), missatges });
    const capcalera = JSON.parse(text).capcalera;
    expect(Object.keys(capcalera)).not.toContain('compressio');
    const aplica = vi.fn();
    const res = await importaCopiaSeguretatXat(text, opcionsImport({ aplicaImportacio: aplica }));
    expect(res.missatges).toEqual(missatges);
    expect(aplica).toHaveBeenCalledTimes(1);
    // També des dels bytes, tal com els torna llegixArxiuCopiaSeguretatXat.
    await expect(importaCopiaSeguretatXat(codifica(text), opcionsImport())).resolves.toMatchObject({ autenticada: true });
    // Onada R28 · La mateixa mida amb forma de JSON (la `gran` d'abans) falla tancat, sense cap còpia.
    await expect(pla({ fils: fils('f1'), missatges: [msg('m1', 'f1', 1, undefined, { metadades: { gran: '{"a":1}'.repeat(20_000) } })] }))
      .rejects.toEqual(rebutja(CODI_LIMIT_SUPERAT, 'json-niat-massa-gran'));
  }, 60_000);
});

/* ── Un sol motor ──────────────────────────────────────────────────────── */

describe('un sol motor .sdpbackup', () => {
  it('no hi ha cap segon motor a src/data/ i el format del kit (sdp.copia-seguretat-portatil) no s’admet', async () => {
    expect(existsSync(new URL('../../copiaSeguretatPortatil.js', import.meta.url))).toBe(false);
    const sobreKit = JSON.stringify({ format: 'sdp.copia-seguretat-portatil', versio: 2, kdf: 'PBKDF2-HMAC-SHA256', xifratge: 'AES-256-GCM', ciphertextBase64: 'AAAA' });
    await expect(importaCopiaSeguretatXat(sobreKit, opcionsImport())).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'esquema'));
  });

  it('el motor no importa Capacitor ni res de src/natiu/ (frontera nativa)', () => {
    const font = readFileSync(new URL('../copiaSeguretatPortatil.js', import.meta.url), 'utf8');
    const especificadors = [...font.matchAll(/\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1] ?? m[2]);
    expect(especificadors.sort()).toEqual(['../xatMultimedia.js', '../xifratXatCripto.js']);
    expect(especificadors.some((e) => new RegExp(['capa', 'citor'].join(''), 'i').test(e) || e.includes('natiu'))).toBe(false);
  });

  it('QR: una oferta datada 24 hores en el futur no s’accepta (pendent latent del motor del kit)', async () => {
    const ARA = 1_790_000_000_000;
    const empremta = Array.from({ length: 32 }, () => '0A').join(':');
    const sdp = `v=0\r\no=- 1 2 IN IP4 192.168.1.10\r\na=fingerprint:sha-256 ${empremta}\r\n`;
    const { clauPublicaJwk } = await generaParellaEfimeraTraspas();
    const futur = await creaOfertaTraspasLocalQr({ usuariId: U, tenantId: T, sdpOffer: sdp, clauPublicaEfimeraJwk: clauPublicaJwk, araMs: ARA + 24 * 3600 * 1000 });
    await expect(validaOfertaTraspasLocalQr(futur, { usuariIdEsperat: U, tenantIdEsperat: T, araMs: ARA, sessionsConsumides: new Set() }))
      .rejects.toEqual(rebutja(CODI_QR_INVALID, 'caducat'));
  });
});

/* ── Auxiliars d'arxiu (port del kit, sense Capacitor) ─────────────────── */

describe('auxiliars d’arxiu: Web Share (Files.app), File System Access, descàrrega i lectura de SAF', () => {
  const ARA_ISO = '2026-11-14T21:30:00.000Z';
  const NOM = `socdepoble-xat-complet-20261114-2130${EXTENSIO_SDP_BACKUP}`;
  let textXifrat;
  beforeAll(async () => {
    textXifrat = await exportaCopiaSeguretatXat({ ...ambitXifrat, fils: fils('f1'), missatges: [msg('m1', 'f1', 1)], araIso: ARA_ISO });
  });
  const domError = (name) => Object.assign(new Error(name), { name });
  const descarrega = () => {
    const ancora = { click: vi.fn() };
    const programades = [];
    return {
      ancora,
      programades,
      opcions: {
        documentDom: { createElement: vi.fn(() => ancora) },
        urlApi: { createObjectURL: vi.fn(() => 'blob:sdp-1'), revokeObjectURL: vi.fn() },
        temporitzador: vi.fn((fn, ms) => programades.push({ fn, ms })),
      },
    };
  };

  it('el nom de fitxer naix de la data UTC, el mode i una etiqueta ASCII; una data o un mode invàlids es rebutgen', () => {
    expect(nomArxiuCopiaSeguretatXat({ data: new Date(ARA_ISO) })).toBe(`socdepoble-xat-20261114-2130${EXTENSIO_SDP_BACKUP}`);
    expect(nomArxiuCopiaSeguretatXat({ data: ARA_ISO, mode: 'incremental', etiqueta: 'Casa de l’Àvia/../x' }))
      .toBe(`socdepoble-xat-casa-de-l-avia-x-incremental-20261114-2130${EXTENSIO_SDP_BACKUP}`);
    expect(lanca(() => nomArxiuCopiaSeguretatXat({ data: new Date(Number.NaN) }))).toEqual(rebutja(CODI_COPIA_CORRUPTA, 'data'));
    expect(lanca(() => nomArxiuCopiaSeguretatXat({ data: new Date('+010000-01-01T00:00:00Z') }))).toEqual(rebutja(CODI_COPIA_CORRUPTA, 'data'));
    expect(lanca(() => nomArxiuCopiaSeguretatXat({ data: '2026-02-31' }))).toEqual(rebutja(CODI_COPIA_CORRUPTA, 'data'));
    expect(lanca(() => nomArxiuCopiaSeguretatXat({ data: ARA_ISO, mode: 'zip' }))).toEqual(rebutja(CODI_COPIA_CORRUPTA, 'mode'));
  });

  it('Web Share: el full de compartir (iOS Files.app, Android) rep el .sdpbackup sencer; cancel·lar no és un error', async () => {
    const navegador = { canShare: vi.fn(() => true), share: vi.fn(async () => {}) };
    const finestra = { showSaveFilePicker: vi.fn() };
    const res = await desaArxiuCopiaSeguretatXat(textXifrat, { prefereixCompartir: true, navegador, finestra });
    expect(res).toEqual({ metode: 'web-share', nomArxiu: NOM, lliurat: true });
    const [{ files, title }] = navegador.share.mock.calls[0];
    expect(title).toBe(NOM);
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe(NOM);
    expect(files[0].type).toBe(MIME_SDP_BACKUP);
    expect(await files[0].text()).toBe(textXifrat);
    expect(finestra.showSaveFilePicker).not.toHaveBeenCalled();

    const cancel = { canShare: () => true, share: vi.fn(async () => { throw domError('AbortError'); }) };
    await expect(desaArxiuCopiaSeguretatXat(textXifrat, { prefereixCompartir: true, navegador: cancel, finestra }))
      .resolves.toEqual({ metode: 'web-share', nomArxiu: NOM, lliurat: false, motiu: 'cancellat' });
    expect(finestra.showSaveFilePicker).not.toHaveBeenCalled();

    // Sense activació d'usuari (o si el full no admet el fitxer) passa a la descàrrega.
    for (const nav of [
      { canShare: () => true, share: vi.fn(async () => { throw domError('NotAllowedError'); }) },
      { canShare: () => false, share: vi.fn() },
    ]) {
      const d = descarrega();
      await expect(desaArxiuCopiaSeguretatXat(textXifrat, { prefereixCompartir: true, navegador: nav, finestra: null, ...d.opcions }))
        .resolves.toMatchObject({ metode: 'descarrega', lliurat: true });
      expect(d.ancora.click).toHaveBeenCalledTimes(1);
    }
    const errada = { canShare: () => true, share: vi.fn(async () => { throw domError('DataError'); }) };
    await expect(desaArxiuCopiaSeguretatXat(textXifrat, { prefereixCompartir: true, navegador: errada, finestra: null }))
      .rejects.toEqual(rebutja(CODI_ARXIU_NO_DESAT, 'web-share'));
  });

  it('File System Access: escriu el text al fitxer triat; cancel·lar no és un error; una fallada descarta l’escriptura', async () => {
    const escriptura = { write: vi.fn(async () => {}), close: vi.fn(async () => {}), abort: vi.fn(async () => {}) };
    const finestra = { showSaveFilePicker: vi.fn(async () => ({ createWritable: async () => escriptura })) };
    await expect(desaArxiuCopiaSeguretatXat(codifica(textXifrat), { finestra, navegador: null }))
      .resolves.toEqual({ metode: 'selector-fitxers', nomArxiu: NOM, lliurat: true });
    const [{ suggestedName, types }] = finestra.showSaveFilePicker.mock.calls[0];
    expect(suggestedName).toBe(NOM);
    expect(types[0].accept).toEqual({ [MIME_SDP_BACKUP]: [EXTENSIO_SDP_BACKUP] });
    expect(escriptura.write).toHaveBeenCalledWith(textXifrat);
    expect(escriptura.close).toHaveBeenCalledTimes(1);
    expect(escriptura.abort).not.toHaveBeenCalled();

    const cancel = { showSaveFilePicker: async () => { throw domError('AbortError'); } };
    await expect(desaArxiuCopiaSeguretatXat(textXifrat, { finestra: cancel, navegador: null }))
      .resolves.toEqual({ metode: 'selector-fitxers', nomArxiu: NOM, lliurat: false, motiu: 'cancellat' });

    const trencada = { write: vi.fn(async () => { throw domError('QuotaExceededError'); }), close: vi.fn(), abort: vi.fn(async () => {}) };
    const disc = { showSaveFilePicker: async () => ({ createWritable: async () => trencada }) };
    await expect(desaArxiuCopiaSeguretatXat(textXifrat, { finestra: disc, navegador: null })).rejects.toEqual(rebutja(CODI_ARXIU_NO_DESAT, 'selector-fitxers'));
    expect(trencada.abort).toHaveBeenCalledTimes(1);
    expect(trencada.close).not.toHaveBeenCalled();

    // Sense activació d'usuari per al selector: descàrrega.
    const d = descarrega();
    const blocat = { showSaveFilePicker: async () => { throw domError('SecurityError'); } };
    await expect(desaArxiuCopiaSeguretatXat(textXifrat, { finestra: blocat, navegador: null, ...d.opcions })).resolves.toMatchObject({ metode: 'descarrega' });
  });

  it('descàrrega: <a download> amb el nom i el MIME, i l’ObjectURL es revoca després, no en el mateix torn', async () => {
    const d = descarrega();
    await expect(desaArxiuCopiaSeguretatXat(textXifrat, { finestra: null, navegador: null, nomArxiu: 'copia de casa', ...d.opcions }))
      .resolves.toEqual({ metode: 'descarrega', nomArxiu: `copia de casa${EXTENSIO_SDP_BACKUP}`, lliurat: true });
    expect(d.ancora).toMatchObject({ href: 'blob:sdp-1', download: `copia de casa${EXTENSIO_SDP_BACKUP}`, rel: 'noopener' });
    expect(d.ancora.click).toHaveBeenCalledTimes(1);
    const [blob] = d.opcions.urlApi.createObjectURL.mock.calls[0];
    expect(blob.type).toBe(MIME_SDP_BACKUP);
    expect(await blob.text()).toBe(textXifrat);
    expect(d.opcions.urlApi.revokeObjectURL).not.toHaveBeenCalled();
    expect(d.programades).toHaveLength(1);
    expect(d.programades[0].ms).toBe(ESPERA_REVOCACIO_URL_MS);
    d.programades[0].fn();
    expect(d.opcions.urlApi.revokeObjectURL).toHaveBeenCalledWith('blob:sdp-1');

    await expect(desaArxiuCopiaSeguretatXat(textXifrat, { finestra: null, navegador: null, documentDom: null }))
      .rejects.toEqual(rebutja(CODI_ARXIU_NO_DESAT, 'sense-mecanisme'));
  });

  it('mai no ix de l’aparell una còpia sense xifrar, un text qualsevol ni un nom amb ruta', async () => {
    const d = descarrega();
    const textPla = await exportaCopiaSeguretatXat({ ...ambitPla, fils: fils('f1'), missatges: [msg('m1', 'f1', 1)] });
    await expect(desaArxiuCopiaSeguretatXat(textPla, { finestra: null, navegador: null, ...d.opcions })).rejects.toEqual(rebutja(CODI_CLAU_FEBLE, 'sense-xifrar'));
    await expect(desaArxiuCopiaSeguretatXat('hola', { finestra: null, navegador: null, ...d.opcions })).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'json'));
    for (const nomArxiu of ['../../etc/copia', 'carpeta/copia', '.amagada', 'nom\u202Eamb-bidi']) {
      await expect(desaArxiuCopiaSeguretatXat(textXifrat, { finestra: null, navegador: null, nomArxiu, ...d.opcions })).rejects.toEqual(rebutja(CODI_ARXIU_NO_DESAT, 'nom-arxiu'));
    }
    expect(d.ancora.click).not.toHaveBeenCalled();
    expect(d.opcions.urlApi.createObjectURL).not.toHaveBeenCalled();
  });

  it('lectura d’un File de SAF o Files.app: sostre comprovat abans de llegir, i els bytes s’importen', async () => {
    const fitxer = new File([textXifrat], NOM, { type: '' });
    const bytes = await llegixArxiuCopiaSeguretatXat(fitxer);
    expect(new TextDecoder().decode(bytes)).toBe(textXifrat);
    await expect(importaCopiaSeguretatXat(bytes, opcionsImport())).resolves.toMatchObject({ missatges: [{ id: 'm1' }] });

    const enorme = { size: MAX_BYTES_ARXIU_BACKUP + 1, arrayBuffer: vi.fn() };
    await expect(llegixArxiuCopiaSeguretatXat(enorme)).rejects.toEqual(rebutja(CODI_LIMIT_SUPERAT, 'arxiu-massa-gran'));
    expect(enorme.arrayBuffer).not.toHaveBeenCalled();
    // Un sostre més alt que el de l'importador no l'amplia.
    await expect(llegixArxiuCopiaSeguretatXat(enorme, { maxBytes: MAX_BYTES_ARXIU_BACKUP * 4 })).rejects.toEqual(rebutja(CODI_LIMIT_SUPERAT, 'arxiu-massa-gran'));
    await expect(llegixArxiuCopiaSeguretatXat(new Blob([]))).rejects.toEqual(rebutja(CODI_LIMIT_SUPERAT, 'arxiu-massa-gran'));
    await expect(llegixArxiuCopiaSeguretatXat(new Blob(['x'.repeat(100)]), { maxBytes: 50 })).rejects.toEqual(rebutja(CODI_LIMIT_SUPERAT, 'arxiu-massa-gran'));
    // Una mida declarada que menteix es torna a comprovar sobre els bytes.
    const mentider = { size: 10, arrayBuffer: async () => new ArrayBuffer(100) };
    await expect(llegixArxiuCopiaSeguretatXat(mentider, { maxBytes: 50 })).rejects.toEqual(rebutja(CODI_LIMIT_SUPERAT, 'arxiu-massa-gran'));
    for (const res of [null, 'text', { size: 3 }]) {
      await expect(llegixArxiuCopiaSeguretatXat(res)).rejects.toEqual(rebutja(CODI_COPIA_CORRUPTA, 'entrada'));
    }
  });
});
