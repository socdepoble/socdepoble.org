// @vitest-environment node
/* El magatzem de les claus dels xats privats (P1-12 / IDEA-19, pas 6 del
   disseny E2EE: disseny_final_e2ee.md §8.1, §4.3-§4.5, §5.5, §8.6, D-08 i
   D-09). WebCrypto de veres (el de Node) damunt de l'IndexedDB fals que clona
   amb structuredClone (tests/helpers/idbFalsEstructurat.js, LLEI_08). Es mira
   que una CryptoKey no extraïble es desa, es rellig des d'un altre magatzem
   (una recàrrega) i encara signa, deriva i desxifra; que tot falla tancat
   (sense IndexedDB, WebCrypto o CryptoKey, amb un motor que perd o no sap
   clonar les claus, i amb files trencades o illegibles); la safata de 30 dies
   i la purga de tothom; l'oblit en eixir amb i sense «Mantén la sessió», també
   amb una base més nova o un motor que falla; les operacions tardanes després
   d'eixir, en una instància o en dues de la mateixa pestanya; i dues
   pestanyes, versions noves, blocked, termini, close i quota. Dades sintètiques. */
import { describe, expect, test } from 'vitest';
import { creaIdbFalsEstructurat } from '../../tests/helpers/idbFalsEstructurat.js';
import { MAX_EPOCA } from './xifratXatFormats.js';
import {
  CADUCITAT_SAFATA_MS, IDENTITAT_MALMESA, MAGATZEMS_XAT, MARGE_FUTUR_SAFATA_MS, MAX_BYTES_SAFATA, MAX_MISSATGES_SAFATA, NOM_BD_XAT,
  VERSIO_BD_XAT, clauIdentitat, creaMagatzemXat
} from './xifratXatMagatzem.js';

const cripto = globalThis.crypto;
const ClasseClau = globalThis.CryptoKey;
const JO = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const ALTRA = '0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d';
const FIL = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const ALTRE_FIL = '9b2d5f1e-3c4a-4e8b-9d6f-1a2b3c4d5e6f';
const ENDPOINT = 'https://exemple.supabase.co';
const CI = clauIdentitat({ backendId: 'supabase', endpoint: ENDPOINT, joId: JO });
const CI_ALTRA = clauIdentitat({ backendId: 'supabase', endpoint: ENDPOINT, joId: ALTRA });
const ACTOR = `persona::${JO}`;
const ACTOR_ALTRA = `persona::${ALTRA}`;
const INICI = Date.UTC(2026, 9, 29, 9);
const DIA = 24 * 60 * 60 * 1000;
const ambCodi = (codi) => expect.objectContaining({ codi });

const uuid = () => cripto.randomUUID();
const bytes = (n) => cripto.getRandomValues(new Uint8Array(n));
const clonaJson = (valor) => (valor === undefined ? undefined : JSON.parse(JSON.stringify(valor)));
const torns = async (n = 20) => {
  for (let i = 0; i < n; i += 1) await new Promise((resol) => setImmediate(resol));
};
const codiDe = (promesa) => promesa.then(() => 'ok', (error) => error.codi ?? error.name);
/* El codi, o PENJADA si no torna: una operació que es penja no ha de penjar la prova. */
const termini = (promesa, ms = 1000) => Promise.race([codiDe(promesa), new Promise((resol) => setTimeout(() => resol('PENJADA'), ms))]);

function entorn({ clona, criptoDe = cripto, classe = ClasseClau } = {}) {
  const fals = creaIdbFalsEstructurat(clona ? { clona } : undefined);
  const rellotge = { ms: INICI };
  const amb = (idb) => creaMagatzemXat({ idb, rangs: fals.IDBKeyRange, cripto: criptoDe, ClasseClau: classe, ara: () => rellotge.ms });
  /* obri(): una altra instància (una recàrrega) en esta pestanya; obriPestanya(): en una altra pestanya. */
  const obri = () => amb(fals);
  const obriPestanya = () => amb(fals.pestanya());
  return { fals, rellotge, obri, obriPestanya, m: obri() };
}

/* Un WebCrypto que, una sola vegada, fa alguna cosa just després de l'operació `nom` (com una altra pestanya en eixe moment). */
function criptoAmbGanxo(nom) {
  const ganxo = { despres: async () => {} };
  const subtle = cripto.subtle;
  const criptoDe = {
    getRandomValues: (valor) => cripto.getRandomValues(valor),
    subtle: {
      generateKey: (...a) => subtle.generateKey(...a),
      encrypt: (...a) => subtle.encrypt(...a),
      decrypt: (...a) => subtle.decrypt(...a),
      [nom]: async (...a) => {
        const resultat = await subtle[nom](...a);
        const despres = ganxo.despres;
        ganxo.despres = async () => {};
        await despres();
        return resultat;
      }
    }
  };
  return { ganxo, criptoDe };
}

async function novaIdentitat(usuari = JO) {
  const sig = await cripto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']);
  const dh = await cripto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  const identitat = {
    usuari,
    kid: bytes(16),
    sigPub: new Uint8Array(await cripto.subtle.exportKey('raw', sig.publicKey)),
    dhPub: new Uint8Array(await cripto.subtle.exportKey('raw', dh.publicKey)),
    sigPriv: sig.privateKey,
    dhPriv: dh.privateKey,
    creatMs: INICI
  };
  return { identitat, publiques: { sig: sig.publicKey, dh: dh.publicKey } };
}
const clauDEpoca = () => cripto.subtle.importKey('raw', bytes(32), 'HKDF', false, ['deriveBits', 'deriveKey']);
const clauLocal = () => cripto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

const totesLesFiles = (fals) => MAGATZEMS_XAT.flatMap((nom) => fals.files(NOM_BD_XAT, nom).map((fila) => ({ nom, ...fila })));
const deLaPersona = (fals, ci) => totesLesFiles(fals).filter(({ clau }) => clau[0] === ci);
/* La fila tal com dorm al fals (per a manipular-la com faria algú amb el disc). */
const filaDesada = (fals, nom, clau) => [...fals.bases.get(NOM_BD_XAT).stores.get(nom).files.values()]
  .find((fila) => JSON.stringify(fila.clau) === JSON.stringify(clau)).valor;
const trenca = (fals, nom, clau, canvi) => Object.assign(filaDesada(fals, nom, clau), canvi);
const conte = (pallar, agulla) => {
  for (let i = 0; i + agulla.length <= pallar.length; i += 1) if (agulla.every((b, j) => pallar[i + j] === b)) return true;
  return false;
};

function obriDirecte(fals, versio, actualitza = () => {}, quanBloquejada = () => {}) {
  return new Promise((resol, rebutja) => {
    const peticio = fals.open(NOM_BD_XAT, versio);
    peticio.onupgradeneeded = () => actualitza(peticio.result);
    peticio.onblocked = quanBloquejada;
    peticio.onsuccess = () => resol(peticio.result);
    peticio.onerror = () => rebutja(peticio.error);
  });
}
/* Una petició open que falla amb `nom` (com el navegador: l'error arriba després). */
const peticioQueFalla = (nom) => {
  const peticio = { result: undefined, error: new DOMException('Simulat.', nom) };
  setTimeout(() => peticio.onerror?.({ type: 'error', target: peticio }), 0);
  return peticio;
};

/* Una fila de cada cosa per a la persona: 7 files (identitat, llibreta, fixació, fil, CK, clau i missatge de la safata). */
async function ompli(m, ci, usuari) {
  const { identitat } = await novaIdentitat(usuari);
  await m.desaIdentitat(ci, identitat);
  await m.desaComptadorLlibreta(ci, 1);
  await m.fixa(ci, { usuari: uuid(), kid: bytes(16) });
  await m.avancaCap(ci, FIL, { nou: { epoca: 1, hash: bytes(32) } });
  await m.desaClauDeFil(ci, { fil: FIL, epoca: 1, clau: await clauDEpoca(), hashE: bytes(32) });
  await m.desaASafata(ci, { actor: `persona::${usuari}`, fil: FIL, id: uuid(), contingut: { text: 'esperant' } });
}

describe('l’entorn i el fals estructurat', () => {
  test('hi ha WebCrypto i CryptoKey, i structuredClone conserva una CryptoKey no extraïble', async () => {
    expect(typeof cripto?.subtle?.encrypt).toBe('function');
    expect(typeof ClasseClau).toBe('function');
    const clau = await clauLocal();
    const copia = structuredClone(clau);
    expect(copia).toBeInstanceOf(ClasseClau);
    expect(copia.extractable).toBe(false);
  });

  test('el fals torna una CryptoKey usable; amb un clonatge JSON (com idbFals.js) seria {}', async () => {
    for (const [clona, esClau] of [[undefined, true], [clonaJson, false]]) {
      const fals = creaIdbFalsEstructurat(clona ? { clona } : undefined);
      const bd = await obriDirecte(fals, 1, (base) => base.createObjectStore('s'));
      const clau = await clauLocal();
      const tx = bd.transaction(['s'], 'readwrite');
      tx.objectStore('s').put({ clau }, ['k']);
      const peticio = tx.objectStore('s').get(['k']);
      const llegida = await new Promise((resol) => { peticio.onsuccess = () => resol(peticio.result.clau); });
      expect(llegida instanceof ClasseClau).toBe(esClau);
    }
  });

  test('sense índexs ni cursors; una petició després d’esperar el WebCrypto dins d’una transacció falla', async () => {
    const fals = creaIdbFalsEstructurat();
    const bd = await obriDirecte(fals, 1, (base) => {
      const store = base.createObjectStore('s');
      expect(() => store.createIndex('perUsuari', 'usuari')).toThrow(expect.objectContaining({ name: 'NotSupportedError' }));
    });
    const store = bd.transaction(['s'], 'readwrite').objectStore('s');
    expect(() => store.index('perUsuari')).toThrow(expect.objectContaining({ name: 'NotSupportedError' }));
    expect(() => store.openCursor()).toThrow(expect.objectContaining({ name: 'NotSupportedError' }));
    await cripto.subtle.digest('SHA-256', new Uint8Array(1));
    expect(() => store.put(1, ['tard'])).toThrow(expect.objectContaining({ name: 'TransactionInactiveError' }));
  });

  test('el fals: una connexió que no es tanca en versionchange bloqueja l’actualització fins que es tanca', async () => {
    const fals = creaIdbFalsEstructurat();
    const vella = await obriDirecte(fals, 1, (base) => base.createObjectStore('s'));
    let avisada = false;
    vella.onversionchange = () => { avisada = true; };
    let bloquejada = false;
    const nova = obriDirecte(fals, 2, () => {}, () => { bloquejada = true; });
    await torns();
    expect([avisada, bloquejada]).toEqual([true, true]);
    vella.close();
    expect((await nova).version).toBe(2);
  });

  test('el fals desfà al mateix lloc (la que esperava no veu el desfet ni perd el seu), esborrar no gasta espai i una actualització que llança no deixa res', async () => {
    const fals = creaIdbFalsEstructurat();
    const bd = await obriDirecte(fals, 1, (base) => base.createObjectStore('s'));
    const acaba = (tx) => new Promise((resol) => {
      tx.oncomplete = () => resol('complete');
      tx.onabort = () => resol('abort');
    });
    const tx1 = bd.transaction(['s'], 'readwrite');
    const s1 = tx1.objectStore('s');
    const tx2 = bd.transaction(['s'], 'readwrite');
    const s2 = tx2.objectStore('s');
    s1.put('brut', ['A']).onsuccess = () => tx1.abort();
    let vist = 'res';
    const llegida = s2.get(['A']);
    llegida.onsuccess = () => {
      vist = llegida.result;
      s2.put('bo', ['B']);
    };
    expect(await Promise.all([acaba(tx1), acaba(tx2)])).toEqual(['abort', 'complete']);
    expect(vist).toBeUndefined();
    expect(fals.files(NOM_BD_XAT, 's')).toEqual([{ clau: ['B'], valor: 'bo' }]);
    fals.omplit = true;
    const esborra = bd.transaction(['s'], 'readwrite');
    esborra.objectStore('s').delete(['B']);
    const afig = bd.transaction(['s'], 'readwrite');
    afig.objectStore('s').put('massa', ['C']);
    expect(await Promise.all([acaba(esborra), acaba(afig)])).toEqual(['complete', 'abort']);
    expect(fals.files(NOM_BD_XAT, 's')).toEqual([]);
    const altre = creaIdbFalsEstructurat();
    await expect(obriDirecte(altre, 1, (base) => {
      base.createObjectStore('s');
      throw new Error('Una migració trencada.');
    })).rejects.toMatchObject({ name: 'AbortError' });
    expect(altre.bases.has(NOM_BD_XAT)).toBe(false);
  });
});

describe('falla tancat', () => {
  test('sense IndexedDB, IDBKeyRange, WebCrypto o CryptoKey no es crea, i mai passa a memòria', () => {
    const fals = creaIdbFalsEstructurat();
    expect(() => creaMagatzemXat({ cripto })).toThrow(ambCodi('SENSE_INDEXEDDB'));
    for (const idb of [null, {}]) expect(() => creaMagatzemXat({ idb, rangs: fals.IDBKeyRange, cripto })).toThrow(ambCodi('SENSE_INDEXEDDB'));
    expect(() => creaMagatzemXat({ idb: fals, rangs: null, cripto })).toThrow(ambCodi('SENSE_INDEXEDDB'));
    for (const dolent of [undefined, {}, { getRandomValues: () => {} }, { subtle: {}, getRandomValues: () => {} }]) {
      expect(() => creaMagatzemXat({ idb: fals, rangs: fals.IDBKeyRange, cripto: dolent })).toThrow(ambCodi('SENSE_CRIPTO'));
    }
    expect(() => creaMagatzemXat({ idb: fals, rangs: fals.IDBKeyRange, cripto, ClasseClau: null })).toThrow(ambCodi('SENSE_CRIPTO'));
    for (const terminiMs of [0, -1, Number.NaN, '10']) {
      expect(() => creaMagatzemXat({ idb: fals, rangs: fals.IDBKeyRange, cripto, terminiMs })).toThrow(ambCodi('DADES_INVALIDES'));
    }
  });

  test('un motor que convertix la CryptoKey en {}: CLAUS_NO_DESABLES en tot, i la sonda no deixa res', async () => {
    const { fals, m } = entorn({ clona: clonaJson });
    const { identitat } = await novaIdentitat();
    await expect(m.comprova()).rejects.toThrow(ambCodi('CLAUS_NO_DESABLES'));
    await expect(m.identitat(CI)).rejects.toThrow(ambCodi('CLAUS_NO_DESABLES'));
    await expect(m.desaIdentitat(CI, identitat)).rejects.toThrow(ambCodi('CLAUS_NO_DESABLES'));
    await expect(m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { text: 'hola' } })).rejects.toThrow(ambCodi('CLAUS_NO_DESABLES'));
    expect(totesLesFiles(fals)).toEqual([]);
    /* Un motor així no canvia: la sonda no es repetix. */
    expect(fals.operacions.filter((o) => o === 'put')).toHaveLength(1);
  });

  test('un motor que no sap clonar una CryptoKey (DataCloneError): CLAUS_NO_DESABLES', async () => {
    const ambClau = (valor) => valor instanceof ClasseClau || (valor !== null && typeof valor === 'object'
      && !ArrayBuffer.isView(valor) && Object.values(valor).some(ambClau));
    const { fals, m } = entorn({
      clona: (valor) => {
        if (ambClau(valor)) throw new DOMException('No es pot clonar.', 'DataCloneError');
        return structuredClone(valor);
      }
    });
    await expect(m.comprova()).rejects.toThrow(ambCodi('CLAUS_NO_DESABLES'));
    expect(totesLesFiles(fals)).toEqual([]);
  });

  test('un error dins del gestor d’una petició conserva el seu codi: el DataCloneError d’una privada o d’una HKDF, i el rellotge', async () => {
    /* Clona la AES-GCM de la sonda, però no les privades ni les HKDF: el put va dins d'un onsuccess. */
    const noClonable = (valor) => (valor instanceof ClasseClau ? valor.type === 'private' || valor.algorithm.name === 'HKDF'
      : valor !== null && typeof valor === 'object' && !ArrayBuffer.isView(valor) && Object.values(valor).some(noClonable));
    const { fals, rellotge, m } = entorn({
      clona: (valor) => {
        if (noClonable(valor)) throw new DOMException('No es pot clonar.', 'DataCloneError');
        return structuredClone(valor);
      }
    });
    expect(await m.comprova()).toBe(true);
    const { identitat } = await novaIdentitat();
    await expect(m.desaIdentitat(CI, identitat)).rejects.toThrow(ambCodi('CLAUS_NO_DESABLES'));
    await expect(m.desaClauDeFil(CI, { fil: FIL, epoca: 1, clau: await clauDEpoca(), hashE: bytes(32) })).rejects.toThrow(ambCodi('CLAUS_NO_DESABLES'));
    expect(totesLesFiles(fals)).toEqual([]);
    rellotge.ms = Number.NaN;
    await expect(m.safata(CI, ACTOR)).rejects.toThrow(ambCodi('DADES_INVALIDES'));
  });

  test('un motor que passa la sonda però perd altres claus: cada escriptura es rellig i res no queda desat', async () => {
    /* Perd les privades (identitat), les HKDF (CK) i la de repòs de la safata (la fila que porta idClau). */
    const perd = (valor) => {
      if (valor instanceof ClasseClau) return valor.type === 'private' || valor.algorithm.name === 'HKDF' ? {} : valor;
      if (valor === null || typeof valor !== 'object' || ArrayBuffer.isView(valor)) return valor;
      const copia = Object.fromEntries(Object.entries(valor).map(([camp, v]) => [camp, perd(v)]));
      if ('idClau' in valor) copia.clau = {};
      return copia;
    };
    const { fals, m } = entorn({ clona: (valor) => structuredClone(perd(valor)) });
    expect(await m.comprova()).toBe(true);
    const { identitat } = await novaIdentitat();
    await expect(m.desaIdentitat(CI, identitat)).rejects.toThrow(ambCodi('CLAUS_NO_DESABLES'));
    await expect(m.desaClauDeFil(CI, { fil: FIL, epoca: 1, clau: await clauDEpoca(), hashE: bytes(32) })).rejects.toThrow(ambCodi('CLAUS_NO_DESABLES'));
    await expect(m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { text: 'hola' } })).rejects.toThrow(ambCodi('CLAUS_NO_DESABLES'));
    expect(totesLesFiles(fals)).toEqual([]);
  });

  test('si open falla (navegació privada, sense espai): SENSE_INDEXEDDB o SENSE_ESPAI, i la pròxima vegada ho torna a provar', async () => {
    const { fals, m } = entorn();
    fals.fallaEnObrir = new DOMException('Sense IndexedDB en privat.', 'InvalidStateError');
    await expect(m.identitat(CI)).rejects.toThrow(ambCodi('SENSE_INDEXEDDB'));
    fals.fallaEnObrir = new DOMException('Sense espai.', 'QuotaExceededError');
    await expect(m.identitat(CI)).rejects.toThrow(ambCodi('SENSE_ESPAI'));
    fals.fallaEnObrir = null;
    expect(await m.identitat(CI)).toBeNull();
  });

  test('una base amb el mateix nom i versió però sense els cinc magatzems: MAGATZEM_MALMES', async () => {
    const { fals, m } = entorn();
    (await obriDirecte(fals, 1, (bd) => bd.createObjectStore('identitats'))).close();
    await expect(m.comprova()).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));
  });

  test('l’esquema: versió 1, cinc magatzems amb claus fora de línia i sense índexs; només peticions per clau primària', async () => {
    const { fals, m } = entorn();
    expect(await m.comprova()).toBe(true);
    await ompli(m, CI, JO);
    await m.safata(CI, ACTOR);
    await m.purgaSafata();
    await m.instantaniaLlibreta(CI);
    await m.oblidaEnTancar(CI, { mantenSessio: true });
    const base = fals.bases.get(NOM_BD_XAT);
    expect([VERSIO_BD_XAT, base.versio]).toEqual([1, 1]);
    expect([...base.stores.keys()].sort()).toEqual([...MAGATZEMS_XAT].sort());
    for (const store of base.stores.values()) expect(store.keyPath).toBeNull();
    expect([...new Set(fals.operacions)].sort()).toEqual(['count', 'delete', 'get', 'getAll', 'getAllKeys', 'open', 'put']);
    /* La sonda no hi ha deixat res: totes les files comencen per la clauIdentitat. */
    expect(totesLesFiles(fals).every(({ clau }) => Array.isArray(clau) && clau[0] === CI)).toBe(true);
  });
});

describe('clauIdentitat', () => {
  test('[backendId, endpoint canònic, joId], sense tenant ni actor; cap altra clau hi val', async () => {
    expect(CI).toBe(JSON.stringify(['supabase', ENDPOINT, JO]));
    /* L'endpoint escrit d'una altra manera és la mateixa persona: eixir amb eixa forma ho esborra igual. */
    for (const endpoint of [`${ENDPOINT}/`, `${ENDPOINT}//`, 'https://EXEMPLE.supabase.co', `${ENDPOINT}:443`]) {
      expect(clauIdentitat({ backendId: 'supabase', endpoint, joId: JO })).toBe(CI);
    }
    expect(clauIdentitat({ backendId: 'wp', endpoint: 'http://localhost:8080/Poble/', joId: JO })).toBe(JSON.stringify(['wp', 'http://localhost:8080/Poble', JO]));
    for (const dolenta of [
      { backendId: '', endpoint: ENDPOINT, joId: JO },
      ...['', 'exemple.supabase.co', 'http://exemple.supabase.co', 'ftp://exemple.supabase.co', 'https://jo:clau@exemple.supabase.co',
        `${ENDPOINT}/?a=1`, `${ENDPOINT}/#a`, `${ENDPOINT}/${'x'.repeat(2048)}`, 42].map((endpoint) => ({ backendId: 'supabase', endpoint, joId: JO })),
      { backendId: 'supabase', endpoint: ENDPOINT, joId: JO.toUpperCase() },
      { backendId: 'supabase', endpoint: ENDPOINT, joId: 'jo' }
    ]) expect(() => clauIdentitat(dolenta)).toThrow(ambCodi('DADES_INVALIDES'));
    const { m } = entorn();
    for (const ci of [
      `backend:${JSON.stringify(['supabase', ENDPOINT, null, 'remote'])}`,
      JSON.stringify(['supabase', ENDPOINT, JO, 'actor']),
      JSON.stringify(['supabase', `${ENDPOINT}/`, JO]),
      CI.replace(',', ', '),
      42
    ]) await expect(m.identitat(ci)).rejects.toThrow(ambCodi('DADES_INVALIDES'));
  });
});

describe('la identitat (§4.3, D-07)', () => {
  test('les claus no extraïbles es desen, es rellegixen des d’un altre magatzem (una recàrrega) i encara signen i deriven', async () => {
    const { obri, m } = entorn();
    const { identitat, publiques } = await novaIdentitat();
    expect(await m.desaIdentitat(CI, identitat)).toBe(true);
    m.tanca();
    const llegida = await obri().identitat(CI);
    for (const clau of [llegida.sigPriv, llegida.dhPriv]) {
      expect(clau).toBeInstanceOf(ClasseClau);
      expect(clau.extractable).toBe(false);
      expect(clau).not.toBe(identitat.sigPriv);
      await expect(cripto.subtle.exportKey('pkcs8', clau)).rejects.toThrow();
    }
    const repte = new TextEncoder().encode('Sóc de Poble!');
    const firma = await cripto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, llegida.sigPriv, repte);
    expect(await cripto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publiques.sig, firma, repte)).toBe(true);
    const altra = await cripto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
    const secret = (clau) => cripto.subtle.deriveBits({ name: 'ECDH', public: altra.publicKey }, clau, 256);
    expect(new Uint8Array(await secret(llegida.dhPriv))).toEqual(new Uint8Array(await secret(identitat.dhPriv)));
    expect(llegida).toMatchObject({ usuari: JO, kid: identitat.kid, sigPub: identitat.sigPub, dhPub: identitat.dhPub, creatMs: INICI });
    expect(llegida).not.toHaveProperty('v');
  });

  test('la RK sota la clau local DK i la K_ll tornen i desxifren després de recarregar', async () => {
    const { obri, m } = entorn();
    const { identitat } = await novaIdentitat();
    const dk = await clauLocal();
    const clauLlibreta = await clauLocal();
    const rk = bytes(32);
    const iv = bytes(12);
    const rkXifrada = new Uint8Array(await cripto.subtle.encrypt({ name: 'AES-GCM', iv }, dk, rk));
    await m.desaIdentitat(CI, { ...identitat, recuperacio: { dk, iv, rk: rkXifrada }, clauLlibreta });
    const llegida = await obri().identitat(CI);
    const tornada = await cripto.subtle.decrypt({ name: 'AES-GCM', iv: llegida.recuperacio.iv }, llegida.recuperacio.dk, llegida.recuperacio.rk);
    expect(new Uint8Array(tornada)).toEqual(rk);
    const xifrat = await cripto.subtle.encrypt({ name: 'AES-GCM', iv }, clauLlibreta, rk);
    expect(new Uint8Array(await cripto.subtle.decrypt({ name: 'AES-GCM', iv }, llegida.clauLlibreta, xifrat))).toEqual(rk);
  });

  test('mai una identitat nova damunt de la vigent: comparar-i-canviar sobre el kid', async () => {
    const { m } = entorn();
    const { identitat: primera } = await novaIdentitat();
    const { identitat: segona } = await novaIdentitat();
    await m.desaIdentitat(CI, primera);
    await expect(m.desaIdentitat(CI, segona)).rejects.toThrow(ambCodi('IDENTITAT_EXISTENT'));
    await expect(m.desaIdentitat(CI, segona, { anterior: segona.kid })).rejects.toThrow(ambCodi('IDENTITAT_CANVIADA'));
    await expect(m.desaIdentitat(CI, segona, { anterior: IDENTITAT_MALMESA })).rejects.toThrow(ambCodi('IDENTITAT_CANVIADA'));
    await expect(m.desaIdentitat(CI, segona, { anterior: 'una altra' })).rejects.toThrow(ambCodi('DADES_INVALIDES'));
    expect((await m.identitat(CI)).kid).toEqual(primera.kid);
    expect(await m.desaIdentitat(CI, segona, { anterior: primera.kid })).toBe(true);
    expect((await m.identitat(CI)).kid).toEqual(segona.kid);
    const { identitat: dAltra } = await novaIdentitat(ALTRA);
    await expect(m.desaIdentitat(CI_ALTRA, dAltra, { anterior: primera.kid })).rejects.toThrow(ambCodi('IDENTITAT_CANVIADA'));
  });

  test('una clau extraïble, d’un altre algorisme o d’una altra persona no es desa; els camps desconeguts no ixen al disc', async () => {
    const { fals, m } = entorn();
    const { identitat } = await novaIdentitat();
    const extraible = await cripto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const aesExtraible = await cripto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    await expect(m.desaIdentitat(CI, { ...identitat, sigPriv: extraible.privateKey })).rejects.toThrow(ambCodi('CLAU_EXTRAIBLE'));
    await expect(m.desaIdentitat(CI, { ...identitat, recuperacio: { dk: aesExtraible, iv: bytes(12), rk: bytes(48) } })).rejects.toThrow(ambCodi('CLAU_EXTRAIBLE'));
    await expect(m.desaIdentitat(CI, { ...identitat, clauLlibreta: aesExtraible })).rejects.toThrow(ambCodi('CLAU_EXTRAIBLE'));
    await expect(m.desaIdentitat(CI, { ...identitat, sigPriv: identitat.dhPriv })).rejects.toThrow(ambCodi('DADES_INVALIDES'));
    await expect(m.desaIdentitat(CI, { ...identitat, sigPriv: {} })).rejects.toThrow(ambCodi('DADES_INVALIDES'));
    await expect(m.desaIdentitat(CI_ALTRA, identitat)).rejects.toThrow(ambCodi('DADES_INVALIDES'));
    await expect(m.desaIdentitat(CI, { ...identitat, sigPub: identitat.sigPub.slice(0, 33) })).rejects.toThrow(ambCodi('DADES_INVALIDES'));
    expect(totesLesFiles(fals)).toEqual([]);
    await m.desaIdentitat(CI, { ...identitat, jwk: { kty: 'EC', d: 'secret' }, extra: 1 });
    expect(Object.keys(filaDesada(fals, 'identitats', [CI, 'identitat'])).sort())
      .toEqual(['creatMs', 'dhPriv', 'dhPub', 'kid', 'sigPriv', 'sigPub', 'usuari', 'v']);
  });

  test('una identitat desada que no és la que tocava (clau perduda, d’una altra corba o d’una altra persona): CLAUS_MALMESES', async () => {
    const { fals, m } = entorn();
    const { identitat } = await novaIdentitat();
    await m.desaIdentitat(CI, identitat);
    const fila = filaDesada(fals, 'identitats', [CI, 'identitat']);
    const original = fila.sigPriv;
    fila.sigPriv = {};
    await expect(m.identitat(CI)).rejects.toThrow(ambCodi('CLAUS_MALMESES'));
    fila.sigPriv = (await cripto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])).privateKey;
    await expect(m.identitat(CI)).rejects.toThrow(ambCodi('CLAUS_MALMESES'));
    fila.sigPriv = (await cripto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-384' }, false, ['sign', 'verify'])).privateKey;
    await expect(m.identitat(CI)).rejects.toThrow(ambCodi('CLAUS_MALMESES'));
    fila.sigPriv = original;
    expect((await m.identitat(CI)).sigPriv).toBeInstanceOf(ClasseClau);
    fila.usuari = ALTRA;
    await expect(m.identitat(CI)).rejects.toThrow(ambCodi('CLAUS_MALMESES'));
  });

  test('un aparell restaurat que ja no sap llegir les claus (WebKit torna null, CP-17): CLAUS_MALMESES, i es refà sense trepitjar res sa', async () => {
    const velles = new WeakSet();
    let restaurat = false;
    const teVella = (valor) => (valor instanceof ClasseClau ? velles.has(valor)
      : valor !== null && typeof valor === 'object' && !ArrayBuffer.isView(valor) && Object.values(valor).some(teVella));
    const { fals, obri, m } = entorn({ clona: (valor) => (restaurat && teVella(valor) ? null : structuredClone(valor)) });
    const { identitat } = await novaIdentitat();
    await m.desaIdentitat(CI, identitat);
    const vell = uuid();
    await m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: vell, contingut: { text: 'abans' } });
    await m.desaClauDeFil(CI, { fil: FIL, epoca: 1, clau: await clauDEpoca(), hashE: bytes(32) });
    m.tanca();
    /* La restauració: cap CryptoKey desada abans es pot desembolcallar; la sonda, amb una clau nova, passa. */
    const marca = (valor) => {
      if (valor instanceof ClasseClau) velles.add(valor);
      else if (valor !== null && typeof valor === 'object' && !ArrayBuffer.isView(valor)) Object.values(valor).forEach(marca);
    };
    for (const nom of MAGATZEMS_XAT) for (const fila of fals.bases.get(NOM_BD_XAT).stores.get(nom).files.values()) marca(fila.valor);
    restaurat = true;
    const restaurada = obri();
    expect(await restaurada.comprova()).toBe(true);
    await expect(restaurada.identitat(CI)).rejects.toThrow(ambCodi('CLAUS_MALMESES'));
    await expect(restaurada.clauDeFil(CI, FIL, 1)).rejects.toThrow(ambCodi('CLAUS_MALMESES'));
    await expect(restaurada.clausDelFil(CI, FIL)).rejects.toThrow(ambCodi('CLAUS_MALMESES'));
    const { identitat: nova } = await novaIdentitat();
    await expect(restaurada.desaIdentitat(CI, nova)).rejects.toThrow(ambCodi('CLAUS_MALMESES'));
    await expect(restaurada.desaIdentitat(CI, nova, { anterior: identitat.kid })).rejects.toThrow(ambCodi('CLAUS_MALMESES'));
    expect(await restaurada.desaIdentitat(CI, nova, { anterior: IDENTITAT_MALMESA })).toBe(true);
    expect((await restaurada.identitat(CI)).kid).toEqual(nova.kid);
    await expect(restaurada.desaIdentitat(CI, identitat, { anterior: IDENTITAT_MALMESA })).rejects.toThrow(ambCodi('IDENTITAT_CANVIADA'));
    expect(await restaurada.desaClauDeFil(CI, { fil: FIL, epoca: 1, clau: await clauDEpoca(), hashE: bytes(32) })).toBe(true);
    expect(await restaurada.clausDelFil(CI, FIL)).toHaveLength(1);
    const nou = uuid();
    await restaurada.desaASafata(CI, { actor: ACTOR, fil: FIL, id: nou, contingut: { text: 'després' } });
    const entrades = await restaurada.safata(CI, ACTOR);
    expect(Object.fromEntries(entrades.map((e) => [e.id, e.malmes]))).toEqual({ [vell]: true, [nou]: false });
  });
});

describe('fixacions, caps i claus d’època (§4.4, §4.5)', () => {
  test('TOFU: el primer kid es fixa; un altre només entra comparant amb el fixat', async () => {
    const { m, rellotge } = entorn();
    const kid = bytes(16);
    const nou = bytes(16);
    expect(await m.fixa(CI, { usuari: ALTRA, kid })).toEqual({ usuari: ALTRA, kid, verificat: false, vistAl: INICI });
    rellotge.ms += 5000;
    expect(await m.fixa(CI, { usuari: ALTRA, kid, verificat: true })).toMatchObject({ verificat: true, vistAl: INICI + 5000 });
    expect(await m.fixa(CI, { usuari: ALTRA, kid, vistAl: INICI })).toMatchObject({ verificat: true, vistAl: INICI + 5000 });
    await expect(m.fixa(CI, { usuari: ALTRA, kid: nou })).rejects.toThrow(ambCodi('FIXACIO_DIFERENT'));
    await expect(m.fixa(CI, { usuari: ALTRA, kid: nou }, { anterior: bytes(16) })).rejects.toThrow(ambCodi('FIXACIO_CANVIADA'));
    expect((await m.fixacio(CI, ALTRA)).kid).toEqual(kid);
    expect(await m.fixa(CI, { usuari: ALTRA, kid: nou }, { anterior: kid })).toMatchObject({ kid: nou, verificat: false });
    expect((await m.fixacions(CI)).map((f) => f.usuari)).toEqual([ALTRA]);
    expect(await m.fixacions(CI_ALTRA)).toEqual([]);
  });

  test('el cap d’un fil només avança, comparant amb el d’abans; un reintent no fa res', async () => {
    const { m } = entorn();
    const [h1, h2, h3] = [bytes(32), bytes(32), bytes(32)];
    expect(await m.filXifrat(CI, FIL)).toBeNull();
    expect(await m.avancaCap(CI, FIL, { nou: { epoca: 1, hash: h1 } })).toBe(true);
    expect(await m.avancaCap(CI, FIL, { nou: { epoca: 1, hash: h1 } })).toBe(false);
    await expect(m.avancaCap(CI, FIL, { nou: { epoca: 2, hash: h2 } })).rejects.toThrow(ambCodi('CAP_CANVIAT'));
    await expect(m.avancaCap(CI, FIL, { anterior: { epoca: 1, hash: h2 }, nou: { epoca: 2, hash: h3 } })).rejects.toThrow(ambCodi('CAP_CANVIAT'));
    await expect(m.avancaCap(CI, FIL, { anterior: { epoca: 2, hash: h2 }, nou: { epoca: 1, hash: h1 } })).rejects.toThrow(ambCodi('CAP_RETROCEDIX'));
    expect(await m.avancaCap(CI, FIL, { anterior: { epoca: 1, hash: h1 }, nou: { epoca: 3, hash: h3 } })).toBe(true);
    await expect(m.avancaCap(CI, FIL, { anterior: { epoca: 1, hash: h1 }, nou: { epoca: 2, hash: h2 } })).rejects.toThrow(ambCodi('CAP_CANVIAT'));
    expect(await m.filXifrat(CI, FIL)).toEqual({ fil: FIL, epoca: 3, hash: h3 });
    for (const nou of [{ epoca: 0, hash: h1 }, { epoca: 4, hash: h1.slice(1) }, { epoca: 2 ** 32, hash: h1 }]) {
      await expect(m.avancaCap(CI, FIL, { anterior: { epoca: 3, hash: h3 }, nou })).rejects.toThrow(ambCodi('DADES_INVALIDES'));
    }
    expect(await m.filsXifrats(CI)).toEqual([{ fil: FIL, epoca: 3, hash: h3 }]);
  });

  test('una sola CK per època, rellegida usable; la llista va per fil i per època en ordre numèric', async () => {
    const { obri, m } = entorn();
    const [h1, h2, h10] = [bytes(32), bytes(32), bytes(32)];
    const ck = await clauDEpoca();
    expect(await m.desaClauDeFil(CI, { fil: FIL, epoca: 10, clau: await clauDEpoca(), hashE: h10 })).toBe(true);
    expect(await m.desaClauDeFil(CI, { fil: FIL, epoca: 2, clau: await clauDEpoca(), hashE: h2 })).toBe(true);
    expect(await m.desaClauDeFil(CI, { fil: FIL, epoca: 1, clau: ck, hashE: h1 })).toBe(true);
    expect(await m.desaClauDeFil(CI, { fil: FIL, epoca: 1, clau: await clauDEpoca(), hashE: h1 })).toBe(false);
    await expect(m.desaClauDeFil(CI, { fil: FIL, epoca: 1, clau: await clauDEpoca(), hashE: h2 })).rejects.toThrow(ambCodi('CLAU_FIL_CONFLICTE'));
    await expect(m.desaClauDeFil(CI, { fil: FIL, epoca: 3, clau: await clauLocal(), hashE: h2 })).rejects.toThrow(ambCodi('DADES_INVALIDES'));
    await m.desaClauDeFil(CI, { fil: ALTRE_FIL, epoca: 1, clau: await clauDEpoca(), hashE: h1 });
    await m.desaClauDeFil(CI_ALTRA, { fil: FIL, epoca: 5, clau: await clauDEpoca(), hashE: h1 });
    const recarregat = obri();
    expect((await recarregat.clausDelFil(CI, FIL)).map((f) => f.epoca)).toEqual([1, 2, 10]);
    const { clau } = await recarregat.clauDeFil(CI, FIL, 1);
    const params = { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(16), info: new TextEncoder().encode('sdp-xat-v1/prova\u0000') };
    expect(new Uint8Array(await cripto.subtle.deriveBits(params, clau, 256))).toEqual(new Uint8Array(await cripto.subtle.deriveBits(params, ck, 256)));
    expect(await recarregat.clauDeFil(CI, FIL, 3)).toBeNull();
  });

  test('el sostre de l’època és el del format (2³¹ − 1, l’`integer` del servidor): res per damunt, ni desat ni plantat', async () => {
    /* Regressió: el magatzem admetia fins a 2³² − 1 mentre SDPE i el protocol paren a MAX_EPOCA. */
    const { fals, m } = entorn();
    const h = bytes(32);
    const fora = ambCodi('DADES_INVALIDES');
    expect(MAX_EPOCA).toBe(2147483647);
    expect(await m.desaClauDeFil(CI, { fil: FIL, epoca: MAX_EPOCA, clau: await clauDEpoca(), hashE: h })).toBe(true);
    expect((await m.clauDeFil(CI, FIL, MAX_EPOCA)).epoca).toBe(MAX_EPOCA);
    expect(await m.avancaCap(CI, FIL, { nou: { epoca: MAX_EPOCA, hash: h } })).toBe(true);
    for (const epoca of [MAX_EPOCA + 1, 2 ** 32 - 1]) {
      await expect(m.desaClauDeFil(CI, { fil: ALTRE_FIL, epoca, clau: await clauDEpoca(), hashE: h }), String(epoca)).rejects.toThrow(fora);
      await expect(m.clauDeFil(CI, ALTRE_FIL, epoca), String(epoca)).rejects.toThrow(fora);
      await expect(m.avancaCap(CI, ALTRE_FIL, { nou: { epoca, hash: h } }), String(epoca)).rejects.toThrow(fora);
      await expect(m.importaLlibreta(CI, { comptador: 1, fils: [{ fil: ALTRE_FIL, epoca, hash: h }] }), String(epoca)).rejects.toThrow(fora);
    }
    expect(await m.clausDelFil(CI, ALTRE_FIL)).toEqual([]);
    expect(await m.filXifrat(CI, ALTRE_FIL)).toBeNull();
    // Una fila plantada amb una època que cap SDPE pot portar és una fila trencada, no una època.
    trenca(fals, 'filsXifrats', [CI, FIL], { epoca: MAX_EPOCA + 1 });
    await expect(m.filXifrat(CI, FIL)).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));
    trenca(fals, 'clausFil', [CI, FIL, MAX_EPOCA], { epoca: 2 ** 32 - 1 });
    await expect(m.clauDeFil(CI, FIL, MAX_EPOCA)).rejects.toThrow(ambCodi('CLAUS_MALMESES'));
  });

  test('la llibreta: instantània, comptador que mai baixa i importació que no trepitja res', async () => {
    const { m } = entorn();
    const [kid, altreKid, h1, h2] = [bytes(16), bytes(16), bytes(32), bytes(32)];
    await m.fixa(CI, { usuari: ALTRA, kid, verificat: true });
    await m.avancaCap(CI, FIL, { nou: { epoca: 2, hash: h2 } });
    expect(await m.comptadorLlibreta(CI)).toBe(0);
    expect(await m.desaComptadorLlibreta(CI, 3)).toBe(true);
    expect(await m.desaComptadorLlibreta(CI, 3)).toBe(false);
    await expect(m.desaComptadorLlibreta(CI, 2)).rejects.toThrow(ambCodi('LLIBRETA_ANTIGA'));
    const foto = await m.instantaniaLlibreta(CI);
    expect(foto).toEqual({ comptador: 3, fixacions: [{ usuari: ALTRA, kid, verificat: true, vistAl: INICI }], fils: [{ fil: FIL, epoca: 2, hash: h2 }] });

    const nou = entorn().m;
    expect(await nou.importaLlibreta(CI, foto)).toEqual({ fixacions: 1, fils: 1, conflictes: [] });
    expect(await nou.instantaniaLlibreta(CI)).toEqual(foto);
    await expect(nou.importaLlibreta(CI, { ...foto, comptador: 2 })).rejects.toThrow(ambCodi('LLIBRETA_ANTIGA'));
    const tercera = uuid();
    expect(await nou.importaLlibreta(CI, {
      comptador: 4,
      fixacions: [{ usuari: ALTRA, kid: altreKid, verificat: false, vistAl: INICI }, { usuari: tercera, kid, verificat: false, vistAl: INICI }],
      fils: [{ fil: FIL, epoca: 2, hash: h1 }, { fil: ALTRE_FIL, epoca: 5, hash: h1 }]
    })).toEqual({ fixacions: 1, fils: 1, conflictes: [{ tipus: 'fixacio', usuari: ALTRA }, { tipus: 'fil', fil: FIL }] });
    expect((await nou.fixacio(CI, ALTRA)).kid).toEqual(kid);
    expect((await nou.filXifrat(CI, FIL)).hash).toEqual(h2);
    expect(await nou.comptadorLlibreta(CI)).toBe(4);
  });

  test('una fila desada trencada no es torna mai: MAGATZEM_MALMES si no porta claus, CLAUS_MALMESES si en porta', async () => {
    /* Una «CryptoKey» feta a mà que passa per instanceof (la marca deMa sobreviu al clonatge): per a provar usos que una de veres no pot tindre. */
    const ClasseMixta = class {
      static [Symbol.hasInstance](valor) {
        return valor instanceof ClasseClau || valor?.deMa === true;
      }
    };
    const { fals, m } = entorn({ classe: ClasseMixta });
    const hkdf = { type: 'secret', extractable: false, algorithm: { name: 'HKDF' }, usages: ['deriveBits'] };
    for (let epoca = 1; epoca <= 5; epoca += 1) await m.desaClauDeFil(CI, { fil: FIL, epoca, clau: await clauDEpoca(), hashE: bytes(32) });
    trenca(fals, 'clausFil', [CI, FIL, 1], { clau: { ...hkdf, deMa: true, usages: ['deriveBits', 'sign'] } });
    trenca(fals, 'clausFil', [CI, FIL, 2], { clau: { ...hkdf, deMa: true, usages: [] } });
    trenca(fals, 'clausFil', [CI, FIL, 3], { clau: { ...hkdf } });
    trenca(fals, 'clausFil', [CI, FIL, 4], { clau: await clauLocal() });
    delete filaDesada(fals, 'clausFil', [CI, FIL, 5]).hashE;
    for (let epoca = 1; epoca <= 5; epoca += 1) await expect(m.clauDeFil(CI, FIL, epoca)).rejects.toThrow(ambCodi('CLAUS_MALMESES'));
    await expect(m.clausDelFil(CI, FIL)).rejects.toThrow(ambCodi('CLAUS_MALMESES'));
    await expect(m.desaClauDeFil(CI, { fil: FIL, epoca: 5, clau: await clauDEpoca(), hashE: bytes(32) })).rejects.toThrow(ambCodi('CLAUS_MALMESES'));

    const usuari = uuid();
    await m.fixa(CI, { usuari, kid: bytes(16) });
    trenca(fals, 'fixacions', [CI, usuari], { kid: bytes(8) });
    await expect(m.fixacio(CI, usuari)).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));
    await expect(m.fixacions(CI)).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));
    await expect(m.instantaniaLlibreta(CI)).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));
    await expect(m.fixa(CI, { usuari, kid: bytes(16) })).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));

    await m.avancaCap(CI_ALTRA, FIL, { nou: { epoca: 1, hash: bytes(32) } });
    trenca(fals, 'filsXifrats', [CI_ALTRA, FIL], { hash: bytes(31) });
    await expect(m.filXifrat(CI_ALTRA, FIL)).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));
    await expect(m.filsXifrats(CI_ALTRA)).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));
    await expect(m.instantaniaLlibreta(CI_ALTRA)).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));
    await expect(m.avancaCap(CI_ALTRA, FIL, { nou: { epoca: 2, hash: bytes(32) } })).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));

    await m.desaComptadorLlibreta(CI_ALTRA, 2);
    trenca(fals, 'identitats', [CI_ALTRA, 'llibreta'], { comptador: -1 });
    await expect(m.comptadorLlibreta(CI_ALTRA)).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));
    await expect(m.desaComptadorLlibreta(CI_ALTRA, 3)).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));
    await expect(m.importaLlibreta(CI_ALTRA, { comptador: 3 })).rejects.toThrow(ambCodi('MAGATZEM_MALMES'));
  });
});

describe('la safata: esperar, mai en clar (§4.5.6, D-08)', () => {
  test('desa xifrat en repòs i torna el contingut; a la base no hi ha cap byte del text', async () => {
    const { fals, m } = entorn();
    const id = uuid();
    const contingut = { text: 'Demà a les huit a la cooperativa', respostaA: null };
    const resum = await m.desaASafata(CI, { actor: ACTOR, fil: FIL, id, contingut });
    expect(resum).toEqual({ fil: FIL, id, actor: ACTOR, creatMs: INICI, caducaMs: INICI + CADUCITAT_SAFATA_MS });
    expect(await m.safata(CI, ACTOR)).toEqual([{ ...resum, contingut, malmes: false }]);
    const files = fals.files(NOM_BD_XAT, 'safata');
    expect(files.map((f) => f.clau)).toEqual([[CI, 'clau'], [CI, 'missatge', id]]);
    expect(files[0].valor.clau.extractable).toBe(false);
    expect(Object.keys(files[1].valor).sort()).toEqual(['actor', 'creatMs', 'ct', 'fil', 'id', 'idClau', 'iv']);
    expect(conte(files[1].valor.ct, new TextEncoder().encode('cooperativa'))).toBe(false);
    expect(await m.safata(CI_ALTRA, ACTOR_ALTRA)).toEqual([]);
  });

  test('caduca als 30 dies: l’últim mil·lisegon encara hi és, el següent ja no i s’esborra de la base', async () => {
    const { fals, m, rellotge } = entorn();
    const [vell, nou] = [uuid(), uuid()];
    await m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: vell, contingut: { text: 'primer' } });
    rellotge.ms += 1000;
    await m.desaASafata(CI, { actor: ACTOR, fil: ALTRE_FIL, id: nou, contingut: { text: 'segon' } });
    rellotge.ms = INICI + CADUCITAT_SAFATA_MS - 1;
    expect((await m.safata(CI, ACTOR)).map((e) => e.id)).toEqual([vell, nou]);
    rellotge.ms = INICI + CADUCITAT_SAFATA_MS;
    expect((await m.safata(CI, ACTOR)).map((e) => e.id)).toEqual([nou]);
    expect(fals.files(NOM_BD_XAT, 'safata').map((f) => f.clau)).toEqual([[CI, 'clau'], [CI, 'missatge', nou]]);
    rellotge.ms = INICI + 1000 + CADUCITAT_SAFATA_MS;
    expect(await m.purgaSafata()).toBe(1);
    expect(await m.safata(CI, ACTOR)).toEqual([]);
  });

  test('un rellotge tocat no eternitza un missatge: més d’un dia en el futur ja és caducat', async () => {
    const { m, rellotge } = entorn();
    rellotge.ms = INICI + 40 * DIA;
    await m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { text: 'del futur' } });
    rellotge.ms = INICI;
    expect(await m.safata(CI, ACTOR)).toEqual([]);
    const proper = uuid();
    await m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: proper, contingut: { text: 'ara' } });
    rellotge.ms = INICI - MARGE_FUTUR_SAFATA_MS;
    expect((await m.safata(CI, ACTOR)).map((e) => e.id)).toEqual([proper]);
    rellotge.ms = INICI - MARGE_FUTUR_SAFATA_MS - 1;
    expect(await m.safata(CI, ACTOR)).toEqual([]);
  });

  test('els caducats de qualsevol persona s’esborren: en la primera operació d’una càrrega i amb purgaSafata()', async () => {
    const { fals, rellotge, obri, m } = entorn();
    const missatges = (ci) => fals.files(NOM_BD_XAT, 'safata').filter(({ clau }) => clau[0] === ci && clau[1] === 'missatge');
    await m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { text: 'secret de la biblioteca' } });
    rellotge.ms = INICI + DIA;
    await m.desaASafata(CI_ALTRA, { actor: ACTOR_ALTRA, fil: FIL, id: uuid(), contingut: { text: 'de l’altra' } });
    rellotge.ms = INICI + CADUCITAT_SAFATA_MS;
    /* Una altra persona obri l'app: el de JO, que no ha tornat, ix sense que JO faça res. */
    await obri().comprova();
    expect([missatges(CI).length, missatges(CI_ALTRA).length]).toEqual([0, 1]);
    /* La mateixa instància, sense recarregar. */
    rellotge.ms = INICI + DIA + CADUCITAT_SAFATA_MS;
    expect(await m.purgaSafata()).toBe(1);
    expect(missatges(CI_ALTRA)).toEqual([]);
    expect(fals.files(NOM_BD_XAT, 'safata').map(({ clau }) => clau[1])).toEqual(['clau', 'clau']);
  });

  test('un missatge manipulat a la base (xifrat o data) torna malmés i es pot descartar; un sense la forma que toca s’esborra', async () => {
    const { fals, m } = entorn();
    const [tocat, mogut, trencat] = [uuid(), uuid(), uuid()];
    await m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: tocat, contingut: { text: 'hola' } });
    await m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: mogut, contingut: { text: 'adeu' } });
    await m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: trencat, contingut: { text: 'sense data' } });
    filaDesada(fals, 'safata', [CI, 'missatge', tocat]).ct[0] ^= 1;
    filaDesada(fals, 'safata', [CI, 'missatge', mogut]).creatMs -= DIA;
    /* Sense una data que es puga comparar, no caducaria mai: fora. */
    filaDesada(fals, 'safata', [CI, 'missatge', trencat]).creatMs = 'mai';
    const entrades = await m.safata(CI, ACTOR);
    expect(fals.files(NOM_BD_XAT, 'safata').some(({ clau }) => clau[2] === trencat)).toBe(false);
    expect(entrades.map(({ id, malmes, contingut }) => ({ id, malmes, contingut })).sort((a, b) => (a.id < b.id ? -1 : 1)))
      .toEqual([{ id: tocat, malmes: true, contingut: null }, { id: mogut, malmes: true, contingut: null }].sort((a, b) => (a.id < b.id ? -1 : 1)));
    expect(await m.treuDeSafata(CI, tocat, ACTOR)).toBe(true);
    expect(await m.treuDeSafata(CI, tocat, ACTOR)).toBe(false);
    await m.treuDeSafata(CI, mogut, ACTOR);
    expect(await m.safata(CI, ACTOR)).toEqual([]);
  });

  test('una clau de repòs plantada que no és la que toca (extraïble, de 128 bits, sense xifrar) no es fa servir mai', async () => {
    const { fals, m } = entorn();
    await m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { text: 'hola' } });
    for (const clau of [
      await cripto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']),
      await cripto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, false, ['encrypt', 'decrypt']),
      await cripto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['wrapKey', 'unwrapKey'])
    ]) {
      filaDesada(fals, 'safata', [CI, 'clau']).clau = clau;
      await expect(m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { text: 'hola' } })).rejects.toThrow(ambCodi('CLAUS_MALMESES'));
      expect((await m.safata(CI, ACTOR)).map((e) => e.malmes)).toEqual([true]);
    }
  });

  test('una clau de repòs que guanya en una altra pestanya però no és la que toca: CLAUS_MALMESES, tampoc es fa servir', async () => {
    const { ganxo, criptoDe } = criptoAmbGanxo('generateKey');
    const { fals, obriPestanya } = entorn({ criptoDe });
    const [esta, altra] = [obriPestanya(), obriPestanya()];
    await Promise.all([esta.comprova(), altra.comprova()]);
    /* Just quan esta ha fet la seua clau, l'altra en desa una i algú la canvia per una extraïble. */
    ganxo.despres = async () => {
      await altra.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { de: 'altra' } });
      filaDesada(fals, 'safata', [CI, 'clau']).clau = await cripto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    };
    await expect(esta.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { de: 'esta' } })).rejects.toThrow(ambCodi('CLAUS_MALMESES'));
    expect(fals.files(NOM_BD_XAT, 'safata').filter(({ clau }) => clau[1] === 'missatge')).toHaveLength(1);
  });

  test('un id repetit, la safata plena i un missatge massa gran es rebutgen sense escriure res', async () => {
    const { fals, m } = entorn();
    const id = uuid();
    await m.desaASafata(CI, { actor: ACTOR, fil: FIL, id, contingut: { text: 'hola' } });
    await expect(m.desaASafata(CI, { actor: ACTOR, fil: FIL, id, contingut: { text: 'una altra' } })).rejects.toThrow(ambCodi('SAFATA_DUPLICADA'));
    for (let i = 1; i < MAX_MISSATGES_SAFATA; i += 1) await m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { n: i } });
    await expect(m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { n: 'massa' } })).rejects.toThrow(ambCodi('SAFATA_PLENA'));
    expect(fals.files(NOM_BD_XAT, 'safata')).toHaveLength(MAX_MISSATGES_SAFATA + 1);
    await expect(m.desaASafata(CI_ALTRA, { actor: ACTOR_ALTRA, fil: FIL, id: uuid(), contingut: { text: 'x'.repeat(MAX_BYTES_SAFATA) } }))
      .rejects.toThrow(ambCodi('SAFATA_GRAN'));
    for (const contingut of [null, [], 'text', new Date(0)]) {
      await expect(m.desaASafata(CI_ALTRA, { actor: ACTOR_ALTRA, fil: FIL, id: uuid(), contingut })).rejects.toThrow(ambCodi('DADES_INVALIDES'));
    }
    expect(deLaPersona(fals, CI_ALTRA)).toEqual([]);
  });

  test('si una altra pestanya buida la safata mentre esta xifra, SAFATA_OBLIDADA i no en queda res', async () => {
    const { ganxo, criptoDe } = criptoAmbGanxo('encrypt');
    const { fals, obriPestanya } = entorn({ criptoDe });
    const estaPestanya = obriPestanya();
    const altraPestanya = obriPestanya();
    await estaPestanya.comprova();
    ganxo.despres = () => altraPestanya.oblidaEnTancar(CI, { mantenSessio: true });
    await expect(estaPestanya.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { text: 'a mitges' } }))
      .rejects.toThrow(ambCodi('SAFATA_OBLIDADA'));
    expect(deLaPersona(fals, CI)).toEqual([]);
  });

  test('dues pestanyes fan alhora la clau de la safata: en queda una i cadascuna llig el missatge de l’altra', async () => {
    const { fals, obriPestanya } = entorn();
    const [a, b] = [obriPestanya(), obriPestanya()];
    await Promise.all([
      a.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { de: 'a' } }),
      b.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { de: 'b' } })
    ]);
    expect(fals.files(NOM_BD_XAT, 'safata').filter((f) => f.clau[1] === 'clau')).toHaveLength(1);
    for (const pestanya of [a, b]) expect((await pestanya.safata(CI, ACTOR)).map((e) => e.contingut.de).sort()).toEqual(['a', 'b']);
  });
});

describe('en eixir (D-09)', () => {
  test('sense «Mantén la sessió»: tot el de la persona fora dels cinc magatzems; l’altra persona, intacta', async () => {
    const { fals, m } = entorn();
    await ompli(m, CI, JO);
    await ompli(m, CI_ALTRA, ALTRA);
    expect(deLaPersona(fals, CI).map((f) => f.nom).sort()).toEqual(['clausFil', 'filsXifrats', 'fixacions', 'identitats', 'identitats', 'safata', 'safata']);
    expect(await m.oblidaEnTancar(CI)).toBe(7);
    expect(deLaPersona(fals, CI)).toEqual([]);
    expect(deLaPersona(fals, CI_ALTRA)).toHaveLength(7);
    expect(await m.identitat(CI)).toBeNull();
    expect(await m.identitat(CI_ALTRA)).not.toBeNull();
  });

  test('amb «Mantén la sessió»: només la safata; la resta torna en recarregar', async () => {
    const { fals, obri, m } = entorn();
    await ompli(m, CI, JO);
    expect(await m.oblidaEnTancar(CI, { mantenSessio: true })).toBe(2);
    expect(deLaPersona(fals, CI).map((f) => f.nom).sort()).toEqual(['clausFil', 'filsXifrats', 'fixacions', 'identitats', 'identitats']);
    const recarregat = obri();
    expect((await recarregat.identitat(CI)).sigPriv).toBeInstanceOf(ClasseClau);
    expect(await recarregat.clausDelFil(CI, FIL)).toHaveLength(1);
    expect(await recarregat.safata(CI, ACTOR)).toEqual([]);
  });

  test('qualsevol opció que no siga mantenSessio: true ho esborra tot (també cap opció o null)', async () => {
    for (const opcions of [{ mantenSessio: 'sí' }, { mantenSessio: 1 }, { mantenSessio: 'true' }, { mantenSessio: {} }, null, undefined, 5]) {
      const { fals, m } = entorn();
      await ompli(m, CI, JO);
      expect(await m.oblidaEnTancar(CI, opcions)).toBe(7);
      expect(deLaPersona(fals, CI)).toEqual([]);
    }
  });

  test('el que es va demanar abans d’eixir no escriu ni torna claus després, amb i sense «Mantén la sessió» (§8.6, QA-E07)', async () => {
    for (const mantenSessio of [false, true]) {
      const { fals, m } = entorn();
      const { identitat } = await novaIdentitat();
      await m.desaIdentitat(CI, identitat);
      const lectura = m.identitat(CI);
      const fixacio = m.fixa(CI, { usuari: ALTRA, kid: bytes(16) });
      const missatge = m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { text: 'tard' } });
      const oblit = m.oblidaEnTancar(CI, { mantenSessio });
      for (const tardana of [lectura, fixacio, missatge]) await expect(tardana).rejects.toThrow(ambCodi('OBLIDAT'));
      expect(await oblit).toBe(mantenSessio ? 0 : 1);
      expect(deLaPersona(fals, CI).map((f) => f.nom)).toEqual(mantenSessio ? ['identitats'] : []);
      expect(await m.identitat(CI) !== null).toBe(mantenSessio);
    }
  });

  test('ni una safata que desxifra quan s’ix ni una lectura amb la transacció ja feta tornen res: OBLIDAT', async () => {
    const { ganxo, criptoDe } = criptoAmbGanxo('decrypt');
    const { fals, m } = entorn({ criptoDe });
    const { identitat } = await novaIdentitat();
    await m.desaIdentitat(CI, identitat);
    await m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { text: 'secret' } });
    ganxo.despres = () => m.oblidaEnTancar(CI, { mantenSessio: true });
    await expect(m.safata(CI, ACTOR)).rejects.toThrow(ambCodi('OBLIDAT'));
    const abans = fals.operacions.length;
    const lectura = m.identitat(CI);
    /* Fins que la transacció de lectura ja ha demanat la fila: només queda la comprovació de després. */
    for (let i = 0; i < 50 && !fals.operacions.slice(abans).includes('get'); i += 1) await null;
    expect(fals.operacions.slice(abans)).toContain('get');
    const oblit = m.oblidaEnTancar(CI, { mantenSessio: true });
    await expect(lectura).rejects.toThrow(ambCodi('OBLIDAT'));
    expect(await oblit).toBe(0);
    /* Una escriptura que ja ha passat la primera comprovació i espera una connexió nova: l'atura la de dins de la transacció. */
    fals.tancaConnexions(NOM_BD_XAT);
    const opens = () => fals.operacions.filter((o) => o === 'open').length;
    const obertes = opens();
    const fixacio = m.fixa(CI, { usuari: ALTRA, kid: bytes(16) });
    for (let i = 0; i < 50 && opens() === obertes; i += 1) await null;
    expect(opens()).toBe(obertes + 1);
    const segonOblit = m.oblidaEnTancar(CI, { mantenSessio: true });
    await expect(fixacio).rejects.toThrow(ambCodi('OBLIDAT'));
    await segonOblit;
    expect(fals.files(NOM_BD_XAT, 'fixacions')).toEqual([]);
  });

  test('dues instàncies en la mateixa pestanya obliden juntes: el que l’una té en vol falla quan l’altra ix', async () => {
    const { fals, obri } = entorn();
    const [a, b] = [obri(), obri()];
    const { identitat } = await novaIdentitat();
    await a.desaIdentitat(CI, identitat);
    await b.comprova();
    const ck = await clauDEpoca();
    const lectura = a.identitat(CI);
    const escriptura = a.desaClauDeFil(CI, { fil: FIL, epoca: 1, clau: ck, hashE: bytes(32) });
    const oblit = b.oblidaEnTancar(CI);
    for (const tardana of [lectura, escriptura]) await expect(tardana).rejects.toThrow(ambCodi('OBLIDAT'));
    expect(await oblit).toBe(1);
    expect(deLaPersona(fals, CI)).toEqual([]);
  });

  test('esborrar no depén de la sonda: si el motor ja no sap desar claus, eixir encara ho esborra', async () => {
    let perd = false;
    const fals = creaIdbFalsEstructurat({ clona: (valor) => (perd ? clonaJson(valor) : structuredClone(valor)) });
    const crea = () => creaMagatzemXat({ idb: fals, rangs: fals.IDBKeyRange, cripto, ara: () => INICI });
    await ompli(crea(), CI, JO);
    perd = true;
    const m = crea();
    await expect(m.identitat(CI)).rejects.toThrow(ambCodi('CLAUS_NO_DESABLES'));
    expect(await m.oblidaEnTancar(CI)).toBe(7);
    expect(deLaPersona(fals, CI)).toEqual([]);
  });

  test('eixir quan una altra pestanya ja té una base més nova encara ho esborra, i no hi deixa cap connexió', async () => {
    const { fals, m } = entorn();
    await ompli(m, CI, JO);
    await ompli(m, CI_ALTRA, ALTRA);
    const nova = await obriDirecte(fals, VERSIO_BD_XAT + 1);
    expect(await m.oblidaEnTancar(CI)).toBe(7);
    expect(deLaPersona(fals, CI)).toEqual([]);
    expect(await m.oblidaEnTancar(CI_ALTRA, { mantenSessio: true })).toBe(2);
    expect(deLaPersona(fals, CI_ALTRA).map((f) => f.nom).sort()).toEqual(['clausFil', 'filsXifrats', 'fixacions', 'identitats', 'identitats']);
    expect(fals.connexions(NOM_BD_XAT)).toEqual([nova]);
    nova.close();
  });

  test('eixir quan la base ja no hi és no en crea cap de buida', async () => {
    const fals = creaIdbFalsEstructurat();
    const idb = { open: (nom, versio) => (versio === undefined ? fals.open(nom) : peticioQueFalla('VersionError')) };
    const m = creaMagatzemXat({ idb, rangs: fals.IDBKeyRange, cripto, ara: () => INICI });
    expect(await m.oblidaEnTancar(CI)).toBe(0);
    expect(fals.bases.has(NOM_BD_XAT)).toBe(false);
  });

  test('eixir quan el motor falla: ho reintenta una vegada; si torna a fallar, OBLIT_FALLIT amb la causa, mai un èxit fals', async () => {
    const { fals, m } = entorn();
    await ompli(m, CI, JO);
    fals.errorsEnTransaccio.push(new DOMException('Connexió perduda.', 'UnknownError'));
    expect(await m.oblidaEnTancar(CI, { mantenSessio: true })).toBe(2);
    fals.errorsEnTransaccio.push(new DOMException('Connexió perduda.', 'UnknownError'), new DOMException('Encara.', 'UnknownError'));
    await expect(m.oblidaEnTancar(CI)).rejects.toMatchObject({ codi: 'OBLIT_FALLIT', cause: { codi: 'MAGATZEM_ERROR' } });
    expect(deLaPersona(fals, CI)).toHaveLength(5);
    expect(await m.oblidaEnTancar(CI)).toBe(5);
  });
});

describe('dues pestanyes, versions i el navegador', () => {
  test('dues pestanyes obrin alhora una base buida: una sola actualització, i una sola identitat guanya', async () => {
    const { fals, obriPestanya } = entorn();
    const [a, b] = [obriPestanya(), obriPestanya()];
    const [{ identitat: ia }, { identitat: ib }] = await Promise.all([novaIdentitat(), novaIdentitat()]);
    const resultats = await Promise.allSettled([a.desaIdentitat(CI, ia), b.desaIdentitat(CI, ib)]);
    expect(resultats.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(resultats.find((r) => r.status === 'rejected').reason.codi).toBe('IDENTITAT_EXISTENT');
    const guanyadora = resultats[0].status === 'fulfilled' ? ia : ib;
    for (const pestanya of [a, b]) expect((await pestanya.identitat(CI)).kid).toEqual(guanyadora.kid);
    expect(fals.bases.get(NOM_BD_XAT).versio).toBe(1);
    expect(fals.operacions.filter((o) => o === 'open')).toHaveLength(2);
    expect(fals.connexions(NOM_BD_XAT)).toHaveLength(2);
  });

  test('una pestanya amb una versió més nova: esta es tanca sense bloquejar-la i després diu VERSIO_NOVA', async () => {
    const { fals, m } = entorn();
    await m.comprova();
    let bloquejada = false;
    const nova = await obriDirecte(fals, 2, () => {}, () => { bloquejada = true; });
    expect(bloquejada).toBe(false);
    expect(fals.connexions(NOM_BD_XAT)).toEqual([nova]);
    await expect(m.identitat(CI)).rejects.toThrow(ambCodi('VERSIO_NOVA'));
    nova.close();
  });

  test('blocked: BLOQUEJAT de seguida i cap open més mentre dura (eixir diu OBLIT_FALLIT, no es penja); la connexió que arriba tard es queda', async () => {
    const fals = creaIdbFalsEstructurat();
    /* La pestanya vella, suspesa: té la base oberta i no atén versionchange. */
    const vella = await obriDirecte(fals, 1, (bd) => {
      for (const nom of MAGATZEMS_XAT) bd.createObjectStore(nom);
    });
    vella.onversionchange = () => {};
    /* Un codi més nou: demana una versió més, amb el mateix esquema. */
    const idb = { open: (nom, versio) => (versio === undefined ? fals.open(nom) : fals.open(nom, versio + 1)) };
    const m = creaMagatzemXat({ idb, rangs: fals.IDBKeyRange, cripto, ara: () => INICI });
    const opens = () => fals.operacions.filter((o) => o === 'open').length;
    expect(await termini(m.identitat(CI))).toBe('BLOQUEJAT');
    expect(await termini(m.identitat(CI))).toBe('BLOQUEJAT');
    await expect(m.oblidaEnTancar(CI)).rejects.toMatchObject({ codi: 'OBLIT_FALLIT', cause: { codi: 'BLOQUEJAT' } });
    expect(opens()).toBe(2);
    vella.close();
    await torns();
    expect(await m.identitat(CI)).toBeNull();
    expect(opens()).toBe(2);
    expect(fals.bases.get(NOM_BD_XAT).versio).toBe(VERSIO_BD_XAT + 1);
  });

  test('un open que no respon: BLOQUEJAT al termini, cap open més mentre dura, i si arriba es queda (o es tanca, si s’ha tancat el magatzem)', async () => {
    const fals = creaIdbFalsEstructurat();
    let solta;
    const retinguda = new Promise((resol) => { solta = resol; });
    /* Un motor encallat: l'open de veres acaba, però l'èxit no arriba fins que el soltem. */
    const idb = {
      open(nom, versio) {
        const real = fals.open(nom, versio);
        const peticio = { result: undefined, error: null };
        real.onupgradeneeded = (event) => {
          peticio.result = real.result;
          peticio.onupgradeneeded?.(event);
        };
        real.onsuccess = () => retinguda.then(() => {
          peticio.result = real.result;
          peticio.onsuccess?.({ type: 'success', target: peticio });
        });
        return peticio;
      }
    };
    const crea = () => creaMagatzemXat({ idb, rangs: fals.IDBKeyRange, cripto, ara: () => INICI, terminiMs: 30 });
    const [m, tancat] = [crea(), crea()];
    expect(await termini(m.comprova())).toBe('BLOQUEJAT');
    expect(await termini(m.identitat(CI), 10)).toBe('BLOQUEJAT');
    expect(await termini(tancat.comprova())).toBe('BLOQUEJAT');
    tancat.tanca();
    expect(fals.operacions.filter((o) => o === 'open')).toHaveLength(2);
    solta();
    await torns();
    expect(fals.connexions(NOM_BD_XAT)).toHaveLength(1);
    expect(await m.comprova()).toBe(true);
    expect(fals.operacions.filter((o) => o === 'open')).toHaveLength(2);
  });

  test('el navegador tanca la connexió, amb close o sense avisar: la següent operació n’obri una altra', async () => {
    const { fals, m } = entorn();
    await m.comprova();
    fals.tancaConnexions(NOM_BD_XAT);
    expect(await m.identitat(CI)).toBeNull();
    for (const bd of fals.connexions(NOM_BD_XAT)) bd.close();
    expect(await m.identitat(CI)).toBeNull();
    expect(fals.operacions.filter((o) => o === 'open')).toHaveLength(3);
  });

  test('sense espai: SENSE_ESPAI i res escrit; llegir continua i, amb espai, es desa', async () => {
    const { fals, m } = entorn();
    await m.comprova();
    const { identitat } = await novaIdentitat();
    fals.omplit = true;
    await expect(m.desaIdentitat(CI, identitat)).rejects.toThrow(ambCodi('SENSE_ESPAI'));
    await expect(m.fixa(CI, { usuari: ALTRA, kid: bytes(16) })).rejects.toThrow(ambCodi('SENSE_ESPAI'));
    await expect(m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { text: 'hola' } })).rejects.toThrow(ambCodi('SENSE_ESPAI'));
    expect(deLaPersona(fals, CI)).toEqual([]);
    expect(await m.identitat(CI)).toBeNull();
    fals.omplit = false;
    expect(await m.desaIdentitat(CI, identitat)).toBe(true);
  });

  test('sense espai des de l’inici (la sonda no pot escriure): les claus desades es lligen i s’esborren; desar-ne, SENSE_ESPAI', async () => {
    const { fals, obri, m } = entorn();
    const { identitat } = await novaIdentitat();
    await m.desaIdentitat(CI, identitat);
    await m.desaClauDeFil(CI, { fil: FIL, epoca: 1, clau: await clauDEpoca(), hashE: bytes(32) });
    await m.desaASafata(CI, { actor: ACTOR, fil: FIL, id: uuid(), contingut: { text: 'hola' } });
    m.tanca();
    fals.omplit = true;
    const ple = obri();
    expect((await ple.identitat(CI)).sigPriv).toBeInstanceOf(ClasseClau);
    expect(await ple.clausDelFil(CI, FIL)).toHaveLength(1);
    expect((await ple.safata(CI, ACTOR)).map((e) => e.contingut)).toEqual([{ text: 'hola' }]);
    expect(await ple.fixacions(CI)).toEqual([]);
    await expect(ple.comprova()).rejects.toThrow(ambCodi('SENSE_ESPAI'));
    const { identitat: nova } = await novaIdentitat();
    await expect(ple.desaIdentitat(CI, nova, { anterior: identitat.kid })).rejects.toThrow(ambCodi('SENSE_ESPAI'));
    await expect(ple.desaClauDeFil(CI, { fil: FIL, epoca: 2, clau: await clauDEpoca(), hashE: bytes(32) })).rejects.toThrow(ambCodi('SENSE_ESPAI'));
    expect(await ple.oblidaEnTancar(CI)).toBe(4);
  });
});
