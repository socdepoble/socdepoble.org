/** R12 · Contracte neutral d'edició de publicacions editorials existents.
 * Cap autoria, ruta, propietat o estat privilegiat prové de canvis del client.
 */
export const CLAU_EDITORIAL_DE_SECCIO=Object.freeze({mur:'feedPosts',events:'events',mercat:'marketItems',pagines:'pages'});
const campsPublicacio={title:1000,subtitle:2000,post_subtitle:2000,entradilla:10000,content:524288,image_url:262144,hero_image:262144,logo_image:262144,logo_image_dark:262144,copyright:1000,icon:128,publish_date:64,categories:100,tags:100};
const campsPagina={title:1000,subtitle:2000,lead:10000,html:524288,image:262144,logo_image:262144,logo_image_dark:262144,copyright:1000,icon:128,publish_date:64,categories:100,tags:100};
const invalid=()=>{throw Object.assign(new TypeError('Canvis editorials invàlids.'),{code:'editorial-invalid',codi:'editorial-invalid'});};
// Comprovació UTF-16 lossless també en Safari16, anterior a isWellFormed().
const benFormat=text=>{
  for(let i=0;i<text.length;i++){
    const c=text.charCodeAt(i);
    if(c>=0xd800&&c<=0xdbff){const next=text.charCodeAt(++i);if(!(next>=0xdc00&&next<=0xdfff))return false;}
    else if(c>=0xdc00&&c<=0xdfff)return false;
  }
  return true;
};
const pla=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
export function capturaEdicioEditorial(input){
  if(!pla(input))invalid();
  const descriptors=Object.getOwnPropertyDescriptors(input);
  if(Reflect.ownKeys(descriptors).length!==4||!['seccio','id','canvis','versio'].every(k=>Object.hasOwn(descriptors,k)&&Object.hasOwn(descriptors[k],'value')))invalid();
  const {seccio,id,canvis,versio}=input;
  if(typeof seccio!=='string'||!Object.hasOwn(CLAU_EDITORIAL_DE_SECCIO,seccio)||typeof id!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(id)||!Number.isSafeInteger(versio)||versio<1||versio>=2147483647||!pla(canvis))invalid();
  const camps=seccio==='pagines'?campsPagina:campsPublicacio,copy={};
  if(!Reflect.ownKeys(canvis).length||Reflect.ownKeys(canvis).length>16)invalid();
  for(const key of Reflect.ownKeys(canvis)){
    const descriptor=Object.getOwnPropertyDescriptor(canvis,key);
    if(typeof key!=='string'||!Object.hasOwn(camps,key)||!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))invalid();
    const value=descriptor.value;
    if(key==='categories'||key==='tags'){
      if(!Array.isArray(value)||value.length>100||Reflect.ownKeys(value).length!==value.length+1)invalid();
      copy[key]=Array.from({length:value.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d||!Object.hasOwn(d,'value')||typeof d.value!=='string'||d.value.length>200||d.value.includes('\0')||!benFormat(d.value))invalid();return d.value;});
    }else{
      if(typeof value!=='string'||value.length>camps[key]||value.includes('\0')||!benFormat(value))invalid();copy[key]=value;
    }
  }
  if(new TextEncoder().encode(JSON.stringify(copy)).byteLength>700000)invalid();
  return {seccio,id,canvis:copy,versio};
}
export function marcaFilesEditorials(items,clau,versio){
  return (Array.isArray(items)?items:[]).filter(v=>pla(v)).map(item=>({...item,...(Number.isSafeInteger(versio)&&versio>0?{_editorialClau:clau,_editorialVersio:versio}:{})}));
}
export function aplicaCanvisEditorials(item,canvis,seccio){
  const next={...item,...canvis};
  if(seccio==='pagines'&&['title','subtitle','lead','html'].some(k=>Object.hasOwn(canvis,k)&&canvis[k]!==item[k])){delete next.translations;delete next.i18n;next.contentLanguage='ca';}
  if(Object.hasOwn(canvis,'content')||Object.hasOwn(canvis,'html'))next.editorial_format='html-r6';
  if(Object.hasOwn(canvis,'subtitle'))next.post_subtitle=canvis.subtitle;
  if(Object.hasOwn(canvis,'image_url')){next.image=canvis.image_url;next.imageSrc=canvis.image_url;}
  return next;
}

/** Abans de R12 les pàgines sistema llegien la llavor vigent. El primer save
 * explícit marca html-r6; només aleshores la versió remota substituïx el cos.
 * Les pàgines remotes pròpies d'un poble, desconegudes per la llavor, es conserven.
 */
export function fusionaPaginesEditorials(remotes,llavor,versio){
  const files=marcaFilesEditorials(remotes,'pages',versio),byId=new Map(files.map(v=>[v.id,v]));
  const pages=(Array.isArray(llavor)?llavor:[]).map(seed=>{
    const remote=byId.get(seed.id);if(!remote)return {...seed};byId.delete(seed.id);
    if(remote.editorial_format==='html-r6'){const base={...seed};if(remote.contentLanguage==='ca'&&!remote.translations){delete base.translations;delete base.i18n;}return {...base,...remote};}
    return {...seed,...(remote._editorialVersio?{_editorialClau:'pages',_editorialVersio:remote._editorialVersio}:{})};
  });
  return [...pages,...byId.values()];
}
