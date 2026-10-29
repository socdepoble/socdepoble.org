import { StrictMode } from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { XatProvider, useXat } from './XatContext.jsx';
import { creaServeiAmbitXat } from '../../data/xifratXat.js';
import { registraServeiXifratXat } from '../../data/xifratXatServei.js';
import { clauIdentitat } from '../../data/xifratXatMagatzem.js';

const m=vi.hoisted(()=>({session:{},actorKey:'',backend:null,loadFils:vi.fn(),loadMissatges:vi.fn(),enviaMissatge:vi.fn(),marcaLlegit:vi.fn(),creaFilDirecte:vi.fn(),carregaMembres:vi.fn(),subscribeToXat:vi.fn(),unsubscribeFromXat:vi.fn(),obriFilDePagina:vi.fn(),teCapacitat:vi.fn(),showToast:vi.fn()}));
vi.mock('../../app/contexts/SessionContext',()=>({useSession:()=>m.session}));
vi.mock('../../app/contexts/IdentitatContext.jsx',()=>({useIdentitat:()=>({actorKey:m.actorKey,identitats:undefined})}));
vi.mock('../../app/contexts/RouterContext',()=>({useLocation:()=>({pathname:'/xat'})}));
vi.mock('../../app/contexts/UIContext',()=>({useUIActions:()=>({t:(_,alternativa)=>alternativa})}));
vi.mock('../../components/universal/NotificationContext.jsx',()=>({useToast:()=>({showToast:m.showToast})}));
vi.mock('../../data/backendPort.js',()=>({...m,getBackendImplementation:()=>m.backend}));
vi.mock('../../host.js',()=>({quanLlest:async()=>{await m.hostReady;}}));
vi.mock('../../config/xifratXat.js',async(importOriginal)=>({...await importOriginal(),E2EE_ACTIU_PER_DEFECTE:true}));
const A='aaaaaaaa-1111-4111-8111-111111111111',B='bbbbbbbb-2222-4222-8222-222222222222';
const CONFIG={backendId:'supabase',supabaseUrl:'https://backend.example.test',dataMode:'remote',tenantId:null};
let servei,value,revocats;
function Sonda(){value=useXat();return null;}
const arbre=(config=CONFIG)=><StrictMode><XatProvider config={config}><Sonda/></XatProvider></StrictMode>;
const muntat=async()=>{const v=render(arbre());await waitFor(()=>expect(value.status).toBe('ready'));return v;};
beforeEach(()=>{
 vi.clearAllMocks();m.hostReady=null;m.session={currentUser:{id:A},generacio:1,estat:'dins'};m.actorKey=`persona::${A}`;m.backend={};revocats=[];
 servei=creaServeiAmbitXat({revocaUrl:u=>revocats.push(u)});registraServeiXifratXat(m.backend,servei);
 m.loadFils.mockResolvedValue([]);m.loadMissatges.mockResolvedValue([]);m.subscribeToXat.mockResolvedValue({subscription:null,error:null});m.unsubscribeFromXat.mockResolvedValue(null);m.teCapacitat.mockReturnValue(false);
});
afterEach(cleanup);

test('XatContext fixa el mateix ambitEstable i CI explícita; JWT no buida RAM ni generacions',async()=>{
 const v=await muntat();const e=servei.estatAmbit();expect(e.ambitEstable).toBe(value.ambitEstable);
 expect(e.clauIdentitat).toBe(clauIdentitat({backendId:'supabase',endpoint:CONFIG.supabaseUrl,joId:A}));
 servei.desaResumUltimXifrat('f','u','text sintètic');m.session={...m.session,generacio:2};v.rerender(arbre());
 expect(servei.estatAmbit().genAmbit).toBe(e.genAmbit);expect(servei.estatAmbit().genIdentitat).toBe(e.genIdentitat);expect(servei.llegixResumUltimXifrat('f','u')).toBe('text sintètic');
});
test('A→B→A al proveïdor invalida resultat tardà i conserva la identitat de la persona',async()=>{
 const v=await muntat(),abans=servei.estatAmbit(),id=servei.captura('identitat');let resol;const bytes=Uint8Array.of(5,6);
 const op=servei.guardaAmbit(async(_,anota)=>{anota('blob:sintetic');return await new Promise(r=>{resol=r;});});
 m.actorKey=`entitat::${B}`;v.rerender(arbre());expect(servei.vigent(id)).toBe(true);
 m.actorKey=`persona::${A}`;v.rerender(arbre());expect(servei.estatAmbit().genAmbit).toBe(abans.genAmbit+2);expect(servei.estatAmbit().genIdentitat).toBe(abans.genIdentitat);
 resol(bytes);await expect(op).rejects.toMatchObject({name:'AbortError'});expect([...bytes]).toEqual([0,0]);expect(revocats).toContain('blob:sintetic');
});
test('eixir i tornar a entrar invalida els dos tipus de testimoni',async()=>{
 const v=await muntat(),a=servei.captura(),i=servei.captura('identitat');m.session={currentUser:null,generacio:2,estat:'fora'};v.rerender(arbre());
 expect(servei.estatAmbit().clauIdentitat).toBeNull();expect(servei.vigent(a)).toBe(false);expect(servei.vigent(i)).toBe(false);
 m.session={currentUser:{id:A},generacio:3,estat:'dins'};v.rerender(arbre());expect(servei.estatAmbit().ambitEstable).toBe(value.ambitEstable);expect(servei.vigent(i)).toBe(false);
});
test('desmuntar revoca blobs i invalida crides tardanes; StrictMode permet una reconnexió neta',async()=>{
 const v=await muntat(),abans=servei.captura();servei.registraBlob('blob:registrat',abans);let resol;
 const op=servei.guardaAmbit(()=>new Promise(r=>{resol=r;}));v.unmount();expect(servei.vigent(abans)).toBe(false);expect(revocats).toContain('blob:registrat');
 resol('tardà');await expect(op).rejects.toMatchObject({name:'AbortError'});await muntat();expect(servei.estatAmbit().viu).toBe(true);expect(servei.estatAmbit().ambitEstable).toBe(value.ambitEstable);expect(servei.vigent(abans)).toBe(false);
});
test('un altre poble modifica l’àmbit RAM i conserva CI; una altra persona modifica tots dos',async()=>{
 const v=await muntat(),i=servei.captura('identitat'),a=servei.captura();v.rerender(arbre({...CONFIG,tenantId:B}));expect(servei.vigent(i)).toBe(true);expect(servei.vigent(a)).toBe(false);
 m.session={currentUser:{id:B},generacio:2};m.actorKey=`persona::${B}`;v.rerender(arbre());expect(servei.vigent(i)).toBe(false);expect(JSON.parse(servei.estatAmbit().clauIdentitat)[2]).toBe(B);
});
test('backend instal·lat després del render rep l’àmbit abans de la primera càrrega',async()=>{
 let llest;m.hostReady=new Promise(r=>{llest=r;});const backend=m.backend;m.backend={};
 m.loadFils.mockImplementation(async()=>{expect(servei.estatAmbit().ambitEstable).toBe(value.ambitEstable);return [];});
 render(arbre());expect(servei.estatAmbit().ambitEstable).toBeNull();m.backend=backend;llest();await waitFor(()=>expect(value.status).toBe('ready'));
 expect(servei.estatAmbit().ambitEstable).toBe(value.ambitEstable);
});
test('desmuntar abans de hostReady impedix la connexió i les càrregues tardanes',async()=>{
 let llest;m.hostReady=new Promise(r=>{llest=r;});const backend=m.backend;m.backend={};const v=render(arbre());v.unmount();m.backend=backend;llest();await Promise.resolve();await Promise.resolve();
 expect(servei.estatAmbit().ambitEstable).toBeNull();expect(m.loadFils).not.toHaveBeenCalled();
});
