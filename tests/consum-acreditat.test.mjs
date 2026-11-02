/** Proves del detector de consum acreditat (P2-12 · B10 marató 261101_2143).
 *
 *  Port de `tests/porta-olivera-consumits.test.mjs` del pegat de Claude 261025_1705. Cada prova
 *  fixa una fallada observada el 261025, no una hipòtesi:
 *    · entre les 15:45 i les 15:53Z la taula tenia l'onada 0545 (consolidada al commit
 *      b842160ac i destil·lada a l'acta 1600) i l'onada nova 1645 alhora, i la porta eixia
 *      amb 0: `ranci()` només mira jornades anteriors, i draft-write declara viu, sense
 *      motiu, cada document que naix;
 *    · el primer esborrany aparellava cada auditoria amb el prompt més pròxim en el temps,
 *      marcava com a consumit el pla vigent durant el relleu pendent d'un `--renomena`, i
 *      llegia com a consum actes que citaven el document per a dir que encara era viu;
 *    · Codex (261025_1701, C1645-02): la caducitat i una onada nova són triatge, no prova de
 *      consum; el consum acreditat porta consumidor, commit i hash.
 *  Es lleven els casos que movien fitxers (`--arxiva --consumits`): el detector només llig, i
 *  arxivar és `porta-olivera.mjs --arxiva --nom` (L08). S'hi afigen les fronteres de B10: la
 *  porta no crida el detector, el CLI ix amb 0 en fase «avis» i cap lectura canvia res.
 *  Totes les fixtures viuen a os.tmpdir(): cap prova toca l'Escriptori real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { candidatsConsum, capDeGit, citesEnActa, main, textCandidat, FORMES, ESQUEMA } from '../tooling/documental/consum-acreditat.mjs';
import { checkEscriptori, checkTancament, checkTaula, ranci, avui } from '../tooling/gates/porta-olivera.mjs';

const MODUL = fileURLToPath(new URL('../tooling/documental/consum-acreditat.mjs', import.meta.url));
const PORTA = fileURLToPath(new URL('../tooling/gates/porta-olivera.mjs', import.meta.url));
const DESK = '_wiki_de_poble/04_escriptori';
const ARXIU = '_wiki_de_poble/90_arxiu_historic';
const ACTES = '_wiki_de_poble/10_actes';
const TORNS = '.agents/runtime/turns';
const DIA = avui();
// Una jornada que sempre és anterior a hui.
const VELL = '250101';
const PASSAT = () => new Date(Date.now() - 3600e3).toISOString();
const FUTUR = () => new Date(Date.now() + 3600e3).toISOString();

function mas(t, linies = ['# Índex', '', '## Activitat en curs', '']) {
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-consum-acreditat-')));
  fs.mkdirSync(path.join(arrel, DESK), { recursive: true });
  fs.writeFileSync(path.join(arrel, DESK, '00_index_escriptori.md'), `${linies.join('\n')}\n`);
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  return arrel;
}
const escriu = (arrel, rel, text) => {
  fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
  fs.writeFileSync(path.join(arrel, rel), text);
};
const rel = (nom) => `${DESK}/${nom}.md`;
/** Un document solt de la taula: frontmatter amb el rebut, si en té, i les àncores que cita. */
const posa = (arrel, nom, { reflex = null, cita = [], text = '' } = {}) => {
  const fm = reflex ? `---\ntype: informe\nreflex: sdp:${reflex.torn}:${reflex.rebut}\n---\n` : '';
  escriu(arrel, rel(nom), `${fm}# ${nom}\n${text}\n## Vincles\n${cita.map((c) => `- [[${c}]]`).join('\n')}\n`);
};
/** Registre de torn mínim, amb el que llig la porta: schema, turn_id, state, expiresAt i rebuts. */
function registre(arrel, { id = `torn_${crypto.randomUUID()}`, state = 'planned', expiresAt = FUTUR(), rebuts = {} } = {}) {
  const receipts = Object.fromEntries(Object.entries(rebuts).map(([rebut, file]) => [rebut, { id: rebut, file }]));
  escriu(arrel, `${TORNS}/${id}.json`, JSON.stringify({ schema: 'sdp.turn.v1', turn_id: id, state, expiresAt, receipts, history: [] }));
  return id;
}
/** Un torn amb un sol rebut per a `file`: el `{ torn, rebut }` que du el frontmatter. */
const torn = (arrel, { file = null, ...resta } = {}) => {
  const rebut = crypto.randomUUID();
  return { torn: registre(arrel, { ...resta, rebuts: file ? { [rebut]: file } : {} }), rebut };
};
const afig = (arrel, linies) => {
  const f = path.join(arrel, DESK, '00_index_escriptori.md');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('## Activitat en curs\n\n', `## Activitat en curs\n\n${linies.join('\n')}\n`));
};
const noms = (llista) => llista.map((d) => d.nom.replace(/\.md$/, '')).sort();
const classes = (llista) => Object.fromEntries(llista.map((d) => [d.nom.replace(/\.md$/, ''), d.classe]));
const blob = (abs) => {
  const bytes = fs.readFileSync(abs);
  return crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
};
/**
 * HEAD fingit: els camins donats, amb el blob que tenen ara al disc. Cada acta de la llista es va
 * consolidar al mateix commit, amb els documents tal com estan ara (`versioEn` de capDeGit).
 */
const headDe = (arrel, rels, commit = 'abc1234') => {
  const blobs = new Map(rels.map((r) => [r, blob(path.join(arrel, r))]));
  return { commit, blobs, versioEn: (acta, doc) => (blobs.has(acta) ? { commit, blob: blobs.get(doc) ?? null } : null) };
};
const fase = (arrel, f) => escriu(arrel, '.agents/olivera-fase.json', JSON.stringify({ fase: f }));
const senseGit = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
const cli = (arrel, args = []) => spawnSync(process.execPath, [MODUL, ...args], { cwd: arrel, env: { ...senseGit(), SDP_ARREL: arrel }, encoding: 'utf8', timeout: 20000 });
const git = (arrel, args) => spawnSync('git', ['-C', arrel, '-c', 'user.email=prova@mas', '-c', 'user.name=prova', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args], { encoding: 'utf8', env: senseGit() });
const hiHaGit = () => spawnSync('git', ['--version'], { encoding: 'utf8' }).status === 0;
/** Empremta de tots els fitxers de la fixture (amb `.git` si `ambGit`): cap lectura no pot canviar-la. */
function empremta(arrel, { ambGit = false } = {}) {
  const h = crypto.createHash('sha256');
  const passa = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) { if (ambGit || e.name !== '.git') passa(abs); continue; }
      h.update(path.relative(arrel, abs)).update('\0').update(fs.readFileSync(abs));
    }
  };
  passa(arrel);
  return h.digest('hex');
}
/** Sortida capturada per a `main`. */
function captura() {
  const out = [];
  const err = [];
  return { out, err, sortida: { log: (s) => out.push(String(s)), error: (s) => err.push(String(s)) } };
}

/* ── La reproducció del 261025 ─────────────────────────────────────────────── */

const R = {
  pla0545: '261025_0545_pla_implementacio_destil_llibre_mestre_dafo_i_xat_fluid',
  prompt0545: '261025_0545_prompt_claude_gemini_codex_destil_llibre_mestre_dafo_i_xat_fluid',
  gemini0545: '261025_0545_auditoria_gemini',
  codex0607: '261025_0607_auditoria_codex',
  claude0610: '261025_0610_auditoria_claude',
  pla1645: '261025_1645_pla_implementacio_habitabilitat_mas_xat_total_i_excelencia_10',
  prompt1645: '261025_1645_prompt_claude_gemini_codex_habitabilitat_mas_xat_total_i_excelencia_10',
  gemini1645: '261025_1645_auditoria_gemini',
  codex1701: '261025_1701_auditoria_codex',
  claude1705: '261025_1705_auditoria_claude',
  acta1600: '261025_1600_acta_marmota_triomf_gauntlet_loop_xat_fluid_i_blindatge_wp',
  llibre: '03_llibre_mestre_tasques_i_idees',
};
const ONADA_0545 = [R.gemini0545, R.pla0545, R.prompt0545, R.codex0607, R.claude0610];
/** Els torns del 261025 amb la caducitat que tenien, i el rebut de cada document. */
const T = {
  d2064380: { id: 'torn_d2064380-5e68-4ccd-b020-35786a3a9eb4', expiresAt: '2026-10-26T04:38:47.634Z', rebuts: { [R.gemini0545]: '22137987-14c0-4f51-bbfc-45c5a3afbb77', [R.pla0545]: 'ed06aebf-f0a4-4810-841b-c2d7a12cdccc', [R.prompt0545]: '7fbecd87-e8f3-4eaf-8273-f8c75a2c1e8b' } },
  ae5b86cb: { id: 'torn_ae5b86cb-4310-4371-9b53-d3e72e4db719', expiresAt: '2026-10-26T05:07:27.376Z', rebuts: { [R.codex0607]: 'befae8c7-830d-4c59-b79d-c9f2d253d8b3' } },
  t08793431: { id: 'torn_08793431-2505-4da7-8248-15e373802748', expiresAt: '2026-10-25T20:54:55.223Z', rebuts: { [R.claude0610]: '0852911a-9696-4449-954b-d662ed2156e4', [R.claude1705]: '760d0870-d139-4aa6-8b83-46ad14a13c54' } },
  c9b5ca96: { id: 'torn_c9b5ca96-83cd-472e-b7c6-fd0f8f56c69c', expiresAt: '2026-10-26T15:40:10.683Z', rebuts: { [R.pla1645]: 'f6b152fd-5a34-47b7-a7a6-1ec8a0e68ded', [R.prompt1645]: '2fd481dc-d405-40b3-ba17-a23dd25995db' } },
  a30045fb: { id: 'torn_a30045fb-cee2-4c83-b722-11b923670a69', expiresAt: '2026-10-26T15:59:59.270Z', rebuts: { [R.gemini1645]: 'a37f5ac0-f1f1-4438-b9c3-e2fb5b3c4dcd' } },
  t05675b07: { id: 'torn_05675b07-b173-48d1-a4a7-f8c4a8848419', expiresAt: '2026-10-26T16:00:56.813Z', rebuts: { [R.codex1701]: '30dd4e48-c394-443e-91d1-e40d15998838' } },
};
const reflexDe = (nom) => {
  const t = Object.values(T).find((x) => x.rebuts[nom]);
  return { torn: t.id, rebut: t.rebuts[nom] };
};
/** Els registres de torn, amb cada rebut on diu `on(nom)` (la taula, o l'arxiu després del relleu). */
const torns261025 = (arrel, on = (nom) => rel(nom)) => {
  for (const t of Object.values(T)) {
    registre(arrel, { id: t.id, state: 'context_loaded', expiresAt: t.expiresAt, rebuts: Object.fromEntries(Object.entries(t.rebuts).map(([nom, rebut]) => [rebut, on(nom)])) });
  }
};
const ARA_1550 = Date.parse('2026-10-25T15:50:00Z');

/**
 * L'Escriptori entre les 15:45 i les 15:53Z: l'índex i l'onada 0545 de b842160ac, l'acta 1600
 * (al mateix commit) que nomena les tres auditories, i el pla i el prompt 1645 acabats de
 * nàixer, declarats per draft-write sense motiu i encara fora del commit.
 */
function replay261025(t) {
  const arrel = mas(t, ['# Índex', '', '## Activitat en curs', '',
    ...[R.prompt1645, R.pla1645, R.claude0610, R.gemini0545, R.codex0607, R.prompt0545, R.pla0545].map((n) => `- [[${n}]]`),
    `- [[${R.llibre}]] · Mestre 261021: Llibre Mestre permanent`, '']);
  torns261025(arrel);
  escriu(arrel, `${DESK}/${R.llibre}.md`, '# Llibre Mestre\n');
  const auditories = [R.gemini0545, R.codex0607, R.claude0610];
  for (const n of auditories) posa(arrel, n, { reflex: reflexDe(n), cita: [...auditories.filter((x) => x !== n), R.prompt0545, R.pla0545, R.llibre, '00_index_escriptori'] });
  posa(arrel, R.pla0545, { reflex: reflexDe(R.pla0545), cita: ['00_index_escriptori'] });
  posa(arrel, R.prompt0545, { reflex: reflexDe(R.prompt0545), cita: ['00_index_escriptori'] });
  escriu(arrel, `${ACTES}/${R.acta1600}.md`, `# Acta Marmota\n\n- Codex: \`${R.codex0607}.md\`.\n- Claude: \`${R.claude0610}.md\`.\n- Gemini: \`${R.gemini0545}.md\`.\n`);
  const head = headDe(arrel, [...ONADA_0545.map(rel), rel(R.llibre), `${ACTES}/${R.acta1600}.md`], 'b842160ac');
  posa(arrel, R.pla1645, { reflex: reflexDe(R.pla1645), cita: [R.acta1600, R.llibre] });
  posa(arrel, R.prompt1645, { reflex: reflexDe(R.prompt1645), cita: [R.pla1645, R.acta1600, R.llibre] });
  return { arrel, head };
}

test('[261025 replay] entre les 15:45 i les 15:53Z hi ha exactament cinc candidats, els de l’onada 0545; les tres auditories que nomena l’acta 1600 tenen consum acreditat', (t) => {
  const { arrel, head } = replay261025(t);
  // La porta no en veia cap: d'avui i declarats.
  assert.deepEqual(ranci(arrel, '261025'), []);
  assert.equal(checkTaula(arrel, { dia: '261025' }).valid, true);

  const c = candidatsConsum(arrel, { dia: '261025', ara: ARA_1550, head });
  assert.deepEqual(noms(c), [...ONADA_0545].sort(), 'res de l’onada 1645');
  assert.deepEqual(classes(c), {
    [R.gemini0545]: 'consumit', [R.codex0607]: 'consumit', [R.claude0610]: 'consumit',
    [R.pla0545]: 'senseVida', [R.prompt0545]: 'senseVida',
  });
  const codex = c.find((x) => x.nom === `${R.codex0607}.md`);
  assert.equal(codex.document, `${R.codex0607}.md`);
  assert.equal(codex.hash, blob(path.join(arrel, rel(R.codex0607))));
  assert.equal(codex.consumidor, `${ACTES}/${R.acta1600}.md`);
  assert.deepEqual(codex.provaDeConsum, {
    commit: 'b842160ac', head: 'b842160ac', blob: codex.hash, destillacio: `${ACTES}/${R.acta1600}.md`,
    blobDestillacio: head.blobs.get(`${ACTES}/${R.acta1600}.md`), cita: `- Codex: \`${R.codex0607}.md\`.`,
  });
  assert.match(codex.motiu, new RegExp(`CONS-C: onada superada pel pla ${R.pla1645}`));
  assert.match(codex.motiu, new RegExp(`CONS-D: els prompts que cita ja són a l'arxiu o candidats \\(${R.prompt0545}\\)`));
  assert.ok(c.every((x) => x.declarat), 'declarats sense motiu: la declaració nua no protegix');
  const pla = c.find((x) => x.nom === `${R.pla0545}.md`);
  assert.equal(pla.consumidor, null);
  assert.equal(pla.provaDeConsum, null, 'una onada nova és triatge: no acredita cap consum');
  assert.match(textCandidat(codex), new RegExp(`^\\[CONS\\] Consum acreditat, proposta d'arxiu: ${R.codex0607} .*node tooling/gates/porta-olivera\\.mjs --arxiva --sec --nom ${R.codex0607}\\.md \\[--torn ID\\]`));
  assert.doesNotMatch(textCandidat(codex), /--consumits/, 'el detector no proposa cap mode de la porta que no existix');
});

test('[B10 frontera] la porta Olivera no crida el detector: l’Escriptori, el tancament i l’informe no canvien amb cinc candidats damunt la taula', (t) => {
  const { arrel, head } = replay261025(t);
  assert.equal(candidatsConsum(arrel, { dia: '261025', ara: ARA_1550, head }).length, 5);
  const e = checkEscriptori(arrel, { dia: '261025', ara: ARA_1550 });
  assert.equal(e.valid, true, e.errors.join('\n'));
  assert.equal('candidats' in e, false);
  assert.deepEqual(e.avisos.filter((a) => a.includes('[CONS]')), []);
  for (const t2 of Object.values(T)) {
    const r = checkTancament(arrel, { torn: t2.id, dia: '261025', ara: ARA_1550 });
    assert.deepEqual([...r.errors, ...r.avisos].filter((x) => x.includes('[CONS]')), [], t2.id);
  }
  const font = fs.readFileSync(PORTA, 'utf8');
  assert.doesNotMatch(font, /consum-acreditat|candidatsConsum/, 'cap import ni crida del detector a la porta');
});

test('[261025 replay] amb el prompt 1645 en relleu pendent (15:41-15:45Z, el rebut encara al nom vell) el resultat és el mateix', (t) => {
  const { arrel, head } = replay261025(t);
  const f = path.join(arrel, TORNS, `${T.c9b5ca96.id}.json`);
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  r.receipts[T.c9b5ca96.rebuts[R.prompt1645]].file = `${DESK}/261025_1645_prompt_gemini_codex_habitabilitat_mas_xat_total_i_excelencia_10.md`;
  fs.writeFileSync(f, JSON.stringify(r));
  assert.deepEqual(noms(candidatsConsum(arrel, { dia: '261025', ara: Date.parse('2026-10-25T15:43:00Z'), head })), [...ONADA_0545].sort());
});

test('[261025 replay] l’onada 1645 de l’arbre viu no té cap candidat, tampoc amb un micro_prompt lateral a l’arxiu ni quan caduca el torn de Claude', (t) => {
  const arrel = mas(t, ['# Índex', '', '## Activitat en curs', '',
    `- [[${R.claude1705}]]`,
    `- [[${R.codex1701}]] · per a [[${R.pla1645}]]`,
    ...[R.gemini1645, R.prompt1645, R.pla1645].map((n) => `- [[${n}]]`),
    `- [[${R.llibre}]] · Mestre 261021: Llibre Mestre permanent`, '']);
  // L'onada 0545 ja és a l'arxiu i els seus rebuts hi apunten (handoff de les 15:53Z).
  const arxivats = new Set(ONADA_0545);
  torns261025(arrel, (nom) => (arxivats.has(nom) ? `${ARXIU}/${nom}.md` : rel(nom)));
  for (const n of ONADA_0545) escriu(arrel, `${ARXIU}/${n}.md`, `# ${n}\n`);
  escriu(arrel, `${ARXIU}/261025_1700_micro_prompt_codex_retoc.md`, '# una altra línia de treball\n');
  escriu(arrel, `${ACTES}/${R.acta1600}.md`, `# Acta\n\n\`${R.codex0607}.md\`\n`);
  escriu(arrel, `${DESK}/${R.llibre}.md`, '# Llibre Mestre\n');
  posa(arrel, R.pla1645, { reflex: reflexDe(R.pla1645), cita: [R.acta1600] });
  posa(arrel, R.prompt1645, { reflex: reflexDe(R.prompt1645), cita: [R.pla1645] });
  posa(arrel, R.gemini1645, { reflex: reflexDe(R.gemini1645), cita: [R.codex1701, R.prompt1645, R.pla1645, R.acta1600] });
  posa(arrel, R.codex1701, { reflex: reflexDe(R.codex1701), cita: [R.prompt1645, R.pla1645, R.gemini1645, R.acta1600] });
  // L'esquelet de Claude no cita cap prompt: sense associació provada, CONS-D no dispara.
  posa(arrel, R.claude1705, { reflex: reflexDe(R.claude1705), cita: ['00_index_escriptori'] });
  const head = headDe(arrel, [`${ACTES}/${R.acta1600}.md`, rel(R.llibre)], 'b842160ac');

  assert.deepEqual(candidatsConsum(arrel, { dia: '261025', ara: Date.parse('2026-10-25T17:30:00Z'), head }), []);
  // A les 21:30Z torn_08793431 ja ha caducat: la caducitat d'un document d'avui no el fa candidat.
  assert.deepEqual(candidatsConsum(arrel, { dia: '261025', ara: Date.parse('2026-10-25T21:30:00Z'), head }), []);
});

/* ── CONS-D · L'auditoria i el prompt que cita ─────────────────────────────── */

test('[261025 CONS-D] una auditoria s’aparella amb el prompt que cita, no amb el més pròxim en el temps', (t) => {
  const P = `${DIA}_1645_prompt_claude_habitabilitat`;
  const PLA = `${DIA}_1645_pla_implementacio_habitabilitat`;
  const arxivat = `${DIA}_0900_prompt_codex_revisio`;
  const lateral = `${DIA}_1700_micro_prompt_codex_retoc`;
  const A1 = `${DIA}_0930_auditoria_codex`;
  const A2 = `${DIA}_1705_auditoria_claude`;
  const A3 = `${DIA}_1710_auditoria_gemini`;
  const A4 = `${DIA}_1715_auditoria_dues`;
  const A5 = `${DIA}_1720_auditoria_comentari`;
  const arrel = mas(t);
  for (const n of [arxivat, lateral]) escriu(arrel, `${ARXIU}/${n}.md`, '# arxivat\n');
  afig(arrel, [PLA, P, A1, A2, A3, A4, A5].map((n) => `- [[${n}]]`));
  posa(arrel, PLA);
  posa(arrel, P, { cita: [PLA] });
  posa(arrel, A1, { cita: [`../90_arxiu_historic/${arxivat}|el prompt`] });
  posa(arrel, A2, { cita: [PLA, P] });
  // L'esquelet sense cap prompt citat, amb el micro_prompt lateral arxivat cinc minuts abans.
  posa(arrel, A3, { cita: ['00_index_escriptori'] });
  // Dos prompts citats: un d'ells encara viu a la taula.
  posa(arrel, A4, { text: `Respon a \`${arxivat}.md\`.\n`, cita: [P] });
  // El prompt arxivat només dins d'un comentari HTML: no és cap cita (N10C-ARB-03, MA10).
  posa(arrel, A5, { text: `<!-- Respon a \`${arxivat}.md\`. -->\n` });

  const c = candidatsConsum(arrel, { head: null });
  assert.deepEqual(noms(c), [A1]);
  assert.equal(c[0].senyals.find((s) => s.codi === 'CONS-D').text, `els prompts que cita ja són a l'arxiu o candidats (${arxivat})`);
});

/* ── CONS-A · El torn del rebut, i el relleu pendent ───────────────────────── */

test('[261025 CONS-A] el torn del rebut és triatge: tancat, rebut d’un altre fitxer o caducat en un document d’abans de hui', (t) => {
  const d = {
    tancat: `${DIA}_0900_auditoria_tancat`,
    altre: `${DIA}_0905_auditoria_altre`,
    caducatHui: `${DIA}_0910_auditoria_caducat_hui`,
    caducatVell: `${VELL}_0915_auditoria_caducat_vell`,
    obert: `${DIA}_0920_auditoria_obert`,
    senseRegistre: `${DIA}_0925_auditoria_sense_registre`,
  };
  const arrel = mas(t, ['# Índex', '', '## Activitat en curs', '',
    `- [[${d.caducatVell}]]`, `- [[${d.caducatHui}]]`, `- [[${d.obert}]]`, '',
    '## Altres enllaços', '', `- [[${d.tancat}]]`, `- [[${d.altre}]]`, `- [[${d.senseRegistre}]]`]);
  escriu(arrel, `${ARXIU}/${d.altre}.md`, '# la còpia a què apunta el rebut\n');
  posa(arrel, d.tancat, { reflex: torn(arrel, { state: 'closed', expiresAt: PASSAT(), file: rel(d.tancat) }) });
  posa(arrel, d.altre, { reflex: torn(arrel, { file: `${ARXIU}/${d.altre}.md` }) });
  posa(arrel, d.caducatHui, { reflex: torn(arrel, { expiresAt: PASSAT(), file: rel(d.caducatHui) }) });
  posa(arrel, d.caducatVell, { reflex: torn(arrel, { state: 'context_loaded', expiresAt: PASSAT(), file: rel(d.caducatVell) }) });
  posa(arrel, d.obert, { reflex: torn(arrel, { file: rel(d.obert) }) });
  posa(arrel, d.senseRegistre, { reflex: { torn: `torn_${crypto.randomUUID()}`, rebut: crypto.randomUUID() } });

  const c = candidatsConsum(arrel, { head: null });
  assert.deepEqual(noms(c), [d.caducatVell, d.altre, d.tancat].sort());
  assert.ok(c.every((x) => x.classe === 'senseVida' && x.provaDeConsum === null), 'cap estat de torn no prova la lectura');
  const motiu = (nom) => c.find((x) => x.nom === `${nom}.md`).motiu;
  assert.match(motiu(d.tancat), /^CONS-A: torn_[0-9a-f]{8} ja està tancat$/);
  assert.match(motiu(d.altre), new RegExp(`el rebut de torn_[0-9a-f]{8} és de ${ARXIU}/${d.altre}\\.md$`));
  assert.match(motiu(d.caducatVell), /ha caducat .* d'una jornada anterior/);
});

test('[261025 CONS-A] un registre que no és sdp.turn.v1 o un rebut amb un altre id no proven res; amb el schema i l’id bons, sí', (t) => {
  const E = `${DIA}_0900_auditoria_schema_estrany`;
  const I = `${DIA}_0905_auditoria_rebut_altre_id`;
  const arrel = mas(t);
  afig(arrel, [E, I].map((n) => `- [[${n}]]`));
  // Tancat, però amb un schema que no és el de turns.mjs: un registre il·legible no prova res (MA6).
  const tE = torn(arrel, { state: 'closed', expiresAt: PASSAT(), file: rel(E) });
  const fE = path.join(arrel, TORNS, `${tE.torn}.json`);
  const rE = JSON.parse(fs.readFileSync(fE, 'utf8'));
  fs.writeFileSync(fE, JSON.stringify({ ...rE, schema: 'sdp.turn.v0' }));
  posa(arrel, E, { reflex: tE });
  // Obert, i el rebut apunta a una còpia de l'arxiu, però el seu id no és el del frontmatter (MA11).
  escriu(arrel, `${ARXIU}/${I}.md`, '# la còpia a què apunta el rebut\n');
  const tI = torn(arrel, { file: `${ARXIU}/${I}.md` });
  const fI = path.join(arrel, TORNS, `${tI.torn}.json`);
  const rI = JSON.parse(fs.readFileSync(fI, 'utf8'));
  fs.writeFileSync(fI, JSON.stringify({ ...rI, receipts: { [tI.rebut]: { ...rI.receipts[tI.rebut], id: crypto.randomUUID() } } }));
  posa(arrel, I, { reflex: tI });
  assert.deepEqual(candidatsConsum(arrel, { head: null }), []);

  // El control: els mateixos registres, ben formats, són CONS-A.
  fs.writeFileSync(fE, JSON.stringify(rE));
  fs.writeFileSync(fI, JSON.stringify(rI));
  const c = candidatsConsum(arrel, { head: null });
  assert.deepEqual(noms(c), [E, I].sort());
  assert.ok(c.every((x) => x.senyals.length === 1 && x.senyals[0].codi === 'CONS-A'), JSON.stringify(c.map((x) => x.motiu)));
});

test('[261025 CONS-A] durant el relleu pendent d’un --renomena el pla vigent no és candidat', (t) => {
  // L'estat que deixa `porta-olivera.mjs --renomena 1640 --a 1645`, construït sense moure res:
  // el document ja du el nom nou i el rebut encara diu el vell, que ja no és a la taula.
  const VELL_PLA = `${DIA}_0545_pla_implementacio_vell`;
  const N1640 = `${DIA}_1640_pla_implementacio_definitiu`;
  const N1645 = `${DIA}_1645_pla_implementacio_definitiu`;
  const arrel = mas(t);
  afig(arrel, [`- [[${VELL_PLA}]]`, `- [[${N1645}]]`]);
  posa(arrel, VELL_PLA);
  const reflex = torn(arrel, { file: rel(N1640) });
  posa(arrel, N1645, { reflex });

  assert.deepEqual(noms(candidatsConsum(arrel, { head: null })), [VELL_PLA]);
  assert.match(candidatsConsum(arrel, { head: null })[0].motiu, new RegExp(`CONS-C: onada superada pel pla ${N1645}`));

  // Un rebut que apunta a un altre document present sí que és un senyal (triatge).
  const f = path.join(arrel, TORNS, `${reflex.torn}.json`);
  const reg = JSON.parse(fs.readFileSync(f, 'utf8'));
  reg.receipts[reflex.rebut].file = rel(VELL_PLA);
  fs.writeFileSync(f, JSON.stringify(reg));
  const c = candidatsConsum(arrel, { head: null });
  assert.deepEqual(noms(c), [N1645, VELL_PLA].sort());
  assert.equal(c.find((x) => x.nom === `${N1645}.md`).classe, 'senseVida');
});

test('[261025 CONS-A] el relleu pendent caduca amb el torn: un rebut al nom vell d’un torn tancat o caducat ja no amaga el document', (t) => {
  const PLA = `${DIA}_1600_pla_implementacio_nou`;
  const A = `${DIA}_0500_auditoria_codex`;
  const arrel = mas(t);
  afig(arrel, [A, PLA].map((n) => `- [[${n}]]`));
  posa(arrel, PLA);
  const vell = `${DESK}/${DIA}_0459_auditoria_codex.md`;
  const reflex = torn(arrel, { file: vell });
  posa(arrel, A, { reflex });
  assert.deepEqual(candidatsConsum(arrel, { head: null }), [], 'amb el torn obert, el relleu encara és possible');

  const f = path.join(arrel, TORNS, `${reflex.torn}.json`);
  const reg = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const [canvi, que] of [[{ state: 'closed' }, 'està tancat'], [{ state: 'context_loaded', expiresAt: PASSAT() }, 'ha caducat']]) {
    fs.writeFileSync(f, JSON.stringify({ ...reg, ...canvi }));
    const c = candidatsConsum(arrel, { head: null });
    assert.deepEqual(noms(c), [A], que);
    assert.equal(c[0].classe, 'senseVida');
    assert.match(c[0].motiu, new RegExp(`CONS-A: el rebut de torn_[0-9a-f]{8} encara diu ${vell}, que ja no és a la taula, i el torn ${que}: el relleu ja no es pot fer`));
  }
});

/* ── CONS-B · Homònims ─────────────────────────────────────────────────────── */

test('[261025 CONS-B] dues auditories de la mateixa IA no són homònimes: el títol que només diu la IA no substituïx res', (t) => {
  const arrel = mas(t);
  const docs = [`${DIA}_0607_auditoria_codex`, `${DIA}_1701_auditoria_codex`, `${DIA}_0610_auditoria_claude_gemini4`, `${DIA}_1705_auditoria_claude_gemini4`,
    `${DIA}_0629_informe_fantasmes_ui`, `${DIA}_0705_informe_fantasmes_ui`];
  afig(arrel, docs.map((n) => `- [[${n}]]`));
  for (const n of docs) posa(arrel, n);
  const c = candidatsConsum(arrel, { head: null });
  assert.deepEqual(noms(c), [`${DIA}_0629_informe_fantasmes_ui`], 'només l’informe amb títol propi té un substitut');
  assert.equal(c[0].motiu, `CONS-B: substituït per l'homònim ${DIA}_0705_informe_fantasmes_ui`);
});

/* ── Protecció · Només el motiu explícit ───────────────────────────────────── */

test('[261025 protecció] només un motiu explícit protegix: Mestre, torn obert o «per a» un consumidor que no siga candidat; un cicle de «per a» no en sosté cap', (t) => {
  const P2 = `${DIA}_1645_pla_implementacio_nou`;
  const X = `${DIA}_0500_auditoria_mestre`;
  const Y = `${DIA}_0505_auditoria_per_al_pla`;
  const Z1 = `${DIA}_0510_auditoria_cicle_u`;
  const Z2 = `${DIA}_0515_auditoria_cicle_dos`;
  const W = `${DIA}_0520_auditoria_nua`;
  const O = `${DIA}_0525_auditoria_torn_obert`;
  const C = `${DIA}_0530_auditoria_torn_tancat`;
  const arrel = mas(t);
  const obert = torn(arrel);
  const tancat = torn(arrel, { state: 'closed', expiresAt: PASSAT() });
  afig(arrel, [
    `- [[${P2}]]`,
    `- [[${X}]] · Mestre ${DIA}: la vull rellegir demà`,
    `- [[${Y}]] · per a [[${P2}]]`,
    `- [[${Z1}]] · per a [[${Z2}]]`,
    `- [[${Z2}]] · per a [[${Z1}]]`,
    `- [[${W}]]`,
    `- [[${O}]] · ${obert.torn}`,
    `- [[${C}]] · ${tancat.torn}`,
  ]);
  for (const n of [P2, X, Y, Z1, Z2, W, O, C]) posa(arrel, n);

  assert.deepEqual(noms(candidatsConsum(arrel, { head: null })), [C, W, Z1, Z2].sort());

  // Una onada més nova supera P2, i el seu «per a» ja no sosté Y.
  const P3 = `${DIA}_2100_pla_implementacio_mes_nou`;
  posa(arrel, P3);
  afig(arrel, [`- [[${P3}]]`]);
  assert.deepEqual(noms(candidatsConsum(arrel, { head: null })), [P2, C, W, Y, Z1, Z2].sort());
});

test('[261025 protecció] una retenció del Mestre amb data futura o amb menys de tres lletres de motiu no protegix, com a vidaDe de la porta', (t) => {
  const P2 = `${DIA}_1645_pla_implementacio_nou`;
  const F = `${DIA}_0500_auditoria_data_futura`;
  const S = `${DIA}_0505_auditoria_sense_motiu`;
  const B = `${DIA}_0510_auditoria_retinguda`;
  const arrel = mas(t);
  afig(arrel, [
    `- [[${P2}]]`,
    `- [[${F}]] · Mestre 991231: la rellegiré`,
    `- [[${S}]] · Mestre ${DIA}: ab`,
    // El control: la mateixa forma, d'avui i amb tres lletres de motiu, sí que protegix.
    `- [[${B}]] · Mestre ${DIA}: abc`,
  ]);
  for (const n of [P2, F, S, B]) posa(arrel, n);
  const c = candidatsConsum(arrel, { head: null });
  assert.deepEqual(noms(c), [F, S].sort());
  assert.ok(c.every((x) => x.motiu.startsWith(`CONS-C: onada superada pel pla ${P2}`)));
});

/* ── Acreditació · Consumidor, commit i hash ───────────────────────────────── */

test('[261025 acreditació] el consum acreditat vol una acta posterior que el cite pel nom i el document i l’acta a HEAD sense canvis', (t) => {
  const PLA = `${DIA}_1600_pla_implementacio_nou`;
  const A = `${DIA}_0900_auditoria_codex`;
  const ACTA = `${DIA}_1200_acta_marmota_tancament`;
  const arrel = mas(t);
  afig(arrel, [PLA, A].map((n) => `- [[${n}]]`));
  posa(arrel, PLA);
  posa(arrel, A);
  const acta = (text) => escriu(arrel, `${ACTES}/${ACTA}.md`, `# Acta\n\n${text}\n`);
  const cand = (head) => candidatsConsum(arrel, { head }).find((c) => c.nom === `${A}.md`);
  const head = () => headDe(arrel, [rel(A), `${ACTES}/${ACTA}.md`]);

  acta(`Lliurada [[${A}|l'auditoria de Codex]].`);
  assert.equal(cand(head()).classe, 'consumit', 'una àncora amb àlies cita');
  assert.equal(cand(head()).consumidor, `${ACTES}/${ACTA}.md`);

  acta(`Lliurada ${A} sense extensió ni àncora.`);
  assert.equal(cand(head()).classe, 'senseVida', 'un nom nu en prosa no és una cita');

  acta(`Lliurada \`${A}.md\`.`);
  assert.equal(cand(null).classe, 'senseVida');
  assert.match(cand(null).motiu, /el cita, però sense git a l’arrel la versió no es pot provar/);
  const consolidat = head();
  fs.appendFileSync(path.join(arrel, rel(A)), 'una línia després del commit\n');
  assert.match(cand(consolidat).motiu, /el document no és a HEAD sense canvis/);
  assert.equal(cand(head()).classe, 'consumit');
  assert.match(cand(headDe(arrel, [rel(A)])).motiu, /l’acta no és a HEAD sense canvis/);

  // L'acta consolidada deia «Pendents» i al disc, sense consolidar, ja diu «Lliurada»: la prova
  // apuntaria a la versió de HEAD, la que el mantenia viu (N10C-ARB-02).
  acta(`## Pendents\n\n- Que el Mestre rellija \`${A}.md\`.`);
  const ambPendent = head();
  assert.equal(cand(ambPendent).classe, 'senseVida', 'el control: l’acta de HEAD el manté viu');
  acta(`## Resultats\n\n- Lliurada \`${A}.md\`.`);
  assert.equal(cand(ambPendent).classe, 'senseVida');
  assert.equal(cand(ambPendent).provaDeConsum, null);
  assert.match(cand(ambPendent).motiu, /el cita, però l’acta no és a HEAD sense canvis/);
  assert.equal(cand(head()).classe, 'consumit', 'consolidada la versió nova, sí');

  // Una acta anterior al document no l'ha pogut destil·lar.
  fs.renameSync(path.join(arrel, ACTES, `${ACTA}.md`), path.join(arrel, ACTES, `${DIA}_0800_acta_marmota_anterior.md`));
  assert.equal(cand(headDe(arrel, [rel(A), `${ACTES}/${DIA}_0800_acta_marmota_anterior.md`])).classe, 'senseVida');
});

/**
 * Els tres falsos consums que la revisió va trobar en la història de la taula (261025): l'acta
 * posterior citava el document, però per a dir que encara era viu. Els textos són els de les
 * actes, retallats a la línia que el cita i a les seues capçaleres.
 */
const HISTORIA = [
  {
    doc: '261006_2358_prompt_claude_gestoria_i_reparacions',
    acta: `${ACTES}/261007_0025_acta_marmota.md`,
    text: (n) => `# Relleu a Claude i Resolució d'Incidències\n\n## Resultats\n\n- La gestoria ja compila.\n\n## Pendents\n\n- Passar el prompt de relleu \`${n}.md\` a Claude perquè inicie la propera marató.\n\n## Vincles\n- [[${n}]]\n`,
  },
  {
    doc: '261014_2035_auditoria_claude',
    acta: `${ACTES}/261014_2050_acta_marmota.md`,
    text: (n) => `# Acta Marmota · Relleu Vespertí Gestoria 3T, REA MCP i Escriptori Net\n\n## Resultats\n\n### 5. Gauntlet i Auditoria Adversarial Gestoria 3T\n\n- **Auditoria Claude:** En curs a [\`${n}.md\`](file:///Mas/_wiki_de_poble/04_escriptori/${n}.md).\n\n## Vincles\n- [[${n}]]\n`,
  },
  {
    doc: '261022_0150_auditoria_claude',
    acta: `${DESK}/261022_0235_acta_tancament_codex.md`,
    text: (n) => `# Acta Codex del Gauntlet: implementació, proves i límits de publicació\n\n## Pendents\n\nNo queda cap vigilància recurrent pròpia activa ni cap promesa de treball nocturn futura. El següent torn ha de partir d'esta acta i dels límits de [[${n}]], sense repetir l'onada ni reconstruir el paquet antic.\n\n## Vincles\n- [[${n}]]\n`,
  },
];

/** Un document de la història, declarat, superat per un pla posterior i citat per la seua acta. */
function historic(t, { doc, acta, text }) {
  const PLA = `${doc.slice(0, 6)}_2359_pla_implementacio_onada_nova`;
  const arrel = mas(t);
  afig(arrel, [doc, PLA, ...(acta.startsWith(DESK) ? [path.posix.basename(acta, '.md')] : [])].map((n) => `- [[${n}]]`));
  posa(arrel, doc);
  posa(arrel, PLA);
  escriu(arrel, acta, text(doc));
  return { arrel, head: () => headDe(arrel, [rel(doc), acta]) };
}

test('[261025 acreditació] una acta que el manté viu no acredita cap consum: els tres textos de la història (relleu, en curs, «el següent torn ha de partir de»)', (t) => {
  for (const cas of HISTORIA) {
    const { arrel, head } = historic(t, cas);
    const c = candidatsConsum(arrel, { dia: cas.doc.slice(0, 6), head: head() }).find((x) => x.nom === `${cas.doc}.md`);
    assert.equal(c.classe, 'senseVida', cas.doc);
    assert.equal(c.consumidor, null, cas.doc);
    assert.equal(c.provaDeConsum, null, cas.doc);
    assert.equal(c.cita.acta, cas.acta, cas.doc);
    assert.ok(c.cita.viu, cas.doc);
    assert.match(c.motiu, /el cita, però el manté viu: «/, cas.doc);
    assert.doesNotMatch(c.cita.linia, /^- \[\[/, `${cas.doc}: la línia de Vincles no és la que compta`);
  }

  // Amb el document ja lliurat, una acta de relleu (el títol) encara el passa al torn següent.
  const relleu = HISTORIA[1];
  let { arrel, head } = historic(t, { ...relleu, text: (n) => relleu.text(n).replace('En curs a', 'Lliurada a') });
  let c = candidatsConsum(arrel, { dia: '261014', head: head() }).find((x) => x.nom === `${relleu.doc}.md`);
  assert.equal(c.classe, 'senseVida');
  assert.match(c.motiu, /el manté viu: «- \*\*Auditoria Claude:\*\* Lliurada a .*» \(davall de «Acta Marmota · Relleu Vespertí/);

  // Una casella sense marcar és feina per fer, encara que la línia no diga «pendent» (261009_0745).
  const vell = '261009_0310_auditoria_claude';
  ({ arrel, head } = historic(t, { doc: vell, acta: `${ACTES}/261009_0745_acta_marmota.md`, text: (n) => `# Acta Marmota de la nit del 9 d'octubre, Onada 6 de Claude\n\n## Resultats\n\n### 3. Part Marmota\n\n1. \`[ ]\` Revisar l'auditoria [[${n}]] i fer el commit de les Onades 5 i 6.\n` }));
  c = candidatsConsum(arrel, { dia: '261009', head: head() }).find((x) => x.nom === `${vell}.md`);
  assert.equal(c.classe, 'senseVida');
  assert.equal(c.cita.viu, c.cita.linia);

  // L'acta del tercer cas, amb el document absorbit en lloc de pendent: llavors sí, i la línia
  // viatja amb la prova.
  const absorbit = HISTORIA[2];
  ({ arrel, head } = historic(t, { ...absorbit, text: (n) => absorbit.text(n).replace(/## Pendents\n\n.*\n/, `## Resultats\n\n- Absorbides al pla les reserves de [[${n}]].\n`) }));
  c = candidatsConsum(arrel, { dia: '261022', head: head() }).find((x) => x.nom === `${absorbit.doc}.md`);
  assert.equal(c.classe, 'consumit');
  assert.equal(c.consumidor, absorbit.acta);
  assert.equal(c.provaDeConsum.cita, `- Absorbides al pla les reserves de [[${absorbit.doc}]].`);
});

test('[261025 acreditació] una casella sense marcar manté viu el document per si sola, sense cap paraula de relleu; marcada, l’acredita', (t) => {
  const doc = '261009_0310_auditoria_claude';
  const acta = `${ACTES}/261009_0745_acta_marmota.md`;
  const text = (casella) => (n) => `# Acta Marmota de la nit del 9 d'octubre\n\n## Resultats\n\n### 3. Part Marmota\n\n- ${casella} Fer el commit de les Onades 5 i 6 amb [[${n}]].\n`;
  let { arrel, head } = historic(t, { doc, acta, text: text('`[ ]`') });
  let c = candidatsConsum(arrel, { dia: '261009', head: head() }).find((x) => x.nom === `${doc}.md`);
  assert.equal(c.classe, 'senseVida');
  assert.equal(c.cita.viu, c.cita.linia);
  ({ arrel, head } = historic(t, { doc, acta, text: text('`[x]`') }));
  c = candidatsConsum(arrel, { dia: '261009', head: head() }).find((x) => x.nom === `${doc}.md`);
  assert.equal(c.classe, 'consumit', 'el control: la mateixa línia amb la casella marcada');
});

test('[261025 rancis] els rancis no són candidats (ja els jutja checkTaula), però compten com a consumits per als altres', (t) => {
  const RANCI = `${VELL}_0900_auditoria_vella`;
  const RP = `${VELL}_0800_prompt_codex_vell`;
  const PLA = `${DIA}_1600_pla_implementacio_nou`;
  const A = `${DIA}_1700_auditoria_codex`;
  const arrel = mas(t, ['# Índex', '', '## Activitat en curs', '', `- [[${PLA}]]`, `- [[${A}]]`, '',
    '## Altres enllaços', '', `- [[${RANCI}]]`, `- [[${RP}]]`]);
  for (const n of [RANCI, RP, PLA]) posa(arrel, n);
  // A és posterior al pla: el seu únic senyal és que el prompt que cita ja és ranci (CONS-D).
  posa(arrel, A, { cita: [RP] });
  assert.deepEqual(noms(ranci(arrel)), [RP, RANCI].sort());
  const c = candidatsConsum(arrel, { head: null });
  assert.deepEqual(noms(c), [A]);
  assert.equal(c[0].motiu, `CONS-D: els prompts que cita ja són a l'arxiu o candidats (${RP})`);
});

test('[261025 acreditació] citesEnActa: el frontmatter i «## Vincles» no compten, i la capçalera viva arrossega les línies de davall', () => {
  const n = '261101_0900_auditoria_codex';
  const text = `---\nrelacionats: [[${n}]]\n---\n# Acta\n\n## Resultats\n\n- Lliurada \`${n}.md\`.\n\n## Pendents\n\n- Revisió final de [[${n}|l'auditoria]].\n\n## Vincles\n- [[${n}]]\n`;
  assert.deepEqual(citesEnActa(text, `${n}.md`), [
    { linia: `- Lliurada \`${n}.md\`.`, viu: null },
    { linia: `- Revisió final de [[${n}|l'auditoria]].`, viu: 'Pendents' },
  ]);
  // Un nom que només comença igual no és una cita, ni un que només acaba igual (MA4).
  assert.deepEqual(citesEnActa(`# Acta\n\n- \`${n}_v2.md\`\n`, `${n}.md`), []);
  assert.deepEqual(citesEnActa(`# Acta\n\n- \`copia_${n}.md\`\n`, `${n}.md`), []);
});

test('[N10C-ARB-01] citesEnActa: un «# …» dins d’una tanca de codi no buida les capçaleres, i una tanca que no es tanca no amaga les de davall', () => {
  const n = '261101_0900_auditoria_codex';
  const linia = `- Que el Mestre rellija \`${n}.md\`.`;
  // Un comentari de shell dins de la tanca no és cap capçalera: «## Pendents» continua manant.
  const tanca = `# Acta\n\n## Pendents\n\n\`\`\`sh\n# comprova la porta\nnode tooling/gates/porta-olivera.mjs\n\`\`\`\n\n${linia}\n`;
  assert.deepEqual(citesEnActa(tanca, `${n}.md`), [{ linia, viu: 'Pendents' }]);
  // Tampoc buida «## Vincles».
  assert.deepEqual(citesEnActa(`# Acta\n\n## Vincles\n\n\`\`\`sh\n# x\n\`\`\`\n\n- [[${n}]]\n`, `${n}.md`), []);
  // Una tanca que no es tanca: la lectura crua del pegat 1705 encara veu «## Pendents».
  const oberta = `# Acta\n\n\`\`\`sh\nnode tooling/gates/porta-olivera.mjs\n\n## Pendents\n\n${linia}\n`;
  assert.deepEqual(citesEnActa(oberta, `${n}.md`), [{ linia, viu: 'Pendents' }]);
  // El control: sense cap paraula viva, la tanca no fa viva la línia.
  assert.deepEqual(citesEnActa(`# Acta\n\n## Resultats\n\n\`\`\`sh\n# comprova la porta\n\`\`\`\n\n- Lliurada \`${n}.md\`.\n`, `${n}.md`), [{ linia: `- Lliurada \`${n}.md\`.`, viu: null }]);
});

/* G1-B-seg-03 · Els comentaris HTML es llevaven amb una regex mandrosa amb retrocés: per cada «<!--»
   sense tancar tornava a recórrer el text fins al final, i el cost creixia amb el quadrat de la mida
   (les actes i els documents de la taula els escriuen altres IAs: són dada). Ara és un recorregut
   lineal, amb la mateixa lectura. */
test('[G1-B-seg-03] citesEnActa: els comentaris HTML es lleven com abans, i un «<!--» sense tancar deixa la cua a la vista', () => {
  const n = '261101_0900_auditoria_codex';
  const linia = `- Lliurada \`${n}.md\`.`;
  // Un comentari tancat amaga la cita, també si ocupa diverses línies.
  assert.deepEqual(citesEnActa(`# Acta\n\n<!-- ${linia} -->\n<!--\n${linia}\n-->\n- Res més.\n`, `${n}.md`), []);
  // Enmig d'una línia, només cau el comentari.
  assert.deepEqual(citesEnActa(`# Acta\n\n- Lliurada<!-- nota --> \`${n}.md\`.\n`, `${n}.md`), [{ linia, viu: null }]);
  // «<!-->» no es tanca a si mateix: el «-->» es busca després de l'obertura sencera.
  assert.deepEqual(citesEnActa(`# Acta\n\n<!-->\n${linia}\n-->\n`, `${n}.md`), []);
  // El primer «-->» tanca, i un «<!--» de dins no obri res.
  assert.deepEqual(citesEnActa(`# Acta\n\n<!-- <!-- -->${linia}\n`, `${n}.md`), [{ linia, viu: null }]);
  // Sense «-->», la cua es queda com està i la cita continua veient-se (lectura prudent: no
  // s'amaga cap línia que podria mantindre viu el document).
  assert.deepEqual(citesEnActa(`# Acta\n\n<!-- tancat -->\n<!-- sense tancar\n## Pendents\n\n${linia}\n`, `${n}.md`), [{ linia, viu: 'Pendents' }]);
});

test('[G1-B-seg-03] els comentaris es lleven en temps lineal: huitanta mil «<!--» sense tancar no pengen el detector', () => {
  const n = '261101_0900_auditoria_codex';
  const linia = `- Lliurada \`${n}.md\`.`;
  const text = `# Acta\n\n${'<!--'.repeat(80000)}\n${linia}\n`;
  const inici = process.hrtime.bigint();
  assert.deepEqual(citesEnActa(text, `${n}.md`), [{ linia, viu: null }]);
  const ms = Number(process.hrtime.bigint() - inici) / 1e6;
  assert.ok(ms < 500, `${Math.round(ms)} ms per a 320 KB d'obertures sense tancar`);
});

/* ARB-F3I3-01 · Els destins d'enllaç, «](…)», es llevaven amb `/\]\([^)\n]*\)/g`: per cada «](» sense
   «)» la regex tornava a recórrer la línia fins al final. COR-F3I3-01 · La capçalera,
   `/^(#{1,6})[ \t]+(.*)$/`, tornava a provar cada tall del blanc quan la línia no acabava bé («#»,
   milers d'espais i un «\r»). Totes dues són ara lineals, amb la mateixa lectura. */
test('[ARB-F3I3-01] citesEnActa: el destí d’un enllaç no fa viva la línia, i un «](» sense «)» deixa la resta a la vista', () => {
  const n = '261101_0900_auditoria_codex';
  // El destí cau sencer fins al primer «)»: la carpeta «pendents/» no és cap paraula sobre el consum.
  const lliurada = `- Lliurada [\`${n}.md\`](file:///Mas/pendents/${n}.md).`;
  assert.deepEqual(citesEnActa(`# Acta\n\n${lliurada}\n`, `${n}.md`), [{ linia: lliurada, viu: null }]);
  // Cada destí acaba en el seu «)»: el que hi ha entre dos enllaços és prosa i compta.
  const dos = `- [a](x/${n}.md) encara per [b](y/z.md).`;
  assert.deepEqual(citesEnActa(`# Acta\n\n${dos}\n`, `${n}.md`), [{ linia: dos, viu: dos }]);
  // Sense «)», el text es queda tal qual i la paraula viva continua veient-se (lectura prudent).
  const oberta = `- Lliurada [\`${n}.md\`](sense tancar, pendent de revisar`;
  assert.deepEqual(citesEnActa(`# Acta\n\n${oberta}\n`, `${n}.md`), [{ linia: oberta, viu: oberta }]);
  // En una capçalera, igual: un destí tancat no la fa viva; sense «)», sí.
  const linia = `- Lliurada \`${n}.md\`.`;
  assert.deepEqual(citesEnActa(`# Acta\n\n## Resultats [doc](relleus/x.md)\n\n${linia}\n`, `${n}.md`), [{ linia, viu: null }]);
  assert.deepEqual(citesEnActa(`# Acta\n\n## Resultats [doc](relleus/x.md\n\n${linia}\n`, `${n}.md`), [{ linia, viu: 'Resultats [doc](relleus/x.md' }]);
});

test('[ARB-F3I3-01] els destins d’enllaç es lleven en temps lineal: quaranta mil «](» sense «)» no pengen el detector, ni en la línia ni en la capçalera', () => {
  const n = '261101_0900_auditoria_codex';
  const obertes = ']('.repeat(40000);
  const linia = `- Lliurada \`${n}.md\`.`;
  let inici = process.hrtime.bigint();
  const enLinia = citesEnActa(`# Acta\n\n${linia} ${obertes}\n`, `${n}.md`);
  let ms = Number(process.hrtime.bigint() - inici) / 1e6;
  assert.equal(enLinia.length, 1);
  assert.equal(enLinia[0].viu, null);
  assert.ok(enLinia[0].linia.startsWith(`${linia} ](`));
  assert.ok(ms < 500, `${Math.round(ms)} ms per a 80 KB de «](» en la línia que el cita`);
  inici = process.hrtime.bigint();
  assert.deepEqual(citesEnActa(`# Acta\n\n## ${obertes}\n\n${linia}\n`, `${n}.md`), [{ linia, viu: null }]);
  ms = Number(process.hrtime.bigint() - inici) / 1e6;
  assert.ok(ms < 500, `${Math.round(ms)} ms per a 80 KB de «](» en la capçalera de damunt`);
});

test('[COR-F3I3-01] citesEnActa: les capçaleres es reconeixen com abans, amb el blanc sencer', () => {
  const n = '261101_0900_auditoria_codex';
  const linia = `- Lliurada \`${n}.md\`.`;
  // Diversos blancs i tabuladors després dels «#»: la capçalera és el text de darrere.
  assert.deepEqual(citesEnActa(`# Acta\n\n## \t  Pendents\n\n${linia}\n`, `${n}.md`), [{ linia, viu: 'Pendents' }]);
  // Set «#», o cap blanc darrere, no fan capçalera.
  assert.deepEqual(citesEnActa(`# Acta\n\n####### Pendents\n\n${linia}\n`, `${n}.md`), [{ linia, viu: null }]);
  assert.deepEqual(citesEnActa(`# Acta\n\n##Pendents\n\n${linia}\n`, `${n}.md`), [{ linia, viu: null }]);
  // Una capçalera només de blancs també obri secció: tanca la «## Pendents» de damunt.
  assert.deepEqual(citesEnActa(`# Acta\n\n## Pendents\n\n## \t \n\n${linia}\n`, `${n}.md`), [{ linia, viu: null }]);
});

test('[COR-F3I3-01] les capçaleres es lligen en temps lineal: «#», quaranta mil blancs i un «\\r» no pengen el detector', () => {
  const n = '261101_0900_auditoria_codex';
  const linia = `- Lliurada \`${n}.md\`.`;
  const text = `# Acta\n\n#${' \t'.repeat(20000)}\r\n\n${linia}\n`;
  const inici = process.hrtime.bigint();
  assert.deepEqual(citesEnActa(text, `${n}.md`), [{ linia, viu: null }]);
  const ms = Number(process.hrtime.bigint() - inici) / 1e6;
  assert.ok(ms < 500, `${Math.round(ms)} ms per a una capçalera de 40.000 blancs acabada en «\\r»`);
});

test('[N10C-ARB-01] un «# …» de codi a l’acta no fabrica cap consum acreditat', (t) => {
  const PLA = `${DIA}_1600_pla_implementacio_nou`;
  const A = `${DIA}_0900_auditoria_codex`;
  const ACTA = `${ACTES}/${DIA}_1200_acta_marmota_tancament.md`;
  const arrel = mas(t);
  afig(arrel, [PLA, A].map((n) => `- [[${n}]]`));
  posa(arrel, PLA);
  posa(arrel, A);
  const cand = () => candidatsConsum(arrel, { head: headDe(arrel, [rel(A), ACTA]) }).find((c) => c.nom === `${A}.md`);
  const codi = '```sh\n# comprova la porta\nnode tooling/gates/porta-olivera.mjs\n```\n';
  escriu(arrel, ACTA, `# Acta\n\n## Pendents\n\n${codi}\n- Que el Mestre rellija \`${A}.md\`.\n`);
  assert.equal(cand().classe, 'senseVida');
  assert.equal(cand().provaDeConsum, null);
  assert.equal(cand().cita.viu, 'Pendents');
  // El control: la mateixa tanca en «## Resultats», amb el document lliurat, sí que l'acredita.
  escriu(arrel, ACTA, `# Acta\n\n## Resultats\n\n${codi}\n- Lliurada \`${A}.md\`.\n`);
  assert.equal(cand().classe, 'consumit');
});

test('[261025 acreditació] una àncora només a «Vincles» no és cap paraula sobre el consum, i l’última acta que el cita té l’última paraula', (t) => {
  const PLA = `${DIA}_1600_pla_implementacio_nou`;
  const A = `${DIA}_0900_auditoria_codex`;
  const A1 = `${ACTES}/${DIA}_1200_acta_marmota_lliurament`;
  const A2 = `${ACTES}/${DIA}_1300_acta_marmota_relleu`;
  const arrel = mas(t);
  afig(arrel, [PLA, A].map((n) => `- [[${n}]]`));
  posa(arrel, PLA);
  posa(arrel, A);
  const hi = (r) => fs.existsSync(path.join(arrel, r));
  const cand = () => candidatsConsum(arrel, { head: headDe(arrel, [rel(A), `${A1}.md`, `${A2}.md`].filter(hi)) }).find((c) => c.nom === `${A}.md`);

  escriu(arrel, `${A1}.md`, `---\nrelacionats: [[${A}]]\n---\n# Acta\n\n## Resultats\n\n- Res de Codex.\n\n## Vincles\n- [[${A}]]\n`);
  assert.equal(cand().classe, 'senseVida');
  assert.equal(cand().cita, null, 'ni el frontmatter ni «Vincles» no compten');
  assert.doesNotMatch(cand().motiu, /el cita/);

  escriu(arrel, `${A1}.md`, `# Acta\n\n## Resultats\n\n- Lliurada \`${A}.md\`.\n`);
  escriu(arrel, `${A2}.md`, `# Acta\n\n## Pendents\n\n- Que el Mestre rellija \`${A}.md\`.\n`);
  assert.equal(cand().classe, 'senseVida', 'la més nova la torna a obrir');
  assert.equal(cand().cita.acta, `${A2}.md`);

  escriu(arrel, `${A1}.md`, `# Acta\n\n## Pendents\n\n- Que el Mestre rellija \`${A}.md\`.\n`);
  escriu(arrel, `${A2}.md`, `# Acta\n\n## Resultats\n\n- El Mestre ja ha llegit \`${A}.md\`.\n`);
  assert.equal(cand().classe, 'consumit', 'la més nova la dona per llegida');
  assert.equal(cand().consumidor, `${A2}.md`);
});

test('[261025 acreditació] una acta que manté viu un germà d’onada (el mateix aammdd_hhmm, o el prompt d’una auditoria) no acredita la resta', (t) => {
  // 261013_1420: l'acta de convocatòria nomena el pla com a «vigent» i els prompts al costat.
  const PLA = '261013_1405_pla_implementacio_gestoria_jarvis';
  const P = '261013_1405_prompt_claude_gestoria_jarvis';
  const NOU = '261013_2359_pla_implementacio_onada_nova';
  const ACTA = `${ACTES}/261013_1420_acta_marmota.md`;
  let arrel = mas(t);
  afig(arrel, [PLA, P, NOU].map((n) => `- [[${n}]]`));
  for (const n of [PLA, P, NOU]) posa(arrel, n);
  escriu(arrel, ACTA, `# ACTA MARMOTA - Tancament de Jornada Matinal\n\n## 3. L'Escriptori Queda Net (Porta Olivera en 0)\n- **Pla Vigent:** \`${DESK}/${PLA}.md\` (aprovat).\n- **Prompt per a Claude:** \`${DESK}/${P}.md\` (encàrrec d'enginyeria i codi).\n`);
  let c = candidatsConsum(arrel, { dia: '261013', head: headDe(arrel, [rel(PLA), rel(P), ACTA]) });
  assert.deepEqual(classes(c), { [PLA]: 'senseVida', [P]: 'senseVida' });
  assert.match(c.find((x) => x.nom === `${P}.md`).motiu, new RegExp(`el cita, però manté viu ${PLA}, de la mateixa onada: «- \\*\\*Pla Vigent:\\*\\*`));

  // Una auditoria lliurada, amb el seu prompt encara per entregar a «## Pendents».
  const PA = `${DIA}_0900_prompt_codex_revisio`;
  const A = `${DIA}_0930_auditoria_codex`;
  const PLA2 = `${DIA}_1600_pla_implementacio_nou`;
  const ACTA2 = `${ACTES}/${DIA}_1200_acta_marmota.md`;
  arrel = mas(t);
  afig(arrel, [PA, A, PLA2].map((n) => `- [[${n}]]`));
  posa(arrel, PA);
  posa(arrel, A, { cita: [PA] });
  posa(arrel, PLA2);
  escriu(arrel, ACTA2, `# Acta\n\n## Resultats\n\n- Lliurada \`${A}.md\`.\n\n## Pendents\n\n- Entregar \`${PA}.md\` a Gemini.\n`);
  c = candidatsConsum(arrel, { head: headDe(arrel, [rel(A), rel(PA), ACTA2]) });
  assert.equal(c.find((x) => x.nom === `${A}.md`).classe, 'senseVida');
  assert.match(c.find((x) => x.nom === `${A}.md`).motiu, new RegExp(`manté viu ${PA}, de la mateixa onada`));
  // Sense el pendent del prompt, l'auditoria sí que queda acreditada.
  escriu(arrel, ACTA2, `# Acta\n\n## Resultats\n\n- Lliurada \`${A}.md\`.\n`);
  c = candidatsConsum(arrel, { head: headDe(arrel, [rel(A), rel(PA), ACTA2]) });
  assert.equal(c.find((x) => x.nom === `${A}.md`).classe, 'consumit');
});

test('[261025 acreditació] l’acta ha de ser posterior, no de la mateixa hora; i el germà d’onada és de la mateixa hora, no del mateix dia', (t) => {
  const PLA = `${DIA}_1600_pla_implementacio_nou`;
  const A = `${DIA}_0900_auditoria_codex`;
  const arrel = mas(t);
  afig(arrel, [PLA, A].map((n) => `- [[${n}]]`));
  posa(arrel, PLA);
  posa(arrel, A);
  const cand = (acta) => candidatsConsum(arrel, { head: headDe(arrel, [rel(A), acta]) }).find((c) => c.nom === `${A}.md`);

  // Una acta amb el mateix aammdd_hhmm que el document no l'ha pogut destil·lar (MA17).
  const MATEIXA = `${ACTES}/${DIA}_0900_acta_marmota_mateixa_hora.md`;
  escriu(arrel, MATEIXA, `# Acta\n\n## Resultats\n\n- Lliurada \`${A}.md\`.\n`);
  assert.equal(cand(MATEIXA).classe, 'senseVida');
  assert.equal(cand(MATEIXA).cita, null);
  fs.rmSync(path.join(arrel, MATEIXA));

  // Un document del mateix dia però d'una altra hora, que l'acta manté viu, no és germà d'onada (MA12).
  const ACTA = `${ACTES}/${DIA}_1200_acta_marmota.md`;
  const pendent = (altre) => escriu(arrel, ACTA, `# Acta\n\n## Resultats\n\n- Lliurada \`${A}.md\`.\n\n## Pendents\n\n- Revisar \`${altre}.md\`.\n`);
  pendent(`${DIA}_1000_informe_altra_feina`);
  assert.equal(cand(ACTA).classe, 'consumit');
  // El control: amb la mateixa hora que el document, sí que el reté.
  pendent(`${DIA}_0900_informe_altra_feina`);
  assert.equal(cand(ACTA).classe, 'senseVida');
  assert.match(cand(ACTA).motiu, new RegExp(`manté viu ${DIA}_0900_informe_altra_feina, de la mateixa onada`));
});

test('[261025 acreditació] amb git, la versió acreditada és la que hi havia quan l’acta es va consolidar, no la de HEAD', (t) => {
  if (!hiHaGit()) return t.skip('sense git: la versió de l’acta necessita la història');
  const PLA = `${DIA}_1600_pla_implementacio_nou`;
  const A = `${DIA}_0900_auditoria_codex`;
  const ACTA = `${ACTES}/${DIA}_1200_acta_marmota_tancament.md`;
  const arrel = mas(t);
  afig(arrel, [PLA, A].map((n) => `- [[${n}]]`));
  posa(arrel, PLA);
  posa(arrel, A, { text: 'Esborrany: falta la secció 3.' });
  escriu(arrel, ACTA, `# Acta\n\n## Resultats\n\n- Lliurada \`${A}.md\`.\n`);
  assert.equal(git(arrel, ['init', '-q']).status, 0);
  const commit = (missatge) => {
    assert.equal(git(arrel, ['add', '-A']).status, 0);
    assert.equal(git(arrel, ['commit', '-qm', missatge]).status, 0);
    return git(arrel, ['rev-parse', '--short', 'HEAD']).stdout.trim();
  };
  const ambActa = commit('acta');
  const cand = () => candidatsConsum(arrel).find((c) => c.nom === `${A}.md`);
  assert.equal(cand().classe, 'consumit');
  assert.equal(cand().provaDeConsum.commit, ambActa);

  // L'auditoria s'acaba després de l'acta, i es consolida: HEAD no basta.
  fs.appendFileSync(path.join(arrel, rel(A)), '## 3. Secció nova escrita després de l’acta\n');
  const despres = commit('auditoria acabada');
  assert.equal(cand().classe, 'senseVida');
  assert.match(cand().motiu, new RegExp(`el document ha canviat des que l’acta es va consolidar a ${ambActa}`));

  // Una acta nova (o l'acta tornada a consolidar) sobre la versió nova la torna a acreditar.
  fs.appendFileSync(path.join(arrel, ACTA), `- Revisada la secció 3 de \`${A}.md\`.\n`);
  const reconsolidat = commit('acta revisada');
  assert.notEqual(reconsolidat, despres);
  assert.equal(cand().classe, 'consumit');
  assert.equal(cand().provaDeConsum.commit, reconsolidat);
  assert.equal(cand().provaDeConsum.head, reconsolidat);

  // Un document que encara no era al commit de l'acta tampoc queda acreditat.
  const B = `${DIA}_0905_auditoria_gemini`;
  fs.appendFileSync(path.join(arrel, ACTA), `- Lliurada \`${B}.md\`.\n`);
  commit('acta amb Gemini');
  posa(arrel, B);
  afig(arrel, [`- [[${B}]]`]);
  commit('Gemini arriba després');
  const b = candidatsConsum(arrel).find((c) => c.nom === `${B}.md`);
  assert.equal(b.classe, 'senseVida');
  assert.match(b.motiu, /el document encara no era consolidat quan es va consolidar l’acta/);
});

/* ── Fronteres ─────────────────────────────────────────────────────────────── */

test('[261025 fronteres] 01_produccio/ i 02_investigacio_ia/ mai són candidats, encara que una acta els cite', (t) => {
  const PLA = `${DIA}_1600_pla_implementacio_nou`;
  const P = `${DIA}_0900_auditoria_produccio`;
  const I = `${DIA}_0905_auditoria_investigacio`;
  const ACTA = `${DIA}_1200_acta_marmota_tancament`;
  const arrel = mas(t);
  afig(arrel, [`- [[${PLA}]]`, `- [[01_produccio/${P}]]`, `- [[02_investigacio_ia/${I}]]`]);
  posa(arrel, PLA);
  escriu(arrel, `${DESK}/01_produccio/${P}.md`, '# producció\n');
  escriu(arrel, `${DESK}/02_investigacio_ia/${I}.md`, '# investigació\n');
  escriu(arrel, `${ACTES}/${ACTA}.md`, `# Acta\n\n\`${P}.md\` i \`${I}.md\`\n`);
  const head = headDe(arrel, [`${DESK}/01_produccio/${P}.md`, `${DESK}/02_investigacio_ia/${I}.md`, `${ACTES}/${ACTA}.md`]);
  assert.deepEqual(candidatsConsum(arrel, { head }), []);
});

test('[261025 git] capDeGit torna null fora d’un repositori, i dins només llig el primer nivell de la taula i les actes', (t) => {
  const arrel = mas(t);
  assert.equal(capDeGit(arrel), null);
  if (!hiHaGit()) return t.skip('sense git');
  escriu(arrel, `${DESK}/${DIA}_0900_auditoria_codex.md`, '# a\n');
  escriu(arrel, `${DESK}/01_produccio/${DIA}_0901_auditoria_fons.md`, '# b\n');
  escriu(arrel, `${ACTES}/${DIA}_1200_acta_marmota_x.md`, '# c\n');
  assert.equal(git(arrel, ['init', '-q']).status, 0);
  assert.equal(git(arrel, ['add', '-A']).status, 0);
  assert.equal(git(arrel, ['commit', '-qm', 'x']).status, 0);
  const head = capDeGit(arrel);
  assert.match(head.commit, /^[0-9a-f]{4,}$/);
  assert.deepEqual([...head.blobs.keys()].sort(), [`${ACTES}/${DIA}_1200_acta_marmota_x.md`, `${DESK}/00_index_escriptori.md`, `${DESK}/${DIA}_0900_auditoria_codex.md`].sort());
  assert.equal(head.blobs.get(`${DESK}/${DIA}_0900_auditoria_codex.md`), blob(path.join(arrel, DESK, `${DIA}_0900_auditoria_codex.md`)));
  // Una subcarpeta del repositori no és l'arrel: no s'hi llig cap HEAD.
  assert.equal(capDeGit(path.join(arrel, DESK)), null);
  // Un GIT_DIR del cridador (un hook, un índex temporal) no desvia la lectura.
  const altre = mas(t);
  assert.equal(git(altre, ['init', '-q']).status, 0);
  const abans = process.env.GIT_DIR;
  process.env.GIT_DIR = path.join(altre, '.git');
  try { assert.equal(capDeGit(arrel)?.commit, head.commit); }
  finally { if (abans === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = abans; }
});

/* ── CLI · Fase «avis», només lectura ──────────────────────────────────────── */

/** Una auditoria amb consum acreditat (A) i una de triatge (B), superades pel pla. */
function onadaAcreditada(t) {
  const PLA = `${DIA}_1600_pla_implementacio_nou`;
  const A = `${DIA}_0900_auditoria_codex`;
  const B = `${DIA}_0905_auditoria_claude`;
  const ACTA = `${DIA}_1200_acta_marmota_tancament`;
  const arrel = mas(t);
  const tA = torn(arrel, { file: rel(A) });
  const tB = torn(arrel, { file: rel(B) });
  const tPla = torn(arrel, { file: rel(PLA) });
  afig(arrel, [PLA, A, B].map((n) => `- [[${n}]]`));
  posa(arrel, PLA, { reflex: tPla });
  posa(arrel, A, { reflex: tA });
  posa(arrel, B, { reflex: tB });
  escriu(arrel, `${ACTES}/${ACTA}.md`, `# Acta\n\nLliurada \`${A}.md\`.\n`);
  return { arrel, A, B, PLA, ACTA, head: headDe(arrel, [rel(A), rel(B), `${ACTES}/${ACTA}.md`]) };
}

test('[B10 CLI] l’informe ix amb 0 amb candidats, també amb la convocatòria en «bloqueig», i no toca cap fitxer', (t) => {
  const { arrel, A, B, ACTA, head } = onadaAcreditada(t);
  const abans = empremta(arrel);
  let c = captura();
  assert.equal(main([], { arrel, sortida: c.sortida, head }), 0, c.err.join('\n'));
  const text = c.out.join('\n');
  assert.match(text, /2 candidat\(s\) de consum pel cicle de vida \(1 amb consum acreditat, 1 de triatge\) · HEAD abc1234 · fase «avis»/);
  assert.match(text, new RegExp(`${A}\\.md \\(declarat sense motiu explícit\\) ← consum acreditat per ${ACTES}/${ACTA}\\.md`));
  assert.match(text, new RegExp(`«Lliurada \`${A}\\.md\`\\.»`));
  assert.match(text, new RegExp(`${B}\\.md \\(declarat sense motiu explícit\\) ← sense vida acreditada \\(triatge\\): CONS-C`));
  assert.match(text, /porta-olivera\.mjs --arxiva --sec --nom FITXER \[--torn ID\]/);
  assert.doesNotMatch(text, /--consumits/);

  // El detector no té fase pròpia: la bandera de la convocatòria no li canvia l'eixida.
  fase(arrel, 'bloqueig');
  const ambBandera = empremta(arrel);
  c = captura();
  assert.equal(main(['--json'], { arrel, sortida: c.sortida, head }), 0);
  const j = JSON.parse(c.out.join('\n'));
  assert.equal(j.esquema, ESQUEMA);
  assert.equal(j.fase, 'avis');
  assert.equal(j.head, 'abc1234');
  assert.deepEqual([j.total, j.consumits, j.senseVida], [2, 1, 1]);
  assert.deepEqual(j.candidats.map((x) => [x.document, x.classe]), [[`${A}.md`, 'consumit'], [`${B}.md`, 'senseVida']]);
  assert.equal(j.candidats[0].ordre, `node tooling/gates/porta-olivera.mjs --arxiva --sec --nom ${A}.md`);
  assert.equal(j.candidats[0].provaDeConsum.cita, `Lliurada \`${A}.md\`.`);
  assert.equal(empremta(arrel), ambBandera, 'cap lectura no escriu');
  assert.notEqual(abans, ambBandera);

  // Sense git, ho diu: només triatge, mai un consum acreditat inventat.
  c = captura();
  assert.equal(main([], { arrel, sortida: c.sortida, head: null }), 0);
  assert.match(c.out.join('\n'), /0 amb consum acreditat, 2 de triatge\) · sense git a l’arrel: cap consum es pot acreditar/);
});

test('[B10 CLI] cap bandera d’escriptura: --arxiva, --consumits, --nom o qualsevol altra ixen amb 2 sense moure res; una taula sense estructura no dona verd', (t) => {
  const { arrel, head } = onadaAcreditada(t);
  const abans = empremta(arrel);
  for (const args of [['--arxiva'], ['--arxiva', '--consumits'], ['--consumits'], ['--nom', `${DIA}_0900_auditoria_codex.md`], ['--sec'], ['--informe']]) {
    const c = captura();
    assert.equal(main(args, { arrel, sortida: c.sortida, head }), 2, args.join(' '));
    assert.match(c.err.join('\n'), /Argument desconegut/, args.join(' '));
    assert.deepEqual(c.out, [], args.join(' '));
  }
  assert.equal(empremta(arrel), abans);

  const buida = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-consum-buida-')));
  t.after(() => fs.rmSync(buida, { recursive: true, force: true }));
  const c = captura();
  assert.equal(main([], { arrel: buida, sortida: c.sortida, head: null }), 2);
  assert.match(c.err.join('\n'), /Estructura de l'Escriptori absent: .*: cap comprovació feta\./);
});

test('[B10 CLI] el procés de veres, dins d’un repositori: llista el consum acreditat amb el commit real, ix amb 0 i no toca ni la taula ni .git', (t) => {
  if (!hiHaGit()) return t.skip('sense git: el consum acreditat necessita HEAD');
  const { arrel, A } = onadaAcreditada(t);
  assert.equal(git(arrel, ['init', '-q']).status, 0);
  assert.equal(git(arrel, ['add', '-A']).status, 0);
  assert.equal(git(arrel, ['commit', '-qm', 'onada']).status, 0);
  const commit = git(arrel, ['rev-parse', '--short', 'HEAD']).stdout.trim();
  const abans = empremta(arrel, { ambGit: true });

  const r = cli(arrel);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, new RegExp(`· HEAD ${commit} ·`));
  assert.match(r.stdout, new RegExp(`${A}\\.md \\(declarat sense motiu explícit\\) ← consum acreditat per ${ACTES}/.*a ${commit}\\)`));
  const j = cli(arrel, ['--json']);
  assert.equal(j.status, 0, j.stderr);
  assert.equal(JSON.parse(j.stdout).consumits, 1);
  assert.equal(empremta(arrel, { ambGit: true }), abans, 'ni la taula ni el repositori canvien');

  const mal = cli(arrel, ['--arxiva']);
  assert.equal(mal.status, 2);
  assert.match(mal.stderr, /Argument desconegut: --arxiva/);
});

/* ── El codi · Només lectura i les mateixes formes que la porta ────────────── */

test('[B10 codi] el detector no escriu ni executa res fora de tres lectures de git, i les seues formes són les de la porta', () => {
  const font = fs.readFileSync(MODUL, 'utf8');
  // Cap API d'escriptura del disc.
  assert.doesNotMatch(font, /\b(?:writeFile|appendFile|rename|unlink|rm|rmdir|mkdir|copyFile|cp|symlink|link|truncate|chmod|chown|utimes|open|createWriteStream|mkdtemp)(?:Sync)?\s*\(/);
  // De child_process només spawnSync, i de git només rev-parse, ls-tree i log.
  assert.deepEqual([...font.matchAll(/import\s*\{([^}]*)\}\s*from\s*'node:child_process'/g)].map((m) => m[1].trim()), ['spawnSync']);
  assert.deepEqual([...new Set([...font.matchAll(/\bgit\(\['([a-z-]+)'/g)].map((m) => m[1]))].sort(), ['log', 'ls-tree', 'rev-parse']);
  assert.match(font, /GIT_OPTIONAL_LOCKS: '0'/);
  // NOM, COMPOSTES i ANCORA són literalment les de la porta: si la porta canvia, la prova ho diu.
  const porta = fs.readFileSync(PORTA, 'utf8');
  for (const [nom, re] of Object.entries(FORMES)) {
    const m = new RegExp(`^const ${nom} = (/.+/[a-z]*);$`, 'm').exec(porta);
    assert.ok(m, `${nom} no és a porta-olivera.mjs`);
    assert.equal(m[1], String(re), `${nom} ha divergit de la porta`);
  }
});
