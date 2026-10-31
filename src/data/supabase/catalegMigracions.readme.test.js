// @vitest-environment node
import {describe,expect,it} from 'vitest';
import {readdirSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const arrel=fileURLToPath(new URL('../../../',import.meta.url));
const readme=readFileSync(arrel+'supabase/README.md','utf8');
const reals=readdirSync(arrel+'supabase/migrations').filter(n=>n.endsWith('.sql')).sort();
function comprova(text,fitxers){
 const bullets=[...text.split('\n- `seed.sql`')[0].matchAll(/^- `migrations\/([^`\n]+\.sql)`$/gm)].map(m=>m[1]);
 const taula=[...text.matchAll(/^\| (\d+) \| `(\d{10})` \| `([^`]+\.sql)` \| [^|]+ \| [^|]+ \|$/gm)];
 expect(bullets).toEqual([...new Set(bullets)].sort());
 expect(taula.map(m=>m[3])).toEqual(bullets);
 taula.forEach((m,i)=>{expect(Number(m[1])).toBe(i+1);expect(m[3].slice(0,10)).toBe(m[2]);});
 expect(new Set(fitxers.map(n=>n.slice(0,10))).size).toBe(fitxers.length);
 for(const n of fitxers)expect(text,`Migració real no documentada: ${n}`).toContain('`migrations/'+n+'`');
 for(const n of bullets.filter(n=>!fitxers.includes(n))){
  expect(['2610311500_commutacio_grup_empresa_i_transferencia_propietat.sql','2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql']).toContain(n);
 }
}
describe('Catàleg resilient: inventari versionat, candidates i futures documentades',()=>{
 it('cobrix cada fitxer real, sense número fix ni migracions fantasma',()=>comprova(readme,reals));
 it('admet 2610312000 documentada i rebutja una migració futura sense documentar (mutació)',()=>{
 const n='2610312000_service_role_xat.sql';
 const base='- `migrations/2601010000_base.sql`\n- `seed.sql`\n| 01 | `2601010000` | `2601010000_base.sql` | Estat desconegut | Base |\n';
 const fitxers=['2601010000_base.sql',n];
 expect(()=>comprova(base,fitxers)).toThrow();
 expect(()=>comprova(base+'\n- Candidat: `migrations/'+n+'`\n',fitxers)).not.toThrow();
 expect(()=>comprova(base,['2601010000_base.sql','2610319999_no_documentada.sql'])).toThrow();
 });
 it('rebutja versions duplicades i inventari desordenat (mutació)',()=>{
 expect(()=>comprova(readme,[...reals,reals[0].replace(/_.*/, '_duplicada.sql')])).toThrow();
 const canvi=readme.replace('migrations/'+reals[0],'migrations/'+reals[1]);
 expect(()=>comprova(canvi,reals)).toThrow();
 });
 it('documenta snippets reals, estat remot desconegut i seqüència sense versions inventades',()=>{
 for(const n of readdirSync(arrel+'supabase/snippets').filter(n=>n.endsWith('.sql')))expect(readme).toContain('snippets/'+n);
 expect(readme).toContain('seed.sql');expect(readme).toContain("Nota d'auditoria `DF-06` (`P0-05`)");
 const seq=readme.slice(readme.indexOf('### Nota d’auditoria')<0?readme.indexOf("### Nota d'auditoria"):readme.indexOf('### Nota d’auditoria'),readme.indexOf('### Taula canònica'));
 const conegudes=new Set([...reals.map(n=>n.slice(0,10)),'2610311500','2610311800']);
 for(const n of [...seq.matchAll(/→ `(\d{10})`/g)].map(m=>m[1]))expect(conegudes.has(n),n).toBe(true);
 expect(readme).toContain("to_regclass('supabase_migrations.schema_migrations')");
 expect(readme).toContain("to_regclass('public.xat_epoques')");
 expect(readme).toContain('src/data/supabase/contracteExportacioFederacio.js');
 });
});
