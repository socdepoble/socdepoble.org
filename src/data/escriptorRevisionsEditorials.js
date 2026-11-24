/** Synchronous writers, reached only by writer consumers of the facade. */
import { setVal } from '../config/storage.js';
import {afegeixGeneracioEditorial} from './generacionsEditorials.js';
import { PREFIX_REVISIONS, llegeixDiariRevisions } from './diariRevisionsEditorials.js';
import { desaOperacioRevisions, esborraDiariRevisions, midaOperacioRevisions, compactaDiariEditorial, creaOperacioRevisions } from './escripturaDiariEditorial.js';
import { estat, campsPersistits, campsLocalsPendents, oblitsPendents, generacions, generacionsBase, operacionsPendents } from './estatRevisionsEditorials.js';
import { CLAU_STORAGE, carregaMapa, refrescaMapa, campsValids, servidorNet, normalitzaClau, revisioPersistida, igual, notifica } from './lectorRevisionsEditorials.js';
export { ambPanyMapaRevisions } from './panyRevisionsEditorials.js';
const confirmacionsPendents=new Map();
const MAX_CONFIRM_IDES=512,MAX_INTENTS_CONFIRM=64;
let confirmacionsRefusades=0;
const clauConfirmacio=(k,mode)=>JSON.stringify([k,mode.b,mode.s]);
function encolaConfirmacio(k,mode){
 const key=clauConfirmacio(k,mode);
 if(confirmacionsPendents.has(key))return key;
 if(confirmacionsPendents.size>=MAX_CONFIRM_IDES)return null;
 confirmacionsPendents.set(key,{k,mode:{t:'a',b:mode.b,s:mode.s},op:null});return key;
}
export const estatConfirmacionsEditorials=()=>({pendents:confirmacionsPendents.size,limit:MAX_CONFIRM_IDES,intentsPerPassada:MAX_INTENTS_CONFIRM,admissionsRefusades:confirmacionsRefusades});
function preparaEscriptor() { estat.reaplicaPendents = reaplicaPendents; }
function reaplicaPendents(anterior, actual) {
  if (anterior) for (const [clau, entrada] of anterior) {
    const delDisc = actual.get(clau);
    if (!revisioPersistida(entrada)) {
      const delta = campsLocalsPendents.get(entrada);
      if (delta && !Object.keys(delta).length) continue; // només metadata no durable: mana el disc fresc
      /* Després de quota, només es reapliquen els camps que esta pestanya
         ha canviat: un snapshot vell no pot xafar camps nous d'una altra. */
      const mode = operacionsPendents.get(entrada);
      const camps = delta ? Object.freeze({ ...(mode?.t === 'r' ? {} : delDisc?.camps || {}), ...delta }) : entrada.camps;
      const pendent = JSON.stringify(camps) === JSON.stringify(entrada.camps) ? entrada : Object.freeze({ ...entrada, camps });
      if (delta) campsLocalsPendents.set(pendent, delta);
      if (mode) operacionsPendents.set(pendent, mode);
      generacionsBase.set(pendent, generacions.get(delDisc) || '');
      actual.set(clau, pendent);
    }
  }
  for (const clau of oblitsPendents) actual.delete(clau);
 }
export function marcaConfirmacioRevisio(entrada, servidor, confirmats = {}) {
  preparaEscriptor();
  const net = servidorNet(servidor);
  if (!net) return entrada;
  const knownKey=[...(estat.cacheMem||[])].find(([,value])=>value===entrada)?.[0];
  const mode={t:'a',b:generacions.get(entrada),s:net};
  if(typeof mode.b==='string'&&(knownKey?!encolaConfirmacio(knownKey,mode):confirmacionsPendents.size>=MAX_CONFIRM_IDES)){
    confirmacionsRefusades++;return entrada; // explicit local metadata admission limit; remote ACK is separate
  }
  const nova = Object.freeze({ ...entrada, servidor: net });
  const delta = { ...(campsLocalsPendents.get(entrada) || {}) };
  for (const [camp, valor] of Object.entries(confirmats)) if (igual(delta[camp], valor)) delete delta[camp];
  campsLocalsPendents.set(nova, Object.freeze(delta));
  generacions.set(nova, generacions.get(entrada));
  operacionsPendents.set(nova, { t: 'a', b: generacions.get(entrada), s: net });
  return nova;
}
export function persisteixMapa(mapa) {
  preparaEscriptor();
  for(const [k,entrada]of mapa){const mode=operacionsPendents.get(entrada);if(mode?.t==='a'&&typeof mode.b==='string')encolaConfirmacio(k,mode);}
  if (!estat.lecturaDisponible || !estat.diariActual?.disponible) return false;
  let complet = true, canvi = false;
  const commit = (dades,preparada=null) => {
    const op = desaOperacioRevisions(PREFIX_REVISIONS, dades, estat.diariActual,preparada);
    if (op) { if(!estat.diariActual.ops.some(actual=>actual.id===op.id)){ estat.diariActual.ops.push(op); estat.diariActual.ultim = Math.max(estat.diariActual.ultim,op.n); estat.diariActual.chars += midaOperacioRevisions(PREFIX_REVISIONS, op); estat.diariActual.decodedChars += JSON.stringify(op).length; estat.diariActual.records.push({key:PREFIX_REVISIONS+op.id,text:JSON.stringify(op),ids:[op.id]}); } canvi = true; }
    else complet = false;
    return op;
  };
  const tractades=new Map();let intents=0,falladaConfirmacio=false;
  const desaConfirmacio=(key,pending)=>{
    if(tractades.has(key))return tractades.get(key);
    if(falladaConfirmacio||intents>=MAX_INTENTS_CONFIRM)return false;
    intents++;
    pending.op ||= creaOperacioRevisions({...pending.mode,k:pending.k},estat.diariActual);
    const ok=!!pending.op&&!!commit({...pending.mode,k:pending.k},pending.op);
    tractades.set(key,ok);
    if(ok)confirmacionsPendents.delete(key);else falladaConfirmacio=true;
    return ok;
  };
  for(const [key,pending]of [...confirmacionsPendents])if(!desaConfirmacio(key,pending))complet=false;
  for (const [k, entrada] of mapa) {
    const mode = operacionsPendents.get(entrada), delta = campsLocalsPendents.get(entrada);
    if (mode?.t === 'a') {
      const key=typeof mode.b==='string'?clauConfirmacio(k,mode):null;
      const ok=key&&(tractades.get(key)===true||confirmacionsPendents.has(key)&&desaConfirmacio(key,confirmacionsPendents.get(key)));
      if(ok)operacionsPendents.delete(entrada);else complet=false;
      continue;
    }
    if (revisioPersistida(entrada) || !delta || !Object.keys(delta).length) continue;
    const op = commit({ k, t: mode?.t || 'p', d: delta, at: entrada.desadaEl });
    if (op) { campsPersistits.add(entrada.camps); generacions.set(entrada, afegeixGeneracioEditorial(mode?.t === 'r' ? '' : generacionsBase.get(entrada) || '',op.id)); operacionsPendents.delete(entrada); }
  }
  for (const k of oblitsPendents) if (commit({ k, t: 'd' })) oblitsPendents.delete(k);
  if (canvi) {
    // Compatibility mirror only. Never put uncommitted RAM deltas in it.
    const anterior = estat.cacheMem; estat.cacheMem = null;
    const durable = carregaMapa(); estat.cacheMem = anterior;
    if (estat.lecturaDisponible) setVal(CLAU_STORAGE, Object.fromEntries(durable));
  }
  return complet;
}
export function restauraCampsRevisio(clau, camps) {
  preparaEscriptor();
  const mapa = refrescaMapa();
  if (camps === null) { mapa.delete(clau); oblitsPendents.add(clau); }
  else {
    const nets = campsValids(camps);
    if (!nets) return false;
    const entrada = Object.freeze({ camps: nets, desadaEl: new Date().toISOString() });
    mapa.set(clau, entrada); campsLocalsPendents.set(entrada, nets); operacionsPendents.set(entrada, { t: 'r' });
    oblitsPendents.delete(clau);
  }
  return persisteixMapa(mapa);
}
export function desaRevisioEditorial(seccio, id, camps) {
  preparaEscriptor();
  const clau = normalitzaClau(seccio, id);
  const nous = clau ? campsValids(camps) : null;
  if (!nous) return false;
  const mapa = refrescaMapa();
  const recreada = oblitsPendents.has(clau);
  oblitsPendents.delete(clau);
  const previa = mapa.get(clau);
  const fusionats = Object.freeze({ ...(previa?.camps || {}), ...nous });
  const entrada = Object.freeze({ camps: fusionats, desadaEl: new Date().toISOString() });
  generacionsBase.set(entrada, generacions.get(previa) || generacionsBase.get(previa) || '');
  if (recreada || operacionsPendents.get(previa)?.t === 'r') operacionsPendents.set(entrada, { t: 'r' });
  campsLocalsPendents.set(entrada, Object.freeze({ ...(!revisioPersistida(previa) ? campsLocalsPendents.get(previa) || previa?.camps : {}), ...nous }));
  mapa.set(clau, entrada);
  persisteixMapa(mapa);
  notifica();
  return true;
}
export function oblidaRevisioEditorial(seccio, id) {
  preparaEscriptor();
  const clau = normalitzaClau(seccio, id);
  const mapa = refrescaMapa();
  if (!clau || !mapa.has(clau)) return false;
  mapa.delete(clau);
  oblitsPendents.add(clau);
  persisteixMapa(mapa);
  notifica();
  return true;
}
export function _buidaRevisionsDelNavegadorPerAProves() {
  preparaEscriptor();
  oblitsPendents.clear();
  confirmacionsPendents.clear();confirmacionsRefusades=0;
  esborraDiariRevisions(PREFIX_REVISIONS);
  setVal(CLAU_STORAGE, {});
  estat.cacheMem = new Map();
  estat.lecturaDisponible = true; // esborrat explícit exclusiu del reset de proves
  estat.diariActual = llegeixDiariRevisions(PREFIX_REVISIONS, () => true);
  notifica();
}

/** Recovery export includes unsent fields, metadata receipts and tombstones. */
export function* pendentsRevisionsEditorials(){
 for(const [clau,entrada] of estat.cacheMem||[]){
  const operacio=operacionsPendents.get(entrada);
  if(!revisioPersistida(entrada)||operacio&&!confirmacionsPendents.has(clauConfirmacio(clau,operacio)))yield {clau,entrada,delta:campsLocalsPendents.get(entrada)||null,operacio:operacio||null};
 }
 for(const clau of oblitsPendents)yield {clau,tombstone:true};
 for(const p of confirmacionsPendents.values())yield {clau:p.k,confirmacio:p.mode,op:p.op};
}
export function gestionaRevisionsEditorials(){
 const mapa=refrescaMapa();
 const compactacio=compactaDiariEditorial(PREFIX_REVISIONS,estat.diariActual);
 const complet=persisteixMapa(refrescaMapa());
 return {compactacio,complet,disponible:estat.lecturaDisponible,peces:mapa.size};
}
