// @vitest-environment node
/* magatzemLocal amb un IndexedDB fals fet a mà (no hi ha fake-indexeddb i
   no se n'ha d'instal·lar), uns Web Locks i un BroadcastChannel falsos que
   comparteixen estat entre «pestanyes» (instàncies). Dades sintètiques. */
import { describe, expect, test } from 'vitest';
import { creaMagatzemIdb } from './magatzemLocal.js';
import { creaCanalFals, creaIdbFals, creaLocksFals } from './__fixtures__/navegadorFals.js';

const espera = (ms = 5) => new Promise((resolve) => { setTimeout(resolve, ms); });

const STORES = { tiquets: { clau: 'id', indexs: ['tornId'] }, meta: { clau: 'clau' } };
const BLANCA = { tiquets: ['id', 'tornId', 'total', 'rev'], meta: ['clau', 'valor'] };
const crea = (extra = {}) => creaMagatzemIdb({
  nom: 'sdp-prova', versio: 1, stores: STORES, llistaBlanca: BLANCA, navegador: null, Canal: null, ...extra
});
const tiquet = (id, extra = {}) => ({ id, tornId: 'torn-1', total: 250, ...extra });

describe('la definició', () => {
  test('rebutja una base sense nom, versió, stores o llista blanca', () => {
    expect(() => crea({ nom: '' })).toThrow(TypeError);
    expect(() => crea({ versio: 0 })).toThrow(TypeError);
    expect(() => crea({ stores: {} })).toThrow(TypeError);
    expect(() => crea({ llistaBlanca: undefined })).toThrow(TypeError);
    expect(() => crea({ llistaBlanca: { tiquets: BLANCA.tiquets } })).toThrow(/Falta la llista blanca del store «meta»/);
    expect(() => crea({ stores: { tiquets: { indexs: [] }, meta: STORES.meta } })).toThrow(/necessita la clau/);
  });

  test('la clau i els índexs han de ser a la llista blanca', () => {
    expect(() => crea({ llistaBlanca: { ...BLANCA, tiquets: ['id', 'total'] } })).toThrow(/ha d'incloure «tornId»/);
    expect(() => crea({ llistaBlanca: { ...BLANCA, meta: ['valor'] } })).toThrow(/ha d'incloure «clau»/);
  });
});

describe('amb IndexedDB', () => {
  test('desa i llig des d’una altra instància; mateixa base i versió, connexions tancades', async () => {
    const fals = creaIdbFals();
    const primer = crea({ idb: fals.idb });
    expect(primer.persistent).toBe(true);
    await primer.desa('tiquets', tiquet('t-2'));
    await primer.desa('tiquets', tiquet('t-1', { total: 100 }));
    await primer.desa('meta', { clau: 'establiment', valor: 'Bar de prova' });
    const segon = crea({ idb: fals.idb });
    expect((await segon.totes('tiquets')).map((t) => [t.id, t.total])).toEqual([['t-1', 100], ['t-2', 250]]);
    expect(await segon.obte('meta', 'establiment')).toEqual({ clau: 'establiment', valor: 'Bar de prova' });
    expect(await segon.obte('meta', 'no-hi-és')).toBeUndefined();
    expect(fals.registre.obrides.every(([nom, versio]) => nom === 'sdp-prova' && versio === 1)).toBe(true);
    expect(fals.registre.obertes).toBe(0);
  });

  test('la llista blanca descarta el que no hi és i rebutja el que no té clau', async () => {
    const fals = creaIdbFals();
    const magatzem = crea({ idb: fals.idb });
    const desat = await magatzem.desa('tiquets', tiquet('t-1', { nomClient: 'no ha d’arribar al disc' }));
    expect(desat).toEqual(tiquet('t-1'));
    expect(fals.files('sdp-prova', 'tiquets')).toEqual([tiquet('t-1')]);
    await expect(magatzem.desa('tiquets', { tornId: 'torn-1' })).rejects.toThrow(TypeError);
    await expect(magatzem.desa('tiquets', [tiquet('t-9')])).rejects.toThrow(TypeError);
    await expect(magatzem.desa('desconegut', tiquet('t-1'))).rejects.toThrow(/Store desconegut/);
    await expect(magatzem.obte('desconegut', 't-1')).rejects.toThrow(/Store desconegut/);
  });

  test('una llista blanca funció pot netejar en profunditat i rebutjar', async () => {
    const magatzem = crea({
      idb: creaIdbFals().idb,
      llistaBlanca: {
        ...BLANCA,
        meta: (r) => {
          if (typeof r.valor !== 'string') throw new TypeError('valor ha de ser text');
          return { clau: r.clau, valor: r.valor.trim() };
        }
      }
    });
    expect(await magatzem.desa('meta', { clau: 'a', valor: '  x  ', sobra: 1 })).toEqual({ clau: 'a', valor: 'x' });
    await expect(magatzem.desa('meta', { clau: 'b', valor: 3 })).rejects.toThrow('valor ha de ser text');
  });

  test('perIndex torna els del torn; un índex no declarat es rebutja', async () => {
    const magatzem = crea({ idb: creaIdbFals().idb });
    await magatzem.desaTots('tiquets', [tiquet('t-1'), tiquet('t-2', { tornId: 'torn-2' }), tiquet('t-3')]);
    expect((await magatzem.perIndex('tiquets', 'tornId', 'torn-1')).map((t) => t.id)).toEqual(['t-1', 't-3']);
    await expect(magatzem.perIndex('tiquets', 'total', 250)).rejects.toThrow(TypeError);
  });

  test('desaTots és tot o res', async () => {
    const fals = creaIdbFals();
    const magatzem = crea({ idb: fals.idb });
    await expect(magatzem.desaTots('tiquets', [tiquet('t-1'), { total: 3 }])).rejects.toThrow(TypeError);
    expect(await magatzem.totes('tiquets')).toEqual([]);
  });

  test('actualitza llig i escriu en la mateixa transacció; un conflicte de rev avorta sense escriure', async () => {
    const magatzem = crea({ idb: creaIdbFals().idb });
    await magatzem.desa('tiquets', tiquet('t-1', { rev: 1 }));
    const ambRev = (esperada, canvi) => (actual) => {
      if ((actual?.rev ?? 0) !== esperada) throw Object.assign(new Error('Conflicte'), { codi: 'CONFLICTE_REV' });
      return { ...actual, ...canvi, rev: esperada + 1 };
    };
    expect(await magatzem.actualitza('tiquets', 't-1', ambRev(1, { total: 300 }))).toMatchObject({ total: 300, rev: 2 });
    await expect(magatzem.actualitza('tiquets', 't-1', ambRev(1, { total: 999 }))).rejects.toMatchObject({ codi: 'CONFLICTE_REV' });
    expect(await magatzem.obte('tiquets', 't-1')).toMatchObject({ total: 300, rev: 2 });
    expect(await magatzem.actualitza('tiquets', 't-1', () => undefined)).toMatchObject({ rev: 2 });
    await expect(magatzem.actualitza('tiquets', 't-1', (a) => ({ ...a, id: 't-2' }))).rejects.toThrow(/no pot canviar la clau/);
    expect(await magatzem.actualitza('tiquets', 't-nou', (actual) => (actual ? actual : tiquet('t-nou')))).toEqual(tiquet('t-nou'));
  });

  test('esborra, buida, buidaTot i bolca', async () => {
    const magatzem = crea({ idb: creaIdbFals().idb });
    await magatzem.desaTots('tiquets', [tiquet('t-1'), tiquet('t-2')]);
    await magatzem.desa('meta', { clau: 'a', valor: 'x' });
    await magatzem.esborra('tiquets', 't-1');
    expect(await magatzem.bolca()).toEqual({ tiquets: [tiquet('t-2')], meta: [{ clau: 'a', valor: 'x' }] });
    await magatzem.buida('meta');
    expect(await magatzem.totes('meta')).toEqual([]);
    await magatzem.desa('meta', { clau: 'b', valor: 'y' });
    await magatzem.buidaTot();
    expect(await magatzem.bolca()).toEqual({ tiquets: [], meta: [] });
  });

  test('les operacions van en fila: l’última escriptura és la que queda', async () => {
    const magatzem = crea({ idb: creaIdbFals().idb });
    await Promise.all([1, 2, 3].map((total) => magatzem.desa('tiquets', tiquet('t-1', { total }))));
    expect((await magatzem.obte('tiquets', 't-1')).total).toBe(3);
  });

  test('les còpies retornades no comparteixen referència amb el magatzem', async () => {
    const magatzem = crea({ idb: creaIdbFals().idb });
    const desat = await magatzem.desa('tiquets', tiquet('t-1'));
    desat.total = 1;
    const llegit = await magatzem.obte('tiquets', 't-1');
    llegit.total = 2;
    expect((await magatzem.obte('tiquets', 't-1')).total).toBe(250);
  });

  test('una altra pestanya que puja la versió tanca la connexió', async () => {
    const fals = creaIdbFals();
    await crea({ idb: fals.idb }).prepara();
    const [connexio] = fals.registre.connexions;
    connexio.tancada = false;
    fals.registre.obertes += 1;
    connexio.onversionchange();
    expect(connexio.tancada).toBe(true);
    expect(fals.registre.obertes).toBe(0);
  });

  test('pujar la versió crea els stores i els índexs nous i conserva les dades', async () => {
    const fals = creaIdbFals();
    await crea({ idb: fals.idb }).desa('tiquets', tiquet('t-1'));
    const v2 = crea({
      idb: fals.idb, versio: 2,
      stores: { ...STORES, tiquets: { clau: 'id', indexs: ['tornId', 'rev'] }, torns: { clau: 'id' } },
      llistaBlanca: { ...BLANCA, torns: ['id', 'obert'] }
    });
    expect(await v2.prepara()).toBe(true);
    expect(await v2.totes('tiquets')).toEqual([tiquet('t-1')]);
    expect(fals.bases.get('sdp-prova').stores.get('tiquets').indexs.has('rev')).toBe(true);
    await v2.desa('torns', { id: 'torn-1', obert: true });
    await v2.desa('tiquets', tiquet('t-2', { rev: 5 }));
    expect(await v2.perIndex('tiquets', 'rev', 5)).toEqual([tiquet('t-2', { rev: 5 })]);
  });

  test('si una altra pestanya bloqueja l’actualització, l’operació ho diu i no passa a memòria', async () => {
    const fals = creaIdbFals({ bloqueja: true });
    const magatzem = crea({ idb: fals.idb });
    await expect(magatzem.desa('tiquets', tiquet('t-1'))).rejects.toMatchObject({ codi: 'BLOQUEJAT' });
    expect(magatzem.persistent).toBe(true);
    await espera();
    expect(fals.registre.obertes).toBe(0);
  });

  test('si una altra pestanya ja ha pujat la versió, ho diu (VERSIO_ANTIGA) i no passa a memòria', async () => {
    const fals = creaIdbFals();
    await crea({ idb: fals.idb, versio: 2 }).desa('tiquets', tiquet('t-1'));
    const vella = crea({ idb: fals.idb });
    await expect(vella.desa('tiquets', tiquet('t-2'))).rejects.toMatchObject({ codi: 'VERSIO_ANTIGA' });
    await expect(vella.totes('tiquets')).rejects.toMatchObject({ codi: 'VERSIO_ANTIGA' });
    await expect(vella.bolca()).rejects.toMatchObject({ codi: 'VERSIO_ANTIGA' });
    await expect(vella.prepara()).rejects.toMatchObject({ codi: 'VERSIO_ANTIGA' });
    expect(vella.persistent).toBe(true);
    expect(fals.files('sdp-prova', 'tiquets')).toEqual([tiquet('t-1')]);
  });

  test('si la base deixa de respondre a mitja sessió, falla (NO_DISPONIBLE) i no servix dades parcials de memòria', async () => {
    const fals = creaIdbFals();
    const magatzem = crea({ idb: fals.idb });
    await magatzem.desa('tiquets', tiquet('t-1'));
    fals.control.fallaObrir = true;
    await expect(magatzem.desa('tiquets', tiquet('t-2'))).rejects.toMatchObject({ codi: 'NO_DISPONIBLE' });
    await expect(magatzem.totes('tiquets')).rejects.toMatchObject({ codi: 'NO_DISPONIBLE' });
    await expect(magatzem.bolca()).rejects.toMatchObject({ codi: 'NO_DISPONIBLE' });
    expect(magatzem.persistent).toBe(true);
    fals.control.fallaObrir = false;
    expect((await magatzem.totes('tiquets')).map((t) => t.id)).toEqual(['t-1']);
  });

  test('perIndex rebutja un valor que no és clau: sense torn obert no torna tot l’historial', async () => {
    const magatzem = crea({ idb: creaIdbFals().idb });
    await magatzem.desaTots('tiquets', [tiquet('t-1'), tiquet('t-2', { tornId: 'torn-2' })]);
    for (const dolent of [undefined, null, true, {}, Number.NaN]) {
      await expect(magatzem.perIndex('tiquets', 'tornId', dolent), String(dolent)).rejects.toThrow(TypeError);
    }
    await expect(crea({ idb: null }).perIndex('tiquets', 'tornId', undefined)).rejects.toThrow(TypeError);
    expect(await magatzem.perIndex('tiquets', 'tornId', '')).toEqual([]);
  });

  test('el fals fa com IndexedDB: un índex sense valor ho torna tot i un valor que no és clau llança', async () => {
    const fals = creaIdbFals();
    const magatzem = crea({ idb: fals.idb });
    await magatzem.desaTots('tiquets', [tiquet('t-1', { tornId: 'torn-2' }), tiquet('t-2'), tiquet('t-3', { tornId: undefined })]);
    const db = await new Promise((resolve, reject) => {
      const peticio = fals.idb.open('sdp-prova', 1);
      peticio.onsuccess = () => resolve(peticio.result);
      peticio.onerror = () => reject(peticio.error);
    });
    const index = db.transaction('tiquets', 'readonly').objectStore('tiquets').index('tornId');
    const tot = await new Promise((resolve) => {
      const peticio = index.getAll(undefined);
      peticio.onsuccess = () => resolve(peticio.result);
    });
    expect(tot.map((t) => t.id)).toEqual(['t-2', 't-1']);
    expect(() => index.getAll(true)).toThrow(expect.objectContaining({ name: 'DataError' }));
    db.close();
    await espera();
  });
});

describe('sense IndexedDB', () => {
  test('en memòria: funciona igual i declara persistent=false', async () => {
    const magatzem = crea({ idb: null });
    expect(magatzem.persistent).toBe(false);
    expect(await magatzem.prepara()).toBe(false);
    await magatzem.desaTots('tiquets', [tiquet('t-1'), tiquet('t-2', { tornId: 'torn-2' })]);
    expect((await magatzem.perIndex('tiquets', 'tornId', 'torn-2')).map((t) => t.id)).toEqual(['t-2']);
    expect(await magatzem.actualitza('tiquets', 't-1', (a) => ({ ...a, total: 1 }))).toMatchObject({ total: 1 });
    const llegit = await magatzem.obte('tiquets', 't-1');
    llegit.total = 99;
    expect((await magatzem.obte('tiquets', 't-1')).total).toBe(1);
    await magatzem.esborra('tiquets', 't-2');
    expect(await magatzem.bolca()).toEqual({ tiquets: [tiquet('t-1', { total: 1 })], meta: [] });
    await magatzem.buidaTot();
    expect(await magatzem.totes('tiquets')).toEqual([]);
  });

  test('en memòria, el mateix ordre que IndexedDB: per la clau, nombres abans que textos', async () => {
    const magatzem = crea({ idb: null });
    await magatzem.desaTots('tiquets', [tiquet('t-2'), tiquet(10), tiquet('t-1'), tiquet(2)]);
    expect((await magatzem.totes('tiquets')).map((t) => t.id)).toEqual([2, 10, 't-1', 't-2']);
    expect((await magatzem.perIndex('tiquets', 'tornId', 'torn-1')).map((t) => t.id)).toEqual([2, 10, 't-1', 't-2']);
    expect((await magatzem.bolca()).tiquets.map((t) => t.id)).toEqual([2, 10, 't-1', 't-2']);
  });

  test('si el navegador no deixa obrir-lo, passa a memòria, ho avisa i no perd el que s’ha desat', async () => {
    const magatzem = crea({ idb: creaIdbFals({ fallaObrir: true }).idb });
    const avisos = [];
    magatzem.subscriu((avis) => avisos.push(avis));
    expect(magatzem.persistent).toBe(true);
    await magatzem.desa('tiquets', tiquet('t-1'));
    expect(magatzem.persistent).toBe(false);
    expect((await magatzem.totes('tiquets')).map((t) => t.id)).toEqual(['t-1']);
    await espera();
    expect(avisos).toContainEqual({ tipus: 'persistent', persistent: false });
  });
});

describe('persistència del navegador', () => {
  test('demanaPersistencia i estatPersistencia amb StorageManager', async () => {
    const navegador = {
      storage: {
        persist: async () => true,
        persisted: async () => false,
        estimate: async () => ({ usage: 2048, quota: 1048576 })
      }
    };
    const magatzem = crea({ idb: creaIdbFals().idb, navegador });
    expect(await magatzem.demanaPersistencia()).toBe(true);
    expect(await magatzem.estatPersistencia()).toEqual({ persistent: true, duradora: false, usat: 2048, quota: 1048576, mode: 'lliure' });
  });

  test('sense StorageManager: null, i un persist que falla és false', async () => {
    const magatzem = crea({ idb: null });
    expect(await magatzem.demanaPersistencia()).toBeNull();
    expect(await magatzem.estatPersistencia()).toEqual({ persistent: false, duradora: null, usat: null, quota: null, mode: 'lliure' });
    const ambError = crea({ idb: null, navegador: { storage: { persist: async () => { throw new Error('no'); } } } });
    expect(await ambError.demanaPersistencia()).toBe(false);
  });
});

describe('una sola pestanya escriu', () => {
  test('la primera escriu; la segona llig, ho diu, i agafa el relleu quan la primera es tanca', async () => {
    const fals = creaIdbFals();
    const navegador = { locks: creaLocksFals() };
    const a = crea({ idb: fals.idb, navegador });
    const b = crea({ idb: fals.idb, navegador });
    const avisosB = [];
    b.subscriu((avis) => avisosB.push(avis));
    expect(await a.obtinBloqueig()).toBe('escriptora');
    expect(await b.obtinBloqueig()).toBe('lectora');
    expect(b.mode).toBe('lectora');
    await expect(b.desa('tiquets', tiquet('t-1'))).rejects.toMatchObject({ codi: 'NOMES_LECTURA' });
    await expect(b.buidaTot()).rejects.toMatchObject({ codi: 'NOMES_LECTURA' });
    expect(await b.totes('tiquets')).toEqual([]);
    await a.desa('tiquets', tiquet('t-1'));

    a.tanca();
    await espera();
    expect(b.mode).toBe('escriptora');
    expect(avisosB).toContainEqual({ tipus: 'mode', mode: 'escriptora' });
    await b.desa('tiquets', tiquet('t-2'));
    expect((await b.totes('tiquets')).map((t) => t.id)).toEqual(['t-1', 't-2']);
    expect(await b.obtinBloqueig()).toBe('escriptora');
    b.tanca();
  });

  test('una lectora que torna a demanar el bloqueig no espera dues vegades', async () => {
    const navegador = { locks: creaLocksFals() };
    const a = crea({ idb: null, navegador });
    const b = crea({ idb: null, navegador });
    await a.obtinBloqueig();
    expect(await b.obtinBloqueig()).toBe('lectora');
    expect(await b.obtinBloqueig()).toBe('lectora');
    a.tanca();
    await espera();
    expect(b.mode).toBe('escriptora');
    b.tanca();
    expect(b.mode).toBe('lliure');
  });

  test('tanca() just després d’obtinBloqueig() no deixa el bloqueig retingut (StrictMode)', async () => {
    const navegador = { locks: creaLocksFals() };
    const a = crea({ idb: null, navegador });
    const pendent = a.obtinBloqueig();
    a.tanca();
    expect(await pendent).toBe('lliure');
    await espera();
    expect(a.mode).toBe('lliure');
    const b = crea({ idb: null, navegador });
    expect(await b.obtinBloqueig()).toBe('escriptora');
    b.tanca();
  });

  test('una lectora tancada abans de saber-ho no es queda a la cua del relleu', async () => {
    const navegador = { locks: creaLocksFals() };
    const a = crea({ idb: null, navegador });
    const b = crea({ idb: null, navegador });
    expect(await a.obtinBloqueig()).toBe('escriptora');
    const pendent = b.obtinBloqueig();
    b.tanca();
    expect(await pendent).toBe('lliure');
    a.tanca();
    await espera();
    expect(b.mode).toBe('lliure');
    const c = crea({ idb: null, navegador });
    expect(await c.obtinBloqueig()).toBe('escriptora');
    c.tanca();
  });

  test('un relleu concedit però encara no lliurat a una pestanya ja tancada s’allibera', async () => {
    const navegador = { locks: creaLocksFals() };
    const a = crea({ idb: null, navegador });
    const b = crea({ idb: null, navegador });
    await a.obtinBloqueig();
    expect(await b.obtinBloqueig()).toBe('lectora');
    a.tanca();
    /* Este temporitzador es programa abans que el del callback de b: quan
       vença, el bloqueig ja és de b (l'abort ja no el trau de la cua), però
       el seu callback encara no s'ha executat. */
    await espera(0);
    b.tanca();
    await espera();
    expect(b.mode).toBe('lliure');
    const c = crea({ idb: null, navegador });
    expect(await c.obtinBloqueig()).toBe('escriptora');
    c.tanca();
  });

  test('sense Web Locks, o si fallen, la pestanya escriu', async () => {
    expect(await crea({ idb: null }).obtinBloqueig()).toBe('escriptora');
    const ambError = crea({ idb: null, navegador: { locks: { request: () => Promise.reject(new Error('SecurityError')) } } });
    expect(await ambError.obtinBloqueig()).toBe('escriptora');
  });
});

describe('avís de canvis entre pestanyes', () => {
  test('qui escriu avisa en local; les altres reben l’avís sense cap valor ni clau', async () => {
    const fals = creaIdbFals();
    const { Canal, enviats } = creaCanalFals();
    const a = crea({ idb: fals.idb, Canal });
    const b = crea({ idb: fals.idb, Canal });
    const avisosA = [];
    const avisosB = [];
    a.subscriu((avis) => avisosA.push(avis));
    const desfes = b.subscriu((avis) => avisosB.push(avis));
    await a.desa('tiquets', tiquet('t-1', { total: 4321 }));
    await espera();
    expect(avisosA).toEqual([{ tipus: 'canvi', store: 'tiquets', local: true }]);
    expect(avisosB).toEqual([{ tipus: 'canvi', store: 'tiquets', local: false }]);
    expect(enviats).toEqual([{ nom: 'sdp-magatzem:sdp-prova', data: { tipus: 'canvi', store: 'tiquets' } }]);
    expect(JSON.stringify(enviats)).not.toMatch(/t-1|4321/);
    desfes();
    await a.desa('meta', { clau: 'a', valor: 'x' });
    await espera();
    expect(avisosB).toHaveLength(1);
    a.tanca();
    b.tanca();
  });

  test('un missatge d’un store desconegut o d’un altre tipus no s’avisa', async () => {
    const { Canal } = creaCanalFals();
    const b = crea({ idb: null, Canal });
    const avisos = [];
    b.subscriu((avis) => avisos.push(avis));
    const intrus = new Canal('sdp-magatzem:sdp-prova');
    intrus.postMessage({ tipus: 'canvi', store: 'altre' });
    intrus.postMessage({ tipus: 'esborra-ho-tot', store: 'tiquets' });
    await espera();
    expect(avisos).toEqual([]);
    b.tanca();
  });
});
