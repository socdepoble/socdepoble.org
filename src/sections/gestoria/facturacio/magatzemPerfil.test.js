// @vitest-environment node
/* El perfil fiscal local (ordre del Mestre, 261007: «tindre la facturació
   operativa inclús sense xarxa»; pas 1 del mapa de la Gestoria, G3 i G4).
   IndexedDB és un fals mínim escrit ací, com el de registre/portIndexedDB.test.js
   (LLEI_08: cap prova dels carrils importa suport de dins de src/): open i
   upgrade, un store amb keyPath, add/getAll, transaccions d'una en una i les
   avortades desfetes. Es mira que les versions són de només afegir, que cada
   una es valida abans d'entrar, que sense IndexedDB no hi ha perfil (mai
   memòria), i que creaEmissio arrenca des del que s'hi ha desat. Cap dada
   real: el NIF de l'empresa és el sintètic de les proves, el del client es
   compon a trossos perquè la porta de qualitat no hi veja un literal amb forma
   de DNI, i el domicili és inventat. */
import { describe, expect, test } from 'vitest';
import { ESQUEMA_CONFIG_EMPRESA } from './configEmpresa.js';
import { creaEmissio } from './emissio.js';
import { ESQUEMA_LLEGAT, sembraLlegat } from './llegat.js';
import { NOM_BD_PERFIL, TIPUS_PERFIL, creaMagatzemPerfil, validaMarcaCopia } from './magatzemPerfil.js';
import { verificaCadena } from './registre/cadena.js';
import { creaPortMemoria } from './registre/port.js';

const CIF_EMISSOR = 'B12345674';
const DNI_CLIENT = ['1234', '5678', 'Z'].join('');
const MIGDIA = Date.UTC(2026, 9, 7, 10, 0, 0);
const PAS = '2026-10-07';
const EMPREMTA = 'A'.repeat(64);
const DOMICILI = Object.freeze({ adreca: 'Plaça del Poble, 1', codiPostal: '46999', poblacio: 'Poble de Prova' });

const clona = (valor) => (valor === undefined ? undefined : JSON.parse(JSON.stringify(valor)));

/* Fals d'IndexedDB: les transaccions d'una base passen d'una en una (com fa
   el navegador amb les readwrite que se solapen) i una avortada desfà el que
   havia escrit. `operacions` apunta cada operació demanada: el fals no en té
   cap d'esborrar ni de reescriure, i es vigila que no se'n demana cap altra. */
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
      if (!correcta && instantania) base.files = instantania;
      despres(() => {
        if (correcta) tx.oncomplete?.();
        else {
          if (error) tx.onerror?.({ target: { error } });
          tx.onabort?.({ target: tx });
        }
        allibera();
      });
    };
    const potAcabar = () => {
      if (activa && pendents === 0) acaba(true);
    };
    previ.then(() => {
      activa = true;
      if (mode === 'readwrite') instantania = new Map(base.files);
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
    tx.objectStore = () => ({
      add: (valor) => peticio('add', () => {
        if (mode !== 'readwrite') throw Object.assign(new Error('Només lectura'), { name: 'ReadOnlyError' });
        const clau = valor[base.keyPath];
        if (base.files.has(clau)) throw Object.assign(new Error('Clau duplicada'), { name: 'ConstraintError' });
        base.files.set(clau, clona(valor));
        return clau;
      }),
      getAll: () => peticio('getAll', () => [...base.files.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([, v]) => clona(v)))
    });
    return tx;
  }
  return {
    bases,
    operacions,
    files: (nom) => [...(bases.get(nom)?.files ?? new Map()).entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([, v]) => clona(v)),
    open(nom, versio) {
      const peticio = {};
      despres(() => {
        let base = bases.get(nom);
        const puja = !base || base.versio < versio;
        if (!base) {
          base = { versio: 0, store: null, keyPath: null, files: new Map(), cua: Promise.resolve() };
          bases.set(nom, base);
        }
        peticio.result = {
          objectStoreNames: { contains: (n) => base.store === n },
          createObjectStore(n, { keyPath }) {
            base.store = n;
            base.keyPath = keyPath;
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

/* Els registres del llibre, que afegixConfig i afegixLlegat demanen sempre: buit, encara no s'ha emés res. */
const LLIBRE_BUIT = Object.freeze({ registres: Object.freeze([]) });

const config = (canvis = {}) => ({
  esquema: ESQUEMA_CONFIG_EMPRESA,
  nif: CIF_EMISSOR,
  nom: 'Forn del Poble SL',
  domicilis: [{ id: 'fiscal', ...DOMICILI }],
  domiciliFiscal: 'fiscal',
  facturacio: { dataPas: PAS },
  ...canvis
});

function muntatge({ instants = [MIGDIA] } = {}) {
  const idb = creaIdbFals();
  let i = 0;
  const rellotge = () => instants[Math.min(i++, instants.length - 1)];
  return { idb, perfil: creaMagatzemPerfil({ idb, rellotge }), nou: () => creaMagatzemPerfil({ idb, rellotge }) };
}

describe('sense IndexedDB no hi ha perfil', () => {
  test('SENSE_INDEXEDDB, i mai una reserva en memòria', () => {
    expect(() => creaMagatzemPerfil({ idb: null })).toThrow(expect.objectContaining({ codi: 'SENSE_INDEXEDDB' }));
    expect(() => creaMagatzemPerfil({ idb: {} })).toThrow(expect.objectContaining({ codi: 'SENSE_INDEXEDDB' }));
  });
});

describe('versions de només afegir', () => {
  test('buit: cap versió de cap tipus; la base és la pròpia, separada del llibre', async () => {
    const { idb, perfil } = muntatge();
    expect(await perfil.llig()).toEqual({ config: null, llegat: null, copia: null });
    expect(TIPUS_PERFIL).toEqual(['config', 'llegat', 'copia']);
    expect([...idb.bases.keys()]).toEqual([NOM_BD_PERFIL]);
    expect(perfil).toMatchObject({ tipus: 'indexeddb', persistent: true });
  });

  test('cada desament és una versió nova; la vigent és l’última i l’anterior no es toca', async () => {
    const { idb, perfil, nou } = muntatge({ instants: [MIGDIA, MIGDIA + 1000, MIGDIA + 2000] });
    const primera = await perfil.afegixConfig(config(), LLIBRE_BUIT);
    expect(primera).toMatchObject({ versio: 1, instant: MIGDIA, dades: { nif: CIF_EMISSOR, facturacio: { dataPas: PAS } } });
    expect(Object.isFrozen(primera.dades)).toBe(true);
    const segona = await perfil.afegixConfig(config({ nom: 'Forn del Poble i Fills SL' }), LLIBRE_BUIT);
    expect(segona).toMatchObject({ versio: 2, instant: MIGDIA + 1000 });
    await perfil.afegixLlegat(sembraLlegat(['F26 0001', 'F260002']), LLIBRE_BUIT);
    // Una altra instància (una altra pestanya, l'endemà) llig el mateix.
    const vist = await nou().llig();
    expect(vist.config).toMatchObject({ versio: 2, dades: { nom: 'Forn del Poble i Fills SL' } });
    expect(vist.llegat).toMatchObject({ versio: 1, dades: { esquema: ESQUEMA_LLEGAT, series: [{ prefix: 'F', any: 2026, ultim: 2 }] } });
    expect(vist.copia).toBeNull();
    expect((await perfil.historial('config')).map((v) => [v.versio, v.dades.nom])).toEqual([[1, 'Forn del Poble SL'], [2, 'Forn del Poble i Fills SL']]);
    // Només add(): cap put, delete ni clear al disc.
    expect([...new Set(idb.operacions)].sort()).toEqual(['add', 'getAll']);
    expect(idb.bases.get(NOM_BD_PERFIL).store).toBe('versions');
    expect(idb.files(NOM_BD_PERFIL).map((f) => f.clau)).toEqual(['config|000000000001', 'config|000000000002', 'llegat|000000000001']);
  });

  test('desaments concurrents: números de versió consecutius, cap repetit', async () => {
    const { perfil, nou } = muntatge();
    const altra = nou();
    const desats = await Promise.all([perfil.afegixConfig(config(), LLIBRE_BUIT), altra.afegixConfig(config(), LLIBRE_BUIT), perfil.afegixConfig(config(), LLIBRE_BUIT)]);
    expect(desats.map((v) => v.versio).sort()).toEqual([1, 2, 3]);
  });

  test('el que torna no es pot tocar, i tocar-lo no canvia el disc', async () => {
    const { perfil } = muntatge();
    await perfil.afegixConfig(config(), LLIBRE_BUIT);
    const { config: vigent } = await perfil.llig();
    expect(Object.isFrozen(vigent)).toBe(true);
    expect(() => { vigent.dades.nom = 'Una altra'; }).toThrow(TypeError);
    expect((await perfil.llig()).config.dades.nom).toBe('Forn del Poble SL');
    expect(await perfil.historial('config')).toHaveLength(1);
    await expect(perfil.historial('altre')).rejects.toThrow(TypeError);
  });
});

describe('cada versió es valida abans d’entrar', () => {
  test('la configuració: vàlida, normalitzada i amb la data de pas', async () => {
    const { perfil } = muntatge();
    await expect(perfil.afegixConfig({ ...config(), nif: 'no' }, LLIBRE_BUIT)).rejects.toMatchObject({ codi: 'CONFIG_INVALIDA' });
    await expect(perfil.afegixConfig(config({ facturacio: undefined }), LLIBRE_BUIT)).rejects.toMatchObject({ codi: 'SENSE_DATA_PAS' });
    await expect(perfil.afegixConfig(config({ facturacio: { prefixos: { F1: 'B' } } }), LLIBRE_BUIT)).rejects.toMatchObject({ codi: 'SENSE_DATA_PAS' });
    // El NIF entra normalitzat (minúscules i guions fora), i un camp de més no hi entra.
    const desada = await perfil.afegixConfig(config({ nif: 'b-12345674' }), LLIBRE_BUIT);
    expect(desada.dades.nif).toBe(CIF_EMISSOR);
    await expect(perfil.afegixConfig({ ...config(), sobrant: 1 }, LLIBRE_BUIT)).rejects.toMatchObject({ codi: 'CONFIG_INVALIDA' });
    expect(await perfil.historial('config')).toHaveLength(1);
  });

  /* Troballa F4 de la revisió (261007): sense el llibre no se sap si el perfil
     ja és fix, i una guarda que es pot ometre no guarda res. */
  test('sense els registres del llibre, la configuració i el llegat no es desen', async () => {
    const { perfil } = muntatge();
    await expect(perfil.afegixConfig(config())).rejects.toThrow(TypeError);
    await expect(perfil.afegixConfig(config(), { registres: 'cap' })).rejects.toThrow(TypeError);
    await expect(perfil.afegixLlegat(sembraLlegat([]))).rejects.toThrow(TypeError);
    expect(await perfil.llig()).toEqual({ config: null, llegat: null, copia: null });
  });

  test('el llegat: només el resultat de sembraLlegat, també el buit', async () => {
    const { perfil } = muntatge();
    for (const dolent of [null, [], ['F26 0001'], { series: [] }, { esquema: ESQUEMA_LLEGAT, series: [{ prefix: 'F', any: 26 }], noReconeguts: [] },
      { esquema: ESQUEMA_LLEGAT, series: [], noReconeguts: [3] }]) {
      await expect(perfil.afegixLlegat(dolent, LLIBRE_BUIT), JSON.stringify(dolent)).rejects.toMatchObject({ codi: 'LLEGAT_INVALID' });
    }
    expect(await perfil.afegixLlegat(sembraLlegat([]), LLIBRE_BUIT)).toMatchObject({ versio: 1, dades: { series: [], noReconeguts: [] } });
  });

  test('la marca de la còpia: un NIF, un ordre i una empremta per cadena', async () => {
    const { perfil } = muntatge();
    const bona = { cadenes: [{ idEmisor: CIF_EMISSOR, ordre: 3, empremta: EMPREMTA }], nomFitxer: 'llibre.json' };
    expect(validaMarcaCopia(bona)).toEqual([]);
    expect(validaMarcaCopia({ cadenes: [] })).toEqual([]);
    for (const dolenta of [null, { cadenes: 'x' }, { cadenes: [{ idEmisor: 'no', ordre: 1, empremta: EMPREMTA }] },
      { cadenes: [{ idEmisor: CIF_EMISSOR, ordre: 0, empremta: EMPREMTA }] }, { cadenes: [{ idEmisor: CIF_EMISSOR, ordre: 1, empremta: 'abc' }] },
      { cadenes: [bona.cadenes[0], bona.cadenes[0]] }, { cadenes: [], nomFitxer: ' a.json' }, { cadenes: [], altre: 1 }]) {
      expect(validaMarcaCopia(dolenta).length, JSON.stringify(dolenta)).toBeGreaterThan(0);
      await expect(perfil.afegixCopia(dolenta)).rejects.toMatchObject({ codi: 'MARCA_INVALIDA' });
    }
    expect(await perfil.afegixCopia(bona)).toMatchObject({ versio: 1, dades: bona });
  });
});

/* Troballes F2 i F4 de la revisió de la Facturació (261007): el perfil es
   reescrivia sense fre després d'emetre (NIF, data de pas, llegat), i una
   marca de còpia d'un llibre truncat substituïa la bona. */
describe('el perfil es fixa quan s’emet, i la marca de còpia no recula', () => {
  /* El llibre només ha de dir de qui són els registres: el magatzem no en llig res més. */
  const llibreDe = (...nifs) => Object.freeze({ registres: nifs.map((idEmisor) => ({ idEmisor })) });

  test('amb factures del NIF vigent, el NIF i la data de pas no canvien; la resta, sí', async () => {
    const { perfil } = muntatge();
    await perfil.afegixConfig(config(), LLIBRE_BUIT);
    // Abans d'emetre res, tot es pot corregir (també si el llibre porta factures d'un altre NIF).
    expect(await perfil.afegixConfig(config({ facturacio: { dataPas: '2026-10-08' } }), llibreDe(DNI_CLIENT))).toMatchObject({ versio: 2 });
    const ambFactures = llibreDe(CIF_EMISSOR);
    await expect(perfil.afegixConfig(config({ nif: DNI_CLIENT, facturacio: { dataPas: '2026-10-08' } }), ambFactures)).rejects.toMatchObject({
      codi: 'PERFIL_FIXAT', detalls: [`Ja hi ha factures emeses amb el NIF ${CIF_EMISSOR}: el NIF no es pot canviar.`]
    });
    // La data de pas, ni abans (l'eina d'abans facturava) ni després (les factures emeses quedarien d'abans del pas).
    for (const dataPas of ['2026-10-01', '2026-10-09']) {
      await expect(perfil.afegixConfig(config({ facturacio: { dataPas } }), ambFactures), dataPas).rejects.toMatchObject({
        codi: 'PERFIL_FIXAT', detalls: ['Ja hi ha factures emeses des del pas del 08/10/2026: la data de pas no es pot canviar.']
      });
    }
    // El nom, el domicili i la resta continuen sent dades de l'empresa que canvien.
    expect(await perfil.afegixConfig(config({ nom: 'Forn del Poble i Fills SL', facturacio: { dataPas: '2026-10-08' } }), ambFactures))
      .toMatchObject({ versio: 3, dades: { nif: CIF_EMISSOR, nom: 'Forn del Poble i Fills SL' } });
    expect((await perfil.historial('config')).map((v) => v.versio)).toEqual([1, 2, 3]);
  });

  test('amb factures emeses, el llegat només s’amplia: cap sèrie declarada es perd', async () => {
    const { perfil } = muntatge();
    await perfil.afegixConfig(config(), LLIBRE_BUIT);
    await perfil.afegixLlegat(sembraLlegat(['F26 0001', 'F260002']), LLIBRE_BUIT);
    const ambFactures = llibreDe(CIF_EMISSOR);
    await expect(perfil.afegixLlegat(sembraLlegat([]), ambFactures)).rejects.toMatchObject({
      codi: 'PERFIL_FIXAT', detalls: ['La sèrie F de 2026 (fins al número 2) ja estava declarada i no es pot llevar.']
    });
    await expect(perfil.afegixLlegat(sembraLlegat(['F26 0001']), ambFactures)).rejects.toMatchObject({
      codi: 'PERFIL_FIXAT', detalls: ['La sèrie F de 2026 arribava fins al número 2: no es pot deixar en el 1.']
    });
    expect((await perfil.llig()).llegat).toMatchObject({ versio: 1 });
    // Afegir-hi una sèrie oblidada, o números de més, sí.
    expect(await perfil.afegixLlegat(sembraLlegat(['F26 0001', 'F260002', 'F260003', 'F25 0007']), ambFactures)).toMatchObject({ versio: 2 });
    // Abans d'emetre, el llegat es pot tornar a declarar sencer.
    expect(await perfil.afegixLlegat(sembraLlegat([]), LLIBRE_BUIT)).toMatchObject({ versio: 3 });
  });

  test('la marca de la còpia no recula: ni menys registres, ni una cadena perduda, ni un altre registre amb el mateix ordre', async () => {
    const { perfil } = muntatge();
    const altra = 'B'.repeat(64);
    await perfil.afegixCopia({ cadenes: [{ idEmisor: CIF_EMISSOR, ordre: 5, empremta: EMPREMTA }], nomFitxer: 'bona.json' });
    const enrere = [
      [{ cadenes: [] }, `La còpia anterior portava la cadena de ${CIF_EMISSOR} fins al registre 5, i esta no la porta.`],
      [{ cadenes: [{ idEmisor: CIF_EMISSOR, ordre: 2, empremta: altra }] }, `La còpia anterior arribava al registre 5 de ${CIF_EMISSOR}, i esta només al 2.`],
      [{ cadenes: [{ idEmisor: CIF_EMISSOR, ordre: 5, empremta: altra }] }, `El registre 5 de ${CIF_EMISSOR} no és el de la còpia anterior.`]
    ];
    for (const [marca, motiu] of enrere) {
      await expect(perfil.afegixCopia(marca), JSON.stringify(marca)).rejects.toMatchObject({ codi: 'MARCA_ENRERE', detalls: [motiu] });
    }
    expect((await perfil.llig()).copia).toMatchObject({ versio: 1, dades: { nomFitxer: 'bona.json' } });
    // La mateixa o una de més avant, sí; i una cadena nova d'un altre NIF s'hi pot sumar.
    expect(await perfil.afegixCopia({ cadenes: [{ idEmisor: CIF_EMISSOR, ordre: 5, empremta: EMPREMTA }] })).toMatchObject({ versio: 2 });
    expect(await perfil.afegixCopia({ cadenes: [{ idEmisor: DNI_CLIENT, ordre: 1, empremta: altra }, { idEmisor: CIF_EMISSOR, ordre: 7, empremta: altra }] }))
      .toMatchObject({ versio: 3 });
  });
});

describe('creaEmissio arrenca des del perfil desat', () => {
  test('sense xarxa i sense tornar a triar cap fitxer: la configuració i el llegat del disc emeten', async () => {
    const { perfil, nou } = muntatge();
    await perfil.afegixConfig(config(), LLIBRE_BUIT);
    await perfil.afegixLlegat(sembraLlegat(['F26 0001', 'F260002']), LLIBRE_BUIT);
    const { config: vigent, llegat } = await nou().llig();
    const port = creaPortMemoria();
    const cas = creaEmissio({ port, config: vigent.dades, llegat: llegat.dades });
    const alta = await cas.emet({
      tipus: 'F1', dataExpedicio: PAS, destinatari: { nif: DNI_CLIENT, nom: 'Client', domicili: DOMICILI },
      linies: [{ concepte: 'Pa de llenya', quantitat: 2, preuUnitari: 250, tipusIva: 4 }]
    }, { instant: MIGDIA });
    expect(alta).toMatchObject({ numSerie: 'A2026-0001', idEmisor: CIF_EMISSOR });
    // El llegat desat també governa: la sèrie de l'eina externa continua tancada.
    await expect(cas.emet({ tipus: 'F1', numSerie: 'F260003', dataExpedicio: PAS, linies: [] }, { instant: MIGDIA }))
      .rejects.toMatchObject({ codi: 'SERIE_CONFUSA' });
    expect((await verificaCadena(await port.llig())).valida).toBe(true);
  });
});
