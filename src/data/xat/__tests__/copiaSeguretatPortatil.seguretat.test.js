/**
 * Negatives de seguretat del `.sdpbackup` v2 i del traspàs QR (Onada R26,
 * auditoria Codex R25.2 §IDEA-267 i pegat Codex R26 de cursors per fil).
 * WebCrypto real de Node; cap xarxa ni backend. Cada negativa comprova el
 * `motiu`, perquè no passe per una altra causa, i les de restauració
 * comproven que el magatzem no ha confirmat res.
 */
import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CODI_BASE_ABSENT,
  CODI_CADENA_DIVERGENT,
  CODI_CLAU_FEBLE,
  CODI_CLAU_INCORRECTA,
  CODI_COPIA_CORRUPTA,
  CODI_DEGRADACIO,
  CODI_IDENTITAT_DIVERGENT,
  CODI_LIMIT_SUPERAT,
  CODI_MATERIAL_SENSIBLE,
  CODI_NONCE_REPETIT,
  CODI_QR_INVALID,
  CODI_RESTAURACIO_AVORTADA,
  MAX_BYTES_ARXIU_BACKUP,
  MAX_FILS,
  TTL_QR_MAX_MS,
  creaComprovadorSas,
  creaOfertaTraspasLocalQr,
  creaRespostaTraspasLocalQr,
  derivaSasTraspasLocalQr,
  descriuCopiaSeguretatXat,
  exportaCopiaSeguretatXat,
  exportaCopiaSeguretatXatAmbRebut,
  generaParellaEfimeraTraspas,
  importaCopiaSeguretatXat,
  validaOfertaTraspasLocalQr,
} from '../copiaSeguretatPortatil.js';

const U = 'usr-javi';
const T = 'la-torre';
const CLAU = 'olivera-centenaria-2026!';
const FILS = [{ id: 'fil-1', titol: 'Forn' }, { id: 'fil-2', titol: 'Regants' }];
/* Ronda 2 R26: forma del DTO real (`text`, no la columna crua `cos`) i adjunts
   amb la màgia del MIME que declaren (abans eren bytes repetits). */
const MISSATGES = [
  { id: 'm-1', filId: 'fil-1', seq: 1, text: 'u', createdAt: '2026-11-10T08:00:00.000Z' },
  { id: 'm-2', filId: 'fil-1', seq: 2, text: 'dos', createdAt: '2026-11-11T08:00:00.000Z' },
  { id: 'm-3', filId: 'fil-2', seq: 1, text: 'tres', createdAt: '2026-11-12T08:00:00.000Z' },
];
const MAGIES = { 'image/webp': Buffer.from('RIFF\u0000\u0000\u0000\u0000WEBP', 'latin1'), 'audio/ogg': Buffer.from('OggS'), 'image/jpeg': Buffer.from([0xff, 0xd8, 0xff]) };
const bytesB64 = (n, valor = 7, mime = null) => {
  const b = Buffer.alloc(n, valor);
  if (mime) MAGIES[mime].copy(b, 0);
  return b.toString('base64');
};
const ADJUNTS = [
  { id: 'adj-1', missatgeId: 'm-1', mime: 'image/webp', nom: 'foto.webp', dadesBase64: bytesB64(90, 1, 'image/webp') },
  { id: 'adj-2', missatgeId: 'm-2', mime: 'audio/ogg', nom: 'veu.ogg', dadesBase64: bytesB64(120, 2, 'audio/ogg') },
  { id: 'adj-3', missatgeId: 'm-3', mime: 'image/jpeg', nom: 'ultim.jpg', dadesBase64: bytesB64(150, 3, 'image/jpeg') },
];
const base = { usuariId: U, tenantId: T, fils: FILS, missatges: MISSATGES, adjunts: ADJUNTS };
const opcionsImport = (extra = {}) => ({ usuariIdEsperat: U, tenantIdEsperat: T, contrasenya: CLAU, ...extra });
const kid = (n) => Buffer.alloc(16, n).toString('base64url');

function creaMagatzemMemoria({ fallaEn = null } = {}) {
  const confirmat = new Map();
  const comptes = { obertes: 0, escrits: 0, confirmades: 0, avortades: 0 };
  return {
    confirmat,
    comptes,
    async obriTransaccio() {
      comptes.obertes += 1;
      const staging = [];
      return {
        async escriu(op) {
          if (fallaEn && fallaEn(op)) throw new Error('disc ple');
          comptes.escrits += 1;
          staging.push(op);
        },
        async confirma() {
          for (const op of staging) {
            const clau = `${op.tipus}:${op.id}`;
            if (op.mode !== 'insereix-si-absent') throw new Error('mode no admés');
            if (!confirmat.has(clau)) confirmat.set(clau, op.valor);
          }
          comptes.confirmades += 1;
        },
        async avorta() {
          staging.length = 0;
          comptes.avortades += 1;
        },
      };
    },
  };
}

function criptoEspia() {
  const real = globalThis.crypto;
  const crides = [];
  const subtle = new Proxy(real.subtle, {
    get(objectiu, prop) {
      const valor = objectiu[prop];
      if (typeof valor !== 'function') return valor;
      return (...args) => {
        crides.push({ metode: prop, args });
        return valor.apply(objectiu, args);
      };
    },
  });
  return { cripto: { subtle, getRandomValues: (a) => real.getRandomValues(a) }, crides };
}
const cridesPbkdf2 = (crides) => crides.filter((c) => (c.metode === 'importKey' && c.args[2] === 'PBKDF2')
  || ((c.metode === 'deriveKey' || c.metode === 'deriveBits') && c.args[0]?.name === 'PBKDF2'));

/* Una còpia sense xifrar (mode de proves) reescrita i amb els hashes refets:
   és com un atacant prepararia un contingut «coherent». */
async function reescriuPla(text, muta) {
  const sobre = JSON.parse(text);
  muta(sobre.pla, sobre);
  const canon = (v) => (v === null || typeof v !== 'object' ? JSON.stringify(v)
    : Array.isArray(v) ? `[${v.map(canon).join(',')}]`
      : `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`);
  const sha = (v) => createHash('sha256').update(canon(v)).digest('hex');
  for (const lot of ['fils', 'missatges', 'adjunts']) {
    sobre.pla.manifest.lots[lot] = { total: sobre.pla.dades[lot].length, sha256: sha(sobre.pla.dades[lot]) };
  }
  return JSON.stringify(sobre);
}
const adjuntPla = (id, missatgeId, bytes, extra = {}) => {
  return { id, missatgeId, mime: 'image/webp', nom: `${id}.webp`, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), dadesBase64: bytes.toString('base64'), ...extra };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AEAD i capçalera autenticada', () => {
  it('sal de 128 bits, IV de 96 bits nous per còpia, AES-256-GCM amb etiqueta de 128 bits i AAD', async () => {
    const { cripto, crides } = criptoEspia();
    const a = JSON.parse(await exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU, cripto }));
    const b = JSON.parse(await exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU, cripto }));
    expect(Buffer.from(a.capcalera.kdf.sal, 'base64url')).toHaveLength(16);
    expect(Buffer.from(a.capcalera.aead.iv, 'base64url')).toHaveLength(12);
    expect(a.capcalera.kdf.sal).not.toBe(b.capcalera.kdf.sal);
    expect(a.capcalera.aead.iv).not.toBe(b.capcalera.aead.iv);
    expect(a.capcalera.backupId).not.toBe(b.capcalera.backupId);
    expect(a.xifrat).not.toBe(b.xifrat);
    const xifrats = crides.filter((c) => c.metode === 'encrypt');
    expect(xifrats).toHaveLength(2);
    for (const { args: [params, clau] } of xifrats) {
      expect(params).toMatchObject({ name: 'AES-GCM', tagLength: 128 });
      expect(params.iv).toHaveLength(12);
      expect(params.additionalData.length).toBeGreaterThan(0);
      expect(clau.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    }
    const derivacions = crides.filter((c) => c.metode === 'deriveKey');
    expect(derivacions.every((c) => c.args[0].iterations >= 600000 && c.args[0].hash === 'SHA-256')).toBe(true);
  });

  it('qualsevol camp de la capçalera reescrit fa fallar l’etiqueta (cap degradació silenciosa)', async () => {
    const text = await exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU });
    const mutacions = [
      (s) => { s.capcalera.backupId = 'AAAAAAAAAAAAAAAAAAAAAA'; },
      (s) => { s.capcalera.mode = 'parcial'; },
      (s) => { s.capcalera.creatAt = '2020-01-01T00:00:00.000Z'; },
      (s) => { s.capcalera.kdf.iteracions += 1; },
      (s) => { s.capcalera.kdf.sal = Buffer.alloc(16, 9).toString('base64url'); },
      (s) => { s.capcalera.aead.iv = Buffer.alloc(12, 9).toString('base64url'); },
    ];
    for (const muta of mutacions) {
      const s = JSON.parse(text);
      muta(s);
      await expect(importaCopiaSeguretatXat(JSON.stringify(s), opcionsImport())).rejects.toMatchObject({ codi: CODI_CLAU_INCORRECTA, motiu: 'aead' });
    }
  });

  it('header downgrade: versió antiga, algoritme o etiqueta rebaixats i còpia «sense xifrar» quan s’espera xifrada', async () => {
    const text = await exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU });
    const v1 = JSON.parse(text);
    v1.esquema = 'sdp.xat.backup.v1';
    v1.versio = 1;
    await expect(importaCopiaSeguretatXat(JSON.stringify(v1), opcionsImport())).rejects.toMatchObject({ codi: CODI_DEGRADACIO, motiu: 'versio-antiga' });
    for (const muta of [(s) => { s.capcalera.aead.algoritme = 'AES-128-GCM'; }, (s) => { s.capcalera.aead.etiquetaBits = 96; }, (s) => { s.capcalera.kdf.algoritme = 'PBKDF2-HMAC-SHA1'; }]) {
      const s = JSON.parse(text);
      muta(s);
      await expect(importaCopiaSeguretatXat(JSON.stringify(s), opcionsImport())).rejects.toMatchObject({ codi: CODI_DEGRADACIO, motiu: 'algoritme' });
    }
    // Atacant que substituïx el xifrat per un «pla» coherent: amb contrasenya mai s'accepta, encara que permetSenseXifrar estiga actiu.
    const falsificat = await exportaCopiaSeguretatXat({ ...base, permetSenseXifrar: true });
    let escrits = 0;
    await expect(importaCopiaSeguretatXat(falsificat, opcionsImport({ permetSenseXifrar: true, aplicaImportacio: () => { escrits += 1; } })))
      .rejects.toMatchObject({ codi: CODI_DEGRADACIO, motiu: 'sense-xifrar' });
    await expect(importaCopiaSeguretatXat(falsificat, { usuariIdEsperat: U, tenantIdEsperat: T })).rejects.toMatchObject({ codi: CODI_CLAU_FEBLE, motiu: 'sense-xifrar' });
    expect(escrits).toBe(0);
    // Cap ambigüitat: xifrat i pla alhora es rebutja.
    const mixt = JSON.parse(text);
    mixt.pla = JSON.parse(falsificat).pla;
    await expect(importaCopiaSeguretatXat(JSON.stringify(mixt), opcionsImport())).rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'capcalera' });
    // Camps extra a la capçalera: esquema tancat.
    const extra = JSON.parse(text);
    extra.capcalera.xifrat = false;
    await expect(importaCopiaSeguretatXat(JSON.stringify(extra), opcionsImport())).rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'capcalera' });
  });

  it('la contrasenya es deriva en NFC: la frase amb accents d’un teclat iOS obri la còpia feta en Android', async () => {
    const composta = 'olivera-àvia-de-la-plaça-2026';
    const descomposta = composta.normalize('NFD');
    expect(descomposta).not.toBe(composta);
    const text = await exportaCopiaSeguretatXat({ ...base, contrasenya: composta });
    const res = await importaCopiaSeguretatXat(text, opcionsImport({ contrasenya: descomposta }));
    expect(res.missatges).toHaveLength(3);
  });

  it('una entrada no JSON (Date, undefined) no fa una còpia que després no es pot restaurar', async () => {
    const missatges = [{ id: 'm-1', filId: 'fil-1', seq: 1, text: 'hola', createdAt: new Date('2026-11-10T08:00:00.000Z'), editat: undefined }];
    const text = await exportaCopiaSeguretatXat({ usuariId: U, tenantId: T, fils: [FILS[0]], missatges, contrasenya: CLAU });
    const res = await importaCopiaSeguretatXat(text, opcionsImport());
    expect(res.missatges[0]).toEqual({ id: 'm-1', filId: 'fil-1', seq: 1, text: 'hola', createdAt: '2026-11-10T08:00:00.000Z' });
  });
});

describe('KDF fora de rang', () => {
  it('rebutja les iteracions fora de 600.000..10.000.000 ABANS de derivar (zero crides PBKDF2)', async () => {
    const text = await exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU });
    for (const iteracions of [599_999, 10_000_001, 600_000.5, '600000', -1, null, 99_999_999]) {
      const s = JSON.parse(text);
      s.capcalera.kdf.iteracions = iteracions;
      const { cripto, crides } = criptoEspia();
      await expect(importaCopiaSeguretatXat(JSON.stringify(s), opcionsImport({ cripto }))).rejects.toMatchObject({ codi: CODI_CLAU_FEBLE, motiu: 'kdf-fora-de-rang' });
      expect(cridesPbkdf2(crides)).toHaveLength(0);
    }
    for (const iteracions of [599_999, 10_000_001, 1.5e6 + 0.5]) {
      const { cripto, crides } = criptoEspia();
      await expect(exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU, iteracions, cripto })).rejects.toMatchObject({ codi: CODI_CLAU_FEBLE, motiu: 'kdf-fora-de-rang' });
      expect(cridesPbkdf2(crides)).toHaveLength(0);
    }
  });
});

describe('nonce repetit', () => {
  it('si el generador repetix sal i IV, la segona còpia no ix (ni amb zeros)', async () => {
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((a) => a.fill(0x5a));
    await exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU });
    await expect(exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU })).rejects.toMatchObject({ codi: CODI_NONCE_REPETIT, motiu: 'nonce-repetit' });
    vi.restoreAllMocks();
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((a) => a.fill(0));
    await expect(exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU })).rejects.toMatchObject({ codi: CODI_NONCE_REPETIT, motiu: 'generador-degenerat' });
  });

  it('un backupId aleatori que comença per «-» o «_» (base64url) es restaura igual', async () => {
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((a) => a.fill(0xfb));
    const { text, rebut } = await exportaCopiaSeguretatXatAmbRebut({ ...base, contrasenya: CLAU });
    vi.restoreAllMocks();
    expect(rebut.backupId.startsWith('-')).toBe(true);
    await expect(importaCopiaSeguretatXat(text, opcionsImport())).resolves.toMatchObject({ rebut: { backupId: rebut.backupId } });
  });

  it('una còpia amb la mateixa sal i IV que una altra ja registrada es rebutja sense escriure', async () => {
    const { text, rebut } = await exportaCopiaSeguretatXatAmbRebut({ ...base, contrasenya: CLAU });
    const magatzem = creaMagatzemMemoria();
    const altra = { ...rebut, backupId: kid(0x11), empremta: 'f'.repeat(64) };
    await expect(importaCopiaSeguretatXat(text, opcionsImport({ magatzem, estatLocal: { copies: { [altra.backupId]: altra } } })))
      .rejects.toMatchObject({ codi: CODI_NONCE_REPETIT, motiu: 'nonce-repetit' });
    expect(magatzem.comptes.obertes).toBe(0);
  });
});

describe('altre compte o poble', () => {
  it('l’àmbit es comprova abans de derivar i l’AAD el lliga: reescriure’l no obri la còpia d’un altre', async () => {
    const text = await exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU });
    const { cripto, crides } = criptoEspia();
    await expect(importaCopiaSeguretatXat(text, opcionsImport({ tenantIdEsperat: 'altre-poble', cripto }))).rejects.toMatchObject({ codi: CODI_IDENTITAT_DIVERGENT, motiu: 'ambit' });
    expect(cridesPbkdf2(crides)).toHaveLength(0);
    const s = JSON.parse(text);
    s.capcalera.usuariId = 'usr-intrus';
    s.capcalera.tenantId = 'altre-poble';
    await expect(importaCopiaSeguretatXat(JSON.stringify(s), opcionsImport({ usuariIdEsperat: 'usr-intrus', tenantIdEsperat: 'altre-poble' })))
      .rejects.toMatchObject({ codi: CODI_CLAU_INCORRECTA, motiu: 'aead' });
  });
});

describe('claus: res en clar i res reactivat', () => {
  it('cap JWT, refresh token, Push ni JWK privada entra en una còpia', async () => {
    const casos = [
      { fils: [{ id: 'fil-1', sessio: { refresh_token: 'rt' } }] },
      { fils: [{ id: 'fil-1', accessToken: 'eyJ' }] },
      { fils: [{ id: 'fil-1', clau: { kty: 'EC', crv: 'P-256', x: 'x', y: 'y', d: 'secret' } }] },
      { fils: [{ id: 'fil-1', avisos: { endpoint: 'https://push.example/1', keys: { p256dh: 'a', auth: 'b' } } }] },
      { fils: [{ id: 'fil-1' }], missatges: [{ id: 'm-1', filId: 'fil-1', seq: 1, metadades: [{ clauPrivada: 'k' }] }] },
    ];
    for (const cas of casos) {
      await expect(exportaCopiaSeguretatXat({ usuariId: U, tenantId: T, contrasenya: CLAU, missatges: [], ...cas }))
        .rejects.toMatchObject({ codi: CODI_MATERIAL_SENSIBLE, motiu: 'material-sensible' });
    }
    await expect(exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU, estatClaus: { kid: kid(1), comptador: 3, privada: 'x' } }))
      .rejects.toMatchObject({ codi: CODI_MATERIAL_SENSIBLE });
    // També en importar (mode de proves sense xifrar): un registre forjat amb un token es rebutja.
    const pla = await exportaCopiaSeguretatXat({ ...base, permetSenseXifrar: true });
    const forjat = await reescriuPla(pla, (p) => { p.dades.fils[0].refreshToken = 'rt'; });
    await expect(importaCopiaSeguretatXat(forjat, { usuariIdEsperat: U, tenantIdEsperat: T, permetSenseXifrar: true })).rejects.toMatchObject({ codi: CODI_MATERIAL_SENSIBLE });
  });

  it('kid retirat o comptador antic: la còpia antiga restaura història, mai claus ni comptadors', async () => {
    const text = await exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU, estatClaus: { kid: kid(1), comptador: 3 } });
    const magatzem = creaMagatzemMemoria();
    const clauLocal = { kidActiu: kid(2), kidsRetirats: [kid(1)], comptador: 9 };
    const res = await importaCopiaSeguretatXat(text, opcionsImport({ magatzem, estatLocal: { clau: clauLocal } }));
    expect(res.claus).toMatchObject({ kid: kid(1), comptador: 3, estat: 'retirada', aplicaClaus: false });
    expect(new Set(res.operacions.map((o) => o.tipus))).toEqual(new Set(['fil', 'missatge', 'adjunt', 'registre_copia']));
    expect([...magatzem.confirmat.keys()].some((k) => /clau|llibreta|comptador/.test(k))).toBe(false);
    expect(clauLocal).toEqual({ kidActiu: kid(2), kidsRetirats: [kid(1)], comptador: 9 });
    const antiga = await importaCopiaSeguretatXat(text, opcionsImport({ estatLocal: { clau: { kidActiu: kid(1), kidsRetirats: [], comptador: 9 } } }));
    expect(antiga.claus.estat).toBe('antiga');
    // Un manifest forjat que intenta portar estat de claus extra es rebutja.
    const pla = await exportaCopiaSeguretatXat({ ...base, permetSenseXifrar: true, estatClaus: { kid: kid(1), comptador: 3 } });
    const forjat = await reescriuPla(pla, (p) => { p.manifest.clau.llibreta = { comptador: 99 }; });
    await expect(importaCopiaSeguretatXat(forjat, { usuariIdEsperat: U, tenantIdEsperat: T, permetSenseXifrar: true })).rejects.toMatchObject({ codi: CODI_MATERIAL_SENSIBLE, motiu: 'estat-claus' });
  });
});

describe('restauració atòmica', () => {
  it('últim adjunt corrupte: rebuig abans d’obrir cap transacció', async () => {
    const pla = await exportaCopiaSeguretatXat({ ...base, permetSenseXifrar: true });
    const s = JSON.parse(pla);
    const ultim = s.pla.dades.adjunts.at(-1);
    const bytes = Buffer.from(ultim.dadesBase64, 'base64');
    bytes[bytes.length - 1] ^= 0xff;
    ultim.dadesBase64 = bytes.toString('base64');
    const magatzem = creaMagatzemMemoria();
    await expect(importaCopiaSeguretatXat(JSON.stringify(s), { usuariIdEsperat: U, tenantIdEsperat: T, permetSenseXifrar: true, magatzem }))
      .rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'adjunt-sha256' });
    expect(magatzem.comptes.obertes).toBe(0);
  });

  it('error en escriure l’últim adjunt: s’avorta la transacció sencera i no hi ha cap mutació', async () => {
    const text = await exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU });
    const magatzem = creaMagatzemMemoria({ fallaEn: (op) => op.tipus === 'adjunt' && op.id === 'adj-3' });
    await expect(importaCopiaSeguretatXat(text, opcionsImport({ magatzem }))).rejects.toMatchObject({ codi: CODI_RESTAURACIO_AVORTADA, motiu: 'escriptura' });
    expect(magatzem.comptes).toMatchObject({ obertes: 1, confirmades: 0, avortades: 1 });
    expect(magatzem.comptes.escrits).toBeGreaterThan(0); // hi havia escriptures en staging
    expect(magatzem.confirmat.size).toBe(0);
  });

  it('cancel·lada per senyal: cap transacció', async () => {
    const text = await exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU });
    const control = new AbortController();
    control.abort();
    const magatzem = creaMagatzemMemoria();
    await expect(importaCopiaSeguretatXat(text, opcionsImport({ magatzem, senyal: control.signal }))).rejects.toMatchObject({ codi: CODI_RESTAURACIO_AVORTADA, motiu: 'avortat' });
    expect(magatzem.comptes.obertes).toBe(0);
  });

  it('commit: tot insereix-si-absent i el registre de la còpia dins de la mateixa transacció; reimport idempotent', async () => {
    const { text, rebut } = await exportaCopiaSeguretatXatAmbRebut({ ...base, contrasenya: CLAU });
    const magatzem = creaMagatzemMemoria();
    const res = await importaCopiaSeguretatXat(text, opcionsImport({ magatzem }));
    expect(res.operacions.every((o) => o.mode === 'insereix-si-absent')).toBe(true);
    expect(res.operacions.at(-1)).toMatchObject({ tipus: 'registre_copia', id: rebut.backupId });
    expect(res.rebut.empremta).toBe(rebut.empremta);
    expect(magatzem.comptes).toMatchObject({ obertes: 1, confirmades: 1, avortades: 0 });
    expect(magatzem.confirmat.size).toBe(FILS.length + MISSATGES.length + ADJUNTS.length + 1);
    const segona = await importaCopiaSeguretatXat(text, opcionsImport({ magatzem, estatLocal: { copies: { [rebut.backupId]: res.rebut } } }));
    expect(segona).toMatchObject({ idempotent: true, operacions: [] });
    expect(magatzem.comptes.obertes).toBe(1);
    expect((await descriuCopiaSeguretatXat(text)).empremta).toBe(rebut.empremta);
  });

  it('mateixa id amb bytes distints es rebutja', async () => {
    const { text, rebut } = await exportaCopiaSeguretatXatAmbRebut({ ...base, contrasenya: CLAU });
    const fals = { ...rebut, empremta: '0'.repeat(64) };
    await expect(importaCopiaSeguretatXat(text, opcionsImport({ estatLocal: { copies: { [rebut.backupId]: fals } } })))
      .rejects.toMatchObject({ codi: CODI_CADENA_DIVERGENT, motiu: 'mateixa-id-bytes-distints' });
  });
});

describe('incrementals: base, cursors per fil i bifurcacions', () => {
  const filsAB = [{ id: 'a' }, { id: 'b' }];
  const msgsAB = [
    { id: 'a100', filId: 'a', seq: 100 }, { id: 'a101', filId: 'a', seq: 101 },
    { id: 'b1', filId: 'b', seq: 1 }, { id: 'b2', filId: 'b', seq: 2 },
  ];
  const ambit = { usuariId: U, tenantId: T, contrasenya: CLAU, fils: filsAB };

  it('la seq és de cada fil: cap missatge d’un fil curt es perd darrere del màxim d’un altre (Codex R26)', async () => {
    const complet = await exportaCopiaSeguretatXatAmbRebut({ ...ambit, missatges: msgsAB.filter((m) => m.id !== 'a101' && m.id !== 'b2') });
    expect(complet.rebut.ultimSeqPerFil).toEqual({ a: 100, b: 1 });
    const inc = await exportaCopiaSeguretatXatAmbRebut({ ...ambit, missatges: msgsAB, base: complet.rebut });
    const res = await importaCopiaSeguretatXat(inc.text, opcionsImport({ estatLocal: { copies: { [complet.rebut.backupId]: complet.rebut } } }));
    expect(res.missatges.map((m) => m.id)).toEqual(['a101', 'b2']);
    expect(res.rebut.ultimSeqPerFil).toEqual({ a: 101, b: 2 });
    expect(res.manifest.cursors.desDeSeqPerFil).toEqual({ a: 100, b: 1 });
  });

  it('cursor global ambigu, cursors invàlids i seq invàlida en incremental es rebutgen', async () => {
    await expect(exportaCopiaSeguretatXat({ ...ambit, missatges: msgsAB, desDeSeq: 100 })).rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'cursor-ambigu' });
    for (const v of [NaN, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      await expect(exportaCopiaSeguretatXat({ ...ambit, fils: [{ id: 'a' }], missatges: msgsAB.slice(0, 2), desDeSeq: v })).rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'cursor-invalid' });
    }
    const p = await exportaCopiaSeguretatXat({ ...ambit, missatges: msgsAB, desDeSeqPerFil: { a: 100, b: 1 } });
    expect((await importaCopiaSeguretatXat(p, opcionsImport())).manifest.mode).toBe('parcial');
    await expect(exportaCopiaSeguretatXat({ ...ambit, fils: [{ id: 'a' }], missatges: [{ id: 'x', filId: 'a', seq: NaN }], desDeSeqPerFil: { a: 1 } }))
      .rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'missatge-seq' });
  });

  it('base absent, base amb altres bytes, bifurcació i cursors que no són els de la base es rebutgen', async () => {
    const complet = await exportaCopiaSeguretatXatAmbRebut({ ...ambit, missatges: msgsAB.slice(0, 1) });
    const inc = await exportaCopiaSeguretatXatAmbRebut({ ...ambit, missatges: msgsAB, base: complet.rebut });
    const magatzem = creaMagatzemMemoria();
    await expect(importaCopiaSeguretatXat(inc.text, opcionsImport({ magatzem }))).rejects.toMatchObject({ codi: CODI_BASE_ABSENT, motiu: 'base-absent' });
    const copies = (entrades) => ({ copies: Object.fromEntries(entrades.map((e) => [e.backupId, e])) });
    await expect(importaCopiaSeguretatXat(inc.text, opcionsImport({ magatzem, estatLocal: copies([{ ...complet.rebut, empremta: 'e'.repeat(64) }]) })))
      .rejects.toMatchObject({ codi: CODI_CADENA_DIVERGENT, motiu: 'base-divergent' });
    const germana = { backupId: kid(0x22), empremta: 'd'.repeat(64), mode: 'incremental', baseId: complet.rebut.backupId, ultimSeqPerFil: {} };
    await expect(importaCopiaSeguretatXat(inc.text, opcionsImport({ magatzem, estatLocal: copies([complet.rebut, germana]) })))
      .rejects.toMatchObject({ codi: CODI_CADENA_DIVERGENT, motiu: 'bifurcacio' });
    await expect(importaCopiaSeguretatXat(inc.text, opcionsImport({ magatzem, estatLocal: copies([{ ...complet.rebut, ultimSeqPerFil: { a: 99 } }]) })))
      .rejects.toMatchObject({ codi: CODI_CADENA_DIVERGENT, motiu: 'cursor-base' });
    await expect(exportaCopiaSeguretatXat({ ...ambit, missatges: msgsAB, base: { ...complet.rebut, mode: 'parcial' } }))
      .rejects.toMatchObject({ codi: CODI_CADENA_DIVERGENT, motiu: 'base-parcial' });
    expect(magatzem.comptes.obertes).toBe(0);
    const ok = await importaCopiaSeguretatXat(inc.text, opcionsImport({ magatzem, estatLocal: copies([complet.rebut]) }));
    expect(ok.missatges.map((m) => m.id)).toEqual(['a101', 'b1', 'b2']);
  });

  it('un tall de data no deixa avançar el cursor per damunt del primer missatge exclòs', async () => {
    const msgs = [
      { id: 'a1', filId: 'a', seq: 1, createdAt: '2026-11-01T08:00:00.000Z' },
      { id: 'a2', filId: 'a', seq: 2, createdAt: '2026-11-03T08:00:00.000Z' },
      { id: 'a3', filId: 'a', seq: 3, createdAt: '2026-11-01T09:00:00.000Z' }, // rellotge del mòbil desajustat
    ];
    const tall = await exportaCopiaSeguretatXatAmbRebut({ ...ambit, fils: [{ id: 'a' }], missatges: msgs, finsAlDia: '2026-11-02' });
    expect(tall.rebut.ultimSeqPerFil).toEqual({ a: 1 });
    const inc = await exportaCopiaSeguretatXatAmbRebut({ ...ambit, fils: [{ id: 'a' }], missatges: msgs, base: tall.rebut });
    const res = await importaCopiaSeguretatXat(inc.text, opcionsImport({ estatLocal: { copies: { [tall.rebut.backupId]: tall.rebut } } }));
    expect(res.missatges.map((m) => m.id)).toEqual(['a2', 'a3']);
  });

  it('esquema desconegut es rebutja', async () => {
    await expect(importaCopiaSeguretatXat(JSON.stringify({ esquema: 'sdp.xat.backup.v9', versio: 9 }), opcionsImport()))
      .rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'esquema' });
    await expect(importaCopiaSeguretatXat(JSON.stringify({ esquema: 'altra.cosa', versio: 2 }), opcionsImport()))
      .rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'esquema' });
  });
});

describe('contenidor: cotes i rutes', () => {
  const opPla = { usuariIdEsperat: U, tenantIdEsperat: T, permetSenseXifrar: true };

  it('ZIP bomb i niaments: mida, profunditat, membres i mida per adjunt', async () => {
    await expect(importaCopiaSeguretatXat('a'.repeat(MAX_BYTES_ARXIU_BACKUP + 1), opcionsImport())).rejects.toMatchObject({ codi: CODI_LIMIT_SUPERAT, motiu: 'arxiu-massa-gran' });
    await expect(importaCopiaSeguretatXat('['.repeat(100000), opcionsImport())).rejects.toMatchObject({ codi: CODI_LIMIT_SUPERAT, motiu: 'profunditat' });
    const pla = await exportaCopiaSeguretatXat({ ...base, permetSenseXifrar: true });
    const membres = await reescriuPla(pla, (p) => {
      p.dades.fils = Array.from({ length: MAX_FILS + 1 }, (_, i) => ({ id: `f${i}` }));
    });
    await expect(importaCopiaSeguretatXat(membres, opPla)).rejects.toMatchObject({ codi: CODI_LIMIT_SUPERAT, motiu: 'membres' });
    const gran = await reescriuPla(pla, (p) => { p.dades.adjunts[0].bytes = 20_000_001; });
    await expect(importaCopiaSeguretatXat(gran, opPla)).rejects.toMatchObject({ codi: CODI_LIMIT_SUPERAT, motiu: 'adjunt-mida' });
    const niat = await reescriuPla(pla, (p) => {
      let v = { fulla: 1 };
      for (let i = 0; i < 20; i += 1) v = { n: v };
      p.dades.fils[0].extra = v;
    });
    await expect(importaCopiaSeguretatXat(niat, opPla)).rejects.toMatchObject({ codi: CODI_LIMIT_SUPERAT, motiu: 'profunditat' });
  });

  it('arxius comprimits o còpies niades dins d’un adjunt es rebutgen en exportar i en importar', async () => {
    const zip = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(60, 1)]);
    await expect(exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU, adjunts: [{ id: 'z', missatgeId: 'm-1', mime: 'image/webp', dadesBase64: zip.toString('base64') }] }))
      .rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'arxiu-niat' });
    const pla = await exportaCopiaSeguretatXat({ ...base, permetSenseXifrar: true });
    for (const contingut of [zip, Buffer.from([0x1f, 0x8b, 8, 0, 0, 0]), Buffer.from('{"esquema":"sdp.xat.backup.v2","versio":2}')]) {
      const forjat = await reescriuPla(pla, (p) => { p.dades.adjunts[0] = adjuntPla('adj-1', 'm-1', contingut); });
      await expect(importaCopiaSeguretatXat(forjat, opPla)).rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'arxiu-niat' });
    }
  });

  it('noms amb ../, absoluts, controls, bidi o no NFC; ids no ASCII o duplicats; URL d’adjunt', async () => {
    const pla = await exportaCopiaSeguretatXat({ ...base, permetSenseXifrar: true });
    const bytes = Buffer.alloc(80, 4);
    for (const nom of ['../../etc/passwd', '/var/mobile/x.webp', 'C:\\x.webp', 'foto\u202Egpj.exe', 'cafe\u0301.webp', '.amagat', 'a\u0000b']) {
      const forjat = await reescriuPla(pla, (p) => { p.dades.adjunts[0] = adjuntPla('adj-1', 'm-1', bytes, { nom }); });
      await expect(importaCopiaSeguretatXat(forjat, opPla)).rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'nom-adjunt' });
    }
    const ambUrl = await reescriuPla(pla, (p) => { p.dades.adjunts[0].url = 'https://atacant.invalid/x'; });
    await expect(importaCopiaSeguretatXat(ambUrl, opPla)).rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'adjunt-forma' });
    const duplicat = await reescriuPla(pla, (p) => { p.dades.missatges.push({ ...p.dades.missatges[0] }); });
    await expect(importaCopiaSeguretatXat(duplicat, opPla)).rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'missatge-duplicat' });
    for (const id of ['m-\u00e9', 'm-e\u0301', '../m', 'm/1']) {
      const forjat = await reescriuPla(pla, (p) => { p.dades.missatges[0].id = id; });
      await expect(importaCopiaSeguretatXat(forjat, opPla)).rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'missatge-id' });
    }
    const mime = await reescriuPla(pla, (p) => { p.dades.adjunts[0].mime = 'text/html'; });
    await expect(importaCopiaSeguretatXat(mime, opPla)).rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'adjunt-mime' });
    // En exportar, el nom d'origen es saneja i la còpia es pot restaurar.
    const text = await exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU, adjunts: [{ ...ADJUNTS[0], nom: '../foto 12:30\u202E.webp' }] });
    const res = await importaCopiaSeguretatXat(text, opcionsImport());
    expect(res.adjunts[0].nom).toBe('_foto 12_30.webp');
  });

  it('un adjunt sense dades no es convertix en un adjunt buit ni en una ruta a recuperar', async () => {
    await expect(exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU, adjunts: [{ id: 'adj-1', missatgeId: 'm-1', mime: 'image/webp', url: 'https://x.invalid/a' }] }))
      .rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'adjunt-base64' });
    await expect(exportaCopiaSeguretatXat({ ...base, contrasenya: CLAU, adjunts: [{ id: 'adj-1', missatgeId: 'm-1', mime: 'image/webp', dadesBase64: 'QR==' }] }))
      .rejects.toMatchObject({ codi: CODI_COPIA_CORRUPTA, motiu: 'adjunt-base64' });
  });
});

describe('traspàs QR/LAN', () => {
  const ARA = 1_790_000_000_000;
  const empremta = (n) => Array.from({ length: 32 }, () => n.toString(16).padStart(2, '0').toUpperCase()).join(':');
  const sdp = (n) => `v=0\r\no=- ${n} 2 IN IP4 192.168.1.${n}\r\na=fingerprint:sha-256 ${empremta(n)}\r\n`;

  async function parella() {
    const nou = await generaParellaEfimeraTraspas();
    const vell = await generaParellaEfimeraTraspas();
    const oferta = await creaOfertaTraspasLocalQr({ usuariId: U, tenantId: T, sdpOffer: sdp(10), clauPublicaEfimeraJwk: nou.clauPublicaJwk, araMs: ARA });
    return { nou, vell, oferta };
  }

  it('SAS de 6 dígits dels dos extrems: un home del mig que canvia la resposta no el pot fer quadrar', async () => {
    const { nou, vell, oferta } = await parella();
    const resposta = await creaRespostaTraspasLocalQr(oferta, { usuariId: U, tenantId: T, sdpAnswer: sdp(20), clauPublicaEfimeraJwk: vell.clauPublicaJwk, araMs: ARA + 1000, sessionsConsumides: new Set() });
    const sasVell = await derivaSasTraspasLocalQr({ oferta, resposta, clauPrivadaEfimera: vell.clauPrivada, rol: 'responent', araMs: ARA + 2000 });
    // L'atacant intercepta la resposta pel LAN i hi posa la seua clau i el seu DTLS.
    const atacant = await generaParellaEfimeraTraspas();
    const falsa = { ...resposta, nonce: Buffer.alloc(16, 0x33).toString('base64url'), sdpAnswer: sdp(66), clauPublicaEfimeraJwk: atacant.clauPublicaJwk };
    const sasNou = await derivaSasTraspasLocalQr({ oferta, resposta: falsa, clauPrivadaEfimera: nou.clauPrivada, rol: 'oferent', araMs: ARA + 2000, sessionsConsumides: new Set() });
    expect(sasNou.transcriptSha256).not.toBe(sasVell.transcriptSha256);
    expect(sasNou.codiVerificacioSas).not.toBe(sasVell.codiVerificacioSas);
    const comprovador = creaComprovadorSas({ codiVerificacioSas: sasNou.codiVerificacioSas, maxIntents: 3 });
    expect(() => comprovador.comprova(sasVell.codiVerificacioSas)).toThrow(expect.objectContaining({ codi: CODI_QR_INVALID, motiu: 'sas-no-coincidix' }));
    expect(() => comprovador.comprova('000000' === sasNou.codiVerificacioSas ? '000001' : '000000')).toThrow(expect.objectContaining({ motiu: 'sas-no-coincidix' }));
    expect(() => comprovador.comprova('12345')).toThrow(expect.objectContaining({ motiu: 'sas-bloquejat' }));
    expect(comprovador.bloquejat).toBe(true);
    expect(() => comprovador.comprova(sasNou.codiVerificacioSas)).toThrow(expect.objectContaining({ motiu: 'sas-bloquejat' }));
  });

  it('QR reusat, segona resposta, caducat i datat en el futur avorten', async () => {
    const { nou, vell, oferta } = await parella();
    const consumides = new Set();
    const opts = { usuariIdEsperat: U, tenantIdEsperat: T, araMs: ARA + 1000, sessionsConsumides: consumides };
    await expect(validaOfertaTraspasLocalQr(oferta, opts)).resolves.toMatchObject({ ok: true });
    await expect(validaOfertaTraspasLocalQr(oferta, opts)).rejects.toMatchObject({ codi: CODI_QR_INVALID, motiu: 'reutilitzat' });
    // Sense registre propi també és d'un sol ús (registre de la instància).
    const altra = (await parella()).oferta;
    await validaOfertaTraspasLocalQr(altra, { usuariIdEsperat: U, tenantIdEsperat: T, araMs: ARA + 1000 });
    await expect(validaOfertaTraspasLocalQr(altra, { usuariIdEsperat: U, tenantIdEsperat: T, araMs: ARA + 2000 })).rejects.toMatchObject({ motiu: 'reutilitzat' });
    // L'oferent accepta una sola resposta.
    const resposta = await creaRespostaTraspasLocalQr(oferta, { usuariId: U, tenantId: T, sdpAnswer: sdp(20), clauPublicaEfimeraJwk: vell.clauPublicaJwk, araMs: ARA + 1000, sessionsConsumides: new Set() });
    const respostesOferent = new Set();
    await derivaSasTraspasLocalQr({ oferta, resposta, clauPrivadaEfimera: nou.clauPrivada, rol: 'oferent', araMs: ARA + 2000, sessionsConsumides: respostesOferent });
    await expect(derivaSasTraspasLocalQr({ oferta, resposta, clauPrivadaEfimera: nou.clauPrivada, rol: 'oferent', araMs: ARA + 3000, sessionsConsumides: respostesOferent }))
      .rejects.toMatchObject({ motiu: 'resposta-repetida' });
    await expect(derivaSasTraspasLocalQr({ oferta, resposta, clauPrivadaEfimera: nou.clauPrivada, rol: 'oferent', araMs: oferta.expiraAtMs + 1, sessionsConsumides: new Set() }))
      .rejects.toMatchObject({ motiu: 'caducat' });
    // Caducat i datat en el futur (amb l'empremta refeta: no és la defensa).
    await expect(validaOfertaTraspasLocalQr(oferta, { ...opts, araMs: ARA + TTL_QR_MAX_MS + 1, sessionsConsumides: new Set() })).rejects.toMatchObject({ motiu: 'caducat' });
    const futur = await creaOfertaTraspasLocalQr({ usuariId: U, tenantId: T, sdpOffer: sdp(10), clauPublicaEfimeraJwk: nou.clauPublicaJwk, araMs: ARA + 365 * 24 * 3600 * 1000 });
    await expect(validaOfertaTraspasLocalQr(futur, { ...opts, sessionsConsumides: new Set() })).rejects.toMatchObject({ motiu: 'caducat' });
  });

  it('claus efímeres públiques estrictes, DTLS obligatori i cap reflexió de l’oferta', async () => {
    const { nou, oferta } = await parella();
    const privada = await globalThis.crypto.subtle.exportKey('jwk', (await globalThis.crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])).privateKey);
    await expect(creaOfertaTraspasLocalQr({ usuariId: U, tenantId: T, sdpOffer: sdp(10), clauPublicaEfimeraJwk: privada, araMs: ARA })).rejects.toMatchObject({ motiu: 'jwk-privada' });
    await expect(creaOfertaTraspasLocalQr({ usuariId: U, tenantId: T, sdpOffer: 'v=0\r\n', clauPublicaEfimeraJwk: nou.clauPublicaJwk, araMs: ARA })).rejects.toMatchObject({ motiu: 'dtls' });
    await expect(creaRespostaTraspasLocalQr(oferta, { usuariId: U, tenantId: T, sdpAnswer: sdp(20), clauPublicaEfimeraJwk: nou.clauPublicaJwk, araMs: ARA + 1000, sessionsConsumides: new Set() }))
      .rejects.toMatchObject({ motiu: 'reflexio' });
    await expect(creaRespostaTraspasLocalQr(oferta, { usuariId: 'usr-intrus', tenantId: T, sdpAnswer: sdp(20), clauPublicaEfimeraJwk: nou.clauPublicaJwk, araMs: ARA + 1000, sessionsConsumides: new Set() }))
      .rejects.toMatchObject({ codi: CODI_IDENTITAT_DIVERGENT });
  });
});
