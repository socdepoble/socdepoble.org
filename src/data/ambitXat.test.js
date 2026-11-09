import {expect,it} from 'vitest';
import * as neutral from './ambitXat.js';
import * as legacy from './xifratXatAbast.js';
import {E2EE_ACTIU_PER_DEFECTE} from '../config/xifratXat.js';
const id='10000000-0000-4000-8000-000000000001';
it('neutral policy and legacy API share exact function identities, with no second classifier',()=>{expect(Object.keys(neutral).sort()).toEqual(['ambitDelFil','esFilSintetic','teMarcaApegalosa']);expect(Object.keys(legacy).sort()).toEqual(Object.keys(neutral).sort());for(const name of Object.keys(neutral))expect(legacy[name]).toBe(neutral[name]);});
it('private and unknown conversation policy stays fail-closed independently of the off encryption feature flag',()=>{expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);for(const fil of [null,{}, {id,tipus:'grup'},{id,tipus:'personal'},{id,tipus:'directe',altres:[{id:'human'}]}])expect(neutral.ambitDelFil(fil).xifrat).toBe(true);expect(neutral.ambitDelFil({id,tipus:'grup',subjecte:{tipus:'pagina',id:'/public'}}).xifrat).toBe(false);});
it.each([{epocaActual:1},{epoca_actual:1},{capEpoca:'signed'},{cap_epoca_hash:'signed'},{e2eeDesDeSeq:0},{e2ee_des_de_seq:1},{e2eeObligatori:true},{e2ee_obligatori:true}])('sticky state %j cannot be downgraded by a public subject or off feature flag',sticky=>{const fil={id,tipus:'grup',subjecte:{tipus:'pagina',id:'/public'},...sticky};const result=neutral.ambitDelFil(fil);expect(result).toMatchObject({xifrat:true,bloquejat:true,apegalos:true,motiu:'rebaixa-apegalos'});expect(Object.isFrozen(result)).toBe(true);});
