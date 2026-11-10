import { beforeEach, expect, test, vi } from 'vitest';
import { CONTRACTE_NUCLI } from '../contracte.js';
import { CASOS, contextDeConformitat, executaCas, metodesSenseCas } from '../conformitat/kit.js';
const io = vi.hoisted(() => ({ invoke: vi.fn(), rpc: vi.fn(), actor: '10000000-0000-4000-8000-000000000001' }));
vi.mock('./config.js', () => ({ getClient: async () => ({ functions: { invoke: io.invoke } }) }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => ({ id: io.actor }), getResolvedConfig: () => ({ runtimeDataMode: 'remote', hasSupabaseConfig: true }), rpc: (...args) => io.rpc(...args) }));
vi.mock('../identitat.js', async original => ({ ...(await original()), usuariDeSessio: () => ({ id: io.actor }), versioSessio: 1 }));
import { consultaIAIA } from './iaia.js';
import { loadRitmeXat, actualitzaPresenciaXat } from './xatRitme.js';
import { preparaClientPrivatNodeZero } from '../node0/clientPrivatNodeZero.js';
const U = '10000000-0000-4000-8000-000000000001', T = '20000000-0000-4000-8000-000000000001', F = '30000000-0000-4000-8000-000000000001';
const discovery = { source: 'configuration', inference: false, available: true, group: null };
const rhythm = { rebutPelsAltresFinsSeq: 8, llegitPelsAltresFinsSeq: 3, escrivint: [{ usuariId: U, vigentMs: 8000 }] };
const added = CASOS.filter(c => c.titol.startsWith('R54:'));
const ctx = (writes = true, enabled = true) => Object.assign(contextDeConformitat({ config: Object.freeze({ dataMode: 'remote' }), escriptures: writes, escenaris: { iaiaOperativa: enabled, xatRitmeOperatiu: enabled } }), { filId: F });
const positive = method => added.find(c => c.metode === method && c.espera === 'resol');
beforeEach(() => {
  vi.clearAllMocks();
  io.invoke.mockImplementation(async () => ({ data: structuredClone(discovery) }));
  io.rpc.mockImplementation(async name => name === 'xat_ritme' ? structuredClone(rhythm) : { acceptat: true });
});
test('R54 · cinc casos explícits, nucli32 intacte i escriptura positiva protegida', async () => {
  expect(added).toHaveLength(5); expect(metodesSenseCas()).toEqual([]); expect(CONTRACTE_NUCLI).toHaveLength(32);
  expect(added.filter(c => c.escriu).map(c => c.metode)).toEqual(['actualitzaPresenciaXat']);
  for (const c of added) {
    const callback = vi.fn();
    expect(await executaCas(c, { [c.metode]: callback }, ctx(true, false))).toMatchObject({ estat: 'omés' });
    expect(callback).not.toHaveBeenCalled();
    expect(await executaCas(c, {}, ctx())).toMatchObject({ estat: 'omés' });
  }
  const send = vi.fn();
  expect(await executaCas(positive('actualitzaPresenciaXat'), { actualitzaPresenciaXat: send }, ctx(false))).toMatchObject({ estat: 'omés', motiu: 'escriptura no demanada' });
  expect(send).not.toHaveBeenCalled();
});
test('R54 · funcions Supabase reals amb transport injectat i cap esborrany', async () => {
  const adapter = { consultaIAIA, loadRitmeXat, actualitzaPresenciaXat }, context = ctx();
  for (const c of added) expect(await executaCas(c, adapter, context), c.titol).toMatchObject({ estat: 'ok', falles: [] });
  expect(io.invoke).toHaveBeenCalledTimes(1);
  expect(io.invoke).toHaveBeenCalledWith('iaia', { body: { mode: 'discover' }, signal: undefined });
  expect(io.rpc).toHaveBeenCalledTimes(2);
  expect(io.rpc.mock.calls[0].slice(0, 2)).toEqual(['xat_ritme', { p_fil_id: F }]);
  expect(io.rpc.mock.calls[1][1]).toEqual({ p_fil_id: F, p_instancia: context.idMissatge, p_revisio: 0, p_escrivint: false });
  expect(io.rpc.mock.calls.every(c => c[3].timeoutMs === 8000)).toBe(true);
});
test('R54 · adaptador Node0 real amb sessió sintètica i actor capturat', async () => {
  const privateCall = vi.fn(async action => action === 'loadRitmeXat' ? structuredClone(rhythm) : { acceptat: true });
  const iaiaCall = vi.fn(async () => structuredClone(discovery));
  const person = { id: U, email: 'synthetic@example.invalid', email_confirmed_at: '2026-11-08T00:00:00Z', user_metadata: {} };
  const publicAdapter = { ...Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, () => null])), destroy: vi.fn(), configuracio: { backendId: 'sdp-node0-http', tenantId: T, backendUrl: 'https://fixture.invalid/api/v1/node0' },
    lligEstatNodeZero: async () => ({ node: 'node0', postgresql: { ok: true }, capabilities: { userSessions: true, actorBinding: true, iaia: true, xatRitme: true } }) };
  const client = await preparaClientPrivatNodeZero({ publicAdapter, transport: { demanaAuth: async () => ({ user: person }), demanaPrivat: privateCall, demanaIAIA: iaiaCall }, habilitaPrivat: true });
  try {
    const context = ctx();
    for (const c of added) expect(await executaCas(c, client.adapter, context), c.titol).toMatchObject({ estat: 'ok', falles: [] });
    expect(iaiaCall).toHaveBeenCalledTimes(1); expect(iaiaCall.mock.calls[0][0]).toEqual({ mode: 'discover' }); expect(iaiaCall.mock.calls[0][1].expectedActor).toBe(U);
    expect(privateCall).toHaveBeenCalledTimes(2); expect(privateCall.mock.calls[0].slice(0, 2)).toEqual(['loadRitmeXat', { filId: F }]);
    expect(privateCall.mock.calls[1][1]).toEqual({ filId: F, instancia: context.idMissatge, revisio: 0, escrivint: false });
    for (const call of privateCall.mock.calls) expect(call[2].expectedActor).toBe(U);
  } finally { client.adapter.destroy(); }
  expect(publicAdapter.destroy).toHaveBeenCalledTimes(1);
});
test('R54 · DTO malformat, watermark impossible, bot/model impropi o rebuig alié fallen', async () => {
  for (const c of added) {
    for (const value of [undefined, null, {}, [], true]) expect(await executaCas(c, { [c.metode]: async () => value }, ctx()), c.titol).toMatchObject({ estat: 'falla' });
    expect(await executaCas(c, { [c.metode]: async () => { throw Object.assign(Error('Other domain'), { code: 'HTTP_404' }); } }, ctx())).toMatchObject({ estat: 'falla' });
  }
  for (const value of [{ ...rhythm, llegitPelsAltresFinsSeq: 9 }, { ...rhythm, escrivint: [{ usuariId: U, vigentMs: 8001 }] }, { ...rhythm, escrivint: [rhythm.escrivint[0], rhythm.escrivint[0]] }, { ...rhythm, escrivint: [{ usuariId: 'inventat', vigentMs: 1 }] }])
    expect(await executaCas(positive('loadRitmeXat'), { loadRitmeXat: async () => value }, ctx())).toMatchObject({ estat: 'falla' });
  expect(await executaCas(positive('consultaIAIA'), { consultaIAIA: async () => ({ ...discovery, source: 'model', inference: true }) }, ctx())).toMatchObject({ estat: 'falla' });
  expect(await executaCas(positive('actualitzaPresenciaXat'), { actualitzaPresenciaXat: async () => ({ acceptat: true, text: 'draft' }) }, ctx())).toMatchObject({ estat: 'falla' });
});

/* R15 · Les sis operacions noves passen pel codi real de l’adaptador.
   El doble substituïx només la resposta SQL; no acredita una DB desplegada. */
import { adminResumSessionsDispositius, adminLlistaSessionsDispositius } from './admin.js';
import { estatCuradoriaCultural, llistaAportacionsCulturals, enviaAportacioCultural, revisaAportacioCultural } from './curadoriaCultural.js';
const r15 = CASOS.filter(c => c.titol.startsWith('R15:'));
const adapterR15 = { adminResumSessionsDispositius, adminLlistaSessionsDispositius, estatCuradoriaCultural, llistaAportacionsCulturals, enviaAportacioCultural, revisaAportacioCultural };
const cultureR15 = { id: F, titol: 'Conformitat cultural', autoria: 'Informant sintètic', poble: 'Poble de conformitat', contingut: 'Text de prova cultural', nota: '', estat: 'pendent_revisio', creat_a: '2026-11-09T14:00:00Z' };
const contextR15 = enabled => contextDeConformitat({ config: Object.freeze({ dataMode: 'remote' }), escriptures: true, escenaris: { sessionsAdminOperatiu: enabled, sessionsSensePermis: enabled, curadoriaOperativa: enabled, curadoriaSensePermis: enabled } });
test('R15 · dotze casos, sis operacions, positives privilegiades i escriptures només amb habilitació explícita', async () => {
  expect(r15).toHaveLength(12); expect(new Set(r15.map(c=>c.metode)).size).toBe(6); expect(CONTRACTE_NUCLI).toHaveLength(32);
  for (const c of r15.filter(c=>c.requerix.length)) {
    const f=vi.fn(); expect(await executaCas(c,{[c.metode]:f},contextR15(false))).toMatchObject({estat:'omés'}); expect(f).not.toHaveBeenCalled();
  }
  for (const c of r15.filter(c=>c.escriu)) {
    const context=contextR15(true);context.escriptures=false;context.aportacioCulturalId=F;
    const f=vi.fn();expect(await executaCas(c,{[c.metode]:f},context)).toMatchObject({estat:'omés',motiu:'escriptura no demanada'});expect(f).not.toHaveBeenCalled();
  }
});
test('R15 · èxits i rebuigs amb funcions reals; arguments invàlids no arriben a SQL', async () => {
  const context=contextR15(true), calls=[];
  for (const c of r15) {
    io.rpc.mockImplementation(async (nom,params)=>{
      calls.push([nom,params]);
      if(c.requerix.some(k=>k.endsWith('SensePermis')))throw Object.assign(new Error('refús SQL'),{status:403});
      if(nom==='admin_resum_sessions_dispositius')return {consultat_a:'2026-11-09T14:00:00Z',camins:['app_ios','web_ios','app_android','web_android','escriptori','altres'].map(cami=>({cami,persones_24h:0,persones_7d:0,persones_14d:0})),total:{persones_24h:0,persones_7d:0,persones_14d:0}};
      if(nom==='admin_llista_sessions_dispositius')return {consultat_a:'2026-11-09T14:00:00Z',total:1,files:[{clau:'c'.repeat(32),nom:'Conformitat',correu_mascarat:'s***@example.invalid',cami:'app_ios',sessions:1,activitat:'2026-11-09T14:00:00Z'}]};
      if(nom==='estat_curadoria_cultural')return {autenticat:true,pot_curar:true,ingestio_disponible:false};
      if(nom==='llista_aportacions_culturals')return [structuredClone(cultureR15)];
      if(nom==='revisa_aportacio_cultural')throw Object.assign(new Error('SDP-CULTURA-PROPIA'),{status:403,code:'42501'});
      return {...cultureR15,estat:'pendent_revisio'};
    });
    const abans=calls.length;
    expect(await executaCas(c,adapterR15,context),c.titol).toMatchObject({estat:'ok',falles:[]});
    if(c.espera==='rebutja'&&!c.requerix.length)expect(calls.length,c.titol).toBe(abans);
  }
  expect(context.aportacioCulturalId).toBe(F);
  expect(calls.find(([nom])=>nom==='admin_llista_sessions_dispositius')[1]).toEqual({p_cerca:'conformitat',p_cami:'app_ios'});
  expect(calls.find(([nom])=>nom==='envia_aportacio_cultural')[1]).toMatchObject({p_permisos:true,p_autoria:'Informant sintètic'});
  expect(calls.find(([nom])=>nom==='revisa_aportacio_cultural')[1]).toEqual({p_id:F,p_estat:'aprovat',p_nota:'Revisió sintètica de conformitat'});
});
