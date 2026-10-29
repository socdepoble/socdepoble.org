// @vitest-environment node
import { describe, expect, test, vi } from 'vitest';
import { ambXifratXat, serveiXifratXat } from './xifratXat.js';
import { CONTRACTE_NUCLI } from './contracte.js';
const A='aaaaaaaa-1111-4111-8111-111111111111',B='bbbbbbbb-2222-4222-8222-222222222222';
const FIL='dddddddd-3333-4333-8333-333333333333',ADJUNT='eeeeeeee-4444-4444-8444-444444444444';
const directe={id:FIL,tipus:'directe',altres:[{id:B,tipus:'persona'}]};
const publicFil={id:FIL,tipus:'canal'};
const keys=(actor=`persona::${A}`)=>({ambitEstable:JSON.stringify(['backend-sintetic',A,actor]),clauIdentitat:JSON.stringify(['supabase','https://backend.example.test',A])});
const entrada=()=>({id:ADJUNT,fitxer:new Blob([Uint8Array.of(1,2,3)],{type:'image/jpeg'}),tipus:'foto',text:'peu sintètic'});
const base=(extres={})=>({...Object.fromEntries(CONTRACTE_NUCLI.map(n=>[n,vi.fn()])),...extres});
function configurat(fils=[directe],extres={}){
 const impl=base({loadFils:vi.fn(async()=>fils),publicaAdjuntXat:vi.fn(async()=>({id:ADJUNT})),...extres});
 const d=ambXifratXat(impl,{actiu:true}),s=serveiXifratXat(d);s.fixaAmbit(keys());return {impl,d,s};
}
const ajornada=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};

describe('adjunt privat: guarda explícita abans del transport legacy',()=>{
 test('flagfalse conserva instància, promesa, receptor i arguments',async()=>{
  const op=Promise.resolve({id:ADJUNT}),impl=base({publicaAdjuntXat:vi.fn(function(...args){expect(this).toBe(impl);expect(args).toEqual([FIL,e,c]);return op;})});
  const e=entrada(),c={onProgres:vi.fn()},d=ambXifratXat(impl);expect(d).toBe(impl);expect(d.publicaAdjuntXat(FIL,e,c)).toBe(op);await op;
 });
 test('mode local conserva la instància i el comportament existent',()=>{
  const impl=base({publicaAdjuntXat:vi.fn()});expect(ambXifratXat(impl,{actiu:true,modeDades:'local'})).toBe(impl);
 });
 test('públic verificat pel registre propi conserva entrada, config i receptor',async()=>{
  const e=entrada(),c={onProgres:vi.fn()},raw={id:ADJUNT};let impl;
  ({impl}=configurat([publicFil],{publicaAdjuntXat:vi.fn(async function(id,cos,config){expect(this).toBe(impl);expect(id).toBe(FIL);expect(cos).toBe(e);expect(config).toBe(c);return raw;})}));
  const d=ambXifratXat(impl,{actiu:true});serveiXifratXat(d).fixaAmbit(keys());await expect(d.publicaAdjuntXat(FIL,e,c)).resolves.toBe(raw);expect(impl.publicaAdjuntXat).toHaveBeenCalledOnce();
 });
 test.each([['directe humà',directe],['directe entitat',{id:FIL,tipus:'directe',org_id:B}],['grup privat',{id:FIL,tipus:'grup'}],['personal',{id:FIL,tipus:'personal'}]])('%s no publica bytes sense pipeline verificat',async(_,fil)=>{
  const {d,impl}=configurat([fil]);await expect(d.publicaAdjuntXat(FIL,entrada())).rejects.toMatchObject({codi:'adjunt-xifrat-pendent',id:ADJUNT,reintentable:false});expect(impl.publicaAdjuntXat).not.toHaveBeenCalled();
 });
 test('fil desconegut no arriba al transport',async()=>{
  const {d,impl}=configurat([]);await expect(d.publicaAdjuntXat(FIL,entrada())).rejects.toMatchObject({codi:'fil-desconegut'});expect(impl.publicaAdjuntXat).not.toHaveBeenCalled();
 });
 test('sense àmbit no carrega ni publica',async()=>{
  const impl=base({loadFils:vi.fn(async()=>[directe]),publicaAdjuntXat:vi.fn(async()=>({id:ADJUNT}))}),d=ambXifratXat(impl,{actiu:true});
  await expect(d.publicaAdjuntXat(FIL,entrada())).rejects.toMatchObject({codi:'sense-ambit'});expect(impl.loadFils).not.toHaveBeenCalled();expect(impl.publicaAdjuntXat).not.toHaveBeenCalled();
 });
 test('un objecte aportat pel cridant no declara públic el fil privat',async()=>{
  const {d,impl}=configurat([directe]);await expect(d.publicaAdjuntXat({id:FIL,tipus:'canal'},entrada())).rejects.toMatchObject({codi:'fil-desconegut'});expect(impl.publicaAdjuntXat).not.toHaveBeenCalled();
 });
 test('la marca apegalosa impedix reclassificar un fil com a públic',async()=>{
  const {d,impl,s}=configurat([publicFil]);s.anotaFilAlRegistre({...directe,e2eeObligatori:true});s.fixaAmbit(keys(`entitat::${B}`));
  await expect(d.publicaAdjuntXat(FIL,entrada())).rejects.toMatchObject({codi:'rebaixa-apegalos'});expect(impl.publicaAdjuntXat).not.toHaveBeenCalled();
 });
 test.each(['actor','aba','destroy'])('%s durant la lectura del fil avorta abans de registrar o publicar',async(canvi)=>{
  const espera=ajornada(),{d,impl,s}=configurat([],{loadFils:vi.fn(()=>espera.promise)});const op=d.publicaAdjuntXat(FIL,entrada());
  if(canvi==='destroy')d.destroy();else{s.fixaAmbit(keys(`entitat::${B}`));if(canvi==='aba')s.fixaAmbit(keys());}
  espera.resolve([publicFil]);await expect(op).rejects.toMatchObject({name:'AbortError'});expect(impl.publicaAdjuntXat).not.toHaveBeenCalled();expect(s.obtindreFilRegistrat(FIL)).toBeNull();
 });
 test('renovació JWT durant la lectura conserva l’operació del mateix àmbit',async()=>{
  const espera=ajornada(),{d,impl,s}=configurat([],{loadFils:vi.fn(()=>espera.promise)});const op=d.publicaAdjuntXat(FIL,entrada());s.fixaAmbit({...keys()});espera.resolve([publicFil]);await expect(op).resolves.toEqual({id:ADJUNT});expect(impl.publicaAdjuntXat).toHaveBeenCalledOnce();
 });
 test('tindre un transport xifrat no substituïx el pipeline que falta',async()=>{
  const xifrat=vi.fn(),{d,impl}=configurat([directe],{publicaAdjuntXifratXat:xifrat});
  await expect(d.publicaAdjuntXat(FIL,entrada())).rejects.toMatchObject({codi:'adjunt-xifrat-pendent'});expect(xifrat).not.toHaveBeenCalled();expect(impl.publicaAdjuntXat).not.toHaveBeenCalled();
 });
 test('no amplia un backend que no exposa la capacitat d’adjunts',()=>{
  const d=ambXifratXat(base(),{actiu:true});expect(d.publicaAdjuntXat).toBeUndefined();
 });
});
