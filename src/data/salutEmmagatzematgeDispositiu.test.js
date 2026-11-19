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
  const magatzemHistorial = { totes: async () => structuredClone(hist), obtinBloqueig: vi.fn(async () => 'escriptora'),
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

describe('JARVIS: diagnòstic sense capacitat de supressió', () => {
  it('sense productor amb manifest confirmat no esborra ni un asset aparentment públic', async () => {
    const e = entorn(); const x = e.cache('sdp-pwa-recursos-v0', [[URL_RECURS, '123']]);
    const servei = creaServeiSalutEmmagatzematgeDispositiu({ navegador: e.navegador, memories: e.memories,
      origen: 'https://socdepoble.org', magatzemHistorial: e.magatzemHistorial });
    const r = await servei.purgaMemoriaCauRegenerable();
    expect(r).toMatchObject({ estat: 'bloquejat', bytesEliminats: 0, entradesEliminades: 0 });
    expect(x.c.delete).not.toHaveBeenCalled();
    expect(r.avisos).toEqual(expect.arrayContaining(['CAP_PRODUCTOR_REGENERABLE_CONFIRMAT', 'JARVIS_NOMES_DIAGNOSTIC']));
  });
  it('un manifest vàlid només confirma la lectura: mai habilita purga, locks ni escriptura d’historial', async () => {
    const e = entorn(); const x = e.cache('sdp-pwa-recursos-v0', [[URL_RECURS, '12345']]);
    const servei = e.crea();
    const r = await servei.lligSalutEmmagatzematgeDispositiu();
    expect(r.categories.find(c => c.id === 'sdp-pwa-recursos-v0')).toMatchObject({ bytes: 5, verificat: true, purgable: false, motiu: 'JARVIS_NOMES_DIAGNOSTIC' });
    expect(await servei.purgaMemoriaCauRegenerable()).toMatchObject({ estat: 'bloquejat', bytesEliminats: 0, bytesAlliberats: null, entradesEliminades: 0, historialDesat: null });
    expect(await x.dades.get(URL_RECURS).text()).toBe('12345');
    expect(e.navegador.locks.request).not.toHaveBeenCalled();
    expect(x.c.delete).not.toHaveBeenCalled(); expect(e.memories.delete).not.toHaveBeenCalled();
    expect(e.magatzemHistorial.desa).not.toHaveBeenCalled(); expect(e.magatzemHistorial.obtinBloqueig).not.toHaveBeenCalled();
  });
  it.each([
    { 'content-type': 'application/json' },
    { 'content-type': 'text/javascript', 'set-cookie': 'id=privat' },
    { 'content-type': 'text/javascript', 'cache-control': 'private' }
  ])('MIME JSON o autenticat camuflat sota una URL asset no es dona per verificat: %j', async (headers) => {
    const e=entorn();const x=e.cache('sdp-pwa-recursos-v0',[[URL_RECURS,'secret']]);
    x.dades.set(URL_RECURS,new Response('secret',{headers}));
    const r=await e.crea().lligSalutEmmagatzematgeDispositiu();
    expect(r.categories.find(c=>c.id==='sdp-pwa-recursos-v0')).toMatchObject({ verificat:false, purgable:false });
    expect(r.avisos).toContain('CACHE_AMB_DADES_NO_VERIFICADES'); expect(x.c.delete).not.toHaveBeenCalled();
  });
  it('un cos canviat amb la mateixa mida falla SHA-256 en el diagnòstic', async () => {
    const e=entorn();const x=e.cache('sdp-pwa-recursos-v0',[[URL_RECURS,'123']]);const servei=e.crea();
    x.dades.set(URL_RECURS,new Response('abc',{headers:{'content-type':'text/javascript'}}));
    const r=await servei.lligSalutEmmagatzematgeDispositiu();
    expect(r.categories.find(c=>c.id==='sdp-pwa-recursos-v0')).toMatchObject({ bytes:3, verificat:false, purgable:false });
    expect(r.avisos).toContain('CACHE_AMB_DADES_NO_VERIFICADES');expect(x.c.delete).not.toHaveBeenCalled();
  });
  it('avort durant lectura no queda penjat encara que cancel() no resolga', async () => {
    const e=entorn();const x=e.cache('sdp-pwa-recursos-v0',[[URL_RECURS,'123']]);
    x.c.match=vi.fn(async()=>new Response(new ReadableStream({ pull() {}, cancel:()=>new Promise(()=>{}) }),{headers:{'content-type':'text/javascript'}}));
    const controller=new AbortController();const servei=e.crea();
    const operacio=servei.lligSalutEmmagatzematgeDispositiu({signal:controller.signal});
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
    const r=await e.crea().lligSalutEmmagatzematgeDispositiu();
    expect(r.avisos).toContain('CACHE_MASSA_GRAN');expect(x.c.match).not.toHaveBeenCalled();expect(x.c.delete).not.toHaveBeenCalled();
  });
  it('llegix l’historial real en mode memòria sense inventar persistència ni rebuts nous', async () => {
    const e=entorn();e.navegador.locks.request=(_n,o,fn)=>Promise.resolve(fn(o.ifAvailable?{}:undefined));
    const servei=creaServeiSalutEmmagatzematgeDispositiu({ navegador:e.navegador, memories:e.memories, origen:'https://socdepoble.org' });
    try { expect(await servei.historialNetegesLocals()).toEqual({ persistent:false, registres:[] }); }
    finally {servei.tanca();}
  });
  it('llegix quota i persistència sense inventar grandàries de dades privades', async () => {
    const e=entorn();const r=await e.crea().lligSalutEmmagatzematgeDispositiu();
    expect(r).toMatchObject({ usage:900, quota:2000, persistent:true });
    expect(r.categories.filter(c=>c.tipus==='sagrada')).toHaveLength(4);
    expect(r.categories.filter(c=>c.tipus==='sagrada').every(c=>c.bytes===null&&!c.purgable)).toBe(true);
    expect(e.magatzemHistorial.desa).not.toHaveBeenCalled();
  });
  it('totes les caches i l’historial antic es conserven després de consultes repetides', async () => {
    const e=entorn();const old=e.cache('sdp-pwa-recursos-v0',[[URL_RECURS,'12345']]);
    const sacred=e.cache('claus-e2ee',[['https://socdepoble.org/clau','privada']]);
    const drafts=e.cache('esborranys-pendents',[['https://socdepoble.org/nota.sdpbackup','pendent']]);
    const current=e.cache('sdp-pwa-recursos-v1',[[URL_RECURS,'12345']]);
    e.hist.push({id:'antic',bytesEliminats:7});const servei=e.crea();
    for(let i=0;i<2;i++) expect(await servei.purgaMemoriaCauRegenerable()).toMatchObject({estat:'bloquejat',bytesEliminats:0,entradesEliminades:0});
    for(const x of [old,sacred,drafts,current]) {expect(x.dades.size).toBe(1);expect(x.c.delete).not.toHaveBeenCalled();}
    expect(sacred.c.keys).not.toHaveBeenCalled();expect(drafts.c.keys).not.toHaveBeenCalled();expect(current.c.keys).not.toHaveBeenCalled();
    expect((await servei.historialNetegesLocals()).registres).toEqual([{id:'antic',bytesEliminats:7}]);
    expect(e.magatzemHistorial.desa).not.toHaveBeenCalled();expect(e.memories.delete).not.toHaveBeenCalled();
  });
  it('una sola entrada desconeguda impedeix donar per verificada la cache retirada', async () => {
    const e=entorn();const old=e.cache('sdp-pwa-recursos-v0',[[URL_RECURS,'123'],['https://socdepoble.org/esborrany','pendent']]);
    const r=await e.crea().lligSalutEmmagatzematgeDispositiu();
    expect(r.categories.find(c=>c.id==='sdp-pwa-recursos-v0')).toMatchObject({verificat:false,purgable:false});
    expect(r.avisos).toContain('CACHE_AMB_DADES_NO_VERIFICADES');expect(old.c.delete).not.toHaveBeenCalled();
  });
  it.each(['https://alien.org/assets/entrada-abcdefgh.js',`${URL_RECURS}?secret=si`,'https://socdepoble.org/auth/token'])('no llig el cos d’origen/consulta/ruta privada: %s',async url=>{
    const e=entorn();const x=e.cache('sdp-pwa-recursos-v0',[[url,'privat']]);
    await e.crea().lligSalutEmmagatzematgeDispositiu();expect(x.c.match).not.toHaveBeenCalled();expect(x.c.delete).not.toHaveBeenCalled();
  });
  it('deixa desconegut si API falla i conserva les causes de lectura',async()=>{
    const e=entorn();e.navegador.storage.estimate.mockRejectedValue(Error('denegat'));e.navegador.storage.persisted.mockRejectedValue(Error('denegat'));
    const r=await e.crea().lligSalutEmmagatzematgeDispositiu();expect(r).toMatchObject({usage:null,quota:null,persistent:null});
    expect(r.avisos).toEqual(expect.arrayContaining(['ESTIMACIO_FALLIDA','PERSISTENCIA_DESCONEGUDA']));
  });
  it('sense Web Locks el diagnòstic continua bloquejant la purga',async()=>{
    const e=entorn();delete e.navegador.locks;
    expect(await e.crea().purgaMemoriaCauRegenerable()).toMatchObject({estat:'bloquejat',bytesEliminats:0});
  });
  it('abort previ no obri cap cache',async()=>{
    const e=entorn();const a=new AbortController();a.abort();
    await expect(e.crea().purgaMemoriaCauRegenerable({signal:a.signal})).rejects.toBeDefined();expect(e.memories.open).not.toHaveBeenCalled();
  });
  it('concurrència entre serveis no esborra ni escriu cap rebut',async()=>{
    const e=entorn();const x=e.cache('sdp-pwa-recursos-v0',[[URL_RECURS,'123']]);
    const rs=await Promise.all([e.crea().purgaMemoriaCauRegenerable(),e.crea().purgaMemoriaCauRegenerable()]);
    expect(rs.every(r=>r.estat==='bloquejat'&&r.bytesEliminats===0)).toBe(true);expect(e.hist).toEqual([]);expect(x.c.delete).not.toHaveBeenCalled();
  });
  it('un magatzem d’historial només lector no és necessari per al diagnòstic',async()=>{
    const e=entorn();e.cache('sdp-pwa-recursos-v0',[[URL_RECURS,'123']]);e.magatzemHistorial.desa.mockRejectedValue(Error('QuotaExceededError'));
    const r=await e.crea().purgaMemoriaCauRegenerable();expect(r).toMatchObject({bytesEliminats:0,historialDesat:null});expect(e.magatzemHistorial.desa).not.toHaveBeenCalled();
  });
  it('una clau asset de 64 KB es rebutja abans de llegir el cos',async()=>{
    const e=entorn();const x=e.cache('sdp-pwa-recursos-v0',[[URL_RECURS,'123']]);
    x.c.keys=vi.fn(async()=>[new Request(`https://socdepoble.org/assets/${'a-'.repeat(32000)}~.js`)]);
    const inici=performance.now();const r=await e.crea().lligSalutEmmagatzematgeDispositiu();
    expect(performance.now()-inici).toBeLessThan(1000);expect(r.avisos).toContain('CACHE_AMB_DADES_NO_VERIFICADES');
    expect(x.c.match).not.toHaveBeenCalled();expect(x.c.delete).not.toHaveBeenCalled();
  });
  it('una API de lectura fallida no anuncia una mesura reeixida',async()=>{
    const e=entorn();e.memories.keys.mockRejectedValue(Error('denegat'));
    expect(await e.crea().lligSalutEmmagatzematgeDispositiu()).toMatchObject({categories:[],avisos:expect.arrayContaining(['INVENTARI_FALLIT']),error:{codi:'LECTURA_CACHE'}});
    expect(e.magatzemHistorial.desa).not.toHaveBeenCalled();
  });
  it('abort durant inventari es conserva i no hi ha una segona fase destructiva',async()=>{
    const e=entorn();const x=e.cache('sdp-pwa-recursos-v0',[[URL_RECURS,'123']]);const ctrl=new AbortController();
    const match=x.c.match;x.c.match=vi.fn(async r=>{ctrl.abort(new Error('ABORT_DIAGNOSTIC'));return match(r);});
    await expect(e.crea().purgaMemoriaCauRegenerable({signal:ctrl.signal})).rejects.toThrow('ABORT_DIAGNOSTIC');
    expect(x.c.match).toHaveBeenCalledTimes(1);expect(x.c.delete).not.toHaveBeenCalled();expect(e.magatzemHistorial.desa).not.toHaveBeenCalled();
  });
});
