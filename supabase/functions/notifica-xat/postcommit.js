import {capcaleresDeServei} from '../_shared/apple.js';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
async function readWake(response,signal){
  if(!response.ok||response.redirected)throw Error('wake_unavailable');
  const reader=response.body?.getReader();if(!reader)throw Error('wake_body');
  const cancel=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener('abort',cancel,{once:true});
  let size=0;const parts=[];
  try{
    while(true){if(signal.aborted)throw Error('wake_timeout');const {done,value}=await reader.read();if(done)break;if((size+=value.byteLength)>128)throw Error('wake_body');parts.push(value);}
    if(signal.aborted)throw Error('wake_timeout');
    const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
    const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if(typeof value!=='boolean')throw Error('wake_body');return value;
  }finally{signal.removeEventListener('abort',cancel);void reader.cancel().catch(()=>{});reader.releaseLock();}
}
/** Server DI only. The committed bot identity is obtained from SQL, never
 * from a browser hint. Register background work before beginning any I/O. */
export function creaWakePostcommit({env={},fetch:request=globalThis.fetch,worker,background,timeoutMs=4000}={}){
  let base='';try{const u=new URL(env.SUPABASE_URL);if(u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==='/')base=u.origin;}catch{/* disabled */}
  const enabled=env.SDP_PUSH_ACTIU==='si'&&base&&env.SUPABASE_SERVICE_ROLE_KEY&&String(env.SDP_CRON_SECRET||'').length>=32&&typeof worker==='function'&&typeof background==='function';
  return (commit)=>{
    if(!enabled||!commit||!UUID.test(commit.messageId)||!UUID.test(commit.authorId))return;
    const {messageId,authorId}=commit;
    let begin;
    const task=new Promise(resolve=>{begin=resolve;}).then(async registered=>{
      if(!registered)return;
      const control=new AbortController();const timer=setTimeout(()=>control.abort(),Math.max(10,Math.min(4000,timeoutMs)));
      let onAbort;
      const interrupted=new Promise((_,reject)=>{onAbort=()=>reject(Error('wake_timeout'));control.signal.addEventListener('abort',onAbort,{once:true});});
      const within=fn=>control.signal.aborted?Promise.reject(Error('wake_timeout')):Promise.race([Promise.resolve().then(fn),interrupted]);
      let wake=false;
      try{
        const pending=Promise.resolve().then(()=>request(base+'/rest/v1/rpc/xat_push_desperta_v2',{
          method:'POST',redirect:'error',credentials:'omit',cache:'no-store',signal:control.signal,
          headers:{...capcaleresDeServei(env.SUPABASE_SERVICE_ROLE_KEY),'Content-Type':'application/json'},
          body:JSON.stringify({p_missatge_id:messageId,p_usuari_esperat:authorId})
        }));
        pending.then(response=>{
          if(control.signal.aborted&&!response?.body?.locked){try{Promise.resolve(response?.body?.cancel?.()).catch(()=>{});}catch{/* best effort */}}
        },()=>{});
        const response=await within(()=>pending);
        wake=await within(()=>readWake(response,control.signal));
      }finally{clearTimeout(timer);control.signal.removeEventListener('abort',onAbort);control.abort();}
      if(wake)await worker(new Request(base+'/functions/v1/notifica-xat',{method:'POST',headers:{'x-sdp-cron':env.SDP_CRON_SECRET}}));
    }).catch(()=>{}); // The committed answer survives any push failure.
    try{background(task);begin(true);}catch{begin(false);}
  };
}
