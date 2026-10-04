// @vitest-environment node
/* El llibre a IndexedDB: el mateix contracte que el de memòria, només add(),
   una transacció per afegit i un sol escriptor amb Web Locks. IndexedDB és un
   fals mínim que serialitza les transaccions (com fa el navegador amb les
   que es solapen), desfà les avortades i aplica els índexs únics. El NIF del
   client es compon a trossos perquè la porta de qualitat no hi veja un
   literal amb forma de DNI. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { ESQUEMA_CONFIG_EMPRESA } from '../configEmpresa.js';
import { creaEmissio } from '../emissio.js';
import { creaFacturaEmesa } from '../facturaEmesa.js';
import { registraAlta, registraAnulacio, verificaCadena } from './cadena.js';
import { METODES_VETATS, creaPortMemoria, restauraCopia, validaPort } from './port.js';
import { NOM_BD, creaPortIndexedDB } from './portIndexedDB.js';
import { creaRegistreAlta } from './registreAlta.js';

const CIF_EMISSOR = 'B12345674';
const DNI_CLIENT = ['1234', '5678', 'Z'].join('');
const MIGDIA = Date.UTC(2026, 9, 4, 10, 0, 0);
/* Un domicili sintètic: cap adreça real. */
const DOMICILI = Object.freeze({ adreca: 'Plaça del Poble, 1', codiPostal: '46999', poblacio: 'Poble de Prova' });

function factura(numero, { emissor = CIF_EMISSOR, destinatari = DNI_CLIENT } = {}) {
  return creaFacturaEmesa({
    tipus: 'F1',
    numSerie: `A2026-${String(numero).padStart(4, '0')}`,
    dataExpedicio: '2026-10-04',
    emissor: { nif: emissor, nom: 'Emissor', domicili: DOMICILI },
    destinatari: { nif: destinatari, nom: 'Client', domicili: DOMICILI },
    descripcio: 'Servici',
    linies: [{ concepte: 'Servici', quantitat: 1, preuUnitari: 1000, tipusIva: 21 }]
  });
}

const clona = (valor) => (valor === undefined ? undefined : JSON.parse(JSON.stringify(valor)));

/* Fals d'IndexedDB: open/upgrade, un store amb keyPath i índexs (únics o no),
   add/getAll i, als índexs, get/getAll/openCursor('prev'). Les transaccions
   d'una base passen d'una en una; una avortada desfà el que havia escrit.
   `operacions` apunta cada operació que es demana, per a vigilar que no n'hi
   ha cap d'esborrar ni de reescriure. */
function creaIdbFals() {
  const bases = new Map();
  const operacions = [];
  const despres = (fn) => setTimeout(fn, 0);

  function creaTransaccio(base, mode) {
    const tx = { error: null };
    let pendents = 0;
    let activa = false;
    let acabada = false;
    let instantania = null;
    const espera = [];
    let allibera;
    const torn = new Promise((resol) => { allibera = resol; });
    const previ = base.cua;
    base.cua = previ.then(() => torn);
    const acaba = (correcta, error) => {
      if (acabada) return;
      acabada = true;
      if (correcta) {
        despres(() => { tx.oncomplete?.(); allibera(); });
        return;
      }
      if (instantania) for (const [nom, files] of instantania) base.stores.get(nom).files = files;
      tx.error = error ?? null;
      despres(() => {
        if (error) tx.onerror?.({ target: { error } });
        tx.onabort?.({ target: tx });
        allibera();
      });
    };
    const potAcabar = () => {
      if (activa && pendents === 0) acaba(true);
    };
    previ.then(() => {
      activa = true;
      if (mode === 'readwrite') instantania = [...base.stores].map(([nom, s]) => [nom, new Map(s.files)]);
      despres(() => {
        espera.splice(0).forEach((executa) => executa());
        potAcabar();
      });
    });
    const peticio = (que, accio) => {
      operacions.push(que);
      const p = { result: undefined, error: null };
      pendents += 1;
      const executa = () => despres(() => {
        pendents -= 1;
        if (acabada) return;
        try {
          p.result = accio();
        } catch (error) {
          p.error = error;
          acaba(false, error);
          return;
        }
        p.onsuccess?.();
        potAcabar();
      });
      if (activa) executa();
      else espera.push(executa);
      return p;
    };
    tx.abort = () => acaba(false, null);
    tx.objectStore = (nom) => {
      const store = base.stores.get(nom);
      const ordenades = () => [...store.files.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([, v]) => v);
      const index = (nomIndex) => {
        const { camp } = store.indexs.get(nomIndex);
        const coincidents = (clau) => ordenades().filter((fila) => fila[camp] === clau);
        return {
          get: (clau) => peticio('index.get', () => clona(coincidents(clau)[0])),
          getAll: (clau) => peticio('index.getAll', () => clona(coincidents(clau))),
          openCursor: (clau, direccio) => peticio('index.openCursor', () => {
            const files = coincidents(clau);
            const fila = direccio === 'prev' ? files[files.length - 1] : files[0];
            return fila ? { value: clona(fila) } : null;
          })
        };
      };
      return {
        add: (valor) => peticio('add', () => {
          if (mode !== 'readwrite') throw Object.assign(new Error('Només lectura'), { name: 'ReadOnlyError' });
          const clau = valor[store.keyPath];
          const unica = [...store.indexs.values()].find(({ camp, unique }) => unique && [...store.files.values()].some((f) => f[camp] === valor[camp]));
          if (store.files.has(clau) || unica) throw Object.assign(new Error('Clau duplicada'), { name: 'ConstraintError' });
          store.files.set(clau, clona(valor));
          return clau;
        }),
        getAll: () => peticio('getAll', () => clona(ordenades())),
        index
      };
    };
    return tx;
  }

  return {
    bases,
    operacions,
    open(nom, versio) {
      const peticio = {};
      despres(() => {
        let base = bases.get(nom);
        const puja = !base || base.versio < versio;
        if (!base) {
          base = { versio: 0, stores: new Map(), cua: Promise.resolve() };
          bases.set(nom, base);
        }
        peticio.result = {
          objectStoreNames: { contains: (n) => base.stores.has(n) },
          createObjectStore(n, { keyPath }) {
            const store = { keyPath, files: new Map(), indexs: new Map() };
            base.stores.set(n, store);
            return { createIndex: (nomIndex, camp, { unique = false } = {}) => store.indexs.set(nomIndex, { camp, unique }) };
          },
          close() {},
          transaction: (_noms, mode) => creaTransaccio(base, mode)
        };
        if (puja) {
          base.versio = versio;
          peticio.onupgradeneeded?.();
        }
        peticio.onsuccess?.();
      });
      return peticio;
    }
  };
}

/* Web Locks fals: un bloqueig exclusiu per nom, compartit per les «pestanyes» que el reben. */
function creaLocksFals() {
  const cues = new Map();
  const peticions = [];
  return {
    peticions,
    request(nom, opcions, fn) {
      peticions.push({ nom, mode: opcions?.mode });
      const pas = (cues.get(nom) ?? Promise.resolve()).then(() => fn({ name: nom, mode: opcions?.mode }));
      cues.set(nom, pas.catch(() => undefined));
      return pas;
    }
  };
}

describe('sense IndexedDB no hi ha llibre', () => {
  test('ni memòria de reserva: SENSE_INDEXEDDB', () => {
    expect(() => creaPortIndexedDB({ idb: null })).toThrow(expect.objectContaining({ codi: 'SENSE_INDEXEDDB' }));
    expect(() => creaPortIndexedDB({ idb: {} })).toThrow(expect.objectContaining({ codi: 'SENSE_INDEXEDDB' }));
  });
});

describe('el contracte, igual que el de memòria', () => {
  const fabriques = [
    ['memòria', () => creaPortMemoria()],
    ['IndexedDB (fals)', () => creaPortIndexedDB({ idb: creaIdbFals(), locks: null })]
  ];

  test.each(fabriques)('%s: complix el contracte i no porta cap mètode vetat', (_nom, crea) => {
    const port = crea();
    expect(validaPort(port)).toBe(port);
    expect(METODES_VETATS.filter((m) => m in port)).toEqual([]);
  });

  test.each(fabriques)('%s: altes, anul·lació, duplicats i cadena verificada', async (_nom, crea) => {
    const port = crea();
    for (const n of [1, 2, 3]) await registraAlta(port, factura(n), { instant: MIGDIA + n * 1000 });
    await registraAnulacio(port, { idEmisor: CIF_EMISSOR, numSerie: 'A2026-0002', dataExpedicio: '2026-10-04', instant: MIGDIA + 9000 });
    await expect(registraAnulacio(port, { idEmisor: CIF_EMISSOR, numSerie: 'A2026-0002', dataExpedicio: '2026-10-04', instant: MIGDIA + 9500 }))
      .rejects.toMatchObject({ codi: 'DUPLICAT' });
    await expect(registraAlta(port, factura(3), { instant: MIGDIA + 9800 })).rejects.toMatchObject({ codi: 'DUPLICAT' });
    await expect(registraAnulacio(port, { idEmisor: CIF_EMISSOR, numSerie: 'A2026-0009', dataExpedicio: '2026-10-04' }))
      .rejects.toMatchObject({ codi: 'FACTURA_INEXISTENT' });
    const registres = await port.llig();
    expect(registres.map((r) => `${r.ordre}:${r.tipusRegistre}:${r.numSerie}`))
      .toEqual(['1:alta:A2026-0001', '2:alta:A2026-0002', '3:alta:A2026-0003', '4:anulacio:A2026-0002']);
    expect(Object.isFrozen(registres[0].factura)).toBe(true);
    expect((await port.ultim(CIF_EMISSOR)).ordre).toBe(4);
    expect(await port.ultim(DNI_CLIENT)).toBeNull();
    expect((await port.llig({ idEmisor: CIF_EMISSOR, des: 3 })).map((r) => r.ordre)).toEqual([3, 4]);
    expect((await verificaCadena(registres)).valida).toBe(true);
  });

  test('els dos ports exporten exactament el mateix llibre', async () => {
    const memoria = creaPortMemoria();
    const disc = creaPortIndexedDB({ idb: creaIdbFals(), locks: null });
    for (const n of [1, 2]) await registraAlta(memoria, factura(n), { instant: MIGDIA + n * 1000 });
    expect(await restauraCopia(disc, await memoria.exporta(), { verifica: verificaCadena })).toEqual({ afegits: 2 });
    expect(await disc.exporta()).toBe(await memoria.exporta());
  });
});

describe('IndexedDB: només afegir', () => {
  test('cap operació d’esborrar ni de reescriure, ni al codi ni en una sessió sencera', async () => {
    const font = readFileSync(path.join(process.cwd(), 'src/sections/gestoria/facturacio/registre/portIndexedDB.js'), 'utf8');
    for (const vetat of [/\.put\s*\(/, /\.delete\s*\(/, /\.clear\s*\(/, /deleteDatabase/, /deleteObjectStore/, /\.update\s*\(/]) {
      expect(vetat.test(font), String(vetat)).toBe(false);
    }
    const idb = creaIdbFals();
    const port = creaPortIndexedDB({ idb, locks: null });
    for (const n of [1, 2]) await registraAlta(port, factura(n), { instant: MIGDIA + n * 1000 });
    await registraAnulacio(port, { idEmisor: CIF_EMISSOR, numSerie: 'A2026-0001', dataExpedicio: '2026-10-04', instant: MIGDIA + 5000 });
    await port.exporta();
    expect([...new Set(idb.operacions)].sort()).toEqual(['add', 'getAll', 'index.get', 'index.getAll', 'index.openCursor']);
  });

  test('desa la còpia que ha verificat, no l’objecte de qui crida, encara que canvie durant el resum', async () => {
    const port = creaPortIndexedDB({ idb: creaIdbFals(), locks: null });
    const viu = clona(await creaRegistreAlta({ factura: factura(1), instant: MIGDIA }));
    const promesa = port.afegix(viu);
    // L'hora és a l'empremta però cap altre camp no la contrasta: un canvi ací només el veu el resum.
    viu.dataHoraHusGeneracio = '2026-10-04T12:00:09+02:00';
    const desat = await promesa;
    expect(desat.dataHoraHusGeneracio).toBe('2026-10-04T12:00:00+02:00');
    expect(Object.isFrozen(desat)).toBe(true);
    expect((await port.ultim(CIF_EMISSOR)).dataHoraHusGeneracio).toBe('2026-10-04T12:00:00+02:00');
    expect((await verificaCadena(await port.llig())).valida).toBe(true);
  });

  test('un registre que no es pot copiar en JSON (BigInt, circular) dona REGISTRE_INVALID i no toca la base', async () => {
    const idb = creaIdbFals();
    const port = creaPortIndexedDB({ idb, locks: null });
    const bo = clona(await creaRegistreAlta({ factura: factura(1), instant: MIGDIA }));
    const circular = { ...bo };
    circular.jo = circular;
    for (const dolent of [{ ...bo, ordre: 1n }, circular]) {
      await expect(port.afegix(dolent)).rejects.toMatchObject({ codi: 'REGISTRE_INVALID' });
    }
    expect(idb.operacions).not.toContain('add');
    expect(await port.llig()).toEqual([]);
  });

  /* F01 de l'auditoria de Codex (261004_1010): la mateixa reproducció que al
     port de memòria, dins de la transacció d'IndexedDB. */
  test('un encadenament que nomena un altre anterior no entra (ENCADENAMENT_INCOHERENT): cap add i un sol registre', async () => {
    const idb = creaIdbFals();
    const port = creaPortIndexedDB({ idb, locks: null });
    const primer = await registraAlta(port, factura(1), { instant: MIGDIA });
    const segon = clona(await creaRegistreAlta({ factura: factura(2), anterior: primer, instant: MIGDIA + 1000 }));
    segon.encadenament.numSerie = 'A2026-0999';
    await expect(port.afegix(segon)).rejects.toMatchObject({ codi: 'ENCADENAMENT_INCOHERENT', detalls: ['numSerie'] });
    expect(idb.operacions.filter((o) => o === 'add')).toHaveLength(1);
    const desats = await port.llig();
    expect(desats.map((r) => r.numSerie)).toEqual(['A2026-0001']);
    expect((await verificaCadena(desats)).valida).toBe(true);
  });

  test('persistix: una altra pestanya amb la mateixa base veu el llibre', async () => {
    const idb = creaIdbFals();
    const primera = creaPortIndexedDB({ idb, nom: 'prova', locks: null });
    await registraAlta(primera, factura(1), { instant: MIGDIA });
    const segona = creaPortIndexedDB({ idb, nom: 'prova', locks: null });
    expect((await segona.ultim(CIF_EMISSOR)).numSerie).toBe('A2026-0001');
    expect(idb.bases.has('prova')).toBe(true);
    expect(idb.bases.has(NOM_BD)).toBe(false);
    expect(segona).toMatchObject({ tipus: 'indexeddb', persistent: true });
  });

  test('dos pestanyes que han llegit el mateix últim: el segon afegit no entra i no deixa res a mitges', async () => {
    const idb = creaIdbFals();
    const a = creaPortIndexedDB({ idb, nom: 'prova', locks: null });
    const b = creaPortIndexedDB({ idb, nom: 'prova', locks: null });
    const [ultimA, ultimB] = await Promise.all([a.ultim(CIF_EMISSOR), b.ultim(CIF_EMISSOR)]);
    const ra = await creaRegistreAlta({ factura: factura(1), anterior: ultimA, instant: MIGDIA });
    const rb = await creaRegistreAlta({ factura: factura(2), anterior: ultimB, instant: MIGDIA });
    // Qui arriba primer depén de quan acaba cada resum: no importa quin, només que n'entre un.
    const resultats = await Promise.allSettled([a.afegix(ra), b.afegix(rb)]);
    expect(resultats.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(resultats.find((r) => r.status === 'rejected').reason.codi).toBe('CADENA_CANVIADA');
    const desats = await b.llig();
    expect(desats).toHaveLength(1);
    expect(desats[0].empremta).toBe(resultats.find((r) => r.status === 'fulfilled').value.empremta);
  });

  test('l’índex únic de la base para un duplicat encara que la comprovació del codi fallara', async () => {
    const idb = creaIdbFals();
    const port = creaPortIndexedDB({ idb, nom: 'prova', locks: null });
    const primer = await registraAlta(port, factura(1), { instant: MIGDIA });
    // Una fila amb la mateixa clau de factura, escrita directament: la base la refusa (ConstraintError).
    const bd = await new Promise((resol) => {
      const p = idb.open('prova', 1);
      p.onsuccess = () => resol(p.result);
    });
    const error = await new Promise((resol) => {
      const tx = bd.transaction(['registres'], 'readwrite');
      tx.onerror = (event) => resol(event.target.error);
      tx.objectStore('registres').add({ clau: 'una altra', idEmisor: CIF_EMISSOR, factura: `alta|${CIF_EMISSOR}|A2026-0001|2026-10-04`, registre: primer });
    });
    expect(error.name).toBe('ConstraintError');
  });
});

describe('un sol escriptor amb Web Locks', () => {
  test('dos pestanyes que emeten alhora: una darrere de l’altra, sense cap error ni bifurcació', async () => {
    const idb = creaIdbFals();
    const locks = creaLocksFals();
    const a = creaPortIndexedDB({ idb, nom: 'prova', locks });
    const b = creaPortIndexedDB({ idb, nom: 'prova', locks });
    expect(a.coordinacio).toBe('web-locks');
    const desats = await Promise.all([registraAlta(a, factura(1), { instant: MIGDIA }), registraAlta(b, factura(2), { instant: MIGDIA })]);
    expect(desats.map((r) => r.ordre)).toEqual([1, 2]);
    expect(desats[1].encadenament.empremta).toBe(desats[0].empremta);
    expect((await verificaCadena(await a.llig())).valida).toBe(true);
    expect(locks.peticions).toEqual([{ nom: 'sdp-facturacio:prova', mode: 'exclusive' }, { nom: 'sdp-facturacio:prova', mode: 'exclusive' }]);
  });

  /* F02 de l'auditoria de Codex (261004_1010): numerar i registrar és una sola
     secció, també entre pestanyes. */
  test('dos pestanyes que emeten amb el cas d’ús d’emissió: números consecutius, sense repetir', async () => {
    const idb = creaIdbFals();
    const locks = creaLocksFals();
    const config = {
      esquema: ESQUEMA_CONFIG_EMPRESA, nif: CIF_EMISSOR, nom: 'Emissor', domicilis: [{ id: 'fiscal', ...DOMICILI }],
      domiciliFiscal: 'fiscal', facturacio: { dataPas: '2026-10-04' }
    };
    const pestanya = () => creaEmissio({ port: creaPortIndexedDB({ idb, nom: 'prova', locks }), config, llegat: [] });
    const dades = {
      tipus: 'F1', dataExpedicio: '2026-10-04', destinatari: { nif: DNI_CLIENT, nom: 'Client', domicili: DOMICILI },
      linies: [{ concepte: 'Servici', quantitat: 1, preuUnitari: 1000, tipusIva: 21 }]
    };
    const desats = await Promise.all([pestanya().emet(dades, { instant: MIGDIA }), pestanya().emet(dades, { instant: MIGDIA })]);
    expect(desats.map((r) => r.numSerie).sort()).toEqual(['A2026-0001', 'A2026-0002']);
    const llibre = await creaPortIndexedDB({ idb, nom: 'prova', locks }).llig();
    expect(llibre.map((r) => r.numSerie)).toEqual(['A2026-0001', 'A2026-0002']);
    expect((await verificaCadena(llibre)).valida).toBe(true);
  });

  test('sense Web Locks, la coordinació és de la pestanya i ho diu', () => {
    expect(creaPortIndexedDB({ idb: creaIdbFals(), locks: null }).coordinacio).toBe('pestanya');
  });
});

describe('la persistència que es pot demanar al navegador', () => {
  test('concedida, denegada, sense l’API o amb error', async () => {
    const amb = (persist) => creaPortIndexedDB({ idb: creaIdbFals(), locks: null, emmagatzematge: { persist } });
    expect(await amb(async () => true).demanaPersistencia()).toBe(true);
    expect(await amb(async () => false).demanaPersistencia()).toBe(false);
    expect(await amb(async () => { throw new Error('no'); }).demanaPersistencia()).toBe(false);
    expect(await creaPortIndexedDB({ idb: creaIdbFals(), locks: null, emmagatzematge: null }).demanaPersistencia()).toBeNull();
  });
});
