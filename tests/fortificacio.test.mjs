/** Proves negatives de la Fortificació del Cervell.
 *  Cada prova injecta l'error que la porta vigila i exigeix que la porta parle.
 *  Una porta que no s'ha demostrat capaç de posar-se roja no és una comprovació. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fixture,validDoc,writeDoc,relay,REPO} from './helpers/documental.mjs';
import {loadContract,sections} from '../tooling/documental/core.mjs';
import {bindPlan,checkTurn,handoffDocument,inventory} from '../tooling/documental/turns.mjs';

const HUMAN='_wiki_de_poble/04_escriptori/01_produccio';

/** Torn planificat amb relleu, llest per a checkTurn. `abans` corre amb el fixture ja creat
 *  i abans d'obrir cap torn, per a que el que escriga entre a l'inventari inicial. */
function planned(t,abans=()=>{}) {
  const root=fixture(t);
  abans(root);
  const d=validDoc(root);writeDoc(root,d);
  const plan=validDoc(root,{route:'pla.implementacio',turn:d.turn,suffix:'pla'});writeDoc(root,plan);
  bindPlan(root,d.turn.turn_id,plan.file);relay(root,d.turn.turn_id);
  return {root,d,plan};
}
/** El marcador que `arrel()` exigeix per acceptar un --arrel imposat. */
function marcaArrel(root) {
  fs.mkdirSync(path.join(root,'.agents'),{recursive:true});
  fs.writeFileSync(path.join(root,'.agents/AGENTS.md'),'# Marcador d’arrel per a proves\n');
  return root;
}
function escriuZonaHumana(root,nom='260911_0645_material_del_mestre.md') {
  fs.mkdirSync(path.join(root,HUMAN),{recursive:true});
  fs.writeFileSync(path.join(root,HUMAN,nom),'Material humà. La IA no el pot tocar.\n');
  return `${HUMAN}/${nom}`;
}

// ── P-1 · La zona humana és invisible? ─────────────────────────────────────────
test('P-1 · la zona humana entra a l’inventari, només com a hash',t=>{
  const root=fixture(t);const rel=escriuZonaHumana(root);
  const inv=inventory(root);
  assert.ok(Object.hasOwn(inv,rel),'la zona humana ha de ser a l’inventari');
  assert.match(inv[rel],/^[a-f0-9]{64}$/,'de la zona humana només se n’ha de guardar el hash');
  assert.ok(!JSON.stringify(inv).includes('La IA no el pot tocar'),'mai el contingut');
});

test('P-1 · esborrar un fitxer de la zona humana posa el torn roig, amb nom propi',t=>{
  let rel;
  const {root,d}=planned(t,r=>{rel=escriuZonaHumana(r);});
  assert.equal(checkTurn(root,d.turn.turn_id).valid,true,'el torn ha de nàixer verd');
  fs.unlinkSync(path.join(root,rel));
  const r=checkTurn(root,d.turn.turn_id);
  assert.equal(r.valid,false,'esborrar material del Mestre ha de posar el torn roig');
  assert.match(r.errors.join('\n'),/Zona humana modificada/);
  assert.ok(r.errors.some(e=>e.includes(rel)),`l’error ha de nomenar ${rel}: ${r.errors.join(' | ')}`);
});

test('P-1 · modificar un fitxer de la zona humana també el posa roig',t=>{
  let rel;
  const {root,d}=planned(t,r=>{rel=escriuZonaHumana(r);});
  fs.appendFileSync(path.join(root,rel),'una línia que la IA no havia d’escriure\n');
  const r=checkTurn(root,d.turn.turn_id);
  assert.equal(r.valid,false);
  assert.ok(r.errors.some(e=>e.includes(rel)),r.errors.join(' | '));
});

// ── P-2 · El torn sobreviu al moviment d'un document? ──────────────────────────
test('P-2 · arxivar el pla d’un torn obert dóna diagnòstic amb nom, mai un ENOENT',t=>{
  const {root,d,plan}=planned(t);
  fs.unlinkSync(path.join(root,plan.file));
  let r;
  assert.doesNotThrow(()=>{r=checkTurn(root,d.turn.turn_id);},'checkTurn no pot estavellar-se: ha de diagnosticar');
  assert.equal(r.valid,false);
  const e=r.errors.join('\n');
  assert.match(e,/Pla absent o modificat/);
  assert.ok(e.includes(plan.file),`l’error ha de nomenar el pla: ${e}`);
  assert.ok(!/ENOENT/.test(e),`cap traça de Node a la cara de l’agent: ${e}`);
});

test('P-2 · el relleu deixa promoure un document a 10_actes i tancar el torn',t=>{
  const {root,d,plan}=planned(t);
  const desti='_wiki_de_poble/10_actes/'+path.basename(d.file);
  fs.mkdirSync(path.join(root,'_wiki_de_poble/10_actes'),{recursive:true});
  fs.renameSync(path.join(root,d.file),path.join(root,desti));
  // Sense relleu el torn queda mort: eixa és la fallada que motiva la funció.
  assert.match(checkTurn(root,d.turn.turn_id).errors.join('\n'),/Document eliminat sense relleu|sense àncora/);
  handoffDocument(root,d.turn.turn_id,d.file,desti);
  bindPlan(root,d.turn.turn_id,plan.file);
  // El rebut conserva la identitat; l'àncora ha de seguir el camí exacte nou.
  // L'enllaç pla anterior no pot acreditar un homònim fora de l'Escriptori.
  assert.match(checkTurn(root,d.turn.turn_id).errors.join('\n'),/Document sense àncora/);
  const index=path.join(root,'_wiki_de_poble/04_escriptori/00_index_escriptori.md');
  const anterior=`[[${path.basename(d.file,'.md')}]]`;
  const nova=`[[../10_actes/${path.basename(desti)}]]`;
  const text=fs.readFileSync(index,'utf8');
  assert.ok(text.includes(anterior),'la fixture ha de contindre l’àncora original');
  fs.writeFileSync(index,text.replace(anterior,nova));
  const r=checkTurn(root,d.turn.turn_id);
  assert.equal(r.valid,true,`el torn ha de sobreviure al moviment: ${r.errors.join(' | ')}`);
});

test('P-2 · el relleu no pot promoure res cap a la zona humana',t=>{
  const {root,d}=planned(t);
  const desti=`${HUMAN}/${path.basename(d.file)}`;
  fs.mkdirSync(path.join(root,HUMAN),{recursive:true});
  fs.renameSync(path.join(root,d.file),path.join(root,desti));
  assert.throws(()=>handoffDocument(root,d.turn.turn_id,d.file,desti),/Zona humana protegida/);
});

// ── P-3 · El Somiador respecta la taula? ───────────────────────────────────────
function somia(root) {
  return spawnSync(process.execPath,[path.join(REPO,'tooling/brain/somiador.mjs'),'--dry-run'],
    {cwd:root,encoding:'utf8'});
}
test('P-3 · en sec, el Somiador no s’endú cap document d’un torn obert',t=>{
  const {root,d}=planned(t);
  const p=somia(root);
  assert.equal(p.status,0,`el Somiador s’ha estavellat: ${p.stderr}`);
  assert.ok(!p.stdout.includes('[DRY-RUN]'),`no havia de moure res i mou: ${p.stdout}`);
  assert.ok(!p.stdout.includes(path.basename(d.file)),p.stdout);
});

test('P-3 · i la prova sap posar-se roja: un fitxer sense torn ni àncora sí que se l’endú',t=>{
  const {root}=planned(t);
  const orfe='260922_0301_informe_orfe.md';
  fs.writeFileSync(path.join(root,'_wiki_de_poble/04_escriptori',orfe),'sense rebut ni àncora\n');
  const p=somia(root);
  assert.equal(p.status,0,p.stderr);
  assert.ok(p.stdout.includes(orfe),`el Somiador havia de proposar endur-se l’orfe: ${p.stdout}`);
});

test('P-3 · un registre de torn corrupte atura el Somiador amb nom propi',t=>{
  const {root}=planned(t);
  fs.writeFileSync(path.join(root,'.agents/runtime/turns/torn_00000000-0000-4000-8000-000000000000.json'),'{}');
  const p=somia(root);
  assert.notEqual(p.status,0,'amb un registre il·legible el Somiador ha de fallar tancat');
  assert.match(p.stderr,/Torn il·legible/);
});

// ── P-4 · La plantilla és el contracte? ────────────────────────────────────────
test('P-4 · els encapçalaments de cada plantilla són exactament les seccions de la seua ruta',t=>{
  const root=fixture(t);
  const {router}=loadContract(root);
  for(const route of router.rutes) {
    const body=fs.readFileSync(path.join(root,route.plantilla),'utf8').replace(/^---[\s\S]*?\n---\n/,'');
    assert.deepEqual([...sections(body).keys()],route.seccions,
      `${route.id}: la plantilla i el contracte han de dir el mateix, en el mateix ordre`);
  }
});

test('P-4 · canviar un encapçalament de la plantilla posa la porta roja',t=>{
  const root=marcaArrel(fixture(t));
  const route=loadContract(root).router.rutes.find(r=>r.id==='prompt.local');
  const file=path.join(root,route.plantilla);
  // L'encapçalament a mutar es deriva del contracte, mai d'un nom literal: quan
  // la plantilla va passar de «Tasca» a «Tasques» (260923), una mutació escrita
  // a mà va deixar de mutar res i la prova declarava verda una porta sense provar.
  const original=route.seccions.find(s=>s==='Registre')??route.seccions[0];
  const patro=new RegExp(`^## ${original.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'m');
  fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(patro,`## ${original} mutat`));
  const body=fs.readFileSync(file,'utf8').replace(/^---[\s\S]*?\n---\n/,'');
  assert.notDeepEqual([...sections(body).keys()],route.seccions,'la divergència ha de ser visible');
  const p=spawnSync(process.execPath,[path.join(REPO,'tooling/gates/porta-plantilles.mjs'),'--arrel',root],{encoding:'utf8'});
  assert.equal(p.status,1,`la porta havia d’eixir roja: ${p.stdout}${p.stderr}`);
  assert.match(p.stdout+p.stderr,/prompt\.local/);
});

test('P-4 · amb les plantilles intactes la porta ix verda',()=>{
  const p=spawnSync(process.execPath,[path.join(REPO,'tooling/gates/porta-plantilles.mjs')],{cwd:REPO,encoding:'utf8'});
  assert.equal(p.status,0,`${p.stdout}${p.stderr}`);
});

// ── P-6 · Les guardes CLI parlen des d'un camí amb espais? ────────────────────
test('P-6 · cap porta usa la guarda concatenada que emmudeix amb espais al camí',()=>{
  const sospitosos=spawnSync('grep',['-rln','file://${process.argv[1]}',path.join(REPO,'tooling')],{encoding:'utf8'});
  assert.equal(sospitosos.stdout.trim(),'',`guardes trencades:\n${sospitosos.stdout}`);
});

test('P-6 · les portes parlen quan s’executen des d’un directori amb espais',tc=>{
  const root=fixture(tc);
  const amb=path.join(root,'un cami amb espais');
  fs.mkdirSync(amb,{recursive:true});
  for(const gate of ['tooling/gates/tractor-manifest.mjs','tooling/brain/matrix.mjs']) {
    const desti=path.join(amb,path.basename(gate));
    fs.copyFileSync(path.join(REPO,gate),desti);
    const p=spawnSync(process.execPath,[desti],{cwd:REPO,encoding:'utf8'});
    const parla=(p.stdout+p.stderr).trim().length>0;
    assert.ok(parla,`${gate} no diu res des d’un camí amb espais: verd sense comprovar res`);
  }
});

// ── Graf · arxivar no ha de trencar els enllaços ──────────────────────────────
/** Els documents del fixture viuen a `01_ser`, no a l'Escriptori: el compilador només
 *  entra a les tres carpetes públiques (AGENTS §5), i un fixture a `04_escriptori` no
 *  s'escaneja mai —la prova eixia verda sense mesurar res.
 *  El compilador deriva l'arrel del seu propi camí: copiant-lo al fixture, el fixture
 *  passa a ser l'arrel. És el mateix recurs que usa la suite documental. */
function wikiFixture(t,fitxers) {
  // Arrel neta a propòsit: el fixture documental porta les 13 plantilles, i els seus
  // enllaços farien soroll que no té res a vore amb el que ací es mesura.
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-graf-test-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  for(const f of ['tooling/wiki/compile-wiki-to-app.mjs','tooling/wiki/lib/frontmatter.mjs','tooling/wiki/lib/publication-policy.mjs','tooling/scripts/canonada.mjs','tooling/lib/arrel.mjs']) {
    fs.mkdirSync(path.dirname(path.join(root,f)),{recursive:true});
    fs.copyFileSync(path.join(REPO,f),path.join(root,f));
  }
  for(const [rel,cos] of Object.entries(fitxers)) {
    fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true});
    fs.writeFileSync(path.join(root,rel),cos);
  }
  return {root,check:()=>spawnSync(process.execPath,[path.join(root,'tooling/wiki/compile-wiki-to-app.mjs'),'--check','--strict'],{cwd:root,encoding:'utf8'})};
}
const doc=(desc,cos)=>`---\ntype: document\nstatus: esborrany\ndescription: ${desc}\n---\n# Prova\n\n${cos}\n`;

test('graf · un enllaç cap a l’arxiu històric no és un enllaç trencat',t=>{
  const {check}=wikiFixture(t,{
    '_wiki_de_poble/01_ser/260922_0300_document_viu.md':doc('Document viu que cita un arxivat','Mira [[260901_0100_informe_arxivat]].'),
    '_wiki_de_poble/90_arxiu_historic/260901_0100_informe_arxivat.md':doc('Informe ja arxivat','Contingut antic.'),
  });
  const p=check();
  assert.ok(!/Enllaç trencat/.test(p.stderr),`arxivar no pot trencar el graf: ${p.stderr}`);
  assert.match(p.stdout,/apunten a l'arxiu històric/);
  assert.equal(p.status,0,`${p.stdout}${p.stderr}`);
});

test('graf · i la porta sap posar-se roja: un destí que no existix enlloc sí que és trencat',t=>{
  const {check}=wikiFixture(t,{
    '_wiki_de_poble/01_ser/260922_0300_document_viu.md':doc('Document viu amb un enllaç mort','Mira [[260901_0100_mai_ha_existit]].'),
  });
  const p=check();
  assert.equal(p.status,1,'un destí inexistent ha de posar la porta roja');
  assert.match(p.stderr,/260901_0100_mai_ha_existit/);
});

test('graf · un enllaç que només difereix en majúscules apunta al mateix document',t=>{
  const {check}=wikiFixture(t,{
    '_wiki_de_poble/01_ser/00_index_escriptori.md':doc('Índex de l’Escriptori','Índex.'),
    '_wiki_de_poble/01_ser/260922_0300_document_viu.md':doc('Cita l’índex amb la caixa antiga','Mira [[00_INDEX_ESCRIPTORI]].'),
  });
  const p=check();
  assert.equal(p.status,0,`el sistema de fitxers no distingix caixa: ${p.stderr}`);
});

// ── Integritat dels registres de torn ─────────────────────────────────────────
test('els registres de torn del repositori són tots llegibles',()=>{
  const dir=path.join(REPO,'.agents/runtime/turns');
  if(!fs.existsSync(dir)) return;
  const trencats=[];
  for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.json'))) {
    let turn;
    try{turn=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));}catch{trencats.push(`${name} (JSON invàlid)`);continue;}
    if(!turn.turn_id||!turn.receipts||!Array.isArray(turn.history)) trencats.push(`${name} (registre incomplet)`);
  }
  assert.deepEqual(trencats,[],`registres que maten el Somiador i la cadena:\n${trencats.join('\n')}`);
});
