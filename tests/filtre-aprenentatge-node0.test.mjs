import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { IDS, RUTA_BASELINE, TOTAL_BASELINE, PRESSUPOSTOS_MS, validaRegles, validaBaseline, carregaBaseline, avaluaRegressions, avaluaPressupost, analitzaFonts, capcaleresSQL, executaFiltre, lligFonts, lligFontsParalel, contextCache, main } from '../tooling/gates/filtre-aprenentatge-node0.mjs';
import { generaCandidats } from '../tooling/gates/compila-filtre-aprenentatge-node0.mjs';
import { createHash } from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const regles = JSON.parse(fs.readFileSync(path.join(ROOT, 'tooling/gates/filtre-aprenentatge-node0.regles.json'), 'utf8'));
const baseline = carregaBaseline(ROOT);
const font = (text, fitxer = 'src/apps/prova/Prova.jsx') => ({ fitxer, text });
const run = fonts => analitzaFonts(fonts, { regles });
const errors = (fonts, id) => run(fonts).troballes.filter(t => t.id === id);

test('catàleg versionat amb les dotze regles exactes i FN0-012 atribuïda', () => {
  assert.equal(validaRegles(regles), regles);
  assert.equal(regles.regles_preventives.length, 12);
  assert.match(regles.regles_preventives.at(-1).origen, /IDEA-353/);
  for (const data of [null, {}, { ...regles, regles_preventives: regles.regles_preventives.slice(1) }, { ...regles, regles_preventives: [...regles.regles_preventives.slice(1), regles.regles_preventives[1]] }]) assert.throws(() => validaRegles(data));
});

test('FN0-001 · protegeix externs i calculats; admet rutes locals i download', () => {
  assert.equal(errors([font('export default () => <><a href="https://example.test" target="_blank" rel="noreferrer noopener">Font</a><a href="/notes">Notes</a><a href={url} download>Fitxer</a></>;')], 'FN0-001').length, 0);
  assert.equal(errors([font('export default () => <a {...props} href={url} target="_blank" rel="noopener noreferrer">Font</a>;')], 'FN0-001').length, 0);
  for (const text of ['<a href="https://example.test">Font</a>', '<a href={url}>Font</a>', '<a href="//example.test">Font</a>', '<a href="https://example.test" target="_blank" rel="noopener">Font</a>', '<a href={url} target="_blank" rel="noopener noreferrer" {...props}>Font</a>']) assert.equal(errors([font(`export default () => ${text};`)], 'FN0-001').length, 1);
});

test('FN0-001 · un comentari amb target no protegeix un enllaç', () => {
  assert.equal(errors([font('/* target="_blank" rel="noopener noreferrer" */ export default () => <a href="https://example.test">Font</a>;')], 'FN0-001').length, 1);
});

test('FN0-002 · jerarquia germana i excepció lead comprovables', () => {
  assert.equal(errors([font('export default () => <section><h2>Obertura</h2><p className="lead">Entrada</p><h3>Títol</h3><p>Text</p><h4>Detall</h4></section>;')], 'FN0-002').length, 0);
  for (const jsx of ['<section><h3 className="h2">Títol</h3></section>', '<section><h2>Títol</h2><p>Text</p></section>', '<section><h3>Títol</h3><h5>Detall</h5></section>', '<section><h3>QUATRE PARAULES TOTES EN MAJUSCULES</h3></section>']) assert.ok(errors([font(`export default () => ${jsx};`)], 'FN0-002').length > 0);
});

test('FN0-003 · detecta redirecció literal i ruta avis; una confirmació integrada passa', () => {
  assert.equal(errors([font('export default () => <button onClick={accepta}>{tx.accepta}</button>;')], 'FN0-003').length, 0);
  for (const jsx of ['<Navigate to="/app/salut/avis" />', '<Navigate to={ruta("avis")} replace />']) assert.equal(errors([font(`export default () => ${jsx};`)], 'FN0-003').length, 1);
});

test('FN0-004 · CSS lèxic no confon comentaris ni cadenes amb declaracions', () => {
  assert.equal(errors([font('/* h3 { margin-top:0 } */ h3 { margin-top:32px; content:"margin-top:0"; }', 'src/css/prova.css')], 'FN0-004').length, 0);
  assert.equal(errors([font('section + h3 { margin-top:0; }', 'src/css/prova.css')], 'FN0-004').length, 1);
});

test('FN0-005 · widgets i marques canòniques, detecta HTML cru', () => {
  assert.equal(errors([font('export default () => <Alerta>{tx.avis}</Alerta>;')], 'FN0-005').length, 0);
  assert.equal(errors([font('export default () => <section className="sdp-xat-construccio"><h3>Avís</h3><p>Text</p></section>;')], 'FN0-005').length, 1);
  assert.equal(errors([font('export default () => <UniversalPage showLogos={false} />;', 'src/sections/calendari/CalendariSection.jsx')], 'FN0-005').length, 1);
});

test('FN0-006 · defaults booleans i vista destacats amb port real declarat', () => {
  assert.equal(errors([font('export default {interruptors:[{id:"a",actiuPerDefecte:true}]};', 'src/apps/prova/manifest.js')], 'FN0-006').length, 0);
  assert.equal(errors([font('export default {interruptors:[{id:"a"},{id:"b",actiuPerDefecte:"true"}]};', 'src/apps/prova/manifest.js')], 'FN0-006').length, 2);
  assert.equal(errors([font('export const VISTES_EN_CONSTRUCCIO=Object.freeze({destacats:{}});','src/sections/xat/components/vistaEnConstruccioModel.js'), font('export const carregaAccionsMissatges = port.carregaAccionsMissatges;', 'src/data/backendPort.js')], 'FN0-006').length, 1);
});

test('FN0-007 · fallback importat resolt o input amb magatzem, sense afirmar prova iPad', () => {
  const caller = 'export async function obri(){return window.showDirectoryPicker();}';
  assert.equal(errors([font(caller)], 'FN0-007').length, 1);
  assert.equal(errors([font(caller+'\n// fontArxiusOpfs indexedDB input file')], 'FN0-007').length, 1);
  assert.equal(errors([font(caller+'\nimport { obriFont } from "./fontArxiusOpfs.js";'), font('export const obriFont=()=>{};', 'src/apps/prova/fontArxiusOpfs.js')], 'FN0-007').length, 0);
  assert.equal(errors([font(caller+'\nexport function fallback(){ const i=document.createElement("input"); i.type="file"; return indexedDB.open("x"); }')], 'FN0-007').length, 0);
  assert.match(run([font(caller)]).pendent.find(p => p.id === 'FN0-007').detall, /iPad/);
});

test('FN0-008 · claus literals simètriques i atributs traduïts', () => {
  const langs = LL => `export const TEXTOS={${LL.map(l => `${l}:{nom:"text"}`).join(',')}};`;
  assert.equal(errors([font(langs(['ca','es','en','eu','gl']))], 'FN0-008').length, 0);
  assert.equal(errors([font(langs(['ca','es','en','eu']))], 'FN0-008').length, 1);
  assert.equal(errors([font('export const TEXTOS={ca:{a:1},es:{b:1},en:{a:1},eu:{a:1},gl:{a:1}};')], 'FN0-008').length, 1);
  assert.equal(errors([font('export default () => <input placeholder="Nom" aria-label={tx.nom} />;')], 'FN0-008').length, 1);
  assert.equal(errors([font('export default () => <span title="Desa">…</span>;')], 'FN0-008').length, 1);
  assert.equal(errors([font('export default () => <button aria-label="+" onClick={afig}>+</button>;')], 'FN0-008').length, 0);
  const r = analitzaFonts([font('export const TEXT="promesa irreal";')], {regles,lexic:[{id:'LEX-X',patro:'promesa irreal'}]});
  assert.equal(r.troballes[0].codi, 'LEX-X');
});

test('FN0-009 · absència de build és INCOMPLET, no zero bytes inventats', () => {
  assert.equal(run([]).resultats.find(r => r.id === 'FN0-009').estat, 'INCOMPLET');
  assert.equal(errors([font('x'.repeat(1_589_500), 'dist-wp/soc-de-poble.standalone.js')], 'FN0-009').length, 1);
  assert.equal(run([]).valid, false);
});

test('FN0-010 · SECURITY DEFINER ha de fixar search_path fora de cos/comentaris', () => {
  const sql = header => `CREATE OR REPLACE FUNCTION public.f() RETURNS void LANGUAGE plpgsql ${header} AS $func$ BEGIN PERFORM 1; END; $func$;`;
  assert.equal(errors([font(sql("SECURITY DEFINER SET search_path = ''"), 'supabase/migrations/prova.sql')], 'FN0-010').length, 0);
  for (const head of ['SECURITY DEFINER', "SECURITY DEFINER /* SET search_path = '' */", "SECURITY DEFINER SET search_path='public'"]) assert.equal(errors([font(sql(head), 'supabase/migrations/prova.sql')], 'FN0-010').length, 1);
  const fake = "CREATE FUNCTION public.f() RETURNS text SECURITY DEFINER LANGUAGE sql AS $$ SELECT 'SET search_path = '''''; $$;";
  assert.equal(errors([font(fake, 'supabase/migrations/prova.sql')], 'FN0-010').length, 1);
  assert.equal(capcaleresSQL('/* a /* b */ c */ SELECT $$ a;b $$; SELECT 2;').length, 2);
  assert.throws(() => capcaleresSQL('SELECT $$ sense tancar;'));
});

test('FN0-011 · només crides executables, detecta inline i configuració Ollama regressiva', () => {
  assert.equal(errors([font('export const ex="node -e text";')], 'FN0-011').length, 0);
  for (const text of ['execFileSync("node",["-e","text"]);', 'exec("python3 -c text");', 'fetch("http://node0/api/generate",{stream:false,options:{num_ctx:8192}});']) assert.ok(errors([font(text, 'tooling/prova.mjs')], 'FN0-011').length > 0);
  assert.equal(errors([font('fetch("http://node0/api/generate",{stream:true,options:{num_ctx:4096}});', 'tooling/prova.mjs')], 'FN0-011').length, 0);
});

test('FN0-012 · detecta escapes CSS i exclou comentaris/cadenes', () => {
  assert.equal(errors([font('/* h3 {clear:both} */ h3 {content:"clear:both"; overflow:hidden; overflow-wrap:break-word;}', 'src/css/prova.css')], 'FN0-012').length, 0);
  for (const css of ['h3 { clear:both; }', 'h3 { cl\\65 ar:left; }', 'h2,h4 { clear:right !important; }']) assert.equal(errors([font(css, 'src/css/prova.css')], 'FN0-012').length, 1);
});

test('[DEFECTE] · un únic positiu no amaga altres defectes ni els límits globals', () => {
  const r = run([font('export default () => <section><a href="https://example.test">Font</a><h3 className="h2">Títol</h3></section>;')]);
  assert.deepEqual(r.resultats.map(r => r.id), IDS);
  assert.equal(r.resultats[0].estat, 'FAIL');
  assert.equal(r.resultats[1].estat, 'FAIL');
  assert.equal(r.estatComplet, 'INCOMPLET');
  assert.equal(r.senseIA, true); assert.equal(r.xarxa, false);
});

test('entrada malformada falla tancada, amb fitxer:línia i inventari determinista', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'sdp-filtre-test-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'src'),{recursive:true});
  fs.mkdirSync(path.join(root,'.agents'),{recursive:true});
  fs.mkdirSync(path.join(root,'tooling/gates'),{recursive:true});
  fs.writeFileSync(path.join(root,'tooling/gates/filtre-aprenentatge-node0.regles.json'),JSON.stringify(regles));
  fs.copyFileSync(path.join(ROOT,RUTA_BASELINE),path.join(root,RUTA_BASELINE));
  fs.writeFileSync(path.join(root,'.agents/coherencia-editorial-mapa.json'),JSON.stringify({lexicProhibit:[{id:'LEX',patro:'terme vetat'}]}));
  fs.writeFileSync(path.join(root,'src/a.jsx'),'export default () => <a href="https://example.test";');
  const r=await executaFiltre({arrel:root});
  assert.equal(r.validEstatics,false); assert.equal(r.troballes[0].codi,'JS_NO_ANALITZABLE');
  assert.equal(r.troballes[0].fitxer,'src/a.jsx'); assert.equal(r.troballes[0].linia,1);
  assert.ok(r.duradaMs>=0); assert.equal(r.pressupostMs,8000); assert.equal(r.modeRendiment,'scan_fred');
  assert.deepEqual(await lligFontsParalel(root),lligFonts(root));
  fs.symlinkSync(path.join(root,'src/a.jsx'),path.join(root,'src/b.jsx'));
  assert.throws(()=>lligFonts(root),/symlink/);
  await assert.rejects(()=>lligFontsParalel(root),/symlink/);
});

test('CLI rebutja flags desconeguts i no inventa exit 0 global', async () => {
  const output=[]; const io={out:s=>output.push(s),err:s=>output.push(s)};
  assert.equal(await main(['--desactiva-seguretat'],io),2);
  assert.match(output.join('\n'),/Opció desconeguda/);
});

test('cache conserva diagnòstic i reanalitza cada font canviada; el context invalida dependències', () => {
  const fonts=[font('export default () => <a href="https://example.test">Font</a>;')];
  const recullCache=Object.create(null), abans=analitzaFonts(fonts,{regles,recullCache});
  const calent=analitzaFonts(fonts,{regles,cache:recullCache});
  assert.equal(calent.hitsCache,1); assert.deepEqual(calent.troballes,abans.troballes);
  const reparada=[font('export default () => <a href="https://example.test" target="_blank" rel="noopener noreferrer">Font</a>;')];
  const despres=analitzaFonts(reparada,{regles,cache:recullCache});
  assert.equal(despres.hitsCache,0); assert.equal(despres.troballes.length,0);
  assert.notEqual(contextCache(fonts,regles,[]),contextCache([...fonts,font('export const carregaAccionsMissatges=1;','src/data/backendPort.js')],regles,[]));
  assert.notEqual(contextCache(fonts,regles,[]),contextCache([...fonts,font('export const obri=1;','src/apps/prova/fontArxiusOpfs.js')],regles,[]));
});

test('cache manipulada no es reutilitza, encara que continga un resultat PASS', async t => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-filtre-tamper-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'tooling/gates'),{recursive:true}); fs.mkdirSync(path.join(root,'.agents'));
  fs.writeFileSync(path.join(root,'tooling/gates/filtre-aprenentatge-node0.regles.json'),JSON.stringify(regles));
  fs.copyFileSync(path.join(ROOT,RUTA_BASELINE),path.join(root,RUTA_BASELINE));
  fs.writeFileSync(path.join(root,'.agents/coherencia-editorial-mapa.json'),JSON.stringify({lexicProhibit:[{id:'LEX',patro:'terme vetat'}]}));
  fs.writeFileSync(path.join(root,'tooling/gates/filtre-aprenentatge-node0.cache.json'),JSON.stringify({schema:'sdp.node0.filtre.cache.v1',fitxers:{},valid:true}));
  await assert.rejects(()=>executaFiltre({arrel:root}),/cache alterada/);
});

function fixtureCompilador(t) {
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-filtre-compila-'))), root=path.join(base,'repo');
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'tooling/gates'),{recursive:true}); fs.mkdirSync(path.join(root,'tooling/lib')); fs.mkdirSync(path.join(root,'.agents')); fs.mkdirSync(path.join(root,'src'));
  // v1.2.25 · K-FILTRE · El motor importa ara CAMINS i esMain de tooling/lib/arrel.mjs: la còpia del motor el necessita al costat.
  for(const rel of ['tooling/gates/filtre-aprenentatge-node0.mjs','tooling/gates/filtre-aprenentatge-node0.regles.json',RUTA_BASELINE,'tooling/lib/lexic-css.mjs','tooling/lib/arrel.mjs']) fs.copyFileSync(path.join(ROOT,rel),path.join(root,rel));
  fs.writeFileSync(path.join(root,'.agents/coherencia-editorial-mapa.json'),JSON.stringify({lexicProhibit:[{id:'LEX',patro:'terme vetat'}]}));
  fs.writeFileSync(path.join(root,'src/prova.jsx'),'export default () => <a href="https://example.test">Font</a>;');
  fs.symlinkSync(path.join(ROOT,'node_modules'),path.join(root,'node_modules'));
  return {base,root,sortida:path.join(base,'candidats')};
}

test('compilador CLI genera candidats reproduïbles i el seu motor valida el pin sense mutar fonts', t => {
  const {base,root,sortida}=fixtureCompilador(t), cli=path.join(ROOT,'tooling/gates/compila-filtre-aprenentatge-node0.mjs');
  const original=fs.readFileSync(path.join(root,'tooling/gates/filtre-aprenentatge-node0.mjs'));
  const m=JSON.parse(execFileSync(process.execPath,[cli,'--arrel',root,'--sortida',sortida],{encoding:'utf8',timeout:15000}));
  assert.equal(m.fontMutations,0);assert.equal(m.snapshotAtomic,false);assert.equal(m.diagnostic.certificaProduccio,false);
  assert.deepEqual(fs.readFileSync(path.join(root,'tooling/gates/filtre-aprenentatge-node0.mjs')),original);
  assert.equal(fs.existsSync(path.join(root,'tooling/gates/filtre-aprenentatge-node0.cache.json')),false);
  const m2=JSON.parse(execFileSync(process.execPath,[cli,'--arrel',root,'--sortida',path.join(base,'candidats2')],{encoding:'utf8',timeout:15000}));
  assert.equal(m.fontSnapshotSha256,m2.fontSnapshotSha256);
  for(const c of m.candidats){
    const bytes=fs.readFileSync(path.join(sortida,c.fitxer));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),c.sha256);
    // Simula la costura CAS en fixture; el compilador mai no l'aplica.
    fs.copyFileSync(path.join(sortida,c.fitxer),path.join(root,c.ruta));
  }
  const result=spawnSync(process.execPath,[path.join(root,'tooling/gates/filtre-aprenentatge-node0.mjs'),'--sense-ia','--arrel',root,'--json'],{encoding:'utf8',timeout:15000});
  assert.equal(result.status,1); const r=JSON.parse(result.stdout);assert.equal(r.cache,'VERIFICADA');assert.equal(r.troballes.some(x=>x.id==='FN0-001'),true);
  assert.ok(r.hitsCache>0);
  assert.equal(spawnSync(process.execPath,[cli,'--sortida',path.join(base,'sensearrel')],{encoding:'utf8'}).status,2);
  assert.equal(spawnSync(process.execPath,[cli,'--arrel',root,'--sortida',sortida],{encoding:'utf8'}).status,2);
});

test('compilador refusa deriva de motor i fonts canviades durant la compilació sense escriure candidats', async t => {
  const {root,sortida}=fixtureCompilador(t);
  await assert.rejects(()=>generaCandidats({arrel:root,sortida,abansDeVerificar:()=>fs.appendFileSync(path.join(root,'src/prova.jsx'),'\n// canvi concurrent')}),/font alterada durant/);
  assert.equal(fs.existsSync(sortida),false);
  fs.appendFileSync(path.join(root,'tooling/gates/filtre-aprenentatge-node0.mjs'),'\n// motor diferent\n');
  await assert.rejects(()=>generaCandidats({arrel:root,sortida}),/motor del destí no coincidix/);
  assert.equal(fs.existsSync(sortida),false);
  await assert.rejects(()=>generaCandidats({arrel:root,sortida:path.join(root,'sortida')}),/fora de les fonts/);
});

test('C6 · els 234 testimonis històrics continuen íntegres i amb origen verificable', () => {
  assert.equal(validaBaseline(baseline),baseline);
  assert.equal(baseline.total,234);assert.equal(baseline.troballes.length,234);
  assert.equal(baseline.origen.cacheSha256,'649d27e81492c2562b31769e05514d54c57fc36bfaf2757923801a24a44da840');
  assert.equal(TOTAL_BASELINE,234);
  assert.throws(()=>validaBaseline({...baseline,troballes:baseline.troballes.slice(1)}),/234/);
});

test('C6 · increments i substitucions amb recompte igual són regressions, una retirada queda resolta', () => {
  const actuals=baseline.troballes.map(t=>({...t}));
  assert.equal(avaluaRegressions(actuals,baseline).valid,true);
  const afegida=avaluaRegressions([...actuals,{...actuals[0]}],baseline);
  assert.equal(afegida.noves.length,1);assert.equal(afegida.valid,false);assert.equal(afegida.totalBaseline,234);assert.equal(afegida.totalActual,235);
  const substituida=avaluaRegressions([{...actuals[0],ancla_sha256:'f'.repeat(64)},...actuals.slice(1)],baseline);
  assert.equal(substituida.noves.length,1);assert.equal(substituida.resoltes.length,1);assert.equal(substituida.valid,false);
  const resolta=avaluaRegressions(actuals.slice(1),baseline);
  assert.equal(resolta.noves.length,0);assert.equal(resolta.resoltes.length,1);assert.equal(resolta.valid,true);assert.equal(resolta.totalBaseline,234);assert.equal(resolta.totalActual,233);
});

/* v1.2.25 · K-FILTRE (CDX-37, GN01) · Motiu del canvi: la prova llegia els fitxers reals de la baseline
   (src/apps/genealogia/AppGenealogia.jsx, src/css/base.css i una migració) i queia quan un kit canviava eixos
   fitxers (G2), encara que el motor fera bé la seua faena. Ara usa una fixture pròpia (JSX, CSS i SQL) i conserva
   la força: la troballa de la fixture ocupa el lloc de la primera de la baseline per al mateix id (234 testimonis i
   el mateix origen), el desplaçament no és ni nova ni resolta, i una àncora canviada sí que és una regressió nova. */
const FIXTURE_DESPLACAMENT = [
  { id: 'FN0-003', nom: 'RedireccioAvis.jsx', fitxer: 'src/apps/prova/RedireccioAvis.jsx', codi: 'REDIRECCIO_AVIS', de: '/app/prova/avis', a: '/app/altra/avis' },
  { id: 'FN0-004', nom: 'titols.css', fitxer: 'src/css/prova-desplacament.css', codi: 'H3_MARGE_ZERO', de: 'section + h3', a: 'aside + h3' },
  { id: 'FN0-010', nom: 'funcio-definer.sql', fitxer: 'supabase/migrations/prova_desplacament.sql', codi: 'DEFINER_SEARCH_PATH', de: 'fixture_fn0_desplacament', a: 'fixture_fn0_canviada' }
];
test('C6 · un desplaçament real de línies en AST/CSS/SQL no és una regressió nova', () => {
  for(const {id,nom,fitxer,codi,de,a} of FIXTURE_DESPLACAMENT) {
    const text=fs.readFileSync(path.join(ROOT,'tests/fixtures/filtre-fn0-desplacament',nom),'utf8');
    const originals=analitzaFonts([font(text,fitxer)],{regles}).troballes.filter(t=>t.id===id);
    assert.equal(originals.length,1,fitxer);assert.equal(originals[0].codi,codi,fitxer);
    const antic={...originals[0],font_sha256:createHash('sha256').update(text).digest('hex')};
    const substituida=baseline.troballes.find(t=>t.id===id);
    const baselineFixture={...baseline,troballes:baseline.troballes.map(t=>t===substituida?antic:t)};
    assert.equal(validaBaseline(baselineFixture),baselineFixture);
    const prefix=fitxer.endsWith('.sql')?'-- Comentari nou\n\n': '/* Comentari nou */\n\n';
    const result=analitzaFonts([font(prefix+text,fitxer)],{regles});
    const trobat=result.troballes.find(t=>t.id===antic.id&&t.codi===antic.codi&&t.ancla_sha256===antic.ancla_sha256);
    assert.ok(trobat,fitxer);assert.notEqual(trobat.linia,antic.linia);assert.equal(trobat.linia,antic.linia+2,fitxer);
    const resta=baselineFixture.troballes.filter(t=>t!==antic);
    const comparacio=avaluaRegressions([...resta,trobat],baselineFixture);
    assert.equal(comparacio.valid,true);assert.equal(comparacio.noves.length,0);assert.equal(comparacio.resoltes.length,0);
    assert.ok(text.includes(de),fitxer);
    const canviada=analitzaFonts([font(text.replace(de,a),fitxer)],{regles}).troballes.find(t=>t.id===id&&t.codi===codi);
    assert.ok(canviada,fitxer);assert.notEqual(canviada.ancla_sha256,antic.ancla_sha256);
    const regressio=avaluaRegressions([...resta,canviada],baselineFixture);
    assert.equal(regressio.valid,false);assert.equal(regressio.noves.length,1);assert.equal(regressio.resoltes.length,1);
  }
});

test('C6 · pressupostos oficials inclusius, qualsevol miss obliga al mode fred', () => {
  assert.deepEqual(PRESSUPOSTOS_MS,{scan_fred_ms:8000,cache_sha256_ms:450});
  const warm=ms=>avaluaPressupost({duradaMs:ms,cache:'VERIFICADA',hitsCache:10,fitxers:10});
  assert.equal(warm(450).pressupostComplert,true);assert.equal(warm(450.000001).pressupostComplert,false);
  assert.equal(warm(450).modeRendiment,'cache_sha256');assert.equal(warm(450).mesuresMs.scan_fred_ms,null);
  for(const cache of ['ABSENT','INVALIDADA']) {
    const fred=avaluaPressupost({duradaMs:8000,cache,hitsCache:10,fitxers:10});
    assert.equal(fred.modeRendiment,'scan_fred');assert.equal(fred.pressupostComplert,true);assert.equal(fred.mesuresMs.cache_sha256_ms,null);
  }
  assert.equal(avaluaPressupost({duradaMs:451,cache:'VERIFICADA',hitsCache:9,fitxers:10}).modeRendiment,'scan_fred');
  assert.equal(avaluaPressupost({duradaMs:8000.000001,cache:'VERIFICADA',hitsCache:9,fitxers:10}).pressupostComplert,false);
  assert.throws(()=>avaluaPressupost({duradaMs:-1,cache:'VERIFICADA',hitsCache:10,fitxers:10}));
});

test('C6 · baseline alterat o truncat falla tancat i queda fora de l’inventari analitzat', async t => {
  const {root}=fixtureCompilador(t);
  assert.equal((await lligFontsParalel(root)).some(f=>f.fitxer===RUTA_BASELINE),false);
  assert.equal(carregaBaseline(root).troballes.length,234);
  const altered={...baseline,troballes:baseline.troballes.map((f,i)=>i===0?{...f,linia:f.linia+1}:f)};
  fs.writeFileSync(path.join(root,RUTA_BASELINE),JSON.stringify(altered));
  await assert.rejects(()=>executaFiltre({arrel:root}),/baseline alterat/);
  fs.writeFileSync(path.join(root,RUTA_BASELINE),JSON.stringify({...baseline,troballes:baseline.troballes.slice(1)}));
  await assert.rejects(()=>executaFiltre({arrel:root}),/baseline alterat o truncat/);
});

test('C6 · regressions, estàtica i salut global es mantenen separades', () => {
  const r=analitzaFonts([],{regles,baseline});
  assert.equal(r.validRegressions,true);assert.equal(r.validEstatics,true);assert.equal(r.valid,false);
  assert.equal(r.baseline.troballes.length,234);assert.equal(r.baseline.total,234);
  assert.equal(r.regressions.resoltes.length,234);assert.equal(r.estatComplet,'INCOMPLET');
  assert.equal(r.resultats.find(f=>f.id==='FN0-009').estat,'INCOMPLET');assert.equal(r.remoteVerified,false);assert.equal(r.certificaProduccio,false);
});

test('C6 · no seguix roots inicials ni components intermedis simbòlics', async t => {
  for(const rel of ['src','tooling','scripts','supabase/migrations','_wiki_de_poble/01_ser']) {
    const {base,root}=fixtureCompilador(t),abs=path.join(root,rel),extern=path.join(base,'extern');
    fs.mkdirSync(extern);fs.writeFileSync(path.join(extern,'public.js'),'export const dadesExternes=1;');
    fs.mkdirSync(path.dirname(abs),{recursive:true});
    if(fs.existsSync(abs))fs.renameSync(abs,path.join(base,'anterior'));
    fs.symlinkSync(extern,abs);
    assert.throws(()=>lligFonts(root),/symlink/);
    await assert.rejects(()=>lligFontsParalel(root),/symlink/);
    await assert.rejects(()=>executaFiltre({arrel:root}),/symlink/);
  }
});

test('C6 · no seguix pares o leafs simbòlics de configs/cache/baseline ni dist', async t => {
  for(const rel of ['.agents','tooling/gates','tooling/gates/filtre-aprenentatge-node0.regles.json',RUTA_BASELINE,'tooling/gates/filtre-aprenentatge-node0.cache.json','dist-wp','dist-standalone']) {
    const {base,root}=fixtureCompilador(t),abs=path.join(root,rel),extern=path.join(base,'extern');
    fs.mkdirSync(path.dirname(abs),{recursive:true});
    if(fs.existsSync(abs)) {fs.renameSync(abs,extern);fs.symlinkSync(extern,abs);}
    else if(rel.endsWith('.json')) {fs.writeFileSync(extern,'{}');fs.symlinkSync(extern,abs);}
    else {fs.mkdirSync(extern);fs.writeFileSync(path.join(extern,'soc-de-poble.standalone.js'),'export{};');fs.symlinkSync(extern,abs);}
    await assert.rejects(()=>executaFiltre({arrel:root}),/symlink/);
  }
  const {base,root}=fixtureCompilador(t),outside=path.join(base,'regles.json');
  fs.writeFileSync(outside,JSON.stringify(regles));
  await assert.rejects(()=>executaFiltre({arrel:root,reglesPath:outside}),/fora de l’arrel/);
});

test('C6 · canviar el lexer CSS invalida tot el cache i executa el detector actual', t => {
  const {root,sortida}=fixtureCompilador(t),cli=path.join(ROOT,'tooling/gates/compila-filtre-aprenentatge-node0.mjs');
  fs.writeFileSync(path.join(root,'src/prova.jsx'),'export const correcte=true;');
  fs.mkdirSync(path.join(root,'src/css'));fs.writeFileSync(path.join(root,'src/css/prova.css'),'h3 {clear:none;}');
  const m=JSON.parse(execFileSync(process.execPath,[cli,'--arrel',root,'--sortida',sortida],{encoding:'utf8',timeout:15000}));
  for(const c of m.candidats)fs.copyFileSync(path.join(sortida,c.fitxer),path.join(root,c.ruta));
  const gate=path.join(root,'tooling/gates/filtre-aprenentatge-node0.mjs');
  const before=spawnSync(process.execPath,[gate,'--arrel',root,'--sense-ia','--json'],{encoding:'utf8',timeout:15000});
  assert.equal(before.status,0);assert.equal(JSON.parse(before.stdout).modeRendiment,'cache_sha256');
  const lexer=path.join(root,'tooling/lib/lexic-css.mjs'),old=fs.readFileSync(lexer,'utf8');
  assert.ok(old.includes('return out;'));
  fs.writeFileSync(lexer,old.replace('return out;',"return out + '\\nh3{clear:both;}';"));
  const after=spawnSync(process.execPath,[gate,'--arrel',root,'--sense-ia','--json'],{encoding:'utf8',timeout:15000});
  assert.equal(after.status,1);const r=JSON.parse(after.stdout);
  assert.equal(r.cache,'INVALIDADA');assert.equal(r.modeRendiment,'scan_fred');assert.equal(r.hitsCache,0);
  assert.equal(r.regressions.noves.some(f=>f.id==='FN0-012'),true);
});

function variantsEntradaCLI(t) {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sdp-c13-cli-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const root = fs.realpathSync(ROOT);
  const parentAlias = path.join(temporary, 'repo-alias');
  fs.symlinkSync(root, parentAlias, 'dir');
  const variants = [];
  for (const name of ['filtre-aprenentatge-node0.mjs', 'compila-filtre-aprenentatge-node0.mjs']) {
    const relative = path.join('tooling/gates', name);
    const physical = path.join(root, relative);
    const directAlias = path.join(temporary, `alias-${name}`);
    fs.symlinkSync(physical, directAlias, 'file');
    variants.push({ name, kind: 'physical', file: physical },
      { name, kind: 'parent-alias', file: path.join(parentAlias, relative) },
      { name, kind: 'direct-file-alias', file: directAlias });
    if (root.startsWith('/private/tmp/')) {
      variants.push({ name, kind: 'system-tmp-alias', file: path.join(root.replace('/private/tmp/', '/tmp/'), relative) });
    }
  }
  return { temporary, variants };
}

test('C13 · CLI malformed arguments fail visibly through physical and symlink identities', t => {
  const { temporary, variants } = variantsEntradaCLI(t);
  for (const variant of variants) {
    for (const args of [['--unknown', 'value'], ['--arrel']]) {
      const child = spawnSync(process.execPath, [variant.file, ...args], {
        cwd: temporary, encoding: 'utf8', timeout: 15_000
      });
      assert.equal(child.status, 2, `${variant.name}/${variant.kind}: ${child.stderr}`);
      assert.equal(child.signal, null);
      assert.equal(child.error, undefined);
      assert.match(child.stderr, /desconeguda|Falta valor|FN0_COMPILA/);
      assert.equal(child.stdout, '');
    }
  }
  assert.equal(fs.existsSync(path.join(temporary, 'tooling')), false);
});

test('C13 · CLI help is visible and successful through every supported identity', t => {
  const { temporary, variants } = variantsEntradaCLI(t);
  for (const variant of variants) {
    const child = spawnSync(process.execPath, [variant.file, '--help'], {
      cwd: temporary, encoding: 'utf8', timeout: 15_000
    });
    assert.equal(child.status, 0, `${variant.name}/${variant.kind}: ${child.stderr}`);
    assert.equal(child.signal, null);
    assert.equal(child.error, undefined);
    assert.match(child.stdout, /^Ús:/);
    assert.equal(child.stderr, '');
  }
});

test('C13 · importing either CLI through aliases has no main or filesystem effects', t => {
  const { temporary, variants } = variantsEntradaCLI(t);
  for (const [index, variant] of variants.entries()) {
    const runner = path.join(temporary, `import-${index}.mjs`);
    const directory = path.join(temporary, `cwd-${index}`);
    fs.mkdirSync(directory);
    fs.writeFileSync(runner, `await import(${JSON.stringify(pathToFileURL(variant.file).href)});\nprocess.stdout.write('IMPORTED');\n`);
    const child = spawnSync(process.execPath, [runner], { cwd: directory, encoding: 'utf8', timeout: 15_000 });
    assert.equal(child.status, 0, child.stderr);
    assert.equal(child.stdout, 'IMPORTED');
    assert.equal(child.stderr, '');
    assert.deepEqual(fs.readdirSync(directory), []);
  }
  const runner = path.join(temporary, 'import-without-argv.mjs');
  fs.writeFileSync(runner, `process.argv[1] = undefined;\nawait import(${JSON.stringify(pathToFileURL(variants[0].file).href)});\nprocess.stdout.write('IMPORTED');\n`);
  const child = spawnSync(process.execPath, [runner], { cwd: temporary, encoding: 'utf8', timeout: 15_000 });
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout, 'IMPORTED');
  assert.equal(child.stderr, '');
});
