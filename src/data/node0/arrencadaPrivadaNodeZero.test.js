import {afterEach,beforeEach,expect,test,vi} from 'vitest';
vi.mock('../../PedraSecaEmbed.jsx',()=>({defineCustomElement:vi.fn()}));
vi.mock('../supabase/index.js',()=>{throw new Error('SUPABASE_NO_HA_D_ENTRAR_EN_NODE0_PRIVAT');});
const ORIGIN='https://socdepoble.cat',BASE=ORIGIN+'/api/v1/node0';
const PERSON=Object.freeze({id:'11111111-1111-4111-8111-111111111111',email:'fixture@example.invalid',email_confirmed_at:'2026-11-04T00:00:00Z',user_metadata:{full_name:'Fixture verificada'}});
const capabilities={userSessions:true,actorBinding:true,roleRead:true,norms:true,createOrganization:true,sectionSubmissions:true,paginacioSeccions:true};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const barrier=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
beforeEach(()=>{vi.resetModules();vi.stubEnv('VITE_SDP_NODE0_HTTP','1');vi.stubEnv('VITE_SDP_NODE0_PRIVAT','0');vi.stubGlobal('location',{origin:ORIGIN,href:ORIGIN+'/node0/'});});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
const carrega=async privateFlag=>{vi.stubEnv('VITE_SDP_NODE0_PRIVAT',privateFlag);return import('./arrencadaNodeZero.js');};

test.each([undefined,'','0','true','yes','01'])('private flag %s stays off, including host declarations and Node0 hostname',async flag=>{
  const helper=await carrega(flag);vi.stubGlobal('SocDePobleConfig',{VITE_SDP_NODE0_PRIVAT:'1'});
  const fetchImpl=vi.fn(()=>{throw new Error('No cookie/status request expected');});
  const receipt=await helper.preparaArrencadaNodeZero(ORIGIN,{fetchImpl});
  expect(helper.NODE_ZERO_PRIVAT_ACTIU).toBe(false);expect(receipt).toMatchObject({privatSollicitat:false,privatActiu:false,autenticacio:false,escriptura:false});expect(fetchImpl).not.toHaveBeenCalled();
});
test('private opt-in alone never selects Node0 in the default public/backend mode',async()=>{
  vi.stubEnv('VITE_SDP_NODE0_HTTP','0');const helper=await carrega('1');const fetchImpl=vi.fn();
  expect(helper.NODE_ZERO_PRIVAT_ACTIU).toBe(true);expect(await helper.preparaArrencadaNodeZero(ORIGIN,{fetchImpl})).toBeNull();
  expect((await import('../backendPort.js')).getBackendImplementation()).toEqual({});expect(fetchImpl).not.toHaveBeenCalled();
});
test('private flag is captured at module load and cannot be enabled after bootstrap import',async()=>{
  const helper=await carrega('0');vi.stubEnv('VITE_SDP_NODE0_PRIVAT','1');const fetchImpl=vi.fn();
  expect(helper.NODE_ZERO_PRIVAT_ACTIU).toBe(false);expect((await helper.preparaArrencadaNodeZero(ORIGIN,{fetchImpl})).privatActiu).toBe(false);expect(fetchImpl).not.toHaveBeenCalled();
});
test('canonical cookie helper accepts native Response byte chunks across the browser test realm',async()=>{
  const {creaSessioNodeZeroHttp}=await import('./sessioNodeZeroHttp.js');
  const helper=creaSessioNodeZeroHttp({endpoint:BASE,fetchImpl:async()=>json({user:PERSON})});
  try{await expect(helper.demanaAuth('session')).resolves.toEqual({user:PERSON});}finally{helper.destroy();}
});
test('verified cookie session settles before host injection and real port reads use the bound private API',async()=>{
  const helper=await carrega('1'),started=barrier(),release=barrier();
  const fetchImpl=vi.fn(async(url,init)=>{
    if(url===BASE+'/status'){expect(init.credentials).toBe('omit');return json({node:'node0',postgresql:{ok:true},capabilities});}
    if(url===BASE+'/auth/session'){expect(init.credentials).toBe('same-origin');started.resolve();await release.promise;return json({user:PERSON});}
    if(url===BASE+'/private/loadNotes'){
      expect(init.method).toBe('POST');expect(init.credentials).toBe('same-origin');expect(init.headers['X-SDP-Expected-Actor']).toBe(PERSON.id);expect(JSON.parse(init.body)).toEqual({});return json({rows:[],limit:100});
    }
    throw new Error('Unexpected origin or route');
  });
  const pending=helper.preparaArrencadaNodeZero(ORIGIN,{fetchImpl});expect(helper.preparaArrencadaNodeZero(ORIGIN,{fetchImpl})).toBe(pending);
  await started.promise;const port=await import('../backendPort.js');expect(port.getBackendImplementation()).toEqual({});
  release.resolve();const receipt=await pending;
  expect(receipt).toMatchObject({privatSollicitat:true,privatActiu:true,autenticacio:true,escriptura:true,xat:false,xatText:true,xatTempsReal:false});
  expect(port.getCurrentUser()?.id).toBe(PERSON.id);expect(port.getCurrentUser()?.access_token).toBeUndefined();
  expect(port.teCapacitat('sessio')).toBe(true);expect(port.teCapacitat('normesConvivencia')).toBe(true);expect(port.teCapacitat('paginacioSeccions')).toBe(true);
  const host=await import('../../host.js');host.configura({auth:{issuer:ORIGIN+'/auth',persistencia:'pestanya'}});await host.arrenca();
  expect((await port.loadNotes(PERSON.id)).notes).toEqual([]);
  await expect(port.loginWithGoogle()).rejects.toMatchObject({codi:'sense-capacitat'});await expect(port.subscribeToXat('unknown',()=>{})).rejects.toMatchObject({codi:'sense-capacitat'});
  expect(fetchImpl).toHaveBeenCalledTimes(3);
});
test('server without a ready user backend preserves own-DB public reads and makes no cookie request',async()=>{
  const helper=await carrega('1');const fetchImpl=vi.fn(async(url,init)=>{expect(url).toBe(BASE+'/status');expect(init.credentials).toBe('omit');return json({node:'node0',postgresql:{ok:true},capabilities:{userSessions:false}});});
  const receipt=await helper.preparaArrencadaNodeZero(ORIGIN,{fetchImpl});
  expect(receipt).toMatchObject({privatSollicitat:true,privatActiu:false,motiuPrivat:'servidor-sense-sessions',autenticacio:false,escriptura:false});
  const port=await import('../backendPort.js');expect(port.getCurrentUser()).toBeNull();expect(port.teCapacitat('sessio')).toBe(false);expect(fetchImpl).toHaveBeenCalledTimes(1);
});
test('failed session verification leaves the port empty and retains the failed boot without remote retry',async()=>{
  const helper=await carrega('1');const fetchImpl=vi.fn(async url=>url.endsWith('/status')?json({node:'node0',postgresql:{ok:true},capabilities}):json({error:'auth_unavailable'},503));
  const pending=helper.preparaArrencadaNodeZero(ORIGIN,{fetchImpl});await expect(pending).rejects.toMatchObject({codi:'NODE0_SESSIO_INCERTA',requiresReload:true});
  expect(helper.preparaArrencadaNodeZero(ORIGIN,{fetchImpl})).toBe(pending);expect((await import('../backendPort.js')).getBackendImplementation()).toEqual({});expect(fetchImpl).toHaveBeenCalledTimes(2);
});
test('a foreign ambient origin rejects the cookie transport before any fetch or injection',async()=>{
  vi.stubGlobal('location',{origin:'https://socdepoble.org'});const helper=await carrega('1'),fetchImpl=vi.fn();
  await expect(helper.preparaArrencadaNodeZero(ORIGIN,{fetchImpl})).rejects.toThrow(TypeError);expect(fetchImpl).not.toHaveBeenCalled();expect((await import('../backendPort.js')).getBackendImplementation()).toEqual({});
});
test('existing Supabase identity is never adopted over the verified Node0 cookie user',async()=>{
  const helper=await carrega('1'),identity=await import('../identitat.js');
  const external={access_token:'fixture-old-jwt',user:{id:'99999999-9999-4999-8999-999999999999'}};
  identity.configuraBackendSessio({backendId:'supabase',backendUrl:'https://previous.supabase.test',tenantId:'99999999-9999-4999-8999-999999999999',dataMode:'remote'});expect(identity.desaSessio(external)).toBe(true);
  const fetchImpl=vi.fn(async url=>url.endsWith('/status')?json({node:'node0',postgresql:{ok:true},capabilities}):json({user:PERSON}));
  await helper.preparaArrencadaNodeZero(ORIGIN,{fetchImpl});const host=await import('../../host.js');host.configura({auth:{issuer:ORIGIN+'/auth'}});await host.arrenca();
  expect(host.injectaSessio(external)).toBe(false);expect(identity.usuariDeSessio()).toBeNull();expect((await import('../backendPort.js')).getCurrentUser().id).toBe(PERSON.id);
});
