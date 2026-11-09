import {beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({invoke:vi.fn(),user:{id:'10000000-0000-4000-8000-000000000001'}}));
vi.mock('./config.js',()=>({getClient:async()=>({functions:{invoke:mocks.invoke}})}));
vi.mock('./runtime.js',()=>({getCurrentUser:()=>mocks.user}));
import {consultaIAIA} from './iaia.js';
const requestId='20000000-0000-4000-8000-000000000001';const input={mode:'direct',question:'Hola',requestId};
beforeEach(()=>{mocks.user={id:'10000000-0000-4000-8000-000000000001'};mocks.invoke.mockReset();});
it('Edge adapter carries only strict DTO and signal through authenticated client; actual response required',async()=>{mocks.invoke.mockResolvedValue({data:{source:'model',inference:true,text:'Answer',requestId}});const c=new AbortController();expect((await consultaIAIA(input,{signal:c.signal})).text).toBe('Answer');expect(mocks.invoke).toHaveBeenCalledWith('iaia',{body:{...input,language:'ca'},signal:c.signal});mocks.invoke.mockResolvedValue({data:{accepted:true,requestId}});await expect(consultaIAIA(input)).rejects.toMatchObject({code:'IAIA_RESPONSE'});});
it('Edge adapter rejects absent identity, postawait identity change, cancellation and browser authority fields',async()=>{mocks.user=null;await expect(consultaIAIA(input)).rejects.toMatchObject({code:'IAIA_AUTH'});mocks.user={id:requestId};mocks.invoke.mockImplementation(async()=>{mocks.user=null;return {data:{source:'model',inference:true,text:'Late',requestId}};});await expect(consultaIAIA(input)).rejects.toMatchObject({name:'AbortError'});mocks.user={id:requestId};await expect(consultaIAIA({...input,tenantId:requestId})).rejects.toMatchObject({code:'IAIA_INVALID'});});
