// @vitest-environment node
import { test, expect } from 'vitest';
import { webcrypto } from 'node:crypto';
import { creaMotorCopiaSeguretatXatV1225 } from './costuraCopiaSeguretat.js';
import { creaMagatzemRestauracioXat, exportaConversesCompletes } from './restauraCopiaSeguretat.js';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
const U='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',F='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',M='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const abast={usuariId:U,tenantId:F};
const m={id:M,filId:F,seq:1,text:'Text autenticat',creatAl:'2026-11-25T03:00:00.000Z'};
const clau='Contrasenya de prova prou llarga';
const guarda=()=>{};
const copia=()=>exportaConversesCompletes({...abast,fils:[{id:F}],carregaPagina:async()=>[m],contrasenya:clau,cripto:webcrypto,comprovaAmbit:guarda});
const prepara=()=>{
 const idb=creaIdbFalsEstructurat();
 const magatzem=creaMagatzemRestauracioXat({...abast,indexedDB:idb});
 const motor=creaMotorCopiaSeguretatXatV1225({magatzem,comprovaAmbit:guarda,cripto:webcrypto});
 return {idb,magatzem,motor};
};
test('contracte G1 importa→resum→restaura: cap fila escrita abans de confirmar i recomptes exactes',async()=>{
 const {magatzem,motor}=prepara(),c=await copia();
 const resultat=await motor.importa(c.text,{usuariIdEsperat:U,tenantIdEsperat:F,contrasenya:clau});
 expect(resultat.missatges).toHaveLength(1);expect((await magatzem.llegix()).missatges).toEqual({});
 expect(await motor.restaura(resultat,{abast})).toMatchObject({filsNous:1,missatgesNous:1,duplicatsOmesos:0});
 expect((await magatzem.llegix()).missatges[M].text).toBe('Text autenticat');
 await expect(motor.restaura(resultat,{abast})).rejects.toThrow(/no preparada/);
 const altra=await motor.importa(c.text,{usuariIdEsperat:U,tenantIdEsperat:F,contrasenya:clau});
 expect(await motor.restaura(altra,{abast})).toMatchObject({idempotent:true,filsNous:0,missatgesNous:0,duplicatsOmesos:2});
});
test('[DEFECTE] objecte fals amb autenticada:true i resultat d’una altra instància no s’escriuen',async()=>{
 const {motor,magatzem}=prepara(),c=await copia();
 await expect(motor.restaura({autenticada:true,fils:[{id:F}],missatges:[m]},{abast})).rejects.toThrow();
 const altre=prepara(),r=await altre.motor.importa(c.text,{usuariIdEsperat:U,tenantIdEsperat:F,contrasenya:clau});
 await expect(motor.restaura(r,{abast})).rejects.toThrow();
 expect((await magatzem.llegix()).missatges).toEqual({});
});
test('[DEFECTE] quota i canvi de sessió no es converteixen en èxit local de memòria',async()=>{
 const {idb,magatzem,motor}=prepara(),c=await copia();
 const r=await motor.importa(c.text,{usuariIdEsperat:U,tenantIdEsperat:F,contrasenya:clau});
 idb.omplit=true;
 await expect(motor.restaura(r,{abast})).rejects.toThrow();
 expect((await magatzem.llegix()).missatges).toEqual({});
 let actiu=true;const canvi=creaMotorCopiaSeguretatXatV1225({magatzem,cripto:webcrypto,comprovaAmbit:()=>{if(!actiu)throw new DOMException('Canvi','AbortError');}});
 const r2=await canvi.importa(c.text,{usuariIdEsperat:U,tenantIdEsperat:F,contrasenya:clau});actiu=false;
 await expect(canvi.restaura(r2,{abast})).rejects.toMatchObject({name:'AbortError'});
 expect((await magatzem.llegix()).missatges).toEqual({});
});
test('exportació G1 no simula completa sense el carregador de pàgines',async()=>{
 const {motor}=prepara();await expect(motor.exporta({...abast,fils:[{id:F}],contrasenya:clau})).rejects.toThrow(/hidratador/);
});
test('[DEFECTE] guardes false o async no autoritzen cap lectura ni desxifrat',async()=>{
 for(const comprovaAmbit of [()=>false,async()=>true,async()=>{throw new Error('Revocada');}]) {
  let lectures=0;
  const magatzem={...abast,llegix:async()=>{lectures++;return{copies:{}};},aplica:async()=>{throw new Error('No arribar');}};
  const motor=creaMotorCopiaSeguretatXatV1225({magatzem,comprovaAmbit,cripto:webcrypto});
  await expect(motor.importa('no llegir',{usuariIdEsperat:U,tenantIdEsperat:F,contrasenya:clau})).rejects.toThrow();
  expect(lectures).toBe(0);
  await expect(exportaConversesCompletes({...abast,fils:[{id:F}],carregaPagina:async()=>[],contrasenya:clau,cripto:webcrypto,comprovaAmbit})).rejects.toThrow();
 }
});
test('[DEFECTE] canvi de sessió durant AES no retorna una exportació preparada',async()=>{
 let actiu=true;
 const cripto={getRandomValues:b=>webcrypto.getRandomValues(b),subtle:new Proxy(webcrypto.subtle,{get(target,key){
  if(key==='encrypt')return async(...args)=>{const bytes=await target.encrypt(...args);actiu=false;return bytes;};
  return target[key].bind(target);
 }})};
 await expect(exportaConversesCompletes({...abast,fils:[{id:F}],carregaPagina:async()=>[m],contrasenya:clau,cripto,comprovaAmbit:()=>actiu})).rejects.toThrow(/revocat/);
});
test('[DEFECTE] revocació després put i abans commit avorta totes les files del snapshot',async()=>{
 const c=await copia();
 for(const mode of ['signal','guarda']) {
  const controller=new AbortController();let armat=false,actiu=true,disparat=false;
  const idb=creaIdbFalsEstructurat({clona:valor=>{
   if(armat&&valor?.missatges?.[M]) {armat=false;setImmediate(()=>{disparat=true;actiu=false;if(mode==='signal')controller.abort(new DOMException('Revocada','AbortError'));});}
   return structuredClone(valor);
  }});
  const magatzem=creaMagatzemRestauracioXat({...abast,indexedDB:idb});
  const motor=creaMotorCopiaSeguretatXatV1225({magatzem,cripto:webcrypto,comprovaAmbit:()=>mode==='guarda'?actiu:true,senyal:controller.signal});
  const r=await motor.importa(c.text,{usuariIdEsperat:U,tenantIdEsperat:F,contrasenya:clau});
  armat=true;
  await expect(motor.restaura(r,{abast})).rejects.toThrow();
  expect(disparat).toBe(true);
  const snapshot=await magatzem.llegix();
  expect(snapshot.missatges).toEqual({});expect(snapshot.copies).toEqual({});
 }
});
