/* Gauntlet R21 v2 (P1) · Una lectura rica del Mur (llig_mur_membres) que arriba després d’un canvi de sessió no
   travessa: loadSeccioPage la rebutja amb AbortError, tant si la persona ha eixit com si ha entrat un altre compte.
   Prova d’adaptador: viu dins de src/data/supabase/ perquè fora del port cap mòdul no importa l’adaptador
   (Porta Enxufe, E1). És la de src/data/r21v2Gauntlet.test.js, amb els mateixos dobles de sessió i de runtime
   i la mateixa preparació (IndexedDB fals, configuració remota, persona i sessió noves en cada cas). */
import { beforeEach, expect, test, vi } from 'vitest';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';

const m = vi.hoisted(() => ({ config: null, user: null, sessio: 0, request: vi.fn() }));
vi.mock('../identitat.js', async original => ({ ...await original(), capturaSessio: () => {
  const sessio=m.sessio;
  return () => { if(sessio!==m.sessio)throw new DOMException('La sessió ha canviat.','AbortError'); };
} }));
vi.mock('./runtime.js', async original => ({ ...await original(),
  getCurrentUser:()=>m.user,
  getResolvedConfig:config=>({...config,hasSupabaseConfig:true,runtimeDataMode:'remote'}),
  request:(...args)=>m.request(...args)
}));

import { loadSeccioPage } from './content.js';

const A = '33000000-0000-4000-8000-000000000001';
const ID = '55000000-0000-4000-8000-000000000001';

beforeEach(() => {
  globalThis.indexedDB = creaIdbFalsEstructurat();
  m.config = { dataMode:'remote',tenantId:'11000000-0000-4000-8000-000000000001' };
  m.sessio++;
  m.user = { id:A, full_name:'Persona real' };
  m.request.mockReset();
});

test.each(['fora','altre-compte'])('P1 · una lectura rica tardana no travessa un canvi de sessió a %s', async desti => {
  let acaba;
  m.request.mockImplementation(()=>new Promise(resolve=>{acaba=resolve;}));
  const lectura=loadSeccioPage({seccio:'mur'},m.config);
  const rebut=expect(lectura).rejects.toMatchObject({name:'AbortError'});
  expect(m.request.mock.calls[0][0]).toContain('/rpc/llig_mur_membres');
  m.user=desti==='fora'?null:{id:'33000000-0000-4000-8000-000000000002'};
  m.sessio++;
  acaba({lectura:'membre',files:[{id:ID,section_id:'mur',owner_user_id:A,
    title:'Contingut reservat a membres',payload:{content:'Text de la sessió anterior'},created_at:'2026-11-12T20:00:00Z'}]});
  await rebut;
});
