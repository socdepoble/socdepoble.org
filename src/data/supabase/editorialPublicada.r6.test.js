import {beforeEach,expect,test,vi} from 'vitest';
const m=vi.hoisted(()=>({user:{id:'user'},epoch:1,rpc:vi.fn()}));
vi.mock('./runtime.js',()=>({getCurrentUser:()=>m.user,getResolvedConfig:()=>({tenantId:'11111111-1111-4111-8111-111111111111',runtimeDataMode:'remote',hasSupabaseConfig:true}),rpc:m.rpc}));
vi.mock('../identitat.js',()=>({get versioSessio(){return m.epoch;}}));
import {adminActualitzaPublicacioEditorial} from './editorialPublicada.js';
const input={seccio:'mur',id:'manifest-de-poble',canvis:{content:'<p>Nou</p>'},versio:7};
beforeEach(()=>{m.user={id:'user'};m.epoch=1;m.rpc.mockReset();});
test('la RPC rep tenant configurat, patch blanc i versió exacta, no claims d’autoria',async()=>{
 const result={item:{id:input.id,_editorialClau:'feedPosts',_editorialVersio:8,content:'<p>Nou</p>'},versio:8};m.rpc.mockResolvedValue(result);
 expect(await adminActualitzaPublicacioEditorial(input)).toEqual(result);expect(m.rpc).toHaveBeenCalledWith('admin_actualitza_publicacio_editorial',{p_seccio:'mur',p_id:input.id,p_canvis:input.canvis,p_versio:7,p_tenant_id:'11111111-1111-4111-8111-111111111111'},{},{signal:undefined});
});
test('les claus d’autoritat i una sessió absent no arriben al servidor',async()=>{
 await expect(adminActualitzaPublicacioEditorial({...input,canvis:{owner_user_id:'forjat'}})).rejects.toMatchObject({code:'editorial-invalid'});m.user=null;await expect(adminActualitzaPublicacioEditorial(input)).rejects.toMatchObject({code:'sense-sessio'});expect(m.rpc).not.toHaveBeenCalled();
});
test('tradueix conflicte de versió i retira resposta si canvia la sessió',async()=>{
 m.rpc.mockRejectedValueOnce(new Error('SDP-ADMIN-006: conflict'));await expect(adminActualitzaPublicacioEditorial(input)).rejects.toMatchObject({code:'conflicte-versio'});
 m.rpc.mockImplementationOnce(async()=>{m.epoch++;return {item:{id:input.id,_editorialClau:'feedPosts',_editorialVersio:8},versio:8};});await expect(adminActualitzaPublicacioEditorial(input)).rejects.toMatchObject({name:'AbortError'});
});
test('B4-S1 · sense la migració 76 (rpc() torna 404) el codi és no-disponible i el client conserva la revisió al navegador', async () => {
 m.rpc.mockRejectedValueOnce(Object.assign(new Error('L\'esquema requerit no està aplicat (falta "admin_actualitza_publicacio_editorial").'), { status: 404 }));
 await expect(adminActualitzaPublicacioEditorial(input)).rejects.toMatchObject({ code: 'no-disponible' });
 m.rpc.mockRejectedValueOnce(new Error('SDP-ADMIN-003: cal superadmin amb aal2.'));
 await expect(adminActualitzaPublicacioEditorial(input)).rejects.toMatchObject({ code: 'cal-segon-factor' });
});
