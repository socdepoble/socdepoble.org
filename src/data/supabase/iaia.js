import {getClient} from './config.js';
import {getCurrentUser} from './runtime.js';
import {capturaConsultaIAIA,validaRespostaIAIA,errorIAIA} from '../iaiaProtocol.js';
export async function consultaIAIA(input,config={}){
  const captured=capturaConsultaIAIA(input),actor=getCurrentUser()?.id;if(!actor)throw errorIAIA('IAIA_AUTH',401);
  if(config.signal?.aborted)throw config.signal.reason;
  const client=await getClient(config);
  if(getCurrentUser()?.id!==actor)throw new DOMException('Scope changed','AbortError');
  const {data,error}=await client.functions.invoke('iaia',{body:captured,signal:config.signal});
  if(config.signal?.aborted)throw config.signal.reason;
  if(getCurrentUser()?.id!==actor)throw new DOMException('Scope changed','AbortError');
  if(error)throw errorIAIA('IAIA_UNAVAILABLE',503);
  return validaRespostaIAIA(data,captured);
}
