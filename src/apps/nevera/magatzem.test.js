// @vitest-environment node
/* La Nevera de Casa · el magatzem local amb el navegador fals de P2
   (IndexedDB, Web Locks i BroadcastChannel fets a mà, sense dependències). */
import { afterEach, describe, expect, test } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { CLAU_ESTAT, NOM_BASE, STORE, creaMagatzemNevera } from './magatzem.js';
import { afig, creaLlista, estatInicial, marcaACasa } from './nucli/index.js';

const oberts = [];
afterEach(() => {
  while (oberts.length) oberts.pop().tanca();
});

/* Un «navegador» compartit per diverses pestanyes d'una prova. */
function navegador() {
  const idb = creaIdbFals();
  const locks = creaLocksFals();
  const canal = creaCanalFals();
  const pestanya = () => {
    const magatzem = creaMagatzemNevera({ idb: idb.idb, navegador: { locks }, Canal: canal.Canal });
    oberts.push(magatzem);
    return magatzem;
  };
  return { idb, canal, pestanya };
}

const espera = (ms = 5) => new Promise((resolve) => { setTimeout(resolve, ms); });

describe('llegir i desar', () => {
  test('el primer dia llig l’estat inicial; el que es desa es torna a llegir igual, en un sol registre', async () => {
    const { idb, pestanya } = navegador();
    const magatzem = pestanya();
    expect(await magatzem.llegix()).toEqual(estatInicial());
    const estat = marcaACasa(afig(creaLlista(estatInicial(), 'Mercat'), 'l-1', 'llet', { especificacio: 'sense lactosa' }), 'ous', 'acabat');
    const desat = await magatzem.desa(estat);
    expect(desat).toEqual(estat);
    expect(await magatzem.llegix()).toEqual(estat);
    expect(magatzem.persistent).toBe(true);
    const files = idb.files(NOM_BASE, STORE);
    expect(files).toHaveLength(1);
    expect(files[0].id).toBe(CLAU_ESTAT);
    expect(idb.registre.obertes).toBe(0);
  });

  test('la llista blanca: el que no és de l’estat no arriba mai al disc', async () => {
    const { idb, pestanya } = navegador();
    const magatzem = pestanya();
    await magatzem.desa({ ...estatInicial(), secret: 'no', llistes: [{ id: 'casa', nom: 'Casa', linies: [{ articleId: 'inventat' }], foto: 'x' }] });
    const [registre] = idb.files(NOM_BASE, STORE);
    expect(Object.keys(registre).sort()).toEqual(['casa', 'darreraLlista', 'esquema', 'id', 'llistes', 'propis', 'seq']);
    expect(registre.llistes[0].linies).toEqual([]);
    expect(Object.keys(registre.llistes[0])).not.toContain('foto');
  });

  test('un registre corrupte al disc es llig net', async () => {
    const { idb, pestanya } = navegador();
    const magatzem = pestanya();
    await magatzem.desa(estatInicial());
    idb.bases.get(NOM_BASE).stores.get(STORE).files.set(CLAU_ESTAT, { id: CLAU_ESTAT, llistes: 'trencat', seq: -4 });
    expect(await magatzem.llegix()).toEqual(estatInicial());
  });
});

describe('sense base local', () => {
  test('sense IndexedDB treballa en memòria i ho diu (persistent: false)', async () => {
    const magatzem = creaMagatzemNevera({ idb: null, navegador: {}, Canal: null });
    oberts.push(magatzem);
    expect(magatzem.persistent).toBe(false);
    const estat = afig(estatInicial(), 'casa', 'pa');
    await magatzem.desa(estat);
    expect(await magatzem.llegix()).toEqual(estat);
  });

  test('si el navegador no deixa obrir-la (navegació privada), passa a memòria i avisa', async () => {
    const idb = creaIdbFals({ fallaObrir: true });
    const magatzem = creaMagatzemNevera({ idb: idb.idb, navegador: {}, Canal: null });
    oberts.push(magatzem);
    const avisos = [];
    magatzem.subscriu((avis) => avisos.push(avis));
    expect(await magatzem.llegix()).toEqual(estatInicial());
    await espera();
    expect(magatzem.persistent).toBe(false);
    expect(avisos).toContainEqual({ tipus: 'persistent', persistent: false });
  });
});

describe('diverses pestanyes', () => {
  test('una escriu i l’altra llig: la lectora no pot desar i s’assabenta dels canvis (sense cap valor al canal)', async () => {
    const { canal, pestanya } = navegador();
    const a = pestanya();
    const b = pestanya();
    expect(await a.obtinBloqueig()).toBe('escriptora');
    expect(await b.obtinBloqueig()).toBe('lectora');
    await expect(b.desa(estatInicial())).rejects.toMatchObject({ codi: 'NOMES_LECTURA' });
    const avisos = [];
    b.subscriu((avis) => avisos.push(avis));
    await a.desa(afig(estatInicial(), 'casa', 'llet', { especificacio: 'sense lactosa' }));
    await espera();
    expect(avisos).toContainEqual({ tipus: 'canvi', store: STORE, local: false });
    expect(JSON.stringify(canal.enviats)).not.toMatch(/llet|lactosa|casa/);
    expect((await b.llegix()).llistes[0].linies).toEqual([{ articleId: 'llet', especificacio: 'sense lactosa' }]);
  });

  test('quan l’escriptora es tanca, la lectora agafa el relleu', async () => {
    const { pestanya } = navegador();
    const a = pestanya();
    const b = pestanya();
    await a.obtinBloqueig();
    await b.obtinBloqueig();
    const modes = [];
    b.subscriu((avis) => { if (avis.tipus === 'mode') modes.push(avis.mode); });
    a.tanca();
    await espera(20);
    expect(modes).toContain('escriptora');
    expect(b.mode).toBe('escriptora');
    await expect(b.desa(estatInicial())).resolves.toEqual(estatInicial());
  });
});
