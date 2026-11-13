/** R21.6 · Defensive shape boundary for old/intermediate app_content rows.
 * Keep real editorial metadata; never invent attribution, a town or a date.
 * This is display coercion, not permission to overwrite the server's data.
 */
const TEXT = new Set([
  'title','subtitle','post_subtitle','description','excerpt','summary','lead','entradilla','content','html',
  'name','full_name','author_name','author_role','author_location','town_name','townName','location','comarca',
  'type','kind','category','category_slug','tag','sectionId','searchText',
  'image','imageSrc','image_url','imageAlt','src','source','avatar_url','author_avatar','video_url','hero_url','hero_video_url',
  'mainHref','href','url','slug','linkTo','external_url','copyright','icon',
  'author_id','author_entity_id','author_org_id','authorOrgId','owner_user_id'
]);
const DATES = new Set(['date','time','created_at','createdAt','updated_at','updatedAt','publish_date','publishDate','event_date','start_date','end_date']);
const LABELS = new Set(['labels','tags','categories']);
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype,null].includes(Object.getPrototypeOf(value));
const scalarText = value => typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
function dataProperties(value) {
  return Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(value))
    .filter(([,d]) => d.enumerable && Object.hasOwn(d,'value')).map(([key,d]) => [key,d.value]));
}
function valorsDeLlista(value) {
  const descriptors=Object.getOwnPropertyDescriptors(value);
  return Object.keys(descriptors).filter(key=>/^(0|[1-9][0-9]*)$/.test(key) && Number(key)<value.length)
    .filter(key=>Object.hasOwn(descriptors[key],'value')).map(key=>descriptors[key].value);
}
function referenciaIntegra(original, normalized) {
  const descriptors=Object.getOwnPropertyDescriptors(original);
  const keys=Reflect.ownKeys(descriptors);
  return keys.length===Object.keys(normalized).length && keys.every(key=>typeof key==='string'
    && descriptors[key].enumerable && Object.hasOwn(descriptors[key],'value')
    && Object.hasOwn(normalized,key) && descriptors[key].value===normalized[key]) ? original : normalized;
}
const esMarca = value => typeof value === 'string' && /^sóc\s+de\s+poble$/iu.test(value.trim());
function normalitzaGeografia(copy) {
  // population is also a town label in old market/feed rows. Numeric census
  // values and legitimate author/entity names keep their original meaning.
  for(const key of ['town_name','townName','location','author_location','population']) {
    if(Object.hasOwn(copy,key) && esMarca(copy[key])) copy[key]='';
  }
  if(Object.hasOwn(copy,'poble')) {
    if(plain(copy.poble)) {
      const poble=dataProperties(copy.poble);
      if(Object.hasOwn(poble,'nom') && poble.nom != null) poble.nom=scalarText(poble.nom);
      if(esMarca(poble.nom)) poble.nom='';
      copy.poble=referenciaIntegra(copy.poble,poble);
    } else if(esMarca(copy.poble)) copy.poble='';
  }
  return copy;
}
function record(value) {
  const copy=dataProperties(value);
  for(const key of Object.keys(copy)) {
    if(TEXT.has(key) && copy[key] != null) copy[key]=scalarText(copy[key]);
    else if(DATES.has(key) && copy[key] != null && typeof copy[key] !== 'string' && !(typeof copy[key] === 'number' && Number.isFinite(copy[key]))) copy[key]='';
  }
  normalitzaGeografia(copy);
  for(const key of ['author','seller']) {
    if(!Object.hasOwn(copy,key) || copy[key] == null) continue;
    copy[key]=plain(copy[key]) ? recordAuthor(copy[key]) : scalarText(copy[key]);
  }
  for(const key of LABELS) {
    if(!Object.hasOwn(copy,key)) continue;
    if(Array.isArray(copy[key])) {
      const original=copy[key];
      const normalized=valorsDeLlista(original).filter(v=>typeof v==='string'||plain(v)).map(v=>typeof v==='string'?v:recordLabel(v));
      copy[key]=mateixaLlistaIntegra(original,normalized) ? original : normalized;
    } else copy[key]=[];
  }
  return referenciaIntegra(value,copy);
}
function recordAuthor(value) {
  const copy=dataProperties(value);
  for(const key of ['id','name','nom','full_name','role','avatar_url','avatarUrl','town_name','townName','location','author_location'])
    if(Object.hasOwn(copy,key) && copy[key] != null) copy[key]=scalarText(copy[key]);
  return referenciaIntegra(value,normalitzaGeografia(copy));
}
function recordLabel(value) {
  const copy=dataProperties(value);
  for(const key of ['text','label','name','title','href','slug','className'])
    if(Object.hasOwn(copy,key) && copy[key] != null) copy[key]=scalarText(copy[key]);
  return referenciaIntegra(value,copy);
}
function mateixaLlistaIntegra(original,normalized) {
  return normalized.length===original.length && Reflect.ownKeys(original).length===original.length+1
    && normalized.every((value,index)=>Object.getOwnPropertyDescriptor(original,String(index))?.value===value);
}
export function normalitzaFilesEditorials(items) {
  if(!Array.isArray(items)) return [];
  const normalized=valorsDeLlista(items).filter(plain).filter(value=>{
    const d=Object.getOwnPropertyDescriptor(value,'id');
    return !d || (Object.hasOwn(d,'value') && (d.value==null || typeof d.value==='string' || (typeof d.value==='number' && Number.isFinite(d.value))));
  }).map(record);
  return mateixaLlistaIntegra(items,normalized) ? items : normalized;
}
