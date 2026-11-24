import {afterEach,expect,test} from 'vitest';
import {_reiniciaTransicioDeDocument,enTransicioDeDocument,marcaTransicioDeDocument} from './lazyRoute.js';
afterEach(_reiniciaTransicioDeDocument);
test('C7 · un rellotge tornat arrere no conserva una transició futura ni allarga la nova',()=>{
 marcaTransicioDeDocument(10000,5000);expect(enTransicioDeDocument(10001)).toBe(true);
 expect(enTransicioDeDocument(9000)).toBe(false);
 marcaTransicioDeDocument(9000,5000);expect(enTransicioDeDocument(13999)).toBe(true);expect(enTransicioDeDocument(14000)).toBe(false);
});
test('C7 · sense cap marca no hi ha transició encara amb instant negatiu o NaN',()=>{
 expect(enTransicioDeDocument(-1000)).toBe(false);expect(enTransicioDeDocument(NaN)).toBe(false);
});
