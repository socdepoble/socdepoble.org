// iOS16.0 is supported; native String.isWellFormed arrived in Safari16.4.
const textBenFormat=text=>{
  for(let i=0;i<text.length;i++){
    const c=text.charCodeAt(i);
    if(c>=0xd800&&c<=0xdbff){const next=text.charCodeAt(++i);if(!(next>=0xdc00&&next<=0xdfff))return false;}
    else if(c>=0xdc00&&c<=0xdfff)return false;
  }
  return true;
};
/** Optional inference protocol. No authority or group transcript comes from the browser. */
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const errorIAIA=(code='IAIA_INVALID',status=400)=>Object.assign(new Error(code),{code,status});
export const idIAIA=v=>typeof v==='string'&&UUID.test(v)?v.toLowerCase():(()=>{throw errorIAIA();})();
export function capturaConsultaIAIA(v){
  if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v)))throw errorIAIA();
  if(Reflect.ownKeys(v).some(k=>typeof k!=='string'||!Object.getOwnPropertyDescriptor(v,k)?.enumerable||!Object.hasOwn(Object.getOwnPropertyDescriptor(v,k),'value')))throw errorIAIA();
  const fields=v.mode==='direct'?['mode','requestId','question','language']:v.mode==='group'?['mode','requestId','threadId','messageId','language']:v.mode==='discover'?['mode']:[];
  if(!fields.length||Reflect.ownKeys(v).some(k=>typeof k!=='string'||!fields.includes(k)||!Object.hasOwn(Object.getOwnPropertyDescriptor(v,k),'value')))throw errorIAIA();
  if(v.mode==='discover')return {mode:'discover'};
  const language=v.language??'ca';if(!['ca','es','en','eu','gl'].includes(language))throw errorIAIA();
  const requestId=idIAIA(v.requestId);
  if(v.mode==='group')return {mode:'group',requestId,threadId:idIAIA(v.threadId),messageId:idIAIA(v.messageId),language};
  if(typeof v.question!=='string'||!v.question.trim()||v.question.length>2000||/[\u0000]/.test(v.question)||!textBenFormat(v.question))throw errorIAIA();
  return {mode:'direct',requestId,question:v.question.trim(),language};
}
export function validaRespostaIAIA(v,input){
  if(!v||typeof v!=='object'||Array.isArray(v))throw errorIAIA('IAIA_RESPONSE',502);
  if(input.mode==='discover'){
    if(v.source!=='configuration'||v.inference!==false||typeof v.available!=='boolean'||v.group!==null&&(!v.group||!UUID.test(v.group.threadId??'')||!UUID.test(v.group.botId??'')))throw errorIAIA('IAIA_RESPONSE',502);
    return {source:'configuration',inference:false,available:v.available,group:v.group?{threadId:v.group.threadId,botId:v.group.botId}:null};
  }
  if(v.requestId!==input.requestId)throw errorIAIA('IAIA_RESPONSE',502);
  if(['unavailable','pending'].includes(v.source)&&v.inference===false)return {source:v.source,inference:false,requestId:v.requestId};
  if(v.source!=='model'||v.inference!==true||typeof v.text!=='string'||!v.text.trim()||v.text.length>4000)throw errorIAIA('IAIA_RESPONSE',502);
  if(input.mode==='group'&&(!UUID.test(v.replyId??'')||v.threadId!==input.threadId))throw errorIAIA('IAIA_RESPONSE',502);
  return {source:'model',inference:true,requestId:v.requestId,text:v.text,...(input.mode==='group'?{replyId:v.replyId,threadId:v.threadId}:{} )};
}
