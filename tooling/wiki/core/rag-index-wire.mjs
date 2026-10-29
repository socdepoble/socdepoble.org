/** Restore JSON collections; do not retokenize, deduplicate or rescore. */
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0;
const integer=v=>Number.isSafeInteger(v)&&v>=0;
const fail=field=>{throw new TypeError('Invalid RAG index: '+field);};
export function hydrateRagIndex(wire){
 if(!record(wire)||!Array.isArray(wire.docs)||!Array.isArray(wire.norms)||!Array.isArray(wire.stopwords)||!record(wire.idf)||!record(wire.inverted))fail('shape');
 if(!integer(wire.docCount)||wire.docCount!==wire.docs.length||wire.norms.length!==wire.docCount)fail('document count');
 if(!integer(wire.minLen)||wire.stopwords.some(v=>typeof v!=='string'))fail('token settings');
 const docs=wire.docs.map((doc,id)=>{
  if(!record(doc)||doc.id!==id||typeof doc.path!=='string'||!doc.path||!integer(doc.length))fail('document metadata');
  return{id:doc.id,path:doc.path,length:doc.length};
 });
 if(wire.norms.some(v=>!positive(v)))fail('norms');
 const idf=new Map();
 for(const[term,value]of Object.entries(wire.idf)){if(!term||!positive(value))fail('idf');idf.set(term,value);}
 const sums=new Array(docs.length).fill(0);
 const inverted=new Map();
 for(const[term,postings]of Object.entries(wire.inverted)){
  if(!idf.has(term)||!Array.isArray(postings)||!postings.length)fail('posting term');
  const seen=new Set(),copy=postings.map(p=>{
   if(!record(p)||!integer(p.docId)||p.docId>=docs.length||!positive(p.weight)||seen.has(p.docId))fail('posting');
   seen.add(p.docId);sums[p.docId]+=p.weight*p.weight;return{docId:p.docId,weight:p.weight};
  });inverted.set(term,copy);
 }
 if(idf.size!==inverted.size)fail('term coverage');
 for(let i=0;i<sums.length;i++){
  const expected=Math.sqrt(sums[i])||1e-9,actual=wire.norms[i];
  if(!positive(expected)||Math.abs(expected-actual)>1e-10*Math.max(expected,actual))fail('vector norm');
 }
 if(wire.malformedCount!==undefined&&wire.malformedCount!==0)fail('malformed count');
 return{docs,inverted,idf,norms:wire.norms.slice(),stopwords:new Set(wire.stopwords),minLen:wire.minLen,docCount:wire.docCount,...(wire.malformedCount===undefined?{}:{malformedCount:wire.malformedCount})};
}
