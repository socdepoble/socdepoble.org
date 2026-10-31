// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ client: null, uid: null, generacio:0, puja: vi.fn(), esborra: vi.fn(), info: vi.fn(), firma: vi.fn() }));
vi.mock('./config.js', () => ({ getClient: async () => m.client }));
vi.mock('./runtime.js', () => ({ getResolvedConfig: c => ({ ...c, runtimeDataMode: 'remote' }) }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => ({ id: m.uid }), capturaSessio: () => { const g=m.generacio,u=m.uid;return () => { if(g!==m.generacio||u!==m.uid) throw new DOMException('Canvi','AbortError'); }; } }));
import { deleteFile, resolveAsset, uploadToStorage } from './storage.js';
import { observaReconciliacioStorage, controlStorageDe } from './controlStorage.js';
import { tempsLimitPujada } from '../xatMultimedia.js';
const UID = '11111111-1111-4111-8111-111111111111', TENANT = '22222222-2222-4222-8222-222222222222';
const CONFIG = { tenantId: TENANT };
let desconnecta, avisa, observats;
beforeEach(() => {
  vi.useFakeTimers(); m.uid = UID;
  for (const n of ['puja', 'esborra', 'info', 'firma']) m[n].mockReset();
  m.client = { storage: { from: () => ({ upload:m.puja, remove:m.esborra, info:m.info, createSignedUrl:m.firma }) } };
  m.esborra.mockResolvedValue({ data:[], error:null }); m.info.mockResolvedValue({data:null,error:{status:404}});
  observats=[];desconnecta=observaReconciliacioStorage(e=>observats.push(e));avisa=vi.spyOn(console,'warn').mockImplementation(()=>{});
});
afterEach(() => { desconnecta(); avisa.mockRestore(); vi.useRealTimers(); });
test('una pujada amb UUID confirmada després de cancel·lar es compensa i no torna cap URL a la vista', async () => {
  let resol; m.puja.mockImplementation(()=>new Promise(r=>{resol=r;})); const ac=new AbortController();
  const feina=uploadToStorage(new Blob(['a'],{type:'image/webp'}),{carpeta:'avatars'},{...CONFIG,signal:ac.signal});
  const rebuig=expect(feina).rejects.toBeInstanceOf(Error);await vi.advanceTimersByTimeAsync(0);ac.abort();await rebuig;
  resol({data:{path:'no-es-publica'},error:null});await vi.advanceTimersByTimeAsync(0);
  expect(m.esborra).toHaveBeenCalledExactlyOnceWith([m.puja.mock.calls[0][0]]);
  expect(observats).toEqual([{tipus:'pujada',estat:'compensat'}]);expect(controlStorageDe(m.client.storage).estat().enVol).toBe(0);
});
test('una signatura tardana es descarta; no esborra l’objecte ni torna l’URL signada', async () => {
  let resol;m.firma.mockImplementation(()=>new Promise(r=>{resol=r;}));const ac=new AbortController(),ref=`sdp-media://mitjans_privats/${TENANT}/${UID}/notes/a.webp`;
  const feina=resolveAsset(ref,{...CONFIG,signal:ac.signal});await vi.advanceTimersByTimeAsync(0);ac.abort();
  expect(await feina).toBe(ref);resol({data:{signedUrl:'https://example.org/signada'},error:null});await vi.advanceTimersByTimeAsync(0);
  expect(m.esborra).not.toHaveBeenCalled();expect(observats).toEqual([{tipus:'signatura',estat:'invalida'}]);
});
test('esborrat tardà: comprova l’estat actual i invalida el resultat antic sense repetir l’esborrat', async () => {
  let resol;m.esborra.mockImplementation(()=>new Promise(r=>{resol=r;}));const ac=new AbortController();
  const feina=deleteFile('mitjans','foto.webp',{signal:ac.signal});await vi.advanceTimersByTimeAsync(0);ac.abort();
  expect((await feina).error).toBeTruthy();resol({data:[{name:'foto.webp'}],error:null});await vi.advanceTimersByTimeAsync(0);
  expect(m.esborra).toHaveBeenCalledTimes(1);expect(m.info).toHaveBeenCalledWith('foto.webp');expect(observats).toEqual([{tipus:'esborrat',estat:'comprovat'}]);
});
test('el canvi de sessió no executa compensacions amb credencials de la persona nova', async () => {
  let resol;m.puja.mockImplementation(()=>new Promise(r=>{resol=r;}));const ac=new AbortController();
  const feina=uploadToStorage(new Blob(['a'],{type:'image/webp'}),{carpeta:'avatars'},{...CONFIG,signal:ac.signal}).catch(e=>e);
  await vi.advanceTimersByTimeAsync(0);ac.abort();await feina;m.uid='33333333-3333-4333-8333-333333333333';resol({data:{},error:null});await vi.advanceTimersByTimeAsync(0);
  expect(m.esborra).not.toHaveBeenCalled();expect(observats).toEqual([{tipus:'pujada',estat:'pendent',motiu:'sessio-canviada'}]);
});
test('deu esborrats ignorats pel transport no superen quatre peticions físiques encara que expire el termini', async () => {
  const resolen=[];m.esborra.mockImplementation(()=>new Promise(r=>resolen.push(r)));
  const feines=Array.from({length:10},(_,i)=>deleteFile('mitjans',`${i}.webp`));
  // V2-01: ningú no resol cap transport. Les 4 primeres expiren als 12 s; les 6 de la cua, als 24 s (12 s seus més els 12 de les que volen).
  await vi.advanceTimersByTimeAsync(12000);await Promise.all(feines.slice(0,4));
  await vi.advanceTimersByTimeAsync(12000);await Promise.all(feines);
  expect(m.esborra).toHaveBeenCalledTimes(4);expect(controlStorageDe(m.client.storage).estat()).toEqual({enVol:4,enCua:0});
  expect((await Promise.all(feines)).every(r=>r.error)).toBe(true);
  resolen.forEach(r=>r({data:[],error:null}));await vi.advanceTimersByTimeAsync(0);
  expect(controlStorageDe(m.client.storage).estat()).toEqual({enVol:0,enCua:0});expect(vi.getTimerCount()).toBe(0);
});
/* V2-01 · La sonda del verificador (PN-04): cinc pujades sense senyal, com NotesEditor i PerfilContext, amb un transport que no torna. */
test('cinc pujades sense senyal amb un transport que no torna: totes acaben, i la cinquena per la cua, no per un termini', async () => {
  const resolen=[];m.puja.mockImplementation(()=>new Promise(r=>resolen.push(r)));
  const ms=tempsLimitPujada(1),estats=Array.from({length:5},()=>({nom:'pendent'}));
  Array.from({length:5},()=>uploadToStorage(new Blob(['a'],{type:'image/webp'}),{carpeta:'notes'},CONFIG))
    .forEach((p,i)=>p.then(v=>Object.assign(estats[i],{nom:'resolta',v}),v=>Object.assign(estats[i],{nom:'rebutjada',v})));
  await vi.advanceTimersByTimeAsync(ms);
  expect(estats.map(e=>e.nom)).toEqual(['rebutjada','rebutjada','rebutjada','rebutjada','pendent']);
  // La cinquena espera plaça fins al seu termini més el més llarg dels quatre en vol; ni un mil·lisegon més.
  await vi.advanceTimersByTimeAsync(ms-1);expect(estats[4].nom).toBe('pendent');
  await vi.advanceTimersByTimeAsync(1);
  expect(estats.map(e=>e.nom)).toEqual(Array(5).fill('rebutjada'));expect(m.puja).toHaveBeenCalledTimes(4);
  for (const {v} of estats) { expect(v.codi).toBe('backend-inabastable');expect(v.message).toBe('No s’ha pogut pujar el fitxer: el servidor no respon. Comprova la connexió i torna-ho a provar.'); }
  expect(estats.slice(0,4).map(e=>e.v.cause.name)).toEqual(Array(4).fill('TimeoutError'));
  expect(estats[4].v.cause.message).toBe('Storage està ocupat.');expect(estats[4].v.cause.name).not.toBe('TimeoutError');
  // Neteja del control compartit: les pujades confirmades tard es compensen.
  resolen.forEach(r=>r({data:{},error:null}));await vi.advanceTimersByTimeAsync(0);
  expect(controlStorageDe(m.client.storage).estat()).toEqual({enVol:0,enCua:0});expect(vi.getTimerCount()).toBe(0);
  expect(observats).toEqual(Array(4).fill({tipus:'pujada',estat:'compensat'}));
});

test('el sostre de quatre transports no es reinicia amb un client nou per renovació de JWT', async () => {
  const resolen=[];m.esborra.mockImplementation(()=>new Promise(r=>resolen.push(r)));
  const controls=Array.from({length:5},()=>new AbortController());
  const feines=controls.slice(0,4).map((ac,i)=>deleteFile('mitjans',`${i}.webp`,{signal:ac.signal}));
  await vi.advanceTimersByTimeAsync(0);
  const anterior=m.client.storage;
  m.client={storage:{from:()=>({remove:m.esborra,info:m.info})}};
  feines.push(deleteFile('mitjans','nou.webp',{signal:controls[4].signal}));await vi.advanceTimersByTimeAsync(0);
  expect(controlStorageDe(anterior)).toBe(controlStorageDe(m.client.storage));expect(m.esborra).toHaveBeenCalledTimes(4);
  controls.forEach(ac=>ac.abort());await Promise.all(feines);
  resolen.forEach(r=>r({data:[],error:null}));await vi.advanceTimersByTimeAsync(0);
  expect(controlStorageDe(anterior).estat()).toEqual({enVol:0,enCua:0});
});
test('una reentrada del mateix uid mentre la pujada espera torn no inicia cap upload', async () => {
  const resolen=[];m.esborra.mockImplementation(()=>new Promise(r=>resolen.push(r)));
  const feines=Array.from({length:4},(_,i)=>deleteFile('mitjans',`${i}.webp`));await vi.advanceTimersByTimeAsync(0);
  const pujada=uploadToStorage(new Blob(['a'],{type:'image/webp'}),{carpeta:'avatars'},CONFIG).catch(e=>e);
  await vi.advanceTimersByTimeAsync(0);m.generacio++;
  resolen.forEach(r=>r({data:[],error:null}));await Promise.all(feines);await vi.advanceTimersByTimeAsync(0);
  expect(await pujada).toBeInstanceOf(Error);expect(m.puja).not.toHaveBeenCalled();
});
test('reconciliar moltes rutes fa info seqüencial dins de la mateixa plaça', async () => {
  let acaba; m.esborra.mockImplementation(()=>new Promise(r=>{acaba=r;}));
  const infos=[];m.info.mockImplementation(()=>new Promise(r=>infos.push(r)));
  const ac=new AbortController(),feina=deleteFile('mitjans',['a','b','c'],{signal:ac.signal});await vi.advanceTimersByTimeAsync(0);ac.abort();await feina;
  acaba({data:[],error:null});await vi.advanceTimersByTimeAsync(0);expect(m.info).toHaveBeenCalledTimes(1);
  infos[0]({data:null,error:{status:404}});await vi.advanceTimersByTimeAsync(0);expect(m.info).toHaveBeenCalledTimes(2);
  infos[1]({data:null,error:{status:404}});await vi.advanceTimersByTimeAsync(0);expect(m.info).toHaveBeenCalledTimes(3);
  infos[2]({data:null,error:{status:404}});await vi.advanceTimersByTimeAsync(0);expect(controlStorageDe(m.client.storage).estat().enVol).toBe(0);
});
test('canviar la generació mentre espera info atura la reconciliació restant', async () => {
  let acaba, acabaInfo;
  m.esborra.mockImplementation(() => new Promise(r => { acaba = r; }));
  m.info.mockImplementation(() => new Promise(r => { acabaInfo = r; }));
  const ac = new AbortController();
  const feina = deleteFile('mitjans', ['a', 'b'], { signal: ac.signal });
  await vi.advanceTimersByTimeAsync(0);
  ac.abort();
  await feina;
  acaba({ data: [], error: null });
  await vi.advanceTimersByTimeAsync(0);
  expect(m.info).toHaveBeenCalledTimes(1);
  m.generacio++;
  acabaInfo({ data: null, error: { status: 404 } });
  await vi.advanceTimersByTimeAsync(0);
  expect(m.info).toHaveBeenCalledTimes(1);
  expect(observats).toEqual([{ tipus: 'esborrat', estat: 'pendent', motiu: 'sessio-canviada' }]);
  expect(controlStorageDe(m.client.storage).estat()).toEqual({ enVol: 0, enCua: 0 });
});
