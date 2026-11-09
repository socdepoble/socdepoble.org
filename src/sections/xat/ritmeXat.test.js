import {afterEach,describe,expect,it,vi} from 'vitest';
import {creaSessioRitmeXat} from './ritmeXat.js';
import {derivaEstat} from './missatges.js';
import {validaRitmeXat} from '../../data/xatRitme.js';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const empty={rebutPelsAltresFinsSeq:0,llegitPelsAltresFinsSeq:0,escrivint:[]};
let sessions=[];
afterEach(async()=>{for(const s of sessions)s.stop();sessions=[];await Promise.resolve();vi.useRealTimers();});
function lifecycle(overrides={}){
 vi.useFakeTimers();const doc=new EventTarget(),win=new EventTarget();doc.visibilityState='visible';doc.hasFocus=()=>true;
 const load=vi.fn().mockResolvedValue(empty),publica=vi.fn().mockResolvedValue({acceptat:true}),onChange=vi.fn();
 const s=creaSessioRitmeXat({filId:id(3),instancia:id(9),load,publica,onChange,doc,finestra:win,now:()=>Date.now(),...overrides});sessions.push(s);return {s,doc,win,load:overrides.load??load,publica:overrides.publica??publica,onChange};
}
describe('delivery is authoritative and independent from read',()=>{
 it.each([[null,0,0,'pendent'],[4,0,0,'enviat'],[4,0,4,'lliurat'],[4,4,4,'llegit'],[5,4,4,'enviat']])('seq%s read%s delivered%s ->%s',(seq,read,received,result)=>expect(derivaEstat({seq,sender:'me'},read,received)).toBe(result));
 it('pending/error priority and old contracts never fabricate a second check',()=>{
  expect(derivaEstat({seq:1,sender:'me',estatEnviament:'error'},9,9)).toBe('error');
  expect(derivaEstat({seq:1,sender:'me',estatEnviament:'pendent'},9,9)).toBe('pendent');
  expect(derivaEstat({seq:1,sender:'me'},0)).toBe('enviat');
  expect(derivaEstat({seq:1,sender:'other'},9,9)).toBe('enviat');
 });
 it.each([{...empty,rebutPelsAltresFinsSeq:-1},{...empty,llegitPelsAltresFinsSeq:1},{...empty,escrivint:[{usuariId:id(1),vigentMs:8001}]},{...empty,escrivint:[{usuariId:id(1),vigentMs:1},{usuariId:id(1),vigentMs:2}]}])('invalid server evidence fails closed',value=>expect(()=>validaRitmeXat(value)).toThrow());
});
describe('server typing lifecycle',()=>{
 it('does not publish from mounting, polls at most once each3s and never sends draft text',async()=>{
  const {s,load,publica}=lifecycle();await vi.advanceTimersByTimeAsync(0);expect(load).toHaveBeenCalledTimes(1);expect(publica).not.toHaveBeenCalled();
  s.input(true);await vi.advanceTimersByTimeAsync(0);expect(publica.mock.calls[0][0]).toEqual({instancia:id(9),revisio:1,escrivint:true});
  for(let n=0;n<20;n++)s.input(true);await vi.advanceTimersByTimeAsync(2000);expect(publica).toHaveBeenCalledTimes(2);
  await vi.advanceTimersByTimeAsync(1000);expect(load).toHaveBeenCalledTimes(2);
 });
 it('local inactivity clears own presence rather than fabricating any peer',async()=>{
  const {s,publica,onChange}=lifecycle();await vi.advanceTimersByTimeAsync(0);s.input(true);await vi.advanceTimersByTimeAsync(5001);
  expect(publica.mock.calls.at(-1)[0]).toMatchObject({revisio:2,escrivint:false});expect(onChange.mock.calls.every(([r])=>r.escrivint.length===0)).toBe(true);
 });
 it.each(['blur','visibility','send','unmount'])('cleans own instance on%s with a newer revision',async reason=>{
  const {s,doc,win,publica}=lifecycle();await vi.advanceTimersByTimeAsync(0);s.input(true);await vi.advanceTimersByTimeAsync(0);
  if(reason==='blur')win.dispatchEvent(new Event('blur'));
  if(reason==='visibility'){doc.visibilityState='hidden';doc.dispatchEvent(new Event('visibilitychange'));}
  if(reason==='send')s.input(false);if(reason==='unmount')s.stop();
  await vi.advanceTimersByTimeAsync(0);expect(publica.mock.calls.at(-1)[0]).toMatchObject({revisio:2,escrivint:false});
 });
 it('expires actual peer evidence even if subsequent polling stalls, subtracting response delay',async()=>{
  let resolve;const load=vi.fn().mockImplementationOnce(()=>new Promise(r=>{resolve=r})).mockImplementation(()=>new Promise(()=>{}));
  const {onChange}=lifecycle({load});await vi.advanceTimersByTimeAsync(500);resolve({...empty,escrivint:[{usuariId:id(2),vigentMs:1200}]});await vi.advanceTimersByTimeAsync(0);
  expect(onChange.mock.calls.at(-1)[0].escrivint[0].vigentMs).toBe(700);await vi.advanceTimersByTimeAsync(701);expect(onChange.mock.calls.at(-1)[0].escrivint).toEqual([]);
 });
 it('ignores late responses after unmount and removes event listeners/timers',async()=>{
  let resolve;const {s,onChange}=lifecycle({load:()=>new Promise(r=>{resolve=r})});await vi.advanceTimersByTimeAsync(0);s.stop();resolve({...empty,rebutPelsAltresFinsSeq:10});await vi.advanceTimersByTimeAsync(9000);expect(onChange).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
 });
 it('absent server capability stops polling and never publishes synthetic presence',async()=>{
  const {s,load,publica}=lifecycle({load:vi.fn().mockRejectedValue(Object.assign(new Error(),{code:'SENSE_CAPACITAT_RITME'}))});await vi.advanceTimersByTimeAsync(0);s.input(true);await vi.advanceTimersByTimeAsync(30000);expect(load).toHaveBeenCalledTimes(1);expect(publica).not.toHaveBeenCalled();
 });
 it('does not renew presence from a stored nonempty draft without a new input action',async()=>{
  const {publica}=lifecycle();await vi.advanceTimersByTimeAsync(15000);expect(publica).not.toHaveBeenCalled();
 });
});

it('blur stops polling even when document focus observation lags the event',async()=>{
 const {win,load}=lifecycle();await vi.advanceTimersByTimeAsync(0);win.dispatchEvent(new Event('blur'));await vi.advanceTimersByTimeAsync(15000);expect(load).toHaveBeenCalledTimes(1);win.dispatchEvent(new Event('focus'));await vi.advanceTimersByTimeAsync(0);expect(load).toHaveBeenCalledTimes(2);
});
