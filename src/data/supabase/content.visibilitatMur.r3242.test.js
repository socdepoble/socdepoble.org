import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m=vi.hoisted(()=>({request:vi.fn(),user:null}));
vi.mock('./runtime.js',()=>({request:m.request,getCurrentUser:()=>m.user,
  getResolvedConfig:()=>({runtimeDataMode:'remote',hasSupabaseConfig:true,tenantId:'32420000-0000-4000-8000-000000000001'}),
  buildSeedAppData:vi.fn(),generateUUID:vi.fn(),mapContentRowsToData:vi.fn()}));
vi.mock('../identitat.js',()=>({capturaSessio:()=>()=>{}}));
vi.mock('./xat.js',()=>({enviaMissatge:vi.fn()}));
import { loadSeccioPage } from './content.js';
import { vigentsDalt } from '../../sections/mur/alertesMunicipals.js';
const data='2026-11-22T14:00:00.000000+00:00';
const fila=(i,visible)=>({id:`32420000-0000-4000-8000-${String(i).padStart(12,'0')}`,title:'Pública',created_at:data,updated_at:data,mostrar_al_mur:visible});
/* v1.2.22 · Integració (Gauntlet R1, L4-05) · La RPC7 només es negocia amb VITE_SDP_MUR_VISIBILITAT=1 (content.js,
   negociaVisibilitatMur): estes proves del kit la descriuen amb la bandera encesa; la darrera, sense.
   v1.2.23 · L4-10 (ordre del Mestre 261123) · La RPC7 es diu llig_mur_public_v7; la RPC6 continua sent llig_mur_public. */
beforeEach(()=>{m.request.mockReset();m.user=null;vi.stubEnv('VITE_SDP_MUR_VISIBILITAT','1');});
afterEach(()=>{vi.unstubAllEnvs();});

test.each(['mercat','events'])('consulta pública %s negocia RPC7, preserva fitxes i filtra l’aparador',async seccio=>{
  m.request.mockResolvedValue([fila(3,false),fila(2,true)]);
  const result=await loadSeccioPage({seccio},{});
  expect(m.request.mock.calls[0][0]).toContain('/rest/v1/rpc/llig_mur_public_v7?');
  expect(m.request.mock.calls[0][0]).toContain('p_inclou_visibilitat=true');
  expect(result.elements).toHaveLength(2);
  expect(vigentsDalt(result.elements.map(item=>({item})),()=>false).map(({item})=>item.id)).toEqual([fila(2,true).id]);
});

test('node antic: només PGRST202 permet RPC6 sense flag; cap consulta canvia la publicació',async()=>{
  m.request.mockRejectedValueOnce(Object.assign(new Error('RPC7 absent'),{status:404,postgrestCode:'PGRST202'})).mockResolvedValueOnce([fila(2,true)]);
  await expect(loadSeccioPage({seccio:'mercat'},{})).resolves.toMatchObject({elements:[{id:fila(2,true).id}]});
  expect(m.request).toHaveBeenCalledTimes(2);
  expect(m.request.mock.calls[0][0]).toContain('/rest/v1/rpc/llig_mur_public_v7?');
  expect(m.request.mock.calls[1][0]).toContain('/rest/v1/rpc/llig_mur_public?');
  expect(m.request.mock.calls[1][0]).not.toContain('p_inclou_visibilitat');
  expect(m.request.mock.calls.every(([, ,options])=>!options.method)).toBe(true);
});

test('PGRST203 ambigu i errors de permisos no es disfressen de node antic',async()=>{
  for(const code of ['PGRST203','42501']) {
    m.request.mockReset(); const error=Object.assign(new Error(code),{status:code==='PGRST203'?300:403,postgrestCode:code});m.request.mockRejectedValue(error);
    await expect(loadSeccioPage({seccio:'events'},{})).rejects.toBe(error);
    expect(m.request).toHaveBeenCalledTimes(1);
  }
});

test.each(['mercat','events'])('foraster autenticat %s renegocia DTO públic RPC7 amb OFF/ON',async seccio=>{
  m.user={id:'32420000-0000-4000-8000-000000000099'};
  const files=[fila(3,false),fila(2,true)];
  const senseFlag=files.map(r=>{const copia={...r};delete copia.mostrar_al_mur;return copia;});
  m.request.mockResolvedValueOnce({lectura:'public',files:senseFlag}).mockResolvedValueOnce(files);
  const result=await loadSeccioPage({seccio},{});
  expect(m.request.mock.calls[0][0]).toContain('/rpc/llig_mur_membres?');
  expect(m.request.mock.calls[1][0]).toContain('/rest/v1/rpc/llig_mur_public_v7?');
  expect(m.request.mock.calls[1][0]).toContain('p_inclou_visibilitat=true');
  expect(m.request.mock.calls[1][2].anonim).not.toBe(true);
  expect(result.elements).toHaveLength(2);
  expect(vigentsDalt(result.elements.map(item=>({item})),()=>false).map(({item})=>item.id)).toEqual([fila(2,true).id]);
});

/* v1.2.22 · Sense la bandera (el build de producció mentre la migració no s'aplica): una sola petició RPC6 per secció,
   sense p_inclou_visibilitat, i cap renegociació per al foraster autenticat. Cap 404 nou per a cap visitant. */
test.each(['mur','mercat','events'])('sense VITE_SDP_MUR_VISIBILITAT, %s fa una sola lectura RPC6 i cap RPC7',async seccio=>{
  vi.stubEnv('VITE_SDP_MUR_VISIBILITAT','');
  m.request.mockResolvedValue([fila(2,true)]);
  await expect(loadSeccioPage({seccio},{})).resolves.toMatchObject({elements:[{id:fila(2,true).id}]});
  expect(m.request).toHaveBeenCalledTimes(1);
  expect(m.request.mock.calls[0][0]).toContain('/rest/v1/rpc/llig_mur_public?');
  expect(m.request.mock.calls[0][0]).not.toContain('llig_mur_public_v7');
  expect(m.request.mock.calls[0][0]).not.toContain('p_inclou_visibilitat');
  m.request.mockReset();
  m.user={id:'32420000-0000-4000-8000-000000000099'};
  m.request.mockResolvedValue({lectura:'public',files:[fila(2,true)]});
  await loadSeccioPage({seccio},{});
  expect(m.request).toHaveBeenCalledTimes(1);
  expect(m.request.mock.calls[0][0]).toContain('/rest/v1/rpc/llig_mur_membres?');
});
