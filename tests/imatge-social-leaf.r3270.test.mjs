import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {parse} from '@babel/parser';
import * as base from '../src/config/imatgeSocialBase.js';
import * as legacy from '../src/config/imatgeSocial.js';
const names=['ATRIBUT_SSR','CAP_SOCIAL_BASE','HERO_PER_DEFECTE','MARQUES','MARQUES_SVG_ANTIGUES','ORIGEN_SOCIAL_PER_DEFECTE'];
test('Social leaf · sis exports i identitat legacy exacta, amb congelació recursiva',()=>{
 assert.deepEqual(Object.keys(base).sort(),names);
 for(const name of names)assert.equal(base[name],legacy[name]);
 const frozen=value=>{if(value&&typeof value==='object'){assert(Object.isFrozen(value));for(const child of Object.values(value))frozen(child);}};
 for(const value of Object.values(base))frozen(value);
 assert.throws(()=>{base.CAP_SOCIAL_BASE.image.url='alterat';},TypeError);
 assert.equal(base.CAP_SOCIAL_BASE.image.url,'/assets/system/ui/og-socdepoble-1200x630.png');
 assert.deepEqual(Object.keys(legacy).sort(),['ATRIBUT_SSR','CAP_SOCIAL_BASE','HERO_PER_DEFECTE','IMATGES_DE_RESERVA','MARQUES','MARQUES_SVG_ANTIGUES','MOTIUS_DE_BLOQUEIG','ORIGEN_SOCIAL_PER_DEFECTE','TIPUS_DE_PAGINA','VARIANTS_SOCIALS','esImatgeDeReserva','imatgesDeLaPagina','primerValor','primeraImatgeSocial','srcsDeLesImg','urlSocialDe']);
});
test('Social leaf · fulla sense imports i tres consumidors eager sense dependència del selector',()=>{
 const ast=parse(fs.readFileSync('src/config/imatgeSocialBase.js','utf8'),{sourceType:'module'});
 assert.equal(ast.program.body.some(node=>node.type==='ImportDeclaration'||node.type==='ExportAllDeclaration'||node.source),false);
 for(const file of ['src/components/universal/UniversalUtils.js','src/hooks/useSEO.js','src/hooks/seoHead.js']){
  const body=parse(fs.readFileSync(file,'utf8'),{sourceType:'module'}).program.body;
  const imports=body.filter(n=>n.type==='ImportDeclaration').map(n=>n.source.value);
  assert(imports.some(source=>source.endsWith('/imatgeSocialBase.js')));assert.equal(imports.some(source=>source.endsWith('/imatgeSocial.js')),false);
 }
});
test('Social leaf · selector públic conserva regla primera pròpia, bloqueig i reserva',()=>{
 const item={id:'samarreta',images:['/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png']};
 const selected=legacy.primeraImatgeSocial('mercat',item);assert.equal(selected.estat,'triada');assert.equal(selected.ref,item.images[0]);assert.equal(selected.url,'https://socdepoble.org/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey-social-1200x630.jpg');
 const blocked=legacy.primeraImatgeSocial('mercat',{images:['https://untrusted.invalid/a.jpg',item.images[0]]});assert.equal(blocked.estat,'bloquejada');
 assert.equal(legacy.primeraImatgeSocial('mur',{}).estat,'absent');assert.equal(legacy.esImatgeDeReserva(base.MARQUES.avatar),true);
});
