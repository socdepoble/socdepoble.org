/** Preferència LOCAL durable: no concedix entrada a la cohort del servidor.
 * Només metadades d'activació; cap frase, missatge, fragment, RK ni JWT.
 */
import { creaMagatzemIdb } from '../utils/magatzemLocal.js';
export const VIDA_OPTIN_XAT_MS = 30 * 86400000;
const falla = codi => Object.assign(new Error(codi), { codi });
const idDe = (ci, fil) => {
  let parts;try{parts=JSON.parse(ci);}catch{throw falla('opt-in-abast-invalid');}
  if(!Array.isArray(parts)||parts.length!==3||parts.some(p=>typeof p!=='string'||!p)||JSON.stringify(parts)!==ci||typeof fil!=='string'||!fil||fil.length>200)throw falla('opt-in-abast-invalid');
  return JSON.stringify([ci,fil]);
};
export function creaMagatzemOptinXat({idb=globalThis.indexedDB,navegador=globalThis.navigator,Canal=globalThis.BroadcastChannel,ara=Date.now}={}) {
  const base=creaMagatzemIdb({nom:'sdp-xat-optin-v1',idb,navegador,Canal,stores:{fils:{clau:'id'}},llistaBlanca:{fils:['id','ci','fil','kid','creatMs','caducaMs','revocatMs','revisio']}});
  let tancat=false;
  const prepara=async()=>{if(tancat)throw falla('opt-in-tancat');if(!await base.prepara()||!base.persistent)throw falla('opt-in-no-persistent');};
  const vigent=exigix=>{if(tancat)throw falla('opt-in-tancat');exigix?.();if(!base.persistent)throw falla('opt-in-no-persistent');};
  return Object.freeze({
    async llegix(ci,fil,{kid,exigix}={}) {
      const id=idDe(ci,fil);await prepara();vigent(exigix);
      const r=await base.obte('fils',id);vigent(exigix);
      const valid=r&&r.id===id&&r.ci===ci&&r.fil===fil&&typeof kid==='string'&&kid&&r.kid===kid&&Number.isSafeInteger(r.revisio)&&r.revisio>0&&Number.isSafeInteger(r.creatMs)&&r.creatMs<=ara()&&Number.isSafeInteger(r.caducaMs)&&r.caducaMs>ara()&&r.caducaMs>r.creatMs&&r.caducaMs-r.creatMs<=VIDA_OPTIN_XAT_MS&&r.revocatMs===null;
      return Object.freeze({actiu:Boolean(valid),revisio:r?.revisio??0});
    },
    async activa(ci,fil,kid,{caducaMs=ara()+VIDA_OPTIN_XAT_MS,exigix}={}) {
      const id=idDe(ci,fil),creatMs=ara();
      if(typeof kid!=='string'||!kid||!Number.isSafeInteger(caducaMs)||caducaMs<=creatMs||caducaMs-creatMs>VIDA_OPTIN_XAT_MS)throw falla('opt-in-caducitat-invalida');
      await prepara();vigent(exigix);
      await base.actualitza('fils',id,r=>{vigent(exigix);return{id,ci,fil,kid,creatMs,caducaMs,revocatMs:null,revisio:(r?.revisio??0)+1};});vigent(exigix);
    },
    async revoca(ci,fil,{exigix}={}) {
      const id=idDe(ci,fil);await prepara();vigent(exigix);
      await base.actualitza('fils',id,r=>{vigent(exigix);return{id,ci,fil,kid:r?.kid??'',creatMs:r?.creatMs??ara(),caducaMs:r?.caducaMs??ara(),revocatMs:ara(),revisio:(r?.revisio??0)+1};});vigent(exigix);
    },
    tanca(){tancat=true;base.tanca();}
  });
}
