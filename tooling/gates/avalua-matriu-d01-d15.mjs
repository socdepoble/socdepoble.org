#!/usr/bin/env node
/** R32.15. Read-only executable thermometer, never a production certificate.
 * Runs a fixed catalogue of local, offline probes. No supplied receipts, env
 * secrets, remote requests, numeric quality scores or source-existence PASS.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { verificaRebutProduccioR3214 } from './verifica-rebut-produccio-r3214.mjs';
import { arrelSegura, esMain } from '../lib/arrel.mjs';

const testArgs = file => ['--test','--test-reporter=tap',file];
export const PROVES_MATRIU = Object.freeze([
  {id:'doctrina',timeoutMs:30000,args:['tooling/gates/tractor-doctrina.mjs'],senyal:'Tots els camins citats',limit:'Referències normatives; no avalua identitat ni qualitat humana.'},
  {id:'vocabulari',timeoutMs:30000,args:['tooling/gates/tractor-vocabulari.mjs'],senyal:'PASSA.',limit:'Contracte estàtic de classes; no comprova composició visual.'},
  {id:'llengues',timeoutMs:60000,args:testArgs('tests/enxufe-traduccio.test.mjs'),tests:true,limit:'Contracte de traducció WordPress; no certifica totes les pantalles ni qualitat lingüística.'},
  {id:'rls',timeoutMs:30000,args:['tooling/gates/tractor-rls.mjs'],senyal:'Cap infracció estàtica detectada',limit:'DDL estàtic local; no executa SQL dinàmic ni verifica Producció.'},
  {id:'definers',timeoutMs:120000,args:testArgs('tests/r3215-definers-postgres.test.mjs'),tests:true,limit:'Capsules revisades en PG18.6 natiu i PGlite local. Requerix SDP_PGLITE_MODULE; no executa el diagnòstic en Producció.'},
  {id:'xat',timeoutMs:120000,args:testArgs('tests/r3214-bundle-xat-postgres.test.mjs'),tests:true,limit:'Prèvia privada del xat i bundle sobre fixtures PG18.6/PGlite, no sobre missatges ni catàleg de Producció.'},
  {id:'arrencada',timeoutMs:30000,args:['tooling/gates/tractor-economia-arrencada.mjs','--json'],json:true,limit:'Pressupost documental local; no mesura boot web, paquet WordPress ni dispositiu físic.'},
  {id:'federacio',timeoutMs:30000,args:['tooling/gates/conformitat-federacio.mjs','--json'],json:true,limit:'Documents i hashes OpenData locals; no acredita interoperabilitat remota ni DNS del proveïdor.'},
  {id:'redireccions',timeoutMs:60000,args:testArgs('tooling/tests/mapa-redireccions-r32_14-301.test.mjs'),tests:true,limit:'Regressió i perfil sintètic 301; el temps depén del maquinari i la càrrega.'},
  {id:'persistencia',timeoutMs:30000,args:['tooling/gates/tractor-persistencia.mjs'],senyal:'0 infraccions',limit:'Senyals estàtics de persistència; no prova tots els navegadors ni pèrdues físiques de disc.'},
  {id:'social',timeoutMs:30000,args:['tooling/gates/tractor-cobertura-social.mjs','--json'],json:true,limit:'Cobertura OG del router; no acredita moderació humana o compliment jurídic global.'},
  {id:'media-porta',timeoutMs:60000,args:testArgs('tests/r3215-media-porta.test.mjs'),tests:true,limit:'Porta real WAV/PNG, MIME, truncaments, signatures OGG/AVIF/PDF i CRC MP3. El corpus complet i els oracles es validen en Vitest separat.'},
  {id:'contrast',timeoutMs:30000,args:testArgs('tests/contrast-aaa.test.mjs'),tests:true,limit:'Contrastos resolubles sense DOM; no certifica WCAG completa, lector de pantalla ni 320px real.'},
  {id:'offline',timeoutMs:60000,args:testArgs('tests/cua-operacions-offline.test.mjs'),tests:true,limit:'Convergència en fixtures locals; no simula tots els dispositius, xarxes ni corrupció física.'},
  {id:'consola',timeoutMs:60000,args:['tooling/gates/tractor-consola-neta.mjs','--json'],json:true,limit:'Motor local amb els torns presents i el rellotge declarat; no acredita instal·lació de dimonis ni el catàleg del viu.'},
  {id:'arrel',timeoutMs:30000,args:['tooling/gates/tractor-arrel.mjs','--json'],json:true,limit:'Integritat de punts d’entrada; no substituïx Vitest, NodeALL, ESLint ni benchmark de producció.'}
].map(p=>Object.freeze({...p,args:Object.freeze(p.args)})));

const DIMENSIONS = [
  ['D01',['doctrina']],['D02',['vocabulari']],['D03',['llengues']],
  ['D04',['rls','definers']],['D05',['rls','definers']],['D06',['arrencada']],['D07',['federacio']],
  ['D08',['xat']],['D09',['persistencia']],['D10',['social']],
  ['D11',['media-porta']],['D12',['contrast']],['D13',['offline']],
  ['D14',['consola']],['D15',['redireccions','arrel']]
];
const EXTERNS = Object.freeze([
  {id:'apple-testflight',dimensions:['D06','D15'],motiu:'Credencials SDP_ASC_* i verificació TestFlight amb dispositiu. No llegides ni comprovades.'},
  {id:'google-play',dimensions:['D06','D15'],motiu:'Service Account Google Play i prova del lliurament real. No llegits ni comprovats.'},
  {id:'push-fisic',dimensions:['D09','D13','D15'],motiu:'Claus FCM/APNs i recepció en dispositius físics. No llegides ni comprovades.'},
  {id:'sql-produccio',dimensions:['D04','D05','D08'],motiu:'Rebut R32.14 aportat verificat separadament per SHA-256; P2 registra_denuncia_diligent i blindatge dels 7 definers R32.15 continuen pendents. Les fixtures locals no acrediten SQL posterior en Producció.'},
  {id:'sollutia',dimensions:['D07','D13'],motiu:'Endpoints reals i credencials de Sollutia, sense xarxa externa en esta execució.'},
  {id:'federacio-remota',dimensions:['D07','D13'],motiu:'Interoperabilitat real, transport amb IP fixada i entrega remota encara requerixen validació de desplegament.'}
]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function regular(root, relative) {
  let abs=root;
  for(const part of relative.split('/')) {
    if(!part||part==='.'||part==='..')throw Error('MATRIU_RUTA');
    abs=path.join(abs,part);if(fs.lstatSync(abs).isSymbolicLink())throw Error('MATRIU_ENLLAC');
  }
  const st=fs.statSync(abs);if(!st.isFile()||st.size>8*1024*1024)throw Error('MATRIU_FONT');
  return {ruta:relative,sha256:sha(fs.readFileSync(abs))};
}
function resultat(prova, raw) {
  const exit=Number.isInteger(raw?.status)?raw.status:null;
  if(exit!==0||raw?.signal||raw?.error)return {estat:'fallida',exit,
    motiu:raw?.error?.code==='ETIMEDOUT'?'temps_sonda_exhaurit':raw?.error?'execucio_no_completada':raw?.signal?'sonda_terminada_per_senyal':'exit_no_zero',
    ...(raw?.signal?{signal:raw.signal}:{}),...(typeof raw?.error?.code==='string'?{codiError:raw.error.code}:{})};
  const out=typeof raw.stdout==='string'?raw.stdout:'';
  if(prova.syntax)return {estat:'verificada',exit,tipus:'sintaxi',abast:'node --check'};
  if(prova.tests) {
    const counts={};for(const n of ['tests','pass','fail','cancelled','skipped','todo']) {
      const matches=[...out.matchAll(new RegExp(`^# ${n} (\\d+)$`,'gm'))];if(matches.length!==1)return {estat:'fallida',exit,motiu:'resum_tests_absent_o_ambigu'};
      counts[n]=Number(matches[0][1]);
    }
    if(!Object.values(counts).every(Number.isSafeInteger)||counts.tests<1||counts.pass<1
      ||counts.tests!==counts.pass+counts.fail+counts.cancelled+counts.skipped+counts.todo
      ||counts.fail||counts.cancelled||counts.todo)return {estat:'fallida',exit,motiu:'tests_no_acreditats',comptadors:counts};
    return {estat:'verificada',exit,tipus:'tests_executats',comptadors:counts};
  }
  if(prova.json) {
    try {
      const j=JSON.parse(out);
      let verified=false;
      if(typeof j.valid==='boolean')verified=j.valid;
      else if(prova.id==='federacio')verified=j.federation?.valid===true&&j.openData?.valid===true;
      else if(Array.isArray(j.infraccions))verified=j.infraccions.length===0&&(j.ok===undefined||j.ok===true);
      if(!verified)return {estat:'fallida',exit,motiu:'veredicte_json_no_verificat'};
    }catch{return {estat:'fallida',exit,motiu:'json_invalid'};}
  }else if(!out.includes(prova.senyal))return {estat:'fallida',exit,motiu:'senyal_absent'};
  return {estat:'verificada',exit,tipus:'porta_executada'};
}
export function avaluaMatriu(root, { ara = Date.now(), executa = (args,opts)=>spawnSync(process.execPath,args,opts) } = {}) {
  if(!Number.isSafeInteger(ara)||!Number.isFinite(new Date(ara).getTime()))throw Error('MATRIU_RELLOTGE_INVALID');
  const base=fs.realpathSync(root), proves=[];
  const rebutsProduccio=verificaRebutProduccioR3214(base);
  for(const p of PROVES_MATRIU) {
    let font;
    try {
      font=regular(base,p.args.find(a=>!a.startsWith('-')));
      const args=[...p.args,...(p.id==='consola'?[`--ara=${new Date(ara).toISOString()}`]:[])];
      const raw=executa(args,{cwd:base,encoding:'utf8',timeout:p.timeoutMs,killSignal:'SIGKILL',maxBuffer:4*1024*1024,
        env:{PATH:process.env.PATH??'',HOME:process.env.HOME??'',TMPDIR:process.env.TMPDIR??'/tmp',LANG:'C',TZ:'UTC',SDP_ARREL:base,
          ...(process.env.SDP_PGLITE_MODULE?{SDP_PGLITE_MODULE:process.env.SDP_PGLITE_MODULE}:{})},shell:false});
      const after=regular(base,font.ruta);
      proves.push({id:p.id,timeoutMs:p.timeoutMs,font,...(after.sha256===font.sha256?resultat(p,raw):{estat:'fallida',exit:null,motiu:'font_canviada_durant_prova'})});
    }catch{proves.push({id:p.id,timeoutMs:p.timeoutMs,...(font?{font}:{}),estat:'no_mesurada',exit:null,motiu:'font_absent_o_execucio_impossible'});}
  }
  const dimensions=DIMENSIONS.map(([id,ids])=>{
    const selected=ids.map(k=>proves.find(p=>p.id===k));
    return {id,evidenciesVerificades:selected.filter(p=>p.estat==='verificada'),
      estatCodiLocal:selected.some(p=>p.estat==='fallida')?'regressio_detectada':selected.some(p=>p.estat==='no_mesurada')?'no_mesurat':'senyals_parcials_verificats',
      notaCodiLocal:null,
      limitsTecnicsReals:[...ids.map(k=>PROVES_MATRIU.find(p=>p.id===k).limit),'Cap senyal parcial equival a una nota 10/10 de tota la dimensió.'],
      bloquejosExternsLlei0:EXTERNS.filter(e=>e.dimensions.includes(id)).map(({id,motiu})=>({id,estat:'no_verificat',motiu}))};
  });
  return {schema:'sdp.matriu-d01-d15.v1',rellotge:new Date(ara).toISOString(),valid:proves.every(p=>p.estat==='verificada')&&rebutsProduccio.valid,rebutsProduccio,nomesLectura:true,xarxaExterna:false,
    criteri:'valid acredita exclusivament les portes enumerades, mai Producció ni una nota global.',proves,dimensions,
    resum:{dimensions:15,senyalsVerificats:proves.filter(p=>p.estat==='verificada').length,senyalsPrevistos:PROVES_MATRIU.length,
      notaGlobal:null,bloquejosExterns:EXTERNS.map(e=>e.id)}};
}
if(esMain(import.meta.url)) {
  try {
    if(process.argv.slice(2).some(a=>a!=='--json'&&!a.startsWith('--arrel=')&&!a.startsWith('--ara=')))throw Error('Ús: --json [--arrel=RUTA] [--ara=ISO]');
    const clock=process.argv.slice(2).find(a=>a.startsWith('--ara='));
    const r=avaluaMatriu(arrelSegura(),clock?{ara:Date.parse(clock.slice(6))}:{});console.log(JSON.stringify(r,null,2));process.exitCode=r.valid?0:1;
  }catch{console.log(JSON.stringify({schema:'sdp.matriu-d01-d15.v1',valid:false,error:'No s’ha pogut completar el termòmetre local.'}));process.exitCode=2;}
}
