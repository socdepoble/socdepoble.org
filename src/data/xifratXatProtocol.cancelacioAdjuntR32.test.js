// @vitest-environment node
import { expect, test } from 'vitest';
import { xifraAdjunt } from './xifratXatProtocol.js';
const FIL='f11f11f1-0000-4000-8000-000000000f11', ADJ='adadadad-0000-4000-8000-0000000000ad', A='0a0a0a0a-0000-4000-8000-00000000000a';
function observa(falla=null) {
  const claus=[];
  const subtle=new Proxy(globalThis.crypto.subtle,{get(target,key){
    if(key===falla)return async()=>{throw new Error(`fallada sintètica ${key}`);};
    const v=Reflect.get(target,key,target);return typeof v==='function'?v.bind(target):v;
  }});
  return {claus,cripto:{subtle,getRandomValues(bytes){globalThis.crypto.getRandomValues(bytes);if(bytes.length===32)claus.push(bytes);return bytes;}}};
}
const entrada={fil:FIL,adjunt:ADJ,emissor:A,bytes:Uint8Array.of(1,2,3),mime:'image/jpeg'};
for(const pas of ['importKey','deriveKey','encrypt','digest']) {
  test(`R32 · si ${pas} falla, la FK que no es lliura queda a zero`,async()=>{
    const {cripto,claus}=observa(pas);
    await expect(xifraAdjunt(cripto,entrada)).rejects.toThrow(`fallada sintètica ${pas}`);
    expect(claus).toHaveLength(1);expect([...claus[0]].every(b=>b===0)).toBe(true);
  });
}
for(const pas of [1,2,3,4]) {
  test(`R32 · cancel·lar l’àmbit en el pas ${pas} no abandona la FK en RAM`,async()=>{
    const {cripto,claus}=observa();let comptador=0;
    await expect(xifraAdjunt(cripto,{...entrada,vigent(){if(++comptador===pas)throw new DOMException('Sessió canviada.','AbortError');}})).rejects.toMatchObject({name:'AbortError'});
    expect(claus).toHaveLength(1);expect([...claus[0]].every(b=>b===0)).toBe(true);
  });
}
test('R32 · amb èxit la FK continua viva per al sobre i dos enviaments tenen FK i IV diferents',async()=>{
  const {cripto}=observa();const a=await xifraAdjunt(cripto,entrada),b=await xifraAdjunt(cripto,entrada);
  try {expect([...a.a.k].some(v=>v!==0)).toBe(true);expect(a.a.k).not.toEqual(b.a.k);expect(a.blob.slice(0,12)).not.toEqual(b.blob.slice(0,12));}
  finally {a.a.k.fill(0);b.a.k.fill(0);}
});
