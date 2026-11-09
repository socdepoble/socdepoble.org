import {act,cleanup,renderHook} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const api=vi.hoisted(()=>({cap:vi.fn(),load:vi.fn(),pub:vi.fn()}));
vi.mock('../../data/backendPort.js',()=>({teCapacitat:api.cap,loadRitmeXat:api.load,actualitzaPresenciaXat:api.pub}));
import {useRitmeXat} from './useRitmeXat.js';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const props={fil:{id:id(3),tipus:'directe',participant:true,potEscriure:true},joId:id(1),modeDades:'remote',senseSessio:false,ambit:'A',config:{}};
beforeEach(()=>{vi.useFakeTimers();vi.clearAllMocks();vi.spyOn(document,'hasFocus').mockReturnValue(true);api.cap.mockReturnValue(true);api.load.mockResolvedValue({rebutPelsAltresFinsSeq:12,llegitPelsAltresFinsSeq:5,escrivint:[]});api.pub.mockResolvedValue({acceptat:true});});
afterEach(async()=>{cleanup();await act(async()=>{await vi.advanceTimersByTimeAsync(0);});vi.useRealTimers();vi.restoreAllMocks();});
it.each([{modeDades:'seed'},{modeDades:'local'},{senseSessio:true},{joId:null},{fil:{...props.fil,participant:false}},{fil:{...props.fil,perDefecte:'javi'}},{fil:{...props.fil,filLocalIAIA:true}}])('ineligible scope never publishes or polls',async patch=>{
 const {result}=renderHook(()=>useRitmeXat({...props,...patch}));await act(async()=>{await vi.advanceTimersByTimeAsync(9000);});result.current.onEscrivint(true);expect(api.load).not.toHaveBeenCalled();expect(api.pub).not.toHaveBeenCalled();expect(result.current.ritme.rebutPelsAltresFinsSeq).toBe(0);
});
it('absent capability fails closed without contacting any server',async()=>{api.cap.mockReturnValue(false);renderHook(()=>useRitmeXat(props));await act(async()=>{await vi.advanceTimersByTimeAsync(9000);});expect(api.load).not.toHaveBeenCalled();});
it('scoped hook returns server evidence, clears old state on actor/scope switch and orders own-instance cleanup',async()=>{
 const {result,rerender,unmount}=renderHook(p=>useRitmeXat(p),{initialProps:props});await act(async()=>{await vi.advanceTimersByTimeAsync(0);});expect(result.current.ritme.rebutPelsAltresFinsSeq).toBe(12);
 act(()=>result.current.onEscrivint(true));await act(async()=>{await vi.advanceTimersByTimeAsync(0);});expect(api.pub.mock.calls[0][2].ritmeActorId).toBe(id(1));
 api.load.mockImplementation(()=>new Promise(()=>{}));rerender({...props,joId:id(2),ambit:'B'});expect(result.current.ritme.rebutPelsAltresFinsSeq).toBe(0);await act(async()=>{await vi.advanceTimersByTimeAsync(0);});expect(api.pub.mock.calls.at(-1)[1].escrivint).toBe(false);expect(api.pub.mock.calls.at(-1)[2].ritmeActorId).toBe(id(1));unmount();
});
it('IAIA never publishes human typing, even when its real delivery data is supported',async()=>{
 const {result}=renderHook(()=>useRitmeXat({...props,fil:{...props.fil,tipus:'iaia',esIA:true}}));await act(async()=>{await vi.advanceTimersByTimeAsync(0);});result.current.onEscrivint(true);expect(api.pub).not.toHaveBeenCalled();expect(api.load).toHaveBeenCalledOnce();
});

it('reopening a thread reuses this document instance and monotonically advances revisions',async()=>{
 const {result,rerender}=renderHook(p=>useRitmeXat(p),{initialProps:props});await act(async()=>{await vi.advanceTimersByTimeAsync(0);});act(()=>result.current.onEscrivint(true));await act(async()=>{await vi.advanceTimersByTimeAsync(0);});
 const first=api.pub.mock.calls.at(-1)[1];rerender({...props,fil:{...props.fil,id:id(4)}});await act(async()=>{await vi.advanceTimersByTimeAsync(0);});rerender(props);await act(async()=>{await vi.advanceTimersByTimeAsync(0);});act(()=>result.current.onEscrivint(true));await act(async()=>{await vi.advanceTimersByTimeAsync(0);});const last=api.pub.mock.calls.at(-1)[1];expect(last.instancia).toBe(first.instancia);expect(last.revisio).toBeGreaterThan(first.revisio);
});
