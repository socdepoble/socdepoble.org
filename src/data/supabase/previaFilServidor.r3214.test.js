import {describe,it,expect} from 'vitest';
import {previaFilServidor} from './previaFilServidor.js';
describe('R32.14 authoritative server preview',()=>{
 it('keeps coherent visible text, time, author and type',()=>{
  expect(previaFilServidor({ultim_text:'visible',ultim_al:'2026-11-19T13:00:00Z',ultim_autor_id:'actor',ultim_tipus:'text'})).toEqual({ultimText:'visible',ultimAl:'2026-11-19T13:00:00Z',ultimAutorId:'actor',ultimTipus:'text'});
 });
 it('all hidden stays explicitly empty before the client loads history',()=>{
  expect(previaFilServidor({ultim_text:null,ultim_al:null,ultim_autor_id:null,ultim_tipus:null})).toEqual({ultimText:null,ultimAl:null,ultimAutorId:null,ultimTipus:null});
 });
 it('explicit null type also wins over stale camelCase type',()=>{
  expect(previaFilServidor({ultim_tipus:null,ultimTipus:'old'}).ultimTipus).toBe(null);
 });
 it.each([{},[],true,13,()=>'',{toString(){throw Error('must not coerce');}}])('rejects nonprimitive DTO fields',value=>{
  expect(previaFilServidor({ultim_text:value,ultim_al:value,ultim_autor_id:value,ultim_tipus:value})).toEqual({ultimText:null,ultimAl:null,ultimAutorId:null,ultimTipus:null});
 });
});
