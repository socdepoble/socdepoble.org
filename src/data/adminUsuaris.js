/** Neutral, bounded input for the administration RPC. No client role is authority. */
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const bad=()=>{throw new TypeError('Entrada d’administració invàlida.');};
export function capturaAdminUsuaris(value={},operation='llista',{local=false}={}) {
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))return bad();
  const keys=operation==='llista'?['limit','offset']:operation==='membre'?['usuariId','organitzacioId','rol','lleva']:['usuariId','categoria'];
  const out={};
  for(const key of Reflect.ownKeys(value)){
    const d=Object.getOwnPropertyDescriptor(value,key);
    if(typeof key!=='string'||!keys.includes(key)||!d?.enumerable||!Object.hasOwn(d,'value'))return bad();
    out[key]=d.value;
  }
  if(operation==='llista'){
    out.limit??=100;out.offset??=0;
    if(!Number.isInteger(out.limit)||out.limit<1||out.limit>200||!Number.isInteger(out.offset)||out.offset<0||out.offset>100000)return bad();
  }else{
    const validId=v=>typeof v==='string'&&(local?/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(v):UUID.test(v));
    if(!validId(out.usuariId))return bad();
    if(!local)out.usuariId=out.usuariId.toLowerCase();
    if(operation==='membre'){
      if(!validId(out.organitzacioId)||out.lleva!==undefined&&typeof out.lleva!=='boolean'||!['membre','editor','admin'].includes(out.rol??'membre'))return bad();
      if(!local)out.organitzacioId=out.organitzacioId.toLowerCase();out.rol??='membre';out.lleva??=false;
    }else if(!['amics','poble','associacio','treball'].includes(out.categoria))return bad();
  }
  return Object.freeze(out);
}
