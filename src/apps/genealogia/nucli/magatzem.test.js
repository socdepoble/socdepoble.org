// @vitest-environment node
/* Arbre Genealògic · el magatzem «sdp-genealogia»: amb l'IndexedDB fals de les
   proves (no hi ha fake-indexeddb), la llista blanca del model, la partició
   per arbre, el desat que esborra el que ja no hi és i, sense IndexedDB,
   memòria amb persistent: false. */
import { describe, expect, test } from 'vitest';
import { creaIdbFals } from '../../../utils/__fixtures__/navegadorFals.js';
import { ANY, ARA, arbre, complet, persona, rel, uid } from './__fixtures__/arbreSintetic.js';
import { CLAUS_META, NOM_BASE, carregaArbre, carregaMeta, creaMagatzemGenealogia, desaArbre, desaMeta, esborraArbre, llistaArbres } from '../magatzem.js';
import { creaArbre } from './model.js';

const crea = (idb) => creaMagatzemGenealogia({ idb, navegador: null, Canal: null, anyActual: ANY });
const altre = () => creaArbre({ id: uid(900), titol: 'Altre', ara: ARA });

describe('amb IndexedDB', () => {
  test('desa un arbre sencer i el llig des d’una altra instància', async () => {
    const fals = creaIdbFals();
    const c = { ...complet([persona(1, { naixement: '1908' }), persona(2)], [rel(10, 'progenitor', 1, 2)]), entrevista: { arbreId: arbre().id, pas: 1, respostes: { casa: 'Ca la Prova' }, completada: false, modificada: ARA } };
    const primer = crea(fals.idb);
    expect(primer.persistent).toBe(true);
    await desaArbre(primer, c);
    const llegit = await carregaArbre(crea(fals.idb), c.arbre.id);
    expect(llegit).toEqual(c);
    expect(fals.registre.obrides.every(([nom, versio]) => nom === NOM_BASE && versio === 1)).toBe(true);
    expect(fals.registre.obertes).toBe(0);
  });

  test('la llista blanca: camps desconeguts fora i registres invàlids rebutjats', async () => {
    const fals = creaIdbFals();
    const magatzem = crea(fals.idb);
    await magatzem.desa('persones', { ...persona(1), dni: '00000000T', privada: true });
    expect(Object.keys(fals.files(NOM_BASE, 'persones')[0])).not.toContain('dni');
    expect(Object.keys(fals.files(NOM_BASE, 'persones')[0])).not.toContain('privada');
    await expect(magatzem.desa('persones', { ...persona(1), sexe: 'X' })).rejects.toThrow(TypeError);
    await expect(magatzem.desa('relacions', { ...rel(10, 'progenitor', 1, 2), a: uid(1) })).rejects.toThrow(TypeError);
    await expect(magatzem.desa('relacions', { ...rel(10, 'progenitor', 1, 2), tipus: 'cosi' })).rejects.toThrow(TypeError);
    await expect(desaMeta(magatzem, 'secret', 'x')).rejects.toThrow(/desconeguda/);
    await expect(desaMeta(magatzem, 'avis', { acceptatA: 'ahir', versio: 1 })).rejects.toThrow(TypeError);
    expect(CLAUS_META).toEqual(['avis', 'arbreActiu', 'ultimaCopia']);
  });

  test('desaArbre esborra les persones i relacions que ja no hi són, i no toca els altres arbres', async () => {
    const magatzem = crea(creaIdbFals().idb);
    const c = complet([persona(1), persona(2), persona(3)], [rel(10, 'progenitor', 1, 2), rel(11, 'progenitor', 1, 3)]);
    await desaArbre(magatzem, c);
    const deLAltre = { ...persona(50), arbreId: uid(900) };
    await desaArbre(magatzem, { arbre: altre(), persones: [deLAltre], relacions: [], entrevista: null });
    await desaArbre(magatzem, { ...c, persones: c.persones.slice(0, 2), relacions: c.relacions.slice(0, 1) });
    const llegit = await carregaArbre(magatzem, c.arbre.id);
    expect(llegit.persones.map((p) => p.id)).toEqual([uid(1), uid(2)]);
    expect(llegit.relacions.map((r) => r.id)).toEqual([uid(10)]);
    expect((await carregaArbre(magatzem, uid(900))).persones).toEqual([deLAltre]);
    expect((await llistaArbres(magatzem)).map((a) => a.titol)).toEqual(['Altre', 'Arbre de prova']);
    await expect(desaArbre(magatzem, { ...c, persones: [deLAltre] })).rejects.toThrow(TypeError);
  });

  test('arbre, persones, relacions, entrevista i punter actiu fan un únic commit', async () => {
    const fals = creaIdbFals();
    const transaccions = [];
    const obri = fals.idb.open.bind(fals.idb);
    fals.idb.open = (...args) => {
      const peticio = obri(...args);
      let success;
      Object.defineProperty(peticio, 'onsuccess', {
        get: () => success,
        set: fn => { success = () => {
          const db = peticio.result;
          const transaction = db.transaction.bind(db);
          db.transaction = (stores, mode) => {
            transaccions.push({ stores, mode });
            return transaction(stores, mode);
          };
          fn();
        }; }
      });
      return peticio;
    };
    const magatzem = crea(fals.idb);
    const c = { ...complet([persona(1), persona(2)], [rel(10, 'progenitor', 1, 2)]),
      entrevista: { arbreId: arbre().id, pas: 1, respostes: {}, completada: false, modificada: ARA } };
    await desaArbre(magatzem, c, { activa: true });
    expect(transaccions).toEqual([{ stores: ['arbres', 'persones', 'relacions', 'entrevistes', 'meta'], mode: 'readwrite' }]);
    expect(await carregaArbre(magatzem, c.arbre.id)).toEqual(c);
    expect((await carregaMeta(magatzem)).arbreActiu).toBe(c.arbre.id);
    expect(fals.registre.obertes).toBe(0);
  });

  test('un error de quota en meta avorta també els quatre stores ja escrits', async () => {
    const fals = creaIdbFals();
    const magatzem = crea(fals.idb);
    const c = complet([persona(1)], []);
    await desaArbre(magatzem, c, { activa: true });
    await desaMeta(magatzem, 'avis', { acceptatA: ARA, versio: 1 });
    const abans = await magatzem.bolca();
    const error = Object.assign(new Error('Quota sintètica'), { name: 'QuotaExceededError' });
    fals.bases.get(NOM_BASE).stores.get('meta').files.set = () => { throw error; };
    const nou = { arbre: altre(), persones: [{ ...persona(50), arbreId: uid(900) }], relacions: [], entrevista: null };
    await expect(desaArbre(magatzem, nou, { activa: true })).rejects.toBe(error);
    expect(await magatzem.bolca()).toEqual(abans);
    expect(fals.registre.obertes).toBe(0);
  });

  test('un abort de la transacció rebutja el commit i conserva el punter i les dades', async () => {
    const fals = creaIdbFals();
    const obri = fals.idb.open.bind(fals.idb);
    let avorta = false;
    fals.idb.open = (...args) => {
      const peticio = obri(...args);
      let success;
      Object.defineProperty(peticio, 'onsuccess', {
        get: () => success,
        set: fn => { success = () => {
          const db = peticio.result;
          const transaction = db.transaction.bind(db);
          db.transaction = (...params) => {
            const tx = transaction(...params);
            if (avorta && params[1] === 'readwrite') queueMicrotask(() => tx.abort());
            return tx;
          };
          fn();
        }; }
      });
      return peticio;
    };
    const magatzem = crea(fals.idb);
    const c = complet([persona(1)], []);
    await desaArbre(magatzem, c, { activa: true });
    const abans = await magatzem.bolca();
    avorta = true;
    await expect(desaArbre(magatzem, { ...c, persones: [persona(2)] }, { activa: true })).rejects.toThrow();
    avorta = false;
    expect(await magatzem.bolca()).toEqual(abans);
    expect(fals.registre.obertes).toBe(0);
  });

  test.each([true, false])('una validació tardana o un id alié conserva tot el bolcat (IDB=%s)', async idb => {
    const magatzem = crea(idb ? creaIdbFals().idb : null);
    const c = complet([persona(1)], []);
    await desaArbre(magatzem, c, { activa: true });
    const abans = await magatzem.bolca();
    await expect(desaArbre(magatzem, { ...c, arbre: arbre({ titol: 'No ha de persistir' }),
      entrevista: { arbreId: arbre().id, pas: -1 } }, { activa: true })).rejects.toThrow(TypeError);
    expect(await magatzem.bolca()).toEqual(abans);
    await expect(desaArbre(magatzem, { arbre: altre(), persones: [{ ...persona(1), arbreId: uid(900) }],
      relacions: [], entrevista: null }, { activa: true })).rejects.toThrow(/altre arbre/);
    expect(await magatzem.bolca()).toEqual(abans);
  });

  test('esborraArbre ho esborra tot i deixa l’arbre actiu a null', async () => {
    const magatzem = crea(creaIdbFals().idb);
    const c = complet([persona(1)], []);
    await desaArbre(magatzem, c);
    await desaMeta(magatzem, 'arbreActiu', c.arbre.id);
    await esborraArbre(magatzem, c.arbre.id);
    expect(await carregaArbre(magatzem, c.arbre.id)).toBeNull();
    expect(await magatzem.totes('persones')).toEqual([]);
    expect(await carregaMeta(magatzem)).toEqual({ avis: null, arbreActiu: null, ultimaCopia: null });
  });
});

describe('sense IndexedDB', () => {
  test('treballa en memòria i ho declara', async () => {
    const magatzem = crea(null);
    expect(magatzem.persistent).toBe(false);
    const c = complet([persona(1)], []);
    await desaArbre(magatzem, c);
    await desaMeta(magatzem, 'avis', { acceptatA: ARA, versio: 1 });
    expect(await carregaArbre(magatzem, c.arbre.id)).toEqual(c);
    expect((await carregaMeta(magatzem)).avis).toEqual({ acceptatA: ARA, versio: 1 });
    expect(await carregaArbre(magatzem, 'no/val')).toBeNull();
  });
});
