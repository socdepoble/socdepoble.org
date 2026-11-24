import {expect,test} from 'vitest';
import {transformaPostWpRestApi} from './transformadorEditorialWpBlogger.js';
import {llegixLlibre} from './fulls/lector.js';
import {creaZip} from './fulls/zip.js';
function workbook({shared='<sst/>',sheet='<worksheet><sheetData/></worksheet>',style='<styleSheet/>'}={}){
 return creaZip([
  {nom:'xl/workbook.xml',dades:'<workbook><sheets><sheet name="Sintètic" r:id="s"/></sheets></workbook>'},
  {nom:'xl/_rels/workbook.xml.rels',dades:'<Relationships><Relationship Id="s" Type="test/worksheet" Target="worksheets/s.xml"/><Relationship Id="t" Type="test/sharedStrings" Target="sharedStrings.xml"/><Relationship Id="e" Type="test/styles" Target="styles.xml"/></Relationships>'},
  {nom:'xl/sharedStrings.xml',dades:shared},{nom:'xl/worksheets/s.xml',dades:sheet},{nom:'xl/styles.xml',dades:style}
 ]);
}
test('títol WP amb delimitadors oberts conserva text i acaba dins pressupost ampli',()=>{
 const title='<'.repeat(60000),start=performance.now();
 const result=transformaPostWpRestApi({title:{rendered:title},content:{rendered:'<p>Cos</p>'},slug:'prova'});
 expect(result.title).toBe(title);expect(performance.now()-start).toBeLessThan(500);
});
test('XLSX vàlid amb claudàtors de format sense parella no reescaneja cada posició',()=>{
 const code='['.repeat(60000),bytes=workbook({style:'<styleSheet><numFmts><numFmt numFmtId="164" formatCode="'+code+'"/></numFmts><cellXfs><xf numFmtId="164"/></cellXfs></styleSheet>',sheet:'<worksheet><sheetData><row><c s="0"><v>1</v></c></row></sheetData></worksheet>'});
 const start=performance.now();expect(llegixLlibre(bytes).fulles[0].celles[0].valor).toBe(1);expect(performance.now()-start).toBeLessThan(500);
});
test('CDATA amb etiquetes literals i fonètica real conserva només el text visible',()=>{
 const literal='<rPh'.repeat(10000),bytes=workbook({shared:'<sst><si><t><![CDATA['+literal+']]></t><rPh><t>fonètica</t></rPh></si></sst>',sheet:'<worksheet><sheetData><row><c t="s"><v>0</v></c></row></sheetData></worksheet>'});
 expect(llegixLlibre(bytes).fulles[0].celles[0].valor).toBe(literal);
});
test.each([
 ['rPh',{shared:'<sst><si>'+ '<rPh'.repeat(10000) +'</si></sst>'}],
 ['si',{shared:'<sst>'+ '<si>'.repeat(10000) +'</sst>'}],
 ['row',{sheet:'<worksheet><sheetData>'+ '<row'.repeat(10000) +'</sheetData></worksheet>'}],
 ['c',{sheet:'<worksheet><sheetData><row>'+ '<c>'.repeat(10000) +'</row></sheetData></worksheet>'}],
 ['v',{sheet:'<worksheet><sheetData><row><c>'+ '<v>'.repeat(10000) +'</c></row></sheetData></worksheet>'}],
])('XLSX real amb %s sense tancar es rebutja sense retorn buit ni espera quadràtica',(_name,parts)=>{
 const bytes=workbook(parts),start=performance.now();expect(()=>llegixLlibre(bytes)).toThrow(TypeError);expect(performance.now()-start).toBeLessThan(500);
});
