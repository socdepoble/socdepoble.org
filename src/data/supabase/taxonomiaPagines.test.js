import { beforeEach, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({rpc:vi.fn(),actor:'editor',live:true,backend:true}));
vi.mock('./runtime.js',()=>({rpc:m.rpc,getCurrentUser:()=>m.actor?{id:m.actor}:null,getResolvedConfig:()=>({runtimeDataMode:'remote',hasSupabaseConfig:true,tenantId:'poble'})}));
vi.mock('../identitat.js',()=>({esBackendDeSessio:()=>m.backend,capturaSessio:()=>()=>{if(!m.live)throw new DOMException('Sessió canviada','AbortError');}}));
import { actualitzaTaxonomiaPagina, lligTaxonomiaPagina } from './taxonomiaPagines.js';
const patch=()=>({categoriesSistema:['Mur'],etiquetes:['Idees']});
beforeEach(()=>{m.rpc.mockReset();m.actor='editor';m.live=true;m.backend=true;});
it('no envia JSONB hostil ni mutacions sense sessió, i conserva la denegació de servidor',async()=>{
 await expect(actualitzaTaxonomiaPagina('legal',{...patch(),etiquetes:[{}]})).rejects.toBeInstanceOf(TypeError);expect(m.rpc).not.toHaveBeenCalled();
 m.actor=null;await expect(actualitzaTaxonomiaPagina('legal',patch())).rejects.toMatchObject({code:'sense-sessio'});expect(m.rpc).not.toHaveBeenCalled();
 /* v1.2.26 · #7 P2 (Gauntlet C26-3) · Abans es fixava l'error cru (rejects.toBe): ara la denegació és el codi del port
    local, amb el missatge en valencià i el cru a `cause`. */
 m.actor='veina';const error=Object.assign(new Error('Denegat'),{sqlstate:'42501',status:403});m.rpc.mockRejectedValueOnce(error);
 await expect(actualitzaTaxonomiaPagina('legal',patch())).rejects.toMatchObject({code:'sense-permis',codi:'sense-permis',status:403,cause:error,message:'Cal administració editorial de Sóc de Poble.'});
});
it('l’ACK es projecta a primitius, comprova id/revisió i no lliura res després d’un canvi de sessió',async()=>{
 const row={idPagina:'legal',...patch(),categoriesTematiques:[],geografia:{},mencions:[],versio:1};m.rpc.mockResolvedValue(row);
 expect(await actualitzaTaxonomiaPagina('legal',patch())).toEqual(row);
 expect(await lligTaxonomiaPagina('legal')).toEqual(row);
 m.rpc.mockResolvedValue({...row,versio:3});await expect(actualitzaTaxonomiaPagina('legal',patch())).rejects.toThrow(TypeError);
 m.rpc.mockImplementation(async()=>{m.live=false;return row;});await expect(actualitzaTaxonomiaPagina('legal',patch())).rejects.toMatchObject({name:'AbortError'});
});
/* v1.2.26 · #7 P2 (Gauntlet C26-3) · El remot distingix «algú ha canviat la pàgina» d'una fallada genèrica, com el local. */
it('40001 (o un 409) és conflicte-versio i 42501 és sense-permis, també en llegir; la resta passa crua',async()=>{
 for(const causa of[Object.assign(new Error('La pàgina ha canviat.'),{sqlstate:'40001',status:400}),Object.assign(new Error('Conflict'),{status:409})]){
  m.rpc.mockRejectedValueOnce(causa);
  await expect(actualitzaTaxonomiaPagina('legal',{...patch(),versio:2})).rejects.toMatchObject({code:'conflicte-versio',status:409,cause:causa,message:'La pàgina ha canviat. Recarrega abans de desar.'});
 }
 const denegada=Object.assign(new Error('Denegat'),{postgrestCode:'42501',status:401});m.rpc.mockRejectedValueOnce(denegada);
 await expect(lligTaxonomiaPagina('legal')).rejects.toMatchObject({code:'sense-permis',cause:denegada});
 const invalida=Object.assign(new Error('Taxonomia invàlida.'),{sqlstate:'22023',status:400});m.rpc.mockRejectedValueOnce(invalida);
 await expect(actualitzaTaxonomiaPagina('legal',patch())).rejects.toBe(invalida);
 const avortada=new DOMException('Avortat','AbortError');m.rpc.mockRejectedValueOnce(avortada);
 await expect(lligTaxonomiaPagina('legal')).rejects.toBe(avortada);
});
/* v1.2.26 · #7 P2 (Gauntlet C26-3) · La guarda posterior és la T2 d'xatCerca: si el poble o el backend canvien en vol,
   cap resultat ni cap error traduït arriba a la vista equivocada. */
it('un canvi de backend o de poble en vol, o abans de la RPC, avorta sense lliurar la fila',async()=>{
 const row={idPagina:'legal',...patch(),categoriesTematiques:[],geografia:{},mencions:[],versio:1};
 m.rpc.mockImplementationOnce(async()=>{m.backend=false;return row;});
 await expect(actualitzaTaxonomiaPagina('legal',patch())).rejects.toMatchObject({name:'AbortError'});
 m.backend=true;m.rpc.mockImplementationOnce(async()=>{m.backend=false;throw Object.assign(new Error('Conflicte'),{sqlstate:'40001'});});
 await expect(actualitzaTaxonomiaPagina('legal',patch())).rejects.toMatchObject({name:'AbortError'});
 m.rpc.mockClear();await expect(lligTaxonomiaPagina('legal')).rejects.toMatchObject({name:'AbortError'});expect(m.rpc).not.toHaveBeenCalled();
 m.backend=true;const control=new AbortController();control.abort();
 await expect(lligTaxonomiaPagina('legal',{signal:control.signal})).rejects.toMatchObject({name:'AbortError'});expect(m.rpc).not.toHaveBeenCalled();
});
