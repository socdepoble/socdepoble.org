import {capturaConsultaIAIA,errorIAIA,idIAIA} from '../../../src/data/iaiaProtocol.js';
/** Authorization is repeated after inference; no model result crosses a changed scope. */
export function creaServeiIAIA({authorize,store,infer=null,now=Date.now,wakeAfterPersist=null}={}){
  if(typeof authorize!=='function'||!store)throw new TypeError('IAIA dependencies required');
  // Server-only DI. The callback must synchronously register its promise with
  // the same worker lifetime, call xat_push_desperta_v2(messageId,authorId), and
  // start local worker work only when that SQL call returns true. Never invoke
  // another Edge HTTP endpoint here. Push completion never delays this answer.
  function notifyPersisted(saved){
    if(typeof wakeAfterPersist!=='function')return;
    try{const commit=Object.freeze({messageId:idIAIA(saved.replyId),authorId:idIAIA(saved.botId)});Promise.resolve(wakeAfterPersist(commit)).catch(()=>{});}catch{/* The answer is already committed; ordinary queue recovery remains authoritative. */}
  }
  const recent=new Map();let active=0;
  async function runInfer(input,signal){
    if(active>=4)throw errorIAIA('IAIA_BUSY',429);active++;
    try{const value=await infer(input,signal);if(typeof value!=='string'||!value.trim()||value.length>4000)throw errorIAIA('IAIA_MODEL',502);return value.trim();}finally{active--;}
  }
  return async(raw,credential,signal)=>{
    const input=capturaConsultaIAIA(raw),scope=await authorize(credential);idIAIA(scope.userId);idIAIA(scope.tenantId);
    const valid=()=>{if(signal?.aborted)throw signal.reason??new DOMException('Cancelled','AbortError');};valid();
    if(input.mode==='discover'){const group=await store.discover(scope);valid();const again=await authorize(credential);if(again.userId!==scope.userId||again.tenantId!==scope.tenantId)throw errorIAIA('IAIA_SCOPE',409);return {source:'configuration',inference:false,available:typeof infer==='function',group};}
    if(typeof infer!=='function')return {source:'unavailable',inference:false,requestId:input.requestId};
    if(input.mode==='group'){
      const claim=await store.claim(scope,input);if(signal?.aborted){if(claim?.state==='claimed')await store.cancel(scope,input,claim).catch(()=>{});valid();}if(!claim)throw errorIAIA('IAIA_GROUP_UNAVAILABLE',409);
      if(claim.state==='answered'){const again=await authorize(credential);valid();if(again.userId!==scope.userId||again.tenantId!==scope.tenantId)throw errorIAIA('IAIA_SCOPE',409);notifyPersisted(claim);return {source:'model',inference:true,requestId:input.requestId,threadId:input.threadId,replyId:claim.replyId,text:claim.text};}
      if(claim.state!=='claimed')return {source:'pending',inference:false,requestId:input.requestId};
      try{
        const text=await runInfer({question:claim.question,context:claim.context,language:input.language},signal);valid();
        const again=await authorize(credential);if(again.userId!==scope.userId||again.tenantId!==scope.tenantId)throw errorIAIA('IAIA_SCOPE',409);
        const saved=await store.finish(scope,input,claim,text);notifyPersisted(saved);valid();
        return {source:'model',inference:true,requestId:input.requestId,threadId:input.threadId,replyId:saved.replyId,text:saved.text};
      }catch(error){await store.cancel(scope,input,claim).catch(()=>{});throw error;}
    }
    const key=JSON.stringify([scope.tenantId,scope.userId,input.requestId]);
    for(const [k,v]of recent)if(v.expires<now())recent.delete(k);
    const previous=recent.get(key);if(previous)throw errorIAIA('IAIA_REPLAY',409);
    // A retry never silently starts another inference. Keep only a bounded request marker, never the answer.
    if(recent.size>=512||[...recent.keys()].filter(k=>k.startsWith(JSON.stringify([scope.tenantId,scope.userId]).slice(0,-1)+',')).length>=6)throw errorIAIA('IAIA_BUSY',429);
    recent.set(key,{expires:now()+60000});
    try{const text=await runInfer({question:input.question,context:[],language:input.language},signal);valid();const again=await authorize(credential);if(again.userId!==scope.userId||again.tenantId!==scope.tenantId)throw errorIAIA('IAIA_SCOPE',409);return {source:'model',inference:true,requestId:input.requestId,text};}
    finally{/* Only the bounded replay marker remains; no question or answer is retained. */}
  };
}
