import { StrictMode } from 'react';
import { render, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import useXifratXat from './useXifratXat.js';
import { creaServeiAmbitXat } from '../../data/xifratXat.js';
import { registraServeiXifratXat } from '../../data/xifratXatServei.js';
import { backendScope } from '../../config/backendConfig.js';
const m=vi.hoisted(()=>({backend:null}));
vi.mock('../../data/backendPort.js',()=>({getBackendImplementation:()=>m.backend}));
vi.mock('../../config/xifratXat.js',async(importOriginal)=>({...await importOriginal(),E2EE_ACTIU_PER_DEFECTE:true}));
const A='aaaaaaaa-1111-4111-8111-111111111111',B='bbbbbbbb-2222-4222-8222-222222222222';
const config={backendId:'supabase',supabaseUrl:'https://backend.example.test',dataMode:'remote'};
let sincronitza,servei;
function Sonda({actor=`persona::${A}`,jwt=1}){
 void jwt;
 sincronitza=useXifratXat({config,joId:A,ambitEstable:JSON.stringify([backendScope(config),A,actor])});return null;
}
const arbre=(props={})=><StrictMode><Sonda {...props}/></StrictMode>;
beforeEach(()=>{m.backend={};servei=creaServeiAmbitXat();registraServeiXifratXat(m.backend,servei);});
afterEach(cleanup);
test('un callback A antic no reconnecta després de A→B→A',()=>{
 const v=render(arbre()),antic=sincronitza;v.rerender(arbre({actor:`entitat::${B}`}));v.rerender(arbre());const estat=servei.estatAmbit();
 expect(antic()).toBeNull();expect(servei.estatAmbit()).toEqual(estat);expect(sincronitza()).toBe(servei);
});
test('després de desmuntar cap callback reobri les claus',()=>{
 const v=render(arbre()),antic=sincronitza;v.unmount();expect(antic()).toBeNull();expect(servei.estatAmbit().clauIdentitat).toBeNull();
});
test('renovar JWT conserva callback i generacions',()=>{
 const v=render(arbre()),antic=sincronitza,estat=servei.estatAmbit();v.rerender(arbre({jwt:2}));expect(sincronitza).toBe(antic);expect(servei.estatAmbit()).toEqual(estat);
});
test('substituir backend buida la RAM vella abans de connectar el nou',()=>{
 render(arbre());const antiga=servei,op=antiga.captura();m.backend={};servei=creaServeiAmbitXat();registraServeiXifratXat(m.backend,servei);
 expect(sincronitza()).toBe(servei);expect(antiga.vigent(op)).toBe(false);expect(antiga.estatAmbit().clauIdentitat).toBeNull();expect(servei.estatAmbit().clauIdentitat).not.toBeNull();
});
