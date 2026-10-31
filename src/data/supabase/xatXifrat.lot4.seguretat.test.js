// @vitest-environment node
import {beforeEach,test,expect,vi} from 'vitest';
const A='aaaaaaaa-1111-4111-8111-111111111111',B='bbbbbbbb-2222-4222-8222-222222222222',F='dddddddd-3333-4333-8333-333333333333';
vi.mock('./runtime.js',()=>({rpc:vi.fn(),request:vi.fn(),getResolvedConfig:vi.fn(()=>({runtimeDataMode:'remote'}))}));
vi.mock('../identitat.js',()=>({usuariDeSessio:vi.fn(()=>({id:A})),jwtPerBackend:vi.fn(()=>'jwt')}));
const {rpc,request}=await import('./runtime.js'),X=await import('./xatXifrat.js');
const hex=n=>'\\x'+'01'.repeat(n);
const row=()=>({fil_id:F,epoca:1,destinatari_id:A,destinatari_kid:hex(16),emissor_id:A,enc:hex(65),ct:hex(48)});
beforeEach(()=>{rpc.mockReset().mockResolvedValue([]);request.mockReset().mockResolvedValue([]);});
test('RLS bytea → base64url amb marca diferenciada i filtres de fil/receptor/època',async()=>{
 request.mockResolvedValue([row()]);const [s]=await X.sobresMeusXat(F,[1]);expect(s).toMatchObject({alternatiu:true,filId:F,receptor:A,emissorId:A,epoca:1,kidReceptor:Buffer.alloc(16,1).toString('base64url')});expect(Buffer.from(s.ct,'base64url')).toHaveLength(48);
 expect(request.mock.calls[0][0]).toContain('fil_id=eq.'+F);expect(request.mock.calls[0][0]).toContain('destinatari_id=eq.'+A);expect(request.mock.calls[0][0]).toContain('epoca=in.(1)');
});
for(const [nom,canvi] of [['fil',{fil_id:B}],['receptor',{destinatari_id:B}],['emissor',{emissor_id:B}],['època',{epoca:2}],['bytea',{ct:'AQ'}],['longitud',{enc:hex(64)}]])test('Reembolcall: rebutja '+nom,async()=>{request.mockResolvedValue([{...row(),...canvi}]);await expect(X.sobresMeusXat(F,[1])).rejects.toMatchObject({codi:'reembolcall-invalid'});});
test('Reembolcalls duplicats i resposta truncada es tanquen',async()=>{request.mockResolvedValue([row(),row()]);await expect(X.sobresMeusXat(F,[1])).rejects.toThrow();request.mockResolvedValue(Array(4097).fill(row()));await expect(X.sobresMeusXat(F,[1])).rejects.toThrow();});
test('El transport original no pot injectar la marca alternatiu',async()=>{rpc.mockResolvedValue([{epoca:1,receptor:A,kid_receptor:'k',enc:'e',ct:'c',alternatiu:true}]);expect((await X.sobresMeusXat(F,[1]))[0]).not.toHaveProperty('alternatiu');});
test('Abort durant GET descarta fins i tot una resposta tardana del transport',async()=>{const c=new AbortController();request.mockImplementation(async()=>{c.abort();return [row()];});await expect(X.sobresMeusXat(F,[1],{signal:c.signal})).rejects.toMatchObject({name:'AbortError'});});
test('Roster amb rols canònics, GET acotat i sense entitats',async()=>{rpc.mockResolvedValue([{fil_id:F,epoca:0}]);request.mockResolvedValue([{usuari_id:A,rol:'propietari',com_org_id:null},{usuari_id:B,rol:'admin',com_org_id:null}]);expect((await X.estatXifratXat([F],{ambMembres:true}))[0].membres).toEqual([{usuari:A,rol:2},{usuari:B,rol:1}]);expect(request.mock.calls[0][0]).toContain('visible_fins_seq=is.null&limit=257');});
for(const rows of [[{usuari_id:A,rol:'owner'}],[{usuari_id:A,rol:'admin',com_org_id:B}],[{usuari_id:B,rol:'admin'}],[{usuari_id:A,rol:'admin'},{usuari_id:A,rol:'admin'}]])test('Roster inconsistent rebutjat',async()=>{rpc.mockResolvedValue([{fil_id:F}]);request.mockResolvedValue(rows);await expect(X.estatXifratXat([F],{ambMembres:true})).rejects.toThrow();});
test('Filtre del kid actual: hexadecimal canònic i rebuig de files d’una altra clau',async()=>{
 const kid=Buffer.alloc(16,1).toString('base64url');request.mockResolvedValue([row()]);await X.sobresMeusXat(F,[1],{kidReembolcall:kid});expect(request.mock.calls[0][0]).toContain('&destinatari_kid=eq.%5Cx'+'01'.repeat(16));
 request.mockResolvedValue([{...row(),destinatari_kid:'\\x'+'02'.repeat(16)}]);await expect(X.sobresMeusXat(F,[1],{kidReembolcall:kid})).rejects.toMatchObject({codi:'reembolcall-invalid'});
});
