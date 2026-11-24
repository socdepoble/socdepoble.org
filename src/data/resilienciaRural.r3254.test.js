import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaIdbCaosRural } from '../utils/__fixtures__/idbCaosRural.js';
import { creaLocksFals } from '../utils/__fixtures__/navegadorFals.js';

const state = vi.hoisted(() => ({ user: { id: 'rural-user' }, remote: vi.fn(), remoteEnabled: false }));
vi.mock('./identitat.js', () => ({ usuariDeSessio: () => state.user, getDefaultUserId: () => state.user.id,
  entradaSessio: () => 1, capturaSessio: () => () => {} }));
vi.mock('./backendPort.js', () => ({ teCapacitat: cap => state.remoteEnabled && cap === 'edicioEditorial',
  adminActualitzaPublicacioEditorial: (...args) => state.remote(...args) }));
const CONFIG = { dataMode: 'local', tenantId: '00000000-0000-4000-8000-000000000000' };
const CLAU = 'sdp_embed_publicacions.revisions.v1';
function netejaEditorial() {
  for (const key of Object.keys(localStorage)) if (key.startsWith('sdp_embed_publicacions.revisions')) localStorage.removeItem(key);
}
const quota = () => new DOMException('Disc ple', 'QuotaExceededError');
let net, disposa;
beforeEach(() => {
  vi.resetModules(); state.user = { id: 'rural-user' }; state.remoteEnabled = false; state.remote.mockReset();
  netejaEditorial(); disposa = [];
  net = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
});
afterEach(() => { disposa.forEach(fn => fn()); vi.restoreAllMocks(); vi.unstubAllGlobals(); netejaEditorial(); });

describe('R-RES-01 · Xat local, contracte explícitament efímer', () => {
  test('tall de xarxa: dos adaptadors del mateix realm reintenten el mateix id sense duplicar seq', async () => {
    const { createLocalXatAdapter } = await import('./localXat.js');
    const a = createLocalXatAdapter(), b = createLocalXatAdapter();
    const { filId } = await a.obriFilDePagina({ tipus: 'publicacio', id: 'rural-post', seccio: 'mur' }, CONFIG);
    const replies = await Promise.all(Array.from({ length: 12 }, (_, i) => (i % 2 ? a : b).enviaMissatge(filId, { id: 'retry-1', text: 'Bon dia' }, CONFIG)));
    expect(replies.every(row => row.id === 'retry-1' && row.seq === 1)).toBe(true);
    const rows = await b.loadMissatges(filId, CONFIG);
    expect(rows).toHaveLength(1); expect(rows[0].text).toBe('Bon dia');
    expect(net).not.toHaveBeenCalled();
  });
  test('pestanyes en realms separats no prometen persistència ni sincronització del Xat local', async () => {
    const a = (await import('./localXat.js')).createLocalXatAdapter();
    const { filId } = await a.obriFilDePagina({ tipus: 'publicacio', id: 'rural-post', seccio: 'mur' }, CONFIG);
    await a.enviaMissatge(filId, { id: 'm-1', text: 'Només esta sessió' }, CONFIG);
    vi.resetModules();
    const b = (await import('./localXat.js')).createLocalXatAdapter();
    expect(await b.loadFils(CONFIG)).toEqual([]);
    expect(await a.loadMissatges(filId, CONFIG)).toHaveLength(1);
    expect(net).not.toHaveBeenCalled();
  });
});

describe('R-RES-01 · Notes amb la persistència IndexedDB real de l’adaptador', () => {
  async function prepara() {
    const disk = creaIdbCaosRural(); vi.stubGlobal('indexedDB', disk.idb);
    const { createLocalNotesAdapter } = await import('./localNotes.js');
    return { disk, a: createLocalNotesAdapter(), b: createLocalNotesAdapter() };
  }
  test('quota durant update: rebutja, no incrementa revisió i el reintent conserva el text', async () => {
    const { a, b, disk } = await prepara();
    const first = await a.create({ id: 'rural-note', title: 'Original' }, CONFIG);
    disk.control.errorEscriptura = quota();
    await expect(a.update(first.id, { title: 'Recuperat' }, 0, CONFIG)).rejects.toMatchObject({ name: 'QuotaExceededError' });
    expect((await b.load(state.user.id, CONFIG)).notes[0]).toMatchObject({ title: 'Original', revision: 0 });
    disk.control.errorEscriptura = null;
    await expect(a.update(first.id, { title: 'Recuperat' }, 0, CONFIG)).resolves.toMatchObject({ title: 'Recuperat', revision: 1 });
    expect(disk.registre.obertes).toBe(0); expect(net).not.toHaveBeenCalled();
  });
  test('dues escriptures simultànies amb la mateixa revisió: un commit i un 409 sense pèrdua silenciosa', async () => {
    const { a, b, disk } = await prepara();
    await a.create({ id: 'rural-note', title: 'Original' }, CONFIG);
    const results = await Promise.allSettled([a.update('rural-note', { title: 'A' }, 0, CONFIG), b.update('rural-note', { title: 'B' }, 0, CONFIG)]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find(r => r.status === 'rejected').reason).toMatchObject({ status: 409 });
    expect((await b.load(state.user.id, CONFIG)).notes[0]).toMatchObject({ title: results.find(r => r.status === 'fulfilled').value.title, revision: 1 });
    expect(disk.registre.obertes).toBe(0);
  });
  test('corrupció parcial: aparta els registres invàlids sense esborrar-los ni ocultar la nota bona', async () => {
    const { a, disk } = await prepara();
    await a.create({ id: 'rural-note', title: 'Bona' }, CONFIG);
    const files = disk.bases.get('SdpLocalNotes').stores.get('notes').files;
    const [key, actual] = [...files][0];
    files.set(key, { ...actual, trencada: null, incompleta: { title: 'Sense id' }, llista: [] });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await a.load(state.user.id, CONFIG)).notes).toEqual([expect.objectContaining({ id: 'rural-note', title: 'Bona' })]);
    expect(disk.bases.get('SdpLocalNotes').stores.get('notes').files.get(key)).toHaveProperty('trencada', null);
    expect(files.get(key)).toHaveProperty('incompleta');
  });
  test('una carpeta corrupta no tomba les notes ni impedix crear-ne una altra; conserva el registre apartat', async () => {
    const { a, disk } = await prepara();
    await a.create({ id: 'rural-note', title: 'Bona' }, CONFIG);
    const folder = await a.createFolder({ nom: 'Bona' }, CONFIG);
    const files = disk.bases.get('SdpLocalNotes').stores.get('notes').files;
    const [key, value] = [...files].find(([key]) => key.endsWith(':carpetes'));
    files.set(key, { ...value, trencada: null, incompleta: { nom: 'Nova' } });
    expect((await a.load(state.user.id, CONFIG)).noteFolders).toContainEqual(folder);
    const next = await a.createFolder({ nom: 'Nova' }, CONFIG);
    expect(next).toMatchObject({ nom: 'Nova' });
    expect(files.get(key)).toHaveProperty('trencada', null);
  });
  test('getter IndexedDB bloquejat: error visible, cap fals rebut ni càrrega buida inventada', async () => {
    const { createLocalNotesAdapter } = await import('./localNotes.js');
    const error = new DOMException('Política de navegador', 'SecurityError');
    Object.defineProperty(globalThis, 'indexedDB', { configurable: true, get() { throw error; } });
    try { await expect(createLocalNotesAdapter().create({ title: 'No confirmada' }, CONFIG)).rejects.toBe(error); }
    finally { delete globalThis.indexedDB; }
  });
  test('onblocked seguit d’onsuccess tardà tanca la connexió rebutjada', async () => {
    let request, closed = 0;
    vi.stubGlobal('indexedDB', { open() { request = {}; queueMicrotask(() => request.onblocked()); return request; } });
    const { createLocalNotesAdapter } = await import('./localNotes.js');
    await expect(createLocalNotesAdapter().create({ title: 'Bloquejada' }, CONFIG)).rejects.toThrow(/altres pestanyes/);
    request.result = { close() { closed++; } }; request.onsuccess();
    expect(closed).toBe(1);
  });
});

describe('R-RES-01 · Revisions editorials, memòria i rebut durable diferents', () => {
  test('dos mòduls amb cache anterior als storage events no esborren les claus de l’altre', async () => {
    const a = await import('./revisionsEditorials.js'); vi.resetModules();
    const b = await import('./revisionsEditorials.js');
    a.revisioEditorial('mur', 'a'); b.revisioEditorial('events', 'b');
    expect(a.desaRevisioEditorial('mur', 'a', { title: 'A' })).toBe(true);
    expect(b.desaRevisioEditorial('events', 'b', { title: 'B' })).toBe(true);
    expect(JSON.parse(localStorage.getItem(CLAU))).toMatchObject({ 'mur:a': { camps: { title: 'A' } }, 'events:b': { camps: { title: 'B' } } });
  });
  test('API async: dos realms cooperen amb el mateix Web Lock i conserven camps disjunts del mateix element', async () => {
    const locks = creaLocksFals(); const request = vi.spyOn(locks, 'request'); vi.stubGlobal('navigator', { locks });
    const a = await import('./revisionsEditorials.js'); vi.resetModules(); const b = await import('./revisionsEditorials.js');
    a.revisioEditorial('mur', 'a'); b.revisioEditorial('mur', 'a');
    const replies = await Promise.all([
      a.desaRevisioEditorialAmbServidor('mur', { id: 'a' }, { title: 'A' }, { config: CONFIG }),
      b.desaRevisioEditorialAmbServidor('mur', { id: 'a' }, { lead: 'B' }, { config: CONFIG })
    ]);
    expect(replies.every(row => row.desada)).toBe(true);
    expect(JSON.parse(localStorage.getItem(CLAU))['mur:a'].camps).toEqual({ title: 'A', lead: 'B' });
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls.every(args => args[0] === 'sdp:publicacions.revisions.v1')).toBe(true);
  });
  test('getter Web Locks bloquejat per política: fallback local i quota continuen donant un rebut honest', async () => {
    vi.stubGlobal('navigator', { get locks() { throw new DOMException('Bloquejat', 'SecurityError'); } });
    const editorial = await import('./revisionsEditorials.js');
    expect(await editorial.desaRevisioEditorialAmbServidor('mur', { id: 'a' }, { title: 'Durable' }, { config: CONFIG })).toMatchObject({ desada: true });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw quota(); });
    expect(await editorial.desaRevisioEditorialAmbServidor('mur', { id: 'a' }, { title: 'En memòria' }, { config: CONFIG }))
      .toMatchObject({ desada: false, motiu: 'sense-persistencia' });
  });
  test('Web Locks request rebutjat abans del callback: fallback sense excepció ni doble mutació', async () => {
    const request = vi.fn().mockRejectedValue(new DOMException('Context no permés', 'SecurityError'));
    vi.stubGlobal('navigator', { locks: { request } });
    const editorial = await import('./revisionsEditorials.js');
    expect(await editorial.desaRevisioEditorialAmbServidor('mur', { id: 'a' }, { title: 'Durable' }, { config: CONFIG }))
      .toMatchObject({ desada: true });
    expect(request).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(CLAU))['mur:a'].camps).toEqual({ title: 'Durable' });
  });
  test('SecurityError dins del callback Web Locks no es reintenta: una sola mutació', async () => {
    vi.stubGlobal('navigator', { locks: { request: (_name, _opts, fn) => Promise.resolve().then(fn) } });
    const leaf = await import('./revisionsEditorialsDelNavegador.js');
    const error = new DOMException('Error de la mutació', 'SecurityError');
    const operation = vi.fn(() => { throw error; });
    await expect(leaf.ambPanyMapaRevisions(operation)).rejects.toBe(error);
    expect(operation).toHaveBeenCalledTimes(1);
  });
  test('un ACK remot tardà pren el pany, rellegix el disc i no esborra la revisió nova d’un altre realm', async () => {
    vi.stubGlobal('navigator', { locks: creaLocksFals() });
    const a = await import('./revisionsEditorials.js'); vi.resetModules(); const b = await import('./revisionsEditorials.js');
    let release;
    state.remoteEnabled = true;
    state.remote.mockImplementationOnce(() => new Promise(resolve => { release = resolve; })).mockResolvedValueOnce({ versio: 2 });
    const pending = a.desaRevisioEditorialAmbServidor('mur', { id: 'a', _editorialVersio: 1 }, { title: 'A' }, { config: { dataMode: 'remote' }, esSuperadmin: true });
    await vi.waitFor(() => expect(release).toEqual(expect.any(Function)));
    const second = await b.desaRevisioEditorialAmbServidor('mur', { id: 'b', _editorialVersio: 1 }, { title: 'B' }, { config: { dataMode: 'remote' }, esSuperadmin: true });
    expect(second.desti).toBe('servidor'); // the lock is not held across A's network wait
    release({ versio: 2 }); expect((await pending).desti).toBe('servidor');
    const stored = JSON.parse(localStorage.getItem(CLAU));
    expect(stored['mur:a'].camps.title).toBe('A'); expect(stored['mur:b'].camps.title).toBe('B');
  });
  test('quota i xarxa caiguda: conserva overlay en memòria i comunica sense-persistencia', async () => {
    const editorial = await import('./revisionsEditorials.js');
    state.remoteEnabled = true; state.remote.mockRejectedValue(Object.assign(new TypeError('Failed to fetch'), { code: 'no-disponible' }));
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw quota(); });
    const result = await editorial.desaRevisioEditorialAmbServidor('mur', { id: 'a', _editorialVersio: 1 }, { title: 'Text recuperable' }, { config: { dataMode: 'remote' }, esSuperadmin: true });
    expect(result).toMatchObject({ desada: false, desti: 'navegador', motiu: 'sense-persistencia' });
    expect(editorial.revisioEditorial('mur', 'a')).toMatchObject({ title: 'Text recuperable' });
    expect(editorial.avisDeLaRevisioEditorial(result)).toContain('Conserva o exporta');
    expect(state.remote).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(CLAU)).toBeNull();
  });
  test('getter localStorage bloquejat: resultat de memòria sense falsa confirmació', async () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Bloquejat', 'SecurityError'); } });
    try {
      const editorial = await import('./revisionsEditorials.js');
      expect(await editorial.desaRevisioEditorialAmbServidor('mur', { id: 'a' }, { title: 'Recuperable' }, { config: CONFIG }))
        .toMatchObject({ desada: false, motiu: 'sense-persistencia' });
      expect(editorial.revisioEditorial('mur', 'a')).toMatchObject({ title: 'Recuperable' });
    } finally { Object.defineProperty(window, 'localStorage', original); }
  });
  test('notificació storage amb quota no descarta el text recuperable que només viu en memòria', async () => {
    const editorial = await import('./revisionsEditorials.js'); disposa.push(editorial.subscriuRevisionsEditorials(() => {}));
    const setter = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw quota(); });
    expect(await editorial.desaRevisioEditorialAmbServidor('mur', { id: 'a' }, { title: 'Recuperable' }, { config: CONFIG }))
      .toMatchObject({ desada: false, motiu: 'sense-persistencia' });
    setter.mockRestore(); localStorage.setItem(CLAU, JSON.stringify({ 'mur:b': { camps: { title: 'B durable' } } }));
    window.dispatchEvent(new StorageEvent('storage', { key: CLAU }));
    expect(editorial.revisioEditorial('mur', 'a')).toEqual({ title: 'Recuperable' });
    expect(editorial.revisioEditorial('mur', 'b')).toEqual({ title: 'B durable' });
    expect(await editorial.desaRevisioEditorialAmbServidor('mur', { id: 'a' }, { lead: 'Reintent' }, { config: CONFIG })).toMatchObject({ desada: true });
    expect(JSON.parse(localStorage.getItem(CLAU))['mur:a'].camps).toEqual({ title: 'Recuperable', lead: 'Reintent' });
  });
  test('quota seguida d’una edició externa del mateix element només reaplica els camps locals explícits', async () => {
    const editorial = await import('./revisionsEditorials.js'); disposa.push(editorial.subscriuRevisionsEditorials(() => {}));
    editorial.desaRevisioEditorial('mur', 'a', { title: 'Original', lead: 'Antic' });
    const setter = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw quota(); });
    expect(await editorial.desaRevisioEditorialAmbServidor('mur', { id: 'a' }, { title: 'Recuperable' }, { config: CONFIG })).toMatchObject({ desada: false });
    setter.mockRestore();
    // L'altre realm usa el protocol actual; v1 és només el mirall de compatibilitat.
    vi.resetModules(); const externa = await import('./revisionsEditorials.js');
    externa.desaRevisioEditorial('mur', 'a', { lead: 'Nou extern' });
    window.dispatchEvent(new StorageEvent('storage', { key: CLAU }));
    expect(editorial.revisioEditorial('mur', 'a')).toEqual({ title: 'Recuperable', lead: 'Nou extern' });
    expect(await editorial.desaRevisioEditorialAmbServidor('mur', { id: 'a' }, { content: '<p>Reintent</p>' }, { config: CONFIG })).toMatchObject({ desada: true });
    expect(JSON.parse(localStorage.getItem(CLAU))['mur:a'].camps).toEqual({ title: 'Recuperable', lead: 'Nou extern', content: '<p>Reintent</p>' });
  });
  test('error de lectura amb escriptura disponible no sobreescriu un mapa desconegut ni dona rebut durable', async () => {
    const editorial = await import('./revisionsEditorials.js');
    editorial.desaRevisioEditorial('mur', 'old', { title: 'Antiga durable' });
    const originalGet = Storage.prototype.getItem;
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function(key) {
      if (key === CLAU) throw new DOMException('Lectura denegada', 'SecurityError');
      return originalGet.call(this, key);
    });
    expect(await editorial.desaRevisioEditorialAmbServidor('events', { id: 'new' }, { title: 'Recuperable' }, { config: CONFIG }))
      .toMatchObject({ desada: false, motiu: 'sense-persistencia' });
    expect(editorial.revisioEditorial('mur', 'old')).toEqual({ title: 'Antiga durable' });
    expect(editorial.revisioEditorial('events', 'new')).toEqual({ title: 'Recuperable' });
    get.mockRestore();
    expect(JSON.parse(localStorage.getItem(CLAU))).toEqual({ 'mur:old': expect.any(Object) });
    expect(await editorial.desaRevisioEditorialAmbServidor('events', { id: 'new' }, { lead: 'Reintent' }, { config: CONFIG })).toMatchObject({ desada: true });
    expect(JSON.parse(localStorage.getItem(CLAU))).toMatchObject({ 'mur:old': { camps: { title: 'Antiga durable' } }, 'events:new': { camps: { title: 'Recuperable', lead: 'Reintent' } } });
  });
  test('quota només en metadata ACK: un camp extern posterior preval sobre el snapshot antic confirmat', async () => {
    const a = await import('./revisionsEditorials.js');
    state.remoteEnabled = true; state.remote.mockResolvedValue({ versio: 2 });
    const originalSet = Storage.prototype.setItem;
    let refusosACK = 0;
    const setter = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function(key, value) {
      if (key.startsWith('sdp_embed_publicacions.revisions.ops.v1.') && JSON.parse(value).t === 'a') {
        refusosACK++; throw quota();
      }
      if (key === CLAU && JSON.parse(value)['mur:a']?.servidor) throw quota();
      return originalSet.call(this, key, value);
    });
    expect(await a.desaRevisioEditorialAmbServidor('mur', { id: 'a', _editorialVersio: 1 }, { title: 'A', lead: 'Antic' }, { config: { dataMode: 'remote' }, esSuperadmin: true }))
      .toMatchObject({ desada: true, desti: 'servidor', versio: 2 });
    expect(refusosACK).toBe(1);
    setter.mockRestore(); state.remoteEnabled = false;
    vi.resetModules(); const b = await import('./revisionsEditorials.js');
    await b.desaRevisioEditorialAmbServidor('mur', { id: 'a' }, { lead: 'Nou extern' }, { config: CONFIG });
    await a.desaRevisioEditorialAmbServidor('mur', { id: 'a' }, { content: '<p>Nou</p>' }, { config: CONFIG });
    expect(JSON.parse(localStorage.getItem(CLAU))['mur:a'].camps).toEqual({ title: 'A', lead: 'Nou extern', content: '<p>Nou</p>' });
  });
  test('JSON truncat i entrades parcials no tomben el lector; mai s’escriu automàticament en llegir', async () => {
    localStorage.setItem(CLAU, '{"mur:a":');
    const editorial = await import('./revisionsEditorials.js');
    disposa.push(editorial.subscriuRevisionsEditorials(() => {}));
    expect(editorial.revisioEditorial('mur', 'a')).toBeNull();
    expect(localStorage.getItem(CLAU)).toBe('{"mur:a":');
    localStorage.setItem(CLAU, JSON.stringify({ 'mur:bo': { camps: { title: 'Bo' } }, 'mur:mal': null, 'mur:parcial': { camps: { title: {} } } }));
    window.dispatchEvent(new StorageEvent('storage', { key: CLAU }));
    expect(editorial.revisioEditorial('mur', 'bo')).toEqual({ title: 'Bo' });
    expect(editorial.revisioEditorial('mur', 'mal')).toBeNull();
  });
  test('local quota seguida de confirmació remota: el rebut del servidor continua sent vàlid', async () => {
    const editorial = await import('./revisionsEditorials.js'); state.remoteEnabled = true;
    state.remote.mockResolvedValue({ versio: 2 });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw quota(); });
    expect(await editorial.desaRevisioEditorialAmbServidor('mur', { id: 'a', _editorialVersio: 1 }, { title: 'Al servidor' }, { config: { dataMode: 'remote' }, esSuperadmin: true }))
      .toMatchObject({ desada: true, desti: 'servidor', versio: 2 });
  });
  test('ACK parcial més quota no declara persistits els camps que només viuen al navegador', async () => {
    const editorial = await import('./revisionsEditorials.js'); state.remoteEnabled = true;
    state.remote.mockResolvedValue({ versio: 2 });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw quota(); });
    const result = await editorial.desaRevisioEditorialAmbServidor('mur', { id: 'a', _editorialVersio: 1 },
      { title: 'Confirmat remot', mostrarAlMur: false }, { config: { dataMode: 'remote' }, esSuperadmin: true });
    expect(result).toMatchObject({ desada: false, desti: 'navegador', motiu: 'sense-persistencia', campsNoDesats: ['mostrarAlMur'] });
    expect(state.remote.mock.calls[0][0].canvis).toEqual({ title: 'Confirmat remot' });
    expect(editorial.revisioEditorial('mur', 'a')).toEqual({ title: 'Confirmat remot', mostrarAlMur: false });
  });
});
