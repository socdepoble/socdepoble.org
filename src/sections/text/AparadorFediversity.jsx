import {useEffect,useRef,useState} from 'react';
import {useUIActionsOpcional} from '../../app/contexts/UIContext.jsx';
import {APARADOR_R20_TEXTS} from './pageContent.fediversityR20.js';
const loadCompiler=()=>Promise.all([import('../../data/karpathyWikiCompiler.js'),import('../notes/memoriaOral.js')]);
/** La prova conserva el relat al dispositiu; mai no publica ni envia el text. */
export default function AparadorFediversity({language:idioma,carrega=loadCompiler}) {
 const ui=useUIActionsOpcional(),language=idioma??ui?.language??'ca',t=APARADOR_R20_TEXTS[language]??APARADOR_R20_TEXTS.ca;
 const [text,setText]=useState(''),[result,setResult]=useState(null),[state,setState]=useState('idle');const revision=useRef(0);
 useEffect(()=>()=>{revision.current++;},[]);
 const change=value=>{revision.current++;setText(value);setResult(null);setState('idle');};
 const compile=async()=>{
  if(!text.trim()){setState('empty');return;}
  const current=++revision.current,snapshot=text;setState('working');
  try{
   const moduls=await carrega();
   if(current!==revision.current)return;
   const [{compilaWikiKarpathy},{estructuraMemoriaOral}]=moduls;
   const fitxa=estructuraMemoriaOral(snapshot);
   if(!fitxa.okf)throw Error('no-okf');
   const compiled=await compilaWikiKarpathy([{id:'relat-local',tipus:'memoria-oral',titol:fitxa.titol,okf:fitxa.okf,privat:true}]);
   if(current!==revision.current)return;
   setResult(compiled.articles[0]);setState('ready');
  }catch{if(current===revision.current)setState('failed');}
 };
 return <section data-sdp-privat="true" aria-label={t.compiler}>
  <h3>{t.compiler}</h3><p>{t.compilerIntro}</p><p><a href="https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f" target="_blank" rel="noopener noreferrer">{t.inspired}</a></p>
  <label>{t.label}<textarea value={text} maxLength={16000} onChange={event=>change(event.target.value)} /></label>
  <div className="sdp-alerta__accions"><button className="sdp-boto sdp-boto--primari" type="button" onClick={compile} disabled={state==='working'}>{state==='working'?t.working:t.compile}</button><button className="sdp-boto sdp-boto--secundari" type="button" onClick={()=>change('')}>{t.clear}</button></div>
  {['failed','empty'].includes(state)?<p role="status">{t[state]}</p>:null}
  {result?<div aria-live="polite"><h4>{t.result}</h4><p>SHA-256: <code>{result.sha256}</code></p><pre>{result.markdown}</pre></div>:null}
 </section>;
}
