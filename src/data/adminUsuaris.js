/** Neutral, bounded input for the administration RPC. No client role is authority. */
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const bad=()=>{throw new TypeError('Entrada d’administració invàlida.');};
export function capturaAdminUsuaris(value={},operation='llista',{local=false}={}) {
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))return bad();
  const keys=operation==='llista'?['limit','cursorCreat','cursorId']:operation==='membre'?['usuariId','organitzacioId']:['usuariId'];
  const out={};
  for(const key of Reflect.ownKeys(value)){
    const d=Object.getOwnPropertyDescriptor(value,key);
    if(typeof key!=='string'||!keys.includes(key)||!d?.enumerable||!Object.hasOwn(d,'value'))return bad();
    out[key]=d.value;
  }
  if(operation==='llista'){
    out.limit??=25;out.cursorCreat??=null;out.cursorId??=null;
    if(!Number.isInteger(out.limit)||out.limit<1||out.limit>50||(out.cursorCreat===null)!==(out.cursorId===null))return bad();
    if(out.cursorCreat!==null&&(typeof out.cursorCreat!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(out.cursorCreat)||!Number.isFinite(Date.parse(out.cursorCreat))||typeof out.cursorId!=='string'||!UUID.test(out.cursorId)))return bad();
  }else{
    const validId=v=>typeof v==='string'&&(local?/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(v):UUID.test(v));
    if(!validId(out.usuariId))return bad();
    if(!local)out.usuariId=out.usuariId.toLowerCase();
    if(operation==='membre'){
      if(!validId(out.organitzacioId))return bad();
      if(!local)out.organitzacioId=out.organitzacioId.toLowerCase();
    }
  }
  return Object.freeze(out);
}
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const shape=(v,keys)=>plain(v)&&Reflect.ownKeys(v).length===keys.length&&Reflect.ownKeys(v).every(k=>typeof k==='string'&&keys.includes(k)&&Object.getOwnPropertyDescriptor(v,k)?.enumerable&&Object.hasOwn(Object.getOwnPropertyDescriptor(v,k),'value'));
const uuid=v=>typeof v==='string'&&UUID.test(v);
const date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const nullableText=(v,max)=>v===null||typeof v==='string'&&v.length<=max;
export function validaLlistaAdminUsuaris(value,limit=50){
  const keys=['id','full_name','username','avatar_url','town_name','created_at','baixa','consentiment','correu_mascarat','organitzacions'];
  if(!Array.isArray(value)||value.length>limit)return bad();
  const seen=new Set();
  for(const row of value){
    if(!shape(row,keys)||!uuid(row.id)||seen.has(row.id)||typeof row.full_name!=='string'||row.full_name.length>120||!nullableText(row.username,120)||!nullableText(row.avatar_url,2048)||!nullableText(row.town_name,300)||!date(row.created_at)||row.baixa!==false||row.consentiment!==true||row.correu_mascarat!==null&&(typeof row.correu_mascarat!=='string'||!/^.{1}\*{3}@[^@\s]+$/u.test(row.correu_mascarat)||row.correu_mascarat.length>258)||!Array.isArray(row.organitzacions))return bad();
    seen.add(row.id);
    for(const org of row.organitzacions)if(!shape(org,['id','nom','rol'])||!uuid(org.id)||typeof org.nom!=='string'||org.nom.length>120||!['owner','admin','member'].includes(org.rol))return bad();
  }
  return value;
}
export function validaInvitacioAdmin(value,input){
  if(!shape(value,['invitacioId','usuariId','organitzacioId','rol','estat','caducaAl'])||!uuid(value.invitacioId)||value.usuariId!==input.usuariId||value.organitzacioId!==input.organitzacioId||value.rol!=='member'||value.estat!=='pendent'||!date(value.caducaAl))return bad();
  return value;
}
export function validaConnexioAdmin(value,input){
  if(!shape(value,['usuariId','vincle'])||value.usuariId!==input.usuariId||!shape(value.vincle,['seguint','creat_al','nou','primer'])||value.vincle.seguint!==true||!date(value.vincle.creat_al)||typeof value.vincle.nou!=='boolean'||typeof value.vincle.primer!=='boolean')return bad();
  return value;
}
