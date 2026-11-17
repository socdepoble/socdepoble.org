// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { creaServeiSalutEmmagatzematgeDispositiu } from './salutEmmagatzematgeDispositiu.js';

const URL_RECURS = 'https://socdepoble.org/assets/entrada-abcdefgh.js';
function entorn() {
  const map = new Map(); const hist = []; const recursos = new Map();
  let cua = Promise.resolve();
  const locks = { request: vi.fn((_n, _o, fn) => { const p = cua.then(fn); cua = p.catch(() => {}); return p; }) };
  const navegador = { locks, storage: { estimate: vi.fn(async () => ({ usage: 900, quota: 2000 })), persisted: vi.fn(async () => true) } };
  const memories = {
    keys: vi.fn(async () => [...map.keys()]), has: vi.fn(async (n) => map.has(n)),
    open: vi.fn(async (n) => map.get(n)), delete: vi.fn(() => { throw Error('Mai esborrem memòries senceres'); })
  };
  const magatzemHistorial = { totes: async () => structuredClone(hist), obtinBloqueig: async () => 'escriptora',
    desa: vi.fn(async (_s, r) => hist.push(structuredClone(r))), estatPersistencia: async () => ({ persistent: true }), tanca: vi.fn() };
  function cache(nom, entrades) {
    const dades = new Map(entrades.map(([url, cos]) => {
      if (/^https:\/\/socdepoble\.org\/assets\/[a-zA-Z0-9_-]+-[a-zA-Z0-9_-]{8,}\.js$/.test(url))
        recursos.set(url, { url, bytes: Buffer.byteLength(cos), sha256: createHash('sha256').update(cos).digest('hex') });
      return [url, new Response(cos, { headers: { 'content-type': 'text/javascript' } })];
    }));
    const c = { keys: vi.fn(async () => [...dades.keys()].map((u) => new Request(u))),
      match: vi.fn(async (r) => dades.get(r.url)?.clone()), delete: vi.fn(async (r) => dades.delete(r.url)) };
    map.set(nom, c); return { c, dades };
  }
  const manifest = () => ({ esquema: 'sdp.cache-regenerable.v1', bloqueig: 'sdp:salut:purga-regenerable:v1', recursos: [...recursos.values()] });
  const crea = () => creaServeiSalutEmmagatzematgeDispositiu({ navegador, memories, origen: 'https://socdepoble.org',
    magatzemHistorial, manifestRegenerable: manifest(), id: () => `rebut-${hist.length}`, ara: () => '2026-11-16T16:00:00.000Z' });
  return { crea, cache, memories, navegador, magatzemHistorial, hist, manifest };
}

describe('JARVIS: dades sagrades intactes i mesures honestes', () => {
  it('sense productor amb manifest confirmat no esborra ni un asset aparentment públic', async () => {
    const e = entorn(); const x = e.cache('sdp-pwa-recursos-v0', [[URL_RECURS, '123']]);
    const servei = creaServeiSalutEmmagatzematgeDispositiu({ navegador: e.navegador, memories: e.memories,
      origen: 'https://socdepoble.org', magatzemHistorial: e.magatzemHistorial });
    const r = await servei.purgaMemoriaCauRegenerable();
    expect(r.bytesEliminats).toBe(0); expect(x.c.delete).not.toHaveBeenCalled();
    expect(r.avisos).toContain('CAP_PRODUCTOR_REGENERABLE_CONFIRMAT');
  });
  it('MIME JSON o autenticat camuflat sota una URL asset mai és regenerable', async () => {
    for (const headers of [{ 'content-type': 'application/json' }, { 'content-type': 'text/javascript', 'set-cookie': 'id=privat' }, { 'content-type': 'text/javascript', 'cache-control': 'private' }]) {
      const e=entorn();const x=e.cache('sdp-pwa-recursos-v0',[[URL_RECURS,'secret']]);
      x.dades.set(URL_RECURS,new Response('secret',{headers}));
      const r=await e.crea().purgaMemoriaCauRegenerable();
      expect(r.bytesEliminats).toBe(0);expect(x.c.delete).not.toHaveBeenCalled();
    }
  });
  it('un cos canviat amb la mateixa mida falla SHA-256 abans de suprimir', async () => {
    const e=entorn();const x=e.cache('sdp-pwa-recursos-v0',[[URL_RECURS,'123']]);
    let matches=0;const original=x.c.match;
    x.c.match=vi.fn(async r=>{matches++;if(matches===2)x.dades.set(URL_RECURS,new Response('abc',{headers:{'content-type':'text/javascript'}}));return original(r);});
    const r=await e.crea().purgaMemoriaCauRegenerable();
    expect(r.bytesEliminats).toBe(0);expect(x.c.delete).not.toHaveBeenCalled();expect(r.avisos).toContain('RECURS_CANVIAT');
    expect(await x.dades.get(URL_RECURS).text()).toBe('abc');
  });
  it('avort durant lectura no queda penjat encara que cancel() no resolga', async () => {
    const e=entorn();const x=e.cache('sdp-pwa-recursos-v0',[[URL_RECURS,'123']]);
    x.c.match=vi.fn(async()=>new Response(new ReadableStream({ pull() {}, cancel:()=>new Promise(()=>{}) }),{headers:{'content-type':'text/javascript'}}));
    const controller=new AbortController();const servei=e.crea();
    const operacio=servei.purgaMemoriaCauRegenerable({signal:controller.signal});
    const abortTimer=setTimeout(()=>controller.abort(new Error('CANCEL_TEST')),0);
    let timeout;
    try {
      await expect(Promise.race([operacio,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('HANG')),500);})])).rejects.toThrow('CANCEL_TEST');
    } finally {clearTimeout(abortTimer);clearTimeout(timeout);}
    expect(x.c.delete).not.toHaveBeenCalled();expect(e.magatzemHistorial.desa).not.toHaveBeenCalled();
  });
  it('un inventari superior al sostre no llig ni elimina cossos', async () => {
    const e=entorn();const x=e.cache('sdp-pwa-recursos-v0',[[URL_RECURS,'123']]);
    x.c.keys=vi.fn(async()=>Array.from({length:1501},()=>new Request(URL_RECURS)));
    const r=await e.crea().purgaMemoriaCauRegenerable();
    expect(r.avisos).toContain('CACHE_MASSA_GRAN');expect(x.c.match).not.toHaveBeenCalled();expect(x.c.delete).not.toHaveBeenCalled();
  });
  it('usa el magatzem real en mode memòria i declara que no és persistent', async () => {
    const e = entorn(); e.cache('sdp-pwa-recursos-v0', [[URL_RECURS, 'real']]);
    // Locks de noms diferents poden coexistir com en el navegador.
    e.navegador.locks.request = (_n, o, fn) => Promise.resolve(fn(o.ifAvailable ? {} : undefined));
    const servei = creaServeiSalutEmmagatzematgeDispositiu({ navegador: e.navegador, memories: e.memories,
      origen: 'https://socdepoble.org', manifestRegenerable: e.manifest(), id: () => 'real', ara: () => '2026-11-16T16:00:00.000Z' });
    try {
      expect(await servei.purgaMemoriaCauRegenerable()).toMatchObject({ bytesEliminats: 4, historialDesat: true, historialPersistent: false });
      expect(await servei.historialNetegesLocals()).toMatchObject({ persistent: false, registres: [{ id: 'real', bytesEliminats: 4 }] });
    } finally { servei.tanca(); }
  });
  it('llegix quota i persistència sense inventar grandàries de dades privades', async () => {
    const e = entorn(); const r = await e.crea().lligSalutEmmagatzematgeDispositiu();
    expect(r).toMatchObject({ usage: 900, quota: 2000, persistent: true });
    expect(r.categories.filter((c) => c.tipus === 'sagrada')).toHaveLength(4);
    expect(r.categories.filter((c) => c.tipus === 'sagrada').every((c) => c.bytes === null && !c.purgable)).toBe(true);
    expect(e.magatzemHistorial.desa).not.toHaveBeenCalled();
  });
  it('mesura cossos eliminats, deixa claus E2EE/esborranys/backups i és idempotent', async () => {
    const e = entorn(); const old = e.cache('sdp-pwa-recursos-v0', [[URL_RECURS, '12345']]);
    const sacred = e.cache('claus-e2ee', [['https://socdepoble.org/clau', 'privada']]);
    const drafts = e.cache('esborranys-pendents', [['https://socdepoble.org/nota.sdpbackup', 'pendent']]);
    const current = e.cache('sdp-pwa-recursos-v1', [[URL_RECURS, '12345']]);
    const servei = e.crea();
    expect(await servei.purgaMemoriaCauRegenerable()).toMatchObject({ bytesEliminats: 5, bytesAlliberats: null, entradesEliminades: 1, historialDesat: true });
    expect(await servei.purgaMemoriaCauRegenerable()).toMatchObject({ bytesEliminats: 0, entradesEliminades: 0 });
    expect(old.dades.size).toBe(0);
    for (const x of [sacred, drafts, current]) expect(x.c.delete).not.toHaveBeenCalled();
    expect(e.memories.delete).not.toHaveBeenCalled(); expect(e.hist).toHaveLength(1);
    expect((await servei.historialNetegesLocals()).registres[0].bytesEliminats).toBe(5);
  });
  it('bloqueja tota cache retirada amb un sol recurs desconegut o pendent', async () => {
    const e = entorn(); const old = e.cache('sdp-pwa-recursos-v0', [[URL_RECURS, '123'], ['https://socdepoble.org/esborrany', 'pendent']]);
    const r = await e.crea().purgaMemoriaCauRegenerable();
    expect(r.avisos).toContain('CACHE_AMB_DADES_NO_VERIFICADES'); expect(old.c.delete).not.toHaveBeenCalled();
  });
  it.each(['https://alien.org/assets/entrada-abcdefgh.js', `${URL_RECURS}?secret=si`, 'https://socdepoble.org/auth/token'])('rebutja origen/consulta/ruta: %s', async (url) => {
    const e = entorn(); const x = e.cache('sdp-pwa-recursos-v0', [[url, 'privat']]);
    await e.crea().purgaMemoriaCauRegenerable(); expect(x.c.delete).not.toHaveBeenCalled();
  });
  it('deixa desconegut si API falla i conserva les causes de lectura', async () => {
    const e = entorn(); e.navegador.storage.estimate.mockRejectedValue(Error('denegat'));
    e.navegador.storage.persisted.mockRejectedValue(Error('denegat'));
    const r = await e.crea().lligSalutEmmagatzematgeDispositiu();
    expect(r).toMatchObject({ usage: null, quota: null, persistent: null });
    expect(r.avisos).toEqual(expect.arrayContaining(['ESTIMACIO_FALLIDA', 'PERSISTENCIA_DESCONEGUDA']));
  });
  it('sense Web Locks no pot netejar', async () => {
    const e = entorn(); delete e.navegador.locks;
    await expect(e.crea().purgaMemoriaCauRegenerable()).rejects.toMatchObject({ codi: 'BLOQUEIG_NO_DISPONIBLE' });
    expect(e.memories.open).not.toHaveBeenCalled();
  });
  it('abort previ no muta res', async () => {
    const e = entorn(); const a = new AbortController(); a.abort();
    await expect(e.crea().purgaMemoriaCauRegenerable({ signal: a.signal })).rejects.toBeDefined();
    expect(e.memories.open).not.toHaveBeenCalled();
  });
  it('concurrència entre dos serveis registra cada entrada una sola vegada', async () => {
    const e = entorn(); e.cache('sdp-pwa-recursos-v0', [[URL_RECURS, '123']]);
    const rs = await Promise.all([e.crea().purgaMemoriaCauRegenerable(), e.crea().purgaMemoriaCauRegenerable()]);
    expect(rs.reduce((s, r) => s + r.bytesEliminats, 0)).toBe(3); expect(e.hist).toHaveLength(1);
  });
  it('quota d’historial fallida retorna el rebut real i avís', async () => {
    const e = entorn(); e.cache('sdp-pwa-recursos-v0', [[URL_RECURS, '123']]);
    e.magatzemHistorial.desa.mockRejectedValue(Error('QuotaExceededError'));
    const r = await e.crea().purgaMemoriaCauRegenerable();
    expect(r).toMatchObject({ bytesEliminats: 3, historialDesat: false }); expect(r.avisos).toContain('HISTORIAL_NO_DESAT');
  });
  it('R32.2 · una clau d’asset desmesurada es rebutja sense retrocés quadràtic (zero ReDoS) i no s’esborra', async () => {
    // 64.000 caràcters que no casen («~» abans de .js): sense sostre, 5,6 s de fil principal.
    const e = entorn(); const x = e.cache('sdp-pwa-recursos-v0', [[URL_RECURS, '123']]);
    const llarga = new Request(`https://socdepoble.org/assets/${'a-'.repeat(32000)}~.js`);
    x.c.keys = vi.fn(async () => [llarga]);
    const inici = performance.now();
    const r = await e.crea().purgaMemoriaCauRegenerable();
    expect(performance.now() - inici).toBeLessThan(1000);
    expect(r.avisos).toContain('CACHE_AMB_DADES_NO_VERIFICADES');
    expect(x.c.match).not.toHaveBeenCalled(); expect(x.c.delete).not.toHaveBeenCalled();
  });
  it('error després d’una eliminació conserva el comptatge parcial', async () => {
    const e = entorn(); const x = e.cache('sdp-pwa-recursos-v0', [[URL_RECURS, '123'], ['https://socdepoble.org/assets/altre-abcdefgh.js', '456']]);
    x.c.delete.mockImplementationOnce(async (r) => x.dades.delete(r.url)).mockRejectedValueOnce(Error('denegat'));
    expect(await e.crea().purgaMemoriaCauRegenerable()).toMatchObject({ estat: 'parcial', bytesEliminats: 3, entradesEliminades: 1 });
  });
  it('R32.3 · abort durant la revalidació, abans de cap supressió, rebutja com diu el contracte', async () => {
    // Peix R32.2 (P3): resolia 'parcial' amb 0 supressions i un codi 'Error'; el README diu «Abort abans de mutar rebutja».
    const e = entorn(); const x = e.cache('sdp-pwa-recursos-v0', [[URL_RECURS, '123']]);
    const ctrl = new AbortController(); const match = x.c.match; let crides = 0;
    x.c.match = vi.fn(async (r) => { crides += 1; if (crides === 2) ctrl.abort(new Error('ABORT_ABANS_DE_MUTAR')); return match(r); });
    await expect(e.crea().purgaMemoriaCauRegenerable({ signal: ctrl.signal })).rejects.toThrow('ABORT_ABANS_DE_MUTAR');
    expect(crides).toBe(2); expect(x.c.delete).not.toHaveBeenCalled(); expect(e.magatzemHistorial.desa).not.toHaveBeenCalled();
  });
});
