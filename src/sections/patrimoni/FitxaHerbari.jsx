import {useEffect,useId,useRef,useState} from 'react';
import {Alerta,Boto} from '../../components/PedraSeca/index.js';
import {USOS_HERBARI_CANONICS,construeixLocucioEspecieHerbari} from '../../data/patrimoni/herbariLaTorre117.js';
import LaminesBotaniquesNode0 from './LaminesBotaniquesNode0.jsx';
import { useLaminesBotaniquesNode0 } from './useLaminesBotaniquesNode0.js';
const CLAUS_USOS=['tots','aliment','aromatica','medicinal','ornamental','artesanal','toxic'];

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

export default function FitxaHerbari({especie,textos,locutor}){
 const camps=[['valencia',especie.nomValencia,'ca'],['castella',especie.nomCastella,'es'],['angles',especie.nomAngles,'en'],['cientific',especie.nomCientific,'la'],['zona',especie.zonaHerbari,'ca']];
 const cataleg = useLaminesBotaniquesNode0();
 const lamina = cataleg?.obteLaminaBotanicaNode0(especie.id);
 return <>
  <p>{textos.documental}</p>
  <dl>{camps.map(([key,valor,lang])=><div key={key}><dt>{textos[key]}</dt><dd lang={lang}>{valor}</dd></div>)}</dl>
  <LaminesBotaniquesNode0 lamina={lamina} nom={especie.nomValencia} binomi={lamina?.binomiNet} />
  <h3>{textos.usos}</h3><ul>{especie.usos.map(us=><li key={us}>{textos[CLAUS_USOS[USOS_HERBARI_CANONICS.indexOf(us)]]??us}</li>)}</ul>
  <Alerta to={especie.esToxica===true?'avis':'info'} viva={false}>{especie.esToxica===true?textos.toxicitatAdvertida:textos.toxicitatDesconeguda}</Alerta>
  <h3>{textos.font}</h3><p>{especie.font.document} · {textos.pagina} {especie.font.pagina}</p>
  <details><summary>{textos.empremta}</summary><p><code>{especie.font.sha256.match(/.{1,8}/g).map((tros,i)=><span key={i}>{tros}<wbr/></span>)}</code></p></details>
  <Locucio especie={especie} locutor={locutor} textos={textos}/>
 </>;
}
