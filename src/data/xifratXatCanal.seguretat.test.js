// @vitest-environment node
import { test, expect, vi } from 'vitest';
import { CONTRACTE_NUCLI } from './contracte.js';
import { validaBackendImplementation } from './backendPort.js';
import { ambXifratXat, serveiXifratXat } from './xifratXat.js';
const core = (extres = {}) => ({...Object.fromEntries(CONTRACTE_NUCLI.map(n => [n, vi.fn()])), ...extres});
const actiu = () => ({actiu: true, isSecureContext: true, origen: 'https://socdepoble.org', cripto: {subtle: {digest(){}}}, indexedDB: {open(){}}});
test('flag false conserva identitat exacta i no inspecciona capacitats', () => {
 const impl = core(); Object.defineProperty(impl,'enviaXifratXat',{enumerable:true,get(){throw Error('getter');}});
 expect(ambXifratXat(impl)).toBe(impl); expect(ambXifratXat(impl,{actiu:false})).toBe(impl);
});
test('mode local conserva identitat encara que la configuració active el flag', () => {
 const impl = core(); expect(ambXifratXat(impl,{actiu:true,modeDades:'local'})).toBe(impl);
});
test('la validació i el segellat conserven el servei exacte sense ampliar transport', () => {
 const d = ambXifratXat(core(),actiu()); const servei=serveiXifratXat(d); const validat=validaBackendImplementation(d).candidate;
 expect(Object.isFrozen(validat)).toBe(true); expect(serveiXifratXat(validat)).toBe(servei);
 expect(Object.keys(validat)).not.toContain('servei'); expect(validat.fixaAmbit).toBeUndefined();
});
test('dos backends no comparteixen servei i desconeguts no reben l’últim servei', () => {
 const a=ambXifratXat(core(),actiu()), b=ambXifratXat(core(),actiu());
 const va=validaBackendImplementation(a).candidate,vb=validaBackendImplementation(b).candidate;
 expect(serveiXifratXat(va)).toBe(serveiXifratXat(a)); expect(serveiXifratXat(vb)).toBe(serveiXifratXat(b));
 expect(serveiXifratXat(va)).not.toBe(serveiXifratXat(vb)); expect(serveiXifratXat()).toBeNull();
 const desconegut={get servei(){throw Error('no llegir getter');}};expect(serveiXifratXat(desconegut)).toBeNull();
});
test('tornar a decorar no substituïx el servei de l’embolcall anterior',()=>{
 const impl=core(),a=ambXifratXat(impl,actiu()),b=ambXifratXat(impl,actiu());
 expect(serveiXifratXat(a)).not.toBe(serveiXifratXat(b));expect(serveiXifratXat(impl)).toBeNull();
});
test('sense transport o pipeline privat no cau mai al transport en clar',async()=>{
 const id='dddddddd-3333-4000-8000-000000000003';
 for(const ambCapacitat of [false,true]){
  const enviaMissatge=vi.fn(),enviaXifratXat=vi.fn();
  const impl=core({enviaMissatge,loadFils:async()=>[{id,tipus:'directe',altres:[{id:'bbbbbbbb-2222-4000-8000-000000000002',tipus:'persona'}]}],...(ambCapacitat?{enviaXifratXat}:{})});
  const d=ambXifratXat(impl,actiu());serveiXifratXat(d).fixaAmbit({ambitEstable:'a',clauIdentitat:'i'});
  await expect(d.enviaMissatge(id,{text:'dada sintètica'})).rejects.toHaveProperty('codi',ambCapacitat?'clar-rebutjat':'sense-capacitat-e2ee');
  expect(enviaMissatge).not.toHaveBeenCalled();expect(enviaXifratXat).not.toHaveBeenCalled();
 }
});

test('un preparador que retorna text no pot lliurar-lo a cap transport',async()=>{
 const id='dddddddd-3333-4000-8000-000000000003',enviaMissatge=vi.fn(),enviaXifratXat=vi.fn();
 const impl=core({enviaMissatge,enviaXifratXat,loadFils:async()=>[{id,tipus:'directe',altres:[{id:'bbbbbbbb-2222-4000-8000-000000000002',tipus:'persona'}]}]});
 const d=ambXifratXat(impl,{...actiu(),preparaSobreXifrat:async()=>({text:'dada sintètica malformada'})});
 serveiXifratXat(d).fixaAmbit({ambitEstable:'a',clauIdentitat:'i'});
 await expect(d.enviaMissatge(id,{text:'dada sintètica'})).rejects.toHaveProperty('codi','clar-rebutjat');
 expect(enviaMissatge).not.toHaveBeenCalled();expect(enviaXifratXat).not.toHaveBeenCalled();
});
