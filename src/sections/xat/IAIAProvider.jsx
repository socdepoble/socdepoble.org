/** Optional real inference; the local assistant remains available without server configuration. */
import {useCallback,useEffect,useMemo,useRef} from 'react';
import {consultaIAIA,teCapacitat} from '../../data/backendPort.js';
import {respostaDeLaIAIA} from '../../data/iaiaLocal.js';
import {generaId as generateUUID} from './missatges.js';
import {ambitDelFil} from '../../data/ambitXat.js';
import {XatContext,useXat} from './XatContext.jsx';
import IAIALocalProvider from './IAIALocalProvider.jsx';
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export default function IAIAProvider({children,t,language='ca'}){
  const original=useXat(),live=useRef(original);live.current=original;
  const generation=useRef(0),controllers=useRef(new Set()),configuration=useRef(null);
  const stop=useCallback(()=>{generation.current++;for(const c of controllers.current)c.abort();controllers.current.clear();configuration.current=null;},[]);
  useEffect(()=>{
    stop();if(original.iaiaApagada||!original.joId||!teCapacitat('iaia'))return;
    const c=new AbortController(),epoch=generation.current;controllers.current.add(c);
    Promise.resolve().then(()=>{if(c.signal.aborted||epoch!==generation.current||live.current.iaiaApagada)return;return consultaIAIA({mode:'discover'},{signal:c.signal});}).then(v=>{if(v&&!c.signal.aborted&&epoch===generation.current)configuration.current=v;}).catch(()=>{}).finally(()=>controllers.current.delete(c));
    return stop;
  },[original.ambitEstable,original.joId,original.iaiaApagada,stop]);
  const resposta=useCallback(async(question,{signal}={})=>{
    const epoch=generation.current,c=new AbortController(),abort=()=>c.abort();controllers.current.add(c);signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)c.abort();
    try{
      if(live.current.iaiaApagada||c.signal.aborted)throw new DOMException('Cancelled','AbortError');
      // Sanejament R15 (R15-REG-05, Q-06): la pregunta només ix si el discover ha dit available===true (com el camí de grup).
      if(teCapacitat('iaia')&&configuration.current?.available===true){
        try{const out=await consultaIAIA({mode:'direct',requestId:generateUUID(),question,language},{signal:c.signal});
          if(c.signal.aborted||epoch!==generation.current)throw new DOMException('Cancelled','AbortError');if(out.source==='model'&&out.inference===true)return out.text;
        }catch(e){if(c.signal.aborted||epoch!==generation.current||e.name==='AbortError')throw e;}
      }
      if(c.signal.aborted||epoch!==generation.current)throw new DOMException('Cancelled','AbortError');return respostaDeLaIAIA(question);
    }finally{signal?.removeEventListener('abort',abort);controllers.current.delete(c);}
  },[language]);
  const send=useCallback(async(fil,text,options)=>{
    const epoch=generation.current,config=configuration.current;
    const result=await live.current.sendChatMessage(fil,text,options);
    if(epoch!==generation.current||live.current.iaiaApagada||!config?.available||config.group?.threadId!==fil?.id||ambitDelFil(fil).xifrat)return result;
    const reply=options?.respostaA&&live.current.getThreadMessages?.(fil.id)?.find(m=>m.id===options.respostaA);
    const explicit=/(^|\s)@iaia(?=\s|[.,:;!?]|$)/i.test(String(text??''))||reply?.usuariId===config.group.botId&&(reply.esIA===true||reply.is_ai===true);
    const committed=Array.isArray(result)&&result.find(m=>UUID.test(m.id??'')&&Number.isSafeInteger(m.seq)&&m.seq>0&&m.usuariId===live.current.joId);
    if(!explicit||!committed)return result;
    const c=new AbortController();controllers.current.add(c);
    // Only committed IDs go to the server. The bot reply arrives through normal chat reads.
    void Promise.resolve().then(()=>{if(c.signal.aborted||epoch!==generation.current||live.current.iaiaApagada)return;return consultaIAIA({mode:'group',requestId:generateUUID(),threadId:fil.id,messageId:committed.id,language},{signal:c.signal});}).then(v=>{if(v&&!c.signal.aborted&&epoch===generation.current)live.current.recarregaFil?.(fil.id);}).catch(()=>{}).finally(()=>controllers.current.delete(c));
    return result;
  },[language]);
  // Sanejament R15 (B4): la nota de privadesa (AvisPrivadesaIAIA) només parla del servidor amb la capacitat iaia.
  const value=useMemo(()=>({...original,sendChatMessage:send,iaiaAmbServidor:teCapacitat('iaia')}),[original,send]);
  return <XatContext.Provider value={value}><IAIALocalProvider respostaIAIA={resposta} t={t}>{children}</IAIALocalProvider></XatContext.Provider>;
}
