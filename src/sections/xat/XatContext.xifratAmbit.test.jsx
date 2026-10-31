import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { XatProvider, useXat } from './XatContext.jsx';
import { creaServeiAmbitXat } from '../../data/xifratXat.js';
import { registraServeiXifratXat } from '../../data/xifratXatServei.js';
import { clauIdentitat } from '../../data/xifratXatMagatzem.js';
import { _reiniciaOblitXat, oblidaXatEnEixir } from '../../data/xifratXatEixida.js';

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
 _reiniciaOblitXat();
});
afterEach(()=>{cleanup();_reiniciaOblitXat();});

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

/* P1-12 pas 17 (D-09; pla 261029_1605, C.1) · L'eixida no ha pogut oblidar el
   xat d'este aparell: XatContext ho exposa (sense `visible`, la persona ja ha
   eixit), pinta l'avís i el reintent torna a provar amb la MATEIXA CI de qui
   va eixir. Amb una persona dins, l'avís no apareix. */
const motorOblitFals=(servei,estats)=>{let n=0;return vi.fn(async()=>{const estat=estats[Math.min(n,estats.length-1)];n+=1;servei.desaEstatOblit(estat);return estat;});};
const FALLIT=Object.freeze({estat:'OBLIT_FALLIT',pendents:Object.freeze(['indexeddb']),causes:Object.freeze([]),quanMs:10});
const OBLIDAT=Object.freeze({estat:'oblidat',pendents:Object.freeze([]),causes:Object.freeze([]),quanMs:20});
const ambOblitFals=(estats)=>{const motorRef={};servei=creaServeiAmbitXat({revocaUrl:u=>revocats.push(u),motorRef});registraServeiXifratXat(m.backend,servei);motorRef.oblidaTot=motorOblitFals(servei,estats);return motorRef.oblidaTot;};
const CI_A=()=>clauIdentitat({backendId:'supabase',endpoint:CONFIG.supabaseUrl,joId:A});
test('OBLIT_FALLIT en eixir: value l’exposa, l’avís apareix i el reintent usa la mateixa CI; en reeixir, «fet» i tancat',async()=>{
 const oblida=ambOblitFals([FALLIT,OBLIDAT]);const v=await muntat();
 expect(value.oblitXat).toBeNull();expect(value.oblitXatFallit).toBe(false);expect(document.querySelector('dialog')).toBeNull();
 m.session={currentUser:null,generacio:2,estat:'fora'};v.rerender(arbre());expect(servei.estatAmbit().clauIdentitat).toBeNull();
 await act(async()=>{await oblidaXatEnEixir({config:CONFIG,usuariId:A});});
 expect(oblida).toHaveBeenCalledTimes(1);expect(oblida.mock.calls[0][0]).toMatchObject({clauIdentitat:CI_A(),mantenSessio:false});
 expect(value.oblitXatFallit).toBe(true);expect(value.oblitXat).toMatchObject({estat:'OBLIT_FALLIT',pendents:['indexeddb']});
 expect(Object.keys(value).filter(k=>/xifra|e2ee|clau/i.test(k))).toEqual([]);
 const finestra=screen.getByRole('dialog',{name:'No s’han pogut esborrar les claus del xat'});expect(finestra.hasAttribute('open')).toBe(true);
 await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Torna-ho a provar'}));});
 await waitFor(()=>expect(value.oblitXatFallit).toBe(false));
 expect(oblida).toHaveBeenCalledTimes(2);expect(oblida.mock.calls[1][0]).toMatchObject({clauIdentitat:CI_A(),mantenSessio:false});
 expect(value.oblitXat).toMatchObject({estat:'oblidat'});expect(finestra.hasAttribute('open')).toBe(false);
 expect(m.showToast).toHaveBeenCalledWith('Les claus del xat d’este aparell ja s’han esborrat.','success');
});
test('OBLIT_FALLIT amb una persona dins: value ho diu, però l’avís no apareix ni es reintenta sobre la seua RAM',async()=>{
 const oblida=ambOblitFals([FALLIT]);await act(async()=>{await oblidaXatEnEixir({config:CONFIG,usuariId:B});});
 await muntat();expect(value.oblitXatFallit).toBe(true);expect(document.querySelector('dialog')).toBeNull();
 const abans=servei.estatAmbit();await act(async()=>{await value.reintentaOblitXat();});
 expect(oblida).toHaveBeenCalledTimes(1);expect(servei.estatAmbit().clauIdentitat).toBe(abans.clauIdentitat);expect(servei.estatAmbit().clauIdentitat).not.toBeNull();
});
