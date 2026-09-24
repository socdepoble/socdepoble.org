/** Proves de la porta Olivera v2 (laboratori 260924_1700_tractors_claude).
 *
 *  Cada prova fixa la conducta que va fallar el 260924 amb el prompt 1540: dos
 *  prompts del mateix dia damunt la taula, la Safata invisible i una casella
 *  «[x]» que ningú contrastava. Quan la v2 s'instal·le a tooling/gates, la
 *  primera ruta de CANDIDATS deixarà d'existir i la prova carregarà la instal·lada.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CANDIDATS = [
  '../_wiki_de_poble/04_escriptori/02_investigacio_ia/260924_1700_tractors_claude/gates/porta-olivera.mjs',
  '../tooling/gates/porta-olivera.mjs'
];
const modul = CANDIDATS.find((p) => fs.existsSync(new URL(p, import.meta.url)));
const { checkOlivera, ranci, rancisDeSessio, safata, caselles, segellDeSessio, avui, esPetorreta } = await import(modul);

const DESK = '_wiki_de_poble/04_escriptori';
const DIA = avui();

function mas(t) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-olivera-v2-'));
  fs.mkdirSync(path.join(arrel, DESK), { recursive: true });
  fs.mkdirSync(path.join(arrel, '.agents/runtime/turns'), { recursive: true });
  fs.writeFileSync(path.join(arrel, DESK, '00_index_escriptori.md'), '# Índex\n');
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  return arrel;
}
const posa = (arrel, nom, text = '# prova\n') => fs.writeFileSync(path.join(arrel, DESK, nom), text);
const ancora = (arrel, ...noms) => fs.appendFileSync(path.join(arrel, DESK, '00_index_escriptori.md'), noms.map((n) => `- [[${n.replace(/\.md$/, '')}]]\n`).join(''));

const PETORRETA = (reflex = 'sdp:torn_11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222') => `---
type: prompt
reflex: ${reflex}
---
# Prompt

## 0. Abans de generar (per a l'autor, no per al destinatari)

- [x] **Escriptori classificat**: tot ancorat.
- [x] **Pla d'Implementació** escrit.
- [x] **Rebut obtingut** per a este fitxer.

## Registre
`;

test('rancisDeSessio: un prompt anterior del MATEIX dia és brossa quan s\'escriu el següent', (t) => {
  const arrel = mas(t);
  posa(arrel, `${DIA}_1500_prompt_claude.md`);
  posa(arrel, `${DIA}_1505_auditoria_claude.md`);
  posa(arrel, `${DIA}_1540_pla_implementacio_claude.md`);
  posa(arrel, `${DIA}_1540_prompt_claude.md`);
  assert.deepEqual(ranci(arrel, DIA), [], 'per jornada no hi ha res: tot és de hui');
  const noms = rancisDeSessio(arrel, { fitxer: `${DESK}/${DIA}_1540_prompt_claude.md` }).map((d) => d.nom).sort();
  assert.deepEqual(noms, [`${DIA}_1500_prompt_claude.md`, `${DIA}_1505_auditoria_claude.md`]);
});

test('els plans són pissarra: no caduquen per sessió, i el segell de sessió és el del pla més recent', (t) => {
  const arrel = mas(t);
  posa(arrel, `${DIA}_0900_pla_implementacio_a.md`);
  posa(arrel, `${DIA}_1200_pla_implementacio_b.md`);
  posa(arrel, `${DIA}_1000_auditoria_x.md`);
  assert.equal(segellDeSessio(arrel), `${DIA}_1200`);
  assert.deepEqual(rancisDeSessio(arrel).map((d) => d.nom), [`${DIA}_1000_auditoria_x.md`]);
});

test('la Safata d\'Entrada compta, amb qualsevol caixa de nom i qualsevol extensió', (t) => {
  const arrel = mas(t);
  fs.mkdirSync(path.join(arrel, DESK, '00_Bandeja_d_Entrada'));
  fs.writeFileSync(path.join(arrel, DESK, '00_Bandeja_d_Entrada/nota.txt'), 'x');
  fs.writeFileSync(path.join(arrel, DESK, '00_Bandeja_d_Entrada/.DS_Store'), 'x');
  const s = safata(arrel);
  assert.equal(s.carpeta, `${DESK}/00_Bandeja_d_Entrada`);
  assert.deepEqual(s.elements, ['nota.txt']);
  const r = checkOlivera(arrel);
  assert.ok(r.errors.some((e) => /Safata d'entrada amb 1 element/.test(e)));
});

test('caselles: llig etiqueta i estat de cada casella de la secció 0', () => {
  const c = caselles(PETORRETA());
  assert.deepEqual(c.map((x) => [x.etiqueta, x.marcada]), [
    ['Escriptori classificat', true], ['Pla d\'Implementació', true], ['Rebut obtingut', true]
  ]);
  assert.equal(caselles('# res\n\n## Registre\n'), null);
});

test('una casella marcada en fals és un error propi: la porta contrasta, no es fia', (t) => {
  const arrel = mas(t);
  const fitxer = `${DESK}/${DIA}_1540_prompt_claude.md`;
  posa(arrel, `${DIA}_1500_prompt_claude.md`);
  posa(arrel, `${DIA}_1540_pla_implementacio_claude.md`);
  posa(arrel, `${DIA}_1540_prompt_claude.md`, PETORRETA());
  ancora(arrel, `${DIA}_1500_prompt_claude.md`, `${DIA}_1540_pla_implementacio_claude.md`, `${DIA}_1540_prompt_claude.md`);
  const r = checkOlivera(arrel, { contingut: PETORRETA(), fitxer });
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => /torns anteriors d'esta jornada/.test(e)), 'detecta el 1500');
  assert.ok(r.errors.some((e) => /Escriptori classificat» marcada en fals/.test(e)), 'i acusa la casella');
  assert.ok(r.errors.some((e) => /Rebut obtingut» marcada en fals: el torn torn_1111/.test(e)), 'el rebut inventat també');
});

test('amb la taula neta, el pla del mateix segell i un rebut real, la petorreta passa', (t) => {
  const arrel = mas(t);
  const fitxer = `${DESK}/${DIA}_1540_prompt_claude.md`;
  const torn = 'torn_11111111-1111-4111-8111-111111111111', rebut = '22222222-2222-4222-8222-222222222222';
  fs.writeFileSync(path.join(arrel, '.agents/runtime/turns', `${torn}.json`), JSON.stringify({ turn_id: torn, receipts: { [rebut]: { id: rebut, file: fitxer } } }));
  posa(arrel, `${DIA}_1540_pla_implementacio_claude.md`);
  ancora(arrel, `${DIA}_1540_pla_implementacio_claude.md`, `${DIA}_1540_prompt_claude.md`);
  // El fitxer encara no és al disc (és el Write que la porta jutja): la seua àncora no és cap fantasma.
  const r = checkOlivera(arrel, { contingut: PETORRETA(`sdp:${torn}:${rebut}`), fitxer });
  assert.deepEqual(r.errors, []);
  assert.equal(r.valid, true);
});

test('pla i petorreta han de compartir el segell termodinàmic', (t) => {
  const arrel = mas(t);
  const fitxer = `${DESK}/${DIA}_1540_prompt_claude.md`;
  posa(arrel, `${DIA}_1535_pla_implementacio_claude.md`);
  ancora(arrel, `${DIA}_1535_pla_implementacio_claude.md`, `${DIA}_1540_prompt_claude.md`);
  const r = checkOlivera(arrel, { fitxer });
  assert.ok(r.errors.some((e) => /Cap Pla d'Implementació amb el segell/.test(e)));
});

test('compatibilitat v1: esPetorreta i ranci per jornada no canvien', (t) => {
  const arrel = mas(t);
  posa(arrel, '260101_0900_prompt_vell.md');
  assert.deepEqual(ranci(arrel, DIA).map((d) => d.nom), ['260101_0900_prompt_vell.md']);
  assert.equal(esPetorreta(`${DESK}/${DIA}_1540_prompt_claude.md`), true);
  assert.equal(esPetorreta(`${DESK}/02_investigacio_ia/${DIA}_1540_prompt_claude.md`), false);
  assert.equal(esPetorreta(`${DESK}/${DIA}_1540_auditoria_claude.md`), false);
});
