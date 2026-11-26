import { expect, it } from 'vitest';
import { capturaTaxonomiaPagina, projectaTaxonomiaPagina } from './taxonomiaPagina.js';
import { creaTaxonomiaPaginesLocal } from '../local/taxonomiaPaginesLocal.js';
const patch = ()=>({categoriesSistema:['Mur'],etiquetes:['Idees'],geografia:{pobles:['La Torre']},mencions:[]});
it('captura primitius, refusa objectes/getters/autoritat i separa l’entrada mutable', () => {
  const entrada=patch(), net=capturaTaxonomiaPagina('legal',entrada); entrada.etiquetes.push('Intrús');
  expect(net.etiquetes).toEqual(['Idees']); expect(net.versio).toBe(0);
  for (const input of [{...patch(),etiquetes:[{}]},{...patch(),categoriesSistema:[]},{...patch(),role:'superadmin'},{...patch(),geografia:{pobles:[{toString:0}]}},Object.defineProperty(patch(),'etiquetes',{get(){throw new Error('getter executat');}})]) expect(()=>capturaTaxonomiaPagina('legal',input)).toThrow(TypeError);
  expect(()=>projectaTaxonomiaPagina({...net,versio:0})).toThrow();
  expect(projectaTaxonomiaPagina({...net,versio:1})).toEqual({...net,versio:1});
});
it('local: denega per defecte; CAS, canvi de sessió i avortament abans de mutar', async () => {
  let actor='editor'; const e={abast:()=>{const antic=actor;return ()=>{if(antic!==actor)throw new DOMException('Sessió canviada','AbortError');};},usuari:()=>({id:actor}),configuracio:{tenantId:'poble'},opcions:{}};
  const store=creaTaxonomiaPaginesLocal(e);
  await expect(store.actualitzaTaxonomiaPagina('legal',patch())).rejects.toMatchObject({code:'sense-permis'});
  e.opcions.administracioLocal={autoritza:async()=>true};
  const fila=await store.actualitzaTaxonomiaPagina('legal',patch());expect(fila.versio).toBe(1);
  await expect(store.actualitzaTaxonomiaPagina('legal',patch())).rejects.toMatchObject({code:'conflicte-versio'});
  expect(await store.lligTaxonomiaPagina('legal')).toEqual(fila);
  e.opcions.administracioLocal.autoritza=async()=>{actor='intrus';return true;};
  await expect(store.actualitzaTaxonomiaPagina('legal',{...patch(),versio:1})).rejects.toMatchObject({name:'AbortError'});
  e.opcions.administracioLocal.autoritza=async()=>true;actor='editor';
  expect((await store.lligTaxonomiaPagina('legal')).versio).toBe(1);
  actor=null;await expect(store.lligTaxonomiaPagina('legal')).rejects.toMatchObject({code:'sense-permis'});
});
