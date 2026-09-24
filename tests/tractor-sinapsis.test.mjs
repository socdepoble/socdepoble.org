/** Proves del tractor Sinapsis (laboratori 260924_1700_tractors_claude). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CANDIDATS = [
  '../_wiki_de_poble/04_escriptori/02_investigacio_ia/260924_1700_tractors_claude/wiki/tractor-sinapsis.mjs',
  '../tooling/wiki/tractor-sinapsis.mjs'
];
const modul = CANDIDATS.find((p) => fs.existsSync(new URL(p, import.meta.url)));
const { corpus, paragrafs, nomsRepetits, titolsSemblants, paragrafsRepetits, auditaSkills, senseAncora, classifica, avalua, jaccard, tokens, idDe } = await import(modul);

const W = '_wiki_de_poble';
function mas(t) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-sinapsis-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  return arrel;
}
function posa(arrel, rel, text) {
  const abs = path.join(arrel, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text);
}
const doc = (desc, titol, cos) => `---\ntype: document\nstatus: canonic\ndescription: ${desc}\n---\n# ${titol}\n\n${cos}\n`;
const LLARG = 'Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l evolució de més de trenta anys de lluita per protegir la identitat i el patrimoni dels nostres pobles a internet amb pedra seca digital.';

test('paragrafs: prosa sí; capçaleres, taules, codi, àncores i llistes d\'enllaços no', () => {
  const p = paragrafs('# T\n\nPrimer paràgraf\nque continua.\n\n| a | b |\n\n```\ncodi\n```\n\n- [[enllaç]]\n\n**Ancoratge de Seguretat:** [[00_index]]\n\nSegon.\n');
  assert.deepEqual(p, ['Primer paràgraf que continua.', 'Segon.']);
});

test('D1: identitat.md, 01_identitat.md i 00_index_identitat.md són el mateix nom en tres carpetes', (t) => {
  const arrel = mas(t);
  posa(arrel, `${W}/02_saber/identitat.md`, doc('Map of Content', 'Identitat', ''));
  posa(arrel, `${W}/01_ser/01_identitat.md`, doc('Missió', 'IAIA', 'x'));
  posa(arrel, `${W}/01_ser/00_index_identitat.md`, doc('Índex', 'Índex de la Wiki', 'y'));
  posa(arrel, `${W}/02_saber/maquina.md`, doc('Màquina', 'Màquina', 'z'));
  const r = nomsRepetits(corpus(arrel, [W]));
  assert.equal(r.length, 1);
  assert.deepEqual(r[0].rutes.sort(), [`${W}/01_ser/00_index_identitat.md`, `${W}/01_ser/01_identitat.md`, `${W}/02_saber/identitat.md`]);
  assert.equal(r[0].id, idDe('D1', r[0].rutes), 'identificador estable = sha del tipus i les rutes');
});

test('D2: títols i descripcions quasi iguals, amb Jaccard sobre tokens sense stopwords', (t) => {
  const arrel = mas(t);
  posa(arrel, `${W}/02_saber/a.md`, doc('Protocol de memòria històrica i destil·lació del saber', 'Memòria històrica del Mas', ''));
  posa(arrel, `${W}/02_saber/b.md`, doc('Protocol de memòria històrica: destil·lació del saber', 'Memòria històrica del Mas', ''));
  posa(arrel, `${W}/02_saber/c.md`, doc('Calendari agrícola de tomaques', 'Tomaques', ''));
  const r = titolsSemblants(corpus(arrel, [W]));
  assert.equal(r.length, 1);
  assert.deepEqual(r[0].rutes, [`${W}/02_saber/a.md`, `${W}/02_saber/b.md`]);
  assert.equal(jaccard(tokens('a b'), tokens('')), 0);
});

test('D3: el mateix paràgraf llarg en dos documents és una troballa; els curts no', (t) => {
  const arrel = mas(t);
  posa(arrel, `${W}/01_ser/el_projecte.md`, doc('Projecte', 'El projecte', `${LLARG}\n\nCurt igual.`));
  posa(arrel, `${W}/03_actuar/plantilles/prompt_local.md`, doc('Plantilla', 'Prompt', `Context:\n\n${LLARG}\n\nCurt igual.`));
  const r = paragrafsRepetits(corpus(arrel, [W]));
  assert.equal(r.length, 1);
  assert.equal(r[0].tipus, 'D3-paragrafs-repetits');
  assert.deepEqual(r[0].rutes, [`${W}/01_ser/el_projecte.md`, `${W}/03_actuar/plantilles/prompt_local.md`]);
});

test('D4: skills sense status, sense àncora, fora del catàleg o amb descripció divergent', (t) => {
  const arrel = mas(t);
  posa(arrel, '.agents/skills/00_INDEX_SKILLS.md', '# Catàleg\n\n- [[core-a/SKILL|core-a]]: Descripció A.\n- [[core-fantasma/SKILL|core-fantasma]]: No té carpeta.\n');
  posa(arrel, '.agents/skills/core-a/SKILL.md', '---\nname: core-a\nstatus: canonic\ndescription: Descripció A.\n---\n# A\n\n## Vincles\n- [[00_INDEX_SKILLS]]\n');
  posa(arrel, '.agents/skills/core-b/SKILL.md', '---\nname: core-b\ndescription: B.\n---\n# B\n\nSense res.\n');
  const r = auditaSkills(arrel, corpus(arrel, ['.agents/skills']));
  const perRuta = Object.fromEntries(r.map((x) => [x.rutes[0], x.detall]));
  assert.equal(perRuta['.agents/skills/core-a/SKILL.md'], undefined, 'core-a és impecable');
  assert.match(perRuta['.agents/skills/core-b/SKILL.md'], /sense `status`/);
  assert.match(perRuta['.agents/skills/core-b/SKILL.md'], /sense àncora/);
  assert.match(perRuta['.agents/skills/core-b/SKILL.md'], /fora del catàleg/);
  assert.match(perRuta['.agents/skills/core-fantasma/SKILL.md'], /sense carpeta/);
});

test('D5: documents de 01_ser/02_saber/03_actuar sense cap [[00_index…]]', (t) => {
  const arrel = mas(t);
  posa(arrel, `${W}/02_saber/ancorat.md`, doc('x', 'X', '**Ancoratge de Seguretat:** [[00_index]]'));
  posa(arrel, `${W}/02_saber/orfe.md`, doc('y', 'Y', 'res'));
  posa(arrel, `${W}/10_actes/acta.md`, doc('z', 'Z', 'les actes no entren'));
  const r = senseAncora(corpus(arrel, [W]));
  assert.deepEqual(r.map((x) => x.rutes[0]), [`${W}/02_saber/orfe.md`]);
});

test('classifica: pendent, vigent, «mantindre» caducat i «fusionar» no executat', () => {
  const ara = new Date('2026-09-24T12:00:00Z');
  const troballes = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, tipus: 'D1', rutes: [id], detall: '' }));
  const decisions = { schema: 'sdp.maduracio.v1', decisions: {
    b: { decisio: 'mantindre', per: 'Mestre', data: '2026-09-01' },
    c: { decisio: 'mantindre', per: 'Mestre', data: '2026-05-01' },
    d: { decisio: 'fusionar', per: 'Mestre', data: '2026-09-01' },
    e: { decisio: 'resolt', per: 'Mestre', data: '2026-01-01' }
  } };
  const r = classifica(troballes, decisions, ara);
  assert.deepEqual(r.pendents.map((x) => x.id), ['a']);
  assert.deepEqual(r.vigents.map((x) => x.id), ['b', 'e']);
  assert.deepEqual(r.caducades.map((x) => x.id), ['c']);
  assert.deepEqual(r.noExecutades.map((x) => x.id), ['d']);
});

test('avalua: sense fitxer de decisions tot és pendent, i l\'Escriptori i l\'arxiu no entren al corpus', (t) => {
  const arrel = mas(t);
  posa(arrel, `${W}/02_saber/a.md`, doc('a', 'A', LLARG));
  posa(arrel, `${W}/04_escriptori/260924_1700_auditoria_claude.md`, doc('cita', 'Auditoria', LLARG));
  posa(arrel, `${W}/90_arxiu_historic/vell.md`, doc('vell', 'Vell', LLARG));
  const r = avalua(arrel, { decisions: null });
  assert.equal(r.senseFitxerDeDecisions, true);
  assert.equal(r.documents, 1);
  assert.equal(r.troballes.filter((x) => x.tipus.startsWith('D3')).length, 0, 'citar a l\'Escriptori no és repetir');
});
