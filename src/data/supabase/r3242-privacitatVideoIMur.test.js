import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { mp4, box, join, ascii } from '../../../tests/helpers/contenidorsMedia.js';
import { preparaAdjunt } from '../../sections/xat/adjuntLocal.js';
import { senseUbicacioVideo } from '../../utils/ubicacioMitjans.js';
import { vigentsDalt } from '../../sections/mur/alertesMunicipals.js';
import { creaOpcionsMotorAccions } from '../xat/creaOpcionsMotorAccions.js';
import { elementDeMurPublic } from '../murPublic.js';
import { publicaAdjuntXat } from './xatMultimedia.js';
const mock = vi.hoisted(() => ({ rpc:vi.fn(), request:vi.fn(), urlAdjuntXat:vi.fn() }));
vi.mock('../backendPort.js', () => ({ urlAdjuntXat:mock.urlAdjuntXat }));
vi.mock('./runtime.js', () => ({ rpc:mock.rpc,request:mock.request,
  getResolvedConfig:()=>({runtimeDataMode:'remote',supabaseUrl:'https://node.invalid',supabaseAnonKey:'public'}) }));
vi.mock('../identitat.js', () => ({ capturaSessio:()=>()=>{},entradaSessio:()=>1,
  usuariDeSessio:()=>({id:'00000000-0000-4000-8000-000000000001'}),jwtPerBackend:()=> 'test-jwt' }));
const ISO = '+38.6123456-000.4287654/';
const movie = mp4(false), movieView = new DataView(movie.buffer), start = movieView.getUint32(0), end = start + movieView.getUint32(start);
const original = extra => new Blob([movie.subarray(0,start),box('moov',join(movie.subarray(start+8,end),extra)),movie.subarray(end)], {type:'video/quicktime'});
const timed = () => {
  const track=movie.slice(start+8+108,end); new DataView(track.buffer).setUint32(28,2);
  const where=new TextDecoder('latin1').decode(track).indexOf('vide');track.set(ascii('meta'),where);
  return original(track);
};
const pont = () => creaOpcionsMotorAccions({entornAccions:{current:{config:{}}}});
const missatge = {tipus:'video',metadades:{adjunt:{id:'old-video',mime:'video/quicktime'}}};
const id = '00000000-0000-4000-8000-000000000002', fil='00000000-0000-4000-8000-000000000003';
beforeEach(()=>{vi.clearAllMocks();mock.urlAdjuntXat.mockResolvedValue('https://node.invalid/authorized');});
afterEach(()=>vi.unstubAllGlobals());
const text = async blob => new TextDecoder('latin1').decode(await blob.arrayBuffer());

test.each(['©xyz','loci','meta'])('iPhone %s: saneja bytes originals, offsets intactes i JSON aproximat consentit', async tag => {
  const brut=original(box(tag,ascii(ISO))), abans=await text(brut);
  // IDEA-331 conserva el lloc per defecte; estes assertions acrediten l'opt-out explícit.
  const adjunt=await preparaAdjunt(brut,{conservaUbicacio:false,lligDurada:async()=>1000,comprimeixVideo:async fitxer=>({fitxer,comprimit:false})});
  expect(adjunt.senseUbicacio).toBe(true);expect(await text(adjunt.fitxer)).not.toContain(ISO);
  expect(adjunt.fitxer.size).toBe(brut.size);expect(await text(brut)).toBe(abans);
  const entrada=new Uint8Array(await brut.arrayBuffer()), net=new Uint8Array(await adjunt.fitxer.arrayBuffer());
  const fiMetadades=end+box(tag,ascii(ISO)).length;
  // Fora de la caixa de metadades, ni les pistes ni mdat canvien d'octet o posició.
  expect(net.subarray(0,end)).toEqual(entrada.subarray(0,end));
  expect(net.subarray(fiMetadades)).toEqual(entrada.subarray(fiMetadades));
  expect(new TextDecoder('latin1').decode(net.subarray(fiMetadades+4,fiMetadades+8))).toBe('mdat');
  expect(adjunt).toMatchObject({conservaUbicacio:false});expect(adjunt.ubicacio).toBeUndefined();
});

test.each(['©xyz','loci','meta'])('IDEA-331 iPhone %s: per defecte i opt-in explícit preserven tots els bytes i offsets',async tag=>{
  const brut=original(box(tag,ascii(ISO))), abans=new Uint8Array(await brut.arrayBuffer());
  for(const opcio of [{},{conservaUbicacio:true}]) {
    const adjunt=await preparaAdjunt(brut,{...opcio,lligDurada:async()=>1000,comprimeixVideo:async fitxer=>({fitxer,comprimit:false})});
    expect(adjunt).toMatchObject({conservaUbicacio:true,senseUbicacio:false});
    expect(new Uint8Array(await adjunt.fitxer.arrayBuffer())).toEqual(abans);
    expect(await text(adjunt.fitxer)).toContain(ISO);
  }
  expect(new Uint8Array(await brut.arrayBuffer())).toEqual(abans);
});

test('pista QuickTime meta opaca: opt-in preservat, bloqueig honest en opt-out i reenviament', async()=>{
  const brut=timed();
  expect((await senseUbicacioVideo(brut)).net).toBe(false);
  const abans=new Uint8Array(await brut.arrayBuffer());
  for(const opcio of [{},{conservaUbicacio:true}]) {
    const adjunt=await preparaAdjunt(brut,{...opcio,lligDurada:async()=>1000,comprimeixVideo:async fitxer=>({fitxer,comprimit:false})});
    expect(adjunt).toMatchObject({conservaUbicacio:true,senseUbicacio:false});
    expect(new Uint8Array(await adjunt.fitxer.arrayBuffer())).toEqual(abans);
  }
  await expect(preparaAdjunt(brut,{conservaUbicacio:false,lligDurada:async()=>1000,
    comprimeixVideo:async fitxer=>({fitxer,comprimit:false})})).rejects.toMatchObject({code:'video-no-acreditable'});
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,blob:async()=>brut})));
  await expect(pont().lligBlob(missatge,{})).rejects.toMatchObject({code:'video-no-acreditable'});
  expect(mock.rpc).not.toHaveBeenCalled();expect(mock.request).not.toHaveBeenCalled();
  expect(new Uint8Array(await brut.arrayBuffer())).toEqual(abans);
});

test.each(['©xyz','loci','meta'])('reenviar vídeo antic %s proporciona només còpia sanejada al motor',async tag=>{
  const brut=original(box(tag,ascii(ISO)));
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,blob:async()=>brut})));
  const resultat=await pont().lligBlob(missatge,{});
  expect(await text(resultat)).not.toContain(ISO);expect(resultat.size).toBe(brut.size);
  expect(await text(brut)).toContain(ISO);
});

test.each(['gps','track'])('publicador bloqueja %s abans de qualsevol RPC/pujada encara amb bandera senseUbicacio falsa',async tipus=>{
  const fitxer=tipus==='track'?timed():original(box('©xyz',ascii(ISO)));
  await expect(publicaAdjuntXat(fil,{id,fitxer,tipus:'video',duradaMs:1000,senseUbicacio:true})).rejects.toMatchObject({code:'video-no-acreditable'});
  expect(mock.rpc).not.toHaveBeenCalled();expect(mock.request).not.toHaveBeenCalled();
});

test('Mur: filtre efectiu de Mercat i Actes, coherència, ordre i sense mutar fitxes originals',()=>{
  const font=[{id:'product-no',type:'product',mostrarAlMur:false},{id:'event-no',type:'event',ocultarDelMur:true},
    {id:'bad',type:'event',mostrarAlMur:'false'},{id:'product-si',type:'product',mostrarAlMur:true},
    {id:'event-si',type:'event'},{id:'sistema',type:'sistema'}];
  const entrades=font.map(item=>({item}));
  const projected=vigentsDalt(entrades,()=>false);
  expect(projected.map(({item})=>item.id)).toEqual(['product-si','event-si','sistema']);
  expect(font).toHaveLength(6);expect(entrades).toHaveLength(6);
  expect(font.find(i=>i.id==='product-no').mostrarAlMur).toBe(false);
});

test.each(['mercat','events'])('DTO anònim %s transporta flag SQL al filtre del Mur i conserva la fitxa',seccio=>{
  const rows=[false,true].map((mostrar_al_mur,i)=>({id:`public-${i}`,title:'Pública',mostrar_al_mur,section_id:seccio}));
  const fitxes=rows.map(row=>elementDeMurPublic(row,seccio));
  expect(fitxes).toHaveLength(2);expect(fitxes[0].mostrarAlMur).toBe(false);
  expect(vigentsDalt(fitxes.map(item=>({item})),()=>false).map(({item})=>item.id)).toEqual(['public-1']);
  expect(fitxes.map(i=>i.id)).toEqual(['public-0','public-1']);
});
