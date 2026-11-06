/** IDEA-111 · Index lleuger i càrrega explícita de deu fonts públiques.
 * El corpus només arriba per import(); ni una aprovació ni una autoritat.
 */
export const FONT_PAGINES_WP_SHA256 = '0e9b0e946186fa82caa6f9931fa54a083100b8a2d16a728a28d68a3f5c1983d6';
export const CORPUS_PAGINES_WP_SHA256 = '5183bd3245464f3e43628a2d262c12c233b3a3b9efe8a4367be58e0b0e60e03d';
export const INDEX_PAGINES_TRILOGIA_WP = Object.freeze([
  [16839,'la-trilogia-mediterrania-al-comtat'],[16826,'el-lexic-del-blat-al-comtat'],
  [16650,'el-lexic-de-lolivera-loliva-i-loli-al-comtat'],[16668,'el-lexic-del-raim-i-del-vi-al-comtat'],
  [2002,'moli-fariner-electric-de-la-torre-de-les-macanes'],[3656,'el-pou-de-la-neu-del-rentonar'],
  [16761,'el-pou-de-neu-del-rentonar-front-a-ladministracio'],[3653,'la-fissura-del-sostre-del-pou-de-neu'],
  [3639,'mapa-del-terme-de-la-torre-de-les-macanes'],[619,'cataleg-d-arbres-emblematics-i-monumentals-de-la-torre-de-les-macanes']
].map(([id,slug])=>Object.freeze({id,slug})));
const importaDeVeres = () => import('./paginesTrilogiaIMoliWp.corpus.json');
const error = code => Object.assign(new Error(code),{code});
export const esPaginaTrilogiaIMoliWp = value => value!=null&&INDEX_PAGINES_TRILOGIA_WP.some(p=>String(p.id)===String(value)||p.slug===String(value));
async function valida(pages) {
  if(!Array.isArray(pages)||pages.length!==10)throw error('WP_CORPUS_INVALID');
  const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(pages)));
  const hash=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==CORPUS_PAGINES_WP_SHA256)throw error('WP_CORPUS_HASH');
  for(let index=0;index<pages.length;index++){
    const page=pages[index],expected=INDEX_PAGINES_TRILOGIA_WP[index];
    if(page.id!==expected.id||page.slug!==expected.slug||typeof page.title!=='string'||typeof page.contentHtml!=='string'
      ||page.contentHtml.length>150000||!Array.isArray(page.images)||!Array.isArray(page.iframes))throw error('WP_CORPUS_INVALID');
    const url=new URL(page.link);
    if(url.origin!=='https://socdepoble.net'||!url.pathname.endsWith('/'+page.slug+'/')||url.username||url.password)throw error('WP_CORPUS_ORIGIN');
    Object.freeze(page.images);Object.freeze(page.iframes);Object.freeze(page);
  }
  return Object.freeze(pages);
}
function espera(promise,signal){
  if(!signal)return promise;
  if(signal.aborted)return Promise.reject(error('WP_CANCELLED'));
  return new Promise((resolve,reject)=>{
    const abort=()=>{signal.removeEventListener('abort',abort);reject(error('WP_CANCELLED'));};
    signal.addEventListener('abort',abort,{once:true});
    promise.then(value=>{signal.removeEventListener('abort',abort);resolve(value);},reason=>{signal.removeEventListener('abort',abort);reject(reason);});
  });
}
/** Factory: injectable loader is for isolated tests; callers cannot replace source hashes. */
export function creaCarregadorPaginesWp(importa=importaDeVeres){
  let cached=null,pending=null;
  return {
    obte:key=>cached?.find(page=>String(page.id)===String(key)||page.slug===String(key))??null,
    carrega:({signal}={})=>{
      if(signal?.aborted)return Promise.reject(error('WP_CANCELLED'));
      if(!pending)pending=Promise.resolve().then(importa).then(m=>valida(m.default??m)).then(pages=>(cached=pages,pages),e=>{pending=null;throw e;});
      return espera(pending,signal);
    }
  };
}
const carregador=creaCarregadorPaginesWp();
export const carregaPaginesTrilogiaIMoliWp = options=>carregador.carrega(options);
export const trobaPaginaTrilogiaIMoliWp = key=>carregador.obte(key);
