import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {ESPECIES_HERBARI_LA_TORRE_117 as fitxes,filtraEspeciesHerbari,construeixLocucioEspecieHerbari} from './herbariLaTorre117.js';
describe('IDEA-110: transcripció i procedència de 117 fitxes',()=>{
 it('cens estable, noms trilingües i cita de pàgina/hash en totes les fitxes',()=>{
  expect(fitxes).toHaveLength(117);expect(new Set(fitxes.map(f=>f.id)).size).toBe(117);
  for(const f of fitxes){for(const key of ['nomValencia','nomCastella','nomAngles','nomCientific'])expect(f[key].trim().length).toBeGreaterThan(0);expect(f.font.pagina).toBeGreaterThan(0);expect(f.font.sha256).toMatch(/^[a-f0-9]{64}$/);expect(f.font.taxonomiaRevisada).toBe(false);}
 });
 it('Baladre i Teix tenen advertiment de la font; cap altra fitxa es declara segura per omissió',()=>{
  for(const slug of ['baladre','teix'])expect(fitxes.find(f=>f.slug===slug).esToxica).toBe(true);
  expect(fitxes.some(f=>f.esToxica===false)).toBe(false);
  for(const f of fitxes.filter(f=>f.esToxica===null))expect(f.toxicitat).toBe('no-avaluada');
 });
 it('cerca accentuada, científica i en altres llengües, amb ús documental',()=>{
  expect(filtraEspeciesHerbari({cerca:'pebrella'})[0].nomCientific.toLowerCase()).toBe('thymus piperella');
  expect(filtraEspeciesHerbari({cerca:'Taxus baccata'})).toHaveLength(1);
  expect(filtraEspeciesHerbari({nomesToxiques:true}).every(f=>f.esToxica===true)).toBe(true);
  expect(filtraEspeciesHerbari({usActiu:'Artesanal'}).every(f=>f.usos.includes('Artesanal'))).toBe(true);
 });
 it('la locució es deriva de la fitxa i no ompli camps inexistents',()=>{
  expect(construeixLocucioEspecieHerbari(null)).toBe('');
  const teix=fitxes.find(f=>f.slug==='teix');expect(construeixLocucioEspecieHerbari(teix)).toContain('Taxus baccata');
 });
});

describe('R25: parterres derivats dels rètols originals i cerca del punt volat',()=>{
 const sourcePath='tests/fixtures/herbari/cartells_la_canaleta.txt';
 const sourceBytes=readFileSync(sourcePath),lines=sourceBytes.toString('utf8').split('\n');
 const sha=createHash('sha256').update(sourceBytes).digest('hex');
 const normal=value=>value.normalize('NFKD').replace(/\p{M}/gu,'').replace(/[‘’“”]/g,'"').replace(/\s+/g,' ').trim().toLowerCase();
 const heading=line=>/^(?:ARBRES (?:I PLANTES ZONA .+|DAVANT CASA)|PLANTES ERA|BANCAL DE FRUITALS|PARTERRE (?:[1-4] .+|ABELLES I BANCAL SUPERIOR)|PLANTES I HERBES AROMÀTIQUES I MEDICINALS)$/.test(line.trim());
 const captions=[];let section=null;
 for(const [index,line]of lines.entries()){if(heading(line)){section={zona:line.trim(),liniaTitol:index+1};continue;}if(section&&line.trim())captions.push({text:line.trim(),line:index+1,...section});}
 it('cada una de les117fitxes conserva tots els rètols de zona i cites de línia de la font',()=>{
  expect(sha).toBe('de1abe6491009c730845fdf5c8dcac01e1d25e0bb8c340c5593a1c0bf0c9985c');expect(lines.filter(heading)).toHaveLength(11);
  const plata=fitxes.find(row=>row.nomValencia==='Ciprer de plata');
  const sourcePlata=captions.find(caption=>normal(caption.text)===normal(plata.nomCientific));
  expect(sourcePlata.zona).toBe('PARTERRE 1 (BAIX)');expect(plata.zonaCanaleta).toContain(sourcePlata.zona);
  for(const row of fitxes){
   const matches=captions.filter(caption=>normal(caption.text)===normal(row.nomCientific));expect(matches.length,row.id).toBeGreaterThan(0);
   const zones=[...new Set(matches.map(caption=>caption.zona))];expect(row.zonesCanaleta,row.id).toEqual(zones);expect(row.zonaCanaleta,row.id).toBe(zones.join(' · '));
   expect(row.localitzacionsCanaleta,row.id).toEqual(matches.map(caption=>({zona:caption.zona,liniaTitol:caption.liniaTitol,liniaCientific:caption.line})));
   expect(row.fontZones.sha256).toBe(sha);expect(row.fontZones.document).toBe('cartells_la_canaleta.txt');expect(row.fontZones.pagina).toBeNull();
   expect(Object.isFrozen(row.zonesCanaleta)).toBe(true);expect(Object.isFrozen(row.localitzacionsCanaleta)).toBe(true);expect(row.localitzacionsCanaleta.every(Object.isFrozen)).toBe(true);
  }
  const activeZones=new Set(fitxes.flatMap(row=>row.zonesCanaleta));for(const section of ['PARTERRE 1 (BAIX)','PARTERRE 2 (MIG)','PARTERRE 3 (FRUITES DE LA SERRA)','PARTERRE 4 (FONT D’HERBES)'])expect(activeZones.has(section)).toBe(true);
 });
 it('la cerca equival sense punt volat, amb punt volat o amb punt simple, sense alterar els noms',()=>{
  for(const [source,plain,dotted]of [['Til·lera','tillera','til.lera'],['Lil·lera','lillera','lil.lera']]){
   const expected=filtraEspeciesHerbari({cerca:source}).map(row=>row.id);expect(expected).toHaveLength(1);
   expect(filtraEspeciesHerbari({cerca:plain}).map(row=>row.id)).toEqual(expected);expect(filtraEspeciesHerbari({cerca:dotted}).map(row=>row.id)).toEqual(expected);
   expect(filtraEspeciesHerbari({cerca:plain})[0].nomValencia).toBe(source);
  }
 });
 it('conserva les dues cites de capçalera corregides i la toxicitat desconeguda',()=>{
  expect(fitxes.find(row=>row.slug==='olivera').font.pagina).toBe(83);expect(fitxes.find(row=>row.slug==='roser').font.pagina).toBe(104);
  expect(fitxes.filter(row=>row.esToxica===null)).toHaveLength(114);expect(fitxes.some(row=>row.esToxica===false)).toBe(false);
 });
});
