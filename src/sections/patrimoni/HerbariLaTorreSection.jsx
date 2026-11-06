import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {Alerta,Boto,Camp,CampText,Dialeg,Selector} from '../../components/PedraSeca/index.js';
import {useUIActions} from '../../app/contexts/UIContext';
import {ESPECIES_HERBARI_LA_TORRE_117,USOS_HERBARI_CANONICS,construeixLocucioEspecieHerbari,filtraEspeciesHerbari} from '../../data/patrimoni/herbariLaTorre117.js';
import {creaLocutorHerbariLocal} from './locutorHerbariLocal.js';
import {textosHerbari} from './textosHerbari.js';
const CLAUS_USOS=['tots','aliment','aromatica','medicinal','ornamental','artesanal','toxic'];
const MIDA=24;

function Locucio({especie,locutor,textos}){
 const [disponible,setDisponible]=useState(false),[llegint,setLlegint]=useState(false),[error,setError]=useState(false);
 const viu=useRef(false),id=useId();
 useEffect(()=>{
  viu.current=true;
  const actualitza=()=>setDisponible(locutor.local===true&&typeof locutor.disponible==='function'&&locutor.disponible('ca'));
  actualitza();const baixa=locutor.subscriu?.(actualitza);
  return()=>{viu.current=false;baixa?.();locutor.atura?.();};
 },[locutor]);
 const parla=async()=>{
  if(locutor.local!==true||!disponible)return;
  if(llegint){locutor.atura();setLlegint(false);return;}
  setError(false);setLlegint(true);
  try{await locutor.parla(construeixLocucioEspecieHerbari(especie),{privat:true,llengua:'ca'});}catch{if(viu.current)setError(true);}finally{if(viu.current)setLlegint(false);}
 };
 return <div data-sdp-privat="true" translate="no">
  <Boto disabled={!disponible} onClick={parla} aria-describedby={id}>{llegint?textos.atura:textos.veu}</Boto>
  <p id={id} role="status">{error?textos.veuError:!disponible?textos.veuAbsent:''}</p>
 </div>;
}

function Fitxa({especie,onTanca,textos,locutor}){
 const camps=[['valencia',especie.nomValencia,'ca'],['castella',especie.nomCastella,'es'],['angles',especie.nomAngles,'en'],['cientific',especie.nomCientific,'la'],['zona',especie.zonaCanaleta,'ca']];
 return <Dialeg obert onTanca={onTanca} titol={especie.nomValencia} mida="g">
  <p>{textos.documental}</p>
  <dl>{camps.map(([key,valor,lang])=><div key={key}><dt>{textos[key]}</dt><dd lang={lang}>{valor}</dd></div>)}</dl>
  <h3>{textos.usos}</h3><ul>{especie.usos.map(us=><li key={us}>{textos[CLAUS_USOS[USOS_HERBARI_CANONICS.indexOf(us)]]??us}</li>)}</ul>
  <Alerta to={especie.esToxica===true?'avis':'info'} viva={false}>{especie.esToxica===true?textos.toxicitatAdvertida:textos.toxicitatDesconeguda}</Alerta>
  <h3>{textos.font}</h3><p>{especie.font.document} · {textos.pagina} {especie.font.pagina}</p>
  <details><summary>{textos.empremta}</summary><p><code>{especie.font.sha256.match(/.{1,8}/g).map((tros,i)=><span key={i}>{tros}<wbr/></span>)}</code></p></details>
  <Locucio especie={especie} locutor={locutor} textos={textos}/>
 </Dialeg>;
}

/** Cos viu de TextSection: la pàgina i les barres continuen sent les canòniques. */
export default function HerbariLaTorreSection({locutor:injectat=null}){
 const {language='ca'}=useUIActions(),textos=textosHerbari(language);
 const [cerca,setCerca]=useState(''),[us,setUs]=useState('Tots'),[limit,setLimit]=useState(MIDA),[seleccio,setSeleccio]=useState(null);
 const locutor=useMemo(()=>injectat??creaLocutorHerbariLocal(),[injectat]);
 const especies=useMemo(()=>filtraEspeciesHerbari({cerca,usActiu:us}),[cerca,us]);
 return <section aria-label={textos.titol}>
  <h3>{textos.titol}</h3><p>{textos.documental}</p>
  <Camp etiqueta={textos.cerca}><CampText tipus="search" value={cerca} onChange={e=>{setCerca(e.target.value);setLimit(MIDA);}}/></Camp>
  <Camp etiqueta={textos.us}><Selector value={us} onChange={e=>{setUs(e.target.value);setLimit(MIDA);}} opcions={USOS_HERBARI_CANONICS.map((valor,i)=>({valor,etiqueta:textos[CLAUS_USOS[i]]}))}/></Camp>
  <p role="status">{especies.length} / {ESPECIES_HERBARI_LA_TORRE_117.length} {textos.fitxes}</p>
  {especies.length?<ol>{especies.slice(0,limit).map(especie=><li key={especie.id}>
   <Boto varietat="fantasma" onClick={()=>setSeleccio(especie)}>{especie.nomValencia} · <i>{especie.nomCientific}</i></Boto>
  </li>)}</ol>:<p>{textos.buit}</p>}
  {limit<especies.length&&<Boto onClick={()=>setLimit(n=>n+MIDA)}>{textos.mes}</Boto>}
  {seleccio&&<Fitxa key={seleccio.id} especie={seleccio} onTanca={()=>setSeleccio(null)} textos={textos} locutor={locutor}/>}
 </section>;
}
