import { expect,test,vi } from 'vitest';
import { creaEmissorRebutsEntrega } from './rebutsEntregaXat.js';
test('XC-05: agrupa l’entrega sense lectura i avança el rebut monotònic',async()=>{
 let resol;const envia=vi.fn((_id,c)=>new Promise(r=>{resol=()=>r({rebutFinsSeq:c.rebutFinsSeq});}));
 const emissor=creaEmissorRebutsEntrega(envia),signal=new AbortController().signal;
 const primera=emissor.rebut('fil',2,{signal});emissor.rebut('fil',4,{signal});
 expect(envia).toHaveBeenCalledTimes(1);expect(envia.mock.calls[0][1]).toMatchObject({rebutFinsSeq:2,llegitFinsSeq:0});
 resol();await Promise.resolve();expect(envia).toHaveBeenCalledTimes(2);resol();expect(await primera).toBe(true);
 await emissor.rebut('fil',3,{signal});expect(envia).toHaveBeenCalledTimes(2);
});
test('XC-05: un error es reintenta en la lectura següent, un abort no contamina una sessió nova',async()=>{
 const envia=vi.fn().mockRejectedValueOnce(new Error('offline')).mockImplementation(async(_id,c)=>({rebutFinsSeq:c.rebutFinsSeq}));
 const emissor=creaEmissorRebutsEntrega(envia),ac=new AbortController();
 expect(await emissor.rebut('fil',5,{signal:ac.signal})).toBe(false);
 expect(await emissor.rebut('fil',5,{signal:ac.signal})).toBe(true);ac.abort();
 expect(await emissor.rebut('fil',6,{signal:ac.signal})).toBe(false);
 expect(await emissor.rebut('fil',2,{signal:new AbortController().signal})).toBe(true);
 expect(envia).toHaveBeenCalledTimes(3);
});
test('XC-05: una RPC absent no es reintenta fins a una sessió nova', async () => {
  const envia = vi.fn().mockRejectedValue(Object.assign(new Error('No disponible'), { code: 'SENSE_CAPACITAT_REBUTS' }));
  const emissor = creaEmissorRebutsEntrega(envia);
  const signal = new AbortController().signal;
  expect(await emissor.rebut('fil', 2, { signal })).toBe(false);
  expect(await emissor.rebut('fil', 3, { signal })).toBe(false);
  expect(envia).toHaveBeenCalledTimes(1);
  expect(await emissor.rebut('fil', 3, { signal: new AbortController().signal })).toBe(false);
  expect(envia).toHaveBeenCalledTimes(2);
});
