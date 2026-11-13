// @vitest-environment node
import {describe,expect,it} from 'vitest';
import {readdirSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const arrel=fileURLToPath(new URL('../../../',import.meta.url));
const readme=readFileSync(arrel+'supabase/README.md','utf8');
/* R21.9b · Catàleg mixt: els noms de 10 dígits (AAMMDDhhmm) s'ordenen com 20AAMMDDhhmm00 i els de 14 (AAAAMMDDhhmmss)
   es conserven, igual que clauOrdreVersio de scripts/supabase/verifica-migracions.mjs. Cap ordre alfabètic cru. */
const versio=n=>(/^(\d{14}|\d{10})_/.exec(n)||[])[1];
const clau=n=>{const v=versio(n);return v&&v.length===10?`20${v}00`:v;};
const perOrdre=(a,b)=>clau(a).localeCompare(clau(b))||a.localeCompare(b);
const reals=readdirSync(arrel+'supabase/migrations').filter(n=>n.endsWith('.sql')).sort(perOrdre);
function comprova(text,fitxers){
 const bullets=[...text.split('\n- `seed.sql`')[0].matchAll(/^- `migrations\/([^`\n]+\.sql)`$/gm)].map(m=>m[1]);
 const taula=[...text.matchAll(/^\| (\d+) \| `(\d{14}|\d{10})` \| `([^`]+\.sql)` \| [^|]+ \| [^|]+ \|$/gm)];
 expect(bullets).toEqual([...new Set(bullets)].sort(perOrdre));
 expect(taula.map(m=>m[3])).toEqual(bullets);
 taula.forEach((m,i)=>{expect(Number(m[1])).toBe(i+1);expect(versio(m[3])).toBe(m[2]);});
 expect(new Set(fitxers.map(versio)).size).toBe(fitxers.length);
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

/* Onada R10 · B4 (VFT-01, VFC-06 i la M12 de VFT-03) · La lectura REST de producció del 6-11-2026
   (22:08, només GET amb la clau anònima): una funció que existix i anon no pot executar respon 401
   42501; una que no existix, 404 PGRST202. Per a cada migració que hi consta aplicada, la fila de la
   taula canònica i la vinyeta diuen el mateix, amb la mateixa evidència, i cap de les dues no torna a
   dir «NO aplicada». Les cinc que el Mestre diu haver aplicat el 6-11 ho diuen a la fila i a la
   vinyeta. La 2611011800 només consta per l'acta 261102_1456 (els seus objectes no són visibles per a
   anon). Segona ronda (B4V-T3, lectura de les 23:53): també hi són la 2610311500, la 2610311800, la
   2611021800 i la 2611031500; la 2610311900 i la 2610312000, que l'acta 261101_0334 dona aplicades i
   anon no pot veure, passen a «Estat remot no acreditat». La 2609121600 no és aplicada sencera, i
   (B4V-T1) admin_list_organizations() ha canviat el mateix dia: 404 PGRST202 a les 22:08 i 401 42501
   a les 23:22 i a les 23:53. La prova exigix les dues lectures datades, no cap estat fix. */
const APLICADES_R10={
 '2610311500':{mestre:false,evidencia:['`transfereix_propietat_organitzacio(uuid, uuid)`','401 42501','acta 261101_0334']},
 '2610311800':{mestre:false,evidencia:['`xat_epoques`','401 42501','acta 261101_0334']},
 '2611021800':{mestre:false,evidencia:['`notes.fitxa`','200 a anon']},
 '2611031500':{mestre:false,evidencia:['`notes.logo_image_dark`','200 a anon']},
 '2611011500':{mestre:false,evidencia:['`pot_signar_com_organitzacio(uuid, uuid)`','404 PGRST202']},
 '2611011510':{mestre:false,evidencia:["`versio_minima_client('android')` respon 200 a anon"]},
 '2611012257':{mestre:false,evidencia:['`politiques_privacitat`','`abd827d0…`']},
 '2611020106':{mestre:false,evidencia:['`ap_alertes_vigents(timestamptz)`']},
 '2611030330':{mestre:false,evidencia:['`politiques_privacitat`','`2956bc30…`']},
 '2611031700':{mestre:false,evidencia:['`admin_llista_pobles()`','`admin_llegix_personalitzacio(uuid)`']},
 '2611032100':{mestre:true,evidencia:['`connexions_publiques_de`','`membres_i_entitats_connectades_de`','200 a anon']},
 '2611051930':{mestre:true,evidencia:['`note_folders`','`crea_carpeta_notes`','`admin_actualitza_publicacio_editorial`']},
 '2611052345':{mestre:true,evidencia:['`admin_llista_usuaris_registrats`','`admin_convida_a_entitat`','`admin_connecta_usuari`','`les_meues_invitacions_admin`']},
 '2611060010':{mestre:true,evidencia:['`llegix_municipi_open_data_per_slug`','200 a anon']},
 '2611061520':{mestre:true,evidencia:['`politiques_privacitat`','`ea13f0c4…`','2026-11-05T23:00Z']},
};
function estatsR10(text){
 const files=new Map([...text.matchAll(/^\| (\d+) \| `(\d{10})` \| `([^`]+\.sql)` \| ([^|]+) \| [^|]+ \|$/gm)].map(m=>[m[2],{fitxer:m[3],estat:m[4].trim()}]));
 const cap=text.split('\n- `seed.sql`')[0];
 const vinyeta=v=>{const i=cap.indexOf('- `migrations/'+files.get(v)?.fitxer+'`\n');return i<0?'':cap.slice(i).split('\n\n')[0].replace(/\s+/g,' ');};
 return {files,vinyeta};
}
function comprovaEstatsR10(text){
 const {files,vinyeta}=estatsR10(text);
 for(const [v,{mestre,evidencia}] of Object.entries(APLICADES_R10)){
  const fila=files.get(v)?.estat??'',vin=vinyeta(v);
  expect(fila,v).toMatch(/^Aplicada a producció \(lectura REST del 6-11: /);
  expect(vin,v).toMatch(/\*\*[Aa]plicada a producció\*\* \(lectura REST del 6-11-2026: /);
  for(const t of [fila,vin])expect(t,v).not.toMatch(/NO aplicada|exclosa de R7|pendent d'aplicació/);
  for(const e of evidencia){expect(fila,`${v} · fila · ${e}`).toContain(e);expect(vin,`${v} · vinyeta · ${e}`).toContain(e);}
  expect(fila.includes('aplicada pel Mestre el 6-11'),`${v} · fila · Mestre`).toBe(mestre);
  expect(vin.includes('aplicada pel Mestre el 6-11'),`${v} · vinyeta · Mestre`).toBe(mestre);
 }
 expect(files.get('2611011800').estat).toMatch(/^Aplicada segons l'acta 261102_1456 \(sense lectura REST/);
 expect(vinyeta('2611011800')).toContain("**aplicada segons l'acta 261102_1456** (sense lectura REST");
 // B4V-T6 · El Pas 0 encara no té cap resultat registrat: la vinyeta no pot dir que «ho confirma».
 expect(vinyeta('2611011800')).toContain('ho pot confirmar la columna `te_contracte_federacio_2611011800` del Pas 0, encara sense resultat registrat');
 expect(vinyeta('2611011800')).not.toMatch(/ho confirma la columna/);
 // B4V-T1 · Fila i vinyeta de l'admin panel: les dues lectures datades, sense fixar un 404 que ja no és cert.
 const admin=files.get('2609121600').estat,vadmin=vinyeta('2609121600');
 expect(admin).toMatch(/^Estat remot no acreditat sencer \(lectura REST del 6-11: /);
 expect(vadmin).toContain('**Estat remot no acreditat sencer**');
 for(const t of [admin,vadmin]){
  for(const peca of ['`admin_list_users()`','`admin_list_organizations()`','404 PGRST202 a les 22:08','23:22','respon 401 42501','sense cap migració nova al repositori'])expect(t,peca).toContain(peca);
  expect(t).toMatch(/[Nn]o la torneu a aplicar sencera/);
  expect(t).not.toMatch(/Aplicada a producció|\*\*[Aa]plicada|És el 404|`admin_list_organizations\(\)` no, 404/);
 }
 expect(vadmin).toContain("`select has_function_privilege('authenticated', 'public.admin_list_users()', 'EXECUTE');`");
 // B4V-T3 · La 2610311900 i la 2610312000: l'acta 261101_0334 les dona aplicades, anon no les veu.
 for(const [v,peca] of [['2610311900',"el cos d'`exporta_les_meues_dades()`"],['2610312000','`te_esmena_2610312000`']]){
  const fila=files.get(v)?.estat??'',vin=vinyeta(v);
  expect(fila,v).toMatch(/^Estat remot no acreditat \(l'acta 261101_0334 la dona aplicada; la lectura REST no veu /);
  expect(vin,v).toContain("**Estat remot no acreditat**: l'acta 261101_0334 la dona aplicada");
  for(const t of [fila,vin]){expect(t,v).toContain(peca);expect(t,v).toContain('Pas 0');expect(t,v).not.toMatch(/NO aplicada|candidat|no executat/);}
 }
}
/* B4V-T5 · Els paràgrafs corregits a la primera ronda (P2-09, FEDI23 i D-4) i el Lot 6 de la segona: cada un diu el
   text nou, i el vell no hi torna. */
function comprovaParagrafsR10(text){
 const pla=text.replace(/\s+/g,' ');
 expect(pla).toContain("La 2610311900 consta a la taula canònica amb l'estat remot no acreditat (l'acta 261101_0334 la dona aplicada), i la 2611011800, aplicada segons l'acta 261102_1456, sense lectura REST. Fins que el Pas 0 ho acredite, el client no compta amb el filtre del servidor");
 expect(pla).toContain("`migrations/2611032100_connexions_publiques_i_membres.sql` és a producció: l'hi va aplicar el Mestre el 6-11-2026, i la lectura REST del 6-11-2026 troba les dues RPC públiques (200 a anon).");
 expect(pla).toContain("la migració ja és a producció (lectura REST del 6-11-2026), però el desplegament de la funció no s'ha comprovat (D-4)");
 expect(pla).toContain("Transaccional i idempotent. Estat remot no acreditat: l'acta 261101_0334 la dona aplicada (vegeu la taula canònica).");
 expect(pla).not.toMatch(/[Tt]otes dues \*\*NO aplicades|és candidata local, pendent d'aplicació remota|la migració no està aplicada ni la funció desplegada|només candidat; no executat en remot|consta \*\*NO aplicada\*\* a la taula canònica/);
}
describe('Onada R10 · fila i vinyeta diuen el mateix estat, amb la mateixa evidència de la lectura del 6-11',()=>{
 it('les aplicades a producció, la de l’acta i l’admin panel a mitges',()=>comprovaEstatsR10(readme));
 it('mutacions: tornar a «NO aplicada» la vinyeta o la fila, llevar-ne l’evidència o el Mestre, o dir aplicada l’admin panel, cau',()=>{
  const muta=(vell,nou)=>{expect(readme.split(vell).length,vell).toBe(2);return readme.replace(vell,nou);};
  // M12 de R9: la vinyeta de la 2611051930 torna a «NO aplicada» i la fila 76 continua aplicada.
  expect(()=>comprovaEstatsR10(muta('**Aplicada a producció** (lectura REST del 6-11-2026: la taula `note_folders`',"**NO aplicada: l'aplica el Mestre, mai un agent** (lectura REST del 6-11-2026: la taula `note_folders`"))).toThrow();
  expect(()=>comprovaEstatsR10(muta('| Aplicada a producció (lectura REST del 6-11: `politiques_privacitat` té la 2.5',"| **NO aplicada: l'aplica el Mestre** (lectura REST del 6-11: `politiques_privacitat` té la 2.5"))).toThrow();
  expect(()=>comprovaEstatsR10(muta("`les_meues_invitacions_admin` existixen, 401 42501; aplicada pel Mestre el\n  6-11)","`les_meues_invitacions_admin` existixen, 401 42501)"))).toThrow();
  expect(()=>comprovaEstatsR10(muta('| Estat remot no acreditat sencer (lectura REST del 6-11:','| Aplicada a producció (lectura REST del 6-11:'))).toThrow();
  expect(()=>comprovaEstatsR10(muta("**aplicada segons l'acta 261102_1456** (sense","**NO aplicada: l'aplica el Mestre, mai un agent** (sense"))).toThrow();
 });
 it('segona ronda (B4V-T1, T3 i T6): les noves aplicades, les no acreditades, l’admin panel datat i el Pas 0 sense resultat',()=>{
  const muta=(vell,nou)=>{expect(readme.split(vell).length,vell).toBe(2);return readme.replace(vell,nou);};
  // T3 · la fila 71 i la vinyeta 73 tornen a «NO aplicada»; la 63 torna a dir-se «NO aplicada».
  expect(()=>comprovaEstatsR10(muta('| Aplicada a producció (lectura REST del 6-11: la columna `notes.fitxa` respon 200 a anon) |',"| **NO aplicada: l'aplica el Mestre** |"))).toThrow();
  expect(()=>comprovaEstatsR10(muta("**Aplicada a producció** (lectura REST del 6-11-2026: la columna\n  `notes.logo_image_dark`","**NO aplicada en este carril: pendent d'aplicació i verificació remota** (lectura REST del 6-11-2026: la columna\n  `notes.logo_image_dark`"))).toThrow();
  expect(()=>comprovaEstatsR10(muta("| Estat remot no acreditat (l'acta 261101_0334 la dona aplicada; la lectura REST no veu el cos","| **NO aplicada: l'aplica el Mestre** (l'acta 261101_0334 la dona aplicada; la lectura REST no veu el cos"))).toThrow();
  // T1 · tornar a fixar el 404 com a estat present, o dir aplicada l'admin panel.
  expect(()=>comprovaEstatsR10(muta("`admin_list_organizations()` donava 404 PGRST202 a les 22:08 CET i respon 401 42501 a les 23:22 i a les 23:53, sense cap migració nova al repositori","`admin_list_organizations()` no, 404 PGRST202, i cap migració no l'esborra"))).toThrow();
  expect(()=>comprovaEstatsR10(muta('(era el 404\n  de «Calcula els indicadors»','(És el 404\n  de «Calcula els indicadors»'))).toThrow();
  // T6 · la vinyeta torna a dir que el Pas 0 «ho confirma».
  expect(()=>comprovaEstatsR10(muta('ho pot confirmar\n  la columna `te_contracte_federacio_2611011800` del Pas 0, encara sense\n  resultat registrat)','ho confirma la\n  columna `te_contracte_federacio_2611011800` del Pas 0)'))).toThrow();
 });
 it('B4V-T5 · P2-09, FEDI23, D-4 i el Lot 6 diuen el text nou, i el vell hi cau',()=>{
  comprovaParagrafsR10(readme);
  const muta=(vell,nou)=>{expect(readme.split(vell).length,vell).toBe(2);return readme.replace(vell,nou);};
  // MV11, MV12 i MV13 de la crítica, i el Lot 6 vell.
  expect(()=>comprovaParagrafsR10(muta("La 2610311900 consta a la taula canònica amb l'estat remot no acreditat (l'acta 261101_0334 la dona aplicada), i la 2611011800, aplicada segons l'acta 261102_1456, sense lectura REST. Fins que el Pas 0 ho acredite, el client no compta amb el filtre del servidor: les files poden arribar al navegador abans del filtre.","Totes dues **NO aplicades: les aplica el Mestre**; fins aleshores, les files arriben al navegador abans del filtre."))).toThrow();
  expect(()=>comprovaParagrafsR10(muta("és a producció: l'hi va aplicar el Mestre el 6-11-2026, i la lectura REST del 6-11-2026 troba les dues RPC públiques (200 a anon).","és candidata local, pendent d'aplicació remota."))).toThrow();
  expect(()=>comprovaParagrafsR10(muta("la migració ja és\na producció (lectura REST del 6-11-2026), però el desplegament de la funció no s'ha\ncomprovat (D-4)","la migració no\nestà aplicada ni la funció desplegada (D-4)"))).toThrow();
  expect(()=>comprovaParagrafsR10(muta("  Transaccional i idempotent. Estat remot no acreditat: l'acta 261101_0334 la\n  dona aplicada (vegeu la taula canònica).\n","  Transaccional, idempotent, només candidat; no executat en remot.\n"))).toThrow();
 });
});

/* Onada R10 · B4 (VFT-04 i la resta de comentaris) · Cap comentari de src/ ni de scripts/ no pot dir «NO aplicada»
   (ni «encara no s'ha aplicat», ni «fins que s'aplique») en la mateixa frase que el número d'una migració que la
   taula canònica del README dona aplicada. Les aplicades es lligen del README: si una fila canvia, la guarda la seguix.
   Els textos pintats de les pàgines els guarda pageContent.r9.test.js (VFT-03).
   Segona ronda (B4V-T4): també «s'ha d'aplicar», «pendent», «mentre no s'aplique», «sense aplicar» i les formes
   d'altres llengües; i una «migració 76» sense número de versió es traduïx amb la fila de la taula canònica. */
const NEGA_COMENTARI=/\bno aplicad|encara no s['’]han? aplicat|fins que (?:s['’]|l['’])apliqu|pendent d['’]aplicació|s['’]han? d['’]aplicar|\bpendents?\b|mentre no (?:s['’]|l['’])apliqu|sense aplicar|qued(?:a|en|an) per aplicar|\bpendientes?\b|\bpending\b|not (?:yet )?(?:been )?applied|yet to be applied|aplikatu gabe|aplikatzeke|\bpendentes?\b|sen aplicar/i;
const comentarisDe=codi=>[...codi.matchAll(/\/\*[\s\S]*?\*\/|(?:^|[^:'"`\\])\/\/[^\n]*/gm)].map(m=>m[0].replace(/^\s*\*+|\n\s*\*?/gm,' ').replace(/\s+/g,' '));
function negacionsEnComentaris(text,fitxers){
 const taula=[...text.matchAll(/^\| (\d+) \| `(\d{10})` \| `[^`]+\.sql` \| ([^|]+) \| [^|]+ \|$/gm)];
 const aplicades=taula.filter(m=>/^Aplicada/.test(m[3])).map(m=>m[2]);
 const perFila=new Map(taula.map(m=>[Number(m[1]),m[2]]));
 expect(aplicades.length).toBeGreaterThanOrEqual(20);
 const versionsDe=frase=>[...aplicades.filter(v=>frase.includes(v)),...[...frase.matchAll(/\bmigraci(?:ó|o|ons) (\d{1,2})\b/gi)].map(m=>perFila.get(Number(m[1]))).filter(v=>aplicades.includes(v))];
 const troballes=[];
 for(const [rel,codi] of fitxers)for(const c of comentarisDe(codi))for(const frase of c.split(/(?<=[.!?])\s+/))
  if(versionsDe(frase).length&&NEGA_COMENTARI.test(frase))troballes.push(`${rel}: ${frase.slice(0,160)}`);
 return troballes;
}
const fontsDe=dir=>readdirSync(arrel+dir,{recursive:true}).map(String).filter(f=>/\.(?:js|jsx|mjs)$/.test(f)&&!/\.test\./.test(f)).map(f=>[`${dir}/${f}`,readFileSync(`${arrel}${dir}/${f}`,'utf8')]);
describe('Onada R10 · cap comentari no nega una migració que el README dona aplicada',()=>{
 const fonts=[...fontsDe('src'),...fontsDe('scripts')];
 it('src/ i scripts/ en net',()=>expect(negacionsEnComentaris(readme,fonts)).toEqual([]));
 it('mutacions: els comentaris vells de contracte.js i d’alertesMunicipals.js cauen; un node sense la migració, no',()=>{
  const vell=['src/data/contracte.js','/* Ho servixen xat_push_desa i\n     xat_push_retira de 2611020417_xat_avisos_push.sql (B8-SERVIDOR; NO\n     aplicada: l\'aplica el Mestre). */'];
  expect(negacionsEnComentaris(readme,[vell])).toHaveLength(1);
  expect(negacionsEnComentaris(readme,[['src/sections/mur/alertesMunicipals.js','/**\n *  261101, migració 2611011500, NO aplicada fins que l\'aplique el Mestre):\n */']])).toHaveLength(1);
  expect(negacionsEnComentaris(readme,[['x.js','// L\'edició es queda al navegador fins que s\'aplique 2611051930.']])).toHaveLength(1);
  expect(negacionsEnComentaris(readme,[['x.js','/* un node sense la migració 2611020417 respon 404 o PGRST202 */']])).toEqual([]);
  expect(negacionsEnComentaris(readme,[['src/sections/connectar/useSeguiment.js',"/* El servidor encara no té l'esquema (2610241430_seguiments.sql, NO aplicada): com sense la capacitat. */"]])).toHaveLength(1);
  // Una fila tornada a «NO aplicada» deixa de protegir-la: la guarda llig el README.
  const senseFila=readme.replace(/^\| 70 \| `2611020417` \| `2611020417_xat_avisos_push\.sql` \| Aplicada[^|]*\|/m,"| 70 | `2611020417` | `2611020417_xat_avisos_push.sql` | **NO aplicada: l'aplica el Mestre** |");
  expect(negacionsEnComentaris(senseFila,[vell])).toEqual([]);
 });
 it('B4V-T4 · les negacions naturals (MV6 i MV7 de la crítica) i la «migració NN» sense versió cauen; un node hipotètic, no',()=>{
  for(const c of [
   "/* D-P016 · S'encén a src/config/connexionsPubliques.js mentre no s'aplique la 2611032100 a producció. */", // MV6
   "/* Torna el cos quan la taula no existix (la migració 76 encara no s'ha aplicat). */",                        // MV7: fila 76 = 2611051930
   "// La política 2.5 (2611061520) encara s'ha d'aplicar.",
   '// La 2611032100 està pendent.',
   '// Migration 2611052345 is still pending.',
   '// 2611060010 migrazioa aplikatu gabe dago.',
   '// A migración 2611061520 está pendente de aplicar.',
   '// La migración 2611032100 sigue pendiente.',
   '/* Les RPC de la migració 74 queden per aplicar. */',
   '// Migration 2611031500 has not been applied yet.'
  ])expect(negacionsEnComentaris(readme,[['x.js',c]]),c).toHaveLength(1);
  for(const c of [
   "/* Un node sense la migració 76 (2611051930) respon PGRST205: com sense la capacitat. */",
   '// La migració 07 no és aplicada sencera.',                     // la 2609121600 no consta «Aplicada»
   '// Les sol·licituds pendents es lligen amb la seua RPC.',      // cap migració a la frase
   '// Fa 76 migracions que no canvia el contracte pendent.'        // «76 migracions» no és «migració 76»
  ])expect(negacionsEnComentaris(readme,[['x.js',c]]),c).toEqual([]);
 });
});
