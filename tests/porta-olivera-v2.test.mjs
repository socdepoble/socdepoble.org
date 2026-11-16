/** R31: els casos d'Olivera v2 exercixen les API vives. La vida dels
 * documents la declara l'índex (AGENTS §0.1), i els rebuts els comprova
 * porta-reflex; no es reinstal·la la caducitat automàtica del mateix dia. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture } from './helpers/documental.mjs';
import { openTurn } from '../tooling/documental/turns.mjs';
import { createDraft } from '../tooling/wiki/document.mjs';
import { checkPayload as checkReflex } from '../tooling/gates/porta-reflex.mjs';
import { checkTaula, checkOlivera, ranci, vius, safata, plaDeHui, seccioZeroFeta, avui, esPetorreta } from '../tooling/gates/porta-olivera.mjs';

const DESK = '_wiki_de_poble/04_escriptori';
const DIA = avui();
const posa = (root, nom, text = '# Prova\n') => fs.writeFileSync(path.join(root, DESK, nom), text);
function indexa(root, noms) {
  fs.writeFileSync(path.join(root, DESK, '00_index_escriptori.md'), `# Índex\n\n## Activitat en curs\n\n${noms.map(nom => `- [[${nom.replace(/\.md$/, '')}]] · Mestre ${DIA}: prova activa`).join('\n')}\n`);
}
function petorreta(t) {
  const root = fixture(t), turn = openTurn(root, { scope: 'documents', actor: 'prova-r31' });
  const pla = `${DESK}/${DIA}_1540_pla_implementacio_prova.md`;
  const file = `${DESK}/${DIA}_1540_prompt_prova.md`;
  for (const [ruta, desti] of [['pla.implementacio', pla], ['prompt.local', file]]) {
    createDraft(root, turn.turn_id, { route: ruta, file: desti, title: 'Prova canònica R31', description: 'Document de prova del contracte documental vigent' });
    const raw = fs.readFileSync(path.join(root, desti), 'utf8').replaceAll('[pendent]', 'Resultat comprovat amb evidència.');
    fs.writeFileSync(path.join(root, desti), raw);
  }
  return { root, file, content: fs.readFileSync(path.join(root, file), 'utf8') };
}

test('dos prompts del mateix dia continuen vius i una declaració explícita protegix un document anterior', t => {
  const root = fixture(t), noms = [`${DIA}_1500_prompt_claude.md`, `${DIA}_1540_prompt_codex.md`, '260101_0900_auditoria_viva.md'];
  for (const nom of noms) posa(root, nom);
  indexa(root, noms);
  assert.deepEqual(ranci(root, DIA), []);
  assert.ok(vius(root).has('260101_0900_auditoria_viva'));
  assert.equal(checkTaula(root, { dia: DIA }).valid, true);
});

test('els plans de la jornada es conserven sense inventar una sessió que consumisca els anteriors', t => {
  const root = fixture(t), noms = [`${DIA}_0900_pla_implementacio_a.md`, `${DIA}_1200_pla_implementacio_b.md`];
  for (const nom of noms) posa(root, nom);
  indexa(root, noms);
  assert.deepEqual(plaDeHui(root, DIA).map(doc => doc.nom).sort(), noms);
  assert.deepEqual(ranci(root, DIA), []);
});

test('la Safata compta qualsevol caixa i extensió, i una casella marcada no n’amaga els elements', t => {
  const root = fixture(t), bustia = path.join(root, DESK, '00_Bandeja_d_Entrada');
  fs.mkdirSync(bustia);
  fs.writeFileSync(path.join(bustia, 'nota.txt'), 'x');
  fs.writeFileSync(path.join(bustia, '.DS_Store'), 'x');
  assert.deepEqual(safata(root), { carpeta: `${DESK}/00_Bandeja_d_Entrada`, elements: ['nota.txt'] });
  const result = checkOlivera(root, { contingut: '## 0. Preflight\n- [x] Escriptori net\n' });
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /Safata d'entrada amb 1 element/);
});

test('secció zero: marcada, pendent, absent i comentaris no es confonen', () => {
  assert.equal(seccioZeroFeta('## 0. Preflight\n- [x] fet\n'), true);
  assert.equal(seccioZeroFeta('## 0. Preflight\n- [x] fet\n- [ ] falta\n'), false);
  assert.equal(seccioZeroFeta('# Sense preflight\n'), false);
  assert.equal(seccioZeroFeta('## 0. Preflight\n<!-- - [x] exemple -->\n'), false);
});

test('una casella marcada no acredita un rebut inventat: la porta documental el rebutja sense escriure', t => {
  const { root, file, content } = petorreta(t);
  const before = fs.readFileSync(path.join(root, file), 'utf8');
  const fals = content.replace(/^reflex:.*$/m, 'reflex: sdp:torn_11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222');
  const result = checkReflex({ tool_name: 'Write', tool_input: { file_path: file, content: fals } }, root);
  assert.equal(result.code, 2);
  assert.ok(result.errors.some(error => /torn|rebut/i.test(error)), result.errors.join('\n'));
  assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), before);
});

test('una petorreta de la plantilla viva, ancorada i amb rebut real passa la porta documental', t => {
  const { root, file, content } = petorreta(t);
  assert.deepEqual(checkReflex({ tool_name: 'Write', tool_input: { file_path: file, content } }, root), { code: 0, errors: [], file });
  assert.equal(checkTaula(root).valid, true);
});

test('una petorreta sense pla queda denunciada encara que el seu preflight diga que està fet', t => {
  const root = fixture(t);
  const result = checkOlivera(root, { contingut: '## 0. Preflight\n- [x] Pla fet\n', fitxer: `${DESK}/${DIA}_1540_prompt_prova.md` });
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /Cap Pla d'Implementació/);
});

test('un document anterior consumit sense declaració viva és ranci; només els prompts de primer nivell es detecten', t => {
  const root = fixture(t);
  posa(root, '260101_0900_prompt_vell.md');
  assert.deepEqual(ranci(root, DIA).map(doc => doc.nom), ['260101_0900_prompt_vell.md']);
  assert.equal(esPetorreta(`${DESK}/${DIA}_1540_prompt_claude.md`), true);
  assert.equal(esPetorreta(`${DESK}/02_investigacio_ia/${DIA}_1540_prompt_claude.md`), false);
  assert.equal(esPetorreta(`${DESK}/${DIA}_1540_auditoria_claude.md`), false);
});
