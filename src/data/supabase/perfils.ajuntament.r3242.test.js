// @vitest-environment node
import { expect, test } from 'vitest';
import { perfilDOrganitzacio } from './perfils.js';
import { createLocalPerfilsAdapter } from '../localPerfils.js';
import { rutaDePerfil, objecteDePerfil, objecteDeRutaDePerfil } from '../../config/navigation.js';
import { FONTS_BANC_LLAVORS, VARIETATS_OLIVERA_GVA_IVIA, VARIETATS_CATALEG_VALENCIA, entradesDelCataleg, filtraEntrades } from '../patrimoni/bancLlavors.js';

test.each(['city_hall','company','entity','group'])('DTO remot i local conserva kind %s sense perdre tipus contractual',kind=>{
 const org={id:'ajuntament-sintetic',slug:'ajuntament-sintetic',name:'Ajuntament sintètic',kind,visibility:'public',claimed:false};
 expect(perfilDOrganitzacio(org)).toMatchObject({kind,tipus:kind==='group'?'grup':'entitat',claimed:false});
 const local=createLocalPerfilsAdapter({entitats:[org]});
 expect(local.loadPerfilPublic(org.id,null)).toMatchObject({kind,tipus:kind==='group'?'grup':'entitat',claimed:false});
 expect(perfilDOrganitzacio({...org,claimed:true})).toMatchObject({claimed:true});
});
test('claimed és afirmació estricta del servidor i cap veritat sintètica',()=>{
 for(const claimed of [undefined,null,'true',1,false])expect(perfilDOrganitzacio({id:'x',kind:'city_hall',claimed}).claimed).toBe(false);
});
test('rutes municipals reversibles i descriptors compatibles amb connexions',()=>{
 for(const tipus of ['city_hall','ajuntament'])expect(rutaDePerfil(tipus,'a/b')).toBe('/ajuntament/a%2Fb');
 expect(objecteDePerfil({id:'a/b',tipus:'entitat',kind:'city_hall'})).toMatchObject({tipus:'entitat',ruta:'/ajuntament/a%2Fb'});
 expect(objecteDeRutaDePerfil('/ajuntament/a%2Fb')).toMatchObject({tipus:'entitat',id:'a/b',ruta:'/ajuntament/a%2Fb'});
 expect(rutaDePerfil('entitat','org')).toBe('/empresa/org');
 expect(rutaDePerfil('grup','g')).toBe('/grup/g');
 expect(objecteDeRutaDePerfil('/ajuntament/%ZZ')).toBeNull();
 expect(objecteDeRutaDePerfil('/ajuntament/id?foo=1')).toBeNull();
});
test('tres oliveres amb font GVA/IVIA pròpia i cap fals calendari hortícola',()=>{
 const source=FONTS_BANC_LLAVORS.find(f=>f.id==='oliveres-gva-ivia');
 expect(source.document).toBe('https://redivia.gva.es/handle/20.500.11939/8499');
 expect(source.sha256).toMatch(/^[a-f\d]{64}$/);
 expect(VARIETATS_OLIVERA_GVA_IVIA.map(v=>v.id)).toEqual(['olivera-alfafarenca','olivera-blanqueta','olivera-villalonga']);
 expect(entradesDelCataleg(source.id)).toHaveLength(3);
 expect(filtraEntrades(entradesDelCataleg(source.id),'alfafarenca')).toHaveLength(1);
 expect(VARIETATS_CATALEG_VALENCIA.some(v=>v.id.startsWith('olivera-'))).toBe(false);
 expect(VARIETATS_OLIVERA_GVA_IVIA.every(v=>v.calendari===null&&v.fontId===source.id&&Object.isFrozen(v))).toBe(true);
});
