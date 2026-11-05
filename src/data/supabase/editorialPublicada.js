import {getCurrentUser,getResolvedConfig,rpc} from './runtime.js';
import {versioSessio} from '../identitat.js';
import {capturaEdicioEditorial,CLAU_EDITORIAL_DE_SECCIO} from '../editorialPublicada.js';
export async function adminActualitzaPublicacioEditorial(input,config={}){
  const edicio=capturaEdicioEditorial(input),resolt=getResolvedConfig(config),epoch=versioSessio;
  if(!getCurrentUser()?.id)throw Object.assign(new Error('Cal iniciar sessió.'),{code:'sense-sessio'});
  if(resolt.runtimeDataMode!=='remote'||!resolt.hasSupabaseConfig||!resolt.tenantId)throw Object.assign(new Error('L’edició editorial requerix un servidor configurat.'),{code:'no-disponible'});
  let result;
  try{result=await rpc('admin_actualitza_publicacio_editorial',{p_seccio:edicio.seccio,p_id:edicio.id,p_canvis:edicio.canvis,p_versio:edicio.versio,p_tenant_id:resolt.tenantId},config,{signal:config.signal});}
  catch(cause){if(cause?.name==='AbortError')throw cause;const text=String(cause?.message||'');const code=text.includes('SDP-ADMIN-006')?'conflicte-versio':text.includes('SDP-ADMIN-003')?'cal-segon-factor':(text.includes('SDP-EDITORIAL-004')||cause?.status===404)?'no-disponible':'editorial-error';throw Object.assign(new Error(code==='conflicte-versio'?'La publicació ha canviat. Recarrega abans de desar.':'No s’ha pogut desar la publicació editorial.'),{code,codi:code,cause});}
  if(epoch!==versioSessio||config.signal?.aborted)throw new DOMException('La sessió ha canviat.','AbortError');
  if(result?.item?.id!==edicio.id||result.item._editorialClau!==CLAU_EDITORIAL_DE_SECCIO[edicio.seccio]||!Number.isSafeInteger(result.versio)||result.versio!==edicio.versio+1||result.item._editorialVersio!==result.versio)throw new TypeError('Resposta editorial invàlida.');
  return result;
}
