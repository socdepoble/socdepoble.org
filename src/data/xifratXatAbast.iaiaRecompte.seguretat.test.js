// @vitest-environment node
import { expect, test, vi } from 'vitest';
import { ambitDelFil } from './xifratXatAbast.js';
import { ambXifratXat, serveiXifratXat } from './xifratXat.js';
import { CONTRACTE_NUCLI } from './contracte.js';
import { IAIA_UUID } from '../config/xifratXat.js';
const FIL='dddddddd-3333-4333-8333-333333333333',JO='aaaaaaaa-1111-4111-8111-111111111111';
const fil=(extres={})=>({id:FIL,tipus:'directe',altres:[{id:IAIA_UUID,tipus:'persona'}],...extres});
test.each([undefined,null,2])('IAIA 1:1 conserva el cas coherent amb recompte %s',participants=>{
 expect(ambitDelFil(fil({participants}))).toMatchObject({xifrat:false,bloquejat:false,motiu:'iaia'});
});
test.each([0,1,3,-1,2.5,NaN,Infinity,'2','3',true,{}])('un recompte explícit incoherent (%s) impedix l’excepció IAIA en clar',participants=>{
 expect(ambitDelFil(fil({participants}))).toMatchObject({xifrat:true,obligatori:true,bloquejat:true,motiu:'iaia-injectada'});
});
test('una persona addicional continua bloquejada encara que el recompte diga dos',()=>{
 expect(ambitDelFil(fil({participants:2,altres:[{id:IAIA_UUID,tipus:'persona'},{id:JO,tipus:'persona'}]}))).toMatchObject({bloquejat:true});
});
test('un altre directe humà continua dins d’abast xifrat',()=>{
 expect(ambitDelFil(fil({participants:2,altres:[{id:JO,tipus:'persona'}]}))).toMatchObject({xifrat:true,bloquejat:false,motiu:'directe-persona'});
});
test('el llistat antic de contraparts continua sent fallback quan no hi ha altres',()=>{
 expect(ambitDelFil({id:FIL,tipus:'directe',participants:[{id:IAIA_UUID,tipus:'persona'}]})).toMatchObject({xifrat:false,bloquejat:false,motiu:'iaia'});
});
test('una llista de participants no suplanta el recompte del descriptor modern amb altres',()=>{
 expect(ambitDelFil(fil({participants:[{id:JO},{id:IAIA_UUID},{id:'bbbbbbbb-2222-4222-8222-222222222222'}]}))).toMatchObject({bloquejat:true,motiu:'iaia-injectada'});
});
test('enviaMissatge no passa al transport en clar quan el recompte IAIA és tres',async()=>{
 const enviaMissatge=vi.fn(async()=>({id:'missatge-propi'})),impl={...Object.fromEntries(CONTRACTE_NUCLI.map(n=>[n,vi.fn()])),loadFils:vi.fn(async()=>[fil({participants:3})]),enviaMissatge};
 const d=ambXifratXat(impl,{actiu:true});serveiXifratXat(d).fixaAmbit({ambitEstable:'ambit-propi',clauIdentitat:JSON.stringify(['supabase','https://backend.example.test',JO])});
 await expect(d.enviaMissatge(FIL,{id:'missatge-propi',text:'control QA sintètic'})).rejects.toMatchObject({codi:'iaia-injectada'});expect(enviaMissatge).not.toHaveBeenCalled();
});
