import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { creaIdbFalsEstructurat } from '../../tests/helpers/idbFalsEstructurat.js';

const m = vi.hoisted(() => ({ config: null, user: null, identity: null, notes: [], scope: '',
  sessio:0, request:vi.fn(), bloquejada: false, moderacio: null, projeccions: vi.fn(), update: vi.fn(), send: vi.fn(), confirma: vi.fn(), toast: vi.fn() }));
vi.mock('./identitat.js', async original => ({ ...await original(), capturaSessio: () => {
  const sessio=m.sessio;
  return () => { if(sessio!==m.sessio)throw new DOMException('La sessió ha canviat.','AbortError'); };
} }));
vi.mock('./supabase/runtime.js', async original => ({ ...await original(),
  getCurrentUser:()=>m.user,
  getResolvedConfig:config=>({...config,hasSupabaseConfig:true,runtimeDataMode:'remote'}),
  request:(...args)=>m.request(...args)
}));
vi.mock('../app/contexts/UIContext.jsx', () => ({
  useUIStateOpcional: () => ({ externalConfig: m.config }),
  useUIState: () => ({ locale: 'ca', externalConfig: m.config }),
  useUIActions: () => ({ normalizeSearchText: value => value, t: (_key, fallback) => fallback })
}));
vi.mock('../app/contexts/SessionContext.jsx', () => ({
  useSessioOpcional: () => ({ currentUser: m.user, estat: 'dins' }),
  useSession: () => ({ currentUser: m.user, estat: 'dins' })
}));
vi.mock('../app/contexts/useIdentitatOReserva.js', () => ({ useIdentitatOReserva: () => m.identity }));
vi.mock('../components/PedraSeca/hooks/moderacioDePoble.js', () => ({ useModeracio: () => m.moderacio }));
vi.mock('../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../sections/mur/MurContext.jsx', () => ({ useMur: () => ({ sendSectionSubmission: m.send, feedPosts: [], marketItems: [] }) }));
vi.mock('../sections/notes/NotesDataContext.jsx', () => ({ useNotesData: () => ({
  notes: m.notes, noteFolders: [], scopeKey: m.scope, workspaceKey: m.scope, config: m.config,
  status: 'ready', updateNote: m.update, confirmaPublicacioNota: m.confirma, refresh: () => {},
  resolveNote: async id => ({ status: 'found', note: m.notes.find(note => note.id === id) })
}) }));
vi.mock('./backendPort.js', () => ({
  teCapacitat: cap => cap === 'projeccionsCataleg',
  loadProjeccionsCataleg: (...args) => m.projeccions(...args),
  appendSectionSubmissionNetworkOnly: (...args) => m.send(...args), promoteToPublic: vi.fn()
}));
vi.mock('../sections/notes/GlobalSaveManager.js', async original => {
  const real = await original(), records = new Map();
  return { ...real, bgSaveManager: new real.GlobalSaveManager({ persist: async (key, transforma) => {
    const next = transforma(records.get(key) || {}); records.set(key,next); return next;
  } }) };
});

import { useProjeccionsCataleg } from '../hooks/useProjeccionsCataleg.js';
import { NotesProvider, useNotes } from '../sections/notes/NotesContext.jsx';
import { bgSaveManager } from '../sections/notes/GlobalSaveManager.js';
import { elementDeMurPublic, elementDeMurMembre } from './murPublic.js';

const A = '33000000-0000-4000-8000-000000000001';
const ID = '55000000-0000-4000-8000-000000000001';
const ITEMS = ['55000000-0000-4000-8000-00000000000a','55000000-0000-4000-8000-00000000000b'].map(id => ({
  id, ownerUserId: null, sectionId: 'mur', _murPublic: true, _projeccioPublicaFiltrada: true,
  title: id.endsWith('a') ? 'Referència clicada' : 'Una altra del mateix autor',
  projeccioCataleg: { v:1,font:'herbari',id:id.endsWith('a')?'romer':'timonet',destins:['mur'],audiencia:'publica' }
}));
let count = 0;
beforeEach(() => {
  globalThis.indexedDB = creaIdbFalsEstructurat();
  m.config = { dataMode:'remote',tenantId:'11000000-0000-4000-8000-000000000001' };
  m.scope = `gauntlet-independent-${++count}`;
  m.sessio++;
  m.user = { id:A, full_name:'Persona real' };
  m.identity = { actorId:A,actorKey:`persona::${A}`,actor:{tipus:'persona',id:A,nom:'Persona real'},memberships:[] };
  m.bloquejada=false;
  m.moderacio={versioBloquejos:0,esElementBloquejat:item=>m.bloquejada&&item.id===ITEMS[0].id};
  m.notes=[];
  for (const method of [m.projeccions,m.update,m.send,m.confirma,m.toast,m.request]) method.mockReset();
  m.projeccions.mockImplementation(async query => ({items:query.audiencia==='publica'&&!m.bloquejada?ITEMS:[],cursor:null}));
});
afterEach(cleanup);

test('P1 · la projecció mínima no atribueix contingut alié al projecte ni li inventa llicència', () => {
  const dto=elementDeMurPublic({id:ID,title:'Aportació',public_content:'Text públic',
    owner_user_id:A,payload:{author_name:'Sóc de Poble',copyright:'CC BY-SA 4.0',phone:'privat'}},'mur');
  expect(dto).toMatchObject({author_name:'Autoria no publicada',author_location:'Poble no indicat',copyright:'Llicència no publicada',ownerUserId:null});
  expect(JSON.stringify(dto)).not.toContain('privat');
  expect(dto).not.toHaveProperty('payload');
});

test('P1 · el DTO de membre conserva títol i secció autoritatius amb autoria absent explícita', () => {
  const dto=elementDeMurMembre({id:ID,title:'Títol autoritatiu',section_id:'mur',owner_user_id:A,
    payload:{title:'Títol injectat',sectionId:'notes',ownerUserId:'altra-identitat',isSystem:true}},'mur');
  expect(dto).toMatchObject({title:'Títol autoritatiu',sectionId:'mur',ownerUserId:A,
    author_name:'Autoria no indicada',author_location:'Poble no indicat',copyright:'Llicència no indicada'});
  expect(dto.isSystem).not.toBe(true);
});

/* La prova «una lectura rica tardana no travessa un canvi de sessió» és d’adaptador (loadSeccioPage): viu a
   src/data/supabase/content.lecturaRicaSessio.test.js, amb els mateixos dobles (Porta Enxufe, E1). */

test('P1 · bloquejar per UUID opac revalida totes les referències públiques ja carregades, també les altres del mateix autor', async () => {
  const vista=renderHook(()=>useProjeccionsCataleg({escriptura:false}));
  await waitFor(()=>expect(vista.result.current.projeccions).toHaveLength(2));
  const abans=m.projeccions.mock.calls.length;
  act(()=>{m.bloquejada=true;m.moderacio={...m.moderacio,versioBloquejos:1};vista.rerender();});
  await waitFor(()=>expect(m.projeccions.mock.calls.length).toBeGreaterThan(abans));
  await waitFor(()=>expect(vista.result.current.projeccions).toHaveLength(0));
});

/* Gauntlet R22 (notes-04) · versioBloquejos és frescor: el bloqueig revalida en segon pla sense tornar a
   «carregant», sense buidar les referències que ja es veuen i sense avortar la connexió vigent. */
test('R22 notes-04 · un bloqueig nou revalida les referències sense passar per carregant ni avortar la connexió', async () => {
  const vista=renderHook(()=>useProjeccionsCataleg({escriptura:false}));
  await waitFor(()=>expect(vista.result.current.projeccions).toHaveLength(2));
  const senyals=m.projeccions.mock.calls.map(([,config])=>config.signal);
  expect(senyals.length).toBeGreaterThan(0);
  const pendents=[];
  m.projeccions.mockImplementation(query=>new Promise(resol=>{pendents.push(()=>resol({items:query.audiencia==='publica'&&!m.bloquejada?ITEMS:[],cursor:null}));}));
  const estats=[];
  act(()=>{m.bloquejada=true;m.moderacio={...m.moderacio,versioBloquejos:1};vista.rerender();});
  estats.push(vista.result.current.estat);
  await waitFor(()=>expect(pendents.length).toBeGreaterThan(0));
  // Mentre la lectura nova és en vol: les referències d'abans, en 'sincronitzat', i la connexió viva.
  expect(vista.result.current).toMatchObject({estat:'sincronitzat'});
  expect(vista.result.current.projeccions).toHaveLength(2);
  expect(estats).toEqual(['sincronitzat']);
  expect(senyals.every(senyal=>senyal.aborted===false)).toBe(true);
  expect(m.projeccions.mock.calls.at(-1)[1].signal).toBe(senyals[0]);
  await act(async()=>{pendents.splice(0).forEach(acaba=>acaba());});
  await waitFor(()=>expect(vista.result.current.projeccions).toHaveLength(0));
  expect(senyals.every(senyal=>senyal.aborted===false)).toBe(true);
});

test('P1 · recuperar un ACK perdut després d’una edició nova no diu que el nou esborrany ja és al Mur', async () => {
  const initial={id:ID,title:'Versió publicada',content:'<p>Abans</p>',revision:1};
  m.notes=[initial];
  let saved=null;
  m.update.mockImplementation(async(id,changes,revision)=>({id,...changes,revision:revision+1}));
  m.send.mockImplementation(async sub=>{
    if(sub.consulta)return {publicacio:{id:sub.id},nota_revision:10,publicada_revision:saved.publicada_revision,replay:true};
    saved={publicacio:{id:sub.id},nota_revision:sub.expectedNoteRevision+1,publicada_revision:sub.expectedNoteRevision+1,replay:false};
    throw new Error('ACK perdut després del COMMIT de prova.');
  });
  const vista=renderHook(useNotes,{wrapper:({children})=>React.createElement(NotesProvider,null,children)});
  await act(async()=>{expect(await vista.result.current.publishNote(initial)).toBe(false);});
  const actual={...initial,title:'Edició nova encara privada',content:'<p>Després</p>',revision:10,isPublished:true,publishedSubmissionId:saved.publicacio.id};
  m.notes=[actual];
  act(()=>vista.rerender());
  await act(async()=>{expect(await vista.result.current.publishNote(actual)).toBe(true);});
  expect(vista.result.current.versioAlMur(actual)).toBe(false);
  expect(bgSaveManager.revisionsAlMur.get(`${m.scope}:${ID}`)).toBe(saved.publicada_revision);
  expect(m.send).toHaveBeenCalledTimes(2);
});

test('P1 · un replay sense revisió publicada no pot usar la revisió actual de la nota com a prova d’equivalència', async () => {
  const initial={id:ID,title:'Versió publicada',content:'<p>Abans</p>',revision:1};m.notes=[initial];
  let actId;
  m.update.mockImplementation(async(id,changes,revision)=>({id,...changes,revision:revision+1}));
  m.send.mockImplementation(async sub=>{
    actId=sub.id;
    if(sub.consulta)return {publicacio:{id:sub.id},nota_revision:10,replay:true};
    throw new Error('ACK perdut després del COMMIT de prova.');
  });
  const vista=renderHook(useNotes,{wrapper:({children})=>React.createElement(NotesProvider,null,children)});
  await act(async()=>{expect(await vista.result.current.publishNote(initial)).toBe(false);});
  const actual={...initial,title:'Edició nova',revision:10,isPublished:true,publishedSubmissionId:actId};m.notes=[actual];
  act(()=>vista.rerender());
  await act(async()=>{await vista.result.current.publishNote(actual).catch(()=>false);});
  expect(vista.result.current.versioAlMur(actual)).not.toBe(true);
});
