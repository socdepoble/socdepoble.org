/** Proves del sistema nerviós: higiene de l'Olivera, segell, despertar i watcher.
 *
 *  Cada prova fixa una conducta que ja ha fallat de veres al Mas, no una
 *  hipòtesi: el segell trencat per un `.DS_Store`, l'ESTAT llegit pel bloc de
 *  baix mentre s'escriu a dalt, el watcher filtrant l'Escriptori cap a l'app i
 *  la petorreta que ix sense Pla ni escriptori classificat.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { checkOlivera, esPetorreta, ranci, plaDeHui, destiDeShell, avui } from '../tooling/gates/porta-olivera.mjs';
import { calculaSegell, verificaSegell } from '../tooling/gates/segella.mjs';
import { tocaSkill } from '../tooling/gates/segell-auto.mjs';
import { estatActual } from '../tooling/brain/despertar.mjs';
import { dinsAmbit } from '../tooling/vite/wiki-watcher.mjs';
import { encamina } from '../tooling/session/persona_router.mjs';

const DIA = avui();

function mas(t) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-nervios-'));
  fs.mkdirSync(path.join(arrel, '_wiki_de_poble/04_escriptori'), { recursive: true });
  fs.mkdirSync(path.join(arrel, '.agents/skills/core-prova'), { recursive: true });
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  return arrel;
}
const posa = (arrel, nom, text = '# prova\n') =>
  fs.writeFileSync(path.join(arrel, '_wiki_de_poble/04_escriptori', nom), text);

/* ── Porta Olivera ────────────────────────────────────────────────────────── */

test('la petorreta es reconeix pel nom i només dins de l’Escriptori', () => {
  assert.equal(esPetorreta('_wiki_de_poble/04_escriptori/260923_1340_prompt_implementacio_claude.md'), true);
  assert.equal(esPetorreta('_wiki_de_poble/04_escriptori/260923_1310_auditoria_claude.md'), false);
  assert.equal(esPetorreta('_wiki_de_poble/04_escriptori/02_investigacio_ia/260923_1340_prompt_x.md'), false);
  assert.equal(esPetorreta('_wiki_de_poble/10_actes/260923_1340_prompt_x.md'), false);
});

test('sense Pla de hui la porta bloqueja, i amb Pla i taula neta passa', (t) => {
  const arrel = mas(t);
  posa(arrel, `${DIA}_1400_prompt_prova_claude.md`);
  const contingut = "## 0. Abans de generar (per a l'autor, no per al destinatari)\n- [x] fet\n";

  const sensePla = checkOlivera(arrel, { contingut, dia: DIA });
  assert.equal(sensePla.valid, false);
  assert.match(sensePla.errors.join('\n'), /Pla d'Implementació de hui/);

  posa(arrel, `${DIA}_1245_pla_implementacio_prova.md`);
  assert.equal(plaDeHui(arrel, DIA).length, 1);
  assert.equal(checkOlivera(arrel, { contingut, dia: DIA }).valid, true);
});

test('un document de jornada anterior manté la porta tancada', (t) => {
  const arrel = mas(t);
  posa(arrel, `${DIA}_1245_pla_implementacio_prova.md`);
  posa(arrel, '260101_0900_auditoria_vella.md');
  const r = checkOlivera(arrel, { contingut: "## 0. Abans de generar (per a l'autor)\n- [x] fet\n", dia: DIA });
  assert.equal(r.valid, false);
  assert.match(r.errors.join('\n'), /Escriptori sense classificar/);
  assert.deepEqual(ranci(arrel, DIA).map((d) => d.nom), ['260101_0900_auditoria_vella.md']);
});

test('la secció 0 ha d’existir i no pot dur caselles a mitges', (t) => {
  const arrel = mas(t);
  posa(arrel, `${DIA}_1245_pla_implementacio_prova.md`);
  const sense = checkOlivera(arrel, { contingut: '## Tasques\n\nfes coses\n', dia: DIA });
  assert.match(sense.errors.join('\n'), /0\. Abans de generar/);
  const mitges = checkOlivera(arrel, { contingut: "## 0. Abans de generar (x)\n- [ ] pendent\n", dia: DIA });
  assert.match(mitges.errors.join('\n'), /caselles sense marcar/);
});

test('una redirecció de shell cap a una petorreta també entra per la porta', () => {
  assert.ok(destiDeShell('cat <<EOF > _wiki_de_poble/04_escriptori/260923_1400_prompt_x_claude.md'));
  assert.ok(destiDeShell("printf x | tee '_wiki_de_poble/04_escriptori/260923_1400_prompt_x_claude.md'"));
  assert.equal(destiDeShell('echo hola > /tmp/res.txt'), null);
  assert.equal(destiDeShell('ls -la'), null);
});

/* ── Llei Z ───────────────────────────────────────────────────────────────── */

test('el segell cobrix les regles i deixa fora el que no ho és', (t) => {
  const arrel = mas(t);
  const skill = path.join(arrel, '.agents/skills/core-prova/SKILL.md');
  fs.writeFileSync(skill, '# regla\n');
  const net = calculaSegell(arrel);
  assert.deepEqual(net.files, ['.agents/skills/core-prova/SKILL.md']);

  fs.writeFileSync(path.join(arrel, '.agents/skills/.DS_Store'), 'brossa del Finder');
  const ambBrossa = calculaSegell(arrel);
  assert.equal(ambBrossa.hash, net.hash, 'obrir la carpeta al Finder no pot trencar el segell');
  assert.deepEqual(ambBrossa.ignorats, ['.agents/skills/.DS_Store']);

  verificaSegell(arrel, { update: true });
  assert.equal(verificaSegell(arrel).ok, true);
  fs.writeFileSync(skill, '# regla canviada per fora\n');
  assert.equal(verificaSegell(arrel).ok, false, 'un canvi de regla sí que ha de trencar el segell');
});

test('el resegellat automàtic només mira la superfície de les skills', () => {
  assert.equal(tocaSkill('.agents/skills/sdp-workflow/SKILL.md'), true);
  assert.equal(tocaSkill('.agents/skills/.DS_Store'), false);
  assert.equal(tocaSkill('src/app/App.jsx'), false);
  assert.equal(tocaSkill(null), false);
});

/* ── Despertar ────────────────────────────────────────────────────────────── */

test('l’ESTAT es llig per la primera capçalera de dalt, no pel bloc de baix', () => {
  const estat = [
    '# ESTAT DE LA SESSIÓ',
    '',
    '## ESTAT_ACTUAL · 260923_1310 · Claude · fresc',
    '',
    '- relleu nou',
    '',
    '## ESTAT_ACTUAL · 260922_2225 · Codex · vell',
    '',
    '- relleu vell',
    '',
    '<!-- SDP:ESTAT_ACTUAL -->',
    'bloc fossilitzat de fa catorze hores',
    '<!-- /SDP:ESTAT_ACTUAL -->'
  ].join('\n');
  const r = estatActual(estat);
  assert.equal(r.origen, 'capcalera');
  assert.equal(r.segell, '260923_1310');
  assert.match(r.text, /relleu nou/);
  assert.doesNotMatch(r.text, /relleu vell|fossilitzat/);
});

test('sense capçaleres, el bloc delimitat encara servix de reserva', () => {
  const r = estatActual('# ESTAT\n\n<!-- SDP:ESTAT_ACTUAL -->\nreserva\n<!-- /SDP:ESTAT_ACTUAL -->\n');
  assert.equal(r.origen, 'bloc');
  assert.equal(r.text, 'reserva');
});

/* ── Watcher ──────────────────────────────────────────────────────────────── */

test('el watcher hereta l’àmbit del compilador i no l’amplia', () => {
  const arrel = '/mas';
  assert.equal(dinsAmbit(arrel, '/mas/_wiki_de_poble/01_ser/01_identitat.md'), true);
  assert.equal(dinsAmbit(arrel, '/mas/_wiki_de_poble/03_actuar/plantilles/acta.md'), true);
  assert.equal(dinsAmbit(arrel, '/mas/_wiki_de_poble/00_index.md'), true);
  assert.equal(dinsAmbit(arrel, '/mas/_wiki_de_poble/04_escriptori/260923_1310_auditoria_claude.md'), false);
  assert.equal(dinsAmbit(arrel, '/mas/_wiki_de_poble/90_arxiu_historic/qualsevol.md'), false);
  assert.equal(dinsAmbit(arrel, '/mas/_wiki_de_poble/01_ser/.DS_Store'), false);
  assert.equal(dinsAmbit(arrel, '/mas/src/app/App.jsx'), false);
  assert.equal(dinsAmbit(arrel, '/altre/_wiki_de_poble/01_ser/x.md'), false);
});

/* ── Router cognitiu ──────────────────────────────────────────────────────── */

test('triggers_on encamina, i les skills del nucli també es nomenen', () => {
  const index = {
    core: [{ name: 'wiki-documentacio-i-reflex', path: '.agents/skills/wiki-documentacio-i-reflex/SKILL.md', triggers_on: ['petorreta'] }],
    plugins: { 'sdp-universal-page': { name: 'sdp-universal-page', path: '.agents/skills/sdp-universal-page/SKILL.md', triggers_on: ['UniversalPage'] } }
  };
  const carregades = new Set(['.agents/skills/wiki-documentacio-i-reflex/SKILL.md']);
  const r = encamina('fem una petorreta per a codex', index, { carregades });
  assert.deepEqual(r.map((s) => s.name), ['wiki-documentacio-i-reflex']);
  assert.equal(r[0].jaAlContext, true);
  assert.equal(encamina('hola', index, { carregades }).length, 0);
  assert.equal(encamina('toca la universalpage', index).length, 1);
});
