// @vitest-environment node
import {readFileSync} from 'node:fs';
import {expect,test,vi} from 'vitest';
import {capturaCopiaCompte,creaPaquetCompte,llegeixPaquetCompte,importaComptePortable} from './portabilitatCompte.js';
import {empaquetaZip,jsonCanonic} from './exportaMunicipiOpenData.js';
import {llegeixZip} from '../utils/fulls/zip.js';
import {sha256Hex} from './federacio/portabilitatFediversity.js';
const fixture=()=>JSON.parse(readFileSync('tests/fixtures/portabilitat-compte-v2/compte.synthetic.json','utf8'));
test('JSON autoritatiu conserva camps complets i ZIP/MD/CSV deterministes',()=>{
 const source=fixture(),a=creaPaquetCompte(source),b=creaPaquetCompte(source);
 expect(a.sha256).toBe(b.sha256);expect(llegeixPaquetCompte(a.zip,{sha256Esperat:a.sha256})).toEqual(source);
 expect(a.manifest.completDinsPerfil).toBe(true);expect(a.manifest.exclos).toContain('credencials');
 const names=llegeixZip(a.zip).map(file=>file.nom);expect(names.some(name=>name.endsWith('.md'))).toBe(true);expect(names).toContain('data/registre.csv');
});
test.each([NaN,Infinity,undefined,1n])('valor JSON no portable %s es rebutja abans de serialitzar',value=>{const source=fixture();source.dades.notes[0].extra=value;expect(()=>creaPaquetCompte(source)).toThrow();});
test('sparse, cicles i getters no es normalitzen ni executen',()=>{
 const source=fixture();source.dades.notes[0].extra=Array(2);expect(()=>creaPaquetCompte(source)).toThrow();
 source.dades.notes[0].extra=source;expect(()=>creaPaquetCompte(source)).toThrow();
 delete source.dades.notes[0].extra;const get=vi.fn();Object.defineProperty(source.dades.perfil,'bio',{get,enumerable:true});expect(()=>creaPaquetCompte(source)).toThrow();expect(get).not.toHaveBeenCalled();
});
test.each(['missing-folder','duplicate-note','role','bad-last-resource'])('paquet %s no deixa entrar cap restauració',async mutation=>{
 const source=fixture();
 if(mutation==='missing-folder')source.dades.notes[0].folderId='absent';
 if(mutation==='duplicate-note')source.dades.notes.push(source.dades.notes[0]);
 if(mutation==='role')source.dades.organitzacions[0].role='owner';
 if(mutation==='bad-last-resource')source.dades.patrimoni[0].mesures={invalid:{nested:1}};
 const restore=vi.fn(),good=creaPaquetCompte(fixture());
 const files=llegeixZip(good.zip).map(({nom,dades})=>({nom,dades:nom==='data/compte.json'?JSON.stringify(source):dades}));
 const bad=empaquetaZip(files);
 await expect(importaComptePortable(bad,{restauraCopiaCompte:restore},{sha256Esperat:sha256Hex(bad)})).rejects.toThrow();expect(restore).not.toHaveBeenCalled();
});
test('hash corrupte, ZIP truncat i claus JSON duplicades fallen abans de mutar',async()=>{
 const a=creaPaquetCompte(fixture()),restore=vi.fn();
 await expect(importaComptePortable(a.zip,{restauraCopiaCompte:restore},{sha256Esperat:'0'.repeat(64)})).rejects.toThrow();
 expect(()=>llegeixPaquetCompte(a.zip.slice(0,100),{sha256Esperat:sha256Hex(a.zip.slice(0,100))})).toThrow();
 const files=llegeixZip(a.zip).map(({nom,dades})=>({nom,dades:nom==='data/compte.json'?new TextDecoder().decode(dades).replace('"format":','"format":"socdepoble.backup.v2","format":'):dades}));
 const duplicate=empaquetaZip(files);expect(()=>llegeixPaquetCompte(duplicate,{sha256Esperat:sha256Hex(duplicate)})).toThrow();expect(restore).not.toHaveBeenCalled();
});
test('snapshot no muta objecte font i conserva zeros/nulls/campanyes',()=>{const value=fixture();const before=jsonCanonic(value);expect(capturaCopiaCompte(value).dades.patrimoni[0].mesures).toEqual({altura:0,pendent:null,vist:true});expect(jsonCanonic(value)).toBe(before);});
test('pare extern conserva identificador i procedència sense dades ni permisos del pare',()=>{
 const source=fixture();source.dades.organitzacions[0].parent_organization_id='pare-privat';
 const pack=creaPaquetCompte(source);
 expect(pack.manifest.referenciesExternes).toEqual([{recurs:'organitzacions',camp:'parent_organization_id',id:'pare-privat',procedencia:'nomes-referencia-sense-dades-ni-autoritat'}]);
 expect(llegeixPaquetCompte(pack.zip,{sha256Esperat:pack.sha256})).toEqual(source);
 expect(source.dades.organitzacions).toHaveLength(1);
});
test('pressupost agregat es comprova abans de JCS encara que cada cadena siga admissible',()=>{
 const source=fixture();source.dades.notes[0].extra=Array(12).fill('x'.repeat(750000));
 expect(()=>creaPaquetCompte(source)).toThrow(expect.objectContaining({code:'copia-limit'}));
 source.dades.notes[0].extra=Array(3).fill('\u0001'.repeat(750000));
 expect(()=>creaPaquetCompte(source)).toThrow(expect.objectContaining({code:'copia-limit'}));
});
