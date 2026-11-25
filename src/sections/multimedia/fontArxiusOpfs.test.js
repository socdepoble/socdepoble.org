// @vitest-environment node
import { test, expect, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
import { CarpetaFalsa, bytesWebpFals } from '../../../tests/helpers/carpetaLocalFalsa.js';
import { creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { creaFontArxiusOpfs, CARPETA_OPFS, NOM_BD_OPFS, creaSelectorFitxersOpfs } from './fontArxiusOpfs.js';
const fitxer = (name, text = 'hola') => ({ name, size: new TextEncoder().encode(text).length, arrayBuffer: async () => new TextEncoder().encode(text).buffer });
const locksProva = creaLocksFals();
const prepara = (o = {}) => creaFontArxiusOpfs({ idb: creaIdbFalsEstructurat(), storage: null, locks: locksProva, ...o });
const text = async (font, ruta) => new TextDecoder().decode(await font.llig(ruta));

test('IndexedDB persistent: importa, reobri, edita, mou, reanomena, miniatures i oblit reutilitzen el motor', async () => {
  const idb = creaIdbFalsEstructurat();
  const volum = await prepara({ idb });
  expect(volum.tipus).toBe('indexeddb');
  expect(await volum.importaFitxers([fitxer('nota.txt')])).toEqual({ tipus: 'indexeddb', importats: ['nota.txt'] });
  const reobert = await prepara({ idb });
  expect(await text(reobert.font, 'nota.txt')).toBe('hola');
  await reobert.font.escriu('nota.txt', new TextEncoder().encode('canvi'), { sobreescriu: true });
  await reobert.font.creaCarpeta('carpeta');
  await reobert.font.mou('nota.txt', 'carpeta/nota.txt');
  expect(await text(reobert.font, 'carpeta/nota.txt')).toBe('canvi');
  expect(await reobert.font.fitxer('carpeta/nota.txt')).toBeInstanceOf(Blob);
  await reobert.font.elimina('carpeta/nota.txt');
  expect(await reobert.font.llista()).toEqual([]);
  reobert.oblida();
  await expect(reobert.font.llista()).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
});

test('OPFS real per contracte: sonda retirada, importació i lectura sense IndexedDB', async () => {
  const root = new CarpetaFalsa('opfs', {});
  const v = await prepara({ idb: null, storage: { getDirectory: async () => root, estimate: async () => ({ quota: 10000, usage: 0 }) } });
  expect(v.tipus).toBe('opfs');
  await v.importaFitxers([fitxer('a.txt')]);
  expect(await text(v.font, 'a.txt')).toBe('hola');
  const dir = await root.getDirectoryHandle(CARPETA_OPFS);
  const noms = []; for await (const [nom] of dir.entries()) noms.push(nom);
  expect(noms).toEqual(['a.txt']);
});

test('[DEFECTE] una font oblidada no importa, ni confirma un fitxer pendent ni deixa treballs en cua actius', async () => {
  const root = new CarpetaFalsa('opfs', {});
  const storage = { getDirectory: async () => root };
  const tancat = await prepara({ idb: null, storage });
  tancat.oblida();
  await expect(tancat.importaFitxers([fitxer('oblidat.txt')])).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  const v = await prepara({ idb: null, storage });
  let allibera, llegint;
  const lectura = new Promise((resolve) => { llegint = resolve; });
  const pendent = v.importaFitxers([{ name: 'pendent.txt', size: 4, arrayBuffer: () => { llegint(); return new Promise((resolve) => { allibera = resolve; }); } }]);
  const enCua = v.importaFitxers([fitxer('en-cua.txt')]);
  // Instal·lar les observacions abans d'alliberar evita rebutjos no gestionats.
  const rebutjat = expect(pendent).rejects.toMatchObject({ codi: 'FONT_OBLIDADA', detall: { importats: [], fallit: 'pendent.txt' } });
  const cuaRebutjada = expect(enCua).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  await lectura; v.oblida(); allibera(new TextEncoder().encode('hola').buffer);
  await rebutjat; await cuaRebutjada;
  const reobert = await prepara({ idb: null, storage });
  expect(await reobert.font.llista()).toEqual([]);
  const idb = await prepara(); idb.oblida();
  await expect(idb.importaFitxers([fitxer('idb-oblidat.txt')])).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
});

test('[DEFECTE] OPFS sensible a majúscules no crea noms equivalents en lots diferents ni carpetes paral·leles', async () => {
  const root = new CarpetaFalsa('opfs', {});
  const storage = { getDirectory: async () => root };
  const v = await prepara({ idb: null, storage });
  await v.importaFitxers([fitxer('Nota.txt')]);
  await expect(v.importaFitxers([fitxer('nota.txt')])).rejects.toMatchObject({ codi: 'FITXER_JA_EXISTEIX' });
  await v.importaFitxers([{ ...fitxer('a.txt'), webkitRelativePath: 'Fotos/a.txt' }]);
  await expect(v.importaFitxers([{ ...fitxer('b.txt'), webkitRelativePath: 'fotos/b.txt' }])).rejects.toMatchObject({ codi: 'RUTA_INVALIDA' });
  expect((await v.font.llista()).map((e) => e.ruta).sort()).toEqual(['Fotos/a.txt', 'Nota.txt']);
  const reobert = await prepara({ idb: null, storage });
  await expect(reobert.importaFitxers([fitxer('NOTA.txt')])).rejects.toMatchObject({ codi: 'FITXER_JA_EXISTEIX' });
});

test('OPFS no disponible o sense createWritable: fallback persistent, mai memòria volàtil', async () => {
  const storage = { getDirectory: async () => { throw new DOMException('private', 'SecurityError'); } };
  expect((await prepara({ storage })).tipus).toBe('indexeddb');
  await expect(prepara({ idb: null, storage })).rejects.toMatchObject({ codi: 'FONT_ILLEGIBLE' });
});

test('rutes tramposes, noms equivalents i excés de mida es refusen abans de crear còpies', async () => {
  const v = await prepara({ maxBytesFitxer: 5, maxBytesImportacio: 6 });
  await expect(v.importaFitxers([fitxer('../fora.txt')])).rejects.toMatchObject({ codi: 'RUTA_INVALIDA' });
  await expect(v.importaFitxers([fitxer('a.txt'), fitxer('A.txt')])).rejects.toMatchObject({ codi: 'RUTA_INVALIDA' });
  await expect(v.importaFitxers([fitxer('a.txt', 'massa llarg')])).rejects.toMatchObject({ codi: 'FITXER_MASSA_GRAN' });
  await expect(v.importaFitxers([fitxer('a.txt'), fitxer('b.txt')])).rejects.toMatchObject({ codi: 'FITXER_MASSA_GRAN' });
  expect(await v.font.llista()).toEqual([]);
});

test('quota estimada i quota al commit: no es proclama èxit ni es perden dades prèvies', async () => {
  const idb = creaIdbFalsEstructurat();
  const v = await prepara({ idb });
  await v.importaFitxers([fitxer('a.txt')]);
  idb.omplit = true;
  await expect(v.importaFitxers([fitxer('b.txt')])).rejects.toMatchObject({ codi: 'SENSE_ESPAI', detall: { importats: [], fallit: 'b.txt' } });
  expect(await text(v.font, 'a.txt')).toBe('hola');
  expect(idb.files(NOM_BD_OPFS, 'entrades').map((r) => r.valor.nom)).toEqual(['a.txt']);
  const q = await prepara({ storage: { estimate: async () => ({ quota: 5, usage: 4 }) } });
  await expect(q.importaFitxers([fitxer('c.txt')])).rejects.toMatchObject({ codi: 'SENSE_ESPAI' });
});

test('no sobreescriu importacions; l’error declara les còpies parcials', async () => {
  const v = await prepara();
  await v.importaFitxers([fitxer('a.txt')]);
  await expect(v.importaFitxers([fitxer('b.txt'), fitxer('a.txt', 'nou')])).rejects.toMatchObject({ codi: 'FITXER_JA_EXISTEIX', detall: { importats: ['b.txt'], fallit: 'a.txt' } });
  expect(await text(v.font, 'a.txt')).toBe('hola');
});

test('input de fitxers múltiples: canvi consumit, errors enviats al consumidor', async () => {
  const listeners = {};
  const input = { files: [fitxer('a.txt')], value: 'seleccio', addEventListener: (e, fn) => { listeners[e] = fn; } };
  const enError = vi.fn(); const enSeleccionar = vi.fn(async () => { throw new Error('x'); });
  expect(creaSelectorFitxersOpfs({ documentImpl: { createElement: () => input }, enSeleccionar, enError })).toBe(input);
  expect(input).toMatchObject({ type: 'file', multiple: true });
  listeners.change(); await new Promise((r) => setTimeout(r, 0));
  expect(input.value).toBe(''); expect(enSeleccionar).toHaveBeenCalledOnce(); expect(enError).toHaveBeenCalledOnce();
});

function locksObservables(base = creaLocksFals()) {
  const events = [];
  const manager = label => ({
    request(name, options, fn) {
      events.push({ event: 'request', label, name, mode: options.mode });
      return base.request(name, options, async lock => {
        events.push({ event: 'enter', label, name, mode: options.mode });
        try { return await fn(lock); }
        finally { events.push({ event: 'leave', label, name, mode: options.mode }); }
      });
    }
  });
  return { events, manager };
}
const ajornada = () => { let resolve, reject; const promise = new Promise((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; };

test('C6a dos volums OPFS: importació i tots cinc mutadors comparteixen un pany sense intercalació', async () => {
  const shared = locksObservables();
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root };
  const a = await prepara({ storage, idb: null, locks: shared.manager('a') });
  const b = await prepara({ storage, idb: null, locks: shared.manager('b') });
  await a.importaFitxers([fitxer('edita.txt')]);
  shared.events.length = 0;
  const lectura = ajornada(), release = ajornada();
  const importing = a.importaFitxers([{ name: 'lent.txt', size: 4, arrayBuffer: async () => { lectura.resolve(); return release.promise; } }]);
  await lectura.promise;
  const mutations = [
    b.font.escriu('edita.txt', new TextEncoder().encode('nou'), { sobreescriu: true }),
    b.font.mou('edita.txt', 'mogut.txt'),
    b.font.reanomena('mogut.txt', 'renomenat.txt'),
    b.font.creaCarpeta('carpeta'),
    b.font.elimina('renomenat.txt')
  ];
  expect(shared.events.filter(e => e.event === 'request' && e.label === 'b')).toHaveLength(5);
  expect(shared.events.filter(e => e.event === 'enter' && e.label === 'b')).toHaveLength(0);
  release.resolve(new TextEncoder().encode('hola').buffer);
  await importing; await Promise.all(mutations);
  const entered = shared.events.filter(e => e.event === 'enter');
  expect(new Set(entered.map(e => e.name)).size).toBe(1);
  expect(entered.every(e => e.mode === 'exclusive')).toBe(true);
  expect(entered.map(e => e.label)).toEqual(['a', 'b', 'b', 'b', 'b', 'b']);
  let held = 0;
  for (const e of shared.events) {
    if (e.event === 'enter') { held++; expect(held).toBe(1); }
    if (e.event === 'leave') held--;
  }
  expect(held).toBe(0);
  expect((await b.font.llista()).map(e => e.ruta)).toEqual(['lent.txt']);
  expect(a.font.handle).toBeNull(); expect(b.font.handle).toBeNull();
});

test('C6a dos volums IndexedDB: importa mateix nom, col·lisió i edició amb expectativa no es xafen', async () => {
  const idb = creaIdbFalsEstructurat(), shared = locksObservables();
  const a = await prepara({ idb, locks: shared.manager('a') });
  const b = await prepara({ idb: idb.pestanya(), locks: shared.manager('b') });
  const resultats = await Promise.allSettled([a.importaFitxers([fitxer('mateix.txt', 'primer')]), b.importaFitxers([fitxer('mateix.txt', 'segon')])]);
  expect(resultats.map(r => r.status)).toEqual(['fulfilled', 'rejected']);
  expect(resultats[1].reason.codi).toBe('FITXER_JA_EXISTEIX');
  expect(await text(a.font, 'mateix.txt')).toBe('primer');
  const versio = await a.font.info('mateix.txt');
  const opcions = { sobreescriu: true, modificatEsperat: versio.modificat, midaEsperada: versio.mida };
  const edits = await Promise.allSettled([b.escriuText('mateix.txt', 'més nou', opcions), a.escriuText('mateix.txt', 'obsolet', opcions)]);
  expect(edits.map(r => r.status)).toEqual(['fulfilled', 'rejected']);
  expect(edits[1].reason.codi).toBe('CONFLICTE_DISC');
  expect((await a.llegixText('mateix.txt')).text).toBe('més nou');
});

test('C6a els helpers compostos conserven el motor canònic dins d’un únic pany, inclòs WebP i moviment original', async () => {
  const shared = locksObservables(), v = await prepara({ locks: shared.manager('v') });
  await v.importaFitxers([fitxer('foto.jpg', 'original')]);
  shared.events.length = 0;
  const resultat = await v.desaWebpIMouOriginal('foto.jpg', bytesWebpFals());
  expect(resultat.webp.ruta).toBe('foto.webp');
  expect(resultat.original.ruta).toBe('originals_raster_public/foto.jpg');
  expect(shared.events.filter(e => e.event === 'enter')).toEqual([
    expect.objectContaining({ label: 'v', mode: 'exclusive', name: v.bloqueig.clau })
  ]);
  expect(await text(v.font, 'originals_raster_public/foto.jpg')).toBe('original');
  expect((await v.font.llista()).map(e => e.ruta).sort()).toEqual(['foto.webp', 'originals_raster_public/foto.jpg']);
  const markdown = await v.creaFitxerMarkdown({ nom: 'lectura', contingut: '# Poble\n' });
  expect((await v.llegixText(markdown.ruta)).text).toBe('# Poble\n');
  await v.desaWebp('segona.webp', bytesWebpFals());
  expect((await v.font.info('segona.webp')).mida).toBe(bytesWebpFals().length);
});

test('C6a l’error allibera el pany i l’oblit cancel·la només el volum que espera', async () => {
  const shared = locksObservables(), idb = creaIdbFalsEstructurat();
  const a = await prepara({ idb, locks: shared.manager('a') });
  const b = await prepara({ idb: idb.pestanya(), locks: shared.manager('b') });
  await expect(a.importaFitxers([fitxer('../error.txt')])).rejects.toMatchObject({ codi: 'RUTA_INVALIDA' });
  await b.importaFitxers([fitxer('despres-error.txt')]);
  const lectura = ajornada(), release = ajornada();
  const held = a.importaFitxers([{ name: 'actiu.txt', size: 4, arrayBuffer: async () => { lectura.resolve(); return release.promise; } }]);
  await lectura.promise;
  const pending = b.font.escriu('despres-error.txt', new TextEncoder().encode('no'), { sobreescriu: true });
  const refused = expect(pending).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  expect(b.oblida()).toBe(true); expect(b.oblida()).toBe(false); await refused;
  release.resolve(new TextEncoder().encode('hola').buffer); await held;
  expect(await text(a.font, 'despres-error.txt')).toBe('hola');
  await a.font.creaCarpeta('encara-actiu');
});

test('C6a sense Web Locks: lectura determinista i refús explícit de qualsevol mutació sense tocar dades', async () => {
  const idb = creaIdbFalsEstructurat();
  const writer = await prepara({ idb }); await writer.importaFitxers([fitxer('existent.txt')]);
  const readonly = await prepara({ idb: idb.pestanya(), locks: null });
  expect(readonly.bloqueig.mode).toBe('nomes-lectura'); expect(readonly.font.potEscriure).toBe(false);
  expect(await text(readonly.font, 'existent.txt')).toBe('hola');
  for (const f of [
    () => readonly.importaFitxers([fitxer('nou.txt')]),
    () => readonly.font.escriu('existent.txt', new TextEncoder().encode('no'), { sobreescriu: true }),
    () => readonly.font.mou('existent.txt', 'mogut.txt'), () => readonly.font.reanomena('existent.txt', 'altre.txt'),
    () => readonly.font.creaCarpeta('nova'), () => readonly.font.elimina('existent.txt'),
    () => readonly.escriuText('existent.txt', 'no', { sobreescriu: true }),
    () => readonly.creaFitxerMarkdown({ nom: 'nota' }), () => readonly.desaWebp('a.webp', new Uint8Array()),
    () => readonly.desaWebpIMouOriginal('a.jpg', new Uint8Array())
  ]) await expect(f()).rejects.toMatchObject({ codi: 'ESCRIPTURA_DENEGADA', detall: { motiu: 'SENSE_WEB_LOCKS' } });
  expect(await text(writer.font, 'existent.txt')).toBe('hola');
  expect((await writer.font.llista()).map(e => e.ruta)).toEqual(['existent.txt']);
  const deniedApi = await prepara({ idb: idb.pestanya(), locks: { request: async () => { throw new DOMException('bloquejat', 'SecurityError'); } } });
  expect(deniedApi.bloqueig.mode).toBe('nomes-lectura');
  expect(await text(deniedApi.font, 'existent.txt')).toBe('hola');
});

test('C6a OPFS sense pany no crea sondes ni muta la carpeta existent', async () => {
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root };
  const writer = await prepara({ storage, idb: null }); await writer.importaFitxers([fitxer('existent.txt')]);
  root.registre.length = 0;
  const readonly = await prepara({ storage, idb: null, locks: null });
  expect(readonly.tipus).toBe('opfs'); expect(await text(readonly.font, 'existent.txt')).toBe('hola');
  await expect(readonly.importaFitxers([fitxer('nou.txt')])).rejects.toMatchObject({ codi: 'ESCRIPTURA_DENEGADA' });
  expect(root.registre.some(e => ['createWritable', 'write', 'escriu', 'removeEntry'].includes(e[0]))).toBe(false);
  expect(root.registre.filter(e => e[0] === 'getDirectoryHandle').every(e => e[2]?.create !== true)).toBe(true);
});

test('[DEFECTE C6a] pany OPFS refusat conserva lectura de les còpies existents, sense canviar a IDB buit', async () => {
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root };
  const writer = await prepara({ storage, idb: null }); await writer.importaFitxers([fitxer('existent.txt')]);
  for (const idb of [null, creaIdbFalsEstructurat()]) {
    root.registre.length = 0;
    const locks = { request: async () => { throw new DOMException('denegat', 'SecurityError'); } };
    const reader = await prepara({ storage, idb, locks });
    expect(reader.tipus).toBe('opfs'); expect(reader.bloqueig.mode).toBe('nomes-lectura');
    expect(await text(reader.font, 'existent.txt')).toBe('hola');
    expect(root.registre.some(e => ['createWritable', 'write', 'escriu', 'removeEntry'].includes(e[0]))).toBe(false);
    await expect(reader.font.elimina('existent.txt')).rejects.toMatchObject({ codi: 'ESCRIPTURA_DENEGADA' });
  }
});

test('[DEFECTE C6a] oblit mentre write està pendent avorta abans close i conserva els bytes anteriors', async () => {
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root };
  const v = await prepara({ storage, idb: null }); await v.importaFitxers([fitxer('nota.txt', 'abans')]);
  const leaf = await (await root.getDirectoryHandle(CARPETA_OPFS)).getFileHandle('nota.txt');
  const create = leaf.createWritable.bind(leaf), entered = ajornada(), release = ajornada(); let closed = 0;
  leaf.createWritable = async () => {
    const writer = await create();
    return { ...writer,
      write: async data => { await writer.write(data); entered.resolve(); await release.promise; },
      close: async () => { closed++; await writer.close(); }
    };
  };
  const pending = v.font.escriu('nota.txt', new TextEncoder().encode('despres'), { sobreescriu: true });
  const refused = expect(pending).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  await entered.promise; v.oblida(); release.resolve(); await refused;
  expect(closed).toBe(0); expect(leaf.avortat).toBe(true);
  const reader = await prepara({ storage, idb: null }); expect(await text(reader.font, 'nota.txt')).toBe('abans');
});

test('C6a close ja enviat durant oblit informa el commit real, sense fals avortament', async () => {
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root };
  const v = await prepara({ storage, idb: null }); await v.importaFitxers([fitxer('nota.txt', 'abans')]);
  const leaf = await (await root.getDirectoryHandle(CARPETA_OPFS)).getFileHandle('nota.txt');
  const create = leaf.createWritable.bind(leaf), entered = ajornada(), release = ajornada();
  leaf.createWritable = async () => {
    const writer = await create();
    return { ...writer, close: async () => { entered.resolve(); await release.promise; await writer.close(); } };
  };
  const pending = v.escriuText('nota.txt', 'despres', { sobreescriu: true });
  const reported = expect(pending).rejects.toMatchObject({ codi: 'OPERACIO_PARCIAL_CONFIRMADA', detall: {
    motiu: 'FONT_OBLIDADA_DESPRES_COMMIT', commits: [{ operacio: 'tanca-escriptura', ruta: 'nota.txt' }]
  } });
  await entered.promise; v.oblida(); release.resolve(); await reported;
  const reader = await prepara({ storage, idb: null }); expect(await text(reader.font, 'nota.txt')).toBe('despres');
});

test('C6a denegació posterior del LockManager apaga mutacions i conserva lectura, sense fallback a RAM', async () => {
  const base = creaLocksFals(), idb = creaIdbFalsEstructurat(); let denega = false;
  const locks = { request: (...args) => denega ? Promise.reject(new DOMException('denegat', 'SecurityError')) : base.request(...args) };
  const v = await prepara({ idb, locks }); await v.importaFitxers([fitxer('guardat.txt')]);
  denega = true;
  await expect(v.font.escriu('guardat.txt', new TextEncoder().encode('no'), { sobreescriu: true })).rejects.toMatchObject({ codi: 'ESCRIPTURA_DENEGADA', detall: { motiu: 'WEB_LOCK_REFUSAT' } });
  expect(v.font.potEscriure).toBe(false); expect(v.bloqueig.mode).toBe('nomes-lectura');
  expect(await text(v.font, 'guardat.txt')).toBe('hola');
  await expect(v.font.elimina('guardat.txt')).rejects.toMatchObject({ codi: 'ESCRIPTURA_DENEGADA', detall: { motiu: 'SENSE_WEB_LOCKS' } });
});

test('C6a els volums IndexedDB diferents tenen claus distintes; OPFS compartix clau encara que canvie nomBd', async () => {
  const shared = locksObservables(), idb = creaIdbFalsEstructurat();
  const a = await prepara({ idb, nomBd: 'volum-a', locks: shared.manager('a') });
  const b = await prepara({ idb, nomBd: 'volum-b', locks: shared.manager('b') });
  expect(a.bloqueig.clau).not.toBe(b.bloqueig.clau);
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root };
  const x = await prepara({ storage, idb: null, nomBd: 'a', locks: shared.manager('x') });
  const y = await prepara({ storage, idb: null, nomBd: 'b', locks: shared.manager('y') });
  expect(x.bloqueig.clau).toBe(y.bloqueig.clau);
});

test('C6a LockManager natiu de Node: dues façanes realment esperen el mateix pany', async (t) => {
  const { locks } = await import('node:worker_threads');
  if (!locks?.request) { t.skip('LockManager natiu no disponible en esta versió de Node.'); return; }
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root };
  const a = await prepara({ storage, idb: null, locks }); const b = await prepara({ storage, idb: null, locks });
  const lectura = ajornada(), release = ajornada();
  const first = a.importaFitxers([{ name: 'natiu.txt', size: 4, arrayBuffer: async () => { lectura.resolve(); return release.promise; } }]);
  await lectura.promise;
  const second = b.font.escriu('natiu.txt', new TextEncoder().encode('despres'), { sobreescriu: true });
  const snapshot = await locks.query();
  expect(snapshot.held.some(l => l.name === a.bloqueig.clau)).toBe(true);
  expect(snapshot.pending.some(l => l.name === a.bloqueig.clau)).toBe(true);
  release.resolve(new TextEncoder().encode('hola').buffer); await first; await second;
  expect(await text(a.font, 'natiu.txt')).toBe('despres');
});

const AMBIT_A = Object.freeze({ usuariId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', tenantId: '11111111-1111-4111-8111-111111111111' });
const AMBIT_B = Object.freeze({ ...AMBIT_A, usuariId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' });
function sessio(ambit = AMBIT_A) {
  const controller = new AbortController(); let vigent = true;
  return { controller, opcions: { ambit, comprovaAmbit: () => vigent, senyal: controller.signal, cripto: webcrypto },
    revoca() { vigent = false; controller.abort(); }, canvia() { vigent = false; }, reactiva() { vigent = true; }
  };
}
const perCompte = (s, opts = {}) => prepara({ ...s.opcions, ...opts });
const carpetaDeVolum = (root, v) => root.getDirectoryHandle(v.bloqueig.clau.split(':opfs:')[1]);
const digestAjornat = () => {
  const entered = ajornada(), release = ajornada(); let primer = true;
  return { entered, release, cripto: { subtle: { digest: async (...args) => {
    if (primer) { primer = false; entered.resolve(); await release.promise; }
    return webcrypto.subtle.digest(...args);
  } } } };
};
function observaSenyal(signal) {
  const listeners = new Set(), add = signal.addEventListener.bind(signal), remove = signal.removeEventListener.bind(signal);
  signal.addEventListener = (type, fn, opts) => { if (type === 'abort') listeners.add(fn); return add(type, fn, opts); };
  signal.removeEventListener = (type, fn, opts) => { if (type === 'abort') listeners.delete(fn); return remove(type, fn, opts); };
  return listeners;
}

test('C9 sense àmbit conserva mode, noms i panys globals sense requerir cripto', async () => {
  const idb = creaIdbFalsEstructurat(), v = await prepara({ idb, cripto: null });
  expect(v.modeAmbit).toBe('global'); expect([...idb.bases.keys()]).toEqual([NOM_BD_OPFS]);
  expect(v.bloqueig.clau).toBe(`sdp:multimedia-privada:v1:indexeddb:${NOM_BD_OPFS}`);
  const root = new CarpetaFalsa('opfs', {}), o = await prepara({ storage: { getDirectory: async () => root }, idb: null, cripto: null });
  expect(o.bloqueig.clau).toBe(`sdp:multimedia-privada:v1:opfs:${CARPETA_OPFS}`);
  expect((await root.getDirectoryHandle(CARPETA_OPFS)).kind).toBe('directory');
});

test('C9 refusa àmbits invàlids i contractes incomplets abans de tocar cap backend', async () => {
  const s = sessio(), storage = { getDirectory: vi.fn() }, idb = { open: vi.fn() }, locks = { request: vi.fn() };
  for (const ambit of [null, {}, [], { usuariId: 'x' }, { ...AMBIT_A, extra: true }, { ...AMBIT_A, usuariId: '' }, { ...AMBIT_A, tenantId: ' x' }, { ...AMBIT_A, tenantId: 'e\u0301' }, { ...AMBIT_A, tenantId: 'a\u202eb' }, { ...AMBIT_A, usuariId: 'à'.repeat(129) }]) {
    await expect(prepara({ ...s.opcions, ambit, storage, idb, locks })).rejects.toMatchObject({ codi: 'PARAMETRES_INVALIDS' });
  }
  for (const extra of [{ comprovaAmbit: undefined }, { senyal: undefined }, { senyal: {} }]) {
    await expect(perCompte(s, { ...extra, storage, idb, locks })).rejects.toMatchObject({ codi: 'PARAMETRES_INVALIDS' });
  }
  expect(storage.getDirectory).not.toHaveBeenCalled(); expect(idb.open).not.toHaveBeenCalled(); expect(locks.request).not.toHaveBeenCalled();
});

test('C9 guardes false i Promise refusen i consumeixen el rebuig sense accés a dades', async () => {
  const storage = { getDirectory: vi.fn() }, idb = { open: vi.fn() }, locks = { request: vi.fn() };
  for (const comprovaAmbit of [() => false, async () => true, async () => { throw new Error('revocada'); }]) {
    const s = sessio();
    await expect(perCompte(s, { comprovaAmbit, storage, idb, locks })).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  }
  expect(storage.getDirectory).not.toHaveBeenCalled(); expect(idb.open).not.toHaveBeenCalled(); expect(locks.request).not.toHaveBeenCalled();
});

test('C9 senyal ja avortat refusa abans de cripto, pany, sonda o DB', async () => {
  const s = sessio(); s.revoca(); const digest = vi.fn(), storage = { getDirectory: vi.fn() }, idb = { open: vi.fn() }, locks = { request: vi.fn() };
  await expect(perCompte(s, { cripto: { subtle: { digest } }, storage, idb, locks })).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  for (const fn of [digest, storage.getDirectory, idb.open, locks.request]) expect(fn).not.toHaveBeenCalled();
});

test('C9 OPFS separa dos comptes i reobri les còpies pròpies amb noms sense IDs', async () => {
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root };
  const a = await perCompte(sessio(), { storage, idb: null }), b = await perCompte(sessio(AMBIT_B), { storage, idb: null });
  await a.importaFitxers([fitxer('mateix.txt', 'compte A')]); await b.importaFitxers([fitxer('mateix.txt', 'compte B')]);
  expect(await text(a.font, 'mateix.txt')).toBe('compte A'); expect(await text(b.font, 'mateix.txt')).toBe('compte B');
  expect(a.modeAmbit).toBe('compte'); expect(a.bloqueig.clau).not.toBe(b.bloqueig.clau);
  const noms = []; for await (const [nom] of root.entries()) noms.push(nom);
  expect(noms).toHaveLength(2); expect(noms.every(n => /^sdp-multimedia-v1-a1-[a-f0-9]{64}$/.test(n))).toBe(true);
  expect(noms.join()).not.toContain(AMBIT_A.usuariId); expect(noms.join()).not.toContain(AMBIT_A.tenantId);
  const reobert = await perCompte(sessio(), { storage, idb: null }); expect(await text(reobert.font, 'mateix.txt')).toBe('compte A');
});

test('C9 IndexedDB separa dues factories i no posa compte, tenant o nomBd personalitzat en clar', async () => {
  const idb = creaIdbFalsEstructurat(), nomBd = 'correu-personal@example.invalid';
  const a = await perCompte(sessio(), { idb, nomBd }), b = await perCompte(sessio(AMBIT_B), { idb: idb.pestanya(), nomBd });
  await a.importaFitxers([fitxer('mateix.txt', 'A')]); await b.importaFitxers([fitxer('mateix.txt', 'B')]);
  expect(await text(a.font, 'mateix.txt')).toBe('A'); expect(await text(b.font, 'mateix.txt')).toBe('B');
  const noms = [...idb.bases.keys()]; expect(noms).toHaveLength(2);
  expect(noms.every(n => /^socdepoble_multimedia_privada_v1-a1-[a-f0-9]{64}$/.test(n))).toBe(true);
  for (const valor of [AMBIT_A.usuariId, AMBIT_A.tenantId, nomBd]) expect(noms.join()).not.toContain(valor);
});

test('C9 un mateix compte en dos tenants té volums separats en ambdós backends', async () => {
  const altre = { ...AMBIT_A, tenantId: '22222222-2222-4222-8222-222222222222' };
  for (const tipus of ['indexeddb', 'opfs']) {
    const root = new CarpetaFalsa('opfs', {}), idb = creaIdbFalsEstructurat(), storage = tipus === 'opfs' ? { getDirectory: async () => root } : null;
    const a = await perCompte(sessio(), { storage, idb }), b = await perCompte(sessio(altre), { storage, idb });
    expect(a.tipus).toBe(tipus); expect(b.tipus).toBe(tipus);
    await a.importaFitxers([fitxer('privat.txt')]); expect(await b.font.llista()).toEqual([]);
    expect(a.bloqueig.clau).not.toBe(b.bloqueig.clau);
  }
});

test('C9 mateix àmbit determina el pany; nomBd només separa les bases IndexedDB', async () => {
  const idb = creaIdbFalsEstructurat();
  const a = await perCompte(sessio(), { idb, nomBd: 'a' }), b = await perCompte(sessio({ tenantId: AMBIT_A.tenantId, usuariId: AMBIT_A.usuariId }), { idb, nomBd: 'a' });
  expect(a.bloqueig.clau).toBe(b.bloqueig.clau);
  const c = await perCompte(sessio(), { idb, nomBd: 'b' }); expect(c.bloqueig.clau).not.toBe(a.bloqueig.clau);
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root };
  const x = await perCompte(sessio(), { storage, nomBd: 'a' }), y = await perCompte(sessio(), { storage, nomBd: 'b' });
  expect(x.bloqueig.clau).toBe(y.bloqueig.clau);
});

test('C9 els IDs mutats pel caller després del primer await no canvien el namespace capturat', async () => {
  const ambit = { ...AMBIT_A }, s = sessio(ambit), delayed = digestAjornat(), idb = creaIdbFalsEstructurat();
  const pending = perCompte(s, { idb, cripto: delayed.cripto }); await delayed.entered.promise;
  ambit.usuariId = AMBIT_B.usuariId; delayed.release.resolve(); const v = await pending;
  const a = await perCompte(sessio(), { idb }), b = await perCompte(sessio(AMBIT_B), { idb });
  expect(v.bloqueig.clau).toBe(a.bloqueig.clau); expect(v.bloqueig.clau).not.toBe(b.bloqueig.clau);
});

test('C9 cripto absent o error refusa explícitament sense degradar a dades globals', async () => {
  const storage = { getDirectory: vi.fn() }, idb = { open: vi.fn() };
  for (const cripto of [null, { subtle: { digest: async () => { throw new Error('cripto no disponible'); } } }]) {
    await expect(perCompte(sessio(), { cripto, storage, idb })).rejects.toMatchObject({ codi: 'FONT_ILLEGIBLE' });
  }
  expect(storage.getDirectory).not.toHaveBeenCalled(); expect(idb.open).not.toHaveBeenCalled();
});

test('C9 revocació durant digest és terminal abans de qualsevol inicialització', async () => {
  const s = sessio(), delayed = digestAjornat(), storage = { getDirectory: vi.fn() }, idb = { open: vi.fn() };
  const pending = perCompte(s, { cripto: delayed.cripto, storage, idb });
  const refused = expect(pending).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  await delayed.entered.promise; s.revoca(); delayed.release.resolve(); await refused;
  expect(storage.getDirectory).not.toHaveBeenCalled(); expect(idb.open).not.toHaveBeenCalled();
});

test('C9 revocació mentre espera el pany inicial cancel·la la cua sense obrir Storage', async () => {
  const base = creaLocksFals(), root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: vi.fn(async () => root) };
  const initial = await perCompte(sessio(), { storage, locks: base }); storage.getDirectory.mockClear();
  const entered = ajornada(), release = ajornada(), requested = ajornada();
  const held = base.request(initial.bloqueig.clau, { mode: 'exclusive' }, async () => { entered.resolve(); await release.promise; });
  await entered.promise;
  const locks = { request: (...args) => { requested.resolve(); return base.request(...args); } }, s = sessio();
  const pending = perCompte(s, { storage, locks }), refused = expect(pending).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  await requested.promise; s.revoca(); await refused; release.resolve(); await held;
  expect(storage.getDirectory).not.toHaveBeenCalled();
});

test('C9 revocació durant getDirectory no crea carpetes ni obri el fallback IDB', async () => {
  const s = sessio(), root = new CarpetaFalsa('opfs', {}), entered = ajornada(), release = ajornada(), idb = { open: vi.fn() };
  const storage = { getDirectory: async () => { entered.resolve(); await release.promise; return root; } };
  const pending = perCompte(s, { storage, idb }), refused = expect(pending).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  await entered.promise; s.revoca(); release.resolve(); await refused;
  expect(root.registre).toEqual([]); expect(idb.open).not.toHaveBeenCalled();
});

test('C9 revocació en preparar la sonda avorta el writer abans de close i només neteja la sonda pròpia', async () => {
  const root = new CarpetaFalsa('opfs', {}), s = sessio(), entered = ajornada(), release = ajornada(); let closed = 0, aborted = 0;
  const getDir = root.getDirectoryHandle.bind(root);
  root.getDirectoryHandle = async (...args) => {
    const dir = await getDir(...args), getFile = dir.getFileHandle.bind(dir);
    dir.getFileHandle = async (...values) => {
      const leaf = await getFile(...values);
      if (values[0].startsWith('.sdp-sonda-')) {
        const create = leaf.createWritable.bind(leaf);
        leaf.createWritable = async () => { const writer = await create(); entered.resolve(); await release.promise; return {
          ...writer, close: async () => { closed++; await writer.close(); }, abort: async () => { aborted++; await writer.abort(); }
        }; };
      }
      return leaf;
    };
    return dir;
  };
  const pending = perCompte(s, { storage: { getDirectory: async () => root }, idb: null }), refused = expect(pending).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  await entered.promise; s.revoca(); release.resolve(); await refused;
  expect(closed).toBe(0); expect(aborted).toBe(1);
  const dirs = []; for await (const [, dir] of root.entries()) dirs.push(dir);
  for (const dir of dirs) { const files = []; for await (const [name] of dir.entries()) files.push(name); expect(files).toEqual([]); }
});

test('C9 open IDB tardà després de revocar es tanca i no executa cap upgrade nou', async () => {
  const s = sessio(), entered = ajornada(), close = vi.fn(), createObjectStore = vi.fn(), abort = vi.fn();
  const request = { result: { close, createObjectStore }, transaction: { abort } };
  const idb = { open: () => { entered.resolve(); return request; } };
  const pending = perCompte(s, { idb }), refused = expect(pending).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  await entered.promise; s.revoca(); await refused;
  request.onupgradeneeded(); request.onsuccess();
  expect(close).toHaveBeenCalledOnce(); expect(createObjectStore).not.toHaveBeenCalled(); expect(abort).toHaveBeenCalled();
});

test('C9 IDB avorta abans de commit tant per senyal com per guarda canviada, sense persistir el text nou', async () => {
  for (const mode of ['signal', 'guarda']) {
    const s = sessio(); let armat = false;
    const idb = creaIdbFalsEstructurat({ clona: valor => {
      if (armat && valor?.versio === 2 && valor.blob instanceof Blob) { armat = false; setImmediate(() => mode === 'signal' ? s.revoca() : s.canvia()); }
      return structuredClone(valor);
    } });
    const v = await perCompte(s, { idb }); await v.importaFitxers([fitxer('nota.txt', 'abans')]); armat = true;
    await expect(v.font.escriu('nota.txt', new TextEncoder().encode('despres'), { sobreescriu: true })).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
    const reobert = await perCompte(sessio(), { idb }); expect(await text(reobert.font, 'nota.txt')).toBe('abans');
  }
});

test('C9 revocació durant importació neteja només el fitxer pendent en OPFS i IDB; altre compte continua actiu', async () => {
  for (const tipus of ['opfs', 'indexeddb']) {
    const root = new CarpetaFalsa('opfs', {}), storage = tipus === 'opfs' ? { getDirectory: async () => root } : null;
    const idb = creaIdbFalsEstructurat(), s = sessio();
    const a = await perCompte(s, { storage, idb }), b = await perCompte(sessio(AMBIT_B), { storage, idb });
    await a.importaFitxers([fitxer('previ.txt')]);
    const entered = ajornada(), release = ajornada();
    const pending = a.importaFitxers([{ name: 'pendent.txt', size: 4, arrayBuffer: async () => { entered.resolve(); return release.promise; } }]);
    const refused = expect(pending).rejects.toMatchObject({ codi: 'FONT_OBLIDADA', detall: { importats: [], fallit: 'pendent.txt' } });
    await entered.promise;
    const queued = a.font.creaCarpeta('en-cua'), noQueue = expect(queued).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
    s.revoca(); release.resolve(new TextEncoder().encode('hola').buffer); await refused; await noQueue;
    await b.importaFitxers([fitxer('pendent.txt', 'compte B')]);
    const reobert = await perCompte(sessio(), { storage, idb }); expect((await reobert.font.llista()).map(e => e.ruta)).toEqual(['previ.txt']);
    expect(await text(b.font, 'pendent.txt')).toBe('compte B');
  }
});

test('C9 write OPFS pendent revocat no crida close ni modifica els bytes anteriors', async () => {
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root }, s = sessio(), v = await perCompte(s, { storage });
  await v.importaFitxers([fitxer('nota.txt', 'abans')]);
  const leaf = await (await carpetaDeVolum(root, v)).getFileHandle('nota.txt'), create = leaf.createWritable.bind(leaf), entered = ajornada(), release = ajornada(); let closed = 0;
  leaf.createWritable = async () => { const writer = await create(); return { ...writer,
    write: async data => { await writer.write(data); entered.resolve(); await release.promise; },
    close: async () => { closed++; await writer.close(); }
  }; };
  const pending = v.escriuText('nota.txt', 'despres', { sobreescriu: true }), refused = expect(pending).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  await entered.promise; s.revoca(); release.resolve(); await refused; expect(closed).toBe(0);
  const a = await perCompte(sessio(), { storage }); expect(await text(a.font, 'nota.txt')).toBe('abans');
});

test('C9 close OPFS ja enviat durant revocació conserva el rebut real i l’aïllament de l’altre compte', async () => {
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root }, s = sessio();
  const a = await perCompte(s, { storage }), b = await perCompte(sessio(AMBIT_B), { storage });
  await a.importaFitxers([fitxer('nota.txt', 'abans')]); await b.importaFitxers([fitxer('nota.txt', 'B')]);
  const leaf = await (await carpetaDeVolum(root, a)).getFileHandle('nota.txt'), create = leaf.createWritable.bind(leaf), entered = ajornada(), release = ajornada();
  leaf.createWritable = async () => { const writer = await create(); return { ...writer, close: async () => { entered.resolve(); await release.promise; await writer.close(); } }; };
  const pending = a.escriuText('nota.txt', 'despres', { sobreescriu: true }), reported = expect(pending).rejects.toMatchObject({ codi: 'OPERACIO_PARCIAL_CONFIRMADA', detall: { commits: [{ operacio: 'tanca-escriptura', ruta: 'nota.txt' }] } });
  await entered.promise; s.revoca(); release.resolve(); await reported;
  const reobert = await perCompte(sessio(), { storage }); expect(await text(reobert.font, 'nota.txt')).toBe('despres'); expect(await text(b.font, 'nota.txt')).toBe('B');
});

test('C9 obrir/importar en àmbit no enumera ni copia ni esborra les dades globals', async () => {
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root };
  const global = await prepara({ storage }); await global.importaFitxers([fitxer('global.txt', 'legacy')]); root.registre.length = 0;
  const a = await perCompte(sessio(), { storage }); await a.importaFitxers([fitxer('privat.txt')]);
  expect((await a.font.llista()).map(e => e.ruta)).toEqual(['privat.txt']);
  expect(root.registre.filter(e => e[0] === 'getDirectoryHandle').every(e => e[1] !== CARPETA_OPFS)).toBe(true);
  expect(root.registre.filter(e => e[0] === 'removeEntry').every(e => !e.slice(1).some(v => v === `${CARPETA_OPFS}/global.txt`))).toBe(true);
  expect(await text(global.font, 'global.txt')).toBe('legacy');
  const idb = creaIdbFalsEstructurat(), g = await prepara({ idb }); await g.importaFitxers([fitxer('global.txt')]);
  const scoped = await perCompte(sessio(), { idb }); expect(await scoped.font.llista()).toEqual([]); expect(await text(g.font, 'global.txt')).toBe('hola');
});

test('C9 sense Web Locks o amb denegació inicial només llig el namespace propi', async () => {
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root };
  const a = await perCompte(sessio(), { storage }); await a.importaFitxers([fitxer('a.txt')]);
  for (const locks of [null, { request: async () => { throw new DOMException('denegat', 'SecurityError'); } }]) {
    const v = await perCompte(sessio(), { storage, locks, idb: null });
    expect(v.modeAmbit).toBe('compte'); expect(v.font.potEscriure).toBe(false); expect(await text(v.font, 'a.txt')).toBe('hola');
    await expect(v.importaFitxers([fitxer('no.txt')])).rejects.toMatchObject({ codi: 'ESCRIPTURA_DENEGADA' });
  }
  const b = await perCompte(sessio(AMBIT_B), { storage, locks: null }); expect(await b.font.llista()).toEqual([]); expect(b.tipus).toBe('indexeddb');
});

test('C9 revocació és terminal, una nova sessió reutilitza namespace i els listeners es retiren', async () => {
  const s = sessio(), listeners = observaSenyal(s.controller.signal), idb = creaIdbFalsEstructurat();
  const a = await perCompte(s, { idb }); expect(listeners.size).toBe(1); await a.importaFitxers([fitxer('nota.txt')]);
  s.revoca(); expect(listeners.size).toBe(0); s.reactiva(); expect(a.font.potEscriure).toBe(false);
  await expect(a.font.llista()).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' }); expect(a.oblida()).toBe(false);
  const next = sessio(), nextListeners = observaSenyal(next.controller.signal), b = await perCompte(next, { idb });
  expect(b.bloqueig.clau).toBe(a.bloqueig.clau); expect(await text(b.font, 'nota.txt')).toBe('hola');
  expect(b.oblida()).toBe(true); expect(b.oblida()).toBe(false); expect(nextListeners.size).toBe(0);
  const failed = sessio(), failedListeners = observaSenyal(failed.controller.signal);
  await expect(perCompte(failed, { cripto: null })).rejects.toMatchObject({ codi: 'FONT_ILLEGIBLE' }); expect(failedListeners.size).toBe(0);
});

test('C9 lectura de Blob pendent després de revocar no lliura dades al caller', async () => {
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root }, s = sessio(), a = await perCompte(s, { storage });
  await a.importaFitxers([fitxer('nota.txt')]);
  const leaf = await (await carpetaDeVolum(root, a)).getFileHandle('nota.txt'), getFile = leaf.getFile.bind(leaf), entered = ajornada(), release = ajornada();
  leaf.getFile = async () => { const file = await getFile(); entered.resolve(); await release.promise; return file; };
  const pending = a.font.fitxer('nota.txt'), refused = expect(pending).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  await entered.promise; s.revoca(); release.resolve(); await refused; expect(a.font.potEscriure).toBe(false);
});

test('C9 dues sessions del mateix compte esperen el mateix pany mentre l’altre compte continua operant', async () => {
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root }, locks = creaLocksFals();
  const a = await perCompte(sessio(), { storage, locks }), entered = ajornada(), release = ajornada();
  const importing = a.importaFitxers([{ name: 'lent.txt', size: 4, arrayBuffer: async () => { entered.resolve(); return release.promise; } }]);
  await entered.promise;
  let reobert = false;
  const next = perCompte(sessio(), { storage, locks }).then(v => { reobert = true; return v; });
  const b = await perCompte(sessio(AMBIT_B), { storage, locks }); await b.importaFitxers([fitxer('b.txt')]);
  expect(reobert).toBe(false); expect(b.bloqueig.clau).not.toBe(a.bloqueig.clau);
  release.resolve(new TextEncoder().encode('hola').buffer); await importing;
  const same = await next; expect(same.bloqueig.clau).toBe(a.bloqueig.clau); expect(await text(same.font, 'lent.txt')).toBe('hola');
  expect((await b.font.llista()).map(e => e.ruta)).toEqual(['b.txt']);
});

test('[DEFECTE C9] getters de carpetes/limitacions revaliden abans de lliurar metadades; nom públic estable sense IDs', async () => {
  for (const primer of ['carpetes', 'limitacions']) {
    const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root }, s = sessio(), v = await perCompte(s, { storage });
    await v.font.creaCarpeta('carpeta-del-compte-A');
    const child = await (await carpetaDeVolum(root, v)).getDirectoryHandle('carpeta-del-compte-A'); child.fallaRecorregut = true;
    await v.font.llista();
    const carpetesAbans = v.font.carpetes, limitacionsAbans = v.font.limitacions, nom = v.font.nom;
    expect(carpetesAbans.length).toBeGreaterThan(0); expect(limitacionsAbans.length).toBeGreaterThan(0);
    s.canvia(); expect(s.controller.signal.aborted).toBe(false);
    expect(v.font[primer]).toEqual([]);
    expect(v.font.carpetes).toEqual([]); expect(v.font.limitacions).toEqual([]);
    expect(Object.isFrozen(v.font.carpetes)).toBe(true); expect(Object.isFrozen(v.font.limitacions)).toBe(true);
    s.reactiva(); expect(v.font.carpetes).toEqual([]); expect(v.font.limitacions).toEqual([]);
    expect(v.font.nom).toBe(nom); expect(nom).not.toContain(AMBIT_A.usuariId); expect(nom).not.toContain(AMBIT_A.tenantId);
    // No es promet retirar arrays lliurats mentre la sessió encara era vigent.
    expect(carpetesAbans.length).toBeGreaterThan(0); expect(limitacionsAbans.length).toBeGreaterThan(0);
  }
});

test('[DEFECTE C9] importació amb close ja confirmat informa el commit si falla la neteja després de revocar', async () => {
  for (const fallaNeteja of ['no', 'abans', 'despres']) {
    const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root }, s = sessio();
    const global = await prepara({ storage }); await global.importaFitxers([fitxer('pendent.txt', 'global intacte')]);
    const a = await perCompte(s, { storage }), dir = await carpetaDeVolum(root, a), get = dir.getFileHandle.bind(dir), remove = dir.removeEntry.bind(dir);
    const entered = ajornada(), release = ajornada();
    dir.getFileHandle = async (...args) => {
      const leaf = await get(...args);
      if (args[0] === 'pendent.txt') {
        const create = leaf.createWritable.bind(leaf);
        leaf.createWritable = async () => { const writer = await create(); return { ...writer, close: async () => { entered.resolve(); await release.promise; await writer.close(); } }; };
      }
      return leaf;
    };
    dir.removeEntry = async (...args) => {
      if (fallaNeteja === 'abans' && args[0] === 'pendent.txt') throw new DOMException('I/O de prova', 'NotAllowedError');
      const resultat = await remove(...args);
      if (fallaNeteja === 'despres' && args[0] === 'pendent.txt') throw new DOMException('I/O després d’esborrar', 'NotAllowedError');
      return resultat;
    };
    const pending = a.importaFitxers([fitxer('pendent.txt')]);
    const observed = pending.then(() => null, e => e);
    await entered.promise; s.revoca(); release.resolve(); const cause = await observed;
    expect(cause.detall).toMatchObject({ importats: [], fallit: 'pendent.txt' });
    if (fallaNeteja !== 'no') {
      expect(cause).toMatchObject({ codi: 'OPERACIO_PARCIAL_CONFIRMADA', detall: {
        commitConfirmat: true, commits: [{ operacio: 'tanca-escriptura', ruta: 'pendent.txt' }],
        netejaFallida: { ruta: 'pendent.txt', codi: 'NotAllowedError', presencia: 'desconeguda' }
      } });
      if (fallaNeteja === 'abans') expect(await (await (await get('pendent.txt')).getFile()).text()).toBe('hola');
      else await expect(get('pendent.txt')).rejects.toMatchObject({ name: 'NotFoundError' });
    } else {
      expect(cause.codi).toBe('FONT_OBLIDADA'); await expect(get('pendent.txt')).rejects.toMatchObject({ name: 'NotFoundError' });
    }
    expect(await text(global.font, 'pendent.txt')).toBe('global intacte');
  }
});

test('C9 neteja fallida abans de close declara l’entrada pendent sense inventar un commit de contingut', async () => {
  const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root }, s = sessio(), a = await perCompte(s, { storage });
  const dir = await carpetaDeVolum(root, a), remove = dir.removeEntry.bind(dir), entered = ajornada(), release = ajornada();
  dir.removeEntry = async (...args) => { if (args[0] === 'pendent.txt') throw new DOMException('I/O de prova', 'NotAllowedError'); return remove(...args); };
  const pending = a.importaFitxers([{ name: 'pendent.txt', size: 4, arrayBuffer: async () => { entered.resolve(); return release.promise; } }]);
  const observed = pending.then(() => null, e => e);
  await entered.promise; s.revoca(); release.resolve(new TextEncoder().encode('hola').buffer); const cause = await observed;
  expect(cause).toMatchObject({ codi: 'FONT_OBLIDADA', detall: { importats: [], fallit: 'pendent.txt', commitConfirmat: false, estatCommit: 'no_iniciat',
    netejaFallida: { ruta: 'pendent.txt', codi: 'NotAllowedError', presencia: 'desconeguda' } } });
  expect((await (await dir.getFileHandle('pendent.txt')).getFile()).size).toBe(0);
});

test('C9 IDB neteja pendent fallida també conserva el rebut d’error i no declara absència', async () => {
  const idb = creaIdbFalsEstructurat(), s = sessio(), a = await perCompte(s, { idb }), entered = ajornada(), release = ajornada();
  const pending = a.importaFitxers([{ name: 'pendent.txt', size: 4, arrayBuffer: async () => { entered.resolve(); return release.promise; } }]);
  const observed = pending.then(() => null, e => e);
  await entered.promise; s.revoca(); idb.errorsEnTransaccio.push(new DOMException('I/O en neteja', 'UnknownError')); release.resolve(new TextEncoder().encode('hola').buffer);
  const cause = await observed;
  expect(cause).toMatchObject({ codi: 'FONT_OBLIDADA', detall: { importats: [], fallit: 'pendent.txt', commitConfirmat: false, estatCommit: 'no_iniciat',
    netejaFallida: { ruta: 'pendent.txt', codi: 'UnknownError', presencia: 'desconeguda' } } });
  const reobert = await perCompte(sessio(), { idb }); expect((await reobert.font.info('pendent.txt')).mida).toBe(0);
});

test('[DEFECTE C9] await d’importació rebutjat observa la guarda false i revoca terminalment en OPFS i IDB', async () => {
  for (const tipus of ['opfs', 'indexeddb']) {
    const root = new CarpetaFalsa('opfs', {}), storage = tipus === 'opfs' ? { getDirectory: async () => root } : null, idb = creaIdbFalsEstructurat();
    const s = sessio(), guarda = vi.fn(s.opcions.comprovaAmbit), a = await perCompte(s, { storage, idb, comprovaAmbit: guarda }), entered = ajornada(), release = ajornada();
    const pending = a.importaFitxers([{ name: 'fallit.txt', size: 4, arrayBuffer: async () => { entered.resolve(); return release.promise; } }]);
    const observed = pending.then(() => null, e => e);
    await entered.promise; s.canvia(); release.reject(new DOMException('Lectura fallida', 'NotReadableError')); const cause = await observed;
    expect(cause).toMatchObject({ codi: 'FONT_OBLIDADA', detall: { importats: [], fallit: 'fallit.txt' }, cause: { codi: 'ESCRIPTURA_FALLIDA', cause: { name: 'NotReadableError' } } });
    expect(guarda.mock.results.some(r => r.value === false)).toBe(true); expect(s.controller.signal.aborted).toBe(false);
    s.reactiva(); await expect(a.font.llista()).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
    const reobert = await perCompte(sessio(), { storage, idb }); expect(await reobert.font.llista()).toEqual([]);
  }
});

test('[DEFECTE C9] lectures rebutjades revaliden també la branca readonly sense Web Locks', async () => {
  for (const readonly of [false, true]) {
    const root = new CarpetaFalsa('opfs', {}), storage = { getDirectory: async () => root }, locks = creaLocksFals();
    const writer = await perCompte(sessio(), { storage, locks }); await writer.importaFitxers([fitxer('nota.txt')]);
    const s = sessio(), a = await perCompte(s, { storage, locks: readonly ? null : locks });
    const leaf = await (await carpetaDeVolum(root, a)).getFileHandle('nota.txt'), entered = ajornada(), release = ajornada(); let accessos = 0;
    leaf.getFile = async () => { accessos++; entered.resolve(); return release.promise; };
    const pending = a.font.fitxer('nota.txt'), observed = pending.then(() => null, e => e);
    await entered.promise; s.canvia(); release.reject(new DOMException('Lectura fallida', 'NotReadableError'));
    expect(await observed).toMatchObject({ codi: 'FONT_OBLIDADA', cause: { codi: 'FITXER_ILLEGIBLE' } });
    s.reactiva(); await expect(a.font.fitxer('nota.txt')).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' }); expect(accessos).toBe(1);
  }
});
