/** Test-only small independent goldens. No human source is read or reconstructed. */
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const base=new URL('./portabilitat-compte-v2/',import.meta.url);
export const textFixture=name=>readFileSync(new URL(name,base),'utf8');
export const jsonFixture=name=>JSON.parse(textFixture(name));
export function receiptFixture(caseName){console.info(JSON.stringify({fixture:'C6-independent-synthetic',case:caseName,human_original_verified:false,original_comparison:'not-executed-source-absent'}));}
export function projectaPublicaParroquiaSintetica(){
 const source='tooling/menjarIBeure/importaParroquia.py';
 // Execute the actual production projection function using only its stdlib
 // imports/constants. Reading XLSX/openpyxl is outside this mechanical test.
 const code=`import ast,copy,json,sys\np=ast.parse(open(sys.argv[1],encoding='utf8').read())\nselected=[n for n in p.body if isinstance(n,ast.FunctionDef) and n.name=='versio_publica' or isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id in ('CAMPS_PRIVATS_TARIFA','CAMI_PRIVAT') for t in n.targets)]\nspace={'copy':copy}\nexec(compile(ast.Module(body=selected,type_ignores=[]),sys.argv[1],'exec'),space)\nprint(json.dumps(space['versio_publica'](json.load(sys.stdin)),ensure_ascii=False))`;
 const result=spawnSync('python3',['-c',code,source],{input:textFixture('parroquia-completa.synthetic.json'),encoding:'utf8',timeout:10000,maxBuffer:100000});
 if(result.status!==0)throw new Error('Synthetic projection process failed');
 return JSON.parse(result.stdout);
}
