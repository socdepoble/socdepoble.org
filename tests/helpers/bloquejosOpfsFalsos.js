/* Doble de Web Locks per assajos; no acredita navegador natiu. */
export function creaBloquejosOpfsFalsos() {
 const tails=new Map(),crides=[];let actius=0,maxActius=0;
 return {crides,get maxActius(){return maxActius;},
  request(name,options,callback){
   crides.push({name,mode:options.mode});
   const pre=tails.get(name)??Promise.resolve();
   const run=pre.catch(()=>{}).then(async()=>{if(options.signal?.aborted)throw new DOMException('Cancel·lat','AbortError');actius++;maxActius=Math.max(maxActius,actius);try{return await callback({name,mode:options.mode});}finally{actius--;}});
   tails.set(name,run.catch(()=>{}));return run;
  }
 };
}
