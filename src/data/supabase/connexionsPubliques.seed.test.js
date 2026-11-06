import { afterAll, beforeEach, expect, test, vi } from 'vitest';
/* D-P016 (Onada R9) · L'interruptor de les RPC de 2611032100 amb el seu valor
   real (apagat) per a totes les proves; només la del transport remot l'encén. */
const bandera = vi.hoisted(() => ({ actiu: false }));
vi.mock('../../config/connexionsPubliques.js', () => ({ get CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES() { return bandera.actiu; } }));
import * as adaptador from './index.js';
import { segueix, preferenciesConnexions, desaVisibilitatConnexions, connexionsPubliquesDe } from './seguiments.js';
import { bloqueigLocalEntre, bloquejaAutor, reiniciaModeracioLocal } from './moderacio.js';
import { localPerfils, reiniciaLocalPerfils } from '../localPerfils.js';
import { reiniciaLocalSeguiments } from '../localSeguiments.js';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
const A='1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5', B='2e3f4051-6b7c-4d8e-9fa0-b1c2d3e4f5a6';
const SEED={dataMode:'seed',tenantId:'7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7'};
const xarxa=vi.fn(()=>{throw new Error('FEDI23_XARXA_VETADA');});
function entra(id){configuraBackendSessio(SEED);const user={id,user_metadata:{full_name:id===A?'Anna':'Berta'}};expect(desaSessio({access_token:'seed-fixture',user})).toBe(true);localPerfils.updateProfile(user,{is_public:true});}
beforeEach(()=>{bandera.actiu=false;vi.stubGlobal('fetch',xarxa);xarxa.mockClear();esborraSessio({abast:'tot'});reiniciaLocalSeguiments();reiniciaLocalPerfils();reiniciaModeracioLocal();entra(A);});
afterAll(()=>{esborraSessio({abast:'tot'});vi.unstubAllGlobals();});
test('seed exposa només un graf consentit també a anon, sense xarxa',async()=>{
  await segueix({tipus:'entitat',id:'rentonar'},SEED);
  expect(await connexionsPubliquesDe({tipus:'persona',id:A},SEED)).toEqual([]);
  await desaVisibilitatConnexions({tipus:'persona',id:A,visibilitatConnexions:'publica'},SEED);
  const publicades=await connexionsPubliquesDe({tipus:'persona',id:A},SEED);expect(publicades.some(c=>c.id==='rentonar')).toBe(true);
  esborraSessio({abast:'tot'});expect(await connexionsPubliquesDe({tipus:'persona',id:A},SEED)).toEqual(publicades);
  expect(xarxa).not.toHaveBeenCalled();
});
test('bloc intern bidireccional persisteix entre identitats i no enumera dades',async()=>{
  entra(B);await bloquejaAutor({tipus:'persona',id:A},SEED);esborraSessio({abast:'tot'});
  const a={tipus:'persona',id:A}, b={tipus:'persona',id:B};
  expect(bloqueigLocalEntre(a,b)).toBe(true);expect(bloqueigLocalEntre(b,a)).toBe(true);
  expect(bloqueigLocalEntre(a,{tipus:'persona',id:'persona-absent'})).toBe(false);
  expect(typeof bloqueigLocalEntre(a,b)).toBe('boolean');expect(xarxa).not.toHaveBeenCalled();
});
test('una relació bloquejada per l’extrem no reapareix a l’anònim',async()=>{
  await segueix({tipus:'entitat',id:'rentonar'},SEED);await desaVisibilitatConnexions({tipus:'persona',id:A,visibilitatConnexions:'publica'},SEED);
  await bloquejaAutor({tipus:'entitat',id:'rentonar'},SEED);esborraSessio({abast:'tot'});
  expect(await connexionsPubliquesDe({tipus:'persona',id:A},SEED)).toEqual([]);expect(xarxa).not.toHaveBeenCalled();
});
test('preferències de dues identitats no es barregen ni s’autoritzen per metadades',async()=>{
  await desaVisibilitatConnexions({tipus:'persona',id:A,visibilitatConnexions:'publica'},SEED);entra(B);
  expect((await preferenciesConnexions({tipus:'persona',id:B},SEED)).visibilitatConnexions).toBe('privada');
  await expect(preferenciesConnexions({tipus:'persona',id:A},SEED)).rejects.toMatchObject({code:'SDP-CONN-002'});
  expect(xarxa).not.toHaveBeenCalled();
});

test('D-P016 · amb el valor real de l’interruptor (apagat), l’adaptador index real en remot no fa cap fetch i respon NO-DISPONIBLE a les sis',async()=>{
  expect((await vi.importActual('../../config/connexionsPubliques.js')).CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES).toBe(false);
  const REMOT={dataMode:'remote',supabaseUrl:'http://localhost:54321',supabaseAnonKey:'sb_publishable_fixture',tenantId:SEED.tenantId};
  configuraBackendSessio(REMOT);expect(desaSessio({access_token:'jwt-fedi23-fixture',user:{id:A}})).toBe(true);
  const O='33333333-3333-4333-8333-333333333333';
  const fetch=vi.fn(async()=>{throw new Error('D-P016: cap petició');});vi.stubGlobal('fetch',fetch);
  for(const crida of [()=>adaptador.preferenciesConnexions({tipus:'persona',id:A},REMOT),()=>adaptador.desaVisibilitatConnexions({tipus:'persona',id:A,visibilitatConnexions:'publica'},REMOT),
    ()=>adaptador.connexionsPubliquesDe({tipus:'persona',id:A},REMOT),()=>adaptador.membresIEntitatsConnectadesDe({tipus:'poble',id:'la-torre-de-les-macanes'},REMOT),
    ()=>adaptador.inclouPersonaEnEntitat({orgId:O,personaId:B,rol:'treballador'},REMOT),()=>adaptador.solicitaUnirSeAEntitat({orgId:O,rol:'administrador'},REMOT)]){
    await expect(crida()).rejects.toMatchObject({code:'NO-DISPONIBLE'});
  }
  expect(fetch).not.toHaveBeenCalled();
});

test('adaptador index real executa les sis RPC amb sessió i cos explícit',async()=>{
  bandera.actiu=true; // el servidor amb la migració 2611032100 aplicada
  const REMOT={dataMode:'remote',supabaseUrl:'http://localhost:54321',supabaseAnonKey:'sb_publishable_fixture',tenantId:SEED.tenantId};
  configuraBackendSessio(REMOT);expect(desaSessio({access_token:'jwt-fedi23-fixture',user:{id:A}})).toBe(true);
  const O='33333333-3333-4333-8333-333333333333';
  const dto={tipus:'persona',id:B,nom:'Pública',avatar:'',ruta:`/gent/${B}`,creatAl:'2026-11-03T20:00:00Z',direccio:'sortint'};
  const crides=[];
  const fetch=vi.fn(async(url,opcions)=>{
    const nom=new URL(String(url)).pathname.split('/').at(-1),body=JSON.parse(opcions.body);crides.push({nom,body,headers:opcions.headers});
    const retorn=nom==='preferencies_connexions'||nom==='desa_visibilitat_connexions'?{tipus:'persona',id:A,visibilitatConnexions:body.p_visibilitat??'privada',connexions:[]}
      :nom==='inclou_persona_en_entitat'?{orgId:O,personaId:B,rol:body.p_rol}
      :nom==='solicita_unir_se_a_entitat'?{orgId:O,personaId:A,rol:body.p_rol,estat:'pendent'}:[dto];
    return {ok:true,status:200,headers:{get:()=>null},json:async()=>retorn,text:async()=>JSON.stringify(retorn)};
  });vi.stubGlobal('fetch',fetch);
  await adaptador.preferenciesConnexions({tipus:'persona',id:A},REMOT);
  await adaptador.desaVisibilitatConnexions({tipus:'persona',id:A,visibilitatConnexions:'publica'},REMOT);
  expect(await adaptador.connexionsPubliquesDe({tipus:'persona',id:A},REMOT)).toEqual([dto]);
  expect(await adaptador.membresIEntitatsConnectadesDe({tipus:'entitat',id:O},REMOT)).toEqual([dto]);
  await adaptador.inclouPersonaEnEntitat({orgId:O,personaId:B,rol:'treballador'},REMOT);
  await adaptador.solicitaUnirSeAEntitat({orgId:O,rol:'administrador'},REMOT);
  expect(crides.map(c=>c.nom)).toEqual(['preferencies_connexions','desa_visibilitat_connexions','connexions_publiques_de','membres_i_entitats_connectades_de','inclou_persona_en_entitat','solicita_unir_se_a_entitat']);
  expect(crides.every(c=>c.headers.Authorization==='Bearer jwt-fedi23-fixture')).toBe(true);
  expect(crides.at(-1).body).toEqual({p_org_id:O,p_rol:'administrador'});
});
