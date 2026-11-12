import {Fragment,useEffect,useRef,useState} from 'react';
import {useUIActionsOpcional} from '../../app/contexts/UIContext.jsx';
import ProtocolEmergenciesOfflineCard from '../../components/emergencies/ProtocolEmergenciesOfflineCard.jsx';
import { Link } from '../../app/contexts/RouterContext.jsx';
import {APARADOR_R20_TEXTS} from './pageContent.fediversityR20.js';
import {PAGE_COPY} from './pageContent.js';
import {localitzaPagina} from './pageContent.r10.js';
import {FEDIVERSITY_ACTORS,FEDIVERSITY_FLOW,FEDIVERSITY_ARCHITECTURE_URL,FEDIVERSITY_ARCHITECTURE_TEXTS,SDP_NIX_EVIDENCE,FEDIVERSITY_CONTRACT_COUNTS} from './fediversityArchitectureR11.js';
const loadCompiler=()=>Promise.all([import('../../data/karpathyWikiCompiler.js'),import('../notes/memoriaOral.js')]);
/* Onada R9 (ordre del Mestre del 261106, 14:06) · Les cinc pàgines de patrimoni amb font, enllaçades
   des de /fedivers, /page/fediversity i /page/node-zero. El títol i el subtítol de cada enllaç són els de
   la pàgina de PAGE_COPY en la llengua de la interfície (localitzaPagina); si la pàgina no hi està
   traduïda (l'anatomia, hui només en valencià), el paràgraf porta el lang de la pàgina i l'enllaç el
   seu hreflang. Enllaç intern de sempre (<a href>, enllacosInterns.js), sense cap estil nou.
   Gauntlet R9 · G3 (R9V-C5-08): s'hi afigen el banc de llavors, les rutes i els arbres de C5, que no tenien cap entrada. */
const PAGINES_DE_PATRIMONI=['anatomia-rural','herbari','banc-de-llavors','rutes-de-poble','arbres-monumentals'];
/** La prova conserva el relat al dispositiu; mai no publica ni envia el text. */
export default function AparadorFediversity({language:idioma,carrega=loadCompiler}) {
 const ui=useUIActionsOpcional(),language=idioma??ui?.language??'ca',t=APARADOR_R20_TEXTS[language]??APARADOR_R20_TEXTS.ca;
 const architecture=FEDIVERSITY_ARCHITECTURE_TEXTS[language]??FEDIVERSITY_ARCHITECTURE_TEXTS.ca;
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
 const patrimoni=PAGINES_DE_PATRIMONI.filter(clau=>Object.hasOwn(PAGE_COPY,clau)).map(clau=>[clau,localitzaPagina(PAGE_COPY[clau],language)]);
 return <><section aria-label={architecture.title}>
  <h3>{architecture.title}</h3>
  <p>{architecture.contract.replace('{capacitats}',FEDIVERSITY_CONTRACT_COUNTS.capacitats).replace('{metodes}',FEDIVERSITY_CONTRACT_COUNTS.metodes)}</p>
  <p><a href={FEDIVERSITY_ARCHITECTURE_URL} target="_blank" rel="noopener noreferrer">{architecture.source}</a></p>
  {/* R11 loop 3 (R35-L2-01): dt i dd són fills directes del dl. La graella de sèrie de :where(dl) (sdp.css) els espera així;
      amb un <div> per parella, en mòbil la primera columna prenia l'amplària de la frase més llarga i Developers i Operator quedaven fora. */}
  <dl>{Object.entries(FEDIVERSITY_ACTORS).map(([role,actor])=><Fragment key={role}><dt lang="en"><strong>{actor}</strong></dt><dd>{architecture.actors[role]}</dd></Fragment>)}</dl>
  <p><code>{FEDIVERSITY_FLOW}</code></p><p>{architecture.flow}</p><p>{architecture.sourceUi}</p>
  <h4>{architecture.portability}</h4><ol>{architecture.steps.map(step=><li key={step}>{step}</li>)}</ol>
  <p>{architecture.evidence}</p><ul>{SDP_NIX_EVIDENCE.map(({path,url})=><li key={path}><a href={url} target="_blank" rel="noopener noreferrer"><code>{path}</code></a></li>)}</ul>
 </section>{patrimoni.length?<nav aria-label={t.patrimoni}>
  <h3>{t.patrimoni}</h3>
  {patrimoni.map(([clau,pagina])=>{const lang=pagina.contentLanguage||'ca',altra=lang!==language;return <p key={clau} {...(altra?{lang}:{})}><a href={`/page/${clau}`} {...(altra?{hrefLang:lang}:{})}><strong>{pagina.title}</strong></a>: {pagina.subtitle}</p>;})}
 </nav>:null}<section data-sdp-privat="true" aria-label={t.compiler}>
  <h3>{t.compiler}</h3><p>{t.compilerIntro}</p><p><a href="https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f" target="_blank" rel="noopener noreferrer">{t.inspired}</a></p>
  <label>{t.label}<textarea value={text} maxLength={16000} onChange={event=>change(event.target.value)} /></label>
  <div className="sdp-alerta__accions"><button className="sdp-boto sdp-boto--primari" type="button" onClick={compile} disabled={state==='working'}>{state==='working'?t.working:t.compile}</button><button className="sdp-boto sdp-boto--secundari" type="button" onClick={()=>change('')}>{t.clear}</button></div>
  {['failed','empty'].includes(state)?<p role="status">{t[state]}</p>:null}
  {result?<div aria-live="polite"><h4>{t.result}</h4><p>SHA-256: <code>{result.sha256}</code></p><pre>{result.markdown}</pre></div>:null}
 </section><p data-sdp-batec-vida="true"><Link to="/page/avisador">L’Avisador · Batec de Vida</Link></p><ProtocolEmergenciesOfflineCard idioma={language} /></>;
}
