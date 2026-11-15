import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, test, vi } from 'vitest';
import { creaReceptorCompartit } from './compartirNatiu.js';
import { canviaSessioCompartit, compartitPendent, descartaCompartit, lliuraCompartit, registraTalladorCompartit, sessioCompartit } from '../config/compartirNatiu.js';

afterEach(()=>{descartaCompartit();registraTalladorCompartit(null);vi.useRealTimers();});
async function setup({nativePromise=async()=>({generacioNativa:'1'}),llegix}={}){
 let rep;
 const finestra={Capacitor:{addListener:(_plugin,_event,fn)=>{rep=fn;return {remove(){}};},convertFileSrc:p=>p,nativePromise},CustomEvent:globalThis.CustomEvent,dispatchEvent:vi.fn()};
 const receptor=creaReceptorCompartit({finestra,llegix,sessio:sessioCompartit,registraTallador:registraTalladorCompartit});
 await receptor.escolta(lliuraCompartit);
 return {rep,receptor};
}
const buida=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};

test('iOS connecta captura original, generació, retenció i payload abans del callback JS',()=>{
 const swift=fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../ios/App/App/CompartirNatiuPlugin.swift'),'utf8').replace(/\/\/[^\n]*/g,'');
 expect(swift.match(/let entrada = barrera\.prenEntrada\(\)/g)).toHaveLength(2);
 expect(swift).toContain('junts.entrada = entrada');
 expect(swift).toContain('guard barrera.esVigent(entrada) else { return }');
 expect(swift).toContain('self.barrera.siVigent(entrada) {');
 expect(swift).toContain('retainedEventArguments?.removeObject(forKey: Self.esdeveniment)');
 expect(swift).toContain('"rebutMs": entrada.rebutMs');
 expect(swift).toContain('"caducaAmbSessio": true');
 expect(swift).toContain('"generacioNativa": String(entrada.generacio)');
 expect(swift).toContain('"generacioNativa": String(generacioNativa)');
 expect(swift).toContain('self?.recull(intent: intent + 1, entrada: entrada)');
});

test.each([0,1,300001,900000])('callback ja enviat a toJs: rebutja origen antic o empat (%ims), sense caducitat del blindatge',async(edat)=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-15T02:40:00Z'));
 const {rep,receptor}=await setup();const rebutMs=Date.now()-edat;
 canviaSessioCompartit();
 await buida();
 rep({fitxers:[],text:'Text privat de la persona anterior',rebutjats:0,rebutMs,caducaAmbSessio:true,generacioNativa:'0'});
 await buida();expect(compartitPendent()).toBeNull();receptor.tanca();
});

test('control favorable: text nou després del tall continua disponible',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-15T02:40:00Z'));
 const {rep,receptor}=await setup();canviaSessioCompartit();
 await buida();
 // Un rellotge que retrocedix tampoc rebutja una entrada causalment nova.
 vi.setSystemTime(Date.now()-10000);
 rep({fitxers:[],text:'Text nou triat per la persona actual',rebutjats:0,rebutMs:Date.now(),caducaAmbSessio:true,generacioNativa:'1'});
 await buida();expect(compartitPendent()?.text).toBe('Text nou triat per la persona actual');receptor.tanca();
});

test.each([undefined,null,1,'01','-1','18446744073709551616'])('un payload causal no pot ometre o falsificar la generació (%s)',async(generacioNativa)=>{
 const {rep,receptor}=await setup();canviaSessioCompartit();
 await buida();
 rep({fitxers:[],text:'Origen desconegut',rebutjats:0,rebutMs:Date.now(),caducaAmbSessio:true,generacioNativa,sessioNativaValidada:true});
 await buida();expect(compartitPendent()).toBeNull();receptor.tanca();
});

const oberta=()=>{let resol,rebutja;const promesa=new Promise((r,j)=>{resol=r;rebutja=j;});return {promesa,resol,rebutja};};
const payload=(generacioNativa,extra={})=>({fitxers:[],text:'Text causal',rebutjats:0,rebutMs:Date.now(),caducaAmbSessio:true,generacioNativa,...extra});

test('bloqueja mentre ACK és pendent i admet text nou després de l’ACK',async()=>{
 const ack=oberta();const {rep,receptor}=await setup({nativePromise:()=>ack.promesa});
 canviaSessioCompartit();rep(payload('1'));await buida();
 expect(compartitPendent()).toBeNull();
 ack.resol({generacioNativa:'1'});await buida();rep(payload('1'));await buida();
 expect(compartitPendent()?.text).toBe('Text causal');receptor.tanca();
});

test('doble tall: ACK antic fora d’ordre no reobri la generació anterior',async()=>{
 const a=oberta(),b=oberta();let crides=0;
 const {rep,receptor}=await setup({nativePromise:()=>[a,b][crides++].promesa});
 canviaSessioCompartit();canviaSessioCompartit();await buida();
 b.resol({generacioNativa:'2'});await buida();
 rep(payload('1'));await buida();expect(compartitPendent()).toBeNull();
 rep(payload('2'));await buida();expect(compartitPendent()?.text).toBe('Text causal');descartaCompartit();
 a.resol({generacioNativa:'1'});await buida();
 rep(payload('1'));await buida();expect(compartitPendent()).toBeNull();
 rep(payload('2'));await buida();expect(compartitPendent()?.text).toBe('Text causal');receptor.tanca();
});

test.each([{},null,{generacioNativa:1},{generacioNativa:'-1'},{generacioNativa:'01'}])('ACK absent o invàlid falla tancat (%j)',async(ack)=>{
 const {rep,receptor}=await setup({nativePromise:async()=>ack});canviaSessioCompartit();await buida();
 rep(payload('1'));await buida();expect(compartitPendent()).toBeNull();receptor.tanca();
});

test('ACK rebutjat falla tancat; Android/legacy sense marca continua entrant',async()=>{
 const {rep,receptor}=await setup({nativePromise:async()=>{throw Error('pont no disponible');}});
 canviaSessioCompartit();await buida();rep(payload('1'));await buida();expect(compartitPendent()).toBeNull();
 rep({fitxers:[],text:'Text Android/legacy',rebutjats:0});await buida();
 expect(compartitPendent()?.text).toBe('Text Android/legacy');receptor.tanca();
});

test('payload ja en toJs d’abans del tall es rebutja encara que el rellotge retrocedisca',async()=>{
 const {rep,receptor}=await setup();const antic=payload('0',{rebutMs:1000});
 canviaSessioCompartit(900);await buida();rep(antic);await buida();
 expect(compartitPendent()).toBeNull();receptor.tanca();
});

test('canvi durant lectura de fitxer: ni el payload vell ni la seua finestra es publiquen',async()=>{
 const lectura=oberta();const llegix=vi.fn(()=>lectura.promesa);
 const {rep,receptor}=await setup({llegix});
 rep(payload('0',{fitxers:[{ruta:'/data/privat.png',mime:'image/png',mida:1,nom:'privat.png'}]}));await buida();
 expect(llegix).toHaveBeenCalledTimes(1);canviaSessioCompartit();await buida();
 lectura.resol({ok:true,blob:async()=>new Blob(['x'],{type:'image/png'})});await buida();
 expect(compartitPendent()).toBeNull();receptor.tanca();
});
