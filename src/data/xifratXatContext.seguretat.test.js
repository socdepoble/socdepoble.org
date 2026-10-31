// @vitest-environment node
import { describe, expect, test, vi } from 'vitest';
import { backendScope } from '../config/backendConfig.js';
import { clauIdentitatDelContextXat, clausDelContextXat } from './xifratXatContext.js';
import { clauIdentitat } from './xifratXatMagatzem.js';
import { ambXifratXat, creaServeiAmbitXat, serveiXifratXat } from './xifratXat.js';
import { CONTRACTE_NUCLI } from './contracte.js';
import { validaBackendImplementation } from './backendPort.js';
const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const B = 'bbbbbbbb-2222-4222-8222-222222222222';
const config = { backendId: 'supabase', supabaseUrl: 'https://backend.example.test', dataMode: 'remote', tenantId: null };
const claus = (actor = `persona::${A}`, joId = A, c = config) => clausDelContextXat({
  config: c, joId, ambitEstable: JSON.stringify([backendScope(c), joId, actor])
});
const espera = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return {promise, resolve}; };

describe('CI explícita i àmbit autoritatiu de §21.1', () => {
  test('la CI reutilitza el constructor del magatzem i no porta actor ni tenant', () => {
    const personal = claus(), entitat = claus(`entitat::${B}`);
    expect(personal.clauIdentitat).toBe(clauIdentitat({backendId:'supabase', endpoint:config.supabaseUrl, joId:A}));
    expect(entitat.clauIdentitat).toBe(personal.clauIdentitat);
    expect(entitat.ambitEstable).not.toBe(personal.ambitEstable);
    const altrePoble = claus(`persona::${A}`, A, {...config, tenantId:B});
    expect(altrePoble.clauIdentitat).toBe(personal.clauIdentitat);
    expect(altrePoble.ambitEstable).not.toBe(personal.ambitEstable);
  });
  test('un actor opac arriba intacte del context; no es deduïx de la CI', () => {
    const c = claus('entitat::valor-opac::amb::separadors');
    expect(JSON.parse(c.ambitEstable)[2]).toBe('entitat::valor-opac::amb::separadors');
    expect(JSON.parse(c.clauIdentitat)).toEqual(['supabase',config.supabaseUrl,A]);
  });
  test('persona i endpoint nous canvien la CI', () => {
    expect(claus(`persona::${B}`, B).clauIdentitat).not.toBe(claus().clauIdentitat);
    expect(claus(`persona::${A}`, A, {...config, supabaseUrl:'https://altre.example.test'}).clauIdentitat).not.toBe(claus().clauIdentitat);
  });
  test('scope alié o no canònic es rebutja, sense fabricar cap CI alternativa', () => {
    for (const ambitEstable of [JSON.stringify([backendScope(config),B,`persona::${A}`]), JSON.stringify(['backend:altre',A,'actor']), '[]', 'malformat', '[1,2,3]', JSON.stringify([backendScope(config),A,''])]) {
      expect(()=>clausDelContextXat({config,joId:A,ambitEstable})).toThrow(TypeError);
    }
  });
  test('sense persona o en mode local no obri identitat persistent', () => {
    expect(clausDelContextXat({config,joId:null,ambitEstable:'sense-sessio'})).toBeNull();
    expect(clausDelContextXat({config:{...config,dataMode:'local'},joId:A,ambitEstable:'local'})).toBeNull();
  });
  test('fixaAmbit(string) exigix la CI explícita; la reserva no es resol inferint l’actor', () => {
    const s=creaServeiAmbitXat(); expect(()=>s.fixaAmbit(claus().ambitEstable)).toThrow(TypeError);
    s.fixaAmbit(claus().ambitEstable,claus().clauIdentitat);
    expect(s.estatAmbit().clauIdentitat).toBe(claus().clauIdentitat);
  });
  test('JWT conserva resums i generacions; actor invalida RAM i conserva operació d’identitat', async()=>{
    const s=creaServeiAmbitXat();s.fixaAmbit(claus());s.desaResumUltimXifrat('f','u','text propi');
    const abans=s.estatAmbit(),id=s.captura('identitat'),op=s.captura();
    s.fixaAmbit({...claus()});expect(s.estatAmbit()).toEqual(abans);expect(s.llegixResumUltimXifrat('f','u')).toBe('text propi');
    const tardana=espera(), identitat=s.guardaIdentitat(async(exigix)=>{await tardana.promise;exigix();return 'restaurada';});
    s.fixaAmbit(claus(`entitat::${B}`));expect(s.vigent(id)).toBe(true);expect(s.vigent(op)).toBe(false);
    expect(s.llegixResumUltimXifrat('f','u')).toBeNull();tardana.resolve();await expect(identitat).resolves.toBe('restaurada');
  });
  test('A→B→A elimina resultat tardà, bytes i blob i impedix escriure després de l’espera', async()=>{
    const revocaUrl=vi.fn(),s=creaServeiAmbitXat({revocaUrl});s.fixaAmbit(claus());
    const tardana=espera(),bytes=Uint8Array.of(7,8),op=s.guardaAmbit(async(exigix,anota)=>{anota('blob:propi');return await tardana.promise;});
    s.fixaAmbit(claus(`entitat::${B}`));s.fixaAmbit(claus());tardana.resolve(bytes);
    await expect(op).rejects.toMatchObject({name:'AbortError'});expect([...bytes]).toEqual([0,0]);expect(revocaUrl).toHaveBeenCalledWith('blob:propi');
  });
  test('una guarda revalida abans del següent efecte després d’una espera',async()=>{
    const s=creaServeiAmbitXat();s.fixaAmbit(claus());const tardana=espera(),escriu=vi.fn();
    const op=s.guardaAmbit(async(exigix)=>{await tardana.promise;exigix();escriu();});
    s.fixaAmbit(claus(`entitat::${B}`));tardana.resolve();await expect(op).rejects.toMatchObject({name:'AbortError'});expect(escriu).not.toHaveBeenCalled();
  });
  test('canvi de persona avorta també la identitat i el rebuig tardà es presenta com AbortError',async()=>{
    const s=creaServeiAmbitXat();s.fixaAmbit(claus());let rebutja;const op=s.guardaIdentitat(()=>new Promise((_,r)=>{rebutja=r;}));
    s.fixaAmbit(claus(`persona::${B}`,B));rebutja(Error('fallada sintètica'));await expect(op).rejects.toMatchObject({name:'AbortError'});
  });
  test('destroy validat invalida abans del destructor del backend i conserva el receptor',()=>{
    let s;const impl=Object.fromEntries(CONTRACTE_NUCLI.map(n=>[n,()=>null]));
    impl.destroy=vi.fn(function(){expect(this).toBe(impl);expect(s.estatAmbit().viu).toBe(false);return 'tancat';});
    const d=ambXifratXat(impl,{actiu:true});s=serveiXifratXat(d);s.fixaAmbit(claus());const op=s.captura();
    expect(validaBackendImplementation(d).dispose()).toBe('tancat');expect(s.vigent(op)).toBe(false);expect(()=>s.fixaAmbit(claus())).toThrow();
  });
  test('destroy getter es rebutja sense executar-lo i flagfalse preserva l’objecte',()=>{
    const getter=vi.fn(()=>()=>{}),impl={};Object.defineProperty(impl,'destroy',{get:getter});
    expect(ambXifratXat(impl,{actiu:false})).toBe(impl);expect(getter).not.toHaveBeenCalled();
    expect(()=>ambXifratXat(impl,{actiu:true})).toThrow(TypeError);expect(getter).not.toHaveBeenCalled();
  });
  test('un adaptador amb prototip nul, com un namespace ESM, es pot decorar',()=>{
    const impl=Object.assign(Object.create(null),Object.fromEntries(CONTRACTE_NUCLI.map(n=>[n,()=>null])));
    const d=ambXifratXat(impl,{actiu:true});expect(serveiXifratXat(validaBackendImplementation(d).candidate)).toBe(serveiXifratXat(d));
  });
  test('els mètodes heretats de més d’un nivell conserven el receptor',()=>{
    class Avi { metodePropi(){return this.valor;} }
    class Pare extends Avi {} class Fill extends Pare {}
    const impl=new Fill();impl.valor=17;expect(ambXifratXat(impl,{actiu:true}).metodePropi()).toBe(17);
  });
});

/* P1-12 pas 17 · La CI de l'eixida de sessió surt del mateix lloc que la de l'àmbit (§21.1). */
describe('clauIdentitatDelContextXat', () => {
  test('és la CI de clausDelContextXat, per a la persona i per a una entitat', () => {
    expect(clauIdentitatDelContextXat({ config, joId: A })).toBe(claus().clauIdentitat);
    expect(clauIdentitatDelContextXat({ config, joId: A })).toBe(claus(`entitat::${B}`).clauIdentitat);
    expect(clauIdentitatDelContextXat({ config, joId: A })).toBe(clauIdentitat({ backendId: 'supabase', endpoint: config.supabaseUrl, joId: A }));
  });
  test('null sense persona, en mode local o sense arguments', () => {
    expect(clauIdentitatDelContextXat({ config, joId: null })).toBeNull();
    expect(clauIdentitatDelContextXat({ config, joId: '' })).toBeNull();
    expect(clauIdentitatDelContextXat({ config: { ...config, dataMode: 'local' }, joId: A })).toBeNull();
    expect(clauIdentitatDelContextXat({ config: null, joId: null })).toBeNull();
    expect(clauIdentitatDelContextXat()).toBeNull();
  });
  test('canvia amb la persona i amb l’endpoint; un altre tenant no la canvia', () => {
    const base = clauIdentitatDelContextXat({ config, joId: A });
    expect(clauIdentitatDelContextXat({ config, joId: B })).not.toBe(base);
    expect(clauIdentitatDelContextXat({ config: { ...config, supabaseUrl: 'https://altre.example.test' }, joId: A })).not.toBe(base);
    expect(clauIdentitatDelContextXat({ config: { ...config, tenantId: B }, joId: A })).toBe(base);
  });
  test('un joId que no és un uuid canònic no fabrica cap CI: llança', () => {
    expect(() => clauIdentitatDelContextXat({ config, joId: 'no-es-uuid' })).toThrow();
    expect(() => clauIdentitatDelContextXat({ config, joId: A.toUpperCase() })).toThrow();
  });
});
