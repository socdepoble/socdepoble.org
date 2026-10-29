// DESTÍ: tests/porta-taxonomia.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analitzaNom, dinsAbast, comprovaRutes, categoriesDeLaPagina, paritat } from '../tooling/gates/porta-taxonomia.mjs';

const CONFIG = {
  schema: 'sdp.taxonomia.v1',
  pagina: 'pagina.md',
  superficies: ['_wiki_de_poble/04_escriptori', '_wiki_de_poble/10_actes'],
  exempts: { '00_index_escriptori.md': 'índex' },
  tolerancia_dies_passat: 30,
  categories: { acta: 'acta', auditoria: 'auditoria', pla: 'planificacio', pla_implementacio: 'pla.implementacio', prompt: 'prompt.local' }
};
const ARA = new Date(2026, 8, 24, 14, 10);
const lleis = (nom, opcions = {}) => analitzaNom(nom, CONFIG, { ara: ARA, ...opcions }).errors.map((e) => e.llei);

test('accepta els noms canònics i en trau categoria i títol', () => {
  assert.deepEqual(analitzaNom('260924_1410_auditoria_claude.md', CONFIG, { ara: ARA }),
    { nom: '260924_1410_auditoria_claude.md', valid: true, categoria: 'auditoria', titol: 'claude', errors: [] });
  const pla = analitzaNom('260924_1245_pla_implementacio_claude.md', CONFIG, { ara: ARA });
  assert.equal(pla.categoria, 'pla_implementacio');
  assert.equal(pla.titol, 'claude');
});

test('T1 diu la causa concreta del format', () => {
  const causa = (nom) => analitzaNom(nom, CONFIG, { ara: ARA }).errors[0].missatge;
  assert.match(causa('260924_1445_ACTA_MARMOTA_consola.md'), /majúscules/);
  assert.match(causa('260924_1445_acta-marmota.md'), /guions/);
  assert.match(causa('260924_1445_acta_incidència.md'), /accents/);
  assert.match(causa('260924_1445_acta marmota.md'), /espais/);
  assert.match(causa('acta_marmota.md'), /aammdd_hhmm_/);
});

test('T2 rebutja dates i hores que no existixen', () => {
  assert.deepEqual(lleis('260231_1000_acta_x.md'), ['T2']);
  assert.deepEqual(lleis('260924_2460_acta_x.md'), ['T2']);
});

test('T3 i T4: categoria del catàleg i títol obligatori', () => {
  assert.deepEqual(lleis('260924_1000_incidencia_protocol.md'), ['T3']);
  assert.deepEqual(lleis('260924_1000_auditoria.md'), ['T4']);
});

test('T5: la data no passa de demà', () => {
  assert.deepEqual(lleis('260925_0900_acta_x.md'), []);
  assert.deepEqual(lleis('261001_0900_acta_x.md'), ['T5']);
});

test('T6: un fitxer nou amb data de fa anys delata un DDMMAA', () => {
  assert.deepEqual(lleis('240926_1000_acta_x.md', { nou: true }), ['T6']);
  assert.deepEqual(lleis('240926_1000_acta_x.md', { nou: false }), []);
});

test('l’abast és per superfície i primer nivell, no per patró', () => {
  assert.equal(dinsAbast('_wiki_de_poble/04_escriptori/x.md', CONFIG), true);
  assert.equal(dinsAbast('_wiki_de_poble/04_escriptori/02_investigacio_ia/x.md', CONFIG), false);
  assert.equal(dinsAbast('_wiki_de_poble/04_escriptori/00_index_escriptori.md', CONFIG), false);
  assert.equal(dinsAbast('_wiki_de_poble/04_escriptori/.ancora_sessio.json', CONFIG), false);
  assert.equal(dinsAbast('src/x.js', CONFIG), false);
});

test('comprovaRutes només torna els que fallen i compta els revisats', () => {
  const r = comprovaRutes([
    '_wiki_de_poble/04_escriptori/260924_1410_auditoria_claude.md',
    '_wiki_de_poble/10_actes/260924_1445_ACTA_MARMOTA_x.md',
    'src/app/App.jsx'
  ], CONFIG, { ara: ARA, nou: true });
  assert.equal(r.valid, false);
  assert.equal(r.revisats, 2);
  assert.deepEqual(r.resultats.map((x) => x.ruta), ['_wiki_de_poble/10_actes/260924_1445_ACTA_MARMOTA_x.md']);
});

test('paritat: la pàgina de la Wiki i el JSON han de dir el mateix', () => {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'taxonomia-'));
  const taula = (cats) => ['<!-- SDP:TAXONOMIA:CATEGORIES -->', '| Categoria | Ruta |', '|---|---|',
    ...cats.map((c) => `| \`${c}\` | ${CONFIG.categories[c] ?? 'x'} |`), '<!-- /SDP:TAXONOMIA:CATEGORIES -->'].join('\n');
  fs.writeFileSync(path.join(arrel, 'pagina.md'), taula(Object.keys(CONFIG.categories)));
  assert.equal(paritat(arrel, CONFIG).valid, true);
  fs.writeFileSync(path.join(arrel, 'pagina.md'), taula(['acta', 'auditoria', 'incidencia']));
  const r = paritat(arrel, CONFIG);
  assert.equal(r.valid, false);
  assert.equal(r.errors.length, 4);
  assert.equal(categoriesDeLaPagina('sense marques'), null);
});

function parityFixture(t,categories,rows){const root=fs.mkdtempSync(path.join(os.tmpdir(),'taxonomia-rutes-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.writeFileSync(path.join(root,'pagina.md'),['<!-- SDP:TAXONOMIA:CATEGORIES -->','| Categoria | Ruta |','|---|---|',...rows,'<!-- /SDP:TAXONOMIA:CATEGORIES -->'].join('\n'));return paritat(root,{...CONFIG,categories});}
test('paritat detects a changed route even when category names still agree',t=>{const r=parityFixture(t,{pla:'pla.implementacio'},['| `pla` | `planificacio` |']);assert.equal(r.valid,false);assert.match(r.errors.join('\n'),/pla.*ruta/i);});
test('paritat compares route unions independent of order and code-span formatting',t=>{assert.equal(parityFixture(t,{prompt:'prompt.local · prompt.consell'},['| `prompt` | `prompt.consell` · `prompt.local` |']).valid,true);});
test('transient category explanation is distinct from a formal route',t=>{assert.equal(parityFixture(t,{solucio:'sense ruta: transitòria de torn (porta-olivera)'},['| `solucio` | sense ruta |']).valid,true);assert.equal(parityFixture(t,{solucio:'sense ruta: transitòria'},['| `solucio` | auditoria |']).valid,false);});
test('duplicate categories and empty route cells cannot pass parity',t=>{for(const rows of [['| `pla` | pla.implementacio |','| `pla` | pla.implementacio |'],['| `pla` | |']])assert.equal(parityFixture(t,{pla:'pla.implementacio'},rows).valid,false);});
test('parity excludes examples in fences and HTML comments inside the category region',t=>{assert.equal(parityFixture(t,{pla:'pla.implementacio'},['| `pla` | pla.implementacio |','~~~md','| `fantasma` | altre |','~~~','<!--','| `ocult` | altre |','-->']).valid,true);});

test('parity fails explicitly for missing or non-string configured routes',t=>{
 for(const value of [null,42,{},''])assert.equal(parityFixture(t,{pla:value},['| `pla` | pla.implementacio |']).valid,false);
});

function parityDocument(t,text){const root=fs.mkdtempSync(path.join(os.tmpdir(),'taxonomia-context-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.writeFileSync(path.join(root,'pagina.md'),text);return paritat(root,{...CONFIG,categories:{pla:'pla.implementacio'}});}
const region=route=>`<!-- SDP:TAXONOMIA:CATEGORIES -->\n| Categoria | Ruta |\n|---|---|\n| \`pla\` | ${route} |\n<!-- /SDP:TAXONOMIA:CATEGORIES -->`;
test('a complete fenced example cannot replace the contradictory active region',t=>{assert.equal(parityDocument(t,'~~~md\n'+region('pla.implementacio')+'\n~~~\n'+region('planificacio')).valid,false);});
test('hidden example regions do not duplicate the one active region',t=>{for(const example of ['~~~md\n'+region('other')+'\n~~~','<!--\n'+region('other')+'\n-->','    '+region('other').replaceAll('\n','\n    ')])assert.equal(parityDocument(t,example+'\n'+region('pla.implementacio')).valid,true);});
test('two active canonical regions fail even when their routes agree',t=>{assert.equal(parityDocument(t,region('pla.implementacio')+'\n'+region('pla.implementacio')).valid,false);});
test('inline-code markers and out-of-order markers do not define a canonical table',t=>{assert.equal(parityDocument(t,'`<!-- SDP:TAXONOMIA:CATEGORIES -->`\n| `pla` | pla.implementacio |\n`<!-- /SDP:TAXONOMIA:CATEGORIES -->`').valid,false);assert.equal(parityDocument(t,'<!-- /SDP:TAXONOMIA:CATEGORIES -->\n<!-- SDP:TAXONOMIA:CATEGORIES -->').valid,false);});
