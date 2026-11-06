/** Sense URL ni fetch. Només una SpeechSynthesisVoice declarada local pel
 * dispositiu. Si no n'hi ha, no es deixa al motor triar una veu remota. */
export function creaLocutorHerbariLocal({sintesi=globalThis.speechSynthesis,ClasseMissatge=globalThis.SpeechSynthesisUtterance}={}){
 let pendent=null,missatge=null;
 const veu=llengua=>{
  if(typeof sintesi?.getVoices!=='function'||typeof sintesi?.speak!=='function'||typeof sintesi?.cancel!=='function'||typeof ClasseMissatge!=='function')return null;
  let totes;try{totes=sintesi.getVoices();}catch{return null;}
  if(!Array.isArray(totes))return null;
  const locals=totes.filter(v=>v?.localService===true);
  return locals.find(v=>v.lang?.split('-')[0]===llengua)??locals[0]??null;
 };
 const atura=()=>{if(!missatge)return;const resol=pendent,u=missatge;missatge=null;pendent=null;u.onend=null;u.onerror=null;try{sintesi.cancel();}finally{resol?.();}};
 return Object.freeze({
  local:true,
  disponible:llengua=>Boolean(veu(llengua)),
  subscriu:fn=>{sintesi?.addEventListener?.('voiceschanged',fn);return()=>sintesi?.removeEventListener?.('voiceschanged',fn);},
  atura,
  parla(text,{privat=true,llengua='ca'}={}){
   if(privat!==true)return Promise.reject(new Error('nomes-veu-local-privada'));
   const triada=veu(llengua);if(!triada)return Promise.reject(new Error('veu-local-absent'));
   atura();
   return new Promise((resolve,reject)=>{
    const u=new ClasseMissatge(String(text));missatge=u;pendent=resolve;u.voice=triada;u.lang=triada.lang;
    const acaba=error=>{if(missatge!==u)return;missatge=null;pendent=null;u.onend=null;u.onerror=null;error?reject(new Error('veu-local-fallida')):resolve();};
    u.onend=()=>acaba(false);u.onerror=()=>acaba(true);
    try{sintesi.speak(u);}catch{acaba(true);}
   });
  }
 });
}
