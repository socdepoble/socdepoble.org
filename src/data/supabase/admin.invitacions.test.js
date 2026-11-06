import {beforeEach,expect,test,vi} from 'vitest';
const m=vi.hoisted(()=>({user:{id:'actor'},epoch:1,rpc:vi.fn(),mode:'remote'}));
vi.mock('./runtime.js',()=>({getCurrentUser:()=>m.user,rpc:m.rpc,getResolvedConfig:c=>({hasSupabaseConfig:true,tenantId:c.tenantId,runtimeDataMode:m.mode})}));
vi.mock('../identitat.js',()=>({get versioSessio(){return m.epoch;}}));
import {adminLlistaUsuarisRegistrats,adminAssignaMembreOrganitzacio,adminConnectaUsuari} from './admin.js';
const tenant='11111111-1111-4111-8111-111111111111',person='22222222-2222-4222-8222-222222222222',org='33333333-3333-4333-8333-333333333333',invite='44444444-4444-4444-8444-444444444444';
const at='2026-11-06T00:00:00Z',config={tenantId:tenant};
const row=()=>({id:person,full_name:'Persona sintètica',username:'sintetica',avatar_url:null,town_name:'Poble',created_at:at,baixa:false,consentiment:true,correu_mascarat:'p***@example.invalid',organitzacions:[{id:org,nom:'Organització',rol:'member'}]});
const invitation=()=>({invitacioId:invite,usuariId:person,organitzacioId:org,rol:'member',estat:'pendent',caducaAl:at});
beforeEach(()=>{m.rpc.mockReset();m.user={id:'actor'};m.epoch=1;m.mode='remote';});
test('admin list maps a bounded cursor and validates the masked consented server projection',async()=>{
 m.rpc.mockResolvedValue([row()]);expect(await adminLlistaUsuarisRegistrats({limit:1,cursorCreat:at,cursorId:person},config)).toEqual([row()]);
 expect(m.rpc).toHaveBeenCalledWith('admin_llista_usuaris_registrats',{p_tenant_id:tenant,p_limit:1,p_cursor_creat:at,p_cursor_id:person},config,{signal:undefined});
});
test('no legacy offset, role, removal, category or accessor reaches the RPC',async()=>{
 for(const input of [{limit:51},{offset:0},{cursorCreat:at},{get limit(){throw Error('getter');}}])await expect(adminLlistaUsuarisRegistrats(input,config)).rejects.toThrow();
 for(const extra of [{rol:'admin'},{lleva:true},{actor:person}])await expect(adminAssignaMembreOrganitzacio({usuariId:person,organitzacioId:org,...extra},config)).rejects.toThrow();
 await expect(adminConnectaUsuari({usuariId:person,categoria:'amics'},config)).rejects.toThrow();expect(m.rpc).not.toHaveBeenCalled();
});
test('compatibility method proposes an invitation and refuses evidence of direct assignment',async()=>{
 m.rpc.mockResolvedValue(invitation());expect(await adminAssignaMembreOrganitzacio({usuariId:person,organitzacioId:org},config)).toEqual(invitation());
 expect(m.rpc).toHaveBeenCalledWith('admin_convida_a_entitat',{p_tenant_id:tenant,p_usuari_id:person,p_organitzacio_id:org},config,{signal:undefined});
 for(const value of [{...invitation(),rol:'admin'},{...invitation(),estat:'acceptada'},{...invitation(),usuariId:org},{...invitation(),email:'private@example.invalid'}]){m.rpc.mockResolvedValue(value);await expect(adminAssignaMembreOrganitzacio({usuariId:person,organitzacioId:org},config)).rejects.toThrow();}
});
test('unexpected private fields, unmasked emails, withdrawal, duplicates and nested role claims reject the list',async()=>{
 const hostile=[null,[{...row(),email:'private@example.invalid'}],[{...row(),correu_mascarat:'private@example.invalid'}],[{...row(),consentiment:false}],[{...row(),baixa:true}],[row(),row()],[{...row(),organitzacions:[{...row().organitzacions[0],correu:'private'}]}]];
 for(const value of hostile){m.rpc.mockResolvedValue(value);await expect(adminLlistaUsuarisRegistrats({},config)).rejects.toThrow();}
 let reads=0;const getter={...row()};Object.defineProperty(getter,'id',{enumerable:true,get(){reads++;return person;}});m.rpc.mockResolvedValue([getter]);await expect(adminLlistaUsuarisRegistrats({},config)).rejects.toThrow();expect(reads).toBe(0);
});
test('connection returns only the actual actor follow, with no fabricated category or reciprocal relation',async()=>{
 const value={usuariId:person,vincle:{seguint:true,creat_al:at,nou:true,primer:true}};m.rpc.mockResolvedValue(value);expect(await adminConnectaUsuari({usuariId:person},config)).toEqual(value);
 expect(m.rpc).toHaveBeenCalledWith('admin_connecta_usuari',{p_tenant_id:tenant,p_usuari_id:person},config,{signal:undefined});
 m.rpc.mockResolvedValue({...value,categoria:'amics'});await expect(adminConnectaUsuari({usuariId:person},config)).rejects.toThrow();
});
test('tenant, session, offline mode, server rejection and replaced session fail closed',async()=>{
 await expect(adminLlistaUsuarisRegistrats()).rejects.toMatchObject({code:'abast-invalid'});m.user=null;await expect(adminLlistaUsuarisRegistrats({},config)).rejects.toMatchObject({code:'sense-sessio'});
 m.user={id:'actor'};m.mode='seed';await expect(adminLlistaUsuarisRegistrats({},config)).rejects.toMatchObject({code:'no-disponible'});m.mode='remote';
 const error=Object.assign(new Error('denied'),{status:403});m.rpc.mockRejectedValueOnce(error);await expect(adminLlistaUsuarisRegistrats({},config)).rejects.toBe(error);
 let resolve;m.rpc.mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));const pending=adminLlistaUsuarisRegistrats({},config);m.epoch++;resolve([row()]);await expect(pending).rejects.toMatchObject({name:'AbortError'});
});
