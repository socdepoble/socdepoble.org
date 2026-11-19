import {expect,test} from 'vitest';
import {normalitzaDenunciaDiligent,normalitzaRevisioDiligent,rebutDenunciaDiligent,transicioDenunciaDiligentPermesa,ESTATS_DENUNCIA_DILIGENT} from './denunciesDiligents.js';
const id='32130000-0000-4000-8000-000000000001';
const report={publicacioId:id,motiu:'altre',detall:' Detailed evidence ',operacioId:id};
test('strict primitives and authority fields rejected without invoking object coercion or getters',()=>{
 expect(normalitzaDenunciaDiligent(report)).toEqual({...report,detall:'Detailed evidence'});
 for(const key of['ownerId','ipHash','estat','tenantId','__proto__','constructor']){
  const v=Object.assign(Object.create(null),report);Object.defineProperty(v,key,{value:'forged',enumerable:true});expect(()=>normalitzaDenunciaDiligent(v)).toThrow();
 }
 for(const field of['publicacioId','motiu','detall','operacioId'])for(const bad of[null,[],{},true,3])expect(()=>normalitzaDenunciaDiligent({...report,[field]:bad})).toThrow();
 let accessed=false;const v={...report};Object.defineProperty(v,'detall',{enumerable:true,get(){accessed=true;throw Error('getter');}});expect(()=>normalitzaDenunciaDiligent(v)).toThrow();expect(accessed).toBe(false);
});
test('five-state machine refuses implicit hiding, reopen, skipped and terminal transitions',()=>{
 expect(ESTATS_DENUNCIA_DILIGENT).toHaveLength(5);
 for(const from of ESTATS_DENUNCIA_DILIGENT)for(const to of ESTATS_DENUNCIA_DILIGENT){
  const v={id,estatEsperat:from,versio:1,estat:to,justificacio:'Human reason',operacioId:id};
  if(transicioDenunciaDiligentPermesa(from,to))expect(normalitzaRevisioDiligent(v)).toEqual(v);else expect(()=>normalitzaRevisioDiligent(v)).toThrow();
 }
 expect(()=>normalitzaRevisioDiligent({id,estatEsperat:'rebuda',versio:1,estat:'en_revisio',justificacio:' ',operacioId:id})).toThrow();
});
test('DTO receipt discards no unknown authority fields silently',()=>{
 expect(rebutDenunciaDiligent({id,estat:'rebuda',versio:1,repetida:false})).toEqual({id,estat:'rebuda',versio:1,repetida:false});
 expect(()=>rebutDenunciaDiligent({id,estat:'rebuda',versio:1,repetida:false,ip_hash:'secret'})).toThrow();
});

test('unbounded primitive text is rejected before normalization; astral codepoints retain the documented limit',()=>{
 expect(()=>normalitzaDenunciaDiligent({...report,detall:'x'.repeat(1000000)})).toThrow();
 expect(normalitzaDenunciaDiligent({...report,detall:'😀'.repeat(1000)}).detall).toHaveLength(2000);
 expect(()=>normalitzaDenunciaDiligent({...report,detall:'😀'.repeat(1001)})).toThrow();
});
