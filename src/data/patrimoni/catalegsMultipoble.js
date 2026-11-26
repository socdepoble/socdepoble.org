/** IDEA-366. Contracte pur: presentació primer, ids i rutes estables, drets sense inventar.
 *
 * C26-2 #6 (v1.2.26) · Una sola URL per llibre i per fitxa («uniformitat total»): el camí que ja servix
 * CatalegWorkspace (sincronitzaUrl i resolSeleccioDeSlug), el mateix d'Arbres. /page/<biblioteca>/<llibre> obri el
 * llibre i, amb ell, la seua Pàgina de Presentació; /page/<biblioteca>/<slug> obri la fitxa, on el slug és l'id de la
 * fitxa o, si la fitxa es comparteix entre llibres, `<llibre>--<fitxa>` (llibresArbresMonumentals.js). La consulta
 * antiga ?cataleg=&fitxa= només és una entrada de compatibilitat: resolRutaCataleg l'entén i torna el camí canònic, i
 * CatalegWorkspace hi redirigix amb replace. */
const text=v=>typeof v==='string'?v:'';
const idValid=v=>typeof v==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
const RUTA_BIBLIOTECA=/^\/page\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* IDEA-366 (22:23) · El nom curt amb què el Mestre anomena el llibre a la columna de Catàlegs (el de la font és llarg
   i es tallava). Sense entrada, l'autoria de la font. */
export const TITOLS_CURTS_DE_LLIBRE=Object.freeze({'oliveres-gva-ivia':'Generalitat Valenciana · Oliveres'});

/** El segment de camí d'una fitxa: l'id, o `<llibre>--<fitxa>` si es comparteix entre llibres (com Arbres). */
export function slugDeFitxa(llibre,fitxa,{compartida=false}={}) {
 if(!idValid(llibre)||!idValid(fitxa))throw new TypeError('Slug de catàleg invàlid');
 return compartida?`${llibre}--${fitxa}`:fitxa;
}
export function rutaCataleg(ruta,llibre,fitxa,opcions={}) {
 if(!RUTA_BIBLIOTECA.test(text(ruta))||!idValid(llibre)||(fitxa!==undefined&&!idValid(fitxa)))throw new TypeError('Slug de catàleg invàlid');
 return fitxa===undefined?`${ruta}/${llibre}`:`${ruta}/${slugDeFitxa(llibre,fitxa,opcions)}`;
}
/* C26-2 #13 · Una web nova sense comprovació humana (webVerificada: false) no fa de font original: el document. */
const webVerificada=font=>Boolean(text(font.web))&&font.webVerificada!==false;
export function presentacioDeLaFont(font,ruta='/page/banc-de-llavors') {
 if(!font||!idValid(font.id))throw new TypeError('Font invàlida');
 const id=`presentacio-${font.id}`;
 return Object.freeze({id,slug:id,tipus:'presentacio',esPresentacio:true,title:text(font.titol),subtitle:text(font.autoria),
  nom:text(font.titol),nomCientific:'',fontId:font.id,autoria:text(font.autoria),procedencia:text(font.ambit),
  any:Number.isInteger(font.any)?font.any:null,llicencia:text(font.llicencia)||'No declarada en les dades de la font; consulta el document original',
  fontOriginal:webVerificada(font)?text(font.web):text(font.document),
  ...(text(font.web)?{web:text(font.web),webVerificada:webVerificada(font)}:null),
  ...(text(font.sha256)?{sha256:text(font.sha256)}:null),
  lead:text(font.nota),href:rutaCataleg(ruta,font.id)});
}
export function llibreDeLaFont(font,fitxes,ruta='/page/banc-de-llavors') {
 const presentacio=presentacioDeLaFont(font,ruta);
 const ids=new Set([presentacio.id]);
 const items=fitxes.map(f=>{
  if(!idValid(f?.id)||ids.has(f.id))throw new TypeError('Fitxa duplicada o invàlida');
  ids.add(f.id);
  const compartida=f.slugRuta===`${font.id}--${f.id}`;
  if(f.slugRuta!==undefined&&!compartida&&f.slugRuta!==f.id)throw new TypeError('Slug de fitxa invàlid');
  const slug=slugDeFitxa(font.id,f.id,{compartida});
  return {...f,slug,slugRuta:slug,fontId:font.id,href:rutaCataleg(ruta,font.id,f.id,{compartida})};
 });
 const titolCurt=text(font.titolCurt)||(Object.hasOwn(TITOLS_CURTS_DE_LLIBRE,font.id)?TITOLS_CURTS_DE_LLIBRE[font.id]:'')||text(font.autoria);
 return {id:font.id,slug:font.id,title:font.autoria,titolCurt,href:rutaCataleg(ruta,font.id),presentacio,initialItemId:presentacio.id,items:[presentacio,...items],total:items.length+1};
}
/** Resol el camí d'un llibre o d'una fitxa (el segment de /page/<biblioteca>/<segment>) o, per compatibilitat, la
 * consulta antiga ?cataleg=&fitxa=. Torna { llibre, item, ruta } amb el camí canònic, o null. */
export function resolRutaCataleg(entrada,llibres) {
 if(!Array.isArray(llibres)||!llibres.length)return null;
 const valor=text(entrada).replace(/^\?/,'');
 const ambRuta=(llibre,item)=>(item?{llibre,item,ruta:item===llibre.presentacio?llibre.href:item.href}:null);
 if(valor===''||valor.includes('=')) {
  const params=new URLSearchParams(valor);
  const llibre=llibres.find(l=>l.id===params.get('cataleg'))??(!params.has('cataleg')?llibres[0]:null);
  if(!llibre)return null;
  const id=params.get('fitxa')??llibre.initialItemId;
  return ambRuta(llibre,llibre.items.find(i=>i.id===id));
 }
 const delLlibre=llibres.find(l=>l.slug===valor||l.id===valor);
 if(delLlibre)return ambRuta(delLlibre,delLlibre.presentacio);
 for(const llibre of llibres) {
  const item=llibre.items.find(i=>i!==llibre.presentacio&&(i.slug===valor||i.id===valor));
  if(item)return ambRuta(llibre,item);
 }
 return null;
}
