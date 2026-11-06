import {describe,expect,it} from 'vitest';
import {ESPECIES_HERBARI_LA_TORRE_117 as fitxes,construeixLocucioEspecieHerbari} from '../../data/patrimoni/herbariLaTorre117.js';
import {TEXTOS_HERBARI} from './textosHerbari.js';

/* IDEA-110 · F2R-01 / G6-03 / G6-V-02: l’avís de la fitxa no és una llista exhaustiva ni un aval.
 * Una frase per idioma i per cas; si algú l’esborra o la canvia per un farciment, la prova cau. */
const CASOS={
 ca:{no_avalua:'no acredita innocuïtat',consell:'no mengeu cap planta sense consell expert',advertida:'No en mengeu cap part'},
 es:{no_avalua:'no acredita inocuidad',consell:'no comáis ninguna planta sin consejo experto',advertida:'No comáis ninguna parte'},
 en:{no_avalua:'does not establish safety',consell:'do not eat any plant without expert advice',advertida:'Do not eat any part'},
 eu:{no_avalua:'ez du segurtasuna egiaztatzen',consell:'ez jan landarerik aditu baten aholkurik gabe',advertida:'Ez jan inolako zatirik'},
 gl:{no_avalua:'non acredita inocuidade',consell:'non comas ningunha planta sen consello experto',advertida:'Non comas ningunha parte'}
};
describe('IDEA-110 · l’avís de la fitxa porta consell de protecció als 5 idiomes',()=>{
 it('cada idioma té la frase de no-aval i el consell exactes (desconeguda) i la instrucció (advertida)',()=>{
  expect(Object.keys(TEXTOS_HERBARI).sort()).toEqual(Object.keys(CASOS).sort());
  for(const [lang,cas] of Object.entries(CASOS)){
   const t=TEXTOS_HERBARI[lang];
   expect(t.toxicitatDesconeguda,lang).toContain(cas.no_avalua);expect(t.toxicitatDesconeguda,lang).toContain(cas.consell);
   expect(t.toxicitatAdvertida,lang).toContain(cas.advertida);expect(t.toxicitatAdvertida,lang).not.toBe(t.toxicitatDesconeguda);
  }
 });
 it('la locució (el cas de la veu local) porta el mateix avís que la fitxa: cap fitxa és muda',()=>{
  for(const f of fitxes){
   const veu=construeixLocucioEspecieHerbari(f);
   if(f.esToxica===true){expect(veu,f.id).toContain('No en mengeu cap part');}
   else{expect(veu,f.id).toContain('no acredita innocuïtat');expect(veu,f.id).toContain('no mengeu cap planta sense consell expert');}
  }
  expect(construeixLocucioEspecieHerbari(fitxes.find(f=>f.slug==='ruda'))).toContain('Aliment');
 });
});
