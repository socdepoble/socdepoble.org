import {afterEach,expect,test,vi} from 'vitest';
import {capturaEdicioEditorial,fusionaPaginesEditorials,aplicaCanvisEditorials} from './editorialPublicada.js';
import {creaAdaptadorLocal} from './local/adaptadorLocal.js';
import {configuraBackendSessio,desaSessio,esborraSessio} from './identitat.js';
const TENANT='11111111-1111-4111-8111-111111111111',USER='1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const instances=[];
afterEach(async()=>{esborraSessio({abast:'tot'});await Promise.all(instances.splice(0).map(a=>a.destroy()));});
const edit=(versio=1)=>({seccio:'mur',id:'manifest-de-poble',canvis:{title:'Manifest nou',content:'<p>Complet</p>'},versio});
function local(autoritat=true){const adapter=creaAdaptadorLocal({mode:'local',tenantId:TENANT,dades:{feedPosts:[{id:'manifest-de-poble',title:'Manifest',content:'original',author:'Sóc de Poble',pobles_etiquetats:['benillup']}],pages:[{id:'projecte',title:'Projecte',html:'vell'}]},administracioLocal:autoritat?{pobles:[{id:TENANT,slug:'torre',nom:'La Torre'}],autoritza:async({personaId})=>personaId===USER}:null});instances.push(adapter);configuraBackendSessio(adapter.configuracio);desaSessio({access_token:'local-r12',user:{id:USER}});return adapter;}
test('les dades i accessors no poden fabricar autoria ni executar codi en validar',()=>{
 const getter=vi.fn(()=> 'mur'),input={...edit()};Object.defineProperty(input,'seccio',{get:getter});
 expect(()=>capturaEdicioEditorial(input)).toThrow();expect(getter).not.toHaveBeenCalled();
 for(const canvis of [{author:'forjat'},{content:{}},{tags:[{}]},{content:'x'.repeat(524289)}])expect(()=>capturaEdicioEditorial({...edit(),canvis})).toThrow();
});
test('el local edita l’original complet, el recarrega amb versió nova i rebutja CAS antic',async()=>{
 const a=local(),before=await a.loadMur();expect(before.feedPosts[0]).toMatchObject({_editorialClau:'feedPosts',_editorialVersio:1});
 const result=await a.adminActualitzaPublicacioEditorial(edit());expect(result).toMatchObject({versio:2,item:{content:'<p>Complet</p>',author:'Sóc de Poble',pobles_etiquetats:['benillup']}});
 expect((await a.loadMur()).feedPosts[0].content).toBe('<p>Complet</p>');
 await expect(a.adminActualitzaPublicacioEditorial(edit())).rejects.toMatchObject({code:'conflicte-versio'});
 const page=await a.adminActualitzaPublicacioEditorial({seccio:'pagines',id:'projecte',canvis:{html:'<p>Nou</p>'},versio:1});expect(page.item.html).toBe('<p>Nou</p>');expect((await a.loadCoreContent()).pages[0]._editorialVersio).toBe(2);
});
test('cap rol declarat pel client fabrica autoritat local per a la nova capacitat',async()=>{
 const a=local(false);await expect(a.adminActualitzaPublicacioEditorial(edit(),{role:'superadmin',aal:'aal2'})).rejects.toMatchObject({code:'no-disponible'});
});

test('la llavor vigent conserva IDEA92 fins edició explícita i després preval la pàgina remota fins i tot buida',()=>{
 const seed=[{id:'constitucio',title:'Text nou',html:'<p>Regles clares</p>'}];
 const legacy=[{id:'constitucio',title:'Antic',html:'<p>Metàfores antigues</p>'},{id:'pagina-del-poble',html:'<p>Pròpia</p>'}];
 const result=fusionaPaginesEditorials(legacy,seed,7);expect(result[0]).toMatchObject({title:'Text nou',html:'<p>Regles clares</p>',_editorialVersio:7});expect(result[1]).toMatchObject({id:'pagina-del-poble',html:'<p>Pròpia</p>'});
 expect(fusionaPaginesEditorials([{...legacy[0],editorial_format:'html-r6',html:''}],seed,8)[0].html).toBe('');
});

test('el local invalida traduccions només en modificar text i la fusió no les reintroduïx',()=>{
 const page={id:'constitucio',html:'vell',translations:{es:{html:'antic'}},i18n:{es:{html:'antic'}},contentLanguage:'es'};
 expect(aplicaCanvisEditorials(page,{html:'nou'},'pagines')).toMatchObject({html:'nou',contentLanguage:'ca'});expect(aplicaCanvisEditorials(page,{html:'nou'},'pagines').translations).toBeUndefined();
 expect(aplicaCanvisEditorials(page,{html:'vell',image:'/foto'},'pagines').translations).toEqual(page.translations);
 const merged=fusionaPaginesEditorials([{id:page.id,html:'',contentLanguage:'ca',editorial_format:'html-r6'}],[page],8)[0];expect(merged.html).toBe('');expect(merged.translations).toBeUndefined();expect(merged.i18n).toBeUndefined();
});

test('l’edició editorial funciona en Safari16 sense String.isWellFormed i rebutja UTF16 trencat',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(String.prototype,'isWellFormed');
 try{Object.defineProperty(String.prototype,'isWellFormed',{value:undefined,configurable:true,writable:true});expect(capturaEdicioEditorial({...edit(),canvis:{content:'<p>Vàlencia 🏡</p>',tags:['País 🏡']}}).canvis.content).toContain('🏡');expect(()=>capturaEdicioEditorial({...edit(),canvis:{content:'\ud800'}})).toThrow();}
 finally{if(descriptor)Object.defineProperty(String.prototype,'isWellFormed',descriptor);else delete String.prototype.isWellFormed;}
});
